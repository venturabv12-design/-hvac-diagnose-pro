# OUTCOME CAPTURE — "Mike closes the loop" (Brandon's spec, dictated 2026-10-07)

> Written in Brandon's money/strategy session as a HANDOFF. This session built nothing.
> The Mike build session owns implementation. One builder, no collisions.

## Why (the business case, verified 2026-10-07)
41 real techs asked Mike 1,714 questions in 53 days (house accounts excluded) — but feedback
captured = 0, so we can prove USAGE and not VALUE. Bluon (133k techs, the market leader) proves
value with nothing but adoption + partner stats + an unaudited "99% accurate" claim — the industry
evidence bar is that low. Even crude outcome capture puts Mike's evidence ABOVE the market leader,
and it feeds the PE/pilot deck: first-time-fix rate, repair-vs-replace, revenue per tech, retention.
This data is the Apex/Furr pilot story.

## Brandon's design (his words, his calls)
1. **Conversational capture — PRIMARY.** When a job-type conversation wraps (fix suggested, tech
   signing off or going quiet), Mike asks IN THE FLOW, like a mentor, not a form:
   "Before you roll — that was the capacitor, right? First-trip fix? Repair or replace?"
   One natural reply = first_time_fix + fix_type + repair_vs_replace. Also plant the hook:
   "let me know how she runs" → techs come back on their own (retention + soul).
2. **Open-loop pop — Brandon's key insight.** Techs don't say "thanks, got it." If a conversation
   had a fix suggested but NO outcome, it's an OPEN LOOP on that tech. Next time the tech starts a
   NEW conversation or changes subject, Mike leads with ONE line first:
   "Hey, before we get into this one — how'd that last call turn out? We make money?"
   …then answers the new question IN THE SAME MESSAGE. Never blocks, never withholds the answer.
3. **App lifecycle telemetry.** Log it all per tech: app open, app close/background
   (visibilitychange/pagehide), conversation start, conversation abandon (fix suggested → silence),
   reopen gap. Feeds DAU/WAU, session length, return-gap, stickiness curves — the retention proof.
4. **Scoreboard payoff (the tech's reason to answer).** Their stats, not our reporting:
   "Your week: 9 jobs, 7 first-trip fixes, ~$4,200 closed." Revenue question is framed as THEIR
   win tracker ("how much did we make?"), optional, never required.

## Tone guards (so Mike stays a friend, not a form)
- Fires ONLY on job-classified conversations (model/symptom/fix present) — never on quick code or
  warranty lookups.
- Asks ONCE per open loop. Ignored = logged as unresolved, one quiet retry via open-loop pop on the
  next session, then dropped.
- Staleness cap: don't ask about loops older than ~7 days ("how'd that call 3 weeks ago go" = creepy).
- Max one outcome question per message. Open-loop pop + new answer always in the SAME message.
- Output-side implementation — same philosophy as the safety-guard tails.

## Time-grounding (Brandon's addition 2026-10-08 — REQUIRED for everything above to feel human)
Mike must ALWAYS know: current date/time (tech's timezone), and the timestamp of every prior
conversation/open loop. Inject into the brain on EVERY request:
- "Now: Thursday Oct 8, 2:40 PM"
- "This tech's last conversation: yesterday 2:12 PM — Trane XR15 defrost board, fix suggested,
  NO outcome captured (open loop)."
So Mike speaks in real time-language: "yesterday afternoon," "this morning," "last Tuesday" —
NEVER "previously" or "in a past conversation." The open-loop pop must reference when:
"Yesterday around 2 you were on that Trane defrost board — how'd that turn out? What'd it sell for?"
Rationale: Brandon caught his own assistant speaking as if it were the previous day mid-session.
A Mike who doesn't know what day it is cannot be "the friend who remembers." Elapsed-time rendering
rules: <6h = "earlier today" · yesterday = "yesterday [morning/afternoon]" · <7d = weekday name ·
beyond staleness cap (7d) = don't bring it up at all.

## Server-side pieces
- **Auto-job classification**: classify conversations as job-like server-side (model number, symptom,
  fix suggested). No tech action required. Can be run retroactively on the 1,714 logged questions.
- **Outcome parsing**: parse the tech's natural reply ("yeah first trip, swapped it, they went
  repair") into structured fields: {first_time_fix, fix_type, repair_or_replace, revenue?}.
- **Open-loop state** per tech (list of conversation_ids w/ fix-suggested + no outcome + <7d old).
- **FIX THE JOBS TABLE**: job saves currently FAIL on a schema mismatch (jobs table is empty;
  job counts only exist in events). This is the spine of before/after pilot data. Fix first.

## Metrics this unlocks (the pilot one-pager)
- First-time-fix rate with Mike (the number a GM buys)
- Repair-vs-replace mix + self-reported revenue per tech
- Retention/stickiness curves per tech (the number PE buys)
- Jobs/week per tech, outcome-close rate on open loops

## Build order
1. Jobs-table schema fix (unblocks everything)
2. Lifecycle telemetry events (cheap, frontend, starts accruing immediately)
3. Auto-job classification (server)
4. Conversational wrap-up ask + open-loop pop (brain/output layer, tone guards above)
5. Outcome parsing → structured storage
6. Scoreboard slice in the tech-development dashboard (last — needs the data flowing first)

## Hard rules
- Preserve the safety/pricing guard layer and auth untouched (index.js discipline per CLAUDE.md).
- Feature branch, gates, Brandon's "push it" for prod — as always.
- QA/admin accounts excluded from all outcome metrics (same rule as /numbers).
