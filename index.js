'use strict';

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');

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
// EXISTING/founding techs are grandfathered: any account created before CARD_WALL_CUTOFF
// is never walled (belt-and-suspenders with the explicit plan='founder' backfill).
// The cutoff is env-overridable so it can be set to the exact prod-deploy instant at ship.
const TRIAL_DAYS = 14;
// Time-based grandfather safety net. MUST default to a PAST instant so an unset/forgotten env
// can never future-date the window and let fresh signups slip through the wall (a leak the crew
// caught). At ship, override CARD_WALL_CUTOFF to the exact prod-deploy instant. The PRIMARY
// grandfather protection is the explicit plan='founder' backfill (scripts/grandfather-founders.js),
// which flips every existing account regardless of date — this cutoff is only the belt-and-suspenders.
const CARD_WALL_CUTOFF = process.env.CARD_WALL_CUTOFF || '2026-07-24T00:00:00Z';
const CARD_WALL_CUTOFF_MS = new Date(CARD_WALL_CUTOFF).getTime();
// Plans that always have access (paying + legacy/grandfathered free). 'founder' = the
// grandfathered founding techs; 'beta' = pre-Phase-1 legacy; 'homeowner' = revivable legacy.
const ALLOWED_PLANS = ['admin', 'pro', 'team', 'starter', 'founder', 'beta', 'homeowner'];

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
// Payload: { id, email } — minimal surface area.
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d', algorithm: 'HS256' }
  );
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
    if (!admins || !admins[0] || admins[0].role !== 'admin')
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
    const u = rows && rows[0];
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
        from: 'Trazer Intelligence <noreply@trazerintelligence.com>',
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
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) return res.json({ok:true});
  
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
      
      if (email && SUPABASE_URL) {
        // Update user plan in database
        await supabase('PATCH', 'users', {
          plan,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan_started_at: new Date().toISOString(),
        }, `?email=eq.${encodeURIComponent(email)}`);
        console.log(`Plan activated: ${email} → ${plan}`);
      }
    }
    
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      // Downgrade to trial/free when subscription cancelled
      if (SUPABASE_URL) {
        await supabase('PATCH', 'users', {
          plan: 'trial',
          stripe_subscription_id: null,
        }, `?stripe_subscription_id=eq.${sub.id}`);
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
                 <p>Nothing to do: you'll be charged <strong>$100/mo</strong> and keep full access to Mike.
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
          html: `<p>We couldn’t process your $100/mo payment. No worries — your access to Mike is still on
                 while we retry over the next few days.</p>
                 <p>Please update your card to avoid any interruption: <a href="${APP_URL}">open Mike</a> → Account → Billing.</p>
                 <p>— Mike @ Trazer</p>`,
        });
      }
    }
  } catch(err) {
    console.error('Webhook handler error:', err.message);
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
const _traffic = { day: null, views: 0, uniques: new Set(), refs: {}, paths: {}, rowId: null };
let _adminIdCache = null;

// Days are bucketed in EASTERN time, not UTC. Brandon reads these numbers, and a UTC
// day rolls over at 8pm his time — "Today" would appear to reset mid-evening.
// en-CA formats as YYYY-MM-DD; the timeZone option handles DST by itself.
const _ET_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' });
function _dayET(d) { return _ET_DAY.format(d instanceof Date ? d : new Date(d)); }
function _today() { return _dayET(new Date()); }

function _visitorHash(req) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';
  const ua = req.headers['user-agent'] || '';
  return crypto.createHmac('sha256', JWT_SECRET).update(ip + '|' + ua).digest('hex').slice(0, 16);
}

