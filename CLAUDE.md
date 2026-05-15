# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

- Install: `npm install`
- Run locally: `npm start` (alias for `node index.js`, listens on `PORT` or 3000)
- No build step, no tests, no linter configured.

## Deployment

Deployed via Nixpacks (see `nixpacks.toml`) on Railway — `npm install` + `node index.js`. Push to `main` triggers an automatic redeploy. Default `APP_URL` points at the Railway deployment; override via env var if running elsewhere.

## Architecture

This is a **two-file app**:
- `index.js` — Express server (~1,260 lines) holding every API route, middleware, and integration.
- `public/index.html` — the entire client (~7,000+ lines: HTML + CSS + inline JS, no bundler, no framework). All client behaviour lives here. `app.get('*', …)` SPA-falls-back to it.

The server uses native `fetch` (Node 18+). No Stripe SDK, no Supabase SDK. All vendor APIs are called directly against their REST endpoints.

### Integrations (all gated by env vars; only `ANTHROPIC_API_KEY` is fatal-on-missing)

- **Anthropic** (`/api/ai`) — proxies to `claude-sonnet-4-5` via `api.anthropic.com/v1/messages`. Optional `web_search` tool when `use_search:true`. Throttled by `globalActive` counter capped at `MAX_GLOBAL=100`. 55s abort timeout; `fetchWithRetry` retries on 503/529.
- **ElevenLabs** (`/api/tts`) — voice ID defaulted to `ErXwobaYiN019PkySvjV`, `eleven_turbo_v2_5` model, 20s timeout, returns `audio/mpeg`.
- **Supabase** (REST, no SDK) — accessed via the `supabase(method, table, body, query)` helper using the service-role key. Returns parsed JSON (arrays for collections, `null` on failure). `POST`/`PATCH` with `Prefer: return=representation` — take `[0]` for the inserted/updated row.
- **Stripe** (`/api/billing/*`, `/api/webhook`) — no Stripe SDK. Manual HMAC-SHA256 webhook verification. Plans map: `homeowner | starter | pro | team` → `STRIPE_PRICE_*` env vars.
- **Weather** (`/api/weather`) — NWS first (3-step chain: points → stations → observation); falls back to Open-Meteo.
- **Resend** (`/api/auth/reset`, `/api/auth/reset-confirm`) — transactional email for password reset. Gated by `RESEND_API_KEY`; silently skips if not set.

### Auth model (Phase 1 — current as of May 2026)

- **Passwords**: **bcrypt** (12 rounds). `hashPassword` / `verifyPassword` in `index.js`. Legacy SHA-256 HMAC accounts are migrated transparently on first successful login via `verifyLegacyPassword`.
- **Tokens**: **HS256 JWTs** signed with `JWT_SECRET` env var, 30-day expiry. Payload: `{ id, email }`. Verified by `authenticateToken` middleware.
- **Admin gate**: `requireAdmin` middleware checks `role === 'admin'` in the DB. The `plan` field is billing-only.
- **Rate limiting**: `authLimiter` (10 req/15min) on auth routes, `aiLimiter` (20 req/min) on `/api/ai`, `globalLimiter` (100 req/min) globally.
- **Security headers**: Helmet (CSP, HSTS, X-Frame-Options, etc.) + CORS locked to `APP_URL`.
- **Paywall**: `/api/ai` checks plan server-side via `checkPaywall()`. Plans `admin/pro/team/starter/homeowner/beta` are allowed. `trial` is allowed for 7 days. Unknown plans are denied.

### Password reset flow
1. User POSTs to `/api/auth/reset` with `email`.
2. Server generates a time-limited HMAC token and emails a link: `APP_URL?reset=<token>`.
3. Frontend detects `?reset=<token>` on page load and shows an inline reset modal.
4. User submits new password → POSTs to `/api/auth/reset-confirm` with `token` and `newPassword`.
5. Server verifies HMAC, updates bcrypt hash in DB.

### Critical middleware ordering

The Stripe webhook handler (`app.post('/api/webhook', express.raw(...))`) **must remain registered before `app.use(express.json())`**. Stripe signature verification needs the raw body; JSON parsing it first will break HMAC comparison.

### Resilience posture

`process.on('uncaughtException')` and `process.on('unhandledRejection')` only log — the process is intentionally kept alive on errors. Don't add hard exits without coordination.

## Environment variables

**Required** (process exits if missing): `ANTHROPIC_API_KEY`, `JWT_SECRET`.

**Optional but feature-gating**: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_HOMEOWNER|STARTER|PRO|TEAM`, `APP_URL`, `PORT`, `RESEND_API_KEY`.

Many auth/billing routes branch on `if (!SUPABASE_URL) return …` to fall back to a "dev mode" that fakes success without persistence — be aware when testing locally without Supabase configured.

## Frontend notes

`public/index.html` is hand-written and edited as one file. There is no asset pipeline. All JS is inline. The product is branded **Trazer Intelligence** (the `package.json` name `hvac-diagnose-pro` is the legacy slug).

Key client-side patterns:
- `currentUser` global holds the logged-in user (or `null`). Always check before auth-gated operations.
- JWT token is stored inside the user object: `currentUser.token`. Sent to `/api/ai` in request body as `token` field.
- `tracerInit()` runs on page load — restores session from `localStorage.trazer_user`. Detects old base64 tokens and forces re-login.
- `applyModeFromRole()` → `setMode(m)` controls which panel (`panelHome` vs `panelDiag`) is visible.
- `showAuthErr(m)` shows errors in the auth overlay error box; pass empty string to clear.
- `submitPasswordReset(token)` handles the `?reset=<token>` URL param reset flow end-to-end.
