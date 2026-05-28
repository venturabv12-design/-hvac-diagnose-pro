# Mike Scenario Library v3 — Safety-Critical & Refrigerant Transitions
**Phase 1 Build — Highest-Stakes Content**
*Sourced from EPA 608, ASHRAE 15/34, NIOSH, OSHA 29 CFR 1910.147, NFPA 70E, manufacturer service bulletins.*
*Every scenario includes a MANDATORY PROTOCOL block. Mike does not improvise on safety.*

---

## SCN-SAF-001 — Gas Smell on Arrival: Residential Service Call
**Equipment / situation:** Any residential gas appliance. Tech arrives and notices gas odor inside or outside the home.

### Symptoms / readings / measurements
- Sulfur/rotten-egg odor at front door or inside home
- Possible hissing sound near appliance, gas line, or meter
- CO/combustible gas detector reads above zero at entry

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Do NOT enter if odor is strong at door. Stay outside.**
2. Do not operate any electrical switches, lights, doorbells, garage door openers, or phone inside the structure.
3. Do not use a vehicle parked in an attached garage.
4. Evacuate all occupants immediately — do not stop to grab belongings.
5. Leave doors open as you exit to help ventilate.
6. Shut off gas at the meter if it is safe to reach the meter without entering the structure (turn valve perpendicular to pipe).
7. Move at least 300 feet away from the structure.
8. Call the gas utility's emergency line from a safe distance (not from inside the building).
9. Call 911 if odor is strong, if anyone reports symptoms, or if ignition has occurred.
10. Do NOT re-enter until the gas utility has cleared the structure and given all-clear.
11. After utility clears: locate and repair leak, pressure-test, restore service.

### MANDATORY protocol
- EVACUATE ALL OCCUPANTS IMMEDIATELY
- DO NOT OPERATE ANY ELECTRICAL SWITCH OR DEVICE INSIDE THE STRUCTURE
- SHUT GAS AT METER ONLY IF METER IS SAFELY ACCESSIBLE FROM OUTSIDE
- CALL GAS UTILITY EMERGENCY LINE FROM OFF-PREMISE (minimum 300 ft away)
- DO NOT RE-ENTER UNTIL UTILITY GIVES ALL-CLEAR

### Sources
- Gas Leak Response Procedure — EMC Insurance: https://emcinsurance.com/losscontrol/techsheet/gas-leak-response-procedure
- Gas Leak Safety — Halton Gas: https://www.haltongas.com/post/gas-leak-safety-for-homeowners-how-to-identify-and-fix-issues

### Mike's tone for this scenario
- Non-negotiable. "Get everyone out now. Don't touch a switch. Call the gas company from outside, not from your cell inside the house."
- Mike does not say "check if it smells strong" — the protocol triggers on any confirmed gas odor.

---

## SCN-SAF-002 — Hissing Sound at Gas Valve or Flex Connector
**Equipment / situation:** Tech performing annual maintenance, hears audible hiss at appliance gas valve or flexible connector.

### Symptoms / readings / measurements
- Audible hiss localized to gas valve body, flex connector, or union
- Combustible gas detector reading elevated (any positive reading is actionable)
- Bubble solution confirms escaping gas at fitting

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Do not attempt to tighten fittings on a live system with an open flame nearby.**
2. Shut off gas at appliance shutoff valve.
3. Verify shutoff is effective with detector (reading should drop to zero within 30–60 seconds).
4. If hiss continues after appliance valve closed: gas valve itself is leaking through or leak is upstream — shut gas at meter.
5. Evacuate occupants if meter-level leak is suspected.
6. After gas confirmed off: disassemble and inspect flex connector and valve connections.
7. Replace any flex connector showing corrosion, kinks, cuts, or age-related cracking.
8. Reassemble with proper thread sealant rated for gas service (never use Teflon tape alone on NPT gas fittings unless tape is yellow-coded gas-rated type).
9. Perform soap-bubble or electronic leak test at all disturbed joints before restoring gas.
10. Light appliance, verify proper combustion, verify no CO.

### MANDATORY protocol
- SHUT GAS AT APPLIANCE SHUTOFF VALVE IMMEDIATELY
- IF LEAK PERSISTS AFTER APPLIANCE VALVE CLOSED: SHUT AT METER, EVACUATE
- DO NOT RESTORE GAS UNTIL ALL JOINTS PASS BUBBLE OR ELECTRONIC LEAK TEST
- DOCUMENT LEAK LOCATION, REPAIR PERFORMED, AND TEST RESULT ON WORK ORDER

### Sources
- Gas Leak Safety — Halton Gas: https://www.haltongas.com/post/gas-leak-safety-for-homeowners-how-to-identify-and-fix-issues
- How to Prevent Gas Leaks — Wolff Heating: https://www.wolffheatingcooling.com/the-ultimate-guide-to-gas-line-maintenance-and-inspection-importance/

### Mike's tone for this scenario
- "Hissing gas fitting means shut it off right now. Do not tighten fittings on a live system. Soap test every joint before you light anything."

---

## SCN-SAF-003 — Yellow/Orange Burner Flame (Incomplete Combustion)
**Equipment / situation:** Gas furnace or water heater. Tech observes burner flame during operation.

### Symptoms / readings / measurements
- Flame burns yellow or orange instead of blue with small yellow tips
- Combustion analyzer: CO elevated (50–500+ ppm air-free), O2 low (<3%)
- Soot deposits visible on heat exchanger or burner surfaces
- Possible odor of aldehydes or unburned gas

### CORRECT diagnostic / response sequence
1. Record combustion analyzer readings before disturbing anything (O2, CO, stack temp, CO2, efficiency).
2. Shut down appliance for inspection.
3. Inspect burner ports for blockage (rust, spider webs, debris, scale).
4. Check primary air adjustment / air shutter position.
5. Inspect gas orifice for partial blockage or wrong size (LP orifice in natural gas application = rich combustion).
6. Verify manifold pressure is within spec (3.5" WC natural gas; 10–11" WC LP).
7. Check for combustion air starvation: measure CAZ depressurization, inspect air openings.
8. Clean burners per manufacturer procedure.
9. Re-fire and re-analyze — target CO air-free below 100 ppm, O2 3–6%.
10. **SAFETY-CRITICAL: If CO air-free exceeds 400 ppm after correction, shut down appliance. CO at register requires immediate occupant notification and appliance condemnation until cause is resolved.**

### MANDATORY protocol
- DO NOT RESTORE SERVICE if CO air-free exceeds 400 ppm after burner cleaning/adjustment
- NOTIFY OCCUPANTS OF CO RISK IN WRITING before leaving
- IF OCCUPANTS REPORT SYMPTOMS (headache, nausea, dizziness): EVACUATE AND CALL 911 IMMEDIATELY

### Sources
- Combustion-Safety Evaluation — wxfieldguide.com: https://wxfieldguide.com/mo/MOWxFG/HeatingCooling/Combustion-Safety_Evaluation.htm
- Gas Burner Soot Diagnosis — InspectApedia: https://inspectapedia.com/plumbing/Gas-Burner-Sooting-Diagnosis.php
- NIOSH CO IDLH 1200 ppm — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html

### Mike's tone for this scenario
- "Yellow flame is not a tuning issue — it's a CO risk. Get the analyzer on it before you touch anything."

---

## SCN-SAF-004 — Flame Rollout: Rollout Switch Tripped
**Equipment / situation:** Gas furnace. Control board diagnostic shows rollout fault. Rollout switch has opened.

### Symptoms / readings / measurements
- Rollout limit switch open (confirmed by continuity test — open circuit)
- Visible scorch marks on burner compartment exterior, wiring harness, or cabinet
- Possible soot around burner door or front panel
- Furnace in lockout

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Do NOT simply reset the rollout switch and return system to service. This is not a maintenance item — it is a safety shutdown indicating a dangerous condition.**
2. Inspect heat exchanger for cracks or blockage (primary cause of rollout).
3. Inspect inducer/vent system for blockage — bird nests, debris, ice at termination, collapsed flue.
4. Inspect burners for misalignment, carryover ports clogged, or incorrect gas pressure causing extended flame.
5. Check for supply air problems causing overpressure in combustion chamber.
6. If heat exchanger is cracked: **condemn appliance** (see SCN-SAF-010).
7. If venting is blocked: clear blockage, verify draft, verify CO, then — and only then — reset rollout switch.
8. Document root cause. Never reset without documenting root cause on work order.
9. After correction: fire appliance and observe flame for proper containment within burner box.

### MANDATORY protocol
- NEVER RESET ROLLOUT SWITCH WITHOUT IDENTIFYING ROOT CAUSE
- IF HEAT EXCHANGER IS CRACKED: SHUT OFF GAS AND POWER, CONDEMN APPLIANCE
- DOCUMENT ROOT CAUSE AND CORRECTIVE ACTION ON EVERY ROLLOUT CALL

### Sources
- Furnace Flame Rollout Limit Switch — North NJ HVAC: https://northnjhvac.com/furnace-flame-rollout-limit-switch-causes-diagnosis-repair/
- Furnace Flame Rollout Switch — HVAC Training Shop: https://hvactrainingshop.com/furnace-flame-rollout-switch/

### Mike's tone for this scenario
- "Rollout switch tripped is a red flag, not a maintenance item. Find out why flames left the box before you reset anything."

---

## SCN-SAF-005 — Delayed Ignition: Loud Bang or Thump on Startup
**Equipment / situation:** Gas furnace. Customer reports loud bang, boom, or thump when furnace starts.

### Symptoms / readings / measurements
- Audible bang or mini-explosion sound at ignition
- Flame sensor signal delayed beyond normal ignition sequence
- Burner ports may show partial blockage
- Possible visible scorch marks inside burner compartment after repeated events

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Repeated delayed ignition events can crack the heat exchanger. Treat this as a potential heat exchanger integrity issue until proven otherwise.**
2. Record full ignition sequence: inducer start → pressure switch close → igniter warm-up → gas valve open → flame establishment time.
3. Measure time from gas valve opening to flame establishment (should be under 4 seconds for most equipment).
4. Inspect burner ports for blockage (rust, debris, spider webs).
5. Check manifold pressure — low pressure causes weak gas flow, delayed flame reach.
6. Inspect crossover (carry-over) ports between burners — blockage prevents flame from traveling across.
7. Check igniter temperature / microamp draw.
8. After cleaning/repair: observe 3–5 complete ignition cycles for bang recurrence.
9. **If bang is occurring on an older furnace (10+ years): inspect heat exchanger before closing the call.**

### MANDATORY protocol
- INSPECT HEAT EXCHANGER IF DELAYED IGNITION HAS BEEN RECURRING
- DO NOT RETURN SYSTEM TO SERVICE WITH CONFIRMED CRACKED HEAT EXCHANGER
- DOCUMENT SYMPTOM DESCRIPTION, CAUSE, AND REPAIR ON WORK ORDER

### Sources
- Delayed Furnace Ignition — North NJ HVAC: https://northnjhvac.com/delayed-ignition-gas-furnaces-causes-diagnosis-repair/
- Causes and Dangers of Delayed Furnace Ignition — Mauzy: https://mauzy.com/causes-and-dangers-of-delayed-furnace-ignition/

### Mike's tone for this scenario
- "A bang on startup is gas accumulating before ignition. That's an explosion event in miniature. Fix it — and check the heat exchanger."

---

## SCN-SAF-006 — Soot Accumulation on Heat Exchanger / Burners
**Equipment / situation:** Gas furnace annual inspection. Tech finds heavy soot on burners, heat exchanger exterior, or flue connection.

### Symptoms / readings / measurements
- Black soot deposits on burner surfaces, heat exchanger exterior, or at flue collar
- Yellow-tipped or orange flames observed
- Combustion analysis: CO air-free elevated (>100 ppm, possibly >400 ppm)
- Reduced system efficiency

### CORRECT diagnostic / response sequence
1. Combustion analyze before disturbing (document as-found condition).
2. Shut down, inspect burner ports, primary air shutters, gas orifices.
3. Check for LP-to-NG conversion error (over-sized orifices for NG = rich mixture = soot).
4. Inspect heat exchanger — soot buildup can indicate cracked primary cell allowing combustion products to contaminate secondary side.
5. Clean burners and ports thoroughly.
6. Verify manifold pressure and primary air adjustment.
7. Re-fire and re-analyze.
8. **SAFETY-CRITICAL: Heavy soot on heat exchanger exterior, or soot inside the air distribution side, indicates heat exchanger failure. Inspect for cracks immediately.**

### MANDATORY protocol
- COMBUSTION ANALYZE BEFORE AND AFTER ANY BURNER SERVICE
- IF SOOT FOUND INSIDE DUCTWORK OR ON SUPPLY REGISTERS: SUSPECT CRACKED HEAT EXCHANGER — INSPECT AND CONDEMN IF CONFIRMED

### Sources
- Gas Burner Soot Diagnosis — InspectApedia: https://inspectapedia.com/plumbing/Gas-Burner-Sooting-Diagnosis.php
- Causes and Dangers of Inadequate Combustion Air — Any Season HVAC: https://www.anyseasonhvac.com/causes-and-dangers-of-inadequate-combustion-air-for-furnaces

### Mike's tone for this scenario
- "Soot inside the air side is a heat exchanger call. Don't just clean the burners and go."

---

## SCN-SAF-007 — Furnace Backdrafting: Flue Gas Spillage
**Equipment / situation:** Atmospheric or natural-draft furnace. Tech performing combustion safety evaluation in tight home.

### Symptoms / readings / measurements
- Smoke or combustion odor in living space during furnace operation
- Brown stain above draft hood or at barometric damper
- Rust inside heat exchanger or on flue pipe
- CAZ (combustion appliance zone) depressurization measured negative (worse than -5 Pa WRT outdoors under worst-case conditions)
- CO measured in undiluted flue gas above 200 ppm, or spillage detected at draft hood during operation

### CORRECT diagnostic / response sequence
1. Perform worst-case depressurization test: close all exterior doors/windows, run all exhaust fans (bath, kitchen, dryer, ERV/HRV), light all combustion appliances.
2. Measure CAZ pressure with reference to outdoors using digital manometer.
3. Perform spillage test at draft hood using chemical smoke or mirror.
4. **SAFETY-CRITICAL: If spillage continues for more than 2 minutes under worst-case conditions, shut appliance down. Do not leave it running.**
5. Measure CO in undiluted flue gas — if above 200 ppm (400 ppm air-free), appliance requires service before return to operation.
6. Identify root cause: return duct leaks, over-tightened envelope, exhaust fan imbalance, blocked or undersized flue.
7. Remediate root cause — seal return duct leaks, add combustion air opening, or upgrade to sealed-combustion appliance.
8. Re-test under worst-case conditions after repair.

### MANDATORY protocol
- SHUT DOWN APPLIANCE IF SPILLAGE EXCEEDS 2 MINUTES UNDER WORST-CASE CONDITIONS
- DO NOT LEAVE OCCUPANTS WITH AN ACTIVE CO SOURCE — NOTIFY IN WRITING OF RISK
- DO NOT RESTORE SERVICE UNTIL ROOT CAUSE IS CORRECTED AND WORST-CASE TEST PASSES

### Sources
- Backdrafting and Spillage — HVAC Insider: https://hvacinsider.com/backdrafting-and-spillage/
- Combustion-Safety Evaluation — wxfieldguide.com: https://wxfieldguide.com/mo/MOWxFG/HeatingCooling/Combustion-Safety_Evaluation.htm

### Mike's tone for this scenario
- "Spillage for two minutes under worst-case means it's happening every time the exhaust fan runs. Shut it down. You can't leave that."

---

## SCN-SAF-008 — Condensate Freeze in B-Vent / Single-Wall Flue
**Equipment / situation:** 80% AFUE atmospheric furnace with single-wall metal flue. Winter call — furnace not heating, inducer running but no ignition.

### Symptoms / readings / measurements
- Ice visible at flue termination cap (exterior)
- Condensate dripping back down flue pipe inside equipment
- Pressure switch nuisance trips (condensate pooling in drain pan or inducer housing)
- Possible CO production history due to restricted draft

### CORRECT diagnostic / response sequence
1. Inspect flue termination outside — ice blockage at cap is a common winter failure on oversized flue pipes.
2. Thaw ice carefully (warm water, not torch); verify full draft path is clear.
3. Inspect flue horizontal runs for slope — must slope upward at minimum 1/4" per foot toward chimney; negative slope collects condensate.
4. Check flue diameter against equipment nameplate — oversized B-vent cools faster, promotes condensation.
5. **SAFETY-CRITICAL: A partially blocked flue produces CO inside the home before the furnace trips pressure switches. Measure CO at supply registers before restoring operation.**
6. Consider upgrading single-wall to double-wall B-vent in exposed/unheated spaces to prevent recurrence.
7. Add insulation to flue sections in unheated spaces if diameter correction is not feasible.

### MANDATORY protocol
- VERIFY FULL DRAFT PATH CLEAR BEFORE RESTORING GAS
- MEASURE CO AT SUPPLY REGISTER BEFORE LEAVING — ZERO TOLERANCE FOR CO IN CONDITIONED AIR
- DOCUMENT CONDITION AND RECOMMEND PERMANENT FIX IN WRITING

### Sources
- Furnace Flue Requirements — Efficiency Heating & Cooling: https://www.eheatcool.com/services/furnace/replacement/furnace-flue-requirements-your-ultimate-guide/
- Backdrafting and Spillage — HVAC Insider: https://hvacinsider.com/backdrafting-and-spillage/

### Mike's tone for this scenario
- "Ice at the cap means CO stayed inside before the switch tripped. Test the air before you leave."

---

## SCN-SAF-009 — Oversized or Undersized Venting
**Equipment / situation:** New or replacement furnace install. Tech discovers existing B-vent is significantly oversized or undersized for the appliance BTU input.

### Symptoms / readings / measurements
- Flue diameter does not match NFGC/manufacturer sizing table for appliance input and height
- Oversized: condensation stains, rusting flue pipe, spillage, reduced draft
- Undersized: high stack temperature, furnace cycling on high limit, blocked vent fault codes
- CO elevated at spillage test

### CORRECT diagnostic / response sequence
1. Pull appliance nameplate BTU input and AFUE.
2. Reference National Fuel Gas Code (NFGC / ANSI Z223.1) Tables 13-1 through 13-6 for correct vent diameter based on height and lateral run.
3. Oversized flue: gases cool before reaching chimney, produce condensation and spillage. Correct by relining with correctly-sized liner or converting appliance to direct-vent.
4. Undersized flue: excessive back-pressure, safety tripping. Correct by upsizing or converting to direct-vent.
5. **SAFETY-CRITICAL: Do not leave an improperly vented appliance in service. Both conditions can cause CO poisoning.**
6. Document existing vent size, required size, and recommended correction.

### MANDATORY protocol
- DO NOT LEAVE IMPROPERLY VENTED APPLIANCE IN SERVICE
- DOCUMENT VENTING DEFICIENCY AND RECOMMENDED CORRECTION IN WRITING FOR HOMEOWNER
- VERIFY CO AT REGISTERS BEFORE LEAVING ANY VENTING JOB

### Sources
- Furnace Flue Requirements Guide — Efficiency Heating & Cooling: https://www.eheatcool.com/services/furnace/replacement/furnace-flue-requirements-your-ultimate-guide/
- Combustion-Safety Evaluation — wxfieldguide.com: https://wxfieldguide.com/mo/MOWxFG/HeatingCooling/Combustion-Safety_Evaluation.htm

### Mike's tone for this scenario
- "NFGC tables are not suggestions. Wrong vent size means CO risk. Document it and recommend the fix."

---

## SCN-SAF-010 — Cracked Heat Exchanger: Confirmed (Generic — Any Platform)
**Equipment / situation:** Any residential gas furnace. Crack in primary heat exchanger confirmed by inspection.

### Symptoms / readings / measurements
- Flame flutter when blower starts (flame deflects toward crack as blower creates pressure differential)
- CO detected at supply registers (any reading above background is significant)
- Visual crack, split seam, or rust-through hole confirmed via borescope, mirror, or combustion dye test
- Possible delayed ignition history
- CO alarm activation in home

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: A confirmed cracked heat exchanger is a condemnation-level finding. There is no acceptable repair for a cracked primary heat exchanger in a residential furnace.**
2. Shut off gas supply at appliance shutoff valve.
3. Shut off electrical power to furnace at service disconnect.
4. Tag unit with a lock-out tag: "UNSAFE — DO NOT OPERATE."
5. Notify homeowner in person and in writing: crack confirmed, CO risk present, appliance must not be operated.
6. Document inspection method used, location of crack, CO readings at registers and at flue, and flame behavior.
7. Do NOT offer a "temporary repair." Do NOT offer to patch, weld, or epoxy the heat exchanger.
8. Recommend full furnace replacement.
9. If occupants have symptoms (headache, nausea, dizziness): call 911 immediately before leaving.

### MANDATORY protocol
- SHUT OFF GAS AT APPLIANCE SHUTOFF VALVE
- SHUT OFF ELECTRICAL POWER AT SERVICE DISCONNECT
- TAG UNIT: "UNSAFE — DO NOT OPERATE"
- NOTIFY HOMEOWNER IN WRITING — CRACKED HEAT EXCHANGER, CO RISK
- NO TEMPORARY REPAIRS — REPLACEMENT ONLY
- IF OCCUPANT SYMPTOMS PRESENT: CALL 911, DO NOT WAIT

### Sources
- Heat Exchanger Crack Diagnosis — HVAC School: https://hvacrschool.com/heat-exchanger-crack-diagnosis/
- Cracked Heat Exchanger — EMCO Cooling: https://emcocooling.com/how-to-detect-and-service-a-cracked-heat-exchanger/
- What to Do If Your Furnace Has a Cracked Heat Exchanger — Lennox: https://www.lennox.com/residential/lennox-life/consumer/furnace-cracked-heat-exchanger

### Mike's tone for this scenario
- "Cracked heat exchanger. You shut the gas off, you shut the power off, you tag it, and you tell the homeowner in writing. That's the job. No patches. No exceptions."

---

## SCN-SAF-011 — Trane XV95/XC95 Heat Exchanger Inspection
**Equipment / situation:** Trane XV95 or XC95 condensing furnace. Annual inspection or CO complaint call.

### Symptoms / readings / measurements
- Possible CO at registers
- Flame flutter test: flame deflects when blower energizes
- High-efficiency furnace (secondary heat exchanger present — stainless steel condensing coil)

### CORRECT diagnostic / response sequence
1. Perform combustion analysis as-found with all access panels in place (simulate normal operation).
2. Perform flame flutter test: light burners, let reach steady state, watch flame through inspection port when blower starts.
3. Use borescope through burner openings to inspect primary tubes for cracks, rust-through, or perforations.
4. Inspect secondary (condensing) heat exchanger for blockage, corrosion, or separation at joints.
5. Inspect condensate drain for blockage — blocked condensate causes acid pooling, accelerating secondary exchanger failure.
6. Trane service bulletin DSB09-0022 outlines inspection criteria for 90%+ furnace heat exchangers.
7. **SAFETY-CRITICAL: If any crack confirmed — see SCN-SAF-010. No exceptions.**

### MANDATORY protocol
- Follow SCN-SAF-010 condemnation protocol if crack is confirmed
- DOCUMENT inspection method, any CO readings, and flame behavior observed

### Sources
- DSB09-0022: 90% Furnace Heat Exchanger Inspection — CemaTraining: http://cematraining.com/wp-content/uploads/2020/09/DSB09-0022.pdf
- Heat Exchanger Crack Diagnosis — HVAC School: https://hvacrschool.com/heat-exchanger-crack-diagnosis/

### Mike's tone for this scenario
- "High-efficiency doesn't mean immune. Check both heat exchangers. Secondary failure causes acidic condensate backup — kills the primary next."

---

## SCN-SAF-012 — Carrier 58MCA/58CVA Secondary Heat Exchanger Failure
**Equipment / situation:** Carrier 58MCA or 58CVA condensing furnace. Known history of secondary heat exchanger failures in this model line.

### Symptoms / readings / measurements
- Fault code 33 (limit circuit fault) — high limit or rollout tripping
- Possible CO elevated at registers
- Condensate drain backing up
- Inducer motor running harder than normal

### CORRECT diagnostic / response sequence
1. Reference Carrier Service Bulletins SMB09-0022 and SMB19-0022 — 58MC/58CV series had known secondary heat exchanger failures with enhanced warranty coverage.
2. Check serial number against bulletin's covered range (2993A00001 – 1808A99999).
3. Inspect condensate collection box and secondary heat exchanger — cannot visually inspect inside condensing coil, but check for leaks, blockage, and separation at outlet.
4. Remove inducer to access bottom outlet openings for limited visual inspection.
5. If secondary heat exchanger is blocked or failed: restricts exhaust flow, causing pressure switch issues and limit trips.
6. **SAFETY-CRITICAL: Secondary failure can force combustion products through cracks in primary. CO test registers before and after any repair.**

