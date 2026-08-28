'use strict';

// TRAZER WARRANTY SERVICE
//
// One job: given a brand and a serial number, report the manufacturer's ACTUAL
// warranty registration — registered vs base, active or not, and the real term end
// date. Not the "likely warranty" estimate you get from decoding a build date.
//
// Why this is its own Railway service and not part of Mike:
//   Playwright cannot run under Nixpacks. Railway's documented path is a Dockerfile
//   on the official Playwright image with >=1GB of memory. Mike builds on Nixpacks.
//   Converting Mike's build and adding a gigabyte of memory pressure to a live,
//   paid product — for a side feature — is the kind of change that takes prod down.
//   So the browser lives here instead. If this service OOMs, crashes, or is deleted,
//   Mike is byte-for-byte unaffected and simply says he couldn't reach the registry.
//
// Cost shape: idles as a small Node process and only spins a browser up for the few
// seconds a lookup takes, then shuts it down again after IDLE_SHUTDOWN_MS. Railway
// bills per second on actual use, so idle cost stays near zero.

const express = require('express');
const { chromium } = require('playwright');
const brands = require('./brands');
const { agentLookup } = require('./brands/agent');

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.WARRANTY_SERVICE_TOKEN || '';
const LOOKUP_TIMEOUT_MS = Number(process.env.LOOKUP_TIMEOUT_MS || 45000);
const IDLE_SHUTDOWN_MS = Number(process.env.IDLE_SHUTDOWN_MS || 120000);
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 24 * 60 * 60 * 1000);
const MAX_QUEUE = Number(process.env.MAX_QUEUE || 20);
const RATE_PER_MIN = Number(process.env.RATE_PER_MIN || 30);
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
// The agent drives a real form and asks a model twice — give it more room than the
// direct-API path, which answers in about three seconds.
const AGENT_TIMEOUT_MS = Number(process.env.AGENT_TIMEOUT_MS || 120000);

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
           '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// ── BROWSER LIFECYCLE ────────────────────────────────────────────────────────
// A single browser + page, launched on demand and reused. Serialised through a
// queue: a lookup is a couple of seconds and the cache absorbs repeats, so one at
// a time keeps memory flat and predictable rather than fast and spiky.
let browser = null;
let page = null;
let idleTimer = null;
let busy = false;
const waiters = [];

async function ensureBrowser() {
  if (browser && page && !page.isClosed()) return page;
  if (browser) { try { await browser.close(); } catch (_) {} }
  browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ userAgent: UA });
  page = await ctx.newPage();
  // Images/fonts/styles are pure waste here — we only ever read JSON.
  await page.route('**/*', route => {
    const t = route.request().resourceType();
    if (t === 'image' || t === 'font' || t === 'media' || t === 'stylesheet') return route.abort();
    route.continue();
  });
  return page;
}

async function shutdownBrowser() {
  idleTimer = null;
  if (busy) return scheduleIdleShutdown();
  const b = browser;
  browser = null; page = null;
  if (b) { try { await b.close(); } catch (_) {} console.log('[browser] idle — shut down'); }
}

function scheduleIdleShutdown() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(shutdownBrowser, IDLE_SHUTDOWN_MS);
  if (idleTimer.unref) idleTimer.unref();
}

// Simple FIFO mutex so concurrent requests don't fight over the shared page.
function acquire() {
  if (!busy) { busy = true; return Promise.resolve(); }
  if (waiters.length >= MAX_QUEUE) return Promise.reject(Object.assign(new Error('busy'), { code: 'BUSY' }));
  return new Promise(res => waiters.push(res));
}
function release() {
  const next = waiters.shift();
  if (next) return next();
  busy = false;
  scheduleIdleShutdown();
}

// ── CACHE ────────────────────────────────────────────────────────────────────
// Registration status changes at most once in a unit's life, so a day is
// conservative. The cache is also what keeps us from hammering a manufacturer.
const cache = new Map();
const cacheKey = (brandId, serial) => `${brandId}:${String(serial).toUpperCase()}`;

function cacheGet(k) {
  const hit = cache.get(k);
  if (!hit) return null;
  if (Date.now() > hit.expires) { cache.delete(k); return null; }
  return hit.value;
}
function cacheSet(k, value) {
  cache.set(k, { value, expires: Date.now() + CACHE_TTL_MS });
  if (cache.size > 5000) cache.delete(cache.keys().next().value);
}

// ── RATE LIMIT ───────────────────────────────────────────────────────────────
let windowStart = Date.now();
let windowCount = 0;
function rateOk() {
  const now = Date.now();
  if (now - windowStart > 60000) { windowStart = now; windowCount = 0; }
  return ++windowCount <= RATE_PER_MIN;
}

// ── SERIAL VALIDATION ────────────────────────────────────────────────────────
// Serials are alphanumeric with the occasional dash. Anything else is either a
// typo or someone poking at us, and neither should reach a manufacturer's site.
const SERIAL_RE = /^[A-Za-z0-9][A-Za-z0-9-]{3,29}$/;

// ── APP ──────────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '8kb' }));
app.disable('x-powered-by');

app.get('/health', (req, res) => {
  res.json({ ok: true, browser: !!browser, queued: waiters.length, cached: cache.size, uptime: Math.round(process.uptime()) });
});

