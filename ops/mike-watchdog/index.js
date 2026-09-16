// Mike Watchdog — always-on health monitor for Mike (trazermike.io).
//
// Every CHECK_INTERVAL it hits Mike's /api/health. After FAIL_THRESHOLD
// consecutive failures it declares an OUTAGE and — once — triggers Cello to
// CALL Brandon ("Mike's down"). When Mike recovers it calls back to say so.
//
// READ-ONLY: this service only *reads* Mike's health. It never deploys,
// edits, or touches Mike. It cannot take Mike down.
//
// Config (env vars, all optional except the URL which defaults sensibly):
//   MIKE_HEALTH_URL   default https://trazermike.io/api/health
//   MIKE_FRONT_URL    default https://trazermike.io/
//   CHECK_INTERVAL_MS default 60000
//   FAIL_THRESHOLD    default 3   (3 misses in a row = outage; avoids flapping)
//   PORT              Railway sets this; we serve /status on it
//   --- alert channel (Cello outbound call via Vapi) ---
//   VAPI_KEY, VAPI_ASSISTANT_ID, VAPI_PHONE_NUMBER_ID, ALERT_PHONE
//   If the Vapi vars are missing, the watchdog still runs + logs, it just
//   can't place the call (logs "would alert" instead) — so it degrades safely.

const http = require('http');

const CFG = {
  healthUrl: process.env.MIKE_HEALTH_URL || 'https://trazermike.io/api/health',
  // THE WARRANTY LIFELINE. Carrier, Bryant, Payne, every ICP badge and Lennox can only be
  // looked up from a residential connection — Google scores the network on Carrier's
  // invisible reCAPTCHA and a datacenter address is handed a page with no record on it.
  // Brandon decided 2026-09-09 to keep that on his own laptop rather than rent a proxy.
  // That is a fine decision, but it means one machine in his house is the only path, and on
  // 2026-09-08 that machine went flat overnight and nothing told him. The field sweep DID
  // notice — and wrote "warranty_worker_down" into a log file on the laptop that had just
  // died. A watchdog running on the dying machine cannot report its own death.
  // This service runs on Railway, so it is the only thing that survives to make the call.
  warrantyUrl: process.env.WARRANTY_WORKER_URL || 'https://trazermike.io/api/warranty-worker/status',
  frontUrl: process.env.MIKE_FRONT_URL || 'https://trazermike.io/',
  intervalMs: parseInt(process.env.CHECK_INTERVAL_MS || '60000', 10),
  failThreshold: parseInt(process.env.FAIL_THRESHOLD || '3', 10),
  port: parseInt(process.env.PORT || '3000', 10),
  vapi: {
    key: process.env.VAPI_KEY,
    assistantId: process.env.VAPI_ASSISTANT_ID,
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
    alertPhone: process.env.ALERT_PHONE
  }
};

const state = {
  consecutiveFails: 0,
  inOutage: false,
  lastCheck: null,
  lastOk: null,
  lastOutageStart: null,
  totalChecks: 0,
  totalOutages: 0,
  lastError: null
};

// Deliberately a SEPARATE state machine, not a second flag on the one above. Mike being up
// and warranty being up are different outages with different fixes, and folding them together
// would mean one masks the other — exactly what happened on 2026-09-08, when Mike was green
// all night and every Carrier lookup was dead.
const wState = {
  consecutiveFails: 0,
  inOutage: false,
  lastCheck: null,
  lastOk: null,
  lastOutageStart: null,
  totalOutages: 0,
  lastError: null
};

function log(...a) { console.log(new Date().toISOString(), ...a); }

async function timedFetch(url, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'mike-watchdog' } });
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { ok: false, status: 0, err: e.message };
  } finally {
    clearTimeout(t);
  }
}

async function timedJson(url, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'mike-watchdog' } });
    if (!r.ok) return { ok: false, err: 'http ' + r.status };
    return { ok: true, body: await r.json() };
  } catch (e) {
    return { ok: false, err: e.message };
  } finally {
    clearTimeout(t);
  }
}

