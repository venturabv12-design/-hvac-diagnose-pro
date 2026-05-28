# System Gaps

A running log of system-level bugs in Trazer's tooling, agent infrastructure, deploy verification, and operational practices. Each gap has a number, the date discovered, a root cause, an impact statement, and the proposed fix. Gaps are kept open until the fix lands; closed gaps move below the open list with their resolution noted.

Numbering note: Gaps #001 and #002 are reserved (predate this log). Active gap log starts at #003.

---

## Gap #003 — Tuesday-Tech personas share a Playwright browser context across dispatches

**Status:** OPEN
**Discovered:** 2026-05-27 (Push 7.1 Tuesday-Tech round 1)
**Reported by:** team-debugger investigation of "Carlos saw a message he never typed"

### Root cause
The Playwright MCP server attaches to one persistent browser context. When the orchestrator dispatches 4 personas in parallel (Apprentice / Veteran / Owner / Homeowner), they all drive the same browser session. `localStorage`, `sessionStorage`, and cookies set by the first persona to land survive into every subsequent persona's session. "Carlos saw a message he never typed" turned out to be Sarah-the-Owner's question text appearing because they shared a browser profile — not a cross-user data leak in production.

### Impact
False-positive that looked like a security incident. Burned ~30 minutes of P1 investigation (explorer + team-debugger dispatched in parallel) before the cause was identified. Tuesday-Tech reports become unreliable any time more than one persona runs in the same orchestrator session without explicit cleanup. Future "security findings" from persona testing must be triaged against this gap first.

