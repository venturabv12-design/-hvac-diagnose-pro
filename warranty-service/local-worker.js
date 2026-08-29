#!/usr/bin/env node
/**
 * TRAZER WARRANTY WORKER — runs on Brandon's always-on Mac.
 *
 * WHY THIS EXISTS
 * Manufacturer warranty forms sit behind invisible reCAPTCHA, and Google scores the
 * NETWORK a request comes from, not the browser. The identical code and the identical
 * Chrome get a token from a residential connection and are refused from a Railway
 * datacenter address — verified both ways on the same day. Nothing about the browser
 * fixes that; only the connection does.
 *
 * So the machine that stays on is the browser for ALL brands. The server becomes the
 * queue; this does the driving, on a real Chrome, on a real home connection.
 *
 * It runs the SAME brand engine the server runs (brands/index.js + brands/agent.js).
 * There is no second copy of the lookup logic to drift — a brand fixed on the server
 * is fixed here the moment this restarts.
 *
 * SAFETY: outbound polling only. Nothing listens on this machine, nothing is opened on
 * the router. If this is not running, the server falls straight through to its own
 * browser and behaves exactly as it does today. This can only add answers.
 *
 *   node local-worker.js
 */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const brands = require('./brands');
const { agentLookup, scrub } = require('./brands/agent');

const SERVICE = process.env.SERVICE_URL || 'https://trazermike.io';
const PREFIX  = process.env.WORKER_PATH || '/api/warranty-worker';
const TOKEN   = process.env.WORKER_TOKEN || '';
const PORT    = Number(process.env.LOCAL_CDP_PORT || 9223);
const CHROME  = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROFILE = process.env.LOCAL_PROFILE || `${process.env.HOME}/.trazer-worker-chrome`;
const JOB_MS  = Number(process.env.WORKER_JOB_TIMEOUT_MS || 110000);
const DIAG_DIR = process.env.WORKER_DIAG_DIR || `${process.env.HOME}/Library/Logs/trazer-warranty-failures`;

let browser = null;