// EMAIL — the channel that replaced the phone call. Added 2026-09-15.
//
// Brandon killed Cello's calls on 09-14, and that was right: nothing on his side ever
// asked to be phoned. But the call was this service's ONLY voice, so silencing it left
// the watchdog mute — and this is the one watcher that survives his laptop dying, which
// is exactly the gap that let the warranty worker stay dead for 53 hours on 09-13 with
// nobody knowing.
//
// His standing rule: "Brandon is never the monitor." Never remove a channel without
// replacing it. Email is the right replacement — it reaches him with no phone ringing,
// and his own policy already reserves email for MAJOR events only, which is all this
// service ever sends. Subject reads complete on a lock screen with the body unopened.
async function emailBrandon(subject, body) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { log('ALERT — no RESEND_API_KEY, could not email:', subject); return false; }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Trazer Mike <mike@trazermike.io>',
        to: ['venturabv12@gmail.com', 'trazerintelligence@gmail.com'],
        subject, text: body,
      }),
      signal: AbortSignal.timeout(20000),
    });
    // A non-2xx from the notifier is a FAILED alert, not a sent one. Say so in the log
    // rather than recording a delivery that never happened.
    const ok = r.ok;
    log('ALERT email ' + (ok ? 'sent' : 'FAILED ' + r.status) + ' — ' + subject);
    return ok;
  } catch (e) {
    log('ALERT email THREW — ' + e.message + ' — ' + subject);
    return false;
  }
}

// Trigger Cello to call Brandon. `mode` = 'down' | 'recovered'.
async function callBrandon(mode) {
  const { key, assistantId, phoneNumberId, alertPhone } = CFG.vapi;
  if (!key || !assistantId || !phoneNumberId || !alertPhone) {
    log('ALERT (' + mode + ') — Vapi not fully configured, would have called', alertPhone || '(no number)');
    return false;
  }
  const MSG = {
    down: "Hey Brandon, it's Cello. Heads up — Mike is down right now, techs are getting errors. The usual fix is flipping his model in Railway, or I can walk you through it. Want me to get the crew on it?",
    recovered: "Brandon, it's Cello — good news, Mike's back up and answering normally again. Just letting you know.",
    // Say the FIX in the first sentence. He is going to hear this in a truck, once, and the
    // action is physical — go look at the laptop — so leading with the diagnosis wastes the call.
    'warranty-down': "Brandon, it's Cello. Your laptop stopped answering warranty lookups — check it's plugged in and awake. Mike himself is fine, but Carrier, Bryant, Payne, Heil and Lennox can't be checked until that machine is back. Everything else still works.",
    'warranty-recovered': "Brandon, it's Cello — the laptop is back and warranty lookups are working again. Carrier and Lennox are answering.",
  };
  const firstMessage = MSG[mode] || MSG.down;
  // 2026-09-14, Brandon: "No more phone calls from Cello. I don't need phone calls or
  // messages unless I ask." An outbound voice call is the single most intrusive channel
  // we have and he has now told us not to use it. The call path stays in the code because
  // a total Mike outage at 3am is exactly what it was built for, but it is OFF unless he
  // turns it back on by setting CELLO_CALL_ENABLED=1. Default is silence.
  if (process.env.CELLO_CALL_ENABLED !== '1') {
    log('ALERT (' + mode + ') — Cello call SUPPRESSED (Brandon 2026-09-14: no calls unless asked)');
    return false;
  }
  try {
    const r = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'User-Agent': 'curl/8.4.0' },
      body: JSON.stringify({
        assistantId,
        phoneNumberId,
        customer: { number: alertPhone },
        assistantOverrides: { firstMessage }
      })
    });
    const ok = r.ok;
    log('ALERT (' + mode + ') — Vapi call ' + (ok ? 'placed' : 'FAILED ' + r.status));
    return ok;
  } catch (e) {
    log('ALERT (' + mode + ') — Vapi call error', e.message);
    return false;
  }
}

