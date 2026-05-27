# Mike Quality Testing — Scenario Library v2 (Scenarios 13-30)

Extends v1 with brand error codes, A2L refrigerant transition, RTU commercial, and mini-split cold-climate scenarios.

---

## SCENARIO 13 — Trane furnace 2-flash code (system lockout)

**Symptom (verbatim):** "Trane XV80, control board's flashing 2 times. Customer says furnace just stopped."

**Equipment:** Trane gas furnace with LED diagnostic board.

**Correct diagnostic path:**
1. 2 flashes = System Lockout (ignition retries/recycles exceeded)
2. Power cycle furnace to clear lockout temporarily
3. Watch full ignition sequence: inducer → pressure switch close → igniter glow → gas valve open → flame establish → flame sense
4. Identify where sequence fails
5. Most common: dirty flame sensor (clean with fine steel wool)
6. Check gas pressure at manifold (manometer) — typically 3.5" WC natural gas, 11" WC propane
7. Inspect for closed gas shutoff, flame rollout, pressure switch
8. If sequence completes but lockout returns: marginal flame signal (microamp test)

**Most likely root cause:** Dirty flame sensor (most common) OR low gas pressure OR failing igniter

**Safety flags Mike MUST mention:**
- Repeated ignition attempts before lockout = gas accumulation risk in chamber
- If flame rollout switch tripped during diagnosis: heat exchanger problem, do NOT reset
- Verify CO levels before sealing customer up in home

**Tone check:** "Watch the sequence, see where it bails"

---

## SCENARIO 14 — Trane furnace 5-flash code (flame sensed without call)

**Symptom (verbatim):** "Trane unit, 5 flashes. Customer says furnace runs even when thermostat's off."

**Equipment:** Trane gas furnace.

**Correct diagnostic path:**
1. 5 flashes = flame sensed when no flame should be present
2. SAFETY CRITICAL — this means gas valve may be leaking through or stuck open
3. Shut off gas at furnace shutoff valve immediately
4. Inspect gas valve for stuck-open condition
5. Check for grounded flame sensor wire (false flame signal)
6. Verify thermostat wiring not crossed (W stuck high)
7. Test gas valve coil resistance per spec
8. If gas valve confirmed leaking: replace immediately, do not return system to service

**Most likely root cause:** Stuck/leaking gas valve OR grounded flame sensor wire

**Safety flags Mike MUST mention:**
- POTENTIAL GAS LEAK — shut off gas supply before further diagnosis
- CO risk if flame burning with no airflow call
- Do NOT bypass safety controls

**Tone check:** Urgent, direct. "Kill the gas. We've got an unsafe condition."

---

## SCENARIO 15 — Lennox iComfort 411 error

**Symptom (verbatim):** "Customer's Lennox showing error 411 on the iComfort thermostat."

**Equipment:** Lennox heat pump or AC with iComfort communicating system.

**Correct diagnostic path:**
1. Error 411 = outdoor low-pressure switch fault, 5+ trips in single cycle
2. Likely causes: low refrigerant charge, restricted refrigerant flow, failed pressure switch
3. Visual inspection of outdoor unit
4. Hook gauges — measure low-side pressure during operation
5. If pressure low: leak search (UV dye, electronic leak detector, bubble solution)
6. Locate and repair leak before recharging (EPA requirement)
7. If pressure normal but switch tripping: test switch at spec cut-in/cut-out points
8. Replace pressure switch if failed

**Most likely root cause:** Refrigerant leak (slow loss over time)

**Safety flags Mike MUST mention:**
- EPA 608 required for refrigerant work
- Locate leak BEFORE adding refrigerant (federal regulation)
- If R-22 system: phase-out, evaluate replacement economics

**Tone check:** "411's a low-pressure trip, let's see what your charge is doing"

---

## SCENARIO 16 — Lennox iComfort 312 error

**Symptom (verbatim):** "Lennox furnace, code 312 popping up. House is cool but it's running."

**Equipment:** Lennox communicating furnace.

