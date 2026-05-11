---
description: Health check for Trazer Intelligence (git + production deployment)
allowed-tools: Bash(git status:*), Bash(curl:*), Bash(grep:*)
---

<!-- The `!`-prefixed lines below run at command invocation time.
     Their stdout is injected into the prompt before Claude sees it.
     Edit the URL if APP_URL changes. -->

## 1. Working tree
!`git status --short`

## 2. API health JSON
!`curl -s --max-time 10 https://nodejs-production-cb99f.up.railway.app/api/health`

## 3. Frontend HTTP status
!`curl -s -o /dev/null --write-out "%{http_code}" --max-time 10 https://nodejs-production-cb99f.up.railway.app/`

## 4. Known-broken endpoints (see CLAUDE.md — `supabase.from(` calls against the REST helper)
!`grep -c "supabase\.from(" index.js`

---

Using only the outputs above (do not run any additional tools), produce this report:

- **Working tree**: "clean" if section 1 is empty, otherwise list the changed paths verbatim.
- **Subsystems** — parse the JSON from section 2 and emit one line each:
  - Anthropic — ✅ if `aiReady` is true, else ❌
  - Stripe — ✅ if `billingReady` is true, else ❌
  - Supabase — ✅ if `dbReady` is true, else ❌
  - ElevenLabs — ✅ if `ttsReady` is true, else ❌
- **Frontend**: "HTTP 200" if section 3 is `200`, otherwise "HTTP <code>".
- **Broken endpoints**: report the integer from section 4 (non-zero is expected per CLAUDE.md).

Then a single final line, picking exactly one:
- `🟢 All healthy` — every subsystem ready, frontend 200, working tree clean, broken-endpoint count unchanged from the documented baseline
- `🟡 Issues but not urgent` — uncommitted changes, or non-critical subsystem ❌ (TTS), or broken-endpoint count present but production is up
- `🔴 Production problem — investigate` — frontend non-200, OR Anthropic ❌, OR `/api/health` did not return parseable JSON