### Fix
Each Tuesday-Tech persona prompt must begin with an explicit browser-storage cleanup sequence on the app origin (not on `about:blank` — see Gap #005). Once verified working, bake the protocol into `.claude/agents/eng-tuesday-tech.md` itself so future dispatches inherit it automatically and the orchestrator doesn't have to remember.

---

## Gap #004 — `/api/health` lies about Anthropic availability

**Status:** OPEN
**Discovered:** 2026-05-27 (Push 7.1.1 Tuesday-Tech round 2)
**Reported by:** Carlos persona surfaced the exact `/api/ai` error response

### Root cause
`/api/health` in `index.js` returns `aiReady: true` based solely on whether `ANTHROPIC_API_KEY` is defined in environment variables. It does not round-trip to Anthropic to verify the key is valid, that credits are available, or that the API is reachable. When the Anthropic credit balance went to zero, every `/api/ai` call returned 502 with the literal upstream error "Your credit balance is too low to access the Anthropic API" — but `/api/health` continued reporting `aiReady: true` the entire time.

### Impact
A production fire was invisible to the deploy-verification flow. Railway redeploy polling watches uptime and `aiReady` — neither would have caught this. Real users went dark while every dashboard said "all green." Only surfaced because a Tuesday-Tech persona attempted a real chat call and inspected the network response. For an AI-first product where Mike *is* the value proposition, this is the most consequential observability gap in the stack.

### Fix
`/api/health` should perform a cheap real round-trip to Anthropic (e.g., the `/v1/models` endpoint, or a 1-token completion using `claude-haiku-4-5-20251001`) and report `aiReady: false` plus the upstream error code/message if the round-trip fails. Cache the result for ~30 seconds to avoid wasting credits on health checks. Pair with a synthetic monitor that pages on `aiReady` flipping false for > 2 minutes. `index.js` is locked-file territory — this fix needs Brandon's explicit approval before any code lands.

---

## Gap #005 — Tuesday-Tech localStorage cleanup ran on `about:blank` (wrong origin)

**Status:** FIX VERIFIED INLINE (2026-05-27, Push 7.1.1 Tuesday-Tech round 2 re-run; all 4 personas reported `{ls:0, ss:0, hasUser:false}` at protocol completion). Pending bake-in to `.claude/agents/eng-tuesday-tech.md` so the orchestrator doesn't have to inline the protocol every dispatch.
**Discovered:** 2026-05-27 (Push 7.1.1 Tuesday-Tech round 2)
**Reported by:** Tom-the-Homeowner caught a contaminated `trazer_user` blob in his run

### Root cause
The Gap #003 fix added a cleanup sequence to each persona prompt. The orchestrator (this assistant) initially placed the cleanup on `about:blank` — navigate to a neutral page, clear storage there, then navigate to the app. But `localStorage`, `sessionStorage`, and cookies are scoped per-origin. Calling `localStorage.clear()` on `about:blank` does nothing to the app domain's storage. The verification check `Object.keys(localStorage).length` returns 0 because `about:blank` has no localStorage of its own — false-positive "cleanup succeeded" report.

### Impact
Every persona in Push 7.1.1 round 2 ran with contaminated state from prior runs. Apprentice's "clean state confirmed" line was a lie his verification check believed. Carlos's session blob and Sarah's chat history survived into every persona's run. Tom caught it; the other three trusted their (broken) verification and may have attributed contamination artifacts to real bugs.

### Fix
Cleanup must happen on the app origin AFTER navigation, not before:
1. `mcp__playwright__browser_navigate` to the production URL (acquires the app-origin context).
2. `mcp__playwright__browser_evaluate` clears `localStorage`, `sessionStorage`, and cookies — these now operate on the app origin.
3. `mcp__playwright__browser_navigate` to the production URL again (reload) so `tracerInit()` re-runs against the clean state, since the existing `tracerInit` only runs on page load.
4. Verify with a second `browser_evaluate` after step 3 to confirm `localStorage.trazer_user` is absent.

Bake into `.claude/agents/eng-tuesday-tech.md` once verified working in a dispatch, so the orchestrator doesn't have to remember the protocol every time.

---

## Gap #006 — `signOut()` does not clear per-user keyed `localStorage` entries

**Status:** OPEN
**Discovered:** 2026-05-27 (Push 7.1.1 Tuesday-Tech round 2)
**Reported by:** Tom-the-Homeowner caught Carlos's session reconstructing mid-test after `trazer_user` was cleared

### Root cause
The Gap #005 fix cleared `localStorage`, `sessionStorage`, and cookies on the app origin. But Trazer also writes per-user keyed entries such as `trazer_history_<email>` and `trazer_profile_<email>` to `localStorage`. The cleanup protocol called `localStorage.clear()` which DOES delete those keys, but the same is not true of `signOut()` in production — `signOut()` only removes the `trazer_user` key and leaves the per-user entries behind. Worse, parts of `loadUserHistory()` and demo-account auto-injection can repopulate `trazer_user` mid-session from those leftover keys, defeating the cleanup that the persona protocol just performed.

### Impact
For Tuesday-Tech: cleanup looked clean at protocol completion, then the session got reconstructed mid-test from the persistent per-user keys — Tom caught Carlos's session re-materializing during his run despite the verified clean state. For real production on a shared device: User A's history persists after their `signOut()`, so when User B (or User A again with stale state) signs in, the previous chat history can surface in their session. Not a cross-user data leak in the server sense (it's same browser, same email-scoped namespace), but a real "I saw my coworker's chat history" UX bug on shared phones/tablets in a shop.

### Fix
1. **Test-harness side (immediate, for the next persona round):** the cleanup script should explicitly enumerate and remove every key matching `trazer_*`, not just call `localStorage.clear()` and hope:
   ```js
   Object.keys(localStorage)
     .filter(k => k.startsWith('trazer_'))
     .forEach(k => localStorage.removeItem(k));
   ```
2. **Product side (needs Brandon's call):** decide whether `signOut()` in production should clear per-user history. Current behavior is intentional per `loadUserHistory` doctrine ("Mike keeps ALL memory across sessions"). On shared devices this conflicts with the UX expectation that "signing out clears my stuff." Possible compromise: preserve history for the *same* email re-signing-in (so individual continuity is kept), clear when a *different* email signs in on the same device.

Bake the test-harness fix into `.claude/agents/eng-tuesday-tech.md` alongside the Gap #005 fix once both are verified clean across a full dispatch.

---

## Gap #012 — Agents drafting corrections can themselves hallucinate

**Status:** OPEN
**Discovered:** 2026-05-28 (Mike quality build, Track A patch draft for AGENT_SYSTEM)
**Reported by:** Brandon — spot-checked the orchestrator's proposed Mike-brain patch against source documents and caught the orchestrator inventing fault-code values that did not exist in any raw report

### Root cause
The orchestrator (this assistant) consolidated 359 quality-test scenarios into a proposed system-prompt patch for Mike. While drafting Insertion 3 (verified brand fault codes), the orchestrator wrote specific values from its own model knowledge rather than copying them verbatim from the raw quality-test reports' "Documented correct" lines. Result: 1 outright wrong fault-code translation (Carrier 25VNA fault 45 = "thermistor" when the source said "Lost Inverter Communications"), 3 fabricated entries for Carrier 25VNA faults 69/72/77 that appeared in no raw report, and 2 paraphrased-incorrectly entries (Lennox 180 and 417, where the orchestrator substituted plausible-sounding sensor names for the actual ones in the manual).

The orchestrator was trying to fix Mike's hallucination problem by writing a patch that itself hallucinated. The orchestrator did NOT notice the error until Brandon explicitly asked for a spot-check against sources.

### Impact
If Brandon had approved the patch as drafted, four false fault-code interpretations would have been planted in Mike's system prompt and shipped to staging (and possibly production). Mike would then have *confidently* repeated those false interpretations to real techs working on real units, sending them down wrong diagnostic paths. The whole point of the quality-build effort — proving Mike is the master tech — would have been undermined at the patch-application step by the same failure mode the patch was meant to fix.

The deeper concern: agents writing corrections to other agents are not automatically more trustworthy than the agent being corrected. Both are language models. Both can hallucinate. A correction-agent's draft must be treated as raw output to be verified, not as authoritative.

### Fix
1. **Mandatory line-by-line source citation on every Mike-brain edit.** Each line of any AGENT_SYSTEM patch that states a fact (a fault code meaning, a regulation threshold, a spec value, a technical claim) must include a citation to a manufacturer service manual, an EPA document, or another primary source. No claims sourced only to the orchestrator's prior knowledge.
2. **Spot-check is mandatory, not optional.** Before any AGENT_SYSTEM patch is applied, surface 3+ randomly-chosen claims from different sections of the patch with the verbatim text from the cited source. Brandon (or any reviewer) reads the source quotes and compares to the patch text. If any claim cannot be verified against the cited source, the patch does not apply.
3. **Force-search rule replaces embedded lookup tables where possible.** Instead of embedding hand-curated fault-code interpretations into Mike's prompt (where the orchestrator and Mike can both hallucinate), embed the *behavior*: search the manufacturer's manual on every brand+code lookup, quote the source, never interpret from training data. This is structurally safer than any hand-curated list because it pushes Mike to a verifiable primary source every time.
4. **Bake into orchestrator doctrine.** Any patch to a system prompt that affects safety-critical or technical-fact behavior must:
   - List each new factual claim
   - Cite each claim to a primary source (URL preferred)
   - Surface to the reviewer with verbatim quotes from the cited sources for spot-check
   - Default to behavior-rules ("search and cite") over embedded facts ("here is the answer") when the fact space is large or fast-changing.

---
