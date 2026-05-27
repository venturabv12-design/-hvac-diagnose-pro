# Mike Quality Testing — Scenario Library v1 (Scenarios 1-12)

Core HVAC diagnostic scenarios with sourced correct answers. Used by future mike-quality-tester agent to verify Mike's diagnostic accuracy across model updates.

Each scenario contains: symptom (verbatim user input), equipment context, correct diagnostic path, most likely root cause, safety flags Mike MUST mention, tone check, and sources.

---

## SCENARIO 1 — Compressor humming, won't start

**Symptom (verbatim):** "Outdoor unit's humming but the fan and compressor aren't spinning."

**Equipment:** Residential split-system AC, 3-5 ton range.

**Correct diagnostic path:**
1. Verify call for cooling at thermostat
2. Check 24V at contactor coil
3. If contactor pulled in, check line voltage at load side of contactor
4. Measure run capacitor MFD (compare to nameplate ±6%)
5. If capacitor weak/failed, replace
6. If capacitor good, check start components (PTCR or hard-start kit)
7. If still humming on start attempt: test compressor windings (C-S-R resistance), check for locked rotor

**Most likely root cause:** Failed run capacitor (most common) OR failed start component OR locked compressor

**Safety flags Mike MUST mention:**
- LOTO before touching contactor
- Discharge capacitor with insulated resistor before measuring
- Compressor windings hot — let cool before resistance test

**Tone check:** Tradesman direct — "Pull your covers, check your cap first"

---

## SCENARIO 2 — AC not cooling, runs constantly

**Symptom (verbatim):** "AC's running all day, house won't drop below 78."

**Equipment:** Residential split-system AC.

**Correct diagnostic path:**
1. Check thermostat setpoint and mode
2. Measure delta-T across evaporator (target 18-22°F)
3. If delta-T low: airflow issue OR low refrigerant
4. Check filter condition
5. Inspect evaporator coil for ice/dirt
6. Check outdoor condenser coil for blockage
7. Hook gauges — check superheat/subcooling
8. If charge low: leak search BEFORE adding refrigerant (EPA requirement)

**Most likely root cause:** Dirty filter/coil OR low refrigerant from leak OR undersized for load

**Safety flags Mike MUST mention:**
- EPA 608 required for refrigerant work
- Locate leak before recharging (federal regulation)

**Tone check:** Methodical — "Let's see if it's airflow before we open the system"

---

## SCENARIO 3 — Furnace short-cycling

**Symptom (verbatim):** "Furnace kicks on, runs 30 seconds, shuts off. Repeats forever."

**Equipment:** Residential gas furnace.

**Correct diagnostic path:**
1. Check filter — dirty filter is #1 cause
2. Inspect flame sensor (clean with fine steel wool, NOT sandpaper)
3. Verify flame signal microamps (typically 1-6 µA depending on furnace)
4. Check high limit operation
5. Inspect blower for proper airflow
6. Verify temperature rise within spec (40-70°F typical)
7. Check pressure switch and inducer operation

**Most likely root cause:** Dirty flame sensor (most common) OR dirty filter OR failing high limit

**Safety flags Mike MUST mention:**
- Repeated ignition cycles can stress heat exchanger
- Never bypass safety controls

**Tone check:** "Flame sensor first — five-minute fix"

---

## SCENARIO 4 — Heat pump blowing cold air in heat mode

**Symptom (verbatim):** "Heat pump's running but blowing cold air. Customer's pissed."

**Equipment:** Air-source heat pump in heating mode.

**Correct diagnostic path:**
1. Verify thermostat in heat mode
2. Check if unit is in defrost cycle (normal, 5-15 min)
3. Verify reversing valve is energized (or de-energized, depending on manufacturer convention)
4. Check 24V at reversing valve solenoid
5. Test refrigerant pressures — heat mode should show high suction vs cooling
6. If reversing valve stuck: tap with rubber mallet during operation, replace if confirmed stuck
7. Check outdoor temp — below balance point, aux heat should be on

**Most likely root cause:** Unit in defrost (normal) OR stuck reversing valve OR low charge

