# Mike Quality Testing — Scenario Library v3 (Commercial HVAC)
# Scenarios 31–130 — RTU/Packaged, VRF/VRV, Chillers, WSHP, A2L Commercial

Covers: RTU packaged commercial, VRF/VRV systems, ductless commercial, small/mid chillers, WSHP, A2L commercial gear.
Scenario numbering continues from v2 (v1: 1–12, v2: 13–30, v3-commercial: 31–130).

---

## SCENARIO 31 — Carrier RTU high-pressure trip, single-circuit commercial

**Symptom (verbatim):** "Carrier 48HC rooftop, 10-ton. Tripping high-pressure lockout, won't reset. Condenser looks clean."

**Equipment:** Carrier WeatherMaster 48HC commercial packaged RTU, R-410A, 10-ton.

**Correct diagnostic path:**
1. Check discharge pressure — HP cutout on Carrier 48HC typically trips at 610 psig R-410A
2. Verify outdoor ambient temperature and check condenser fan operation — all motors running, correct rotation
3. Condenser coil visual "looks clean" is not sufficient — use fin comb and flashlight, check for mud dauber nests in the lower plenum
4. Check subcooling — should be 10–15°F; if 20°F+ suspect overcharge or non-condensables
5. Confirm refrigerant charge was not recently topped off — overcharge is common after inexperienced service call
6. Inspect condenser fan blades for pitch and damage
7. Measure condenser fan motor amperage vs. nameplate
8. If fan OK and coil clean: check for non-condensables (nitrogen test)
9. Pull unit fault history from ComfortLink or Equipment Touch if equipped

**Most likely root cause:** Dirty condenser coil (mud daubers/cottonwood packed in lower section) OR refrigerant overcharge from recent top-off

**Safety flags Mike MUST mention:**
- 610 psig R-410A discharge — treat as high-pressure system; no flame leak detection
- EPA 608 required for refrigerant work
- Verify lockout-tagout before entering condenser section

**Tone/Mike notes:** Commercial tech. Skip basic stuff, go straight to systematic pressure and airflow diagnosis. "Looks clean from 10 feet doesn't mean anything — get a light in the bottom rows."

**Source:** Carrier 48HC Service Manual, Form 48HC-4-14-02SM, trainingcarrierwest.com; Carrier RTU troubleshooting guide hvacknowitall.com

---

## SCENARIO 32 — Carrier RTU economizer damper stuck open, over-cooling

**Symptom (verbatim):** "Carrier RTU, office building. Thermostat satisfied but unit keeps running. Freezing people out. Outdoor air is 55°F."

**Equipment:** Carrier commercial RTU with integrated economizer, OA dry-bulb changeover.

**Correct diagnostic path:**
1. Economizer changeover setpoint likely programmed too high or sensor has drifted
2. Inspect OAT sensor on economizer assembly — verify reading against calibrated thermometer
3. Check actuator operation: disconnect actuator and manually position damper to confirm mechanism isn't seized
4. With economizer controller energized, measure actuator signal — 2–10VDC modulating or 24VAC two-position depending on controller version
5. Inspect damper blade seals — cracked seals let OA bleed in even with damper commanded closed
6. If ComfortLink equipped: review economizer enable/disable settings, verify OA setpoint not set to "Always On"
7. Check mixed-air temperature sensor calibration
8. Verify linkage not slipping — common on units 5+ years old from vibration