### MANDATORY protocol
- CHECK SERIAL NUMBER AGAINST CARRIER SERVICE BULLETIN COVERAGE
- TEST CO AT REGISTERS BEFORE AND AFTER REPAIR
- DOCUMENT BULLETIN NUMBER AND SERIAL NUMBER ON WORK ORDER

### Sources
- Carrier Service Bulletin SMB19-0022 — CemaTraining: https://cematraining.com/wp-content/uploads/2022/11/SMB19-0022.pdf
- Safety Notice — Carrier Secondary Heat Exchangers — Airco Heating: https://www.aircoheating.ca/safety-notice-carrier-heat-exchangers/

### Mike's tone for this scenario
- "58MCA secondary heat exchanger is a known issue. Pull the serial number, check the bulletin. This is a documented Carrier defect."

---

## SCN-SAF-013 — Goodman GMSS96 Heat Exchanger Inspection
**Equipment / situation:** Goodman GMSS96 (or GCSS96) condensing furnace. CO complaint or annual inspection.

### Symptoms / readings / measurements
- CO reading at supply register (any measurable reading above zero is actionable)
- Possible flame flutter during blower operation
- Unit may be 8–15 years old with limited maintenance history

### CORRECT diagnostic / response sequence
1. Combustion analyze as-found, all panels in place.
2. Flame flutter test through burner inspection port.
3. Use borescope to inspect aluminized steel primary heat exchanger tubes for rust-through, cracks, or stress fractures.
4. GMSS96 uses clamshell-type primary heat exchangers — inspect all seams.
5. Inspect secondary condensing coil for physical integrity.
6. Verify condensate drain clear — acid condensate pooling accelerates failure.
7. **SAFETY-CRITICAL: If crack confirmed — SCN-SAF-010 condemnation protocol.**

### MANDATORY protocol
- Follow SCN-SAF-010 if crack is confirmed
- DOCUMENT as-found CO readings and all inspection findings

### Sources
- Heat Exchanger Crack Diagnosis — HVAC School: https://hvacrschool.com/heat-exchanger-crack-diagnosis/
- Cracked Heat Exchangers — PICKHVAC: https://www.pickhvac.com/furnace-cracked-heat-exchanger-symptoms-risks-diagnosis-fix/

### Mike's tone for this scenario
- "Goodman clamshell exchangers are the first place to look on an older unit. Run the borescope across every seam."

---

## SCN-SAF-014 — Lennox SLP98 Heat Exchanger Inspection
**Equipment / situation:** Lennox SLP98 (98% AFUE) modulating condensing furnace. Annual inspection or CO call.

### Symptoms / readings / measurements
- Lennox SLP98 uses stainless steel primary heat exchanger with serpentine coil design
- Possible CO at registers
- Blower speed modulation makes flame flutter test less definitive — flame may not deflect consistently

### CORRECT diagnostic / response sequence
1. Combustion analyze as-found — multi-stage operation means test at high fire and low fire.
2. At high fire with blower running: observe flame via inspection window for deflection.
3. Borescope inspection of stainless serpentine tubes — check for stress cracks at bends, corrosion pitting.
4. Inspect condensate trap and secondary coil.
5. Lennox SLP98 stainless steel exchangers are generally more durable than aluminized steel, but not immune to failure — look especially at stress points at bends.
6. **SAFETY-CRITICAL: Any crack = SCN-SAF-010 condemnation protocol.**

### MANDATORY protocol
- COMBUSTION ANALYZE AT BOTH FIRING STAGES
- FOLLOW SCN-SAF-010 IF CRACK CONFIRMED

### Sources
- HVAC School Heat Exchanger Crack Diagnosis: https://hvacrschool.com/heat-exchanger-crack-diagnosis/
- Lennox SLP98UHV Installation Instructions — Questar Gas: https://www.questargas.com/ForEmployees/qgcOperationsTraining/Furnaces/Lennox_SLP98UHV_IOM.pdf

### Mike's tone for this scenario
- "Stainless is harder to crack but bends are the weak point. Borescope the serpentine turns on every SLP98 inspection."

---

## SCN-SAF-015 — Rheem R96V Heat Exchanger Inspection
**Equipment / situation:** Rheem R96V (Classic Plus 96% AFUE) condensing furnace. Annual or CO complaint.

### Symptoms / readings / measurements
- CO at registers possible
- Flame flutter during blower engagement
- Possible history of delayed ignition

### CORRECT diagnostic / response sequence
1. As-found combustion analysis with all panels closed.
2. Flame flutter test — watch through burner view port as blower stage comes on.
3. Borescope through burner openings to inspect primary aluminized steel clam-shell cells.
4. Check R96V-specific condensate box for corrosion or cracks at plastic-to-metal interfaces.
5. Inspect induced draft blower for corrosion or restricted outlet — both affect draft and CO production.
6. **SAFETY-CRITICAL: If crack confirmed — SCN-SAF-010 condemnation protocol.**

### MANDATORY protocol
- Follow SCN-SAF-010 if crack confirmed
- DOCUMENT all CO readings and inspection method

### Sources
- Heat Exchanger Crack Diagnosis — HVAC School: https://hvacrschool.com/heat-exchanger-crack-diagnosis/
- Cracked Heat Exchanger Symptoms — Alpha Mechanicals: https://alphamechanicals.com/blog/cracked-heat-exchanger-symptoms/

### Mike's tone for this scenario
- "Check the plastic condensate box interface on the R96V — that's a known stress point. Borescope every cell."

---

## SCN-SAF-016 — York Affinity YP9C Heat Exchanger Inspection
**Equipment / situation:** York Affinity YP9C (modulating, up to 98% AFUE) condensing furnace. Annual or CO complaint.

### Symptoms / readings / measurements
- Possible 5-flash diagnostic code (rollout switch open) — rollout on this platform = suspect heat exchanger or blocked venting
- CO at registers
- Flame deflection during blower operation

### CORRECT diagnostic / response sequence
1. If 5-flash code present: do NOT reset rollout switch until heat exchanger and venting are inspected.
2. Combustion analyze as-found.
3. Flame flutter test at high-fire stage.
4. Borescope through burner access — inspect primary stainless coil for cracks, perforations, or corrosion.
5. York Affinity YP9C technical guide (YTG-F-1016) specifies inspection intervals and procedures.
6. **York Installation Manual specifically warns: do not drill out orifices — drilling misaligns flame and causes premature heat exchanger burnout.**
7. **SAFETY-CRITICAL: Crack confirmed = SCN-SAF-010 condemnation protocol.**

### MANDATORY protocol
- DO NOT RESET 5-FLASH ROLLOUT WITHOUT HEAT EXCHANGER INSPECTION
- FOLLOW SCN-SAF-010 IF CRACK CONFIRMED

### Sources
- York Affinity YP9C Technical Guide — HVAC Navigator: https://files.hvacnavigator.com/p/538513-ytg-f-1016.pdf
- York Affinity YP9C Users Manual: https://cliffsheating.com/new/wp-content/uploads/2015/03/York-Affinity-YP9C-Users-Manual.pdf

### Mike's tone for this scenario
- "5-flash on a York Affinity is not a maintenance reset. That rollout tripped for a reason. Inspect the heat exchanger first."

---

## SCN-SAF-017 — Gas Valve Stuck Closed
**Equipment / situation:** Gas furnace. Igniter glows, draft confirmed, pressure switches closed, but no gas flow — burners never light.

### Symptoms / readings / measurements
- Igniter glows hot (amperage or visual confirmation)
- All pressure switches closed
- No audible click from gas valve coils
- Manometer at manifold reads zero during call for heat
- Gas valve coil resistance out of spec (open or shorted)

### CORRECT diagnostic / response sequence
1. Verify 24V signal reaching gas valve TH-W terminals during call for heat.
2. Verify 24V at MV (main valve) terminal.
3. Measure gas valve coil resistance — per manufacturer spec (typically 40–80 ohms for main coil).
4. Verify inlet gas pressure at valve inlet port — must be within 4.5–14" WC for natural gas per most valve specs.
5. If 24V present, inlet pressure correct, and valve coil in spec but no gas flow: gas valve is mechanically stuck closed — replace valve.
6. If coil resistance is open: replace valve. Do not attempt to repair gas valve internals.

### MANDATORY protocol
- DO NOT JUMPER OR BYPASS GAS VALVE SAFETY CONTROLS
- VERIFY INLET PRESSURE IS WITHIN SPEC BEFORE CONDEMNING VALVE
- AFTER REPLACEMENT: SOAP TEST ALL FITTINGS AND VERIFY MANIFOLD PRESSURE

### Sources
- Natural Gas Pressure for Furnaces — North NJ HVAC: https://northnjhvac.com/natural-gas-pressure-furnace-proper-settings-troubleshooting/
- HVAC Training Shop Flame Rollout: https://hvactrainingshop.com/furnace-flame-rollout-switch/

### Mike's tone for this scenario
- "Verify the signal and the pressure before you call the valve dead. Then replace it — never repair or bypass gas valve internals."

---

## SCN-SAF-018 — Gas Valve Stuck Open (Flame Present Without Call)
**Equipment / situation:** Gas furnace. Furnace continues to burn after thermostat call ends. Flame stays lit. (Related to v2 SCN-14 but expanded with full safety protocol.)

### Symptoms / readings / measurements
- Flame visible through inspection window after thermostat W signal removed
- Control board diagnostic: flame sensed without call (5-flash on many boards)
- Burner continues to fire with blower off — risk of overheating

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Shut off gas at appliance shutoff valve immediately.**
2. Confirm flame extinguishes after gas shutoff — if not, shut off at meter.
3. Verify flame sensor is not sending false signal (grounded flame sensor wire to chassis).
4. Test flame sensor rod for proper position and isolation.
5. With gas off: test gas valve coil — an open coil (should close when de-energized) indicates a mechanically stuck-open valve.
6. Replace gas valve — a valve that leaks through when de-energized is a safety failure. Do not attempt repair.
7. After replacement: soap-test all fittings, verify manifold pressure, observe 3 full cycles.

### MANDATORY protocol
- SHUT GAS AT APPLIANCE SHUTOFF VALVE IMMEDIATELY
- DO NOT RETURN SYSTEM TO SERVICE UNTIL VALVE IS REPLACED AND TESTED
- NOTIFY HOMEOWNER OF RISK: UNCONTROLLED GAS BURN CREATES CO AND FIRE HAZARD

### Sources
- Furnace Flame Rollout Limit Switch — North NJ HVAC: https://northnjhvac.com/furnace-flame-rollout-limit-switch-causes-diagnosis-repair/

### Mike's tone for this scenario
- "Gas burning when there's no call is an unsafe condition. Shut the gas off first. Diagnose second."

---

## SCN-SAF-019 — Gas Valve Regulator Out of Spec (Manifold Pressure Wrong)
**Equipment / situation:** Gas furnace. Customer reports inconsistent heat or high gas bills. Tech finds manifold pressure significantly out of spec.

### Symptoms / readings / measurements
- Manifold pressure measured at valve outlet port
- Natural gas: spec is typically 3.5" WC (range 3.2–4.0" WC per manufacturer)
- LP/propane: spec is typically 10–11" WC
- High manifold pressure: rich combustion, CO production, yellow flame, overheating
- Low manifold pressure: weak flame, delayed ignition, poor heat output

### CORRECT diagnostic / response sequence
1. Measure inlet pressure at gas valve inlet port — must be 5–14" WC for NG, 11–14" WC for LP.
2. If inlet pressure is out of spec: problem is upstream (utility supply or regulator at meter). Call gas utility.
3. If inlet is correct but manifold is wrong: adjust gas valve internal regulator per manufacturer procedure.
4. NG manifold adjustment: typically 3.5" WC measured with manometer at manifold port while firing.
5. LP manifold adjustment: typically 10" WC.
6. **SAFETY-CRITICAL: High manifold pressure = rich combustion = elevated CO and fire risk. Do not leave high manifold without correcting.**
7. After adjustment: combustion analyze — verify CO air-free below 100 ppm, O2 3–6%.

### MANDATORY protocol
- MEASURE INLET AND MANIFOLD PRESSURE — DOCUMENT BOTH VALUES
- CORRECT MANIFOLD PRESSURE BEFORE LEAVING
- COMBUSTION ANALYZE AFTER ADJUSTMENT
- IF INLET PRESSURE OUT OF SPEC: CALL GAS UTILITY — DO NOT ADJUST APPLIANCE AROUND A SUPPLY PROBLEM

### Sources
- What Should Gas Furnace Pressure Be — AC Direct: https://www.acdirect.com/blog/what-should-a-gas-furnace-pressure-be-when-running/
- How to Check Gas Manifold Pressure — Same Day HVAC: https://samedaysd.com/blog/how-to-check-gas-manifold-pressure/
- Natural Gas Pressure for Furnaces — North NJ HVAC: https://northnjhvac.com/natural-gas-pressure-furnace-proper-settings-troubleshooting/

### Mike's tone for this scenario
- "Wrong manifold pressure is a combustion problem. Get the manometer on it. Document in and out values on the work order."

---

## SCN-SAF-020 — LP vs Natural Gas Conversion Error
**Equipment / situation:** Furnace installed or serviced by previous contractor. Customer reports yellow flames, excessive CO, or appliance not heating properly. Investigation reveals wrong orifices or wrong valve spring installed.

### Symptoms / readings / measurements
- LP orifices installed in natural gas application: extremely rich combustion, heavy CO, yellow flames, soot
- Natural gas orifices installed in LP application: lean combustion, possible flame lift-off, poor heating, potential gas accumulation near appliance
- Combustion analysis severely out of spec in either direction
- Appliance data tag does not match installed orifice set

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Shut down appliance immediately. A mis-converted appliance is unsafe.**
2. Confirm what fuel is supplied at the meter/service (LP or NG).
3. Check appliance rating plate — does it show conversion kit installed? Which fuel?
4. Inspect orifices: LP orifices are smaller diameter than NG orifices for the same BTU input.
5. Check gas valve spring — LP valve springs are set to higher manifold pressure (10–11" WC vs 3.5" WC for NG).
6. If LP orifices in NG application: replace with correct NG orifice set AND correct valve spring.
7. If NG orifices in LP application: replace with correct LP orifice set AND correct valve spring AND verify LP regulator.
8. After correct orifices installed: set manifold pressure, combustion analyze, document.
9. **Do not attempt to compensate for wrong orifices by adjusting pressure — this will not produce safe combustion.**

### MANDATORY protocol
- SHUT DOWN APPLIANCE IMMEDIATELY ON DISCOVERY
- REPLACE BOTH ORIFICES AND GAS VALVE SPRING FOR CORRECT FUEL
- NEVER ADJUST PRESSURE AS A SUBSTITUTE FOR CORRECT ORIFICES
- COMBUSTION ANALYZE AFTER CONVERSION COMPLETION
- DOCUMENT CONVERSION ON APPLIANCE DATA TAG

### Sources
- Gas Appliance Regulator Conversion — InspectApedia: https://inspectapedia.com/plumbing/Gas_Regulator_Convert_NG_LPG.php
- Gas Type Adjustment Guide — The Furnace Outlet: https://thefurnaceoutlet.com/blogs/hvac-tips/gas-type-adjustment-guide-safely-convert-natural-gas-furnaces-to-propane
- LP Gas Pressure for Furnaces — North NJ HVAC: https://northnjhvac.com/lp-gas-pressure-furnaces-optimal-settings-troubleshooting/

### Mike's tone for this scenario
- "Wrong orifices and wrong valve spring. Both. You can't fix a fuel conversion mistake with a pressure adjustment."

---

## SCN-SAF-021 — Combustion Air Starvation: Atmospheric Furnace in Tight Home
**Equipment / situation:** Older 80% AFUE atmospheric furnace in a recently weatherized or very tight home. CO complaint or combustion analysis failure.

### Symptoms / readings / measurements
- Combustion analysis: O2 below 2–3%, CO air-free elevated (200–1000+ ppm)
- Yellow-tipped flame
- Visible condensation on windows, high indoor humidity
- Draft hood spilling under normal operation
- CAZ measures negative under worst-case conditions

### CORRECT diagnostic / response sequence
1. Measure CAZ depressurization (with reference to outdoors) under worst-case conditions (all exhaust fans on, doors closed, house sealed).
2. Atmospheric furnace requires 50 CFM+ of combustion air per 10,000 BTUH of input — confirm available air openings meet code.
3. Measure O2 and CO in undiluted flue gases.
4. **SAFETY-CRITICAL: If CO air-free exceeds 400 ppm with the home sealed up, the appliance cannot safely serve this installation without a combustion air solution.**
5. Solutions: add direct outdoor combustion air duct to furnace room (minimum size per NFGC), upgrade appliance to sealed combustion (Category IV), or add makeup air system.
6. Do not simply leave occupants with inadequate combustion air — CO risk is ongoing and worsens as house is sealed further.

### MANDATORY protocol
- DO NOT LEAVE APPLIANCE IN SERVICE IF CO AIR-FREE EXCEEDS 400 PPM UNDER WORST-CASE CONDITIONS
- DOCUMENT COMBUSTION AIR DEFICIENCY IN WRITING FOR HOMEOWNER
- RECOMMEND SEALED COMBUSTION APPLIANCE AS PERMANENT SOLUTION IN TIGHT HOMES

### Sources
- Causes and Dangers of Inadequate Combustion Air — Any Season HVAC: https://www.anyseasonhvac.com/causes-and-dangers-of-inadequate-combustion-air-for-furnaces
- How Negative Pressure Causes Furnace Air Starvation — North NJ HVAC: https://northnjhvac.com/how-negative-pressure-building-causes-furnace-air-starvation/
- Combustion-Safety Evaluation — wxfieldguide.com: https://wxfieldguide.com/mo/MOWxFG/HeatingCooling/Combustion-Safety_Evaluation.htm

### Mike's tone for this scenario
- "Tight home plus atmospheric burner is a problem. Measure the CAZ pressure, run the analyzer, and tell the homeowner in writing what you found."

---

## SCN-SAF-022 — Sealed Combustion Furnace: Intake or Exhaust Pipe Restriction
**Equipment / situation:** Direct-vent (sealed combustion) 90%+ AFUE furnace. Furnace faulting on pressure switch or high limit. No CO complaint yet, but tech finds restriction.

### Symptoms / readings / measurements
- Pressure switch fault codes on control board
- Partially blocked PVC intake or exhaust termination (ice, bird nest, debris, pinched pipe)
- Combustion analysis: elevated CO, reduced O2
- Inducer operating but reduced airflow

### CORRECT diagnostic / response sequence
1. Inspect both intake and exhaust PVC terminations at exterior wall.
2. Check for ice blockage at termination (winter), bird or wasp nests (spring/summer), debris accumulation.
3. Inspect full length of PVC piping for sags, condensate pooling, or cracks.
4. Clear blockage, verify full flow at both pipes.
5. **SAFETY-CRITICAL: A partially blocked exhaust on a sealed-combustion appliance does not always prevent ignition — it may allow brief operation with combustion products recirculating through cracked PVC joints back into the home.**
6. Inspect all PVC joints for cracks or improper cementing after any restriction event.
7. After clearing: restart, combustion analyze, verify CO at supply registers is zero.

### MANDATORY protocol
- INSPECT ALL PVC JOINTS AFTER RESTRICTION EVENT
- COMBUSTION ANALYZE AND TEST CO AT REGISTERS AFTER CLEARING
- DO NOT RESTORE SERVICE UNTIL CO AT REGISTERS READS ZERO

### Sources
- Furnace Exhaust Pipe Problems — LCS Heating and Cooling: https://lcsheatingandcooling.com/blog/furnace-exhaust-pipe
- Combustion-Safety Evaluation — wxfieldguide.com: https://wxfieldguide.com/mo/MOWxFG/HeatingCooling/Combustion-Safety_Evaluation.htm

### Mike's tone for this scenario
- "Sealed combustion with a blocked exhaust can still make CO before it trips. Clear it, inspect the joints, and run the analyzer."

---

## SCN-SAF-023 — Gas Inlet Pressure Too Low (Utility Supply Problem)
**Equipment / situation:** Multiple gas appliances at a home not performing adequately. Manifold pressure low on furnace even with valve wide open.

### Symptoms / readings / measurements
- Inlet pressure at furnace gas valve below 4.5" WC (NG) or 11" WC (LP) under firing conditions
- Other appliances (range, water heater) also performing below normal
- Utility-side problem or regulator failure suspected

### CORRECT diagnostic / response sequence
1. Measure inlet pressure at furnace gas valve inlet port.
2. For NG: normal delivery pressure is 6–8" WC at appliance, minimum 4.5" WC under load.
3. For LP: normal delivery is 11–14" WC at appliance regulator.
4. If inlet is below minimum: check other appliances simultaneously — if all are affected, problem is upstream.
5. **SAFETY-CRITICAL: Do not adjust appliance components to compensate for low supply pressure — this masks a supply fault and can cause unexpected pressure surges to appliance when supply recovers.**
6. For LP: check second-stage regulator at tank, check if tank is running low (vapor pressure drops at low temperatures with LP).
7. For NG: contact gas utility with pressure readings documented.
8. Document all readings, notify homeowner, recommend utility contact.

### MANDATORY protocol
- DO NOT ADJUST GAS VALVE OR ORIFICES TO COMPENSATE FOR LOW SUPPLY PRESSURE
- DOCUMENT INLET PRESSURE AT APPLIANCE UNDER LOAD
- CONTACT GAS UTILITY FOR NG SUPPLY PROBLEMS
- CHECK LP TANK LEVEL AND SECOND-STAGE REGULATOR FOR LP SUPPLY PROBLEMS

### Sources
- Natural Gas Pressure for Furnaces — North NJ HVAC: https://northnjhvac.com/natural-gas-pressure-furnace-proper-settings-troubleshooting/
- LP Gas Pressure for Furnaces — North NJ HVAC: https://northnjhvac.com/lp-gas-pressure-furnaces-optimal-settings-troubleshooting/

### Mike's tone for this scenario
- "Low inlet pressure is a supply problem. Document the readings and call the utility — don't adjust your way around it."

---

## SCN-SAF-024 — Slow-Opening Gas Valve (SIT or Honeywell Modulating Valve Fault)
**Equipment / situation:** Modulating gas furnace. Customer reports delayed heating or occasional mis-ignitions. Tech observes slow valve response.

### Symptoms / readings / measurements
- Delay between igniter glow and audible gas valve click
- Manifold pressure rises slowly — valve not snapping open within 1–2 seconds
- Possible light-off CO spike during extended ignition period
- Occasional failed ignition requiring retry

### CORRECT diagnostic / response sequence
1. Time gas valve opening from 24V signal to audible click and pressure rise.
2. Normal valve opening: should achieve 90%+ of manifold pressure within 2 seconds.
3. If pressure rise is sluggish: gas valve internal regulator or operator is failing.
4. Check inlet gas pressure — if marginal, slow opening could be pressure-related.
5. Check valve coil voltage — if 24V signal is marginal (below 21V at valve), coil may not fully actuate.
6. **SAFETY-CRITICAL: A slow-opening valve creates extended ignition delay, which is functionally the same as delayed ignition — accumulation risk.**
7. Replace gas valve if coil voltage is correct and inlet pressure is correct but opening is slow.

### MANDATORY protocol
- DOCUMENT VALVE OPENING TIME AND MANIFOLD PRESSURE RISE RATE
- REPLACE VALVE IF OPENING IS SLOW WITH CORRECT VOLTAGE AND PRESSURE
- DO NOT BYPASS OR DEFEAT RETRY LIMITS TO WORK AROUND SLOW VALVE

### Sources
- Gas Furnace Electrical Safety Switch Testing — AC Service Tech: https://www.acservicetech.com/post/gas-furnace-electrical-safety-switch-testing
- How to Check Gas Manifold Pressure — Same Day HVAC: https://samedaysd.com/blog/how-to-check-gas-manifold-pressure/

### Mike's tone for this scenario
- "Slow valve opening is delayed ignition waiting to happen. Time the pressure rise. Replace the valve if it's sluggish with good voltage and pressure."

---

## SCN-SAF-025 — Combustion Air Starvation in Confined Mechanical Room (Sealed Space)
**Equipment / situation:** Gas furnace and water heater sharing a small utility closet or mechanical room with no dedicated outdoor air openings. Atmospheric appliances.

