# Feature Spec: <FEATURE NAME>

**Feature ID:** <kebab-case-id>
**Surface area:** <where this lives in the app — e.g. "Contractor chat header", "Bottom drawer", "Voice call screen">
**Last updated:** <YYYY-MM-DD>
**Spec owner:** Brandon
**Implementation file(s):** <e.g. public/index.html lines 1234-1567>

---

## What this feature does

One paragraph in plain English. What does a real user accomplish with this? Not what the code does — what the user does.

---

## The user journey

Walk through it like a real tech or homeowner using the app. Step-by-step, observable actions. Include all the realistic ways someone might engage.

1. User does X
2. App responds with Y
3. User does Z
4. App responds with W
5. ...

---

## Every state this feature has

List every visible state. Empty, loading, active, error, success, edge cases.

- **Default state:** what it looks like when nothing has happened yet
- **Loading state:** what it looks like while working
- **Active state:** what it looks like during use
- **Success state:** what it looks like after success
- **Error state:** what it looks like when something fails
- **Empty state:** what it looks like when there's no data
- **Disabled state:** what it looks like when not usable

---

## What "working" means (the assertions)

These are the testable claims. Each one is a yes/no answer that e2e-tester can verify.

- [ ] Assertion 1 (concrete and observable)
- [ ] Assertion 2
- [ ] Assertion 3
- [ ] ...

---

## Known gotchas

Edge cases, browser quirks, mobile-specific behavior, iOS Safari weirdness, anything that's bitten us before. Each one becomes a regression test.

- **Gotcha 1:** describe the situation, what goes wrong, how to verify it doesn't happen
- **Gotcha 2:** ...

---

## Scenarios for e2e-tester

Real-user journeys e2e-tester walks through. Each scenario describes what the user is trying to accomplish and what success looks like FROM THE USER'S PERSPECTIVE — not from a button-exists checklist perspective.

### Scenario 1: <name describing the user goal>

**User context:** who they are, where they are, what they want
**Steps:**
1. User does X
2. User does Y
3. User does Z

**Expected outcome:** what should happen, observable
**Failure modes to watch for:** what could go wrong, how to recognize it

### Scenario 2: ...

---

## Out of scope for this spec

What this spec does NOT cover. Other features that interact with this one but live in their own spec.

---

## Sources / decisions

Why is this feature built the way it is? Locked principles, design rationale, business decisions. Helps future-Brandon and future-agents understand WHY before changing HOW.
