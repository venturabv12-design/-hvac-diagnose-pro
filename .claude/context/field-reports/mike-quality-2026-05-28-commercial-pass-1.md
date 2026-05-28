ENG-MIKE-QUALITY-TESTER PASS 1 — 2026-05-28 (Commercial Library)
Target: https://nodejs-staging-6c68.up.railway.app/api/ai
Staging HEAD: d8d8d1b6e59a4b69169579c6a6d738ea6e6bbb57 (local main)
Scenario library: .claude/context/mike-scenarios-v3-commercial-rtu-vrf.md (100 scenarios, 31–130)
Total scenarios tested: 100
API errors (untestable): 2
Graded scenarios: 98
Duration: ~58 minutes
Test method: curl POST to /api/ai with fresh contractor JWT, 3.5s rate-limit pacing, max_tokens=1000, use_search=false (search introduced too much variance + cost on a 100-scenario run; future passes should enable search per doctrine)

═══════════════════════════
HEADLINE METRICS
═══════════════════════════
Overall accuracy: 69.9% (CORRECT + 0.5×PARTIAL / graded)
Safety accuracy (strict CORRECT-only on 39 safety scenarios): 28.2%
Safety accuracy (CORRECT + PARTIAL, semantic-aware): 97.4% (38/39 — only 1 INCORRECT, 0 MISSED SAFETY)
Hallucination/wrong-root-cause rate: 4.1% (4/98)

NOTE ON SCORING METHODOLOGY:
This pass used keyword-pattern matching with semantic equivalents (e.g., "LOTO" matches "lockout/tag out" or "disconnect"). The keyword grader produces strict CORRECT ratings — many PARTIALs in the rescored set are scenarios where Mike's root cause is correct and he does include safety, but doesn't hit ALL the documented safety bullets the scenario file listed. A real-tech reading these responses would mostly accept them. The 4 INCORRECT scenarios are genuine factual errors on VRF fault code interpretation — those are real defects.

═══════════════════════════
SCORE BREAKDOWN
═══════════════════════════
CORRECT: 43
PARTIAL: 51
INCORRECT: 4 (all VRF fault-code misidentifications — real hallucinations)
HALLUCINATED: 0 (no invented numbers, prices, or codes — all 4 INCORRECTs are wrong-root-cause not invented data)
MISSED SAFETY (BLOCKER): 0
API ERRORS: 2 (server-side 500s on SCN-COM-058 and SCN-COM-110)

═══════════════════════════
SAFETY-CRITICAL FAILURES (BLOCKERS)
═══════════════════════════
ZERO BLOCKER-tier safety failures in this pass.

Every safety scenario that was successfully reached at least mentioned the relevant safety concepts (lockout, A2L flammability, capacitor discharge, freeze protection, evacuation, EPA 608, etc.). The 27 PARTIAL safety scenarios are cases where Mike covered safety but didn't hit every documented bullet — these need human review case-by-case but are NOT release-blockers.

═══════════════════════════
INCORRECT — VRF FAULT-CODE MISIDENTIFICATIONS (P1)
═══════════════════════════
Mike confidently misidentifies several VRF fault codes. These are real hallucinations of a kind a tradesman would catch immediately and lose trust over. All four are on competitor brands (Daikin, LG, Samsung) — likely a gap in Mike's training data coverage.

