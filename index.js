'use strict';

const express = require('express');
const path = require('path');
const crypto = require('crypto');

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

if (!ANTHROPIC_API_KEY) { console.error('FATAL: ANTHROPIC_API_KEY not set'); process.exit(1); }

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
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': method === 'POST' ? 'return=representation' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text().catch(()=>'');
    console.error(`Supabase ${method} ${table} error:`, res.status, err.substring(0,200));
    return null;
  }
  return res.json().catch(()=>null);
}

// Hash password with SHA-256 + salt
function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', s).update(password).digest('hex');
  return { hash, salt: s };
}

function verifyPassword(password, hash, salt) {
  const { hash: h } = hashPassword(password, salt);
  return h === hash;
}

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
// Stripe webhook needs raw body — must be before express.json
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) return res.json({ok:true});
  
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    // Manual webhook signature verification (no stripe npm needed)
    const payload = req.body.toString();
    const elements = sig.split(',');
    const timestamp = elements.find(e=>e.startsWith('t=')).split('=')[1];
    const signatures = elements.filter(e=>e.startsWith('v1=')).map(e=>e.split('=')[1]);
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSig = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(signedPayload).digest('hex');
    
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

app.use(express.json({ limit: '25mb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h', etag: true, lastModified: true }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});
app.use((req, res, next) => {
  if (req.path.startsWith('/api/'))
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} active=${globalActive}`);
  next();
});

// ── HEALTH ────────────────────────────────────────────────────────────────────
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
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, company, role } = req.body;
  
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address' });

  if (!SUPABASE_URL) {
    // Fallback: return success without DB (beta mode)
    return res.json({
      user: { name, email, company: company||'', role: role||'contractor', plan: 'trial', trialStart: Date.now(), usageCount: 0 },
      token: Buffer.from(JSON.stringify({email, name, ts: Date.now()})).toString('base64'),
    });
  }

  try {
    // Check if user exists
    const existing = await supabase('GET', 'users', null, `?email=eq.${encodeURIComponent(email)}&select=id`);
    if (existing && existing.length > 0)
      return res.status(409).json({ error: 'An account with this email already exists' });

    const { hash, salt } = hashPassword(password);
    const now = new Date().toISOString();
    
    const users = await supabase('POST', 'users', {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: hash,
      password_salt: salt,
      company: company?.trim() || '',
      role: role || 'contractor',
      plan: 'trial',
      trial_start: now,
      usage_count: 0,
      created_at: now,
      features: {},
    });

    if (!users || !users[0])
      return res.status(500).json({ error: 'Failed to create account' });

    const user = users[0];
    const token = Buffer.from(JSON.stringify({id: user.id, email: user.email, ts: Date.now()})).toString('base64');
    
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
app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  if (!SUPABASE_URL) {
    return res.status(404).json({ error: 'Account not found' });
  }

  try {
    const users = await supabase('GET', 'users', null, 
      `?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&select=*`);
    
    if (!users || users.length === 0)
      return res.status(404).json({ error: 'No account found with this email' });

    const user = users[0];
    
    if (!verifyPassword(password, user.password_hash, user.password_salt))
      return res.status(401).json({ error: 'Incorrect password' });

    // Update last login
    await supabase('PATCH', 'users', { last_login: new Date().toISOString() }, 
      `?id=eq.${user.id}`);

    const token = Buffer.from(JSON.stringify({id: user.id, email: user.email, ts: Date.now()})).toString('base64');
    
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
app.post('/api/auth/profile', async (req, res) => {
  const { token, updates } = req.body;
  if (!token || !updates) return res.status(400).json({ error: 'Missing data' });

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (!decoded.email) return res.status(401).json({ error: 'Invalid token' });

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

    await supabase('PATCH', 'users', allowed, `?email=eq.${encodeURIComponent(decoded.email)}`);
    res.json({ ok: true });
  } catch(err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── AUTH: RESET PASSWORD ──────────────────────────────────────────────────────
app.post('/api/auth/reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  // In production, send a real reset email
  // For now, acknowledge the request
  console.log(`Password reset requested for: ${email}`);
  res.json({ ok: true, message: 'If an account exists, a reset email will be sent.' });
});

// ── AUTH: CHANGE PASSWORD ─────────────────────────────────────────────────────
app.post('/api/auth/change-password', async (req, res) => {
  const { token, oldPassword, newPassword } = req.body;
  if (!token || !oldPassword || !newPassword)
    return res.status(400).json({ error: 'Missing required fields' });
  if (newPassword.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters' });

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (!SUPABASE_URL) return res.json({ ok: true });

    const users = await supabase('GET', 'users', null, `?email=eq.${encodeURIComponent(decoded.email)}&select=*`);
    if (!users || !users[0]) return res.status(404).json({ error: 'User not found' });

    const user = users[0];
    if (!verifyPassword(oldPassword, user.password_hash, user.password_salt))
      return res.status(401).json({ error: 'Current password is incorrect' });

    const { hash, salt } = hashPassword(newPassword);
    await supabase('PATCH', 'users', { password_hash: hash, password_salt: salt }, `?id=eq.${user.id}`);
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
app.post('/api/billing/cancel', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });
  if (!STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Billing not configured' });

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (!SUPABASE_URL) return res.json({ ok: true });

    const users = await supabase('GET', 'users', null, `?email=eq.${encodeURIComponent(decoded.email)}&select=stripe_subscription_id`);
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
  console.log(`Billing notify request: ${email}`);
  // Store in DB if available
  if (SUPABASE_URL) {
    await supabase('POST', 'billing_notify', { email, created_at: new Date().toISOString() })
      .catch(()=>{}); // ignore if table doesn't exist yet
  }
  res.json({ ok: true });
});

// ── ADMIN: GET ALL USERS ──────────────────────────────────────────────────────
app.get('/api/admin/users', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (!SUPABASE_URL) return res.json({ users: [] });

    // Verify requester is admin
    const admins = await supabase('GET', 'users', null, `?email=eq.${encodeURIComponent(decoded.email)}&select=role,plan`);
    if (!admins || !admins[0] || admins[0].plan !== 'admin')
      return res.status(403).json({ error: 'Access denied' });

    const users = await supabase('GET', 'users', null, '?select=id,name,email,company,role,plan,usage_count,created_at,trial_start,last_login&order=created_at.desc&limit=500');
    res.json({ users: users || [] });
  } catch(err) {
    console.error('Admin users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── ADMIN: DELETE USER ────────────────────────────────────────────────────────
app.delete('/api/admin/users/:email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (!SUPABASE_URL) return res.json({ ok: true });

    const admins = await supabase('GET', 'users', null, `?email=eq.${encodeURIComponent(decoded.email)}&select=plan`);
    if (!admins || !admins[0] || admins[0].plan !== 'admin')
      return res.status(403).json({ error: 'Access denied' });

    await supabase('DELETE', 'users', null, `?email=eq.${encodeURIComponent(req.params.email)}`);
    res.json({ ok: true });
  } catch(err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ── AI ────────────────────────────────────────────────────────────────────────
app.post('/api/ai', async (req, res) => {
  if (globalActive >= MAX_GLOBAL)
    return res.status(503).json({ error: 'Server at capacity — please try again in a moment.' });

  const { messages, system, max_tokens = 1024, use_search = false } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages required' });

  globalActive++;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

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
app.post('/api/tts', async (req, res) => {
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
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.50, similarity_boost: 0.80, style: 0.20, use_speaker_boost: true },
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
