# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Install: `npm install`
- Run locally: `npm start` (alias for `node index.js`, listens on `PORT` or 3000)
- No build step, no tests, no linter configured.

## Deployment

Deployed via Nixpacks (see `nixpacks.toml`) — `npm install` + `node index.js`. Default `APP_URL` points at a Railway deployment, so anywhere `APP_URL` is referenced (Stripe success/cancel URLs) you must override that env var when running elsewhere.

## Architecture

This is a **two-file app** despite its surface area:
- `index.js` — Express server (~840 lines) holding *every* API route.
- `public/index.html` — the entire client (~448 KB single file: HTML + CSS + inline JS, no bundler, no framework). All client behavior lives there. `app.get('*', …)` SPA-falls-back to it.

The server is intentionally minimal: native `fetch` (Node 18+), no Stripe SDK, no Supabase SDK, no JWT library — everything is hand-rolled against vendor REST endpoints.

### Integrations (all gated by env vars; only `ANTHROPIC_API_KEY` is fatal-on-missing)

- **Anthropic** (`/api/ai`) — proxies to `claude-sonnet-4-5` via `api.anthropic.com/v1/messages`. Optional web_search tool when `use_search:true`. Throttled by a single in-process counter `globalActive` capped at `MAX_GLOBAL=100` (returns 503 above that). 55s abort timeout; `fetchWithRetry` retries on 503/529.
- **ElevenLabs** (`/api/tts`) — voice ID defaulted to `ErXwobaYiN019PkySvjV`, `eleven_turbo_v2_5` model, 20s timeout, returns `audio/mpeg`.
- **Supabase** (REST, no SDK) — accessed via the `supabase(method, table, body, query)` helper at the top of the file using the service-role key. The helper returns parsed JSON directly (arrays for collection responses, `null` on any failure) — **not** a Supabase JS client, so no `.from(...).select()...` chaining. `POST`/`PATCH` return single-element arrays because the helper hardcodes `Prefer: return=representation`; take `[0]` for the inserted/updated row. See `/api/auth/*` for the canonical pattern.
- **Stripe** (`/api/billing/*`, `/api/webhook`) — no Stripe SDK. Checkout sessions are created with form-urlencoded POSTs. **Webhook signature verification is manual** using HMAC-SHA256 over `${timestamp}.${payload}` and must compare against all `v1=` signatures. Plans map: `homeowner | starter | pro | team` → `STRIPE_PRICE_*` env vars.
- **Weather** (`/api/weather`) — NWS (`api.weather.gov`) is tried first (3 chained calls: points → stations → latest observation, all requiring a `User-Agent`); falls back to Open-Meteo if any step fails. NWS returns Celsius/m·s⁻¹ — conversion is local.

### Auth model (non-standard — read this before changing it)

- Passwords: SHA-256 **HMAC** with a per-user 16-byte hex salt. `hashPassword`/`verifyPassword` in `index.js`. Not bcrypt/argon2 — do not assume strong KDF properties.
- Tokens: **base64-encoded JSON `{id, email, ts}`** — *not* JWTs and **not signature-verified**. Routes like `/api/auth/profile`, `/api/admin/users`, `/api/billing/cancel` decode the token and trust its `email` claim. Any mutation route that gates by token is effectively trusting the client unless it cross-checks against the DB. Admin gating works only because `/api/admin/*` re-queries `users` and checks `plan === 'admin'`.

### Critical middleware ordering

The Stripe webhook handler (`app.post('/api/webhook', express.raw(...))`) **must remain registered before `app.use(express.json())`**. Stripe signature verification needs the raw body; JSON parsing it first will break HMAC comparison.

### Resilience posture

`process.on('uncaughtException')` and `process.on('unhandledRejection')` only log — the process is intentionally kept alive on errors. Don't add hard exits without coordinating; this is a deliberate "never crash in prod" stance.

## Environment variables

Required: `ANTHROPIC_API_KEY` (process exits if missing).

Optional but feature-gating: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_HOMEOWNER|STARTER|PRO|TEAM`, `APP_URL`, `PORT`.

Many auth/billing routes branch on `if (!SUPABASE_URL) return …` to fall back to a "beta mode" that fakes success without persistence — be aware when testing locally without Supabase configured.

## Frontend notes

`public/index.html` is hand-written and edited as one file. There is no asset pipeline, so be cautious with global edits. The product is branded **Trazer Intelligence** (the `package.json` name `hvac-diagnose-pro` is the legacy slug).