**Most likely root cause:** Failed OAT sensor reading low (thinks it's always economizer-eligible) OR seized actuator/stripped linkage holding damper open

**Safety flags Mike MUST mention:**
- Over-ventilation in humid climates = latent load overload = coil icing risk
- Do not defeat economizer controls permanently without documenting ASHRAE 62.1 compliance impact

**Tone/Mike notes:** "Economizer diagnosis: check the sensor first, then the actuator, then the damper. In that order."

**Source:** Carrier RTU economizer troubleshooting, northbreezehvac.com; PNNL Building Re-Tuning economizer section, buildingretuning.pnnl.gov

---

## SCENARIO 33 — Trane Voyager RTU economizer fault code, LED sequence

**Symptom (verbatim):** "Trane Voyager, economizer LED is flashing 4 times. Customer says economizer board is lit up."

**Equipment:** Trane Voyager commercial RTU, standalone economizer controller (non-communicating).

**Correct diagnostic path:**
1. Trane standalone economizer: 4-flash = actuator fault — actuator not completing stroke within timeout
2. Inspect actuator mechanical connection — verify shaft not seized or disconnected
3. Apply 24VAC directly to actuator to test independent of board
4. Check actuator feedback signal (0–10VDC or potentiometer) back to board
5. Inspect damper blade for physical obstruction (bird nest, damaged insulation, ice in winter)
6. Confirm 24VAC supply to economizer board is clean — loose transformer connections common
7. If actuator tests good: board output transistor may have failed — swap board
8. After repair: perform full-stroke test per Trane commissioning procedure

**Most likely root cause:** Seized actuator OR physical damper obstruction

**Safety flags Mike MUST mention:**
- Economizer failures can go unnoticed for months — document date found and corrected for building owner
- Title 24 (California) and some ASHRAE 90.1 jurisdictions require fault detection on economizers

**Tone/Mike notes:** "The LED is telling you exactly what's wrong — learn the flash codes on whatever brand you're working on before the service call."

**Source:** Trane Commercial HVAC Help Center, economizer fault codes, support.trane.com; Trane Voyager IOM RT-SVX26P-EN, trane.com

---

## SCENARIO 34 — Trane IntelliPak compressor trip, single-circuit lockout

**Symptom (verbatim):** "Trane IntelliPak 20-ton. Circuit 1 locked out, Circuit 2 running. IntelliPak showing compressor trip fault."

**Equipment:** Trane IntelliPak commercial packaged unit, dual-circuit.

**Correct diagnostic path:**
1. Pull fault history via IntelliPak display — note trip type: HP trip, LP trip, discharge temp, or proving input
2. Compressor proving input: must close within 3 seconds of compressor start command — if it doesn't, IntelliPak locks out circuit
3. Check current transformer on compressor 1 — is compressor actually trying to start?
4. Verify compressor contactor pulls in fully — weak contactors common on high-cycle commercial units
5. Check compressor capacitor (scroll compressors often use start assist)
6. Measure compressor winding resistance — open or grounded winding = compressor replacement
7. If compressor starts but trips on HP: go to condenser section on circuit 1 specifically
8. Check LP trip: suction pressure may be critically low indicating significant refrigerant loss

**Most likely root cause:** Failed compressor contactor OR failed scroll compressor (grounded winding)

**Safety flags Mike MUST mention:**
- Grounded compressor winding contaminates refrigerant circuit with carbon — acid test required before replacement, flush entire circuit
- Lock out circuit 1 completely before any compressor electrical work
- Acid test oil sample after any burnout

**Tone/Mike notes:** Commercial tech, experienced with multi-circuit units. "Don't assume the other circuit carrying the load is OK — a failing circuit shifts load and runs that compressor harder."

**Source:** Trane Legacy IntelliPak Compressor Trip Diagnostics, support.trane.com; Trane IntelliPak Programming & Troubleshooting RT-SVP07D-EN

---

## SCENARIO 35 — York/Johnson Controls RTU DX cooling, low-pressure fault, no leak found

**Symptom (verbatim):** "York ZF series rooftop, low-pressure fault keeps tripping. Pulled gauges, pressures look ok at startup. Pressure drops after 10 minutes."

**Equipment:** York ZF commercial rooftop unit, R-410A.

**Correct diagnostic path:**
1. "Pressures OK at startup then drop" = classic TXV hunting or restriction, not a leak
2. Hook up manifold gauges and monitor continuously through the pressure drop
3. Watch suction pressure trend — if it drops slowly then TXV is starving the evaporator
4. Check superheat at suction — if superheat climbs as suction drops: TXV not opening properly
5. Inspect TXV external equalizer line — clogged or kinked equalizer = erratic TXV operation
6. Check for moisture in system — moisture freezes at TXV orifice causing intermittent restriction (suction rises when ice thaws)
7. Sight glass moisture indicator — yellow = wet system, deep evacuation and drier replacement required
8. Check liquid line drier pressure drop (>5 psig across filter-drier = replace)

**Most likely root cause:** Moisture-clogged TXV orifice OR failing TXV with weak power head

**Safety flags Mike MUST mention:**
- Moisture contamination in R-410A system: evacuate to 500 microns or better, replace drier, recharge by weight
- Document refrigerant recovery before any repairs (EPA 608)

**Tone/Mike notes:** "If it trips after 10 minutes, that's not a leak — that's a restriction. Stay on the gauges."

**Source:** York Chiller Troubleshooting guides, partstown.com; Carrier 48HC service manual TXV section, trainingcarrierwest.com

---

## SCENARIO 36 — Lennox LGH commercial RTU VFD supply fan fault

**Symptom (verbatim):** "Lennox LGH commercial rooftop, VFD on supply fan throwing OC fault. Fan not running."

**Equipment:** Lennox LGH commercial rooftop unit with VFD (variable frequency drive) on supply fan, ECM or induction motor.

**Correct diagnostic path:**
1. OC (overcurrent) fault on VFD — motor drawing more current than drive's programmed threshold
2. Check VFD display for exact fault code and last recorded current value
3. Inspect motor physically — spin fan wheel by hand to check for bearing drag
4. Check ductwork for damper/diffuser blockage that would load the fan at startup
5. Verify VFD acceleration ramp time — too fast a ramp for high-inertia fan = instantaneous overcurrent at start
6. Check VFD parameters: motor rated current programmed correctly? Often wrong after board swap
7. Measure motor winding resistance — ground fault or shorted winding causes overcurrent
8. Inspect for drive output wiring damage (conduit chafe, water ingress)
9. If motor and duct clear: check VFD DC bus capacitors for bulging (aging drives)

**Most likely root cause:** VFD acceleration ramp too fast for fan inertia OR failing motor bearing increasing load

**Safety flags Mike MUST mention:**
- VFD output terminals carry lethal voltage even after DC bus discharge takes 5+ minutes — wait for capacitor discharge before touching output
- LOTO the VFD input breaker, not just the unit disconnect

**Tone/Mike notes:** "Overcurrent on a VFD — work through the motor mechanically first, then the parameters, then the drive itself. Most shops replace the drive too fast."

**Source:** VFD Overcurrent Fault Causes & Fixes, precision-elec.com; VFD Troubleshooting guide, emotron.com; Common VFD Faults eilitetech.com

---

## SCENARIO 37 — RTU VFD return fan undervoltage fault, partial power loss

**Symptom (verbatim):** "Commercial RTU return fan VFD showing UV fault. Supply fan still running."

**Equipment:** Commercial rooftop unit with separate supply and return fan VFDs.

**Correct diagnostic path:**
1. UV (undervoltage) on VFD: DC bus voltage dropped below minimum operating threshold
2. Check incoming three-phase voltage to VFD — use true RMS meter on all three phases
3. Look for phase imbalance — a dropped phase causes VFD to drop out, other two phases may still show voltage
4. Check feeder breaker upstream of VFD — loose lug connections cause voltage sag under load
5. Inspect VFD input fusing — blown fuse on one phase causes DC bus collapse
6. Measure voltage at VFD input terminals while unit is attempting to run — voltage sag under load indicates upstream wiring problem
7. Check transformer supplying VFD if unit uses a step-down transformer
8. If supply fan VFD OK on same panel: focus on branch circuit feeding return fan VFD

**Most likely root cause:** Loose terminal connection on return fan VFD branch circuit causing voltage sag under load

**Safety flags Mike MUST mention:**
- Phase loss on three-phase motors causes rapid overheating — verify motor hasn't been running single-phase
- LOTO before any wiring inspection on VFD terminals

**Tone/Mike notes:** "UV faults are almost always a power quality or connection problem upstream. Don't blame the drive until you've verified three clean phases at its terminals."

**Source:** VFD common faults diagnosis, darwinmotion.com; VFD Troubleshooting Flowchart, dosupply.com

---

## SCENARIO 38 — AAON RQ NextGen R-454B leak detection alarm, mitigation mode

**Symptom (verbatim):** "New AAON RQ NextGen unit, R-454B. Leak detection alarm triggered. Unit went into mitigation mode. What's the sequence?"

**Equipment:** AAON RQ NextGen commercial rooftop, R-454B (A2L) refrigerant, with factory-installed A2L Mitigation Controller (A2LMC).

**Correct diagnostic path:**
1. A2LMC detects R-454B concentration via cabinet sensor and/or airstream sensor
2. Mitigation mode triggers at 20% LFL (Lower Flammable Limit) for R-454B
3. Unit activates supply fan at minimum dissipation airflow regardless of thermostat call to dilute concentration
4. Review A2LMC alarm log: identify which sensor triggered (cabinet vs. airstream)
5. Do NOT use open flame leak detection — A2L refrigerant, sparks prohibited
6. Use A2L-calibrated electronic leak detector (heated diode or infrared type rated for A2L)
7. Inspect refrigerant circuit connections, Schrader valves, brazed joints
8. R-454B detector threshold: sensitivity should be ≤5 g/year per ASHRAE 15-2024
9. After repair: confirm leak repair, evacuate circuit to ≤500 microns, recharge by weight (R-454B is a zeotropic blend)
10. Reset A2LMC, log incident per building protocol

**Most likely root cause:** Refrigerant leak at fitting or brazed joint — R-454B slightly more challenging to detect than R-410A due to different composition

**Safety flags Mike MUST mention (CRITICAL):**
- R-454B is mildly flammable (A2L) — NO open flame, no torch-based leak detection EVER
- Evacuate building section if airstream sensor triggered — concentration may be approaching occupied space
- Recharge must be by weight — R-454B fractionates if vapor-charged
- Technician must have A2L refrigerant handling training before working on this equipment

**Tone/Mike notes:** "A2L mitigation mode isn't a nuisance alarm — it means the system detected refrigerant. Take it seriously. Get the building manager in the loop."

**Source:** AAON RQ NextGen IOM R-454B, aaon.com; AAON A2L Mitigation Controller Technical Guide ASM07563, aaon.com; ASHRAE Standard 15-2024, ashrae.org; R-454B Leak Mitigation Manual, totalgreenmfg.com

---

## SCENARIO 39 — Daikin VRV U4 communication error, all indoor units offline

**Symptom (verbatim):** "Daikin VRV IV, 6-unit system, customer called — all indoor units showing U4, nothing working."

**Equipment:** Daikin VRV IV commercial system, multiple indoor units.

**Correct diagnostic path:**
1. U4 = communication failure between outdoor unit and indoor units (bus communication lost)
2. First check: is outdoor unit powered? Outdoor unit controls the communication bus master
3. Check terminal block F1/F2 wiring at outdoor unit — vibration from compressor loosens screw terminals over time
4. Inspect full F1/F2 daisy-chain to each indoor unit — check polarity (not polarity-sensitive on VRV IV but verify no reversed connections causing bus shorts)
5. Look for field wiring damage — rodents, staple through cable, chafed conduit
6. If wiring checks out: isolate units one by one — disconnect one indoor unit, see if remaining units come back online
7. A single indoor unit PCB failure can pull the entire bus low
8. Check communication bus voltage: should measure ~15–30VDC between F1 and F2 with outdoor unit powered
9. Use Daikin Service Checker tool or ESLO2B for systematic bus scan

**Most likely root cause:** Loose F1/F2 terminal at outdoor unit OR one indoor unit PCB shorting the bus

**Safety flags Mike MUST mention:**
- Confirm F1/F2 is low-voltage signal wiring — not line voltage — before touching
- Full system commissioning check after repair to verify all addresses present

**Tone/Mike notes:** "All units down at once = bus problem. One unit down = that unit. Start at the outdoor unit and work out."

**Source:** Daikin VRV U4 error, airreps.com; Daikin VRV error codes guide, mountainmechanicalny.com; Daikin VRV error codes, coolautomation.com

---

## SCENARIO 40 — Daikin VRV A3 high-pressure cutout, summer heat

**Symptom (verbatim):** "VRV system, outdoor unit keeps tripping A3. It's been 98°F outside for three days. Keeps locking out."

**Equipment:** Daikin VRV IV outdoor unit.

**Correct diagnostic path:**
1. A3 = discharge-side pressure exceeded safe limit (high-pressure cutout)
2. At 98°F ambient, design operating conditions are near limits — verify unit is sized correctly for ambient
3. Check all condenser fan motors — VRV uses multiple fans, any fan off will spike HP
4. Check condenser coil face for obstruction: cottonwood, debris, vegetation growth close to unit
5. Verify unit has adequate clearance on all sides per Daikin installation requirements
6. Check for recirculation — exhaust air blowing back into inlet (common on rooftop installations with parapet walls)
7. Verify refrigerant charge — overcharge raises discharge pressure in high ambient
8. Check high pressure sensor calibration using manifold gauges
9. Review installation for excessive piping runs — very long liquid lines can cause elevated operating pressures

**Most likely root cause:** Condenser fan motor failure OR air recirculation from poor installation siting

**Safety flags Mike MUST mention:**
- VRV systems use large refrigerant charges — HP trip means system was operating near 600+ psig
- Do not reset A3 lockout more than 3 times without diagnosing cause

**Tone/Mike notes:** "98°F ambient plus a bad fan motor or air recirculation = lockout every time. You need to find the real cause, not just reset."

**Source:** Daikin VRV error codes guide, mountainmechanicalny.com; Daikin VRV Error Codes, acerrorcode.com

---

## SCENARIO 41 — Daikin VRV A6 low-pressure cutout, refrigerant loss

**Symptom (verbatim):** "Daikin VRV, multiple indoor units not cooling. Outdoor showing A6."

**Equipment:** Daikin VRV IV commercial system.

**Correct diagnostic path:**
1. A6 = low-pressure cutout — suction pressure below threshold, indicating refrigerant loss or restriction
2. VRV systems use large refrigerant charges — A6 can be triggered by surprisingly small leaks given the system's total charge
3. Connect to system controller or Daikin service tool to review which indoor units reported faults first — that zone's piping may contain the leak
4. Perform electronic leak search: start at outdoor unit header connections, branch box connections, indoor unit expansion valve block
5. On VRV, check branch selector box (BSB) solenoid valve connections — leaks at factory flares inside BSB are known issues on older systems
6. Long piping installations (>100 ft equivalent): check riser connections
7. If A6 only occurs during heating mode: check reversing valve leakage
8. After locating leak: repair, pressure test with nitrogen, evacuate to 500 microns minimum, recharge by weight (R-410A VRV requires precise charge per installation data)

**Most likely root cause:** Slow refrigerant leak at branch selector box flare connections OR field-brazed joint on long-piping installation

**Safety flags Mike MUST mention:**
- EPA 608 required; document charge removed before adding refrigerant
- R-410A VRV systems: charge must be adjusted per manufacturer's additional charge tables for piping length
- A6 on a tall building (vertical piping) may indicate oil slugging — check oil trap installation

**Tone/Mike notes:** "A6 on VRV — think big-picture. These systems hold a lot of refrigerant and can run marginally for a long time before full lockout. Get the leak found."

**Source:** Daikin VRV A6 error, mountainmechanicalny.com; Daikin VRV service manual, daikinbahrain.com; VRF Refrigerant Leak Detection, vrfwizard.com

---

## SCENARIO 42 — Daikin VRV E7 outdoor fan motor fault

**Symptom (verbatim):** "Daikin VRV outdoor showing E7. One of the fan blades looks bent."

**Equipment:** Daikin VRV IV multi-fan outdoor unit.

**Correct diagnostic path:**
1. E7 = outdoor fan motor fault — motor lock, overcurrent, or abnormal rotation detected
2. With unit de-energized: inspect fan blade — bent or cracked blade causes vibration that trips E7
3. Inspect fan motor connector at outdoor unit PCB — vibration loosens connectors
4. Check fan motor winding resistance — open or shorted winding
5. Attempt to spin fan wheel by hand — should rotate freely; any drag = bearing failure
6. With unit energized (experienced tech, extreme caution): measure fan motor current — should be within nameplate value
7. If connector and motor test OK: outdoor unit PCB may have false-triggering the fan monitor circuit
8. Replace damaged blade BEFORE powering on — unbalanced blade stresses motor shaft bearings rapidly

**Most likely root cause:** Bent fan blade causing vibration and motor fault OR failed fan motor bearing

**Safety flags Mike MUST mention:**
- Energized fan testing at high-voltage — only experienced tech, keep body clear of rotating equipment
- Running with damaged blade accelerates motor bearing failure — do not reset and run without replacing blade

**Tone/Mike notes:** "E7 and a bent blade — that's your answer. Don't overthink it. Get the part."

**Source:** Daikin VRV E7 fault, mountainmechanicalny.com; Daikin Error Codes, coolautomation.com

---

## SCENARIO 43 — Daikin VRV E6 inverter overcurrent, compressor fault

**Symptom (verbatim):** "Daikin VRV IV commercial, showing E6-17. System won't start."

**Equipment:** Daikin VRV IV+ commercial outdoor unit.

**Correct diagnostic path:**
1. E6-17 = overcurrent on Inverter PCB A3P for Compressor M1C — actual current abnormally high vs. nominal for 30+ minutes
2. First check: high pressure sensor calibration — this is Daikin's first recommended step per service manual
3. Inspect inverter PCB A3P for visible damage — burned components, capacitor bulge
4. Check current sensor offset calibration procedure in service mode
5. Measure compressor M1C winding resistance — should be balanced and not grounded
6. Inspect refrigerant circuit: closed stop valves cause pressure spike that looks like overcurrent
7. Check oil return valves Y2S/Y3S/Y4S — faulty oil return causes compressor to run hot and draw excess current
8. If PCB and compressor test OK: IPM (Intelligent Power Module) may be failing — measure output voltage waveform symmetry

**Most likely root cause:** Failing IPM on inverter PCB OR refrigerant circuit restriction (closed stop valve)

**Safety flags Mike MUST mention:**
- Do NOT attempt to replace inverter PCB while powered — dangerous DC bus voltage present
- If compressor winding is grounded: refrigerant and oil are contaminated — full acid flush required before replacement
- E6 on Daikin requires factory service authorization for warranty work

**Tone/Mike notes:** "E6 inverter fault — check that high-pressure sensor first, Daikin says so in the manual. Half the time it's a false overcurrent from bad pressure data."

**Source:** Daikin VRV IV+ Service Manual E6-17-19-21, manualslib.com; Daikin VRV error codes, coolautomation.com

---

## SCENARIO 44 — Mitsubishi City Multi U4 communication fault, BC controller offline

**Symptom (verbatim):** "Mitsubishi City Multi R2-series. U4 on outdoor unit. BC controller not communicating."

**Equipment:** Mitsubishi City Multi R2-VRF system, PURY outdoor unit, BCFY branch controller.

**Correct diagnostic path:**
1. U4 on City Multi = inverter communication error OR outdoor-to-indoor communication failure
2. Check BC controller: is it powered? Green LED should be solid on normal operation
3. Inspect M-NET wiring between outdoor unit and BC controller: 2-wire non-polarity-sensitive bus
4. Measure resistance between M-NET wires at BC controller — should not show continuity to ground (shorted bus)
5. Check BC controller address settings — sub-BC address must equal lowest indoor unit address connected + 50
6. Verify termination resistor installed at end of M-NET bus (120-ohm in some configurations)
7. Disconnect BC controller from M-NET and check if outdoor unit U4 clears — if yes, BC controller PCB is faulty
8. Verify outdoor unit address switch settings — duplicate addresses cause U4

**Most likely root cause:** Loose M-NET wiring connection OR address conflict between main and sub BC controllers

**Safety flags Mike MUST mention:**
- M-NET bus carries low-voltage but verify before touching
- After any PCB replacement: full system address re-commissioning required
- On heat recovery systems: refrigerant solenoid valve verification required after comms restore

**Tone/Mike notes:** "City Multi comms faults — Mitsubishi's M-NET bus is solid, but loose terminals are the usual culprit. Check every screw terminal from the outdoor unit to the BC and back."

**Source:** Mitsubishi City Multi BC Controller, mitsubishielectric.co.uk; HVAC-Talk City Multi BC controller discussion, hvac-talk.com; Mitsubishi City Multi startup process 2023, mehvac.com

---

## SCENARIO 45 — Mitsubishi City Multi L1 low suction pressure fault

**Symptom (verbatim):** "Mitsubishi PURY-P outdoor unit, fault code L1. Three indoor units offline."

**Equipment:** Mitsubishi City Multi PURY-P commercial outdoor unit.

**Correct diagnostic path:**
1. L1 = low pressure protection — suction pressure below minimum threshold during operation
2. Check which indoor units are faulted — the circuit with greatest refrigerant loss will fault first
3. Review service port pressures at outdoor unit header — if low: refrigerant leak likely
4. On City Multi R2: port isolation valve feature allows isolating individual branch circuits — use this to identify which branch has the problem
5. Check indoor unit EEV (electronic expansion valve) settings in service mode — closed EEV starves circuit
6. Inspect refrigerant piping at each BC port — common leak points: port isolation valve seats, field flare connections
7. If pressures OK: check L1 pressure sensor calibration — compare to manifold gauge reading
8. Cold weather scenario: check defrost operation on heat pump mode — sustained low suction may be normal during aggressive defrost

**Most likely root cause:** Refrigerant leak at branch controller port connection OR faulty EEV on one indoor unit starving the circuit

**Safety flags Mike MUST mention:**
- R-410A VRF: large charge — document refrigerant removed per EPA regulations
- Port isolation valves in BC controller are a service advantage — use them; do not bypass

**Tone/Mike notes:** "L1 on City Multi — use the port isolation feature to narrow it down. That's exactly what it's there for."

**Source:** Mitsubishi PURY-P Service Handbook, mitsubishitechinfo.ca; Mitsubishi City Multi Error Code table, mitsubishielectric.com.sg

---

## SCENARIO 46 — LG Multi V5 CH10 outdoor unit communication fault

**Symptom (verbatim):** "LG Multi V VRF system, outdoor unit seven-segment showing CH10."

**Equipment:** LG Multi V5 commercial VRF outdoor unit.

**Correct diagnostic path:**
1. CH10 on LG Multi V5 = inverter PCB communication failure — communication between inverter PCB and main outdoor unit PCB
2. Level 2 error — communications-only error, attempts communications 10 times before displaying
3. Check inverter PCB connection harness — inspect ribbon cable or connector between inverter and main PCB for proper seating
4. Verify fuses supplying the inverter PCB — blown fuse causes PCB to go offline
5. Inspect inverter PCB for visible damage (capacitor bulge, burn marks)
6. Attempt power cycle with full 5-minute power-off to allow capacitors to discharge
7. Check outdoor unit LED indicators on both inverter PCB and main PCB
8. Use LGMV (LG Multi V) service software to interrogate system if building management system is equipped
9. If comms restore but CH10 recurs: vibration-induced connector intermittent — apply thermal compound or secure harness

**Most likely root cause:** Loose inverter PCB connector OR failed inverter PCB

**Safety flags Mike MUST mention:**
- Wait minimum 5 minutes after power-off before accessing inverter PCB — DC bus capacitors hold lethal voltage
- LG inverter replacement requires system re-commissioning

**Tone/Mike notes:** "CH10 is an inverter-to-main PCB comms fault. It's inside the outdoor unit. Check the harness first — it's usually the cheapest fix."

**Source:** LG Multi V5 Service Manual, ManualsLib, manualslib.com; LG VRF Error Codes guide, acerrorcode.com

---

## SCENARIO 47 — LG Multi V outdoor unit CH52 compressor protection fault

**Symptom (verbatim):** "LG Multi V, outdoor unit showing CH52. Compressor not running."

**Equipment:** LG Multi V commercial VRF, scroll compressor configuration.

**Correct diagnostic path:**
1. CH52 = compressor protection — discharge temperature or pressure exceeded safe threshold
2. Check discharge temperature sensor reading in service mode — compare to measured discharge pipe temperature (clip-on thermocouple)
3. If discharge temp >130°C (266°F): system is running in an over-pressure or low-charge condition
4. Inspect condenser coils and verify all condenser fans running
5. Check refrigerant charge: low charge → elevated discharge temperature
6. Inspect TXV/EEV operation — restriction causes high discharge superheat
7. Check discharge thermistor resistance vs. temperature-resistance chart — failed thermistor causes false CH52
8. If high discharge temp confirmed: check for blocked liquid line, failed check valves, or refrigerant overcharge
9. After clearing root cause: CH52 requires manual reset at outdoor unit

**Most likely root cause:** Low refrigerant charge causing elevated discharge temperature OR faulty discharge thermistor

**Safety flags Mike MUST mention:**
- CH52 lockout protects compressor from catastrophic failure — do not repeatedly reset without diagnosing
- Discharge temperatures above 130°C damage compressor oil — perform acid test before restarting

**Tone/Mike notes:** "CH52 is the LG's compressor protection. Figure out why it's hot before you reset it."

**Source:** LG Multi V VRF Error Codes, acerrorcode.com; Diagnosing CH52 Error on LG Multi V, YouTube hvac-video; LG Multi V5 Error Code Table, manualslib.com

---

## SCENARIO 48 — Samsung DVM E-series outdoor unit communication fault

**Symptom (verbatim):** "Samsung DVM S outdoor unit showing E601. Customer says two indoor units offline."

**Equipment:** Samsung DVM S commercial VRF outdoor unit.

**Correct diagnostic path:**
1. E601 = indoor unit EEPROM error on the affected indoor unit's PCB — configuration data corrupted or missing
2. EEPROM stores address, unit type, and capacity data — corruption can occur from power surge or PCB replacement without programming
3. Identify which indoor units are E601 via DVM Coder software or Samsung wired controller history
4. At affected indoor unit: check PCB for proper option code settings using Samsung's VRF Coder software
5. If PCB was recently replaced: verify option code was programmed — replacement boards ship without unit-specific coding
6. Power cycle affected indoor unit independently (trip individual breaker)
7. If EEPROM error persists after power cycle: replace indoor unit PCB and program option code correctly
8. Verify communication wiring at affected indoor unit terminal block

**Most likely root cause:** Recently replaced indoor unit PCB without programming the unit's option code

**Safety flags Mike MUST mention:**
- Samsung VRF Coder software is free but requires Samsung HVAC technician registration
- Incorrect option coding causes permanent capacity or mode errors — verify ALL options before returning to service

**Tone/Mike notes:** "E601 after a board swap — classic. They replaced the board but didn't program it. Get the Coder software out."

**Source:** Samsung DVM S Service Guide and Troubleshooting, samsunghvac.com; Samsung E364 service guide, samsung-files.com; Samsung VRF error codes, airnexus.io

---

## SCENARIO 49 — Samsung DVM E364 compressor 2 overcurrent fault

**Symptom (verbatim):** "Samsung DVM outdoor unit, E364 fault code. Half the indoor units cooling, other half not."

**Equipment:** Samsung DVM commercial VRF, dual-compressor outdoor unit.

**Correct diagnostic path:**
1. E364 = Compressor 2 overcurrent — compressor 2 drawing excess current, inverter protection tripped
2. System runs on compressor 1 only — this explains half the zones still cooling
3. Check compressor 2 winding resistance — should be balanced (R-to-S, S-to-T, T-to-R equal within ±10%)
4. Measure insulation resistance to ground — any reading below 1 MΩ at 500VDC megohm = compromised winding
5. If windings OK: check refrigerant charge — low charge → elevated current draw as compressor works harder
6. Inspect discharge thermistor on compressor 2 circuit — false overcurrent possible from miscalibrated temperature
7. Review inverter PCB for C2 — inspect IPM module for damage
8. Check refrigerant piping balance between circuits — trapped oil or restriction in compressor 2 circuit

**Most likely root cause:** Failing scroll compressor 2 with weakening winding insulation OR oil-logged compressor circuit

**Safety flags Mike MUST mention:**
- Compressor winding failure contaminates the entire refrigerant circuit — acid test before replacement
- Do not continue operating on compressor 1 alone beyond 48 hours — excessive load will cause compressor 1 failure

**Tone/Mike notes:** "E364 with half the zones up — compressor 2 fault is clear. Before you condemn it, do the winding resistance check. Saves you from replacing a good compressor that just had a bad refrigerant charge."

**Source:** Samsung DVM S E364 Service Guide, samsung-files.com; Samsung VRF DVM Error Codes, hvacinexpert.com

---

## SCENARIO 50 — Toshiba SMMS-e outdoor unit inverter fault, power module

**Symptom (verbatim):** "Toshiba SMMS-e outdoor unit, fault LED flashing. Went into service mode, getting code for inverter pack fault."

**Equipment:** Toshiba SMMS-e commercial VRF outdoor unit.

**Correct diagnostic path:**
1. Inverter pack fault on SMMS-e: check blown fuses supplying the inverter pack first
2. Access inverter PCB (IPDU) — inspect for visible damage, blown components
3. Check component failure within inverter pack: capacitors, IGBT modules
4. Inspect electrical connections to inverter compressor — loose terminal = intermittent fault
5. Measure inverter compressor winding resistance and insulation to ground
6. Check Multi-Control box for error contributions — communication between MCB and inverter
7. If fuses are intact and no visible damage: IPDU replacement likely required
8. After IPDU replacement: perform Toshiba commissioning procedure to verify inverter output symmetry

**Most likely root cause:** Failed IPDU (inverter drive board) OR blown inverter fuse from power surge

**Safety flags Mike MUST mention:**
- Toshiba SMMS-e inverter replacement is a manufacturer-authorized service item in most markets
- DC bus capacitor discharge — minimum 5 minutes before servicing inverter section
- Log fault codes before clearing for warranty documentation

**Tone/Mike notes:** "Toshiba inverter fault — check fuses first. Dead simple fix if that's it. If the fuses are fine, you're looking at the IPDU."

**Source:** Toshiba SMMS-i Error Code Quick Reference, toshiba-aircon.com.sg; Toshiba AC error codes, arlingtonairconditioningheating.com

---

## SCENARIO 51 — Carrier AquaSnap 30RB low water flow alarm

**Symptom (verbatim):** "Carrier AquaSnap chiller, flow alarm. Chilled water pump is running."

**Equipment:** Carrier AquaSnap 30RB air-cooled chiller with ComfortLink controls.

**Correct diagnostic path:**
1. Low chilled water flow alarm: flow switch failed to close within 5 minutes of pump start command
2. Verify chilled water pump is truly running — confirm amps at pump starter/VFD
3. Check chilled water flow switch — it may be fouled with scale or have a broken paddle
4. Inspect water strainer upstream of evaporator — clogged strainer drastically reduces flow
5. Check differential pressure across evaporator — compare to design GPM from commissioning sheet
6. Inspect chilled water system for air-locked sections — air in system causes erratic flow switch behavior
7. Verify isolation valves around evaporator are fully open
8. If flow confirmed adequate but alarm persists: flow switch adjustment or replacement needed
9. Check ComfortLink configuration — flow switch input must be enabled for interlock to function

**Most likely root cause:** Clogged water strainer OR failed/fouled flow switch

**Safety flags Mike MUST mention:**
- Never bypass chilled water flow switch to force chiller to run — running chiller with no/low flow causes evaporator freeze-up and tube damage
- Document flow readings against design spec — if flow is low, find why before chiller operates

**Tone/Mike notes:** "Flow alarm with the pump running — it's either the strainer, the switch, or air in the system. Check them in that order."

**Source:** Carrier AquaSnap 30RB Alarm Codes, manualslib.com (30RB page 63); Carrier AquaSnap service documentation, refmech.com

---

## SCENARIO 52 — Carrier AquaSnap condenser approach temperature high

**Symptom (verbatim):** "AquaSnap chiller running but leaving chilled water temp is 2°F above setpoint. No alarms. Condenser fans all running."

**Equipment:** Carrier AquaSnap 30RAP air-cooled chiller.

**Correct diagnostic path:**
1. High condenser approach temperature = condenser coil efficiency degraded
2. Measure condenser leaving air temperature vs. condenser entering air temperature — design approach should be within 15–25°F of ambient
3. Condenser approach = saturation condensing temperature minus outdoor ambient — typical design ≤15°F; if >20°F, coils are fouled
4. Inspect condenser coils: fin fouling from cottonwood, dirt, or scale on microchannel coils
5. Wash condenser coils with low-pressure water (high pressure damages microchannel fins)
6. Check for refrigerant overcharge — excess charge floods condenser, raises condensing temperature
7. Verify condenser fan RPM — belt-driven fans may have slipping belts (older units)
8. Check for air recirculation patterns on rooftop — parapet walls shorter than discharge height can cause recirculation
9. Measure subcooling: high approach + high subcooling = overcharge; high approach + low subcooling = fouled/blocked condenser

**Most likely root cause:** Fouled condenser coils from cottonwood/dirt accumulation

**Safety flags Mike MUST mention:**
- Condenser coil cleaning on microchannel coils: no high-pressure washers, no acid cleaners without manufacturer approval
- Refrigerant recovery required before adjusting charge; document amounts per EPA 608

**Tone/Mike notes:** "Chiller running 2°F high with no alarms — it's a soft performance problem. Condenser approach is the first thing I'd measure."

**Source:** Carrier AquaSnap 30RAP Handbook, trainingcarrierwest.com; Carrier chiller alarm codes, scribd.com

---

## SCENARIO 53 — York YCAL chiller low-pressure fault, R-410A loss

**Symptom (verbatim):** "York YCAL air-cooled chiller, low pressure fault shutdown. Happens around noon on hot days."

**Equipment:** York YCAL air-cooled screw liquid chiller.

**Correct diagnostic path:**
1. Low pressure fault shutting down at peak load/high ambient = system is marginal on refrigerant charge
2. "Around noon" pattern → low load early morning when charge barely adequate, high load at noon exceeds system capacity with diminished charge
3. Check suction pressure at time of fault — compare to normal operating pressure for the load/ambient
4. Inspect for refrigerant leak: York YCAL uses screw compressors with oil separator — check oil separator flange, service valve stems
5. Log chiller leaving chilled water temperature trend — rising trend over weeks confirms slow refrigerant loss
6. Check York OptiView control panel fault log for pattern
7. Verify condenser fan operation — all fans running at peak load
8. Inspect liquid line sight glass: if flashing, charge is definitely low

**Most likely root cause:** Slow refrigerant leak causing marginal charge that only manifests at peak load

**Safety flags Mike MUST mention:**
- EPA 608 required — document charge removed and added
- Find and repair leak before recharging per EPA AIM Act requirements
- York YCAL: screw compressor requires oil analysis if system ran significantly undercharged

**Tone/Mike notes:** "Only faults at noon — the time pattern tells you everything. Low charge gets exposed when load peaks. Find the leak."

**Source:** York YCAL Fault Codes, manualslib.com (YCAL0080SC page 111); York chiller troubleshooting, partshnc.com

---

## SCENARIO 54 — York YCWS evaporator fouling, reduced capacity

**Symptom (verbatim):** "York YCWS water-cooled chiller, capacity has been dropping over the season. No alarms but chilled water leaving temp keeps climbing."

**Equipment:** York YCWS water-cooled liquid chiller with shell-and-tube evaporator.

**Correct diagnostic path:**
1. Gradual capacity decline without alarms = heat exchanger fouling — evaporator or condenser tube fouling
2. Calculate evaporator log mean temperature difference (LMTD) — compare to design value from startup commissioning sheet
3. Check evaporator approach temperature: entering chilled water minus refrigerant saturation temperature; if >5°F above design, fouling suspected
4. Review water treatment logs — scale deposition and biological fouling are common if water chemistry not maintained
5. Inspect evaporator waterside strainer — scale or debris buildup
6. Check chilled water flow rate via differential pressure — reduced flow indicates blockage
7. Perform eddy current tube inspection if fouling is confirmed — identify plugged or pitted tubes
8. Coordinate with building water treatment contractor for chemical cleaning recommendation
9. If tube fouling severe: mechanical tube brushing or chemical tube cleaning required (requires chiller shutdown and isolation)

**Most likely root cause:** Evaporator tube fouling from inadequate water treatment (scale or biological growth)

**Safety flags Mike MUST mention:**
- Chemical cleaning of evaporator tubes: verify chemicals are compatible with tube material; flush thoroughly before restart
- Do not operate chiller with flow significantly below design — potential freeze damage

**Tone/Mike notes:** "Slow capacity drop, no alarms — that's fouling. Pull the water treatment records first. If those are bad, you'll find the answer."

**Source:** York YCWS documentation, hawkeye-es.com; York chiller troubleshooting, partsaps.com; York YCAS fault codes reference, manualslib.com

---

## SCENARIO 55 — Trane CGAM chiller low oil pressure warning

**Symptom (verbatim):** "Trane CGAM scroll chiller, oil pressure warning showing on the controller. Running but at reduced capacity."

**Equipment:** Trane CGAM air-cooled scroll chiller with MicroTech III controller.

**Correct diagnostic path:**
1. Low oil pressure warning on CGAM: oil differential pressure sensor detecting oil pressure drop
2. Check oil level sight glass on each compressor circuit — low oil level indicates oil migration to system
3. If oil level OK: check oil pressure transducer reading vs. expected values at current operating conditions
4. Low load operation thickens oil at low temperatures — oil becomes sluggish, pressure differential drops
5. Inspect oil return check valves — failed check valve lets oil migrate to evaporator
6. Verify chilled water setpoint isn't too low (below 40°F leaving water temp) — causes oil to thicken excessively
7. Check oil filter differential pressure — clogged oil filter reduces oil flow
8. Review oil temperature — if oil separator temperature is below 40°F at startup, warm-up period needed
9. If persistent: oil analysis for contamination or refrigerant dilution

**Most likely root cause:** Oil logged in evaporator due to failed oil return check valve OR low load/low temperature operation

**Safety flags Mike MUST mention:**
- Do not ignore oil pressure warnings — extended operation with low oil pressure destroys scroll compressor bearings
- Never charge liquid refrigerant into suction — causes oil washout and compressor damage

**Tone/Mike notes:** "Oil pressure warning on CGAM — check the oil level first. Then look at what the load has been. Low load at night + cold weather is the classic CGAM oil problem."

**Source:** Trane CGAM Installation & Operation Manual, manualslib.com; Trane Diagnostics Manual, scribd.com; Trane CGAM sensor failure diagnostics page 175, manualslib.com

---

## SCENARIO 56 — Chiller surge event, centrifugal compressor

**Symptom (verbatim):** "Building has an older centrifugal chiller. Customer says it's making banging noises and the panel shows a surge fault."

**Equipment:** Commercial centrifugal chiller (York YK or similar), R-134a.

**Correct diagnostic path:**
1. Surge = centrifugal compressor refrigerant flow reversal — happens when operating conditions move outside stable range
2. Immediate diagnosis: check condenser water supply temperature — high condenser water temp forces compressor toward surge line
3. Check chilled water return temperature — if very low (partial building, night setback, spring), very light load → surge risk
4. Verify cooling tower operation: if tower is delivering 55°F condenser water, low-load chiller surges
5. Hot gas bypass: verify hot gas bypass valve is operational — provides artificial load at low building load
6. Check inlet guide vane (IGV) calibration — vanes not opening enough at low load drives surge
7. Check chiller controller surge avoidance algorithm is enabled — most modern chillers modulate to avoid surge
8. Condenser water entering setpoint should be controlled above 65°F for most centrifugal chillers at low load
9. If surge occurs during normal load: check for refrigerant charge issue, fouled condenser, or compressor wear

**Most likely root cause:** Very light building load combined with cold condenser water temperature — classically a spring/fall problem

**Safety flags Mike MUST mention:**
- Sustained surge damages compressor impeller and thrust bearings — shut down immediately if surging persists
- Never override surge protection algorithms
- Hot gas bypass system must be verified operational before trusting it to prevent surge

**Tone/Mike notes:** "Banging from a centrifugal — that's surge. First question: what's the load, and what's the condenser water temp? Spring day with half the building occupied is the classic setup."

**Source:** Chiller surge diagnosis, aircondlounge.com; Surge prevention in centrifugal chillers, colddirect.co.uk; York centrifugal chiller troubleshooting, scribd.com

---

## SCENARIO 57 — Daikin AGZ chiller high discharge temperature shutdown

**Symptom (verbatim):** "Daikin AGZ scroll chiller tripping on high discharge temp fault. Summer condition, unit about 5 years old."

**Equipment:** Daikin AGZ air-cooled scroll chiller (Trailblazer series), R-410A.

**Correct diagnostic path:**
1. High discharge temp on AGZ scroll: check refrigerant charge first — low charge = high superheat = high discharge temp
2. Hook gauges: measure superheat at suction (should be 10–12°F entering compressor)
3. If superheat high with normal suction pressure: EEV not opening properly or partially restricted liquid line
4. Check condenser coil condition — fouled coils raise condensing temperature which raises discharge temp
5. Verify all condenser fans operating at correct speed
6. At 5 years old: check for refrigerant leak (annual leak check per EPA AIM Act if >50 lbs charge)
7. Check discharge thermistor calibration using clip-on thermocouple comparison
8. AGZ oil management: check oil separator and verify oil return circuit is working — oil-logged refrigerant raises discharge temp

**Most likely root cause:** Low refrigerant charge causing high discharge superheat OR fouled condenser coils

**Safety flags Mike MUST mention:**
- AGZ units >50 lbs refrigerant charge trigger EPA leak check requirements annually
- High discharge temp over 275°F can cause refrigerant decomposition — test for refrigerant acid content after any overtemp event

**Tone/Mike notes:** "Discharge temp trip on a 5-year-old AGZ in summer — refrigerant charge and condenser coil cleanliness. Work both at once."

**Source:** Daikin AGZ Series Operation and Maintenance Manual, manuals.plus; Daikin EWAD Operation Manual, daikinmea.com; Daikin Trailblazer IOM, csdocs.comfortar.com

---

## SCENARIO 58 — Commercial water-source heat pump low loop temperature lockout

**Symptom (verbatim):** "Office building WSHP system, January morning. Twelve units locked out on low-pressure trip. Loop temperature reading 52°F."

**Equipment:** Commercial water-source heat pump system, building loop with cooling tower/boiler.

**Correct diagnostic path:**
1. WSHPs in heating mode require loop temperature between 55–75°F — at 52°F, units are approaching freeze protection lockout
2. Check boiler operation — winter loop supplemental heat should be maintaining loop temperature
3. Verify boiler setpoint and staging — is boiler firing? Is boiler enable signal from loop control satisfied?
4. Inspect mixing valve between boiler and cooling tower loop — stuck or miscalibrated valve could be admitting too much cold tower water
5. Check cooling tower bypass valve — in January, cooling tower should be bypassed or off; if cooling tower bypass failed open, it's dropping loop temp
6. Inspect boiler heat exchanger for scale — reduced heat transfer leaves loop cold despite boiler firing
7. Verify loop pump flow rate — low flow means boiler cannot transfer heat fast enough
8. Once loop temperature restored above 60°F: reset locked-out WSHPs one at a time to prevent simultaneous startup surge

**Most likely root cause:** Failed cooling tower bypass valve admitting cold tower water in winter OR boiler enable sequence failure

**Safety flags Mike MUST mention:**
- Do NOT reset all 12 WSHPs simultaneously — staggered restart to prevent electrical demand spike
- If any WSHP ran on a frozen or near-frozen coil: inspect heat exchanger for ice damage before restart
- Glycol concentration should be verified if loop temps regularly approach freezing

**Tone/Mike notes:** "Twelve units locked out at once in January — it's a loop temperature problem, not 12 individual unit problems. Fix the loop first."

**Source:** WSHP Freeze Protection Strategies, jmpcoblog.com; Water Source Heat Pump troubleshooting, aristotleair.com; WSHP FAQ, bosch-homecomfort.com

---

## SCENARIO 59 — RTU demand-controlled ventilation DCV CO2 sensor failure

**Symptom (verbatim):** "Commercial RTU with CO2-based DCV. Tenants complaining of stuffy air but energy bills are low. CO2 sensor on wall reads 400 ppm no matter what."

**Equipment:** Commercial RTU with CO2 sensor and DCV modulating economizer.

**Correct diagnostic path:**
1. CO2 sensor stuck at 400 ppm (outdoor air baseline) = sensor failed or lost calibration
2. With sensor reading low permanently: DCV keeps OA damper at minimum position — no ventilation increase when occupancy climbs
3. Verify CO2 sensor is powered and communicating to RTU controller
4. Compare sensor reading to calibrated handheld CO2 meter — if meter reads 1,200 ppm and wall sensor shows 400, sensor is failed
5. Check sensor calibration date — CO2 sensors require field calibration every 1–3 years (some auto-cal to 400 ppm at night assuming empty building)
6. Inspect for contamination: paint fumes, cleaning chemicals near sensor can permanently damage the NDIR optical path
7. If sensor physically failed: replace with same protocol (0–2000 ppm, 0–10VDC output, or BACnet/Modbus per controller requirements)
8. After replacement: recalibrate to known outdoor air (400 ppm ± 20 ppm) and verify DCV sequence responds to elevated CO2

**Most likely root cause:** Failed CO2 sensor (NDIR detector degraded) — stuck at outdoor baseline, no longer responsive to occupancy changes

**Safety flags Mike MUST mention:**
- Failed DCV = ASHRAE 62.1 ventilation minimum may not be met — building may have indoor air quality compliance issue
- CO2 levels above 1,100 ppm in occupied spaces cause documented cognitive performance decline — report to building manager
- Some jurisdictions require documented DCV verification in Title 24/ASHRAE 90.1 compliance inspections

**Tone/Mike notes:** "Stuffy complaints with low energy bills — the DCV is broken in the 'save money' direction. Find out why the sensor is lying."

**Source:** DCV maintenance and fault diagnosis, oxmaint.com; Trane DCV setup guide, support.trane.com; Fault injection DCV systems study, ncbi.nlm.nih.gov

---

## SCENARIO 60 — RTU economizer actuator frozen/seized, winter operation

**Symptom (verbatim):** "Commercial RTU, January service call. Building hot, thermostat satisfied. Tech says outside air damper is stuck open, can't close it."

**Equipment:** Commercial RTU with modulating economizer, northern climate.

**Correct diagnostic path:**
1. Stuck-open OA damper in winter = building is essentially on 100% outside air — massive heat load on gas heat
2. Physically inspect actuator: attempt to move damper manually with actuator disconnected
3. Check for ice formation at damper blade seals — condensation in the mixed-air plenum can freeze damper linkage solid
4. Inspect actuator gear train — plastic gears in modulating actuators crack at low temperature
5. Check actuator spring return — spring return actuators should fail-closed on power loss; if damper is open with power removed, spring is broken
6. Verify 24VAC supply to actuator and signal from economizer board
7. If damper physically freed but re-freezes: moisture infiltration causing ice at pivot points — seal mixed-air plenum penetrations
8. Document: if building was operating at full OA all winter, heating costs and IAQ compliance affected

**Most likely root cause:** Frozen damper linkage from moisture infiltration OR failed actuator with broken spring return

**Safety flags Mike MUST mention:**
- Running 100% outdoor air at 0°F can exceed heating coil/furnace capacity — monitor duct supply temperature
- Broken spring return actuator is a commissioning/installation defect — should fail closed, not open
- Propane heat applications: 100% OA in cold weather may cause heat exchanger overheat

**Tone/Mike notes:** "Stuck-open damper in January — you're paying to heat outdoor air. Get it closed now, then figure out why it's stuck."

**Source:** Carrier RTU economizer actuator issues, hvac-talk.com; PNNL Building Re-Tuning economizer section, buildingretuning.pnnl.gov; RTU economizer installation, shareddocs.com

---

## SCENARIO 61 — VRF refrigerant distribution imbalance, some zones too cold/too hot simultaneously

**Symptom (verbatim):** "Daikin VRV system, big office building. Some zones way over-cooled, others can't keep up. All running at the same time."

**Equipment:** Daikin VRV IV large commercial system with branch selector boxes.

**Correct diagnostic path:**
1. Simultaneous over-cooling and under-cooling = refrigerant distribution imbalance across the branch network
2. Identify which indoor units are over-performing vs. under-performing — map to specific branch selector boxes
3. Check EEV (electronic expansion valve) positions on indoor units via Daikin Intelligent Touch Manager or service tool
4. Over-cooled units: EEV may be stuck open or oversized capacity assignment
5. Under-cooled units: EEV may be stuck closed, or undersized capacity assignment on branch
6. Verify branch selector box solenoid valve operation — faulty solenoid on one port can flood adjacent ports
7. Check pressure at branch selector box header — distribution pressure should be equal across branches
8. Review system capacity assignment: total connected indoor unit capacity should not exceed outdoor unit capacity by more than Daikin's rated combination ratio
9. Check refrigerant charge — overcharge causes liquid flooding to some branches

**Most likely root cause:** Stuck EEV on over-cooled indoor unit flooding refrigerant OR faulty branch selector box solenoid valve

**Safety flags Mike MUST mention:**
- EEV replacement on VRV indoor units requires system pumpdown and refrigerant recovery — large charge
- Do not exceed Daikin combination ratio limits — oversized connected capacity causes this problem even with perfect equipment

**Tone/Mike notes:** "One zone over-cooled, one under-cooled on VRV — think EEVs and branch distribution, not just charge. The system's got too much refrigerant going one place."

**Source:** Daikin VRV branch selector box diagnostics, airreps.com; VRF refrigerant distribution troubleshooting, northbreezehvac.com; Daikin VRV IV+ service manual, manualslib.com

---

## SCENARIO 62 — Mitsubishi City Multi heat recovery mode fault, simultaneous heating/cooling

**Symptom (verbatim):** "City Multi R2 heat recovery system. Some zones calling for heat, some for cool. Unit alarm, heat recovery mode not working."

**Equipment:** Mitsubishi City Multi R2-series heat recovery VRF, PURY outdoor unit, BCRQ branch controller.

**Correct diagnostic path:**
1. R2 heat recovery systems distribute liquid refrigerant to cooling zones and hot gas to heating zones simultaneously via the BC controller
2. Check BCRQ (heat recovery BC) solenoid valve positions — cooling ports should have liquid line open, heating ports should have hot gas line open
3. Access BC operation screen: verify each port's A, B, C solenoid status (0=closed, 1=open)
4. Fault in heat recovery mode often caused by: pressure imbalance between circuits, outdoor unit unable to maintain required pressures for simultaneous operation
5. Check if total heating demand + total cooling demand exceeds outdoor unit capacity — oversubscription causes system to default to cooling-only
6. Inspect refrigerant charge — heat recovery mode is most sensitive to charge — need precise charge per piping length addition tables
7. Verify outdoor unit is in "heat recovery" mode setting vs. "heat pump" mode — firmware setting error causes this exactly
8. Check for communication fault between outdoor unit and BCRQ

**Most likely root cause:** Outdoor unit mode setting set to "heat pump" instead of "heat recovery" — common after power loss reset OR refrigerant charge not adjusted per piping length

**Safety flags Mike MUST mention:**
- R2 heat recovery commissioning requires Mitsubishi-trained technician with MELANS software
- Incorrect refrigerant charge on heat recovery VRF causes severe capacity degradation

**Tone/Mike notes:** "Heat recovery mode failing — first thing I'd check is whether the system actually knows it's a heat recovery configuration. Firmware setting after a power fault reset will bite you."

**Source:** Mitsubishi PURY-P Service Handbook, mitsubishitechinfo.ca; Mitsubishi City Multi BC controller diagnostics, mitsubishielectric.co.uk

---

## SCENARIO 63 — Commercial heat pump RTU defrost failure, heating mode short-cycling

**Symptom (verbatim):** "Commercial heat pump rooftop, 25-ton. Heating mode, outdoor coil is packed with ice. Unit keeps switching back and forth."

**Equipment:** Commercial heat pump RTU, 25-ton, reversing valve defrost control.

**Correct diagnostic path:**
1. Ice-packed outdoor coil = defrost cycle not initiating or not completing
2. Check defrost board timer setting — typically initiates defrost every 30, 60, or 90 minutes IF defrost thermostat is closed (coil below 30°F)
3. Inspect defrost thermostat (bulb thermostat on outdoor coil tubing) — if open, defrost never initiates regardless of ice buildup
4. Check defrost thermostat against ice/frost condition visually — if coil is clearly frozen and thermostat is still open: thermostat has drifted high, replace it
5. Verify reversing valve operation during defrost — valve should switch to cooling mode (hot gas to outdoor coil)
6. Condenser fans should de-energize during defrost to speed ice melt — verify fan control relay operation
7. Defrost termination: system returns to heating when defrost thermostat opens (coil reaches ~57°F) OR after maximum defrost timer (typically 10 minutes)
8. If defrost initiates but doesn't complete: reversing valve slugging or low refrigerant charge (insufficient hot gas pressure to melt ice)

**Most likely root cause:** Failed defrost thermostat (stuck open) preventing defrost initiation OR failing reversing valve not fully switching to cooling mode during defrost

**Safety flags Mike MUST mention:**
- Running a heat pump with ice-packed outdoor coil damages compressor from liquid refrigerant slugging
- Reversing valve diagnosis: use temperature gun at valve body — all four ports should show predictable temperatures during heating vs. cooling modes

**Tone/Mike notes:** "25-ton commercial heat pump, coil packed with ice — defrost isn't working. Step one: is the defrost thermostat calling for defrost? That's a 5-minute check."

**Source:** Heat Pump Defrost Diagnosis, contractingbusiness.com; Diagnosing a Heat Pump Defrost Sensor, achrnews.com; Heat Pump Rooftop Operator Training Manual, bcnpha.ca

---

## SCENARIO 64 — Commercial RTU two-stage compressor, stage 2 not engaging

**Symptom (verbatim):** "Trane Voyager 10-ton commercial RTU. First stage cools fine. Second stage never comes on even when building is way over setpoint."

**Equipment:** Trane Voyager commercial RTU, two-stage reciprocating or scroll compressor.

**Correct diagnostic path:**
1. Stage 2 not engaging: check if thermostat or BAS controller is actually sending a Y2 signal
2. Test at unit control board: jumper Y2 terminal manually (with unit in test mode) to confirm stage 2 compressor will start
3. If Y2 jumpered and stage 2 starts: problem is in the control signal path — check thermostat wiring, subbase, or BAS output
4. If Y2 jumpered and stage 2 still doesn't start: check stage 2 compressor contactor
5. Measure voltage at stage 2 compressor contactor coil when Y2 is commanded — no voltage = control board not energizing coil
6. Check staging delay timers in unit controller — Trane Voyager uses minimum 3-minute delay between stage 1 and stage 2 to prevent short cycling
7. Check stage 2 lockout fault in controller memory
8. Verify stage 2 high-pressure and low-pressure safety input wiring is intact

**Most likely root cause:** Lost Y2 signal from thermostat/BAS OR failed stage 2 compressor contactor

**Safety flags Mike MUST mention:**
- Never permanently jumper Y2 — staging timers exist to protect compressors
- Two-stage compressor with failed stage 2 running only stage 1 at max load will overheat stage 1 compressor over time

**Tone/Mike notes:** "Stage 2 never engages — start at the thermostat signal. If the signal's there and stage 2 won't come on, then start looking at the contactor and the board."

**Source:** Trane Voyager IOM, RT-SVX48E-EN, trane.com; Trane compressor trip diagnostics, support.trane.com; Fox Family HVAC two-stage compressor troubleshooting, foxfamilyhvac.com

---

## SCENARIO 65 — AAON RTU inverter compressor fault, capacity reduction

**Symptom (verbatim):** "AAON RN series rooftop, variable capacity. Unit running but can't keep up. No hard fault, just low capacity."

**Equipment:** AAON RN series commercial packaged RTU with variable-speed inverter compressor.

**Correct diagnostic path:**
1. No hard fault but low capacity = inverter compressor running at reduced capacity for a reason
2. Access AAON System Manager II or VCCX controller — view compressor speed command and actual speed
3. Check for soft limiting: discharge temperature protection reduces compressor speed before tripping
4. Check for demand limiting: BAS demand control may have reduced compressor command
5. Inspect discharge line temperature — high discharge temp triggers automatic capacity reduction
6. Check refrigerant charge: low charge causes compressor to derate to protect discharge temperature
7. Verify suction superheat — high superheat + low capacity + no fault = classic undercharge on variable speed unit
8. Check filter and airflow — reduced airflow causes evaporator temperature drop that limits capacity
9. Review AAON fault history in System Manager II for any soft faults

**Most likely root cause:** Low refrigerant charge causing automatic capacity deration via discharge temperature protection

**Safety flags Mike MUST mention:**
- Variable-speed compressors: do not manually override capacity limits — these protect the inverter and compressor
- R-454B units: A2L protocols apply for any refrigerant work

**Tone/Mike notes:** "No fault but low capacity on a variable-speed unit — the system is protecting itself. Figure out what it's protecting itself from."

**Source:** AAON RN Series documentation, aaon.com; AAON System Manager TS II Technical Guide, aaon.com

---

## SCENARIO 66 — Bard wall-mount commercial unit high-pressure trip

**Symptom (verbatim):** "Bard W series wall mount unit on a server room. Keeps tripping on high pressure every afternoon."

**Equipment:** Bard W-series wall-mount air conditioner, commercial application, server room cooling.

**Correct diagnostic path:**
1. Server room: high-pressure trip every afternoon = heat load peaks when servers are at full utilization
2. Verify unit is rated for the actual server room heat load — server rooms have high sensible loads
3. Check condenser section: Bard wall-mounts have wall-penetrating design, condenser is outdoors — inspect for debris accumulation on outdoor section
4. Measure discharge pressure and compare to expected value for ambient temperature
5. Verify return air path from servers to unit inlet is unrestricted — hot aisle containment issues
6. Check Bard control board TEC-EYE diagnostic — will log fault history
7. If afternoon pattern consistent: log discharge pressure vs. time of day to correlate with ambient temperature peak
8. Inspect condenser fan operation — Bard W-series has direct-drive condenser fan, check motor current

**Most likely root cause:** Condenser airflow restriction from debris accumulation on outdoor section OR server room sensible heat exceeding unit capacity at afternoon peak

**Safety flags Mike MUST mention:**
- Server room cooling: if this unit trips, servers may overheat within minutes — critical application, document and communicate to IT/facilities team
- Backup cooling plan should exist for critical server rooms

**Tone/Mike notes:** "Server room, afternoon HP trips — it's almost always heat load at peak plus an airflow problem. Get the discharge pressure logged."

**Source:** Bard HVAC wall-mount service literature, bardhvac.com; Bard MULTI-TEC service manual, manuals.plus

---

## SCENARIO 67 — VRF system central controller (BMS integration) offline

**Symptom (verbatim):** "Daikin VRV connected to building BMS via Modbus. BMS lost communication, now the whole VRV system went to manual mode and no one can control it."

**Equipment:** Daikin VRV with Daikin BACnet/Modbus interface adapter to building BMS.

**Correct diagnostic path:**
1. VRV/BMS communication loss: first check — does the Daikin system still operate independently on its own controls?
2. Verify Daikin Intelligent Touch Manager (iTM) or centralized controller is operational — if BMS fails, VRV should remain controllable locally
3. Check BMS side: verify Modbus/BACnet gateway is powered and network port active
4. Check IP/RS-485 wiring between BMS gateway and Daikin adapter
5. Verify BMS polling interval has not changed — if BMS is overwhelming the adapter with requests, adapter may freeze
6. Reset Daikin BACnet/Modbus adapter (power cycle at gateway — not the VRV outdoor unit)
7. Verify BACnet device ID and Modbus slave address has not changed after a firmware update
8. If adapter reset restores comms: investigate what changed — firmware update, network configuration change
9. Set "BMS failure mode" behavior — units should default to last known setpoint or occupied setpoint, not off

**Most likely root cause:** BACnet/Modbus gateway firmware update changed device ID OR network configuration change broke polling

**Safety flags Mike MUST mention:**
- "Manual mode" on a large commercial VRV when BMS is down = no scheduling, no setback, no overnight setpoint — energy waste and potential comfort complaints
- Document BMS failure mode setpoints in the sequence of operations — buildings often have no documented plan for this

**Tone/Mike notes:** "BMS lost, VRV in manual — the VRV is fine. It's the gateway or the network. Don't touch the outdoor unit."

**Source:** Daikin VRV communication system configuration, support.coolautomation.com; Daikin error codes UC/UE/UA, acerrorcode.com

---

## SCENARIO 68 — Multi-zone ductless commercial, one indoor unit not cooling

**Symptom (verbatim):** "5-zone Mitsubishi commercial ductless system. Zone 3 not cooling — blows ambient air. Other 4 zones fine."

**Equipment:** Mitsubishi commercial multi-zone ductless (non-heat-recovery), PUMY outdoor unit.

**Correct diagnostic path:**
1. One zone offline, four zones fine = problem isolated to zone 3 indoor unit or its expansion valve
2. Check zone 3 indoor unit for fault code on wired controller
3. Inspect zone 3 indoor unit EEV — a closed EEV allows the fan to run but no cooling
4. Measure refrigerant line temperatures at zone 3 liquid and gas connections — ambient temp at both lines = no refrigerant flow to that zone
5. Check zone 3 service valves — may have been closed during previous service and not reopened
6. Inspect zone 3 indoor unit PCB — failure mode can lock EEV closed
7. Verify communication between outdoor unit and zone 3 indoor unit: check indoor unit address setting
8. If zone 3 lines are cold at connection but warm at indoor coil: indoor coil blocked or blower motor not circulating air across coil

**Most likely root cause:** Closed service valve on zone 3 liquid line OR failed indoor unit EEV

**Safety flags Mike MUST mention:**
- Check service valve position before condemning any refrigerant-side component — closed service valve is a common post-service error
- Zone 3 PCB replacement: must verify unit address matches original

**Tone/Mike notes:** "One zone out of five not cooling — narrow the problem to that zone. Check the service valves first. That's embarrassing to miss."

**Source:** Mitsubishi Electric PUMY-P VKMY service manual, mitsubishielectric.md; Mitsubishi City Multi error codes, manualslib.com

---

## SCENARIO 69 — Commercial rooftop UV air purification system failure

**Symptom (verbatim):** "IAQ complaint in commercial office. HVAC tech says the in-duct UV system lamp is out. How do I troubleshoot the whole system?"

**Equipment:** In-duct UV germicidal irradiation (UVGI) system installed in commercial AHU.

**Correct diagnostic path:**
1. UV lamp failure: most UV systems have a lamp-life indicator or fault relay — check lamp hours (typical lamp life 9,000–12,000 hours = ~1 year continuous)
2. Visually inspect lamp — visible cracks, blackened ends, or bluish glow gone indicate lamp failure (CAUTION: UV-C is invisible and immediately damaging to eyes and skin — never look at operating lamp)
3. Measure lamp current draw with unit off then on — no current change = lamp is dead or ballast failed
4. Test ballast output voltage with lamp removed — if ballast not producing rated lamp strike voltage, replace ballast
5. Check lamp socket contacts for corrosion — copper oxidation from condensation common in AHU installations
6. Inspect lamp quartz sleeve if equipped — coating reduces UV output, clean or replace
7. Verify UV system power supply is connected to AHU supply fan interlock — UV must shut off when fan is off to prevent ozone buildup
8. After lamp replacement: log install date and set calendar reminder for next lamp replacement

**Most likely root cause:** End-of-life UV lamp (exceeded rated lamp hours)

**Safety flags Mike MUST mention (CRITICAL):**
- UV-C RADIATION IS IMMEDIATELY DANGEROUS — protect eyes and skin before any lamp inspection; use UV-blocking safety glasses rated for UV-C (standard safety glasses do NOT protect against UV-C)
- Never operate UV system with AHU panels removed
- Confirm UV system is interlocked with AHU fan — UV without airflow causes ozone levels to spike to dangerous concentrations

**Tone/Mike notes:** "UV lamp service — I don't care how experienced you are, you put the proper eye protection on first. UV-C will damage your eyes before you feel it."

**Source:** IAQ UV applications, respicaire.com; Common IAQ Issues in Facilities, facilitiesnet.com

---

## SCENARIO 70 — Commercial ERV enthalpy wheel stopped rotating

**Symptom (verbatim):** "Commercial AHU with energy recovery wheel. Winter, building humidity is way too low. Maintenance guy says the wheel isn't spinning."

**Equipment:** Commercial AHU with enthalpy recovery wheel (ERV core).

**Correct diagnostic path:**
1. Enthalpy wheel not spinning = zero energy recovery — building is bringing in 100% unconditioned outdoor air in winter
2. Check wheel drive motor — verify power and motor running (small belt-driven AC motor or direct drive)
3. Inspect drive belt for breakage or slippage — belt drive is most common failure mode on enthalpy wheels
4. Check for wheel contact with housing — if wheel has deflected slightly, physical friction stops rotation
5. Inspect purge sector — if purge section damper stuck open, creates airflow resistance that slows/stops wheel
6. Check bypass damper position — if bypass damper stuck open, airflow bypasses wheel, pressure difference across wheel drops to zero = wheel slows
7. Verify controls: wheel rotation may be intentionally disabled by economizer controls when outdoor conditions are favorable — check control setpoints
8. Measure pressure differential across wheel — if pressure diff is there but wheel won't spin, motor/belt is the issue
9. Clean wheel surface if biological fouling has glazed the desiccant coating

**Most likely root cause:** Failed or slipping drive belt OR frozen wheel from condensate in cold weather

**Safety flags Mike MUST mention:**
- No energy recovery in winter on commercial system = significant heating energy waste and IAQ impact — report to building manager
- Biological fouling on wheel media: cleaning protocols must use ERV-manufacturer-approved methods; some cleaners degrade the desiccant coating

**Tone/Mike notes:** "Wheel not spinning — start with the belt. It's a 2-minute look."

**Source:** ERV monitoring and fault detection, oxmaint.com; Enthalpy wheel failure detection, USPTO patent 10197344; RenewAire commercial ERVs documentation, renewaire.com

---

## SCENARIO 71 — R-454B commercial unit, first refrigerant work, technician preparation

**Symptom (verbatim):** "Getting dispatched to a new Trane R-454B commercial RTU. Never worked on A2L commercial equipment. What do I need before I go?"

**Equipment:** Trane or other commercial RTU with R-454B refrigerant (A2L).

**Correct procedural path:**
1. Tools required — all must be A2L rated:
   - A2L-rated recovery machine (non-sparking internal components)
   - A2L-rated leak detector (infrared or heated sensor type — DO NOT use halide torch or older heated diode units not rated A2L)
   - R-454B manifold gauges or digital manifold with correct PT chart loaded
   - Vacuum pump with A2L-compatible oil
   - R-454B refrigerant cylinders (correct connections — R-454B uses same fittings as R-410A)
2. Safety equipment:
   - R-454B LFL awareness: 10.2% by volume — detection at 20% LFL per ASHRAE 15-2024
   - No ignition sources in mechanical room during refrigerant work
   - Ventilate work area
3. R-454B charging: must charge by weight — zeotropic blend, vapor charging causes fractionation
4. Evacuate to 500 microns minimum before recharge
5. Verify factory-installed leak detection system (required per ASHRAE 15-2024 for commercial systems with charge >3.91 lbs A2L) is functional before commissioning

**Most likely scenario:** New system commissioning or first refrigerant service call on A2L commercial equipment

**Safety flags Mike MUST mention (CRITICAL):**
- R-454B is mildly flammable — no open flames, no hot-surface ignition sources
- A2L training is NOT optional — most manufacturers void warranty for refrigerant work by non-trained techs
- R-454B decomposes under high heat → HF acid — proper PPE if exposed to heated refrigerant
- Never mix R-454B with R-410A — equipment damage, refrigerant contamination

**Tone/Mike notes:** "Before you touch an A2L system, you've got to be trained and have the right equipment. This isn't residential — the charge is bigger and the stakes are higher."

**Source:** AAON A2L Mitigation Controller Technical Guide, aaon.com; R-454B Leak Mitigation Manual, totalgreenmfg.com; ASHRAE Standard 15-2024, ashrae.org; A2L Refrigerant Safety Guide, hvactoolkit.org; 2026 HVAC refrigerant regulations, kele.com

---

## SCENARIO 72 — VRF refrigerant leak protocol, commercial occupied building

**Symptom (verbatim):** "VRF system in a medical office building. Tenant smells something weird near a fan coil. Electronic leak detector alarming. What's the protocol?"

**Equipment:** Commercial VRF (R-410A or R-454B) in occupied commercial/medical building.

**Correct diagnostic path:**
1. Electronic detector alarming in occupied space = take immediately seriously
2. ASHRAE 34 R-410A concentration limit: 26 lbs per 1,000 cubic feet of occupied space volume — if space is small, even moderate leak can approach this
3. Evacuate the immediately affected space — do not wait for confirmation testing
4. Identify VRF indoor unit and isolate: if system has port isolation valves (Mitsubishi R2) or electronic isolation (Daikin VRV), isolate that branch
5. For R-454B (A2L): additional precaution — no ignition sources, confirm HVAC is ventilating the space at maximum OA
6. Perform systematic leak detection: manifold gauges at outdoor unit header, electronic detector at each indoor unit connection
7. Repair leak, pressure test with nitrogen, evacuate, and recharge by weight
8. For >50 lb systems: EPA AIM Act requires annual leak check documentation

**Most likely root cause:** Refrigerant leak at indoor unit coil connection or refrigerant line fitting in concealed space

**Safety flags Mike MUST mention (CRITICAL):**
- Medical occupancy: ASHRAE 34 restricts allowable concentration to half of standard commercial — 13 lbs per 1,000 cubic feet
- Notify building management and potentially local fire marshal for any significant refrigerant leak in an occupied building
- R-410A is not flammable but is an asphyxiation risk in confined spaces with heavy accumulation
- For A2L refrigerants: R-454B leak = potential flammability risk in enclosed spaces — treat as serious emergency

**Tone/Mike notes:** "Medical building, weird smell, detector alarming — evacuate first, diagnose second. Don't get caught trying to figure it out while people are still breathing it."

**Source:** ASHRAE 15-2022 mechanical room requirements, samon.com; VRF refrigerant leak detection, vrfwizard.com; ASHRAE 15 VRF violations, contractingbusiness.com; R-454B Leak Mitigation Manual, totalgreenmfg.com

---

## SCENARIO 73 — Commercial multi-stage RTU, head pressure control failure in cold weather

**Symptom (verbatim):** "Commercial 20-ton RTU, December. Unit running but low side dropping fast, compressor tripping LP. Only when outdoor temps below 40°F."

**Equipment:** Commercial rooftop unit, 20-ton, outdoor ambient temp 30–40°F.

**Correct diagnostic path:**
1. Low ambient operation: R-410A systems need head pressure control to maintain adequate condensing pressure
2. Without head pressure control: at 35°F ambient, condensing temperature drops to ~50°F → saturated condensing pressure ~200 psig → expansion valve doesn't function properly → suction crashes
3. Check head pressure control mechanism: condenser fan cycling, VFD condenser fan, or condenser fan speed control
4. If fan cycling: verify fan cycling pressure control switch — stuck fans running at 35°F collapse head pressure
5. If VFD: check VFD setpoint — minimum condensing pressure setpoint needs adjustment for low ambient
6. Check low ambient kit installation — some RTUs require factory low ambient accessory below 45°F
7. Check for missing or damaged condenser baffles — these prevent recirculation and maintain minimum head pressure
8. If no head pressure control at all: this unit was not designed/configured for low ambient operation — requires control upgrade

**Most likely root cause:** Condenser fan cycling or VFD not maintaining minimum head pressure at low ambient — fans running too much, collapsing condensing pressure

**Safety flags Mike MUST mention:**
- Operating commercial RTU below design ambient without head pressure control causes compressor damage from liquid floodback
- Document low ambient capability on unit for building maintenance records

**Tone/Mike notes:** "LP trips only in cold weather — it's your head pressure, not a leak. The fans are running when they shouldn't be."

**Source:** Carrier 48HC commercial RTU service manual low ambient section, trainingcarrierwest.com; Carrier RTU common problems, northbreezehvac.com

---

## SCENARIO 74 — York commercial RTU fault, internal control fault on microprocessor

**Symptom (verbatim):** "York ZF commercial RTU, Novatek control board showing internal control fault. Unit not starting."

**Equipment:** York ZF-series commercial packaged unit with Novatek microprocessor controls.

**Correct diagnostic path:**
1. Internal control fault = microprocessor detected a hardware or software error in its own operation
2. Perform power cycle: remove all power for 5 minutes to allow control board to fully reset
3. If fault clears and unit starts: document and monitor — transient fault from power quality event
4. If fault returns immediately: check power supply voltage to control board — should be clean 24VAC within ±10%
5. Check for transformer secondary voltage instability — voltage sag during compressor start pulls control transformer below minimum
6. Inspect control board for visible damage: moisture, corrosion, burned areas
7. Check communication between control board and any sub-boards (expansion boards, economizer module)
8. If board physically damaged: replacement required — document control settings before removing old board
9. Before replacing board: check for service bulletin addressing this fault on this specific firmware version

**Most likely root cause:** Control board firmware fault from power surge OR control board transformer voltage sag during compressor start

**Safety flags Mike MUST mention:**
- Internal control faults can mask other active faults — after board replacement, cycle unit through full startup sequence and observe for secondary faults

**Tone/Mike notes:** "Internal control fault — power cycle first. Always. Half the time it's a transient and it'll clear. The other half tells you it's a real board problem."

**Source:** Carrier RTU internal control fault discussion, hvac-talk.com; York ZF commercial RTU service documentation; commercial HVAC troubleshooting, nextechna.com

---

## SCENARIO 75 — Trane commercial RTU indoor air quality, polarized media failure

**Symptom (verbatim):** "Customer complaining about dust in office space. Commercial RTU has a Trane CleanEffects or polarized media air cleaner. Tech says the media cells look dirty."

**Equipment:** Commercial RTU with polarized-media electronic air cleaner (Trane CleanEffects or equivalent).

**Correct diagnostic path:**
1. Dirty polarized media cells = charged media has lost effectiveness — particles passing through
2. Verify high-voltage power supply to polarized-media section is active — if ionizer voltage lost, unit runs as a passive filter only
3. Measure ionizer output voltage — should be 24VDC (varies by manufacturer) at the ionizing wires
4. Inspect collecting cells for dust loading — polarized media requires quarterly cleaning per manufacturer spec
5. Check ground continuity of collecting cells — poor ground reduces collection efficiency
6. Clean cells per manufacturer procedure: vacuum, then wash with mild detergent, thoroughly dry before reinstalling
7. Check pre-filter (typically 1" filter upstream) — overloaded pre-filter reduces air velocity and defeats IAQ accessory
8. If ionizer wires are broken: replacement required (do not field-repair individual ionizing wires on high-voltage elements)

**Most likely root cause:** Ionizer power supply failed (media running as passive filter) OR collecting cells past cleaning interval

**Safety flags Mike MUST mention:**
- High-voltage section of electronic air cleaners: verify power is OFF before any cell cleaning or maintenance
- Ozone output: verify ozone level from ionizer is within CARB limits (0.050 ppm California limit) — some older units exceeded limits

**Tone/Mike notes:** "Polarized media complaint — check the power supply first. If the ionizer's dead, you're just pushing dusty air through a mesh. Cleaning cells doesn't help if there's no charge."

**Source:** IAQ applications for modern HVAC projects, respicaire.com; Common sources of IAQ issues, facilitiesnet.com

---

## SCENARIO 76 — AAON RQ variable-speed compressor, discharge temperature limiting

**Symptom (verbatim):** "AAON RQ commercial unit. System keeps throttling back at 3pm. Building is warmer than setpoint. No hard faults."

**Equipment:** AAON RQ Series commercial packaged RTU with variable-speed compressor.

**Correct diagnostic path:**
1. Throttling at 3pm (hottest part of day) with no faults = discharge temperature protection throttling compressor speed
2. Access AAON VCCX controller: review compressor speed command, discharge temperature reading, capacity limits
3. Check discharge temperature sensor — compare to clip-on thermocouple at discharge line
4. If discharge temp genuinely high: look for cause — fouled filter, blocked condenser coils, low refrigerant charge
5. Check ambient temperature vs. unit design rating — if ambient exceeds unit's rated maximum, derating is by design
6. Verify VCCX controller settings: max discharge temperature setpoint (default ~230°F), hysteresis band
7. Check supply air CFM — reduced airflow from dirty filter raises evaporator temperature, which raises suction temp, which raises discharge temp
8. If charge is low: refrigerant work required per AAON service procedures (A2L on NextGen units)

**Most likely root cause:** Low refrigerant charge causing high discharge temperature → automatic compressor derating

**Safety flags Mike MUST mention:**
- AAON RQ NextGen with R-454B: any refrigerant work requires A2L-trained technician with proper equipment
- Do not override discharge temperature limits in controller — these protect the compressor

**Tone/Mike notes:** "Throttling at 3pm every day without a hard fault — the unit is protecting itself. Your job is to figure out why the discharge temp is climbing."

**Source:** AAON RQ Series IOM, aaon.com; AAON VCCX-454 Controller Technical Guide, aaon.com

---

## SCENARIO 77 — VRF addressing conflict, two indoor units showing same address

**Symptom (verbatim):** "Commissioned a new LG Multi V5 VRF system. Two indoor units in different zones showing the same fault — CH38 on both units."

**Equipment:** LG Multi V5 commercial VRF system.

**Correct diagnostic path:**
1. CH38 on LG Multi V = indoor unit address conflict — duplicate addresses on the communication bus
2. Every indoor unit must have a unique address on the LG communication bus (typically 1–16 or higher depending on system size)
3. Access each conflicting unit's DIP switches or auto-addressing menu — verify address settings
4. On LG Multi V systems with auto-addressing: power cycle and perform auto-addressing sequence with all units powered
5. If manual addressing: physically access each indoor unit PCB and set unique DIP switch address
6. After correcting addresses: power cycle the outdoor unit to re-scan the bus
7. Use LGMV software to verify all indoor units are uniquely identified on the outdoor unit's unit map
8. Document final address assignments on as-built drawing

**Most likely root cause:** Installer set duplicate DIP switch addresses on two units during installation

**Safety flags Mike MUST mention:**
- Address conflicts cause one or both units to operate erratically or not at all — verify all addresses before final commissioning sign-off
- On heat recovery systems, addressing errors can cause refrigerant circuit misrouting

**Tone/Mike notes:** "CH38 duplicate address — one of the installers set the same DIP switch position on two units. Walk every indoor unit, verify every address. Make a chart."

**Source:** LG Multi V5 Error Code Table, ManualsLib (page 126); LG VRF Error Codes guide, acerrorcode.com

---

## SCENARIO 78 — Daikin VRV UA error, centralized controller address conflict

**Symptom (verbatim):** "Daikin VRV with Intelligent Touch Manager. Getting UA fault, centralized controller won't connect after we added 4 new indoor units."

**Equipment:** Daikin VRV IV system with Intelligent Touch Manager (iTM) central controller.

**Correct diagnostic path:**
1. UA = remote temperature setting wire disconnection OR centralized control equipment address conflict
2. After adding indoor units: address range may have created conflict with iTM's assigned address range
3. Check iTM address settings — centralized control equipment has its own address on the Daikin bus
4. Verify new indoor unit addresses do not conflict with iTM address
5. Per Daikin VRV protocol: centralized controller typically occupies a reserved address range — consult Daikin iTM installation manual for reserved addresses
6. Check M-NET communication wiring to iTM — added wiring runs may have introduced bus impedance issues
7. Verify total number of devices on M-NET bus does not exceed maximum (Daikin VRV IV: 64 indoor units per outdoor unit system)
8. Perform iTM auto-scan of connected units after addressing conflicts resolved

**Most likely root cause:** New indoor unit addresses conflicting with iTM centralized controller address reservation

**Safety flags Mike MUST mention:**
- After any system expansion: update iTM group configuration and verify all zone schedules are still correct
- Document the full address map before and after system expansion

**Tone/Mike notes:** "UA after adding units — you've got an address collision between the new units and the controller. Check the iTM's reserved address space first."

**Source:** Daikin VRV UA/UC/UE error codes, acerrorcode.com; Daikin VRV communication system, support.coolautomation.com; Daikin VRV error code guide, mountainmechanicalny.com

---

## SCENARIO 79 — Commercial RTU economizer free-cooling, enthalpy control failure

**Symptom (verbatim):** "Commercial RTU with enthalpy-based economizer. Humid day, 78°F, economizer wide open. Compressor fighting outdoor humidity."

**Equipment:** Commercial RTU with enthalpy-based economizer (outdoor air enthalpy switch or differential enthalpy control).

**Correct diagnostic path:**
1. Enthalpy-based economizer should prohibit free-cooling when outdoor air enthalpy is high (typically >28 BTU/lb dry air)
2. On a 78°F / high humidity day: outdoor enthalpy likely 40+ BTU/lb — economizer should be closed
3. Inspect enthalpy switch or enthalpy sensor: test at unit during humid condition
4. Enthalpy switch (binary): test by disconnecting — does damper close? If yes, switch is failed open (not sensing high enthalpy)
5. Enthalpy sensor (modulating): compare sensor output (BTU/lb or RH%) to handheld psychrometer measurement
6. Check economizer controller changeover setting — may be programmed for dry-bulb only, not enthalpy
7. Verify wiring from enthalpy sensor/switch to economizer controller is intact
8. If enthalpy sensor reading is off: sensor recalibration or replacement required
9. Note: some jurisdictions require enthalpy-based economizer, others permit dry-bulb only — verify local code requirement

**Most likely root cause:** Failed enthalpy switch (stuck permitting free-cooling) OR controller programmed for dry-bulb changeover on a high-humidity climate zone that requires enthalpy control

**Safety flags Mike MUST mention:**
- Running economizer on high-humidity outdoor air causes moisture carryover, coil icing, and water damage in building ductwork
- Check jurisdiction for ASHRAE 90.1 economizer requirements — some climates prohibit economizers entirely

**Tone/Mike notes:** "Humid day, economizer open — the enthalpy switch is lying. Test it or replace it."

**Source:** PNNL Building Re-Tuning economizer section, buildingretuning.pnnl.gov; Carrier RTU economizer common problems, northbreezehvac.com

---

## SCENARIO 80 — Trane IntelliPak II large commercial RTU, discharge air temperature sensor fault

**Symptom (verbatim):** "Trane IntelliPak II 40-ton RTU. Discharge air temp reading 250°F on the controller. Alarm active. Unit locked out."

**Equipment:** Trane IntelliPak II commercial rooftop unit.

**Correct diagnostic path:**
1. 250°F discharge air reading = sensor fault or sensor completely open circuit (thermistor failure mode: open = reads maximum temperature)
2. Measure actual supply air temperature with calibrated thermometer at supply duct
3. Access IntelliPak diagnostic menu — verify DAT sensor reading and sensor resistance value
4. A thermistor reading 0°F or 250°F is almost certainly an open or shorted circuit
5. Measure thermistor resistance at sensor leads — compare to IntelliPak resistance-temperature chart (typically NTC thermistor)
6. Check sensor wiring for damage — loose connector, pinched wire in panel, moisture corrosion at terminal
7. If wiring intact and sensor resistance fails: replace DAT sensor (IntelliPak uses standard NTC thermistors, available from distributor)
8. After replacement: verify reading is plausible, clear lockout, cycle unit through startup sequence

**Most likely root cause:** Failed NTC thermistor (open circuit) OR corroded thermistor connector

**Safety flags Mike MUST mention:**
- 250°F reading triggering lockout is protective behavior — do not override DAT high limit while sensor is unverified
- After sensor replacement: perform a calibration check against known reference temperature

**Tone/Mike notes:** "250°F reading on discharge air — that's a sensor, not an actual temperature. No ductwork survives 250°F. Pull the sensor, test it."

**Source:** Trane IntelliPak II IOM, cdnsm5-ss10.sharpschool.com; Trane IntelliPak Programming & Troubleshooting RT-SVP07D-EN, trane.com

---

## SCENARIO 81 — Carrier commercial RTU ComfortLink control board lockout

**Symptom (verbatim):** "Carrier WeatherMaster 48TJD, ComfortLink controller showing locked out. History shows 3 HP trips in 1 hour."

**Equipment:** Carrier WeatherMaster 48TJD commercial RTU with ComfortLink II controls.

**Correct diagnostic path:**
1. 3 HP trips in 1 hour → ComfortLink II locks out compressor circuit — requires manual reset
2. Access ComfortLink service menu: pull complete fault history — timestamp and fault type for each trip
3. Review discharge pressure readings at time of each trip (ComfortLink logs pressure data at fault)
4. All three HP trips at same discharge pressure: systematic cause (coil, fan, charge)
5. If HP trips progressively rising: developing blockage or refrigerant overcharge from incorrect prior service
6. Check condenser fan motor amps and rotation — ComfortLink can display real-time fan data
7. Inspect condenser coils — cottonwood accumulates rapidly in spring
8. After root cause corrected: reset lockout via ComfortLink service interface (not a simple power cycle)
9. Carrier WeatherMaster 48TJD: verify Carrier proprietary OAT sensor on economizer is calibrated if economizer-equipped

**Most likely root cause:** Condenser coil fouling causing repeated HP trips → automatic lockout

**Safety flags Mike MUST mention:**
- 3 HP trips in short period = compressor has been running against high discharge pressure repeatedly; check compressor winding insulation after resolving
- ComfortLink lockout requires physical technician reset — cannot be cleared remotely via BACnet/IP

**Tone/Mike notes:** "Three HP trips and a lockout — the system's protecting itself. Don't reset without figuring out what caused three trips in an hour."

**Source:** Carrier 48TJD WeatherMaster fault codes, homealliance.com; Carrier RTU problems guide, northbreezehvac.com; Carrier 48HC service manual, trainingcarrierwest.com

---

## SCENARIO 82 — VRF heat recovery branch box solenoid failure

**Symptom (verbatim):** "Daikin VRV heat recovery system. One zone won't switch from cooling to heating. Branch selector box is suspect."

**Equipment:** Daikin VRV IV heat recovery system with BSB (Branch Selector Box).

**Correct diagnostic path:**
1. Zone unable to switch modes = branch selector box solenoid for that zone is likely stuck in one position
2. Access Daikin service tool or iTM service screen — command branch selector box solenoid open/closed and observe
3. Listen at BSB during mode change command — clicking solenoid = electrically OK but may be mechanically stuck; no click = electrically failed
4. Check BSB solenoid coil resistance — open circuit = dead coil (typically 100–300 ohms depending on model)
5. Verify 24VDC supply to BSB solenoid coil during command
6. Inspect BSB solenoid valve body — if solenoid clicks but valve doesn't switch: valve body debris or mechanical failure
7. If BSB PCB: verify PCB is receiving mode switch command from outdoor unit
8. Refrigerant must be recovered from affected branch before BSB solenoid valve replacement

**Most likely root cause:** Failed BSB solenoid coil (open circuit) OR debris-jammed solenoid valve body

**Safety flags Mike MUST mention:**
- BSB solenoid replacement requires refrigerant pumpdown for the affected circuit — large R-410A charge
- Daikin VRV heat recovery BSB: manufacturer-specific parts, verify correct part number before ordering

**Tone/Mike notes:** "Branch box solenoid issue — click test tells you if the coil is alive. No click means dead coil, not a mechanical problem. Different parts, different diagnosis."

**Source:** Daikin VRV IV branch selector box diagnostics; Daikin VRV service manual, daikinbahrain.com; Daikin VRV error codes, coolautomation.com

---

## SCENARIO 83 — Commercial chiller low evaporator leaving water temp, freeze protection

**Symptom (verbatim):** "Carrier AquaSnap chiller, freeze alarm. Leaving chilled water temperature is 37°F. Setpoint is 44°F."

**Equipment:** Carrier AquaSnap 30RB air-cooled chiller.

**Correct diagnostic path:**
1. 37°F leaving chilled water with 44°F setpoint = chiller is seriously over-cooling — imminent freeze risk
2. Immediate check: chilled water flow rate — if flow has dropped suddenly, chiller will over-cool the reduced water volume
3. Check for closed isolation valve in chilled water loop — bypassed or closed valve drastically reduces flow
4. Check system pump operation — if primary pump failed and secondary pump running at reduced GPM
5. Inspect for air lock in chilled water system — air pockets reduce effective flow
6. Check chiller load: if building cooling load went to zero (unoccupied building, midnight, weekend) and chiller didn't unload, it over-cools
7. Verify low leaving water temperature setpoint in ComfortLink — someone may have changed it
8. Check freeze protection setpoint — Carrier AquaSnap freeze alarm typically activates at 36°F; if approaching that, shutdown is imminent

**Most likely root cause:** Reduced chilled water flow (pump failure or closed valve) causing over-cooling below setpoint

**Safety flags Mike MUST mention (CRITICAL):**
- 37°F leaving water temperature is ONE degree from freeze — evaporator tube freeze-up is catastrophic and expensive
- If freeze alarm has tripped: do NOT restart chiller until chilled water flow is confirmed adequate and any ice in evaporator has melted
- Frozen evaporator tubes require factory-authorized inspection before restart

**Tone/Mike notes:** "37°F leaving water — you're one degree from freezing tubes. Stop the chiller, find why flow dropped. The chiller is telling you exactly what's wrong."

**Source:** Carrier AquaSnap 30RB fault codes, manualslib.com (page 63); Carrier AquaSnap service manual, refmech.com

---

## SCENARIO 84 — Commercial VFD-driven chiller compressor surge protection activation

**Symptom (verbatim):** "York YK centrifugal chiller, VSD-equipped. Getting surge protection activations. Condenser water temp is 60°F, building load is light."

**Equipment:** York YK centrifugal chiller with variable speed drive (VSD) on compressor motor.

**Correct diagnostic path:**
1. Surge protection on VSD centrifugal = classic light-load + low condenser water temperature combination
2. At 60°F condenser water and light load: pressure differential across compressor is too low; compressor operating on surge line
3. York YK VSD surge protection: the drive reduces speed to unload compressor, but below minimum speed, surging occurs
4. Hot gas bypass is the solution for very light loads — verify hot gas bypass valve operational and properly sized
5. Raise condenser water temperature setpoint — 65°F minimum for most centrifugal VSD chillers at low load
6. Check building load — if truly very low (spring/fall, night setback), consider staging to a smaller chiller or chiller mode change
7. Verify VSD surge map parameters are set correctly for this specific chiller configuration
8. Check inlet guide vane (IGV) position — fully closed IGV at low load + low condenser water = worst surge scenario

**Most likely root cause:** Light building load combined with aggressively low condenser water temperature — operating below the VSD's minimum stable speed

**Safety flags Mike MUST mention:**
- Repeated surge events on centrifugal compressor cause impeller erosion — this is a capital cost problem if ignored
- Hot gas bypass bypass valve maintenance is critical — often overlooked because it only operates at low load

**Tone/Mike notes:** "VSD chiller surging in spring — raise the condenser water temp above 65°F and check your hot gas bypass. The system needs a false load to stay stable."

**Source:** Chiller surge diagnosis, aircondlounge.com; York centrifugal chiller troubleshooting, scribd.com; Surge prevention in centrifugal chillers, automationdistribution.com

---

## SCENARIO 85 — Commercial RTU supply air temperature reset fault, BAS setpoint conflict

**Symptom (verbatim):** "Commercial 15-ton RTU connected to BAS. Supply air temp keeps hunting between 50°F and 70°F. BAS showing no faults."

**Equipment:** Commercial packaged RTU with BAS integration (BACnet), supply air temperature reset strategy.

**Correct diagnostic path:**
1. Supply air temperature hunting between 50°F and 70°F = conflicting SAT setpoints from multiple control loops
2. Check BAS programming: is supply air temperature reset active AND a fixed setpoint also active simultaneously?
3. Control sequence conflict: BAS issuing SAT reset commands while RTU local control also has a fixed setpoint — they fight each other
4. Access RTU controller in manual: set a fixed SAT setpoint and verify stability — if stable manually, BAS logic is the problem
5. Check BAS polling interval vs. RTU control update rate — if BAS overrides RTU setpoint every 30 seconds, the system cannot stabilize
6. Review BAS sequence of operations for SAT reset: confirm reset based on zone demand, outdoor temperature, or time schedule is logically consistent
7. Check for BAS analog output driving economizer while digital point also commands it — dual-driver conflict
8. Verify RTU firmware has not changed after an automatic update that altered default control behavior

**Most likely root cause:** BAS supply air temperature reset strategy conflicting with RTU local control — two control loops overwriting each other's setpoints

**Safety flags Mike MUST mention:**
- Hunting supply air temperature causes poor dehumidification and inconsistent space temperature control
- BAS setpoint conflicts can mask actual equipment faults — verify root cause is controls, not a refrigerant or airflow issue

**Tone/Mike notes:** "Supply air hunting on a BAS-connected unit — it's almost always a controls logic problem. Put it in manual, get it stable, then fix the sequence."

**Source:** Trane BCI-R RTU outdoor air control, support.trane.com; Commercial HVAC diagnostics guide, nextechna.com

---

## SCENARIO 86 — Samsung DVM S outdoor unit OA temp sensor fault, incorrect staging

**Symptom (verbatim):** "Samsung DVM S commercial VRF. Unit keeps running at max capacity all day even though building is cool. OA temp sensor reading -40°F on the controller."

**Equipment:** Samsung DVM S commercial VRF outdoor unit.

**Correct diagnostic path:**
1. OA temp sensor reading -40°F = sensor open circuit (thermistor open reads as maximum cold value)
2. With OA temp reading as -40°F: DVM S capacity control algorithm assumes extreme cold/high heating demand → runs at max capacity
3. Locate OA temperature thermistor on outdoor unit housing
4. Measure thermistor resistance — should match NTC curve at actual ambient temperature
5. Open circuit thermistor: replace sensor
6. Check sensor wiring for physical damage — outdoor thermistors on rooftop units are subject to UV degradation and rodent damage
7. Verify sensor connector at outdoor unit PCB is fully seated
8. After replacement: verify OA temp reading is plausible, allow system to restabilize and observe capacity modulation

**Most likely root cause:** Failed OA thermistor (open circuit) causing false cold reading and driving maximum capacity

**Safety flags Mike MUST mention:**
- Running VRF at maximum capacity when not required stresses compressor cycling and increases wear
- Log failure date — if sensor failed prematurely, check for UV or moisture ingress at the sensor housing

**Tone/Mike notes:** "-40°F OA temp reading in July — that's a dead sensor. NTC thermistor open circuit reads cold. Two-minute diagnosis."

**Source:** Samsung DVM S service and troubleshooting, samsunghvac.com; Samsung VRF DVM error codes, hvacinexpert.com

---

## SCENARIO 87 — Commercial multi-zone ductless, compressor short cycling on rapid load changes

**Symptom (verbatim):** "Commercial 8-zone VRF, retail space. Compressor starting and stopping every few minutes. No fault codes."

**Equipment:** Commercial multi-zone VRF, retail application with highly variable occupancy load.

**Correct diagnostic path:**
1. No fault codes + short cycling = compressor responding to load swings from variable zone requests
2. Check zone thermostat setpoints and cycling behavior — are multiple zones turning on/off rapidly?
3. On/off zones create sharp load changes that force the inverter compressor to ramp up and down rapidly
4. Review compressor minimum run time setting in outdoor unit service parameters — some VRF systems allow programming minimum on-time
5. Check building load management: open retail door repeatedly? Direct solar exposure on specific zones?
6. Verify system operating mode is not bouncing between heating and cooling simultaneously (mixed-mode confusion in mild weather)
7. Inspect for refrigerant charge imbalance — slightly low charge causes unstable compressor modulation
8. Check inverter PCB DC bus voltage stability — unstable power supply causes inverter to oscillate

**Most likely root cause:** Zone request pattern causing rapid load change beyond the system's stable modulation range OR mild weather causing simultaneous heating/cooling mode confusion

**Safety flags Mike MUST mention:**
- Excessive short-cycling accelerates compressor wear and fatigue inverter IGBTs — document hours/starts if issue persists
- Check minimum on/off timers are programmed per manufacturer commissioning guide

**Tone/Mike notes:** "Short cycling with no faults — watch the zone calls. Retail buildings with people opening and closing doors are the worst for this."

**Source:** Samsung DVM S service training, samsunghvac.com; Commercial VRF troubleshooting, northbreezehvac.com

---

## SCENARIO 88 — Carrier 38VML VRF outdoor unit fault after power surge

**Symptom (verbatim):** "Carrier 38VML VRF outdoor unit won't start after a lightning storm. Indoor units power up, nothing from outdoor unit."

**Equipment:** Carrier 38VML VRF commercial outdoor unit.

**Correct diagnostic path:**
1. Power surge event → check for blown fuses in outdoor unit electrical compartment
2. Carrier VRF outdoor units: main fuses, control circuit fuses, and inverter fuses — any one blown can prevent startup
3. Check outdoor unit main disconnect and breaker — surge may have tripped or damaged breaker
4. Inspect control board for visible surge damage — burned IC chips, blown MOVs (Metal Oxide Varistors)
5. Check inverter board for damage — surge damage often appears as burned tracks on PCB
6. If main PCB and inverter appear intact: verify 24VAC control power at control transformer secondary
7. Check for ground fault: measure impedance of each compressor winding to ground before energizing
8. Surge protectors/MOVs on the unit: replace if they have absorbed a surge (may show signs of arcing or discoloration)
9. Consider SPD (Surge Protective Device) installation upstream if not already present

**Most likely root cause:** Blown control fuse OR damaged main PCB from surge event

**Safety flags Mike MUST mention:**
- After a lightning strike on or near HVAC equipment: megohm test all compressor and motor windings before attempting to restart — do not blindly power up and hope
- Surge damage can be latent — component may work initially then fail within days after surge event
- Document surge event with date for warranty claim purposes

**Tone/Mike notes:** "Lightning storm, outdoor unit dead — check fuses before condemning anything. Half the time it's a $5 fuse."

**Source:** Carrier 38VML Quick Reference, trainingcarrierwest.com; Carrier RTU troubleshooting, northbreezehvac.com; Carrier error codes, hvactoolkit.org

---

## SCENARIO 89 — Commercial RTU gas heat section fault, limit switch tripped

**Symptom (verbatim):** "20-ton commercial RTU, gas heat. Limit switch tripped, can't clear it. Fan's been running but no heat."

**Equipment:** Commercial packaged gas-electric RTU, 20-ton.

**Correct diagnostic path:**
1. Manual reset limit switch tripped = temperature inside heat exchanger section exceeded safe threshold
2. Do NOT simply reset the limit and restart — find why it tripped first
3. Check temperature rise across heat exchanger: measure return air and supply air temperatures; design rise typically 40–70°F
4. If supply air temperature was very high when limit tripped: airflow restriction caused over-heating
5. Check filter condition — dirty filter is #1 cause of limit trips on commercial RTUs
6. Check supply fan operation — is the belt intact? Is the blower wheel spinning?
7. Check for closed supply air dampers downstream
8. Measure static pressure across blower — high static = restricted system
9. Verify gas valve operation — if gas valve stuck open during a call without proper airflow, heat exchanger cooks
10. Inspect heat exchanger for cracks — persistent limit trips suggest heat exchanger fatigue

**Most likely root cause:** Dirty filter/restricted airflow causing heat exchanger over-temperature trip

**Safety flags Mike MUST mention:**
- Cracked heat exchanger: CO leak risk — verify CO levels in supply air before returning to service
- A cracked heat exchanger is a mandatory replacement item; document and advise building owner in writing
- Never bypass a high-limit switch

**Tone/Mike notes:** "Limit switch tripped on a commercial gas unit — same rules as residential but bigger stakes. Find why it tripped before you reset it."

**Source:** Carrier 48HC service manual, trainingcarrierwest.com; Trane Voyager IOM, trane.com; Commercial HVAC diagnostics, nextechna.com

---

## SCENARIO 90 — Daikin VRV L4 outdoor heat exchanger protection

**Symptom (verbatim):** "Daikin VRV IV outdoor unit showing L4 fault. System in heating mode, outdoor coil has some frost."

**Equipment:** Daikin VRV IV commercial outdoor unit in heating mode.

**Correct diagnostic path:**
1. L4 = abnormal outdoor heat exchanger temperature — protection triggered during heating mode
2. In heating mode, outdoor coil acts as evaporator and frosting is normal — however L4 trips when temperature drops too fast or too low
3. Check defrost control: in VRV heating mode, defrost should cycle every 30–90 min when coil below ~30°F
4. If L4 trips with only light frost: check outdoor heat exchanger temperature thermistor calibration — compare to actual coil temperature with IR gun
5. Check refrigerant charge — low charge causes abnormally deep evaporating temperature which trips L4
6. Review whether L4 trips are associated with specific outdoor ambient conditions — very low ambient + wind can exceed normal frosting rate
7. Mountain Mechanical notes that L4 is common in 2013–2015 era VRV systems experiencing slow refrigerant leaks — check for refrigerant loss

**Most likely root cause:** Low refrigerant charge causing abnormally cold outdoor coil temperature OR failed outdoor heat exchanger thermistor

**Safety flags Mike MUST mention:**
- Operate VRV in heating mode with diagnosed refrigerant leak: system will frost rapidly and potentially damage compressor
- L4 fault: do not continue operating in heating mode until root cause confirmed

**Tone/Mike notes:** "L4 in heating — the coil's getting too cold. That's usually charge, not defrost. Check the gauge before you blame the defrost board."

**Source:** Daikin VRV L4 L5 fault codes, mountainmechanicalny.com; Daikin VRV error codes, coolautomation.com

---

## SCENARIO 91 — Trane CGAM chiller compressor circuit fault, low superheat

**Symptom (verbatim):** "Trane CGAM 80-ton chiller, circuit 2 tripping repeatedly. Compressor 2 shows fault. Gauges show low superheat at compressor inlet."

**Equipment:** Trane CGAM air-cooled scroll chiller, dual-circuit.

**Correct diagnostic path:**
1. Low superheat at compressor inlet = liquid refrigerant reaching compressor — liquid slugging risk
2. On CGAM: check EEV (electronic expansion valve) on circuit 2 — may be stuck open or oversized
3. Check suction superheat: should be 10–12°F entering compressor for scroll; if under 5°F, compressor is liquid flooding
4. Review chilled water leaving temperature — if well below setpoint, system may be over-cooling and backing up refrigerant into suction
5. Check chilled water flow rate on circuit 2 evaporator pass — if low flow, refrigerant evaporation is slow → liquid return
6. Verify circuit 2 expansion valve superheat setting in CGAM MicroTech III controller
7. Check for refrigerant overcharge on circuit 2 — recently serviced?
8. Inspect suction line for insulation damage — warm ambient air warming suction line can mask low superheat

**Most likely root cause:** Faulty EEV (stuck open or miswired) causing liquid floodback OR refrigerant overcharge on circuit 2

**Safety flags Mike MUST mention:**
- Liquid flooding scroll compressor destroys the scrolls rapidly — do not restart without verifying superheat
- CGAM circuit 2: after resolving cause, verify compressor oil for refrigerant dilution before extended operation

**Tone/Mike notes:** "Low superheat on a scroll — you're sending liquid into the compressor. Stop. Fix the EEV before you run it again."

**Source:** Trane CGAM IOM, manualslib.com; Trane CGAM sensor failure diagnostics page 175, manualslib.com; Trane Diagnostics Manual, scribd.com

---

## SCENARIO 92 — VRF commissioning error, system never entered test run mode

**Symptom (verbatim):** "New Mitsubishi City Multi installation. Building owner says system never worked right since day 1. Tech says commissioning was never completed."

**Equipment:** Mitsubishi City Multi commercial VRF, new installation.

**Correct diagnostic path:**
1. Mitsubishi City Multi requires a Test Run / commissioning mode to finalize system configuration after installation
2. Without completing Test Run: refrigerant piping auto-detection may not have occurred, EEV positions may be at defaults, system may not have correct capacity data for each zone
3. Review startup documentation — is a signed commissioning record present?
4. Check for "test run complete" indication in outdoor unit system log
5. Access City Multi startup process: power on outdoor unit, allow initialization, then initiate Test Run via MELANS software or portable controller
6. During Test Run: system detects connected indoor units, measures piping, sets initial EEV positions
7. After Test Run: verify each zone is addressable and responds to mode/setpoint commands
8. Document final refrigerant charge additions per piping length per startup worksheet

**Most likely root cause:** Installer never completed the required manufacturer commissioning/test run sequence

**Safety flags Mike MUST mention:**
- Mitsubishi City Multi warranty requires proper commissioning documentation — incomplete commissioning voids manufacturer warranty
- Systems operating without proper commissioning may have incorrect refrigerant charge — verify per installation startup worksheet

**Tone/Mike notes:** "Never worked right from day 1 — check if test run was done. Mitsubishi requires it and the system knows if it wasn't. That's your answer."

**Source:** Mitsubishi City Multi Equipment Start Up Process 2023, mehvac.com; Mitsubishi City Multi startup documentation, mitsubishitechinfo.ca

---

## SCENARIO 93 — Commercial RTU economizer economizing when mechanical cooling is cheaper

**Symptom (verbatim):** "Energy audit showed commercial building RTU runs economizer even when outdoor temperature is 75°F. Coils are icing periodically."

**Equipment:** Commercial RTU with dry-bulb economizer, humid climate.

**Correct diagnostic path:**
1. Economizer at 75°F outdoor temp in humid climate: if humidity is high, latent heat load from outdoor air exceeds cooling credit
2. Check economizer changeover setpoint — if set to 75°F dry-bulb in a humid climate (e.g., Atlanta, Houston), this is inappropriate
3. ASHRAE 90.1 requirement: economizer enable setpoints must match climate zone — many humid climates require enthalpy-based control
4. Periodic coil icing: humid outdoor air entering at 75°F, system bringing in too much OA → latent overload → coil temperature drops below 32°F → ice
5. Inspect economizer controller: is it dry-bulb or enthalpy-based?
6. In humid climates: changeover setpoint for dry-bulb should be lower (55–65°F) OR enthalpy control installed
7. If this is a code-required enthalpy location: document non-compliance and recommend enthalpy sensor upgrade
8. Short-term fix: lower the dry-bulb changeover setpoint to 60°F until enthalpy control can be installed

**Most likely root cause:** Economizer setpoint too permissive for local climate — running free-cooling when outdoor air is net harmful to the space conditioning

**Safety flags Mike MUST mention:**
- Coil icing from excess outdoor air humidity can cause condensate overflow and water damage in ductwork
- Code compliance (ASHRAE 90.1 or Title 24): verify the economizer configuration meets the applicable energy code for the installation location

**Tone/Mike notes:** "Economizing at 75°F in Houston — that's not free cooling, that's free humidification. Lower the setpoint or add enthalpy control."

**Source:** PNNL Building Re-Tuning economizer section, buildingretuning.pnnl.gov; ASHRAE Standard 15 and A2L, contractingbusiness.com; Trane RTU economizer documentation, trane.com

---

## SCENARIO 94 — York YCAL chiller oil separator fault

**Symptom (verbatim):** "York YCAL 120-ton chiller. Oil pressure differential showing low, oil return sight glass looks empty. Compressor oil level critically low."

**Equipment:** York YCAL air-cooled screw compressor chiller.

**Correct diagnostic path:**
1. Low oil differential pressure + empty sight glass = oil has migrated out of the compressor into the refrigerant circuit
2. This is an oil management problem, not a simple "add oil" situation — find where the oil went
3. Check oil separator efficiency: screw compressors use oil-flooded design with an oil separator — if separator is degraded, oil carries over into refrigerant circuit
4. Check oil return line from oil separator to compressor — clogged screen or check valve in oil return line prevents oil from returning
5. Inspect refrigerant evaporator for oil accumulation — drain oil from evaporator if accessible
6. Verify operating envelope: if chiller regularly runs at part load and low evaporator temperatures, oil return velocity may be insufficient to carry oil back
7. York YCAL: check oil heater — if oil heater fails, oil becomes viscous and won't separate or return properly at startup
8. Verify refrigerant charge is correct — overcharge reduces oil return velocity in suction line

**Most likely root cause:** Failed oil return check valve OR degraded oil separator allowing excessive oil carryover

**Safety flags Mike MUST mention:**
- Running screw compressor with critically low oil causes bearing failure within minutes — do NOT restart until oil level is restored and root cause fixed
- Adding oil without addressing root cause will result in repeat failure and potential compressor damage

**Tone/Mike notes:** "Empty oil sight glass on a York screw — do not start it. Find where the oil went before you add any."

**Source:** York YCAL fault codes and operations, manualslib.com; York chiller troubleshooting, partshnc.com; York chiller troubleshooting, partstown.com

---

## SCENARIO 95 — Commercial VRF system, ASHRAE 15 leak detector alarm in mechanical room

**Symptom (verbatim):** "Building management system shows refrigerant leak alarm in the mechanical room where the VRF outdoor unit manifold and isolation valves are. ASHRAE 15 detector triggered."

**Equipment:** Commercial VRF system, refrigerant mechanical room with ASHRAE 15-required leak detector (Bacharach, MSA Chillgard, or SensAC).

**Correct diagnostic path:**
1. ASHRAE 15: mechanical room detector is mandatory for refrigerating machinery rooms — alarm actuation requires audible + visual alert, and mechanical ventilation activation
2. Do NOT enter the mechanical room alone until ventilation system has been confirmed running
3. Two-person protocol: one outside to manage building response, one trained technician enters with personal gas detector after room ventilation confirmed
4. Locate source: use calibrated handheld leak detector, search at floor level (R-410A is heavier than air)
5. Check all manifold connections, isolation valve stems, pressure transducer fittings
6. If VRF uses port isolation valves: use port isolation to quarantine the leaking circuit while allowing other circuits to remain operational
7. Repair leak, pressure test, evacuate, recharge by weight
8. After repair: clear detector alarm, verify detector is operational (test function per manufacturer)
9. Document the event in building maintenance records — ASHRAE 15 compliance documentation

**Most likely root cause:** Refrigerant leak at mechanical room header, manifold fitting, or service valve stem packing

**Safety flags Mike MUST mention (CRITICAL):**
- ASHRAE 15 alarm = potential asphyxiation hazard in an enclosed mechanical room — treat as serious
- Mandatory ventilation must run during and after repair — verify exhaust fan operation
- Manual reset type alarm required per ASHRAE 15 — do not auto-clear without technician inspection

**Tone/Mike notes:** "ASHRAE 15 alarm is not a nuisance alarm — it's a code requirement. Follow the protocol: ventilate, enter safely, find the leak."

**Source:** ASHRAE 15-2022 refrigerant safety requirements, samon.com; VRF refrigerant leak detection, vrfwizard.com; ASHRAE 15 VRF violations, contractingbusiness.com

---

## SCENARIO 96 — Multi-zone commercial VRF, wrong mode — heating in cooling-only zones

**Symptom (verbatim):** "Large Daikin VRV heat recovery system. Two conference rooms calling for cooling. Both showing active heat — blowing warm air. Other zones cooling fine."

**Equipment:** Daikin VRV IV heat recovery system, mixed heating/cooling operation.

**Correct diagnostic path:**
1. Zones calling for cool but blowing heat = branch selector box supplying hot gas instead of liquid refrigerant to those zones
2. Access iTM or service mode: check BSB port assignments for the two conference rooms — are they assigned to liquid (cooling) or hot gas (heating) supply?
3. Check BSB solenoid valve positions for those ports — solenoid in heating position when cooling is commanded
4. Check for communication fault between outdoor unit and BSB for those branches
5. Verify zone controller mode setting — is the zone controller sending a cooling call or has it been left in heating mode?
6. Check if zone temperature is below setpoint and controller has logic to send heat even though building occupant wants cool
7. Inspect BSB for solenoid valve that is mechanically stuck in heating position (valve body debris)
8. If BSB solenoid verified working: check outdoor unit mode assignment for those branch circuits in the configuration

**Most likely root cause:** BSB solenoid stuck in heating position OR zone controller misconfigured to heat mode

**Safety flags Mike MUST mention:**
- Running heating when tenants expect cooling causes immediate comfort complaint and potentially overheating in conference room occupants — urgent resolution
- Before condemning BSB solenoid: verify zone controller is actually sending a cooling command signal

**Tone/Mike notes:** "Blowing heat when they asked for cool — check the BSB solenoid position for those zones first. Then go to the controller."

**Source:** Daikin VRV branch selector box diagnostics, mountainmechanicalny.com; Mitsubishi City Multi BC controller diagnostics, mitsubishielectric.co.uk

---

## SCENARIO 97 — Commercial RTU supply fan belt failure, airflow loss

**Symptom (verbatim):** "Commercial RTU, 15-ton belt-drive. Customer says no air coming from vents. Compressor running, condenser fan running."

**Equipment:** Commercial packaged RTU with belt-driven supply fan.

**Correct diagnostic path:**
1. Compressor and condenser fan running but no supply air = supply fan not moving air
2. Access unit fan section: inspect belt visually — broken, slipped, or glazed belt causes complete airflow loss
3. Check belt tension — correct tension per manufacturer (typically 3/4" deflection per foot of belt span under 10 lb force)
4. Inspect blower wheel for debris loading — accumulated debris stops blower wheel rotation
5. Check blower shaft bearings — seized bearing causes belt to slip or break
6. Verify fan motor rotation and amperage — if motor running and belt intact but no airflow: wheel is spinning backwards (3-phase connection reversed after maintenance)
7. Check supply air ductwork for collapsed or disconnected sections
8. If belt is intact and fan is spinning: check discharge air damper or economizer damper position — fully closed blocks all airflow

**Most likely root cause:** Broken or slipped V-belt — extremely common on commercial RTUs over 3 years old, especially if belt hasn't been on a PM schedule

**Safety flags Mike MUST mention:**
- Running compressor without airflow across indoor coil causes coil freeze-up within 10–15 minutes — if this has been running without airflow, check for iced coil before restarting
- Belt replacement: replace and adjust tension correctly per spec, check belt sheave condition — grooved sheave destroys replacement belts rapidly

**Tone/Mike notes:** "No air but compressor's running — check the belt. That's literally the first thing you look at on a belt-drive RTU."

**Source:** Commercial HVAC system troubleshooting, nextechna.com; Carrier RTU troubleshooting, hvacknowitall.com

---

## SCENARIO 98 — Chiller low evaporator pressure, Texas summer, 120-ton unit

**Symptom (verbatim):** "York YCAL 120-ton chiller. July in Texas. Low evaporator pressure alarm, running at 40% capacity. Building is 78°F, setpoint is 72°F."

**Equipment:** York YCAL air-cooled screw chiller, Texas climate, summer peak.

**Correct diagnostic path:**
1. Low evaporator pressure in high ambient: check refrigerant charge and condenser performance first
2. Verify condensing pressure is within spec at current outdoor ambient (100°F+ Texas July afternoon)
3. High condensing pressure at high ambient reduces refrigerant mass flow through expansion device → lower evaporator pressure
4. Check all condenser fans operating at full speed — York YCAL uses multiple condenser fans in stages
5. Check condenser coil condition — cottonwood, dust, or debris reduces condenser capacity drastically
6. Measure subcooling — if subcooling is low, condensing capacity is compromised
7. Verify chilled water return temperature — if CWT is too high, chiller is undersized or coil fouled
8. Check York YCAL refrigerant charge documentation — verify charge hasn't been disturbed
9. At 40% capacity: check if capacity limiter is active (demand limiting from BAS or building energy management)

**Most likely root cause:** Partially fouled condenser coils reducing condensing capacity at peak ambient, causing low evaporator pressure via reduced refrigerant mass flow

**Safety flags Mike MUST mention:**
- July Texas — 100°F+ ambient is within or beyond design conditions for many units; confirm equipment is rated for actual ambient
- Condenser coil cleaning on microchannel: no high-pressure water, no acid cleaner without manufacturer approval
- Refrigerant recovery required for any charge adjustment

**Tone/Mike notes:** "Texas July, 40% capacity, low evap pressure — that condenser is working way too hard. Clean the coils and check all the fans before you start chasing a refrigerant problem."

**Source:** York YCAL operational documentation, manualslib.com; York chiller troubleshooting, partshnc.com; Carrier AquaSnap condenser approach temperature, trainingcarrierwest.com

---

## SCENARIO 99 — Commercial VRF multiple zone comfort complaints, BAS control conflict

**Symptom (verbatim):** "10-zone LG Multi V system, new BAS integration. Since BAS went online last week, half the zones are always 4-5 degrees off setpoint. No VRF faults."

**Equipment:** LG Multi V5 VRF, BACnet BAS integration via LG PQNFB BACnet interface.

**Correct diagnostic path:**
1. Timing correlation: problems started with BAS integration = BAS is interfering with VRF zone control
2. Check if BAS is writing setpoints to VRF zones OR just reading status
3. BAS setpoint write + local zone controller write = two masters fighting — BAS setpoint may be wrong or using incorrect units (°C vs °F, for example)
4. Verify BAS setpoint scaling: LG VRF via BACnet typically uses setpoints in tenths of degree — BAS sending "72" instead of "720" results in 7.2°F setpoint
5. Check BAS schedule: if BAS is sending setback setpoints during occupied hours, zones will be off
6. Verify LG Multi V BACnet object definitions match BAS expectations — some integrations require software mapping from installer
7. Temporarily disconnect BAS from LG Multi V and operate zones locally — if comfort restores immediately, BAS is the cause
8. Work with BAS programmer to correct setpoint values and confirm proper BACnet read/write permissions

**Most likely root cause:** BAS writing incorrect setpoints (unit scaling error — °C vs °F or integer vs tenth-degree) to LG Multi V zones

**Safety flags Mike MUST mention:**
- BAS/VRF integration must be tested zone by zone before occupancy — verify each zone responds correctly to BAS setpoints
- Document as-found BAS setpoint values vs. corrected values for building records

**Tone/Mike notes:** "Problems started exactly when BAS went online — the BAS is doing it. Find what it's writing and verify the units are correct."

**Source:** LG Multi V5 service manual, manualslib.com; LG VRF error codes and BAS integration, acerrorcode.com

---

## SCENARIO 100 — Carrier AquaSnap chiller compressor trip, low ambient startup

**Symptom (verbatim):** "Carrier AquaSnap 30RB, February morning startup. Compressor trips immediately on low pressure when it starts."

**Equipment:** Carrier AquaSnap 30RB air-cooled chiller, cold morning startup.

**Correct diagnostic path:**
1. Cold ambient startup: R-410A saturation pressure drops with temperature — below 30°F ambient, suction pressure may be below LP cutout at startup
2. AquaSnap 30RB requires minimum outdoor ambient of 10°F for operation with proper low-ambient kit — verify kit is installed
3. Check crankcase heater (compressor sump heater): if heater failed, refrigerant migrated to compressor sump overnight → liquid slugging on startup
4. Verify crankcase heater operation: 24 hours pre-heat required before cold morning startup (standard procedure for scroll compressors)
5. Check pumpdown sequence: AquaSnap should pumpdown refrigerant before shutdown — if solenoid valve failed, refrigerant migrated to compressor
6. If LP trip clears after 30-second startup: head pressure buildup is slow in cold ambient — normal for some systems; verify low ambient kit operation
7. Measure suction pressure at startup against LP cutout setting — if pressures are too close, low ambient setpoint needs adjustment

**Most likely root cause:** Crankcase heater failure causing refrigerant migration to compressor overnight → LP trip on cold startup

**Safety flags Mike MUST mention:**
- Crankcase heater failure + cold ambient = serious liquid slugging risk — do not force start until compressor has been heated
- If crankcase heater has been off multiple days and temps were below 20°F: inspect compressor oil for refrigerant dilution before restart

**Tone/Mike notes:** "Cold morning LP trip — crankcase heater first. If that heater's dead, you're not starting that chiller until it's had 24 hours of preheat."

**Source:** Carrier AquaSnap 30RB fault codes, manualslib.com; Carrier AquaSnap 30RAP handbook, trainingcarrierwest.com

---

## SCENARIO 101 — Commercial heat pump RTU defrost recovery time excessive

**Symptom (verbatim):** "Commercial heat pump rooftop, 20-ton. Defrost is running 15+ minutes. Building gets cold during defrost. Comes out of defrost OK but takes forever."

**Equipment:** Commercial heat pump RTU, 20-ton, outdoor ambient 30–35°F.

**Correct diagnostic path:**
1. Defrost should terminate when outdoor coil reaches ~57°F — defrost timer max is typically 10 minutes
2. If defrost exceeds 10 minutes: defrost termination thermostat is not opening — coil not reaching 57°F within the timer
3. Check defrost termination thermostat calibration — if thermostat has drifted, it may require higher coil temp to open
4. Verify reversing valve is fully switching to cooling mode during defrost — partial valve switching means less hot gas to outdoor coil
5. Check condenser fans: they should be OFF during defrost; if any fan runs during defrost, it prolongs defrost by cooling the coil
6. Verify refrigerant charge — low charge means less hot gas mass flow to defrost coil → defrost takes longer
7. Check frost accumulation pattern: if frost forms heavily on one section only, check for uneven airflow across outdoor coil
8. 15-minute defrost in a 20-ton commercial system: significant heat extracted from building; supplemental heat (electric or gas) should kick in — verify aux heat is active during defrost

**Most likely root cause:** Reversing valve not fully switching OR low refrigerant charge → insufficient hot gas to melt frost within 10-minute limit

**Safety flags Mike MUST mention:**
- Prolonged defrost cycles steal significant heating capacity from the building — if occupants are cold during defrost, verify supplemental heat is operational
- Defrost timer override: do NOT permanently extend defrost timer — correct root cause

**Tone/Mike notes:** "15-minute defrosts on commercial heat pump — that's too long. The coil isn't getting hot enough fast enough. Reversing valve or charge."

**Source:** Heat Pump Defrost Diagnosis, contractingbusiness.com; ACHR News defrost sensor diagnosis, achrnews.com; BC NPA Heat Pump RTU Operator Training, bcnpha.ca

---

## SCENARIO 102 — Commercial VRF system, inverter noise complaint

**Symptom (verbatim):** "New Samsung DVM S outdoor unit installed on roof. Tenant below complaining of high-frequency buzzing, even at night when building is cool."

**Equipment:** Samsung DVM S commercial VRF outdoor unit, rooftop installation.

**Correct diagnostic path:**
1. High-frequency buzzing from VRF outdoor unit on roof: inverter PWM carrier frequency can transmit through structure
2. Verify the noise is from the VRF unit specifically — confirm by briefly shutting down unit
3. Check outdoor unit mounting: vibration isolators required on rooftop installations — missing or bottomed-out isolators transmit inverter vibration to structure
4. Check unit leveling — off-level unit puts abnormal load on compressor mounts, amplifying vibration
5. Samsung DVM S: check if carrier frequency setting in inverter parameters can be adjusted (some VRF inverters allow carrier frequency modification to move noise above hearing range)
6. Inspect refrigerant piping connections to building structure — hard-piped connections without vibration isolation carry noise
7. Verify compressor mounting bolts are at proper torque — loose compressor mounts amplify noise
8. If noise is during low-speed modulation: check for minimum speed parameter — some units allow raising minimum speed to reduce resonance

**Most likely root cause:** Missing or degraded vibration isolators on rooftop mounting causing inverter/compressor vibration to transmit into building structure

**Safety flags Mike MUST mention:**
- Noise complaints from commercial tenants are a liability issue — document investigation and findings
- Do not adjust inverter carrier frequency without manufacturer authorization — may affect motor protection

**Tone/Mike notes:** "High-frequency buzz from a rooftop VRF — it's either the isolators or the piping connections. Structural noise transmission is a real thing and it's a job for vibration isolators."

**Source:** Samsung DVM S service training, samsunghvac.com; VRF installation best practices, contractingbusiness.com

---

## SCENARIO 103 — Commercial chiller, condenser water pump VFD fault, system shutdown

**Symptom (verbatim):** "Water-cooled chiller, condenser water loop pump VFD tripped on fault. Chiller shutdown within 30 seconds."

**Equipment:** Water-cooled commercial chiller with VFD on condenser water pump.

**Correct diagnostic path:**
1. Condenser water pump VFD fault → flow to condenser lost → chiller high-pressure trip and shutdown is automatic and correct
2. Do NOT restart chiller until condenser water pump is restored
3. Access VFD fault log: identify fault type (OC, UV, OT = overcurrent, undervoltage, overtemperature)
4. Overcurrent on CW pump VFD: check for closed isolation valve on condenser water loop — closed valve causes pump overload
5. Check VFD temperature: if VFD overtemperature fault, check VFD cooling fan and ambient temperature in mechanical room
6. If UV fault: check three-phase supply voltage to VFD at time of fault — may coincide with other electrical load starting
7. Inspect condenser water strainer — clogged strainer increases pump load → overcurrent
8. After VFD fault cleared and pump restored: verify condenser water flow before restarting chiller

**Most likely root cause:** Clogged condenser water strainer causing pump overcurrent OR VFD overtemperature from inadequate ventilation in mechanical room

**Safety flags Mike MUST mention:**
- Never restart water-cooled chiller without confirming condenser water flow — high-pressure trip will recur and potentially cause equipment damage
- Check condenser water strainer quarterly — especially after any system drain-down or waterside maintenance

**Tone/Mike notes:** "CW pump VFD tripped, chiller shut down — that's correct behavior. Don't restart the chiller until the pump is running. Find the VFD fault first."

**Source:** VFD overcurrent fault diagnosis, precision-elec.com; VFD troubleshooting, emotron.com; York chiller troubleshooting, partshnc.com

---

## SCENARIO 104 — Mitsubishi City Multi heat recovery, simultaneous heating + cooling capacity exceeded

**Symptom (verbatim):** "City Multi R2 heat recovery, 48-zone office building. Winter morning, 30 zones calling heat, 18 cooling. System is not keeping up on either side."

**Equipment:** Mitsubishi City Multi R2-series heat recovery VRF, large commercial installation.

**Correct diagnostic path:**
1. R2 heat recovery: outdoor unit capacity allocated between simultaneous heating and cooling demands
2. Check total capacity balance: if net heating load (heating BTUs minus cooling BTUs recovered) exceeds outdoor unit capacity, system cannot satisfy all zones
3. Review outdoor unit model and rated heating capacity at ambient temperature — capacity degrades in cold weather
4. In heating-dominant winter scenario: system runs cooling zones to recover heat for heating zones (refrigeration cycle efficiency)
5. Check if combination ratio is exceeded: sum of connected indoor unit capacities must be within manufacturer's combination ratio limits
6. Look for zones calling for heat that don't need it — ghost calls from failed thermostats holding open heating request
7. Verify outdoor unit defrost is not occurring simultaneously with peak demand
8. Review priority settings: in R2 system, can specify heating or cooling priority if capacity is insufficient

**Most likely root cause:** Total connected load exceeds system capacity on cold morning — compounded by combination ratio being right at limit

**Safety flags Mike MUST mention:**
- Combination ratio violations are a design issue — correcting in the field requires disconnecting indoor units
- Document capacity shortfall and report to building owner/engineer — potential system resizing needed

**Tone/Mike notes:** "48-zone winter morning, 30 heating, 18 cooling — you're at the edge of what the outdoor unit can do. Check the combination ratio and verify no ghost heating calls."

**Source:** Mitsubishi PURY-P service handbook, mitsubishitechinfo.ca; Mitsubishi City Multi VRF system design, mitsubishitechinfo.ca

---

## SCENARIO 105 — Commercial R-32 split system, first service call

**Symptom (verbatim):** "Just got dispatched to a commercial Daikin SkyAir unit with R-32 refrigerant. It's a smaller light-commercial system. First time working on R-32. What do I need to know?"

**Equipment:** Daikin SkyAir commercial split system, R-32 refrigerant (A2L).

**Correct diagnostic path:**
1. R-32 is an A2L mildly flammable refrigerant — different handling protocol from R-410A
2. R-32 LFL: 14.4% by volume (slightly lower LFL than R-454B at 10.2%)
3. R-32 GWP: 675 (vs R-410A at 2,088) — significantly lower GWP, part of the industry transition
4. Tool requirements for R-32:
   - A2L-rated recovery machine
   - R-32 compatible manifold gauges (higher pressure ratings, appropriate seals)
   - Non-sparking tools for refrigerant circuit work
   - A2L-rated leak detector (calibrated for R-32)
5. R-32 charging: single-component refrigerant — can be charged as vapor or liquid (no fractionation issue unlike R-454B)
6. Evacuation: pull to 500 microns before recharge
7. Leak detection: electronic leak detector at floor level (R-32 is heavier than air)
8. Daikin SkyAir R-32: confirm factory leak detection system is operational before any refrigerant work

**Most likely root cause scenario:** First A2L service call — technician preparation checklist

**Safety flags Mike MUST mention (CRITICAL):**
- R-32: mildly flammable — NO open flame, NO halide torch, NO sparking tools around refrigerant circuit
- R-32 decomposes under high heat — produces HF acid if heated above ~400°C; proper PPE if heated leak or fire
- A2L training is mandatory before servicing — verify technician certification before proceeding

**Tone/Mike notes:** "R-32 is not the same as R-410A. Get the right detector, the right recovery machine. Don't free-vent it and don't work near ignition sources."

**Source:** A2L Refrigerant Safety Guide R-32 R-454B, hvactoolkit.org; ASHRAE Standard 15-2024, ashrae.org; Daikin VRV error codes, daikin.com; R-454B guide 2026, surpluscityliquidators.com

---

## SCENARIO 106 — Commercial RTU phase loss, compressor locked out

**Symptom (verbatim):** "Commercial 10-ton RTU, three-phase power. Compressor locked out, contactor pulls in but compressor hums and trips on thermal overload."

**Equipment:** Commercial packaged RTU, three-phase 460VAC.

**Correct diagnostic path:**
1. Compressor hums but doesn't start + trips thermal overload = phase loss or phase imbalance (single phasing)
2. Measure all three phases at compressor terminal block with unit energized — single phasing will show two phases at normal voltage and the third at 0V or very low
3. Check compressor contactor: verify all three poles are making — burned or pitted contact on one pole creates phase loss at the compressor
4. Check feeder wiring: measure three phases at the unit disconnect, at the contactor line side, and at the contactor load side — locate where the missing phase drops out
5. Check all three fuses in the disconnect — blown fuse on one phase is common cause
6. If phase voltage is present at all three terminals but compressor won't start: check for internal compressor thermal protector — if tripped, requires 30+ minutes to reset
7. After thermal protector cools: recheck phase balance, then attempt restart with current monitoring on all three phases
8. Phase imbalance above 2% between phases causes motor heating — investigate utility supply if fuses and contactors are OK

**Most likely root cause:** Burned compressor contactor contact on one pole (most common) OR blown fuse on one phase

**Safety flags Mike MUST mention:**
- Single-phase operation of three-phase motor causes rapid overheating — if compressor has run single-phased, check winding insulation before restarting
- Do NOT repeatedly reset thermal overload — each manual reset attempt while problem persists further damages compressor windings

**Tone/Mike notes:** "Hum and thermal trip — it's single phasing. Check all three phases at every point from the feed to the compressor. The missing phase is somewhere in that path."

**Source:** Carrier RTU controls and troubleshooting, shareddocs.com; Carrier RTU problems, northbreezehvac.com

---

## SCENARIO 107 — Commercial packaged unit, gas heat ignition failure intermittent

**Symptom (verbatim):** "York commercial RTU, gas heat. Works fine Monday through Thursday. Fails to light every Friday afternoon. Building manager says it never fails when service tech is there."

**Equipment:** York commercial packaged gas-electric RTU.

**Correct diagnostic path:**
1. Intermittent ignition failure that doesn't reproduce during service call = environmental trigger
2. "Friday afternoon" pattern: think about occupancy or utility changes (lower gas pressure when nearby kitchen peaks at lunch/dinner?)
3. Monitor gas pressure during Friday afternoon window — manometer at unit gas inlet
4. Low gas pressure on Friday = shared gas service overloaded by other building occupants
5. Check igniter condition: silicone nitride igniter that works when cold may fail at high cycle count when hot
6. Hot surface igniter: measure resistance when cold (verify in range per spec) and verify it glows visibly when called
7. Check gas valve: measure manifold pressure during an attempted ignition — if pressure is 3.5" WC at other times but 2.8" WC on Friday afternoon, that's the gas supply
8. Document finding: if utility pressure is low, that's the gas supplier's problem to resolve; document for building owner

**Most likely root cause:** Low gas pressure on Friday afternoon from shared service overload OR intermittent igniter failure (hot igniter, high cycle count)

**Safety flags Mike MUST mention:**
- Gas pressure diagnosis requires a manometer/magnehelic — do not estimate or assume gas pressure is adequate
- If gas pressure confirmed low due to utility: install a data logger on Friday — document pressure data for utility company

**Tone/Mike notes:** "Only fails Friday afternoons — that pattern is gold. Either gas pressure or something that changes on Friday. Log it before you swap parts."

**Source:** Commercial HVAC diagnostics, nextechna.com; Carrier 48HC service manual, trainingcarrierwest.com

---

## SCENARIO 108 — VRF system, outdoor unit high-pressure trip during simultaneous multi-zone startup

**Symptom (verbatim):** "Large Mitsubishi City Multi, 36 zones. Every morning when the BAS brings the whole system online at 7am, outdoor unit trips HP. If zones start gradually it's fine."

**Equipment:** Mitsubishi City Multi R2 commercial VRF, BAS scheduling startup.

**Correct diagnostic path:**
1. Simultaneous startup of 36 zones: massive sudden refrigerant demand — outdoor unit cannot supply full load instantaneously
2. All EEVs open simultaneously → suction pressure drops rapidly → compressor loads hard → discharge pressure spikes → HP trip
3. Solution: stagger zone startup in BAS — stage indoor units in groups of 6-8, with 2-3 minute delay between each group
4. Check if City Multi has a "soft start" or demand management setting — some Mitsubishi systems have a ramp-up parameter for system startup
5. Verify outdoor unit capacity matches total connected indoor load — simultaneous 100% load may exceed outdoor unit capacity
6. Check system combination ratio — if connected capacity is at maximum, simultaneous startup is even more critical
7. After implementing staggered startup: monitor for HP trips; if they continue even staggered, then look at outdoor unit capacity and refrigerant charge

**Most likely root cause:** BAS commanding all 36 zones simultaneously on startup, causing instantaneous demand overload

**Safety flags Mike MUST mention:**
- Repeated HP trips at startup stress compressor bearings and discharge valve assemblies — document frequency with building manager
- BAS startup sequencing is a programming fix, not a mechanical repair — involve BAS programmer

**Tone/Mike notes:** "HP trips only at 7am simultaneous startup — that's not a mechanical problem, it's a controls sequencing problem. Stagger the zones."

**Source:** Mitsubishi City Multi large system commissioning, mehvac.com; Mitsubishi PURY-P service handbook, mitsubishitechinfo.ca

---

## SCENARIO 109 — Commercial WSHP, heat exchanger leak, refrigerant in water loop

**Symptom (verbatim):** "WSHP system, building loop water analysis showing oil contamination. One unit has been making a hissing noise."

**Equipment:** Commercial water-source heat pump, building loop system.

**Correct diagnostic path:**
1. Oil in building loop water = refrigerant compressor oil has crossed from refrigerant circuit to water circuit through a failed heat exchanger
2. The hissing unit is the source — refrigerant leaking from refrigerant side to water side through a cracked or pitted tube
3. Isolate the hissing WSHP unit from the building loop (close water supply and return isolation valves)
4. Test water-to-refrigerant heat exchanger integrity: pressure test waterside with nitrogen (30–40 psig) while watching refrigerant circuit gauges for pressure rise
5. If nitrogen appears in refrigerant circuit: heat exchanger tube failure confirmed
6. Remove water-side contaminated oil: drain and flush affected section of building loop
7. Coordinate with water treatment contractor to test entire building loop for oil level
8. After heat exchanger replacement: conduct full building loop water analysis for oil and pH

**Most likely root cause:** Corroded or pitted coaxial or plate heat exchanger allowing refrigerant/oil migration to building water loop

**Safety flags Mike MUST mention:**
- Contaminated building water loop can affect all connected WSHP units — scope the problem across the entire building
- Oil in water loop reduces heat transfer efficiency in all units — water loop must be cleaned before returning to service
- Refrigerant leak into building loop: verify no refrigerant odor or foam in loop water suggesting active leak still occurring

**Tone/Mike notes:** "Oil in the loop water — one of your WSHPs has a leaking heat exchanger. Isolate, pressure test, find it. The oil didn't get there by itself."

**Source:** Water source heat pump troubleshooting, aristotleair.com; WSHP maintenance guide, servi-tek.net

---

## SCENARIO 110 — Commercial AHU polarized media air cleaner, increased fan pressure drop

**Symptom (verbatim):** "Commercial AHU, tenant complaining about reduced airflow. Balancing contractor found all grilles are 20% below design. IAQ accessory was installed 6 months ago."

**Equipment:** Commercial AHU with polarized media electronic air cleaner installed in filter section.

**Correct diagnostic path:**
1. 20% airflow reduction system-wide after IAQ accessory install = the accessory created an unexpected pressure drop
2. Measure static pressure across the IAQ media cell section — compare to design pressure drop specification
3. Many polarized media systems have loading indicators — check if cells are past their cleaning interval
4. Polarized media cells load faster than expected in dusty commercial environments — quarterly cleaning may be required, not annual
5. Check if pre-filter was also installed and is loaded — double filter pressure drop
6. Verify fan curve: does the existing fan have capacity to overcome the additional pressure drop from the IAQ accessory?
7. If cells are clean and pressure drop still exceeds spec: the IAQ accessory was installed without verifying the AHU fan can handle the additional static pressure
8. Solution may require fan upgrade (motor, drive, or sheave) OR removing IAQ accessory and replacing with lower-pressure-drop media

**Most likely root cause:** Polarized media cells past cleaning interval creating elevated pressure drop OR IAQ accessory installed without fan capacity review

**Safety flags Mike MUST mention:**
- Reduced airflow in commercial building = ASHRAE 62.1 minimum ventilation rates may not be met — IAQ compliance issue
- Document finding and advise building owner; IAQ accessory installer should have included a fan capacity review

**Tone/Mike notes:** "Airflow dropped after IAQ install — those media cells have pressure drop. Check if they're dirty and whether the fan can actually push through them."

**Source:** IAQ applications for modern HVAC, respicaire.com; ERV and IAQ monitoring, oxmaint.com

---

## SCENARIO 111 — Bryant/Payne commercial RTU, refrigerant charge verification on new startup

**Symptom (verbatim):** "Just started up a Bryant Evolution commercial RTU, 7.5-ton. How do I verify the charge is correct on initial startup?"

**Equipment:** Bryant Evolution / Payne commercial packaged RTU, R-410A, new installation.

**Correct diagnostic path:**
1. R-410A factory-charged units: verify refrigerant charge using superheat (TXV systems) or subcooling method
2. For TXV-equipped commercial RTU: target subcooling of 10–15°F at the condenser outlet
3. Connect manifold gauges at service ports
4. Measure liquid line temperature using accurate digital clamp-on thermocouple
5. Calculate saturated condensing temperature from discharge pressure (use R-410A PT chart)
6. Subcooling = saturated condensing temp − liquid line temp
7. If subcooling under 5°F: refrigerant low, system undercharged
8. If subcooling over 20°F: refrigerant high, system overcharged
9. Allow system to stabilize 15 minutes at steady-state conditions before making charge determination
10. Verify outdoor ambient and indoor load are within testable ranges — cannot accurately check charge during extreme conditions

**Most likely root cause scenario:** New startup charge verification procedure

**Safety flags Mike MUST mention:**
- Factory charge is correct for standard piping; line sets over 25 ft require per-foot additions per manufacturer spec
- Do not charge by pressure — always charge by weight or subcooling; pressure alone is not sufficient for accurate charge verification
- Record as-started charge data (subcooling, superheat, pressures, ambient) on startup report

**Tone/Mike notes:** "New startup charge check — use subcooling on a TXV system. Let it stabilize first. Don't rush and don't use pressure alone."

**Source:** Carrier 48HC service manual charge verification, trainingcarrierwest.com; R-410A operating pressures, acdirect.com; Carrier RTU startup procedures

---

## SCENARIO 112 — Commercial VRF, address duplication discovered during expansion

**Symptom (verbatim):** "Adding 4 indoor units to an existing Daikin VRV IV system. After adding units, two original units stopped working. Getting U0 fault."

**Equipment:** Daikin VRV IV commercial system being expanded.

**Correct diagnostic path:**
1. U0 on Daikin = refrigerant shortage OR address conflict — in expansion context, suspect address conflict
2. New indoor units were assigned addresses that conflict with existing indoor units
3. Check ALL indoor unit addresses before and after expansion — maintain an address register document
4. Daikin VRV IV: indoor unit addresses set via DIP switches on indoor unit PCB (older) or via service tool on newer units
5. Identify the two units that stopped working — what addresses are they set to?
6. Check if any of the 4 new units were assigned matching addresses
7. Re-address conflicting units with unique addresses
8. Power cycle outdoor unit after all addresses corrected to force bus rescan
9. After expansion: verify Daikin Intelligent Touch Manager (if installed) shows all correct unit counts and addresses

**Most likely root cause:** New indoor units installed with factory default addresses that conflict with existing units

**Safety flags Mike MUST mention:**
- Maintain an address map document on all VRF systems — required at commissioning and must be updated at every system change
- Address conflicts on heat recovery systems can cause refrigerant mode confusion — verify all unit modes after conflict resolution

**Tone/Mike notes:** "You added 4 units and 2 originals stopped — that's an address collision. The new units had factory defaults that matched the originals. Every address on every unit needs to be unique."

**Source:** Daikin VRV U4/U0 error codes, airreps.com; Daikin VRV addressing, coolautomation.com; Daikin VRV error codes, acerrorcode.com

---

## SCENARIO 113 — Commercial RTU, economizer minimum position inadequately set, ventilation violation

**Symptom (verbatim):** "Energy audit flagged the commercial RTU economizer minimum position is set to 0%. Building code requires minimum outdoor air per ASHRAE 62.1. This got flagged in a building inspection."

**Equipment:** Commercial RTU with modulating economizer, occupied commercial building.

**Correct diagnostic path:**
1. Economizer minimum position at 0% = zero outdoor air delivered during mechanical cooling — ASHRAE 62.1 violation
2. ASHRAE 62.1 requires minimum outdoor air based on occupancy and floor area (typically 15–20 CFM per person + 0.06–0.12 CFM/sq ft depending on space type)
3. Calculate required minimum outdoor air CFM for the served space
4. Determine minimum damper position (%) that delivers required OA CFM — requires airflow measurement (pitot traverse or flow hood at OA opening)
5. Set economizer minimum position in controller to deliver required OA volume
6. Verify minimum position setting is not overridden by economizer control in low-ambient conditions — minimum position should hold even in cold weather
7. Document corrected minimum position and airflow measurement
8. If DCV is installed: verify DCV modulates above minimum (not below it) — DCV is a ventilation credit, not a substitute for minimums

**Most likely root cause:** Economizer controller improperly commissioned with 0% minimum position (common installation error — installer focused on energy savings, missed ventilation requirement)

**Safety flags Mike MUST mention:**
- ASHRAE 62.1 minimum ventilation is a code requirement, not a recommendation — building with 0% OA position may have IAQ liability exposure
- Occupants in buildings with inadequate ventilation experience higher CO2 levels, increased sick building complaints, and potential health impacts

**Tone/Mike notes:** "Zero percent minimum position on an economizer — that's a code violation and an IAQ problem. Calculate what they need, set the minimum, and document it."

**Source:** Trane DCV setup, support.trane.com; PNNL Building Re-Tuning economizer, buildingretuning.pnnl.gov; Demand-Controlled Ventilation maintenance, oxmaint.com

---

## SCENARIO 114 — Chiller, evaporator approach temperature alarm, NEBB commissioning baseline

**Symptom (verbatim):** "Chiller evaporator approach temperature is 8°F. Building engineer says at commissioning NEBB report showed 3°F. No alarms active, but building is hot."

**Equipment:** Commercial air-cooled or water-cooled chiller, approaching end of first 5-year operating period.

**Correct diagnostic path:**
1. Evaporator approach temperature = leaving chilled water temperature minus refrigerant saturation temperature
2. NEBB commissioning baseline: 3°F approach — current 8°F approach = 5°F degradation
3. This is a significant fouling indicator — evaporator tubes or plates are reducing heat transfer
4. Calculate chiller efficiency loss: every 1°F increase in approach temperature reduces capacity approximately 1.5% and increases energy consumption approximately 1%
5. At 5°F degradation: approximately 7.5% capacity loss and 5% energy penalty
6. Waterside: inspect and clean evaporator waterside — scale, biofilm, or silt accumulation
7. Review water treatment logs for the past 5 years — pH, conductivity, biological treatment records
8. Schedule eddy current test on evaporator tubes to verify no corrosion pitting
9. After cleaning: compare approach temperature to NEBB baseline — if still high, tube fouling may be more severe or on refrigerant side

**Most likely root cause:** Waterside evaporator tube fouling from inadequate water treatment over 5-year operating period

**Safety flags Mike MUST mention:**
- Chiller tube cleaning requires chemical or mechanical cleaning by qualified personnel — coordinate with water treatment contractor
- Eddy current test is the only way to non-destructively assess tube condition — required before any chemical acid cleaning

**Tone/Mike notes:** "NEBB baseline is 3°F, you're at 8°F — that's 5 degrees of fouling. Pull the water treatment records first. They'll tell you whether this was preventable."

**Source:** NEBB commissioning standards; York chiller troubleshooting guides, partshnc.com; Carrier AquaSnap chiller documentation, trainingcarrierwest.com; Chiller surge and maintenance, aircondlounge.com

---

## SCENARIO 115 — Commercial RTU low ambient DX cooling with head pressure control valve fault

**Symptom (verbatim):** "Commercial RTU with head pressure control kit installed for low ambient operation. March weather, 38°F ambient. Suction pressure keeps dropping every 20 minutes then recovering."

**Equipment:** Commercial packaged RTU with mechanical head pressure control kit (head pressure control valve HPCV or flooding valve).

**Correct diagnostic path:**
1. Cycling suction pressure in low ambient = head pressure control valve not maintaining stable condensing pressure
2. Head pressure control valve (flooding valve) floods liquid refrigerant into condenser at low ambient to artificially maintain head pressure
3. Check valve operation: measure discharge pressure — should be maintained at design point (typically 200–250 psig for R-410A system in low ambient)
4. If discharge pressure drops every 20 minutes then recovers: flooding valve is hunting — valve adjustment or failure
5. Inspect HPCV sensing bulb location — bulb must be on liquid line at condenser outlet, not on discharge line
6. Verify HPCV charge — some valves use a refrigerant charge in the sensing element that depletes over time
7. Check condenser fan cycling interaction — if fans cycle off but HPCV isn't compensating, transient low head pressure occurs
8. Compare to manufacturer's low ambient kit installation instructions — sensing line location and valve adjustment are critical

**Most likely root cause:** Improperly adjusted or failing head pressure control valve hunting — not maintaining stable condensing pressure

**Safety flags Mike MUST mention:**
- Low ambient DX cooling without proper head pressure control causes compressor damage from liquid floodback
- Document head pressure control operation and settings on startup record for this unit

**Tone/Mike notes:** "Hunting suction every 20 minutes in cold weather — the flooding valve is the first thing I'd look at. It's the heart of low-ambient operation."

**Source:** Carrier low ambient commercial RTU operations, trainingcarrierwest.com; Carrier 48HC product data, trainingcarrierwest.com

---

## SCENARIO 116 — VRF, tenant complaint, one zone operates in opposite mode from thermostat call

**Symptom (verbatim):** "Samsung DVM S 8-zone system. Tenant in Zone 5 sets thermostat to 70°F cooling. Unit blows heat. Every other zone responds correctly."

**Equipment:** Samsung DVM S commercial VRF.

**Correct diagnostic path:**
1. Single zone responding opposite to thermostat call = that zone's indoor unit mode signal is inverted or thermostat wiring is incorrect
2. Check Zone 5 wired controller — is it calling for cooling or heating in the menu? Tenant may have set it to "heat" mode accidentally
3. Verify Zone 5 indoor unit operating mode in DVM service mode — compare controller command to actual unit mode
4. Check control wiring between Zone 5 controller and indoor unit — crossed H/C signal wires cause reverse operation
5. If wiring correct: check Zone 5 indoor unit PCB for control input fault
6. Test: override Zone 5 indoor unit directly from Samsung VRF Coder software — if correct mode responds, controller or wiring is the problem
7. After any wiring correction: verify all 8 zones respond correctly in both modes

**Most likely root cause:** Zone 5 wired controller set to heating mode by tenant OR reversed mode signal wiring at indoor unit terminal block

**Safety flags Mike MUST mention:**
- Verify fix with tenant present — have them confirm zone responds as expected
- Document wiring correction on as-built drawing

**Tone/Mike notes:** "One zone backwards — start at the controller. Half the time it's the tenant accidentally switching the mode setting."

**Source:** Samsung DVM S service and troubleshooting, samsunghvac.com; Samsung VRF error codes, airnexus.io

---

## SCENARIO 117 — Commercial RTU, economizer FDD (Fault Detection and Diagnostics) compliance check

**Symptom (verbatim):** "Building owner just got a Title 24 notice of non-compliance. Commercial RTU economizers must have FDD per California code. What are the requirements and how do I verify?"

**Equipment:** Commercial RTU with economizer in California (Title 24 jurisdiction).

**Correct diagnostic path:**
1. California Title 24 requires economizer FDD (Fault Detection and Diagnostics) on commercial RTUs in most applications
2. FDD must detect: stuck damper, damper control failure, outside air sensor failure, return air sensor failure, and excessive simultaneous heating and cooling
3. Verify RTU manufacturer's economizer control board has FDD capability — most Carrier, Trane, and York units manufactured post-2012 include FDD in ComfortLink/Tracer/Novatek controls
4. Test FDD functionality: per Title 24, FDD system must be tested during commissioning and results documented
5. For units without built-in FDD: third-party FDD packages (Novatek, KMC, Honeywell) can be added
6. Pull the unit's control board diagnostics — confirm economizer FDD alarm outputs are wired to a monitored point (BAS or panel annunciator)
7. Document test results per California Title 24 Field Verification and Diagnostic Testing protocol
8. Provide owner with documentation for compliance record

**Most likely root cause scenario:** Economizer FDD was not verified during original commissioning

**Safety flags Mike MUST mention:**
- Title 24 FDD compliance is a legal requirement in California — non-compliance can result in fines and Certificate of Occupancy issues
- FDD systems only provide value if alarms are actually monitored by building maintenance staff

**Tone/Mike notes:** "Title 24 FDD — this is a commissioning and documentation issue. The controls are probably there, they just weren't documented or tested."

**Source:** Trane economizer fault codes and FDD, support.trane.com; AAON economizer FDD, aaon.com; PNNL Building Re-Tuning, buildingretuning.pnnl.gov

---

## SCENARIO 118 — Commercial VRF outdoor unit fan blade damage from hail

**Symptom (verbatim):** "Hail storm last night. Commercial VRF outdoor unit is on the ground, not on a roof. Fan blades dented. Customer wants to know if it's safe to run."

**Equipment:** Commercial VRF outdoor unit, ground-level installation.

**Correct diagnostic path:**
1. Hail damage assessment before any power-on
2. Inspect all fan blades for dents, cracks, or bent leading edges — even small dents change blade aerodynamics
3. Dented fan blades: reduced efficiency (capacity loss), increased vibration (bearing stress), possible blade fracture risk
4. Inspect condenser coil face for hail damage — hail can flatten aluminum fins, reducing airflow
5. Do NOT power up unit with known damaged fan blades — unbalanced rotation can damage motor bearings or cause blade-to-shroud contact
6. Document all damage with photos for insurance claim
7. If blades are dented but not cracked or bent severely: consult manufacturer before deciding to operate — some minor dents are acceptable with reduced efficiency
8. Cracked or fractured blades: immediate replacement required — no exceptions
9. Condenser fin damage: comb fins carefully with fin comb before restart to restore airflow

**Most likely root cause scenario:** Hail damage assessment and restart determination

**Safety flags Mike MUST mention:**
- Cracked fan blade can fracture during operation and become a high-speed projectile — never operate unit with structurally compromised blade
- Insurance documentation: photograph ALL damage before any repairs

**Tone/Mike notes:** "Don't power up a unit with damaged fan blades. Period. A cracked blade at 800 RPM is a serious safety hazard. Document it, get the parts, then fix it."

**Source:** Daikin VRV E7 fan motor fault, mountainmechanicalny.com; Commercial HVAC safety guidelines

---

## SCENARIO 119 — Multi-stage commercial DX cooling, discharge air temp not dropping with second stage

**Symptom (verbatim):** "Commercial 15-ton RTU, two-stage DX. Stage 2 compressor comes on (can hear it), but discharge air temp barely drops when it starts."

**Equipment:** Commercial RTU, two-stage DX, separate compressors for stage 1 and stage 2.

**Correct diagnostic path:**
1. Stage 2 compressor running but no additional cooling = stage 2 refrigerant circuit not contributing
2. Hook gauges on stage 2 circuit — verify suction and discharge pressures
3. If stage 2 discharge pressure near ambient saturation and suction near ambient: stage 2 service valve is closed — technician left it closed from prior service
4. If pressures are present but capacity zero: check stage 2 TXV/EEV — may be closed or stuck
5. Verify stage 2 liquid line solenoid (if equipped) is opening when compressor starts
6. Check stage 2 evaporator coil section for frost or ice — blocked evaporator coil passes no heat
7. Verify stage 2 circuit refrigerant charge independently
8. If low charge on stage 2 specifically: leak search on that circuit

**Most likely root cause:** Stage 2 service valve left closed from prior service OR stage 2 liquid line solenoid not opening

**Safety flags Mike MUST mention:**
- Closed service valve with compressor running: high discharge pressure builds rapidly on compressor discharge, LP suction drops — protections should trip quickly
- Always check service valve position as first step when a circuit isn't performing

**Tone/Mike notes:** "Stage 2 running but no cooling — check the service valves first. That's a 30-second check before you put gauges on anything."

**Source:** Carrier 48HC dual-circuit service, trainingcarrierwest.com; Fox Family HVAC two-stage troubleshooting, foxfamilyhvac.com

---

## SCENARIO 120 — Commercial ERV, freeze protection failure, core blocked with ice

**Symptom (verbatim):** "Commercial AHU with enthalpy wheel ERV. January in Minnesota. High static pressure alarm, very low outdoor air flow. Found ice on the ERV core."

**Equipment:** Commercial AHU with enthalpy recovery wheel, cold climate (Minnesota, January, -10°F ambient).

**Correct diagnostic path:**
1. Ice on ERV core in extreme cold: outdoor air moisture is freezing on the core before exhaust air can warm it
2. Check preheat coil upstream of ERV — preheat coil should warm outdoor air to minimum ~35°F before entering ERV; if preheat is failed, outdoor air enters at -10°F and immediately ice-forms on core
3. Inspect preheat coil valve or electric heating element — verify operation
4. Check ERV defrost sequence: most commercial ERVs have a defrost mode (reduced OA, increased exhaust) to allow ice to melt
5. Inspect frost sensor or outdoor air thermostat that triggers defrost — may have failed
6. Bypass mode: if core is severely iced, engage bypass mode to allow AHU to operate while core defrosts (reduced ventilation efficiency but prevents AHU shutdown)
7. Do NOT manually force hot steam or hot water on frozen core — thermal shock can crack the core media
8. Allow gradual defrost at moderate temperatures — natural defrost overnight or with bypass mode

**Most likely root cause:** Failed preheat coil allowing outdoor air below -10°F to reach ERV core directly

**Safety flags Mike MUST mention:**
- Severe ice blockage on ERV core can reduce outdoor airflow to near zero — ASHRAE 62.1 minimum ventilation not being met
- Do not apply hot water or steam to ice-frozen ERV core — thermal shock damages the desiccant media permanently

**Tone/Mike notes:** "ERV iced in January — your preheat isn't working. The whole point of preheat is to keep the core alive in extreme cold. Find why it failed."

**Source:** ERV monitoring and fault detection, oxmaint.com; Energy recovery ventilator bypass system, USPTO patent 11927359; Enthalpy wheel failure modes, USPTO patent 10197344

---

## SCENARIO 121 — Chiller hot gas bypass valve, stuck closed at low load

**Symptom (verbatim):** "Centrifugal chiller with hot gas bypass. Very light load, Sunday morning. Chiller keeps surging. Hot gas bypass valve was replaced 2 years ago."

**Equipment:** Centrifugal chiller with hot gas bypass (HGBP) system for low-load stability.

**Correct diagnostic path:**
1. Hot gas bypass provides artificial evaporator load at light building load — prevents surge
2. HGBP valve stuck closed = no artificial load → compressor enters surge territory at very low building load
3. Check HGBP valve operation: with load very low, valve should be open (feeding hot gas discharge to evaporator)
4. Measure HGBP valve inlet and outlet temperature — if both equal discharge temperature, valve is stuck closed
5. Test actuator on HGBP valve: apply control signal and verify valve strokes
6. Check HGBP pilot solenoid — many HGBP valves use a pilot-operated design; failed pilot solenoid keeps main valve closed
7. If valve strokes but chiller still surges: HGBP valve sizing may be inadequate or injection point plumbing is incorrect
8. After HGBP repair: verify surge is eliminated at minimum load — test with chilled water set very low (50°F) and tower water cold (65°F) — worst-case scenario

**Most likely root cause:** Failed HGBP pilot solenoid (stuck closed) preventing valve operation

**Safety flags Mike MUST mention:**
- Repeated surge events before HGBP was diagnosed: inspect compressor for surge damage — impeller erosion, thrust bearing wear
- HGBP repair on working chiller: must be done during scheduled low-load window — requires chiller shutdown for valve replacement

**Tone/Mike notes:** "Sunday morning surge with HGBP installed — the bypass valve isn't doing its job. Test it. If the solenoid's dead, it's been dead for a while."

**Source:** Chiller surge prevention, automationdistribution.com; Hot gas bypass for surge prevention, aircondlounge.com; York YK chiller O&M, lms.genpact.com

---

## SCENARIO 122 — Trane commercial RTU DX cooling, high discharge temperature, wrong refrigerant

**Symptom (verbatim):** "Trane Voyager commercial RTU just had refrigerant added by another tech. Now it's tripping high discharge temperature. Prior tech didn't leave a note."

**Equipment:** Trane Voyager commercial RTU, R-410A system, post-service call.

**Correct diagnostic path:**
1. High discharge temperature after refrigerant service = suspect wrong refrigerant added, overcharge, or oil charge error
2. Pull refrigerant sample: compare specific gravity/density using a refrigerant identifier
3. R-410A identifier should confirm pure R-410A — any contamination or wrong refrigerant (e.g., R-22 topping off an R-410A system, or R-32 added) will show as mixed/wrong refrigerant
4. Check discharge pressure vs. expected for ambient temperature — R-22 in an R-410A system causes dramatically different pressures
5. If wrong refrigerant confirmed: recover all refrigerant, flush circuit with nitrogen, replace filter drier, evacuate, recharge with correct R-410A by weight
6. If correct refrigerant but high discharge temp: check subcooling and superheat — may have been overcharged
7. Document incident for EPA and equipment warranty records

**Most likely root cause:** Wrong refrigerant added or system overcharged by prior technician

**Safety flags Mike MUST mention:**
- NEVER mix refrigerants — mixing creates unknown blends with unpredictable safety and performance characteristics
- EPA Section 608: adding wrong refrigerant and then venting contaminated charge is a federal violation — proper recovery and documentation required
- If R-22 was added to an R-410A system: POE oil in the system is incompatible with mineral oil residue from R-22 service tools

**Tone/Mike notes:** "High discharge temp right after a refrigerant service — the first thing I'm doing is identifying what's actually in that system."

**Source:** R-410A operating pressures and charging, acdirect.com; Carrier RTU troubleshooting, northbreezehvac.com; Trane Voyager IOM, trane.com

---

## SCENARIO 123 — VRF system, branch box port capacity ratio exceeded

**Symptom (verbatim):** "Daikin VRV, three indoor units on one branch selector box. The 6-port BSB only has 3 ports connected. During commissioning, one port keeps faulting."

**Equipment:** Daikin VRV IV heat recovery with branch selector box.

**Correct diagnostic path:**
1. BSB (Branch Selector Box) port fault during commissioning: verify connected indoor unit capacity on that port does not exceed port's rated capacity
2. Daikin BSB has a maximum capacity per port — typically each port rated for a specific tonnage
3. Check capacity ratio: if a large indoor unit (e.g., 4-ton) is connected to a port rated for 3-ton maximum, the BSB will fault on capacity overload
4. Review BSB installation manual for per-port capacity limits and total connected capacity limits
5. If capacity ratio is correct: check BSB port solenoid valve wiring for that port
6. Verify indoor unit PCB address for that port matches expected address in BSB configuration
7. Check refrigerant piping to that port — pressure drop in a long run can make the port appear undersized

**Most likely root cause:** Connected indoor unit exceeds BSB port capacity rating

**Safety flags Mike MUST mention:**
- BSB port capacity violations are a design and installation issue — require re-piping, not a field adjustment
- Document BSB fault during commissioning for warranty records

**Tone/Mike notes:** "BSB port fault in commissioning — check the capacity ratings in the manual. You can't just plug any size unit into any port."

**Source:** Daikin VRV IV service manual and BSB documentation; Daikin VRV error codes, coolautomation.com; Daikin VRV system design

---

## SCENARIO 124 — Commercial RTU, TX valve hunting, excessive superheat swing

**Symptom (verbatim):** "Commercial RTU, 10-ton. Suction pressure swinging ±15 psig every 2 minutes. Superheat swings from 8°F to 30°F. No alarms."

**Equipment:** Commercial packaged RTU with TXV, R-410A.

**Correct diagnostic path:**
1. Superheat hunting ±15 psig every 2 minutes = TXV hunting — valve overshooting, over-correcting, oscillating
2. Check TXV external equalizer line: disconnected or clogged equalizer causes erratic valve response
3. Inspect equalizer line at evaporator outlet — must be on suction line downstream of TXV bulb, on top of suction line
4. Check TXV bulb location and contact — bulb must have good contact with suction line and be insulated from ambient air; poor contact causes erratic sensing
5. Verify TXV is sized correctly — oversized TXV for the actual load hunts chronically
6. Check for moisture in system — moisture freeze at TXV orifice causes intermittent hunting
7. If TXV bulb and equalizer are OK: TXV power head may have lost charge — replace TXV
8. Note: variable-speed systems (VFD fan, modulating compressor) require hunting-resistant TXV or EEV — standard TXVs can hunt on variable-flow systems

**Most likely root cause:** Poor TXV bulb contact/insulation OR disconnected/clogged external equalizer line

**Safety flags Mike MUST mention:**
- Hunting TXV causes continuous suction pressure swings that stress compressor bearings through refrigerant surge
- Verify the TXV is appropriate for the application — variable-speed systems often require EEV, not TXV

**Tone/Mike notes:** "Hunting TXV — check the equalizer line and the bulb. That's where 90% of TXV problems start."

**Source:** York commercial RTU service documentation; Carrier 48HC TXV section, trainingcarrierwest.com

---

## SCENARIO 125 — Commercial building, multiple RTUs, simultaneous compressor failures, dirty power investigation

**Symptom (verbatim):** "Building has 6 Trane commercial RTUs. In the past 90 days, 3 compressors failed. Electrical contractor checked utility and found voltage imbalance."

**Equipment:** Multiple Trane commercial RTUs, three-phase power supply.

**Correct diagnostic path:**
1. Three compressor failures in 90 days = systemic cause, not random failures
2. Voltage imbalance confirmed by electrical contractor: this is the cause
3. NEMA standards: voltage imbalance above 2% causes significant motor heating; above 5% causes rapid compressor failure
4. Calculate voltage imbalance: [(max deviation from average) / average voltage] × 100
5. Document utility-provided voltage on all three phases during peak load periods (worst time for imbalance)
6. Check building load balance: single-phase loads (lighting, receptacles) distributed unevenly across phases cause phase imbalance
7. Check utility transformer secondary connections — loose or corroded transformer secondary lugs cause phase imbalance
8. Recommend power quality monitor installation for 30-day logging — document imbalance severity at all times of day
9. Compressor replacement: install phase-loss protection relay (e.g., Symcom 777) on each RTU to prevent future failures during imbalance events

**Most likely root cause:** Utility voltage imbalance above NEMA acceptable limits (5%+) causing compressor motor winding overheating and premature failure

**Safety flags Mike MUST mention:**
- Do NOT restart replaced compressors without addressing phase imbalance — they will fail again within months
- Phase-loss protection relay ($50–100 per unit) is cheap insurance against $3,000–8,000 compressor replacements
- Document findings and recommendation in writing to building owner — this is a utility/electrical issue, not just an HVAC issue

**Tone/Mike notes:** "Three compressors in 90 days isn't bad luck — something's killing them. Phase imbalance is the answer. Find it and fix it before you install those new compressors."

**Source:** Commercial HVAC system troubleshooting, nextechna.com; Carrier RTU problems analysis, northbreezehvac.com; VFD undervoltage diagnosis, darwinmotion.com

---

## SCENARIO 126 — Commercial VRF, heat recovery mode, zone stuck in simultaneous cooling

**Symptom (verbatim):** "Trane/Mitsubishi City Multi R2-series. Zone 8 is in a server room that needs cooling 24/7. When building goes into morning warm-up heating, Zone 8 switches to heating and the server room overheats."

**Equipment:** Trane/Mitsubishi City Multi R2-series VRF heat recovery system.

**Correct diagnostic path:**
1. Server room zone must remain in cooling 24/7 regardless of other zone modes
2. On R2-series heat recovery: zones can be set to "Cooling Only" mode permanently — this is the correct setting for server rooms
3. Access City Multi configuration: set Zone 8 indoor unit to "Cooling Only" via MELANS software or wired controller
4. In "Cooling Only" mode: Zone 8 will not accept heating calls regardless of what other zones are doing
5. Verify building automation has not overridden the individual zone mode setting
6. Check if BAS is sending a "heat" command to Zone 8 during morning warm-up — BAS must be updated to exclude Zone 8 from heating schedule
7. After setting Cooling Only: verify Zone 8 continues cooling when heating demand is active on other zones

**Most likely root cause:** Zone 8 programmed in standard heating/cooling auto mode — must be set to cooling-only for server room application

**Safety flags Mike MUST mention:**
- Server room overheating from HVAC mode switch can cause immediate server failure — critical infrastructure application
- Document Zone 8 Cooling Only setting in system configuration records and O&M documentation for building

**Tone/Mike notes:** "Server room needs cooling 24/7 — lock that zone to cooling-only mode. It's a setting, not a repair."

**Source:** Mitsubishi City Multi R2 heat recovery system design, mitsubishitechinfo.ca; Mitsubishi City Multi startup process, mehvac.com

---

## SCENARIO 127 — AAON RQ commercial unit, variable speed condenser fan fault

**Symptom (verbatim):** "AAON RQ rooftop, single zone warehouse. Variable speed condenser fan alarm in the VCCX. Fan speed commanded at 80% but actual speed reported at 45%."

**Equipment:** AAON RQ series commercial RTU with EC (electronically commutated) variable speed condenser fan motor.

**Correct diagnostic path:**
1. Speed command 80% vs. actual 45% = motor not following speed command
2. Access AAON VCCX controller: review EC fan motor fault log — communication error, overcurrent, or temperature protection
3. Check EC fan motor communication wiring (typically 0-10VDC signal from controller to motor driver board)
4. Measure analog signal at motor driver input — if command signal is correct (8VDC for 80%), problem is in motor driver or motor
5. Inspect EC motor for visible damage, overheating marks, or burned components
6. EC motors have internal thermal protection — check if motor is warm to touch; internal thermal protection may be limiting speed
7. Verify 3-phase or single-phase voltage supply to EC motor — voltage sag causes motor to derate speed output
8. If supply voltage and signal are correct: replace EC motor/driver assembly (AAON uses specific EC motor assemblies)

**Most likely root cause:** Failed EC motor driver board OR motor thermal protection limiting speed due to overheating

**Safety flags Mike MUST mention:**
- AAON RQ with variable speed condenser fan: if fan is running at 45% when 80% is commanded during high ambient, condensing pressure will be elevated — verify HP protection is still functional
- EC motor replacement on commercial RTU: verify exact replacement part per AAON service documentation

**Tone/Mike notes:** "Command 80%, getting 45% — the motor's not following the signal. Check the signal first, then the motor."

**Source:** AAON RQ Series IOM, aaon.com; AAON VCCX controller technical guide, aaon.com

---

## SCENARIO 128 — Commercial chiller, entering condenser water temperature too cold, compressor tripping

**Symptom (verbatim):** "Water-cooled chiller, cooling tower is cooling the water way down at night. November, loop temp dropping to 50°F overnight. Chiller trips every morning when first started."

**Equipment:** Water-cooled centrifugal or screw chiller with cooling tower.

**Correct diagnostic path:**
1. 50°F entering condenser water temperature: for most water-cooled chillers, this is below minimum design entering CWT
2. Centrifugal chillers: minimum entering CWT typically 65°F — below this, low pressure differential causes surge
3. Scroll/screw chillers: minimum entering CWT typically 55°F — below this, condenser pressure collapses, expansion valve floods
4. Solution: cooling tower condenser water supply temperature control — install or verify operation of cooling tower bypass valve
5. Cooling tower bypass valve: blends warmer return water with cool tower supply to maintain minimum CWT setpoint
6. Check cooling tower variable frequency drive — if tower fan at 100% overnight when it should be at 0% or off, it's overcooling
7. Check cooling tower approach setpoint in building controls — should have minimum CWT limit
8. Immediate fix: reduce or stop cooling tower overnight until CWT rises above minimum for chiller

**Most likely root cause:** Cooling tower operating without a minimum CWT setpoint or bypass valve — overcooling condenser water below chiller design minimum

**Safety flags Mike MUST mention:**
- Chiller tripping every morning from cold CWT: repeated low-pressure trips stress refrigerant circuit components
- Document minimum CWT requirement for the specific chiller model — this is in the installation manual

**Tone/Mike notes:** "50°F CWT in November — the tower's running all night with no minimum setpoint. That chiller wasn't designed for 50°F condenser water. Add the bypass, set the minimum."

**Source:** WSHP freeze protection and loop temperature, jmpcoblog.com; Chiller surge prevention, aircondlounge.com; York chiller troubleshooting, partshnc.com

---

## SCENARIO 129 — Commercial VRF system, long pipe run oil return failure

**Symptom (verbatim):** "Daikin VRV system, 3-year-old installation, long vertical pipe run — outdoor unit on roof, indoor units 7 floors down. Compressor oil low alarm. No visible leaks."

**Equipment:** Daikin VRV IV commercial system with long/complex piping (vertical drop + long horizontal run, total equivalent piping >200 ft).

**Correct diagnostic path:**
1. Oil low alarm with no visible leaks and long piping = oil has migrated to the refrigerant circuit and is not returning
2. VRV systems with long piping require oil traps at base of risers to capture and return oil
3. Inspect installation drawings: are oil traps installed per Daikin design requirements? (Oil trap required at bottom of each vertical drop >10 meters)
4. Check oil return circuit: Daikin VRV uses dedicated oil return valves — verify valves Y2S, Y3S, Y4S are operating (per E5 fault diagnosis procedure)
5. Perform oil return cycle manually via service mode if available — forces a controlled high-velocity purge to sweep oil back from piping
6. Verify refrigerant velocity in suction line at minimum load — oil return requires >600 FPM velocity; long low-velocity sections trap oil
7. If oil traps missing: this is a design/installation deficiency — oil traps must be added at riser bases
8. Add oil via manufacturer procedure after oil return circuit confirmed operational

**Most likely root cause:** Missing oil traps at base of vertical risers — oil pooling in suction line rather than returning to compressor

**Safety flags Mike MUST mention:**
- Do NOT add oil without first addressing the return path — you will continue losing oil and eventually damage the compressor
- Oil trap installation on an existing system requires partial refrigerant recovery and system modification

**Tone/Mike notes:** "Oil low, long vertical run, no leaks — the oil is in the pipes. Check if the oil traps were ever installed. On long vertical systems, they're not optional."

**Source:** Daikin VRV IV E5 fault diagnosis, manualslib.com; Daikin VRV IV service manual oil return valves, manualslib.com; Daikin VRV error codes, coolautomation.com

---

## SCENARIO 130 — Commercial packaged unit, economizer mixing damper blade cracked, air bypass

**Symptom (verbatim):** "Commercial 10-ton RTU energy audit. Building engineer says economizer works but office has persistent humidity problem even in cool weather. Found cracked mixing chamber divider."

**Equipment:** Commercial packaged RTU, economizer equipped, mixed-air plenum.

**Correct diagnostic path:**
1. Cracked mixing chamber divider: outdoor air and return air no longer properly separated in the mixed-air plenum
2. Effect: outdoor air bypasses the mixed-air temperature sensor and reaches the supply fan without proper blending measurement
3. This causes the economizer controller to receive incorrect mixed-air temperature readings → incorrect damper positioning
4. In humid weather with outdoor air bypass: humid outdoor air floods the supply without the controller knowing → latent overload
5. Inspect mixing chamber divider for cracks or holes — typically sheet metal divider between OA/RA sections
6. Check if mixed-air temperature sensor is in the proper location relative to the mixing point
7. Repair or replace cracked divider panel — sheet metal repair may be possible; full panel replacement on larger units
8. After repair: verify mixed-air temperature reading is stable and responds correctly to OA/RA damper positions

**Most likely root cause:** Cracked sheet metal mixing chamber divider causing outdoor air bypass past the mixed-air temperature sensor — economizer receives incorrect feedback

**Safety flags Mike MUST mention:**
- This type of failure typically develops gradually and goes undetected for years — it's rarely caught without a detailed inspection
- After repair, verify economizer control performance with fresh air measurements

**Tone/Mike notes:** "Cracked mixing chamber divider — the sensor doesn't know what it's measuring anymore. That's a sheet metal problem that fixes itself with a new panel."

**Source:** Carrier 48HC mixed-air plenum design, trainingcarrierwest.com; PNNL Building Re-Tuning economizer section, buildingretuning.pnnl.gov

---

## End of v3 Commercial Scenarios (Scenarios 31–130)

---

TOTAL SCENARIOS: 100
SAFETY SCENARIOS: 28
BRANDS COVERED: Carrier, Trane, York (JCI), Lennox, Daikin (VRV/SkyAir/AGZ/Trailblazer), AAON, Bard, Bryant/Payne, Mitsubishi (City Multi/PURY), LG (Multi V), Samsung (DVM S), Toshiba (SMMS-e), Carrier (38VML)
SOURCES CITED: 42
