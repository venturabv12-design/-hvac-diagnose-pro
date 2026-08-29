---
name: numbers
description: Pull VERIFIED Trazer/Mike metrics — accounts, active techs, questions, jobs, traffic, conversion, revenue. Use whenever Brandon asks how many techs, how many questions, what the numbers are, or when any figure is going into a deck, an email, or a claim to an outside party.
---

# The real numbers, the same way every time

Getting these wrong in front of a buyer is the expensive kind of mistake. On
2026-08-27 a deck went out claiming "two answers were flagged wrong by a tech"
when both flags came from the QA testing account — no technician had ever
flagged anything. Same week, counts came back short because PostgREST silently
caps returned rows and the query counted rows instead of asking for a count.

This procedure exists so those two failures cannot repeat.

## Non-negotiables

**Exclude the house accounts.** QA CREW `7725dfff-9e37-4eb9-a2cd-5d8c547fbeb3`
and admin `8c63d02a-e2cc-4401-b457-74d98c8752bd` are Claude and Brandon. They
are NOT technicians. Every externally-quoted figure excludes both.

**Never count rows to get a total.** PostgREST truncates. Use
`Prefer: count=exact` and read `content-range`. Counting a returned array is
how "396 asks" became "65".

**Run the Railway CLI from `/Users/brandonventura/Desktop/trazer` only.** From
any other directory it returns nothing and you get a bogus 401.

**Say what a number IS.** `mike_ask` counts REQUESTS, and the client retries
up to 3x on failure, so it overstates distinct questions. `mike_answer` is
under-logged and must never be used as a denominator for accuracy.

**Date every figure.** "As of <date>", and never annualise a year-to-date
number — HVAC is seasonal and Jan–Aug already contains peak cooling.

## Pull it

!`cd /Users/brandonventura/Desktop/trazer && bash scripts/numbers.sh 2>&1 | tail -40`

## Reading the output

- **accounts** — total signed up. **active** — how many ever asked anything.
  Quote BOTH; "18 signed up, 10 actually use it" is stronger and honest.
- **questions** — real technicians only, retries included (say "questions
  asked", not "distinct questions").
- **jobs opened / closed** — from `job_start` / `job_closed` events. The
  `jobs` TABLE is empty; job saves fail on a schema mismatch. Do not query it.
- **answer flags** — if this is 0, the honest line is "no technician has
  flagged an answer wrong, and I'm not selling that as an accuracy number
  because nobody has been asked to grade it."

## Before any number leaves this machine

1. Is it excluding QA and admin?
2. Did it come from `count=exact`, not a row count?
3. Does the sentence say what the number actually measures?
4. Is it dated?

If a figure is going into a deck, also confirm it against the slide it lands
on — a stale slide is the same lie as a wrong query.
