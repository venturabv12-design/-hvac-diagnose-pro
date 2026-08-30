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
const { spawn } = require('child_process');
const brands = require('./brands');
const { agentLookup } = require('./brands/agent');

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.WARRANTY_SERVICE_TOKEN || '';
const LOOKUP_TIMEOUT_MS = Number(process.env.LOOKUP_TIMEOUT_MS || 45000);
const IDLE_SHUTDOWN_MS = Number(process.env.IDLE_SHUTDOWN_MS || 120000);
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 24 * 60 * 60 * 1000);
// A lookup takes 40-90 seconds and the phone holds one connection open the whole time.
// On a roof or in a mechanical room that connection dies — screen locks, app
// backgrounds, cell hands off — and the tech is told "couldn't reach the registry"
// about an answer the server already has. Brandon hit exactly this on his own Trane:
// the service logged found=false and his phone showed a failure.
// So EVERY completed lookup is remembered briefly, not just the successful ones. A
// retry after a dropped connection returns instantly from here instead of driving a
// browser again — and instead of losing the answer.
const RETRY_TTL_MS = Number(process.env.RETRY_TTL_MS || 15 * 60 * 1000);
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
// The browser now runs as its own process so it is not started in automation mode.
let _proc = null;
const CDP_PORT = Number(process.env.CDP_PORT || 9222);
const CDP_PROFILE = process.env.CDP_PROFILE || '/tmp/mp-chrome-profile';
const CDP_HEADED_NOTE = process.env.CDP_HEADED ? 'headed on a real display' : 'headless';
let idleTimer = null;
let busy = false;
const waiters = [];

// Promise.race does NOT cancel the loser. A timed-out lookup keeps driving the one
// shared page below, and the extraction step reads whatever that page happens to be
// showing — so an abandoned lookup can read the NEXT tech's result page and return it
// under the FIRST tech's serial, which then gets cached for 24 hours as a confident
// "covered" / "not covered" on a unit it never saw. Releasing the queue while that is
// still running is what makes it possible. Throwing the browser away is the only way
// to actually stop it: the orphan's next page call throws "Target closed" and dies.
async function discardBrowser(why) {
  const b = browser;
  browser = null; page = null; pool.length = 0;
  if (b) { try { await b.close(); } catch (_) {} }
  // We started the process ourselves, so we have to stop it ourselves — closing the
  // CDP connection alone leaves the browser running and the port held.
  if (_proc) { try { _proc.kill('SIGKILL'); } catch (_) {} _proc = null; }
  console.warn(`[browser] discarded after ${why} — a stale automation cannot be allowed to keep driving the shared page`);
}

