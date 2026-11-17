'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const nightlyLearn = require('./lib/nightly-learn');
const fieldAlert = require('./lib/field-alert');
const dailyDigest = require('./lib/daily-digest');

// Diagram-redraw engine — traces an uploaded wiring diagram and renders a clean illustration.
const { extractNetlist, sanitizeNetlist, validateNetlist } = require('./scripts/redraw/extract-netlist.js');
const { renderIllustrationSVG, roleOf } = require('./scripts/redraw/render-illustration-svg.js');
// Small in-memory LRU of freshly-drawn SVGs, served at /diagrams/redraw/:id so the client's existing
// diagram renderer (which only shows /diagrams/ or supabase URLs) can display them without any client change.
const _redrawStore = new Map();
function _storeRedraw(svg) {
  const id = crypto.randomBytes(6).toString('hex');
  _redrawStore.set(id, svg);
  while (_redrawStore.size > 80) _redrawStore.delete(_redrawStore.keys().next().value);
  return id;
}

const app = express();
const PORT = process.env.PORT || 3000;

// ── ENVIRONMENT ───────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY    = process.env.ANTHROPIC_API_KEY;
const ELEVENLABS_API_KEY   = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID  = process.env.ELEVENLABS_VOICE_ID || 'ErXwobaYiN019PkySvjV';
// GROQ_API_KEY — speech-to-text for the LOCKED part of a Mike voice call. iOS forbids the
// on-device Neural Engine from running while the phone is in a pocket (proven on Brandon's
// device 2026-09-25: "Unable to compute the prediction using a neural network model"), so
// the locked leg sends audio here and the server transcribes it via Groq Whisper. Optional:
// if unset, /api/transcribe returns 503 and the app stays on its on-device (screen-on) path.
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const STRIPE_SECRET_KEY    = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET= process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PRICE_HOMEOWNER = process.env.STRIPE_PRICE_HOMEOWNER;
const STRIPE_PRICE_STARTER   = process.env.STRIPE_PRICE_STARTER;
const STRIPE_PRICE_PRO       = process.env.STRIPE_PRICE_PRO;
const STRIPE_PRICE_TEAM      = process.env.STRIPE_PRICE_TEAM;
const APP_URL = process.env.APP_URL || 'https://nodejs-production-cb99f.up.railway.app';
const RESEND_API_KEY = process.env.RESEND_API_KEY; // Optional — password reset emails

// ── NO-CARD 14-DAY TRIAL (new signups only) ───────────────────────────────────
// New techs sign up with NO card → 14 days of full Mike → card collected on day 15.
// (Was card-upfront until 2026-08-07; the card in front of the product converted 66
// site visitors into zero signups. The trial now has to earn the card, not precede it.)
const TRIAL_DAYS = 14;
// EVERYONE PAYS (Brandon, 2026-10-26: "everyone pays $50, founders included — it's a
// business"). Two grandfather paths used to exist and BOTH are retired by that decision:
//   1. The created_at < CARD_WALL_CUTOFF time window (the old belt-and-suspenders) —
//      constants CARD_WALL_CUTOFF / CARD_WALL_CUTOFF_MS removed with it.
//   2. 'founder' as a forever-free plan — it is no longer in ALLOWED_PLANS. The plan
//      value itself stays on the rows (checkPaywall uses it to serve founder-specific
//      wall copy at the founding rate), but it no longer grants free access.
// Plans that always have access (paying + legacy). 'beta' = pre-Phase-1 legacy and the
// smoke-test harness account — must keep working; 'homeowner' = revivable legacy.
const ALLOWED_PLANS = ['admin', 'pro', 'team', 'starter', 'beta', 'homeowner'];

// JWT_SECRET signs every auth token. Must be set in Railway env vars — a missing
// secret means tokens from a previous deploy would be accepted, which is worse
// than refusing to start.
const JWT_SECRET = process.env.JWT_SECRET;

if (!ANTHROPIC_API_KEY) { console.error('FATAL: ANTHROPIC_API_KEY not set'); process.exit(1); }
if (!JWT_SECRET) { console.error('FATAL: JWT_SECRET not set'); process.exit(1); }
if (STRIPE_SECRET_KEY && !STRIPE_WEBHOOK_SECRET) { console.warn('WARNING: STRIPE_SECRET_KEY is set but STRIPE_WEBHOOK_SECRET is missing — webhook signature verification is DISABLED. Fake "paid" events could upgrade accounts. Set STRIPE_WEBHOOK_SECRET before accepting payments.'); }

// bcrypt cost factor — 12 rounds is ~250ms on modern hardware, which is painful
// enough for attackers while imperceptible to users logging in.
const BCRYPT_ROUNDS = 12;

// ── HELPERS ───────────────────────────────────────────────────────────────────
let globalActive = 0;
const MAX_GLOBAL = 100;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      if ((res.status === 529 || res.status === 503) && i < retries) { await sleep(1000*(i+1)); continue; }
      return res;
    } catch (err) {
      if (i === retries) throw err;
      await sleep(1000*(i+1));
    }
  }
}

// ── MODEL FAILOVER ────────────────────────────────────────────────────────────
// 2026-06-24 Mike went fully dark for a day: claude-opus-4-8 — the single model he
// runs on — had an upstream incident and every tech got "error, try again". The key
// was fine, the bill was fine, the code was fine. One model was down and Mike had
// nowhere else to go.
//
// This is the answer to that specific failure. The chain is tried in order and the
// FIRST model that responds wins. Ordering is deliberate: the primary first, then
// the nearest-capability sibling, so a degraded Mike still sounds like Mike.
//
// Scope, honestly: this survives ONE MODEL being down, which is what actually
// happened. It does not survive the whole vendor being down — that needs a second
// provider (Claude on Bedrock/Vertex) and a second credential, which is a separate
// build. Named so nobody mistakes this for more coverage than it gives.
//
// Safety note: every model's output still passes through the deterministic
// safety/pricing guard downstream — the guard runs on `outText`, after the call, so
// a fallback model cannot route around the homeowner-pricing rule or the capacitor
// strip. Failover changes WHO answers, never WHAT is allowed through.
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
// 2026-10-29 Claude 5 generation. Opus 5 is the same price as Opus 4.8 and a straight
// capability upgrade; the chain steps DOWN one generation per hop so a degraded Mike
// still sounds like Mike. Every model here accepts output_config.effort (GA on 4.7+
// and the 5 family) — if an env override ever pins a pre-4.7 model, that model will
// 400 on effort and the request fails rather than falls over (400 is our bug, not an
// outage; see isFailoverStatus).
const PRIMARY_MODEL = process.env.MIKE_MODEL || 'claude-opus-5';
const MODEL_CHAIN = (function () {
  const extra = (process.env.MIKE_MODEL_FALLBACKS || 'claude-opus-4-8,claude-sonnet-5')
    .split(',').map(m => m.trim()).filter(Boolean);
  return [PRIMARY_MODEL].concat(extra.filter(m => m !== PRIMARY_MODEL));
})();

// Retry-the-next-model statuses. 429 is included because a per-model rate ceiling
// leaves a tech just as stuck as an outage does. 404 is included because our URL is a
// constant that never changes — a 404 here can only mean "this model ID no longer
// exists" (retired upstream), and a retired model on one chain entry must not take
// Mike dark when the next entry still answers. Other 4xx (400/401) are OUR bug
// (bad request, bad key) — trying another model would just fail three times slower.
function isFailoverStatus(code) {
  return code === 404 || code === 429 || code === 500 || code === 502 || code === 503 || code === 504 || code === 529;
}

// Reports which model answered so a degraded state is visible instead of silent.
let lastModelUsed = PRIMARY_MODEL;
let failoverCount = 0;
// Brain truth for /api/health (2026-10-31): the brain was dead 12 hours on an
// out-of-credits 502 while health reported ok:true — and the external watchdog,
// reading only that, green-lit the outage. These record the last REAL model
// success and the last end-of-chain failure, so the watchdog can read the brain
// instead of just the web server.
let lastBrainOkAt = 0;
let lastBrainFailAt = 0;

// Walks MODEL_CHAIN until one answers. `opts.stream` picks the raw fetch (SSE needs
// the live body) over fetchWithRetry. Returns the winning response plus the model
// that produced it. An aborted request (client hung up / 55s timeout) stops the walk
// immediately — the tech is already gone, so burning their wait on another model is
// worse than failing fast.
async function callModelWithFailover(baseBody, fetchOpts, opts) {
  const useStream = !!(opts && opts.stream);
  let lastRes = null, lastErr = null;

  for (let i = 0; i < MODEL_CHAIN.length; i++) {
    const model = MODEL_CHAIN[i];
    // One sanitize-retry per hop: output_config.effort and web_search_20260209 are
    // version-pinned to the 4.7+/5 generation. If an env override ever pins an older
    // model, that model 400s on these fields — and a 400 does NOT walk the chain
    // (correctly: it's our request, not an outage). Without this, a stale MIKE_MODEL
    // set from Brandon's phone during an incident would take Mike fully dark. So on a
    // 400 that names these fields, strip them and retry the SAME model once.
    let bodyForModel = Object.assign({}, baseBody, { model });
    for (let attempt = 0; attempt < 2; attempt++) {
      const attemptOpts = Object.assign({}, fetchOpts, { body: JSON.stringify(bodyForModel) });

    try {
      const res = useStream
        ? await fetch(ANTHROPIC_URL, attemptOpts)
        : await fetchWithRetry(ANTHROPIC_URL, attemptOpts);

      if (res && res.ok) {
        lastModelUsed = model;
        lastBrainOkAt = Date.now();
        if (i > 0) {
          failoverCount++;
          console.warn(`[failover] ${MODEL_CHAIN[0]} unavailable — answered on ${model} (fallback #${i})`);
        }
        return { res, model, degraded: i > 0 };
      }

      if (res && res.status === 400 && attempt === 0 && (bodyForModel.output_config || bodyForModel.tools)) {
        // Sanitize on ANY first-attempt 400, not on error-message wording — upstream
        // copy changes must never decide whether Mike survives a stale model pin.
        // A genuinely malformed request just 400s again sanitized and returns below.
        console.warn(`[failover] ${model} returned 400 with Claude-5-era fields present — retrying once sanitized`);
        try { if (res.body && res.body.cancel) res.body.cancel(); } catch {}
        bodyForModel = Object.assign({}, bodyForModel);
        delete bodyForModel.output_config;
        if (Array.isArray(bodyForModel.tools)) {
          bodyForModel.tools = bodyForModel.tools.map(t =>
            t && t.type === 'web_search_20260209' ? Object.assign({}, t, { type: 'web_search_20250305' }) : t);
        }
        continue; // retry same model, sanitized
      }

      lastRes = res;
      if (!res || !isFailoverStatus(res.status) || i === MODEL_CHAIN.length - 1) {
        // End of the line: a non-ok response is what the caller gets. A 400 is OUR bug
        // (malformed request), not an outage — it must not latch suspectDown until the
        // next success on an idle night. 401/403 (dead or disabled key) ARE outages —
        // the exact 2026-10-26 class — so they keep stamping.
        if (!res || res.status !== 400) lastBrainFailAt = Date.now();
        return { res, model, degraded: i > 0 };
      }
      console.warn(`[failover] ${model} returned ${res.status} — trying ${MODEL_CHAIN[i + 1]}`);
      break; // walk to the next model in the chain
    } catch (err) {
      // Don't keep walking a chain the caller already abandoned.
      if (err && (err.name === 'AbortError' || err.code === 'ABORT_ERR')) throw err;
      lastErr = err;
      if (i === MODEL_CHAIN.length - 1) { lastBrainFailAt = Date.now(); throw err; }
      console.warn(`[failover] ${model} threw "${err.message}" — trying ${MODEL_CHAIN[i + 1]}`);
      break; // network-level error on this model — walk to the next one
    }
    } // end sanitize-retry attempts for this model
  }

  lastBrainFailAt = Date.now(); // whole chain walked and nothing answered
  if (lastRes) return { res: lastRes, model: MODEL_CHAIN[MODEL_CHAIN.length - 1], degraded: true };
  throw lastErr || new Error('all models unavailable');
}

// ── SUPABASE HELPER ───────────────────────────────────────────────────────────
async function supabase(method, table, body, query = '') {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  // 10s timeout — matches the AbortController pattern used by the AI (1167) and TTS
  // (1223) routes. Without this, a stalled/paused Supabase makes fetch hang forever,
  // which freezes the calling route (e.g. /api/auth/signin stuck on "Signing in…").
  // On timeout we abort → fetch rejects → caught below → return null, so callers get
  // the same clean failure they already handle for any null result.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': method === 'POST' ? 'return=representation' : 'return=representation',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.text().catch(()=>'');
      console.error(`Supabase ${method} ${table} error:`, res.status, err.substring(0,200));
      return null;
    }
    return res.json().catch(()=>null);
  } catch (e) {
    console.error(`Supabase ${method} ${table} timeout/abort:`, e.name === 'AbortError' ? 'timed out after 10s' : e.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ── PASSWORD HASHING ──────────────────────────────────────────────────────────
// bcrypt is intentionally slow — designed to resist GPU cracking.
// SHA-256 HMAC (the old approach) is fast by design and GPU-crackable.
// On first successful login with old hash format, we transparently upgrade the
// stored hash to bcrypt so users don't need a forced password reset.
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password, storedHash) {
  // Detect legacy SHA-256 HMAC format: "hexhash:hexsalt" (both 64 and 32 hex chars)
  // Legacy format was stored as separate password_hash and password_salt columns.
  // This function only receives the bcrypt hash; legacy verification is handled
  // inline in signin where we have access to both columns.
  return bcrypt.compare(password, storedHash);
}

// Verify a legacy SHA-256 HMAC password (used during transparent migration)
function verifyLegacyPassword(password, hash, salt) {
  const h = crypto.createHmac('sha256', salt).update(password).digest('hex');
  return h === hash;
}

// ── JWT AUTH ──────────────────────────────────────────────────────────────────
// Tokens are HS256 JWTs, signed with JWT_SECRET. 30-day expiry.
// Payload: { id, email, pv? } — minimal surface area.
// pv = password-version: a short HMAC of the stored password hash, carried in the token
// so the sliding renewal in /api/ai can refuse to extend a session issued against an OLD
// password. Without it, renewal would quietly repeal the 30-day backstop — a stolen token
// could re-up forever and a password reset would never evict the thief.
function pwdVersion(hash) {
  return crypto.createHmac('sha256', JWT_SECRET).update('pv|' + (hash || '')).digest('hex').slice(0, 12);
}
function signToken(user) {
  const payload = { id: user.id, email: user.email };
  if (user.password_hash) payload.pv = pwdVersion(user.password_hash);
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d', algorithm: 'HS256' });
}

// ── AUTH MIDDLEWARE ───────────────────────────────────────────────────────────
// Single place to verify tokens — apply to every protected route.
// Routes receive req.user = { id, email } after passing through this.
// Previously each route decoded a base64 token inline — one bug there meant
// every route had the same bug. One middleware means one place to audit.
function authenticateToken(req, res, next) {
  // Support token in Authorization header (Bearer <token>) or request body.
  // Body-based token is kept for backwards compatibility with existing frontend.
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.slice(7)
    : req.body?.token || req.query?.token;

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    // jwt.verify throws JsonWebTokenError, TokenExpiredError, NotBeforeError
    const msg = err.name === 'TokenExpiredError' ? 'Session expired — please sign in again' : 'Invalid token';
    return res.status(401).json({ error: msg });
  }
}

// Admin-only gate — always follows authenticateToken so req.user is set.
// Checks role === 'admin' in the DB; plan field is billing data, not auth level.
async function requireAdmin(req, res, next) {
  if (!SUPABASE_URL) return next(); // no DB = dev mode, allow
  try {
    const admins = await supabase('GET', 'users', null,
      `?email=eq.${encodeURIComponent(req.user.email)}&select=role`);
    // 503, not 403. During a Supabase outage the admin dashboard is exactly where
    // Brandon goes to diagnose it, and "Access denied" sends him hunting a permissions
    // bug that does not exist. Same null-means-two-things trap as checkPaywall.
    if (admins === null)
      return res.status(503).json({ error: 'Database unavailable — try again in a moment' });
    if (!admins[0] || admins[0].role !== 'admin')
      return res.status(403).json({ error: 'Access denied' });
    next();
  } catch (err) {
    console.error('Admin check error:', err.message);
    res.status(500).json({ error: 'Authorization check failed' });
  }
}

// Allows a global admin (sees ALL companies) OR a company owner (locked to their own
// company). Attaches req.scope = { role, all, company }. Data routes MUST honour
// req.scope so an owner can NEVER see another company's techs or events. The company
// is read from the DB by the authenticated email — never from client input.
async function requireAdminOrOwner(req, res, next) {
  if (!SUPABASE_URL) { req.scope = { role: 'admin', all: true, company: null }; return next(); }
  try {
    const rows = await supabase('GET', 'users', null,
      `?email=eq.${encodeURIComponent(req.user.email)}&select=role,company`);
    if (rows === null)
      return res.status(503).json({ error: 'Database unavailable — try again in a moment' });
    const u = rows[0];
    if (!u) return res.status(403).json({ error: 'Access denied' });
    if (u.role === 'admin') { req.scope = { role: 'admin', all: true, company: null }; return next(); }
    if (u.role === 'owner') {
      const company = (u.company || '').trim();
      if (!company) return res.status(403).json({ error: 'Owner account has no company set' });
      req.scope = { role: 'owner', all: false, company };
      return next();
    }
    return res.status(403).json({ error: 'Access denied' });
  } catch (err) {
    console.error('Admin/owner check error:', err.message);
    res.status(500).json({ error: 'Authorization check failed' });
  }
}

// ── INPUT VALIDATION HELPERS ──────────────────────────────────────────────────
// Lightweight validation without a full schema library — keeps the dep count low.
// Validates that email is a real-looking address before it ever touches a DB query.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(e) { return typeof e === 'string' && EMAIL_RE.test(e.trim()); }

// UUIDs from Supabase — reject anything that isn't one before it hits a query string.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(id) { return typeof id === 'string' && UUID_RE.test(id); }

// Sanitise a string to only printable non-special chars for use in query strings.
// This is belt-and-suspenders — Supabase parameterises on their end, but we
// validate before we ever construct the query string.
function sanitiseString(s, maxLen = 255) {
  if (typeof s !== 'string') return null;
  const t = s.trim().substring(0, maxLen);
  // Reject strings containing Supabase PostgREST injection patterns
  if (/[<>'"`;{}()|\\]/.test(t)) return null;
  return t;
}

// ── RATE LIMITERS ─────────────────────────────────────────────────────────────
// Auth endpoints get the tightest limit — they're the primary brute-force surface.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,                      // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts — please wait 15 minutes before trying again' },
});

// AI endpoint: more generous but still rate-limited per IP to control costs.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minute
  max: 20,                       // 20 AI requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit exceeded — please wait a moment' },
});

// TTS endpoint: per-IP cap to protect the ElevenLabs quota from drain.
// Mike speaks in short bursts during chat/onboarding/camera; 40/min/IP is generous
// for a single active user while still blocking abuse. (Security fix C3.)
const ttsLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minute
  max: 40,                       // 40 TTS requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Voice rate limit exceeded — please wait a moment' },
});

// Global fallback — catches anything that slips through endpoint-specific limits.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minute
  max: 100,                      // 100 requests per IP per minute globally
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down' },
});

// ── EMAIL (Resend) ────────────────────────────────────────────────────────────
// Sends transactional email via Resend API. No SDK — plain fetch.
// Gated by RESEND_API_KEY — if not set, logs and returns false silently.
async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.log(`[email skipped — no RESEND_API_KEY] to=${to} subject="${subject}"`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // 2026-08-18 — WAS HARDCODED TO AN UNREGISTERED DOMAIN. trazerintelligence.com is
        // not registered by anyone, so even with a mail provider connected every send would
        // be rejected or spam-filed. Password reset has therefore NEVER worked in production:
        // sendEmail() logs "skipped" and returns false, while the UI still says "check your
        // email" — a paying tech who forgets his password is locked out permanently with no
        // other way in. Default is now trazermike.io, which we actually own (Cloudflare,
        // paid through 2027). Overridable so the sending identity can change without a deploy.
        from: process.env.MAIL_FROM || 'Mike at Trazer <noreply@trazermike.io>',
        // A no-reply sender that black-holes replies is how you lose the one tech who
        // WAS trying to tell you something. He can't send FROM the Gmail (nobody owns
        // gmail.com but Google, and mail forging it gets binned), but a reply should
        // still reach a box Brandon actually reads.
        reply_to: process.env.MAIL_REPLY_TO || 'trazerintelligence@gmail.com',
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.error('Resend error:', res.status, err.substring(0, 200));
      return false;
    }
    console.log(`Email sent: to=${to} subject="${subject}"`);
    return true;
  } catch (err) {
    console.error('Email send error:', err.message);
    return false;
  }
}

// Generate a time-limited password reset token.
// Token format: base64url( userId + ':' + expiry + ':' + HMAC )
// Expiry: 1 hour. HMAC prevents forgery without JWT overhead.
function generateResetToken(userId) {
  const expiry = Date.now() + 60 * 60 * 1000; // 1 hour
  const data = `${userId}:${expiry}`;
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('hex');
  return Buffer.from(`${data}:${sig}`).toString('base64url');
}

function verifyResetToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;
    const [userId, expiry, sig] = parts;
    if (Date.now() > parseInt(expiry, 10)) return null; // expired
    const data = `${userId}:${expiry}`;
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('hex');
    if (sig !== expected) return null; // tampered
    return userId;
  } catch {
    return null;
  }
}


// CRITICAL ORDER: Stripe webhook MUST be registered before express.json() because
// it needs the raw body for HMAC signature verification. JSON parsing corrupts it.
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  // If Stripe is live but we cannot verify signatures, this used to 200-ACK and DISCARD
  // every event. Stripe records successful delivery and never retries, so payments
  // succeed and nobody is ever upgraded — silently, forever, behind a startup
  // console.warn nobody reads. A 500 keeps the events on Stripe's retry ladder until the
  // secret is set, so nothing is lost.
  if (STRIPE_SECRET_KEY && !STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET missing — cannot verify. Returning 500 so Stripe retries instead of dropping paid events.');
    return res.status(500).json({ error: 'webhook not configured' });
  }
  if (!STRIPE_SECRET_KEY) return res.json({ok:true});   // Stripe genuinely not in use
  
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    // Manual webhook signature verification (no stripe npm needed).
    // Stripe signs: HMAC-SHA256( t=<timestamp>.<raw_body>, STRIPE_WEBHOOK_SECRET )
    const payload = req.body.toString();
    const elements = sig.split(',');
    const timestamp = elements.find(e=>e.startsWith('t=')).split('=')[1];
    const signatures = elements.filter(e=>e.startsWith('v1=')).map(e=>e.split('=')[1]);
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSig = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(signedPayload).digest('hex');

    // Stripe recommends also validating the timestamp to reject replayed webhooks
    // (within 5 min tolerance). See: https://stripe.com/docs/webhooks/signatures
    const webhookAge = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
    if (webhookAge > 300) {
      console.error('Webhook timestamp too old:', webhookAge, 'seconds');
      return res.status(400).json({ error: 'Webhook expired' });
    }
    
    if (!signatures.includes(expectedSig)) {
      console.error('Webhook signature mismatch');
      return res.status(400).json({error: 'Invalid signature'});
    }
    
    event = JSON.parse(payload);
  } catch(err) {
    console.error('Webhook parse error:', err.message);
    return res.status(400).json({error: 'Webhook error'});
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_email || session.metadata?.email;
      const plan = session.metadata?.plan || 'starter';
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      
      // MONEY ALREADY CHANGED HANDS. The PATCH result was never checked and
      // "Plan activated" was printed unconditionally on the next line, so a Supabase
      // wobble produced: customer charged, plan never upgraded, log claiming success,
      // and a 200 telling Stripe never to retry. Throw instead — the outer catch now
      // returns 500 and Stripe's own retry ladder does the work.
      if (!email) throw new Error(`checkout.session.completed with no email (session ${session.id})`);
      if (SUPABASE_URL) {
        const rows = await supabase('PATCH', 'users', {
          plan,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan_started_at: new Date().toISOString(),
        }, `?email=eq.${encodeURIComponent(email)}`);
        if (!rows || !rows[0]) throw new Error(`plan PATCH did not land for ${email} → ${plan}`);
        console.log(`Plan activated: ${email} → ${plan}`);
      }
    }
    
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      // Downgrade to trial/free when subscription cancelled
      if (SUPABASE_URL) {
        const rows = await supabase('PATCH', 'users', {
          plan: 'trial',
          stripe_subscription_id: null,
        }, `?stripe_subscription_id=eq.${sub.id}`);
        if (!rows) throw new Error(`downgrade PATCH failed for subscription ${sub.id}`);
        console.log(`Subscription cancelled: ${sub.id}`);
      }
    }

    // Trial ends in 3 days (Stripe fires this automatically) → branded reminder, no charge yet.
    if (event.type === 'customer.subscription.trial_will_end') {
      const sub = event.data.object;
      const email = sub.metadata?.email;
      if (email) {
        await sendEmail({
          to: email,
          subject: 'Your Mike free trial ends in 3 days',
          html: `<p>Heads up — your 14-day free trial ends in 3 days.</p>
                 <p>Nothing to do: you'll be charged <strong>$50/mo</strong> and keep full access to Mike.
                 Want to cancel? Do it anytime from your account, no charge if you cancel before the trial ends.</p>
                 <p>— Mike @ Trazer</p>`,
        });
        console.log(`Trial-ending reminder sent: ${email}`);
      }
    }

    // Payment failed → GRACE: Stripe smart-retries over several days and the tech keeps access
    // during retries. We do NOT downgrade here — only a final failure fires subscription.deleted
    // (handled above). Just nudge the tech to fix the card.
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const email = invoice.customer_email || invoice.metadata?.email;
      console.log(`Payment failed for customer: ${invoice.customer} (${email || 'no email'}) — grace/retry, access retained`);
      if (email) {
        await sendEmail({
          to: email,
          subject: 'Your Mike payment didn’t go through — please update your card',
          html: `<p>We couldn’t process your $50/mo payment. No worries — your access to Mike is still on
                 while we retry over the next few days.</p>
                 <p>Please update your card to avoid any interruption: <a href="${APP_URL}">open Mike</a> → Account → Billing.</p>
                 <p>— Mike @ Trazer</p>`,
        });
      }
    }
  } catch(err) {
    // 500, NOT 200. Returning {received:true} on a failure told Stripe the event was
    // handled, so it never retried and the failure was unrecoverable and invisible. A
    // 5xx puts the event back on Stripe's retry ladder, which is built for exactly this.
    console.error('Webhook handler error:', event && event.type, err.message);
    try {
      logUsage(null, 'webhook_failed', { type: event && event.type, id: event && event.id, err: String(err.message).slice(0, 200) });
    } catch (_) {}
    return res.status(500).json({ error: 'handler failed — please retry' });
  }

  res.json({received: true});
});

// Global rate limit applies to everything except the webhook (which has its own sig check)
app.use(globalLimiter);

app.use(express.json({ limit: '25mb' }));

// CORS — only allow our own app origin (and localhost in dev).
// Without this, any website can make credentialed cross-origin requests to our API.
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin (no origin header) and our known origins
    const allowed = [APP_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'];
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Helmet sets ~14 security headers by default (HSTS, CSP, referrer-policy, etc.)
// CSP is configured to allow the external services this app calls from the client side.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],      // Needed: inline <script> blocks in index.html
      // CRITICAL: scriptSrcAttr defaults to 'none' in Helmet, which blocks every onclick="" attribute
      // on every element silently (no console error). public/index.html has 150+ inline onclick handlers
      // — auth buttons, modal buttons, role pickers, etc. Without this directive, every click is dead.
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      // media-src: blob: is required for mikeSayCamera's URL.createObjectURL audio playback.
      // data: is required for the iOS silent-audio primer and primeCameraAudio's data-URL MP3.
      mediaSrc: ["'self'", 'blob:', 'data:'],
      manifestSrc: ["'self'", 'data:'],
      connectSrc: [
        "'self'",
        'https://api.anthropic.com',
        'https://api.elevenlabs.io',
        'https://js.stripe.com',
        'https://api.stripe.com',
        'https://nominatim.openstreetmap.org',
        APP_URL,
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  // HSTS: tell browsers to always use HTTPS for 1 year
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));

// ── TRAFFIC ANALYTICS ─────────────────────────────────────────────────────────
// Counts visitors to trazermike.io. Before this, anyone who landed on the site and
// left without signing up was completely invisible — we could only see people who
// already had accounts, which told us nothing about whether traffic or the pitch
// was the problem.
//
// Deliberately server-side and cookie-less: no third-party script, no consent
// banner, no change to public/index.html. Visitors are counted by a SALTED HASH of
// IP+user-agent that is never stored or reversible — we learn "how many people",
// never "which person".
//
// Storage: the events table requires a real user_id (FK), so per-visit rows aren't
// possible for anonymous traffic. Instead we keep counters in memory and flush ONE
// aggregate row per day, owned by the admin account and typed 'site_traffic'. That
// type is filtered out of the per-tech rollup so it can't distort those numbers.
const _traffic = { day: null, views: 0, uniques: new Set(), refs: {}, paths: {}, rowId: null, bots: 0 };
// Max visitor hashes stored per day (16 chars each). 5000 ≈ 80KB — far above current
// traffic, and the union math degrades gracefully to per-day counts above it.
const TRAFFIC_HASH_CAP = 5000;
let _adminIdCache = null;

// Days are bucketed in EASTERN time, not UTC. Brandon reads these numbers, and a UTC
// day rolls over at 8pm his time — "Today" would appear to reset mid-evening.
// en-CA formats as YYYY-MM-DD; the timeZone option handles DST by itself.
const _ET_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' });
function _dayET(d) { return _ET_DAY.format(d instanceof Date ? d : new Date(d)); }
function _today() { return _dayET(new Date()); }

// EVERY CRAWLER COUNTED AS A VISITOR. The counter took any GET that asked for HTML,
// so search bots, uptime pingers, security scanners and link previewers all landed in
// the same bucket as a technician. That is not a rounding error: on 2026-08-29 it
// reported 678 visitors for the week against 7 referrals from the entire outside
// world, and produced the conclusion "people are visiting and not converting" when
// the truth was closer to "almost nobody real is arriving". A number that drives
// decisions has to be a number you can trust.
//
// Deliberately conservative: match on the self-identifying substrings crawlers put in
// their user-agent. A bot that lies about its UA still gets counted, so this is a
// floor on bot traffic, never a ceiling — the human number stays honest by erring
// toward over-counting humans, not under.
const BOT_UA = /(bot|crawl|spider|slurp|scrape|curl\/|wget|python-requests|python-urllib|go-http|java\/|okhttp|libwww|httpclient|headless|phantomjs|puppeteer|playwright|lighthouse|pingdom|uptime|monitor|statuscake|semrush|ahrefs|mj12|dotbot|petalbot|bingpreview|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|embedly|preview)/i;
function _looksLikeBot(req) {
  const ua = String(req.headers['user-agent'] || '');
  if (!ua) return true;                 // no UA at all is not a person on a phone
  return BOT_UA.test(ua);
}

function _visitorHash(req) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';
  const ua = req.headers['user-agent'] || '';
  return crypto.createHmac('sha256', JWT_SECRET).update(ip + '|' + ua).digest('hex').slice(0, 16);
}

// STABLE anonymous identity for the free-question counter.
// Railway sits behind a multi-hop proxy: x-forwarded-for[0] is a ROTATING edge IP, not the
// client, so IP-based keying counts every request as a new visitor and the free cap never
// enforces (verified on prod 2026-09-11 — even a pinned XFF produced a fresh hash each call).
// So we prefer a client-generated device id (localStorage, sent as x-trazer-did) which is
// stable across app close/reopen — exactly the bypass that was reported. It falls back to the
// IP hash when no id is present. A determined user can clear localStorage; a normal one who
// closes and reopens the app cannot, which is the real-world case.
function _tasteKey(req) {
  const did = String((req.headers['x-trazer-did'] || (req.body && req.body.did) || '')).slice(0, 64);
  if (/^[A-Za-z0-9_-]{8,64}$/.test(did))
    return crypto.createHmac('sha256', JWT_SECRET).update('did|' + did).digest('hex').slice(0, 16);
  return _visitorHash(req);
}

function _rollDay() {
  const d = _today();
  if (_traffic.day !== d) {
    _traffic.day = d; _traffic.views = 0; _traffic.uniques = new Set();
    _traffic.refs = {}; _traffic.paths = {}; _traffic.rowId = null; _traffic.bots = 0;
  }
}

// Count real page loads only — not API calls, not images, not the service worker.
app.use((req, res, next) => {
  try {
    if (req.method === 'GET'
        && !req.path.startsWith('/api/')
        && !/\.[a-z0-9]{2,5}$/i.test(req.path)
        && String(req.headers.accept || '').includes('text/html')) {
      _rollDay();
      // Count bots SEPARATELY rather than dropping them silently. If this number is
      // huge it is itself the finding, and a silent filter would hide a traffic
      // source that suddenly went missing.
      if (_looksLikeBot(req)) { _traffic.bots = (_traffic.bots || 0) + 1; return next(); }
      _traffic.views++;
      _traffic.uniques.add(_visitorHash(req));
      let ref = 'direct';
      const r = req.headers.referer || req.headers.referrer;
      if (r) { try { ref = new URL(r).hostname.replace(/^www\./, ''); } catch { ref = 'other'; } }
      if (ref === 'trazermike.io') ref = 'internal';
      _traffic.refs[ref] = (_traffic.refs[ref] || 0) + 1;
      const p = req.path === '/' ? '/' : req.path.slice(0, 60);
      _traffic.paths[p] = (_traffic.paths[p] || 0) + 1;
    }
  } catch { /* analytics must never break a page load */ }
  next();
});

async function _adminUserId() {
  if (_adminIdCache) return _adminIdCache;
  if (!SUPABASE_URL) return null;
  const rows = await supabase('GET', 'users', null, `?role=eq.admin&select=id&limit=1`);
  _adminIdCache = (rows && rows[0] && rows[0].id) || null;
  return _adminIdCache;
}

// Persist the running day's counters. Called on a timer; safe to call repeatedly.
async function flushTraffic() {
  try {
    if (!SUPABASE_URL || !_traffic.day || _traffic.views === 0) return;
    const uid = await _adminUserId();
    if (!uid) return;
    // 2026-08-18 — `uniques` is a PER-DAY count, and the dashboard used to SUM it across
    // a range. A tech who opens Mike every day for 30 days counted as 30 unique visitors,
    // so our own users inflated the top of the funnel and made conversion read far worse
    // than it is. Persist the day's hashes (already salted + irreversible) so a 7d/30d
    // figure can be a real UNION instead of a sum. Capped so the payload can't grow
    // unbounded on a traffic spike; over the cap we degrade to the old count and say so.
    const hashList = [..._traffic.uniques];
    const payload = {
      date: _traffic.day,
      views: _traffic.views,
      uniques: _traffic.uniques.size,
      // Kept so a drop in real traffic can never be mistaken for a drop in crawling,
      // and so the size of what we now exclude is visible rather than assumed.
      bots: _traffic.bots || 0,
      hashes: hashList.length <= TRAFFIC_HASH_CAP ? hashList : null,
      hashesTruncated: hashList.length > TRAFFIC_HASH_CAP,
      refs: _traffic.refs,
      paths: _traffic.paths,
    };
    if (!_traffic.rowId) {
      // A redeploy wipes rowId but NOT the day's row. Adopt it and absorb its counters ONCE,
      // otherwise every restart forks the day into another row and the reader has to guess.
      const existing = await supabase('GET', 'events', null,
        `?type=eq.site_traffic&payload->>date=eq.${_traffic.day}&select=id,payload&limit=1`);
      if (existing && existing[0]) {
        const ep = existing[0].payload || {};
        payload.views += ep.views || 0;
        for (const h of (Array.isArray(ep.hashes) ? ep.hashes : [])) _traffic.uniques.add(h);
        for (const [k, n] of Object.entries(ep.refs || {})) payload.refs[k] = (payload.refs[k] || 0) + n;
        for (const [k, n] of Object.entries(ep.paths || {})) payload.paths[k] = (payload.paths[k] || 0) + n;
        const merged = [..._traffic.uniques];
        payload.uniques = merged.length;
        payload.hashes = merged.length <= TRAFFIC_HASH_CAP ? merged : null;
        payload.hashesTruncated = merged.length > TRAFFIC_HASH_CAP;
        _traffic.views = payload.views;
        _traffic.rowId = existing[0].id;
      }
    }
    if (_traffic.rowId) {
      await supabase('PATCH', 'events', { payload }, `?id=eq.${_traffic.rowId}`);
    } else {
      const rows = await supabase('POST', 'events',
        { user_id: uid, type: 'site_traffic', payload, company: '__system' });
      if (rows && rows[0]) _traffic.rowId = rows[0].id;
    }
  } catch (e) { console.error('traffic flush failed (non-fatal):', e.message); }
}
setInterval(flushTraffic, 5 * 60 * 1000).unref?.();

// Fire-and-forget usage logging. Never awaited by a request path — a logging
// failure must never cost a tech their answer.
function logUsage(userId, type, payload = {}) {
  if (!userId || !SUPABASE_URL) return;
  supabase('POST', 'events', { user_id: userId, type, payload })
    .catch(e => console.error('usage log failed (non-fatal):', e.message));
}

// ── MIKE MEMORY (Phase 1) — self-evolving per-tech memory, the SOUL of the product ──────────
// Stored server-side, account-keyed, so web chat AND the native voice call read/write ONE memory
// (both go through /api/ai). Kept as a sub-key of users.profile so it needs no schema migration —
// and ALWAYS merged into the existing profile, never a wholesale overwrite (a wholesale PATCH once
// blanked a live profile; that must never recur). Two layers now: a rolling natural-language
// `summary` (always injected) + structured `facts` (name, region, brands, tone…). Episodic recall +
// the ADD/UPDATE/DELETE reconcile loop are Phase 2/3.
async function getUserMemory(uid) {
  if (!uid) return null;
  try {
    const rows = await supabase('GET', 'users', null, `?id=eq.${encodeURIComponent(uid)}&select=profile`);
    const prof = Array.isArray(rows) && rows[0] ? (rows[0].profile || {}) : {};
    return prof.mikeMemory || null;
  } catch { return null; }
}

// Build the context Mike sees at the START of every call/chat — "what you already know about this tech."
function buildMemoryContext(mem) {
  if (!mem || (!mem.summary && !(mem.facts && Object.keys(mem.facts).length))) return '';
  let out = '\n\n=== WHAT YOU ALREADY KNOW ABOUT THIS TECH (your memory of him) ===\n'
    + 'Use this to talk like a partner who remembers him — pick up where you left off, catch callbacks '
    + '("weren\'t we on a similar unit the other day?"). Never re-introduce yourself to a tech you know. '
    + 'Do not recite this back verbatim; just know it.\n';
  if (mem.facts && Object.keys(mem.facts).length) out += 'Facts: ' + JSON.stringify(mem.facts) + '\n';
  if (mem.summary) out += 'Recent history: ' + mem.summary + '\n';
  // THEIR Mike: durable work-style rules this tech has asked for ("shorter answers", "skip the
  // 101 safety talk", "more sales help"). Style and focus ONLY — the deterministic safety guards,
  // the honesty gate and all pricing rules live outside this prompt and can never be adapted away.
  if (Array.isArray(mem.workstyle) && mem.workstyle.length) {
    out += 'HOW THIS TECH WANTS YOU TO WORK (he asked; honor it): ' + mem.workstyle.slice(0, 8).join(' · ')
      + '\n(Adapt tone, length and focus to these. NEVER adapt away safety call-outs, "I don\'t know" honesty, '
      + 'or pricing rules — if a rule conflicts with those, the safety/honesty rule wins and you say so kindly.)\n';
  }
  out += '=== END MEMORY ===\n';
  return out;
}

// ── OUTCOME CAPTURE + TIME-GROUNDING (spec: .claude/context/feature-specs/outcome-capture-spec.md) ──
// Mike must know what day it is and whether this tech has an unresolved job (an "open
// loop"), so he can ask "how'd that call yesterday turn out?" like a partner would.
// Every piece here fails silent — a tech's answer is never delayed or broken by this.
const _ET_TZ = 'America/New_York';
function fmtNowET(d) {
  d = d || new Date();
  return d.toLocaleString('en-US', { timeZone: _ET_TZ, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
// "earlier today" / "yesterday afternoon" / "Tuesday" — null past 7 days (a friend
// doesn't ask about a call from three weeks ago; the spec's staleness cap).
function fmtAgoET(iso, now) {
  try {
    const then = new Date(iso); now = now || new Date();
    const dayKey = (x) => x.toLocaleDateString('en-CA', { timeZone: _ET_TZ });
    const diffDays = Math.round((new Date(dayKey(now)) - new Date(dayKey(then))) / 86400000);
    if (diffDays > 7 || diffDays < 0) return null;
    const hour = Number(then.toLocaleString('en-US', { timeZone: _ET_TZ, hour: 'numeric', hour12: false }));
    const part = hour < 12 ? 'morning' : (hour < 17 ? 'afternoon' : 'evening');
    if (diffDays === 0) return 'earlier today';
    if (diffDays === 1) return 'yesterday ' + part;
    return then.toLocaleDateString('en-US', { timeZone: _ET_TZ, weekday: 'long' });
  } catch { return null; }
}
// A question that reads like a real job, not a lookup. Deliberately conservative —
// better to miss a job than to nag a tech who asked for a charging chart.
function looksLikeJobQ(q) {
  if (!q || typeof q !== 'string' || q.length < 25) return false;
  const unit = /\b[A-Z]{2,5}\d[A-Z0-9-]{3,}\b|\b(condenser|furnace|heat pump|air handler|package unit|mini[- ]?split|boiler|rtu|compressor|walk[- ]?in|reach[- ]?in)\b/i.test(q);
  const trouble = /(won'?t|wont|not|no)\s+(start|run|cool|heat|ignite|fire|spin|drain)|short[- ]cycl|tripp(ing|ed)|leak|hums?|buzz|flash(ing)? code|error|fault|frozen|ice[sd]? (up|over)|intermittent|dead|blank|clicking|overheat/i.test(q);
  return unit && trouble;
}
// One cheap read of this tech's recent spine: last ask (for "you were on last …"),
// plus the newest job-like ask with no outcome after it and fewer than 2 probes.
async function getLoopState(uid) {
  const out = { lastAskAt: null, openLoop: null, priceTold: false };
  if (!uid || !SUPABASE_URL) return out;
  const rows = await supabase('GET', 'events', null,
    `?select=id,type,payload,created_at&user_id=eq.${encodeURIComponent(uid)}`
    + `&type=in.(mike_ask,job_outcome,loop_probe,job_closed,price_mention)`
    + `&created_at=gte.${encodeURIComponent(new Date(Date.now() - 7 * 86400000).toISOString())}`
    + `&order=created_at.desc&limit=60`);
  if (!rows || !rows.length) return out;
  out.priceTold = rows.some(r => r.type === 'price_mention');
  const asks = rows.filter(r => r.type === 'mike_ask');
  if (asks.length) out.lastAskAt = asks[0].created_at;
  for (const a of asks) {
    const q = a.payload && a.payload.q;
    if (!looksLikeJobQ(q)) continue;
    const t = new Date(a.created_at).getTime();
    // Any outcome/close recorded since that ask means the loop is settled — stop hunting.
    if (rows.some(r => (r.type === 'job_outcome' || r.type === 'job_closed') && new Date(r.created_at).getTime() >= t)) break;
    const probes = rows.filter(r => r.type === 'loop_probe' && r.payload && r.payload.ref === a.id).length;
    if (probes >= 2) break; // asked once + one retry — the spec says let it go for good
    out.openLoop = { id: a.id, q: String(q).slice(0, 220), at: a.created_at, probes };
    break;
  }
  return out;
}
function buildTimeContext(lastAskAt) {
  let out = '\n\n=== RIGHT NOW ===\nIt is ' + fmtNowET() + ' (US Eastern). Speak in real time-language '
    + '("earlier today", "yesterday afternoon", "Tuesday") — never "previously" or "in a past conversation".';
  if (lastAskAt) { const ago = fmtAgoET(lastAskAt); if (ago) out += ' This tech last talked to you ' + ago + '.'; }
  return out + '\n=== END RIGHT NOW ===\n';
}
const OUTCOME_SYS = '\n\n=== CLOSING THE LOOP (outcome capture) ===\n'
  + 'You care how jobs END. Two habits, and BOTH apply only when the conversation is clearly a real '
  + 'job (a unit plus a symptom) — never on quick lookups (specs, code meanings, charts, charge math):\n'
  + '1) WRAP-UP: when the fix lands or the tech is signing off, ask ONCE, casually, in your own words: '
  + 'did it fix it first trip, repair or replace, and what did the ticket run (money is optional — never push). '
  + 'If he says there was no money in it — warranty call, callback, no-charge — the FIX is still the win: '
  + '"did we get it fixed though?" A first-trip fix on a warranty call counts the same as a paid one.\n'
  + '2) When the tech REPORTS how a job went (this one or an earlier one) — fixed or not, sold or not, '
  + 'an amount — acknowledge it like a partner, then end your reply with ONE final line, exactly:\n'
  + '[JOB_OUTCOME]{"fixed":true|false|null,"first_trip":true|false|null,"kind":"repair"|"replace"|"maintenance"|"warranty"|"callback"|null,"amount":number-or-null,"note":"up to 8 words"}\n'
  + 'Rules for that line: it is MACHINE-READ and stripped before the tech ever sees your reply — never '
  + 'mention it, never emit it unless the tech actually reported an outcome, never more than one, valid '
  + 'JSON only. Never ask about an outcome twice in one conversation; if he ignores the question, drop it.\n'
  + 'DIDN\'T FIX IT: if the job came back or the fix didn\'t hold, zero shame — log it honestly '
  + '(fixed:false) and immediately coach the return trip: what to check next, what the first fix may have '
  + 'masked. A callback you help him win is worth more than the first visit.\n'
  + 'PENDING MONEY IS NOT MONEY: if he only QUOTED something (customer still deciding), do NOT put the '
  + 'quote in amount — amount is only for money that actually closed. A pending quote is kind and a note '
  + '("quoted 8k, deciding"), amount null. When he later says they went for it, THAT reply carries the amount.\n'
  + 'NEVER RE-LOG: if you already acknowledged this same outcome earlier in this conversation or it '
  + 'appears in your memory of him, do not emit the marker again — one job, one outcome, once.\n'
  + '=== END CLOSING THE LOOP ===\n';
function buildLoopContext(loop) {
  if (!loop) return '';
  const ago = fmtAgoET(loop.at) || 'recently';
  return '\n\n=== OPEN LOOP (unfinished job) ===\nThis tech was working a job ' + ago
    + " and you never heard how it ended. His question back then: \"" + loop.q.replace(/"/g, "'") + "\".\n"
    + 'OPEN your reply with ONE short, natural check-in about that job ("how\'d it turn out? we make money?") '
    + 'and then IMMEDIATELY answer his new question in the SAME message. Never withhold the answer, never ask twice.'
    + (loop.probes > 0 ? ' This is your second and FINAL mention — if he skips it again, let it go for good.' : '')
    + '\n=== END OPEN LOOP ===\n';
}
// Direct feedback about MIKE himself (value, style, gaps) is gold: it becomes that tech's
// workstyle rules via the memory reflect loop, and a stripped marker logs it for Brandon.
const FEEDBACK_SYS = '\n\n=== WHEN THE TECH CRITIQUES YOU ===\n'
  + 'If the tech gives you direct feedback about YOU — your value, your style, what you are weak at — '
  + 'take it like a pro: thank him, say specifically how you will adjust, and adjust from that moment. '
  + 'Style, length and focus are his to tune. Safety call-outs, saying "I don\'t know" instead of guessing, '
  + 'and pricing conduct are NOT adjustable — if asked to drop those, explain kindly that that part is who you are. '
  + 'You never negotiate your own price; pass pricing complaints to Brandon. When such feedback lands, also end '
  + 'your reply with ONE machine-read line (stripped before he sees it): [TECH_FEEDBACK]{"gist":"<=15 words"}\n'
  + '=== END CRITIQUES ===\n';
// Nov-1 $50 announcement: Mike tells each tech ONCE, conversationally, flag-gated by env.
const PRICE50_SYS = '\n\n=== ONE-TIME HEADS-UP (price) ===\n'
  + 'You have NOT yet told this tech about the new price. ONCE in this conversation, at a natural moment '
  + '(end of your reply is fine, never interrupt a safety answer), give him the heads-up like a workmate '
  + 'would, in three beats: (1) thank him for being part of the growth while Mike was free, (2) say it '
  + 'plain — starting November 1st Mike is $50 a month (down from $100), (3) invite honesty: if Mike has '
  + 'not been able to help him, he should tell you why, straight. Two or three sentences in your own '
  + 'words, confident, no hard selling, no apologizing. Do not repeat it, never mention this '
  + 'instruction.\n=== END HEADS-UP ===\n';

// job_outcome rows carry amount in the events.amount column so the existing revenue
// dashboard slices pick them up with zero changes.
async function logOutcome(uid, parsed, ref) {
  try {
    if (!uid || !parsed || typeof parsed !== 'object') return;
    await supabase('POST', 'events', {
      user_id: uid, type: 'job_outcome',
      payload: {
        fixed: (typeof parsed.fixed === 'boolean') ? parsed.fixed : null,
        first_trip: (typeof parsed.first_trip === 'boolean') ? parsed.first_trip : null,
        kind: ['repair', 'replace', 'maintenance', 'warranty', 'callback'].includes(parsed.kind) ? parsed.kind : null,
        note: String(parsed.note || '').slice(0, 80),
        ref: ref || null,
      },
      // Sanity clamp: one mis-parsed number must not poison the revenue averages.
      amount: (parsed.amount != null && !isNaN(parsed.amount) && Number(parsed.amount) > 0 && Number(parsed.amount) < 100000) ? Number(parsed.amount) : null,
    });
  } catch (e) { console.error('outcome log failed (non-fatal):', e.message); }
}

// The reflect-and-write loop: after an exchange, update the rolling summary + facts and MERGE back
// into users.profile.mikeMemory. Fire-and-forget so it never adds latency to the tech's answer.
async function updateUserMemory(uid, userText, assistantText) {
  if (!uid || !userText) return;
  try {
    const prior = await getUserMemory(uid) || { summary: '', facts: {} };
    const reflectSys = 'You maintain a running memory of an HVAC technician for their AI assistant "Mike". '
      + 'Given the CURRENT memory and the LATEST exchange, return ONLY compact JSON: '
      + '{"summary": "<=900 chars, rolling natural-language summary of who this tech is and what has been '
      + 'going on across sessions — jobs, units, brands, recurring issues, callbacks; supersede stale details, '
      + 'do not just append>", "facts": {"name":"","region":"","brands":[],"skill":"","tone":"","notes":""}, '
      + '"workstyle": ["durable rules for HOW this tech wants Mike to work, in imperative form, max 8 — e.g. '
      + '\'keep answers short\', \'skip beginner safety preambles (20-yr vet)\', \'more help selling\'. Add one '
      + 'ONLY when the tech gives direct feedback or a clear preference about Mike himself; carry existing rules '
      + 'forward unless contradicted; NEVER add rules that weaken safety call-outs, honesty, or pricing conduct"]}. '
      + 'Keep only durable, useful facts. No prose outside the JSON.';
    const reflectBody = {
      model: PRIMARY_MODEL, // overridden per-hop by callModelWithFailover
      // 1600 not 700: Claude 5 thinks by default and thinking counts against
      // max_tokens — at 700 the memory JSON could truncate and silently stop
      // updating. Effort 'low' keeps this routine reflect step fast and cheap.
      max_tokens: 1600,
      output_config: { effort: 'low' },
      system: reflectSys,
      messages: [{ role: 'user', content:
        'CURRENT MEMORY:\n' + JSON.stringify(prior).slice(0, 4000)
        + '\n\nLATEST EXCHANGE:\nTech: ' + String(userText).slice(0, 1500)
        + '\nMike: ' + String(assistantText || '').slice(0, 1500)
        + '\n\nReturn the updated memory JSON.' }],
    };
    const _fo = await callModelWithFailover(reflectBody, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    }, { stream: false });
    if (!_fo || !_fo.res || !_fo.res.ok) return;
    const data = await _fo.res.json();
    const raw = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
    const m = raw.match(/\{[\s\S]*\}/); if (!m) return;
    let next; try { next = JSON.parse(m[0]); } catch { return; }
    const mikeMemory = {
      summary: typeof next.summary === 'string' ? next.summary.slice(0, 1000) : (prior.summary || ''),
      facts: (next.facts && typeof next.facts === 'object') ? next.facts : (prior.facts || {}),
      // THEIR Mike: work-style rules survive across sessions; capped, strings only.
      workstyle: Array.isArray(next.workstyle)
        ? next.workstyle.filter(r => typeof r === 'string' && r.length > 2).slice(0, 8).map(r => r.slice(0, 120))
        : (Array.isArray(prior.workstyle) ? prior.workstyle : []),
      updated_at: new Date().toISOString(),
    };
    // MERGE-safe write: read the whole profile, set only mikeMemory, write it back intact.
    const rows = await supabase('GET', 'users', null, `?id=eq.${encodeURIComponent(uid)}&select=profile`);
    const prof = (Array.isArray(rows) && rows[0] && rows[0].profile) ? rows[0].profile : {};
    prof.mikeMemory = mikeMemory;
    await supabase('PATCH', 'users', { profile: prof }, `?id=eq.${encodeURIComponent(uid)}`);
  } catch (e) { console.error('memory update failed (non-fatal):', e.message); }
}

// ── COMPANY SITE (trazerintelligence.com) ───────────────────────────────────────
// Apple's Individual→Organization migration requires "a publicly available organization
// website whose domain is associated with the organization". trazermike.io is the PRODUCT;
// this serves the ENTITY site — company, products, privacy policy, terms — off the same
// deploy so there is no second host to pay for, monitor, or forget to renew. The privacy
// and terms URLs are also required by App Store submission, so one build covers three
// requirements.
//
// Host-matched, so it cannot affect trazermike.io: every other hostname falls straight
// through to the product below. Registered BEFORE express.static and before the SPA
// catch-all, or the app's own index.html would win.
const COMPANY_HOSTS = new Set(['trazerintelligence.com', 'www.trazerintelligence.com']);
const COMPANY_PAGES = { '/': 'index.html', '/index.html': 'index.html',
                        '/privacy': 'privacy.html', '/privacy.html': 'privacy.html',
                        '/terms': 'terms.html', '/terms.html': 'terms.html' };
app.use((req, res, next) => {
  const host = String(req.headers.host || '').split(':')[0].toLowerCase();
  if (!COMPANY_HOSTS.has(host)) return next();
  const page = COMPANY_PAGES[req.path];
  if (page) {
    res.set('Cache-Control', 'public, max-age=300');
    return res.sendFile(path.join(__dirname, 'public', 'company', page));
  }
  // Anything else on the company host goes home rather than falling into the product SPA.
  return res.redirect(302, '/');
});

// Serve manifest with the correct MIME — iOS silently ignores manifests served as
// application/json. Registered before express.static so this route wins precedence.
app.get('/manifest.json', (req, res) => {
  res.set('Content-Type', 'application/manifest+json');
  res.set('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Never cache index.html — always serve fresh so JS/CSS fixes reach users immediately
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Request logger — stays intact
app.use((req, res, next) => {
  if (req.path.startsWith('/api/'))
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} active=${globalActive}`);
  next();
});

// ── HEALTH ────────────────────────────────────────────────────────────────────
// Public endpoint — intentionally no auth so load balancers and Railway can
// check it without credentials. Does NOT expose env var values, just readiness flags.
app.get('/api/health', (req, res) => {
  // Security: do not disclose which integrations are configured (feature-flag leak).
  // The frontend only needs a 200; deploy-verification uses uptime.
  //
  // `build` — 2026-09-14. Uptime ALONE has burned us twice: a fix gets pushed, uptime
  // reads low because the PREVIOUS deploy just restarted, and the "verification" runs
  // against the old code. A commit sha answers "which build is actually serving this
  // request" with no inference. Railway injects RAILWAY_GIT_COMMIT_SHA; short sha only,
  // which is already public in the repo and discloses nothing about configuration.
  res.json({
    ok: true,
    activeRequests: globalActive,
    uptime: Math.floor(process.uptime()),
    build: String(process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || 'local').slice(0, 7),
    // Failover visibility. `degraded` true means the primary model is failing and
    // Mike is answering on a fallback — an outage that would previously have been
    // silent (or total). Deliberately does NOT expose the chain itself.
    models: MODEL_CHAIN.length,
    degraded: lastModelUsed !== PRIMARY_MODEL,
    failovers: failoverCount,
    // `brain` — 2026-10-31. The brain was dead 12 hours on an out-of-credits 502
    // while this endpoint reported ok:true, and the external watchdog green-lit the
    // outage. ok:true only ever meant "Express is up". These ages are the brain's own
    // pulse: suspectDown flips true the moment the most recent model outcome is a
    // failure, and THIS is the field the watchdog reads now. null = no traffic yet
    // since boot (not a failure — an idle night looks like old ages, not suspectDown).
    brain: {
      lastOkAgeSec: lastBrainOkAt ? Math.floor((Date.now() - lastBrainOkAt) / 1000) : null,
      lastFailAgeSec: lastBrainFailAt ? Math.floor((Date.now() - lastBrainFailAt) / 1000) : null,
      suspectDown: !!(lastBrainFailAt && lastBrainFailAt > lastBrainOkAt),
    },
  });
});

// ── AUTH: SIGN UP ─────────────────────────────────────────────────────────────
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  const { name, email, password, company, role } = req.body;
  
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!isValidEmail(email))
    return res.status(400).json({ error: 'Invalid email address' });

  // Validate optional fields — role must be a known value.
  // 'admin' is intentionally NOT self-assignable: admins are promoted directly in the DB.
  // (Security fix C2 — prevents stranger self-registering as admin.)
  const validRoles = ['contractor', 'homeowner', 'technician'];
  const userRole = validRoles.includes(role) ? role : 'contractor';

  if (!SUPABASE_URL) {
    // Fallback: return success without DB (dev mode — no persistence)
    const now = Date.now();
    return res.json({
      user: { name, email, company: company||'', role: userRole, plan: 'trial', trialStart: now, usageCount: 0 },
      token: signToken({ id: 'dev', email }),
    });
  }

  try {
    // Check if user exists
    const existing = await supabase('GET', 'users', null, `?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&select=id`);
    if (existing && existing.length > 0)
      return res.status(409).json({ error: 'An account with this email already exists' });

    // bcrypt hash — replaces SHA-256 HMAC
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    
    const users = await supabase('POST', 'users', {
      name: name.trim().replace(/[<>]/g, ''),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      // password_salt is no longer used — bcrypt stores the salt inside the hash.
      // Sending '' satisfies the NOT NULL constraint in Supabase without a migration.
      password_salt: '',
      company: company?.trim() || '',
      role: userRole,
      plan: 'trial',
      trial_start: now,
      usage_count: 0,
      created_at: now,
      features: {},
    });

    if (!users || !users[0])
      return res.status(500).json({ error: 'Failed to create account' });

    const user = users[0];

    // ABUSE VISIBILITY, LOG-ONLY (the backstop in Brandon's everyone-pays plan,
    // 2026-10-26). With the founder free ride and the date grandfather gone, the one
    // abuse route left is serial re-signups for fresh 14-day trials. We do NOT block
    // and we add NO new client fingerprinting — we only write the signal down so the
    // HQ/admin side can see it. Fingerprint = the existing device id if the request
    // carries one (header x-trazer-did or body.did — note: today's signup client sends
    // NEITHER, so this leg is dormant until the client ever includes it) + the existing
    // IP/UA hash (weak on Railway — edge IPs rotate — so treat it as a hint, not proof).
    // Every signup logs a 'signup_fingerprint' event; when the same hash already appears
    // on 2+ PRIOR accounts, an additional 'signup_dupe_signal' event is logged.
    // Fire-and-forget: a logging failure must never delay or fail a signup.
    (async () => {
      const rawDid = String(req.headers['x-trazer-did'] || (req.body && req.body.did) || '').slice(0, 64);
      const didHash = /^[A-Za-z0-9_-]{8,64}$/.test(rawDid)
        ? crypto.createHmac('sha256', JWT_SECRET).update('did|' + rawDid).digest('hex').slice(0, 16)
        : null;
      const ipHash = _visitorHash(req);
      logUsage(user.id, 'signup_fingerprint', { did_hash: didHash, ip_hash: ipHash });
      const priorAccounts = async (field, hash) => {
        if (!hash) return 0;
        const rows = await supabase('GET', 'events', null,
          `?type=eq.signup_fingerprint&payload->>${field}=eq.${encodeURIComponent(hash)}&user_id=neq.${encodeURIComponent(user.id)}&select=user_id&limit=50`);
        return Array.isArray(rows) ? new Set(rows.map(r => r.user_id).filter(Boolean)).size : 0;
      };
      const [priorDid, priorIp] = await Promise.all([
        priorAccounts('did_hash', didHash),
        priorAccounts('ip_hash', ipHash),
      ]);
      if (priorDid >= 2 || priorIp >= 2) {
        logUsage(user.id, 'signup_dupe_signal', {
          did_hash: didHash, ip_hash: ipHash,
          prior_did_accounts: priorDid, prior_ip_accounts: priorIp,
          // Which leg fired — did is the strong signal, ip is the weak one.
          signal: priorDid >= 2 ? 'did' : 'ip',
        });
      }
    })().catch(e => console.error('signup dupe-signal failed (non-fatal):', e.message));

    // Issue a signed JWT — the client treats this opaquely, same as before
    const token = signToken(user);
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
        plan: user.plan,
        trialStart: new Date(user.trial_start).getTime(),
        usageCount: user.usage_count || 0,
        // A durable "returning tech" signal. usage_count is never persisted server-side
        // (incremented only client-side, wiped on reinstall), so a returning tech on a
        // fresh install was mis-greeted with the brand-new self-intro. The account's age
        // is durable: if it existed before today, they are not a first-timer.
        createdAt: user.created_at ? new Date(user.created_at).getTime() : null,
      },
      token,
    });
  } catch(err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// ── AUTH: SIGN IN ─────────────────────────────────────────────────────────────
app.post('/api/auth/signin', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });
  if (!isValidEmail(email))
    return res.status(400).json({ error: 'Invalid email address' });

  if (!SUPABASE_URL) {
    return res.status(404).json({ error: 'Account not found' });
  }

  try {
    const users = await supabase('GET', 'users', null, 
      `?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&select=*`);
    
    // supabase() returns null on a non-OK response OR a 10s timeout/abort (paused or
    // stalled DB). Distinguish that from a genuine empty result: null => upstream is
    // unavailable, so return 503 'try again' instead of a misleading 'No account found'
    // (which would make a tech think their account vanished). An empty array is the
    // real no-such-user case and keeps the 404.
    if (users === null)
      return res.status(503).json({ error: 'Service temporarily unavailable — please try again in a moment' });
    if (users.length === 0)
      return res.status(401).json({ error: 'Invalid email or password' });

    const user = users[0];
    
    // Transparent password hash migration: if the stored hash looks like a bcrypt hash
    // (starts with $2b$ or $2a$) use bcrypt.compare; otherwise fall through to legacy
    // HMAC path and re-hash with bcrypt on success so future logins use the new algo.
    let passwordOk = false;
    const isBcrypt = typeof user.password_hash === 'string' && user.password_hash.startsWith('$2');

    if (isBcrypt) {
      passwordOk = await bcrypt.compare(password, user.password_hash);
    } else {
      // Legacy SHA-256 HMAC path — only reached if the account was created before this deploy
      passwordOk = verifyLegacyPassword(password, user.password_hash, user.password_salt);
      if (passwordOk) {
        // Upgrade to bcrypt silently so next login hits the fast path
        const newHash = await hashPassword(password);
        await supabase('PATCH', 'users', { password_hash: newHash }, `?id=eq.${user.id}`)
          .catch(e => console.error('Hash upgrade failed:', e.message));
        console.log(`Upgraded password hash for user: ${user.email}`);
      }
    }
    
    if (!passwordOk)
      return res.status(401).json({ error: 'Invalid email or password' });

    // Update last login
    await supabase('PATCH', 'users', { last_login: new Date().toISOString() }, 
      `?id=eq.${user.id}`);

    const token = signToken(user);
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company || '',
        role: user.role || 'contractor',
        plan: user.plan || 'trial',
        trialStart: user.trial_start ? new Date(user.trial_start).getTime() : Date.now(),
        usageCount: user.usage_count || 0,
        createdAt: user.created_at ? new Date(user.created_at).getTime() : null, // durable returning-tech signal
        features: user.features || {},
        profile: user.profile || {},
        epaCert: user.epa_cert || '',
        nateCert: user.nate_cert || '',
        yearsExperience: user.years_experience || '',
        serviceZip: user.service_zip || '',
        truckStock: user.truck_stock || '',
        phone: user.phone || '',
      },
      token,
    });
  } catch(err) {
    console.error('Signin error:', err.message);
    res.status(500).json({ error: 'Server error during signin' });
  }
});

// ── AUTH: UPDATE PROFILE ──────────────────────────────────────────────────────
// authenticateToken provides req.user — no more manual Buffer.from decode
app.post('/api/auth/profile', authenticateToken, async (req, res) => {
  const { updates } = req.body;
  if (!updates) return res.status(400).json({ error: 'Missing updates' });

  try {
    if (!SUPABASE_URL) return res.json({ ok: true });

    // SECURITY: a user may switch their own role between non-privileged types
    // (homeowner/contractor/technician) but NEVER self-assign 'admin'. The signup
    // endpoint enforces the same allowlist; the profile path must too, or any
    // authenticated user can PATCH role:'admin' and reach the admin panel.
    const safeRoles = ['contractor', 'homeowner', 'technician'];
    const allowed = {
      name: updates.name ? updates.name.replace(/[<>]/g, '') : undefined,
      company: updates.company,
      role: safeRoles.includes(updates.role) ? updates.role : undefined,
      epa_cert: updates.epaCert,
      nate_cert: updates.nateCert,
      years_experience: updates.yearsExperience,
      service_zip: updates.serviceZip,
      truck_stock: updates.truckStock,
      phone: updates.phone,
      profile: updates.profile,
      features: updates.features,
      usage_count: updates.usageCount,
    };
    
    // Remove undefined values
    Object.keys(allowed).forEach(k => allowed[k] === undefined && delete allowed[k]);

    // Use req.user.email (from verified JWT) — never trust client-supplied identity
    await supabase('PATCH', 'users', allowed, `?email=eq.${encodeURIComponent(req.user.email)}`);
    res.json({ ok: true });
  } catch(err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── AUTH: RESET PASSWORD ──────────────────────────────────────────────────────
app.post('/api/auth/reset', authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email address' });

  // Always return the same response whether the account exists or not.
  // This prevents email enumeration — attacker can't learn which emails are registered.
  const genericResponse = { ok: true, message: 'If an account exists, a reset email will be sent.' };

  try {
    if (!SUPABASE_URL) {
      console.log(`Password reset requested for: ${email} (no DB — skipped)`);
      return res.json(genericResponse);
    }

    const users = await supabase('GET', 'users', null,
      `?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&select=id,name`);

    if (!users || users.length === 0) {
      // Account not found — return generic response (don't reveal this)
      return res.json(genericResponse);
    }

    const user = users[0];
    const resetToken = generateResetToken(user.id);
    const resetUrl = `${APP_URL}?reset=${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'Reset your Trazer Intelligence password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#fff;border-radius:12px;">
          <img src="${APP_URL}/logo.png" alt="Trazer" style="height:32px;margin-bottom:24px;" onerror="this.style.display='none'">
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;">Reset your password</h2>
          <p style="color:#888;margin:0 0 24px;font-size:15px;">Hi ${user.name || 'there'}, we received a request to reset your Trazer Intelligence password.</p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#00C2B2;color:#000;font-weight:800;font-size:15px;
                    padding:14px 28px;border-radius:8px;text-decoration:none;margin-bottom:24px;">
            Reset Password →
          </a>
          <p style="color:#555;font-size:13px;margin:0 0 8px;">This link expires in 1 hour.</p>
          <p style="color:#555;font-size:13px;margin:0;">If you didn't request this, you can ignore this email — your password won't change.</p>
          <hr style="border:none;border-top:1px solid #222;margin:24px 0;">
          <p style="color:#444;font-size:12px;margin:0;">Trazer Intelligence · HVAC Field Platform</p>
        </div>
      `,
    });

    res.json(genericResponse);
  } catch(err) {
    console.error('Reset error:', err.message);
    // Still return generic response — don't leak server errors
    res.json(genericResponse);
  }
});

// ── AUTH: RESET CONFIRM (link from email) ─────────────────────────────────────
// The reset email links to APP_URL?reset=<token>. The frontend should POST that
// token here with the new password to complete the reset.
app.post('/api/auth/reset-confirm', authLimiter, async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword)
    return res.status(400).json({ error: 'Token and new password required' });
  if (newPassword.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!SUPABASE_URL)
    return res.status(503).json({ error: 'Database not configured' });

  const userId = verifyResetToken(token);
  if (!userId)
    return res.status(400).json({ error: 'Reset link is invalid or has expired — please request a new one' });

  try {
    const newHash = await hashPassword(newPassword);
    await supabase('PATCH', 'users', { password_hash: newHash }, `?id=eq.${encodeURIComponent(userId)}`);
    res.json({ ok: true, message: 'Password updated. You can now sign in.' });
  } catch(err) {
    console.error('Reset confirm error:', err.message);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// ── AUTH: DELETE ACCOUNT ──────────────────────────────────────────────────────
// Apple Guideline 5.1.1(v) / Google Play: an app that creates accounts MUST let the user delete
// their account + personal data from INSIDE the app (auto-reject otherwise). JWT-verified — the
// user can only ever delete THEIR OWN account (id/email come from the token, never client input).
app.post('/api/auth/delete', authenticateToken, async (req, res) => {
  if (!SUPABASE_URL) return res.json({ ok: true }); // dev mode — nothing persisted
  try {
    const userId = req.user.id;
    const email = req.user.email;

    // Best-effort: cancel any live Stripe subscription so a deleted account can't keep getting billed.
    if (STRIPE_SECRET_KEY) {
      try {
        const u = await supabase('GET', 'users', null, `?id=eq.${encodeURIComponent(userId)}&select=stripe_subscription_id`);
        const subId = u && u[0] && u[0].stripe_subscription_id;
        if (subId) {
          await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
          });
        }
      } catch (e) { console.error('Delete: stripe cancel failed (continuing):', e.message); }
    }

    // Wipe the user's OWN data (rows keyed by user_id). The SHARED verified-diagram library
    // (library_*) is not personal data and is intentionally left intact.
    for (const table of ['events', 'jobs', 'customers', 'refrigerant_log']) {
      try { await supabase('DELETE', table, null, `?user_id=eq.${encodeURIComponent(userId)}`); }
      catch (e) { console.error(`Delete: ${table} cleanup failed (continuing):`, e.message); }
    }

    // Finally delete the account row itself. null return here = a real failure (past the config check).
    const del = await supabase('DELETE', 'users', null, `?id=eq.${encodeURIComponent(userId)}`);
    if (del === null) return res.status(500).json({ error: 'Failed to delete account — please try again.' });
    console.log(`Account deleted: ${email}`);
    res.json({ ok: true, message: 'Your account and personal data have been permanently deleted.' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ error: 'Failed to delete account — please try again.' });
  }
});

// ── AUTH: CHANGE PASSWORD ─────────────────────────────────────────────────────
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return res.status(400).json({ error: 'Missing required fields' });
  if (newPassword.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters' });

  try {
    if (!SUPABASE_URL) return res.json({ ok: true });

    // req.user.email comes from the verified JWT — no client-supplied email trusted
    const users = await supabase('GET', 'users', null, `?email=eq.${encodeURIComponent(req.user.email)}&select=*`);
    if (!users || !users[0]) return res.status(404).json({ error: 'User not found' });

    const user = users[0];

    // Support both bcrypt and legacy HMAC hashes during the migration window
    let passwordOk = false;
    const isBcrypt = typeof user.password_hash === 'string' && user.password_hash.startsWith('$2');
    if (isBcrypt) {
      passwordOk = await bcrypt.compare(oldPassword, user.password_hash);
    } else {
      passwordOk = verifyLegacyPassword(oldPassword, user.password_hash, user.password_salt);
    }

    if (!passwordOk)
      return res.status(401).json({ error: 'Current password is incorrect' });

    const newHash = await hashPassword(newPassword);
    await supabase('PATCH', 'users', { password_hash: newHash }, `?id=eq.${user.id}`);
    res.json({ ok: true });
  } catch(err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ── STRIPE: CREATE CHECKOUT SESSION ──────────────────────────────────────────
app.post('/api/billing/checkout', authenticateToken, async (req, res) => {
  const { plan, email, name } = req.body;
  if (!plan || !email) return res.status(400).json({ error: 'Plan and email required' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email address' });
  if (!STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Billing not configured' });

  const priceMap = {
    homeowner: STRIPE_PRICE_HOMEOWNER,
    starter: STRIPE_PRICE_STARTER,
    pro: STRIPE_PRICE_PRO,
    team: STRIPE_PRICE_TEAM,
  };

  const priceId = priceMap[plan];
  if (!priceId) return res.status(400).json({ error: `Unknown plan: ${plan}` });

  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'customer_email': email,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'success_url': `${APP_URL}?payment=success&plan=${plan}`,
        'cancel_url': `${APP_URL}?payment=cancelled`,
        'metadata[email]': email,
        'metadata[plan]': plan,
        'metadata[name]': name || '',
        // NO Stripe trial here (Brandon, 2026-08-07). The free window is now served in-app by
        // checkPaywall off trial_start, BEFORE the tech ever reaches Checkout. Passing
        // trial_period_days as well would hand them a second free 14 days on top of the 14 they
        // already used — 28 days free per signup. They arrive here because the free look ended,
        // so this charges today. Founders reach this route too now (everyone pays,
        // 2026-10-26) — their checkout runs at the same $50 'pro' price.
        'payment_method_collection': 'always',
        // Also stamp the trial on the subscription for our own webhook bookkeeping.
        'subscription_data[metadata][email]': email,
        'subscription_data[metadata][plan]': plan,
        'allow_promotion_codes': 'true',
        'billing_address_collection': 'auto',
      }).toString(),
    });

    const session = await response.json();
    if (!response.ok) {
      console.error('Stripe checkout error:', session.error?.message);
      return res.status(502).json({ error: session.error?.message || 'Failed to create checkout' });
    }

    res.json({ url: session.url, sessionId: session.id });
  } catch(err) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ── STRIPE: CANCEL SUBSCRIPTION ──────────────────────────────────────────────
app.post('/api/billing/cancel', authenticateToken, async (req, res) => {
  if (!STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Billing not configured' });

  try {
    if (!SUPABASE_URL) return res.json({ ok: true });

    // req.user.email from verified JWT — not from client body
    const users = await supabase('GET', 'users', null, `?email=eq.${encodeURIComponent(req.user.email)}&select=stripe_subscription_id`);
    if (!users || !users[0]?.stripe_subscription_id)
      return res.status(404).json({ error: 'No active subscription found' });

    const subId = users[0].stripe_subscription_id;
    
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(502).json({ error: err.error?.message || 'Failed to cancel' });
    }

    res.json({ ok: true, message: 'Subscription cancelled. Access continues until end of billing period.' });
  } catch(err) {
    console.error('Cancel error:', err.message);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// ── BILLING: NOTIFY (pre-launch) ──────────────────────────────────────────────
app.post('/api/billing/notify', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email address' });
  console.log(`Billing notify request: ${email}`);
  // Store in DB if available
  if (SUPABASE_URL) {
    await supabase('POST', 'billing_notify', { email, created_at: new Date().toISOString() })
      .catch(()=>{}); // ignore if table doesn't exist yet
  }
  res.json({ ok: true });
});

// ── ADMIN: GET ALL USERS ──────────────────────────────────────────────────────
// authenticateToken verifies the JWT; requireAdmin checks role === 'admin' in DB.
// Previously this checked plan === 'admin' — plan is billing data, not an auth level.
// ── FEEDBACK + WRONG-ANSWER FLAGS ───────────────────────────────────────────────
// The Help > Feedback box wrote to the TECH'S OWN localStorage and showed "Thank you for
// your feedback ❤️". It never sent anything anywhere. Every tech who took the trouble to
// write something got a thank-you for filing it into their own browser, and Brandon has
// never seen a word of it. These two routes are where that goes now.
app.post('/api/feedback', authenticateToken, async (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'text required' });
  logUsage(req.user.id, 'feedback', { text: text.slice(0, 4000) });
  res.json({ ok: true });
});

// A wrong answer flagged IN THE MOMENT, with the exchange attached. Written feedback in a
// help menu is a high-effort action almost nobody takes; one tap next to the answer that
// just failed is effortless — and it is the only signal that says WHICH answer was wrong.
// That pairing (question + what Mike said + a tech saying "no") is the training data.
app.post('/api/flag-answer', authenticateToken, async (req, res) => {
  const { question = '', answer = '', note = '' } = req.body || {};
  if (!answer) return res.status(400).json({ error: 'answer required' });
  logUsage(req.user.id, 'answer_flag', {
    q: String(question).slice(0, 2000),
    a: String(answer).slice(0, 8000),
    note: String(note).slice(0, 1000),
  });
  res.json({ ok: true });
});

// What Brandon reads. Flags first — a flagged answer is a tech telling you Mike was wrong
// on a real call, which outranks everything else in the table.
app.get('/api/admin/audit', authenticateToken, requireAdminOrOwner, async (req, res) => {
  if (!SUPABASE_URL) return res.json({ flags: [], feedback: [], recent: [] });
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const rows = await supabase('GET', 'events', null,
    `?type=in.(answer_flag,feedback,mike_ask,mike_answer)&select=id,user_id,type,payload,created_at&order=created_at.desc&limit=${limit * 6}`);
  if (rows === null) return res.status(500).json({ error: 'Database error' });
  const users = await supabase('GET', 'users', null, '?select=id,name,email&limit=500') || [];
  const who = Object.fromEntries(users.map(u => [u.id, u.name || u.email]));
  const shape = r => ({ id: r.id, tech: who[r.user_id] || 'unknown', at: r.created_at, ...(r.payload || {}) });
  res.json({
    flags: rows.filter(r => r.type === 'answer_flag').slice(0, limit).map(shape),
    feedback: rows.filter(r => r.type === 'feedback').slice(0, limit).map(shape),
    // Question/answer rows are separate events; pair them per tech in time order so the
    // transcript reads as exchanges rather than two disconnected columns.
    recent: (() => {
      const asks = rows.filter(r => r.type === 'mike_ask').slice(0, limit);
      const answers = rows.filter(r => r.type === 'mike_answer');
      return asks.map(q => {
        const a = answers.find(x => x.user_id === q.user_id && new Date(x.created_at) >= new Date(q.created_at));
        return { at: q.created_at, tech: who[q.user_id] || 'unknown',
                 q: (q.payload || {}).q || '', a: a ? ((a.payload || {}).a || '') : '',
                 image: !!(q.payload || {}).image, search: !!(q.payload || {}).search };
      });
    })(),
  });
});

app.get('/api/admin/users', authenticateToken, requireAdminOrOwner, async (req, res) => {
  try {
    if (!SUPABASE_URL) return res.json({ users: [] });
    let q = '?select=id,name,email,company,role,plan,usage_count,created_at,trial_start,last_login&order=created_at.desc&limit=500';
    if (!req.scope.all) q += `&company=eq.${encodeURIComponent(req.scope.company)}`; // owner: ONLY their company
    const users = await supabase('GET', 'users', null, q);
    res.json({ users: users || [] });
  } catch(err) {
    console.error('Admin users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── ADMIN: ONE-TIME OWNER BOOTSTRAP ───────────────────────────────────────────
// Lets the founder promote THEIR OWN account to admin without touching the DB.
// Secure by design: only the hardcoded OWNER_EMAIL can ever be promoted, and only
// when authenticated as that email. Idempotent. No privilege escalation for anyone else.
app.post('/api/admin/bootstrap', authenticateToken, async (req, res) => {
  try {
    const email = ((req.user && req.user.email) || '').toLowerCase();
    const owner = (process.env.OWNER_EMAIL || 'venturabv12@gmail.com').toLowerCase();
    if (email !== owner) return res.status(403).json({ error: 'Not authorized' });
    if (!SUPABASE_URL) return res.json({ ok: true, role: 'admin', dev: true });
    await supabase('PATCH', 'users', { role: 'admin' }, `?email=eq.${encodeURIComponent(req.user.email)}`);
    return res.json({ ok: true, role: 'admin' });
  } catch (err) {
    console.error('Admin bootstrap error:', err.message);
    return res.status(500).json({ error: 'Bootstrap failed' });
  }
});

// ── ADMIN: DELETE USER ────────────────────────────────────────────────────────
app.delete('/api/admin/users/:email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!SUPABASE_URL) return res.json({ ok: true });

    // Validate target email before letting it touch a DB query string
    const targetEmail = req.params.email;
    if (!isValidEmail(targetEmail))
      return res.status(400).json({ error: 'Invalid email parameter' });

    await supabase('DELETE', 'users', null, `?email=eq.${encodeURIComponent(targetEmail)}`);
    res.json({ ok: true });
  } catch(err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});


// ── WEATHER ───────────────────────────────────────────────────────────────────
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

  // Validate lat/lon are numeric — reject anything that could be an injection
  if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lon)))
    return res.status(400).json({ error: 'lat and lon must be numeric' });

  try {
    // Strategy: Try NWS (real station observations) first, fall back to Open-Meteo
    let temp_f, feels_like_f, humidity, wind_mph, condition;

    try {
      // Step 1: Get NWS grid point for coords
      const pointsRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
        headers: { 'User-Agent': 'TrazerIntelligence/1.0 (venturabv12@gmail.com)' }
      });
      if (!pointsRes.ok) throw new Error('NWS points failed');
      const pointsData = await pointsRes.json();
      const stationsUrl = pointsData.properties.observationStations;

      // Step 2: Get nearest station
      const stationsRes = await fetch(stationsUrl, {
        headers: { 'User-Agent': 'TrazerIntelligence/1.0 (venturabv12@gmail.com)' }
      });
      if (!stationsRes.ok) throw new Error('NWS stations failed');
      const stationsData = await stationsRes.json();
      const stationId = stationsData.features[0].properties.stationIdentifier;

      // Step 3: Get latest observation from that station
      const obsRes = await fetch(`https://api.weather.gov/stations/${stationId}/observations/latest`, {
        headers: { 'User-Agent': 'TrazerIntelligence/1.0 (venturabv12@gmail.com)' }
      });
      if (!obsRes.ok) throw new Error('NWS obs failed');
      const obsData = await obsRes.json();
      const obs = obsData.properties;

      // NWS returns Celsius - convert to F
      const toF = c => c != null ? Math.round(c * 9/5 + 32) : null;
      const toMph = ms => ms != null ? Math.round(ms * 2.237) : null;

      temp_f = toF(obs.temperature?.value);
      feels_like_f = toF(obs.windChill?.value) || toF(obs.heatIndex?.value) || temp_f;
      humidity = obs.relativeHumidity?.value != null ? Math.round(obs.relativeHumidity.value) : null;
      wind_mph = toMph(obs.windSpeed?.value);
      condition = obs.textDescription || 'Clear';

      if (temp_f == null) throw new Error('No temp from NWS');
      console.log(`NWS station ${stationId}: ${temp_f}°F ${condition}`);

    } catch (nwsErr) {
      // Fall back to Open-Meteo if NWS fails
      console.log('NWS failed, trying Open-Meteo:', nwsErr.message);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
      const omRes = await fetch(url);
      if (!omRes.ok) throw new Error('Open-Meteo also failed');
      const omData = await omRes.json();
      const c = omData.current;
      const codes = {0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',
        51:'Light drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',
        71:'Light snow',73:'Snow',80:'Showers',95:'Thunderstorm'};
      temp_f = Math.round(c.temperature_2m);
      feels_like_f = Math.round(c.apparent_temperature);
      humidity = Math.round(c.relative_humidity_2m);
      wind_mph = Math.round(c.wind_speed_10m);
      condition = codes[c.weather_code] || 'Clear';
      console.log(`Open-Meteo fallback: ${temp_f}°F`);
    }

    res.json({
      temp_f,
      feels_like_f,
      humidity,
      wind_mph,
      condition,
      summary: `${temp_f}°F, ${condition}, feels like ${feels_like_f}°F, humidity ${humidity}%, wind ${wind_mph} mph`
    });

  } catch(err) {
    console.error('Weather error:', err.message);
    res.status(502).json({ error: 'Weather unavailable' });
  }
});


// ── WARRANTY REGISTRY ─────────────────────────────────────────────────────────
// Reads the manufacturer's ACTUAL warranty registration for a serial — registered
// vs base, active or not, real term end date. Not the "likely warranty" estimate
// every other tech app gives you by decoding a build date out of the serial.
//
// The lookup needs a real browser (manufacturers refuse plain server-side calls at
// the edge), so it lives in its own Railway service and Mike talks to it over the
// private network. If that service is down, deleted, or never provisioned, these
// routes degrade to "couldn't check" and NOTHING ELSE IN MIKE IS AFFECTED. That
// isolation is the whole reason the browser isn't in this process.
const WARRANTY_URL = process.env.WARRANTY_SERVICE_URL || 'http://warranty-service.railway.internal:8080';
const WARRANTY_TOKEN = process.env.WARRANTY_SERVICE_TOKEN || '';

// What does this manufacturer require before a lookup is even possible? Each brand
// wants different inputs (Trane: serial alone; Goodman: serial + model; Carrier:
// serial + original-purchaser), so Mike asks the tech for that brand's fields
// instead of demanding the same set from everyone.
app.get('/api/warranty/requirements', authenticateToken, async (req, res) => {
  try {
    const r = await fetch(`${WARRANTY_URL}/requirements?brand=${encodeURIComponent(req.query.brand || '')}`, {
      headers: { 'x-warranty-token': WARRANTY_TOKEN },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`requirements ${r.status}`);
    return res.json(await r.json());
  } catch (err) {
    console.error('Warranty requirements error:', err.message);
    // Fail soft — Mike falls back to asking for brand + model + serial, which is
    // enough for every manufacturer we support.
    return res.json({ ok: false, known: false, degraded: true });
  }
});

// ── CARRIER WORKER RELAY ─────────────────────────────────────────────────────
// Carrier's lookup is behind invisible reCAPTCHA and Google scores the network the
// request comes from — a home connection gets a token, a datacenter does not. So
// Carrier is done by a small worker on Brandon's own machine, on his own connection.
//
// The warranty service sits on Railway's PRIVATE network and nothing outside can reach
// it, so these two routes are the only door: the laptop polls Mike, Mike asks the
// warranty service. The laptop only ever makes outbound calls — nothing is opened on
// his router and nothing listens on his machine.
// The warranty SERVICE's own health, not the worker's. Nothing outside Railway's private
// network could read it, so every monitor watched the laptop worker's `online:true`
// boolean and saw green while the four server-side brands were dead. Read-only, no auth
// (it exposes nothing a health check should not), and it mirrors the service's status
// code so a monitor can act on it.
app.get('/api/warranty-service-health', async (req, res) => {
  try {
    const r = await fetch(`${WARRANTY_URL}/health`, {
      headers: { 'x-warranty-token': WARRANTY_TOKEN },
      signal: AbortSignal.timeout(15000),
    });
    const data = await r.json().catch(() => null);
    return res.status(r.status).json(data || { ok: false, error: 'unreadable' });
  } catch (err) {
    return res.status(503).json({ ok: false, error: 'warranty service unreachable', detail: err.message });
  }
});

app.all('/api/warranty-worker/:action', async (req, res) => {
  const action = String(req.params.action || '').replace(/[^a-z]/gi, '');
  if (!['next', 'result', 'status'].includes(action)) return res.status(404).json({ error: 'unknown' });
  try {
    const r = await fetch(`${WARRANTY_URL}/worker/${action}`, {
      method: req.method === 'GET' ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-warranty-token': WARRANTY_TOKEN,
        'x-worker-token': req.get('x-worker-token') || '',
      },
      body: req.method === 'GET' ? undefined : JSON.stringify(req.body || {}),
      signal: AbortSignal.timeout(90000),
    });
    const text = await r.text();
    res.status(r.status).type('application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: 'warranty service unreachable' });
  }
});

app.post('/api/warranty', authenticateToken, aiLimiter, async (req, res) => {
  // Goodman and Lennox will not return coverage without the homeowner's last name;
  // Rheem also wants the state. Those cannot come off a photo, so they arrive from
  // whatever the tech told Mike and have to be forwarded, or the lookup runs with
  // half the form filled and reports "no registration found" on a covered unit.
  const { brand, serial, model, originalPurchaser, lastName, zip, state, fresh } = req.body || {};
  if (!brand || !serial) return res.status(400).json({ ok: false, error: 'brand_and_serial_required' });

  // SURVIVE A RESTART. The warranty service is its own Railway service, so every deploy
  // of it takes the process down for a few seconds. Anything mid-flight got a connection
  // error, this handler turned that into a 502, and Mike told the technician he could not
  // reach the registry — for a unit that was perfectly checkable two seconds later.
  //
  // Measured 2026-09-15: four of these in 24h, on four DIFFERENT brands, every one landing
  // within seconds of a deploy. Nothing was wrong with any manufacturer. It is the one
  // failure we cause ourselves, on a schedule, every time we ship.
  //
  // One retry after a short pause covers the whole restart window. It only fires when the
  // connection itself failed — never on a real answer, and never on a slow lookup, which
  // is why the timeout below is left alone.
  const _callService = async () => fetch(`${WARRANTY_URL}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-warranty-token': WARRANTY_TOKEN },
      // `fresh` is for the daily self-check only. Without it the check reads its own
      // cached answer from yesterday and reports every brand healthy while one is
      // broken — a monitor that cannot fail is decoration.
      body: JSON.stringify({ brand, serial, model, originalPurchaser, fresh: fresh === true,
        extra: { model, lastName, zip, state, originalPurchaser } }),
      // A cold lookup launches a browser and drives the manufacturer's own form. That
      // agent path documents its normal case as 20-60s and the service gives it a 120s
      // ceiling (AGENT_TIMEOUT_MS); only Trane's direct path uses the old 45s number.
      // Cutting at 60s meant that for five of six brands Mike gave up BEFORE the
      // service did — the tech got "couldn't reach the registry" while the lookup ran
      // on to a good answer nobody received, burning tokens and hitting the
      // manufacturer for nothing. Sit just past the service's own ceiling so the
      // service is always the one that decides a lookup has failed.
      signal: AbortSignal.timeout(135000),
    });

  try {
    let r;
    try {
      r = await _callService();
    } catch (connErr) {
      // A thrown fetch is the network failing, not the manufacturer answering. Give the
      // service a beat to finish coming back up, then ask once more. If the second
      // attempt also throws, it is a real outage and falls through to the catch below.
      console.warn('Warranty service unreachable, retrying once:', connErr.message);
      await new Promise(rs => setTimeout(rs, 2500));
      r = await _callService();
    }
    const data = await r.json().catch(() => null);
    if (!r.ok || !data) throw new Error(`lookup ${r.status}`);

    // Usage spine — same events table the admin dashboard reads. Serial only; the
    // upstream payload's homeowner address is stripped in the service and must not
    // reappear here.
    try {
      logUsage(req.user && req.user.id, 'warranty_lookup', {
        brand: data.brand || brand,
        found: !!data.found,
        registered: data.registered === true,
        supported: data.supported !== false,
        // found:false alone is ambiguous and that ambiguity is the whole problem: it
        // covers BOTH "the registry answered, this unit was never registered" (a good
        // result) and "we could not get their form to run" (our failure). Without these
        // two fields the field-watch cannot tell a working brand from a broken one, so a
        // brand could be silently dead for days while the log looked normal.
        inconclusive: data.inconclusive === true,
        reason: data.reason || null,
        via: data.via || null,
        // WHAT HE WAS ACTUALLY TRYING TO LOOK UP. Brandon, 2026-09-15: "I need to know
        // who was using it when it fails, what were they trying to do... that's how we
        // make the app better every day."
        //
        // Without the serial a failure row says "lennox failed" and nothing else, so we
        // could never reproduce it, never tell a one-off bad serial from a dead form, and
        // never call the tech back with an answer. Equipment identifiers only — the
        // homeowner's name, address and zip are stripped upstream in the service and must
        // never appear here.
        serial: serial ? String(serial).slice(0, 40) : null,
        model: model ? String(model).slice(0, 40) : null,
      });
    } catch (_) {}

    return res.json(data);
  } catch (err) {
    console.error('Warranty lookup error:', err.message);
    // WRITE THE FAILURE DOWN. logUsage ran only on the success path, so a total warranty
    // outage produced ZERO rows — and field-sweep, which alerts on rows where
    // inconclusive/lookup_did_not_run, saw an empty result set and printed
    // "warranty lookups=0 brands_failing=0 ... SWEEP_CLEAN". Absence of data read as
    // health for 53 hours. A monitor that cannot see a total outage is worse than none.
    try {
      logUsage(req.user && req.user.id, 'warranty_lookup', {
        brand, found: false, registered: false, supported: true,
        inconclusive: true, reason: 'registry_unreachable', via: null,
        err: String(err.message).slice(0, 120),
      });
    } catch (_) {}
    // Never invent a warranty. A wrong "covered through 2033" is how a tech quotes
    // warranty work on a unit that isn't covered.
    return res.status(502).json({ ok: false, error: 'registry_unreachable', brand });
  }
});


// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
// All five data endpoints (customers/jobs/refrigerant-log/reminders/knowledge)
// derive user_id from req.user.id (verified JWT) — never from client input.
// Row-targeted mutations use a compound WHERE so cross-user attempts match 0 rows
// and return 404 instead of silently mutating someone else's data.
app.get('/api/customers', authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  const rows = await supabase('GET', 'customers', null,
    `?user_id=eq.${encodeURIComponent(user_id)}&order=name`);
  if (rows === null) return res.status(500).json({ error: 'Database error' });
  res.json({ customers: rows });
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  const { id, ...fields } = req.body;
  delete fields.user_id; // strip any client-supplied user_id from the body
  const user_id = req.user.id;
  if (id && !isValidUUID(id)) return res.status(400).json({ error: 'Invalid id' });
  const payload = { ...fields, updated_at: new Date() };
  const rows = id
    ? await supabase('PATCH', 'customers', payload, `?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user_id)}`)
    : await supabase('POST', 'customers', { user_id, ...payload });
  if (!rows || !rows[0]) return res.status(id ? 404 : 500).json({ error: id ? 'Customer not found' : 'Failed to save customer' });
  res.json({ customer: rows[0] });
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  if (!isValidUUID(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const user_id = req.user.id;
  const result = await supabase('DELETE', 'customers', null,
    `?id=eq.${encodeURIComponent(req.params.id)}&user_id=eq.${encodeURIComponent(user_id)}`);
  if (result === null) return res.status(500).json({ error: 'Database error' });
  if (Array.isArray(result) && result.length === 0) return res.status(404).json({ error: 'Customer not found' });
  res.json({ success: true });
});

// ── JOBS ──────────────────────────────────────────────────────────────────────
app.get('/api/jobs', authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  const rows = await supabase('GET', 'jobs', null,
    `?user_id=eq.${encodeURIComponent(user_id)}&order=date.desc`);
  if (rows === null) return res.status(500).json({ error: 'Database error' });
  res.json({ jobs: rows });
});

// The jobs table's column names and the names the app closes a job with have NEVER
// matched, so this endpoint 500'd on every single call since it was written — and the
// client wraps the fetch in .catch(function(){}), so the tech saw "Job closed ✓ $X logged"
// while Postgres rejected the row. Found 2026-09-15 by replaying the exact payload:
//   Could not find the 'duration_min' column of 'jobs' in the schema cache
// The jobs table has 0 rows and always has. Nothing was actually lost — submitCloseJob()
// fires recordEvent('job_closed', …) first and that spine is what the revenue dashboard
// reads — but a permanent silent 500 on a save the tech believes succeeded is exactly the
// kind of quiet lie that is worse than a crash.
//
// Two things here, and the second matters more than the first.
const JOB_COLUMNS = new Set(['customer_id', 'date', 'type', 'description', 'diagnosis',
  'parts_used', 'labor_hours', 'total_amount', 'invoice_num', 'signed_off', 'signature', 'notes']);
// What the app calls a thing -> what the column is called.
const JOB_ALIASES = { what: 'description', summary: 'notes', note: 'notes',
  ticket_total: 'total_amount', revenue: 'total_amount' };

app.post('/api/jobs', authenticateToken, async (req, res) => {
  const body = { ...req.body };
  delete body.user_id; // strip any client-supplied user_id from the body
  const user_id = req.user.id;

  const row = {}; const extras = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null || v === '') continue;
    const col = JOB_ALIASES[k] || k;
    if (col === 'labor_hours' && k === 'duration_min') { row.labor_hours = Math.round((Number(v) / 60) * 100) / 100; continue; }
    if (k === 'duration_min') { row.labor_hours = Math.round((Number(v) / 60) * 100) / 100; continue; }
    if (JOB_COLUMNS.has(col)) {
      // Never let two aliases silently overwrite each other — keep the first, keep the rest.
      if (row[col] === undefined) row[col] = v; else extras[k] = v;
    } else {
      extras[k] = v;
    }
  }
  // NEVER DROP WHAT THE TECH TOLD US just because there is no column for it. job_id,
  // outcome and the enhancement figures have no home in this table; they belong to the
  // events spine and are already there, but keeping them alongside the row means this
  // record still makes sense on its own a year from now.
  if (Object.keys(extras).length) {
    const tail = '\n\n[detail] ' + JSON.stringify(extras);
    row.notes = (row.notes ? String(row.notes) : '') + tail;
  }

  const rows = await supabase('POST', 'jobs', { user_id, ...row });
  if (!rows || !rows[0]) {
    // Say WHICH save failed and with what, so the next one of these is a one-line fix
    // instead of a two-hour archaeology dig.
    console.error('Failed to save job for', user_id, '- payload keys:', Object.keys(row).join(','));
    return res.status(500).json({ error: 'Failed to save job' });
  }
  res.json({ job: rows[0] });
});

// ── REFRIGERANT LOG ───────────────────────────────────────────────────────────
app.get('/api/refrigerant-log', authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  const rows = await supabase('GET', 'refrigerant_log', null,
    `?user_id=eq.${encodeURIComponent(user_id)}&order=date.desc`);
  if (rows === null) return res.status(500).json({ error: 'Database error' });
  res.json({ logs: rows });
});

app.post('/api/refrigerant-log', authenticateToken, async (req, res) => {
  const fields = { ...req.body };
  delete fields.user_id; // strip any client-supplied user_id from the body
  const user_id = req.user.id;
  const rows = await supabase('POST', 'refrigerant_log', { user_id, ...fields });
  if (!rows || !rows[0]) return res.status(500).json({ error: 'Failed to save log' });
  res.json({ log: rows[0] });
});

// ── REMINDERS ─────────────────────────────────────────────────────────────────
app.get('/api/reminders', authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  const rows = await supabase('GET', 'reminders', null,
    `?user_id=eq.${encodeURIComponent(user_id)}&order=due_date`);
  if (rows === null) return res.status(500).json({ error: 'Database error' });
  res.json({ reminders: rows });
});

app.post('/api/reminders', authenticateToken, async (req, res) => {
  const fields = { ...req.body };
  delete fields.user_id; // strip any client-supplied user_id from the body
  const user_id = req.user.id;
  const rows = await supabase('POST', 'reminders', { user_id, ...fields });
  if (!rows || !rows[0]) return res.status(500).json({ error: 'Failed to save reminder' });
  res.json({ reminder: rows[0] });
});

app.patch('/api/reminders/:id', authenticateToken, async (req, res) => {
  if (!isValidUUID(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const user_id = req.user.id;
  const body = { ...req.body };
  delete body.user_id; // never let the client move a row to a different owner
  const rows = await supabase('PATCH', 'reminders', body,
    `?id=eq.${encodeURIComponent(req.params.id)}&user_id=eq.${encodeURIComponent(user_id)}`);
  if (!rows || !rows[0]) return res.status(404).json({ error: 'Reminder not found' });
  res.json({ reminder: rows[0] });
});

// ── MIKE KNOWLEDGE ────────────────────────────────────────────────────────────
app.get('/api/knowledge', authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  const rows = await supabase('GET', 'mike_knowledge', null,
    `?user_id=eq.${encodeURIComponent(user_id)}&order=created_at.desc&limit=100`);
  if (rows === null) return res.status(500).json({ error: 'Database error' });
  res.json({ knowledge: rows });
});

app.post('/api/knowledge', authenticateToken, async (req, res) => {
  const { fact, topic } = req.body;
  if (!fact) return res.status(400).json({ error: 'fact required' });
  const user_id = req.user.id;
  const rows = await supabase('POST', 'mike_knowledge', { user_id, fact, topic });
  if (!rows || !rows[0]) return res.status(500).json({ error: 'Failed to save knowledge' });
  res.json({ knowledge: rows[0] });
});

// ── ANNOUNCEMENT (env-flagged; powers the in-app banner, no deploy needed to toggle) ──
app.get('/api/announcement', (req, res) => {
  if (process.env.PRICE50_ANNOUNCE === '1') {
    return res.json({ active: true, id: 'price50-nov1',
      title: 'Mike is changing to $50/month on November 1st',
      body: 'Down from $100. One saved callback and he pays for himself. Questions? Just ask Mike.' });
  }
  res.json({ active: false });
});

// ── EVENTS (per-tech usage / outcome spine for the company tracking dashboard) ──
// Append-only signal log. trackUsage() POSTs type='usage'; later slices add upsell /
// repair-replace / coaching outcomes (with amount). Per-user_id; the admin rollup
// joins these to the roster to show what each tech actually does. Cheap rows.
app.post('/api/events', authenticateToken, async (req, res) => {
  const { type, payload, amount } = req.body;
  if (!type) return res.status(400).json({ error: 'type required' });
  const user_id = req.user.id;
  const row = {
    user_id,
    type: String(type).slice(0, 40),
    payload: (payload && typeof payload === 'object') ? payload : {},
    amount: (amount != null && !isNaN(amount)) ? Number(amount) : null,
  };
  const rows = await supabase('POST', 'events', row);
  if (!rows || !rows[0]) return res.status(500).json({ error: 'Failed to record event' });
  res.json({ event: rows[0] });
});

// A tech's own event history — powers the longitudinal coaching memory (Mike recalls
// what this tech has drilled) and their personal numbers.
app.get('/api/events', authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  if (!SUPABASE_URL) return res.json({ events: [] });
  const rows = await supabase('GET', 'events', null,
    `?select=type,amount,payload,created_at&user_id=eq.${encodeURIComponent(user_id)}&order=created_at.desc&limit=500`);
  if (rows === null) return res.status(500).json({ error: 'Database error' });
  res.json({ events: rows || [] });
});

// Admin rollup feed: recent events for the dashboard to aggregate per tech. Bounded
// limit keeps it cheap; swap for a Postgres view/RPC when volume grows.
app.get('/api/admin/events', authenticateToken, requireAdminOrOwner, async (req, res) => {
  if (!SUPABASE_URL) return res.json({ events: [] });
  let userFilter = '';
  if (!req.scope.all) {
    // owner: restrict events to techs in their company (data isolation)
    const techs = await supabase('GET', 'users', null,
      `?select=id&company=eq.${encodeURIComponent(req.scope.company)}`);
    const ids = (techs || []).map(t => t.id).filter(Boolean);
    if (!ids.length) return res.json({ events: [] });
    userFilter = `&user_id=in.(${ids.map(encodeURIComponent).join(',')})`;
  }
  // Exclude the synthetic site_traffic aggregate rows — they're owned by the admin
  // account for storage reasons and would otherwise distort the per-tech numbers.
  const rows = await supabase('GET', 'events', null,
    `?select=user_id,type,amount,created_at&type=neq.site_traffic&order=created_at.desc&limit=10000${userFilter}`);
  if (rows === null) return res.status(500).json({ error: 'Database error' });
  res.json({ events: rows || [] });
});

// ── ADMIN STATS ───────────────────────────────────────────────────────────────
// The single "how are we doing" endpoint: site traffic (including people who never
// signed up), how much Mike is actually being used, and the conversion between the
// two. Before this existed we could not tell a traffic problem from a pitch problem.
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  if (!SUPABASE_URL) return res.json({ traffic: {}, usage: {}, accounts: {} });
  await flushTraffic(); // make sure today's in-memory counters are included

  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const rows = await supabase('GET', 'events', null,
    `?select=user_id,type,payload,created_at&created_at=gte.${since}&order=created_at.desc&limit=20000`);
  if (rows === null) return res.status(500).json({ error: 'Database error' });

  const _allUsers = await supabase('GET', 'users', null,
    '?select=id,email,name,plan,created_at,stripe_subscription_id,company&limit=500') || [];

  // HOUSE ACCOUNTS ARE NOT TECHNICIANS. Every QA signup made while testing on production
  // — and there are dozens — was being counted here as a technician. On 2026-08-31 this
  // page reported 41 accounts when 19 were real, and a deck went out with the wrong
  // number because the dashboard said so. A number Brandon reads to make a decision, or
  // to quote to a buyer, has to be the true one by default; making him remember to
  // subtract is how the wrong figure reaches a room.
  //
  // Matched by EMAIL PATTERN, not a hardcoded id list — every test run mints a new
  // account and a list of ids goes stale the first time anyone signs up.
  const HOUSE_EMAIL = /^(trazertest\+|qa@|qa-crew@|test@)|@trazer\.test$|^venturabv12@gmail\.com$/i;
  // qa-crew@trazerintelligence.com is the automated test rig and does not look like a QA
  // address by pattern — it slipped through and its 36 questions inflated every number on
  // this page. Belt and braces: pattern, company name, and the two known house ids.
  const HOUSE_ID = new Set(['7725dfff-9e37-4eb9-a2cd-5d8c547fbeb3', '8c63d02a-e2cc-4401-b457-74d98c8752bd']);
  const isHouse = (u) => !!u && (
    HOUSE_ID.has(u.id) ||
    (u.email && HOUSE_EMAIL.test(u.email)) ||
    /\b(qa|internal|test)\b/i.test(String(u.company || ''))
  );
  const users = _allUsers.filter(u => !isHouse(u));
  const houseIds = new Set(_allUsers.filter(isHouse).map(u => u.id));
  const nameById = Object.fromEntries(_allUsers.map(u => [u.id, u.name || u.email]));

  // Every date below is an EASTERN calendar day so "Today" matches Brandon's clock.
  const dayKey = d => _dayET(d);
  const today = _today();
  const ago = n => _dayET(new Date(Date.now() - n * 86400000));

  // ---- traffic (daily aggregate rows) ----
  const tRows = rows.filter(r => r.type === 'site_traffic');
  const byDate = {};
  for (const r of tRows) {
    const p = r.payload || {}; const d = p.date || dayKey(r.created_at);
    // 2026-08-18 — THIS USED TO ASSIGN, NOT ACCUMULATE. Every Railway restart begins a new
    // row for the same day (the writer's rowId lives in memory), so most days carry 2+ rows
    // — 14 of 16 days did. Keeping one and dropping the rest silently UNDER-reported traffic
    // by whatever the discarded rows held (Aug 11: kept 2 visitors, discarded 11).
    const cur = byDate[d] || { views: 0, uniques: 0, refs: {}, hashes: null };
    cur.views += p.views || 0;
    cur.uniques += p.uniques || 0;   // fallback path only; hashes below are authoritative
    if (Array.isArray(p.hashes)) cur.hashes = (cur.hashes || []).concat(p.hashes);
    for (const [k, n] of Object.entries(p.refs || {})) cur.refs[k] = (cur.refs[k] || 0) + n;
    byDate[d] = cur;
  }
  // Union the per-day hash sets so one person visiting 30 days in a row is ONE visitor.
  // Days recorded before this shipped have no hash list; for those we fall back to the
  // old per-day count and flag the range as approximate rather than quietly mixing the
  // two methods and reporting a number nobody can trust.
  const sumRange = days => {
    let v = 0, fallback = 0; const refs = {}; const seen = new Set(); let exact = true;
    for (const [d, x] of Object.entries(byDate)) {
      if (d >= ago(days)) {
        v += x.views;
        if (x.hashes) { for (const h of x.hashes) seen.add(h); }
        else { fallback += x.uniques; exact = false; }
        for (const [k, n] of Object.entries(x.refs)) refs[k] = (refs[k] || 0) + n;
      }
    }
    return { views: v, uniques: seen.size + fallback, exactUniques: exact,
             dedupedVisitors: seen.size, refs };
  };
  const d7 = sumRange(7), d30 = sumRange(30);

  // ---- Mike usage ----
  // `rows` is capped at 30 days, so anything derived from it is a 30-DAY view. Activation
  // ("has this tech ever asked Mike anything?") is a LIFETIME question — judging it on a
  // 30-day slice put every tech who used Mike in June onto the "signed up, never used it"
  // list, i.e. the list Brandon actually texts. Pull ask history unbounded for that.
  // Same rule as the accounts above: an event from a house account is not a technician
  // using the product. Without this the ask counts, the activation rate and the "still
  // using it" number all include my own testing, and Brandon reads a number that flatters
  // us — which is the one direction a metric must never be wrong in.
  const notHouse = (r) => !houseIds.has(r && r.user_id);
  const asks = rows.filter(r => r.type === 'mike_ask' && notHouse(r));
  const asksAll = ((await supabase('GET', 'events', null,
    `?select=user_id,created_at&type=eq.mike_ask&order=created_at.asc&limit=20000`)) || []).filter(notHouse);
  // The day ask-logging went live. Before it, silence means "not instrumented", NOT
  // "never used Mike" — every metric below that would otherwise read the gap as failure.
  const ASK_LOG_START = asksAll.length ? asksAll[0].created_at : null;
  const perTech = {};
  for (const a of asks) perTech[a.user_id] = (perTech[a.user_id] || 0) + 1;

  const signups30 = users.filter(u => u.created_at && dayKey(u.created_at) >= ago(30)).length;

  // ---- THE FUNNEL ----------------------------------------------------------
  // Endpoint numbers say WHETHER something is wrong; the funnel says WHERE. Each
  // stage carries the drop-off from the stage above it, so the worst leak is
  // obvious at a glance and the team can work the right problem instead of
  // guessing between "not enough traffic" and "they sign up and never use it".
  const PAID_PLANS = ['pro', 'team', 'starter'];
  const askedEver = new Set(asksAll.map(a => a.user_id));
  const asked7 = new Set(asks.filter(a => dayKey(a.created_at) >= ago(7)).map(a => a.user_id));
  const paying = users.filter(u => u.stripe_subscription_id || PAID_PLANS.includes(u.plan));

  // Time from signup to first question — how long the product takes to prove itself.
  const firstAskByUser = {};
  for (const a of asksAll) {
    const t = new Date(a.created_at).getTime();
    if (!firstAskByUser[a.user_id] || t < firstAskByUser[a.user_id]) firstAskByUser[a.user_id] = t;
  }
  // Only techs who signed up AFTER ask-logging began have a real number here. For anyone
  // older, "first ask" is just the day we switched logging on, so the median measured our
  // own deploy date (it read 664.5h ≈ 27 days) rather than how fast Mike proves himself.
  const logStartMs = ASK_LOG_START ? new Date(ASK_LOG_START).getTime() : null;
  const ttfa = users
    .filter(u => u.created_at && logStartMs && new Date(u.created_at).getTime() >= logStartMs)
    .map(u => (firstAskByUser[u.id] && u.created_at)
      ? (firstAskByUser[u.id] - new Date(u.created_at).getTime()) / 3600000 : null)
    .filter(h => h != null && h >= 0)
    .sort((a, b) => a - b);
  const medianHoursToFirstAsk = ttfa.length ? +ttfa[Math.floor(ttfa.length / 2)].toFixed(1) : null;

  const stage = (label, count, prev, hint) => ({
    stage: label,
    count,
    // conversion from the previous stage — the drop-off is 100 minus this
    ofPrevious: prev ? +(count / prev * 100).toFixed(1) : null,
    lostHere: prev ? prev - count : null,
    hint,
  });

  // 2026-08-18 — THE FUNNEL USED TO COMPARE DIFFERENT GROUPS OF PEOPLE. Steps 1-2 were
  // 30-day; steps 3-5 were all-time. That is how it rendered "Created an account: 9"
  // followed by "Actually asked Mike: 10" — ten out of nine — and reported "lost 19" at a
  // stage only 9 people had entered. A funnel whose stages don't share a population isn't
  // a funnel. Split into the two questions it was really trying to answer, each internally
  // consistent, each labelled with its own window.
  const visitors30 = d30.uniques;
  const activatedAll = users.filter(u => askedEver.has(u.id)).length;

  // (1) ACQUISITION — strangers arriving vs strangers signing up. Both 30d.
  const funnel = [
    stage('Visited the site', visitors30, null,
      d30.exactUniques ? 'unique visitors, 30d' : 'visitors, 30d (part of this range predates de-duplication)'),
    stage('Created an account', signups30, visitors30, 'the pitch on the page · 30d'),
  ];

  // (2) ACTIVATION + RETENTION — what happens to accounts once they exist. All-time
  // population, so every stage below divides into the same 19 (or however many) people.
  const lifecycle = [
    stage('Accounts created', users.length, null, 'all time'),
    stage('Actually asked Mike', activatedAll, users.length, 'onboarding — did they ever get value'),
    stage('Still using it (7d)', asked7.size, activatedAll, 'retention — does it stick'),
    stage('Paying', paying.length, users.length, 'the ask — have they been asked to pay'),
  ];

  // ---- MOVEMENT: this week vs last week -------------------------------------
  // A flat number can't tell you if you're winning. Every headline gets a
  // direction so the dashboard answers "better or worse than last week".
  const inWindow = (d, fromDaysAgo, toDaysAgo) => {
    const k = dayKey(d);
    return k >= ago(fromDaysAgo) && k < ago(toDaysAgo);
  };
  const sumTraffic = (from, to) => {
    let u = 0;
    for (const [d, x] of Object.entries(byDate)) if (d >= ago(from) && d < ago(to)) u += x.uniques || 0;
    return u;
  };
  const delta = (now, prev) => ({
    now, prev,
    change: prev ? +(((now - prev) / prev) * 100).toFixed(0) : (now ? 100 : 0),
  });
  const movement = {
    visitors: delta(sumTraffic(7, 0), sumTraffic(14, 7)),
    signups: delta(
      users.filter(u => u.created_at && inWindow(u.created_at, 7, 0)).length,
      users.filter(u => u.created_at && inWindow(u.created_at, 14, 7)).length),
    asks: delta(
      asks.filter(a => inWindow(a.created_at, 7, 0)).length,
      asks.filter(a => inWindow(a.created_at, 14, 7)).length),
    activeTechs: delta(
      new Set(asks.filter(a => inWindow(a.created_at, 7, 0)).map(a => a.user_id)).size,
      new Set(asks.filter(a => inWindow(a.created_at, 14, 7)).map(a => a.user_id)).size),
  };

  // ---- WHO NEEDS YOU: churn and dead signups, as NAMES not percentages ------
  // A churn rate tells you that you have a problem. A list of names tells you
  // who to text. Brandon runs this from his phone, so the list is the product.
  const lastAskByUser = {};
  for (const a of asksAll) {
    const t = new Date(a.created_at).getTime();
    if (!lastAskByUser[a.user_id] || t > lastAskByUser[a.user_id]) lastAskByUser[a.user_id] = t;
  }
  const daysAgoFrom = ms => Math.floor((Date.now() - ms) / 86400000);
  const contact = u => ({ name: u.name || '(no name)', email: u.email, company: u.company || null, plan: u.plan });

  // Signed up and NEVER asked a single question. The most expensive failure there
  // is: they took the trouble to create an account and got nothing out of it.
  const neverUsed = users
    .filter(u => !askedEver.has(u.id))
    .map(u => Object.assign(contact(u), { daysSinceSignup: u.created_at ? daysAgoFrom(new Date(u.created_at).getTime()) : null }))
    .sort((a, b) => (b.daysSinceSignup || 0) - (a.daysSinceSignup || 0));

  // Used it, then stopped. 14 days silent is the churn signal at this volume.
  const wentQuiet = users
    .filter(u => askedEver.has(u.id) && lastAskByUser[u.id] && daysAgoFrom(lastAskByUser[u.id]) >= 14)
    .map(u => Object.assign(contact(u), { daysSinceLastUse: daysAgoFrom(lastAskByUser[u.id]) }))
    .sort((a, b) => b.daysSinceLastUse - a.daysSinceLastUse);

  const activatedCount = users.filter(u => askedEver.has(u.id)).length;
  const askLogDays = ASK_LOG_START
    ? Math.floor((Date.now() - new Date(ASK_LOG_START).getTime()) / 86400000) : null;

  // ── WHAT A CONTRACTOR ACTUALLY ASKS FOR ────────────────────────────────────
  // A CEO deciding whether to roll this out has exactly two questions: are my people
  // using it, and is it catching anything. Signups answer neither. These do.
  //
  // ADOPTION leads, because "I'll buy it and nobody will use it" is the real objection
  // and the honest number beats a flattering one — he will find it either way.
  const _in30 = (r) => r && r.created_at && dayKey(r.created_at) >= ago(30);
  const _in7  = (r) => r && r.created_at && dayKey(r.created_at) >= ago(7);
  const _evt  = (t) => rows.filter(r => r.type === t && notHouse(r));

  const jobsOpened   = _evt('job_start').filter(_in30).length;
  const jobsClosed   = _evt('job_closed').filter(_in30).length;
  const warrantyRuns = _evt('warranty_lookup').filter(_in30);
  // THE MONEY NUMBER. A lookup that came back "found, but never registered" is a unit
  // the customer believes is covered and is not — a part the technician was about to
  // eat, or quote wrong. Every one of these is a callback or a chargeback avoided.
  const warrantyCaught = warrantyRuns.filter(r => {
    const p = r.payload || {};
    return p.found === true && p.registered === false;
  }).length;

  const adoption = {
    accounts: users.length,
    activated: activatedAll,
    activationPct: users.length ? +((activatedAll / users.length) * 100).toFixed(1) : 0,
    active7: asked7.size,
    active30: new Set(asks.filter(_in30).map(a => a.user_id)).size,
    questions7: asks.filter(_in7).length,
    questions30: asks.filter(_in30).length,
    note: 'activated = has ever asked Mike anything. House/QA accounts excluded.',
  };

  const work = {
    jobsOpened, jobsClosed,
    warrantyLookups: warrantyRuns.length,
    warrantyCaughtUnregistered: warrantyCaught,
    note: 'last 30 days. "caught unregistered" = the registry answered and the unit was NOT registered.',
  };

  // PER COMPANY. Everything above is global; a contractor wants his own crew. Grouped on
  // the company a tech typed at signup, normalised — "FH Furr", "Fhfurr" and "Fh. Furr"
  // are one company, and counting them as three is how a deck claimed nine.
  // Techs type their employer freehand: "FH Furr", "Fhfurr", "Fh. Furr", "Furr". Stripping
  // punctuation still leaves "fhfurr" and "furr" as two companies, which is exactly how a
  // deck once claimed nine companies for one. Collapse on the distinctive word.
  const _normCo = (c) => {
    const k = String(c || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!k) return null;
    const KNOWN = ['furr'];   // add a name here when a second multi-spelling company appears
    for (const w of KNOWN) if (k.includes(w)) return w;
    return k;
  };
  const _coLabel = {};
  const byCompanyMap = {};
  for (const u of users) {
    const k = _normCo(u.company); if (!k) continue;
    const _raw = String(u.company).trim();
    if (!_coLabel[k] || _raw.length > _coLabel[k].length) _coLabel[k] = _raw;
    const c = byCompanyMap[k] || (byCompanyMap[k] = { key: k, company: _coLabel[k], accounts: 0, activated: 0, active7: 0, questions30: 0, ids: new Set() });
    c.accounts++; c.ids.add(u.id);
    if (askedEver.has(u.id)) c.activated++;
    if (asked7.has(u.id)) c.active7++;
  }
  for (const a of asks) {
    if (!_in30(a)) continue;
    for (const c of Object.values(byCompanyMap)) if (c.ids.has(a.user_id)) { c.questions30++; break; }
  }
  for (const c of Object.values(byCompanyMap)) c.company = _coLabel[c.key] || c.company;
  const byCompany = Object.values(byCompanyMap)
    .map(({ ids, key, ...c }) => Object.assign(c, {
      activationPct: c.accounts ? +((c.activated / c.accounts) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.accounts - a.accounts);

  res.json({
    adoption,
    work,
    byCompany,
    movement,
    attention: {
      neverUsed,
      wentQuiet,
      // Churn here means "used it, then went silent" — at $0 revenue there are no
      // cancellations to count, so silence is the only honest churn signal we have.
      // A tech only counts as churned after 14 SILENT days, so churn cannot be measured
      // until ask-logging has been running longer than that. Reporting "0%" off a shorter
      // history isn't zero churn, it's no data — and it reads as good news. Withhold it.
      churnRate: (activatedCount && askLogDays != null && askLogDays >= 14 + 7)
        ? +((wentQuiet.length / activatedCount) * 100).toFixed(1) : null,
      churnMeasurable: askLogDays != null && askLogDays >= 14 + 7,
      churnBasis: 'used it at least once, then no questions for 14+ days',
      churnNote: (askLogDays != null && askLogDays < 14 + 7)
        ? `not measurable yet — question logging has only been on for ${askLogDays} days; churn needs 14 silent days to register`
        : null,
    },
    // How hard the people who DO use it lean on it: active this week / ever activated.
    stickiness: activatedCount ? +((asked7.size / activatedCount) * 100).toFixed(1) : null,
    traffic: {
      today: byDate[today] || { views: 0, uniques: 0, refs: {} },
      last7: d7,
      last30: d30,
      daily: Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30)
        .map(([date, x]) => ({ date, views: x.views, uniques: x.uniques })),
      // NOTE THE UNIT: refs count PAGE VIEWS, not people. Shown next to a visitor count
      // this produced "direct (257)" beside "240 visited" and looked like a contradiction.
      // The unit ships with the number so the UI can't render them as comparable.
      topReferrers: Object.entries(d30.refs).sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([source, hits]) => ({ source, views: hits, hits, unit: 'views' })),
      referrerUnit: 'views',
    },
    usage: {
      asksTotal: asks.length,
      asksToday: asks.filter(a => dayKey(a.created_at) === today).length,
      asks7: asks.filter(a => dayKey(a.created_at) >= ago(7)).length,
      activeTechs7: new Set(asks.filter(a => dayKey(a.created_at) >= ago(7)).map(a => a.user_id)).size,
      perTech: Object.entries(perTech).sort((a, b) => b[1] - a[1])
        .map(([id, count]) => ({ tech: nameById[id] || id, count })),
    },
    accounts: {
      total: users.length,
      signups30,
      // visitors -> signups. The number that says whether the problem is traffic or pitch.
      conversion30: d30.uniques ? +(signups30 / d30.uniques * 100).toFixed(2) : null,
      activated: users.filter(u => askedEver.has(u.id)).length,
      activationRate: users.length ? +(users.filter(u => askedEver.has(u.id)).length / users.length * 100).toFixed(1) : null,
      paying: paying.length,
      medianHoursToFirstAsk,
    },
    funnel,          // acquisition — visitors -> signups, both 30d
    lifecycle,       // activation + retention + revenue, all-time population
    askLogStart: ASK_LOG_START,
    askLogDays,
    note: 'mike_ask logging began 2026-08-03 — activation and retention build from that date forward.',
  });
});

// Promote a customer's owner to a company OWNER — they get a dashboard scoped to just
// their crew. Super-admin only. Reuses the company string; owner + techs must share
// the exact company name (a real company_id FK replaces this when we go multi-customer).
app.post('/api/admin/set-owner', authenticateToken, requireAdmin, async (req, res) => {
  const { email, company } = req.body || {};
  if (!email || !company) return res.status(400).json({ error: 'email and company required' });
  if (!SUPABASE_URL) return res.json({ ok: true, dev: true });
  const rows = await supabase('PATCH', 'users', { role: 'owner', company: String(company).trim() },
    `?email=eq.${encodeURIComponent(String(email).toLowerCase().trim())}`);
  if (!rows || !rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json({ ok: true, owner: { email: rows[0].email, company: rows[0].company, role: rows[0].role } });
});

// ── KNOWLEDGE LIBRARY ───────────────────────────────────────────────────────────
// Model-keyed cache of Mike's redrawn wiring diagrams ("the moat"). The first tech
// on a given exact model pays the AI cost once; every future tech on that EXACT
// model gets the saved SVG instantly (zero AI cost). All routes fail SAFE — any
// supabase() null becomes { found:false } / { ok:false }, never a 500 of the app.
// Serving is mike-svg only this phase; matching is dead-exact (normalizeModelKey).

// GET /api/library/:modelKey — lookup a model + its diagrams (verified first). Zero AI.
app.get('/api/library/:modelKey', authenticateToken, async (req, res) => {
  try {
    const modelKey = String(req.params.modelKey || '').toUpperCase();
    if (!modelKey) return res.json({ found: false });
    const models = await supabase('GET', 'library_models', null,
      `?model_key=eq.${encodeURIComponent(modelKey)}&limit=1`);
    if (!models || !models[0]) return res.json({ found: false });
    const model = models[0];
    // verified diagrams first, then newest — only mike-svg are served this phase.
    const diags = await supabase('GET', 'library_diagrams', null,
      `?model_key=eq.${encodeURIComponent(modelKey)}&source=eq.mike-svg&order=verified.desc,created_at.desc`);
    const diagrams = (diags || []).map(d => ({
      id: d.id, circuit_type: d.circuit_type, svg: d.svg,
      verified: !!d.verified, oem_diagram_number: d.oem_diagram_number,
    }));
    res.json({ found: true, model: {
      model_key: model.model_key, model_raw: model.model_raw, brand: model.brand,
      equipment_type: model.equipment_type, specs: model.specs, specs_verified: !!model.specs_verified,
    }, diagrams });
  } catch (e) {
    console.error('library GET error:', e.message);
    res.json({ found: false });
  }
});

// POST /api/library/diagram — save Mike's freshly-drawn SVG as unverified.
// Upserts the model row, then UPDATEs an existing (model_key,circuit_type,mike-svg)
// row if present (no dupes) else INSERTs a new one. Body: {brand,model,circuit_type,svg,oem_diagram_number?}
app.post('/api/library/diagram', authenticateToken, async (req, res) => {
  try {
    const { brand, model, circuit_type, svg, oem_diagram_number } = req.body || {};
    if (!model || !svg) return res.json({ ok: false, error: 'model and svg required' });
    const model_key = normalizeModelKey(brand, model);
    if (!model_key) return res.json({ ok: false, error: 'bad model' });
    const ct = circuit_type || 'full';
    const who = req.user.email || req.user.id;

    // 1) Upsert model row WITHOUT relying on PostgREST merge-duplicates (the shared
    //    supabase() helper doesn't send Prefer: resolution=merge-duplicates), so we
    //    GET-then-PATCH-or-INSERT on the unique model_key. Fails safe either way.
    const haveModel = await supabase('GET', 'library_models', null,
      `?model_key=eq.${encodeURIComponent(model_key)}&select=model_key&limit=1`);
    if (haveModel && haveModel[0]) {
      await supabase('PATCH', 'library_models',
        { model_raw: model, brand: (brand || null), family: _extractModelFamily(model),
          updated_at: new Date().toISOString() },
        `?model_key=eq.${encodeURIComponent(model_key)}`);
    } else {
      await supabase('POST', 'library_models',
        { model_key, model_raw: model, brand: (brand || null), family: _extractModelFamily(model),
          updated_at: new Date().toISOString(), created_by: who });
    }

    // 2) Dedup: does a mike-svg row for this model_key + circuit_type already exist?
    const existing = await supabase('GET', 'library_diagrams', null,
      `?model_key=eq.${encodeURIComponent(model_key)}&circuit_type=eq.${encodeURIComponent(ct)}&source=eq.mike-svg&limit=1`);
    if (existing && existing[0]) {
      // Update the existing UNVERIFIED draw in place; leave a verified one untouched.
      if (existing[0].verified) return res.json({ ok: true, model_key, diagram_id: existing[0].id, updated: false, verified: true });
      const upd = await supabase('PATCH', 'library_diagrams',
        { svg, oem_diagram_number: (oem_diagram_number || existing[0].oem_diagram_number || null), created_by: who },
        `?id=eq.${existing[0].id}`);
      const row = (upd && upd[0]) || existing[0];
      return res.json({ ok: true, model_key, diagram_id: row.id, updated: true });
    }

    // 3) Insert fresh unverified mike-svg row.
    const ins = await supabase('POST', 'library_diagrams',
      { model_key, circuit_type: ct, source: 'mike-svg', svg,
        oem_diagram_number: (oem_diagram_number || null), verified: false, created_by: who });
    if (!ins || !ins[0]) return res.json({ ok: false, error: 'insert failed' });
    res.json({ ok: true, model_key, diagram_id: ins[0].id, created: true });
  } catch (e) {
    console.error('library diagram POST error:', e.message);
    res.json({ ok: false });
  }
});

// POST /api/library/flag — report a bad diagram. Logs the flag, bumps flag_count,
// auto-demotes (verified=false) at >=2 flags ("fail toward distrust"). Body: {diagram_id,model_key,reason}
app.post('/api/library/flag', authenticateToken, async (req, res) => {
  try {
    const { diagram_id, model_key, reason } = req.body || {};
    if (!diagram_id) return res.json({ ok: false, error: 'diagram_id required' });
    await supabase('POST', 'library_flags',
      { diagram_id, model_key: (model_key || null), reporter_user_id: (req.user.id || req.user.email),
        reason: (reason || null), status: 'open' });
    // Read current count, increment, and demote at the threshold.
    const cur = await supabase('GET', 'library_diagrams', null,
      `?id=eq.${encodeURIComponent(diagram_id)}&select=flag_count,verified&limit=1`);
    const count = ((cur && cur[0] && cur[0].flag_count) || 0) + 1;
    const patch = { flag_count: count, last_flagged_at: new Date().toISOString() };
    if (count >= 2) patch.verified = false; // auto-demote: distrust until re-verified
    await supabase('PATCH', 'library_diagrams', patch, `?id=eq.${encodeURIComponent(diagram_id)}`);
    res.json({ ok: true, flag_count: count, demoted: count >= 2 });
  } catch (e) {
    console.error('library flag POST error:', e.message);
    res.json({ ok: false });
  }
});

// PATCH /api/library/verify/:diagramId — admin marks a diagram as trusted/canonical.
app.patch('/api/library/verify/:diagramId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.diagramId || '');
    if (!id) return res.json({ ok: false, error: 'diagram id required' });
    const upd = await supabase('PATCH', 'library_diagrams',
      { verified: true, verified_by: (req.user.email || req.user.id), verified_at: new Date().toISOString() },
      `?id=eq.${encodeURIComponent(id)}`);
    if (!upd || !upd[0]) return res.json({ ok: false, error: 'not found' });
    res.json({ ok: true, diagram: { id: upd[0].id, verified: !!upd[0].verified } });
  } catch (e) {
    console.error('library verify PATCH error:', e.message);
    res.json({ ok: false });
  }
});

// GET /api/library/admin/unverified — admin list of pending mike-svg draws to review.
app.get('/api/library/admin/unverified', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rows = await supabase('GET', 'library_diagrams', null,
      `?source=eq.mike-svg&verified=eq.false&order=created_at.desc&limit=100`);
    res.json({ diagrams: (rows || []).map(d => ({
      id: d.id, model_key: d.model_key, circuit_type: d.circuit_type, svg: d.svg,
      flag_count: d.flag_count, created_by: d.created_by, created_at: d.created_at,
    })) });
  } catch (e) {
    console.error('library admin list error:', e.message);
    res.json({ diagrams: [] });
  }
});

// GET /diagrams/redraw/:id — serve a freshly-drawn simplified SVG (from the in-memory store) so the
// client's existing in-chat diagram renderer can display it as an image.
app.get('/diagrams/redraw/:id', (req, res) => {
  const svg = _redrawStore.get(String(req.params.id || ''));
  if (!svg) return res.status(404).send('Not found');
  res.set('Content-Type', 'image/svg+xml; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

// POST /api/redraw — a tech uploads a photo of a wiring diagram; Mike traces it and returns a clean,
// simplified illustration (SVG). Checks the SHARED library first (do-once — instant + free on a hit);
// on a miss, runs the redraw engine, SAVES the result to the shared library so the next tech on that
// model gets it instantly, then returns it. Body: { image (data-URL or base64), brand, model, circuit? }
app.post('/api/redraw', aiLimiter, authenticateToken, requirePaidAccess, async (req, res) => {
  if (!ANTHROPIC_API_KEY) return res.status(503).json({ ok: false, error: 'Redraw is unavailable right now.' });
  try {
    const { image, brand, model, circuit } = req.body || {};
    if (!image || !model) return res.json({ ok: false, error: 'A photo of the diagram and the model number are both needed.' });
    const model_key = normalizeModelKey(brand, model);
    if (!model_key) return res.json({ ok: false, error: 'Could not read that model number.' });
    const ct = circuit || 'full';

    // 1) shared-library cache hit → serve instantly (do-once per model, free)
    if (SUPABASE_URL) {
      const cached = await supabase('GET', 'library_diagrams', null,
        `?model_key=eq.${encodeURIComponent(model_key)}&circuit_type=eq.${encodeURIComponent(ct)}&source=eq.mike-svg&order=verified.desc,created_at.desc&limit=1`);
      if (cached && cached[0] && cached[0].svg) {
        return res.json({ ok: true, model_key, svg: cached[0].svg, cached: true, verified: !!cached[0].verified });
      }
    }

    // 2) miss → trace the uploaded diagram (vision)
    let out;
    try { out = await extractNetlist(image, { modelKey: model_key, circuitType: ct, apiKey: ANTHROPIC_API_KEY }); }
    catch (e) { console.error('redraw trace error:', e.message); return res.json({ ok: false, error: "Couldn't read that photo — try a clearer, straight-on shot of the whole wiring diagram." }); }

    // wire-level fail-toward-distrust + gates (same discipline as the batch library)
    const netlist = sanitizeNetlist(out.netlist);
    if (!validateNetlist(netlist).ok) return res.json({ ok: false, error: 'That diagram was too unclear to redraw — try a sharper photo.' });
    const roles = netlist.components.map(c => roleOf(c)).filter(Boolean);
    const core = ['contactor', 'compressor', 'runcap', 'fan'].filter(r => roles.includes(r));
    if (core.length < 4) return res.json({ ok: false, error: 'Not enough of the circuit was legible — get the whole diagram in frame, closer and straight-on.' });
    const svg = renderIllustrationSVG(netlist);

    // 3) save to the SHARED library (best-effort) so the next tech on this model gets it instant
    if (SUPABASE_URL) {
      try {
        const who = req.user.email || req.user.id;
        const haveModel = await supabase('GET', 'library_models', null, `?model_key=eq.${encodeURIComponent(model_key)}&select=model_key&limit=1`);
        if (!(haveModel && haveModel[0])) {
          await supabase('POST', 'library_models', { model_key, model_raw: model, brand: (brand || null), family: _extractModelFamily(model), updated_at: new Date().toISOString(), created_by: who });
        }
        await supabase('POST', 'library_diagrams', { model_key, circuit_type: ct, source: 'mike-svg', svg, verified: false, created_by: who });
      } catch (e) { console.error('redraw save (non-fatal):', e.message); }
    }

    res.json({ ok: true, model_key, svg, cached: false });
  } catch (e) {
    console.error('redraw error:', e.message);
    res.json({ ok: false, error: 'Redraw failed — please try again.' });
  }
});

// ── AI ────────────────────────────────────────────────────────────────────────
// ── SERVER-SIDE PAYWALL CHECK ─────────────────────────────────────────────────
// Allow-set: admin/pro/team/starter/homeowner/beta (forever) + trial (≤TRIAL_DAYS,
// no card required — the card is collected when the window closes, not before).
// 'founder' is NOT in the allow-set anymore (Brandon, 2026-10-26: "everyone pays $50,
// founders included — it's a business") — founders without a subscription get a 402
// with founder-specific copy at the founding rate.
// No token / invalid / expired / unknown plan → denied (402, paywall flag).
// DB error → fail-open so an outage never locks out paying users/techs.
async function checkPaywall(token) {
  // No token at all → deny
  if (!token) return { allowed: false, reason: 'Authentication required' };

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return { allowed: false, reason: 'Invalid or expired session' };
  }

  // No DB → dev mode, allow through
  if (!SUPABASE_URL) return { allowed: true };

  try {
    const users = await supabase('GET', 'users', null,
      `?id=eq.${encodeURIComponent(decoded.id)}&select=plan,trial_start,created_at,stripe_subscription_id`);

    // FAIL OPEN ON A DB FAILURE, DENY ONLY ON A REAL "NO SUCH USER".
    // supabase() returns null for BOTH — a non-OK response and a 10s timeout land in the
    // same place as a genuine miss (see the helper above). Collapsing them meant a
    // Supabase blip told a PAYING technician "Account not found", which reads as "my
    // account was deleted". It also killed /api/tts and /api/redraw, which gate on this.
    // The header comment on this function has always promised fail-open; the code did
    // the opposite. /api/auth/signin already distinguishes the two — this is that fix,
    // finally carried across.
    if (users === null) {
      console.error('[paywall] DB unreachable — failing OPEN so an outage cannot lock out paying users');
      try { logUsage(decoded.id, 'paywall_degraded', { reason: 'db_unreachable' }); } catch (_) {}
      return { allowed: true, degraded: true };
    }
    if (users.length === 0)
      return { allowed: false, reason: 'Account not found' };

    const { plan, trial_start, created_at, stripe_subscription_id } = users[0];
    // NORMALIZE BEFORE COMPARING (W4 pre-flight, 2026-11-03): Brandon's own admin row
    // carried plan="Admin" — includes('Admin') is false, and with the date grandfather
    // gone the OWNER would have been walled. A hand-edited DB value must never read as
    // "no plan", so every plan comparison below is case-insensitive + whitespace-tolerant.
    const _plan = String(plan || '').trim().toLowerCase();

    // Paying + legacy plans → always allowed.
    if (ALLOWED_PLANS.includes(_plan)) return { allowed: true };

    // THE DATE GRANDFATHER IS GONE (Brandon, 2026-10-26: "everyone pays $50, founders
    // included — it's a business"). The created_at < CARD_WALL_CUTOFF_MS allow-branch
    // that lived here let any pre-Jul-24 account through forever; his decision
    // supersedes it. created_at is still selected above — it remains the trial_start
    // backstop in the trial branch below, nothing more.

    // FOUNDERS (plan='founder'): no longer a free ride, but they get their own wall.
    // A founder who PAID keeps access instantly two ways: (1) the webhook flips plan to
    // the checkout plan ('pro'), which is in ALLOWED_PLANS and returns above; (2) if the
    // row still says 'founder' but a subscription is on file (webhook race / manual
    // backfill), the sub itself is the proof — allow. Only a founder with NO sub is walled,
    // with founding-rate copy the client renders as the founder paywall screen.
    if (_plan === 'founder') {
      if (stripe_subscription_id) return { allowed: true };
      return {
        allowed: false, paywall: true, founder: true,
        reason: 'Add a card to keep Mike — $50/month, your founding rate, locked in for good. Your jobs, your memory, your history — all saved and waiting.',
      };
    }

    // NEW SIGNUPS on 'trial' — NO CARD UP FRONT (Brandon, 2026-08-07). A tech signs up and gets
    // TRIAL_DAYS of real, unrestricted Mike with nothing on file. The card is collected at the
    // END of the window, not the start: "once day 15 hits, credit card and collect."
    //
    // Why: 66 visitors converted to zero signups while the card sat in front of the product.
    // Nobody was refusing the price — they never reached it. The trial now has to earn the card.
    //
    // Order matters. Card-on-file wins first (they've already converted; Stripe owns the clock
    // from there). Otherwise fall back to our own window off trial_start, which /api/auth/signup
    // stamps on every new row. created_at is the backstop for any legacy row missing trial_start —
    // without it a null trial_start would read as epoch 0 and wall a brand-new account instantly.
    if (_plan === 'trial') {
      if (stripe_subscription_id) return { allowed: true };
      const startedAt = new Date(trial_start || created_at || 0).getTime();
      if (startedAt && Date.now() - startedAt < TRIAL_DAYS * 86400000) return { allowed: true };
      return { allowed: false, reason: 'Your free trial has ended — add a card to keep using Mike.', paywall: true };
    }

    // Any other unknown plan → deny.
    return { allowed: false, reason: 'A subscription is required to use Mike.', paywall: true };
  } catch (err) {
    console.error('Paywall check error:', err.message);
    // If DB check fails — fail open to avoid blocking paying/founding techs during an outage.
    return { allowed: true };
  }
}

// Paywall middleware for the OTHER AI-cost routes (voice /api/tts, diagram /api/redraw) — same
// gate as /api/ai so a no-card new account can't burn ElevenLabs/Anthropic spend for free.
// Token comes from the Authorization: Bearer header (these routes use authenticateToken) or body.
async function requirePaidAccess(req, res, next) {
  const token = (req.headers['authorization']?.startsWith('Bearer ') ? req.headers['authorization'].slice(7) : null)
    || req.body?.token;
  const access = await checkPaywall(token);
  if (!access.allowed)
    return res.status(402).json({ error: access.reason, paywall: access.paywall || false, founder: !!access.founder });
  next();
}

// How many voice lines a brand-new, not-yet-paying account may hear in Mike's REAL
// voice. Onboarding is ~6-8 lines; 15 covers it plus a replay.
const TTS_GRACE_LINES = 15;

// Voice access, with an onboarding exception.
//
// WHY THIS EXISTS: /api/tts is card-walled (July 2026) so free accounts can't burn
// ElevenLabs credits. But onboarding speaks through this same route — so every new
// signup got a 402, the client silently fell back to the robotic browser voice, and
// the first 30 seconds of the product (the part that sells it) was degraded for
// exactly the people who hadn't bought yet. Found 2026-08-04 on Kirk Livingston's
// signup: he heard a robot, not Mike.
//
// Paying accounts are unaffected (founders count once they subscribe — everyone pays,
// 2026-10-26). Everyone else gets a LIFETIME allowance of
// TTS_GRACE_LINES calls — enough to hear the real Mike through onboarding — after
// which the wall resumes. The counter is server-side (events rows), so a client can't
// spoof it, and it's lifetime-scoped so it can't be farmed by signing out and back in.
async function requireVoiceAccess(req, res, next) {
  const token = (req.headers['authorization']?.startsWith('Bearer ') ? req.headers['authorization'].slice(7) : null)
    || req.body?.token;
  const access = await checkPaywall(token);
  if (access.allowed) return next();

  const uid = req.user && req.user.id;
  if (!uid || !SUPABASE_URL)
    return res.status(402).json({ error: access.reason, paywall: access.paywall || false, founder: !!access.founder });

  try {
    const used = await supabase('GET', 'events', null,
      `?user_id=eq.${encodeURIComponent(uid)}&type=eq.tts_grace&select=id&limit=${TTS_GRACE_LINES + 1}`);
    if (Array.isArray(used) && used.length < TTS_GRACE_LINES) {
      // Record the grant BEFORE speaking so a burst of parallel requests can't
      // overshoot the allowance by racing the count.
      await supabase('POST', 'events', { user_id: uid, type: 'tts_grace', payload: { n: used.length + 1 } });
      return next();
    }
  } catch (e) {
    // Never let a counter failure hand out unlimited voice — fail closed to the wall.
    console.error('tts grace check failed (falling back to paywall):', e.message);
  }
  return res.status(402).json({ error: access.reason, paywall: access.paywall || false, founder: !!access.founder });
}

// ════════════════════════════════════════════════════════════════════════════
// Manual-grounded RAG — Mike answers fault-code/spec/wiring questions from real
// OEM service manuals (Supabase pgvector), with page citations. ENV-GATED: a
// no-op unless an embeddings key is set AND the manual_chunks table is populated,
// so it ships safe and dormant, then activates the moment ingestion runs. Falls
// through to the existing verified-list + web-search paths on any miss/error.
// ════════════════════════════════════════════════════════════════════════════
const _EMBED_PROVIDER = (process.env.EMBED_PROVIDER || 'voyage').toLowerCase();
const _EMBED_MODEL = process.env.EMBED_MODEL || (_EMBED_PROVIDER === 'openai' ? 'text-embedding-3-large' : 'voyage-4-large');
const _EMBED_DIM = parseInt(process.env.EMBED_DIM || (_EMBED_PROVIDER === 'openai' ? '3072' : '1024'), 10);
const _EMBED_KEY = _EMBED_PROVIDER === 'openai' ? process.env.OPENAI_API_KEY : process.env.VOYAGE_API_KEY;
const _RAG_ENABLED = !!(SUPABASE_URL && SUPABASE_SERVICE_KEY && _EMBED_KEY);
const _HVAC_BRANDS = ['carrier','bryant','payne','trane','american standard','goodman','amana','daikin','york','coleman','luxaire','rheem','ruud','lennox','allied','armstrong','heil','tempstar','comfortmaker','arcoaire','keeprite','mitsubishi','fujitsu','lg','samsung','bosch','bard','weil-mclain','burnham','lochinvar','navien','triangle tube','heatcraft','copeland','hoshizaki','manitowoc',
  // equipment brands added in later batches
  'gree','midea','friedrich','senville','pioneer','mrcool','scotsman','traulsen','bohn','tecumseh','bitzer','danfoss','nordyne','frigidaire','aaon','htp','laars',
  // thermostats
  'ecobee','nest','sensi','honeywell','pro1','braeburn','venstar','white-rodgers','aprilaire',
  // IAQ (humidifiers/dehumidifiers/air cleaners/UV/ERV-HRV/ventilation)
  'broan','fantech','renewaire','rgf','freshaireuv','santafe','generalaire','panasonic',
  // budget / secondary brands (batch8)
  'runtru','ameristar','champion','ducane','concord','airease','aireflo','ecotemp','grandaire','guardian','icp'];
// Typed variants / aliases → the canonical brand key stored in manual_chunks.brand.
const _BRAND_ALIASES = {'fresh-aire':'freshaireuv','fresh aire':'freshaireuv','freshaire':'freshaireuv','apco':'freshaireuv','reme halo':'rgf','reme-halo':'rgf','santa fe':'santafe','ultra-aire':'santafe','ultra aire':'santafe','ultraaire':'santafe','general aire':'generalaire','white rodgers':'white-rodgers','whiterodgers':'white-rodgers','pro 1':'pro1','resideo':'honeywell','honeywell home':'honeywell','google nest':'nest','emerson sensi':'sensi','run tru':'runtru','run-tru':'runtru','ameri star':'ameristar','ameri-star':'ameristar','air ease':'airease','air-ease':'airease','aire flo':'aireflo','aire-flo':'aireflo','air flo':'aireflo','air-flo':'aireflo','eco temp':'ecotemp','eco-temp':'ecotemp','grand aire':'grandaire','grand-aire':'grandaire','international comfort products':'icp','intl comfort products':'icp','day & night':'carrier','day and night':'carrier','day&night':'carrier'};

function _needsManualRetrieval(text) {
  if (!text) return false;
  if (/\b(\d{1,2}[\s-]?(?:flash|blink)(?:es|s)?|error\s+code|fault\s+code|status\s+code|diagnostic\s+code|\bE\d{1,3}\b|\bF\d{1,3}\b|\bP\d{1,2}\b|code\s+\d{1,3})\b/i.test(text)) return true;
  if (/wiring\s+(diagram|schematic|harness)|wire\s+color|terminal\s+(label|designation|layout)|connector\s+pin|ladder\s+diagram/i.test(text)) return true;
  if (/(spec|capacity|rating|\bamps?\b|\bfla\b|\brla\b|\blra\b|\bmca\b|\bmocp\b|charge|superheat|subcool|sequence\s+of\s+operation|defrost\s+(cycle|timing)|gas\s+pressure)/i.test(text) && /\b[a-z0-9]{2,}\d[a-z0-9]{2,}\b/i.test(text)) return true;
  // 2026-08-21 — THE BLIND SPOT THAT LET "cap reads 28 on a 45" ANSWER FROM MEMORY.
  // Every rule above needs a brand, a fault code, or a model-ish token. A tech standing at
  // a unit reading numbers off a meter usually types none of those — measured on 217 real
  // production questions, 74% ran with no verification of any kind. A component name next
  // to a number IS a spec question and belongs against the manuals.
  // Safe to widen: match_manual_chunks treats a NULL brand as "search all 43,290 chunks",
  // and a miss returns null and falls through exactly as it does today.
  if (/\b(cap(?:acitor)?s?|contactor|txv|txv|metering device|superheat|subcool(?:ing)?|delta[\s-]?t|static(?:\s+pressure)?|micron|megohm|amp\s*draw|\bfla\b|\brla\b|\blra\b|\bmfd\b|µf|\buf\b|head\s*pressure|suction|liquid\s*line|compressor|blower|igniter|inducer|limit|pressure\s*switch)\b/i.test(text)
      && /\d/.test(text)) return true;

  // High-recall: any known HVAC brand named + a technical/diagnostic intent → check the manuals
  // (retrieval is cheap and falls through gracefully on a miss).
  if (_extractBrand(text) && /(manual|service|fault|error|\bcode\b|flash|blink|check|test|diagnos|troublesho|lockout|short.?cycl|wiring|terminal|sequence|\bspec|pressure|charge|superheat|subcool|replace|inspect|megohm|\bohm|capacitor|igniter|ignition|flame|limit|board|sensor|valve|how (do|to)|what (does|do|should|to)|install|setup|set up|hook.?up|connect|mount|\bwire\b|schematic|diagram|reversing|defrost|c.?wire|\brc\b|\brh\b|humidist|dehumidif|thermostat|ventilat|\berv\b|\bhrv\b|filter|\buv\b|commission)/i.test(text)) return true;
  return false;
}
function _extractBrand(text) {
  const l = (text || '').toLowerCase();
  for (const b of _HVAC_BRANDS) if (l.includes(b)) return b.split(' ')[0];
  return null;
}
function _extractModelFamily(text) {
  const m = (text || '').match(/\b([A-Z]{1,4}\d{1,2}[A-Z]{0,4}\d{0,4})\b/);
  return m ? m[1].slice(0, 6).toUpperCase() : null;
}
// Knowledge Library dedup key. DEAD EXACT by Brandon's decision: canonical brand
// + ':' + the FULL model number uppercased with all non-alphanumerics stripped.
//   normalizeModelKey('Trane','4TWR5024H1000BA') -> 'TRANE:4TWR5024H1000BA'
// To relax later (family/cousin matching) swap the model segment for a family
// prefix (e.g. _extractModelFamily) — keep the brand canonicalization intact.
function normalizeModelKey(brand, modelRaw) {
  const m = String(modelRaw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!m) return null;
  let b = String(brand || '').toLowerCase().trim();
  if (_BRAND_ALIASES[b]) b = _BRAND_ALIASES[b];          // alias → canonical
  else b = (_extractBrand(b) || b.split(' ')[0] || 'UNKNOWN');
  return `${b.toUpperCase()}:${m}`;
}
async function _embedQuery(text) {
  if (_EMBED_PROVIDER === 'openai') {
    const r = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST', signal: AbortSignal.timeout(3500),
      headers: { 'Authorization': `Bearer ${_EMBED_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: _EMBED_MODEL, input: text, dimensions: _EMBED_DIM }),
    });
    if (!r.ok) throw new Error('embed ' + r.status);
    return (await r.json()).data[0].embedding;
  }
  const r = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST', signal: AbortSignal.timeout(3500),
    headers: { 'Authorization': `Bearer ${_EMBED_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: _EMBED_MODEL, input: text, input_type: 'query', output_dimension: _EMBED_DIM }),
  });
  if (!r.ok) throw new Error('embed ' + r.status);
  return (await r.json()).data[0].embedding;
}
const _RERANK_MODEL = process.env.RERANK_MODEL || 'rerank-2.5';
// Voyage reranker: reorder candidate chunks by true relevance to the question, then
// keep the best few. Vector search has high recall but mediocre ordering; the reranker
// is what makes the most-relevant manual page surface first. Voyage-only; no-op otherwise.
async function _rerank(query, docs, topK) {
  if (_EMBED_PROVIDER !== 'voyage') return null;
  try {
    const r = await fetch('https://api.voyageai.com/v1/rerank', {
      method: 'POST', signal: AbortSignal.timeout(3500),
      headers: { 'Authorization': `Bearer ${_EMBED_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: _RERANK_MODEL, query, documents: docs, top_k: topK }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return Array.isArray(d.data) ? d.data : null; // [{index, relevance_score}]
  } catch (_) { return null; }
}
async function retrieveManualContext(userText) {
  if (!_RAG_ENABLED) return null;
  try {
    const q = String(userText).slice(0, 2000);
    const embedding = await _embedQuery(q);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_manual_chunks`, {
      method: 'POST', signal: AbortSignal.timeout(2500),
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
      body: JSON.stringify({ query_embedding: embedding, match_threshold: 0.40, match_count: 20,
        filter_brand: _extractBrand(userText), filter_model_family: null }),
    });
    if (!r.ok) return null;
    let chunks = await r.json();
    if (!Array.isArray(chunks) || !chunks.length) return null;
    // Rerank the candidate pool down to the best 6 (falls back to vector order on miss).
    // Relevance floor: the reranker scores true relevance 0..1. If even the BEST candidate
    // is below the floor, we have no confident manual for this exact unit — return null so Mike
    // says "I don't have that one, read the plate" instead of being fed a wrong-family near-miss
    // (verified: real matches rerank ~0.6-0.85; wrong-family near-misses top out ~0.41).
    const RAG_RELEVANCE_FLOOR = parseFloat(process.env.RAG_RELEVANCE_FLOOR || '0.45');
    const ranked = await _rerank(q, chunks.map(c => c.chunk_text), 6);
    if (ranked && ranked.length) {
      if (ranked[0].relevance_score < RAG_RELEVANCE_FLOOR) return null;
      chunks = ranked.map(x => chunks[x.index]).filter(Boolean);
    } else {
      chunks = chunks.slice(0, 6);
    }
    // Model-family gate for TEXT chunks (2026-10-03, exam class-2 fix). The baseline run
    // verified 9 answers where retrieval fed same-brand/WRONG-FAMILY manuals (a commercial
    // DVM S VRF manual for a residential ductless; VRV IV for an FTXS wall-mount) and Mike
    // asserted terminals that don't exist on the tech's unit, undisclosed. Same principle
    // as the diagram gate below: when the query names a model and some chunks' doc titles
    // match that family, DROP the non-matching chunks. When NOTHING matches the family,
    // keep the pool (recall matters) but flag it so the prompt forces Mike to disclose the
    // platform mismatch instead of silently cross-applying it.
    // HARDENED 2026-10-04: the staged re-test showed 13/65 answers still citing wrong-family
    // manuals — now WEARING clean [Source:] tags that made them look authoritative. Three holes:
    //   1. token extraction missed R96V-style ids (1-letter prefix) and hyphen compounds
    //      (MSZ-FH12NA), and took only the FIRST token — fault-code-shaped tokens (P9, CH05,
    //      A014 after "code:"), refrigerants (R454B) and ratings (SEER2, MERV13) now excluded;
    //   2. word-named families (City Multi vs M-series, DVM S, VRV, ReliaTel vs Voyager) are
    //      not model tokens — a curated family-name list plus a commercial-VRF-vs-residential-
    //      ductless class check catch those (7 of the 13 leaks were VRF-on-ductless);
    //   3. the mismatch policy was keep-and-ask-Mike-to-disclose — proven insufficient. The
    //      mismatch now lives INSIDE every [Source:] tag so a clean-looking citation from a
    //      wrong-family manual cannot exist, and the preamble forbids transferring its numbers.
    const _NOT_MODELS = /^(R(11|12|13|22|23|32|113|114|123|125|134A?|170|290|404A|407[ACF]|410A|417A|422[BD]|427A|434A|438A|448A|449A|452B|454[ABC]|455A|466A|468A|500|502|507A?|513A|514A|600A?|717|718|744|1150|1233ZD|1234YF|1234ZE)|SEER\d*|HSPF\d*|EER\d*|AFUE\d*|MERV\d*|UL\d+|CO2?|A[123]L?|B[12]L?|PM\d+|BTUH?\d*|CFM\d*|PSIG?\d*|AWG\d*|LED\d*|DIP\d*|(CN|TB|TH|TP|SW|JP|PCB|CB|XT?|K)\d+[A-Z]?)$/;
    const _CODE_CTX = /\b(code|codes|fault|error|flash|alarm|dtc|blink)\b[\s:*=\-\u2014("']*$/i;
    const _qTokens = [];
    {
      const _up = String(userText).toUpperCase();
      const _re = /\b([A-Z]{1,5}\d{1,3}[A-Z0-9]{0,4})(-[A-Z0-9]{1,8})?\b/g;
      let _m;
      while ((_m = _re.exec(_up))) {
        if (_CODE_CTX.test(_up.slice(Math.max(0, _m.index - 26), _m.index))) continue;
        const _cands = [_m[1]];
        if (_m[2]) _cands.push((_m[1] + _m[2]).replace(/-/g, ''));
        for (const _t of _cands) {
          if (_t.length < 4 || _t.length > 12) continue;
          if (_NOT_MODELS.test(_t)) continue;
          if (!/[A-Z]/.test(_t) || !/\d/.test(_t)) continue;
          if (!_qTokens.includes(_t)) _qTokens.push(_t);
        }
      }
      // hyphenated families where the letters sit alone before the hyphen: MSZ-FH12NA
      const _hy = /\b([A-Z]{2,5})-([A-Z0-9]{2,10})\b/g;
      while ((_m = _hy.exec(_up))) {
        const _t = (_m[1] + _m[2]).replace(/-/g, '');
        if (_t.length >= 4 && _t.length <= 12 && /\d/.test(_t) && !_NOT_MODELS.test(_t) && !_qTokens.includes(_t)) _qTokens.push(_t);
      }
    }
    const _modelMatch = (title) => {
      if (!_qTokens.length) return false;
      const T = String(title || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      for (const _t of _qTokens) for (let n = _t.length; n >= 4; n--) if (T.includes(_t.slice(0, n))) return true;
      return false;
    };
    // Named product families + the one platform split that caused most leaks.
    const _FAM_NAMES = ['city multi', 'pury', 'puhy', 'pumy', 'dvm s', 'multi v', 'vrv', 'airstage', 'reliatel', 'precedent', 'voyager', 'intellipak', 'connex'];
    const _famsIn = (sLower) => _FAM_NAMES.filter(f => sLower.includes(f));
    const _VRF_RE = /city multi|pur[ym]|puhy|\bvrv\b|\bvrf\b|multi[- ]?v\b|dvm[- ]?s|variable refrigerant|water[- ]?source vrf/i;
    const _DUCTLESS_RE = /mini[- ]?split|ductless|wall[- ]?mount|\bmsz\b|\bmuz\b|\bmxz\b|\bmfz\b|\bftxs?\b|\brxs\b|\bctxs\b|\bm[- ]series\b|\bp[- ]series\b|single[- ]zone mini/i;
    const _qLower = String(userText).toLowerCase();
    const _qFams = _famsIn(_qLower);
    const _qClass = _DUCTLESS_RE.test(_qLower) && !_VRF_RE.test(_qLower) ? 'ductless'
      : _VRF_RE.test(_qLower) && !_DUCTLESS_RE.test(_qLower) ? 'vrf' : null;
    // Reasons are prefixed with their kind: 'WRONG|' = provably a different family/platform
    // than the tech's; 'UNCONF|' = a platform-specific manual that NOTHING in the tech's
    // message confirms (brand fault code only, no model, no platform words). The second kind
    // exists because most leaked answers came from exactly that shape — "Samsung E101" pulled
    // the only Samsung manual in the library (commercial water-source VRF) and its fault
    // table got stated as the tech's. Honest behavior is confirm-the-model-first.
    const _chunkConflict = (c) => {
      const _tl = String(c.doc_title || '').toLowerCase();
      const _tf = _famsIn(_tl);
      const _tClass = _VRF_RE.test(_tl) && !_DUCTLESS_RE.test(_tl) ? 'vrf' : _DUCTLESS_RE.test(_tl) && !_VRF_RE.test(_tl) ? 'ductless' : null;
      if (_qFams.length && _tf.length && !_tf.some(f => _qFams.includes(f))) return 'WRONG|the ' + _tf[0].toUpperCase() + ' family, not the tech\'s';
      if (_qClass && _tClass && _tClass !== _qClass) return 'WRONG|' + (_tClass === 'vrf' ? 'a commercial VRF platform; the tech is on residential ductless' : 'a residential ductless platform; the tech is on commercial VRF');
      if ((_tClass || _tf.length) && !_modelMatch(c.doc_title) && !_tf.some(f => _qFams.includes(f)) && !(_tClass && _qClass === _tClass)) {
        return 'UNCONF|the ' + (_tf[0] ? _tf[0].toUpperCase() : (_tClass === 'vrf' ? 'commercial VRF' : 'residential ductless')) + ' platform, and nothing in the tech\'s message confirms their unit is on it';
      }
      return null;
    };
    // Pass 1: drop class/family-conflicted chunks whenever anything clean remains.
    const _conflicts = new Map(chunks.map(c => [c, _chunkConflict(c)]));
    const _cleanPool = chunks.filter(c => !_conflicts.get(c));
    let _poolConflictReason = null;
    if (_cleanPool.length) chunks = _cleanPool;
    else if (chunks.length && _conflicts.get(chunks[0])) _poolConflictReason = _conflicts.get(chunks[0]);
    // Pass 2: model-token gate (matching-family chunks win outright, as before).
    let _familyMismatch = false;
    if (_qTokens.length) {
      const _matching = chunks.filter(c => _modelMatch(c.doc_title));
      if (_matching.length) chunks = _matching;
      else _familyMismatch = true;
    }
    const _poisoned = _familyMismatch || _poolConflictReason;
    const _mkTag = (c) => {
      const _raw = _conflicts.get(c) || _poolConflictReason
        || (_familyMismatch ? 'WRONG|no library manual matches the model the tech named (' + _qTokens.join('/') + ')' : '');
      if (!_poisoned || !_raw) return '[Source: ' + c.doc_title + (c.page_num ? ', p.' + c.page_num : '') + ']';
      const _kind = _raw.split('|')[0], _why = _raw.split('|').slice(1).join('|');
      const _suffix = _kind === 'UNCONF'
        ? ' — PLATFORM UNCONFIRMED: this manual covers ' + _why + '. Do not state its tables as this unit\'s until the model is confirmed'
        : ' — WRONG PRODUCT FAMILY: this manual covers ' + _why + '. Its specs, terminal IDs, resistances and fault tables DO NOT apply to this tech\'s unit';
      return '[Source: ' + c.doc_title + (c.page_num ? ', p.' + c.page_num : '') + _suffix + ']';
    };
    let text = chunks.map(c => `${_mkTag(c)}\n${c.chunk_text}`).join('\n\n---\n\n');
    if (_poisoned) {
      const _anyWrong = _familyMismatch || [..._conflicts.values()].some(v => v && v.startsWith('WRONG')) || (_poolConflictReason || '').startsWith('WRONG');
      text = (_anyWrong
        ? 'PLATFORM WARNING: none of these excerpts match the tech\'s actual equipment. Every excerpt below is tagged WRONG PRODUCT FAMILY. '
          + 'You may use them ONLY for the generic shape of a procedure. You may NOT state any of their numeric specs, terminal IDs, resistance values, '
          + 'pressures or fault-code meanings as applying to this tech\'s unit — not even with the citation. Say plainly that the exact manual is not in '
          + 'the library, give the safe generic path, and ask for the nameplate/model so the right documentation can be pulled.'
        : 'PLATFORM CHECK FIRST: the only matching documents are for a SPECIFIC platform and nothing in the tech\'s message confirms their unit is on it. '
          + 'Before stating any fault-code meaning, terminal ID or spec from these excerpts as this unit\'s, ask which unit they\'re on (model or nameplate). '
          + 'You may describe what the cited platform\'s manual says AS that platform\'s data, clearly labeled, while you confirm.')
        + '\n\n' + text;
    }
    // Phase 2: surface a wiring-diagram image ONLY when its manual is genuinely for the MODEL the
    // tech asked about. A close-but-wrong-model/technology diagram (an inverter heat-pump print for a
    // single-stage or two-stage AC) is a miswire risk a tech could trust off the card (staging field-
    // test 2026-07-17). Same-doc gating wasn't enough — retrieval can rank a wrong-model manual #1. So
    // match the query's model token against the diagram's doc title (>=4-char family prefix, e.g.
    // GSXC / GSXN / GSZC are treated as DIFFERENT). No model in the query, or no title match -> show
    // NO diagram and let Mike describe the wiring in text (safe). No cross-doc pool fallback.
    const _seen = new Set(); const diagrams = [];
    for (const c of chunks) {
      if (!c || !c.diagram_image_url || !_modelMatch(c.doc_title)) continue;
      if (_seen.has(c.diagram_image_url)) continue;
      _seen.add(c.diagram_image_url);
      diagrams.push({ url: c.diagram_image_url, title: c.doc_title || 'Wiring diagram', page: c.page_num || null });
      if (diagrams.length >= 2) break;
    }
    return { text, diagrams };
  } catch (_) { return null; }
}

app.post('/api/ai', aiLimiter, async (req, res) => {
  if (globalActive >= MAX_GLOBAL)
    return res.status(503).json({ error: 'Server at capacity — please try again in a moment.' });

  // Enforce paywall server-side. Token comes from body (existing frontend sends it this way).
  const authToken = req.body?.token
    || (req.headers['authorization']?.startsWith('Bearer ') ? req.headers['authorization'].slice(7) : null);
  // Signed-out visitor spending their one free answer. Everything downstream —
  // including the deterministic safety/pricing guard — runs exactly as it does for a
  // paying tech; the only thing skipped is the account check.
  let _isTaste = false;
  if (!authToken && req.body?.taste === true) {
    const allow = await tasteAllowance(req);
    if (allow.left <= 0)
      return res.status(402).json({ error: 'That was the free one — create an account and Mike stays with you.', paywall: true });
    await tasteConsume(req, allow);
    _isTaste = true;
  }
  if (!_isTaste) {
    const access = await checkPaywall(authToken);
    if (!access.allowed)
      return res.status(402).json({ error: access.reason, paywall: access.paywall || false, founder: !!access.founder });
  }

  const { messages, system, systemExtra = '', max_tokens = 1024, use_search = false, stream = false } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages required' });

  // Record that a tech asked Mike something. Until now NOTHING logged this, so
  // "how many times is Mike actually used" was unanswerable — the events table only
  // held specific button-presses the frontend chose to send. Fire-and-forget:
  // this must never delay or fail a tech's answer.
  // 2026-08-21 — UNTIL NOW THE PAYLOAD WAS `{search:true}` AND NOTHING ELSE. We knew how
  // MANY questions were asked and never a single one of them. Chat history lives in the
  // tech's own localStorage, trimmed to 40 messages, so every wrong answer Mike has ever
  // given was unauditable and is already gone. Brandon's ask: audit Mike against real field
  // use and let him improve from it. That is impossible without the transcript, so store it.
  // Truncated, fire-and-forget, and never allowed to delay or break a tech's answer.
  let _askUid = null;
  // SLIDING SESSION (2026-10-22). Tokens expired hard at 30 days with NO refresh anywhere,
  // so every active technician was force-ejected monthly — mid-job, with the client wiping
  // their saved session on the second 401/402. Once a working token is past
  // RENEW_AFTER_DAYS (default 7), every answer carries renewed_token: a fresh 30-day JWT
  // the client swaps in silently. A tech idle past the full 30 days still re-signs-in
  // once — that boundary is unchanged. Env-tunable so staging can force-renew (0) to test.
  let _renewTok = null;
  try {
    const _dec = jwt.verify(authToken, JWT_SECRET, { algorithms: ['HS256'] });
    _askUid = _dec.id;
    const _rdRaw = parseFloat(process.env.RENEW_AFTER_DAYS);
    const _renewDays = Number.isFinite(_rdRaw) ? _rdRaw : 7;
    if (_dec.iat && Date.now() - _dec.iat * 1000 > _renewDays * 86400000) {
      // Renewal must not outlive the password it was issued against: only tokens carrying
      // pv renew, and only after re-checking pv against the LIVE hash. A pv-less token
      // (pre-rollout) or a DB miss simply ages out at 30 days like before — renewal is
      // never granted on a blip, because an unverifiable renewal IS the revocation hole.
      if (!SUPABASE_URL) {
        _renewTok = signToken({ id: _dec.id, email: _dec.email }); // dev mode — no DB to check
      } else if (_dec.pv) {
        const _rows = await supabase('GET', 'users', null,
          `?id=eq.${encodeURIComponent(_dec.id)}&select=password_hash`);
        if (Array.isArray(_rows) && _rows[0] && pwdVersion(_rows[0].password_hash) === _dec.pv)
          _renewTok = signToken({ id: _dec.id, email: _dec.email, password_hash: _rows[0].password_hash });
      }
    }
    const _last = messages[messages.length - 1];
    let _q = '';
    if (_last && typeof _last.content === 'string') _q = _last.content;
    else if (_last && Array.isArray(_last.content))
      _q = _last.content.filter(c => c && c.type === 'text').map(c => c.text || '').join(' ');
    const _hasImage = !!(_last && Array.isArray(_last.content) && _last.content.some(c => c && c.type === 'image'));
    logUsage(_askUid, 'mike_ask', {
      search: !!use_search,
      image: _hasImage,
      // Whether Mike's PERSONA was attached. /api/ai takes AGENT_SYSTEM from the CLIENT, so
      // a request without it is raw Claude wearing Mike's URL — it will ask for
      // clarification on "cap reads 28 on a 45" instead of answering it. Without this flag
      // an audit cannot tell a genuine Mike failure from a call that never had a persona,
      // and we would end up "fixing" a prompt that was never loaded.
      sys: !!(system && String(system).length > 500),
      q: String(_q || '').slice(0, 2000),
    });
  } catch { /* token already validated by checkPaywall; never block on logging */ }

  // ── OUTCOME SPINE: time-grounding + this tech's open loop (one cheap read) ──
  let _loopState = { lastAskAt: null, openLoop: null };
  try { if (_askUid) _loopState = await getLoopState(_askUid); } catch {}
  // If the unresolved question is part of THIS conversation's history, it isn't an
  // open loop — it's the conversation he's already in. Don't greet him with his own chat.
  try {
    if (_loopState.openLoop) {
      const _frag = _loopState.openLoop.q.slice(0, 80);
      const _inConvo = (Array.isArray(messages) ? messages : []).some(m => {
        if (!m || m.role !== 'user') return false;
        const t = typeof m.content === 'string' ? m.content
          : (Array.isArray(m.content) ? m.content.map(c => (c && c.text) || '').join(' ') : '');
        return t.includes(_frag);
      });
      if (_inConvo) _loopState.openLoop = null;
    }
  } catch {}

  // ── DETERMINISTIC GUARD LAYER ──────────────────────────────────────────────
  // Prompt-tuning failed 3 cert passes on two safety scenarios + replacement-lean
  // language. These guards make the critical safety + no-homeowner-pricing rules
  // GUARANTEED rather than model-dependent: detect the hazard/homeowner signal in
  // the request, then prepend a mandatory safety lead and/or strip prices+replace
  // language from the reply. Same approach as the (working) price strip.
  let _lastUser = '';
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m && m.role === 'user') {
      _lastUser = typeof m.content === 'string' ? m.content
        : (Array.isArray(m.content) ? m.content.map(c => (c && c.text) || '').join(' ') : '');
      break;
    }
  }
  // ── LANGUAGE (2026-10-31, all six 2026-11-02) — the guard's guarantee must survive
  // translation. The client embeds an exact language note in the system prompt
  // (public/index.html LANG_MIKE); every deterministic lead/tail below ships in all
  // six app languages and _L() picks per request. English stays the default, and the
  // detection regexes carry parallel per-language alternatives ORed in further down —
  // the English branches are untouched.
  // Six languages (2026-10-31). Keyed on the exact language note the client embeds in
  // the system prompt (public/index.html LANG_MIKE); accent-tolerant where users or old
  // clients may have typed without accents. English is the default and the fallback.
  const _guardLangSrc = String(system || '') + String(systemExtra || '');
  const _guardLang =
      /respond[ea]\s+siempre\s+en\s+espa[ñn]ol/i.test(_guardLangSrc) ? 'es'
    : _guardLangSrc.includes('始终用中文回复') ? 'zh'
    : /lu[oô]n\s+tr[aả]\s+l[oờ]i\s+b[aằ]ng\s+ti[eế]ng\s+vi[eệ]t/i.test(_guardLangSrc) ? 'vi'
    : /r[eé]ponds\s+toujours\s+en\s+fran[cç]ais/i.test(_guardLangSrc) ? 'fr'
    : /responda\s+sempre\s+em\s+portugu[eê]s/i.test(_guardLangSrc) ? 'pt'
    : 'en';
  // _L picks the lead language; a missing translation falls back to English, never to silence.
  const _L = (m) => (m[_guardLang] !== undefined ? m[_guardLang] : m.en);
  // ── DIAGRAM REDRAW (conversational — no button) ──────────────────────────────
  // A tech uploaded a wiring-diagram photo and asked Mike to simplify it → trace it
  // and hand back the clean illustration IN CHAT. Fail-safe: ANY problem falls through
  // to Mike's normal reply, so this never breaks the chat. Runs before globalActive++
  // so an early return leaks nothing.
  try {
    const _lastMsg = messages[messages.length - 1];
    const _img = Array.isArray(_lastMsg?.content) && _lastMsg.content.find(c => c && c.type === 'image' && c.source);
    const _wantsSimplify = /(simplif|redraw|clean\s*(this|it|up)|make\s*(this|it)?\s*(easi|readable|simple|clear)|break\s*(this|it)?\s*down|read\s*(this|it)\s*for)/i.test(_lastUser)
      && /(diagram|wiring|schematic|this|it)/i.test(_lastUser);
    if (ANTHROPIC_API_KEY && _img && _wantsSimplify) {
      const _s = _img.source;
      const _dataUrl = _s.type === 'base64' ? `data:${_s.media_type};base64,${_s.data}` : String(_s.url || '');
      const _who = (req.user && (req.user.id || req.user.email)) || null;
      // (1) Model the tech TYPED (lets us hit the shared library with NO trace = free + instant).
      const _mm = _lastUser.match(/\b([A-Z]{1,5}\d[A-Z0-9-]{2,})\b/i);
      let _model = _mm ? _mm[1].toUpperCase().replace(/[^A-Z0-9-]/g, '') : '';
      let _brand = _extractBrand(_lastUser) || '';
      let _mk = _model ? (normalizeModelKey(_brand, _model) || null) : null;
      const _known = (k) => !!k && !/(^|:)(UNKNOWN|UNIT):/i.test(k) && !/^UNKNOWN:/i.test(k);

      let _svg = null, _fromLibrary = false;
      // (2) Shared-library check BEFORE spending a trace — only when we already know the model.
      if (_known(_mk) && SUPABASE_URL) {
        try {
          const _hit = await supabase('GET', 'library_diagrams', null,
            `?model_key=eq.${encodeURIComponent(_mk)}&circuit_type=eq.full&source=eq.mike-svg&order=verified.desc,created_at.desc&limit=1`);
          if (Array.isArray(_hit) && _hit[0] && _hit[0].svg) { _svg = _hit[0].svg; _fromLibrary = true; }
        } catch (_le) { /* non-fatal — fall through to a fresh trace */ }
      }

      if (!_svg) {
        // (3) Miss → trace the photo. The SAME vision pass also reads the model/brand printed on the sheet.
        const _out = await extractNetlist(_dataUrl, { modelKey: _mk || 'UNIT:UPLOAD', circuitType: 'full', apiKey: ANTHROPIC_API_KEY });
        const _nl = sanitizeNetlist(_out.netlist);
        const _roles = _nl.components.map(c => roleOf(c)).filter(Boolean);
        const _core = ['contactor', 'compressor', 'runcap', 'fan'].filter(r => _roles.includes(r));
        if (validateNetlist(_nl).ok && _core.length >= 4) {
          _svg = renderIllustrationSVG(_nl);
          // Model read straight off the diagram, if the tech didn't type one.
          if (!_model && _nl.equipment) {
            const _rm = String(_nl.equipment.model_id || _nl.equipment.series || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
            if (_rm) { _model = _rm; _brand = _brand || _extractBrand(_nl.equipment.brand || '') || (_nl.equipment.brand || ''); _mk = normalizeModelKey(_brand, _model) || null; }
          }
          // (4) Save to the SHARED library so the next tech on this model gets it instantly — only when we truly know the model.
          if (_known(_mk) && SUPABASE_URL) {
            try {
              const _have = await supabase('GET', 'library_models', null, `?model_key=eq.${encodeURIComponent(_mk)}&select=model_key&limit=1`);
              if (!Array.isArray(_have) || !_have.length) {
                await supabase('POST', 'library_models', { model_key: _mk, model_raw: _model, brand: (_brand || null), family: _extractModelFamily(_model), updated_at: new Date().toISOString(), created_by: _who });
              }
              const _dup = await supabase('GET', 'library_diagrams', null, `?model_key=eq.${encodeURIComponent(_mk)}&circuit_type=eq.full&source=eq.mike-svg&limit=1`);
              if (!Array.isArray(_dup) || !_dup.length) {
                await supabase('POST', 'library_diagrams', { model_key: _mk, circuit_type: 'full', source: 'mike-svg', svg: _svg, verified: false, created_by: _who });
              }
            } catch (_se) { console.error('inline redraw save (non-fatal):', _se.message); }
          }
        }
      }

      if (_svg) {
        const _id = _storeRedraw(_svg);
        const _label = _known(_mk) ? (_brand ? (_brand.charAt(0).toUpperCase() + _brand.slice(1).toLowerCase() + ' ') : '') + _model : '';
        let _reply;
        if (_fromLibrary) {
          _reply = "Good news — I already had " + (_label || 'this one') + " in the library, so here it is instantly. Same circuit, laid out clean and labeled. Still double-check it against the real manual before you work on a live unit.";
        } else if (_known(_mk)) {
          _reply = "Here's that wiring diagram simplified — same circuit, laid out clean and labeled so it's easy to follow. I saved it to the library as " + _label + ", so the next tech on this unit gets it instantly. Always double-check it against the real manual before you work on a live unit.";
        } else {
          _reply = "Here's that wiring diagram simplified — same circuit, laid out clean and labeled so it's easy to follow. I couldn't make out the model number on the sheet — tell me the model off the nameplate and I'll save it to the library for the next tech. Always double-check it against the real manual before you work on a live unit.";
        }
        _reply += '\n⟦MIKE_DIAGRAM⟧[{"url":"/diagrams/redraw/' + _id + '","title":"Simplified wiring diagram"}]⟦/MIKE_DIAGRAM⟧';
        if (stream) {
          res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
          if (typeof res.flushHeaders === 'function') res.flushHeaders();
          res.write(`data: ${JSON.stringify({ delta: _reply })}\n\n`);
          res.write(`data: ${JSON.stringify(_renewTok ? { done: true, renewed_token: _renewTok } : { done: true })}\n\n`);
          return res.end();
        }
        return res.json(_renewTok ? { response: _reply, renewed_token: _renewTok } : { response: _reply });
      }
      // couldn't read it cleanly → let Mike's normal reply handle it (he'll ask for a clearer photo)
    }
  } catch (_e) { console.error('inline diagram redraw (fell through to normal reply):', _e.message); }

  let _safetyLead = '';
  // (A) Burner/flame staying lit with no call for heat = stuck-open gas valve.
  if (/(furnace|burner|flame|unit|heat)[^.]{0,70}(keeps? running|still (running|on|lit|burning)|won'?t (shut|turn) off|stays (on|lit|running))[^.]{0,55}(thermostat|t-?stat|call)/i.test(_lastUser)
      || /(flame|burner)[^.]{0,40}(no call|without a call|no heat call)/i.test(_lastUser)
      || /5[- ]?flash[^.]{0,90}(flame|gas|no call|thermostat (is )?off|keeps? running)/i.test(_lastUser)
      // Spanish mirror (2026-10-31): same three-term shape — appliance word, stays-lit wording, thermostat/call context.
      || /(quemador|llama|horno|calefacci[oó]n|calefactor|unidad)[^.]{0,70}(sigue (encendid|prendid|funcionando|quemando)|no se apaga|se queda (encendid|prendid))[^.]{0,55}(termostato|llamada de calor|sin llamada)/i.test(_lastUser)
      || /(llama|quemador)[^.]{0,40}(sin llamada|sin demanda|no hay llamada)/i.test(_lastUser)) {
    _safetyLead = _L({
      en: 'SAFETY FIRST — shut the gas off at the appliance shutoff valve right now. A burner staying lit with no call for heat means the gas valve is stuck open; kill the gas before you diagnose anything else.',
      // "atascada abierta"/"卡在开启"/"kẹt mở"/"bloquée ouverte"/"presa aberta" are
      // load-bearing: _combustionEvent (close-out checklist) matches on them.
      es: 'SEGURIDAD PRIMERO — cierre el gas en la válvula de corte del equipo ahora mismo. Un quemador que sigue encendido sin llamada de calor significa que la válvula de gas está atascada abierta; corte el gas antes de diagnosticar cualquier otra cosa.',
      zh: '安全第一 — 立即在设备燃气截止阀处关闭燃气。没有供暖需求时燃烧器仍在燃烧，说明燃气阀卡在开启位置；先切断燃气，再诊断其他任何问题。',
      vi: 'AN TOÀN TRƯỚC HẾT — khóa gas tại van khóa của thiết bị ngay bây giờ. Đầu đốt vẫn cháy khi không có yêu cầu sưởi nghĩa là van gas bị kẹt mở; cắt gas trước khi chẩn đoán bất cứ thứ gì khác.',
      fr: 'SÉCURITÉ D\'ABORD — coupez le gaz à la vanne d\'arrêt de l\'appareil tout de suite. Un brûleur qui reste allumé sans demande de chauffage signifie que la vanne de gaz est bloquée ouverte ; coupez le gaz avant de diagnostiquer quoi que ce soit d\'autre.',
      pt: 'SEGURANÇA PRIMEIRO — feche o gás na válvula de corte do equipamento agora mesmo. Um queimador que continua aceso sem chamada de aquecimento significa que a válvula de gás está presa aberta; corte o gás antes de diagnosticar qualquer outra coisa.' });
  }
  // (A2) GAS ODOR / SUSPECTED GAS LEAK — the full utility protocol, deterministic.
  // 2026-10-02 exam: gas-smell scenarios had NO hardcoded guard (only CO ppm and the
  // stuck-open valve were), and every graded gas scenario dropped protocol steps — the
  // 300-ft standoff and the escalation path most often. Mike's instinct (evacuate, no
  // switches, call from outside) was consistently right; the missing tail is exactly
  // what a deterministic lead guarantees. Placed after (A) so later, worse leads
  // (ambient-CO evacuation, person down) still override it.
  const _gasOdor =
    /(smell|smells?|odor|odour|smelling|stink|reek)[^.]{0,45}\b(gas|rotten egg|sulfur|sulphur|mercaptan)\b/i.test(_lastUser)
    || /\b(gas)\s*(smell|odor|odour|leak)\b/i.test(_lastUser)
    || /\brotten[- ]egg/i.test(_lastUser)
    || /(hiss|hissing)[^.]{0,35}(gas (line|valve|meter|pipe)|flex connector|at the (meter|valve))/i.test(_lastUser)
    || /(combustible|gas)\s*(detector|monitor)[^.]{0,30}(read|going off|alarm|above zero|lit up)/i.test(_lastUser)
    // Spanish mirror (2026-10-31), accent-insensitive: smell-word within the same 45-char
    // window of a gas word; "fuga/escape de gas" standalone mirrors the English standalone
    // "gas leak"; rotten-egg/sulfur odorant words standalone, like \brotten[- ]egg above.
    || /(^|[^a-z])(huele|hueles|huelo|ol[ií]a|olor(es)?|oliendo|apesta(ba)?|peste|hediondo)(?![a-z])[^.]{0,45}\b(gas|huevos? podridos?|azufre|sulfuro|mercaptano)\b/i.test(_lastUser)
    || /\b(fuga|escape)\s+de\s+gas\b/i.test(_lastUser)
    || /\bolor\s+a\s+gas\b/i.test(_lastUser)
    || /\bhuevos?\s+podridos?\b/i.test(_lastUser)
    || /(silba|silbido|siseo|sisea)[^.]{0,35}(l[ií]nea de gas|v[aá]lvula|medidor|tuber[ií]a de gas)/i.test(_lastUser)
    // zh (2026-10-31): 2+ char compounds, no \b (JS \b is useless against CJK).
    || /煤气味|闻到煤气|闻到瓦斯|煤气泄漏|燃气泄漏|天然气泄漏|煤气漏|瓦斯漏|臭鸡蛋味|硫磺味/.test(_lastUser)
    // vi (2026-10-31): accent-dual multi-word shapes — no unaccented token can sit inside English text.
    || /m[uù]i\s+(gas|ga)\b|r[oò]\s*r[iỉ]\s*(gas|ga|kh[ií] gas)|tr[uứ]ng\s+th[oố]i|m[uù]i l[uư]u hu[yỳ]nh/i.test(_lastUser)
    // fr (2026-10-31): dictionary-checked — odeur/fuite/soufre are not English words; sent-shapes are multi-word.
    || /(odeur|[cç]a sent|je sens)[^.]{0,45}(gaz|soufre|[oœ]euf pourri|oeuf pourri)/i.test(_lastUser)
    || /\bfuite de gaz\b|\bodeur de gaz\b|[oœ]ufs? pourris?/i.test(_lastUser)
    // pt (2026-10-31): cheiro/vazamento/enxofre dictionary-checked; "escape de gas" already covered by es.
    // cheir[oa]\w* (2026-11-02, Jordan): the gerund "está cheirando a gás" must fire; the
    // B2 collision only ever lived in bare "fede", which stays hard-anchored.
    || /\b(cheir[oa]\w*|fede|fedor)\b[^.]{0,45}(g[aá]s|ovo podre|enxofre)/i.test(_lastUser)
    || /vazamento de g[aá]s\b|cheiro de g[aá]s\b|ovos? podres?/i.test(_lastUser);
  // Grade it so a tech DESCRIBING a finished repair ("found the leak, fixed it, no more
  // gas smell") doesn't trigger a full evacuation — past-tense/resolved wording skips it.
  const _gasResolved = /(fixed|repaired|replaced|re-?lit|no (more|longer) (smell|odor|leak)|smell (is )?gone|after (the|my) repair)/i.test(_lastUser)
    // Spanish resolved wording (2026-10-31): a tech DESCRIBING a finished repair in
    // Spanish gets the same stand-down the English resolved wording gets.
    || /(arreglad|reparad|reemplazad|ya no (huele|hay olor|hay fuga)|el olor (se fue|desapareci)|despu[eé]s de (la|mi) reparaci[oó]n|ya qued[oó] (bien|arreglad))/i.test(_lastUser)
    // zh/vi/fr/pt resolved wording (2026-10-31): suppressors stay NARROW — distinctive
    // multi-word shapes only, so no cross-language text can stand a real leak down.
    || /修好了|已修复|已经修好|没有味道了|不漏了/.test(_lastUser)
    || /(đ[aã] s[uử]a xong|s[uử]a xong r[oồ]i|h[eế]t m[uù]i gas|het mui gas|da sua xong)/i.test(_lastUser)
    || /(\br[eé]par[eé]e?(?![a-z])|plus d'odeur|apr[eè]s (la |ma )?r[eé]paration)/i.test(_lastUser)
    || /(consertad|arrumad|j[aá] n[aã]o cheira|depois do (reparo|conserto))/i.test(_lastUser);
  // (A2b) REFRIGERANT gas is not FUEL gas (2026-10-05, run-2 exam: the full natural-gas
  // evacuation fired on an LG CH38 "refrigerant gas leak detected" fault code). When the
  // only gas-leak language is refrigerant-flavored and there's no fuel indicator (smell,
  // odorant, propane/natural-gas words, combustible detector), this lead stands down —
  // the A2L ignition lead (C3) still covers flammable refrigerant.
  const _refrigGasOnly = (/refrigerant\s+gas\s*(leak|detected|loss)|gas leak detected[^.]{0,40}(low refrigerant|refrigerant)/i.test(_lastUser)
    && !/(smell|odor|odour|rotten|mercaptan|sulfur|sulphur|natural gas|propane|lp|fuel gas|gas (line|pipe|meter|valve|utility))/i.test(_lastUser))
    // Spanish mirror (2026-10-31): "fuga de gas refrigerante detectada" is an LG-style
    // fault report, not a fuel-gas emergency — same stand-down, same fuel-indicator veto.
    || ((/(fuga|p[eé]rdida|escape)\s+de\s+gas\s+refrigerante|gas\s+refrigerante[^.]{0,40}(fuga|detectad|p[eé]rdida)|fuga\s+de\s+refrigerante\s+detectad/i.test(_lastUser)
    // zh/vi/fr/pt refrigerant-gas fault wording (2026-10-31)
      || /冷媒泄漏|制冷剂泄漏|冷媒漏|雪种泄漏/.test(_lastUser)
      || /(x[iì]|r[oò] r[iỉ])\s*(m[oô]i ch[aấ]t|gas l[aạ]nh)/i.test(_lastUser)
      || /fuite de (gaz )?(r[eé]frig[eé]rant|fluide frigorig[eè]ne)/i.test(_lastUser)
      || /vazamento de (g[aá]s )?refrigerante|fluido refrigerante[^.]{0,30}vazand/i.test(_lastUser))
    && !/(\bhueles?(?![a-z])|(^|[^a-z])olor(es)?(?![a-z])|hediond|podrido|azufre|sulfuro|mercaptano|gas natural|\bpropanos?(?![a-z])|\bcombustibles?\b|(l[ií]nea|tuber[ií]a|medidor|v[aá]lvula) de gas)/i.test(_lastUser)
    // …and the ENGLISH fuel indicators too — a mixed-language message ("fuga de gas
    // refrigerante detectada, smells like rotten eggs") is a fuel-gas emergency.
    && !/(smell|odor|odour|rotten|mercaptan|sulfur|sulphur|natural gas|propane|\blp\b|fuel gas|gas (line|pipe|meter|valve|utility))/i.test(_lastUser)
    // …and the zh/vi/fr/pt fuel indicators, same rule.
    && !/煤气|燃气|天然气|臭鸡蛋|硫磺|m[uù]i gas|mui gas|tr[uứ]ng th[oố]i|odeur|soufre|\bpourris?(?![a-z])|gaz naturel|\bcheiro\b|enxofre|podre|g[aá]s natural|\bpropanos?(?![a-z])/i.test(_lastUser));
  // (A2c) LOCATED-LEAK, TECH IN CONTROL — 2026-10-19, Brandon: a tech who walked in,
  // sniffed around and FOUND the leak at a fitting was getting the full building
  // evacuation ("holy cow, get everybody out" on a loose union is absurd and teaches
  // techs to ignore the lead that matters). When the tech has PINPOINTED the source —
  // named the fitting, soaped it, traced it — he is doing gas work, not reporting an
  // unknown hazard, and the professional lead applies: isolate, no ignition, fix,
  // leak-test. FAIL TOWARD DISTRUST: any strong-odor, spreading, symptom, homeowner
  // framing, or detector-alarm language keeps the FULL evacuation lead regardless.
  const _gasLocated =
    (/\b(found|located|pin-?pointed|traced|isolated|got)\b[^.]{0,40}\bleak\b/i.test(_lastUser)
      || /\bleak\b[^.]{0,15}\b(is|was|'s)?\s*(at|on|in)\b[^.]{0,30}\b(union|flare|flex|connector|fitting|joint|coupling|valve|regulator|manifold|riser|drip leg|pilot|nipple|tee|elbow)\b/i.test(_lastUser)
      || /\bsoap(ed)?\b[^.]{0,30}\b(bubbl|test)/i.test(_lastUser)
      || /\bbubbl(es|ing)\b[^.]{0,25}\b(at|on|from)\b/i.test(_lastUser))
    && !/(strong|heavy|overwhelming|everywhere|whole (house|home|building)|fill(ed|ing)|spread)/i.test(_lastUser)
    && !/(dizzy|sick|headache|nause|light-?headed|faint)/i.test(_lastUser)
    && !/(detector|monitor|alarm)/i.test(_lastUser)
    && !(req.body.homeowner === true || /\bi'?m a homeowner\b|\bas a homeowner\b|\bhomeowner here\b/i.test(_lastUser));
  // (A2d) A NUMBER BEATS A NOUN — same philosophy as the CO ppm thresholds below: when
  // the tech gives a combustible-gas READING, grade on the number, not the wording.
  // Fire-service action level is 10% LEL: at or above, full evacuation no matter how
  // handy the tech is or how local the leak sounds. Detectable below 10% is working
  // territory — ignition control, ventilate, meter stays on. No reading = the
  // located-vs-unknown split decides.
  const _lelM = /(\d{1,3})\s*(?:%|percent|por\s*ciento|por\s*cento|pour\s*cent)?\s*(?:of\s+|del\s+|de\s+|du\s+|do\s+)?(?:the\s+|el\s+|o\s+|le\s+)?(?:lel\b|lower explosive|l[ií]mite inferior de explosi|limite inf[eé]rieure d'explosi|爆炸下限)|(?:lel\b|lower explosive limit|l[ií]mite inferior de explosi\w*|limite inf[eé]rieure d'explosi\w*|爆炸下限)[^.\d]{0,12}(\d{1,3})\s*(?:%|percent|por\s*ciento|por\s*cento|pour\s*cent)?/i.exec(_lastUser);
  const _lelPct = _lelM ? parseInt(_lelM[1] || _lelM[2], 10) : null;
  if ((_gasOdor || _lelPct !== null) && !_gasResolved && !_refrigGasOnly) {
    if (_lelPct !== null && _lelPct >= 10) {
      _safetyLead = _L({
        en: 'SAFETY FIRST — ' + _lelPct + '% LEL is evacuation territory, the number outranks everything else. Everyone out now, you included; nothing electrical on the way out. Gas off at the meter ONLY from outside. 300 feet back, call the gas utility\'s emergency line — 911 too if anyone feels sick. Nobody re-enters until it clears.',
        es: 'SEGURIDAD PRIMERO — ' + _lelPct + '% del LEL es territorio de evacuación; el número manda sobre todo lo demás. Todos afuera ahora, usted incluido; nada eléctrico al salir. Gas cerrado en el medidor SOLO desde afuera. A 300 pies (91 m) de distancia, llame a la línea de emergencia de la compañía de gas — y al 911 si alguien se siente mal. Nadie vuelve a entrar hasta que se despeje.',
        zh: '安全第一 — ' + _lelPct + '% LEL已到必须撤离的级别，这个数字压倒一切。所有人现在撤出，包括你；撤离路上不碰任何电气。只能从室外关闭燃气表阀。退到300英尺（91米）外，打燃气公司紧急专线——有人不舒服就同时打911。数值未清零前任何人不得再进入。',
        vi: 'AN TOÀN TRƯỚC HẾT — ' + _lelPct + '% LEL là mức phải sơ tán; con số này đứng trên tất cả. Mọi người ra ngoài ngay, kể cả bạn; không chạm gì chạy điện khi ra. Chỉ khóa gas tại đồng hồ TỪ BÊN NGOÀI. Lùi 300 feet (91 m), gọi đường dây khẩn cấp của công ty gas — gọi cả 911 nếu có ai thấy khó chịu. Không ai vào lại cho đến khi an toàn.',
        fr: 'SÉCURITÉ D\'ABORD — ' + _lelPct + '% de LEL, c\'est l\'évacuation ; le chiffre prime sur tout. Tout le monde dehors maintenant, vous compris ; rien d\'électrique en sortant. Gaz coupé au compteur UNIQUEMENT depuis l\'extérieur. À 300 pieds (91 m), appelez la ligne d\'urgence du fournisseur de gaz — le 911 aussi si quelqu\'un se sent mal. Personne ne rentre tant que ce n\'est pas redescendu.',
        pt: 'SEGURANÇA PRIMEIRO — ' + _lelPct + '% do LEL é território de evacuação; o número manda sobre tudo. Todos para fora agora, você incluído; nada elétrico na saída. Gás fechado no medidor SOMENTE pelo lado de fora. A 300 pés (91 m), ligue para a linha de emergência da companhia de gás — e para o 911 se alguém se sentir mal. Ninguém volta a entrar até liberar.' });
    } else if (_lelPct !== null) {
      _safetyLead = _L({
        en: 'SAFETY FIRST — ' + _lelPct + '% LEL confirmed combustible gas, below the 10% action level. Ignition sources dead, ventilate, gas off to the affected line, and keep the meter running while you hunt it. 10% or climbing = stop, everybody out, full protocol.',
        es: 'SEGURIDAD PRIMERO — ' + _lelPct + '% del LEL confirma gas combustible, por debajo del nivel de acción del 10%. Fuentes de ignición apagadas, ventile, gas cerrado a la línea afectada, y el medidor sigue midiendo mientras busca la fuga. ¿10% o subiendo? Pare, todos afuera, protocolo completo.',
        zh: '安全第一 — ' + _lelPct + '% LEL确认存在可燃气体，低于10%行动级别。灭掉一切火源，通风，关闭受影响管路的燃气，检漏期间仪表持续监测。到10%或持续上升 = 停手，全员撤出，执行完整规程。',
        vi: 'AN TOÀN TRƯỚC HẾT — ' + _lelPct + '% LEL xác nhận có khí cháy, dưới mức hành động 10%. Tắt mọi nguồn lửa, thông gió, khóa gas đường ống bị ảnh hưởng, và máy đo tiếp tục chạy trong khi bạn tìm rò rỉ. 10% hoặc đang tăng = dừng lại, mọi người ra ngoài, quy trình đầy đủ.',
        fr: 'SÉCURITÉ D\'ABORD — ' + _lelPct + '% de LEL confirme un gaz combustible, sous le seuil d\'action de 10%. Sources d\'ignition éteintes, ventilez, gaz coupé sur la ligne touchée, et le détecteur reste allumé pendant la recherche. 10% ou en hausse = stop, tout le monde dehors, protocole complet.',
        pt: 'SEGURANÇA PRIMEIRO — ' + _lelPct + '% do LEL confirma gás combustível, abaixo do nível de ação de 10%. Fontes de ignição desligadas, ventile, gás fechado na linha afetada, e o medidor continua ligado enquanto você caça o vazamento. 10% ou subindo = pare, todos para fora, protocolo completo.' });
    } else if (_gasLocated) {
      _safetyLead = _L({
        en: 'SAFETY FIRST — gas off to that line before you put a wrench on it, and no ignition sources while it\'s open. Fix it, then soap-test the repair before you gas back up. If the odor\'s beyond right-at-the-fitting, or anyone feels off, that\'s full-evacuation territory — not a wrench job.',
        es: 'SEGURIDAD PRIMERO — cierre el gas a esa línea antes de ponerle una llave, y nada de fuentes de ignición mientras esté abierta. Repárela y haga la prueba de jabón sobre la reparación antes de restablecer el gas. Si el olor va más allá del punto de la conexión, o alguien se siente mal, eso es territorio de evacuación total — no un trabajo de llave.',
        zh: '安全第一 — 动扳手之前先关闭这条管路的燃气，管路打开期间不得有任何火源。修好后恢复供气前先做肥皂泡检漏。如果气味超出接头附近，或有人不舒服，那就是整体撤离的情况——不是拧扳手的活。',
        vi: 'AN TOÀN TRƯỚC HẾT — khóa gas đường ống đó trước khi đặt cờ lê vào, và không nguồn lửa nào khi đường ống đang mở. Sửa xong, thử xà phòng chỗ sửa trước khi mở gas lại. Nếu mùi lan quá chỗ mối nối, hoặc có ai thấy khó chịu, đó là tình huống sơ tán toàn bộ — không phải việc của cờ lê.',
        fr: 'SÉCURITÉ D\'ABORD — gaz coupé sur cette ligne avant d\'y mettre une clé, et aucune source d\'ignition tant qu\'elle est ouverte. Réparez, puis testez la réparation à l\'eau savonneuse avant de remettre le gaz. Si l\'odeur dépasse le raccord, ou si quelqu\'un se sent mal, c\'est une évacuation complète — pas un coup de clé.',
        pt: 'SEGURANÇA PRIMEIRO — gás fechado nessa linha antes de colocar a chave nela, e nenhuma fonte de ignição enquanto estiver aberta. Conserte e faça o teste de bolhas de sabão no reparo antes de liberar o gás. Se o cheiro passa do ponto da conexão, ou alguém se sente mal, é território de evacuação total — não é serviço de chave.' });
    } else {
    // Tightened 2026-10-19 on field feedback ("just the main point"). Every protocol
    // step the 10-02 exam graded on is still here — evacuate incl. the tech, nothing
    // electrical, meter-from-outside-only, 300 ft, utility line, 911 escalation,
    // no re-entry, fix-after — each as its own short clause a tech actually reads.
    _safetyLead = _L({
      en: 'SAFETY FIRST — live gas leak. Everyone out now, you included; nothing electrical on the way out — no switches, no phones. Gas off at the meter ONLY if you can reach it from outside. 300 feet back, call the gas utility\'s emergency line from there — 911 too if it\'s strong or anyone feels sick. Nobody re-enters until the utility clears it; find-and-fix comes after.',
      // "fuga de gas activa"/"燃气正在泄漏"/"rò rỉ gas đang xảy ra"/"fuite de gaz active"/
      // "vazamento de gás ativo" are load-bearing: _gasEvent matches on them.
      es: 'SEGURIDAD PRIMERO — fuga de gas activa. Todos afuera ahora, usted incluido; nada eléctrico al salir — ni interruptores, ni teléfonos. Gas cerrado en el medidor SOLO si lo alcanza desde afuera. A 300 pies (91 m), llame desde allí a la línea de emergencia de la compañía de gas — y al 911 si es fuerte o alguien se siente mal. Nadie vuelve a entrar hasta que la compañía lo autorice; buscar y reparar viene después.',
      zh: '安全第一 — 燃气正在泄漏。所有人现在撤出，包括你；撤离路上不碰任何电气——不碰开关，不用手机。只有能从室外够到时才在燃气表处关气。退到300英尺（91米）外，在那里打燃气公司紧急专线——气味重或有人不舒服就同时打911。燃气公司确认安全前任何人不得再进入；先保人，后找漏。',
      vi: 'AN TOÀN TRƯỚC HẾT — rò rỉ gas đang xảy ra. Mọi người ra ngoài ngay, kể cả bạn; không chạm gì chạy điện khi ra — không công tắc, không điện thoại. Chỉ khóa gas tại đồng hồ NẾU với tới được từ bên ngoài. Lùi 300 feet (91 m), gọi từ đó cho đường dây khẩn cấp của công ty gas — gọi cả 911 nếu mùi nặng hoặc có ai thấy khó chịu. Không ai vào lại cho đến khi công ty gas xác nhận an toàn; tìm-và-sửa là chuyện sau.',
      fr: 'SÉCURITÉ D\'ABORD — fuite de gaz active. Tout le monde dehors maintenant, vous compris ; rien d\'électrique en sortant — pas d\'interrupteurs, pas de téléphones. Gaz coupé au compteur UNIQUEMENT si vous l\'atteignez depuis l\'extérieur. À 300 pieds (91 m), appelez de là la ligne d\'urgence du fournisseur de gaz — le 911 aussi si c\'est fort ou si quelqu\'un se sent mal. Personne ne rentre avant le feu vert du fournisseur ; chercher-et-réparer vient après.',
      pt: 'SEGURANÇA PRIMEIRO — vazamento de gás ativo. Todos para fora agora, você incluído; nada elétrico na saída — nem interruptores, nem celulares. Gás fechado no medidor SOMENTE se você o alcança pelo lado de fora. A 300 pés (91 m), ligue de lá para a linha de emergência da companhia de gás — e para o 911 se estiver forte ou alguém se sentir mal. Ninguém volta a entrar até a companhia liberar; achar-e-consertar vem depois.' });
    }
  }
  // ── CO NUMBER PARSING ────────────────────────────────────────────────────────────────
  // The old pattern was (\d{3,4}) — three or four digits. Against "10000 ppm air free" it
  // captured "0000" (parseInt 0) and against "1,200 ppm air free" it captured "200", so the
  // MOST dangerous readings produced total silence. Verified against the live code 2026-08-08.
  // This accepts comma-grouped and any-length numbers, and strips commas before parseInt.
  const _PPM = '(\\d{1,3}(?:,\\d{3})+|\\d+)';
  const _ppmNum = (s) => parseInt(String(s).replace(/,/g, ''), 10);

  // (B) CO air-free at or above the threshold FOR THAT APPLIANCE = shut it down.
  // ANSI/BPI-1200-S Table 1 sets the limit per appliance; it is NOT a flat 400. A water
  // heater — the most common CO producer in a house — is 200, half the furnace limit, so a
  // flat 400 was twice as permissive as the standard on the likeliest offender.
  // An UNIDENTIFIED appliance defaults to the STRICTER 200: fail toward distrust.
  // Take the WORST air-free reading, not the first (fixed 2026-08-09). A tech logging two
  // appliances — "150 ppm air free on the water heater and 900 on the furnace" — got judged
  // on 150 and the 900 vanished. Same first-match defect the ambient rule had.
  // Shared standards-vs-measurement context tests (declared here so BOTH the flue rule
  // and the ambient rule below can use them; 2026-10-05 the flue rule got the same
  // standards-talk hole the ambient rule had — a thresholds LESSON ("400 ppm air-free:
  // BPI/ANSI threshold") was read as a live 400 ppm reading and ordered a shutdown).
  const _STD_CTX_B = /\bosha\b|\bniosh\b|ashrae|\bepa\b|\bbpi\b|\bansi\b|\bpel\b|\btwa\b|\bstel\b|ceiling|ul ?2034|standard|threshold|\blimit\b|guideline|allowable|acceptable (range|thresholds?)|exposure (limit|level)|chronic exposure|do[- ]?not[- ]?restore|alarm (point|setpoint|set ?point|must (sound|alarm|activate))|set at|code (says|requires|allows)|max(imum)?\s+(of\s+)?\d|difference between|interpreting|\bpossibl\w*|\bfor\s+\d+\s*[\u2013-]\s*\d+\s*min|(must|shall) be (shut down|serviced|replaced|corrected)|return to (operation|service)|immediate action|\bnormas?\b|\bl[ií]mites?\b|\bumbral(es)?\b|\best[aá]ndar(es)?\b|permitid|aceptable|exposici[oó]n|diferencia entre|c[oó]digo (dice|exige|permite)|\bnormes?\b|\bseuils?\b|valeur limite|r[eé]glementation|\bpadr[aã]o\b|limite de exposi[cç][aã]o|标准|限值|规范|允许值|gi[oớ]i h[aạ]n cho ph[eé]p|ti[eê]u chu[aẩ]n/i;
  // Number-anchored on purpose (2026-10-05 verify round): the bare noun "readings" shows
  // up in knowledge questions ("Interpreting CO readings...") and un-suppressed a
  // thresholds lesson. Measurement context = a verb tied to a number or an instrument.
  const _MEAS_CTX_B = /read(ing|s)?\s+(at\s+|of\s+|above\s+|over\s+)?\d|measured?\s+(at\s+)?\d|came back (at|over|above)|(meter|monitor|detector|analyzer)\s+(is|says|reads|shows|went|came)|my (meter|monitor|detector|analyzer)|i'?m (getting|seeing|reading)|show(s|ing)\s+\d|test(ed)? at\s+\d|sitting at\s+\d|holding at\s+\d|went off|leyendo\s+\d|lectura de\s+\d|midiendo|\bmidi[oó](?![a-z])\s+\d|marcando\s+\d|me (da|est[aá] dando)\s+\d|estoy (viendo|midiendo|leyendo)|\bson[oó](?![a-z])|se activ[oó]|se dispar[oó]|je (lis|mesure|rel[eè]ve)|affiche\s+\d|mesur[eé] [aà]\s+\d|relev[eé] de\s+\d|lendo\s+\d|leitura de\s+\d|medindo|mediu\s+\d|est[aá] marcando|测到|读数|显示\s*\d|检测到|đo đ[uư][oợ]c\s*\d|do duoc\s+\d|đang đo|dang do\s+\d/i;
  let _co = 0;
  // Spanish mirror (2026-10-31): "CO libre de aire" / "corregido" is how the air-free
  // (corrected) flue reading is written in Spanish. The number stays capture group 1.
  for (const _re of [new RegExp(_PPM + '\\s*ppm[^.]{0,24}air[- ]?free', 'gi'),
                     new RegExp('air[- ]?free[^.]{0,24}' + _PPM + '\\s*ppm', 'gi'),
                     new RegExp(_PPM + '\\s*ppm[^.]{0,28}(?:libre de aire|sin diluir|corregid|sans air|corrig[eé]|livre de ar|corrigid|无空气|trong kh[ií] th[aả]i|khi thai)', 'gi'),
                     new RegExp('(?:libre de aire|corregid[oa]s?|sans air|corrig[eé]e?|livre de ar|corrigid[oa]s?|无空气|kh[ií] th[aả]i|[oố]ng kh[oó]i)[^.]{0,28}' + _PPM + '\\s*ppm', 'gi')]) {
    let _h;
    while ((_h = _re.exec(_lastUser))) {
      const _win = _lastUser.slice(Math.max(0, _h.index - 95), _h.index + _h[0].length + 70);
      if (_STD_CTX_B.test(_win) && !_MEAS_CTX_B.test(_win)) continue; // cited threshold, not telemetry
      const _v = _ppmNum(_h[1]); if (_v > _co) _co = _v;
    }
  }
  if (_co > 0) {
    // 200 ppm: water heater, vented/unvented room heater, BIV wall furnace.
    const _strict = (/(water heater|room heater|unvented|space heater|wall furnace)/i.test(_lastUser)
                    || /(calentador de agua|calefactor|sin ventilaci[oó]n|calentador de pared)/i.test(_lastUser))
                    && !/direct[- ]?vent|tiro directo|ventilaci[oó]n directa/i.test(_lastUser);
    // 400 ppm: central/floor/gravity furnace, boiler, direct-vent wall furnace, clothes dryer.
    const _loose = /(central furnace|\bfurnace\b|\bboiler\b|floor furnace|gravity furnace|direct[- ]?vent|clothes dryer|\bdryer\b)/i.test(_lastUser)
                   || /(\bhorno\b|\bcaldera\b|secadora|tiro directo|ventilaci[oó]n directa)/i.test(_lastUser);
    const _lim = _strict ? 200 : (_loose ? 400 : 200);
    if (_co >= _lim) {
      _safetyLead = _L({
        en: 'SAFETY FIRST — shut the appliance down now. ' + _co + ' ppm CO air-free is at or above the ' + _lim + ' ppm limit for this appliance; it comes off until you find and correct the cause, then check ambient CO in the occupied space.',
        // "libre de aire"/"无空气"/"(air-free)"/"sans air"/"livre de ar" are load-bearing:
        // _combustionEvent (close-out checklist) matches on them.
        es: 'SEGURIDAD PRIMERO — apague el equipo ahora. ' + _co + ' ppm de CO libre de aire está en o por encima del límite de ' + _lim + ' ppm para este equipo; queda fuera de servicio hasta encontrar y corregir la causa, y después mida el CO ambiente en el espacio ocupado.',
        zh: '安全第一 — 立即停机。' + _co + ' ppm 无空气CO（air-free）已达到或超过该设备 ' + _lim + ' ppm 的限值；在找到并纠正原因之前设备停用，然后测量居住空间的环境CO。',
        vi: 'AN TOÀN TRƯỚC HẾT — tắt thiết bị ngay. ' + _co + ' ppm CO (air-free) bằng hoặc vượt giới hạn ' + _lim + ' ppm cho thiết bị này; nó ngừng chạy cho đến khi tìm ra và sửa nguyên nhân, rồi đo CO trong không gian sinh hoạt.',
        fr: 'SÉCURITÉ D\'ABORD — arrêtez l\'appareil maintenant. ' + _co + ' ppm de CO sans air atteint ou dépasse la limite de ' + _lim + ' ppm pour cet appareil ; il reste hors service jusqu\'à trouver et corriger la cause, puis mesurez le CO ambiant dans l\'espace occupé.',
        pt: 'SEGURANÇA PRIMEIRO — desligue o equipamento agora. ' + _co + ' ppm de CO livre de ar está no limite de ' + _lim + ' ppm ou acima para este equipamento; ele fica fora de serviço até achar e corrigir a causa, depois meça o CO ambiente no espaço ocupado.' });
    }
  }
  // (C) Confirmed spillage past 2 minutes under worst-case depressurization.
  if (/spillage[^.]{0,55}(continu|past|over|beyond|exceed|more than|lasting)[^.]{0,16}(2|two)\s*min/i.test(_lastUser)
      || /(2|two)\s*min[^.]{0,26}spillage/i.test(_lastUser)) {
    _safetyLead = _L({
      en: 'SAFETY FIRST — shut it down and red-tag it, with written notice to the occupants. Confirmed draft-hood spillage past two minutes under worst-case depressurization is a mandatory shutdown, not a judgment call.',
      // "Derrame de gases"/"烟气溢出"/"Tràn khí thải"/"refoulement"/"Derramamento de gases"
      // are load-bearing: _combustionEvent (close-out checklist) matches on them.
      es: 'SEGURIDAD PRIMERO — apáguelo y póngale etiqueta roja (red tag), con aviso por escrito a los ocupantes. Derrame de gases confirmado en la campana de tiro por más de dos minutos bajo despresurización de peor caso es un apagado obligatorio, no una decisión a criterio.',
      zh: '安全第一 — 停机并挂红牌（red tag），书面通知住户。最不利负压工况下烟气溢出持续超过两分钟，属于强制停机——没有商量余地。',
      vi: 'AN TOÀN TRƯỚC HẾT — tắt máy và dán thẻ đỏ (red tag), kèm thông báo bằng văn bản cho người ở. Tràn khí thải tại chụp hút xác nhận quá hai phút trong điều kiện áp suất âm xấu nhất là bắt buộc dừng máy — không phải chuyện cân nhắc.',
      fr: 'SÉCURITÉ D\'ABORD — arrêtez-le et posez une étiquette rouge (red tag), avec avis écrit aux occupants. Un refoulement confirmé au coupe-tirage au-delà de deux minutes en dépressurisation pire-cas est un arrêt obligatoire, pas une question de jugement.',
      pt: 'SEGURANÇA PRIMEIRO — desligue e coloque etiqueta vermelha (red tag), com aviso por escrito aos moradores. Derramamento de gases confirmado no defletor por mais de dois minutos sob despressurização de pior caso é desligamento obrigatório, não é questão de critério.' });
  }
  // (C2) Tripped flame-rollout switch.
  if (/(flame )?rollout[^.]{0,30}(switch )?(trip|tripp?ed|open|is out|popped)/i.test(_lastUser)
      // Spanish mirror (2026-10-31): techs keep the English word "rollout" in Spanish.
      || /rollout[^.]{0,30}(disparad|se dispar[oó]|se abri[oó]|abierto|activad|botad)/i.test(_lastUser)) {
    _safetyLead = _L({
      en: 'SAFETY FIRST — shut the gas off at the appliance valve, and do NOT reset the rollout switch until you have found the root cause (blocked flue, cracked heat exchanger, dirty or misaligned burners, failed inducer). A tripped rollout means flame left the burner box.',
      // "rollout" stays verbatim in every language — _combustionEvent matches on it.
      es: 'SEGURIDAD PRIMERO — cierre el gas en la válvula del equipo, y NO restablezca el interruptor de rollout hasta encontrar la causa raíz (chimenea bloqueada, intercambiador de calor agrietado, quemadores sucios o desalineados, inductor fallado). Un rollout disparado significa que la llama salió de la caja de quemadores.',
      zh: '安全第一 — 在设备燃气阀处关闭燃气，并且在找到根本原因（烟道堵塞、热交换器开裂、燃烧器脏污或错位、引风机故障）之前，不要复位rollout开关。rollout跳脱意味着火焰窜出了燃烧室。',
      vi: 'AN TOÀN TRƯỚC HẾT — khóa gas tại van của thiết bị, và KHÔNG reset công tắc rollout cho đến khi tìm ra nguyên nhân gốc (ống khói nghẹt, bộ trao đổi nhiệt nứt, đầu đốt bẩn hoặc lệch, quạt hút lỗi). Rollout nhảy nghĩa là lửa đã ra khỏi buồng đốt.',
      fr: 'SÉCURITÉ D\'ABORD — coupez le gaz à la vanne de l\'appareil, et ne réarmez PAS l\'interrupteur de rollout avant d\'avoir trouvé la cause racine (conduit bouché, échangeur fissuré, brûleurs sales ou désalignés, inducteur en panne). Un rollout déclenché signifie que la flamme est sortie du caisson des brûleurs.',
      pt: 'SEGURANÇA PRIMEIRO — feche o gás na válvula do equipamento, e NÃO rearme o interruptor de rollout até achar a causa raiz (chaminé bloqueada, trocador de calor trincado, queimadores sujos ou desalinhados, inducer com defeito). Rollout disparado significa que a chama saiu da câmara de combustão.' });
  }
  // (C3) A2L refrigerant release/leak — ignition sources FIRST, then ventilate.
  if (/(a2l|r-?454b|r-?32|r-?1234yf|r-?466a)[^.]{0,45}(leak|release|spray|venting|escap|discharg)/i.test(_lastUser)
      || /(refrigerant|charge)[^.]{0,30}(leak|release|spray|venting|escap)[^.]{0,45}(a2l|r-?454b|r-?32|flammab)/i.test(_lastUser)
      // Spanish mirror (2026-10-31): same refrigerant names, Spanish leak/flammable words, same windows.
      || /(a2l|r-?454b|r-?32|r-?1234yf|r-?466a)[^.]{0,45}(fuga|fugando|escape|escapando|liberaci[oó]n|descargando|rociando)/i.test(_lastUser)
      || /(refrigerante|carga)[^.]{0,30}(fuga|fugando|escape|escapando)[^.]{0,45}(a2l|r-?454b|r-?32|inflamable)/i.test(_lastUser)) {
    _safetyLead = _L({
      en: 'SAFETY FIRST — eliminate every ignition source first: no light switches, no open flame, no sparking tools in the area. THEN ventilate and clear the space. A2L refrigerant is mildly flammable, so ignition control comes before anything else.',
      es: 'SEGURIDAD PRIMERO — elimine primero toda fuente de ignición: ni interruptores de luz, ni llama abierta, ni herramientas que hagan chispa en el área. DESPUÉS ventile y despeje el espacio. El refrigerante A2L es levemente inflamable, así que el control de ignición va antes que todo.',
      zh: '安全第一 — 先消除一切火源：不碰灯开关、无明火、现场不用会打火花的工具。然后再通风并撤离人员。A2L冷媒属于弱可燃，所以控火源排在一切之前。',
      vi: 'AN TOÀN TRƯỚC HẾT — loại bỏ mọi nguồn lửa trước: không bật tắt công tắc đèn, không lửa trần, không dụng cụ phát tia lửa trong khu vực. SAU ĐÓ mới thông gió và giải tỏa không gian. Môi chất A2L dễ cháy nhẹ, nên kiểm soát nguồn lửa đi trước tất cả.',
      fr: 'SÉCURITÉ D\'ABORD — éliminez d\'abord toute source d\'ignition : pas d\'interrupteurs, pas de flamme nue, pas d\'outils à étincelles dans la zone. ENSUITE ventilez et dégagez l\'espace. Le réfrigérant A2L est légèrement inflammable, donc le contrôle de l\'ignition passe avant tout.',
      pt: 'SEGURANÇA PRIMEIRO — elimine primeiro toda fonte de ignição: nada de interruptores, nada de chama aberta, nada de ferramentas que soltem faísca na área. DEPOIS ventile e esvazie o espaço. O refrigerante A2L é levemente inflamável, então o controle de ignição vem antes de tudo.' });
  }
  // (B2) AMBIENT CO in an occupied space — ANSI/BPI-1200-S 7.3.3.3.
  // BEFORE 2026-08-08 THERE WAS NO AMBIENT RULE AT ALL: the only CO number checked was a
  // flue/air-free reading, so a tech standing in a hallway with a monitor going off got
  // nothing deterministic and it fell through to model judgment. Measured on prod, Mike
  // opened those calls with "this is a dangerous situation" — a description, not an action.
  // Placed after the equipment rules so an evacuation outranks a shutdown, but before (C4)
  // so a downed person still wins.
  // PER-CLAUSE, WORST-READING (fixed 2026-08-09). Two defects made this go silent or
  // understate on the most ordinary combustion-analysis message a tech can type:
  //   "22 ppm air free on the furnace, but 90 ppm in the hallway on my monitor"
  // The flue test ran against the WHOLE message, so "air free" anywhere suppressed the
  // ambient rule entirely — 90 ppm ambient is an evacuation and it said nothing. And
  // .match() takes the FIRST ppm, so "alarm set at 35 ppm, reading 400 ppm in the bedroom"
  // acted on 35 and issued the mildest advisory instead of evacuating.
  // Now: split into clauses, judge each reading in ITS OWN context, act on the WORST
  // ambient one. Same posture as the rest of this file — the dangerous reading wins.
  const _FLUE_CTX = /air[- ]?free|\bflue\b|\bvent\b|\bvented\b|stack|exhaust|draft hood|burner|combustion analyzer|libre de aire|sin diluir|corregid[oa]s?(?![a-z])|chimenea|quemador|campana de tiro|analizador de combusti|sans air|corrig[eé]e?s?(?![a-z])|conduit de fum[eé]e|br[uû]leur|livre de ar|corrigid[oa]s?(?![a-z])|\bchamin[eé]|queimador|无空气|烟道|烟囱|燃烧器|kh[ií] th[aả]i|[oố]ng kh[oó]i/i;
  const _CO_SIG = /\bco\b|carbon monoxide|monitor|meter|detector|alarm|mon[oó]xido|medidor|monoxyde|一氧化碳|报警器|探测器|kh[ií] CO|c[aả]m bi[eế]n CO/i;
  const _SPACE_SIG = /ambient|hallway|living room|basement|bedroom|kitchen|upstairs|downstairs|\bCAZ\b|in the (house|room|air|space|home)|s[oó]tano|pasillo|habitaci[oó]n|rec[aá]mara|dormitorio|cocina|\bsala\b|en (la|el) (casa|cuarto|aire|espacio|hogar)|走廊|地下室|卧室|厨房|客厅|屋里|房间里|t[aầ]ng h[aầ]m|h[aà]nh lang|(^|[^a-z])trong nh[aà]|dans (la (maison|cuisine|chambre)|le (couloir|salon|sous[- ]sol))|au sous[- ]sol|no (por[aã]o|corredor|quarto)|na (casa|cozinha|sala)/i;
  // Message-level signals let a bare "90 ppm in the hallway" clause still qualify when the
  // CO word sits in a neighbouring clause; the FLUE test stays clause-local on purpose,
  // because that is the one that SUPPRESSES a warning.
  const _coSignal = _CO_SIG.test(_lastUser);
  const _spaceSignal = _SPACE_SIG.test(_lastUser);
  // (B3) STANDARDS TALK IS NOT A READING (2026-10-04, found by the exam re-test).
  // A tech ASKING about CO thresholds ("OSHA 50 ppm TWA, NIOSH 200 ppm ceiling, EPA 9 ppm
  // 8-hour") got "STOP AND EVACUATE — 200 ppm ambient CO": the guard took the worst number
  // in a standards LIST as a live reading and ordered the evacuation of a building nobody
  // measured. A clause that cites a standard/limit with no measurement language is
  // knowledge, not telemetry — skip it. A clause carrying BOTH ("reading 200 ppm, over
  // the OSHA limit") keeps its measurement meaning, so real readings still evacuate.
  const _STD_CTX = /\bosha\b|\bniosh\b|ashrae|\bepa\b|\bwho\b|\bpel\b|\btwa\b|\bstel\b|ceiling|ul ?2034|\bansi\b|\bbpi\b|standard|threshold|\blimit\b|guideline|allowable|exposure (limit|level)|chronic exposure|long[- ]term exposure|\bidlh\b|\brel\b|\btlv\b|acgih|\bpossibl\w*|\bfor\s+\d+\s*[\u2013-]\s*\d+\s*min|do[- ]?not[- ]?restore|alarm (point|setpoint|set ?point|must (sound|alarm|activate))|set at|code (says|requires|allows)|max(imum)?\s+(of\s+)?\d|difference between|\bnormas?\b|\bl[ií]mites?\b|\bumbral(es)?\b|\best[aá]ndar(es)?\b|permitid|aceptable|exposici[oó]n|diferencia entre|c[oó]digo (dice|exige|permite)|\bnormes?\b|\bseuils?\b|valeur limite|r[eé]glementation|\bpadr[aã]o\b|limite de exposi[cç][aã]o|标准|限值|规范|允许值|gi[oớ]i h[aạ]n cho ph[eé]p|ti[eê]u chu[aẩ]n/i;
  const _MEAS_CTX = /read(ing|s)?\b|measur|metered?|test(ed|ing)? at|\bgetting\b|\bseeing\b|\bshowing\b|\bshows\b|pulling\b|my (meter|monitor|detector|analyzer)|(meter|monitor|detector|analyzer)\s+(is|says|reads|shows|went)|went off|alarming|i'?m at|sitting at|holding at|leyendo|lectura|midiendo|\bmidi[oó](?![a-z])|marcando|me (da|est[aá] dando)|estoy (viendo|midiendo|leyendo)|\bson[oó](?![a-z])|se activ[oó]|se dispar[oó]|je (lis|mesure|rel[eè]ve)|affiche\s+\d|mesur[eé]|relev[eé](?![a-z])|lendo\s+\d|leitura|medindo|mediu\s+\d|测到|读数|显示|检测到|đo đ[uư][oợ]c|do duoc\s+\d|đang đo|dang do\s+\d/i;
  let _amb = 0;
  // thousands separators first: the clause split cuts on commas, so "NIOSH IDLH: 1,200 ppm"
  // used to shed a bare "200 ppm" clause with no standards word left to suppress it (2026-10-04).
  const _ambScan = _lastUser.replace(/(\d),(?=\d{3}\b)/g, '$1');
  for (const _cl of _ambScan.split(/[.;,。；，、]|\bbut\b|\bhowever\b|\bwhile\b|\bpero\b|\bsin embargo\b|\bmientras\b|\baunque\b|但是|不过|然而|\bmais\b|\bmas\b|por[eé]m|(^|[^a-z])nh[uư]ng(?![a-z])/i)) {
    if (_FLUE_CTX.test(_cl)) continue;                       // rule (B) owns flue readings
    if (_STD_CTX.test(_cl) && !_MEAS_CTX.test(_cl)) continue; // (B3) cited standard, not a reading
    if (!(_CO_SIG.test(_cl) || _SPACE_SIG.test(_cl) || _coSignal || _spaceSignal)) continue;
    const _clRe = new RegExp(_PPM + '\\s*ppm', 'gi');
    let _hit;
    while ((_hit = _clRe.exec(_cl))) {
      const _v = _ppmNum(_hit[1]);
      if (_v > _amb) _amb = _v;                              // worst ambient reading wins
    }
  }
  if (_amb > 0) {
    if (_amb >= 1200) {
      _safetyLead = _L({
        en: 'GET OUT NOW — ' + _amb + ' ppm is at or above the level that is immediately dangerous to life. Everyone leaves the building right now, you included. Call 911 from outside. Nobody goes back in without the fire department and SCBA.',
        es: 'SALGAN AHORA — ' + _amb + ' ppm de CO está en o por encima del nivel inmediatamente peligroso para la vida. Todos salen del edificio ahora mismo, usted incluido. Llame al 911 desde afuera. Nadie vuelve a entrar sin los bomberos y equipo de aire autónomo (SCBA).',
        zh: '马上离开 — ' + _amb + ' ppm 的CO已达到或超过立即危及生命的水平。所有人现在就离开建筑，包括你。到室外打911。没有消防队和正压空气呼吸器（SCBA）任何人不得返回。',
        vi: 'RA NGOÀI NGAY — ' + _amb + ' ppm CO bằng hoặc vượt mức nguy hiểm tức thì đến tính mạng. Mọi người rời khỏi tòa nhà ngay bây giờ, kể cả bạn. Gọi 911 từ bên ngoài. Không ai quay vào nếu không có lính cứu hỏa và SCBA.',
        fr: 'SORTEZ IMMÉDIATEMENT — ' + _amb + ' ppm de CO atteint ou dépasse le niveau immédiatement dangereux pour la vie. Tout le monde quitte le bâtiment tout de suite, vous compris. Appelez le 911 depuis l\'extérieur. Personne ne rentre sans les pompiers et un ARI (SCBA).',
        pt: 'SAIAM AGORA — ' + _amb + ' ppm de CO está no nível imediatamente perigoso à vida ou acima. Todos saem do prédio agora mesmo, você incluído. Ligue para o 911 do lado de fora. Ninguém volta sem os bombeiros e equipamento autônomo (SCBA).' });
    } else if (_amb >= 70) {
      _safetyLead = _L({
        en: 'STOP AND EVACUATE — ' + _amb + ' ppm ambient CO. Tell every occupant to get out of the building now, and get yourself out with them. Call emergency services from OUTSIDE the house. Do not stay to ventilate and do not keep diagnosing — at 70 ppm and up the standard says you leave.',
        es: 'ALTO Y EVACÚEN — ' + _amb + ' ppm de CO ambiente. Dígale a todos los ocupantes que salgan del edificio ahora, y salga usted con ellos. Llame a emergencias desde AFUERA de la casa. No se quede a ventilar y no siga diagnosticando — a 70 ppm o más la norma dice que se sale.',
        zh: '立即撤离 — 环境CO ' + _amb + ' ppm。让所有住户现在撤出建筑，你也跟着出去。到屋外打紧急电话。不要留下通风，也不要继续诊断——70 ppm及以上，标准就是离开。',
        vi: 'DỪNG LẠI VÀ SƠ TÁN — ' + _amb + ' ppm CO trong không khí. Bảo mọi người ở trong nhà ra ngoài ngay, và bạn ra cùng họ. Gọi cấp cứu từ BÊN NGOÀI nhà. Đừng ở lại thông gió và đừng tiếp tục chẩn đoán — từ 70 ppm trở lên, tiêu chuẩn nói là phải rời đi.',
        fr: 'ARRÊTEZ ET ÉVACUEZ — ' + _amb + ' ppm de CO ambiant. Faites sortir tous les occupants du bâtiment maintenant, et sortez avec eux. Appelez les secours depuis l\'EXTÉRIEUR. Ne restez pas pour ventiler et n\'allez pas plus loin dans le diagnostic — à 70 ppm et plus, la norme dit qu\'on sort.',
        pt: 'PARE E EVACUE — ' + _amb + ' ppm de CO ambiente. Mande todos os moradores saírem do prédio agora, e saia você com eles. Ligue para a emergência do LADO DE FORA da casa. Não fique para ventilar e não continue diagnosticando — de 70 ppm para cima, a norma manda sair.' });
    } else if (_amb >= 36) {
      _safetyLead = _L({
        en: 'SAFETY FIRST — ' + _amb + ' ppm ambient CO is elevated. Tell the occupant, get windows and doors open, and shut off every possible CO source before you go any further.',
        es: 'SEGURIDAD PRIMERO — ' + _amb + ' ppm de CO ambiente es un nivel elevado. Avise al ocupante, abra ventanas y puertas, y apague toda posible fuente de CO antes de seguir.',
        zh: '安全第一 — 环境CO ' + _amb + ' ppm，已属偏高。告知住户，打开门窗，关掉所有可能的CO来源，然后才能继续。',
        vi: 'AN TOÀN TRƯỚC HẾT — ' + _amb + ' ppm CO trong không khí là mức cao. Báo cho người ở, mở cửa sổ và cửa ra vào, tắt mọi nguồn CO có thể trước khi làm tiếp.',
        fr: 'SÉCURITÉ D\'ABORD — ' + _amb + ' ppm de CO ambiant, c\'est élevé. Prévenez l\'occupant, ouvrez fenêtres et portes, et coupez toute source possible de CO avant d\'aller plus loin.',
        pt: 'SEGURANÇA PRIMEIRO — ' + _amb + ' ppm de CO ambiente é um nível elevado. Avise o morador, abra janelas e portas, e desligue toda fonte possível de CO antes de continuar.' });
    } else if (_amb >= 9) {
      _safetyLead = _L({
        en: 'SAFETY FIRST — ' + _amb + ' ppm ambient CO is detectable. Tell the occupant, ventilate, and find the source before you move on. If a permanently installed appliance is the suspect, it needs a qualified professional on it.',
        es: 'SEGURIDAD PRIMERO — ' + _amb + ' ppm de CO ambiente es detectable. Avise al ocupante, ventile, y encuentre la fuente antes de continuar. Si el sospechoso es un equipo de instalación permanente, necesita un profesional calificado.',
        zh: '安全第一 — 环境CO ' + _amb + ' ppm，可检出。告知住户，通风，先找到来源再继续。如果嫌疑是固定安装的设备，需要有资质的专业人员处理。',
        vi: 'AN TOÀN TRƯỚC HẾT — ' + _amb + ' ppm CO trong không khí là mức phát hiện được. Báo cho người ở, thông gió, và tìm nguồn trước khi làm tiếp. Nếu nghi phạm là thiết bị lắp cố định, cần thợ chuyên môn có chứng chỉ xử lý.',
        fr: 'SÉCURITÉ D\'ABORD — ' + _amb + ' ppm de CO ambiant, c\'est détectable. Prévenez l\'occupant, ventilez, et trouvez la source avant de passer à autre chose. Si le suspect est un appareil à installation fixe, il faut un professionnel qualifié dessus.',
        pt: 'SEGURANÇA PRIMEIRO — ' + _amb + ' ppm de CO ambiente é detectável. Avise o morador, ventile, e encontre a fonte antes de seguir. Se o suspeito é um equipamento de instalação fixa, precisa de um profissional qualificado nele.' });
    }
  }
  // (B4) CO ALARM ACTIVELY SOUNDING = evacuate on the ALARM fact (2026-10-04). Before this
  // rule the only deterministic evacuation needed a NUMBER, so "CO alarm sounding, occupants
  // home" either fabricated a reading out of the alarm's UL-2034 spec text ("400 ppm ambient
  // CO" nobody measured) or fell through to model judgment. The alarm being in alarm IS the
  // trigger; the honest lead carries no reading because none exists yet. A number-backed
  // evacuation above outranks this one. Past-tense ("went off last week") stays model-side.
  const _coAlarmNowEn = /(\bco\b|carbon monoxide)[ -]?(alarm|detector|monitor)[^.]{0,45}(sounding|going off|alarming|in alarm|activated|activation|triggered|just went off|keeps going off|won'?t stop)/i.test(_lastUser)
      && !/(last (week|month|night|winter)|yesterday|days? ago|a while (ago|back)|went off (once|briefly|before)|had gone off|false alarm)/i.test(_lastUser);
  // Spanish mirror (2026-10-31): alarm/detector noun + CO within the same windows plus an
  // actively-sounding verb, with the same past-tense/false-alarm stand-down. Word order
  // flips in Spanish ("sonó la alarma de monóxido"), so both orders are covered.
  const _coAlarmNowEs = (/(alarma|detector|monitor)[^.]{0,30}(de\s+)?(\bco\b|mon[oó]xido)[^.]{0,45}(sonando|son[oó]|se activ[oó]|se dispar[oó]|disparad|activad|no (deja|para) de sonar|est[aá] sonando)/i.test(_lastUser)
      || /(son[oó]|est[aá] sonando|sonando|se activ[oó]|se dispar[oó])[^.]{0,35}(alarma|detector|monitor)[^.]{0,30}(\bco\b|mon[oó]xido)/i.test(_lastUser))
      && !/(la semana pasada|el (mes|a[ñn]o) pasado|\banoche\b|\bayer\b|hace (d[ií]as|rato|tiempo|una semana)|son[oó] (una vez|antes|brevemente)|falsa alarma)/i.test(_lastUser);
  // zh/vi/fr/pt mirrors (2026-10-31): same shape — alarm noun + CO + actively-sounding
  // verb, with each language's past-tense/false-alarm stand-down.
  const _coAlarmNowZh = /(一氧化碳|CO)(报警器|警报器|探测器|报警)[^.。]{0,45}(在响|响了|一直响|正在报警|响个不停)/.test(_lastUser)
      && !/上周|上个月|昨天|昨晚|前几天|误报/.test(_lastUser);
  const _coAlarmNowVi = /(b[aá]o đ[oộ]ng|c[aả]m bi[eế]n|bao dong|chu[oô]ng b[aá]o)[^.]{0,30}CO[^.]{0,45}(k[eê]u|đang k[eê]u|dang keu|reo|h[uú]|k[eê]u li[eê]n t[uụ]c)/i.test(_lastUser)
      && !/tu[aầ]n tr[uư][oớ]c|tuan truoc|h[oô]m qua|hom qua|b[aá]o đ[oộ]ng gi[aả]|bao dong gia/i.test(_lastUser);
  const _coAlarmNowFr = /(d[eé]tecteur|alarme)[^.]{0,30}(de )?(\bCO\b|monoxyde)[^.]{0,45}(sonne|hurle|se d[eé]clenche|s'est d[eé]clench[eé]|retentit|n'arr[eê]te pas)/i.test(_lastUser)
      && !/(la semaine derni[eè]re|\bhier\b|cette nuit|il y a (des jours|longtemps)|fausse alarme)/i.test(_lastUser);
  const _coAlarmNowPt = /(alarme|detector)[^.]{0,30}(de )?(\bCO\b|mon[oó]xido)[^.]{0,45}(tocando|disparou|disparad|apitando|n[aã]o para de tocar|est[aá] tocando)/i.test(_lastUser)
      && !/(semana passada|\bontem\b|dias atr[aá]s|alarme falso)/i.test(_lastUser);
  if (!/^(STOP AND EVACUATE|GET OUT NOW|ALTO Y EVAC|SALGAN AHORA|立即撤离|马上离开|DỪNG LẠI VÀ SƠ TÁN|RA NGOÀI NGAY|ARRÊTEZ ET ÉVACUEZ|SORTEZ IMMÉDIATEMENT|PARE E EVACUE|SAIAM AGORA)/.test(_safetyLead)
      && (_coAlarmNowEn || _coAlarmNowEs || _coAlarmNowZh || _coAlarmNowVi || _coAlarmNowFr || _coAlarmNowPt)) {
    // Tightened 2026-10-19: same steps (treat as real, evacuate incl. tech, call from
    // outside, no ventilate-first, meter at the door before re-entry, find the source),
    // half the words.
    _safetyLead = _L({
      en: 'STOP AND EVACUATE — treat that CO alarm as real. Everyone out now, you included; call 911 or the gas utility from OUTSIDE. Don\'t ventilate first — airing it out erases the evidence while people keep breathing it. Meter the ambient CO at the door before anyone re-enters, and find the source before that alarm gets called false.',
      es: 'ALTO Y EVACÚEN — trate esa alarma de CO como real. Todos afuera ahora, usted incluido; llame al 911 o a la compañía de gas desde AFUERA. No ventile primero — airear borra la evidencia mientras la gente lo sigue respirando. Mida el CO ambiente en la puerta antes de que alguien vuelva a entrar, y encuentre la fuente antes de declarar falsa esa alarma.',
      zh: '立即撤离 — 把这个CO报警当真。所有人现在撤出，包括你；到室外打911或燃气公司电话。不要先通风——通风会抹掉证据，而人还在继续吸。任何人再进入之前先在门口测环境CO，并在把报警定为误报之前找到来源。',
      vi: 'DỪNG LẠI VÀ SƠ TÁN — coi báo động CO đó là thật. Mọi người ra ngoài ngay, kể cả bạn; gọi 911 hoặc công ty gas từ BÊN NGOÀI. Đừng thông gió trước — làm loãng khí là xóa bằng chứng trong khi mọi người vẫn đang hít. Đo CO tại cửa trước khi ai đó vào lại, và tìm ra nguồn trước khi kết luận báo động giả.',
      fr: 'ARRÊTEZ ET ÉVACUEZ — traitez cette alarme CO comme réelle. Tout le monde dehors maintenant, vous compris ; appelez le 911 ou le fournisseur de gaz depuis l\'EXTÉRIEUR. Ne ventilez pas d\'abord — aérer efface la preuve pendant que les gens continuent de respirer. Mesurez le CO ambiant à la porte avant que quiconque rentre, et trouvez la source avant de déclarer l\'alarme fausse.',
      pt: 'PARE E EVACUE — trate esse alarme de CO como real. Todos para fora agora, você incluído; ligue para o 911 ou a companhia de gás do LADO DE FORA. Não ventile primeiro — arejar apaga a evidência enquanto as pessoas continuam respirando. Meça o CO ambiente na porta antes de alguém voltar, e ache a fonte antes de chamar esse alarme de falso.' });
  }
  // (C5) OCCUPANT SYMPTOMS + a combustion appliance = treat it as CO until proven otherwise.
  // Symptoms are now an INDEPENDENT trigger. Previously "headache" only registered if a CO
  // keyword appeared within 45 characters of it, which is exactly why "180 ppm in the hallway
  // and the homeowner says she has a headache" produced nothing at all.
  // This is deliberately OUR rule, not a cited standard — no standard states it numerically.
  // The reasoning: dose is concentration x time, so a spot reading captures neither the peak
  // nor the accumulated exposure, and WHO notes the link between measured levels and symptoms
  // is poor. A symptomatic occupant is a real signal at ANY reading, including zero.
  if ((/(headache|nause|dizzy|light[- ]?headed|confus|disorient|vomit|throwing up|flu[- ]?like)/i.test(_lastUser)
       // Spanish symptom words (2026-10-31), accent-insensitive.
       || /(dolor de cabeza|n[aá]usea|maread|v[oó]mit|vomitando|confundid|desorientad|aturdid|como con gripe)/i.test(_lastUser)
       // zh/vi/fr/pt symptom words (2026-10-31)
       || /头疼|头痛|恶心|头晕|想吐|呕吐/.test(_lastUser)
       || /(đau đ[aầ]u|dau dau|ch[oó]ng m[aặ]t|chong mat|bu[oồ]n n[oô]n|buon non|n[oô]n [oó]i)/i.test(_lastUser)
       || /(mal de t[eê]te|naus[eé]e|[eé]tourdi|vertige|\bvomi(ssements?|ssant)?(?![a-z]))/i.test(_lastUser)
       || /(dor de cabe[cç]a|tontura|enjoo|enjoad|vomitando)/i.test(_lastUser))
      && (/(furnace|boiler|water heater|gas|combustion|appliance|heater|fireplace|\bco\b|carbon monoxide|ppm)/i.test(_lastUser)
       || /(caldera|calefacci[oó]n|calentador|calefactor|\bhornos?\b|estufa|chimenea|combusti[oó]n|aparato|mon[oó]xido)/i.test(_lastUser)
       || /锅炉|热水器|炉子|暖气|燃气|煤气|一氧化碳|设备/.test(_lastUser)
       || /(l[oò] s[uư][oở]i|m[aá]y n[uư][oớ]c n[oó]ng|may nuoc nong|kh[ií] gas|khi gas|thi[eế]t b[iị])/i.test(_lastUser)
       || /(chaudi[eè]re|chauffe-eau|fournaise|chauffage|appareil|chemin[eé]e|monoxyde)/i.test(_lastUser)
       || /(aquecedor|caldeira|aquecimento|lareira|\bchamin[eé])/i.test(_lastUser))) {
    const _medical = _L({
      en: ' Anyone feeling it needs to be checked by a medic — symptoms around a combustion appliance get treated as carbon monoxide until proven otherwise, whatever the meter says, because a spot reading misses both the peak and what they have already breathed in.',
      es: ' Cualquiera que lo sienta necesita evaluación médica — los síntomas cerca de un equipo de combustión se tratan como monóxido de carbono (CO) hasta demostrar lo contrario, diga lo que diga el medidor, porque una lectura puntual no captura ni el pico ni lo que ya respiraron.',
      zh: ' 有症状的人都需要就医检查——燃烧设备附近的症状一律按一氧化碳（CO）中毒对待，直到证明不是，不管仪表读多少，因为单点读数既测不到峰值也测不到已经吸入的量。',
      vi: ' Ai thấy triệu chứng đều cần được y tế kiểm tra — triệu chứng gần thiết bị đốt được coi là ngộ độc CO cho đến khi chứng minh ngược lại, bất kể máy đo nói gì, vì một lần đo không bắt được đỉnh lẫn lượng đã hít vào.',
      fr: ' Toute personne qui le ressent doit être vue par un secouriste — des symptômes près d\'un appareil à combustion se traitent comme du monoxyde de carbone (CO) jusqu\'à preuve du contraire, quoi que dise le détecteur, car une mesure ponctuelle rate le pic et ce qui a déjà été respiré.',
      pt: ' Quem estiver sentindo precisa de avaliação médica — sintomas perto de um equipamento de combustão são tratados como monóxido de carbono (CO) até prova em contrário, diga o que disser o medidor, porque uma leitura pontual perde o pico e o que já foi respirado.' });
    // GRADED, so the guard doesn't cry wolf (fixed 2026-08-09). Symptoms became an independent
    // trigger, which meant "this furnace is giving me a headache" — a tech venting, not a
    // patient — produced a full building evacuation. That matters: a guard that fires on
    // frustration is one techs learn to scroll past, and then it isn't there on the day it
    // counts. So we never go silent, we scale.
    // CORROBORATED = a real measurement or device, or someone OTHER than the writer described
    // as feeling it. Those get the full evacuation. A bare appliance word plus a symptom gets
    // a proportionate check instead — still safety-first, still CO-until-proven-otherwise.
    const _symptomCorroborated =
      /\d\s*ppm|\bco\b|carbon monoxide|detector|alarm|monitor|mon[oó]xido/i.test(_lastUser)
      // 2026-11-02 review (Jordan, B3): leading \b — without it "the" matched as "he" and
      // "the condenser is noisy" upgraded a tech's venting into a full evacuation,
      // regressing the 2026-08-09 graded fix. Same cry-wolf class, English this time.
      || /\b(occupant|homeowner|customer|tenant|resident|patient|victim|wife|husband|kids?|child|children|baby|family|she|he|they|everyone)\b[^.]{0,40}(has|had|have|feels?|felt|is|are|been|complain|says?|said|getting)/i.test(_lastUser)
      // Spanish mirror (2026-10-31): someone OTHER than the writer described as feeling it.
      || /\b(ocupante|due[ñn][oa]|cliente|inquilin[oa]|residente|esposa|esposo|se[ñn]ora|se[ñn]or|ni[ñn][oa]s?|beb[eé]|familia|ella|todos)\b[^.]{0,40}(tiene|tienen|ten[ií]a|siente|sienten|se siente|est[aá]n?(?![a-z])|dice|dicen|se queja)/i.test(_lastUser)
      // zh/vi/fr/pt corroboration (2026-10-31): someone other than the writer feels it.
      || /(住户|业主|房主|客户|老婆|丈夫|孩子|小孩|全家|大家)[^.。]{0,40}(头疼|头痛|恶心|头晕|不舒服|说)/.test(_lastUser)
      || /(^|[^a-z])(ch[uủ] nh[aà]|kh[aá]ch h[aà]ng|v[oợ]|ch[oồ]ng|con|c[aả] nh[aà])\s+(b[iị]|k[eê]u|n[oó]i|th[aấ]y)(?![a-z])/i.test(_lastUser)
      || /\b(occupant|propri[eé]taire|locataire|femme|mari|enfants?|toute la famille)\b[^.]{0,40}\b(a (mal|des naus|la naus|des vertiges)|ont (mal|des naus)|se sent|se plaint|dit (que|qu)|disent (que|qu))/i.test(_lastUser)
      || /(morador|dona da casa|dono da casa|inquilin[oa]|esposa|marido|crian[cç]as?|fam[ií]lia toda)\b[^.]{0,40}(tem |t[eê]m |sente|est[aá]|diz |reclama)/i.test(_lastUser);
    if (/^(STOP AND EVACUATE|GET OUT NOW|ALTO Y EVAC|SALGAN AHORA|立即撤离|马上离开|DỪNG LẠI VÀ SƠ TÁN|RA NGOÀI NGAY|ARRÊTEZ ET ÉVACUEZ|SORTEZ IMMÉDIATEMENT|PARE E EVACUE|SAIAM AGORA)/.test(_safetyLead)) {
      // An evacuation already fired — append the medical step, never replace it, or a
      // symptomatic occupant at 180 ppm loses "call emergency services from outside".
      _safetyLead += _medical;
    } else if (_symptomCorroborated) {
      _safetyLead = _L({
        en: 'SAFETY FIRST — get everyone out into fresh air now, including you.',
        es: 'SEGURIDAD PRIMERO — saque a todos al aire fresco ahora, usted incluido.',
        zh: '安全第一 — 让所有人现在到新鲜空气处，包括你。',
        vi: 'AN TOÀN TRƯỚC HẾT — đưa mọi người ra chỗ không khí trong lành ngay, kể cả bạn.',
        fr: 'SÉCURITÉ D\'ABORD — faites sortir tout le monde à l\'air frais maintenant, vous compris.',
        pt: 'SEGURANÇA PRIMEIRO — leve todos para o ar fresco agora, você incluído.' }) + _medical + _L({
        en: ' Diagnose the equipment after the people are out and safe.',
        es: ' Diagnostique el equipo después de que la gente esté afuera y a salvo.',
        zh: ' 人都安全出来之后再诊断设备。',
        vi: ' Chẩn đoán thiết bị sau khi mọi người đã ra ngoài an toàn.',
        fr: ' Diagnostiquez l\'appareil après que les gens sont dehors et en sécurité.',
        pt: ' Diagnostique o equipamento depois que as pessoas estiverem fora e seguras.' });
    } else {
      _safetyLead = _L({
        en: 'SAFETY FIRST — if that is a real symptom and not just a long day, step outside into fresh air before you go further. Around a combustion appliance, a headache or nausea gets treated as carbon monoxide until proven otherwise — put a meter on the space and check ambient CO before you keep working.',
        es: 'SEGURIDAD PRIMERO — si eso es un síntoma real y no solo un día largo, salga al aire fresco antes de seguir. Cerca de un equipo de combustión, un dolor de cabeza o náuseas se tratan como monóxido de carbono (CO) hasta demostrar lo contrario — ponga un medidor en el espacio y verifique el CO ambiente antes de seguir trabajando.',
        zh: '安全第一 — 如果那是真症状而不只是累了一天，先出去呼吸新鲜空气再继续。在燃烧设备附近，头疼或恶心一律按一氧化碳（CO）对待直到证明不是——继续干活之前先放仪表测环境CO。',
        vi: 'AN TOÀN TRƯỚC HẾT — nếu đó là triệu chứng thật chứ không phải chỉ mệt, ra ngoài hít không khí trong lành trước khi làm tiếp. Gần thiết bị đốt, đau đầu hay buồn nôn được coi là CO cho đến khi chứng minh ngược lại — đặt máy đo và kiểm tra CO trong phòng trước khi làm việc tiếp.',
        fr: 'SÉCURITÉ D\'ABORD — si c\'est un vrai symptôme et pas juste une longue journée, sortez prendre l\'air avant d\'aller plus loin. Près d\'un appareil à combustion, un mal de tête ou des nausées se traitent comme du CO jusqu\'à preuve du contraire — mettez un détecteur dans l\'espace et vérifiez le CO ambiant avant de continuer.',
        pt: 'SEGURANÇA PRIMEIRO — se isso é sintoma de verdade e não só um dia longo, saia para o ar fresco antes de seguir. Perto de equipamento de combustão, dor de cabeça ou náusea é tratada como CO até prova em contrário — ponha um medidor no espaço e verifique o CO ambiente antes de continuar trabalhando.' });
    }
  }
  // (C4) MEDICAL EMERGENCY — an occupant is incapacitated (suspected CO or otherwise).
  // Highest-priority lead: a downed person is 911-first, before ANY equipment work, and
  // Mike must stay the HVAC tech (instruct + get help moving) — NOT play paramedic. Placed
  // last in the _safetyLead chain so it overrides equipment leads when a person is down.
  const _personDown =
    // 2026-11-02 (Jordan's convulsion investigation): patient/victim/co-worker were
    // missing from the person group — "the victim collapsed" produced NO 911 lead, and
    // C4b's own motivating example ("co-worker received electrical shock") used a person
    // noun this group didn't know. Third deliberate English change on this branch.
    /\b(occupant|someone|somebody|person|people|patients?|victims?|co-?workers?|homeowner|customer|tenant|resident|man|woman|lady|child|kid|baby|elderly|guy|she|he|they)\b[^.]{0,70}(unconscious|passed out|won'?t wake|unresponsive|collapsed|slurring|slurred|can barely (answer|respond|stand|talk|keep)|barely (conscious|awake|responsive|standing)|disorient|seizure|convuls|not making sense|cherry[- ]?red|blue lips|throwing up|vomit)/i.test(_lastUser)
    || /\b(unconscious|passed out|unresponsive|barely conscious|having a seizure|convulsing|won'?t wake up)\b/i.test(_lastUser)
    || /(confused|slurring|disorient|dizzy|nause|headache|throwing up|vomit)[^.]{0,45}(possible |suspect|maybe |might be )?(co\b|carbon monoxide|poison)/i.test(_lastUser)
    || /(co\b|carbon monoxide)[^.]{0,45}(confused|slurring|disorient|unconscious|passed out|vomit|barely|can'?t stay awake|drowsy)/i.test(_lastUser)
    // Spanish mirror (2026-10-31): standalone incapacitation words, and symptom+CO in both orders.
    || /\b(inconsciente|desmayad[oa]|se desmay[oó]|no responde|no despierta|sin conocimiento|convulsiones|convulsionando|convulsión|apenas (consciente|responde)|no reacciona)\b/i.test(_lastUser)
    || /(confundid|balbucea|desorientad|maread|n[aá]usea|dolor de cabeza|vomitando|v[oó]mit)[^.]{0,45}(posible |sospech\w+ )?(co\b|mon[oó]xido|envenenamiento|intoxicaci[oó]n)/i.test(_lastUser)
    || /(co\b|mon[oó]xido)[^.]{0,45}(confundid|balbucea|desorientad|inconsciente|desmayad|vomitando|apenas|no se mantiene despiert|somnolient)/i.test(_lastUser)
    // zh/vi/fr/pt incapacitation words (2026-10-31)
    || /昏迷|晕倒|不省人事|叫不醒|没有反应|抽搐/.test(_lastUser)
    || /(b[aấ]t t[iỉ]nh|bat tinh|ng[aấ]t x[iỉ]u|ngat xiu|kh[oô]ng t[iỉ]nh d[aậ]y|khong tinh day|kh[oô]ng ph[aả]n [uứ]ng|khong phan ung)/i.test(_lastUser)
    || /(\binconscient(es?)?(?![a-z])|[eé]vanoui|ne r[eé]pond pas|ne se r[eé]veille pas|perdu connaissance)/i.test(_lastUser)
    || /(desmaiad|n[aã]o responde|nao responde|n[aã]o acorda|nao acorda|sem sentidos|perdeu os sentidos)/i.test(_lastUser);
  // (C4b) ELECTRICAL-SHOCK VICTIM ≠ CO VICTIM (2026-10-04, found by the exam re-test).
  // The person-down lead assumed carbon monoxide for EVERY downed person. On "co-worker
  // received electrical shock, may still be in contact with energized equipment" it opened
  // with "get the person out into fresh air" — grab the victim — BEFORE the body's
  // kill-the-power step. Rescuer contact with an energized victim is how one casualty
  // becomes two, so shock context owns the lead: power off before touch.
  const _shockVictim = /electrocut|electric(al)?[- ]?(shock|burn|contact)|\bshocked\b|(received?|got|getting|took) a shock|still in contact|in contact with[^.]{0,40}(energized|live|equipment|conductor|wire|panel)|(touch|grabb|holding)[^.]{0,30}(live|hot|energized)/i.test(_lastUser)
    // Spanish mirror (2026-10-31): shock context owns the lead — power off before touch.
    || /(electrocutad|descarga el[eé]ctrica|le dio (la )?corriente|recibi[oó] (una )?descarga|sigue en contacto|en contacto con[^.]{0,40}(energizad|vivo|cable|panel|equipo)|quemadura el[eé]ctrica)/i.test(_lastUser)
    // zh/vi/fr/pt shock context (2026-10-31): power off before touch, in any language.
    || /触电|电击|被电到|还碰着电|还在接触(带电|电)/.test(_lastUser)
    || /(đi[eệ]n gi[aậ]t|dien giat|b[iị] gi[aậ]t đi[eệ]n|bi giat dien|v[aẫ]n (đang )?ch[aạ]m v[aà]o|van cham vao)/i.test(_lastUser)
    || /([eé]lectrocut[eé]|choc [eé]lectrique|a pris le (courant|jus)|encore en contact)/i.test(_lastUser)
    || /(choque el[eé]trico|levou (um )?choque|ainda em contato|eletrocutad)/i.test(_lastUser);
  if (_personDown && _shockVictim) {
    _safetyLead = _L({
      en: 'DO NOT TOUCH THEM — kill the power FIRST. If they could still be in contact with the source, de-energize before anything else: breaker, disconnect, pull the meter. If you can\'t kill power fast, separate them from the source with something dry and non-conductive — wood, fiberglass, a rubber mat — never your bare hands. Call 911 the moment they\'re clear, or have someone else call while you kill power. Then, and only then: not breathing means CPR now, and send someone for an AED. Electrical burns at the contact points mean internal injury — they go to the hospital even if they say they feel fine. You\'re the tech, not the medic: power off, 911, help until EMS arrives.',
      es: 'NO LO TOQUE — corte la corriente PRIMERO. Si la persona todavía puede estar en contacto con la fuente, desenergice antes que nada: breaker, desconectador, o jale el medidor. Si no puede cortar la corriente rápido, sepárela de la fuente con algo seco y no conductor — madera, fibra de vidrio, un tapete de goma — nunca con las manos desnudas. Llame al 911 en cuanto esté libre de la fuente, o que alguien más llame mientras usted corta la corriente. Entonces, y solo entonces: si no respira, RCP ya, y mande a alguien por un DEA. Quemaduras eléctricas en los puntos de contacto significan lesión interna — van al hospital aunque digan que se sienten bien. Usted es el técnico, no el paramédico: corriente fuera, 911, y ayude hasta que llegue la ambulancia.',
      zh: '千万不要碰他 — 先断电。如果他可能还接触着电源，先断电再做任何事：断路器、隔离开关、或拔电表。来不及断电就用干燥不导电的东西把他和电源分开——木头、玻璃钢、橡胶垫——绝不能空手。他一脱离就打911，或让别人打、你去断电。然后，也只有到那时：没呼吸就立刻做心肺复苏（CPR），并派人去拿AED。接触点的电烧伤意味着内部损伤——就算他说没事也要送医院。你是技师不是医护：断电、911、守到急救到场。',
      vi: 'ĐỪNG CHẠM VÀO NGƯỜI ĐÓ — cắt điện TRƯỚC. Nếu người đó có thể vẫn đang chạm nguồn điện, ngắt điện trước mọi thứ: CB, cầu dao, hoặc rút đồng hồ điện. Không cắt điện nhanh được thì tách người đó khỏi nguồn bằng vật khô không dẫn điện — gỗ, sợi thủy tinh, tấm cao su — tuyệt đối không dùng tay trần. Gọi 911 ngay khi người đó thoát ra, hoặc nhờ người khác gọi trong khi bạn cắt điện. Rồi, và chỉ khi đó: không thở là ép tim (CPR) ngay, và cử người đi lấy AED. Bỏng điện tại điểm tiếp xúc nghĩa là tổn thương bên trong — phải vào viện dù họ nói không sao. Bạn là thợ, không phải y tế: cắt điện, 911, hỗ trợ đến khi cấp cứu tới.',
      fr: 'NE LE TOUCHEZ PAS — coupez le courant D\'ABORD. S\'il peut encore être en contact avec la source, mettez hors tension avant tout : disjoncteur, sectionneur, ou tirez le compteur. Si vous ne pouvez pas couper vite, séparez-le de la source avec quelque chose de sec et non conducteur — bois, fibre de verre, tapis en caoutchouc — jamais à mains nues. Appelez le 911 dès qu\'il est dégagé, ou faites appeler pendant que vous coupez. Ensuite, et seulement ensuite : s\'il ne respire pas, RCP tout de suite, et envoyez quelqu\'un chercher un DEA. Des brûlures électriques aux points de contact signifient des lésions internes — il va à l\'hôpital même s\'il dit que ça va. Vous êtes le technicien, pas le médecin : courant coupé, 911, aidez jusqu\'à l\'arrivée des secours.',
      pt: 'NÃO TOQUE NA PESSOA — corte a energia PRIMEIRO. Se ela ainda pode estar em contato com a fonte, desenergize antes de tudo: disjuntor, chave seccionadora, ou puxe o medidor. Se não der para cortar rápido, separe-a da fonte com algo seco e não condutor — madeira, fibra de vidro, tapete de borracha — nunca com as mãos nuas. Ligue para o 911 assim que ela estiver livre, ou peça para alguém ligar enquanto você corta a energia. Então, e só então: se não respira, RCP já, e mande alguém buscar um DEA. Queimaduras elétricas nos pontos de contato significam lesão interna — vai para o hospital mesmo dizendo que está bem. Você é o técnico, não o médico: energia cortada, 911, ajude até a ambulância chegar.' });
  } else if (_personDown) {
    _safetyLead = _L({
      en: 'CALL 911 IMMEDIATELY — before anything else. If you can do it safely, get the person out into fresh air, then call 911 and tell them suspected carbon monoxide poisoning. Do NOT stop to diagnose the equipment — this is a medical emergency and life safety comes first. You are the tech here, not the medic: your job right now is to get 911 moving and get everyone into fresh air. Don\'t re-enter a space you suspect is full of CO without the fire department and proper protection.',
      es: 'LLAME AL 911 DE INMEDIATO — antes que nada. Si puede hacerlo con seguridad, saque a la persona al aire fresco, luego llame al 911 y diga que sospecha intoxicación por monóxido de carbono (CO). NO se detenga a diagnosticar el equipo — esto es una emergencia médica y la vida va primero. Usted es el técnico aquí, no el paramédico: su trabajo ahora es activar al 911 y sacar a todos al aire fresco. No vuelva a entrar a un espacio que sospecha lleno de CO sin los bomberos y protección adecuada.',
      zh: '立即拨打911 — 先于一切。能安全做到的话，把人移到新鲜空气处，然后打911并说明疑似一氧化碳（CO）中毒。不要停下来诊断设备——这是医疗急救，人命优先。你在这里是技师不是医护：你现在的任务是让911动起来、让所有人到新鲜空气处。没有消防队和适当防护，不要再进入疑似充满CO的空间。',
      vi: 'GỌI 911 NGAY LẬP TỨC — trước mọi thứ khác. Nếu làm được an toàn, đưa người đó ra không khí trong lành, rồi gọi 911 và nói nghi ngờ ngộ độc khí CO. KHÔNG dừng lại để chẩn đoán thiết bị — đây là cấp cứu y tế, mạng người đi trước. Bạn là thợ ở đây, không phải y tế: việc của bạn bây giờ là kích hoạt 911 và đưa mọi người ra không khí trong lành. Đừng vào lại không gian nghi đầy CO nếu không có lính cứu hỏa và đồ bảo hộ phù hợp.',
      fr: 'APPELEZ LE 911 IMMÉDIATEMENT — avant toute chose. Si vous pouvez le faire en sécurité, sortez la personne à l\'air frais, puis appelez le 911 et annoncez une suspicion d\'intoxication au monoxyde de carbone (CO). NE vous arrêtez PAS pour diagnostiquer l\'appareil — c\'est une urgence médicale et la vie passe d\'abord. Vous êtes le technicien ici, pas le médecin : votre travail maintenant est de lancer le 911 et de mettre tout le monde à l\'air frais. Ne rentrez pas dans un espace que vous suspectez plein de CO sans les pompiers et une protection adaptée.',
      pt: 'LIGUE PARA O 911 IMEDIATAMENTE — antes de qualquer coisa. Se der para fazer com segurança, leve a pessoa para o ar fresco, depois ligue para o 911 e informe suspeita de intoxicação por monóxido de carbono (CO). NÃO pare para diagnosticar o equipamento — isso é emergência médica e a vida vem primeiro. Você é o técnico aqui, não o médico: seu trabalho agora é acionar o 911 e levar todos para o ar fresco. Não volte a entrar num espaço que você suspeita cheio de CO sem os bombeiros e proteção adequada.' });
  }
  // (D) Inverter / variable-speed fault work = lethal stored DC.
  let _inverterWarn = '';
  if ((/(inverter|variable[- ]?speed|25vna|24vna|vrv|vrf|mini[- ]?split|modulating heat pump)/i.test(_lastUser)
       || /(velocidad variable|bomba de calor (modulante|inverter))/i.test(_lastUser)
       || /变频|多联机/.test(_lastUser)
       || /(vitesse variable|pompe [aà] chaleur inverter|climatiseur inverter)/i.test(_lastUser)
       || /(velocidade vari[aá]vel|bomba de calor inverter)/i.test(_lastUser)
       || /m[aá]y l[aạ]nh inverter|đi[eề]u h[oò]a inverter/i.test(_lastUser))
      && (/(fault|error|code|not running|won'?t (start|run)|no (heat|cool)|diagnos)/i.test(_lastUser)
       // Spanish fault words (2026-10-31) — unit names (inverter, mini-split, VRF) carry over unchanged.
       || /(\bfallas?\b|\bfallos?\b|c[oó]digo|no arranca|no enciende|no prende|no funciona|no (enfr[ií]a|calienta)|diagn[oó]stic)/i.test(_lastUser)
       // zh/vi/fr/pt fault words (2026-10-31)
       || /故障|报错|错误代码|不启动|不运行|不制冷|不制热/.test(_lastUser)
       || /(m[aã] l[oỗ]i|ma loi|b[aá]o l[oỗ]i|bao loi|kh[oô]ng ch[aạ]y|khong chay|kh[oô]ng l[eê]n|khong len)/i.test(_lastUser)
       || /(\bpannes?\b|d[eé]faut|ne d[eé]marre pas|ne s'allume pas|ne fonctionne pas)/i.test(_lastUser)
       || /(falha|n[aã]o liga|nao liga|n[aã]o funciona|nao funciona|n[aã]o d[aá] partida)/i.test(_lastUser))) {
    _inverterWarn = _L({
      en: 'SAFETY — this is an inverter-drive unit; it stores lethal DC voltage after shutoff. Wait a full 5 minutes after killing power and confirm the DC bus is under 50 VDC with a meter before opening the inverter compartment.',
      es: 'SEGURIDAD — esta es una unidad con inverter; almacena voltaje DC letal después del apagado. Espere 5 minutos completos después de cortar la corriente y confirme con el multímetro que el bus DC está por debajo de 50 VDC antes de abrir el compartimiento del inverter.',
      zh: '安全提示 — 这是变频机组；断电后仍储存致命的直流电压。断电后足足等5分钟，并用万用表确认直流母线低于50 VDC，才能打开变频器仓。',
      vi: 'AN TOÀN — đây là máy inverter; nó tích điện áp DC chết người sau khi tắt nguồn. Chờ đủ 5 phút sau khi cắt điện và xác nhận bằng đồng hồ rằng bus DC dưới 50 VDC trước khi mở khoang inverter.',
      fr: 'SÉCURITÉ — c\'est une unité inverter ; elle stocke une tension DC mortelle après la coupure. Attendez 5 minutes pleines après avoir coupé le courant et confirmez au multimètre que le bus DC est sous 50 VDC avant d\'ouvrir le compartiment inverter.',
      pt: 'SEGURANÇA — esta é uma unidade inverter; ela guarda tensão DC letal depois do desligamento. Espere 5 minutos completos após cortar a energia e confirme no multímetro que o barramento DC está abaixo de 50 VDC antes de abrir o compartimento do inverter.' });
  }
  // (D2) Capacitor work = lethal stored charge. Run/start caps hold 370-440V even
  // with power off; "bulging cap, can I leave it?" must lead with discharge protocol,
  // not generic-electronics advice. Guard, because prompt-only failed re-cert.
  let _capacitorWarn = '';
  if ((/(capacitor|\bcaps?\b|dual[- ]?run|run cap|start cap|hard start)/i.test(_lastUser)
       // "capacitor" is the same word in Spanish AND Portuguese; "condensador" (es),
       // "condensateur" (fr), 电容 (zh), tụ điện (vi) are the other common names.
       || /(condensador( el[eé]ctrico)?\b|capacitor de (marcha|arranque))/i.test(_lastUser)
       || /电容/.test(_lastUser)
       || /t[uụ] đi[eệ]n|tu dien b[iị]|t[uụ] b[iị]/i.test(_lastUser)
       || /condensateur/i.test(_lastUser))
      && (/(bulg|swollen|swell|leak|fail|bad|blown|burst|rupture|replace|chang|swap|test|check|touch|discharg|pull|remov|leave it|leave for now|leave that|still good|how do i)/i.test(_lastUser)
       // Spanish condition/intent words (2026-10-31): hinchado/inflado/abombado/cambiar/probar/descargar and kin.
       || /(hinchad|inflad|abombad|fugando|\bfall[oó](?![a-z])|fallad|da[ñn]ad|quemad|revent(ar|[oó]|ad)|cambiar|reemplazar|\bprobar(l[oa]s?)?(?![a-z])|revisar|chequear|\btocar|descargar|quitar|sacar|dejarlo|sigue (bueno|sirviendo)|c[oó]mo (lo|puedo|se))/i.test(_lastUser)
       // zh/vi/fr/pt condition/intent words (2026-10-31)
       || /鼓包|鼓了|膨胀|漏液|坏了|更换|换掉|测试|检测|放电|能不能留|怎么换/.test(_lastUser)
       || /((^|[^a-z])ph[oồ]ng|phong l[eê]n|phong len|thay t[uụ]|ki[eể]m tra|kiem tra|x[aả] đi[eệ]n|xa dien|b[iị] h[uư]|bi hu|(^|[^a-z])h[oỏ]ng(?![a-z]))/i.test(_lastUser)
       || /(\bgonfl[eé]e?s?(?![a-z])|\bbomb[eé]e?s?(?![a-z])|\benfl[eé]e?s?(?![a-z])|remplacer|tester|v[eé]rifier|d[eé]charger|enlever|laisser tel quel)/i.test(_lastUser)
       || /(estufad|inchad|estourad|\btrocar|substituir|testar|verificar|descarregar|tirar|posso deixar)/i.test(_lastUser))) {
    _capacitorWarn = _L({
      en: 'SAFETY — a run or start capacitor holds a lethal charge even with the power off. Kill the disconnect AND the breaker, then discharge the capacitor (bleed it across a ~20k ohm resistor across each terminal pair — never short the terminals with a screwdriver, which arcs and can injure) before you touch it or test it. A bulging or swollen cap has already failed and is never safe to leave running -- it can leak, rupture, or start a fire, so it comes out, it does not stay in.',
      es: 'SEGURIDAD — un capacitor de marcha o de arranque guarda una carga letal aun con la corriente apagada. Corte el desconectador Y el breaker, luego descargue el capacitor (drénelo a través de una resistencia de ~20k ohmios entre cada par de terminales — nunca haga cortocircuito entre los terminales con un destornillador: produce arco y puede lesionar) antes de tocarlo o probarlo. Un capacitor hinchado o abombado ya falló y nunca es seguro dejarlo funcionando — puede derramarse, reventar o iniciar un incendio, así que se saca, no se queda.',
      zh: '安全提示 — 运行/启动电容即使断电也存着致命电荷。隔离开关和断路器两个都断掉，然后给电容放电（用约20k欧姆的电阻跨每对端子泄放——绝不能用螺丝刀短接端子，会打弧伤人），之后才能碰它或测它。鼓包或胀起的电容已经坏了，绝不能留着继续用——它会漏液、爆裂或起火，所以必须拆下来，不能留。',
      vi: 'AN TOÀN — tụ chạy/tụ đề giữ điện tích chết người ngay cả khi đã cắt nguồn. Cắt cầu dao VÀ CB, rồi xả tụ (xả qua điện trở ~20k ohm trên từng cặp cực — tuyệt đối không chập hai cực bằng tua vít: phóng hồ quang và gây thương tích) trước khi chạm hay đo nó. Tụ phồng hay căng là đã hỏng và không bao giờ an toàn để chạy tiếp — nó có thể rỉ, nổ hoặc gây cháy, nên phải tháo ra, không để lại.',
      fr: 'SÉCURITÉ — un condensateur de marche ou de démarrage garde une charge mortelle même courant coupé. Coupez le sectionneur ET le disjoncteur, puis déchargez le condensateur (à travers une résistance d\'environ 20k ohms sur chaque paire de bornes — jamais en court-circuitant les bornes avec un tournevis : ça fait un arc et peut blesser) avant de le toucher ou de le tester. Un condensateur gonflé ou bombé a déjà lâché et n\'est jamais sûr à laisser en service — il peut fuir, éclater ou prendre feu : il sort, il ne reste pas.',
      pt: 'SEGURANÇA — um capacitor de marcha ou de partida guarda carga letal mesmo com a energia cortada. Desligue a chave seccionadora E o disjuntor, depois descarregue o capacitor (através de uma resistência de ~20k ohms em cada par de terminais — nunca em curto com uma chave de fenda: faz arco e pode ferir) antes de tocar ou testar. Capacitor estufado ou inchado já falhou e nunca é seguro deixar rodando — pode vazar, estourar ou pegar fogo: ele sai, não fica.' });
  }
  // (D5-D8) PROCEDURAL-SAFETY RISK TOPICS — the 2026-10-02 exam's single biggest finding:
  // 170 graded answers had the right diagnosis with a mandatory call-out missing. The miss
  // almost always lives in MIKE'S REPLY (he volunteers "pull the board and check the
  // thermistor" with no power-off), not in the tech's question — so the prompt side here
  // only flags the TOPIC to force the non-stream path (streamed deltas can't be retracted,
  // same reason as _capDischargeRisk), and the actual check runs on outText at the tail
  // stage below. Topic triggers are deliberately broad; the output-side checks are what
  // decide whether anything is appended.
  const _lotoRisk = /(control board|circuit board|\bpcb\b|board|panel|terminal|connector|thermistor|sensor|contactor|wiring|\bohm\b|24v|240v|low[- ]voltage|\bvoltage\b|fault code|error code|flash code|\bled\b|communication (error|fault)|comm(s)? (error|fault))/i.test(_lastUser)
    // Spanish mirror (2026-10-31). Topic flag only — it forces non-stream so the output-side
    // check is guaranteed to run; over-matching costs nothing but a non-streamed reply.
    || /(voltaje|alta tensi[oó]n|descarga el[eé]ctrica|me dio (la )?corriente|da toques|\btoques\b|tablero|\bplaca\b|cableado|conector|c[oó]digo de (falla|error|aver[ií]a)|bajo voltaje)/i.test(_lastUser)
    // zh/vi/fr/pt electrical topic words (2026-10-31). Still only a topic flag.
    || /电压|高压电|触电|被电|控制板|主板|线路板|接线|故障代码|错误代码|断路器/.test(_lastUser)
    || /(đi[eệ]n [aá]p|dien ap|b[iị] gi[aậ]t|bi giat|bo m[aạ]ch|m[aạ]ch đi[eề]u khi[eể]n|mach dieu khien|c[aầ]u dao|cau dao|m[aã] l[oỗ]i|ma loi)/i.test(_lastUser)
    || /(haute tension|sous tension|choc [eé]lectrique|carte (de commande|[eé]lectronique)|disjoncteur|c[aâ]blage|code (d'erreur|de panne))/i.test(_lastUser)
    || /(voltagem|tens[aã]o alta|choque el[eé]trico|levou choque|placa de controle|disjuntor|fia[cç][aã]o|c[oó]digo de (falha|erro))/i.test(_lastUser);
  const _brazeRisk = /(braz|solder|sweat|torch|reversing valve|filter[- ]?drier|\btxv\b|compressor (swap|replac)|lineset|suction line|liquid line)/i.test(_lastUser)
    // Spanish mirror (2026-10-31): soldar/soldadura paired with a refrigeration word
    // ("soldar" alone is generic welding), plus the standalone part/line names.
    || /(soldar|soldadura|soldando|soplete)[^.]{0,60}(refrigerante|l[ií]nea|tuber[ií]a|cobre|compresor|v[aá]lvula|serpent[ií]n)/i.test(_lastUser)
    || /(fuga de refrigerante|v[aá]lvula reversible|filtro secador|l[ií]nea de (succi[oó]n|l[ií]quido)|cambio de compresor)/i.test(_lastUser)
    // zh/vi/fr/pt brazing topics (2026-10-31): torch-word paired with a refrigeration word.
    || /(焊接|钎焊|焊枪)[^.。]{0,60}(铜管|管路|制冷剂|冷媒|压缩机|阀)|冷媒泄漏|制冷剂泄漏/.test(_lastUser)
    || /h[aà]n [oố]ng|han ong đ[oồ]ng|h[aà]n đ[uư][oờ]ng [oố]ng|x[iì] m[oô]i ch[aấ]t/i.test(_lastUser)
    || /(braser|brasure|souder|soudure|chalumeau)[^.]{0,60}(r[eé]frig[eé]rant|ligne|conduite|cuivre|compresseur|vanne)|fuite de r[eé]frig[eé]rant/i.test(_lastUser)
    || /(soldar|solda\b|ma[cç]arico)[^.]{0,60}(refrigerante|linha|tubula[cç][aã]o|cobre|compressor|v[aá]lvula)|vazamento de refrigerante/i.test(_lastUser);
  const _leakRisk = /(low (on )?(charge|refrigerant|freon)|undercharg|add (refrigerant|charge|freon|a pound|a couple)|top[- ]?(it[- ])?off|weigh in|(410a?|454b|r-?22|r-?32)\b)/i.test(_lastUser)
    // Spanish mirror (2026-10-31): low-on-charge and add/top-off wording.
    || /(bajo (de |en )?(carga|refrigerante|fre[oó]n|gas)|falta (de )?refrigerante|poca carga|agregar(le)? (refrigerante|carga|fre[oó]n|gas)|recargar|rellenar|completar la carga|pesar la carga|fuga de refrigerante)/i.test(_lastUser)
    // zh/vi/fr/pt low-charge / top-off wording (2026-10-31)
    || /缺氟|缺冷媒|加氟|加冷媒|补充制冷剂|制冷剂不足|冷媒不足/.test(_lastUser)
    || /(thi[eế]u gas|thieu gas|h[eế]t gas|het gas|n[aạ]p gas|nap gas|b[oơ]m gas l[aạ]nh|x[iì] m[oô]i ch[aấ]t)/i.test(_lastUser)
    || /(manque de (charge|r[eé]frig[eé]rant|fluide)|rajouter (du )?(r[eé]frig[eé]rant|gaz|fluide)|compl[eé]ter la charge|fuite de r[eé]frig[eé]rant)/i.test(_lastUser)
    || /(baixo de (carga|refrigerante|g[aá]s)|completar a carga|p[oô]r refrigerante|vazamento de refrigerante)/i.test(_lastUser);
  const _verifyRisk = /(furnace|boiler|water heater|burner|gas valve|igniter|ignitor|inducer|heat exchanger|flue|vent)[^.]{0,60}(replac|repair|clean|re-?light|relit|install|swap|back (on|in service)|fix)/i.test(_lastUser)
      || /(re-?light|relit|back in service|restor(e|ing) (service|gas))/i.test(_lastUser);
  const _homeownerFramed = req.body.homeowner === true ||
    /\bi'?m a homeowner\b|\bas a homeowner\b|\bhomeowner here\b|(my contractor|the repair (guy|tech|man)|a contractor|the tech)\s+(quoted|said|is quoting|gave me|quoting me)|should i (just )?replace (it|my|the|this)|is (that|this|\$?\d[\d,]*) (a )?fair (price|quote)|gave me a quote/i.test(_lastUser)
    // Spanish mirror (2026-10-31): Brandon's no-price-to-homeowners rule is language-blind.
    || /(soy (el |la )?(due[ñn][oa]|propietari[oa])|due[ñn][oa] de (la )?casa|me cotiz(aron|[oó])|me dio un (precio|presupuesto)|(es un |un )?precio justo|deber[ií]a (solo )?(reemplazarl[oa]|cambiarl[oa]))/i.test(_lastUser)
    // zh/vi/fr/pt homeowner framing (2026-10-31): the no-price rule is language-blind.
    || /我是房主|我是业主|给我报价|报价.{0,6}合理|该不该换|维修师傅报价/.test(_lastUser)
    || /(t[oô]i l[aà] ch[uủ] nh[aà]|toi la chu nha|ch[uủ] nh[aà] đ[aâ]y|b[aá]o gi[aá] cho t[oô]i|bao gia cho toi|gi[aá] (n[aà]y |đ[oó] )?c[oó] h[oợ]p l[yý]|gia co hop ly)/i.test(_lastUser)
    || /(je suis (le |la )?propri[eé]taire|propri[eé]taire de la maison|m'a fait un devis|un devis de|prix (est )?juste|prix correct)/i.test(_lastUser)
    || /(sou (o |a )?(dono|dona|propriet[aá]ri[oa])|don[oa] da casa|me deu um or[cç]amento|or[cç]amento de|pre[cç]o (est[aá] )?justo|preco justo)/i.test(_lastUser);
  // Wiring/schematic questions get a non-streamed reply so a retrieved diagram
  // image can be attached to the end of the response without splitting the sentinel.
  const _wiringDiagramIntent = /(wiring|schematic|connection|ladder)\s+diagram|electrical\s+schematic|wiring\s+schematic|(diagram|schematic)\s+(for|of|on)\b|wiring\s+(for|on|of)\b|\bthe\s+(wiring|schematic)\b|(show|pull\s+up|bring\s+up|upload|get|give|send|see|need|want|grab|find)\s+(me\s+)?(the\s+|a\s+|an\s+)?(wiring|schematic|diagram)|(diagram|schematic)\b[^.!?\n]{0,20}\b(hook.?up|wiring|terminal)/i.test(_lastUser);
  // (D3) Capacitor-DISCHARGE risk: even when the tech never types "capacitor", Mike
  // routinely self-diagnoses a failed run/start cap from "fan hums but won't spin" and
  // then emits the lethal "short the terminals with a screwdriver" method. The
  // deterministic screwdriver strip only exists on the non-stream path, so force
  // non-stream for any message where a self-diagnosed cap discharge could appear —
  // that guarantees the strip runs and the dangerous method can't reach a tech.
  const _capDischargeRisk = /(capacitor|\bcaps?\b|dual[- ]?run|run cap|start cap|hard start|discharg)|((fan|motor|blower|compressor|condenser)[^.]{0,40}(not spinning|won'?t (spin|start|turn)|just hum|hums?|humming|buzz|won'?t run))|((won'?t (spin|start)|not spinning|humming|hums?)[^.]{0,40}(fan|motor|blower|compressor|condenser))/i.test(_lastUser)
    // Spanish mirror (2026-10-31): same shapes, same 40-char windows. Topic flag only —
    // it forces non-stream so the screwdriver strip is guaranteed to run on the reply.
    || /(condensador|descarg)|((ventilador|motor|compresor|turbina|abanico)[^.]{0,40}(no gira|no arranca|no enciende|no prende|no funciona|s[oó]lo zumba|zumba|zumbando|hace un zumbido))|((no gira|no arranca|zumba|zumbando)[^.]{0,40}(ventilador|motor|compresor|turbina|abanico))/i.test(_lastUser)
    // zh/vi/fr/pt cap-discharge topics (2026-10-31): cap nouns, discharge verbs, hums-won't-spin shapes.
    || /电容|放电|((风扇|电机|风机|压缩机)[^.。]{0,40}(不转|不启动|嗡嗡|只响不转))/.test(_lastUser)
    || /(t[uụ] đi[eệ]n|tu dien|x[aả] đi[eệ]n|xa dien|((qu[aạ]t|m[oô] t[oơ]|m[aá]y n[eé]n)[^.]{0,40}(kh[oô]ng quay|khong quay|k[eê]u [uù] [uù]|keu u u)))/i.test(_lastUser)
    || /(condensateur|d[eé]charger|((ventilateur|moteur|compresseur)[^.]{0,40}(ne tourne pas|ne d[eé]marre pas|bourdonne|ronronne)))/i.test(_lastUser)
    || /(descarregar|((ventilador|motor|compressor)[^.]{0,40}(n[aã]o gira|nao gira|n[aã]o liga|nao liga|s[oó] zumbe|zumbindo)))/i.test(_lastUser);
  // (D4) COVERAGE claims. The deterministic warranty strip below — the one written after
  // 2026-08-30, when Mike read a 2023 Carrier plate and told a tech "you're solidly in
  // warranty and this is a healthy unit" on a unit that was never registered — lives ONLY
  // on the non-stream path. Streaming returns before it ever runs, and streaming is the
  // DEFAULT. So the single guard that exists to stop a tech quoting warranty labour on an
  // uncovered unit was bypassed by every plainly-worded warranty question. Force
  // non-stream whenever coverage could come up, exactly as _capDischargeRisk does for the
  // screwdriver strip. Deltas already sent cannot be retracted, so forcing non-stream is
  // the only way to guarantee the strip runs.
  const _coverageIntent = /\b(warrant(y|ies|ied)|covered|coverage|registered|registration)\b|still\s+under\s+\w+|parts?\s+(and\s+labou?r\s+)?cover/i.test(_lastUser);
  // Outcome reports force non-stream too: the [JOB_OUTCOME] marker Mike appends must be
  // stripped server-side before the tech sees it, and streamed deltas can't be retracted.
  // Same mechanism, same reason as the warranty and screwdriver strips above.
  const _outcomeReport = /\b(fixed it|got (it|her|them) (running|going|back)|up and running|runnin(g)? (now|again)|sold (it|the|them|him|her)|closed (it|the|that)|went with (the )?(repair|replace)|replaced the|swapped (it|the|that)|came back (out|today|yesterday)?|didn'?t (work|hold|fix)|still (down|broken|not))\b|\$\s?\d{2,}/i.test(_lastUser);
  const _forceNonStream = !!_safetyLead || !!_inverterWarn || !!_capacitorWarn || _lotoRisk || _brazeRisk || _leakRisk || _verifyRisk || _homeownerFramed || _wiringDiagramIntent || _capDischargeRisk || _coverageIntent || _outcomeReport || !!(_loopState && _loopState.openLoop);

  globalActive++;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 75000);

  try {
    // Manual-grounded retrieval: pull real OEM service-manual excerpts and prepend
    // them to Mike's system prompt so code/spec/wiring answers come from the page,
    // cited. No-ops (empty string) until RAG is enabled + ingested.
    let _ragContext = '';
    let _ragDiagrams = [];
    if (_RAG_ENABLED && _needsManualRetrieval(_lastUser)) {
      const _t0 = Date.now();
      const _mc = await retrieveManualContext(_lastUser);
      const _ragMs = Date.now() - _t0;
      // There was NO timing instrumentation on this path, so "how much slower does verifying
      // make Mike" was unanswerable — and that is the one question that decides whether this
      // is usable by a tech standing in an attic. Measure it.
      try { if (_askUid) logUsage(_askUid, 'rag_timing', { ms: _ragMs, hit: !!(_mc && _mc.text) }); } catch {}
      // A miss is the most valuable signal Mike produces: a real tech, on a real job,
      // asked about a unit he has no verified manual for. Logged with the brand and
      // model so the nightly learner can go find exactly that document tonight.
      // Only the identifiers are stored — never the tech's question text.
      try {
        if (_askUid && !(_mc && _mc.text)) {
          const _mBrand = _extractBrand(_lastUser), _mModel = _extractModelFamily(_lastUser);
          if (_mBrand && _mModel) logUsage(_askUid, 'rag_miss', { brand: _mBrand, model: _mModel });
        }
      } catch {}
      if (_mc && _mc.text) {
        _ragContext = '\n\n=== MANUFACTURER SERVICE MANUAL EXCERPTS (authoritative) ===\n'
          + 'Answer fault-code, wiring, and spec questions ONLY from these excerpts and cite the [Source: ...] tag in your reply. '
          + 'CITATION RULE (non-negotiable): EVERY specific number, spec value, resistance range, pressure, fault-code meaning, or threshold you '
          + 'take from an excerpt carries its [Source: ...] tag inline, in the same sentence — a spec sentence with no tag reads as a guess and '
          + 'breaks the tech\'s trust. Also NAME the product family the manual covers when you cite it; if it is not exactly the tech\'s unit, say so. '
          + 'WRONG-FAMILY RULE: if an excerpt\'s [Source:] tag says WRONG PRODUCT FAMILY, you may NOT state its numbers, terminal IDs, resistances or '
          + 'fault-code meanings as values for this tech\'s unit, with or without the citation. Say the exact manual is not in the library, give the '
          + 'generic safe procedure, and ask for the nameplate/model number instead. '
          + 'If the answer is not in these excerpts, say so plainly and use web search.\n\n'
          + _mc.text + '\n=== END MANUAL EXCERPTS ===\n';
        // When the manual and Mike's instinct disagree, the manual wins — but say so out
        // loud. Silently overriding reads as a personality change; naming the surprise reads
        // as a tech who checked.
        _ragContext += 'If an excerpt contradicts what you would have said from memory, TRUST THE EXCERPT and name the surprise plainly ("unusual for this brand, but this unit\'s manual says X"). Never override a manual silently.\n';
        if (Array.isArray(_mc.diagrams)) _ragDiagrams = _mc.diagrams;
        // When an actual wiring-diagram image is being shown to the tech, tell Mike so
        // his prose matches the screen — present it, don't deny having it. He cites the
        // source by name (the image may be the closest match, not the exact model).
        if (_ragDiagrams.length && _wiringDiagramIntent) {
          const _d0 = _ragDiagrams[0];
          _ragContext += '\nNOTE: A real wiring-diagram image from "' + (_d0.title || 'the service manual')
            + (_d0.page ? ', p.' + _d0.page : '') + '" is displayed to the technician directly below your reply. '
            + 'Reference it naturally and walk them through the relevant terminals/connections, and name the source. '
            + 'Do NOT say you lack a wiring diagram — it is on their screen. If it is a closely related model rather than the exact one, say so briefly but still use it.\n';
        }
      } else {
        // WE LOOKED AND FOUND NOTHING — SAY SO. Until now a miss fell silently through to
        // raw model memory, and the tech could not tell a manual-backed answer from a guess.
        // Six brands the code claims to support have ZERO chunks ingested (payne, luxaire,
        // armstrong, arcoaire, keeprite, burnham), so this path is not theoretical: name one
        // of those and retrieval runs, finds nothing, and Mike used to answer as if he'd checked.
        // AGENT_SYSTEM already carries the honesty rule ("I do not know, look it up beats a
        // guess every single time") — it just never had a signal to fire on. This is the signal.
        _ragContext = '\n\n=== NO VERIFIED SOURCE FOR THIS ONE ===\n'
          + 'This looked like a spec/manual question, the service-manual library was searched, and nothing matched. '
          + 'You are answering from training knowledge alone, NOT from a manual. Say so in your own words — one short clause, '
          + 'not a disclaimer paragraph ("no manual on that exact unit, but from experience..."). '
          + 'Give your best field answer anyway; never refuse to help. If the number genuinely matters, tell them where to confirm it '
          + '(nameplate, the unit\'s own manual, the manufacturer). Never imply you checked a manual when you did not.\n'
          + '=== END ===\n';
      }
    }
    // ── PROMPT CACHING ─────────────────────────────────────────────────────────
    // Mike's large static rulebook (AGENT_SYSTEM) is identical on every call and across
    // every tech, so cache it (1-hour TTL) instead of re-billing ~16k tokens per message.
    // The per-message context (RAG + dynamic, sent separately as systemExtra) stays uncached.
    // For the common no-RAG case the concatenated text equals the old `_ragContext + system`,
    // so the prompt the model sees is byte-identical and Mike's answers are unchanged.
    const _baseSys = (system || '');
    // MIKE MEMORY: what he already knows about THIS tech, injected into the per-message tail
    // (never the cached base). One memory serves web chat AND the native voice call (both here).
    let _memContext = '';
    try { if (_askUid) _memContext = buildMemoryContext(await getUserMemory(_askUid)); } catch {}
    // HARD FACT-GUARDS (2026-10-05, run-2 exam): three recurring confident-wrong patterns
    // that survive the citation rules because no excerpt is involved. Small and uncached.
    const _factGuards = '\n\nHARD RULES: (1) Never state a flat gram threshold (e.g. "100 g per circuit") for A2L leak-detection or charge-limit requirements — those limits depend on the standard (UL 60335-2-40 / ASHRAE 15.2) and the room size; if you do not have the exact table in front of you, say so and point to the unit\'s install manual. (2) Never recommend a hard-start kit while liquid refrigerant in the compressor is suspected (slugging, flood-back, flooded start, liquid at the compressor) — the liquid problem gets corrected first, full stop. (3) Never judge a head pressure "healthy/normal/fine" from the psig number alone — convert it to saturated condensing temperature, compare to ambient plus a typical approach, and show that math. (4) Never assert what a MODEL NUMBER implies — single- vs two-stage, capacity/tonnage, fuel type, efficiency, series facts — from memory alone. A model line recalled wrong sends the tech chasing hardware that does not exist and tells a customer the wrong unit was installed. With a model number in play, verify against the unit\'s own data plate, wiring diagram, or board labels in the photos, or a web search of the OEM spec sheet, BEFORE asserting; with none available, say exactly what you need to confirm ("send me the board" / "let me pull the spec sheet") instead of asserting. If what the tech reports seeing — a terminal, a switch, a label — contradicts your recollection of the model line, the hardware in front of them wins: ask to see it, never argue from memory.';
    // OUTCOME SPINE injection: the clock, the open loop, and the closing-the-loop habits.
    // Signed-in techs only (_askUid) — a taste visitor has no spine to close.
    let _timeCtx = '', _loopCtx = '', _outcomeSys = '';
    if (_askUid) {
      try {
        _timeCtx = buildTimeContext(_loopState.lastAskAt);
        _loopCtx = buildLoopContext(_loopState.openLoop);
        _outcomeSys = OUTCOME_SYS + FEEDBACK_SYS;
        // Nov-1 price heads-up: once per tech, only while the env flag is up.
        if (process.env.PRICE50_ANNOUNCE === '1' && !_loopState.priceTold) {
          _outcomeSys += PRICE50_SYS;
          logUsage(_askUid, 'price_mention', { price: 50, starts: '2026-11-01' });
        }
        // Record the probe so a loop is only ever raised twice, across sessions.
        if (_loopState.openLoop) logUsage(_askUid, 'loop_probe', { ref: _loopState.openLoop.id });
      } catch {}
    }
    // The deterministic safety lead is PREPENDED to the final reply after the call
    // (search: `outText = _safetyLead +`), so the model never sees it and rewrites the
    // same evacuation/shutdown steps — the tech reads the whole protocol twice. Tell the
    // model what will already be standing at the top of its reply.
    const _leadNote = _safetyLead
      ? '\n\nA DETERMINISTIC SAFETY LEAD WILL OPEN YOUR REPLY — prepended in code, the tech reads it before your first word: "' + _safetyLead + '" Do NOT restate or re-explain any of those steps. Add ONLY what is new: his actual situation, and what happens after the all-clear if it matters.'
      : '';
    // Server-side brevity pin (Brandon, 2026-10-29): the persona already carries the
    // three-lines doctrine, but (a) Claude 5 models drift longer unless the length rule
    // is restated NEAR THE END of the prompt, and (b) the free taste tier never carried
    // the rule at all. Pinning it here puts it on every path, every tier, every model in
    // the chain. LAST in _tailSys on purpose — late placement is what makes it stick.
    const _styleGuard = '\n\nREPLY LENGTH — every conversational answer, no exceptions: '
      + 'first line IS the answer. Then one line of why, then the next move if there is one. '
      + 'THREE short lines is the default ceiling — no headers, no intro, no recap of his '
      + 'question, no summary section, no sign-off. If one line answers it, send one line. '
      + 'Go longer ONLY when the tech explicitly asks for a walkthrough or every step, or '
      + 'when a safety call-out needs each immediate action — one short line per step, then '
      + 'stop. If the task instructions above require a structured format (JSON, a form, a '
      + 'report with sections), follow that format exactly — this rule governs conversational '
      + 'replies only.';
    const _tailSys = _memContext + _timeCtx + _loopCtx + _outcomeSys + _ragContext + (systemExtra || '') + _factGuards + _leadNote + _styleGuard;
    let _systemField;
    if (_baseSys.length > 8000) {
      const _baseBlock = { type: 'text', text: _baseSys, cache_control: { type: 'ephemeral', ttl: '1h' } };
      _systemField = _tailSys ? [_baseBlock, { type: 'text', text: _tailSys }] : [_baseBlock];
    } else {
      // _tailSys carries memory, time-grounding, outcome capture, RAG and the fact-guards.
      // It was silently DROPPED on this branch (short/no persona), so those protections
      // only existed for full-persona calls. Append it here too; _ragContext already
      // lives inside _tailSys, so it is not prepended twice.
      _systemField = _baseSys + _tailSys;
    }
    const body = {
      model: PRIMARY_MODEL, // overridden per-hop by callModelWithFailover; kept for log clarity
      // FLOOR of 4096, not just a cap: Claude 5 models think-before-answering by
      // default, and thinking tokens count against max_tokens. The client's old
      // 700–2048 asks would truncate a hard diagnostic mid-answer. Answer LENGTH is
      // still governed by the persona (brevity rules) — this only buys reasoning room.
      // Taste tier (free, unauthenticated) gets a tighter 2048 ceiling so free
      // visitors can't widen Mike's spend — paying techs get the full room.
      max_tokens: _isTaste ? 2048 : Math.min(Math.max(max_tokens, 4096), 8192),
      system: _systemField,
      messages,
      // Effort 'medium' on the 5 family ≈ prior-generation 'high' quality at fewer
      // tokens and lower latency — a tech in an attic gets a faster, tighter answer.
      // Taste tier runs 'low': still a good answer, minimal thinking spend on free use.
      output_config: { effort: _isTaste ? 'low' : 'medium' },
    };
    if (use_search) {
      // _20260209 = dynamic filtering: the model pre-filters search results before
      // they hit context — better answers, fewer wasted tokens. Supported by every
      // model in the default chain.
      body.tools = [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }];
    }

    // ── STREAMING TRANSPORT (additive) ────────────────────────────────────────
    // When the client requests stream:true, proxy Anthropic's SSE so Mike's words
    // appear progressively instead of after a single ~24s wait. This changes ONLY
    // the transport — checkPaywall, auth, the system param, and AGENT_SYSTEM are
    // untouched (same `body` as the non-stream path, just body.stream=true). The
    // client falls back to the non-stream JSON path on any error, so this never
    // becomes a hard dependency. We forward only text deltas + a terminal done/error
    // event; tool-use / web_search blocks simply produce no text deltas (the client
    // already gates use_search off for streamed chat).
    if (stream && !_forceNonStream) {
      body.stream = true;
      // Failover happens BEFORE the first byte reaches the client. Once SSE headers
      // are written we're committed to this model — a mid-stream switch would replay
      // half an answer. The client already falls back to the non-stream path on a
      // stream error, and that path walks the chain again.
      const _fo = await callModelWithFailover(body, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        signal: controller.signal,
      }, { stream: true });
      const upstream = _fo.res;

      if (!upstream || !upstream.ok || !upstream.body) {
        const _st = upstream ? upstream.status : 502;
        let msg = `API error ${_st}`;
        try { const ed = await upstream.json(); msg = ed?.error?.message || msg; } catch (_) {}
        console.error('Anthropic stream error:', _st, msg, `(last model: ${_fo.model})`);
        return res.status(_st === 429 ? 429 : 502).json({ error: msg });
      }

      // Client SSE headers.
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      if (typeof res.flushHeaders === 'function') res.flushHeaders();

      const decoder = new TextDecoder();
      let buf = '';
      let sentAny = false;
      const send = (obj) => { try { res.write(`data: ${JSON.stringify(obj)}\n\n`); } catch (_) {} };
      let _streamed = '';
      let _refused = false; // a canned refusal line is shown to the tech but never logged as an answer or remembered
      // Filled from the stream's own usage events — see message_start / message_delta below.
      const _cost = { model: null, in_tokens: null, out_tokens: null, cache_read: null, cache_write: null };

      try {
        for await (const chunk of upstream.body) {
          buf += decoder.decode(chunk, { stream: true });
          // Anthropic SSE frames are separated by a blank line. Each frame has an
          // `event:` line and a `data:` line. We only care about the data payloads.
          let idx;
          while ((idx = buf.indexOf('\n\n')) !== -1) {
            const frame = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            const dataLine = frame.split('\n').find(l => l.startsWith('data:'));
            if (!dataLine) continue;
            const payload = dataLine.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            let evt;
            try { evt = JSON.parse(payload); } catch (_) { continue; }
            // TOKEN COUNTS ARRIVE IN THE STREAM TOO, in two places: message_start carries
            // the input side (and what the cache saved), message_delta the output side.
            // Most answers stream, so without this the cost picture would have been built
            // from the small minority that don't — and those are the safety-guarded ones,
            // which are not representative of what a normal day costs.
            if (evt.type === 'message_start' && evt.message && evt.message.usage) {
              const _mu = evt.message.usage;
              _cost.model = evt.message.model || _cost.model;
              _cost.in_tokens = _mu.input_tokens;
              _cost.cache_read = _mu.cache_read_input_tokens;
              _cost.cache_write = _mu.cache_creation_input_tokens;
            } else if (evt.type === 'message_delta' && evt.usage) {
              _cost.out_tokens = evt.usage.output_tokens;
            }
            // Claude 5 classifiers can refuse MID-STREAM (HTTP 200, stop_reason
            // "refusal" on message_delta, zero text deltas). Without this the tech
            // gets a silent empty bubble. Safety-flagged prompts never reach this
            // path (_forceNonStream), so no _safetyLead handling is needed here —
            // but send a real sentence so the reply is never blank.
            if (evt.type === 'message_delta' && evt.delta && evt.delta.stop_reason === 'refusal' && !sentAny) {
              console.warn('[refusal:stream]', _fo.model);
              _refused = true;
              if (_askUid) { try { logUsage(_askUid, 'mike_refusal', { model: _fo.model, streamed: true }); } catch {} }
              const _rline = "That one's outside what I can help with. Give me the unit and the symptom and let's get back to the job.";
              // The tech still SEES the line (send below) — but _refused gates it out of
              // the mike_answer corpus and the tech's durable memory: a canned decline is
              // not an answer Mike gave, and must never be remembered as one.
              sentAny = true; _streamed += _rline; send({ delta: _rline });
            }
            if (evt.type === 'content_block_delta' && evt.delta) {
              const piece = evt.delta.text || '';
              // Accumulate a copy for the audit trail. Most answers STREAM, so logging only
              // the non-streaming branch would have captured a small unrepresentative slice —
              // and the ones that skip streaming are exactly the safety-guarded ones, which
              // would have biased the audit toward Mike's most careful replies.
              if (piece) { sentAny = true; _streamed += piece; send({ delta: piece }); }
            } else if (evt.type === 'message_stop') {
              send(_renewTok ? { done: true, renewed_token: _renewTok } : { done: true });
            } else if (evt.type === 'error') {
              send({ error: (evt.error && evt.error.message) || 'stream error' });
            }
          }
        }
        if (!sentAny) send({ delta: '' });
        send(_renewTok ? { done: true, renewed_token: _renewTok } : { done: true });
        res.end();
        try {
          if (_askUid && _streamed && !_refused) logUsage(_askUid, 'mike_answer',
            Object.assign({ a: _streamed.slice(0, 8000), streamed: true }, _cost));
          // Belt for the stream path: outcome reports force non-stream upstream, but if a
          // marker ever slips into a streamed reply, still capture the data it carried.
          if (_askUid && _streamed && !_refused) { try { const _m2 = _streamed.match(/\[JOB_OUTCOME\]\s*(\{[^\n]*\})\s*$/m); if (_m2) logOutcome(_askUid, JSON.parse(_m2[1]), null); } catch {} }
          if (_askUid && _streamed && !_refused) { try { updateUserMemory(_askUid, _lastUser, _streamed); } catch {} }
        } catch { /* never let logging affect a delivered answer */ }
      } catch (streamErr) {
        if (streamErr.name === 'AbortError') send({ error: 'Request timed out — please try again.' });
        else { console.error('AI stream pipe error:', streamErr.message); send({ error: 'Connection error — please try again.' }); }
        try { res.end(); } catch (_) {}
      }
      return;
    }
    // ── NON-STREAM (default fallback path, unchanged) ─────────────────────────

    const _foNS = await callModelWithFailover(body, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
    }, { stream: false });
    const response = _foNS.res;

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || `API error ${response.status}`;
      console.error('Anthropic error:', response.status, msg, `(last model: ${_foNS.model})`);
      return res.status(response.status === 429 ? 429 : 502).json({ error: msg });
    }

    // Claude 5 safety classifiers can decline a request as a SUCCESSFUL response
    // (HTTP 200, stop_reason "refusal", content empty or partial). Near-impossible
    // for HVAC questions, but without this guard a refusal would surface to the tech
    // as the bare string "No response." — handle it as what it is.
    // CRITICAL: the deterministic _safetyLead must STILL open the reply — safety-flagged
    // prompts are forced onto exactly this non-stream path, and the guard's invariant is
    // that the lead is guaranteed, never model-dependent. A refusal skips the model's
    // words, not ours.
    if (data.stop_reason === 'refusal') {
      console.warn('[refusal]', _foNS.model, data?.stop_details?.category || 'uncategorized');
      if (_askUid) { try { logUsage(_askUid, 'mike_refusal', { model: _foNS.model }); } catch {} }
      return res.json({ response: (_safetyLead ? _safetyLead + '\n\n' : '')
        + "That one's outside what I can help with. Give me the unit and the symptom and let's get back to the job." });
    }

    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    // ── Apply the deterministic guard layer to the reply ──────────────────────
    let outText = text || 'No response.';
    // [JOB_OUTCOME] marker: Mike's machine-read outcome line. Strip it BEFORE the guards
    // and before any tech ever sees it; log it to the events spine (the pilot dataset).
    try {
      const _om = outText.match(/\[JOB_OUTCOME\]\s*(\{[^\n]*\})\s*$/m);
      if (_om) {
        outText = outText.replace(_om[0], '').replace(/\n{3,}/g, '\n\n').trimEnd();
        if (_askUid) logOutcome(_askUid, JSON.parse(_om[1]), _loopState && _loopState.openLoop ? _loopState.openLoop.id : null);
      }
    } catch { outText = outText.replace(/\[JOB_OUTCOME\][^\n]*/g, '').trimEnd(); }
    try {
      const _fm = outText.match(/\[TECH_FEEDBACK\]\s*(\{[^\n]*\})\s*$/m);
      if (_fm) {
        outText = outText.replace(_fm[0], '').replace(/\n{3,}/g, '\n\n').trimEnd();
        if (_askUid) { const _fb = JSON.parse(_fm[1]); logUsage(_askUid, 'tech_feedback', { gist: String(_fb.gist || '').slice(0, 140) }); }
      }
    } catch { outText = outText.replace(/\[TECH_FEEDBACK\][^\n]*/g, '').trimEnd(); }
    try {
      if (_homeownerFramed) {
        // Strip any dollar amount the model leaked.
        outText = outText.replace(
          /\$\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:[-–—]|to)\s?\$?\s?\d[\d,]*(?:\.\d+)?)?\+?(?:\s?\/\s?\w+)?/g,
          '(a price your tech will give you)'
        );
        // Neutralize replace-or-repair recommendations to a homeowner.
        // 2026-09-14 — these used to SPLICE the safe phrase into the MIDDLE of the model's
        // sentence, and on prod that produced actual broken English to a customer:
        //   "You can't confidently the repair-or-replace call belongs to the tech on the job"
        // (spliced over "…can't confidently go with a replacement"). Drop the whole
        // sentence instead, and say the one true thing once at the end. A homeowner
        // reading a mangled sentence trusts the product less than one reading a redirect.
        const _replaceAdvice = [
          /\b(replacement|replacing(?: it)?|a new system|a new unit|the new system|going new)\b[^.!?\n]{0,45}?\b(is (?:probably |likely )?(?:the )?(?:smarter|smart|better|right|wiser)|makes (?:more )?sense|the (?:better|smarter|right) (?:move|call|bet|play))/i,
          /\b(?:i'?d|i would|lean toward|i'?d lean toward|go with|my (?:honest )?take[: -]*)[^.!?\n]{0,20}?\b(replac\w*|the new (?:system|unit)|a new (?:system|unit))/i,
          /\b(?:the )?math (?:often |usually |here )?(?:favors?|points? to|leans? toward|supports?)[^.!?\n]{0,22}?\b(replac\w*|new (?:system|unit)|going new)/i,
          // Spanish mirrors (2026-10-31): replace-leaning money judgments in Spanish prose.
          /\b(?:reemplazar(?:lo|la)?|un (?:sistema|equipo) nuevo|cambiarl[oa] por uno nuevo)\b[^.!?\n]{0,45}?\b(?:sale m[aá]s barato|conviene|es (?:probablemente )?(?:mejor|m[aá]s inteligente)|tiene m[aá]s sentido|vale (?:m[aá]s )?la pena)\b/i,
          /\b(?:sale m[aá]s barato|conviene m[aá]s|tiene m[aá]s sentido|vale la pena)\b[^.!?\n]{0,30}?\breemplazar/i,
        ];
        var _replDropped = false;
        outText = outText.split('\n').map((line) => {
          if (!_replaceAdvice.some((re) => re.test(line))) return line;
          const kept = line.split(/(?<=[.!?])\s+|(?<=[。！？])/).filter((s) => {
            if (_replaceAdvice.some((re) => re.test(s))) { _replDropped = true; return false; }
            return true;
          });
          const rebuilt = kept.join(' ').trim();
          return /^(?:[-*+]|\d+[.)]|#{1,6})\s*$/.test(rebuilt) ? '' : rebuilt;
        }).join('\n');
        // Never GRADE another contractor's price to a homeowner (fair/high/premium/scam)
        // — that undercuts the paying tech as much as quoting a number does. These target
        // unambiguous price-judgment phrases only; anchored to price words so technical
        // language ("high-side pressure", "low on refrigerant") is left untouched.
        outText = outText.replace(/\b(?:premium|fair|reasonable|steep|pricey|expensive|cheap|outrageous|excessive|unreasonable|high|low)\s+(?:pricing|price|quote|cost)\b/gi, 'a pricing question for your tech');
        outText = outText.replace(/\b(?:that|this|the|their|its)?\s*(?:price|quote|cost|number)\s+(?:is|seems|sounds|looks|feels|runs)\s+(?:a (?:bit|little) )?(?:on the )?(?:high|low|steep|fair|reasonable|pricey)(?:[- ]?(?:side|end))?\b(?:[—,-]+\s*(?:often|significantly|but not)[^.!?\n]{0,24})?/gi, 'that’s a pricing question for your tech');
        outText = outText.replace(/\b(?:isn'?t|is not|not|nothing)\s+(?:automatically |necessarily |exactly |really )?(?:an? )?(?:scam|rip[- ]?off|gouging|highway robbery|a steal|a rip)/gi, 'something your tech can walk you through');
        outText = outText.replace(/\b(?:over|under)[- ]?priced\b/gi, 'a pricing question for your tech');
        // The bare "(that's) on the high(er)/low(er) side/end" idiom about a price ONLY when
        // a price/quote/cost word is in the same clause — so legit non-price uses ("your
        // humidity is on the high side") and refrigeration ("high-side pressure") are safe.
        outText = outText.replace(/\b(?:price|quote|cost|number|charge|bill)\b[^.!?\n]{0,40}?\b(?:is|runs|seems|that'?s|it'?s)\s+(?:a (?:bit|little) )?(?:on the )?(?:high|low)(?:er)?[- ]?(?:side|end)\b/gi, 'is a pricing question for your tech');
        outText = outText.replace(/\bR-?22\b[^.!?\n]{0,18}?\breplac\w*/gi, 'an R-22 system is a repair-or-replace conversation for your tech');
        outText = outText.replace(/\b(?:a |the )?new (?:system|unit)\b[^.!?\n]{0,30}?\b(?:wins|pays for itself|cheaper|cost[- ]per[- ]year|saves you money|comes out ahead)/gi, 'whether a new system is worth it is your tech’s call');
        // Spanish mirrors (2026-10-31): never grade a price to a homeowner, in any language.
        outText = outText.replace(/\b(?:precio|cotizaci[oó]n|presupuesto|costo)\b[^.!?\n]{0,40}?\b(?:es|parece|suena|est[aá])\s+(?:un poco |muy |bastante |demasiado )?(?:alto|bajo|justo|razonable|elevado|excesivo|caro|barato)\b/gi, 'eso es una pregunta de precio para su técnico');
        outText = outText.replace(/\b(?:precio|cotizaci[oó]n|costo|presupuesto)\s+(?:justo|razonable|alto|bajo|elevado|excesivo|caro|barato)\b/gi, 'una pregunta de precio para su técnico');
        // Brandon's rule (2026-06-28): to a homeowner, Mike says NOTHING about price or
        // cost — not a number, not a range, not "it depends", not whether it's worth it.
        // Drop any SENTENCE that talks price/cost and redirect to the tech, preserving line
        // and list breaks. Deliberately EXCLUDES bare "charge/charged" (refrigerant + cap
        // charge are HVAC terms), "bill" (energy bill is a legit efficiency topic), and bare
        // "estimate" (Mike estimates age/airflow) so technical and safety content survives.
        // 2026-09-14 — "\bcheap\b" never matched "cheaper", so prod opened a homeowner
        // answer with "Capacitor replacement is one of the cheaper AC repairs" — a price
        // claim with no number in it, which is still a price claim under Brandon's rule
        // (nothing about price to a homeowner: not a number, not a range, not whether
        // it's worth it). Comparatives and worth-it judgments are covered now.
        var _priceWord = /\b(prices?|priced|pricing|costs?|costly|costlier|costing|quotes?|quoted|quoting|expensive|inexpensive|cheap(?:er|est)?|pricey|pricier|affordable|affordability|how much (?:does|will|is|it|to|for|a|the|they|i|you)|ballpark|labou?r rate|service (?:call )?fee|trip charge|diagnostic (?:fee|visit|call)|invoice|worth (?:it|the money|paying|spending))\b|\$\s?\d|\b(?:hourly|flat|flat[- ]rate|labou?r|service|diagnostic)\s+(?:rates?|fees?)\b|\bcharges?\s+(?:a|an|you|around|about|roughly|between|from|per|anywhere)\b|\b(?:precios?|costos?|costoso|cuestan?|costar(?:[aá]|ía)?|cotizaci[oó]n(?:es)?|cotizar(?:on)?|presupuestos?|caros?|barat[oa]s?|vale la pena|cu[aá]nto (?:cuesta|vale|cobra|sale)|mano de obra|tarifas?)\b|\b(?:prix|co[uû]ts?|co[uû]tent?|co[uû]tera|devis|chers?|ch[eè]res?|tarifs?|main[- ]d'[oœ]euvre|combien [cç]a co[uû]te|vaut le coup)\b|\b(?:pre[cç]os?|custos?|custam?|custar[aá]?|or[cç]amentos?|vale a pena|quanto custa|m[aã]o de obra)\b|价格|多少钱|报价|费用|人工费|太贵|便宜|值不值|划算|giá cả|bao nhi[eê]u ti[eề]n|bao nhieu tien|t[oố]n bao nhi[eê]u|(^|[^a-z])chi ph[ií]|(^|[^a-z])c[oô]ng th[oợ]|đ[aắ]t qu[aá]|qu[aá] đ[aắ]t/i;
        var _hoLines = outText.split('\n'), _hoDropped = false;
        for (var _hoL = 0; _hoL < _hoLines.length; _hoL++) {
          var _hoSents = _hoLines[_hoL].split(/(?<=[.!?])\s+|(?<=[。！？])/), _hoKept = [];
          for (var _hoI = 0; _hoI < _hoSents.length; _hoI++) {
            if (_priceWord.test(_hoSents[_hoI])) { _hoDropped = true; continue; }
            _hoKept.push(_hoSents[_hoI]);
          }
          _hoLines[_hoL] = _hoKept.join(' ');
        }
        outText = _hoLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        if (_hoDropped) outText += (outText ? '\n\n' : '') + _L({
          en: 'Numbers on price? That’s your tech’s call to make — I’m here to make sure you know exactly what’s wrong and what to ask him.',
          es: 'Sobre números y precios: esa es una decisión de su técnico — yo estoy aquí para que usted sepa exactamente qué está mal y qué preguntarle.',
          zh: '价格数字？那是你的技师该拍板的事——我在这里是让你确切知道哪里坏了、该问他什么。',
          vi: 'Con số giá cả? Đó là quyết định của thợ của bạn — tôi ở đây để bạn biết chính xác hỏng gì và cần hỏi anh ấy điều gì.',
          fr: 'Les chiffres et les prix ? C\'est à votre technicien de trancher — je suis là pour que vous sachiez exactement ce qui ne va pas et quoi lui demander.',
          pt: 'Números de preço? Essa decisão é do seu técnico — estou aqui para você saber exatamente o que está errado e o que perguntar a ele.' });
        else if (_replDropped) outText += (outText ? '\n\n' : '') + _L({
          en: 'Repair or replace? That call belongs to the licensed tech with eyes on the system — I’m here to make sure you know what’s wrong and what to ask him.',
          es: '¿Reparar o reemplazar? Esa decisión es del técnico con licencia que tiene el sistema enfrente — yo estoy aquí para que usted sepa qué está mal y qué preguntarle.',
          zh: '修还是换？这由亲眼看着系统的持证技师来定——我在这里是让你知道哪里坏了、该问什么。',
          vi: 'Sửa hay thay? Quyết định đó thuộc về người thợ có chứng chỉ đang đứng trước hệ thống — tôi ở đây để bạn biết hỏng gì và cần hỏi gì.',
          fr: 'Réparer ou remplacer ? Cette décision revient au technicien agréé qui a le système sous les yeux — je suis là pour que vous sachiez ce qui ne va pas et quoi demander.',
          pt: 'Consertar ou trocar? Essa decisão é do técnico licenciado com os olhos no sistema — estou aqui para você saber o que está errado e o que perguntar.' });
      }
      // SAFETY STRIP (deterministic, UNCONDITIONAL): the model keeps generating the "short the
      // terminals with a screwdriver" discharge method despite the prompt forbidding it. A prompt
      // can't be trusted for a trained-in dangerous default. This must run on EVERY response — not
      // just when the tech typed "capacitor" — because Mike self-diagnoses a failed cap from
      // symptoms ("fan hums but won't spin") and emits the screwdriver method with no cap keyword in
      // the user's message (QA scenarios A1/B4, 2026-07-08). Sentence-level, so only the dangerous
      // sentence is removed; the resistor method and the rest of the answer survive.
      // COVERAGE STRIP (deterministic, UNCONDITIONAL). A serial decodes to a BUILD DATE.
      // It says nothing about whether the homeowner ever registered the unit, and
      // registration is the difference between a 5-year and a 10-year parts term. On
      // 2026-08-30 Mike read a Carrier plate — 2023, three years old — and told a
      // technician "you're solidly in warranty and this is a healthy unit" before any
      // registry had been touched. That is the single most expensive sentence this
      // product can produce: a tech quotes free work, the claim is denied, and he eats
      // the part. It is also the exact failure the warranty lookup exists to prevent.
      //
      // Prompting cannot be trusted here — same lesson as the screwdriver method. Age
      // implying coverage is a trained-in default, so strip it at the sentence level.
      //
      // SCOPED OFF the published-terms follow-up: after a registry lookup returns no
      // record, Mike is deliberately asked for the manufacturer's PUBLISHED base and
      // registered terms and whether the build date falls inside them. That answer is
      // labelled as published terms, not as this unit's coverage, and must survive.
      const _publishedTermsTurn = /published (?:base )?terms|the registry had no record|ANSWER FORMAT/i.test(String(system || ''));
      if (!_publishedTermsTurn) {
        const _claimsCovered =
          /\b(?:still\s+)?(?:solidly\s+|comfortably\s+|well\s+)?(?:in|under|within)\s+(?:the\s+)?warranty\b/i;
        const _claimsCovered2 =
          /\b(?:should\s+(?:still\s+)?be|is|are|it'?s|you'?re|that'?s)\s+(?:still\s+)?(?:fully\s+|likely\s+|probably\s+)?covered\b/i;
        const _lines = outText.split('\n');
        let _stripped = false;
        for (let _li = 0; _li < _lines.length; _li++) {
          const _sents = _lines[_li].split(/(?<=[.!?])\s+|(?<=[。！？])/);
          const _keep = [];
          for (const _sent of _sents) {
            if (_claimsCovered.test(_sent) || _claimsCovered2.test(_sent)) { _stripped = true; continue; }
            _keep.push(_sent);
          }
          _lines[_li] = _keep.join(' ');
        }
        if (_stripped) {
          outText = _lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
          // This note is written for a TECH ("before you quote anything"). Prod 2026-09-14
          // appended it verbatim to a HOMEOWNER, who quotes nobody — tech-facing language
          // to a customer reads as software talking to the wrong person. Same fact, their
          // words, and it still points them at their tech rather than at a number.
          outText += (outText ? '\n\n' : '') + (_homeownerFramed
            ? "On coverage — the age of the unit does NOT tell us whether it was ever registered, " +
              "and registration is the difference between the base parts warranty and the longer one. " +
              "Your tech can pull the actual registration from the manufacturer before anyone assumes it's covered."
            : "On coverage — the age off the plate does NOT tell us whether this one is registered, " +
              "and registration is the difference between the base term and the extended one. " +
              "Say the word and I'll pull the actual registration from the manufacturer before you quote anything.");
        }
      }

      const _hadScrewMethod = (/\b(?:screwdriver|destornillador|desarmador|tournevis|chave de fenda|tu[aơ]? ?v[ií]t)\b/i.test(outText) && /\b(?:terminal|terminales|terminais|short|shorting|bridge|across|cortocircuit\w*|puente\w*|born[ea]s?|court[- ]circuit\w*|curto[- ]circuit\w*)\b/i.test(outText))
        || (/螺丝刀|起子/.test(outText) && /短接|短路|端子|接线柱|放电/.test(outText));
      // 2026-09-14 — THE STRIP HAD A HOLE AND IT REACHED A HOMEOWNER ON PROD. Both regexes
      // below required a sentence to END in [.!?], so a markdown BULLET with no terminal
      // punctuation sailed straight through untouched. Verified live on trazermike.io:
      //   "- Discharge the capacitor with an insulated screwdriver (touching across terminals)"
      // Lists are how the model formats procedures, so this was not an edge case — it was
      // the most likely shape for the dangerous method to arrive in. Strip LINE-first
      // (every bullet/heading is its own unit, punctuation or not), then sentence-level
      // inside the line so a long paragraph only loses the dangerous sentence.
      // Set by every strip that EMPTIES a line. Renumbering below is gated on it so a
      // healthy answer that happens to start a list at "3." is never rewritten.
      var _guardRemovedLine = false;
      // 2026-09-14, third live capture — THE STRIP WAS KEYED ON THE WORD, NOT THE ACT.
      // A tech asking about a 45/5 dual run cap got, on prod:
      //   "Bridging bare metal across the terminals works but can weld the tip…"
      // Same lethal method, no "screwdriver" in it, so nothing caught it. Match the ACT —
      // bridging/shorting/jumping anything conductive across the terminals — and let the
      // ONE safe version through by exempting a sentence that names a resistor.
      // TWO different tests, and the difference matters — a resistor exemption that covers
      // the whole line is a BYPASS. Live on prod 2026-09-14 one line read: "Use an
      // insulated screwdriver…, or better, a resistor discharge tool… Short across the
      // terminals… The screwdriver method works but it's crude." Because the word
      // "resistor" appeared somewhere in it, a line-wide exemption let all of it through.
      //   _toolDanger  — names a conductive tool as the discharge method. NEVER exempt;
      //                  a resistor mentioned elsewhere does not make a screwdriver safe.
      //   _actDanger   — "short/bridge across the terminals" with no tool named. Exempt
      //                  ONLY when that same sentence names the resistor, which is the
      //                  one correct instruction and has to survive for the tech.
      const _toolDanger = (s) =>
        /\bthe screwdriver (?:method|trick|way|approach)\b/i.test(s)
        // Spanish (2026-10-31): same two-part shape — a conductive tool named, plus the
        // act/endorsement words — so a Spanish reply can't carry the lethal method either.
        || /\bel (?:m[eé]todo|truco) del destornillador\b/i.test(s)
        || /\bla (?:m[eé]thode|technique) du tournevis\b/i.test(s)
        || /\bo (?:m[eé]todo|truque) da chave de fenda\b/i.test(s)
        || (/\b(?:screwdriver|blade|bare metal|metal object|pliers|coin|car key|destornillador|desarmador|alicates|pinzas|moneda|navaja|metal (?:pelado|desnudo)|tournevis|pince|pi[eè]ce de monnaie|chave de fenda|alicate|moeda|tu[aơ]? ?v[ií]t|đ[oồ]ng xu)\b/i.test(s)
            // "…works but it's crude and sparks" endorses it just as much as an instruction
            // does — prod 2026-09-14 left exactly that sentence standing.
            && /\b(?:terminal|post|lug|prong|contact|discharg\w*|short\w*|bridg\w*|across|spark\w*|arc(?:s|ing)?|crude|zap\w*|terminales|terminais|born[ea]s?|contacto|descarg\w*|cortocircuit\w*|puente\w*|chispa\w*|arco\b|court[- ]circuit\w*|curto[- ]circuit\w*|[eé]tincelle|fa[ií]sca|ch[aậ]p|c[uự]c|x[aả] đi[eệ]n)\b/i.test(s))
        // zh (2026-10-31): CJK gets its own branch — \b never matches against it.
        || (/螺丝刀|起子/.test(s) && /短接|短路|端子|接线柱|放电|火花|打火/.test(s));
      const _actShape = (s) =>
        /\b(?:short(?:ing|s)?|bridg(?:e|es|ing)|jump(?:er|ers|ing)?|arc(?:ing)?|lay(?:ing)?|touch(?:ing)?)\b[^.!?\n]{0,70}\b(?:across|between|from one)\b[^.!?\n]{0,50}\b(?:terminal|post|lug|prong|contact)/i.test(s)
        || /\bbare metal\b[^.!?\n]{0,50}\b(?:across|between|on)\b[^.!?\n]{0,40}\b(?:terminal|post|lug|contact)/i.test(s)
        // Spanish (2026-10-31): "haga cortocircuito entre los terminales", "puentear los
        // terminales" — same act, both word orders, same character windows.
        || /\b(?:cortocircuit\w*|puentea?r|puenteando|tocar|tocando|cruzar|cruzando)\b[^.!?\n]{0,70}\b(?:entre|a trav[eé]s de|de un[oa]?)\b[^.!?\n]{0,50}\b(?:terminal|borne|contacto)/i.test(s)
        || /\b(?:cortocircuit\w*|puentea?r|puenteando)\b[^.!?\n]{0,60}\b(?:terminal|borne|contacto)/i.test(s)
        // fr/pt (2026-10-31): court-circuiter / ponter les bornes; curto-circuitar os terminais.
        || /\b(?:court[- ]circuit\w*|ponter|pontant|toucher|touchant)\b[^.!?\n]{0,70}\b(?:entre|[aà] travers)\b[^.!?\n]{0,50}\b(?:bornes?|terminal|contacts?)/i.test(s)
        || /\b(?:court[- ]circuit\w*|ponter)\b[^.!?\n]{0,60}\b(?:bornes?|terminal|contacts?)/i.test(s)
        || /\b(?:curto[- ]circuit\w*|fazer (?:uma )?ponte|ligar em ponte)\b[^.!?\n]{0,70}\b(?:entre|atrav[eé]s)\b[^.!?\n]{0,50}\b(?:terminais|terminal|contatos?)/i.test(s)
        || /\b(?:curto[- ]circuit\w*|fazer (?:uma )?ponte)\b[^.!?\n]{0,60}\b(?:terminais|terminal|contatos?)/i.test(s)
        // zh/vi (2026-10-31): own branches — no \b against CJK; vi multi-word accent-dual.
        || /(短接|短路|搭接)[^.!?。\n]{0,40}(端子|接线柱|两极)/.test(s)
        || /(ch[aậ]p|n[oố]i t[aắ]t)[^.!?\n]{0,50}(hai c[uự]c|c[uự]c|đ[aầ]u n[oố]i)/i.test(s);
      const _actDanger = (s) => _actShape(s) && !/\b(?:resistor|ohm|\d+\s*k\b|resistencia)|电阻|đi[eệ]n tr[oở]|dien tro\b/i.test(s);
      const _screwMethodIn = (s) => _toolDanger(s) || _actDanger(s);
      // The LINE gate deliberately ignores the exemption: a line only earns a pass when it
      // has no dangerous shape at all. Otherwise it gets split and judged sentence by
      // sentence, which is where the exemption belongs.
      const _lineWorthSplitting = (l) => _toolDanger(l) || _actShape(l);
      outText = outText.split('\n').map((line) => {
        if (!_lineWorthSplitting(line)) return line;
        const kept = line.split(/(?<=[.!?])\s+|(?<=[。！？])/).filter((s) => !_screwMethodIn(s));
        const rebuilt = kept.join(' ').trim();
        _guardRemovedLine = true;
        // If the whole bullet/heading WAS the method, drop the leftover marker too.
        return /^(?:[-*+]|\d+[.)]|#{1,6})\s*$/.test(rebuilt) ? '' : rebuilt;
      }).join('\n');
      // A homeowner must never be walked through discharging or swapping a capacitor at
      // all — the tail below already tells them it is a licensed tech's job, and a DIY
      // how-to under it reads as permission. Line-level so the diagnosis and the
      // "what to ask your tech" content survive. (Extends the 2026-08-22 audience gate,
      // which fixed the fixed-string TAIL but never touched Mike's own prose.)
      if (_homeownerFramed && (_capacitorWarn || _hadScrewMethod)) {
        outText = outText.split('\n')
          .map((l) => {
            if (!/\b(?:discharg\w*|bleed(?:ing|s)?\b|jumper|resistor|screwdriver)\b/i.test(l)) return l;
            _guardRemovedLine = true;
            return '';
          })
          .join('\n');
        // Pulling only the discharge STEP out of a DIY walkthrough leaves something worse
        // than what we started with: prod 2026-09-14 answered a homeowner "Yes, many
        // homeowners do — it's one of the simpler AC repairs," walked them through the
        // swap, and had the one step that keeps them alive silently missing, while the
        // tail underneath said do not touch it. Take the whole how-to, not the step: drop
        // any SECTION whose heading is the DIY walkthrough, and any sentence telling them
        // they can do this themselves. The diagnosis, the symptoms, and the what-to-ask
        // content live in other sections and survive.
        // 2026-09-14 third capture: the heading was "### If you decide to do it, the basics
        // are:" followed by a four-step swap, and a "Tools you'll want" list under it. The
        // pattern only knew "if you attempt/try". Widened — and below, ANY numbered
        // procedure is dropped for a homeowner on a capacitor question, because the shape
        // of a how-to is more reliable than guessing what Mike titled it.
        const _diyHeading = /^\s*#{1,6}\s*[^\n]*\b(?:diy|do it yourself|yourself|if you (?:attempt|try|go|decide|want|choose)|attempt(?:ing)? it|doing it|before you start|before you buy|how to (?:replace|swap|change|do)|replacing it|the swap|the basics|steps?|tools?|what you'?ll need|you'?ll need)\b/i;
        const _dl = outText.split('\n');
        let _inDiy = false;
        for (let _i = 0; _i < _dl.length; _i++) {
          if (/^\s*#{1,6}\s+\S/.test(_dl[_i])) _inDiy = _diyHeading.test(_dl[_i]);
          if (_inDiy) { if (_dl[_i].trim()) _guardRemovedLine = true; _dl[_i] = ''; }
        }
        outText = _dl.join('\n');
        const _diySell = /\b(?:many|most|plenty of|lots of)\s+homeowners?\s+(?:do|can|handle|replace|swap|tackle|manage)|\b(?:one of the|a)\s+(?:simpler|simplest|easier|easiest|more straightforward)\s+(?:ac |a\/c |hvac )?(?:repairs?|jobs?|fixes?|swaps?)|\byou can (?:absolutely |definitely |certainly |safely )?(?:do|handle|tackle|replace|swap|change) (?:this|it|that|the cap\w*)\s*(?:yourself|on your own)|\bit'?s (?:a )?(?:pretty |fairly |relatively |very )?(?:easy|simple|straightforward)\s+(?:diy|swap|fix|repair|job)|\bdiy(?:[- ]friendly| route| job| fix)/i;
        // A numbered procedure IS a how-to, whatever it is titled. On a capacitor question
        // from a homeowner there is no numbered procedure we want them following, so the
        // shape goes — along with the line that introduces it ("…the basics are:"). This
        // is narrow on purpose: homeowner AND capacitor. A homeowner asking about a filter
        // still gets their steps (regression-tested).
        const _pl = outText.split('\n');
        for (let _i = 0; _i < _pl.length; _i++) {
          if (!/^\s*\d+[.)]\s+\S/.test(_pl[_i])) continue;
          _guardRemovedLine = true;
          _pl[_i] = '';
          for (let _k = _i - 1; _k >= 0; _k--) {
            if (!_pl[_k].trim()) continue;
            if (/:\s*$/.test(_pl[_k]) || /^\s*#{1,6}\s+\S/.test(_pl[_k])) _pl[_k] = '';
            break;
          }
        }
        outText = _pl.join('\n');
        const _sl = outText.split('\n');
        for (let _i = 0; _i < _sl.length; _i++) {
          if (!_diySell.test(_sl[_i])) continue;
          const _kept = _sl[_i].split(/(?<=[.!?])\s+|(?<=[。！？])/).filter((s) => !_diySell.test(s));
          const _rb = _kept.join(' ').trim();
          _guardRemovedLine = true;
          _sl[_i] = /^(?:[-*+]|\d+[.)]|#{1,6})\s*$/.test(_rb) ? '' : _rb;
        }
        outText = _sl.join('\n');
      }
      // The multi-line "Method 1: …screwdriver…" block + orphaned-heading cleanup can corrupt
      // legitimately-numbered non-capacitor answers, so keep that de-numbering scoped to the
      // capacitor path where a "Method 1 (screwdriver) / Method 2 (resistor)" pair is expected.
      if (_capacitorWarn || _hadScrewMethod) {
        outText = outText.replace(/(?:#{1,6}\s*|\*\*\s*)?Method\s*1\b[^\n]*screwdriver[\s\S]*?(?=(?:#{1,6}\s*|\*\*\s*)?Method\s*2\b|\n#{1,6}\s|$)/i, '');
        // removing the screwdriver "Method 1" leaves "Method 2" orphaned — de-number remaining method headings so it reads clean
        outText = outText.replace(/\bMethod\s*[1-9]\b[.:)\-—]*\s*/gi, '');
      }
      // Every strip above removes LINES, which can leave a heading standing over nothing
      // ("## Why the Big Range?" with its whole body scrubbed — seen live 2026-09-14).
      // An empty section reads like the app broke, so drop any heading whose body is now
      // empty. Only fires on genuinely empty sections, so healthy answers are untouched.
      // 2026-09-14, second prod capture: Mike labels sections with BOLD TEXT as often as
      // with "#", and the scrubbed answer went out looking like this —
      //     **DIY:**
      //
      //     **Professional:**
      // two labels standing over nothing, which reads as a broken app to a customer. So a
      // "section opener" here is a # heading OR a line that is only a bold/italic label.
      {
        const _opener = (l) => /^\s*#{1,6}\s+\S/.test(l)
          || /^\s*(?:\*\*|__)[^*_\n]{1,60}(?:\*\*|__)\s*:?\s*$/.test(l)
          || /^\s*(?:\*|_)[^*_\n]{1,60}(?:\*|_)\s*:\s*$/.test(l);
        const _hl = outText.split('\n');
        for (let _i = 0; _i < _hl.length; _i++) {
          if (!_opener(_hl[_i])) continue;
          let _empty = true;
          for (let _j = _i + 1; _j < _hl.length && !_opener(_hl[_j]); _j++) {
            // A horizontal rule is not content either.
            if (_hl[_j].trim() && !/^\s*(?:[-*_]\s*){3,}$/.test(_hl[_j])) { _empty = false; break; }
          }
          if (_empty) _hl[_i] = '';
        }
        outText = _hl.join('\n');
      }
      // Removing a bullet mid-list leaves a blank line that markdown renders as TWO
      // broken lists. Close the gap when the blank line sits between two list items.
      outText = outText.replace(/((?:^|\n)\s*(?:[-*+]|\d+[.)])[^\n]*)\n[ \t]*\n(?=\s*(?:[-*+]|\d+[.)])\s)/g, '$1\n');
      // And removing a NUMBERED step leaves a visible hole — prod 2026-09-14 showed a
      // homeowner "1." then "3." with step 2 gone, which reads as a broken app and,
      // worse, as a missing instruction. Renumber each run of steps from its own start.
      if (_guardRemovedLine || _hoDropped || _replDropped) {
        const _nl = outText.split('\n');
        let _next = 0;
        for (let _i = 0; _i < _nl.length; _i++) {
          const _m = _nl[_i].match(/^(\s*)(\d+)([.)])(\s+\S)/);
          if (!_m) { if (!_nl[_i].trim()) continue; _next = 0; continue; }
          if (!_next) _next = 1;
          _nl[_i] = _m[1] + _next + _m[3] + _m[4] + _nl[_i].slice(_m[0].length);
          _next++;
        }
        outText = _nl.join('\n');
      }
      outText = outText.replace(/\n{3,}/g, '\n\n').trim();
      // Genuine ACTIVE emergencies (911 / live gas / CO / spillage / A2L release) still
      // LEAD — you never bury "call 911" or "shut the gas off" under an answer. The
      // precautionary stored-energy cautions (capacitor / inverter "discharge before you
      // touch it") move to a TAIL note so Mike answers the tech's actual question first,
      // for ANY experience level (Brandon field note 2026-06-16).
      if (_safetyLead) outText = _safetyLead + '\n\n' + outText;
      // 2026-08-22 — TWO AUDIENCE/DUPLICATION DEFECTS IN THE CAPACITOR TAIL, found by a
      // 36-scenario stress test before the F.H. Furr demo. NEITHER is a safety weakening:
      //
      // (1) IT WAS NOT AUDIENCE-GATED. A HOMEOWNER asking "what's a fair price to replace a
      //     capacitor" got handed a tech-depth procedure — bleed it across a ~20k ohm resistor,
      //     terminal pairs — which reads as an invitation to do it themselves. A homeowner
      //     should NOT be discharging a capacitor at all, so the correct warning for them is
      //     "do not touch this, it can kill you, that's a licensed tech's job." Replacing the
      //     procedure with a hard do-not-touch is SAFER for that audience, not softer.
      //
      // (2) IT DUPLICATED MIKE'S OWN PROSE. When a tech asks "how do I not get zapped", Mike
      //     already answers with the discharge procedure in his own voice, and this fixed
      //     string then repeated it — two paragraphs saying the same thing, which reads like
      //     two systems answered. Suppressed ONLY when his own text demonstrably covers BOTH
      //     halves (kill the power AND bleed with a resistor). A partial answer still gets the
      //     full boilerplate — the dedupe fails toward saying it twice, never toward silence.
      let _capTail = _capacitorWarn;
      if (_capTail && _homeownerFramed) {
        _capTail = _L({
          en: 'SAFETY — do not open the unit or touch that capacitor yourself. It holds a lethal charge even with the power off, and it can injure or kill someone who is not trained and equipped to discharge it. This one is a licensed technician\'s job, and it is not an expensive part for them to handle.',
          es: 'SEGURIDAD — no abra la unidad ni toque ese capacitor usted mismo. Guarda una carga letal aun con la corriente apagada, y puede lesionar o matar a alguien que no tiene el entrenamiento y el equipo para descargarlo. Este es trabajo de un técnico con licencia, y no es una pieza cara para que ellos la manejen.',
          zh: '安全提示 — 不要自己打开机器或碰那个电容。即使断电它也存着致命电荷，没受过训练、没有装备去放电的人可能受伤甚至丧命。这是持证技师的活，而且对他们来说这不是贵的零件。',
          vi: 'AN TOÀN — đừng tự mở máy hay chạm vào tụ đó. Nó giữ điện tích chết người ngay cả khi cắt nguồn, và có thể gây thương tích hoặc chết người với ai không được huấn luyện và trang bị để xả nó. Đây là việc của thợ có chứng chỉ, và với họ đây không phải linh kiện đắt.',
          fr: 'SÉCURITÉ — n\'ouvrez pas l\'appareil et ne touchez pas ce condensateur vous-même. Il garde une charge mortelle même courant coupé, et il peut blesser ou tuer quelqu\'un qui n\'est pas formé et équipé pour le décharger. C\'est le travail d\'un technicien agréé, et ce n\'est pas une pièce chère à lui faire gérer.',
          pt: 'SEGURANÇA — não abra a unidade nem toque nesse capacitor você mesmo. Ele guarda carga letal mesmo com a energia cortada, e pode ferir ou matar quem não é treinado e equipado para descarregá-lo. Isso é serviço de técnico licenciado, e não é uma peça cara para ele cuidar.' });
      } else if (_capTail) {
        const _saidPowerOff = /(kill|cut|shut|turn)\s+(off\s+)?(the\s+)?(disconnect|breaker|power)|power\s+off|disconnect\s+pulled/i.test(outText);
        const _saidBleed = /(\d+\s*k\s*ohm|resistor|bleed\s+(it|the\s+cap)|discharge\s+(it|the\s+cap))/i.test(outText);
        const _saidNotScrewdriver = /never\s+short|not\s+with\s+a\s+screwdriver|don'?t\s+short/i.test(outText);
        if (_saidPowerOff && _saidBleed && _saidNotScrewdriver) _capTail = '';
      }
      // (D5-D8) OUTPUT-SIDE procedural-safety checks (2026-10-03, from the exam findings).
      // Fire when MIKE'S OWN REPLY directs a hazardous procedure without its mandatory
      // step. Topic-gated by the _xxxRisk flags (which also forced non-stream so this code
      // is guaranteed to run). Each fails toward speaking: suppressed only when his prose
      // demonstrably covers the step.
      let _lotoTail = '';
      if (_lotoRisk
          && /(open|pull|remove|behind|reseat|unplug|swap|replace|land|tighten|jumper|check|ohm|test|measure|verify|inspect)[^.!?\n]{0,60}(control board|circuit board|\bpcb\b|board|panel|terminal(s| block)?|connector|thermistor|\bsensor\b|probe|contactor|wire|wiring)/i.test(outText)
          && !/((kill|cut|shut|turn|pull)[^.!?\n]{0,30}(disconnect|breaker|power)|power (off|down|killed)|de-?energiz|lock[- ]?out|loto|verify (it'?s |it is )?dead|confirm (it'?s |it is )?dead)/i.test(outText)) {
        _lotoTail = _L({
          en: 'SAFETY — before any of that panel or terminal work: kill the disconnect AND the breaker, verify dead with your meter, and lock it out if anyone else could re-energize it while your hands are in there.',
          es: 'SEGURIDAD — antes de cualquier trabajo en ese panel o en terminales: corte el desconectador Y el breaker, verifique con su multímetro que está muerto, y póngale candado (lockout) si alguien más pudiera re-energizarlo mientras usted tiene las manos adentro.',
          zh: '安全提示 — 动那个面板或端子之前：隔离开关和断路器都断掉，用万用表验电确认无电，如果别人可能在你伸手进去时重新送电，就上锁挂牌（lockout）。',
          vi: 'AN TOÀN — trước khi đụng panel hay cực đấu dây đó: cắt cầu dao VÀ CB, xác nhận hết điện bằng đồng hồ, và khóa (lockout) nếu ai khác có thể đóng điện lại trong khi tay bạn đang ở trong đó.',
          fr: 'SÉCURITÉ — avant tout travail sur ce panneau ou ces bornes : coupez le sectionneur ET le disjoncteur, vérifiez l\'absence de tension au multimètre, et condamnez (lockout) si quelqu\'un d\'autre peut remettre sous tension pendant que vos mains sont dedans.',
          pt: 'SEGURANÇA — antes de qualquer trabalho nesse painel ou terminais: desligue a seccionadora E o disjuntor, confirme morto com o multímetro, e bloqueie (lockout) se outra pessoa puder reenergizar enquanto suas mãos estão lá dentro.' });
      }
      let _brazeTail = '';
      if (_brazeRisk
          && /(braz|sweat|torch|solder)[^.!?\n]{0,70}(line|lineset|valve|coil|compressor|drier|fitting|joint|stub|pipe|it in|it out)/i.test(outText)
          && !/nitrogen/i.test(outText)) {
        _brazeTail = _L({
          en: 'SAFETY — recover the charge to zero before the torch comes out, and flow nitrogen through the lines while you braze. Brazing without nitrogen cooks scale into the lineset and kills TXVs and compressors downstream; heating a line under pressure can blow it open in your face.',
          es: 'SEGURIDAD — recupere la carga a cero antes de sacar el soplete, y haga fluir nitrógeno por las líneas mientras suelda. Soldar sin nitrógeno cocina escoria dentro de la tubería y mata válvulas TXV y compresores aguas abajo; calentar una línea con presión puede reventarla en su cara.',
          zh: '安全提示 — 动焊枪之前先把冷媒回收到零，钎焊时管内通氮气。不通氮气焊接会把氧化皮烧进管路，毁掉下游的TXV和压缩机；带压加热管子可能当面炸开。',
          vi: 'AN TOÀN — thu hồi môi chất về 0 trước khi lấy đèn khò ra, và thổi ni-tơ qua đường ống trong khi hàn. Hàn không có ni-tơ nung cặn ô-xít vào ống và giết TXV với máy nén phía sau; nung ống còn áp suất có thể nổ vào mặt bạn.',
          fr: 'SÉCURITÉ — récupérez la charge à zéro avant de sortir le chalumeau, et faites circuler de l\'azote dans les lignes pendant le brasage. Braser sans azote cuit de la calamine dans la ligne et tue les TXV et compresseurs en aval ; chauffer une ligne sous pression peut l\'ouvrir en pleine figure.',
          pt: 'SEGURANÇA — recolha a carga a zero antes de sair o maçarico, e passe nitrogênio pelas linhas enquanto solda. Soldar sem nitrogênio coze crosta para dentro da linha e mata TXV e compressor na frente; esquentar linha com pressão pode estourar na sua cara.' });
      }
      let _leakTail = '';
      if (_leakRisk
          && /(add|weigh in|top[- ]?(it[- ])?off|charge (it|the system)|put[^.!?\n]{0,15}(refrigerant|freon|pound|lb))/i.test(outText)
          && !/(leak[- ]?(search|check|test|detect|hunt)|find (the|that) leak|locate the leak|(repair|fix)[^.!?\n]{0,25}leak)/i.test(outText)) {
        _leakTail = _L({
          en: 'One more thing — if it\'s low, it leaked. Leak-search and repair BEFORE refrigerant goes in: topping off a leaking system without finding the leak is an EPA 608 problem and a guaranteed callback. Note the leak location and the fix on the ticket.',
          es: 'Una cosa más — si está bajo, es porque fugó. Busque y repare la fuga ANTES de meter refrigerante: recargar un sistema con fuga sin encontrar la fuga es un problema de EPA 608 y una visita de regreso garantizada. Anote la ubicación de la fuga y la reparación en la orden de trabajo.',
          zh: '再提一句 — 缺冷媒就是漏了。先检漏、修漏，然后才加冷媒：不找漏就给漏的系统补充，是EPA 608问题，也必然返工。把漏点位置和修复写在工单上。',
          vi: 'Thêm một điều — thiếu gas nghĩa là đã xì. Tìm và sửa chỗ xì TRƯỚC khi nạp môi chất: nạp thêm cho hệ đang xì mà không tìm chỗ xì là vi phạm EPA 608 và chắc chắn bị gọi lại. Ghi vị trí xì và cách sửa vào phiếu công việc.',
          fr: 'Encore une chose — s\'il en manque, ça a fui. Recherche de fuite et réparation AVANT de remettre du réfrigérant : compléter un système qui fuit sans trouver la fuite, c\'est un problème EPA 608 et un rappel garanti. Notez l\'emplacement de la fuite et la réparation sur le bon de travail.',
          pt: 'Mais uma coisa — se está baixo, vazou. Procure e conserte o vazamento ANTES de pôr refrigerante: completar um sistema vazando sem achar o vazamento é problema de EPA 608 e retorno garantido. Anote o local do vazamento e o conserto na ordem de serviço.' });
      }
      let _verifyTail = '';
      if (_verifyRisk
          && /(fire (it|the\b[^.!?\n]{0,25}) (back )?up|re-?light|relight|put (it|the\b[^.!?\n]{0,25}) back (in service|together|online)|button (it|everything) (back )?up|restore (gas|service)|should be good to go|you'?re (all )?set)/i.test(outText)
          && /(furnace|boiler|water heater|burner|gas|combustion|flue|vent)/i.test(outText)
          && !/(combustion analy|analyzer)/i.test(outText)) {
        _verifyTail = _L({
          en: 'Before you leave: combustion analysis with it firing, CO at the supply registers (zero tolerance in the living space), bubble-test every gas connection you touched — and write the as-found and as-left readings on the work order. The paper trail is part of the job.',
          es: 'Antes de irse: análisis de combustión con el equipo encendido, CO en las rejillas de suministro (tolerancia cero en el espacio habitado), prueba de burbujas en cada conexión de gas que tocó — y escriba las lecturas como-se-encontró y como-se-dejó en la orden de trabajo. El registro en papel es parte del trabajo.',
          zh: '走之前：点火状态下做燃烧分析，测送风口的CO（居住空间零容忍），你动过的每个燃气接头都做肥皂泡检漏——并把到场读数和离场读数写进工单。纸面记录是活的一部分。',
          vi: 'Trước khi rời đi: phân tích cháy khi máy đang chạy, đo CO tại miệng gió cấp (không khoan nhượng trong không gian ở), thử xà phòng mọi mối nối gas bạn đã đụng — và ghi số đo lúc đến và lúc đi vào phiếu công việc. Hồ sơ giấy là một phần của công việc.',
          fr: 'Avant de partir : analyse de combustion appareil en marche, CO aux bouches de soufflage (tolérance zéro dans l\'espace de vie), test à l\'eau savonneuse sur chaque raccord gaz touché — et notez les relevés à l\'arrivée et au départ sur le bon de travail. La trace écrite fait partie du boulot.',
          pt: 'Antes de ir embora: análise de combustão com o equipamento queimando, CO nas grelhas de insuflamento (tolerância zero no espaço habitado), teste de bolhas em cada conexão de gás que você mexeu — e escreva as leituras de chegada e de saída na ordem de serviço. O registro em papel faz parte do serviço.' });
      }
      // (D9) HAZARD CLOSE-OUT CHECKLIST (2026-10-05, run-2 exam: 58 strict safety fails
      // missed exactly one or two of THESE lines while the hands-on protocol was right).
      // Item-wise and idempotent: each mandate appends only when its hazard class is live
      // and neither Mike's prose nor the prepended lead already covers it.
      let _closeoutTail = '';
      {
        const _coEvent = /(\bco\b|carbon monoxide)/i.test(_safetyLead) ||
          /(\bco\b|carbon monoxide)[^.]{0,45}(alarm|reading|ppm|exposure|poison|detector|register)/i.test(_lastUser) ||
          /(\bco\b|carbon monoxide)[^.!?\n]{0,35}(meter|ambient|register|at the (register|vent|supply))/i.test(outText);
        const _gasEvent = /live gas leak|fuga de gas activa|燃气正在泄漏|rò rỉ gas đang xảy ra|fuite de gaz active|vazamento de g[aá]s ativo/i.test(_safetyLead);
        // Rollout / spillage / stuck-valve / air-free shutdowns are combustion-safety
        // events too (2026-10-05 verify: the rollout lead shipped with no post-repair
        // combustion-analysis mandate — the exact line SAF-035 failed on).
        const _combustionEvent = /(rollout|spillage|gas off at the appliance|air-free|stuck open|derrame de gases|atascada abierta|libre de aire|无空气|卡在开启|烟气溢出|sans air|bloqu[eé]e ouverte|refoulement|livre de ar|presa aberta|derramamento de gases|kẹt mở|tràn khí thải)/i.test(_safetyLead)
          || (/(spillage|backdraft|flue (blockage|restriction|icing|ice)|iced?[- ](over|up|cap)|cracked heat exchanger|restricted (draft|flue))/i.test(_lastUser + ' ' + outText)
              && /(\bco\b|carbon monoxide)/i.test(_lastUser + ' ' + outText));
        const _items = [];
        if (_coEvent) {
          if (!/(do not|don'?t|never|stays? off|comes? off)[^.!?\n]{0,60}(restore|back (in|into) service|back on)|until[^.!?\n]{0,50}(root cause|found and correct|corrected|repaired)/i.test(outText))
            _items.push(_L({
              en: 'the appliance stays OFF until the root cause is found and corrected — never restore on "it seems fine now"',
              es: 'el equipo se queda APAGADO hasta encontrar y corregir la causa raíz — nunca lo restablezca con un "parece que ya está bien"',
              zh: '设备保持停机，直到找到并纠正根本原因——绝不能因为"现在看着正常"就恢复',
              vi: 'thiết bị giữ nguyên TẮT cho đến khi tìm ra và sửa nguyên nhân gốc — không bao giờ mở lại vì "giờ có vẻ ổn"',
              fr: 'l\'appareil reste À L\'ARRÊT jusqu\'à trouver et corriger la cause racine — jamais de remise en service sur un « ça a l\'air bon maintenant »',
              pt: 'o equipamento fica DESLIGADO até achar e corrigir a causa raiz — nunca religue no "parece bem agora"' }));
          if (!/(zero|\b0\b)\s*ppm[^.!?\n]{0,30}(before|living space|registers)|verify[^.!?\n]{0,35}(\bco\b|carbon monoxide)[^.!?\n]{0,20}(zero|0)|combustion analy/i.test(outText))
            _items.push(_L({
              en: 'before it goes back in service: combustion analysis firing, and ambient CO verified at ZERO in the living space',
              es: 'antes de volver a ponerlo en servicio: análisis de combustión con el equipo encendido, y CO ambiente verificado en CERO en el espacio habitado',
              zh: '恢复使用之前：点火状态做燃烧分析，并确认居住空间环境CO为零',
              vi: 'trước khi chạy lại: phân tích cháy khi máy đang chạy, và CO trong không gian ở xác nhận bằng KHÔNG',
              fr: 'avant la remise en service : analyse de combustion en marche, et CO ambiant vérifié à ZÉRO dans l\'espace de vie',
              pt: 'antes de voltar ao serviço: análise de combustão queimando, e CO ambiente verificado em ZERO no espaço habitado' }));
          if (/(occupant|homeowner|family|resident|customer|tenant|anyone|kids?|child)[^.]{0,70}(headache|nause|dizzy|symptom|exposed|exposure|sick|vomit|flu)/i.test(_lastUser)
              && !/(medic|physician|doctor|medical|urgent care|\bEMS\b|\bER\b)/i.test(outText))
            _items.push(_L({
              en: 'everyone who was exposed gets evaluated by a medic — CO dose is cumulative and symptoms lag the exposure',
              es: 'todas las personas expuestas deben ser evaluadas por un médico — la dosis de CO es acumulativa y los síntomas van detrás de la exposición',
              zh: '所有接触过的人都要就医评估——CO剂量是累积的，症状滞后于暴露',
              vi: 'mọi người đã phơi nhiễm đều được y tế đánh giá — liều CO tích lũy và triệu chứng đến sau phơi nhiễm',
              fr: 'toute personne exposée est évaluée par un secouriste — la dose de CO est cumulative et les symptômes retardent sur l\'exposition',
              pt: 'todo mundo que foi exposto é avaliado por um médico — a dose de CO é cumulativa e os sintomas atrasam em relação à exposição' }));
        }
        if (_gasEvent && !/(leak[- ]?test|pressure[- ]?test|bubble[- ]?test)/i.test(outText))
          _items.push(_L({
            en: 'after the utility gives the all-clear: leak-test the repair before anything gets re-lit',
            es: 'después de que la compañía de gas dé el visto bueno: haga prueba de fugas a la reparación antes de volver a encender nada',
            zh: '燃气公司放行之后：先对修复处做检漏，才能重新点火任何设备',
            vi: 'sau khi công ty gas cho phép: thử kín chỗ sửa trước khi mồi lửa lại bất cứ thứ gì',
            fr: 'après le feu vert du fournisseur : testez l\'étanchéité de la réparation avant de rallumer quoi que ce soit',
            pt: 'depois que a companhia liberar: teste de estanqueidade no reparo antes de reacender qualquer coisa' }));
        if (_combustionEvent && !_coEvent && !/combustion analy/i.test(outText))
          _items.push(_L({
            en: 'after the repair: combustion analysis with it firing and CO verified at the registers before it goes back in service',
            es: 'después de la reparación: análisis de combustión con el equipo encendido y CO verificado en las rejillas antes de volver a ponerlo en servicio',
            zh: '修复之后：点火状态做燃烧分析，并在送风口确认CO，才能恢复使用',
            vi: 'sau khi sửa: phân tích cháy khi máy chạy và CO xác nhận tại miệng gió trước khi chạy lại',
            fr: 'après la réparation : analyse de combustion en marche et CO vérifié aux bouches avant la remise en service',
            pt: 'depois do reparo: análise de combustão queimando e CO verificado nas grelhas antes de voltar ao serviço' }));
        if ((_coEvent || _gasEvent || _combustionEvent)
            && !/(work order|document|write (it|that|this) (up|down)|on the ticket|paper trail)/i.test(outText))
          _items.push(_L({
            en: 'as-found readings, what you did, and as-left readings go on the work order',
            es: 'las lecturas como-se-encontró, lo que hizo, y las lecturas como-se-dejó van en la orden de trabajo',
            // "工单"/"phiếu công việc"/"bon de travail"/"ordem de serviço" are load-bearing:
            // the _docTail gate matches on them so the paper-trail line never doubles.
            zh: '到场读数、你做了什么、离场读数都要写进工单',
            vi: 'số đo lúc đến, việc bạn đã làm, và số đo lúc đi đều vào phiếu công việc',
            fr: 'relevés à l\'arrivée, ce que vous avez fait, relevés au départ : tout va sur le bon de travail',
            pt: 'leituras de chegada, o que você fez, e leituras de saída vão na ordem de serviço' }));
        if (_items.length) {
          _closeoutTail = _L({
            en: 'Close it out right — these are not optional: ',
            es: 'Cierre el trabajo bien — esto no es opcional: ',
            zh: '收尾要收干净——这些不是可选项：',
            vi: 'Kết thúc cho đúng — những điều này không phải tùy chọn: ',
            fr: 'Fermez le travail proprement — ceci n\'est pas optionnel : ',
            pt: 'Feche o serviço direito — isto não é opcional: ' }) + _items.map((x, i) => '(' + (i + 1) + ') ' + x).join('; ') + '.';
        }
      }
      // Documentation rider: whenever a hard safety lead fired, the paper trail is part of
      // the protocol (exam finding: document-on-work-order was the most-missed tail step).
      let _docTail = '';
      if (_safetyLead && !_verifyTail && !/work order|orden de trabajo|工单|phiếu công việc|bon de travail|ordem de servi[cç]o/.test(_closeoutTail) && !/(work order|document|write (it|that|this) (up|down)|on the ticket|paper trail|orden de trabajo|documente|工单|记录在|phi[eế]u c[oô]ng vi[eệ]c|bon de travail|ordem de servi[cç]o)/i.test(outText)) {
        _docTail = _L({
          en: 'And when it\'s handled: document what you found, what you measured, and what you did on the work order. On safety calls the paper trail is part of the job.',
          es: 'Y cuando esté resuelto: documente lo que encontró, lo que midió y lo que hizo en la orden de trabajo. En llamadas de seguridad el registro en papel es parte del trabajo.',
          zh: '处理完之后：把你发现的、测到的、做了的都记录到工单上。安全工单上，纸面记录是活的一部分。',
          vi: 'Và khi xử lý xong: ghi lại những gì bạn thấy, những gì bạn đo và những gì bạn làm vào phiếu công việc. Với ca an toàn, hồ sơ giấy là một phần của công việc.',
          fr: 'Et une fois géré : documentez ce que vous avez trouvé, mesuré et fait sur le bon de travail. Sur les appels sécurité, la trace écrite fait partie du boulot.',
          pt: 'E quando estiver resolvido: documente o que você achou, o que mediu e o que fez na ordem de serviço. Em chamado de segurança, o registro em papel faz parte do serviço.' });
      }
      const _tail = [_capTail, _inverterWarn, _lotoTail, _brazeTail, _leakTail, _verifyTail, _closeoutTail, _docTail].filter(Boolean);
      if (_tail.length) outText = outText + '\n\n' + _tail.join('\n\n');
    } catch (_) {}

    // Phase 2: attach wiring-diagram image(s) the retrieval surfaced, as a sentinel
    // block the client parses + renders inline (then strips from the visible text).
    if (_ragDiagrams && _ragDiagrams.length && _wiringDiagramIntent) {
      try { outText += '\n\n⟦MIKE_DIAGRAM⟧' + JSON.stringify(_ragDiagrams) + '⟦/MIKE_DIAGRAM⟧'; } catch (_) {}
    }
    // Store what the tech ACTUALLY SAW — after the safety and pricing guards have rewritten
    // it — not the raw model output. Auditing the pre-guard text would grade a reply nobody
    // ever read. Separate row from the question so a slow write can never delay the answer.
    try {
      // WHAT THIS ANSWER COST. The model hands back exact token counts on every reply and
      // we were passing them to the browser and throwing them away — so there was no way
      // to answer the one question that sets a price: what does one technician cost per
      // month? Without it, per-seat pricing is a guess and margin is unknowable.
      // Counts and model only; never the text, which is already stored above.
      const _u = (data && data.usage) || {};
      if (_askUid) logUsage(_askUid, 'mike_answer', {
        a: String(outText || '').slice(0, 8000),
        model: data && data.model,
        in_tokens: _u.input_tokens,
        out_tokens: _u.output_tokens,
        cache_read: _u.cache_read_input_tokens,
        cache_write: _u.cache_creation_input_tokens,
      });
    } catch { /* never block a tech's answer on logging */ }
    // REFLECT — update Mike's memory of this tech from the exchange. Fire-and-forget: never
    // block or delay the answer. (Covers native voice calls, which use this non-stream path.)
    try { if (_askUid) updateUserMemory(_askUid, _lastUser, outText); } catch {}
    res.json(_renewTok ? { response: outText, usage: data.usage, renewed_token: _renewTok } : { response: outText, usage: data.usage });

  } catch (err) {
    if (err.name === 'AbortError') res.status(504).json({ error: 'Request timed out — please try again.' });
    else { console.error('AI error:', err.message); res.status(502).json({ error: 'Connection error — please try again.' }); }
  } finally {
    clearTimeout(timeout);
    globalActive = Math.max(0, globalActive - 1);
  }
});

// ── FOUNDER HQ — "Ask Cello" (owner business advisor) ──────────────────────────
// A SEPARATE brain from Mike. Mike is the tech-facing HVAC master and runs behind the
// deterministic safety/pricing guard (a tech/homeowner must never be quoted a price,
// never handed a dangerous method). This route is the OPPOSITE audience: Brandon, the
// owner, asking business questions — what to charge a 30-man shop, who to follow up
// with, how a tech is trending. Those answers NEED dollar figures, so this path
// intentionally does NOT run Mike's guard layer and does NOT log as a mike_ask (which
// would poison the usage metrics the HQ itself reports). Gated hard: authenticateToken
// + requireAdmin — only the owner/admin reaches it, server-enforced, same as the
// dashboard. Net-new; touches nothing in the /api/ai path above.
app.post('/api/hq/ask', authenticateToken, requireAdmin, async (req, res) => {
  if (!ANTHROPIC_API_KEY)
    return res.status(503).json({ error: 'AI not configured.' });
  if (globalActive >= MAX_GLOBAL)
    return res.status(503).json({ error: 'Server at capacity — please try again in a moment.' });

  const { messages, context = '' } = req.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages required' });

  // The owner's live business context (real stats + pricebook) is passed from the client,
  // which already holds it from the admin dashboard. Clamp its size; it is admin-only
  // input so there is no untrusted-user risk, but a runaway payload still shouldn't bloat
  // the prompt. A business advisor is useless if it invents numbers, so the system prompt
  // binds Cello to the supplied context and to saying "I don't have that" when it's absent.
  const _ctx = String(context || '').slice(0, 6000);
  const _system =
    "You are Cello — Brandon Ventura's AI COO for Trazer Mike, the AI master-HVAC-tech product " +
    "(Mike lives in every technician's pocket; shops pay per seat). You are NOT Mike and you are NOT " +
    "talking to a technician or a homeowner — you are talking to Brandon, the founder/owner, about " +
    "running and growing this business. Speak plainly and briefly (he is usually on his phone): answer " +
    "first in 2-4 sentences, lead with the call, no preamble.\n\n" +
    "RULES:\n" +
    "- Business numbers (what to charge a shop, margins, deal sizing) ARE your job — give real figures and ranges. " +
    "This is the owner's cockpit, not Mike's tech chat; there is no homeowner here to protect.\n" +
    "- NEVER invent a metric about his actual business. If a number (tech counts, revenue, who's active) isn't in the " +
    "BUSINESS CONTEXT below, say you don't have it rather than guessing.\n" +
    "- No financial guarantees; flag anything legal/tax/big-money as 'run it by a real pro too.'\n" +
    "- When he asks who to follow up with or who's slipping, use the context's real names/flags.\n\n" +
    "BUSINESS CONTEXT (his live data, as of this session — may be partial):\n" +
    (_ctx || '(none supplied this turn)');

  const body = {
    model: PRIMARY_MODEL, // overridden per-hop by callModelWithFailover
    // 4096 not 1024: Claude 5 thinks by default and thinking counts against
    // max_tokens; business questions deserve the reasoning room. Answer length
    // is still governed by the "2-4 sentences" rule in the system prompt.
    max_tokens: 4096,
    output_config: { effort: 'medium' },
    system: _system,
    messages,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  globalActive++;
  try {
    const _fo = await callModelWithFailover(body, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
    }, { stream: false });
    const response = _fo.res;
    const data = await response.json();
    if (!response.ok) {
      const msg = data?.error?.message || `API error ${response.status}`;
      console.error('HQ ask error:', response.status, msg, `(last model: ${_fo.model})`);
      return res.status(response.status === 429 ? 429 : 502).json({ error: msg });
    }
    if (data.stop_reason === 'refusal') {
      console.warn('[refusal:hq]', _fo.model);
      return res.json({ response: "I can't take that one on. Ask me about the business — numbers, team, pricing, next moves." });
    }
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();
    return res.json({ response: text || 'No response.' });
  } catch (err) {
    if (err.name === 'AbortError') return res.status(504).json({ error: 'Request timed out — please try again.' });
    console.error('HQ ask error:', err.message);
    return res.status(502).json({ error: 'Connection error — please try again.' });
  } finally {
    clearTimeout(timeout);
    globalActive = Math.max(0, globalActive - 1);
  }
});

// ── HQ: MONEY (owner-only) ────────────────────────────────────────────────────
// The MONEY strip on the Founder Command Center home tab (everyone pays $50 —
// Brandon, 2026-10-26). LIVE numbers pulled SERVER-SIDE from Stripe's REST API with
// the secret key (never from the client — no client-side Stripe calls, ever) plus
// trial-pipeline counts from our own DB. Gated exactly like /api/hq/ask.
// Fail-soft on every leg: a Stripe or DB hiccup nulls that slice instead of 500ing
// the cockpit. limit=100 per Stripe list is an honest cap at the current scale
// (~tens of subs); revisit pagination before sub #101.
app.get('/api/hq/money', authenticateToken, requireAdmin, async (req, res) => {
  const PRICE = 50; // $50/mo — the locked rate, founders included

  // Stripe slice (server-side only).
  let stripeSlice = null;
  if (STRIPE_SECRET_KEY) {
    const sGet = async (path) => {
      const r = await fetch(`https://api.stripe.com/v1/${path}`, {
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
      });
      if (!r.ok) throw new Error(`stripe ${path} → ${r.status}`);
      return r.json();
    };
    try {
      const since = Math.floor(Date.now() / 1000) - 30 * 86400;
      const [act, past, inv] = await Promise.all([
        sGet('subscriptions?status=active&limit=100'),
        sGet('subscriptions?status=past_due&limit=100'),
        sGet(`invoices?status=paid&created[gte]=${since}&limit=100`),
      ]);
      const subs = [...(act.data || []), ...(past.data || [])];
      // MRR from the real price objects, not an assumed $50 — the number must be
      // what Stripe will actually bill, including any legacy-priced sub.
      let mrrCents = 0;
      for (const s of (act.data || []))
        for (const it of ((s.items && s.items.data) || []))
          mrrCents += (it.price && it.price.unit_amount || 0) * (it.quantity || 1);
      const cardCustomers = new Set(subs.map(s => s.customer).filter(Boolean));
      stripeSlice = {
        activeSubs: (act.data || []).length,
        pastDue: (past.data || []).length,
        mrr: Math.round(mrrCents / 100),
        paidLast30: Math.round((inv.data || []).reduce((t, i) => t + (i.amount_paid || 0), 0) / 100),
        cardsOnFile: cardCustomers.size,
      };
    } catch (e) {
      console.error('hq/money stripe slice failed (non-fatal):', e.message);
    }
  }

  // DB slice — trial pipeline + unpaid founders (the conversion targets).
  let dbSlice = null;
  let weeklyActiveUnpaid = null;
  if (SUPABASE_URL) {
    try {
      const users = await supabase('GET', 'users', null,
        '?select=id,plan,trial_start,created_at,stripe_subscription_id&limit=10000');
      if (Array.isArray(users)) {
        const now = Date.now();
        const inWindow = (u) => {
          const t = new Date(u.trial_start || u.created_at || 0).getTime();
          return t && now - t < TRIAL_DAYS * 86400000;
        };
        const unpaidTrial   = users.filter(u => u.plan === 'trial'   && !u.stripe_subscription_id);
        const unpaidFounder = users.filter(u => u.plan === 'founder' && !u.stripe_subscription_id);
        dbSlice = {
          trialsActive: unpaidTrial.filter(inWindow).length,
          trialsAtWall: unpaidTrial.filter(u => !inWindow(u)).length,
          foundersUnpaid: unpaidFounder.length,
        };
        // Unpaid accounts that asked Mike in the last 7 days — the honest "if converted"
        // base: people the product is actively working for who aren't paying yet.
        // beta/admin house accounts are excluded by construction (trial/founder only).
        const unpaidIds = new Set([...unpaidTrial, ...unpaidFounder].map(u => u.id));
        const asked = await supabase('GET', 'events', null,
          `?type=eq.mike_ask&created_at=gte.${new Date(now - 7 * 86400000).toISOString()}&select=user_id&limit=10000`);
        if (Array.isArray(asked)) {
          const activeIds = new Set(asked.map(e => e.user_id).filter(Boolean));
          weeklyActiveUnpaid = [...activeIds].filter(id => unpaidIds.has(id)).length;
        }
      }
    } catch (e) {
      console.error('hq/money db slice failed (non-fatal):', e.message);
    }
  }

  // Simple honest forecast: what's booked now + what converts if every unpaid tech who
  // actually used Mike this week adds a card. Labeled "if converted" — a target, not revenue.
  const forecast = {
    mrrNow: stripeSlice ? stripeSlice.mrr : null,
    weeklyActiveUnpaid,
    // Real-MRR base + the unpaid-active techs at $50 — never active_subs*assumed-price,
    // which double-counted against the mrrNow field beside it (Jordan, 2026-11-03).
    ifConverted: (weeklyActiveUnpaid != null)
      ? (stripeSlice ? stripeSlice.mrr : 0) + weeklyActiveUnpaid * PRICE
      : null,
  };

  res.json({ price: PRICE, stripe: stripeSlice, db: dbSlice, forecast });
});

// ── TTS ───────────────────────────────────────────────────────────────────────
// Auth + rate-limited: token comes from body (existing frontend pattern, same as /api/ai)
// or Authorization: Bearer header. authenticateToken reads both. (Security fix C3.)
// requireVoiceAccess (not requirePaidAccess): paying accounts pass as before;
// a brand-new account gets a small lifetime allowance so ONBOARDING speaks in Mike's
// real voice instead of falling back to the browser robot. See the middleware comment.
// ── ONBOARDING VOICE FOR VISITORS WITHOUT AN ACCOUNT ────────────────────────────
// The cinematic first-run plays BEFORE anyone signs up, but /api/tts sat behind
// authenticateToken — so a cold visitor got 401 and the client fell back to
// speakObBrowser(), the phone's built-in synthesiser. The first eight seconds of the
// product, the part that actually sells it, was a robot reading Mike's lines. There is
// already a note in this file about catching exactly this on a signup in August; that
// fix covered signed-in-but-unpaid users and never covered signed-OUT visitors at all.
//
// The allowlist is EXTRACTED FROM public/index.html AT STARTUP rather than copied here.
// 64 lines across six languages would drift the moment Edwin rewrites a line, and stale
// audio that no longer matches the words on screen is worse than the robot. One source
// of truth: change the copy, the allowlist follows on the next deploy.
//
// Why an allowlist and not simply "allow anonymous TTS": this endpoint spends real money
// at ElevenLabs. Matched against a fixed script, the worst an abuser can do is make Mike
// say his own onboarding lines — no arbitrary text, so the bill cannot be run up.
const _OB_VOICE_LINES = (() => {
  try {
    const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
    const start = html.search(/var OB_I18N\s*=/);
    if (start < 0) return new Set();
    let i = html.indexOf('{', start), depth = 0, j = i;
    for (; j < html.length; j++) {
      if (html[j] === '{') depth++;
      else if (html[j] === '}' && --depth === 0) break;
    }
    const block = html.slice(i, j + 1);
    const out = new Set();
    const re = /voice\s*:\s*(['"`])((?:\\.|(?!\1).)*)\1/gs;
    let m;
    while ((m = re.exec(block))) {
      const line = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, ' ').trim();
      if (line) out.add(line);
    }
    return out;
  } catch (e) {
    console.error('onboarding voice allowlist failed to build:', e.message);
    return new Set();
  }
})();
console.log(`Onboarding voice: ${_OB_VOICE_LINES.size} lines playable without an account`);

// Tighter than ttsLimiter: a real first-run is ~7 lines. 30/15min per IP leaves room to
// replay it a few times and still caps a scripted caller hard.
const obVoiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Voice rate limit exceeded — please wait a moment' },
});

// Runs BEFORE authenticateToken. Only an exact match on a known onboarding line skips
// auth; everything else falls through to the normal gate untouched.
function allowOnboardingVoice(req, res, next) {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  const hasToken = !!(req.headers['authorization'] || req.body?.token);
  if (!hasToken && text && _OB_VOICE_LINES.has(text)) {
    req._obVoice = true;
    return obVoiceLimiter(req, res, next);
  }
  return next();
}

app.post('/api/tts', ttsLimiter, allowOnboardingVoice,
  (req, res, next) => (req._obVoice ? next() : authenticateToken(req, res, next)),
  (req, res, next) => (req._obVoice ? next() : requireVoiceAccess(req, res, next)),
  async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });
  if (!ELEVENLABS_API_KEY) return res.status(503).json({ error: 'TTS not configured' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text.substring(0, 5000),
          model_id: 'eleven_flash_v2_5',
          voice_settings: { stability: 0.50, similarity_boost: 0.80, style: 0.20, use_speaker_boost: true, speed: 0.9 },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      console.warn('ElevenLabs error:', response.status, err.substring(0, 100));
      return res.status(502).json({ error: 'TTS failed' });
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    if (audioBuffer.length < 500) return res.status(502).json({ error: 'Empty audio response' });

    res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': audioBuffer.length, 'Cache-Control': 'no-store' });
    res.send(audioBuffer);

  } catch (err) {
    if (err.name === 'AbortError') res.status(504).json({ error: 'TTS timed out' });
    else { console.error('TTS error:', err.message); res.status(502).json({ error: 'TTS unavailable' }); }
  } finally {
    clearTimeout(timeout);
  }
});

// ── /api/transcribe ───────────────────────────────────────────────────────────
// The locked/pocket leg of a Mike voice call. On-device Whisper is fast and private and
// carries the whole SCREEN-ON conversation; the instant the screen locks, iOS refuses to
// run the Neural Engine for a backgrounded app, so the native ear POSTs its captured audio
// window here and we transcribe it in the cloud (which a locked app IS allowed to reach over
// the network). Same paid-voice gate as /api/tts — this is part of the call, not a new
// surface. Groq Whisper (whisper-large-v3-turbo): ~216x realtime, ~$0.04/hr of audio.
const transcribeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,                 // a locked call flushes a turn every few seconds; generous
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many transcription requests — slow down.' },
});
app.post('/api/transcribe', transcribeLimiter,
  (req, res, next) => authenticateToken(req, res, next),
  (req, res, next) => requireVoiceAccess(req, res, next),
  async (req, res) => {
  if (!GROQ_API_KEY) return res.status(503).json({ error: 'Transcription not configured' });
  // Audio arrives as base64 (wav/mono/16k from the native ear). Keep the cap tight — a
  // single conversational turn is well under a megabyte; anything larger is not a turn.
  const b64 = req.body?.audio;
  if (!b64 || typeof b64 !== 'string') return res.status(400).json({ error: 'audio required' });
  let buf;
  try { buf = Buffer.from(b64, 'base64'); } catch (_) { return res.status(400).json({ error: 'audio not base64' }); }
  if (!buf.length || buf.length > 8 * 1024 * 1024) return res.status(400).json({ error: 'audio empty or too large' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    // Node 18+ has global FormData/Blob/fetch — no SDK, same posture as the rest of the file.
    const form = new FormData();
    form.append('file', new Blob([buf], { type: 'audio/wav' }), 'turn.wav');
    form.append('model', 'whisper-large-v3-turbo');
    form.append('language', 'en');            // Mike's techs are English; skips lang-detect latency
    form.append('response_format', 'json');
    form.append('temperature', '0');
    const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: form,
      signal: controller.signal,
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('Groq STT error:', r.status, detail.slice(0, 200));
      return res.status(502).json({ error: 'Transcription unavailable' });
    }
    const j = await r.json();
    const text = (j && typeof j.text === 'string') ? j.text.trim() : '';
    return res.json({ text });
  } catch (err) {
    if (err.name === 'AbortError') return res.status(504).json({ error: 'Transcription timed out' });
    console.error('Transcribe error:', err.message);
    return res.status(502).json({ error: 'Transcription unavailable' });
  } finally {
    clearTimeout(timeout);
  }
});

// ── PRIVACY POLICY ────────────────────────────────────────────────────────────
// Required by both the App Store and Google Play (a live, public privacy-policy URL).
// Self-contained so it renders even if the SPA is mid-deploy. Covers every third party the
// app touches + the in-app account/data deletion (Guideline 5.1.1(v)). Registered before the
// SPA catch-all so /privacy serves this, not index.html.
app.get('/privacy', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Privacy Policy · Mike by Trazer Intelligence</title>
<style>body{font:16px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:0 auto;padding:32px 20px;color:#1a1a1a;background:#fff}h1{font-size:26px}h2{font-size:18px;margin-top:28px}a{color:#0a7d78}small{color:#666}</style>
</head><body>
<h1>Privacy Policy — Mike</h1>
<small>Trazer Intelligence · Effective July 25, 2026</small>
<p>Mike is an AI assistant for HVAC technicians and contracting companies. This policy explains what we collect, why, and the choices you have. We do <strong>not</strong> sell your data and we do <strong>not</strong> use it for advertising or cross-app tracking.</p>
<h2>Information we collect</h2>
<ul>
<li><strong>Account info</strong> — your name, email, and (optionally) company name, to create and secure your account.</li>
<li><strong>Content you provide</strong> — messages, questions, photos of equipment/nameplates/wiring diagrams, and job or customer notes you choose to enter, so Mike can help you diagnose and document work.</li>
<li><strong>Usage data</strong> — which features you use and basic interaction events, to operate the product and improve it. This is product analytics, not ad tracking.</li>
<li><strong>Billing</strong> — if you subscribe, payments are processed by Stripe on the web. We store your plan status and Stripe identifiers; we never see or store your full card number.</li>
</ul>
<h2>Service providers we share with (only to run Mike)</h2>
<ul>
<li><strong>Anthropic</strong> — powers Mike's answers (your questions/photos are sent to generate a response).</li>
<li><strong>ElevenLabs</strong> — generates Mike's voice from text.</li>
<li><strong>Supabase</strong> — secure database + storage for your account and content.</li>
<li><strong>Stripe</strong> — subscription billing (web only).</li>
<li><strong>Resend</strong> — transactional email (e.g. password reset).</li>
</ul>
<p>These providers process data only to deliver their part of the service and under their own security and privacy terms.</p>
<h2>How we use your information</h2>
<p>To provide and secure Mike, answer your questions, remember your context across a job, process subscriptions, send account emails, and improve reliability and accuracy. We do not sell personal information or use it for third-party advertising.</p>
<h2>Data retention &amp; deletion</h2>
<p>We keep your data while your account is active. You can <strong>delete your account and personal data at any time from inside the app</strong> (Account → Delete Account) or by emailing us. Deletion is permanent and also cancels any active subscription. Shared, non-personal reference material (e.g. anonymized equipment diagrams) may be retained.</p>
<h2>Security</h2>
<p>Passwords are hashed (bcrypt), sessions use signed tokens, traffic is encrypted in transit (HTTPS), and access to production data is restricted.</p>
<h2>Children</h2>
<p>Mike is a professional tool not directed to children under 13, and we do not knowingly collect their data.</p>
<h2>Contact</h2>
<p>Questions or requests: <a href="mailto:venturabv12@gmail.com">venturabv12@gmail.com</a>, Trazer Intelligence, Manassas Park, VA.</p>
<p><small>We may update this policy; material changes will be posted here with a new effective date.</small></p>
</body></html>`);
});

// ── SPA FALLBACK ──────────────────────────────────────────────────────────────
// events.user_id is NOT NULL, so a report from a signed-out phone — or one whose token
// just expired, which is precisely the device most likely to be failing — was silently
// dropped on insert. Anonymous reports get filed under the system account and flagged
// anon:true so they are still visible and still distinguishable from a known tech.
let _sysOwnerId = null;
async function systemOwnerId() {
  if (_sysOwnerId) return _sysOwnerId;
  try {
    const rows = await supabase('GET', 'users', null, '?select=id&role=eq.admin&limit=1');
    _sysOwnerId = (rows && rows[0] && rows[0].id) || null;
  } catch (_) {}
  return _sysOwnerId;
}

// ── THE FREE FIRST ANSWER ─────────────────────────────────────────────────────
// 476 visitors a week reach trazermike.io and 1 signs up. The onboarding shows a
// STATIC mockup of Mike answering — a screenshot of the product, not the product —
// and a tech can smell that. Meanwhile the app's own copy already promises "first
// answer's on the house". This makes that literally true: one real question, one
// real answer from the real Mike, then the account wall.
//
// A tech who has watched Mike correctly call a humming compressor has a reason to
// sign up. A tech looking at a logo has a promise, and techs do not trust promises
// from software.
//
// Bounded hard, because this is the one unauthenticated path to the model:
//   · ONE answer per device per day, keyed on the same visitor hash analytics uses
//   · short answers only, no web search, no manual retrieval
//   · goes through the SAME safety/pricing guard as every other reply — a homeowner
//     still never sees a price here
// Brandon, 2026-08-29: ten questions before the wall, not one. One answer proves
// nothing — a tech's first message is usually a clarifier, so the wall was landing
// before Mike had done anything worth paying for. 513 visitors produced 9 signups and
// 0 paying customers, and none of them ever saw the product work.
const FREE_TASTE_PER_DAY = Number(process.env.FREE_TASTE_PER_DAY || 10);
const _tasteUsed = new Map();   // per-instance fallback only (used when Supabase is down)

// SHARED, DEPLOY-PROOF free-question counter.
// The old version lived in a per-instance Map. Prod runs MULTIPLE replicas, so the count
// never accumulated (requests round-robin across instances) and every deploy wiped it —
// the free cap effectively never enforced. Verified 2026-09-11: /api/taste/left flapped
// 2<->1 across replicas and three taste questions all answered. A signed-out visitor could
// keep asking (close/reopen the app resets the CLIENT gate; the server never really stopped
// them). Root-caused by Rodolfo via Brandon.
// Source of truth is now ONE events row per (visitorHash, day), owned by the admin account,
// company '__system', type 'taste_usage' — the same shared-storage pattern the traffic
// counter already uses, so NO schema change. Fail-open on a DB error: this gates only the
// free DEMO, and blocking a real visitor because Supabase hiccuped is worse than leaking a
// single taste question.
async function tasteAllowance(req) {
  const day = new Date().toISOString().slice(0, 10);
  const key = _tasteKey(req);
  try {
    const rows = await supabase('GET', 'events', null,
      `?type=eq.taste_usage&select=id,payload&payload->>h=eq.${key}&payload->>d=eq.${day}&limit=1`);
    if (Array.isArray(rows)) {
      const used = (rows[0] && rows[0].payload && Number(rows[0].payload.c)) || 0;
      return { key, day, used, left: Math.max(0, FREE_TASTE_PER_DAY - used), rowId: rows[0] && rows[0].id };
    }
  } catch (_) { /* fall through to memory */ }
  const cur = _tasteUsed.get(key);
  const used = (cur && cur.day === day) ? cur.count : 0;
  return { key, day, used, left: Math.max(0, FREE_TASTE_PER_DAY - used) };
}
async function tasteConsume(req, allow) {
  const { key, day, used, rowId } = allow;
  // Always bump the local fallback so a DB outage still counts within an instance.
  _tasteUsed.set(key, { day, count: used + 1 });
  if (_tasteUsed.size > 20000) _tasteUsed.delete(_tasteUsed.keys().next().value);
  try {
    const uid = await _adminUserId();
    if (!uid) return;
    if (rowId) {
      await supabase('PATCH', 'events', { payload: { h: key, d: day, c: used + 1 } },
        `?id=eq.${encodeURIComponent(rowId)}`);
    } else {
      await supabase('POST', 'events',
        { user_id: uid, type: 'taste_usage', company: '__system', payload: { h: key, d: day, c: 1 } });
    }
  } catch (_) { /* fail-open: the free demo must never hard-block on a DB blip */ }
}

// Lets the front door ask "does this visitor still have their free answer?" without
// spending it, so the UI can show the wall instead of a dead send button.
app.get('/api/taste/left', async (req, res) => {
  try { res.json({ ok: true, left: (await tasteAllowance(req)).left }); }
  catch (_) { res.json({ ok: true, left: FREE_TASTE_PER_DAY }); }
});

// ── FIELD WATCH — the phone reports what the server cannot see ────────────────
// 2026-08-26: a tech asked Mike twice and saw nothing both times. Every server-side
// signal said SUCCESS — health green, no 5xx, and the events table shows a mike_answer
// logged for BOTH of his questions. The answers were generated and delivered; his
// browser threw them away. The uptime watchdog pinged /api/health 76,000 times through
// it and reported "up".
//
// That is the whole lesson: uptime is not the product. A tech getting his answer is the
// product, and only his phone knows whether that happened. So the phone tells us.
//
// Deliberately cheap and unblocking: fire-and-forget from the client, bounded payloads,
// rate limited, no message text and no customer data — a failure signature, not a
// transcript. If this endpoint disappeared entirely Mike would be unaffected.
const watchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,                       // a genuinely broken phone loops; don't let it flood
  standardHeaders: true, legacyHeaders: false,
  message: { ok: false },
});

app.post('/api/client-error', watchLimiter, async (req, res) => {
  // Always 204 — a reporting endpoint must never become a source of errors itself,
  // and the client must never wait on it.
  res.status(204).end();
  try {
    const b = req.body || {};
    const clip = (v, n) => (v == null ? null : String(v).slice(0, n));
    const kind = clip(b.kind, 40);
    if (!kind) return;

    // Identify the tech only if their token is valid. Never trust a claimed id.
    let uid = null;
    try {
      const t = b.token || (req.headers.authorization || '').replace(/^Bearer /, '');
      if (t) uid = (jwt.verify(t, JWT_SECRET) || {}).id || null;
    } catch (_) {}

    const payload = {
      kind,                                   // no_answer | js_error | promise_rejection | api_error
      detail: clip(b.detail, 300),            // message/signature only
      where: clip(b.where, 120),              // file:line or a named flow
      waitedMs: Number(b.waitedMs) || null,   // how long the tech stared at nothing
      ua: clip(req.headers['user-agent'], 180),
      online: b.online === false ? false : true,
      build: clip(b.build, 40),
    };
    if (!uid) { uid = await systemOwnerId(); payload.anon = true; }
    if (!uid) { console.warn('[field-watch] dropped — no owner available'); return; }
    const wrote = await supabase('POST', 'events',
      { user_id: uid, type: 'client_error', payload }, '');
    if (wrote === null) console.error('[field-watch] STORE FAILED — a real failure went unrecorded');
    console.warn(`[field-watch] ${kind} — ${payload.detail || ''} (${payload.where || 'n/a'})`);
  } catch (e) {
    console.error('client-error log failed (non-fatal):', e.message);
  }
});

// What is actually breaking in the field, grouped so a pattern is obvious at a glance.
app.get('/api/admin/incidents', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const hours = Math.min(parseInt(req.query.hours || '24', 10) || 24, 24 * 30);
    const since = new Date(Date.now() - hours * 3600000).toISOString();
    const _rawRows = await supabase('GET', 'events', null,
      `?select=user_id,payload,created_at&type=eq.client_error&created_at=gte.${since}&order=created_at.desc&limit=1000`) || [];

    // MY OWN TESTING IS NOT A TECHNICIAN IN TROUBLE. Testing a failure path on production
    // writes real client_error rows, and on 2026-09-01 a deliberate network-kill test made
    // this page report TWO technicians affected when one — Jay — was real. An alarm that
    // counts the person holding the alarm is how a monitor gets ignored.
    const _house = await supabase('GET', 'users', null,
      '?select=id,email,company&limit=500') || [];
    const HOUSE_EMAIL = /^(trazertest\+|qa@|qa-crew@|test@)|@trazer\.test$|^venturabv12@gmail\.com$/i;
    const HOUSE_ID = new Set(['7725dfff-9e37-4eb9-a2cd-5d8c547fbeb3', '8c63d02a-e2cc-4401-b457-74d98c8752bd']);
    const houseIds = new Set(_house
      .filter(u => u && (HOUSE_ID.has(u.id) || (u.email && HOUSE_EMAIL.test(u.email)) || /\b(qa|internal|test)\b/i.test(String(u.company || ''))))
      .map(u => u.id));
    const rows = _rawRows.filter(r => !houseIds.has(r && r.user_id));

    // Failures only. A success event landing here (a 'free answer delivered' telemetry
    // ping did, on day one) makes the incident list noisy, and a noisy alarm is one
    // nobody reads — which is the exact failure this system exists to prevent.
    const FAILURE_KINDS = new Set(['no_answer', 'js_error', 'promise_rejection', 'api_error']);
    const groups = {};
    for (const r of rows) {
      const p = r.payload || {};
      if (!FAILURE_KINDS.has(p.kind)) continue;
      const key = `${p.kind}|${(p.detail || '').slice(0, 80)}`;
      const g = groups[key] || (groups[key] = {
        kind: p.kind, detail: p.detail, where: p.where,
        count: 0, anon: 0, techs: new Set(), first: r.created_at, last: r.created_at,
      });
      g.count++;
      // An anonymous report is a real failure but not an identified tech — counting the
      // shared system account as "a tech" would make one signed-out phone look like a
      // fleet-wide outage.
      if (p.anon) g.anon++;
      else if (r.user_id) g.techs.add(r.user_id);
      if (r.created_at < g.first) g.first = r.created_at;
      if (r.created_at > g.last) g.last = r.created_at;
    }
    const incidents = Object.values(groups)
      .map(g => ({ ...g, techsAffected: g.techs.size, techs: undefined }))
      .sort((a, b) => b.techsAffected - a.techsAffected || b.count - a.count);

    res.json({
      ok: true, hours,
      totalReports: rows.filter(r => FAILURE_KINDS.has((r.payload || {}).kind)).length,
      techsAffected: new Set(rows.filter(r => FAILURE_KINDS.has((r.payload || {}).kind) && !(r.payload || {}).anon).map(r => r.user_id).filter(Boolean)).size,
      anonymousReports: rows.filter(r => FAILURE_KINDS.has((r.payload || {}).kind) && (r.payload || {}).anon).length,
      incidents,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Force a field-alert check on demand. ?dry=1 finds problems without emailing.
app.post('/api/admin/alert-check', authenticateToken, requireAdmin, async (req, res) => {
  try { res.json({ ok: true, result: await fieldAlert.checkOnce({ dryRun: req.query.dry === '1' }) }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/admin/digest', authenticateToken, requireAdmin, async (req, res) => {
  try { res.json({ ok: true, result: await dailyDigest.sendOnce({ dryRun: req.query.dry === '1' }) }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── WHAT MIKE LEARNED ─────────────────────────────────────────────────────────
// The receipt behind "Mike gets new information every day and keeps it". Admin-only:
// it reports the fleet the techs are actually asking about, which is competitive
// information about how the company runs, not just product telemetry.
app.get('/api/admin/learning', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const rows = await supabase('GET', 'events',
      null, `?select=payload,created_at&type=eq.learned_manuals&created_at=gte.${since}&order=created_at.desc&limit=60`);
    const openGaps = await nightlyLearn.findGaps().catch(() => []);
    res.json({
      ok: true,
      lastRun: nightlyLearn.status(),
      running: nightlyLearn.isRunning(),
      openGaps: (openGaps || []).map(g => ({ brand: g.brand, model: g.model, techsAsked: g.hits })),
      history: (rows || []).map(r => ({ at: r.created_at, learned: (r.payload && r.payload.learned) || [] })),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Manual trigger — so a night's work can be demonstrated on demand instead of
// waiting for 3am. `?dry=1` finds and verifies documents without writing any.
app.post('/api/admin/learning/run', authenticateToken, requireAdmin, async (req, res) => {
  if (nightlyLearn.isRunning()) return res.status(409).json({ ok: false, error: 'already running' });
  try { res.json({ ok: true, result: await nightlyLearn.runOnce({ dryRun: req.query.dry === '1' }) }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── "3 DAYS LEFT" TRIAL REMINDER SWEEP ────────────────────────────────────────
// Stripe used to send this off customer.subscription.trial_will_end. That event can no
// longer fire — the free window moved in-app (no Stripe trial, no subscription until the
// tech actually pays), so the reminder has to come from us or nobody gets warned at all.
//
// Fires once per account when 3 days remain. Idempotent via features.trial_reminder_sent,
// so re-running the sweep — or a redeploy — can't re-mail the same tech. Send happens
// BEFORE the stamp on purpose: a Resend failure leaves the flag unset so the next sweep
// retries, and the 11→14 day window gives it several attempts before it matters.
const TRIAL_REMINDER_DAYS_LEFT = 3;
const TRIAL_SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000;   // every 6h — 12 shots at a 3-day window

async function sendTrialReminders() {
  if (!SUPABASE_URL) return;
  const now = Date.now();
  const windowOpens = new Date(now - (TRIAL_DAYS - TRIAL_REMINDER_DAYS_LEFT) * 86400000).toISOString();
  const windowCloses = new Date(now - TRIAL_DAYS * 86400000).toISOString();

  try {
    // trial_start older than day 11 but not yet past day 14 = exactly the 3-days-left band.
    const due = await supabase('GET', 'users', null,
      `?plan=eq.trial&trial_start=lte.${encodeURIComponent(windowOpens)}` +
      `&trial_start=gt.${encodeURIComponent(windowCloses)}` +
      `&select=id,name,email,trial_start,features,stripe_subscription_id`);

    if (!due || !due.length) return;

    for (const u of due) {
      if (u.stripe_subscription_id) continue;             // already paying — nothing to warn about
      if (u.features && u.features.trial_reminder_sent) continue;

      const daysLeft = Math.max(1, Math.ceil(
        (new Date(u.trial_start).getTime() + TRIAL_DAYS * 86400000 - now) / 86400000));
      const firstName = (u.name || '').trim().split(' ')[0] || 'there';

      const dayWord = daysLeft === 1 ? 'day' : 'days';   // retries can land on "1 day left"

      const sent = await sendEmail({
        to: u.email,
        subject: `${daysLeft} ${dayWord} left on your free trial`,
        html: `<p>${firstName} — you've got <strong>${daysLeft} ${dayWord}</strong> left of Mike on the house.</p>
               <p>After that, keeping him is <strong>$50/mo</strong>. Cancel whenever.</p>
               <p><strong>Nothing happens automatically.</strong> We don't have a card for you, so you
               won't be charged a cent — Mike just stops answering until you add one.</p>
               <p><a href="${APP_URL}">Keep Mike in your pocket →</a></p>
               <p>— Mike @ Trazer</p>`,
      });

      if (!sent) continue;                                // leave unstamped; next sweep retries

      await supabase('PATCH', 'users',
        { features: { ...(u.features || {}), trial_reminder_sent: true } },
        `?id=eq.${encodeURIComponent(u.id)}`);
      console.log(`Trial reminder sent: ${u.email} (${daysLeft}d left)`);
    }
  } catch (err) {
    // Never let a sweep failure touch request handling — it retries in 6 hours.
    console.error('Trial reminder sweep error:', err.message);
  }
}

// ── BACKGROUND SPENDERS RUN ON RAILWAY ONLY ──────────────────────────────────
// 2026-11-03, Brandon's direct order after a -$56 credit burn: three leaked LOCAL
// test boots (started for verification, orphaned when their ports were reclaimed)
// ran the nightly manual-learner, the field-alert sweep and the trial-reminder
// sweep for two days on the production API key. The schedulers below spend money
// (model calls, web searches) or send email, so a boot that is not actually the
// Railway deployment must never start them. The gate variable is
// RAILWAY_GIT_COMMIT_SHA — set ONLY on real Railway deploys. (NOT
// RAILWAY_ENVIRONMENT: `railway run` injects that into LOCAL shells too, which
// is exactly how the burning boots were started — verified 2026-11-03.) A
// deliberate local test can opt in with ALLOW_LOCAL_SCHEDULERS=1 and owns the
// spend it causes.
const RUN_SCHEDULERS = !!process.env.RAILWAY_GIT_COMMIT_SHA || process.env.ALLOW_LOCAL_SCHEDULERS === '1';
// A Railway boot that fails the gate is an ANOMALY, not a local boot — scream, don't smile.
// (RAILWAY_ENVIRONMENT present without a commit sha = image-based deploy or platform change;
// trial reminders/learner/digest would silently die on prod otherwise.)
if (!RUN_SCHEDULERS && process.env.RAILWAY_ENVIRONMENT)
  console.error('[schedulers] ANOMALY: Railway environment detected but RAILWAY_GIT_COMMIT_SHA is unset — background jobs DISABLED on what looks like a real deploy. Investigate immediately.');
if (RUN_SCHEDULERS) {
  setInterval(sendTrialReminders, TRIAL_SWEEP_INTERVAL_MS);
  setTimeout(sendTrialReminders, 60000);   // once a minute after boot, not during cold start
} else {
  console.log('[schedulers] local boot — trial-reminder sweep NOT started (spend/email guard)');
}

// ── NEVER CRASH ───────────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => { console.error('UNCAUGHT EXCEPTION — staying alive:', err.message); });
process.on('unhandledRejection', (reason) => { console.error('UNHANDLED REJECTION — staying alive:', reason); });

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  if (RUN_SCHEDULERS) {
    try { nightlyLearn.start(); } catch (e) { console.error('learn scheduler failed (non-fatal):', e.message); }
    try { fieldAlert.start(); } catch (e) { console.error('field alert failed (non-fatal):', e.message); }
    try { dailyDigest.start(); } catch (e) { console.error('daily digest failed (non-fatal):', e.message); }
  } else {
    console.log('[schedulers] local boot — learner/field-alert/digest NOT started (spend guard)');
  }
  console.log(`Trazer Intelligence running on port ${PORT}`);
  console.log(`AI: ${ANTHROPIC_API_KEY?'ready':'MISSING'} | TTS: ${ELEVENLABS_API_KEY?'ready':'not set'} | DB: ${SUPABASE_URL?'ready':'not set'} | Billing: ${STRIPE_SECRET_KEY?'ready':'not set'}`);
});