app.get('/brands', (req, res) => res.json({ brands: brands.catalogue() }));

// What does THIS manufacturer need before we can look anything up?
//
// Every brand's form wants a different set of fields, so Mike asks the tech for
// exactly that brand's fields rather than demanding the same set from everyone.
// Trane needs the serial alone; Goodman will not submit without the model; Carrier
// wants to know if the homeowner is the original purchaser. Lennox returns an empty
// list with canCheck:false — no amount of information gets a Lennox answer, and Mike
// should say that instead of collecting inputs he can't use.
app.get('/requirements', (req, res) => {
  const r = brands.requirements(req.query.brand || '');
  if (!r) return res.json({ ok: true, known: false, ask: 'brand' });
  res.json(Object.assign({ ok: true, known: true }, r));
});

app.post('/lookup', async (req, res) => {
  // Only Mike calls this. It rides Railway's private network, but the shared token
  // means an accidental public exposure isn't an open proxy into manufacturer sites.
  if (TOKEN && req.get('x-warranty-token') !== TOKEN) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const brandName = (req.body && req.body.brand) || '';
  const serial = String((req.body && req.body.serial) || '').trim();

  if (!SERIAL_RE.test(serial)) {
    return res.status(400).json({ ok: false, error: 'invalid_serial' });
  }

  const brand = brands.resolve(brandName);
  if (!brand) {
    return res.json({ ok: true, supported: false, reason: 'unknown_brand', brand: brandName || null });
  }
  // A brand with a PUBLIC lookup page but no hand-written module used to dead-end at
  // "not wired yet". We have a real browser — point it at the manufacturer's own form
  // and read the answer. Only brands with genuinely no public registry (Lennox: dealer
  // login) still refuse, because no amount of browsing gets past a login wall.
  if (!brand.supported && brand.publicRegistry && brand.where && ANTHROPIC_KEY) {
    if (!rateOk()) return res.status(429).json({ ok: false, error: 'rate_limited' });
    let acquiredA = false;
    try {
      await acquire(); acquiredA = true;
      const p = await ensureBrowser();
      const out = await Promise.race([
        agentLookup(p, brand, serial, req.body && req.body.extra),
        new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), AGENT_TIMEOUT_MS)),
      ]);
      const payload = Object.assign({ brand: brand.id, brandLabel: brand.label, serial }, out);
      if (out.found) cacheSet(cacheKey(brand.id, serial), payload);
      console.log(`[lookup] ${brand.id} ${serial} via=agent found=${!!out.found} registered=${out.registered}`);
      return res.json(Object.assign({ ok: true, supported: true, cached: false }, payload));
    } catch (err) {
      console.error(`[lookup] ${brand.id} ${serial} AGENT FAILED: ${err.message}`);
      // Fall through to the honest "here is where to look yourself" answer rather
      // than inventing a warranty.
    } finally { if (acquiredA) release(); }
  }

  if (!brand.supported) {
    // Honest, specific answer — "no public registry" and "not wired yet" are
    // different things and Mike says which one it is.
    return res.json({
      ok: true,
      supported: false,
      reason: brand.publicRegistry ? 'not_wired_yet' : 'no_public_registry',
      brand: brand.id,
      brandLabel: brand.label,
      where: brand.where || null,
      note: brand.note || null,
    });
  }

  const key = cacheKey(brand.id, serial);
  const cached = cacheGet(key);
  if (cached) return res.json(Object.assign({ ok: true, supported: true, cached: true }, cached));

  if (!rateOk()) return res.status(429).json({ ok: false, error: 'rate_limited' });

  let acquired = false;
  try {
    await acquire();
    acquired = true;

    const p = await ensureBrowser();
    const result = await Promise.race([
      brand.lookup(p, serial),
      new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), LOOKUP_TIMEOUT_MS)),
    ]);

    const payload = Object.assign({ brand: brand.id, brandLabel: brand.label, serial }, result);
    if (result.found) cacheSet(key, payload);

    // Log the outcome only. The upstream payload contains the homeowner's install
    // address; it must not reach the logs any more than it reaches the phone.
    console.log(`[lookup] ${brand.id} ${serial} found=${!!result.found} registered=${result.registered}`);
    return res.json(Object.assign({ ok: true, supported: true, cached: false }, payload));
  } catch (err) {
    const code = err.code === 'TIMEOUT' ? 'timeout' : err.code === 'BUSY' ? 'busy' : 'lookup_failed';
    console.error(`[lookup] ${brand.id} ${serial} FAILED: ${code} ${err.message}`);
    // Fail soft and say so plainly. Mike turns this into "couldn't reach the
    // registry" rather than inventing a warranty.
    return res.status(code === 'busy' ? 503 : 502).json({ ok: false, error: code, brand: brand.id });
  } finally {
    if (acquired) release();
  }
});

const server = app.listen(PORT, '0.0.0.0', () => console.log(`warranty-service listening on ${PORT}`));

function bye(sig) {
  return async () => {
    console.log(`[${sig}] shutting down`);
    server.close();
    if (browser) { try { await browser.close(); } catch (_) {} }
    process.exit(0);
  };
}
process.on('SIGTERM', bye('SIGTERM'));
process.on('SIGINT', bye('SIGINT'));