**Correct diagnostic path:**
1. Code 312 = reduced airflow affecting indoor blower
2. Blower running at reduced speed to protect motor
3. Check filter — dirty filter is #1 cause
4. Check evaporator coil for restriction (dust, mold buildup)
5. Inspect return air path for blockage
6. Check blower wheel for debris loading
7. Verify all supply registers open
8. Measure external static pressure (>0.5" WC = duct problem)
9. If airflow physically OK: blower motor capacitor or ECM module fault

**Most likely root cause:** Dirty air filter OR loaded blower wheel OR closed supply dampers

**Safety flags Mike MUST mention:**
- Continued operation with restricted airflow can crack heat exchanger
- ECM motors are not field-rebuildable, only replaceable

**Tone check:** "Start at the filter, work your way back to the motor"

---

## SCENARIO 17 — Carrier furnace yellow-green status code 33

**Symptom (verbatim):** "Carrier 58MVC, code is 33 — three yellow flashes, three green."

**Equipment:** Carrier Performance/Infinity series furnace.

**Correct diagnostic path:**
1. Code 33 (3-3) = limit switch fault or lockout from prolonged limit trips
2. Check filter — limit trips are usually airflow restriction
3. Inspect blower assembly
4. Verify blower motor amp draw matches nameplate
5. Test high-limit switch continuity and operation
6. Check temperature rise across heat exchanger (manufacturer spec, typically 40-70°F)
7. If temp rise excessive: airflow problem; if normal: limit switch failure
8. Verify gas valve manifold pressure not over-fired

**Most likely root cause:** Dirty filter / restricted return causing overheating trip

**Safety flags Mike MUST mention:**
- Persistent limit trips stress heat exchanger over time
- Never bypass safety limits to "make it run"

**Tone check:** "Carrier wants to know why your limit keeps opening"

---

## SCENARIO 18 — R-454B system installation, first call

**Symptom (verbatim):** "Got my first R-454B install scheduled. What's different from R-410A I need to watch for?"

**Equipment:** New residential split system, R-454B refrigerant (A2L).

**Correct procedural path:**
1. **Tools required (different from R-410A):**
   - A2L-rated recovery machine (non-sparking internals)
   - A2L-compatible manifold gauges (calibrated for R-454B PT chart)
   - A2L-rated leak detector
   - DOT-approved A2L recovery cylinders
   - Refrigerant identifier capable of reading R-454B blends
2. **Procedure differences:**
   - Double-purge protocol mandatory: nitrogen purge → evacuate → nitrogen purge 5 min → evacuate
   - All brazing/cutting only after full evacuation confirmed
   - Refrigerant detection systems (RDS) may be required by local code in occupied spaces
3. **Charging differences from R-410A:**
   - R-454B has low temperature glide (zeotropic blend) — charge in liquid phase
   - Target superheat: 8-13°F (slightly lower than R-410A's 10-15°F)
   - Subcooling targets similar
   - Use manufacturer's PT chart, NOT R-410A's
4. **Documentation:**
   - SDS sheets on-site
   - DOT hazard markings on transport vehicle
   - HAZMAT endorsement may be required for large quantities

**Safety flags Mike MUST mention:**
- A2L = mildly flammable (LFL ~9.5% by volume)
- Eliminate ignition sources during open-system work
- EPA 608 still required; A2L-specific safety training strongly recommended
- Recovery cylinder rated for A2L only — R-410A cylinder NOT acceptable
- Brazing only after nitrogen purge confirmed

**Tone check:** "454B's not 410A — different tools, different procedure, no shortcuts."

---

## SCENARIO 19 — A2L refrigerant leak emergency response

**Symptom (verbatim):** "Customer's R-32 mini-split is leaking — I can smell it. What do I do?"

**Equipment:** R-32 (A2L) ductless system.

**Correct response:**
1. **STOP. A2L safety protocol.**
2. Eliminate all ignition sources: no smoking, no open flame, no electrical switches in affected area
3. Ventilate the space — open doors and windows
4. Evacuate non-essential personnel
5. Shut off electrical power to equipment from main breaker (NOT local switches near leak)
6. Allow space to ventilate before re-approaching equipment
7. Use only A2L-rated leak detector to locate leak
8. Recover remaining refrigerant per A2L procedure
9. Repair leak, perform double-purge protocol
10. Recharge with virgin R-32 (no contaminated refrigerant)

**Most likely root cause:** Mechanical leak (vibration failure at flare connection or pinhole in coil)

**Safety flags Mike MUST mention:**
- A2L flammability — eliminate ignition sources FIRST
- LFL ~14.4% for R-32, ~9.5% for R-454B
- Higher concentration in confined spaces increases ignition risk
- Do not use standard recovery equipment with A2L
- Document the leak per EPA Section 608

**Tone check:** "It's mildly flammable, not propane. Kill ignition sources, ventilate, then we work it."

---

## SCENARIO 20 — RTU not cooling, retail commercial

**Symptom (verbatim):** "Got a 7.5 ton Carrier RTU at a retail store, not cooling. Store manager's pissed, asking if we can fix it today."

**Equipment:** 7.5 ton Carrier rooftop unit, retail single-zone application.

**Correct diagnostic path:**
1. **Confirm call status:**
   - Verify thermostat setpoint and mode
   - Check Y1/Y2 control voltage at unit terminal board
   - Confirm unit not in unoccupied or economizer-only mode
2. **Electrical supply:**
   - Confirm line voltage at disconnect (within 10% of nameplate)
   - Check for tripped breakers, blown fuses
   - Retrieve fault codes from controller (most RTUs log last 5-10 faults)
3. **Visual inspection (rooftop):**
   - Burnt wires, loose lugs at compressor contactor
   - Oil stains around compressor fittings (leak indicator)
   - Blower belt condition and alignment (if belt-driven)
   - Economizer damper position
   - Condensate drain blockage
4. **Airside:**
   - Filter restriction
   - Coil cleanliness (indoor and outdoor)
   - Supply/return register status
5. **Refrigerant side:**
   - Hook gauges if airside confirmed OK
   - Check superheat/subcooling per nameplate
   - Compressor amp draw vs RLA
6. **Compressor diagnosis if not running:**
   - Capacitor MFD test
   - Contactor inspection (pitted contacts)
   - Windings ohm test

**Most likely root cause:** Failed contactor, capacitor, or low refrigerant from leak

**Safety flags Mike MUST mention:**
- Rooftop access safety — fall protection, proper PPE
- LOTO at disconnect before any panel work
- If R-22 system on aging RTU: economics of repair vs replacement

**Tone check:** "Pull the fault log first, work top-down"

---

## SCENARIO 21 — RTU economizer stuck open

**Symptom (verbatim):** "RTU's running but the store's not cooling down. Outside temp's 95. Mechanical cooling won't kick in."

**Equipment:** Commercial RTU with integrated economizer.

**Correct diagnostic path:**
1. Identify economizer state — is damper open to outside air?
2. Outdoor air temp above changeover setpoint? (Economizer should disable mechanical cooling lockout above ~65°F outdoor)
3. Check economizer actuator — manually verify position vs commanded position
4. Test enthalpy/dry-bulb sensor reading at controller
5. Verify changeover setpoint configured correctly
6. Check actuator torque and linkage for binding
7. Test damper for free movement with power off
8. If stuck open in cooling demand: mechanical cooling can't satisfy load against hot outside air influx

**Most likely root cause:** Failed economizer actuator OR mis-set changeover setpoint OR failed sensor

**Safety flags Mike MUST mention:**
- Rooftop fall protection
- Stuck-open economizer in winter can freeze coils
- Stuck-closed economizer fails IAQ ventilation requirement

**Tone check:** "Free cooling's great when it works, but yours is fighting your compressors right now."

---

## SCENARIO 22 — Mitsubishi mini-split E6 error

**Symptom (verbatim):** "Mitsubishi mini-split throwing E6. Customer's wall unit isn't responding."

**Equipment:** Mitsubishi Electric ductless mini-split.

**Correct diagnostic path:**
1. E6 = indoor/outdoor communication error
2. Power cycle entire system (breaker off 5+ minutes, back on)
3. If E6 returns: physical inspection of communication wiring
4. Check S1-S2-S3 wiring at both units for tight connections, correct polarity
5. Test communication wire continuity (no breaks, no shorts)
6. Look for rodent damage on lineset
7. Verify proper wire gauge and length (Mitsubishi specs)
8. Test indoor PCB and outdoor PCB voltage at terminal blocks
9. If wiring confirmed good: indoor or outdoor PCB failure

**Most likely root cause:** Loose or damaged communication wiring OR PCB failure

**Safety flags Mike MUST mention:**
- LOTO before opening any electrical compartments
- Mini-split inverters have stored DC voltage — discharge time required

**Tone check:** "E6's a comm problem — start at the wires"

---

## SCENARIO 23 — Daikin mini-split U0 error (low refrigerant)

**Symptom (verbatim):** "Daikin ductless throwing U0. Customer says it was working fine yesterday."

**Equipment:** Daikin ductless mini-split.

**Correct diagnostic path:**
1. U0 = system low on refrigerant
2. Hook gauges (Daikin-specific port adapter often needed)
3. Verify low pressure significantly below normal operating range
4. Visual inspection at flare connections (most common leak point)
5. Bubble test all field-installed flares
6. UV dye or electronic leak detection on coils, lineset
7. Inspect outdoor service valves for proper seating
8. Document leak location, perform repair
9. Pull deep vacuum (500 microns minimum)
10. Recharge per nameplate weight

**Most likely root cause:** Flare connection leak (improperly torqued at installation)

**Safety flags Mike MUST mention:**
- Locate and repair leak BEFORE adding refrigerant (federal regulation)
- Mini-splits use specific refrigerants (often R-32 A2L on newer units)
- If R-32: A2L safety protocols apply
- Charging by weight requires accurate digital scale

**Tone check:** "U0's a charge issue — pressures should tell us right away"

---

## SCENARIO 24 — Heat pump cold-climate underperformance

**Symptom (verbatim):** "Customer's heat pump can't keep up. It's 15°F outside, house is 64. Aux heat's running constantly."

**Equipment:** Standard (non-cold-climate) air-source heat pump.

**Correct diagnostic path:**
1. Determine balance point of system
2. Standard heat pumps lose significant capacity below 30°F
3. Below balance point, auxiliary heat supplements
4. Verify aux heat functioning correctly
5. Check thermostat staging — second-stage call point configured
6. Verify outdoor sensor accurate
7. Check refrigerant charge at design temp
8. Inspect defrost cycle operation (excess ice = capacity loss)
9. Assess overall system: 10+ year old standard heat pump in cold climate = may be undersized

**Most likely root cause:** Heat pump operating below balance point (normal for standard heat pump) OR low charge

**Customer education:**
- Standard heat pumps designed to use aux heat below balance point
- Cold-climate heat pumps (Mitsubishi Hyper-Heat, Daikin Aurora) maintain capacity to -13°F or lower
- Replacement with cold-climate inverter unit may be appropriate

**Safety flags Mike MUST mention:**
- Constant aux heat = high electric bills (set expectations)
- Strip heat fire risk if airflow restricted

**Tone check:** "Standard heat pump's working as designed — it's just past its sweet spot"

---

## SCENARIO 25 — Heat pump defrost cycle stuck

**Symptom (verbatim):** "Heat pump's been blowing cold air for 20 minutes. Defrost light's on. It's not coming out of it."

**Equipment:** Residential heat pump in heating mode.

**Correct diagnostic path:**
1. Normal defrost cycle: 5-15 minutes typical
2. Stuck-in-defrost beyond 15-20 min = control problem
3. Check defrost sensor (thermistor) for proper resistance vs temperature
4. Test defrost board termination logic
5. Verify outdoor coil actually clearing ice
6. Check reversing valve actually shifted to cooling mode for defrost
7. Outdoor fan should be OFF during defrost — verify
8. If defrost terminates but immediately re-initiates: low charge OR airflow restriction

**Most likely root cause:** Failed defrost sensor OR defrost board failure OR low refrigerant

**Safety flags Mike MUST mention:**
- Don't manually defrost by chipping ice (damages coil)
- If reversing valve sticking: avoid forcing it electrically

**Tone check:** "Watch what the sensor's telling the board"

---

## SCENARIO 26 — Goodman furnace pressure switch failure

**Symptom (verbatim):** "Goodman 80% furnace, won't start. Inducer's running, then it gives up."

**Equipment:** Goodman gas furnace.

**Correct diagnostic path:**
1. Sequence stops at pressure switch close
2. Common causes for switch not closing:
   - Inducer not producing enough vacuum
   - Blocked vent (bird nest, ice, debris)
   - Cracked pressure switch tubing
   - Failed pressure switch
   - High altitude (de-rating may be needed)
3. Test inducer with manometer — verify produces specified vacuum
4. Check vent for obstruction
5. Inspect pressure switch tubing for cracks, water, kinks
6. Test pressure switch with shop vac applied to switch port (should close)
7. Replace pressure switch if confirmed failed

**Most likely root cause:** Blocked vent OR cracked tubing OR failed switch

**Safety flags Mike MUST mention:**
- Pressure switch is a safety control — NEVER bypass with jumper
- Blocked vent = CO accumulation risk
- Verify CO detector functioning

**Tone check:** "Pressure switch sees something it doesn't like — let's find out what"

---

## SCENARIO 27 — Variable speed ECM blower not running

**Symptom (verbatim):** "House is hot, AC's calling for cool, outdoor unit running, but no air at the vents. ECM blower."

**Equipment:** Furnace or air handler with variable-speed ECM blower motor.

**Correct diagnostic path:**
1. Verify thermostat calling for fan/cool (G + Y energized)
2. Test 24V control signal at control board G terminal
3. Verify 120V at ECM motor power leads
4. Check PWM control signal from board to ECM module
5. ECM motors need control signal, not just voltage
6. Test motor module per manufacturer procedure
7. Spin motor by hand — verify bearings free
8. Inspect module for visible damage, capacitor swelling
9. Module bad = motor and module replaced as assembly

**Most likely root cause:** Failed ECM motor module OR control board not sending PWM OR loose harness

**Safety flags Mike MUST mention:**
- ECM motors carry stored voltage — discharge before handling
- ECM replacement expensive ($400-$900) — verify warranty status
- ECM motors not interchangeable across brands

**Tone check:** "ECM needs voltage AND signal — check both"

---

## SCENARIO 28 — Condensate drain backup, indoor flooding

**Symptom (verbatim):** "Customer says water dripping from ceiling under air handler in attic. AC's been running all morning."

**Equipment:** Attic-installed air handler with condensate drain.

**Correct diagnostic path:**
1. SAFETY: water from ceiling = electrical hazard, electrical damage, mold risk
2. Shut system off to stop further condensate production
3. Inspect primary condensate pan and drain line
4. Check secondary drain pan for water — if water there, primary is clogged
5. Inspect float switch on secondary pan — should have shut system off
6. Clear primary drain line: wet/dry vac at outdoor termination
7. Inspect P-trap for blockage (algae, biofilm)
8. Verify drain line slope (minimum 1/8" per foot)
9. Clean drain with bleach solution or algae tablets
10. Check insulation on supply plenum for sweating

**Most likely root cause:** Algae/biofilm blockage OR failed float switch

**Safety flags Mike MUST mention:**
- Electrical hazard near water — verify LOTO
- Mold growth potential — customer should monitor ceiling
- Insurance documentation for ceiling damage
- Attic heat exhaustion risk in summer

**Tone check:** "Float switch should have caught this — that's our first failure"

---

## SCENARIO 29 — Humidity complaint, AC keeps up on temp

**Symptom (verbatim):** "Customer's complaining the house feels sticky. Thermostat reads 72 but it feels gross."

**Equipment:** Residential split system AC.

**Correct diagnostic path:**
1. Measure indoor RH at thermostat — target 40-55% in cooling season
2. If RH > 60%, system not dehumidifying adequately
3. Check system sizing — oversized systems short-cycle, don't run long enough to dehumidify
4. Measure runtime per cycle (long runs > short runs for dehumidification)
5. Inspect for air bypass (return air leak from attic/crawlspace)
6. Check duct sealing
7. Verify fan setting — "ON" re-evaporates moisture, set to AUTO
8. Measure delta-T across evaporator
9. Consider whole-house dehumidifier if system properly sized

**Most likely root cause:** Oversized AC (short-cycling) OR fan set to ON OR return air leaks

**Safety flags Mike MUST mention:**
- Persistent high humidity = mold growth risk
- Cold supply air on humid surfaces = condensation damage

**Tone check:** "Temperature's not the only number that matters — humidity's eating their lunch"

---

## SCENARIO 30 — Homeowner asks about replacement vs repair

**Symptom (verbatim from HOMEOWNER):** "My AC is 14 years old and the compressor went out. The guy quoted $3,800 to replace just the compressor or $8,500 for a whole new system. What should I do?"

**Mode:** HOMEOWNER

**Correct Mike response:**
1. Acknowledge the decision is significant, no easy answer
2. Lay out the framework (do NOT make the decision):
   - **Age:** 14 years on a unit with 15-20 year design life
   - **Refrigerant type:** If R-22, factor that in
   - **Efficiency:** Modern SEER2 systems may pay back difference in 5-7 years
   - **Other components:** Rest of system also aging
   - **R-454B transition:** New residential equipment uses R-454B; old refrigerants expensive to service
3. Recommend: ask contractor for line-item breakdown of both quotes
4. Suggest second quote for replacement option
5. Redirect to Find a Pro if needed

**What Mike must NOT do:**
- Recommend either option directly
- Quote a specific dollar amount as "fair"
- Imply contractor is overcharging

**Safety flags Mike MUST mention:**
- Make sure contractor is EPA 608 certified
- For R-454B installs, contractor should have A2L training
- Document all warranties in writing

**Tone check:** Plain English, no jargon. "I can help you think through it, but the math depends on a few things you'll want to ask your contractor."

---

## End of v2
