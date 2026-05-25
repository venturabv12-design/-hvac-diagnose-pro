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

## Locked files / regions

These regions must NOT be edited without explicit override. The `.claude/` hooks enforce this automatically; this section is the source of truth.

**Whole files:**
- `index.js` — entire backend. Includes `/api/tts` route (lines 1218–1263), `authenticateToken` middleware, Supabase auth helpers. Never touch from a frontend task.
- `public/lucide.min.js` — bundled library (~356 KB). Never hand-edit.

**Function bodies inside `public/index.html`:**
- `parseJSON` — defined at `public/index.html:3387` (`function parseJSON(raw){`)
- `renderDiagCards` — defined at `public/index.html:3543` (`function renderDiagCards(data,c){`)
- Any line referencing `JOB_SAVED` — string sentinel for saved-job state. Current occurrence count = 6. Must not change without explicit override.
- Camera flow (10 functions, lines as of current `main`): `primeCameraAudio` (4629), `checkCameraAccess` (6397), `startLiveCamera` (6417), `startCameraStream` (6467), `stopLiveCamera` (6531), `flipCamera` (6552), `analyzeCameraFrame` (6566), `setCameraResponse` (6615), `updateCameraMicState` (6624), `mikeSayCamera` (6643).

**Override**: set `TRAZER_HOOK_OVERRIDE=1` in the environment for a session to bypass the hook blocks. Intentional friction — only use when you've explicitly decided the locked region must change. Hooks emit a stderr warning on override use.

## Engineering discipline (non-negotiable)

- **Plan Mode** for any change touching ≥3 files or any structural / architectural change. Spec first, approve, then execute.
- **Feature branch always.** Never push directly to `main` — Hook B blocks `git push origin main` at the bash layer. Merging to main requires explicit approval (PR or `git revert` for rollbacks).
- **One commit per logical change.** No batched "misc fixes."
- **Diff before edit.** For edits to `public/index.html`, surface old/new strings before applying; manual approval per edit during active sessions.
- **Pre-ship audit before every commit** that touches `public/index.html`. Counts must match the snapshot baseline (next section). Hook C reports drift to stderr post-edit.

## Pre-ship audit gates

Seven gates must pass before any commit touching `public/index.html`:

1. `node --check index.js` → OK
2. `grep -c 'parseJSON' public/index.html` → equal to pre-edit snapshot
3. `grep -c 'renderDiagCards' public/index.html` → equal to pre-edit snapshot
4. `grep -c 'JOB_SAVED' public/index.html` → equal to pre-edit snapshot
5. `grep -c 'data-lucide=' public/index.html` → equal to pre-edit snapshot
6. **Brace delta unchanged**: `(open − close)` post-edit equals pre-edit delta. Use `awk -F'{' '{c+=NF-1} END{print c}'` and `awk -F'}' '{c+=NF-1} END{print c}'`.
7. `shasum -a 256 index.js` → equal to pre-edit snapshot. **No backend changes during frontend work, ever.**

Hook C (`scripts/post-edit-audit.sh`) automates gates 2–7 against a snapshot keyed on `git HEAD` (auto-refreshes after each commit). Gate 1 is run manually.

## Rollback recipe

```bash
git revert HEAD --no-edit && git push origin <branch>
```

- **Multi-commit rollbacks**: revert in reverse chronological order, one revert commit per source commit.
- **Merge commits**: `git revert -m 1 <merge-sha>` to specify the mainline parent.
- **Never `git reset --hard` on a shared branch.** Preserve history. Reverts are the only sanctioned undo on `main`.

## Production verification

- **URL**: `https://nodejs-production-cb99f.up.railway.app`
- **Health endpoint**: `GET /api/health` returns `{ok, uptime, ...}`. After a deploy, `uptime` resets to <60s — strongest signal the new build is live.
- **Deploy fingerprinting**: pair the uptime reset with a content fingerprint from `GET /` (a unique string from the new commit). Both signals = deploy confirmed.
- **Railway**: push to `main` triggers automatic redeploy. Typical end-to-end: 90–180 seconds.
- **Polling cadence**: 15-second intervals, 10-minute cap. Stop when both signals flip.

## Platform notes

Scripts in `scripts/` assume macOS bash + BSD grep/awk + `shasum -a 256` (not `sha256sum`). Linux contributors need GNU `coreutils` equivalents. Hooks are macOS-tested only.

On first session start after this branch merges, Claude Code may prompt once to approve the new `.claude/settings.json` hooks. Expected behavior — accept to enable enforcement.