async function ensureBrowser() {
  // Healthy when the browser is up and every slot still has a live tab.
  if (browser && pool.length === POOL_SIZE && pool.every(s => s.page && !s.page.isClosed())) return pool;
  if (browser) { try { await browser.close(); } catch (_) {} }
  // Present as an ordinary desktop Chrome. Not a disguise — the default automated
  // user agent literally says "HeadlessChrome", and some manufacturer sites refuse
  // it outright: Mitsubishi's warranty page returns 403 to the default and 200 to a
  // normal user agent and window size, same URL, same second. Nothing here
  // misrepresents anything; it is the browser configuration a person would have.
  // START THE BROWSER AS AN ORDINARY PROCESS, THEN ATTACH.
  // chromium.launch() starts the browser in automation mode — navigator.webdriver is
  // true and the automation switches are set — and invisible reCAPTCHA refuses it.
  // Carrier's lookup runs grecaptcha.execute() on submit and only searches inside the
  // callback, so a refused token meant the form NEVER RAN and we reported "no
  // registration found" on units nobody had looked up. Verified 2026-08-29 on the
  // identical page: launched -> webdriver true, token 0 chars, page unchanged.
  // Attached to a normally-started browser -> webdriver false, token 1337 chars, a
  // real warranty record. Nothing is spoofed; the browser simply is not started in
  // automation mode, so there is nothing false to detect.
  const _exe = chromium.executablePath();
  _proc = spawn(_exe, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${CDP_PROFILE}`,
    // --headless=new is NOT what reCAPTCHA objects to. What it detects is automation
    // mode: navigator.webdriver and the --enable-automation switch, which
    // chromium.launch() adds and we do not. Railway has no display, so headless is
    // required there; set CDP_HEADED=1 to watch it run locally.
    ...(process.env.CDP_HEADED ? [] : ['--headless=new']),
    '--no-first-run', '--no-default-browser-check',
    '--no-sandbox', '--disable-dev-shm-usage', 'about:blank',
  ], { stdio: 'ignore', detached: false });
  _proc.on('exit', () => { _proc = null; });

  // Wait for the debugging endpoint rather than guessing at a sleep.
  let _ready = false;
  for (let i = 0; i < 40 && !_ready; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`, { signal: AbortSignal.timeout(1000) });
      if (r.ok) _ready = true;
    } catch (_) { await new Promise(r => setTimeout(r, 250)); }
  }
  if (!_ready) throw new Error('browser did not expose its debugging port');
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  // Use the browser's OWN default context. A freshly created context behaves like an
  // incognito session; the run that actually got a reCAPTCHA token used the default
  // one, so that is what ships. The user agent needs no override either — this is a
  // real Chrome, so it already reports itself as one.
  const ctx = browser.contexts()[0] || await browser.newContext();
  // Build the pool. The browser's own first tab is reused as slot 0 — it is the tab
  // that was verified to get a reCAPTCHA token — and the rest are opened alongside it.
  pool.length = 0;
  const first = ctx.pages().find(p => !p.isClosed()) || await ctx.newPage();
  pool.push({ page: first, busy: false });
  for (let i = 1; i < POOL_SIZE; i++) pool.push({ page: await ctx.newPage(), busy: false });
  for (const s of pool) await s.page.setViewportSize({ width: 1512, height: 900 }).catch(() => {});
  page = first;   // kept for the idle-shutdown and discard paths
  // Images/fonts/styles are pure waste here — we only ever read JSON.
  // Images, fonts and stylesheets are pure waste here — we only ever read text and
  // JSON. Applied to EVERY tab in the pool, not just the first.
  for (const s of pool) {
    await s.page.route('**/*', route => {
      const t = route.request().resourceType();
      if (t === 'image' || t === 'font' || t === 'media' || t === 'stylesheet') return route.abort();
      route.continue();
    }).catch(() => {});
  }
  console.log(`[browser] ready — ${pool.length} lookup tabs, ${CDP_HEADED_NOTE}`);
  return pool;
}

async function shutdownBrowser() {
  idleTimer = null;
  if (busy) return scheduleIdleShutdown();
  const b = browser;
  browser = null; page = null; pool.length = 0;
  if (b) { try { await b.close(); } catch (_) {} }
  if (_proc) { try { _proc.kill('SIGKILL'); } catch (_) {} _proc = null; }
  if (b) console.log('[browser] idle — shut down');
}

function scheduleIdleShutdown() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(shutdownBrowser, IDLE_SHUTDOWN_MS);
  if (idleTimer.unref) idleTimer.unref();
}

// A POOL of pages, not one.
//
// This used to be a single page behind a single mutex, so every lookup in the world
// ran one at a time. At the measured ~35s average that is roughly 100 an hour, but the
// real ceiling is much lower and it is about WAITING, not volume: the tech in position
// four waits 105 seconds and Mike gives up at 135. Three simultaneous techs was the
// practical limit, and the fourth did not see "busy" — he saw a timeout, which reads
// as broken.
//
// POOL_SIZE pages run side by side, each with its own tab, so N techs are served at
// once and the queue behind them drains N times faster. Each tab costs roughly 150MB,
// which is the thing to raise or lower with the container's memory.
const POOL_SIZE = Number(process.env.POOL_SIZE || 6);
const pool = [];          // { page, busy }
function poolFree() { return pool.find(s => !s.busy) || null; }

function acquire() {
  const free = poolFree();
  if (free) { free.busy = true; busy = true; return Promise.resolve(free); }
  if (waiters.length >= MAX_QUEUE) return Promise.reject(Object.assign(new Error('busy'), { code: 'BUSY' }));
  return new Promise(res => waiters.push(res));
}
function release(slot) {
  if (slot) slot.busy = false;
  const next = waiters.shift();
  if (next) {
    const free = poolFree();
    if (free) { free.busy = true; return next(free); }
    waiters.unshift(next);   // nothing free yet; keep his place in line
    return;
  }
  if (!pool.some(s => s.busy)) { busy = false; scheduleIdleShutdown(); }
}