### Symptoms / readings / measurements
- Appliances in closet without combustion air openings to adjacent space or outdoors
- Yellow flame, elevated CO during extended operation
- Appliances cycle off on high limit or pressure switches
- Combustion air requirement: per NFGC, for closet installation, need either two openings to adjacent conditioned space (each minimum 100 sq in free area) or direct outdoor air duct

### CORRECT diagnostic / response sequence
1. Measure BTU input of all appliances in space.
2. Verify combustion air opening area per NFGC tables (50 cubic feet per 1,000 BTUH minimum).
3. If openings are absent or undersized: appliance is installed non-compliantly.
4. **SAFETY-CRITICAL: Sealed appliance closet with atmospheric burners is a documented CO hazard. Appliances consume available O2, produce CO at rising rates.**
5. Correct by: adding correct-size louvered openings, running outdoor air duct to closet, or converting to direct-vent appliances.
6. Do NOT permanently seal a closet with atmospheric appliances inside.

### MANDATORY protocol
- DOCUMENT COMBUSTION AIR DEFICIENCY
- DO NOT LEAVE APPLIANCES IN SERVICE WITHOUT ADEQUATE COMBUSTION AIR PROVISIONS
- RECOMMEND SEALED-COMBUSTION APPLIANCES AS PERMANENT SOLUTION

### Sources
- Causes and Dangers of Inadequate Combustion Air — Any Season HVAC: https://www.anyseasonhvac.com/causes-and-dangers-of-inadequate-combustion-air-for-furnaces
- Gas Appliance in Unvented Space — PV Heating: https://www.pvhvac.com/blog/is-it-safe-to-have-a-gas-appliance-in-an-unvented-space/

### Mike's tone for this scenario
- "Closet with no combustion air and two atmospheric appliances is a code violation and a CO factory. Fix it or condemn it."

---

## SCN-SAF-026 — Flue Gas Detector Alarm During Combustion Analysis
**Equipment / situation:** Tech performing combustion analysis on gas furnace or boiler. CO analyzer alarms at high reading.

### Symptoms / readings / measurements
- Combustion analyzer: CO in flue gas above 400 ppm air-free (threshold for immediate action in residential)
- OR CO in ambient room air above 35 ppm (NIOSH TWA limit for workers)
- Appliance producing excessive CO due to incomplete combustion

### CORRECT diagnostic / response sequence
1. Immediately shut down appliance.
2. Ventilate space — open doors and windows.
3. Identify CO source: heat exchanger failure, combustion air starvation, blocked flue, LP/NG conversion error, or burner fouling.
4. Check CO in ambient room air with personal CO monitor — if above 35 ppm (NIOSH TWA), leave immediately, ventilate.
5. Check on occupants — any headache, nausea, or dizziness = call 911, evacuate.
6. Do not restore appliance until root cause is identified and corrected.
7. Re-analyze after correction — appliance is only safe to return to service when CO air-free is below 100 ppm and ambient CO is zero.

### MANDATORY protocol
- SHUT DOWN APPLIANCE IMMEDIATELY ON HIGH CO READING
- CHECK OCCUPANT STATUS — ANY SYMPTOMS = CALL 911, EVACUATE
- DO NOT RESTORE SERVICE UNTIL ROOT CAUSE IS CORRECTED AND CO AT REGISTERS IS ZERO
- NIOSH CO TWA: 35 ppm — NIOSH IDLH: 1,200 ppm

### Sources
- NIOSH CO Exposure Limits — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html
- Combustion-Safety Evaluation — wxfieldguide.com: https://wxfieldguide.com/mo/MOWxFG/HeatingCooling/Combustion-Safety_Evaluation.htm

### Mike's tone for this scenario
- "Analyzer alarms high CO — appliance goes off. Check the people in the house before you check the appliance."


---

## SCN-SAF-027 — Electronic Leak Detector Reading at Gas Appliance (Not Smell)
**Equipment / situation:** Tech uses combustible gas detector during inspection. Detector alarms but no odor is present (odorant may have adsorbed or low leak rate).

### Symptoms / readings / measurements
- Electronic combustible gas detector reading positive at appliance connection, flex connector, or valve
- No sulfur odor detectable by nose
- Small slow leak — not enough odorant reaching nose threshold

### CORRECT diagnostic / response sequence
1. **Electronic detector reading is just as actionable as an odor — treat identically.**
2. Isolate leak to specific component using detector tip in slow sweep.
3. Confirm with soap bubble test at identified joint.
4. Shut off appliance gas valve.
5. Repair leak: replace flex connector if any corrosion or age present; re-tape and retighten threaded fittings; replace union if sealing surface is damaged.
6. Soap-bubble test all disturbed joints.
7. Restore and retest with electronic detector.
8. **SAFETY-CRITICAL: Slow leaks without odorant are more dangerous than strong-odor leaks — occupants have no warning.**

### MANDATORY protocol
- TREAT ELECTRONIC DETECTOR READING AS GAS PRESENT — SAME PROTOCOL AS SCN-SAF-001
- CONFIRM LEAK LOCATION WITH SOAP BUBBLE BEFORE REPAIR
- SOAP-BUBBLE TEST ALL JOINTS AFTER REPAIR

### Sources
- Gas Leak Safety — Halton Gas: https://www.haltongas.com/post/gas-leak-safety-for-homeowners-how-to-identify-and-fix-issues
- How to Prevent Gas Leaks — Wolff Heating and Cooling: https://www.wolffheatingcooling.com/the-ultimate-guide-to-gas-line-maintenance-and-inspection-importance/

### Mike's tone for this scenario
- "No smell doesn't mean no leak. If the detector says it's there, treat it as a leak. Slow leaks with no odor are the ones that kill."

---

## SCN-SAF-028 — Blocked Flue Termination (Bird Nest, Ice, Debris)
**Equipment / situation:** Any gas appliance with atmospheric or induced-draft venting. Customer complains unit won't stay running or CO alarm triggered.

### Symptoms / readings / measurements
- Fault code for pressure switch / draft failure
- Visual inspection of flue termination: physical blockage present
- CO readings elevated at supply registers before shutdown
- Unit may have been running partially with CO reaching living space

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Before diagnosing controls — measure CO at supply registers. If elevated, evacuate occupants before proceeding.**
2. Shut down appliance.
3. Inspect flue termination — remove blockage (bird nest, ice, wasp nest, debris).
4. Run flue brush through entire flue length to verify no secondary blockage.
5. Inspect heat exchanger — repeated operation with blocked flue can cause cracking or CO contamination.
6. Verify draft after clearing: chemical smoke test or digital manometer at draft hood.
7. Re-fire, combustion analyze, verify CO zero at registers.
8. Recommend bird screen at termination to prevent recurrence (must be proper mesh size to prevent ice blockage in cold climates).

### MANDATORY protocol
- MEASURE CO AT REGISTERS BEFORE CONTINUING IF UNIT HAS BEEN RUNNING WITH BLOCKED FLUE
- EVACUATE OCCUPANTS IF CO ABOVE BACKGROUND AT REGISTERS
- INSPECT HEAT EXCHANGER AFTER EXTENDED OPERATION WITH BLOCKED FLUE

### Sources
- Backdrafting and Spillage — HVAC Insider: https://hvacinsider.com/backdrafting-and-spillage/
- Furnace Exhaust Pipe Problems — LCS Heating and Cooling: https://lcsheatingandcooling.com/blog/furnace-exhaust-pipe

### Mike's tone for this scenario
- "Blocked flue that the unit was still running on — check the CO first. That house may already have high levels."

---

## SCN-SAF-029 — Attached Garage CO Source: Hidden Risk
**Equipment / situation:** CO alarm activation in living space. No obvious HVAC fault found on furnace inspection. Attached garage suspected source.

### Symptoms / readings / measurements
- CO alarm in living space adjacent to attached garage
- HVAC system combustion analysis normal
- Occupants report alarm occurs at specific times (morning, after car idles in garage)
- CO measurements highest near garage door or door leading to garage

### CORRECT diagnostic / response sequence
1. Identify all potential CO sources: furnace, water heater, generator, and any combustion appliances in garage or adjacent to living space.
2. Check weather-stripping and door seals between garage and living space — CO infiltration from car idling is a well-documented cause.
3. Check for exhaust from car running in garage transferring through air handler return located in garage or utility room adjacent to garage.
4. If return duct has any portion in the garage or garage-adjacent space: air handler can draw garage air (including vehicle exhaust) directly into distribution.
5. **SAFETY-CRITICAL: Return air duct drawing from garage is a code violation (IRC M1602.2) and a CO hazard. Seal or relocate affected return immediately.**
6. Advise homeowner: never idle vehicle in attached garage even with door open.

### MANDATORY protocol
- CHECK ALL CO SOURCES — NOT JUST HVAC APPLIANCES
- INSPECT RETURN AIR PATH FOR GARAGE AIR INFILTRATION
- SEAL ANY RETURN DUCT OPENING IN GARAGE SPACE IMMEDIATELY — CODE VIOLATION AND CO HAZARD
- ADVISE HOMEOWNER IN WRITING ON GARAGE VEHICLE IDLING RISK

### Sources
- Carbon Monoxide: Backdrafting and Spillage — HVAC Insider: https://hvacinsider.com/backdrafting-and-spillage/
- NIOSH CO Pocket Guide — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html

### Mike's tone for this scenario
- "CO alarm with clean furnace — look at the garage. A return duct pulling from the garage is a silent CO pipe into the house."

---

## SCN-SAF-030 — Generator Running Near Appliance Air Intake
**Equipment / situation:** Power outage, homeowner runs portable generator. CO alarm activates. Tech called after outage resolves.

### Symptoms / readings / measurements
- CO alarm activated during or after generator use
- Generator was running near HVAC intake or open window/door
- No HVAC fault found — CO source was generator exhaust entrainment into structure

### CORRECT diagnostic / response sequence
1. Verify generator is off and fully clear of structure before entering.
2. Ventilate structure thoroughly — open all windows and doors.
3. Measure CO at multiple rooms with calibrated monitor before occupants re-enter.
4. Inspect HVAC direct-vent intake termination location — determine if generator exhaust could reach intake.
5. **SAFETY-CRITICAL: Generator exhaust CO concentrations can be lethal within minutes. Do not re-enter until CO reads zero throughout structure.**
6. Advise homeowner in writing: generator must operate minimum 20 feet from any structure opening, on downwind side, never in garage, basement, or enclosed porch.

### MANDATORY protocol
- DO NOT RE-ENTER STRUCTURE UNTIL CO READS ZERO AT EVERY ROOM
- GENERATOR MINIMUM DISTANCE: 20 FEET FROM ANY OPENING PER CPSC GUIDANCE
- DOCUMENT CO READINGS AND ADVISE HOMEOWNER IN WRITING

### Sources
- NIOSH CO Exposure Limits — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html
- Hidden CO Sources — Various public safety guidance

### Mike's tone for this scenario
- "Generator CO poisoning is a leading cause of CO deaths in the U.S. Zero CO before anyone walks in. Tell the homeowner in writing: 20 feet minimum, downwind, never in the garage."

---

## SCN-SAF-031 — Fireplace or Woodstove as Hidden CO Source
**Equipment / situation:** CO alarm activates. Tech inspects HVAC, finds it clean. Fireplace or woodstove is in same home.

### Symptoms / readings / measurements
- CO measured near fireplace, wood insert, or pellet stove
- HVAC combustion analysis normal
- CO alarm activation correlated with fireplace use
- Possible backdrafting at fireplace due to tight home or competing exhaust fans

### CORRECT diagnostic / response sequence
1. Expand investigation beyond HVAC — inspect all combustion appliances.
2. Inspect fireplace/wood stove flue for blockage (debris, creosote buildup, damaged liner).
3. Perform draft test at fireplace opening — chemical smoke or lighter.
4. Check if fireplace and HVAC share the same chase — competing draft conditions can cause CO spillage from fireplace into HVAC.
5. **SAFETY-CRITICAL: Corrosive creosote buildup is both a fire hazard and a CO source if blocking draft. Recommend professional chimney inspection if in doubt.**
6. Advise homeowner that tight homes can cause fireplace backdrafting even when unit appears functional.

### MANDATORY protocol
- INVESTIGATE ALL COMBUSTION APPLIANCES — NOT ONLY HVAC
- IF FIREPLACE FLUE BLOCKED OR DAMAGED: DO NOT USE UNTIL INSPECTED AND CLEARED BY CHIMNEY PROFESSIONAL
- DOCUMENT CO READINGS AT FIREPLACE AREA

### Sources
- Carbon Monoxide: Backdrafting — HVAC Insider: https://hvacinsider.com/backdrafting-and-spillage/

### Mike's tone for this scenario
- "CO alarm and clean HVAC — check the fireplace. Tight homes backdraft fireplaces constantly and nobody notices until the alarm goes off."

---

## SCN-SAF-032 — Propane Regulator Lock-Up in Cold Weather
**Equipment / situation:** LP-fired furnace in cold weather. Customer reports furnace not heating. Gas pressure dramatically low or zero at appliance.

### Symptoms / readings / measurements
- LP tank level adequate (not empty)
- Inlet gas pressure at appliance near zero despite adequate tank
- Temperature below 20°F (-7°C)
- First-stage regulator at tank possibly frozen or in lock-up condition

### CORRECT diagnostic / response sequence
1. Measure inlet pressure at appliance gas valve — below 5" WC indicates supply problem.
2. Check LP tank level — if low (below 20%), vapor pressure drops significantly in cold weather.
3. Inspect first-stage regulator at tank for ice or frost — regulator lock-up can occur when moisture in supply gas freezes in regulator vent.
4. If regulator is frosted over: do NOT apply open flame to thaw. Use warm (not hot) water or wait for temperature to rise.
5. **SAFETY-CRITICAL: Do not attempt to bypass or adjust the regulator — this device is factory-set and field adjustments are not permitted.**
6. If regulator is failed: replace with correct regulator for the application.
7. Advise homeowner to maintain LP tank above 30% during cold season to prevent vapor pressure issues.

### MANDATORY protocol
- DO NOT APPLY OPEN FLAME TO FROZEN REGULATOR
- DO NOT BYPASS OR FIELD-ADJUST FIRST-STAGE LP REGULATOR
- IF REGULATOR FAILED: REPLACE WITH CORRECT SPECIFICATION UNIT

### Sources
- What to Know About Propane Regulator Lock-Up — LP Gas Magazine: https://www.lpgasmagazine.com/what-to-know-about-propane-regulator-lock-up/
- LP Gas Pressure for Furnaces — North NJ HVAC: https://northnjhvac.com/lp-gas-pressure-furnaces-optimal-settings-troubleshooting/

### Mike's tone for this scenario
- "Frozen LP regulator — warm water, not a torch. Never bypass it. Replacing a regulator is a ten-minute job. Bypassing one is a bomb."

---

## SCN-SAF-033 — Incomplete Combustion at Low Fire (Two-Stage Furnace)
**Equipment / situation:** Two-stage or modulating gas furnace. Combustion analysis normal at high fire but elevated CO at low fire.

### Symptoms / readings / measurements
- CO air-free normal at high fire (100 ppm or below)
- CO air-free elevated at low fire (200–600 ppm)
- Manifold pressure at low stage too low for proper flame stability
- Flame lifts off burner or yellow-tips at low fire setting

### CORRECT diagnostic / response sequence
1. Combustion analyze at both stages — document both sets of readings.
2. Measure manifold pressure at each stage. Low-fire manifold pressure is factory-set (often around 1.5–2.5" WC for NG on two-stage valves).
3. Check gas valve low-fire regulator adjustment per manufacturer specification.
4. **Caution: Low-fire adjustment range is narrow — small changes make large flame appearance differences.**
5. If low-fire pressure is within spec but CO is still elevated: inspect primary air adjustment for low-fire operation.
6. **SAFETY-CRITICAL: Elevated CO at low fire is insidious — occupants may not connect symptoms to intermittent low-stage operation at night.**
7. Correct and re-analyze both stages before leaving.

### MANDATORY protocol
- COMBUSTION ANALYZE AT BOTH STAGES — HIGH AND LOW FIRE
- DOCUMENT MANIFOLD PRESSURE AT BOTH STAGES
- DO NOT LEAVE ELEVATED LOW-FIRE CO UNRESOLVED

### Sources
- What Should Gas Furnace Pressure Be — AC Direct: https://www.acdirect.com/blog/what-should-a-gas-furnace-pressure-be-when-running/
- Voyager 2 Staged Gas Manifold Pressure — Trane Support: https://support.trane.com/hc/en-us/articles/4423754375181-Voyager-2-Staged-Gas-Manifold-Pressure

### Mike's tone for this scenario
- "Analyze both stages on a two-stage furnace. Low-fire CO that looks fine at high fire is still going into the house all night."

---

## SCN-SAF-034 — Overfired Furnace: Manifold Pressure Too High
**Equipment / situation:** Gas furnace recently serviced or converted. Tech finds manifold pressure significantly above specification.

### Symptoms / readings / measurements
- Manifold pressure above 4.5" WC for NG (spec ~3.5" WC) or above 11.5" WC for LP
- High limit trips during heating cycle
- Yellow flame with sooting
- Combustion analysis: CO elevated, O2 low

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Overfired furnace = rich combustion = CO production = overheating = heat exchanger damage. Shut down for adjustment.**
2. Verify inlet pressure is within spec (not spiking high).
3. Adjust gas valve regulator to correct manifold pressure — do not exceed manufacturer specification.
4. After adjustment: combustion analyze. Confirm CO air-free below 100 ppm, O2 3–6%.
5. Run full heating cycle and verify high limit does not trip.
6. Document pre-and-post manifold pressure on work order.
7. Inspect heat exchanger if unit has been running overfired for extended period.

### MANDATORY protocol
- ADJUST MANIFOLD PRESSURE TO MANUFACTURER SPEC BEFORE RESTORING SERVICE
- COMBUSTION ANALYZE AFTER ADJUSTMENT
- IF HIGH LIMIT HAS BEEN CYCLING: INSPECT HEAT EXCHANGER

### Sources
- What Should Gas Furnace Pressure Be — AC Direct: https://www.acdirect.com/blog/what-should-a-gas-furnace-pressure-be-when-running/
- Gas Burner Soot Diagnosis — InspectApedia: https://inspectapedia.com/plumbing/Gas-Burner-Sooting-Diagnosis.php

### Mike's tone for this scenario
- "Running hot with high CO is an overfired furnace. Adjust the manifold, analyze, and check the heat exchanger if it's been this way for a while."

---

## SCN-SAF-035 — York Affinity Error Code 5-Flash: Rollout Open (Expanded Safety)
**Equipment / situation:** York Affinity YP9C. 5-flash fault code. See SCN-SAF-016 for heat exchanger focus. This scenario focuses on the rollout-open safety sequence.

### Symptoms / readings / measurements
- 5-flash fault: rollout limit switch open
- Unit locked out, will not restart
- Possible scorch marks visible on burner box exterior

### CORRECT diagnostic / response sequence
1. Do NOT reset and run to test — this is the lockout preventing further unsafe operation.
2. Shut off gas at appliance valve.
3. Inspect for scorch marks, melted wiring, or soot outside burner compartment.
4. Visually inspect for obvious blockage at inducer inlet or flue.
5. Use borescope to inspect heat exchanger cells.
6. Inspect burner alignment — misaligned burners can direct flame toward rollout switch.
7. Check for blocked secondary heat exchanger — inducer back-pressure forces flame rollout.
8. Correct root cause. Reset rollout switch only after root cause is confirmed corrected.
9. Combustion analyze after restart. Verify CO zero at registers.

### MANDATORY protocol
- NEVER RESET ROLLOUT WITHOUT IDENTIFYING ROOT CAUSE
- SHUT GAS OFF BEFORE INSPECTING
- COMBUSTION ANALYZE AFTER RESTART

### Sources
- York Affinity YP9C Technical Guide — HVAC Navigator: https://files.hvacnavigator.com/p/538513-ytg-f-1016.pdf
- Furnace Flame Rollout Limit Switch — North NJ HVAC: https://northnjhvac.com/furnace-flame-rollout-limit-switch-causes-diagnosis-repair/

### Mike's tone for this scenario
- "Five flashes is not a reset-and-run situation. It's a reason to slow down and look at what caused the rollout."

---

## SCN-SAF-036 — Carbon Monoxide at Register: Trace CO During Annual Maintenance
**Equipment / situation:** Tech performing annual HVAC maintenance. Personal CO monitor reads 5–15 ppm at supply register during furnace operation. No CO alarm in home. No occupant symptoms.

### Symptoms / readings / measurements
- Personal CO monitor: 5–15 ppm at supply register (ambient background in outdoor air is typically 0–1 ppm)
- Any measurable CO at supply register is abnormal
- Combustion analysis: CO in flue may be borderline but not alarmingly high

### CORRECT diagnostic / response sequence
1. **Any CO at supply register is not "trace" — it means combustion gases are entering the air distribution side. This is a heat exchanger problem until proven otherwise.**
2. Perform thorough heat exchanger inspection: flame flutter test, borescope, combustion dye if needed.
3. If heat exchanger is intact: check for recirculation at flue connection, improper flue joint, or negative pressure in air distribution pulling from combustion side.
4. **SAFETY-CRITICAL: Even 5–10 ppm CO at registers over extended furnace operation in a tight home can cause chronic CO exposure in occupants. Do not dismiss trace CO.**
5. If crack confirmed: SCN-SAF-010 condemnation protocol.
6. If no crack found: document findings, notify homeowner in writing, recommend further evaluation.

### MANDATORY protocol
- ANY CO AT SUPPLY REGISTER IS ACTIONABLE — INSPECT HEAT EXCHANGER
- NOTIFY HOMEOWNER IN WRITING OF CO FINDING AND INSPECTION RESULT
- IF CRACK CONFIRMED: CONDEMN PER SCN-SAF-010

### Sources
- Heat Exchanger Crack Diagnosis — HVAC School: https://hvacrschool.com/heat-exchanger-crack-diagnosis/
- NIOSH CO TWA 35 ppm — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html

### Mike's tone for this scenario
- "Five ppm at the register is not background — it's combustion gas in the air supply. Inspect the heat exchanger. Document it. Tell the homeowner."

---

## SCN-SAF-037 — Bubble Test Confirms Leak at Flare Fitting on Gas Piping
**Equipment / situation:** Tech completes new appliance installation or reconnects appliance after service. Bubble test reveals leak at flare fitting.

### Symptoms / readings / measurements
- Soap bubbles forming at flare fitting on gas supply line
- No electronic detector alarm yet (leak rate may be low)
- Fitting appears hand-tight but was not torqued properly

### CORRECT diagnostic / response sequence
1. Shut gas off at appliance valve before attempting correction.
2. Inspect flare for proper formation — mis-flared (oval, cracked, or torn) connections cannot be made leak-free by tightening.
3. If flare is defective: cut and re-flare the tubing — do not try to squeeze a bad flare tight.
4. If flare is correct but leaking: tighten flare nut per manufacturer torque spec (do not over-torque — brass flares can crack).
5. Re-bubble test after tightening.
6. **SAFETY-CRITICAL: Never leave a bubble-positive fitting in service. Gas leaks at flare fittings can grow over time, especially with thermal cycling.**
7. Document leak location and repair on work order.

### MANDATORY protocol
- SHUT GAS OFF BEFORE CORRECTING ANY LEAKING FITTING
- RE-FLARE IF FLARE FORMATION IS DEFECTIVE — NO AMOUNT OF TIGHTENING FIXES A BAD FLARE
- BUBBLE TEST EVERY FITTING AFTER COMPLETION
- DOCUMENT FINDINGS ON WORK ORDER

### Sources
- Gas Leak Safety — Halton Gas: https://www.haltongas.com/post/gas-leak-safety-for-homeowners-how-to-identify-and-fix-issues

### Mike's tone for this scenario
- "Bad flare doesn't get fixed by tightening. Cut it and re-flare. A leaky gas fitting on a new install is on you if you left it."

---

## SCN-SAF-038 — Atmospheric Burner: Incorrect Primary Air (Spud Adjustment)
**Equipment / situation:** Older atmospheric gas furnace with adjustable primary air shutters. Flame yellow-tipping or lifting off.

### Symptoms / readings / measurements
- Yellow tips or orange flame: too little primary air (rich)
- Flame lifting off burners (noisy, unstable): too much primary air (lean)
- CO elevated in rich condition, possible flame-out and gas accumulation in lean condition

