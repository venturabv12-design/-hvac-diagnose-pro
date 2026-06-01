'use strict';

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');

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

// JWT_SECRET signs every auth token. Must be set in Railway env vars — a missing
// secret means tokens from a previous deploy would be accepted, which is worse
// than refusing to start.
const JWT_SECRET = process.env.JWT_SECRET;

if (!ANTHROPIC_API_KEY) { console.error('FATAL: ANTHROPIC_API_KEY not set'); process.exit(1); }
if (!JWT_SECRET) { console.error('FATAL: JWT_SECRET not set'); process.exit(1); }

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

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      console.log(`Payment failed for customer: ${invoice.customer}`);
      // Could send email notification here
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
  res.json({
    ok: true,
    aiReady: !!ANTHROPIC_API_KEY,
    ttsReady: !!ELEVENLABS_API_KEY,
    dbReady: !!(SUPABASE_URL && SUPABASE_SERVICE_KEY),
    billingReady: !!STRIPE_SECRET_KEY,
    activeRequests: globalActive,
    uptime: Math.floor(process.uptime()),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
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
      name: name.trim(),
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
      return res.status(404).json({ error: 'No account found with this email' });

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
      return res.status(401).json({ error: 'Incorrect password' });

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

    const allowed = {
      name: updates.name,
      company: updates.company,
      role: updates.role,
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
app.post('/api/billing/checkout', async (req, res) => {
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
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!SUPABASE_URL) return res.json({ users: [] });
    const users = await supabase('GET', 'users', null, '?select=id,name,email,company,role,plan,usage_count,created_at,trial_start,last_login&order=created_at.desc&limit=500');
    res.json({ users: users || [] });
  } catch(err) {
    console.error('Admin users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
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

// ── AI ────────────────────────────────────────────────────────────────────────
// ── SERVER-SIDE PAYWALL CHECK ─────────────────────────────────────────────────
// PAYWALL TEMPORARILY DISABLED — Kaizen will say when to turn it on.
// The full logic is preserved below the early return for the eventual flip.
async function checkPaywall(token) {
  // EMERGENCY DISABLE: allow everyone through. No trial expiry, no plan gate.
  // Re-enable by deleting this block and the function will resume its 7-day trial enforcement.
  return { allowed: true };

  // ----- ORIGINAL LOGIC (kept for when paywall is re-enabled) -----
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
      `?id=eq.${encodeURIComponent(decoded.id)}&select=plan,trial_start,usage_count`);

    if (!users || users.length === 0)
      return { allowed: false, reason: 'Account not found' };

    const { plan, trial_start } = users[0];

    // Always-allowed plans
    if (['admin', 'pro', 'team', 'starter', 'homeowner'].includes(plan))
      return { allowed: true };

    // Trial — check 7-day window
    if (plan === 'trial') {
      const start = trial_start ? new Date(trial_start).getTime() : Date.now();
      const daysElapsed = (Date.now() - start) / (1000 * 60 * 60 * 24);
      if (daysElapsed <= 7) return { allowed: true };
      return { allowed: false, reason: 'Your 7-day free trial has expired. Upgrade to keep using Trazer.', paywall: true };
    }

    // 'beta' = legacy plan from before Phase 1. Treat same as trial — allow through.
    // These are early users who signed up before billing went live.
    if (plan === 'beta') return { allowed: true };

    // Any other unknown plan → deny
    return { allowed: false, reason: 'A subscription is required to use Trazer AI.', paywall: true };
  } catch (err) {
    console.error('Paywall check error:', err.message);
    // If DB check fails — fail open to avoid blocking paying users during an outage
    return { allowed: true };
  }
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

  const { messages, system, max_tokens = 1024, use_search = false } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages required' });

  globalActive++;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 75000);

  try {
    const body = {
      model: 'claude-sonnet-4-5',
      max_tokens: Math.min(max_tokens, 8192),
      system,
      messages,
    };
    if (use_search) {
      body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }];
    }

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

    res.json({ response: text || 'No response.' });

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
app.post('/api/tts', ttsLimiter, authenticateToken, async (req, res) => {
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
