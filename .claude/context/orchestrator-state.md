# Orchestrator state

**Last updated:** 2026-05-28 (batch-mode run)

## Operating mode

Brandon is running his HVAC business today and unreachable for per-push approval. Auto-mode full. Work the Week 1 queue end-to-end, fast-forward main locally for any push whose gauntlet + Tuesday-Tech come back clean, and surface ONE consolidated report when he checks back.

## Production state

- Hook hardening **live** at `34bcfd5` on origin/main. Health endpoint green (`aiReady`, `ttsReady`, `dbReady`, `billingReady` all true). 3 dev-side hooks now block 12 bypass paths the security audit identified; locked function bodies have SHA-256 integrity verification via Hook C.
- Production HVAC app behavior unchanged by the hook push (dev-side only).

## Week 1 queue

Sequence: 7.2 → 7.4 → 7.3, each requiring gauntlet + Tuesday-Tech round + ff-merge if clean.

### Push 7.2 — drawer tile cleanup
- Branch: `feature/push-7.2-hide-stub-tiles`, commit `739535b` (rebased onto 34bcfd5)
- 4-line CSS rule, hides drawer tiles whose onclick contains `pushFeatureSoon`
- Pre-approved by Brandon 2026-05-27
- Gauntlet (yesterday): code-reviewer APPROVED, designer-critic APPROVED (POLISH only), e2e PARTIAL PASS (rule verified via DOM injection; infrastructure caveat resolved by today's serve)
- Status: rebased, ready for Tuesday-Tech round

### Push 7.4 reframed — auth cleanup
- Not yet implemented. Scope per Brandon's approved Option A:
  1. `signOut()` enumerates and removes all `trazer_*` localStorage keys (not just `trazer_user`)
  2. 401 handler in `callAI()` also `localStorage.removeItem('trazer_users')` to prevent stale rehydration
- Pure frontend, no locked files
- Closes the shared-device "saw my coworker's chat" UX hazard (Gap #006)
- Status: to be implemented

### Push 7.3 — camera fixes
- Branch: `feature/push-7.3-camera-hotfix`, commits `6df84b9` + `c2fdbaa` (need rebase onto current main)
- 4 bug fixes: object-fit:cover→contain, flipCamera try/catch revert, analyzeCameraFrame double-append, Escape closes camera + peek-tile through checkCameraAccess
- Diffs line-by-line approved by Brandon 2026-05-27
- Locked-file edits: `flipCamera` body + `analyzeCameraFrame` body
- iPhone test script prepared (sensor verification — Brandon runs on his phone post-deploy)
- Status: needs rebase + re-gauntlet under hardened hook + Tuesday-Tech

## Batch SOP for this run

Per push:
1. Rebase feature branch onto current main if behind
2. Re-run gauntlet (code-reviewer + designer-critic if visual + eng-e2e-tester)
3. Start local server with feature branch's code, stub env vars (ANTHROPIC_API_KEY=stub, JWT_SECRET=stub) — Tuesday-Tech tests against localhost:3000 since pushes haven't reached production yet
4. Dispatch Tuesday-Tech all 4 personas serially (parallel stalls on Playwright browser lock)
5. If gauntlet green AND no NEW blockers from Tuesday-Tech → fast-forward main locally → log as ready-to-push
6. Move to next push

## Active engagement: Mike knowledge base buildout + final staging fixes (2026-05-28)

Brandon authorized the heavy-work build: PART 1 — fix the 5 outstanding staging items (paywall LEFT DISABLED per Brandon, renderDiagCards XSS, Mike system-prompt scope, 320px overflow); PART 2 — build Mike's complete HVAC/R scenario library v3, test Mike against it, refine system prompt until 100% on safety + high overall accuracy, lock in via `eng-mike-quality-tester` on every future push.

**Status:**
- 4 parallel researchers dispatched for Phase 1 scenario library:
  - Residential split + heat pumps (a8ef1b7ac24cf3b76)
  - Commercial RTU + VRF + ductless (a5f41bc261b2b7a21)
  - Refrigeration + boilers + hydronics (aa8b26aa13c9b069f)
  - Safety-critical + refrigerant transitions (acaf73f0722c0b168)
- Target: 290-380 scenarios across the 4 files. Will be consolidated into `mike-scenarios-v3.md` (or kept as separate files for size if too large).
- Item 5 (320px overflow) — fixing properly now (non-locked CSS).
- Item 2 (renderDiagCards XSS) — locked-function fix, will attempt with the override Brandon authorized.
- Items 3 + 4 (Mike system prompt) — Phase 3 after library + quality-tester are ready.

When researchers complete → consolidate library → build eng-mike-quality-tester → run baseline → refine Mike's prompts until 100% safety + high overall → final breaker pass → consolidated report for Brandon.

---

## Active engagement: eng-breaker staging validation loop (2026-05-28)

Brandon held the Week 1 batch from production after the 3 P0s surfaced (PWA banner mode-flip, drawer session-drop, camera 401 cascade). Branches were deployed to staging at `https://nodejs-staging-6c68.up.railway.app`. Production reverted to safety (`34bcfd5` hook hardening baseline).

Engagement: run the most thorough destructive suite possible against staging via the new `eng-breaker` agent → fix everything → re-run → loop until breaker can't find anything new. Significant token spend authorized.

In-scope blockers to address during the loop:
- P0 #1: PWA install banner dismiss flips homeowner mode → contractor PRO (Tom's prod finding)
- P0 #2: `actionDrawer.showModal()` destroys session (Sarah's prod finding)
- Medium #3: Camera+JWT 401 cascade (Apprentice's prod finding)
- Underlying root cause: something is producing 401s on `/api/ai` after specific UI events

Status: Pass 1 dispatching.

---

## Consolidated report fields (FINAL — batch complete 2026-05-28)

**Pushes staged on local main, ready for Brandon's single push:**
- Push 7.2 (`739535b`) — drawer stub-tile cleanup, CSS-only
- Push 7.4 (`bd416d9`) — signOut + 401 auth cleanup, frontend-only
- Push 7.3 (`c08cccb` + `230991f`) — camera hotfix (zoom + flipCamera + double-append + Escape), 2 locked-function edits

**Tuesday-Tech batch results (NEW blockers only):**
- Push 7.2: 0 new blockers (4/4 personas PASS)
- Push 7.4: 0 new blockers (4/4 personas PASS, e2e tester PARTIAL — code-confirmed)
- Push 7.3: 0 new blockers (4/4 personas PASS; visual zoom + flip-stuck recovery needs iPhone per Gap #008)

**Single git push command for Brandon:**
```
TRAZER_HOOK_OVERRIDE=1 git push origin main
```
Sends 4 commits to origin: 7.2, 7.4, 7.3 commit 1, 7.3 commit 2.

**Decisions queued (none gating ship; all logged below):**
- Push 7.1.2 ("(stopped)" suppression on self-abort) — queued as standalone, framed as trust issue, scope captured here
- 6 system upgrades — queued for dedicated build session
- Visual diagnostic test set (nameplate library + eng-camera-vision-tester) — queued post-Week 1
- Polish notes (non-blocking): Sarah's peek-bar Callback Shield routing inconsistency, Carlos's 1-frame "Hey Carlos" flash before auth overlay covers it on signout

**iPhone verification for 7.3 (Gap #008 protocol — Brandon runs post-deploy):**
Test script in batch checkpoint.

## State persistence rule

Update this file before any long-running agent dispatch so a laptop-sleep / session-end doesn't lose context.

---

## Queued: Push 7.1.2 — `(stopped)` suppression on self-abort (TRUST ISSUE, not nit)

Brandon corrected the framing 2026-05-28: the cosmetic "(stopped)" message is actually a trust-erosion issue. A real tech who sees "Something went wrong on my end" after a normal question loses faith in Mike. Push 7.1.2 must:

- Differentiate user-pressed Stop (intentional cancel — keep the "(stopped)" bubble) from self-abort (re-tap of send while a prior request is in-flight — `sendChat:5749–5753` self-aborts → catch fires → posts "(stopped)" inappropriately)
- On the self-abort path, suppress the bubble entirely. The user's new request takes over; the old one just dies silently.
- Implementation: set a flag in `stopChatStream()` when called from the self-abort path (`if(chatSending)stopChatStream()`); the catch at `public/index.html:5877` checks the flag and skips `appendMessage('agent','(stopped)')` when set, then clears the flag.

Scope: ~5 lines in `public/index.html`. No locked files. Stand-alone push after Week 1 batch completes.

---

## Queued: capability build — Visual diagnostic test set for Mike's camera intelligence

Brandon scoped 2026-05-28. **Queue for AFTER Week 1 batch completes**, do not start during the current batch. Tests Mike's actual diagnostic intelligence behind the camera, not whether the camera UI opens. This is the camera-moat proof — closes the verification gap Gap #008 documented (Playwright can't render a live camera stream, but it CAN feed real images into Mike's vision endpoint).

### Piece 1 — Nameplate image library (researcher build)
- Dispatch researcher to pull 25–30 real HVAC equipment images from the web: Trane/Carrier/Lennox/Goodman/Rheem data plates, condenser nameplates, capacitor labels, furnace rating plates, error-code LED displays, wiring diagrams
- For each image, document the CORRECT reading (model number, full specs, refrigerant type, error-code meaning, voltage/amp ratings, etc.) sourced from manufacturer docs/service manuals
- Save images + answer key to `.claude/context/nameplate-test-set/` with a manifest:
  - `images/<NNN>-<brand>-<type>.jpg`
  - `answers/<NNN>.md` (model, serial-decode, refrigerant, error code if any, full spec sheet quote, source URL)
- The visual equivalent of `.claude/context/mike-scenarios-v1.md` / `v2.md` for camera analysis

### Piece 2 — `eng-camera-vision-tester` agent
Build the agent at `.claude/agents/eng-camera-vision-tester.md`. Capabilities:
- Reads the test set manifest
- For each image: POSTs the image to `/api/ai` with the same SYSTEM prompt the live camera flow uses (`analyzeCameraFrame`'s sysPrompt), accepts the response
- Compares Mike's reading against the documented correct answer (structured fields: model_number, refrigerant, error_code, voltage_rating, etc.)
- Reports accuracy: which nameplates Mike reads correctly, which he misses, where he hallucinates, where he's confidently wrong
- Output: `.claude/context/camera-vision-reports/YYYY-MM-DD.md` with overall accuracy + per-image breakdown + samples of failure modes

### Why this matters
- Closes Gap #008's visual-verification gap on the SOFTWARE side (Mike's intelligence) — only iPhone hardware verification remains for the UI side (object-fit, FOV, etc.)
- Catches regression in Mike's vision when the underlying Claude model updates
- Creates a public-facing "Mike reads X% of HVAC nameplates correctly" claim Brandon can use in positioning
- Trade-off: each image-per-test costs an Anthropic API call. Test set of 30 = ~30 Anthropic calls per agent run. Run nightly (or weekly), cache results.

### Build order
After Week 1 batch ships:
1. Researcher dispatch → builds the image library (Sonnet, web-search heavy, ~30-60 min)
2. Implementer dispatch → builds `eng-camera-vision-tester.md` agent definition (Opus, ~15-30 min)
3. First test run → baseline Mike's current accuracy
4. Add as a weekly check alongside Tuesday-Tech rounds

---

## Queued: Polish Phase (after Mike knowledge build ships and promotes)

Brandon scoped 2026-05-28: once Mike's diagnostic intelligence is bulletproof and promoted, the next dedicated build is polishing the entire experience to billion-dollar fit-and-finish. Standard: smooth, clean, easy, always a "wow" feeling, keeps the user engaged. **Do NOT start until Brandon says go.**

Scope to plan:
- **Motion / micro-interactions**: every tap responds instantly (scale, haptic, color); 60fps everywhere; no jank
- **Mike's badge alive**: breathes idle, pulses listening, animates speaking
- **Drawer feels like a real Snap-On tool drawer**: weighted, satisfying slide
- **Loading states that feel useful, not idle**: Mike "checking the manual" not spinners
- **Sound design**: PTT radio chirp, Mike "I'm here" tone, tradesman audio not consumer
- **Onboarding conversation**: Mike learns the user, relationship starts, wow on first run
- **Continuity**: Mike greets by name, references last job, feels like a real relationship
- **Empty states alive, not sterile; error states sound like Mike, not "Error 500"**
- **Typography discipline everywhere** (Anton / Archivo / JetBrains Mono / Caveat per locked spec)
- **Color discipline everywhere** (safety yellow hi-vis only, teal Mike only, no drift)
- **Wow moments**: first voice reply, first camera nameplate read, recap video good enough to share

When this phase starts: run it through staging with the full eng-breaker suite + a new "feel/polish" evaluation pass, same standard as everything else.

---

## Queued: dedicated build session (tonight / this weekend — NOT today)

Six system upgrades scoped with Brandon 2026-05-28. **Do NOT build during today's Week 1 batch.** Brandon will allocate a dedicated build window.

Priority order when the build session opens:

**Tier 1 — "be the best, every feature" agents (build these first):**
1. **`eng-competitor-watcher`** — daily scan of Antar Vision, Avoca, Rebar, plus new entrants in the trades-AI lane. Emits a structured diff of what shipped / what changed / what the market is saying. Feeds Brandon's positioning decisions.
2. **`eng-mockup-designer`** — visual concepts before code, weekly cadence + on-demand. Generates static mockups (HTML/CSS sketches or annotated screenshots) so design direction is fixed before any implementation push starts.

**Tier 2 — operational infrastructure (build after Tier 1):**
3. **Live date/time awareness for all agents** — every agent dispatch should receive the current absolute date/time in its prompt. Today's date-change reminder (2026-05-27 → 2026-05-28) surfaced that agents lose track of "now" when sessions span days. Standard prompt injection at dispatch time.
4. **Continuous daily research mode (Option C — heavy)** — competitor monitoring + industry news + vendor changelog scraping (Anthropic, ElevenLabs, Stripe, Supabase, Railway). Daily cron, results land in `.claude/context/research/YYYY-MM-DD-*.md`. Higher cost than Options A/B; Brandon explicitly chose the heavy option.
5. **`eng-self-improver`** — auto-updates feature specs and agent definitions after every production bug. Reads the bug report, identifies which spec missed the scenario, opens a PR that adds the regression test to the feature spec + tightens the relevant agent's prompt. Closes the "system gets smarter every push" loop described in orchestrator.md.
6. **Friday CEO digest** — one consolidated weekly report to Brandon. Pulls from system-gaps.md, field-reports/, competitive-intel/, recent commits, and the competitor-watcher's diff stream. Single Friday-afternoon delivery (file + caption) so Brandon's weekend reading is one document, not many.

When the build session opens, start with #1 + #2 in parallel (both standalone agent definitions, independent), then sequence #3 → #4 → #5 → #6.

Cost note: Tier 1 + Tier 2 #4 introduce ongoing daily token spend. Brandon's cost-discipline rule in orchestrator.md still applies — Sonnet for crawls, Opus only for synthesis or strategic interpretation.

---

## 2026-05-28 — Mike knowledge build PART 2 (CHECKPOINT: brain edit applied to staging branch)

**State:** 5 splice edits applied to AGENT_SYSTEM in `public/index.html:4679`. All audit gates green. Awaiting commit + push to staging + Railway redeploy + full re-test cycle.

**Pre-edit baselines:**
- parseJSON=4, renderDiagCards=2, JOB_SAVED=6, data-lucide=38, brace delta=-1, index.js sha=e37af32e019092ac78c9e909f1713b6de3712b4292aecefa4c8214ce3e4b243b

**Post-edit state:** all sentinel counts and brace delta unchanged. index.js sha unchanged. `node --check` OK. AGENT_SYSTEM string length 42337 chars. All 6 blocks verified present.

**Blocks applied:**
- Block A — SAFETY-FIRST ORDERING (meta-rule before SAFETY block)
- Block B — A2L MANDATORY EQUIPMENT RULES (inside SAFETY block)
- Block C — anti-agreement on safety (appended to SELF-LEARNING block)
- Block D — EPA 608 / leak threshold / disposal corrections (in 2026 REGULATIONS)
- Block E — VERIFIED BRAND FAULT CODES (12 codes, manufacturer-manual sources only)
- Block F — BRAND-SPECIFIC FAULT CODES MANDATORY SEARCH rule

**Quality test baselines (before the brain edit):**
- Residential: 77.7% overall, 91.7% safety (1 BLOCKER: SCN-RES-098 heated diode)
- Commercial: 69.9% overall, 97.4% safety practical, 0 BLOCKERS, 4 fault-code misIDs
- Refrigeration+boilers: 86.2% overall, 100% safety, 0 hallucinations
- Safety+refrigerants: 77% overall, 99% safety (1 BLOCKER: SCN-SAF-062 R-410A recovery on R-454B)
- Overall: ~76%, 96.7% safety, 2 hard A2L blockers, 16 brand misIDs

**Targets after re-test:**
- 100% safety (Brandon non-negotiable)
- 95%+ overall
- 0 hallucinated fault codes

**Approval trail:** Brandon reviewed final text in `.claude/context/mike-patch-2026-05-28-FINAL.md`, reviewed 2 sample dialogues, said "apply" at 2026-05-28 ~12:30. He caught an earlier draft hallucination (Carrier 25VNA fault 45 was wrong; corrected by dropping Carrier 25VNA entries entirely). Brandon will personally review the final AGENT_SYSTEM diff before staging→production promotion.

**Polish Phase still queued — do NOT start until Brandon says go.**
**Push 7.1.2 "(stopped)" suppression still queued.**