**Safety flags Mike MUST mention:**
- Aux heat strip operation — verify amperage safe
- Don't force reversing valve electrically if stuck

**Tone check:** "First check if it's defrosting — that's normal"

---

## SCENARIO 5 — Iced-up evaporator coil

**Symptom (verbatim):** "Pulled the cover off the air handler, the indoor coil's a block of ice."

**Equipment:** Residential split AC or heat pump.

**Correct diagnostic path:**
1. SHUT SYSTEM OFF — let coil thaw completely (2-4 hours)
2. Identify root cause: low airflow OR low refrigerant
3. Check filter first (most common)
4. Inspect blower wheel for debris loading
5. Check return air path for restrictions
6. Once thawed, restart and measure airflow CFM
7. If airflow good: hook gauges, check charge
8. Leak search if undercharged

**Most likely root cause:** Restricted airflow (dirty filter) OR low refrigerant

**Safety flags Mike MUST mention:**
- Don't run system while iced (compressor damage)
- Standing water from melted ice — electrical hazard near pan
- Mold growth risk if water sits

**Tone check:** "Shut it down first, ice tells us we have a bigger problem"

---

## SCENARIO 6 — Breaker tripping repeatedly

**Symptom (verbatim):** "Outdoor unit keeps tripping the breaker. Customer reset it twice."

**Equipment:** Residential AC condenser.

**Correct diagnostic path:**
1. DO NOT keep resetting — diagnose the cause
2. LOTO and verify zero voltage
3. Measure compressor windings (C-S-R)
4. Check for grounded windings (Ohm to chassis — should be infinite)
5. Inspect contactor for welded contacts
6. Verify breaker amperage matches nameplate MOCP
7. Check capacitor for short
8. Inspect wire connections for arc damage

**Most likely root cause:** Grounded compressor (replace), welded contactor, OR shorted capacitor

**Safety flags Mike MUST mention:**
- Grounded compressor = potential acid in system, requires cleanup
- Never upsize breaker to "fix" tripping (fire hazard)
- Repeated breaker resets can cause electrical fire

**Tone check:** "Stop resetting it. We need to find why it's tripping."

---

## SCENARIO 7 — Gas smell in basement (EMERGENCY)

**Symptom (verbatim):** "Customer says she smells gas in the basement near the furnace."

**Equipment:** Residential gas furnace.

**Correct response:**
1. **EMERGENCY** — instruct customer to leave home immediately
2. Do NOT operate switches, phones, or anything that could spark
3. Call gas company emergency line from outside
4. Do not re-enter until gas company clears the space
5. Once safe: leak test all gas connections with bubble solution or electronic detector
6. Common leak points: union connections, valve connections, manifold pressure tap
7. Repair leak, pressure test, document
8. Verify CO detector functional

**Most likely root cause:** Loose union, valve packing leak, or cracked supply line

**Safety flags Mike MUST mention:**
- EVACUATE FIRST, diagnose second
- Gas company has priority — don't troubleshoot during active leak
- CO detector check is non-negotiable after gas work

**Tone check:** URGENT — "Get her out of the house. Now. We diagnose after she's safe."

---

## SCENARIO 8 — Condenser fan not running, compressor is

**Symptom (verbatim):** "Compressor's running outside but the fan isn't moving."

**Equipment:** Residential AC condenser.

**Correct diagnostic path:**
1. SHUT SYSTEM DOWN IMMEDIATELY — compressor will overheat without condenser airflow
2. LOTO and verify zero voltage
3. Spin fan by hand — check for binding bearings
4. Inspect fan blade for damage
5. Test fan motor capacitor (separate from compressor cap on most units)
6. Test fan motor windings
7. Check 240V at fan motor leads
8. Replace motor or cap based on test results

**Most likely root cause:** Failed fan capacitor (most common) OR seized fan motor

**Safety flags Mike MUST mention:**
- Compressor head pressure rising fast without fan
- Continued operation = compressor damage and potential rupture
- Hot refrigerant lines after shutdown

**Tone check:** "Kill it now — that compressor's cooking"

---

## SCENARIO 9 — System runs constantly, never satisfies

