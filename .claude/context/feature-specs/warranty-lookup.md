# Feature spec — Real warranty registration lookup

**Status:** live on production 2026-08-28. Written after the fact, which is itself a
finding: this shipped without a spec, and the E2E tester correctly refused to test
against acceptance criteria it would have had to invent.

**Why this exists:** a serial number decodes to a BUILD DATE, which tells you a unit's
age and nothing about whether the homeowner registered it. Registration is what turns a
5-year base part warranty into a 10-year one. Brandon's own company mandates *"before you
quote it check the warranty."* Mike guessing "likely covered" off a build date is the
exact failure this replaces — a tech who quotes free work on an uncovered unit eats the
part.

## The rule that outranks everything else

**Mike must never state or imply coverage he has not read from the manufacturer.**
A wrong "covered" costs money and trust. Every failure path below resolves to an honest
"I couldn't check, here's why" — never to a guess.

## Brand coverage (verified by opening each form 2026-08-28)

| Brand family | Form requires |
|---|---|
| Trane / American Standard | serial |
| Carrier / Bryant / Payne | serial + original-purchaser |
| Goodman / Amana / Daikin | serial + model + homeowner last name + zip |
| Rheem / Ruud | serial + homeowner last name + state |
| Lennox / Armstrong / Ducane | serial + homeowner last name + zip |
| Mitsubishi Electric | serial + model |

Unknown brand → Mike says he does not have it wired. Never guesses a neighbouring brand.

## Entry points — all three must reach the registry

1. **Check Warranty tile** → Mike asks for the unit → next message routes to lookup.
2. **Scan Nameplate** → reads brand/model/serial → auto-runs the lookup.
3. **Plain chat** — a photo and/or "check this warranty" typed normally.
   This is how a technician actually behaves and was broken until 2026-08-28: the
   message went to the general chat brain, which answered from training and wrongly
   claimed Carrier was login-gated.

## Acceptance criteria

**A. Composer is empty on load.**
Signing in shows an EMPTY input with grey placeholder text. No pre-typed sentence the
tech has to delete. (Regression: `seedFirstPrompt` wrote real text until b5871ae.)

**B. Warranty intent routes to the registry, not the chat brain.**
GIVEN a message matching warranty/registration/covered/coverage
AND a photo attached OR a serial present in the text
THEN the request goes to `/api/warranty` — NOT to `/api/ai`.
Verify: Mike's reply reports registration status or an honest failure. It must never
hand the tech a manufacturer URL and tell him to look it up himself when that brand is
in the supported table.

**C. General questions are NOT hijacked.**
"how long is a compressor warranty", "what is a warranty", "does warranty cover labor"
— no serial, no photo — go to Mike normally.

**D. Human details are parsed from plain speech.**
"the last name of the homeowner is Weiler" → lastName = `Weiler`.
NOT `of`, NOT `the`, NOT `homeowner`. (Regression: the first parser returned `of`, which
would query the manufacturer for a customer named Of and report "no registration found"
on a covered unit.)

**E. Missing required fields are ASKED FOR, not silently skipped.**
Goodman/Lennox without a last name → Mike asks for the last name. He does not run a
half-filled form and report "not found".

**F. Visible feedback during the lookup.**
The agent path takes 20–60s. A typing indicator or status line must be on screen the
whole time. Silence longer than ~10 seconds is a defect — it reads as frozen.

**G. Manufacturer outage says whose fault it is.**
Site down/5xx/404 → "Can't check that one right now — <Brand>'s warranty site is down.
Nothing wrong on your end." Never a bare "couldn't check", which makes a tech conclude
the tool is broken and stop using it.

**H. Not-found is explained, not implied as uncovered.**
"No registration came back" must name the two real causes — a mistyped serial, or a unit
that was genuinely never registered — because the second means base coverage, which is
itself the answer the tech needs.

**I. No customer data leaves the service.**
Manufacturer result pages carry the homeowner's install address. Address, unit, zip,
phone and email are scrubbed before any page text reaches a model. Model number and
serial must SURVIVE the scrub. (Regression: the scrub ate `Unit 4TWR6036H1000AA` and the
10-digit serial `1904512345`.)

**J. Layout holds at phone width.**
390×844. No overlapping text, no clipped bubbles, nothing under the composer.

## Out of scope

York/JCI, ICP (Heil/Tempstar/Comfortmaker), Nortek/Frigidaire, Bosch, Bard — real public
lookup pages not yet located. Mike says he does not have them; he does not guess.

## Verified behaviour of the real forms (2026-08-28, driven live)

**Goodman's model dropdown is populated FROM the serial, not by the tech.** It is empty on
page load; entering serial `2103456789` and firing a change event turns the list into exactly
one option, `GSZ140241`, because Goodman derives the model from the serial. Two consequences
any future change must preserve:

- **Fill text fields before selects, then wait.** Reading the form once at load and planning a
  `selectOption` against the empty list is what made every Goodman lookup fail — the select
  threw, the error was swallowed, and the search submitted with no model.
- **The tech's typed model may legitimately not match.** Goodman answers with the model IT has
  for that serial. When the derived list holds exactly one option, take it. Refusing because
  the tech typed a different model throws away a working lookup.
- The `#ModelNumber` element is not actionable once the page sets it, so `selectOption` blocks
  for its full default 30s and returns nothing useful. Skip it when the value is already right.

A full live run returns: model, description, manufacture date, base parts term, and whether the
unit was registered — everything criterion H needs. End to end it takes ~21s.