// ── LOCAL WORKER HANDOFF ─────────────────────────────────────────────────────
// Carrier's lookup is behind invisible reCAPTCHA and Google scores the NETWORK the
// request comes from. The identical code and browser get a token from Brandon's home
// connection and are refused from a Railway datacenter address — verified both ways on
// the same day. Nothing about the browser fixes that.
//
// So Carrier is handed to a worker running on his own machine, on his own connection.
// The worker POLLS this service, so there is no tunnel, no port forwarding and no
// inbound access to his laptop — it only ever makes outbound calls.
//
// SAFETY: if no worker has checked in recently, nothing changes. Carrier falls straight
// through to the existing path and reports honestly. The laptop being asleep can never
// be worse than today.
// 'all' is the intended production setting: the always-on Mac is a residential
// connection, so EVERY manufacturer is better checked from there than from a
// datacenter. A comma list still works for narrowing it to specific brands.
const WORKER_BRANDS_RAW = (process.env.WORKER_BRANDS || 'all').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const WORKER_ALL = WORKER_BRANDS_RAW.includes('all');
const WORKER_BRANDS = new Set(WORKER_BRANDS_RAW);
function workerHandles(brandId) { return WORKER_ALL || WORKER_BRANDS.has(brandId); }
const WORKER_TOKEN = process.env.WORKER_TOKEN || '';
const WORKER_STALE_MS = Number(process.env.WORKER_STALE_MS || 90 * 1000);
const WORKER_WAIT_MS = Number(process.env.WORKER_WAIT_MS || 75 * 1000);
let workerSeenAt = 0;
const jobs = new Map();            // id -> { brand, serial, extra, resolve, done, result }
let jobSeq = 0;

function workerOnline() { return Date.now() - workerSeenAt < WORKER_STALE_MS; }

