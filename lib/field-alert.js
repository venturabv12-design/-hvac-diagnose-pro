'use strict';
/* ════════════════════════════════════════════════════════════════════════════
 * FIELD ALERT — the small failures, the ones that never announce themselves.
 *
 * A total outage tells you it happened. Techs call, the phone rings, you know.
 * The failures that actually cost Brandon customers are the quiet ones: a tech
 * asks Mike something in an attic, gets nothing useful, puts the phone back in
 * his pocket and calls a senior guy like he always did. He doesn't complain. He
 * just stops opening the app, and it never shows up in any number until he's gone.
 *
 * 2026-08-26 was exactly that. A tech got no answer twice. Health was green,
 * no 5xx, and the events table logged a mike_answer for BOTH of his questions —
 * they were generated and delivered, his browser threw them away. The uptime
 * watchdog pinged /api/health 76,000 times straight through it and said "up".
 * Brandon only found out because that tech happened to send a photo.
 *
 * So this does not watch the server. It watches whether a technician got his
 * answer, and it emails Brandon when one didn't. In-process on purpose: no second
 * Railway service to pay for or forget about, and it lives or dies with the thing
 * it is watching.
 *
 * It must never be able to hurt Mike: every path is wrapped, the timer is unref'd,
 * and a failure here is logged and swallowed.
 * ════════════════════════════════════════════════════════════════════════════ */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_TO = (process.env.ALERT_EMAIL || 'venturabv12@gmail.com').split(',').map(s => s.trim());
const APP_URL = process.env.APP_URL || 'https://trazermike.io';

const EVERY_MS = Number(process.env.ALERT_INTERVAL_MS || 10 * 60 * 1000);  // 10 min
const WINDOW_MIN = Number(process.env.ALERT_WINDOW_MIN || 30);
const COOLDOWN_H = Number(process.env.ALERT_COOLDOWN_H || 6);   // don't nag about the same thing

const log = (...a) => console.log('[field-alert]', ...a);

async function sb(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    signal: AbortSignal.timeout(10000),
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  });
  if (!r.ok) throw new Error(`supabase ${r.status}`);
  return r.json();
}
async function sbPost(table, body) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', signal: AbortSignal.timeout(10000),
    headers: {
      apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
}

// Signatures already alerted on recently. Read from the DB rather than memory so a
// deploy or restart doesn't re-send every alert from the last six hours.
async function recentlyAlerted() {
  const since = new Date(Date.now() - COOLDOWN_H * 3600000).toISOString();
  const rows = await sb(`events?select=payload&type=eq.field_alert&created_at=gte.${since}&limit=200`)
    .catch(() => []);
  const seen = new Set();
  for (const r of rows || []) for (const s of ((r.payload || {}).signatures || [])) seen.add(s);
  return seen;
}

let _ownerId = null;
async function ownerId() {
  if (_ownerId) return _ownerId;
  const rows = await sb('users?select=id&role=eq.admin&limit=1').catch(() => []);
  _ownerId = (rows && rows[0] && rows[0].id) || null;
  return _ownerId;
}

// ── WHAT COUNTS AS WORTH WAKING HIM FOR ──────────────────────────────────────
// Deliberately sensitive. One technician getting nothing IS the event — waiting for
// a pattern means waiting until several people have already decided the app is junk.
async function findProblems() {
  const since = new Date(Date.now() - WINDOW_MIN * 60000).toISOString();
  const problems = [];

  const errs = await sb(
    `events?select=user_id,payload,created_at&type=eq.client_error&created_at=gte.${since}&limit=500`
  ).catch(() => []);

  const groups = {};
  for (const e of errs || []) {
    const p = e.payload || {};
    const key = `${p.kind}|${(p.detail || '').slice(0, 60)}`;
    const g = groups[key] || (groups[key] = { key, kind: p.kind, detail: p.detail, where: p.where, count: 0, techs: new Set(), anon: 0, waited: 0 });
    g.count++;
    if (p.anon) g.anon++; else if (e.user_id) g.techs.add(e.user_id);
    if (p.waitedMs) g.waited = Math.max(g.waited, p.waitedMs);
  }

  for (const g of Object.values(groups)) {
    const techs = g.techs.size;
    // A tech who asked and got nothing — the quiet one that costs a customer.
    if (g.kind === 'no_answer') {
      problems.push({
        sig: g.key, severity: techs > 1 ? 'high' : 'medium',
        headline: techs > 1
          ? `${techs} technicians asked Mike something and got no answer`
          : `A technician asked Mike something and got no answer`,
        detail: g.detail, where: g.where, count: g.count,
        techs, anon: g.anon, waitedMs: g.waited,
      });
    } else if (techs >= 2) {
      // Anything else only matters once it is hitting more than one person.
      problems.push({
        sig: g.key, severity: 'medium',
        headline: `${techs} technicians hit the same error`,
        detail: g.detail, where: g.where, count: g.count, techs, anon: g.anon,
      });
    }
  }

  // Mike limping on a fallback model is not an outage, but it is not normal either.
  try {
    const h = await fetch(`${APP_URL}/api/health`, { signal: AbortSignal.timeout(10000) }).then(r => r.json());
    if (h && h.degraded) {
      problems.push({
        sig: 'degraded|model', severity: 'high',
        headline: 'Mike is answering on a backup model',
        detail: `The primary model is failing. ${h.failovers || 0} failover(s) since restart. Techs are still getting answers.`,
        where: 'server', count: h.failovers || 1, techs: 0, anon: 0,
      });
    }
  } catch (_) {}

  return problems;
}

