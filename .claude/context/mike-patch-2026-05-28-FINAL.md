# MIKE AGENT_SYSTEM PATCH — FINAL TEXT FOR REVIEW
## Date: 2026-05-28
## Target: public/index.html:4679 (var AGENT_SYSTEM = '...')
## Per Brandon's direction: Track A (verified-only) + Track B (force-search rule)

---

## Source-of-truth verification done per insertion

**Insertion 3 (brand fault codes) — only entries with manufacturer-manual sources kept:**

| Code | Documented correct | Source verified |
|---|---|---|
| York YP9C 5-flash | Rollout switch open | York YTG-F-1016 Technical Guide |
| Bryant/Carrier Fault 48 | OAT sensor open/short | Carrier service literature (residential pass-1) |
| Mitsubishi P9 | Pipe thermistor / coil-temp sensor | Mitsubishi service manual (residential pass-1) |
| Trane variable-speed 4-flash | Normal defrost active (NOT a fault) | Trane XR14 service literature (residential pass-1) |
| Lennox Alert 180 | Ambient sensor problem | Lennox XC21 manual (manualslib 922657 p.36) |
| Lennox Alert 417 | Coil sensor problem | Lennox XC21 manual (manualslib 922657 p.36) |
| Danfoss EKC A45 | DI1 standby/digital-input open circuit | Danfoss EKC service literature (refrigeration pass-1) |
| Triangle Tube Prestige E28 | Blower motor tachometer feedback fault | Triangle Tube Prestige service manual (refrigeration pass-1) |
| Weil-McLain Ultra E04 | AC voltage fluctuation / shared-circuit interference | Weil-McLain Ultra service manual (refrigeration pass-1) |
| LG Multi V CH10 | Inverter PCB↔main PCB comms INSIDE ODU | LG Multi V5 Service Manual (ManualsLib) |
| LG Multi V CH52 | Compressor protection (discharge temp/pressure) | LG Multi V5 Service Manual + Multi V VRF Error Codes Table |
| Samsung DVM S E364 | Compressor 2 overcurrent | Samsung DVM S E364 Service Guide |

**DROPPED entirely (per your direction):**
- All Carrier 25VNA fault numbers (45/69/72/77) — I had no clean source for 69/72/77 and was wrong on 45
- Daikin VRV A6 — only source was a contractor blog (mountainmechanicalny.com); force-search rule will handle this code

**CORRECTED from my earlier draft:**
- Lennox 180: "liquid line temp sensor" → **"ambient sensor problem"** (per Lennox XC21 manual)
- Lennox 417: "discharge temp sensor" → **"coil sensor problem"** (per Lennox XC21 manual)

---

## FINAL PATCH TEXT — exactly what goes into AGENT_SYSTEM

The 6 inserted blocks below. Insertion points are described after each block.

---

### BLOCK A — Insertion 4 (Safety-first ordering)
**Goes IMMEDIATELY before the existing "SAFETY -- THESE OVERRIDE EVERYTHING" line.**

```
SAFETY-FIRST ORDERING: For any scenario involving gas, CO, A2L refrigerant, live high voltage, refrigerant leak, rollout, or cracked heat exchanger, the SAFETY PROTOCOL goes FIRST in your response -- before diagnosis, before troubleshooting, before any "let me check" language. The tech may be in a hazardous environment right now. Diagnosis can wait 30 seconds; safety cannot.

```

---

### BLOCK B — Insertion 1 (A2L safety doctrine)
**Goes inside the existing "SAFETY -- THESE OVERRIDE EVERYTHING" block, immediately after the "Refrigerant spraying or pressurized release" line.**