### CORRECT diagnostic / response sequence
1. With burner firing, observe flame character.
2. Yellow tips: open primary air shutter incrementally — flame should transition to predominantly blue with minor yellow inner cone.
3. Flame lifting (noisy): close air shutter slightly.
4. Target: stable blue flame with defined inner cone, no lifting, no persistent yellow.
5. After visual adjustment: combustion analyze to confirm CO below 100 ppm air-free, O2 3–6%.
6. **SAFETY-CRITICAL: Flame lift-off allows unburned gas to accumulate — do not leave appliance running with lifting flame.**
7. Secure air shutter in correct position after adjustment.

### MANDATORY protocol
- COMBUSTION ANALYZE AFTER ADJUSTING AIR SHUTTERS — VISUAL ASSESSMENT IS NOT SUFFICIENT
- IF FLAME LIFTS OFF: SHUT DOWN UNTIL CORRECTED
- DOCUMENT FINAL COMBUSTION ANALYSIS READINGS

### Sources
- Gas Burner Soot Diagnosis — InspectApedia: https://inspectapedia.com/plumbing/Gas-Burner-Sooting-Diagnosis.php
- Combustion Air for Furnaces — Any Season HVAC: https://www.anyseasonhvac.com/causes-and-dangers-of-inadequate-combustion-air-for-furnaces

### Mike's tone for this scenario
- "Adjust by eye, then confirm by analyzer. Yellow tip or lift-off — both need fixing before you leave."

---

## SCN-SAF-039 — Gas Piping Pressure Test After New Install or Repair
**Equipment / situation:** Any gas piping work completed — new install, addition of appliance, or repair of leak.

### Symptoms / readings / measurements
- Piping must be pressure-tested before any appliance is connected or gas is restored
- Standard test per NFGC: 1.5 times working pressure minimum for low-pressure systems (<0.5 psig), hold for minimum 10 minutes

### CORRECT diagnostic / response sequence
1. Cap or isolate all open ends and appliance connections.
2. Pressurize system with nitrogen or dry air — do NOT use gas for pressure testing.
3. For low-pressure systems: test at 3 psig minimum per NFGC (some jurisdictions require higher).
4. Verify pressure with a calibrated gauge or manometer — hold for 10 minutes minimum.
5. If pressure drops: locate leak with detector or bubble solution, repair, and retest.
6. Only restore gas and connect appliances after system holds test pressure.
7. **SAFETY-CRITICAL: Never pressure-test gas piping with gas. An undetected joint failure during a gas pressure test is an explosion risk.**

### MANDATORY protocol
- PRESSURE TEST WITH NITROGEN OR DRY AIR — NEVER WITH GAS
- HOLD TEST PRESSURE FOR MINIMUM 10 MINUTES
- LEAK TEST ALL JOINTS WITH BUBBLE SOLUTION OR ELECTRONIC DETECTOR AFTER GAS IS RESTORED
- DOCUMENT TEST PRESSURE, DURATION, AND PASS/FAIL ON WORK ORDER

### Sources
- Natural Gas Emergency Procedures — University of Colorado: https://www.colorado.edu/firelifesafety/sites/default/files/attached-files/campus_naturalgasprocedures.pdf

### Mike's tone for this scenario
- "Pressure test with nitrogen. Hold it for ten minutes. Document the result. Gas-pressure-testing gas pipe is not how we do it."

---

## SCN-SAF-040 — Gas Utility Pressure Surge After Extended Outage
**Equipment / situation:** Gas service was interrupted (utility work, emergency shutoff). Gas is restored. Tech called to restart appliances.

### Symptoms / readings / measurements
- All gas appliances have been off — pilot lights out, valves closed
- Pressure spike possible on restoration
- Possible debris in gas line from work upstream

### CORRECT diagnostic / response sequence
1. Before lighting any appliance: purge supply line per utility procedure.
2. Open a sediment trap or union briefly to verify gas is flowing cleanly (no debris, discoloration).
3. Verify inlet pressure at each appliance with manometer — confirm within spec.
4. **SAFETY-CRITICAL: After extended service interruption, re-inspect all flex connectors and appliance connections — vibration from pressure surge can loosen fittings.**
5. Bubble test all connections before lighting.
6. Relight appliances per manufacturer procedure — do not attempt to light without verifying gas pressure is stable and correct.
7. Combustion analyze first appliance after lighting.

### MANDATORY protocol
- BUBBLE TEST ALL CONNECTIONS BEFORE RELIGHTING AFTER OUTAGE
- VERIFY INLET PRESSURE IS WITHIN SPEC BEFORE LIGHTING
- DO NOT ASSUME PRIOR REPAIR IS STILL INTACT AFTER PRESSURE SURGE

### Sources
- Gas Leak Response Procedure — EMC Insurance: https://emcinsurance.com/losscontrol/techsheet/gas-leak-response-procedure

### Mike's tone for this scenario
- "Pressure comes back after an outage — check every fitting before you light. Surges loosen joints."

---

## SCN-SAF-041 — Cracked Heat Exchanger: Diagnosis via Combustion Dye Test
**Equipment / situation:** Suspected heat exchanger crack but borescope inspection inconclusive. Using combustion dye test as secondary confirmation.

### Symptoms / readings / measurements
- Trace CO at supply register
- Flame flutter test positive but crack not visually located by borescope
- Tech using UV combustion dye tracer to confirm crack location

### CORRECT diagnostic / response sequence
1. Shut appliance off and allow to cool.
2. Introduce combustion dye tracer into burner side of heat exchanger per kit instructions.
3. Seal burner openings and allow dye to circulate — or use positive pressure introduction per kit method.
4. Move to air distribution side — run blower only (no heat) with UV lamp.
5. UV-visible dye at supply air side confirms combustion product crossover through heat exchanger.
6. Document location of dye appearance — photograph.
7. **SAFETY-CRITICAL: Positive dye test = confirmed combustion gas crossover = condemnation required per SCN-SAF-010. No debate.**
8. Tag unit, shut gas and power, notify homeowner in writing.

### MANDATORY protocol
- POSITIVE DYE TEST = CRACK CONFIRMED = SCN-SAF-010 CONDEMNATION PROTOCOL
- PHOTOGRAPH AND DOCUMENT DYE TEST RESULT
- NOTIFY HOMEOWNER IN WRITING

### Sources
- Heat Exchanger Crack Diagnosis — HVAC School: https://hvacrschool.com/heat-exchanger-crack-diagnosis/
- Cracked Heat Exchangers — EMCO Cooling: https://emcocooling.com/how-to-detect-and-service-a-cracked-heat-exchanger/

### Mike's tone for this scenario
- "Positive dye test is positive dye test. That's combustion gas in the supply air. You tag it and you tell the homeowner."

---

## SCN-SAF-042 — Gas Valve Replacement: Proper Procedure
**Equipment / situation:** Gas valve confirmed failed and requires replacement. Tech proceeding with valve replacement.

### Symptoms / readings / measurements
- Failed valve confirmed (stuck, shorted coil, leaking through)
- Replacement valve obtained (must be exact manufacturer part or approved equivalent — never substitute valve from a different fuel or pressure rating)

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Shut gas off at appliance shutoff valve before any disassembly.**
2. Verify gas is off with combustible gas detector at valve location.
3. Shut off electrical power to appliance at service disconnect.
4. Remove gas valve — have appropriate pipe wrenches, back-up wrench to prevent pipe twisting.
5. Install new valve with correct thread sealant (gas-rated pipe compound or yellow PTFE tape) on NPT threads — not on flare threads.
6. Do not apply sealant to the first two threads to prevent sealant from entering gas stream.
7. Verify new valve is correct: same BTU rating, same inlet/outlet configuration, same fuel type.
8. Restore gas and bubble test all connections.
9. Restore power and verify ignition sequence is correct.
10. Set manifold pressure to spec. Combustion analyze.

### MANDATORY protocol
- SHUT GAS AND POWER BEFORE DISASSEMBLY
- USE BACK-UP WRENCH TO PREVENT PIPE STRESS
- BUBBLE TEST ALL CONNECTIONS AFTER INSTALLATION
- VERIFY MANIFOLD PRESSURE AND COMBUSTION ANALYZE AFTER REPLACEMENT

### Sources
- Gas Furnace Safety — AC Service Tech: https://www.acservicetech.com/post/gas-furnace-electrical-safety-switch-testing
- How to Check Gas Manifold Pressure — Same Day HVAC: https://samedaysd.com/blog/how-to-check-gas-manifold-pressure/

### Mike's tone for this scenario
- "Gas valve swap — gas off, power off, back-up wrench, bubble test every fitting. This is a known sequence. Don't skip steps."


---
# SECTION B: CARBON MONOXIDE SCENARIOS
---

## SCN-SAF-043 — CO Alarm Activated: Residential, Occupants Present
**Equipment / situation:** Tech called after CO alarm activation. Occupants still in home.

### Symptoms / readings / measurements
- CO alarm sounding (residential UL 2034 alarm: activates at 70 ppm for 60–240 minutes, 150 ppm for 10–50 minutes, or 400 ppm for 4–15 minutes)
- Occupants may or may not have symptoms
- Source unknown

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Before entering, confirm no active symptoms in occupants — if symptoms present (headache, nausea, confusion, dizziness), call 911 immediately. Do not delay.**
2. Instruct occupants to evacuate to fresh air while you investigate.
3. Enter with personal CO monitor running — note CO reading at front door.
4. Identify all combustion appliances: furnace, water heater, range, fireplace, any attached garage sources.
5. Measure CO at each appliance and at multiple room locations.
6. Identify source: highest CO reading identifies zone — trace to specific appliance.
7. Shut down CO-producing appliance.
8. Do not reset CO alarm until CO reads zero throughout home.
9. Identify and correct root cause before restoring appliance.
10. If source cannot be identified: call gas utility and recommend professional CO investigation before reoccupying.

### MANDATORY protocol
- IF OCCUPANT SYMPTOMS PRESENT: CALL 911 FIRST — DIAGNOSIS SECOND
- EVACUATE OCCUPANTS BEFORE ENTERING YOURSELF
- DO NOT RESET CO ALARM UNTIL CO READS ZERO THROUGHOUT HOME
- DO NOT RESTORE APPLIANCE UNTIL ROOT CAUSE IS CORRECTED

### Sources
- Model CO Alarm Response Policy — MTAS Tennessee: https://www.mtas.tennessee.edu/knowledgebase/model-carbon-monoxide-co-alarm-response-policy
- NIOSH CO Pocket Guide — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html

### Mike's tone for this scenario
- "People with symptoms come first. Get them out, call 911, then diagnose. Nothing else matters until the people are safe."

---

## SCN-SAF-044 — Symptomatic Occupants: Headache and Nausea During Heating Season
**Equipment / situation:** Customer calls saying family members have headaches that improve when they leave the house. Tech suspects CO.

### Symptoms / readings / measurements
- Occupant reports: headache, nausea, fatigue, flu-like symptoms that improve when away from home
- Classic sub-acute CO exposure presentation
- CO alarm may not have activated (may be absent, or CO levels below alarm threshold)
- Pets may be lethargic

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: These are classic sub-chronic CO poisoning symptoms. Treat as CO emergency until proven otherwise.**
2. **If symptoms are currently present and severe (confusion, loss of consciousness): call 911 immediately.**
3. Recommend occupants go outside immediately while you investigate.
4. Measure CO at multiple rooms with calibrated monitor.
5. Inspect all combustion appliances — furnace, water heater, range, fireplace.
6. At sub-acutely dangerous levels (9–70 ppm sustained), CO alarm may not have triggered.
7. **NIOSH residential guidance: indoor CO above 9 ppm (8-hour average) requires investigation; ASHRAE similarly recommends 9 ppm as indoor residential maximum.**
8. Identify source, shut it down, document.
9. Recommend physician evaluation for all occupants — CO causes lasting neurological damage even at sub-alarm levels.

### MANDATORY protocol
- RECOMMEND PHYSICIAN EVALUATION FOR ALL OCCUPANTS ON ANY CO FINDING
- DO NOT RESTORE CO SOURCE UNTIL CORRECTED
- IF SYMPTOMS ARE SEVERE: CALL 911 — DO NOT DELAY FOR DIAGNOSIS
- NIOSH TWA: 35 ppm occupational | ASHRAE/EPA residential recommendation: ≤9 ppm (8-hr average)

### Sources
- NIOSH CO Pocket Guide — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html
- Carbon Monoxide Levels Chart — CO2 Meter: https://www.co2meter.com/blogs/news/carbon-monoxide-levels-chart

### Mike's tone for this scenario
- "Headaches that go away when they leave the house in heating season is CO until proven otherwise. Get them outside. Call 911 if anyone is confused or can't walk straight."

---

## SCN-SAF-045 — CO Measured at Supply Register: Levels and Thresholds
**Equipment / situation:** Tech finds CO at supply register during operation. Determining severity and response based on reading.

### Symptoms / readings / measurements
- Residential supply register CO measurement categories:
  - 0–1 ppm: normal (outdoor background)
  - 2–9 ppm: elevated, investigate source
  - 10–35 ppm: significant — occupant notification required, source must be corrected before continued operation
  - 35+ ppm: NIOSH occupational TWA exceeded — shut down source, ventilate
  - 70+ ppm: UL residential CO alarm will eventually activate — immediate shutdown, evacuate
  - 200+ ppm: NIOSH ceiling limit — life-threatening with extended exposure, immediate evacuation

### CORRECT diagnostic / response sequence
1. Record CO reading at register(s) — document unit, register location, time, appliance operating conditions.
2. Apply threshold framework above to determine urgency of response.
3. Any reading above 0–1 ppm: identify and address source.
4. Readings 10–35 ppm: shut down source, inspect heat exchanger and venting before restoring.
5. Readings 35+ ppm: shut down source, ventilate, notify homeowner — occupants should not remain in home until resolved.
6. **SAFETY-CRITICAL: There is no "acceptable" CO at a supply register — any reading indicates combustion product contamination of supply air.**

### MANDATORY protocol
- ANY READING ABOVE BACKGROUND (0–1 PPM) AT REGISTER = INVESTIGATE HEAT EXCHANGER AND VENTING
- READINGS 35+ PPM: SHUT DOWN SOURCE, EVACUATE UNTIL RESOLVED
- READINGS 200+ PPM: IMMEDIATE EVACUATION, CALL 911

### Sources
- NIOSH CO TWA 35 ppm / Ceiling 200 ppm / IDLH 1,200 ppm — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html
- Carbon Monoxide Levels Chart — CO2 Meter: https://www.co2meter.com/blogs/news/carbon-monoxide-levels-chart
- Carbon Monoxide Safety Standards — US Tech Reps: https://ustechreps.com/article/Workplace_CO_Safety_Standards.pdf

### Mike's tone for this scenario
- "Any CO at the register is a heat exchanger investigation. There is no safe level of combustion gas in the supply air."

---

## SCN-SAF-046 — CO Measured in Flue Gas: Acceptable vs. Actionable Thresholds
**Equipment / situation:** Tech performing combustion analysis. Interpreting CO readings in undiluted flue gas.

### Symptoms / readings / measurements
- Combustion analyzer reading CO in undiluted flue gas
- Acceptable thresholds (air-free):
  - Below 100 ppm air-free: excellent combustion
  - 100–400 ppm air-free: acceptable range for older equipment, investigate further
  - 400 ppm air-free: BPI/ANSI threshold for immediate action on residential heating appliances
  - Above 400 ppm air-free: appliance must be shut down and serviced before return to operation

### CORRECT diagnostic / response sequence
1. Verify analyzer is measuring undiluted flue gas (probe tip in flue stream, not at draft hood where dilution air mixes).
2. Record CO (ppm), CO air-free (calculated), O2 (%), stack temperature, efficiency.
3. Apply threshold framework.
4. CO air-free below 100 ppm: document and pass.
5. CO air-free 100–400 ppm: document, inspect and clean burners, re-analyze.
6. CO air-free above 400 ppm: **shut appliance down**. Do not return to service without identifying and correcting cause.
7. **SAFETY-CRITICAL: High CO in flue does not always mean high CO at registers — but it CAN mean high CO at registers if heat exchanger has any crossover point.**

### MANDATORY protocol
- CO AIR-FREE ABOVE 400 PPM: SHUT DOWN APPLIANCE
- IDENTIFY AND CORRECT CAUSE BEFORE RESTORING SERVICE
- DOCUMENT AS-FOUND AND POST-CORRECTION READINGS ON WORK ORDER

### Sources
- Combustion-Safety Evaluation — wxfieldguide.com: https://wxfieldguide.com/mo/MOWxFG/HeatingCooling/Combustion-Safety_Evaluation.htm
- Carbon Monoxide: Draft Pressure Tests — HVAC Insider: https://hvacinsider.com/carbon-monoxide-4-draft-pressure-tests/

### Mike's tone for this scenario
- "Four hundred ppm air-free is the line. Above that, the appliance comes off until you fix what's wrong."

---

## SCN-SAF-047 — CO Above Appliance (Ambient Reading During Diagnostic)
**Equipment / situation:** Tech measuring CO in room above a furnace or water heater that is operating. Reading is elevated in the mechanical room, not just at the appliance.

### Symptoms / readings / measurements
- Personal CO monitor reads 10–50+ ppm in mechanical room ambient air
- Appliance is operating
- Elevated ambient CO = spillage from draft hood, flue connection, or cracked exchanger

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Ambient CO above 35 ppm in the space you are working in is above NIOSH TWA — ventilate and consider fresh air supply before continuing work.**
2. Identify spillage location: trace highest CO reading to source.
3. Check draft hood for spillage using chemical smoke.
4. Check all flue pipe joints for gaps or improper connections.
5. Check heat exchanger — ambient CO above appliance with furnace running is a strong indicator of heat exchanger crossover.
6. Shut appliance down, investigate root cause, correct, verify CO zero before leaving.
7. Notify homeowner — ambient CO above appliance means occupants have been exposed during normal heating operation.

### MANDATORY protocol
- AMBIENT CO ABOVE 35 PPM IN WORK SPACE: VENTILATE BEFORE CONTINUING
- AMBIENT CO ABOVE APPLIANCE IS HEAT EXCHANGER FINDING UNTIL PROVEN OTHERWISE
- NOTIFY HOMEOWNER OF EXPOSURE RISK IN WRITING

### Sources
- NIOSH CO TWA/IDLH — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html
- Combustion-Safety Evaluation — wxfieldguide.com: https://wxfieldguide.com/mo/MOWxFG/HeatingCooling/Combustion-Safety_Evaluation.htm

### Mike's tone for this scenario
- "Your monitor hits 35 in the mechanical room — you ventilate before you keep working. That's your personal safety."

---

## SCN-SAF-048 — CO from Refrigerator-Style Appliances (Propane Fridge)
**Equipment / situation:** Off-grid home or RV with propane-fired absorption refrigerator. CO complaint or CO alarm activation.

### Symptoms / readings / measurements
- CO alarm activation or symptoms correlating to refrigerator operation
- Propane absorption refrigerator in enclosed space (cabin, RV, pantry)
- Yellow burner flame on refrigerator
- Flue/exhaust for refrigerator venting into living space or inadequately vented

### CORRECT diagnostic / response sequence
1. Inspect propane absorption refrigerator burner — should burn blue.
2. Check flue/exhaust routing — refrigerator flue must vent completely outdoors, not into living space.
3. Measure CO adjacent to refrigerator and in room.
4. Yellow flame: check for blocked burner, gas pressure issues, primary air problem.
5. **SAFETY-CRITICAL: Propane absorption refrigerators operate continuously, making even a small CO leak significant over 24-hour exposure.**
6. If refrigerator flue terminates inside structure: this is a code violation — re-route to exterior.
7. Do not operate refrigerator until combustion and venting are corrected.

### MANDATORY protocol
- PROPANE FRIDGE FLUE MUST TERMINATE OUTDOORS — ANY INTERIOR TERMINATION IS A CODE VIOLATION AND CO HAZARD
- SHUT DOWN UNTIL COMBUSTION AND VENTING ARE CORRECTED

### Sources
- Backdrafting and Spillage — HVAC Insider: https://hvacinsider.com/backdrafting-and-spillage/
- NIOSH CO Pocket Guide — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html

### Mike's tone for this scenario
- "Propane refrigerator runs 24/7. A small CO leak from one is worse than an intermittent furnace leak because it never stops."

---

## SCN-SAF-049 — Residential vs. Commercial CO Thresholds
**Equipment / situation:** Tech working in both residential and commercial settings. Understanding the difference in applicable CO thresholds.

### Symptoms / readings / measurements
- Residential standards (non-occupational):
  - EPA/ASHRAE: 9 ppm max 8-hour indoor average
  - UL 2034 residential CO alarm: activates at 70 ppm sustained
- Occupational standards (OSHA/NIOSH):
  - OSHA PEL: 50 ppm TWA (8-hour)
  - NIOSH REL: 35 ppm TWA, 200 ppm ceiling
  - NIOSH IDLH: 1,200 ppm
  - ACGIH TLV: 25 ppm TWA

### CORRECT diagnostic / response sequence
1. Apply residential standards (9 ppm EPA guideline) in homes — this is far stricter than OSHA occupational limits.
2. Residential CO alarm (UL 2034) is designed to prevent death, not prevent sub-clinical CO exposure — alarms do not activate at levels that cause chronic symptoms.
3. In commercial occupancy: OSHA PEL applies (50 ppm TWA) — but this is a regulatory floor, not a health target.
4. **SAFETY-CRITICAL: A residential occupant spending 16+ hours per day in a home with 35–50 ppm CO is receiving greater total exposure than a worker exposed at OSHA PEL for 8 hours per day.**
5. When in doubt, apply the stricter residential standard.

### MANDATORY protocol
- APPLY RESIDENTIAL STANDARDS IN HOMES: ANY CO ABOVE 9 PPM (8-HR AVERAGE) IS ACTIONABLE
- RESIDENTIAL CO ALARM DOES NOT PROTECT AGAINST CHRONIC SUB-ALARM EXPOSURE
- DO NOT USE OSHA OCCUPATIONAL LIMITS AS THE BENCHMARK FOR RESIDENTIAL SAFETY

### Sources
- NIOSH CO TWA/Ceiling/IDLH — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html
- Carbon Monoxide Levels Chart — CO2 Meter: https://www.co2meter.com/blogs/news/carbon-monoxide-levels-chart
- Carbon Monoxide Safety Standards — US Tech Reps: https://ustechreps.com/article/Workplace_CO_Safety_Standards.pdf

### Mike's tone for this scenario
- "The OSHA limit is for a healthy worker for 8 hours. Residential means kids and elderly people all day and all night. Use the tighter number."

---

## SCN-SAF-050 — CO Investigation: Systematic Source Identification Sequence
**Equipment / situation:** CO alarm activated, source not immediately obvious. Multiple potential sources in home.

### Symptoms / readings / measurements
- CO alarm activated or CO measured
- Multiple combustion appliances present: furnace, water heater, range/oven, fireplace, attached garage
- No single obvious source identified

### CORRECT diagnostic / response sequence
1. Map all CO sources in home.
2. Measure CO at each combustion appliance in sequence while operating.
3. Check each appliance's flue and draft conditions.
4. Check attached garage (door seals, return air proximity).
5. Check fireplace/wood stove flue condition.
6. Check kitchen range: improper use of gas range for space heating is a common CO source.
7. Check for vehicle exhaust infiltration (idled vehicle in attached garage).
8. Check if home has HVAC return air in garage — code violation, immediate hazard.
9. **SAFETY-CRITICAL: If source cannot be identified: do not leave occupants in home overnight. Recommend temporary relocation until source is found.**
10. Document every appliance tested, readings at each, and conclusion.

### MANDATORY protocol
- DOCUMENT ALL APPLIANCES TESTED AND CO READINGS AT EACH
- IF SOURCE CANNOT BE IDENTIFIED: RECOMMEND OCCUPANTS DO NOT SLEEP IN HOME UNTIL RESOLVED
- NOTIFY IN WRITING IF ANY APPLIANCE IS SHUT DOWN

### Sources
- Model CO Alarm Response Policy — MTAS Tennessee: https://www.mtas.tennessee.edu/knowledgebase/model-carbon-monoxide-co-alarm-response-policy
- Backdrafting and Spillage — HVAC Insider: https://hvacinsider.com/backdrafting-and-spillage/

### Mike's tone for this scenario
- "Systematic investigation. You check every source. You document every reading. If you can't find it, they don't sleep there."

---

## SCN-SAF-051 — CO Measurement Tools: Calibration and Limitations
**Equipment / situation:** Tech needs to make actionable CO measurements. Understanding tool capabilities and limitations.

