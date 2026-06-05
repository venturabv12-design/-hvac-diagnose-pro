# Feature spec: Mike shows real wiring diagrams (Phase 2)

## What it is
When a tech asks Mike for a wiring diagram / schematic on a unit Mike has the OEM
manual for, Mike answers in prose AND renders the **actual wiring-diagram image**
from that manufacturer's service manual, inline in the chat — tappable to full screen.

## How it works (for testers — don't test internals, test the experience)
- Tech is signed in, in the tech/contractor chat (the Mike-dial home → chat).
- Tech sends a wiring question, e.g.:
  - "show me the wiring diagram for a Goodman AVZC18 inverter heat pump"
  - "pull up the wiring schematic on a Goodman gas furnace"
  - "what's the wiring diagram for a Carrier 58 furnace"
- Mike replies with text, and **below the prose a diagram card appears**: a small
  teal "📐 …manual title · p.NN" caption bar over the rendered schematic image.
- Tapping the image opens it full-screen (existing image overlay). Tapping again closes.

## Acceptance criteria
1. **Diagram renders** for at least one known-good brand (Goodman furnace/heat pump).
   The image is a legible schematic (terminals, labels), not blank/broken.
2. **No raw sentinel text** ever appears in the chat. If you EVER see the literal
   string `MIKE_DIAGRAM` or `⟦…⟧` in Mike's message, that's a FAIL.
3. **Mike does not read the sentinel aloud** in voice mode — the spoken reply is the
   prose only, no "left bracket MIKE DIAGRAM…".
4. **Graceful when absent**: for a brand/model with no ingested diagram, Mike answers
   in prose with no broken image, no empty card, no error.
5. **Image is tappable** → full-screen overlay opens and closes.
6. **No layout break** at 390px and 320px width — the card fits, image scales to width.
7. **Homeowner side unaffected** — no diagram card, no pricing, no behavior change.

## Known-good test target (seeded)
- Brand **Goodman**, ask: *"show me the wiring diagram for a Goodman AVZC18 inverter heat pump"*
  → expect a diagram card citing the Goodman/Amana RS6215001 service manual, ~p.82–83.

## Out of scope (not this feature)
- Generated/illustrated diagrams (the existing 📐 "Generate diagram" flow) — separate.
- Homeowner diagnostics, pricing, voice greeting.