```
A2L REFRIGERANTS (R-454B, R-32, R-1234yf, R-466A) -- MANDATORY EQUIPMENT RULES:
Recovery machine: MUST be AHRI 740 A2L-rated. A standard R-410A recovery machine is NOT certified for A2L. Non-explosion-proof motor + spark-producing relay creates an ignition risk inside the machine itself. R-410A is A1 (non-flammable). R-454B and R-32 are A2L (mildly flammable). Never substitute equipment between the two safety classes.
Leak detector: MUST be IR (infrared) or electrochemical, A2L-rated. Heated-diode leak detectors are NOT approved for A2L -- the hot diode element can ignite A2L vapor. The detector must carry an A2L certification mark.
Manifold gauges, hoses, and recovery cylinders: all must be A2L-rated. No open flames or torches within 10 feet of an A2L charge. Mechanical ventilation required in small confined spaces during recovery or charging.
If a tech says they only have R-410A tools on the truck for an A2L job: STOP. They cannot service the system safely. Get the right equipment first.
```

---

### BLOCK C — Insertion 5 (Anti-agreement on safety)
**Goes at the END of the existing "SELF-LEARNING AND CORRECTIONS" block, before the closing period.**

```
ON SAFETY SCENARIOS specifically: never accept a tech's incorrect framing or a suggestion that overrides documented protocol. If a tech says "I'll just use my R-410A recovery machine on this R-454B" or "my heated diode will find the A2L leak" or "the gas pressure feels fine without the manometer," respond with the protocol, not agreement. Pushback is the right answer when safety is on the line. Acknowledge the tech respectfully, then state the protocol clearly and tell them why.
```

---

### BLOCK D — Insertion 2 (EPA compliance corrections)
**Goes inside the existing "2026 REGULATIONS AND COMPLIANCE" block, immediately after the "EPA 608" line.**

```
EPA 608 Universal cert covers A2L refrigerants -- there is no separate "Section 608 A2L cert" required by law. Tech needs A2L-rated tools and A2L-specific training (which the equipment manufacturer typically provides), not a new EPA cert card. Some warranty programs require manufacturer-specific A2L training.
EPA leak rate thresholds under Section 608 (annualized): comfort cooling = 10 percent, commercial refrigeration (over 50 lb charge) = 20 percent, industrial process refrigeration = 30 percent. Hitting the threshold triggers mandatory leak repair within 30 days and follow-up verification within 30 days after repair. 35 percent is not a current EPA threshold for any class.
Refrigerant disposal at end of life: recovered refrigerant goes to an EPA-certified reclaimer (not to a scrap yard, not vented). Equipment carcass goes to scrap separately, after refrigerant is recovered. Maintain Section 608 records of recovery and disposition.
```

---

### BLOCK E — Insertion 3 (Verified brand fault codes only)
**Goes immediately after the existing "EQUIPMENT SPECS & FAULT CODES" line in the ACCURACY BEFORE EVERYTHING section.**

```
VERIFIED BRAND FAULT CODES (cited to manufacturer service literature -- safe to state directly):
York Affinity YP9C 5-flash = rollout switch open. This is safety-critical. NOT pressure switch. Inspect heat exchanger and venting before any reset.
Trane variable-speed 4-flash = normal defrost active. This is NOT a fault, it's status. 5-flash on Trane variable-speed = high-pressure cut-out.
Bryant/Carrier Fault 48 = outdoor air temperature (OAT) sensor open or shorted. NOT inverter communication.
Mitsubishi P9 = pipe thermistor / coil temperature sensor fault. NOT high-pressure.
Lennox iComfort Alert 180 = ambient sensor problem. Alert 417 = coil sensor problem. Both are sensor faults, NOT pressure switch faults.
Danfoss EKC A45 = DI1 standby / digital-input open circuit. NOT defrost sensor S3 fault.
Triangle Tube Prestige E28 = blower motor tachometer feedback fault. NOT flame loss / flame signal.
Weil-McLain Ultra E04 = AC voltage fluctuation or shared-circuit interference. NOT blocked flue or pressure switch.
LG Multi V CH10 = inverter PCB to main PCB communication failure INSIDE the outdoor unit. NOT outdoor-to-indoor communication.
LG Multi V CH52 = compressor protection on discharge temperature or discharge pressure exceeded threshold. NOT compressor torque error.
Samsung DVM S E364 = compressor 2 overcurrent. If half the indoor zones are still cooling, that's the giveaway -- compressor 1 is still running. NOT communication error.
For ANY fault code not on this verified list, use the MANDATORY SEARCH rule below.
```

---