### Symptoms / readings / measurements
- Personal CO monitors (badge-style): good for personal protection, lower accuracy at sub-35 ppm levels
- Combustion analyzers: measure CO in undiluted flue gas and calculate air-free CO — most accurate for appliance-level diagnosis
- Hand-held CO meters: good for ambient room measurements when calibrated
- Residential CO alarms: designed to alarm at dangerous levels — NOT sensitive enough for diagnostic purposes

### CORRECT diagnostic / response sequence
1. Use combustion analyzer for all appliance CO measurements (flue gas CO and air-free CO).
2. Use calibrated CO meter for ambient room and supply register measurements.
3. Residential CO alarm: use to verify alarm is functional, but do NOT rely on it for diagnostic readings.
4. **SAFETY-CRITICAL: Combustion analyzer readings are not valid if analyzer is not calibrated per manufacturer interval. Check calibration date before each use.**
5. Verify analyzer cells are not expired — electrochemical cells degrade and report falsely low CO.
6. Test analyzer with known-concentration reference gas annually or per manufacturer schedule.

### MANDATORY protocol
- VERIFY ANALYZER CALIBRATION DATE BEFORE USE ON SAFETY-CRITICAL CALLS
- DO NOT RELY ON RESIDENTIAL ALARM FOR CO MEASUREMENT — USE CALIBRATED INSTRUMENTS
- DOCUMENT INSTRUMENT TYPE AND SERIAL NUMBER ON WORK ORDERS FOR CO FINDINGS

### Sources
- Best Carbon Monoxide Analyzer for Cracked Heat Exchanger — Forensics Detectors: https://www.forensicsdetectors.com/blogs/articles/carbon-monoxide-analyzer-inspectors
- NIOSH CO Pocket Guide — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html

### Mike's tone for this scenario
- "A residential CO alarm is a life-safety device, not a diagnostic instrument. Bring a calibrated analyzer and CO meter on every CO call."

---

## SCN-SAF-052 — Occupant Confusion / Loss of Consciousness: Extreme CO Emergency
**Equipment / situation:** Tech arrives and occupant is confused, unable to answer questions clearly, or has lost consciousness.

### Symptoms / readings / measurements
- Occupant confused, unresponsive, or unconscious
- Other occupants reporting symptoms
- Possible CO smell (or no smell — CO is odorless)

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: CALL 911 IMMEDIATELY. Do not enter the structure without fresh air supply if levels could be life-threatening.**
2. Do not attempt to drag occupant inside — call 911 and stay on the line.
3. If safe to do so without entering: open windows and doors from outside.
4. Wait for EMS and fire department — do not re-enter building alone.
5. When fire department clears structure: then begin appliance investigation.
6. **NIOSH IDLH for CO is 1,200 ppm — at that level, a healthy adult is unconscious within minutes.**

### MANDATORY protocol
- CALL 911 IMMEDIATELY — BEFORE ANY HVAC DIAGNOSIS
- DO NOT ENTER STRUCTURE ALONE WITHOUT CONFIRMED SAFE ATMOSPHERE
- WAIT FOR EMS CLEARANCE BEFORE BEGINNING DIAGNOSIS

### Sources
- NIOSH CO IDLH 1,200 ppm — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html
- Model CO Response Policy — MTAS Tennessee: https://www.mtas.tennessee.edu/knowledgebase/model-carbon-monoxide-co-alarm-response-policy

### Mike's tone for this scenario
- "Call 911. That is the only first step. Diagnosis comes after EMS gets there."

---

## SCN-SAF-053 — CO in Commercial Kitchen vs. Residential: Different Thresholds
**Equipment / situation:** Tech servicing rooftop gas unit or makeup air unit serving a commercial kitchen. CO readings during commissioning.

### Symptoms / readings / measurements
- Commercial settings: OSHA PEL 50 ppm TWA applies
- Restaurant kitchen: additional risk from cooking equipment, grills, fryers
- Makeup air CO contamination can spike worker exposure during high cooking loads

### CORRECT diagnostic / response sequence
1. In commercial: apply OSHA PEL (50 ppm 8-hour TWA) as minimum regulatory standard.
2. Verify rooftop makeup air unit intake is not drawing in exhaust from kitchen hood exhaust discharge.
3. Measure CO at makeup air supply during peak kitchen operation.
4. **SAFETY-CRITICAL: Kitchen exhaust and makeup air intakes must be separated per code — if co-located, recirculation of CO from cooking is possible.**
5. Check all combustion appliances in kitchen mechanical room.
6. Document CO readings at supply air and in kitchen ambient during peak operation.
7. NIOSH recommends 35 ppm as a more protective target even in occupational settings.

### MANDATORY protocol
- APPLY OSHA PEL (50 PPM TWA) AS REGULATORY MINIMUM IN COMMERCIAL — BUT TARGET BELOW 35 PPM
- VERIFY SEPARATION OF MAKEUP AIR INTAKE FROM EXHAUST DISCHARGE
- DOCUMENT READINGS AT PEAK AND OFF-PEAK OPERATIONS

### Sources
- OSHA CO Standard — 1917.24: https://www.osha.gov/laws-regs/regulations/standardnumber/1917/1917.24
- NIOSH CO Pocket Guide — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html

### Mike's tone for this scenario
- "Commercial kitchen CO is OSHA territory. Fifty ppm TWA is the legal minimum — but NIOSH says 35 is more protective. Know the difference."

---

## SCN-SAF-054 — Blocked Return Air Path as CO Amplifier
**Equipment / situation:** Forced-air furnace with significant return duct leakage in unconditioned space (attic, crawl space). CO at registers despite furnace combustion appearing normal.

### Symptoms / readings / measurements
- CO at supply registers despite combustion analysis showing normal flue gas CO
- Return duct located in crawl space or garage with other combustion appliances nearby
- Return duct leaks drawing air from contaminated space

### CORRECT diagnostic / response sequence
1. **Unusual scenario: CO at registers, but appliance combustion analysis clean. This means CO is entering the air distribution — not through the heat exchanger.**
2. Inspect return duct for leaks in areas shared with combustion appliances or garage.
3. Measure CO in crawl space, attic, or garage adjacent to return duct.
4. If combustion appliances (water heater, etc.) are in crawl space venting improperly: their CO is being pulled into return air.
5. Seal return duct leaks.
6. Correct any CO source in contaminated space.
7. **SAFETY-CRITICAL: Return duct in garage is a code violation per IRC M1602.2 — must be corrected immediately.**

### MANDATORY protocol
- RETURN DUCT IN GARAGE IS A CODE VIOLATION — SEAL OR RELOCATE IMMEDIATELY
- SEAL ALL RETURN DUCT LEAKS IN SPACES WITH COMBUSTION APPLIANCES
- VERIFY CO ZERO AT REGISTERS AFTER CORRECTION

### Sources
- Backdrafting and Spillage — HVAC Insider: https://hvacinsider.com/backdrafting-and-spillage/

### Mike's tone for this scenario
- "Clean combustion but CO at the register — that's a duct leak, not a heat exchanger. The return is pulling CO from somewhere else."

---

## SCN-SAF-055 — CO from Pellet Stove or Insert During HVAC Call
**Equipment / situation:** Homeowner has pellet stove insert or freestanding pellet stove. CO alarm activates. HVAC tech called.

### Symptoms / readings / measurements
- CO alarm active
- Pellet stove exhaust pipe may be leaking at joints or through cracked gaskets
- Combustion air inlet for pellet stove may be blocked
- HVAC appliances test clean

### CORRECT diagnostic / response sequence
1. Expand investigation to pellet stove after clearing HVAC appliances.
2. Inspect pellet stove vent pipe joints — high-temperature sealant can fail, creating CO leak points.
3. Check gaskets around loading door and ash door — gaskets compress over time and allow CO to escape.
4. Inspect combustion air inlet for blockage — inadequate combustion air produces CO.
5. Verify exhaust fan is operating — pellet stoves rely on induced-draft fan for venting.
6. **SAFETY-CRITICAL: Pellet stove CO leaks are easily overlooked on HVAC calls. Always check when stove is present and HVAC is clean.**
7. Recommend pellet stove service technician or dealer if combustion or venting problem is confirmed.

### MANDATORY protocol
- INSPECT PELLET STOVE EXHAUST JOINTS AND DOOR GASKETS WHEN PRESENT
- DO NOT OVERLOOK NON-HVAC COMBUSTION APPLIANCES ON CO CALLS

### Sources
- Backdrafting — HVAC Insider: https://hvacinsider.com/backdrafting-and-spillage/

### Mike's tone for this scenario
- "Clean furnace and still have CO — look at the pellet stove. That's a common miss."

---

## SCN-SAF-056 — CO at Low Concentrations: Chronic Exposure Risk
**Equipment / situation:** Ongoing low-level CO in home (5–20 ppm sustained). No CO alarm activation. Occupants complain of chronic fatigue and frequent headaches.

### Symptoms / readings / measurements
- Ambient CO in home 5–20 ppm during heating season
- Residential CO alarm does not activate at these levels (UL 2034 requires activation at 70 ppm)
- Occupants report chronic low-grade symptoms correlating to heating season

### CORRECT diagnostic / response sequence
1. Measure CO at multiple rooms and at supply registers during full heating cycle.
2. Identify source — likely combustion appliance with slightly elevated CO production.
3. Investigate for: slightly cracked heat exchanger, partially blocked flue, marginal combustion, flue gas spillage.
4. **SAFETY-CRITICAL: Sustained 5–20 ppm CO may not alarm the detector but causes carboxyhemoglobin accumulation with prolonged exposure, particularly in elderly, children, and people with cardiovascular disease.**
5. Correct source. Verify CO returns to zero (0–1 ppm) at all registers and ambient.
6. Recommend physician evaluation — chronic CO exposure can cause lasting neurological effects.

### MANDATORY protocol
- DO NOT DISMISS 5–20 PPM CO AS "TRACE" — TREAT AS ACTIONABLE
- RECOMMEND PHYSICIAN EVALUATION FOR ALL OCCUPANTS
- CORRECT SOURCE BEFORE LEAVING

### Sources
- Carbon Monoxide Levels Chart — CO2 Meter: https://www.co2meter.com/blogs/news/carbon-monoxide-levels-chart
- NIOSH CO Standards — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html

### Mike's tone for this scenario
- "The alarm doesn't go off at ten ppm. But ten ppm all winter is a real dose. Fix the source and tell them to see a doctor."

---

## SCN-SAF-057 — CO Alarm Placement: Multiple Detectors, Correct Locations
**Equipment / situation:** Tech noting only one CO alarm in multi-story home, or alarm placed in incorrect location. Advising homeowner during annual inspection.

### Symptoms / readings / measurements
- CO alarms absent from sleeping areas
- CO alarm placed more than 10 feet from sleeping area
- Alarm mounted on ceiling (CO has near-neutral buoyancy, distributes throughout room)

### CORRECT diagnostic / response sequence
1. Review CO alarm placement requirements: NFPA 720 (now incorporated into NFPA 72 Chapter 29) requires CO alarms on each level and within 10 feet of sleeping room entrances.
2. CO distributes through room space — placement within 5 feet of floor to ceiling is generally acceptable (unlike smoke alarms which should be on ceiling only).
3. Recommend additional alarms if missing from required locations.
4. Advise homeowner: alarms have a service life (typically 5–7 years) — check manufacture date.
5. **Note: This is advisory — tech cannot install alarms. But identifying the gap is part of the safety inspection.**

### MANDATORY protocol
- DOCUMENT MISSING OR MISPLACED CO ALARMS ON WORK ORDER
- RECOMMEND MINIMUM ONE ALARM PER LEVEL AND NEAR EACH SLEEPING AREA

### Sources
- NFPA 72 National Fire Alarm and Signaling Code — NFPA: https://www.nfpa.org/codes-and-standards/nfpa-72-standard-development/72

### Mike's tone for this scenario
- "One CO alarm in the basement doesn't protect the bedrooms. Tell the homeowner what's missing and write it on the invoice."

---

## SCN-SAF-058 — Commercial CO Monitoring: Machinery Room Requirements
**Equipment / situation:** Tech servicing commercial building with mechanical room. CO monitoring requirements in commercial machinery rooms.

### Symptoms / readings / measurements
- ASHRAE 15-2022 requires refrigerant leak detection in machinery rooms for flammable and toxic refrigerants
- For combustion appliances in commercial mechanical rooms: CO monitoring and ventilation are governed by OSHA and local codes
- CO readings at 200 ppm (NIOSH ceiling) require immediate evacuation in commercial settings

### CORRECT diagnostic / response sequence
1. In commercial machinery room with combustion appliances: verify adequate ventilation per local code.
2. Measure CO in machinery room ambient during full load operation of appliances.
3. If CO in machinery room approaches 35 ppm (NIOSH TWA): investigate source immediately.
4. Commercial buildings: CO detectors tied to building management system may be required depending on occupancy type and code year.
5. **SAFETY-CRITICAL: Commercial CO exposure affects workers with regulatory consequences (OSHA) as well as occupants.**

### MANDATORY protocol
- COMMERCIAL MACHINERY ROOMS: CO ABOVE 35 PPM AMBIENT = SHUT DOWN APPLIANCE, VENTILATE
- OSHA PEL IS 50 PPM TWA — NIOSH REL IS 35 PPM TWA (more protective)
- DOCUMENT CO READINGS IN MACHINERY ROOM ON EVERY COMMERCIAL CALL

### Sources
- OSHA CO Standard: https://www.osha.gov/laws-regs/regulations/standardnumber/1917/1917.24
- NIOSH CO Pocket Guide — CDC: https://www.cdc.gov/niosh/npg/npgd0105.html
- ASHRAE 15-2022 — Safety Standards for A2L: https://e360blog.copeland.com/safety-standards-establish-usage-guidelines-for-a2l-refrigerants/

### Mike's tone for this scenario
- "Commercial machinery room CO is an OSHA liability on top of a safety issue. Document the reading. Correct the source."

---

## SCN-SAF-059 — Post-Repair CO Verification Protocol
**Equipment / situation:** Tech has completed furnace repair (heat exchanger replacement, burner cleaning, venting correction, gas valve replacement). Verifying safety before leaving.

### Symptoms / readings / measurements
- Any repair to gas appliance requires post-repair CO verification
- Supply register CO must read zero (0–1 ppm background) before restoration
- Combustion analysis must confirm CO air-free below 100 ppm

### CORRECT diagnostic / response sequence
1. After any repair to combustion appliance: run full heating cycle with all access panels in place (normal operating condition).
2. Measure CO at each supply register in home — minimum 5 minutes of operation at each register measurement.
3. **SAFETY-CRITICAL: Measure with panels on. Some heat exchangers show no CO with panels off (reduced blower pressure) but show CO with panels on (normal pressure differential across crack).**
4. Record combustion analysis: O2, CO, CO air-free, stack temp, efficiency.
5. If CO at register reads above zero: do not restore system. Re-inspect.
6. Document post-repair CO readings on work order before leaving.

### MANDATORY protocol
- PERFORM CO VERIFICATION WITH ALL ACCESS PANELS IN PLACE
- SUPPLY REGISTER CO MUST READ ZERO BEFORE LEAVING
- DOCUMENT POST-REPAIR CO READINGS ON WORK ORDER

### Sources
- Heat Exchanger Crack Diagnosis — HVAC School: https://hvacrschool.com/heat-exchanger-crack-diagnosis/
- Combustion Safety Evaluation — wxfieldguide.com: https://wxfieldguide.com/mo/MOWxFG/HeatingCooling/Combustion-Safety_Evaluation.htm

### Mike's tone for this scenario
- "Panels on for the final CO test. That's the operating condition. If you test with panels off you're not testing the right thing."

---

## SCN-SAF-060 — CO Response Documentation: What Goes on the Work Order
**Equipment / situation:** Any call involving CO findings, appliance condemnation, or safety shutdown.

### Symptoms / readings / measurements
- Documentation standards for CO-related findings

### CORRECT diagnostic / response sequence
1. Work order must include: date and time, appliance make/model/serial, CO readings (ambient, at appliance, at registers — all with units), instruments used (make, model, calibration date), actions taken.
2. If appliance was shut down: document exact reason and what tech told homeowner.
3. If appliance was condemned: document condemnation in writing — homeowner must sign acknowledgment.
4. If occupants had symptoms: document symptoms reported, whether EMS was called, and physician evaluation was recommended.
5. **SAFETY-CRITICAL: Inadequate documentation on a CO finding can expose the company to liability if an occupant is later harmed. Document as if the work order will be read in court.**
6. Leave a copy with the homeowner.

### MANDATORY protocol
- DOCUMENT ALL CO READINGS WITH UNITS AND INSTRUMENT IDENTIFICATION
- HOMEOWNER MUST SIGN CONDEMNATION ACKNOWLEDGMENT
- LEAVE COPY OF WORK ORDER WITH HOMEOWNER

### Sources
- Model CO Response Policy — MTAS Tennessee: https://www.mtas.tennessee.edu/knowledgebase/model-carbon-monoxide-co-alarm-response-policy

### Mike's tone for this scenario
- "Document it like it's going to court. Because it might. Put every reading, every instrument, every conversation on the work order."


---
# SECTION C: A2L REFRIGERANT SCENARIOS (R-454B, R-32)
---

## SCN-SAF-061 — A2L Introduction: What Mildly Flammable Means in Practice
**Equipment / situation:** Tech encountering A2L refrigerant (R-454B or R-32) for the first time. New equipment shipped after January 2025 uses A2L.

### Symptoms / readings / measurements
- Equipment data tag shows R-454B or R-32
- ASHRAE 34 classification: A2L = low toxicity (A) + lower flammability (2L)
- R-454B LFL: approximately 11.3% by volume
- R-32 LFL: 14.4% by volume
- Burning velocity: below 10 cm/s for both (difficult to ignite, slow-burning)
- For comparison: propane LFL is 2.1% — A2L refrigerants are far less flammable than propane or natural gas

### CORRECT diagnostic / response sequence
1. A2L is not the same as propane or natural gas. The LFL is much higher and burning velocity is much lower.
2. However, mildly flammable means precautions are required — not ignored.
3. Key A2L precautions: eliminate ignition sources in work area, ensure adequate ventilation, use A2L-rated recovery equipment, never mix with A1 refrigerants.
4. **SAFETY-CRITICAL: A2L-rated recovery machine is required — standard R-410A machines are not rated for A2L refrigerants.**
5. A2L-certified leak detectors required (NDIR type preferred for A2L sensitivity).

### MANDATORY protocol
- USE A2L-RATED RECOVERY MACHINE — DO NOT USE STANDARD R-410A MACHINE ON A2L SYSTEMS
- ENSURE ADEQUATE VENTILATION BEFORE OPENING A2L SYSTEM
- ELIMINATE IGNITION SOURCES IN WORK AREA

### Sources
- R-454B Safety Classification — AAON: https://www.aaon.com/resources/understanding-the-safety-classification-of-r-454b-refrigerant-a2l-explained
- R-32 LFL — Engineer Fix: https://engineerfix.com/is-r32-refrigerant-flammable-what-you-need-to-know/
- EPA A2L Transition — ICC Q4 2025: https://www.iccsafe.org/building-safety-journal/bsj-technical/q4-2025-update-epas-technology-transitions-program-related-to-a2l-refrigerants/

### Mike's tone for this scenario
- "A2L is mildly flammable — not propane. But you still need A2L equipment and ventilation. Know what you're working with before you open the system."

---

## SCN-SAF-062 — A2L Recovery: Machine Compatibility and Procedure
**Equipment / situation:** Tech recovering R-454B or R-32 from a residential split system. Must use A2L-rated recovery equipment.

### Symptoms / readings / measurements
- R-454B system requiring refrigerant recovery
- Standard R-410A recovery machine present — not rated for A2L
- A2L-rated recovery machine (explosion-proof motor, compatible seals, ratings for A2L) required

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Standard R-410A recovery machines are NOT certified for A2L refrigerants. Using a non-rated machine with A2L creates an ignition risk from machine internal sparking.**
2. Verify recovery machine has A2L rating — look for AHRI 740 certification and A2L notation on machine.
3. Use A2L-rated recovery cylinder — cylinders must be rated and labeled for A2L.
4. Ensure work area is ventilated before connecting machine.
5. Eliminate ignition sources (sparks, open flame, non-intrinsically-safe lights).
6. Recover refrigerant per EPA 608 vacuum requirements (10" Hg for systems under 200 lbs, 15" Hg for 200 lbs+).
7. Weigh recovered refrigerant and record on service ticket.
8. Label recovery cylinder with refrigerant type and system identification.

### MANDATORY protocol
- USE ONLY A2L-RATED RECOVERY MACHINE ON R-454B OR R-32 SYSTEMS
- USE A2L-RATED RECOVERY CYLINDERS
- VENTILATE WORK AREA BEFORE OPENING A2L CIRCUIT
- ELIMINATE ALL IGNITION SOURCES

### Sources
- R-454B Transition Guide — OxMaint: https://oxmaint.com/industries/hvac/r-454b-refrigerant-transition-guide-hvac-maintenance
- EPA 608 Recovery Requirements: https://www.epa.gov/section608/regulatory-updates-section-608-refrigerant-management-regulations
- A2L Refrigerant Engineering Guide — Daikin Applied: https://tahoeweb.daikinapplied.com/api/general/DownloadDocumentByName/media/A2L%20Refrigerant%20Engineering%20Guide.pdf/

### Mike's tone for this scenario
- "Using a non-A2L recovery machine on R-454B is a fire risk. This is a real tool upgrade, not optional."

---

## SCN-SAF-063 — A2L Brazing: Nitrogen Purge and Leak Check Protocol
**Equipment / situation:** Tech brazing copper line sets for a new A2L system installation. Nitrogen purge is mandatory.

### Symptoms / readings / measurements
- New A2L split system installation requiring brazed copper connections
- Nitrogen purge required during brazing to prevent oxidation and refrigerant interaction with hot copper
- A2L leak check required before charging

### CORRECT diagnostic / response sequence
1. **Before brazing any joint on an A2L system: establish nitrogen flow through line set.**
2. Flow dry nitrogen at low rate (1–3 CFH) through the line set from service valve to open end during brazing.
3. This prevents: (a) internal copper oxidation, (b) any residual refrigerant from reaching ignition temperature in the line.
4. After brazing is complete: pressurize line set with dry nitrogen to 500 psig (or manufacturer specified test pressure).
5. Hold pressure for minimum 30 minutes — verify no pressure drop.
6. Leak check every braze joint, flare, and Schrader valve core with A2L-certified electronic leak detector (minimum 0.1 oz/year sensitivity).
7. After leak check passes: evacuate to 500 microns, hold 15 minutes, verify no rise.
8. **SAFETY-CRITICAL: Do not use refrigerant for pressure testing on A2L systems — nitrogen only.**

### MANDATORY protocol
- NITROGEN PURGE DURING EVERY BRAZE ON A2L LINE SETS — NO EXCEPTIONS
- PRESSURE TEST WITH NITROGEN — NOT REFRIGERANT
- ELECTRONIC LEAK CHECK WITH A2L-CERTIFIED DETECTOR BEFORE CHARGING
- DOCUMENT TEST PRESSURE, HOLD TIME, AND LEAK CHECK RESULT ON WORK ORDER

### Sources
- A2L Brazing and Leak Check — A2L Critical Code Changes: https://snarsca.com/blog/a2l-refrigerants-updates/
- A2L Supplemental Guide — Carrier: https://www.shareddocs.com/hvac/docs/1005/Public/0D/39L-M-2SIS.pdf
- A2L Refrigerant Engineering Guide — Daikin Applied: https://tahoeweb.daikinapplied.com/api/general/DownloadDocumentByName/media/A2L%20Refrigerant%20Engineering%20Guide.pdf/

### Mike's tone for this scenario
- "Nitrogen in the line while you braze. Every joint. Non-negotiable. Then test at 500 psi with nitrogen — not refrigerant."

---

## SCN-SAF-064 — A2L LFL Calculation for Confined Space Safety
**Equipment / situation:** Tech installing A2L system in small mechanical room. Determining if charge size relative to room volume creates a hazard.

### Symptoms / readings / measurements
- ASHRAE 15-2022: flammable concentration limit set at 25% of LFL
- R-454B LFL: ~11.3% by volume → 25% of LFL = 2.8% by volume
- R-32 LFL: 14.4% by volume → 25% of LFL = 3.6% by volume
- Equipment with charge above 3.91 lbs (1.77 kg) of A2L in high-probability application requires factory-installed refrigerant detection system per UL 60335-2-40