function emailHtml(problems) {
  const W = 'max-width:600px;margin:0 auto;padding:22px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#141719;background:#fff;font-size:16px;line-height:1.55';
  const rows = problems.map(p => `
    <div style="margin:0 0 14px;padding:14px 16px;background:${p.severity === 'high' ? '#FBF0ED' : '#F6F6F3'};border-left:3px solid ${p.severity === 'high' ? '#C7553B' : '#818A85'};border-radius:0 6px 6px 0">
      <p style="margin:0 0 6px;font-weight:700">${p.headline}</p>
      <p style="margin:0 0 4px;color:#4A524E">${p.detail || ''}</p>
      <p style="margin:0;font-family:Menlo,monospace;font-size:12px;color:#818A85">
        ${p.count} time(s)${p.techs ? ` · ${p.techs} tech(s)` : ''}${p.anon ? ` · ${p.anon} signed-out` : ''}${p.waitedMs ? ` · waited ${Math.round(p.waitedMs / 1000)}s` : ''} · ${p.where || 'n/a'}
      </p>
    </div>`).join('');
  return `<div style="${W}">
<h1 style="font-size:21px;font-weight:800;letter-spacing:-.4px;margin:0 0 4px">Mike: a tech hit a problem</h1>
<p style="margin:0 0 18px;color:#4A524E">Last ${WINDOW_MIN} minutes. Mike is still up — this is about what a technician actually experienced, not the server.</p>
${rows}
<p style="margin:18px 0 0;color:#7C847F;font-size:14px">Sent because a technician got a bad experience, not because anything crashed. You are getting this so you hear it before he decides the app doesn't work.</p>
</div>`;
}

async function notify(problems) {
  if (!RESEND_API_KEY) { log('no RESEND_API_KEY — cannot email'); return false; }
  const worst = problems.some(p => p.severity === 'high') ? 'HIGH' : 'heads up';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Mike Field Watch <noreply@trazermike.io>',
      to: ALERT_TO,
      subject: `Mike — ${problems[0].headline}${worst === 'HIGH' ? '' : ''}`,
      html: emailHtml(problems),
    }),
  });
  if (!r.ok) { log('email failed', r.status, (await r.text()).slice(0, 150)); return false; }
  return true;
}

let _running = false;
let _last = null;

async function checkOnce(opts) {
  const dry = !!(opts && opts.dryRun);
  if (_running) return _last;
  _running = true;
  try {
    const found = await findProblems();
    if (!found.length) { _last = { at: new Date().toISOString(), problems: 0 }; return _last; }

    const seen = await recentlyAlerted();
    const fresh = found.filter(p => !seen.has(p.sig));
    if (!fresh.length) {
      log(`${found.length} problem(s), all already alerted within ${COOLDOWN_H}h — staying quiet`);
      _last = { at: new Date().toISOString(), problems: found.length, suppressed: found.length };
      return _last;
    }

    log(`ALERTING on ${fresh.length}: ${fresh.map(p => p.headline).join(' | ')}`);
    if (!dry) {
      const sent = await notify(fresh);
      const uid = await ownerId();
      if (uid) {
        await sbPost('events', {
          user_id: uid, type: 'field_alert',
          payload: { signatures: fresh.map(p => p.sig), sent, problems: fresh.map(p => ({ h: p.headline, t: p.techs })) },
        }).catch(() => {});
      }
    }
    _last = { at: new Date().toISOString(), problems: found.length, alerted: fresh.length, dryRun: dry, fresh };
    return _last;
  } catch (e) {
    log('check failed (non-fatal):', e.message);
    return _last;
  } finally {
    _running = false;
  }
}

function start() {
  if (process.env.ALERT_ENABLED !== '1') { log('disabled (set ALERT_ENABLED=1)'); return; }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) { log('no database — not scheduling'); return; }
  const t = setInterval(() => { checkOnce({}).catch(() => {}); }, EVERY_MS);
  if (t.unref) t.unref();
  log(`watching — every ${Math.round(EVERY_MS / 60000)} min, ${WINDOW_MIN} min window, ${COOLDOWN_H}h cooldown`);
}

module.exports = { start, checkOnce, findProblems, status: () => _last };