// Ask the laptop, but never wait forever and never depend on it.
function askWorker(brand, serial, extra) {
  return new Promise((resolve) => {
    const id = `j${++jobSeq}`;
    const j = { brand, serial, extra, claimed: false, done: false, resolve };
    jobs.set(id, j);
    setTimeout(() => {
      if (!j.done) { j.done = true; jobs.delete(id); resolve(null); }
    }, WORKER_WAIT_MS).unref?.();
    const cleanup = setTimeout(() => jobs.delete(id), WORKER_WAIT_MS + 5000);
    cleanup.unref?.();
  });
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
function cacheSet(k, value, ttl) {
  cache.set(k, { value, expires: Date.now() + (ttl || CACHE_TTL_MS) });
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
// Backstop. A single orphaned Playwright promise rejecting must never take the
// service down and drop every tech queued behind it — the resilience posture Mike's
// own server has had since the start.
process.on('unhandledRejection', (e) => console.error('[unhandled rejection]', e && e.message));
process.on('uncaughtException', (e) => console.error('[uncaught exception]', e && e.message));

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

// The worker asks for something to do. Long-ish poll so it is not hammering us.
app.get('/worker/next', (req, res) => {
  if (WORKER_TOKEN && req.get('x-worker-token') !== WORKER_TOKEN) return res.status(401).json({ error: 'bad token' });
  workerSeenAt = Date.now();
  for (const [id, j] of jobs) {
    if (!j.claimed && !j.done) {
      j.claimed = true;
      return res.json({ id, brand: j.brand, serial: j.serial, extra: j.extra });
    }
  }
  res.json({ id: null });
});

// The worker hands back what the manufacturer said.
app.post('/worker/result', (req, res) => {
  if (WORKER_TOKEN && req.get('x-worker-token') !== WORKER_TOKEN) return res.status(401).json({ error: 'bad token' });
  workerSeenAt = Date.now();
  const { id, result, error } = req.body || {};
  const j = jobs.get(id);
  if (!j) return res.json({ ok: true, note: 'job already gone' });
  j.done = true;
  j.result = error ? { error } : result;
  if (j.resolve) j.resolve(j.result);
  res.json({ ok: true });
});

app.get('/worker/status', (req, res) => res.json({ online: workerOnline(), lastSeen: workerSeenAt || null, pending: jobs.size }));

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
  // Hand it to the laptop when this brand needs a residential connection and the
  // worker is actually checked in. If anything about that fails we fall through to the
  // normal path below, so this can only ever add an answer, never remove one.
  // The daily self-check asks for a FRESH run. Reading cache would let it pass on
  // yesterday's answer while a manufacturer's form is broken today, which is the one
  // thing a monitor must never do. It still WRITES the cache, so the check also warms
  // it for the first technician of the day.
  const _skipCache = (req.body && req.body.fresh === true);
  if (workerHandles(brand.id) && workerOnline()) {
    const wkey = cacheKey(brand.id, serial);
    const wcached = _skipCache ? null : cacheGet(wkey);
    if (wcached) return res.json(Object.assign({ ok: true, supported: true, cached: true }, wcached));
    try {
      const w = await askWorker(brand.id, serial, req.body && req.body.extra);
      // Accept ANY well-formed answer, including found:false. "This serial was never
      // registered" is a real answer a tech acts on — it means base coverage — and
      // requiring found/registered here silently discarded it and fell through to a
      // path that could only fail. The worker signals its own failures with .error,
      // so that is the only thing that should make us fall through.
      if (w && !w.error && typeof w.found === 'boolean') {
        const payload = Object.assign({ brand: brand.id, brandLabel: brand.label, serial }, w);
        cacheSet(cacheKey(brand.id, serial), payload, w.found ? CACHE_TTL_MS : RETRY_TTL_MS);
        console.log(`[lookup] ${brand.id} ${serial} via=worker found=${!!w.found} registered=${w.registered}`);
        return res.json(Object.assign({ ok: true, supported: true, cached: false, via: 'worker' }, payload));
      }
      console.log(`[lookup] ${brand.id} ${serial} worker gave nothing — falling through`);
    } catch (e) {
      console.log(`[lookup] ${brand.id} worker error: ${e.message} — falling through`);
    }
  }

  let agentAttemptFailed = false;
  if (!brand.supported && brand.publicRegistry && brand.where && ANTHROPIC_KEY) {
    if (!rateOk()) return res.status(429).json({ ok: false, error: 'rate_limited' });
    let acquiredA = false, slotA = null;
    try {
      // The browser MUST exist before we ask for a slot. Asking first deadlocks: the
      // pool is empty, poolFree() returns nothing, the caller is parked in the queue,
      // and nothing ever releases because no slot was ever created. Every lookup hung.
      await ensureBrowser();
      slotA = await acquire(); acquiredA = true;
      const p = slotA.page;
      const running = agentLookup(p, brand, serial, req.body && req.body.extra);
      // The loser of the race still settles. Swallow its rejection here or it lands as
      // an unhandled rejection and takes the whole service down with every tech queued
      // behind it.
      running.catch(() => {});
      let _atimer;
      const out = await Promise.race([
        running,
        new Promise((_, rej) => { _atimer = setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), AGENT_TIMEOUT_MS); }),
      ]);
      clearTimeout(_atimer);
      const payload = Object.assign({ brand: brand.id, brandLabel: brand.label, serial }, out);
      cacheSet(cacheKey(brand.id, serial), payload, out.found ? CACHE_TTL_MS : RETRY_TTL_MS);
      console.log(`[lookup] ${brand.id} ${serial} via=agent found=${!!out.found} registered=${out.registered}`);
      return res.json(Object.assign({ ok: true, supported: true, cached: false }, payload));
    } catch (err) {
      console.error(`[lookup] ${brand.id} ${serial} AGENT FAILED: ${err.message}`);
      // Must happen BEFORE the finally releases the queue, or the next tech starts
      // driving a page an abandoned lookup is still reading from.
      if (err.code === 'TIMEOUT') await discardBrowser('agent timeout');
      // Say WHOSE problem it is. "Couldn't check" makes a tech distrust Mike; "their
      // site is down" tells him to stop trying and go around it.
      // We could not get their form to run. That is OUR failure to report honestly —
      // it is emphatically NOT "this unit has no registration", which is what a tech
      // would otherwise act on.
      if (err.code === 'NOT_SUBMITTED') {
        return res.json({
          ok: true, supported: true, found: false, inconclusive: true,
          brand: brand.id, brandLabel: brand.label, serial,
          reason: 'lookup_did_not_run',
          summary: `I couldn't get ${brand.label}'s lookup to actually run — their form didn't go through on my end. That is NOT the same as "not covered", so don't treat it that way. Check it directly with the serial before you quote anything.`,
          where: brand.where,
        });
      }
      if (err.code === 'SITE_DOWN' || err.code === 'SITE_MOVED') {
        return res.json({
          ok: true, supported: true, found: false,
          brand: brand.id, brandLabel: brand.label, serial,
          siteDown: true,
          reason: err.code === 'SITE_DOWN' ? 'manufacturer_site_down' : 'manufacturer_page_moved',
          summary: err.code === 'SITE_DOWN'
            ? `Can't check that one right now — ${brand.label}'s warranty site is down. Nothing wrong on your end. Try again later, or call your distributor if you need it today.`
            : `Can't check that one right now — ${brand.label} moved their warranty page. I'll get it updated.`,
          where: brand.where,
        });
      }
      // Fall through to the honest "here is where to look yourself" answer rather
      // than inventing a warranty — but remember that we TRIED. Falling through
      // silently made the next branch tell the tech "I don't have Goodman wired
      // into the registry yet", which is false: it is wired, the lookup failed.
      // Mike blaming a missing feature for a broken one teaches a tech the brand
      // is unsupported and he stops asking.
      agentAttemptFailed = true;
    } finally { if (acquiredA) release(slotA); }
  }

  if (!brand.supported) {
    // Honest, specific answer — "no public registry", "not wired yet" and "wired,
    // but the lookup just failed" are three different things and Mike says which.
    return res.json({
      ok: true,
      supported: false,
      reason: agentAttemptFailed ? 'lookup_failed'
            : brand.publicRegistry ? 'not_wired_yet'
            : 'no_public_registry',
      brand: brand.id,
      brandLabel: brand.label,
      where: brand.where || null,
      note: brand.note || null,
    });
  }

  const key = cacheKey(brand.id, serial);
  const cached = _skipCache ? null : cacheGet(key);
  if (cached) return res.json(Object.assign({ ok: true, supported: true, cached: true }, cached));

  if (!rateOk()) return res.status(429).json({ ok: false, error: 'rate_limited' });

  let acquired = false, slot = null;
  try {
    // Browser first, then a slot — see the note on the agent path. Reversing these
    // deadlocks the very first request.
    await ensureBrowser();
    slot = await acquire();
    acquired = true;
    const p = slot.page;
    const running = brand.lookup(p, serial);
    running.catch(() => {});   // the race loser still settles; see discardBrowser
    let _dtimer;
    const result = await Promise.race([
      running,
      new Promise((_, rej) => { _dtimer = setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), LOOKUP_TIMEOUT_MS); }),
    ]);
    clearTimeout(_dtimer);

    const payload = Object.assign({ brand: brand.id, brandLabel: brand.label, serial }, result);
    cacheSet(key, payload, result.found ? CACHE_TTL_MS : RETRY_TTL_MS);

    // Log the outcome only. The upstream payload contains the homeowner's install
    // address; it must not reach the logs any more than it reaches the phone.
    console.log(`[lookup] ${brand.id} ${serial} found=${!!result.found} registered=${result.registered}`);
    return res.json(Object.assign({ ok: true, supported: true, cached: false }, payload));
  } catch (err) {
    const code = err.code === 'TIMEOUT' ? 'timeout' : err.code === 'BUSY' ? 'busy' : 'lookup_failed';
    console.error(`[lookup] ${brand.id} ${serial} FAILED: ${code} ${err.message}`);
    if (err.code === 'TIMEOUT') await discardBrowser('lookup timeout');
    // Trane is the one verified, highest-volume brand and it threw a bare Error on any
    // non-200, so a Trane outage reached the tech as "couldn't reach the registry" —
    // our fault — instead of "Trane's site is down". Same honesty the agent path got.
    if (err.code === 'SITE_DOWN' || err.code === 'SITE_MOVED') {
      return res.json({
        ok: true, supported: true, found: false,
        brand: brand.id, brandLabel: brand.label, serial,
        siteDown: true,
        reason: err.code === 'SITE_DOWN' ? 'manufacturer_site_down' : 'manufacturer_page_moved',
        summary: err.code === 'SITE_DOWN'
          ? `Can't check that one right now — ${brand.label}'s warranty site is down. Nothing wrong on your end. Try again later, or call your distributor if you need it today.`
          : `Can't check that one right now — ${brand.label} moved their warranty page. I'll get it updated.`,
        where: brand.where,
      });
    }
    // Fail soft and say so plainly. Mike turns this into "couldn't reach the
    // registry" rather than inventing a warranty.
    return res.status(code === 'busy' ? 503 : 502).json({ ok: false, error: code, brand: brand.id });
  } finally {
    if (acquired) release(slot);
  }
});

// Say WHICH build this is. Two Goodman fixes were reported as "still failing" purely
// because nobody could tell from the logs whether the running container predated them —
// the same lookup, the same error, two different builds, and no way to distinguish.
// Railway injects the commit; print it at boot so a log line is never ambiguous again.
const BUILD = (process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown').slice(0, 7);
const server = app.listen(PORT, '0.0.0.0', () =>
  console.log(`warranty-service listening on ${PORT} — build ${BUILD}`));

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