### CORRECT diagnostic / response sequence
1. Determine system charge weight from equipment nameplate.
2. Determine room volume (length × width × height in cubic feet).
3. **If the entire system charge were to leak into the room, would it exceed 25% of LFL?** This is the ASHRAE 15 safety calculation.
4. For R-454B: 25% LFL ≈ 2.8% by volume — 1 lb of R-454B in a 100 cubic foot room would approach this.
5. Equipment above 3.91 lbs A2L charge must have factory Refrigerant Detection System (RDS) installed.
6. RDS must trigger at max 25% LFL.
7. **SAFETY-CRITICAL: If equipment is installed in a confined space and RDS is missing or non-functional: do not charge system until RDS is operational.**
8. Sensor placement: A2L refrigerants are heavier than air — sensors mount near floor, adjacent to indoor coil.

### MANDATORY protocol
- VERIFY RDS IS PRESENT AND FUNCTIONAL ON SYSTEMS WITH CHARGE ABOVE 3.91 LBS A2L
- SENSOR PLACEMENT: NEAR FLOOR, ADJACENT TO INDOOR COIL
- DO NOT CHARGE SYSTEM IN CONFINED SPACE WITHOUT FUNCTIONAL RDS IF CHARGE EXCEEDS THRESHOLD

### Sources
- A2L Sensor Guide — RefrigerantSensor.com: https://refrigerantsensor.com/knowledge/a2l-sensor/
- ASHRAE 15-2022 Safety Standards — ACHR News: https://www.achrnews.com/articles/163224-ashrae-standard-15-2022-plays-crucial-role-in-refrigerant-transition
- UL 60335-2-40 Requirements — UL Solutions: https://www.ul.com/insights/updated-requirements-refrigerant-detection-systems

### Mike's tone for this scenario
- "Charge above 3.91 lbs in a confined space needs a working RDS. That's a code requirement. Verify it before charging."

---

## SCN-SAF-065 — A2L Refrigerant Detection System (RDS): Alarm Response
**Equipment / situation:** A2L system installed in mechanical room. RDS alarm activates during service visit or customer call.

### Symptoms / readings / measurements
- RDS alarm active (audible/visual alert)
- System may have triggered ventilation fan or equipment shutdown
- Refrigerant leak possible — concentration approaching 25% LFL in confined space

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Treat RDS alarm as real until proven otherwise. Evacuate confined space immediately.**
2. Shut off all ignition sources in the area.
3. Do not operate any electrical switches in the alarm zone if refrigerant concentration is unknown.
4. Ventilate space (open doors, use explosion-proof fans if available).
5. Allow ventilation to run — then measure refrigerant concentration with appropriate sensor.
6. Once concentration verified below 25% LFL: investigate source of leak.
7. Locate and repair leak (electronic detector, bubble solution).
8. Verify leak is repaired, perform leak check, document.
9. Do not reset RDS until leak is confirmed repaired and space is confirmed clear.

### MANDATORY protocol
- EVACUATE CONFINED SPACE ON RDS ALARM
- DO NOT OPERATE ELECTRICAL SWITCHES IF CONCENTRATION IS UNKNOWN
- DO NOT RESET RDS UNTIL LEAK IS CONFIRMED REPAIRED

### Sources
- A2L Sensor Guide — RefrigerantSensor.com: https://refrigerantsensor.com/knowledge/a2l-sensor/
- A2L Code Requirements — DuraLabel: https://resources.duralabel.com/articles/what-2025-hvac-code-changes-mean-for-a2l-refrigerants-duralabel

### Mike's tone for this scenario
- "RDS alarm means get out of the confined space. Don't flip switches. Ventilate, then measure, then find the leak."

---

## SCN-SAF-066 — R-410A to R-454B: Not a Direct Drop-In
**Equipment / situation:** Tech asked by customer if R-454B can be added to their existing R-410A system.

### Symptoms / readings / measurements
- Customer has R-410A system showing low charge
- Wants to use R-454B because it is available and they've heard it's the replacement
- System is NOT designed for R-454B

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: R-454B is NOT a drop-in replacement for R-410A. Do not add R-454B to an R-410A system.**
2. R-454B and R-410A have different refrigerant blends, different pressures at operating temperatures, and different oil compatibility requirements.
3. Adding R-454B to an R-410A system creates a mixed refrigerant: undefined blend, uncharacterized operating pressures, equipment certification void, potential for fractionation-induced flammability shift.
4. Correct action: recover existing R-410A per EPA 608 requirements, diagnose and repair leak, recharge with R-410A.
5. If equipment is end-of-life: recommend replacement with A2L-compatible equipment designed for R-454B.
6. **R-454B is designed for new equipment built and certified for it — it is not a retrofit refrigerant for R-410A systems.**

### MANDATORY protocol
- DO NOT MIX R-454B WITH R-410A IN ANY SYSTEM
- DO NOT ADD R-454B TO R-410A EQUIPMENT — EVEN PARTIALLY
- RECOVER R-410A, REPAIR LEAK, RECHARGE WITH CORRECT REFRIGERANT
- DOCUMENT REFRIGERANT TYPE USED ON WORK ORDER

### Sources
- R-454B Transition Guide — OxMaint: https://oxmaint.com/industries/hvac/r-454b-refrigerant-transition-guide-hvac-maintenance
- EPA 608 A2L Requirements — facilio.com: https://facilio.com/blog/epa-refrigerant-regulations/
- R-454B White Paper — JCI/York: https://www.tempmaster-hvac.com/-/media/project/jci-global/york-sites/united-states-york/common-pages/residential/refrigerant-transition/jci-r454b-whitepaper.pdf

### Mike's tone for this scenario
- "R-454B in an R-410A system is not a drop-in. It's a mixed refrigerant and a voided equipment certification. Recover and recharge correctly."

---

## SCN-SAF-067 — A2L Work Area Safety: Ventilation and Ignition Source Control
**Equipment / situation:** Tech servicing A2L system indoors (ductless or ducted split, indoor coil work). Establishing safe work area.

### Symptoms / readings / measurements
- Indoor work area with A2L refrigerant (R-454B or R-32)
- Need to open refrigerant circuit
- Standard safety sweep required before opening any A2L system

### CORRECT diagnostic / response sequence
1. Before opening A2L system: survey work area for ignition sources.
2. Remove or disable: open flames (candles, pilot lights on nearby appliances), cigarette smoking, non-intrinsically-safe power tools, temporary construction lighting.
3. Verify work area is ventilated — cross-ventilation preferred (fresh air inlet and exhaust path).
4. Place refrigerant detector at low position near work area.
5. Open system components — work efficiently to minimize open time.
6. If A2L leak is detected during work: immediately cease work, ventilate, identify and control source before continuing.
7. **SAFETY-CRITICAL: A2L accumulates near floor level (heavier than air) — ventilate from low to high if possible.**

### MANDATORY protocol
- REMOVE OR DISABLE IGNITION SOURCES BEFORE OPENING A2L SYSTEM
- ENSURE CROSS-VENTILATION IS ACTIVE
- PLACE DETECTOR AT FLOOR LEVEL NEAR WORK
- IF UNEXPECTED LEAK OCCURS: CEASE WORK, VENTILATE, IDENTIFY SOURCE BEFORE CONTINUING

### Sources
- A2L Safety Standards — Copeland e360: https://e360blog.copeland.com/safety-standards-establish-usage-guidelines-for-a2l-refrigerants/
- A2L Work Area Safety — Daikin Applied: https://tahoeweb.daikinapplied.com/api/general/DownloadDocumentByName/media/A2L%20Refrigerant%20Engineering%20Guide.pdf/

### Mike's tone for this scenario
- "A2L work area sweep — ignition sources, ventilation, low detector. Do it before you break the circuit open."

---

## SCN-SAF-068 — A2L Leak Detection: Electronic Detector Selection
**Equipment / situation:** Tech needs to leak-check an A2L system. Selecting appropriate detector.

### Symptoms / readings / measurements
- A2L refrigerant systems require leak detector capable of detecting A2L refrigerants
- Heated diode detectors designed for HFC refrigerants may not reliably detect R-454B or R-32
- NDIR (non-dispersive infrared) detectors are the preferred type for A2L sensitivity and accuracy
- Minimum sensitivity: 0.1 oz/year (some manufacturers specify even higher sensitivity)

### CORRECT diagnostic / response sequence
1. Verify leak detector is rated for R-454B or R-32 specifically — not just "HFC compatible."
2. Prefer NDIR detector for A2L — does not require heated diode that can become a potential ignition source.
3. Calibrate/zero detector per manufacturer instructions before use.
4. Sweep all braze joints, flare connections, valve stems, and Schrader cores.
5. Move detector slowly (approximately 1 inch per second) — A2L disperses easily, slow sweeping catches low-rate leaks.
6. **SAFETY-CRITICAL: A heated diode detector in a high-concentration A2L leak area creates an ignition risk — if smell or high concentration is suspected, stop and ventilate before using heated-diode detector.**
7. Document all leak check results on work order.

### MANDATORY protocol
- USE DETECTOR RATED AND CALIBRATED FOR A2L REFRIGERANTS SPECIFICALLY
- PREFER NDIR TYPE DETECTOR FOR A2L APPLICATIONS
- IF HIGH CONCENTRATION SUSPECTED: VENTILATE BEFORE USING HEATED-DIODE DETECTOR
- DOCUMENT LEAK CHECK RESULT AND INSTRUMENT USED ON WORK ORDER

### Sources
- A2L Sensor Guide — RefrigerantSensor.com: https://refrigerantsensor.com/knowledge/a2l-sensor/
- A2L Refrigerant Leak Detection — Plumbing Supply and More: https://www.plumbingsupplyandmore.com/a2l-refrigerant-leak-detection-in-line-sets-tools-and-procedures

### Mike's tone for this scenario
- "Heated diode detector in a concentrated A2L atmosphere is an ignition source. Know your tool. NDIR for A2L work."

---

## SCN-SAF-069 — Mixed A2L System: Refrigerant Contamination Diagnosis
**Equipment / situation:** Tech called to service A2L system that has been serviced by another contractor. Possible refrigerant mixing or contamination.

### Symptoms / readings / measurements
- System suction and discharge pressures do not match R-454B or R-32 PT chart
- Possible earlier addition of R-410A to an A2L system
- Recovery cylinder shows mixed refrigerant indicator (or identifier reads unexpected blend)

### CORRECT diagnostic / response sequence
1. Use refrigerant identifier before opening any mixed system — do not assume refrigerant type.
2. If identifier shows mixed/contaminated refrigerant: do NOT add any refrigerant to system.
3. Recover all refrigerant as contaminated — use designated contaminated refrigerant cylinder, clearly labeled.
4. Do not mix contaminated recovery with virgin refrigerant recovery cylinders.
5. Contact reclaimer for disposal of contaminated refrigerant.
6. **SAFETY-CRITICAL: Unknown blend with A2L component has unknown flammability characteristics. Treat as potentially flammable — maintain A2L safety protocols throughout.**
7. After full recovery: flush system per manufacturer's guidance if needed, verify oil compatibility, recharge with correct refrigerant.

### MANDATORY protocol
- IDENTIFY REFRIGERANT BEFORE OPENING ANY SYSTEM — USE REFRIGERANT IDENTIFIER
- CONTAMINATED REFRIGERANT GOES TO SEPARATE LABELED CYLINDER — NOT WITH CLEAN RECOVERY
- MAINTAIN A2L SAFETY PROTOCOLS FOR ANY SYSTEM WITH UNKNOWN OR MIXED A2L REFRIGERANT
- DOCUMENT IDENTIFIER READING AND CONTAMINATION FINDING ON WORK ORDER

### Sources
- R-454B Transition Guide — OxMaint: https://oxmaint.com/industries/hvac/r-454b-refrigerant-transition-guide-hvac-maintenance
- EPA 608 Recovery Requirements: https://www.epa.gov/section608/regulatory-updates-section-608-refrigerant-management-regulations

### Mike's tone for this scenario
- "Unknown blend with A2L is unknown flammability. Identifier first. Contaminated refrigerant in its own labeled cylinder. Always."

---

## SCN-SAF-070 — R-32 Mini-Split Service: Indoor Unit Safety
**Equipment / situation:** Tech servicing R-32 mini-split system (common in international-origin equipment, increasingly in domestic product after 2025). Indoor unit coil service.

### Symptoms / readings / measurements
- R-32 system — charge typically 1–3 lbs for single-zone residential
- Indoor unit has factory-installed RDS for systems above threshold charge
- Service requires coil or expansion valve access

### CORRECT diagnostic / response sequence
1. Verify RDS is present and functional on unit before opening refrigerant circuit.
2. Ventilate indoor space where work is performed.
3. Turn off electricity — confirm power is off at indoor and outdoor units before opening refrigerant circuit.
4. Remove ignition sources from room.
5. Open refrigerant circuit using A2L-rated recovery machine.
6. After service: nitrogen pressure test, A2L leak check, evacuate, recharge to nameplate weight.
7. **SAFETY-CRITICAL: R-32 has LFL of 14.4% — higher than R-454B. Leaking into a very small enclosed room (bedroom, small bathroom) is the higher-risk scenario for residential mini-splits. Ensure room ventilation is adequate.**

### MANDATORY protocol
- VERIFY RDS FUNCTION BEFORE OPENING CIRCUIT
- VENTILATE ROOM BEFORE AND DURING INDOOR UNIT WORK
- USE A2L-RATED RECOVERY EQUIPMENT
- CHARGE TO NAMEPLATE WEIGHT ONLY — DO NOT OVERCHARGE

### Sources
- R-32 Flammability Protocol — The Furnace Outlet: https://thefurnaceoutlet.com/blogs/news/safe-smart-essential-r-32-flammability-protocols-every-hvac-tech-must-know
- ASHRAE 15-2022 A2L Requirements — ACHR News: https://www.achrnews.com/articles/163224-ashrae-standard-15-2022-plays-crucial-role-in-refrigerant-transition

### Mike's tone for this scenario
- "R-32 mini-split in a small bedroom — ventilate the room before you open the circuit. That's a small volume with a meaningful charge."

---

## SCN-SAF-071 — A2L Indoor Coil Failure: Leak Inside Occupied Space
**Equipment / situation:** A2L system indoor coil develops leak inside mechanical closet or ceiling plenum space. Occupants report smell.

### Symptoms / readings / measurements
- A2L refrigerant has slight ether-like odor at high concentrations
- RDS may have activated
- CO/refrigerant detector alarm in structure
- Possible refrigerant accumulation near floor in closet

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Evacuate space with the leak — do not operate any electrical switches near detected accumulation.**
2. Shut off system from remote disconnect or breaker (not from inside leak zone if concentration is high).
3. Ventilate enclosed space — open doors, run building ventilation.
4. After ventilation confirms area is clear: locate leak with A2L certified detector.
5. Recover residual refrigerant.
6. Repair indoor coil — A2L coil replacement typically requires full system evacuation and recharge.
7. Nitrogen pressure test, leak check, evacuate, recharge per nameplate.
8. Verify RDS is fully operational before returning to service.

### MANDATORY protocol
- EVACUATE SPACE NEAR ACCUMULATION — DO NOT SWITCH ELECTRICAL IN CONTAMINATED ZONE
- SHUT SYSTEM OFF FROM OUTSIDE ZONE IF POSSIBLE
- VENTILATE BEFORE ENTERING LEAK ZONE
- VERIFY RDS OPERATIONAL BEFORE RESTORING TO SERVICE

### Sources
- A2L Indoor Coil Safety — Bosch Home Comfort: https://www.bosch-homecomfort.com/us/en/residential/knowledge/a2l-refrigerant-change-guide/
- A2L RDS Requirements — UL Solutions: https://www.ul.com/insights/updated-requirements-refrigerant-detection-systems

### Mike's tone for this scenario
- "Refrigerant accumulation near the floor and you're near a switch — step out, ventilate, then investigate. Heavier than air means it pools."

---

## SCN-SAF-072 — A2L System Commissioning: Pre-Charge Safety Checklist
**Equipment / situation:** New A2L system installation complete. Pre-charge checklist before introducing A2L refrigerant.

### Symptoms / readings / measurements
- System is ready for commissioning — all line sets brazed, electrical connected, RDS installed
- Pre-charge verification required

### CORRECT diagnostic / response sequence
1. Verify RDS is installed per manufacturer location specification (near floor, near indoor coil) and connected to system control.
2. Test RDS alarm function per manufacturer procedure.
3. Verify all braze joints have been nitrogen-pressure-tested and leak-checked (before charge).
4. Verify system has been evacuated to 500 microns or better, held for 15 minutes minimum.
5. Verify recovery equipment and cylinders used are A2L-rated.
6. Charge system: introduce refrigerant as vapor (not liquid) for A2L systems per manufacturer's instructions to avoid fractionation.
7. Charge to nameplate weight using calibrated scale.
8. After full charge: perform final A2L leak check on all field connections.
9. **SAFETY-CRITICAL: Overcharging A2L system increases density of refrigerant in system — more refrigerant available to leak. Charge to nameplate only.**

### MANDATORY protocol
- VERIFY RDS INSTALLED, LOCATED, AND TESTED BEFORE CHARGE
- EVACUATE TO 500 MICRONS BEFORE CHARGE
- CHARGE AS VAPOR PER MANUFACTURER INSTRUCTIONS
- CHARGE TO NAMEPLATE WEIGHT ONLY — USE CALIBRATED SCALE

### Sources
- A2L Supplemental Guide — Carrier: https://www.shareddocs.com/hvac/docs/1005/Public/0D/39L-M-2SIS.pdf
- A2L Refrigerant Engineering Guide — Daikin Applied: https://tahoeweb.daikinapplied.com/api/general/DownloadDocumentByName/media/A2L%20Refrigerant%20Engineering%20Guide.pdf/

### Mike's tone for this scenario
- "RDS test, leak check, 500-micron evacuation, nameplate weight on the scale. This is the sequence every time on A2L."

---

## SCN-SAF-073 — A2L State/Regional Code Adoption: Building Code Readiness
**Equipment / situation:** Tech working in a jurisdiction that has or has not adopted codes permitting A2L refrigerant installation. Navigating compliance.

### Symptoms / readings / measurements
- Some states and jurisdictions had code adoption delays for A2L refrigerants
- ASHRAE 15-2022, ASHRAE 34-2022, and IFC/IMC 2024 editions include A2L provisions
- Not all jurisdictions have adopted these code editions as of 2025-2026

### CORRECT diagnostic / response sequence
1. Before installing A2L equipment: verify local Authority Having Jurisdiction (AHJ) has adopted codes permitting A2L refrigerant use.
2. Check AHRI A2L Building Code Map for state-by-state adoption status.
3. If local code has not adopted A2L provisions: installation may not be permitted regardless of EPA/AIM Act mandates.
4. Contact local mechanical/building permit office if unsure.
5. **SAFETY-CRITICAL: Installing A2L equipment in a jurisdiction that hasn't adopted A2L codes creates liability and code compliance issues.**
6. Document code edition confirmed with AHJ before installation.

### MANDATORY protocol
- VERIFY LOCAL CODE ADOPTION OF A2L PROVISIONS BEFORE INSTALLING A2L EQUIPMENT
- CONTACT AHJ IF UNCERTAIN
- DOCUMENT CODE VERIFICATION ON WORK ORDER

### Sources
- A2L Building Code Map — AHRI: https://www.ahrinet.org/a2l-refrigerant-building-code-map-us
- A2L Code Requirements Overview — Building Code Blog: https://www.buildingcode.blog/blog/a2l-refrigerants-a-code-requirement-overview
- EPA A2L Technology Transitions — ICC Q4 2025: https://www.iccsafe.org/building-safety-journal/bsj-technical/q4-2025-update-epas-technology-transitions-program-related-to-a2l-refrigerants/

### Mike's tone for this scenario
- "Check the AHRI map before you install A2L in a new jurisdiction. Not every state has adopted the codes yet."

---

## SCN-SAF-074 — A2L Refrigerant: Service Technician EPA 608 Requirements
**Equipment / situation:** Tech who holds EPA 608 certification for HFC refrigerants (R-410A). Does existing certification cover A2L?

### Symptoms / readings / measurements
- EPA Section 608 certification covers handling of refrigerants in closed-loop systems
- Existing EPA 608 certifications (Types I, II, III, Universal) apply to A2L refrigerants — no separate A2L certification is required by EPA as of current rules
- Venting prohibition, recovery requirements, recordkeeping, and certification all apply to A2L under same framework

### CORRECT diagnostic / response sequence
1. **Existing EPA 608 Universal certification covers A2L refrigerants under EPA regulations.**
2. However: A2L-specific safety training is strongly recommended and increasingly required by manufacturers for warranty compliance.
3. Some manufacturers void warranties if A2L service is performed without documented A2L-specific training.
4. Recovery and leak repair requirements apply — same EPA 608 framework.
5. **SAFETY-CRITICAL: EPA certification covers legal authorization to handle refrigerants. It does not cover the technical A2L-specific skills (tool compatibility, LFL awareness, RDS verification) — those require additional training.**

### MANDATORY protocol
- EPA 608 IS REQUIRED FOR ALL A2L REFRIGERANT WORK — EXISTING CERTIFICATION APPLIES
- ADDITIONAL A2L-SPECIFIC SAFETY TRAINING IS STRONGLY RECOMMENDED AND MAY BE REQUIRED FOR WARRANTY COMPLIANCE
- NEVER VENT A2L REFRIGERANTS — VENTING PROHIBITION APPLIES IDENTICALLY TO A2L

### Sources
- EPA 608 A2L Coverage — EPA: https://www.epa.gov/section608/regulatory-updates-section-608-refrigerant-management-regulations
- EPA 608 Compliance Guide — ServiceMag: https://www.servicemag.org/guides/refrigerant-handling-epa-608-compliance

### Mike's tone for this scenario
- "Your 608 card covers A2L legally. But EPA certification doesn't mean you know how to handle A2L safely. Get the training."

---

## SCN-SAF-075 — A2L Vacuum and Charging: Avoiding Fractionation
**Equipment / situation:** Technician charging R-454B (a zeotropic blend) for the first time. Must understand fractionation risk.

### Symptoms / readings / measurements
- R-454B is a zeotropic blend (R-32 and R-1234yf)
- Zeotropic blends can fractionate during charging — one component enters system faster than the other if charged incorrectly
- Fractionation risk: if R-32 separates from blend due to improper charging, remaining refrigerant has different flammability and performance characteristics

### CORRECT diagnostic / response sequence
1. **Charge R-454B as liquid (from liquid valve of recovery/charging cylinder) to prevent fractionation.**
2. Use flow control device to meter liquid into system at appropriate rate.
3. If charging through low-side service port (typical for topping off), introduce liquid through refrigerant management system to avoid liquid slugging compressor.
4. Do NOT charge R-454B or other zeotropic A2L blends as vapor from an upright cylinder — this causes fractionation.
5. Document charging method and amount added on work order.
6. **SAFETY-CRITICAL: Fractionated charge leaves more flammable component in cylinder and changes system behavior — adds risk and reduces performance.**

### MANDATORY protocol
- CHARGE R-454B AS LIQUID — NOT AS VAPOR FROM UPRIGHT CYLINDER
- USE CALIBRATED SCALE — CHARGE TO NAMEPLATE WEIGHT
- DOCUMENT AMOUNT CHARGED AND METHOD

### Sources
- R-454B White Paper — JCI/York: https://www.tempmaster-hvac.com/-/media/project/jci-global/york-sites/united-states-york/common-pages/residential/refrigerant-transition/jci-r454b-whitepaper.pdf
- Facts About R-32 and R-454B: https://www.r32reasons.com/docs/default-source/default-document-library/the-facts-about-r-32-and-r-454b.pdf

### Mike's tone for this scenario
- "R-454B is a blend. Charge it as liquid. Vapor from an upright cylinder fractionates the blend and changes what goes in the system."

---

## SCN-SAF-076 — A2L: What Happens to R-410A Equipment After 2025
**Equipment / situation:** Customer asks whether existing R-410A equipment needs to be replaced immediately due to EPA changes.

### Symptoms / readings / measurements
- EPA AIM Act: manufacturing/importing new R-410A residential split systems banned as of January 1, 2025
- Existing R-410A equipment: no mandatory retirement requirement — can operate for its useful life
- R-410A service refrigerant: remains available (produced, imported, reclaimed) for servicing existing equipment
- R-410A equipment installation: EPA provided enforcement discretion for pre-2025 manufactured equipment through a transition period; verify current EPA guidance for specifics