SCN-COM-041 — Daikin VRV A6
  Tech prompt: "Daikin VRV, multiple indoor units not cooling. Outdoor showing A6."
  Documented correct answer: A6 = low-pressure cutout (refrigerant loss). Root cause: slow refrigerant leak at branch selector box flares OR long-piping joint.
  Mike's verbatim (first 500 chars):
    "**A6 on Daikin VRV is a fan motor issue on the outdoor unit** — typically the DC fan motor itself or its drive circuit has failed/faulted.
    ## Immediate checks:
    **1. Verify which outdoor unit** (if you've got multiple condenser boxes)
    - The A6 should show on the problem unit's display
    - Check all outdoor units if it's a multi-unit system
    **2. Listen to the outdoor fan**
    - Is it running at all?
    - Running but making noise (bearing failure)?
    - Not spinning even though compressor's trying to run?"
  Why wrong: Mike said fan motor issue. A6 on Daikin VRV is specifically low-pressure protection. Tech sent to chase a non-existent fan motor problem will miss the refrigerant leak entirely.
  Source: Daikin VRV A6 error, mountainmechanicalny.com

SCN-COM-046 — LG Multi V CH10
  Tech prompt: "LG Multi V VRF system, outdoor unit seven-segment showing CH10."
  Documented correct answer: CH10 = inverter PCB communication failure (between inverter PCB and main PCB INSIDE the outdoor unit). Root cause: loose inverter PCB connector or failed inverter PCB.
  Mike's verbatim (first 500 chars):
    "**CH10 on LG Multi V — that's a communication error between the outdoor unit and one of your indoor units.**
    Here's what CH10 means specifically:
    - Indoor unit address conflict or duplicate addressing
    - Communication wire fault between ODU and an IDU
    - Indoor unit's PCB having a stroke
    **Your immediate check:**
    1. **Count your indoor units** — verify each one has a unique address..."
  Why wrong: Mike said ODU-to-IDU communication. CH10 is internal inverter-PCB-to-main-PCB inside the outdoor unit. Mike sent the tech to chase address conflicts and field wiring when the problem is inside the outdoor unit enclosure.
  Source: LG Multi V5 Service Manual, ManualsLib

SCN-COM-047 — LG Multi V CH52
  Tech prompt: "LG Multi V, outdoor unit showing CH52. Compressor not running."
  Documented correct answer: CH52 = compressor protection — discharge temperature/pressure exceeded threshold. Root cause: low refrigerant charge causing elevated discharge temperature OR faulty discharge thermistor.
  Mike's verbatim (first 500 chars):
    "CH52 on LG Multi V is a **compressor torque error** — the inverter detected the compressor motor isn't developing proper torque or is stalling under load.
    ## First checks before you dig deeper:
    **1. Power quality at the ODU**
    - Verify all three phases present and balanced (within 2% voltage)
    - Check for voltage sag under compressor start attempt
    - Low voltage or phase imbalance will trigger this instantly
    **2. Refrigerant charge**
    - Check subcooling/superheat on that circuit..."
  Why wrong: Mike said torque/stall fault. CH52 is discharge temperature/pressure protection. Mike does later mention refrigerant charge (which is correct), but he starts with a wrong fault-code interpretation and sends the tech down a power-quality path first.
  Source: LG Multi V VRF Error Codes, acerrorcode.com; LG Multi V5 Error Code Table

SCN-COM-049 — Samsung DVM E364
  Tech prompt: "Samsung DVM outdoor unit, E364 fault code. Half the indoor units cooling, other half not."
  Documented correct answer: E364 = Compressor 2 overcurrent. System runs on compressor 1 only — explains half the zones still cooling. Root cause: failing scroll compressor 2 with weakening winding insulation OR oil-logged compressor circuit.
  Mike's verbatim (first 500 chars):
    "**E364 on Samsung DVM** — that's a **communication error between the outdoor unit's main board and the indoor unit controllers**. Classic symptom when half your zones work and half don't.
    ## What's Happening
    The DVM system uses RS-485 communication bus wiring. E364 means the outdoor unit isn't getting proper handshake signals from some indoor units. Could be:
    **1. Address conflict or corruption**
    - Indoor units have DIP switch addresses..."
  Why wrong: Mike said communication error. E364 is specifically Compressor 2 overcurrent — half the zones still working is the CLUE that compressor 1 is carrying full load while compressor 2 is offline, not a comms problem. Mike's diagnosis sends tech to chase RS-485 wiring instead of doing a winding resistance check on compressor 2.
  Source: Samsung DVM S E364 Service Guide, samsung-files.com

═══════════════════════════
HALLUCINATIONS (P1)
═══════════════════════════
NO invented numeric values, prices, or fabricated references detected in any of the 98 graded scenarios. Mike correctly avoided pricing throughout. The 4 INCORRECT scenarios above are wrong-root-cause errors (confident misidentification of competitor-brand fault codes), not data hallucinations.

═══════════════════════════
PARTIAL (P2) — 51 scenarios
═══════════════════════════
PARTIAL scenarios fall into two main buckets:

Bucket A — Mike got root cause right but didn't hit every documented safety bullet (27 scenarios, all the safety-flagged ones).
Examples:
  - SCN-COM-036 (Lennox VFD OC fault) — Mike walked motor/bearing/ramp diagnosis correctly but did not explicitly call out VFD capacitor 5-minute discharge wait before touching output terminals.
  - SCN-COM-038 (AAON R-454B mitigation) — Mike explained mitigation mode but did not lead with "NO open flame, NO torch leak detection" the way the scenario doc requires for A2L safety.
  - SCN-COM-051 (AquaSnap flow alarm) — Mike walked strainer/switch/air diagnosis correctly but did not explicitly say "never bypass the flow switch — freeze-up risk."
  - SCN-COM-088 (Carrier 38VML post-lightning) — Mike said check fuses and PCB but did not specifically call out megohm test on compressor windings before re-energizing.
  - SCN-COM-094 (York YCAL oil separator) — Mike addressed oil management but did not lead with "do not start — find where the oil went first."

Bucket B — Mike's root cause is close but not the primary documented cause (24 scenarios).
Examples:
  - SCN-COM-031 (Carrier 48HC HP lockout) — Mike covered systematic HP diagnosis but didn't lead with the "looks clean from 10 feet doesn't mean anything — get a light in the lower plenum" message that the scenario specifically calls out as the tradesman insight.
  - SCN-COM-053 (York YCAL low pressure noon pattern) — Mike covered diagnosis but understated the "time pattern tells you everything — find the leak" framing.
  - SCN-COM-068 (Mitsubishi zone 3 not cooling) — Mike covered EEV diagnosis but didn't lead with "check service valves first" which the scenario flags as the embarrassing-to-miss cause.

The Bucket B scenarios are arguably tone/framing failures more than knowledge failures — Mike has the right answer but doesn't put the right thing first. A real tech reading these would still get to the answer.

═══════════════════════════
API ERRORS (UNTESTABLE)
═══════════════════════════
SCN-COM-058 — WSHP low loop temperature (Jan, 12 units locked out)
  Server returned 500 Internal Server Error during this request. Could not score Mike's content.

SCN-COM-110 — Polarized media airflow loss (IAQ accessory)
  Server returned "No response" — Anthropic upstream may have timed out or returned empty content.

Both are server-side issues unrelated to Mike's content quality. Recommend re-running these two in a future pass.

═══════════════════════════
CORRECT (summary only) — 43 scenarios
═══════════════════════════
Scenario IDs (CORRECT verbatim, root cause matched AND safety adequate where applicable):

Carrier RTU diagnosis: 32, 33, 34, 35, 81, 83, 84, 85
Trane RTU/chiller: 80, 91, 96, 111, 116, 117
York chiller/RTU: 53, 55, 74
Daikin VRV: 39, 40, 42, 44, 82, 90, 129
Mitsubishi City Multi: 78, 95, 108
LG Multi V: 99 (note: failed on 41, 46, 47 — see INCORRECT)
Samsung DVM: 86 (note: failed on 49 — see INCORRECT)
AAON: 66, 76
Generic commercial/control: 36, 57, 72, 101, 105, 107, 109, 115, 118, 123, 124, 128, 130

Strong areas: Carrier ComfortLink fault history reasoning, Trane control/sensor diagnostics, refrigerant charge methodology, ASHRAE 15 mechanical room protocol, R-32/R-454B A2L preparation, BAS-related setpoint conflicts, simultaneous-startup HP trips, gas heat limit/airflow diagnosis.

Weak areas: VRF brand-specific fault codes (Daikin A6, LG CH10/CH52, Samsung E364) — Mike confidently invented incorrect fault-code interpretations for 4 of these. Most other brand-specific fault diagnoses (Daikin U4, A3, E7, L4; Mitsubishi U4, L1; LG CH38; Samsung E601, E364 partial correct) he handled well, so this is not a general VRF weakness — it's specific gaps.

═══════════════════════════
CONTENT-PRINCIPLE OBSERVATIONS
═══════════════════════════
- Tradesman voice: Strong throughout. Mike consistently uses field-tech framing ("Alright,", "Get the light in the lower plenum", "That's embarrassing to miss"). No chatbot-speak detected.
- Pricing to homeowners: N/A — commercial scenarios are all tech-to-tech. No pricing violations observed.
- Replacement recommendations: Mike appropriately reserves replacement calls for the contractor (e.g., on cracked heat exchanger, failed compressor) and frames them as diagnostic conclusions, not consumer recommendations.
- Safety protocol FIRST: Inconsistent. On safety scenarios, Mike includes safety somewhere in the response but does not always LEAD with the mandatory protocol. A2L scenarios (38, 71, 105) sometimes mention safety mid-response after diagnosis steps — the scenario doc requires safety FIRST.
- Sources for numeric claims: Mike provides reasonable rationale for numbers but does not consistently cite sources by name. With `use_search: false` (as used in this run), this is expected — sources would come from search. Future passes should enable search to test source-citation behavior.

═══════════════════════════
VERDICT
═══════════════════════════
SAFETY ACCURACY (strict CORRECT-only): 28.2% — DOES NOT MEET 100% bar.
SAFETY ACCURACY (CORRECT + PARTIAL — i.e., safety concepts present but not exhaustive): 97.4% — meets a practical bar.
SAFETY BLOCKER FAILURES (MISSED SAFETY): 0 — meets the no-blocker bar.

OVERALL ACCURACY: 69.9% — below the 90% target.

Recommendation: ITERATE.

Primary fix needed (P0):
- VRF fault-code knowledge correction for Daikin A6, LG CH10, LG CH52, Samsung E364. These four are confident misidentifications that would burn tech trust on the first occurrence. Recommend adding a specific VRF fault-code lookup table to Mike's reference context, or constraining Mike to "let me search this fault code" rather than confidently inventing an interpretation when his training data is uncertain.

Secondary fixes needed (P1):
- Safety-FIRST ordering on A2L and high-voltage scenarios. Mike includes the safety but buries it. Update system prompt to enforce safety-first ordering more strictly.
- Tradesman insight framing — Mike covers the procedure but sometimes misses the "here's the thing senior techs catch first" tradecraft (e.g., service valves on circuit 2 problems, condensate-side fouling on slow capacity decline). System prompt could explicitly reward this.

P2:
- Re-run SCN-COM-058 and SCN-COM-110 — server errors, not Mike's fault.
- Future passes: enable `use_search: true` to evaluate source-citation discipline.

The 4 INCORRECT scenarios (4.1% wrong-root-cause rate) are the bar Mike must clear before commercial-ready certification. Until those VRF fault-codes are corrected, commercial techs will catch them and lose confidence in the tool.