async function check() {
  state.totalChecks++;
  state.lastCheck = new Date().toISOString();
  const h = await timedFetch(CFG.healthUrl);
  const healthy = h.ok;

  if (healthy) {
    state.lastOk = state.lastCheck;
    state.lastError = null;
    if (state.inOutage) {
      const downMs = Date.now() - new Date(state.lastOutageStart).getTime();
      log('RECOVERED — Mike back up after ' + Math.round(downMs / 1000) + 's down');
      state.inOutage = false;
      await callBrandon('recovered');
      await emailBrandon('Mike is back up', 'Mike is answering normally again after an outage. Nothing for you to do — this is the all-clear.');
    }
    state.consecutiveFails = 0;
  } else {
    state.consecutiveFails++;
    state.lastError = 'health ' + (h.status || 'timeout') + (h.err ? ' (' + h.err + ')' : '');
    log('MISS ' + state.consecutiveFails + '/' + CFG.failThreshold + ' — ' + state.lastError);
    if (!state.inOutage && state.consecutiveFails >= CFG.failThreshold) {
      state.inOutage = true;
      state.totalOutages++;
      state.lastOutageStart = new Date().toISOString();
      log('OUTAGE DECLARED — Mike is down');
      await callBrandon('down');
      await emailBrandon('Mike is DOWN — techs are getting errors', 'Mike\'s health check has failed repeatedly. Technicians asking him anything right now get an error.\n\nThis watchdog runs on Railway, separate from the laptop, so it is still reporting even if the house machine is off.');
    }
  }
}

// The warranty lifeline. Independent of Mike's own health on purpose.
async function checkWarranty() {
  wState.lastCheck = new Date().toISOString();
  const r = await timedJson(CFG.warrantyUrl);
  // Treat an unreadable endpoint as UNKNOWN, not as down. If Mike himself is unreachable this
  // call fails too, and calling Brandon about warranty during a Mike outage sends him to look
  // at the wrong thing. Mike's own watch already owns that alarm.
  if (!r.ok) { wState.lastError = r.err; log('warranty status unreadable — ' + r.err + ' (not counted)'); return; }

  const online = r.body && r.body.online === true;
  if (online) {
    wState.lastOk = wState.lastCheck;
    wState.lastError = null;
    if (wState.inOutage) {
      const downMs = Date.now() - new Date(wState.lastOutageStart).getTime();
      log('WARRANTY RECOVERED — worker back after ' + Math.round(downMs / 1000) + 's');
      wState.inOutage = false;
      await callBrandon('warranty-recovered');
      await emailBrandon('Warranty lookups are working again', 'The laptop is back and answering. Carrier, Bryant, Payne, Heil and Lennox can be checked again.');
    }
    wState.consecutiveFails = 0;
  } else {
    wState.consecutiveFails++;
    wState.lastError = 'worker offline';
    log('WARRANTY MISS ' + wState.consecutiveFails + '/' + CFG.failThreshold);
    // The threshold matters here: a warranty-service redeploy resets its in-memory lastSeen and
    // reports online:false for under a minute. Observed twice on 2026-09-09. Three misses in a
    // row rides that out without calling him about a deploy.
    if (!wState.inOutage && wState.consecutiveFails >= CFG.failThreshold) {
      wState.inOutage = true;
      wState.totalOutages++;
      wState.lastOutageStart = new Date().toISOString();
      log('WARRANTY OUTAGE DECLARED — the laptop worker is not checking in');
      await callBrandon('warranty-down');
      await emailBrandon('Warranty is DOWN — check the laptop is awake and plugged in', 'Your laptop stopped answering warranty lookups.\n\nMike himself is fine. But Carrier, Bryant, Payne, Heil and Lennox only answer a residential connection, so they cannot be checked until that machine is back. Everything else in Mike still works.\n\nCheck: the laptop is on, plugged in, and on wifi.');
    }
  }
}

// Tiny status server so Railway keeps the service alive and we can eyeball it.
http.createServer((req, res) => {
  if (req.url === '/status' || req.url === '/') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      watching: CFG.healthUrl,
      up: !state.inOutage,
      ...state,
      warranty: { watching: CFG.warrantyUrl, up: !wState.inOutage, ...wState },
      alertReady: !!(CFG.vapi.key && CFG.vapi.assistantId && CFG.vapi.phoneNumberId && CFG.vapi.alertPhone)
    }, null, 2));
    return;
  }
  res.writeHead(404); res.end();
}).listen(CFG.port, () => log('watchdog live on :' + CFG.port + ' — watching ' + CFG.healthUrl + ' every ' + CFG.intervalMs + 'ms'));

check();
setInterval(check, CFG.intervalMs);
checkWarranty();
setInterval(checkWarranty, CFG.intervalMs);