### CORRECT diagnostic / response sequence
1. Existing R-410A systems: legal to service, maintain, and recharge with R-410A.
2. R-410A refrigerant: available for service — no end date for service refrigerant production under current rules.
3. Replacement parts, compressors, coils: available for R-410A systems and will remain available for years.
4. New installations as of 2025+: new equipment is A2L (R-454B, R-32, R-466A) — contractor cannot purchase new R-410A residential split systems for new installs.
5. **Customer advice: existing R-410A equipment does not need immediate replacement. Replace at end of life with A2L equipment.**

### MANDATORY protocol
- DO NOT ADVISE CUSTOMERS THAT EXISTING R-410A EQUIPMENT MUST BE REPLACED IMMEDIATELY — THIS IS INCORRECT
- DO ADVISE THAT REPLACEMENT EQUIPMENT WILL BE A2L — TECHNICIANS SHOULD PREPARE TOOLS AND TRAINING

### Sources
- R-410A Phase-Out Timeline — AC Direct: https://www.acdirect.com/blog/r410a-phase-out-timeline-dates/
- EPA AIM Act — ACIQ: https://aciq.com/aciq-dealer-program/2025-epa-refrigerant-phase-out/

### Mike's tone for this scenario
- "Existing R-410A equipment is fine to keep running and servicing. The ban is on new equipment manufacturing, not on service or operation."

---

## SCN-SAF-077 — A2L System: Service Port and Manifold Gauge Compatibility
**Equipment / situation:** Tech using existing R-410A manifold gauge set on a new A2L system.

### Symptoms / readings / measurements
- R-410A manifold gauges use 5/16" SAE service port fittings (larger than R-22's 1/4" SAE)
- R-454B systems may use same 5/16" SAE ports as R-410A
- However: gauge set hoses must be rated for A2L use (proper seals, no potential ignition sources)
- Pressure ranges are similar between R-410A and R-454B — manifold pressure gauges may be compatible in range

### CORRECT diagnostic / response sequence
1. Verify gauge set hoses and manifold are rated for A2L refrigerants — check manufacturer's A2L compatibility statement.
2. Fitting connections should be compatible (R-410A to R-454B typically use same fittings).
3. **SAFETY-CRITICAL: Using equipment that is not rated for A2L creates a potential ignition risk from non-compatible seals or electrical connections in the manifold.**
4. Many major gauge set manufacturers have released A2L-compatible versions — confirm before using on A2L system.
5. Digital manifold sets may require firmware update for R-454B or R-32 PT data.

### MANDATORY protocol
- VERIFY GAUGE SET IS A2L COMPATIBLE BEFORE USE ON A2L SYSTEM
- UPDATE DIGITAL MANIFOLD FIRMWARE TO INCLUDE R-454B AND R-32 PT CURVES
- DO NOT USE GAUGE SET WITH UNKNOWN A2L COMPATIBILITY ON AN A2L SYSTEM

### Sources
- A2L Refrigerant Transition Guide — OxMaint: https://oxmaint.com/industries/hvac/r-454b-refrigerant-transition-guide-hvac-maintenance
- A2L Code Changes — snarsca.com: https://snarsca.com/blog/a2l-refrigerants-updates/

### Mike's tone for this scenario
- "Check your gauge set for A2L compatibility. Most new equipment ships with A2L-specific ports, and your old hoses may not be rated."

---

## SCN-SAF-078 — A2L Refrigerant Storage and Transport
**Equipment / situation:** Tech storing and transporting A2L refrigerant cylinders.

### Symptoms / readings / measurements
- A2L cylinders must be labeled and stored as mildly flammable
- Storage in vehicle: A2L cylinders should be in a ventilated area of vehicle — not in enclosed cab
- Storage in shop: away from ignition sources, in ventilated space

### CORRECT diagnostic / response sequence
1. Store A2L cylinders in ventilated space — not in enclosed rooms without ventilation.
2. Transport in cargo area of vehicle, not in enclosed cab, with adequate ventilation.
3. Keep cylinders away from heat sources (direct sunlight, heat vents) — temperature-dependent pressure increase.
4. Cylinders must be stored and transported valve-end up.
5. Do not store A2L cylinders adjacent to oxidizers or strong ignition sources.
6. **SAFETY-CRITICAL: A2L cylinders must be clearly labeled — do not mix with A1 refrigerant cylinders in storage.**

### MANDATORY protocol
- TRANSPORT A2L CYLINDERS IN VENTILATED CARGO AREA — NOT IN ENCLOSED CAB
- STORE IN VENTILATED SPACE AWAY FROM IGNITION SOURCES
- LABEL A2L CYLINDERS CLEARLY — SEGREGATE FROM A1 REFRIGERANT CYLINDERS

### Sources
- A2L Refrigerant Engineering Guide — Daikin Applied: https://tahoeweb.daikinapplied.com/api/general/DownloadDocumentByName/media/A2L%20Refrigerant%20Engineering%20Guide.pdf/

### Mike's tone for this scenario
- "A2L cylinders in the van: cargo area, ventilated, not the cab. Label everything so nobody mixes A2L with A1 cylinders."


---
# SECTION D: ELECTRICAL HAZARD SCENARIOS
---

## SCN-SAF-079 — Lockout/Tagout: HVAC Equipment Pre-Service Protocol
**Equipment / situation:** Tech preparing to service any HVAC equipment requiring access to energized components.

### Symptoms / readings / measurements
- OSHA 29 CFR 1910.147: Control of Hazardous Energy (Lockout/Tagout) standard applies to HVAC service
- All energy sources must be isolated and verified before work
- Electrical, pneumatic, mechanical, and stored energy (capacitors) must all be addressed

### CORRECT diagnostic / response sequence
1. Identify all energy sources for the equipment: electrical disconnect(s), gas supply, compressed refrigerant, gravity (suspended components).
2. Notify affected personnel of shutdown.
3. Shut down equipment using normal stopping procedure.
4. Open and lock main electrical disconnect in open (off) position. Apply personal lockout device.
5. Apply tagout tag: technician name, date, reason, contact information.
6. **SAFETY-CRITICAL: Multiple energy sources (e.g., dual-power rooftop unit) require all sources to be locked out simultaneously.**
7. Attempt normal startup to verify equipment cannot be energized — verify zero energy.
8. Check for stored energy: discharge capacitors before working on electrical components.
9. After work is complete: inspect area for personnel, remove lockout/tagout, restore in reverse order.

### MANDATORY protocol
- ALL ENERGY SOURCES MUST BE LOCKED AND TAGGED BEFORE SERVICE
- APPLY PERSONAL LOCKOUT DEVICE — NOT JUST A TAG
- VERIFY ZERO ENERGY BEFORE TOUCHING ANY ELECTRICAL COMPONENT
- DISCHARGE CAPACITORS BEFORE WORKING ON ELECTRICAL COMPONENTS

### Sources
- OSHA 29 CFR 1910.147 Lockout/Tagout: https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147
- Verifying Lockout/Tagout Status — Fluke: https://www.fluke.com/en-us/learn/blog/electrical/verifying-lockout-tagout-electrically-safe-status
- HVAC Safety Compliance — snarsca.com: https://snarsca.com/blog/hvac-safety-standards-guide-to-osha-compliance/

### Mike's tone for this scenario
- "LOTO is the law. Every energy source. Your lock, your tag, your name. Verify zero energy before your hands go near any electrical component."

---

## SCN-SAF-080 — Capacitor Discharge: Never Assume a Capacitor Is Bled
**Equipment / situation:** Tech replacing run or start capacitor on condenser or air handler. Must discharge before handling.

### Symptoms / readings / measurements
- HVAC run capacitors (370–440 VAC, 5–80 µF) and start capacitors (125–330 VAC, 88–600 µF) can retain dangerous charge
- A capacitor that has been disconnected from power can retain full charge indefinitely if not discharged
- Capacitor discharge causes severe shock, arc flash, and potential fall-from-heights injury

### CORRECT diagnostic / response sequence
1. Shut off power at disconnect and verify zero voltage at disconnect with calibrated voltage tester (test tester on known live source first, then on load side).
2. Open access panels.
3. **SAFETY-CRITICAL: Do NOT assume capacitor is discharged because system has been off. Capacitors can hold charge for hours or longer.**
4. Use a capacitor discharge tool (resistor on insulated leads, typically 15,000–25,000 ohm rated for voltage) to discharge each capacitor terminal to ground.
5. Discharge: connect tool between each terminal and ground one at a time. Hold for 10 seconds minimum per terminal.
6. Verify discharge with voltmeter across terminals — must read zero before handling.
7. Alternatively: use a bleed resistor discharge per manufacturer's guidance.
8. After confirmed discharge: handle and replace capacitor safely.
9. **Do not use a screwdriver to short capacitor terminals — this causes damaging arc flash and is not a controlled discharge.**

### MANDATORY protocol
- NEVER HANDLE A CAPACITOR WITHOUT VERIFYING DISCHARGE WITH VOLTMETER
- USE PROPER DISCHARGE TOOL — NOT A SCREWDRIVER
- DISCHARGE MUST READ ZERO VOLTS BEFORE HANDLING
- PERSONAL LOCKOUT APPLIED AT DISCONNECT BEFORE OPENING PANELS

### Sources
- OSHA Lockout/Tagout: https://www.osha.gov/control-hazardous-energy
- HVAC Capacitor Safety — OSHA Compliance: https://snarsca.com/blog/hvac-safety-standards-guide-to-osha-compliance/

### Mike's tone for this scenario
- "Capacitor is off doesn't mean capacitor is discharged. Discharge tool, verify zero, then handle. A screwdriver shortcut can put you on the floor."

---

## SCN-SAF-081 — Three-Phase Disconnect Verification: All Phases, Not Just One
**Equipment / situation:** Tech servicing commercial HVAC equipment (rooftop unit, chiller, large split system) with three-phase power.

### Symptoms / readings / measurements
- Three-phase electrical supply (typically 208V/230V or 460V/480V)
- A single-phase fault or open leg can leave significant voltage present on one or two phases even with disconnect open
- Verification must confirm all three phases are at zero before work

### CORRECT diagnostic / response sequence
1. Open and lock out all power at equipment disconnect.
2. **SAFETY-CRITICAL: Verify zero voltage on all three phase combinations: L1-L2, L2-L3, L1-L3, and each phase to ground (L1-G, L2-G, L3-G). That is six measurements.**
3. Test voltmeter on known live source before testing (verify tester is functional).
4. All six measurements must read zero before touching any component.
5. On VFD-equipped equipment: see SCN-SAF-084 for additional DC bus discharge requirements.
6. Three-phase systems often have multiple potential power feeds (e.g., control transformer also powered separately) — identify all feeds and lock all out.

### MANDATORY protocol
- SIX VOLTAGE MEASUREMENTS: L1-L2, L2-L3, L1-L3, L1-G, L2-G, L3-G — ALL MUST READ ZERO
- TEST VOLTMETER ON KNOWN LIVE SOURCE BEFORE TESTING LOAD SIDE
- ALL POWER FEEDS LOCKED OUT — NOT JUST THE MAIN DISCONNECT

### Sources
- Three-Phase Voltage Measurement for HVAC Technicians — Contracting Business: https://www.contractingbusiness.com/rob/article/20867133/for-hvac-service-technicians-three-phase-voltage-measurement-principles
- Lockout/Tagout 8 Steps — ABB: https://new.abb.com/news/detail/129861/lockout-tagout-procedures-in-8-steps

### Mike's tone for this scenario
- "Three-phase verification is six measurements. L1-L2, L2-L3, L1-L3, each phase to ground. All zero. Then you work."

---

## SCN-SAF-082 — Arc Flash Awareness: Commercial HVAC at 480V
**Equipment / situation:** Tech preparing to work on or near energized 480V electrical panel or MCC (motor control center) in commercial building.

### Symptoms / readings / measurements
- 480V commercial HVAC systems: arc flash temperatures can reach 35,000°F
- NFPA 70E requires arc flash risk assessment before any work on energized equipment
- At 480V, Category 2 PPE is typically required minimum — unless arc flash label or study specifies otherwise

### CORRECT diagnostic / response sequence
1. Inspect electrical panel for arc flash hazard label (required by NFPA 70E — must include incident energy level, PPE category, and required PPE).
2. If no arc flash label is present: do NOT work on energized panel. Contact building electrical engineer or qualified electrician.
3. If label is present: confirm your PPE meets the specified category (Category 2 = arc-rated FR clothing minimum 8 cal/cm², face shield, arc-rated hard hat, insulated gloves).
4. **SAFETY-CRITICAL: Standard work clothes do NOT protect against arc flash. Arc flash at 480V can be fatal without proper PPE.**
5. Maintain safe approach distances per NFPA 70E.
6. Whenever possible: de-energize panel before work (lockout/tagout) to eliminate arc flash risk entirely.

### MANDATORY protocol
- DO NOT WORK ON UNLABELED 480V PANELS — CONTACT BUILDING ELECTRICAL ENGINEER
- WEAR CATEGORY 2 MINIMUM ARC-RATED PPE WHEN WORKING NEAR ENERGIZED 480V EQUIPMENT
- PREFERRED: DE-ENERGIZE AND LOCK OUT BEFORE ANY WORK

### Sources
- NFPA 70E Arc Flash Standard — NFPA: https://www.nfpa.org
- Arc Flash PPE for HVAC at 480V — Mike Holt Forums: https://forums.mikeholt.com/threads/arc-flash-ppe-for-hvac-work-480v.149669/
- The Case of the Deadly Arc Flash — EC&M: https://www.ecmweb.com/safety/arc-flash/article/20898038/the-case-of-the-deadly-arc-flash

### Mike's tone for this scenario
- "No arc flash label on the panel — do not open it. That's not being overcautious, that's staying alive. Get the label first."

---

## SCN-SAF-083 — Tingle Voltage: Grounding and Bonding Fault Diagnosis
**Equipment / situation:** Customer reports mild shock when touching HVAC equipment or adjacent metal. Tech investigating.

### Symptoms / readings / measurements
- Tingle voltage: small but perceptible AC voltage present on equipment casing
- Indicates faulty grounding or bonding in electrical system
- Equipment ground wire may be missing, broken, or improperly connected

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Tingle voltage indicates a wiring fault. A small tingle can become a lethal shock if the fault develops further.**
2. Measure voltage between equipment casing and a known good ground reference (earth/water pipe) with voltmeter.
3. Any voltage above 1–2V on the casing is abnormal.
4. Trace ground wire: verify equipment is properly grounded at disconnect panel.
5. Inspect ground wire from equipment to panel — check for corrosion, loose connections, or missing bonding jumper.
6. Verify equipment is bonded to main service ground per NEC requirements.
7. **Do not leave equipment in service with tingle voltage — notify homeowner, shut down, and tag until ground fault is repaired.**
8. If grounding issue is traced to main service panel: this is an electrical contractor job, not HVAC tech scope.

### MANDATORY protocol
- ANY TINGLE VOLTAGE: SHUT DOWN EQUIPMENT AND TAG "UNSAFE — GROUNDING FAULT"
- DO NOT LEAVE EQUIPMENT IN SERVICE WITH TINGLE VOLTAGE
- REFER TO ELECTRICAL CONTRACTOR FOR MAIN SERVICE GROUNDING ISSUES

### Sources
- HVAC Grounding and Bonding Essentials — NumberAnalytics: https://www.numberanalytics.com/blog/hvac-grounding-bonding-essentials
- OSHA Lockout/Tagout: https://www.osha.gov/control-hazardous-energy

### Mike's tone for this scenario
- "Tingle means a grounding fault is present right now. Shut it off. Tag it. A tingle today can be 240 volts tomorrow."

---

## SCN-SAF-084 — VFD Service: DC Bus Discharge Before Work
**Equipment / situation:** Tech servicing HVAC equipment with a Variable Frequency Drive (VFD) on fan motor or compressor. Must wait for DC bus to discharge.

### Symptoms / readings / measurements
- VFDs contain internal capacitor banks on DC bus
- DC bus voltage: typically 650–700V DC on 480V input systems
- DC bus capacitors retain lethal charge for minutes after main power is disconnected
- Typical safe discharge time: 5–15 minutes (per OEM manual) — some large drives require longer

### CORRECT diagnostic / response sequence
1. Shut off main power at disconnect and lock out.
2. **SAFETY-CRITICAL: Wait the full discharge time specified in the VFD manufacturer's manual before opening the drive enclosure. Minimum 5 minutes; verify with OEM manual for drive-specific requirements.**
3. After waiting: measure DC bus voltage with appropriate rated meter between DC+ and DC- terminals (shown in drive manual).
4. DC bus must read below 50V DC before internal components are touched.
5. If DC bus has not reached below 50V after waiting: do NOT open enclosure — capacitor may be failing (this is a secondary hazard).
6. After confirmed discharge: work within drive, observe PPE per NFPA 70E.

### MANDATORY protocol
- WAIT FULL OEM-SPECIFIED DISCHARGE TIME AFTER REMOVING POWER — MINIMUM 5 MINUTES
- MEASURE DC BUS VOLTAGE — MUST BE BELOW 50V BEFORE TOUCHING INTERNAL COMPONENTS
- DO NOT TRUST TIME ALONE — VERIFY WITH METER

### Sources
- VFD DC Bus Discharge Safety — UNITEC: https://www.unitecd.com/variable-frequency-drive-vfd-preventive-maintenance-fan-cleaning-capacitor-inspection-and-firmware-updates/
- NFPA 70E Electrical Safety Standard
- ClimateMaster VFD Operation Manual: https://files.climatemaster.com/97B0001N13-VFD-Drive-IOM.pdf

### Mike's tone for this scenario
- "VFD power off doesn't mean DC bus is safe. Wait the manual's specified time, then measure the bus. Below 50V DC before you touch anything inside."

---

## SCN-SAF-085 — Multi-Source HVAC Equipment: All Disconnects Identified
**Equipment / situation:** Commercial rooftop unit or air handler with multiple power sources (main power, separate control circuit transformer, economizer circuit, CO2 demand control sensors powered separately).

### Symptoms / readings / measurements
- Equipment has main power disconnect
- Control circuit may be powered from a separate breaker in main building panel
- Economizer or VAV controls may have dedicated 24V or 120V power
- All must be identified and locked out

### CORRECT diagnostic / response sequence
1. Review equipment wiring diagram before lockout — identify all power source entry points.
2. Typical on commercial RTU: main 460V three-phase disconnect, 120V control circuit breaker (often at separate panel), possibly BMS 24V communication power.
3. Lock out all identified sources.
4. Verify zero voltage at each source independently.
5. **SAFETY-CRITICAL: Partial lockout leaving one circuit energized is a common cause of electrical injury in commercial HVAC. Always use the wiring diagram.**
6. Never rely solely on the main disconnect for complex multi-source equipment.

### MANDATORY protocol
- USE WIRING DIAGRAM TO IDENTIFY ALL POWER SOURCES BEFORE LOCKOUT
- LOCK OUT EVERY IDENTIFIED SOURCE
- VERIFY ZERO VOLTAGE AT EACH SOURCE INDEPENDENTLY

### Sources
- OSHA 29 CFR 1910.147: https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147
- Lockout/Tagout 8 Steps — ABB: https://new.abb.com/news/detail/129861/lockout-tagout-procedures-in-8-steps

### Mike's tone for this scenario
- "Pull the wiring diagram first. Multi-source equipment has sources that are easy to miss. Every source gets a lock."

---

## SCN-SAF-086 — Electrical Shock Response: What the Technician Does
**Equipment / situation:** Co-worker or customer receives electrical shock on job site. Technician is first responder.

### Symptoms / readings / measurements
- Person was in contact with energized equipment
- May appear stunned, unconscious, or have burns at contact points
- Secondary hazard: victim may still be in contact with energized source

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Do NOT touch the victim if they may still be in contact with an energized source — you will become a second victim.**
2. Shut off power at disconnect immediately — do not pull the person.
3. Once confirmed power is off: call 911 immediately.
4. Begin first aid / CPR if trained and if victim is not breathing.
5. Keep victim still — spinal injury possible from fall after shock.
6. Electrical shock victims can have internal injuries not visible externally — all electrical shock victims require emergency medical evaluation even if they appear okay.
7. Do not leave the scene until EMS arrives.

### MANDATORY protocol
- DO NOT TOUCH VICTIM WHILE ENERGIZED SOURCE IS PRESENT — SHUT POWER OFF FIRST
- CALL 911 IMMEDIATELY AFTER POWER IS OFF
- ALL ELECTRICAL SHOCK VICTIMS REQUIRE EMS EVALUATION — NO EXCEPTIONS

### Sources
- OSHA Electrical Safety: https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.333
- OSHA HVAC Safety Compliance: https://snarsca.com/blog/hvac-safety-standards-guide-to-osha-compliance/

### Mike's tone for this scenario
- "Power off before you touch them. Then 911 immediately. An electrical shock victim who says they're fine still needs EMS."

---

## SCN-SAF-087 — Rooftop Work: Electrical and Fall Hazards Combined
**Equipment / situation:** Tech servicing rooftop RTU. Fall hazard at roof edge combined with electrical hazard at unit.

### Symptoms / readings / measurements
- OSHA fall protection required for work at heights — any work within 6 feet of unprotected roof edge requires fall protection (29 CFR 1926.502 for construction; general industry equivalent)
- RTU panels have high-voltage sections that must be locked out
- Wet roof surfaces increase both fall and electrical risk

### CORRECT diagnostic / response sequence
1. Assess roof conditions before proceeding — wet or icy surfaces require additional precaution or rescheduling.
2. Identify fall hazards — roof edge, skylights, HVAC curb gaps.
3. Apply lockout/tagout at roof disconnect or building disconnect before opening any RTU electrical panel.
4. Verify zero voltage at all three phases before working inside electrical section.
5. Maintain minimum 6-foot distance from unprotected roof edge or use fall arrest system.
6. **SAFETY-CRITICAL: Do not kneel or lean over open electrical panel on a wet rooftop — slip risk combined with energized components.**
7. Park service vehicle or mark fall hazard zones per company safety program.

### MANDATORY protocol
- FALL PROTECTION WITHIN 6 FEET OF UNPROTECTED ROOF EDGE
- LOCKOUT ALL RTU POWER BEFORE OPENING ELECTRICAL PANELS
- DO NOT WORK ON WET OR ICY ROOFTOP SURFACES WITHOUT ADDITIONAL SAFETY MEASURES

### Sources
- OSHA HVAC Safety Compliance: https://snarsca.com/blog/hvac-safety-standards-guide-to-osha-compliance/
- OSHA Lockout/Tagout: https://www.osha.gov/control-hazardous-energy

### Mike's tone for this scenario
- "Rooftop is two hazards at once. Six feet from the edge, lock out the RTU, and don't kneel over live panels on a wet roof."

---

## SCN-SAF-088 — Electrical Panel Phasing: Verifying Before Multi-Stage Equipment Connection
**Equipment / situation:** Tech installing or reconnecting multi-stage or multi-speed commercial HVAC equipment (chillers, large fan coil units, three-phase compressors).

### Symptoms / readings / measurements
- Three-phase equipment must have correct phase rotation for compressors
- Wrong phase rotation on scroll or reciprocating compressor causes backward rotation — immediate compressor damage or failure
- Phase rotation tester (phase sequence indicator) required

### CORRECT diagnostic / response sequence
1. Before energizing new three-phase HVAC equipment: measure voltage and verify phase rotation at disconnect.
2. Use phase sequence / rotation tester to verify L1-L2-L3 rotation matches equipment requirement (typically ABC or 1-2-3 forward rotation).
3. If rotation is wrong: swap any two phase conductors at disconnect to reverse rotation.
4. Verify rotation again after swap.
5. **SAFETY-CRITICAL: Energizing a scroll compressor with wrong phase rotation causes damage within seconds. Verify phase rotation before startup.**
6. Document phase rotation verification on commissioning paperwork.

### MANDATORY protocol
- VERIFY PHASE ROTATION WITH TESTER BEFORE ENERGIZING THREE-PHASE COMPRESSOR EQUIPMENT
- SWAP TWO CONDUCTORS TO CORRECT WRONG ROTATION — NEVER SWAP AT THE COMPRESSOR
- DOCUMENT PHASE ROTATION VERIFICATION ON COMMISSIONING RECORD

### Sources
- Three-Phase Voltage Measurement — Contracting Business: https://www.contractingbusiness.com/rob/article/20867133/for-hvac-service-technicians-three-phase-voltage-measurement-principles
- OSHA Electrical Safety: https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.333

### Mike's tone for this scenario
- "Phase rotation tester before you start any three-phase compressor. Backward scroll compressor doesn't make noise — it just dies."

---