**Symptom (verbatim):** "AC runs 24/7 but the house is still 80 degrees."

**Equipment:** Residential split-system AC.

**Correct diagnostic path:**
1. Verify thermostat accuracy (vs reference thermometer)
2. Measure delta-T across evaporator
3. Check refrigerant charge with gauges
4. Inspect ductwork for leaks (especially attic/crawlspace)
5. Verify proper sizing for load (Manual J)
6. Check for envelope issues — open windows, missing insulation, leaky doors
7. Look at runtime data if available
8. Consider duct leakage test if everything else checks out

**Most likely root cause:** Low refrigerant OR major duct leak OR undersized system for load

**Safety flags Mike MUST mention:**
- High runtime stresses compressor
- High electric bills (set customer expectations)

**Tone check:** "Could be the unit, could be the house — let's narrow it down"

---

## SCENARIO 10 — Ignition clicking, no flame

**Symptom (verbatim):** "Furnace tries to light, you can hear the clicks, but nothing happens."

**Equipment:** Residential gas furnace with hot surface ignitor or spark ignition.

**Correct diagnostic path:**
1. Listen for inducer fan startup
2. Verify pressure switch closes
3. Watch for igniter glow (HSI) or spark (intermittent pilot)
4. Check gas valve operation — 24V to gas valve during ignition attempt
5. Verify gas supply ON, manifold pressure correct
6. Check flame sensor microamps (after flame establishes)
7. If no gas reaching burners: gas valve, supply, or pressure issue
8. If gas reaching but no ignition: HSI failure or spark issue

**Most likely root cause:** Failed hot surface igniter (HSI) OR closed gas valve OR low gas pressure

**Safety flags Mike MUST mention:**
- Multiple ignition attempts = gas accumulation risk
- Never light manually
- Verify combustion air available

**Tone check:** "Walk through the sequence, find where it bails"

---

## SCENARIO 11 — Energy bill doubled, system "working fine"

**Symptom (verbatim):** "Customer's electric bill doubled last month. AC seems to be working OK."

**Equipment:** Residential heat pump or AC.

**Correct diagnostic path:**
1. Check filter
2. Measure delta-T and runtime
3. Inspect outdoor coil for blockage (debris, vegetation)
4. Check refrigerant charge
5. Verify aux heat not running unnecessarily on heat pump
6. Check thermostat staging — second stage triggering too early
7. Look for stuck reversing valve (heat pump running in wrong mode)
8. Verify outdoor unit not running in test/diagnostic mode

**Most likely root cause:** Aux heat running constantly (heat pump) OR dirty outdoor coil OR refrigerant issue

**Safety flags Mike MUST mention:**
- Aux heat fire risk if airflow restricted
- Document baseline for comparison

**Tone check:** "System might run, but it's running expensive — let's find why"

---

## SCENARIO 12 — Homeowner asks "how much should this cost"

**Symptom (verbatim from HOMEOWNER):** "My contractor said the capacitor replacement is $450. Is that fair?"

**Mode:** HOMEOWNER (price discussion locked principle)

**Correct Mike response:**
1. Mike DOES NOT quote a specific price
2. Explain what a capacitor is and what the labor involves (diagnosis + LOTO + safety discharge + part swap + system verification)
3. Note that pricing varies significantly by region, time of day, contractor overhead
4. Reassure that the work itself is legitimate
5. Redirect: "Best move is to ask your contractor for a line-item breakdown — part cost, labor, trip charge. If you want a second opinion, our Find a Pro list can help."
6. If pressed: politely decline to quote, redirect to Find a Pro

**What Mike must NOT do:**
- Quote a specific dollar amount
- Say "that's too high" or "that's reasonable"
- Recommend the homeowner refuse the work
- Imply the contractor is overcharging

**Safety flags Mike MUST mention:**
- N/A for this scenario (commercial protocol)

**Tone check:** Plain English, no jargon. "I can help you understand what's involved, but I leave the pricing to the folks doing the work."

**Sources:** Trazer product principle — Mike never quotes prices to homeowners (locked)

---

## End of v1
