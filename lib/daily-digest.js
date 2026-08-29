'use strict';
/* ════════════════════════════════════════════════════════════════════════════
 * DAILY DIGEST — traffic, signups, conversion. One email, every morning.
 *
 * Brandon asked for exactly three things: how much traffic, how many signups,
 * what's converting. Everything here is already computed by /api/admin/stats —
 * this reads the same numbers and puts them where he actually looks, which is
 * his phone, not a dashboard he has to remember to open.
 *
 * Different rule from the field-alert deliberately: that one is SILENT unless a
 * technician is having a bad time, because an alert that cries wolf gets ignored.
 * This one always sends, because he asked to see the numbers daily — a business
 * pulse is something you read, not something that interrupts you.
 *
 * The framing is honest by design. It leads with the funnel rather than the
 * traffic, because traffic going up while signups stay flat is the actual story
 * and a vanity number on top would bury it.
 * ════════════════════════════════════════════════════════════════════════════ */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = (process.env.DIGEST_EMAIL || process.env.ALERT_EMAIL || 'venturabv12@gmail.com')
  .split(',').map(s => s.trim());
const APP_URL = process.env.APP_URL || 'https://trazermike.io';
const JWT_SECRET = process.env.JWT_SECRET;
const SEND_HOUR = Number(process.env.DIGEST_HOUR || 7);

const jwt = require('jsonwebtoken');
const log = (...a) => console.log('[digest]', ...a);