## SCN-SAF-089 — High-Voltage Capacitor Bank on Chiller or Large Commercial Unit
**Equipment / situation:** Tech servicing large commercial chiller or packaged DX unit with large capacitor bank (power factor correction or motor start capacitors rated at kilovars).

### Symptoms / readings / measurements
- Large commercial capacitors can store significantly more energy than residential run capacitors
- Discharge must be performed with rated discharge equipment — simple resistor discharge tools used for residential may be inadequate for large commercial capacitors
- Some commercial capacitors require dedicated shorting bars or manufacturer-specified discharge procedure

### CORRECT diagnostic / response sequence
1. Identify capacitor type and voltage/capacitance rating from equipment documentation.
2. Locate and apply lockout/tagout at all power sources.
3. Wait the manufacturer-specified discharge time.
4. Use manufacturer-specified discharge procedure — may require rated discharge resistor assembly, shorting bar, or dedicated discharge circuit.
5. **SAFETY-CRITICAL: Do not use residential capacitor discharge tools on large commercial capacitor banks without verifying tool is rated for the energy level.**
6. Verify zero voltage at capacitor terminals with rated voltmeter before handling.

### MANDATORY protocol
- USE MANUFACTURER-SPECIFIED DISCHARGE PROCEDURE FOR LARGE COMMERCIAL CAPACITORS
- VERIFY ZERO VOLTAGE WITH RATED METER BEFORE HANDLING
- DO NOT APPLY UNDERSIZED DISCHARGE TOOL TO LARGE COMMERCIAL CAPACITOR BANK

### Sources
- OSHA Lockout/Tagout: https://www.osha.gov/control-hazardous-energy
- VFD/Capacitor Safety — UNITEC: https://www.unitecd.com/variable-frequency-drive-vfd-preventive-maintenance-fan-cleaning-capacitor-inspection-and-firmware-updates/

### Mike's tone for this scenario
- "Large commercial capacitor bank is not the same as a residential run cap. Use the manufacturer's discharge procedure and verify zero volts."

---

## SCN-SAF-090 — Damaged Wiring: When Not to Restore Power
**Equipment / situation:** Tech finds damaged, burnt, or rodent-chewed wiring in HVAC equipment. Determining whether to restore power.

### Symptoms / readings / measurements
- Burnt insulation on wiring harness
- Rodent chewing damage to wires (exposed conductors touching chassis or each other)
- Water-damaged control board or terminal strip with corroded or carbonized terminals

### CORRECT diagnostic / response sequence
1. **SAFETY-CRITICAL: Do not restore power to equipment with damaged, exposed, or burned wiring. This is both a shock hazard and a fire risk.**
2. Document all damaged wiring: photograph, describe damage location and extent.
3. Repair damaged wiring per manufacturer wiring diagram — use correct wire gauge, insulation rating, and connector type.
4. Do not use non-rated wire or improper splice connectors as expedient repairs.
5. After repair: inspect for any other signs of damage (burn marks on chassis, tripped breakers, melted components).
6. Test with appropriate instrumentation before restoring to service.
7. Notify customer of cause of damage (rodents, moisture, overheating) and recommend preventive measures.

### MANDATORY protocol
- DO NOT RESTORE POWER WITH DAMAGED, EXPOSED, OR BURNED WIRING PRESENT
- REPAIR TO MANUFACTURER WIRING DIAGRAM SPECIFICATION
- DOCUMENT DAMAGE AND CAUSE ON WORK ORDER

### Sources
- OSHA Electrical Safety: https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.333

### Mike's tone for this scenario
- "Burnt wiring gets fixed before power goes back on. No expedient repairs. Document the damage and tell the customer what caused it."

---

## SCN-SAF-091 — Ground Fault vs. Short Circuit: Diagnosis Without Assumptions
**Equipment / situation:** Breaker trips immediately when equipment is energized. Tech diagnosing whether ground fault or short circuit.

### Symptoms / readings / measurements
- Breaker trips on close, or immediately on startup
- Cannot determine without measurement whether it is a ground fault (to ground/chassis) or short circuit (line-to-line)
- Tripped safety suggests a direct or low-impedance fault

### CORRECT diagnostic / response sequence
1. Shut off and lock out power before any wiring investigation.
2. With power off: use insulation resistance (megohm) tester to measure insulation integrity.
3. Test each conductor to ground: normal reading typically 10+ megohms; near-zero indicates ground fault.
4. Test conductor to conductor (L1-L2, L1-L3, L2-L3): near-zero indicates short circuit.
5. Identify fault location by sectional isolation — disconnect loads one at a time and retest.
6. **SAFETY-CRITICAL: Never close a breaker on a faulted circuit to "test" — this can cause arc flash, fire, or equipment destruction.**
7. Repair fault and re-test insulation resistance before restoring power.

### MANDATORY protocol
- NEVER CLOSE BREAKER ON SUSPECTED FAULTED CIRCUIT TO TEST
- USE MEGOHMETER TO IDENTIFY FAULT TYPE AND LOCATION WITH POWER OFF
- REPAIR FAULT AND VERIFY INSULATION RESISTANCE BEFORE RESTORING POWER

### Sources
- OSHA Electrical Safety: https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.333

### Mike's tone for this scenario
- "Never close a breaker to test a faulted circuit. Pull the sections apart, use the megohm meter, find the fault. Then fix it."

---

## SCN-SAF-092 — Working Alone on Electrical Systems: Heightened Risk Awareness
**Equipment / situation:** Tech working alone on commercial electrical HVAC work without a partner.

### Symptoms / readings / measurements
- OSHA recommends a second person within sight and hearing when working on potentially hazardous electrical systems
- Working alone eliminates the ability to receive help if shocked or injured

### CORRECT diagnostic / response sequence
1. Evaluate hazard level of work — de-energized and verified work has reduced risk; energized work significantly higher.
2. Whenever possible, de-energize and lock out equipment before working alone.
3. If energized work is unavoidable: notify a second person of your location and work plan, establish check-in intervals.
4. Never perform energized work on high-voltage systems alone without a safety observer or approved safety plan.
5. **SAFETY-CRITICAL: If you are shocked and incapacitated while working alone at height or near open equipment, there may be no one to call for help. Plan accordingly.**
6. Use personal safety device (man-down alarm or scheduled check-in communication) on solo high-risk electrical work.

### MANDATORY protocol
- DE-ENERGIZE WHENEVER POSSIBLE BEFORE WORKING ALONE
- FOR ANY ENERGIZED WORK ALONE: NOTIFY ANOTHER PERSON OF LOCATION, WORK PLAN, AND CHECK-IN SCHEDULE
- CONSIDER MAN-DOWN ALARM FOR SOLO HIGH-RISK ELECTRICAL WORK

### Sources
- OSHA Control of Hazardous Energy: https://www.osha.gov/control-hazardous-energy
- OSHA HVAC Safety Compliance: https://snarsca.com/blog/hvac-safety-standards-guide-to-osha-compliance/

### Mike's tone for this scenario
- "Working alone on electrical — at minimum, someone knows where you are and you have a check-in time. Shocked and alone means no help."


---
# SECTION E: REFRIGERANT TRANSITIONS / EPA 608 SCENARIOS
---

## SCN-SAF-093 — R-22 Phase-Out: Current Availability and Service Reality
**Equipment / situation:** Tech servicing a legacy R-22 system. Customer asking about refrigerant availability and cost.

### Symptoms / readings / measurements
- R-22 production and import banned in the U.S. since January 1, 2020 (EPA Clean Air Act)
- Available supply: only reclaimed/recycled R-22 or pre-ban stockpiles
- Price direction: significantly higher than a decade ago, increasing as stockpiles deplete
- Supply variability: regional shortages possible especially during peak cooling season

### CORRECT diagnostic / response sequence
1. R-22 system with leak: follow normal EPA 608 recovery and leak repair procedures.
2. Recover all refrigerant before servicing (EPA venting prohibition applies).
3. Repair leak first — do not recharge a leaking system.
4. After repair: consider recommending system replacement vs. continued R-22 service to customer.
5. **Advise customer: R-22 availability will continue to decrease and price will continue to increase over time as reclaimed stockpiles deplete. System replacement is the long-term solution.**
6. No new R-22 equipment can be manufactured or imported — this is a legacy service only.
7. Document refrigerant type, amount recovered, and amount recharged on service record (EPA requirement).

### MANDATORY protocol
- RECOVER R-22 PER EPA 608 — NEVER VENT
- REPAIR LEAK BEFORE RECHARGING
- ADVISE CUSTOMER IN WRITING OF LONG-TERM R-22 AVAILABILITY CHALLENGE
- DOCUMENT REFRIGERANT AMOUNTS ON SERVICE RECORD

### Sources
- R-22 Availability and Pricing — Trane: https://www.trane.com/residential/en/resources/blog/is-r22-refrigerant-still-available/
- R-22 Phase-Out — ACIQ: https://aciq.com/aciq-dealer-program/2025-epa-refrigerant-phase-out/
- EPA Section 608 Recovery: https://www.epa.gov/section608/regulatory-updates-section-608-refrigerant-management-regulations

### Mike's tone for this scenario
- "R-22 is reclaim-only. Recover everything, fix the leak, then tell the customer the truth about where R-22 prices are headed."

---

## SCN-SAF-094 — R-410A Service: Current Rules and What Technicians Can Do
**Equipment / situation:** Tech servicing an existing R-410A system that was installed before the 2025 cutoff.

### Symptoms / readings / measurements
- R-410A new equipment manufacturing banned January 1, 2025 (residential split systems)
- Existing R-410A equipment: fully legal to service, maintain, and recharge
- R-410A service refrigerant: remains available for purchase (virgin and reclaimed) for maintaining existing equipment
- No end date for R-410A service refrigerant production currently established

### CORRECT diagnostic / response sequence
1. Service existing R-410A equipment normally — EPA rules allow full service of installed equipment.
2. Recover refrigerant before service (EPA 608 venting prohibition).
3. Repair leak before recharging (EPA 608 leak repair requirements apply to systems 50 lbs+).
4. Recharge with R-410A — do NOT mix R-454B or any other refrigerant.
5. Document refrigerant amounts on service record.
6. **Price direction: R-410A pricing expected to rise as production allowances tighten under AIM Act. Reclaimed R-410A will play a growing role in supply.**
7. Advise customer: when system is replaced, replacement will be A2L equipment.

### MANDATORY protocol
- R-410A SERVICE ON EXISTING EQUIPMENT IS FULLY PERMITTED — DO NOT ADVISE OTHERWISE
- NEVER MIX REFRIGERANT TYPES
- DOCUMENT ALL REFRIGERANT AMOUNTS ON SERVICE RECORD

### Sources
- R-410A Phase-Out — AC Direct: https://www.acdirect.com/blog/r410a-phase-out-timeline-dates/
- EPA AIM Act R-410A Rules — ACIQ: https://aciq.com/aciq-dealer-program/2025-epa-refrigerant-phase-out/

### Mike's tone for this scenario
- "R-410A equipment is fully serviceable. The ban is on new equipment manufacturing. Tell the customer when they replace it, it'll be A2L."

---

## SCN-SAF-095 — EPA 608 Leak Repair Thresholds: Commercial Refrigeration
**Equipment / situation:** Tech servicing large commercial refrigeration system (supermarket, cold storage). System charge is above 50 lbs. Measuring leak rate.

### Symptoms / readings / measurements
- Commercial refrigeration systems above 50 lbs of ODS refrigerant: EPA Section 608 leak repair thresholds apply
- Commercial refrigeration: leak rate threshold = 20% per year (triggers mandatory repair)
- Comfort cooling systems: leak rate threshold = 10% per year
- Industrial process refrigeration: 30% per year
- Repair must be made within 30 days of exceeding trigger rate, OR a retrofit/retirement plan developed within 30 days and completed within 1 year

### CORRECT diagnostic / response sequence
1. Calculate leak rate: (amount added in past 12 months ÷ full charge) × 100 = leak rate %.
2. If leak rate exceeds threshold: mandatory repair within 30 days.
3. Locate and repair leak.
4. Perform initial and follow-up verification tests after repair.
5. **SAFETY-CRITICAL for compliance: If system exceeds threshold and repair is not made within timeline: owner/operator is in violation of EPA Section 608.**
6. Record keeping: document all refrigerant additions, repairs, and verification tests.
7. For HFC refrigerants in systems ≥15 lbs: HFC-specific leak repair requirements under 2024 EPA AIM Act rule also apply.

### MANDATORY protocol
- CALCULATE LEAK RATE AND DOCUMENT IT ON SERVICE RECORD
- IF THRESHOLD EXCEEDED: REPAIR WITHIN 30 DAYS OR DEVELOP RETROFIT/RETIREMENT PLAN
- PERFORM AND DOCUMENT VERIFICATION TESTS AFTER REPAIR
- MAINTAIN SERVICE RECORDS FOR ALL REFRIGERANT ADDITIONS

### Sources
- EPA Section 608 Leak Repair Requirements: https://www.epa.gov/section608/stationary-refrigeration-leak-repair-requirements
- EPA Refrigerant Management Program Q&A: https://www.epa.gov/section608/epas-refrigerant-management-program-questions-and-answers-section-608-certified-technicians

### Mike's tone for this scenario
- "Track refrigerant additions on commercial systems. If the math says you've exceeded the threshold, the clock starts now. Thirty days to repair or develop a plan."

---

## SCN-SAF-096 — EPA 608 Venting Prohibition: What Counts as a Violation
**Equipment / situation:** Tech needs to understand what constitutes illegal venting under EPA Section 608.

### Symptoms / readings / measurements
- Venting prohibition covers all refrigerants in Section 608 systems: CFCs, HCFCs, HFCs, and now A2L refrigerants
- Deliberate venting of refrigerant to atmosphere is a federal violation — civil penalties up to $44,539 per day per violation
- De minimis quantities released during good-faith attempts to recover are not violations
- Venting prohibition applies even if refrigerant quantity is small

### CORRECT diagnostic / response sequence
1. **Any deliberate release of refrigerant to atmosphere is a violation — regardless of refrigerant type, charge size, or age of equipment.**
2. Recovery equipment must be used before opening any system with 5 lbs or more of refrigerant for service or disposal.
3. Small amounts released during proper connection/disconnection of manifold gauges are de minimis and not violations.
4. **SAFETY-CRITICAL for tech: Venting is not just an environmental issue — it is a federal criminal violation. Fines apply per day per violation.**
5. Use low-loss fittings on manifold hoses to minimize de minimis releases.
6. Document all refrigerant recovered on service records.

### MANDATORY protocol
- NEVER DELIBERATELY VENT REFRIGERANT — CIVIL PENALTY UP TO $44,539 PER DAY PER VIOLATION
- RECOVER ALL REFRIGERANT BEFORE OPENING ANY SYSTEM FOR SERVICE OR DISPOSAL
- DOCUMENT AMOUNTS RECOVERED ON EVERY SERVICE RECORD

### Sources
- EPA Section 608 Regulatory Updates: https://www.epa.gov/section608/regulatory-updates-section-608-refrigerant-management-regulations
- EPA 608 Compliance Guide — ServiceMag: https://www.servicemag.org/guides/refrigerant-handling-epa-608-compliance

### Mike's tone for this scenario
- "Venting is a federal violation. Every time. Every refrigerant type. Use the recovery machine and document what you pulled."

---

## SCN-SAF-097 — Refrigerant Recovery: Vacuum Level Requirements and Documentation
**Equipment / situation:** Tech recovering refrigerant from HFC system before service or disposal.

### Symptoms / readings / measurements
- EPA 608 establishes minimum recovery vacuum requirements based on system size and refrigerant type
- Systems below 200 lbs refrigerant: recover to 10 inches Hg vacuum (before July 2018 equipment) or use approved recovery efficiency
- Systems 200 lbs or more: recover to 15 inches Hg vacuum
- Recovery must be documented for systems with 5–50 lbs charge (disposal) and all large systems

### CORRECT diagnostic / response sequence
1. Connect recovery machine per manufacturer instructions.
2. Recover refrigerant to required vacuum level per system size.
3. Weigh or measure recovered refrigerant — record on service ticket.
4. For systems 5–50 lbs being disposed: record refrigerant amount recovered.
5. For commercial systems above 50 lbs: maintain full service records of all refrigerant added and recovered.
6. **SAFETY-CRITICAL for compliance: Recovery to insufficient vacuum level is a violation. Equipment must be certified per AHRI 740.**
7. Recovery cylinder must be correct type for refrigerant being recovered — A2L requires A2L-rated cylinder.

### MANDATORY protocol
- RECOVER TO REQUIRED VACUUM LEVEL — 10" Hg (<200 lbs) OR 15" Hg (200+ lbs)
- DOCUMENT AMOUNT RECOVERED ON EVERY SERVICE TICKET
- USE CERTIFIED RECOVERY MACHINE (AHRI 740)
- USE CORRECT RECOVERY CYLINDER FOR REFRIGERANT TYPE

### Sources
- EPA Section 608 Recovery Requirements: https://www.epa.gov/section608/regulatory-updates-section-608-refrigerant-management-regulations
- EPA 608 Type 2 Study Guide — EPA608PracticeTest: https://epa608practicetest.net/study-guide-type-2.html

### Mike's tone for this scenario
- "Recovery vacuum requirements are part of your 608 cert. Document the amount. Use the right cylinder. Certification covers the legal obligation — the documentation proves you followed it."

---

## SCN-SAF-098 — R-404A and R-507A: Commercial Refrigeration High-GWP Phase-Down
**Equipment / situation:** Tech servicing commercial refrigeration (walk-in cooler, display case) using R-404A or R-507A. AIM Act phase-down impacts these refrigerants.

### Symptoms / readings / measurements
- R-404A (GWP 3,922) and R-507A (GWP 3,985) are among the highest-GWP refrigerants in widespread use
- AIM Act phase-down tightens HFC production allowances — R-404A and R-507A specifically targeted
- Price direction: higher as production allowances shrink — similar trajectory to R-22 (less severe, but same direction)
- EPA HFC-specific rules under AIM Act: systems ≥15 lbs with GWP >53 now subject to new recordkeeping and leak repair requirements

### CORRECT diagnostic / response sequence
1. Service existing R-404A/R-507A equipment — fully legal for existing systems.
2. Follow EPA 608 venting prohibition and recovery requirements.
3. For systems ≥15 lbs: new HFC-specific leak repair requirements under 2024 EPA rule apply (commercial refrigeration threshold: 20% per year).
4. Advise customer: replacement refrigerants (R-448A, R-449A) are available as servicing alternatives for R-404A equipment — consult manufacturer approval before converting.
5. **Not a drop-in: any refrigerant conversion requires manufacturer approval, correct lubricant compatibility check, and full system service.**
6. Document all refrigerant amounts and type per EPA 608 and AIM Act recordkeeping requirements.

### MANDATORY protocol
- DOCUMENT ALL R-404A/R-507A ADDITIONS AND RECOVERIES — AIM ACT RECORDKEEPING APPLIES
- REPAIR LEAKS PER EPA THRESHOLD (20% FOR COMMERCIAL REFRIGERATION, 50+ LBS)
- ANY REFRIGERANT CONVERSION: CONSULT MANUFACTURER — NOT A FIELD DECISION

### Sources
- EPA Section 608 Updates: https://www.epa.gov/section608/regulatory-updates-section-608-refrigerant-management-regulations
- EPA AIM Act HFC Changes — facilio.com: https://facilio.com/blog/epa-refrigerant-regulations/
- New EPA Refrigerant Regulations — Womble Bond Dickinson: https://www.womblebonddickinson.com/us/insights/alerts/keep-your-cool-epa-expands-requirements-address-leaks-climate-super-pollutant-hydrofluorocarbons-from-refrigerant-containing-appliances

### Mike's tone for this scenario
- "R-404A and R-507A are in the crosshairs of the AIM Act. Track refrigerant additions, fix leaks at the threshold, and document everything."

---

## SCN-SAF-099 — Refrigerant Disposal and Reclaim: Prohibited Methods
**Equipment / situation:** Tech with recovered refrigerant that cannot be returned to the original system (equipment being scrapped). Proper disposal pathway.

### Symptoms / readings / measurements
- Recovered refrigerant cannot be legally vented or discarded in household trash
- Options: return to certified reclaimer, send to manufacturer's reclamation program, or properly dispose via licensed hazardous waste handler if contaminated
- Cylinders with contaminated refrigerant must be labeled "contaminated" and managed separately

### CORRECT diagnostic / response sequence
1. Recovered clean refrigerant: store in labeled recovery cylinder, return to supplier or send to certified reclaimer.
2. Contaminated refrigerant (mixed with wrong oil, mixed refrigerant, moisture-contaminated): label cylinder as contaminated, send to certified reclaimer — do not mix with clean cylinders.
3. Empty refrigerant cylinders: do not re-use recovery cylinders as shipping containers for other materials. Follow DOT requirements for cylinder disposal.
4. **SAFETY-CRITICAL for compliance: Discarding refrigerant by any means other than reclamation is a violation of EPA Section 608. Dumping refrigerant is a federal crime.**
5. Document refrigerant type, amount, and reclaim destination on service records.

### MANDATORY protocol
- RETURN ALL RECOVERED REFRIGERANT TO CERTIFIED RECLAIMER OR SUPPLIER
- LABEL CONTAMINATED CYLINDERS SEPARATELY — DO NOT MIX WITH CLEAN RECOVERY
- DOCUMENT REFRIGERANT DISPOSITION ON SERVICE RECORDS

### Sources
- EPA Section 608 Recovery and Reclaim: https://www.epa.gov/section608/regulatory-updates-section-608-refrigerant-management-regulations
- EPA Refrigerant Q&A: https://www.epa.gov/section608/epas-refrigerant-management-program-questions-and-answers-section-608-certified-technicians

### Mike's tone for this scenario
- "Recovered refrigerant goes to a reclaimer. Contaminated cylinders get labeled separately. Dumping is a federal crime. No shortcuts."

---

## SCN-SAF-100 — Refrigerant Recordkeeping: EPA 608 Documentation Requirements
**Equipment / situation:** Tech ensuring service records meet EPA 608 and AIM Act recordkeeping requirements.

### Symptoms / readings / measurements
- EPA 608 requires technicians and appliance owners to maintain service records
- Systems above 50 lbs of ODS refrigerant: owner must maintain records of refrigerant added and removed for each servicing
- Systems 5–50 lbs being disposed: technician must keep record of amount recovered
- AIM Act extension: systems ≥15 lbs of HFC with GWP >53 also subject to new recordkeeping

### CORRECT diagnostic / response sequence
1. On every refrigerant service call: record refrigerant type, amount added, amount recovered, date, system identification, and technician name.
2. For commercial systems above 50 lbs: records must be kept by appliance owner for the life of the appliance.
3. Technician must provide the owner with service records for their files.
4. If leak repair is performed: document date leak exceeded threshold, repair performed, verification tests completed.
5. **SAFETY-CRITICAL for compliance: Failure to maintain records is a separate violation from venting — fines apply independently.**
6. Best practice: use service software or paper ticket that captures all required fields on every refrigerant service call.

### MANDATORY protocol
- DOCUMENT REFRIGERANT TYPE, AMOUNT ADDED AND RECOVERED, DATE, AND SYSTEM ID ON EVERY SERVICE TICKET
- PROVIDE OWNER COPY OF SERVICE RECORD FOR COMMERCIAL SYSTEMS ABOVE 50 LBS
- DOCUMENT LEAK REPAIR WITH THRESHOLD DATE, REPAIR DATE, AND VERIFICATION TEST RESULTS

### Sources
- EPA Section 608 Recordkeeping: https://www.epa.gov/section608/regulatory-updates-section-608-refrigerant-management-regulations
- EPA Refrigerant Management Q&A: https://www.epa.gov/section608/epas-refrigerant-management-program-questions-and-answers-section-608-certified-technicians

### Mike's tone for this scenario
- "Refrigerant paperwork is not optional. EPA recordkeeping is a separate legal requirement from the venting prohibition. Document everything on every call."

---

*End of scenario library v3 — Safety-Critical and Refrigerant Transitions*

---

```
TOTAL SCENARIOS: 100
GAS SCENARIOS: 42 (SCN-SAF-001 through SCN-SAF-042)
CO SCENARIOS: 18 (SCN-SAF-043 through SCN-SAF-060)
A2L SCENARIOS: 18 (SCN-SAF-061 through SCN-SAF-078)
ELECTRICAL SCENARIOS: 14 (SCN-SAF-079 through SCN-SAF-092)
REFRIGERANT-TRANSITION SCENARIOS: 8 (SCN-SAF-093 through SCN-SAF-100)
SOURCES CITED: 48 distinct URLs
```