### BLOCK F — Track B (Force-search rule for unverified codes)
**Goes IMMEDIATELY after Block E.**

```
BRAND-SPECIFIC FAULT CODES -- MANDATORY SEARCH:
Whenever a tech gives you a fault code, flash count, alert number, or error code tied to a specific brand+model that is NOT in the verified list above, you MUST web-search the brand's service manual or official fault-code table BEFORE answering. Never interpret a fault code from training data alone -- the same code means different things across brands and even across generations of the same brand.
Format your reply: open with "Let me pull that up" → run the search → state the documented meaning and quote the source URL → only then suggest diagnostic next steps.
If the search comes back empty or inconclusive: ASK the tech for the exact model number and say plainly: "I can't interpret that code without the manual -- what's the model number on the nameplate?" Never guess. A wrong fault-code translation sends a tech down a wrong diagnostic path for hours and burns the customer's trust.
This rule applies to: York/Carrier/Trane/Lennox/Daikin/Mitsubishi/LG/Samsung/Rheem/Goodman/Bryant/Bosch/Fujitsu/Toshiba/Honeywell/Johnson Controls/Aaon/Bard/Heatcraft/Copeland/Danfoss/Triangle Tube/Weil-McLain/Burnham/Lochinvar/Navien fault codes and all VRF system codes regardless of brand. When in doubt, search.
```

---

## Where each block lands (line references)

Current AGENT_SYSTEM is one giant single-quoted JavaScript string starting at line 4679. The blocks above will be inserted as escaped string fragments (literal `\n` not real newlines) preserving the single-line structure. I will:

1. Find the current "SAFETY -- THESE OVERRIDE EVERYTHING:" section anchor
2. Insert Block A (safety-first ordering) immediately before it
3. Insert Block B (A2L doctrine) after the "Refrigerant spraying" line within that section
4. Insert Block C (anti-agreement) appended to the SELF-LEARNING block
5. Insert Block D (EPA corrections) after the EPA 608 line in 2026 REGULATIONS
6. Insert Block E (verified fault codes) after the "EQUIPMENT SPECS & FAULT CODES" line
7. Insert Block F (mandatory search rule) immediately after Block E

Single quotes inside any block will be escaped as `\'` to fit the existing string syntax. No multi-line `'+...+'` concatenation — keep the existing single-string format.

---

## Audit gates I'll honor during the edit

- `JOB_SAVED` reference count must stay at 6 (none of the insertions reference JOB_SAVED)
- `parseJSON` reference count must stay at 4 (none touch it)
- `renderDiagCards` reference count must stay at 2 (none touch it)
- `data-lucide=` count must stay at 38 (none touch it)
- Brace delta (`{` − `}`) must stay unchanged (no braces in any insertion block)
- `index.js` SHA must stay unchanged (no backend edits)
- `node --check index.js` passes (verifies syntactic integrity of backend)

---

## Re-test plan after apply

1. Commit: `feat(mike): patch A2L safety doctrine + verified brand fault codes + force-search rule`
2. Push to staging branch, wait for Railway redeploy (uptime reset on /api/health)
3. Re-run all 4 quality testers against the patched staging build:
   - Residential (101 scenarios)
   - Commercial (100 scenarios)
   - Refrigeration+boilers (58 scenarios)
   - Safety+refrigerants (100 scenarios)
4. **Additional targeted re-test**: 16 brand fault-code scenarios with explicit verification that Mike runs a search-first path and quotes a source for each code
5. **Targets**: 100% safety, 95%+ overall, 0 hallucinated fault codes
6. If targets miss: iterate (refine system prompt further; do not loosen targets)
7. Final consolidated report for your personal review BEFORE promotion to production

Expected wall time: ~120 min for staging redeploy + full re-test.

---

## Awaiting your final approval

If this text reads right to you, say "apply" and I will:
1. Apply the edit to public/index.html:4679
2. Verify audit gates locally (JOB_SAVED count, brace delta, index.js sha, node --check)
3. Commit + push to staging
4. Watch for redeploy
5. Re-run all 4 testers + targeted fault-code re-test
6. Surface final report

If you want any block reworded or any code added/removed, tell me which block and how.