// Reads its own API rather than re-implementing the maths, so the email can never
// disagree with the dashboard.
async function fetchStats() {
  const rows = await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?select=id,email&role=eq.admin&limit=1`, {
    headers: { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` },
    signal: AbortSignal.timeout(10000),
  }).then(r => r.json());
  const admin = rows && rows[0];
  if (!admin) throw new Error('no admin account to authenticate as');
  const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: '5m', algorithm: 'HS256' });
  const r = await fetch(`${APP_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error('stats ' + r.status);
  return r.json();
}

const n = (v) => (v == null ? '—' : Number(v).toLocaleString('en-US'));
const pct = (v) => (v == null ? '—' : `${Number(v).toFixed(v < 10 ? 1 : 0)}%`);
function arrow(change) {
  if (change == null) return '';
  if (change > 0) return `<span style="color:#2E7D7B;font-weight:700">▲ ${change}%</span>`;
  if (change < 0) return `<span style="color:#C7553B;font-weight:700">▼ ${Math.abs(change)}%</span>`;
  return `<span style="color:#818A85">flat</span>`;
}

function buildHtml(s) {
  const t = s.traffic || {}, a = s.accounts || {}, u = s.usage || {}, m = s.movement || {};
  const today = t.today || {}, last7 = t.last7 || {};
  const yesterday = (t.daily || [])[1] || {};

  // The line at the top is chosen by what is actually true today, not a fixed template.
  let headline, sub;
  if (a.paying > 0) {
    headline = `${n(a.paying)} paying`;
    sub = 'Revenue is live.';
  } else if ((m.visitors || {}).change > 50 && (m.signups || {}).change <= 0) {
    headline = 'Traffic up, signups flat';
    sub = 'People are showing up and not creating accounts. The gap is the front door, not the product.';
  } else if (a.activated && a.paying === 0) {
    headline = `${n(a.activated)} technicians using it, 0 paying`;
    sub = 'Nobody has been asked to pay yet.';
  } else {
    headline = `${n(today.uniques)} visitors today`;
    sub = '';
  }

  const rows = (t.daily || []).slice(0, 7).map(d =>
    `<tr><td style="padding:5px 12px 5px 0;font-family:Menlo,monospace;font-size:13px;color:#818A85">${d.date.slice(5)}</td>
     <td style="padding:5px 12px 5px 0;font-family:Menlo,monospace;font-size:13px;text-align:right">${n(d.views)}</td>
     <td style="padding:5px 0;font-family:Menlo,monospace;font-size:13px;text-align:right;color:#4A524E">${n(d.uniques)}</td></tr>`).join('');

  const quiet = (s.attention || {}).wentQuiet || [];
  const never = (s.attention || {}).neverUsed || [];
  const who = [...quiet.slice(0, 2).map(x => `${x.name} — used it, then went quiet`),
               ...never.slice(0, 2).map(x => `${x.name} — signed up ${x.daysSinceSignup}d ago, never asked anything`)];

  const W = 'max-width:600px;margin:0 auto;padding:22px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#141719;background:#fff;font-size:16px;line-height:1.55';
  return `<div style="${W}">
<p style="margin:0 0 2px;font-family:Menlo,monospace;font-size:11px;letter-spacing:1.6px;color:#818A85">TRAZER · DAILY</p>
<h1 style="font-size:24px;font-weight:800;letter-spacing:-.5px;margin:0 0 4px">${headline}</h1>
<p style="margin:0 0 20px;color:#4A524E">${sub}</p>

<table style="width:100%;border-collapse:collapse;margin:0 0 20px">
<tr>
  <td style="padding:12px 10px 12px 0;border-top:1px solid #DCDED9">Visitors <span style="color:#818A85">(7d)</span></td>
  <td style="padding:12px 0;border-top:1px solid #DCDED9;text-align:right;font-family:Menlo,monospace;font-weight:700">${n(last7.dedupedVisitors || last7.uniques)} ${arrow((m.visitors || {}).change)}</td>
</tr>
<tr>
  <td style="padding:12px 10px 12px 0;border-top:1px solid #EDEEEA">Signups <span style="color:#818A85">(30d)</span></td>
  <td style="padding:12px 0;border-top:1px solid #EDEEEA;text-align:right;font-family:Menlo,monospace;font-weight:700">${n(a.signups30)} ${arrow((m.signups || {}).change)}</td>
</tr>
<tr>
  <td style="padding:12px 10px 12px 0;border-top:1px solid #EDEEEA">Visitor → signup</td>
  <td style="padding:12px 0;border-top:1px solid #EDEEEA;text-align:right;font-family:Menlo,monospace;font-weight:700">${pct(a.conversion30)}</td>
</tr>
<tr>
  <td style="padding:12px 10px 12px 0;border-top:1px solid #EDEEEA">Signed up → actually used it</td>
  <td style="padding:12px 0;border-top:1px solid #EDEEEA;text-align:right;font-family:Menlo,monospace;font-weight:700">${pct(a.activationRate)} <span style="color:#818A85;font-weight:400">(${n(a.activated)}/${n(a.total)})</span></td>
</tr>
<tr>
  <td style="padding:12px 10px 12px 0;border-top:1px solid #EDEEEA"><b>Paying</b></td>
  <td style="padding:12px 0;border-top:1px solid #EDEEEA;text-align:right;font-family:Menlo,monospace;font-weight:700;color:${a.paying ? '#2E7D7B' : '#C7553B'}">${n(a.paying)}</td>
</tr>
<tr>
  <td style="padding:12px 10px 12px 0;border-top:1px solid #EDEEEA;border-bottom:1px solid #DCDED9">Questions asked <span style="color:#818A85">(7d)</span></td>
  <td style="padding:12px 0;border-top:1px solid #EDEEEA;border-bottom:1px solid #DCDED9;text-align:right;font-family:Menlo,monospace;font-weight:700">${n(u.asks7)} ${arrow((m.asks || {}).change)} <span style="color:#818A85;font-weight:400">· ${n(u.activeTechs7)} techs</span></td>
</tr>
</table>

<p style="font-family:Menlo,monospace;font-size:11px;letter-spacing:1.6px;color:#818A85;margin:0 0 8px">LAST 7 DAYS &nbsp;·&nbsp; VIEWS / VISITORS</p>
<table style="width:100%;border-collapse:collapse;margin:0 0 20px">${rows}</table>

${who.length ? `<p style="font-family:Menlo,monospace;font-size:11px;letter-spacing:1.6px;color:#818A85;margin:0 0 8px">WORTH A TEXT</p>
${who.map(x => `<p style="margin:0 0 5px">· ${x}</p>`).join('')}` : ''}

<p style="margin:20px 0 0;color:#7C847F;font-size:13px">Today so far: ${n(today.views)} views / ${n(today.uniques)} visitors. Ask logging started ${(s.askLogStart || '').slice(0, 10)}.</p>
</div>`;
}

let _last = null;
async function sendOnce(opts) {
  const dry = !!(opts && opts.dryRun);
  try {
    const s = await fetchStats();
    const html = buildHtml(s);
    const a = s.accounts || {}, m = s.movement || {};
    const subject = a.paying > 0
      ? `Trazer — ${a.paying} paying, ${(s.traffic.last7 || {}).dedupedVisitors || 0} visitors this week`
      : `Trazer — ${(s.traffic.last7 || {}).dedupedVisitors || 0} visitors, ${a.signups30 || 0} signups, ${a.paying || 0} paying`;

    if (dry) { _last = { at: new Date().toISOString(), dryRun: true, subject }; return { ..._last, html }; }
    if (!RESEND_API_KEY) { log('no RESEND_API_KEY'); return null; }

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Trazer Daily <noreply@trazermike.io>', to: TO, subject, html }),
    });
    const ok = r.ok;
    if (!ok) log('send failed', r.status, (await r.text()).slice(0, 150));
    _last = { at: new Date().toISOString(), sent: ok, subject };
    return _last;
  } catch (e) {
    log('digest failed (non-fatal):', e.message);
    return null;
  }
}

function start() {
  if (process.env.DIGEST_ENABLED !== '1') { log('disabled (set DIGEST_ENABLED=1)'); return; }
  let lastDay = null;
  const tick = () => {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    if (now.getHours() === SEND_HOUR && lastDay !== day) {
      lastDay = day;
      sendOnce({}).catch(() => {});
    }
  };
  const t = setInterval(tick, 10 * 60 * 1000);
  if (t.unref) t.unref();
  log(`scheduled — ${SEND_HOUR}:00 local, daily`);
}

module.exports = { start, sendOnce, status: () => _last };