function _rollDay() {
  const d = _today();
  if (_traffic.day !== d) {
    _traffic.day = d; _traffic.views = 0; _traffic.uniques = new Set();
    _traffic.refs = {}; _traffic.paths = {}; _traffic.rowId = null;
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
    const payload = {
      date: _traffic.day,
      views: _traffic.views,
      uniques: _traffic.uniques.size,
      refs: _traffic.refs,
      paths: _traffic.paths,
    };
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
  res.json({
    ok: true,
    activeRequests: globalActive,
    uptime: Math.floor(process.uptime()),
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
        // so this charges today. Grandfathered/founder accounts never reach this route.
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

app.post('/api/jobs', authenticateToken, async (req, res) => {
  const fields = { ...req.body };
  delete fields.user_id; // strip any client-supplied user_id from the body
  const user_id = req.user.id;
  const rows = await supabase('POST', 'jobs', { user_id, ...fields });
  if (!rows || !rows[0]) return res.status(500).json({ error: 'Failed to save job' });
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

  const users = await supabase('GET', 'users', null,
    '?select=id,email,name,plan,created_at,stripe_subscription_id&limit=500') || [];
  const nameById = Object.fromEntries(users.map(u => [u.id, u.name || u.email]));

  // Every date below is an EASTERN calendar day so "Today" matches Brandon's clock.
  const dayKey = d => _dayET(d);
  const today = _today();
  const ago = n => _dayET(new Date(Date.now() - n * 86400000));

  // ---- traffic (daily aggregate rows) ----
  const tRows = rows.filter(r => r.type === 'site_traffic');
  const byDate = {};
  for (const r of tRows) {
    const p = r.payload || {}; const d = p.date || dayKey(r.created_at);
    byDate[d] = { views: p.views || 0, uniques: p.uniques || 0, refs: p.refs || {} };
  }
  const sumRange = days => {
    let v = 0, u = 0; const refs = {};
    for (const [d, x] of Object.entries(byDate)) {
      if (d >= ago(days)) {
        v += x.views; u += x.uniques;
        for (const [k, n] of Object.entries(x.refs)) refs[k] = (refs[k] || 0) + n;
      }
    }
    return { views: v, uniques: u, refs };
  };
  const d7 = sumRange(7), d30 = sumRange(30);

  // ---- Mike usage ----
  const asks = rows.filter(r => r.type === 'mike_ask');
  const perTech = {};
  for (const a of asks) perTech[a.user_id] = (perTech[a.user_id] || 0) + 1;

  const signups30 = users.filter(u => u.created_at && dayKey(u.created_at) >= ago(30)).length;

  // ---- THE FUNNEL ----------------------------------------------------------
  // Endpoint numbers say WHETHER something is wrong; the funnel says WHERE. Each
  // stage carries the drop-off from the stage above it, so the worst leak is
  // obvious at a glance and the team can work the right problem instead of
  // guessing between "not enough traffic" and "they sign up and never use it".
  const PAID_PLANS = ['pro', 'team', 'starter'];
  const askedEver = new Set(asks.map(a => a.user_id));
  const asked7 = new Set(asks.filter(a => dayKey(a.created_at) >= ago(7)).map(a => a.user_id));
  const paying = users.filter(u => u.stripe_subscription_id || PAID_PLANS.includes(u.plan));

  // Time from signup to first question — how long the product takes to prove itself.
  const firstAskByUser = {};
  for (const a of asks) {
    const t = new Date(a.created_at).getTime();
    if (!firstAskByUser[a.user_id] || t < firstAskByUser[a.user_id]) firstAskByUser[a.user_id] = t;
  }
  const ttfa = users
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

  const visitors30 = d30.uniques;
  const funnel = [
    stage('Visited the site', visitors30, null, 'unique visitors, 30d'),
    stage('Created an account', signups30, visitors30, 'the pitch on the page'),
    stage('Actually asked Mike', users.filter(u => askedEver.has(u.id)).length, users.length,
      'onboarding — did they ever get value'),
    stage('Still using it (7d)', asked7.size, users.filter(u => askedEver.has(u.id)).length,
      'retention — does it stick'),
    stage('Paying', paying.length, users.length, 'the ask — have they been asked to pay'),
  ];

  res.json({
    traffic: {
      today: byDate[today] || { views: 0, uniques: 0, refs: {} },
      last7: d7,
      last30: d30,
      daily: Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30)
        .map(([date, x]) => ({ date, views: x.views, uniques: x.uniques })),
      topReferrers: Object.entries(d30.refs).sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([source, hits]) => ({ source, hits })),
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
    funnel,
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
// Allow-set: admin/pro/team/starter/founder/homeowner/beta (forever) + trial (≤TRIAL_DAYS,
// no card required — the card is collected when the window closes, not before).
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

    if (!users || users.length === 0)
      return { allowed: false, reason: 'Account not found' };

    const { plan, trial_start, created_at, stripe_subscription_id } = users[0];

    // Paying + legacy/grandfathered-free plans → always allowed.
    if (ALLOWED_PLANS.includes(plan)) return { allowed: true };

    // GRANDFATHER SAFETY NET: any account created before the card-wall launch is a founding
    // tech — never walled, even if still carrying the legacy 'trial' plan. Belt-and-suspenders
    // with the plan='founder' backfill so a missed row can never lock out an early user.
    if (created_at && new Date(created_at).getTime() < CARD_WALL_CUTOFF_MS)
      return { allowed: true };

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
    if (plan === 'trial') {
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
    return res.status(402).json({ error: access.reason, paywall: access.paywall || false });
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
// Paying/founder accounts are unaffected. Everyone else gets a LIFETIME allowance of
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
    return res.status(402).json({ error: access.reason, paywall: access.paywall || false });

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
  return res.status(402).json({ error: access.reason, paywall: access.paywall || false });
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
    const text = chunks.map(c => `[Source: ${c.doc_title}${c.page_num ? ', p.' + c.page_num : ''}]\n${c.chunk_text}`).join('\n\n---\n\n');
    // Phase 2: surface a wiring-diagram image ONLY when its manual is genuinely for the MODEL the
    // tech asked about. A close-but-wrong-model/technology diagram (an inverter heat-pump print for a
    // single-stage or two-stage AC) is a miswire risk a tech could trust off the card (staging field-
    // test 2026-07-17). Same-doc gating wasn't enough — retrieval can rank a wrong-model manual #1. So
    // match the query's model token against the diagram's doc title (>=4-char family prefix, e.g.
    // GSXC / GSXN / GSZC are treated as DIFFERENT). No model in the query, or no title match -> show
    // NO diagram and let Mike describe the wiring in text (safe). No cross-doc pool fallback.
    const _qKey = ((String(userText).toUpperCase().match(/\b([A-Z]{2,5}\d{1,3}[A-Z0-9]{0,4})\b/) || [])[1] || '').replace(/[^A-Z0-9]/g, '');
    const _modelMatch = (title) => {
      if (_qKey.length < 4) return false;
      const T = String(title || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      for (let n = _qKey.length; n >= 4; n--) if (T.includes(_qKey.slice(0, n))) return true;
      return false;
    };
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
  const access = await checkPaywall(authToken);
  if (!access.allowed)
    return res.status(402).json({ error: access.reason, paywall: access.paywall || false });

  const { messages, system, systemExtra = '', max_tokens = 1024, use_search = false, stream = false } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages required' });

  // Record that a tech asked Mike something. Until now NOTHING logged this, so
  // "how many times is Mike actually used" was unanswerable — the events table only
  // held specific button-presses the frontend chose to send. Fire-and-forget:
  // this must never delay or fail a tech's answer.
  try {
    const _uid = jwt.verify(authToken, JWT_SECRET, { algorithms: ['HS256'] }).id;
    logUsage(_uid, 'mike_ask', { search: !!use_search });
  } catch { /* token already validated by checkPaywall; never block on logging */ }

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
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          return res.end();
        }
        return res.json({ response: _reply });
      }
      // couldn't read it cleanly → let Mike's normal reply handle it (he'll ask for a clearer photo)
    }
  } catch (_e) { console.error('inline diagram redraw (fell through to normal reply):', _e.message); }

  let _safetyLead = '';
  // (A) Burner/flame staying lit with no call for heat = stuck-open gas valve.
  if (/(furnace|burner|flame|unit|heat)[^.]{0,70}(keeps? running|still (running|on|lit|burning)|won'?t (shut|turn) off|stays (on|lit|running))[^.]{0,55}(thermostat|t-?stat|call)/i.test(_lastUser)
      || /(flame|burner)[^.]{0,40}(no call|without a call|no heat call)/i.test(_lastUser)
      || /5[- ]?flash[^.]{0,90}(flame|gas|no call|thermostat (is )?off|keeps? running)/i.test(_lastUser)) {
    _safetyLead = 'SAFETY FIRST — shut the gas off at the appliance shutoff valve right now. A burner staying lit with no call for heat means the gas valve is stuck open; kill the gas before you diagnose anything else.';
  }
  // (B) CO air-free at or above 400 ppm = unconditional appliance shutdown.
  const _coM = _lastUser.match(/(\d{3,4})\s*ppm[^.]{0,24}air[- ]?free/i) || _lastUser.match(/air[- ]?free[^.]{0,24}(\d{3,4})\s*ppm/i);
  if (_coM && parseInt(_coM[1], 10) >= 400) {
    _safetyLead = 'SAFETY FIRST — shut the appliance down now. ' + parseInt(_coM[1], 10) + ' ppm CO air-free is above the 400 ppm threshold; the appliance comes off until you find and correct the cause, then check ambient CO in the occupied space.';
  }
  // (C) Confirmed spillage past 2 minutes under worst-case depressurization.
  if (/spillage[^.]{0,55}(continu|past|over|beyond|exceed|more than|lasting)[^.]{0,16}(2|two)\s*min/i.test(_lastUser)
      || /(2|two)\s*min[^.]{0,26}spillage/i.test(_lastUser)) {
    _safetyLead = 'SAFETY FIRST — shut it down and red-tag it, with written notice to the occupants. Confirmed draft-hood spillage past two minutes under worst-case depressurization is a mandatory shutdown, not a judgment call.';
  }
  // (C2) Tripped flame-rollout switch.
  if (/(flame )?rollout[^.]{0,30}(switch )?(trip|tripp?ed|open|is out|popped)/i.test(_lastUser)) {
    _safetyLead = 'SAFETY FIRST — shut the gas off at the appliance valve, and do NOT reset the rollout switch until you have found the root cause (blocked flue, cracked heat exchanger, dirty or misaligned burners, failed inducer). A tripped rollout means flame left the burner box.';
  }
  // (C3) A2L refrigerant release/leak — ignition sources FIRST, then ventilate.
  if (/(a2l|r-?454b|r-?32|r-?1234yf|r-?466a)[^.]{0,45}(leak|release|spray|venting|escap|discharg)/i.test(_lastUser)
      || /(refrigerant|charge)[^.]{0,30}(leak|release|spray|venting|escap)[^.]{0,45}(a2l|r-?454b|r-?32|flammab)/i.test(_lastUser)) {
    _safetyLead = 'SAFETY FIRST — eliminate every ignition source first: no light switches, no open flame, no sparking tools in the area. THEN ventilate and clear the space. A2L refrigerant is mildly flammable, so ignition control comes before anything else.';
  }
  // (C4) MEDICAL EMERGENCY — an occupant is incapacitated (suspected CO or otherwise).
  // Highest-priority lead: a downed person is 911-first, before ANY equipment work, and
  // Mike must stay the HVAC tech (instruct + get help moving) — NOT play paramedic. Placed
  // last in the _safetyLead chain so it overrides equipment leads when a person is down.
  const _personDown =
    /\b(occupant|someone|somebody|person|people|homeowner|customer|tenant|resident|man|woman|lady|child|kid|baby|elderly|guy|she|he|they)\b[^.]{0,70}(unconscious|passed out|won'?t wake|unresponsive|collapsed|slurring|slurred|can barely (answer|respond|stand|talk|keep)|barely (conscious|awake|responsive|standing)|disorient|seizure|convuls|not making sense|cherry[- ]?red|blue lips|throwing up|vomit)/i.test(_lastUser)
    || /\b(unconscious|passed out|unresponsive|barely conscious|having a seizure|convulsing|won'?t wake up)\b/i.test(_lastUser)
    || /(confused|slurring|disorient|dizzy|nause|headache|throwing up|vomit)[^.]{0,45}(possible |suspect|maybe |might be )?(co\b|carbon monoxide|poison)/i.test(_lastUser)
    || /(co\b|carbon monoxide)[^.]{0,45}(confused|slurring|disorient|unconscious|passed out|vomit|barely|can'?t stay awake|drowsy)/i.test(_lastUser);
  if (_personDown) {
    _safetyLead = 'CALL 911 IMMEDIATELY — before anything else. If you can do it safely, get the person out into fresh air, then call 911 and tell them suspected carbon monoxide poisoning. Do NOT stop to diagnose the equipment — this is a medical emergency and life safety comes first. You are the tech here, not the medic: your job right now is to get 911 moving and get everyone into fresh air. Don\'t re-enter a space you suspect is full of CO without the fire department and proper protection.';
  }
  // (D) Inverter / variable-speed fault work = lethal stored DC.
  let _inverterWarn = '';
  if (/(inverter|variable[- ]?speed|25vna|24vna|vrv|vrf|mini[- ]?split|modulating heat pump)/i.test(_lastUser)
      && /(fault|error|code|not running|won'?t (start|run)|no (heat|cool)|diagnos)/i.test(_lastUser)) {
    _inverterWarn = 'SAFETY — this is an inverter-drive unit; it stores lethal DC voltage after shutoff. Wait a full 5 minutes after killing power and confirm the DC bus is under 50 VDC with a meter before opening the inverter compartment.';
  }
  // (D2) Capacitor work = lethal stored charge. Run/start caps hold 370-440V even
  // with power off; "bulging cap, can I leave it?" must lead with discharge protocol,
  // not generic-electronics advice. Guard, because prompt-only failed re-cert.
  let _capacitorWarn = '';
  if (/(capacitor|\bcaps?\b|dual[- ]?run|run cap|start cap|hard start)/i.test(_lastUser)
      && /(bulg|swollen|swell|leak|fail|bad|blown|burst|rupture|replace|chang|swap|test|check|touch|discharg|pull|remov|leave it|leave for now|leave that|still good|how do i)/i.test(_lastUser)) {
    _capacitorWarn = 'SAFETY — a run or start capacitor holds a lethal charge even with the power off. Kill the disconnect AND the breaker, then discharge the capacitor (bleed it across a ~20k ohm resistor across each terminal pair — never short the terminals with a screwdriver, which arcs and can injure) before you touch it or test it. A bulging or swollen cap has already failed and is never safe to leave running -- it can leak, rupture, or start a fire, so it comes out, it does not stay in.';
  }
  const _homeownerFramed = req.body.homeowner === true ||
    /\bi'?m a homeowner\b|\bas a homeowner\b|\bhomeowner here\b|(my contractor|the repair (guy|tech|man)|a contractor|the tech)\s+(quoted|said|is quoting|gave me|quoting me)|should i (just )?replace (it|my|the|this)|is (that|this|\$?\d[\d,]*) (a )?fair (price|quote)|gave me a quote/i.test(_lastUser);
  // Wiring/schematic questions get a non-streamed reply so a retrieved diagram
  // image can be attached to the end of the response without splitting the sentinel.
  const _wiringDiagramIntent = /(wiring|schematic|connection|ladder)\s+diagram|electrical\s+schematic|wiring\s+schematic|(diagram|schematic)\s+(for|of|on)\b|wiring\s+(for|on|of)\b|\bthe\s+(wiring|schematic)\b|(show|pull\s+up|bring\s+up|upload|get|give|send|see|need|want|grab|find)\s+(me\s+)?(the\s+|a\s+|an\s+)?(wiring|schematic|diagram)|(diagram|schematic)\b[^.!?\n]{0,20}\b(hook.?up|wiring|terminal)/i.test(_lastUser);
  // (D3) Capacitor-DISCHARGE risk: even when the tech never types "capacitor", Mike
  // routinely self-diagnoses a failed run/start cap from "fan hums but won't spin" and
  // then emits the lethal "short the terminals with a screwdriver" method. The
  // deterministic screwdriver strip only exists on the non-stream path, so force
  // non-stream for any message where a self-diagnosed cap discharge could appear —
  // that guarantees the strip runs and the dangerous method can't reach a tech.
  const _capDischargeRisk = /(capacitor|\bcaps?\b|dual[- ]?run|run cap|start cap|hard start|discharg)|((fan|motor|blower|compressor|condenser)[^.]{0,40}(not spinning|won'?t (spin|start|turn)|just hum|hums?|humming|buzz|won'?t run))|((won'?t (spin|start)|not spinning|humming|hums?)[^.]{0,40}(fan|motor|blower|compressor|condenser))/i.test(_lastUser);
  const _forceNonStream = !!_safetyLead || !!_inverterWarn || !!_capacitorWarn || _homeownerFramed || _wiringDiagramIntent || _capDischargeRisk;

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
      const _mc = await retrieveManualContext(_lastUser);
      if (_mc && _mc.text) {
        _ragContext = '\n\n=== MANUFACTURER SERVICE MANUAL EXCERPTS (authoritative) ===\n'
          + 'Answer fault-code, wiring, and spec questions ONLY from these excerpts and cite the [Source: ...] tag in your reply. '
          + 'If the answer is not in these excerpts, say so plainly and use web search.\n\n'
          + _mc.text + '\n=== END MANUAL EXCERPTS ===\n';
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
      }
    }
    // ── PROMPT CACHING ─────────────────────────────────────────────────────────
    // Mike's large static rulebook (AGENT_SYSTEM) is identical on every call and across
    // every tech, so cache it (1-hour TTL) instead of re-billing ~16k tokens per message.
    // The per-message context (RAG + dynamic, sent separately as systemExtra) stays uncached.
    // For the common no-RAG case the concatenated text equals the old `_ragContext + system`,
    // so the prompt the model sees is byte-identical and Mike's answers are unchanged.
    const _baseSys = (system || '');
    const _tailSys = _ragContext + (systemExtra || '');
    let _systemField;
    if (_baseSys.length > 8000) {
      const _baseBlock = { type: 'text', text: _baseSys, cache_control: { type: 'ephemeral', ttl: '1h' } };
      _systemField = _tailSys ? [_baseBlock, { type: 'text', text: _tailSys }] : [_baseBlock];
    } else {
      _systemField = _ragContext + _baseSys;
    }
    const body = {
      model: process.env.MIKE_MODEL || 'claude-opus-4-8',
      max_tokens: Math.min(max_tokens, 8192),
      system: _systemField,
      messages,
    };
    if (use_search) {
      body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }];
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
      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!upstream.ok || !upstream.body) {
        let msg = `API error ${upstream.status}`;
        try { const ed = await upstream.json(); msg = ed?.error?.message || msg; } catch (_) {}
        console.error('Anthropic stream error:', upstream.status, msg);
        return res.status(upstream.status === 429 ? 429 : 502).json({ error: msg });
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
            if (evt.type === 'content_block_delta' && evt.delta) {
              const piece = evt.delta.text || '';
              if (piece) { sentAny = true; send({ delta: piece }); }
            } else if (evt.type === 'message_stop') {
              send({ done: true });
            } else if (evt.type === 'error') {
              send({ error: (evt.error && evt.error.message) || 'stream error' });
            }
          }
        }
        if (!sentAny) send({ delta: '' });
        send({ done: true });
        res.end();
      } catch (streamErr) {
        if (streamErr.name === 'AbortError') send({ error: 'Request timed out — please try again.' });
        else { console.error('AI stream pipe error:', streamErr.message); send({ error: 'Connection error — please try again.' }); }
        try { res.end(); } catch (_) {}
      }
      return;
    }
    // ── NON-STREAM (default fallback path, unchanged) ─────────────────────────

    const response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || `API error ${response.status}`;
      console.error('Anthropic error:', response.status, msg);
      return res.status(response.status === 429 ? 429 : 502).json({ error: msg });
    }

    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    // ── Apply the deterministic guard layer to the reply ──────────────────────
    let outText = text || 'No response.';
    try {
      if (_homeownerFramed) {
        // Strip any dollar amount the model leaked.
        outText = outText.replace(
          /\$\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:[-–—]|to)\s?\$?\s?\d[\d,]*(?:\.\d+)?)?\+?(?:\s?\/\s?\w+)?/g,
          '(a price your tech will give you)'
        );
        // Neutralize replace-or-repair recommendations to a homeowner.
        outText = outText.replace(
          /\b(replacement|replacing(?: it)?|a new system|a new unit|the new system|going new)\b[^.!?\n]{0,45}?\b(is (?:probably |likely )?(?:the )?(?:smarter|smart|better|right|wiser)|makes (?:more )?sense|the (?:better|smarter|right) (?:move|call|bet|play))/gi,
          'whether to repair or replace is the licensed tech’s call'
        );
        outText = outText.replace(
          /\b(?:i'?d|i would|lean toward|i'?d lean toward|go with|my (?:honest )?take[: -]*)[^.!?\n]{0,20}?\b(replac\w*|the new (?:system|unit)|a new (?:system|unit))/gi,
          'the repair-or-replace call belongs to the tech on the job'
        );
        outText = outText.replace(
          /\b(?:the )?math (?:often |usually |here )?(?:favors?|points? to|leans? toward|supports?)[^.!?\n]{0,22}?\b(replac\w*|new (?:system|unit)|going new)/gi,
          'whether to repair or replace is the licensed tech’s call'
        );
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
        // Brandon's rule (2026-06-28): to a homeowner, Mike says NOTHING about price or
        // cost — not a number, not a range, not "it depends", not whether it's worth it.
        // Drop any SENTENCE that talks price/cost and redirect to the tech, preserving line
        // and list breaks. Deliberately EXCLUDES bare "charge/charged" (refrigerant + cap
        // charge are HVAC terms), "bill" (energy bill is a legit efficiency topic), and bare
        // "estimate" (Mike estimates age/airflow) so technical and safety content survives.
        var _priceWord = /\b(prices?|priced|pricing|costs?|costly|costing|quotes?|quoted|quoting|expensive|inexpensive|cheap|pricey|affordable|affordability|how much (?:does|will|is|it|to|for|a|the|they|i|you)|ballpark|labou?r rate|service (?:call )?fee|trip charge|diagnostic fee|invoice)\b|\$\s?\d/i;
        var _hoLines = outText.split('\n'), _hoDropped = false;
        for (var _hoL = 0; _hoL < _hoLines.length; _hoL++) {
          var _hoSents = _hoLines[_hoL].split(/(?<=[.!?])\s+/), _hoKept = [];
          for (var _hoI = 0; _hoI < _hoSents.length; _hoI++) {
            if (_priceWord.test(_hoSents[_hoI])) { _hoDropped = true; continue; }
            _hoKept.push(_hoSents[_hoI]);
          }
          _hoLines[_hoL] = _hoKept.join(' ');
        }
        outText = _hoLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        if (_hoDropped) outText += (outText ? '\n\n' : '') + 'Numbers on price? That’s your tech’s call to make — I’m here to make sure you know exactly what’s wrong and what to ask him.';
      }
      // SAFETY STRIP (deterministic, UNCONDITIONAL): the model keeps generating the "short the
      // terminals with a screwdriver" discharge method despite the prompt forbidding it. A prompt
      // can't be trusted for a trained-in dangerous default. This must run on EVERY response — not
      // just when the tech typed "capacitor" — because Mike self-diagnoses a failed cap from
      // symptoms ("fan hums but won't spin") and emits the screwdriver method with no cap keyword in
      // the user's message (QA scenarios A1/B4, 2026-07-08). Sentence-level, so only the dangerous
      // sentence is removed; the resistor method and the rest of the answer survive.
      const _hadScrewMethod = /\bscrewdriver\b/i.test(outText) && /\b(?:terminal|short|shorting|bridge|across)\b/i.test(outText);
      outText = outText.replace(/[^.!?\n]*\bscrewdriver\b[^.!?\n]*\b(?:terminal|short|shorting|blade|across)\b[^.!?\n]*[.!?]/gi, '');
      outText = outText.replace(/[^.!?\n]*\b(?:short|shorting|bridge)\b[^.!?\n]*\bterminal[^.!?\n]*\bscrewdriver\b[^.!?\n]*[.!?]/gi, '');
      // The multi-line "Method 1: …screwdriver…" block + orphaned-heading cleanup can corrupt
      // legitimately-numbered non-capacitor answers, so keep that de-numbering scoped to the
      // capacitor path where a "Method 1 (screwdriver) / Method 2 (resistor)" pair is expected.
      if (_capacitorWarn || _hadScrewMethod) {
        outText = outText.replace(/(?:#{1,6}\s*|\*\*\s*)?Method\s*1\b[^\n]*screwdriver[\s\S]*?(?=(?:#{1,6}\s*|\*\*\s*)?Method\s*2\b|\n#{1,6}\s|$)/i, '');
        // removing the screwdriver "Method 1" leaves "Method 2" orphaned — de-number remaining method headings so it reads clean
        outText = outText.replace(/\bMethod\s*[1-9]\b[.:)\-—]*\s*/gi, '');
      }
      outText = outText.replace(/\n{3,}/g, '\n\n').trim();
      // Genuine ACTIVE emergencies (911 / live gas / CO / spillage / A2L release) still
      // LEAD — you never bury "call 911" or "shut the gas off" under an answer. The
      // precautionary stored-energy cautions (capacitor / inverter "discharge before you
      // touch it") move to a TAIL note so Mike answers the tech's actual question first,
      // for ANY experience level (Brandon field note 2026-06-16).
      if (_safetyLead) outText = _safetyLead + '\n\n' + outText;
      const _tail = [_capacitorWarn, _inverterWarn].filter(Boolean);
      if (_tail.length) outText = outText + '\n\n' + _tail.join('\n\n');
    } catch (_) {}

    // Phase 2: attach wiring-diagram image(s) the retrieval surfaced, as a sentinel
    // block the client parses + renders inline (then strips from the visible text).
    if (_ragDiagrams && _ragDiagrams.length && _wiringDiagramIntent) {
      try { outText += '\n\n⟦MIKE_DIAGRAM⟧' + JSON.stringify(_ragDiagrams) + '⟦/MIKE_DIAGRAM⟧'; } catch (_) {}
    }
    res.json({ response: outText, usage: data.usage });

  } catch (err) {
    if (err.name === 'AbortError') res.status(504).json({ error: 'Request timed out — please try again.' });
    else { console.error('AI error:', err.message); res.status(502).json({ error: 'Connection error — please try again.' }); }
  } finally {
    clearTimeout(timeout);
    globalActive = Math.max(0, globalActive - 1);
  }
});

// ── TTS ───────────────────────────────────────────────────────────────────────
// Auth + rate-limited: token comes from body (existing frontend pattern, same as /api/ai)
// or Authorization: Bearer header. authenticateToken reads both. (Security fix C3.)
// requireVoiceAccess (not requirePaidAccess): paying/founder accounts pass as before;
// a brand-new account gets a small lifetime allowance so ONBOARDING speaks in Mike's
// real voice instead of falling back to the browser robot. See the middleware comment.
app.post('/api/tts', ttsLimiter, authenticateToken, requireVoiceAccess, async (req, res) => {
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
app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── NEVER CRASH ───────────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => { console.error('UNCAUGHT EXCEPTION — staying alive:', err.message); });
process.on('unhandledRejection', (reason) => { console.error('UNHANDLED REJECTION — staying alive:', reason); });

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Trazer Intelligence running on port ${PORT}`);
  console.log(`AI: ${ANTHROPIC_API_KEY?'ready':'MISSING'} | TTS: ${ELEVENLABS_API_KEY?'ready':'not set'} | DB: ${SUPABASE_URL?'ready':'not set'} | Billing: ${STRIPE_SECRET_KEY?'ready':'not set'}`);
});