// Chrome is launched as an ORDINARY PROCESS and then attached to over the debugging
// port. Playwright's own launch() sets navigator.webdriver and the automation switches,
// which reCAPTCHA reads directly — that is the difference between a token and a refusal.
// Do not replace this with chromium.launch().
async function ensureChrome() {
  if (browser) {
    try { browser.contexts(); return browser; } catch (_) { browser = null; }
  }
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`, { signal: AbortSignal.timeout(1000) });
    if (!r.ok) throw new Error('no chrome');
  } catch (_) {
    spawn(CHROME, [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE}`,
      '--no-first-run', '--no-default-browser-check',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      'about:blank',
    ], { stdio: 'ignore', detached: true }).unref();
    for (let i = 0; i < 80; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${PORT}/json/version`, { signal: AbortSignal.timeout(1000) });
        if (r.ok) break;
      } catch (_) {}
      await new Promise(r => setTimeout(r, 250));
    }
  }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
  browser.on('disconnected', () => { browser = null; });
  console.log('[worker] Chrome attached');
  return browser;
}

async function runJob(job) {
  const brand = brands.resolve(job.brand);
  if (!brand) return { error: 'unknown_brand' };

  const b = await ensureChrome();
  const ctx = b.contexts()[0] || (await b.newContext());
  const page = await ctx.newPage();
  try {
    const running = brand.supported && typeof brand.lookup === 'function'
      ? brand.lookup(page, job.serial, job.extra)
      : agentLookup(page, brand, job.serial, job.extra);
    running.catch(() => {});   // the race loser still settles; unhandled would kill us
    let t;
    const out = await Promise.race([
      running,
      new Promise((_, rej) => { t = setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), JOB_MS); }),
    ]);
    clearTimeout(t);
    return Object.assign({}, out, { via: 'worker' });   // label wins over the engine's own
  } catch (e) {
    // KEEP ENOUGH TO FIX IT. A failure a technician hit in the field is the only chance
    // we get at some brands — Lennox needs the homeowner's last name and zip, so it
    // cannot be reproduced later from our own side, and that data is deliberately never
    // stored. Without this, the alert says "lennox broke" and the trail ends there.
    //
    // What is kept is the PAGE, scrubbed through the same redactor the model's input
    // goes through, plus a screenshot. That is what shows whether their form moved,
    // renamed a field or added a step. The customer's details are not written down.
    try {
      // The homeowner's name and zip are redacted; the SERIAL is deliberately kept.
      // A serial is equipment, not a person, and a diagnostic without it cannot be
      // replayed against the manufacturer — which is the entire point of keeping one.
      const text = scrub(await page.evaluate(() => document.body.innerText).catch(() => ''),
                         [(job.extra && job.extra.lastName) || '', (job.extra && job.extra.zip) || '']);
      fs.mkdirSync(DIAG_DIR, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const base = path.join(DIAG_DIR, `${job.brand}-${stamp}`);
      fs.writeFileSync(`${base}.txt`,
        `brand=${job.brand}\nfailure=${e.code || 'lookup_failed'}\nmessage=${e.message}\n` +
        `url=${page.url()}\nfields_supplied=${Object.keys(job.extra || {}).filter(k => (job.extra || {})[k]).join(',')}\n` +
        `\n----- page as the worker saw it (scrubbed) -----\n${text.slice(0, 20000)}\n`);
      await page.screenshot({ path: `${base}.png`, fullPage: false }).catch(() => {});
      console.log(`[worker] kept a diagnostic for ${job.brand}: ${base}.txt`);
    } catch (de) { console.log('[worker] could not keep a diagnostic:', de.message); }
    // Report the SHAPE of the failure, never a guess. The server turns these into an
    // honest "I couldn't check" — it must never read as "this unit isn't covered".
    return { error: e.code || 'lookup_failed', message: e.message };
  } finally {
    await page.close().catch(() => {});
  }
}

async function loop() {
  const headers = TOKEN ? { 'x-worker-token': TOKEN } : {};
  console.log(`[worker] polling ${SERVICE}${PREFIX} — brands: whatever the server sends`);
  let quietSince = Date.now();
  for (;;) {
    let got = false;
    try {
      const r = await fetch(`${SERVICE}${PREFIX}/next`, { headers, signal: AbortSignal.timeout(20000) });
      const job = r.ok ? await r.json() : null;
      if (job && job.id) {
        got = true;
        console.log(`[worker] job ${job.id}: ${job.brand} ${job.serial}`);
        const started = Date.now();
        const result = await runJob(job);
        await fetch(`${SERVICE}${PREFIX}/result`, {
          method: 'POST',
          headers: Object.assign({ 'content-type': 'application/json' }, headers),
          body: JSON.stringify({ id: job.id, result }),
          signal: AbortSignal.timeout(20000),
        }).catch(e => console.log('[worker] could not return result:', e.message));
        console.log(`[worker] job ${job.id} done in ${((Date.now() - started) / 1000).toFixed(1)}s — ${result.error ? 'error ' + result.error : 'found=' + !!result.found}`);
      }
    } catch (e) {
      console.log('[worker] poll failed:', e.message);
    }
    // A Chrome left open for days leaks memory. Nothing is in flight here, so this is
    // free — and it means a week-long uptime behaves like a fresh start.
    if (!got && browser && Date.now() - quietSince > 30 * 60 * 1000) {
      quietSince = Date.now();
      try { await browser.close(); } catch (_) {}
      browser = null;
      console.log('[worker] idle — released Chrome');
    }
    if (got) quietSince = Date.now();
    await new Promise(r => setTimeout(r, got ? 100 : 2500));
  }
}

process.on('unhandledRejection', e => console.log('[worker] unhandled:', e && e.message));
process.on('uncaughtException',  e => console.log('[worker] uncaught:', e && e.message));
loop();
