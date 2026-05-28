# Mike Scenario Library v3 — Refrigeration, Boilers, and Hydronics

Phase 1 heavy-work build. Covers walk-in coolers/freezers, reach-in cases, ice machines, supermarket racks, CO2 transcritical, gas-fired boilers, hydronics, and steam. 60-80 diagnostic scenarios.

---

## SCENARIO R-01 — Walk-in cooler high box temperature (evap fan motor failure)

**Symptom (verbatim):** "Walk-in cooler running warm, product at 48°F. Compressor is running fine."

**Equipment:** Heatcraft/Bohn walk-in unit cooler, medium-temperature refrigeration.

**Correct diagnostic path:**
1. Verify compressor operation — running but box temp still high
2. Check evaporator fans: all blades spinning? Correct direction?
3. Feel/measure airflow across coil — low delta-T (< 8°F supply-to-return) with compressor running = airflow problem
4. Check evap fan motor amp draw vs. nameplate
5. Inspect capacitor (PSC motors): weak/open capacitor → motor runs slow or not at all
6. Check for ice-over on coil blocking fan: if frozen solid, defrost system failed first
7. If motors dead: check wiring, fan delay relay, door switch (fans may be wired off when door opens)
8. Confirm fan blade hub not wallowed out on shaft

**Most likely root cause:** Failed run capacitor (PSC motor) OR seized fan motor bearing

**Safety flags Mike MUST mention:**
- Product safety: food above 41°F for more than 4 hours is a food safety violation — alert owner immediately
- Do not short out door switch to test; restore safety circuits before leaving

**Tone check:** "Compressor running but box warm — air's not moving. Start at the fans."

**Source:** https://www.alansyllc.com/post/fan-motor-failure-evaporator-or-condenser----commercial-walk-in-freezers | https://unitycoolingsystems.com/walk-in-cooler-evaporator-fan-motor/

---

## SCENARIO R-02 — Walk-in freezer not pulling down (low refrigerant charge)

**Symptom (verbatim):** "Walk-in freezer won't get below 20°F. Supposed to be 0°F. Has been getting worse over months."

**Equipment:** Walk-in freezer, R-448A or R-404A, receiver-based system, TXV metered.

**Correct diagnostic path:**
1. Pull gauges — check suction and discharge pressures
2. Low suction + high superheat at evap outlet = refrigerant starved coil
3. Check liquid line sight glass: bubbles or flashing = low charge or restriction
4. Check subcooling at condenser outlet (target 8-12°F on receiver system)
5. If subcooling low AND sight glass bubbling: confirmed low charge — leak exists
6. Perform leak search: electronic detector, UV dye, bubble solution at fittings, Schrader cores, brazed joints
7. Common leak locations: TXV flare fittings, Schrader valve cores, solenoid valve body, condenser coil hairpin bends
8. Repair leak BEFORE adding refrigerant (EPA 608 requirement)
9. Recheck superheat 6-12°F at evap outlet after charge correction

**Most likely root cause:** Slow refrigerant leak — typical over months of gradual pulldown degradation

**Safety flags Mike MUST mention:**
- EPA Section 608: commercial refrigeration systems with 50+ lbs charge, leak rate > 20% requires repair within 30 days
- Leak must be repaired before recharging — do not top off without finding source
- EPA 608 Type II certification required for low-pressure commercial systems

**Tone check:** "Slow decline over months is almost always a leak. Find it and fix it before touching the refrigerant drum."

**Source:** https://www.epa.gov/section608/stationary-refrigeration-leak-repair-requirements | https://hvacknowitall.com/blog/walk-in-cooler-troubleshooting | https://hvac-talk.com/vbb/threads/1504371-Superheat-and-Subcooling-on-walk-in-cooler-and-freezers

---

## SCENARIO R-03 — Walk-in freezer defrost failure (electric defrost heater burnout)

**Symptom (verbatim):** "Freezer coil is a solid block of ice. Box temperature is 15°F and climbing. Defrost timer shows it ran but nothing melted."

**Equipment:** Walk-in freezer, electric defrost, Heatcraft or Bohn unit cooler, mechanical defrost timer.

**Correct diagnostic path:**
1. Initiate manual defrost — watch for heater elements glowing (visible through coil or IR gun)
2. Check voltage at heater terminals during defrost — 240V expected on most commercial units
3. If voltage present but no heat: open circuit in heater element(s) — test continuity with power off
4. If no voltage: check defrost contactor, defrost timer contacts, defrost termination thermostat
5. Defrost termination stat: opens on temperature rise (typically 47-55°F air off coil) — if stuck open, heaters never energize
6. Check drain pan heater too — frozen drain will flood floor when defrost finally works
7. Inspect heater element watt density and age — sheath failures common on older units
8. After repair: set defrost frequency and duration appropriate to door traffic load

**Most likely root cause:** Burned-out defrost heater element (open circuit) OR failed defrost termination thermostat stuck open

**Safety flags Mike MUST mention:**
- Product temperature: ice-blocked coil = essentially no refrigeration — alert owner, protect product
- Water damage risk from drain pan overflow when defrost resumes — ensure drain is clear and heated

**Tone check:** "Voltage at the heater with no heat — open element. Start there."

**Source:** https://www.ancasterfoodequipment.com/blog/what-are-the-causes-of-commercial-refrigerator-or-freezer-defrost-problems/ | https://master-bilt.com/learn/walk-in-cooler-and-freezer-troubleshooting/

---

## SCENARIO R-04 — Walk-in freezer hot-gas defrost timing failure

**Symptom (verbatim):** "Walk-in freezer iced up bad. We have hot-gas defrost. Defrost controller says it ran."

**Equipment:** Walk-in freezer, hot-gas defrost system, Heatcraft or Russell unit cooler, electronic defrost controller.

**Correct diagnostic path:**
1. Hot-gas defrost: discharge gas routed through evaporator to melt ice — faster than electric but less forgiving of control failures
2. Verify hot-gas solenoid valve opens during defrost: check solenoid coil voltage and resistance
3. Check defrost termination sensor: if sensor failed open, defrost terminates immediately (no heat reaches coil)
4. Check hot-gas check valve (prevents liquid backup into discharge line)
5. Verify defrost duration is set correctly on controller — too short = incomplete melt
6. If defrost runs too long: product spoilage risk and excessive cabinet temperature rise
7. Fan delay after defrost: fans must not restart until coil temperature drops below ~35°F — check fan delay relay
8. Inspect equalizing pressure between suction and hot-gas lines during defrost cycle

**Most likely root cause:** Failed hot-gas solenoid valve (mechanically stuck closed) OR defrost termination sensor failure

**Safety flags Mike MUST mention:**
- Hot-gas defrost overshoot: if defrost runs too long, box temp can spike to 50°F+ — food safety event
- Do NOT extend defrost duration without verifying why normal duration is insufficient

**Tone check:** "Hot-gas defrost is fast and unforgiving. If the solenoid doesn't open, nothing happens."

**Source:** https://getcooled.com/the-art-of-defrosting-best-practices-for-commercial-refrigeration-systems/ | https://www.kalosflorida.com/refrigeration/causes-and-prevention-of-frozen-cases/

---

## SCENARIO R-05 — Walk-in cooler door heater / anti-sweat heater failure

**Symptom (verbatim):** "Walk-in cooler door frame is sweating badly, condensation dripping on the floor. Door is hard to open in the morning."

**Equipment:** Walk-in cooler, door frame heater (anti-sweat), electric glass door heater.

**Correct diagnostic path:**
1. Anti-sweat heaters run continuously (or via humidity controller) to prevent condensation on door frame and mullions
2. Check heater element voltage and continuity — strip heaters embedded in frame are serviceable
3. Use IR gun: frame heater should read 90-110°F (warm to touch) in normal operation
4. If frame is cold: heater open, wiring failed, or breaker tripped
5. Check door gasket seal: warm moist air infiltrating = condensation even with good heaters (dollar-bill test)
6. Inspect door closer/hinge: door not sealing = moisture infiltration overwhelming heaters
7. Humidity controller (if installed): set point above ambient dew point — verify operation
8. On glass reach-in cases: door glass heater failure causes fogging — check glass heater circuit

**Most likely root cause:** Open anti-sweat heater element OR failed door gasket allowing moisture infiltration

**Safety flags Mike MUST mention:**
- Ice buildup from persistent condensation creates slip hazard for kitchen staff
- Water dripping onto electrical boxes below floor level: shock hazard — notify owner

**Tone check:** "Sweating frame either means the heater's dead or the door's not sealing. Check both."

**Source:** https://www.heatcraftrpd.com/dA/afd5952081/H-IM-77D.pdf | https://www.partstown.com/cm/resource-center/guides/gd2/heatcraft-walk-in-freezer-troubleshooting

---

## SCENARIO R-06 — Reach-in cooler (True Manufacturing) not cooling, compressor short-cycling

**Symptom (verbatim):** "True GDM-49 cooler keeps shutting off every few minutes. Product is at 48°F. Compressor trips on thermal."

**Equipment:** True Manufacturing GDM-49 reach-in glass door merchandiser, self-contained, R-290 or R-134a.

**Correct diagnostic path:**
1. Short cycling on thermal overload = compressor running hot → overload trips → cools → restarts
2. Pull condenser panel: check condenser coil — True condensers clog with grease and dust under serving lines
3. Dirty condenser → high head pressure → compressor works harder → overload trips
4. Check condenser fan motor: running? Correct direction? Clean blade?
5. Measure discharge pressure: high head pressure (R-134a > 200 psig ambient-dependent) confirms condenser problem
6. Clean condenser coil with coil cleaner and compressed air — do NOT bend fins
7. Verify adequate clearance around unit: True spec typically 3" sides, 6" top
8. After cleaning: monitor amp draw and head pressure at stabilized conditions

**Most likely root cause:** Clogged condenser coil (most common True reach-in failure in food service)

**Safety flags Mike MUST mention:**
- True GDM units with R-290 (propane): A3 flammable refrigerant — follow HC handling protocol, no open flame during service
- Food temperature: if product > 41°F for 4+ hours, owner should discard per local health code

**Tone check:** "Dirty condenser is the number-one killer on True reach-ins. Pull that panel first."

**Source:** https://www.partstown.com/cm/resource-content/guides/gd1/true-refrigeration-troubleshooting | https://www.webstaurantstore.com/guide/1080/true-refrigeration-troubleshooting.html | https://www.truemfg.com/support/technical/

---

## SCENARIO R-07 — Reach-in cooler (Beverage-Air) compressor runs, not cooling enough

**Symptom (verbatim):** "Beverage-Air cooler holding 42°F when it should be 35°F. Compressor runs constantly."

**Equipment:** Beverage-Air reach-in cooler, self-contained hermetic system.

**Correct diagnostic path:**
1. Compressor running continuously but undershooting = system can't keep up OR refrigerant issue
2. Check condenser coil cleanliness — Beverage-Air units in bars accumulate grease rapidly
3. Hook gauges: compare suction/discharge to expected pressures for refrigerant type at ambient
4. High suction + low superheat = overcharged OR TXV flooding (if TXV equipped)
5. Low suction + high superheat = low charge OR restriction
6. Check door gaskets: worn gaskets on glass-door units = constant warm-air infiltration
7. Inspect door closers and hinges: door staying slightly ajar = load overwhelming system
8. Verify thermostat calibration: controller setpoint vs. actual box temp (use calibrated thermometer)

**Most likely root cause:** Worn door gaskets (second most common Beverage-Air failure) OR dirty condenser

**Safety flags Mike MUST mention:**
- If gauges show low charge: EPA leak-repair requirement applies before adding refrigerant

**Tone check:** "Running all the time but not pulling down — start at the doors and the condenser before touching the refrigerant."

**Source:** https://www.webstaurantstore.com/guide/949/beverage-air-cooler-troubleshooting-guide.html | https://www.culinarydepotinc.com/blog/beverageair-cooler-troubleshooting-guide/

---

## SCENARIO R-08 — Hoshizaki KM-series ice machine: long freeze cycle (E3 / 3-beep alarm)

**Symptom (verbatim):** "Hoshizaki KM-320 is beeping 3 times. Making ice but really slowly. Freeze cycles taking over an hour."

**Equipment:** Hoshizaki KM-320 modular crescent cuber, R-404A or R-448A.

**Correct diagnostic path:**
1. 3 beeps (or E3 on display models) = freeze cycle exceeded maximum time (typically 60 minutes)
2. Long freeze cycle causes: low refrigerant, dirty condenser, high water temperature, low ambient, scale on evaporator plate
3. Check condenser coil: Hoshizaki units accumulate dust rapidly — clean coil with soft brush, do not use water pressure
4. Check water supply temperature: water above 90°F slows freeze dramatically
5. Pull gauges on refrigerant side: compare to Hoshizaki spec chart for ambient temperature
6. Low suction + high superheat = low charge or restriction
7. Inspect evaporator plate for scale buildup: scale is an insulator and dramatically slows freezing — requires descaling
8. Hoshizaki descale procedure: use Hoshizaki nickel-safe cleaner, never generic acid — nickel evaporator damage is not warrantied

**Most likely root cause:** Scale on evaporator plate (high mineral water) OR dirty condenser OR low refrigerant

**Safety flags Mike MUST mention:**
- Hoshizaki evaporator plates are nickel-plated — acid descalers can pit the surface; use only approved cleaner
- Food safety: slow production means ice bin may be below adequate supply; notify owner

**Tone check:** "Three beeps means it's taking too long. Mineral scale is the sneaky one — it builds slow and nobody notices."

**Source:** https://www.hoshizaki.com/docs/manuals/KM-230_300B_J_serv.pdf | https://www.pacificiceservices.com/post/hoshizaki-ice-machine-error-codes | https://www.easyice.com/hoshizaki-ice-machine-troubleshooting-guide/

---

## SCENARIO R-09 — Hoshizaki KM-series ice machine: harvest failure (hot gas valve)

**Symptom (verbatim):** "Hoshizaki KM-801 froze solid. Ice stuck to the evaporator, not dropping. Had to shut it down."

**Equipment:** Hoshizaki KM-801 modular crescent cuber, hot-gas harvest system.

**Correct diagnostic path:**
1. Hoshizaki harvest: hot gas valve opens, reversing discharge gas through evaporator → warms plate → ice slides free
2. Check hot gas solenoid valve: 24VAC coil — test with voltmeter during harvest mode
3. Voltage present but no harvest: valve mechanically stuck closed — replace valve body and coil
4. No voltage: check defrost board relay, harvest timer, thermistor (harvest initiation sensor)
5. Hoshizaki harvest thermistor (ice-thickness sensor): when senses plate temperature rise above setpoint, confirms harvest complete → initiates next freeze
6. Failed thermistor = false early harvest termination OR no harvest initiation
7. Check float switch: if float fails to close (stuck), machine may not have adequate water load
8. Verify water curtain (bin curtain) is present and intact — damaged curtain = ice drops outside bin

**Most likely root cause:** Stuck hot-gas harvest valve (mechanically failed coil or plunger) OR failed harvest thermistor

**Safety flags Mike MUST mention:**
- R-404A or R-448A: high GWP refrigerant — minimize venting, follow recovery requirements
- Ice bridge on evaporator: never use sharp tools to chip ice — damage to nickel plate voids warranty

**Tone check:** "Ice welded to the plate means harvest gas never got there. Check the solenoid first."

**Source:** https://secure.hoshizakiamerica.com/docs/manuals/IM-500SAA_serv_LTR.pdf | https://www.hoshizaki-sea.com/wp-content/uploads/Library/service_manual/ice-maker/22,%2025,%2030,%2031,%2038%20IM-45CNE%20etc%20e1ec-848.pdf

---

## SCENARIO R-10 — Manitowoc ice machine: harvest failure, long harvest cycle

**Symptom (verbatim):** "Manitowoc Q-570 taking forever to harvest. Ice slab is thin but won't drop. Harvest takes 15 minutes then resets."

**Equipment:** Manitowoc Q-series modular cuber.

**Correct diagnostic path:**
1. Manitowoc harvest: water sump drains, hot gas circulates through evaporator, ice slides from plate into bin
2. Extended harvest (> 7 minutes on most models) triggers Harvest Fix Mode — diagnostic alert
3. Check harvest pressure transducer (some models): monitors discharge pressure during harvest
4. Hot gas valve: test solenoid coil 24VAC; verify valve opens (feel body temperature change)
5. Water inlet valve: if leaking during harvest, cold water enters and fights the hot gas — ice won't release
6. Water inlet valve test: shut off water supply, initiate harvest — if ice releases now, water valve is leaking through
7. Check condenser temp and head pressure: if head pressure low, not enough hot gas energy for harvest
8. Ice thickness probe: if set too thin, harvest triggers before adequate ice formation → thin slab, poor release

**Most likely root cause:** Leaking water inlet valve (water entering during harvest) OR low head pressure

**Safety flags Mike MUST mention:**
- Water inlet valve leaking refrigerant-side is often missed — always test with water off during harvest
- Manitowoc recommends 6-month cleaning interval in most water conditions

**Tone check:** "A harvest that never quite finishes usually has cold water fighting the hot gas. Try it with the water shutoff closed."

**Source:** https://www.culinarydepotinc.com/blog/manitowoc-ice-machine-troubleshooting-guide/ | https://www.webstaurantstore.com/guide/942/manitowoc-ice-machine-troubleshooting-guide.html | https://partsfe.com/blog/post/manitowoc-ice-machine-troubleshooting-guide

---

## SCENARIO R-11 — Scotsman Prodigy ice machine: error code 8 (short freeze cycle)

**Symptom (verbatim):** "Scotsman Prodigy C0530 showing code 8. Making some ice but it's thin and inconsistent."

**Equipment:** Scotsman Prodigy C0530 modular cuber.

**Correct diagnostic path:**
1. Code 8 = machine cycled into harvest before 6 minutes into freeze — triggered multiple times
2. Root cause: ice thickness probe reading harvest initiation too early
3. Inspect ice thickness probe (sensor bar): calcium/mineral deposits on probe = false short-circuit reading
4. Clean probe with descaling solution (food-safe), brush, rinse thoroughly
5. Verify water flow rate and distribution: water splashing onto probe continuously = false reading
6. Check water distributor for plugged holes, scale buildup in spillway
7. Verify proper water pump output: non-OEM pump with wrong flow rate can create splash onto sensor
8. After cleaning: verify freeze cycles are > 6 minutes before declaring resolved

**Most likely root cause:** Mineral/calcium buildup on ice thickness probe causing false harvest signal

**Safety flags Mike MUST mention:**
- Do not use acidic descaler without verifying it is food-safe and approved for ice machines
- After chemical cleaning, run 2-3 purge cycles before ice is safe for consumption

**Tone check:** "Code 8 is a short freeze. Nine times out of ten it's scale on the sensor bar. Clean it before replacing anything."

**Source:** https://www.scotsman-ice.com/service/service%20manuals/service%20manual.pdf | https://www.partstown.com/cm/resource-center/guides/gd2/scotsman-ice-machine-error-codes | https://etech.us.com/scotsman-ice-machine-error-codes/

---

## SCENARIO R-12 — Ice-O-Matic ice machine: Error Code 7 (water system failure)

**Symptom (verbatim):** "Ice-O-Matic ICEU300 shows error 7. Not making ice. No water in the trough."

**Equipment:** Ice-O-Matic ICEU-series undercounter cuber.

**Correct diagnostic path:**
1. Error Code 7 = control board started water pump but high float switch did not close within 15 seconds
2. Machine protects evaporator from running dry — appropriate safety shutdown
3. Check water supply: is water turned on? Adequate pressure (min 20 PSI typical)?
4. Check water inlet valve: solenoid coil (24VAC) — energize manually or check during fill cycle
5. Inspect screen/strainer on inlet valve: clogged with sediment is very common
6. Float switch: check float freely moves; check switch continuity at full and empty positions
7. Drain valve: if drain valve stuck open, fills but drains faster than it fills
8. Water pump: verify pump running (audible hum) and impeller not clogged

**Most likely root cause:** Clogged water inlet valve screen OR failed water inlet solenoid valve

**Safety flags Mike MUST mention:**
- Do not bypass or jumper float switches to force operation — protects evaporator from dry-running damage

**Tone check:** "Error 7 means no water got in the trough in time. Start at the valve screen — scale plugs those fast."

**Source:** https://www.iceomatic.com/userfiles/2466/products/prod_59290/Service-Bulletin-Error-Code-7.pdf | https://www.techtownforum.com/knowledge-base/article/equipment-appliances/ice-machines/ice-o-matic-cim-error-light-diagnostics/

---

## SCENARIO R-13 — Supermarket refrigeration rack: high head pressure, condenser fan failure

**Symptom (verbatim):** "Hussmann rack tripping on high-pressure cutout. Cases are warm. Condenser fans outside, two of them."

**Equipment:** Hussmann parallel rack system, R-448A, rooftop air-cooled condenser.

**Correct diagnostic path:**
1. High-pressure cutout = system protecting compressors from damaging discharge pressure
2. Go to condenser: count fans running vs. total. Fan motors failed or contactor not pulling in?
3. Measure discharge pressure and compare to expected for ambient temperature
4. R-448A at 95°F ambient: expected discharge ~350-400 psig — cutout typically at 450-500 psig
5. Check fan motor amp draw vs. nameplate — motor running but drawing low amps = spinning wrong direction (bad capacitor or wiring reversal)
6. Verify condenser coil is clean — rooftop condensers pack with cottonwood, leaves, airborne debris
7. Check head pressure controls (fan cycling or VFD): head pressure controller may be holding fans off incorrectly
8. Verify all compressor rack discharge valves are fully open

**Most likely root cause:** Failed condenser fan motor(s) OR clogged condenser coil OR failed head pressure controller

**Safety flags Mike MUST mention:**
- High-pressure cutout reset: do NOT manually force reset repeatedly without fixing cause — compressor damage and potential refrigerant line rupture
- Rooftop work: fall protection required per OSHA

**Tone check:** "Head pressure trip means heat isn't getting out. Go look at the condenser before you even touch the controls."

**Source:** https://hvacprosales.com/low-suction-pressure-diagnosis-guide | https://www.alansyllc.com/post/fan-motor-failure-evaporator-or-condenser----commercial-walk-in-freezers | https://www.hussmann.com/ns/Technical-Documents/0427598_D_Rack_IO_EN.pdf

---

## SCENARIO R-14 — Supermarket refrigeration: TXV hunting (Sporlan valve)

**Symptom (verbatim):** "Low-temp meat case has crazy suction pressure swings — up and down every few minutes. Cases not holding temp."

**Equipment:** Supermarket low-temperature display case, Sporlan TXV, parallel rack suction group.

**Correct diagnostic path:**
1. Suction pressure oscillating = superheat hunting at TXV
2. Hunting: TXV overshoots → floods coil → low SH → valve closes → coil dries → high SH → valve opens → cycle repeats
3. Check TXV superheat setting: Sporlan spec for low-temp cases typically 6-10°F evap outlet superheat
4. Attach clamp-on SH sensor at evap outlet and suction line — watch oscillation period and amplitude
5. Adjust TXV: 1/2 turn clockwise increases superheat — allow 10-15 minutes to stabilize between adjustments
6. Check bulb location: must be clamped tightly to suction line at 4 o'clock position, insulated from ambient
7. Uneven circuit loading in evaporator coil: partially blocked distributor nozzle causes hunting
8. Verify distributor feeder tubes not kinked or unequal length

**Most likely root cause:** TXV superheat set too low OR bulb poorly mounted OR blocked distributor circuit

**Safety flags Mike MUST mention:**
- Low-temp cases: flooding TXV can slug compressor with liquid — suction accumulator protects, but verify condition
- Do NOT adjust beyond 2 full turns without full system analysis — major adjustment risks liquid slugging

**Tone check:** "Hunting TXVs are a process. Half turn, wait 15 minutes, check again. Don't chase it."

**Source:** https://www.parker.com/content/dam/Parker-com/Literature/Sporlan/Sporlan-pdf-files/Sporlan-pdf-010/10-143.pdf | https://www.coolingpost.com/training/solving-superheat-hunting-in-tevs/

---

## SCENARIO R-15 — Danfoss EKC controller: A45 alarm (standby / digital input fault)

**Symptom (verbatim):** "Danfoss EKC 302D on the walk-in showing alarm A45. Unit not running."

**Equipment:** Walk-in cooler with Danfoss EKC 302D temperature/defrost controller.

**Correct diagnostic path:**
1. A45 = controller in standby mode — waiting for digital input 1 (DI1) to be activated
2. Check r12 parameter: must be set to "On" for controller to operate — verify it hasn't been reset
3. DI1 input: typically wired to door switch or remote enable signal — check switch continuity and wiring
4. If no door switch installed: DI1 may need to be jumpered or parameter changed to ignore input
5. Check for wiring damage at DI1 terminals (terminal block corrosion common in wet environments)
6. Verify power supply voltage at controller input: 24VAC or 230VAC depending on model
7. Review controller event log for prior alarms preceding A45
8. If A45 persists with correct wiring: controller firmware issue — consult Danfoss tech support

**Most likely root cause:** DI1 digital input open circuit (broken wire or door switch failure) OR r12 parameter accidentally set to Off

**Safety flags Mike MUST mention:**
- Before adjusting Danfoss parameters, document existing settings — incorrect parameter changes can cause product loss

**Tone check:** "A45 is not a refrigeration failure — it's a wiring or parameter issue. Check the digital input before anything else."

**Source:** https://assets.danfoss.com/documents/latest/354077/BC337731384771en-000501.pdf | https://www.manualslib.com/manual/1193472/Danfoss-Ak-Cc-550a.html?page=25 | https://www.danfoss.com/en-us/service-and-support/fix-and-troubleshooting/supporting-supermarkets/

---

## SCENARIO R-16 — Emerson E2 controller: suction pressure transducer alarm

**Symptom (verbatim):** "E2 controller on the Hussmann rack throwing a suction transducer alarm. Compressors keep cycling on and off erratically."

**Equipment:** Hussmann parallel rack, Emerson E2 refrigeration controller.

**Correct diagnostic path:**
1. E2 suction pressure transducer alarm: controller not reading valid suction pressure — compressor staging fails safe (shuts down)
2. Locate suction transducer on rack: typically at suction manifold, Schrader-mounted
3. Check 5VDC supply voltage to transducer at controller terminal
4. Verify 4-20mA or 0-5VDC signal output is within valid range (open or short = out of range alarm)
5. Disconnect transducer, check wiring continuity and insulation resistance to ground
6. Connect known-good test transducer to confirm controller input vs. transducer hardware fault
7. Recalibrate transducer in E2 if replacement: enter transducer range and offset parameters
8. After repair: clear alarm in E2, verify compressor staging resumes normally

**Most likely root cause:** Failed suction pressure transducer (signal out of range) OR broken/shorted signal wire

**Safety flags Mike MUST mention:**
- Do NOT defeat the E2 alarm and force compressors to run without valid suction pressure — liquid slugging and compressor damage risk
- E2 changes require password — document any parameter changes per store's service log

**Source:** https://media.copeland.com/18c39c3e-ce29-40f4-a9cb-b16d003ebc6b/026-1614_E2%20Enhanced%20User%20Manual.pdf | https://emersonvilter.custhelp.com/ci/fattach/get/343673/0/filename/E2+Alarm+Advisory+Message+List.pdf

---

## SCENARIO R-17 — CO2 transcritical refrigeration: high-pressure gas cooler pressure alarm

**Symptom (verbatim):** "Hill Phoenix Advansor CO2 system tripping on high-pressure alarm. Head pressure going to 1,500 psi in hot weather. Cases are warm."

**Equipment:** Hill Phoenix Advansor CO2 transcritical booster system, R-744, supermarket installation.

**Correct diagnostic path:**
1. CO2 transcritical operates above the critical point on hot days (87.8°F / 1,070 psia critical point) — this is normal transcritical operation
2. Gas cooler pressure control valve regulates high-side pressure to optimize COP
3. High-pressure alarm may indicate: gas cooler not rejecting heat, valve malfunction, ambient temperature extreme
4. Check gas cooler fans: all running, correct direction, clean coil (CO2 gas coolers are high-fin-density — clog fast)
5. Discharge pressure can reach 1,450 psig in transcritical mode — this is NOT a failure
6. High-pressure mechanical cutout set at 600 psig on LT discharge side (compressor protection)
7. Check flash tank (intermediate receiver) pressure: MT discharge feeds flash tank; high flash tank pressure = check flash gas bypass valve
8. Verify Carel or Dixell controller high-pressure setpoints are appropriate for ambient

**Critical CO2 pressure awareness:**
- CO2 CAN reach 1,800+ psi at elevated temperatures trapped in sections between closed valves
- Thermal expansion: 145 psi increase per 1.8°F temperature rise in trapped liquid CO2
- NEVER trap CO2 liquid between two closed valves without a pressure relief path

**Most likely root cause:** Gas cooler fans failing OR gas cooler coil fouled OR ambient exceeding design basis

**Safety flags Mike MUST mention:**
- CO2 systems use specialized pressure equipment rated to 1,800+ psi — standard HVAC gauges are NOT rated for CO2 high side
- Use only CO2-rated manifold set and hoses for this system
- Leak detection: CO2 (R-744) is odorless, heavier than air, accumulates low — asphyxiation risk in enclosed machine rooms
- CO2 leak detectors must be mounted 18 inches off floor; OSHA PEL 5,000 ppm; IDLH 40,000 ppm
- If CO2 alarm sounds in occupied area: evacuate immediately, ventilate, do NOT re-enter without CO2 monitor

**Tone check:** "CO2 at 1,450 psi is normal on a hot day. CO2 trapped between two closed valves is a pressure bomb. Know the difference."

**Source:** https://www.hillphoenix.com/wp-content/uploads/2019/05/Advansor-co2-refigeration-system-i-o-manual-05-20-2020.pdf | https://hvacinsider.com/demystifying-co2-refrigeration/ | https://www.achrnews.com/articles/135474-co2-leak-detection-in-refrigeration-applications | https://e360hub.copeland.com/refrigerant-energy-regulations/co2-as-a-refrigerant-five-potential-hazards-of-r744

---

## SCENARIO R-18 — Commercial refrigeration leak: EPA 608 reporting threshold (SAFETY)

**Symptom (verbatim):** "Manager says they've had to add refrigerant three times this year to the walk-in rack. Total was about 40 lbs on a 120-lb R-448A charge. Do I have to report that?"

**Equipment:** Commercial refrigeration rack, 120 lbs R-448A charge.

**Correct diagnostic path:**
1. Calculate annual leak rate: 40 lbs lost / 120 lbs full charge = 33.3% annual leak rate
2. EPA Section 608 threshold for commercial refrigeration: 20% annual leak rate for systems with 50+ lbs
3. 33.3% > 20% threshold → LEAK REPAIR OBLIGATION TRIGGERED
4. Owner/operator must repair leak within 30 days of discovery
5. If repair cannot be completed in 30 days: develop written retrofit/retirement plan within 30 days
6. After repair: initial leak verification test within 30 days; follow-up test within 10 days of initial test
7. Chronic leak reporting: if system leaks 125% or more of full charge in one calendar year → report to EPA
8. Record-keeping: all refrigerant added, leak inspections, repairs must be logged (50+ lb systems)

**Most likely root cause:** Ongoing leak that has not been repaired — three separate service calls without leak repair is a violation pattern

**Safety flags Mike MUST mention:**
- This is a regulatory compliance issue, not just a service call — owner faces EPA fines for non-compliance
- The fix is not adding more refrigerant — the fix is finding and repairing the leak
- Technician cannot add refrigerant knowingly to a leaking system above threshold without initiating repair

**Tone check:** "Adding gas three times without finding the leak means you're over the threshold. That's a regulatory problem for the owner, not just a service issue."

**Source:** https://www.epa.gov/section608/stationary-refrigeration-leak-repair-requirements | https://www.epa.gov/section608/regulatory-updates-section-608-refrigerant-management-regulations

---

## SCENARIO R-19 — Refrigerant leak response: commercial machine room (SAFETY)

**Symptom (verbatim):** "Tech went into the compressor room and immediately felt dizzy. Smelled nothing but felt weird. CO2 system next door."

**Equipment:** CO2 transcritical refrigeration system, enclosed compressor/machine room.

**Correct diagnostic path — SAFETY SCENARIO:**
1. Dizziness with no odor in machine room with CO2 system = CO2 leak until proven otherwise
2. CO2 is odorless, colorless, heavier than air — accumulates at floor level
3. IMMEDIATE ACTION: exit the room, do not re-enter
4. Alert store management, evacuate adjacent areas if leak is large
5. Call service manager and building owner — this is an emergency
6. Do NOT enter without: fresh-air breathing apparatus (CO2 displaces O2) and a partner
7. Ventilate room from outside before entry: power ventilation fans if safe to do so remotely
8. Use CO2 monitor/meter before re-entry: must read below 5,000 ppm (OSHA PEL) before entering
9. Identify leak source after safe entry — CO2 leak detectors placed low (18" off floor)
10. Repair per manufacturer leak procedure; CO2 transcritical system requires specialized repair training

**Regulatory / safety facts:**
- CO2 OSHA PEL: 5,000 ppm (8-hour TWA)
- CO2 IDLH: 40,000 ppm (immediately dangerous to life and health)
- 40,000 ppm can occur in seconds from a large leak in a small enclosed room
- EPA does not require recovery of CO2 refrigerant (it is not an ODS or regulated HFC), but safety protocols apply

**Safety flags Mike MUST mention:**
- Never dismiss dizziness in a machine room as "just being tired" — treat as refrigerant asphyxiation event
- CO2 systems must have fixed CO2 detectors per ASHRAE 15 and most local codes
- Anyone who experienced dizziness should be evaluated medically before returning to work

**Tone check:** "Dizzy in the machine room with no smell — that's CO2 until you prove otherwise. Get out first. Diagnose second."

**Source:** https://e360hub.copeland.com/refrigerant-energy-regulations/co2-as-a-refrigerant-five-potential-hazards-of-r744 | https://www.acrjournal.uk/features/applying-co-leak-detection-in-food-retail/ | https://www.achrnews.com/articles/153918-addressing-leaks-in-co-refrigeration-systems

---

## SCENARIO R-20 — Hussmann reach-in case: door glass heater failure, fogging

**Symptom (verbatim):** "Hussmann glass door case in dairy, door glass is fogged up. Customers can't see product. Anti-sweat switch is on."

**Equipment:** Hussmann glass door reach-in case, electric door glass heater.

**Correct diagnostic path:**
1. Glass door heaters prevent condensation by keeping glass surface above dew point
2. Verify anti-sweat heater (ASH) control switch is energizing heater circuit — use voltmeter at heater terminals
3. If voltage present but glass cold: open element — test heater element continuity (power off)
4. If no voltage: check ASH controller, humidity sensor, wiring to door
5. Some Hussmann cases use humidity-sensing ASH controls that modulate based on ambient RH — verify setpoint
6. Inspect door seal: if door is misaligned or gasket is torn, warm moist store air infiltrates and overwhelms heater
7. Check door closer mechanism: spring tension adequate to fully close glass door?
8. Verify ASH control setpoint: should activate at relative humidity above approximately 50% ambient

**Most likely root cause:** Open door glass heater element OR ASH controller setpoint too low for current humidity

**Safety flags Mike MUST mention:**
- Fogged doors reduce product visibility and sales — this is a business-critical service call
- On multi-door cases: check all door heaters individually — one failed door can indicate failing batch

**Source:** https://www.hussmann.com/ns/Technical-Documents/0515154_D_ISF-ISM_IO_EN.pdf | https://www.partstown.com/cm/resource-content/guides/gd1/true-refrigeration-troubleshooting


---

# BOILERS + HYDRONICS SCENARIOS

---

## SCENARIO B-01 — Lochinvar Knight boiler: E02 fan speed fault lockout

**Symptom (verbatim):** "Lochinvar Knight 155 locked out, showing E02. Reset works but it comes back within an hour."

**Equipment:** Lochinvar Knight condensing gas boiler (KB-155 or similar), direct-vent.

**Correct diagnostic path:**
1. E02 = Fan Speed Fault — actual fan RPM is more than 30% above or below the target RPM during a firing cycle
2. Check inducer/combustion fan: visually inspect for debris, paper, or obstruction on intake
3. Test fan motor free-spinning: disconnect power, spin blade by hand — should spin freely with no drag
4. Check fan motor wiring harness and connector for corrosion or damage
5. Measure fan motor amp draw and compare to spec — high amps with slow RPM = failing motor or restriction
6. Check venting: blocked or undersized flue = back-pressure → fan cannot reach target RPM
7. Verify vent length and termination cap clear of debris (birds, ice, leaves)
8. If fan RPM reads correctly but fault persists: check Hall-effect tachometer pickup on fan motor shaft

**Most likely root cause:** Partially blocked combustion air intake or venting causing fan load fault OR failing inducer motor

**Safety flags Mike MUST mention:**
- Do NOT force-reset repeatedly — repeated lockouts indicate unsafe combustion condition
- Blocked venting = combustion products may spill into building — CO risk until resolved
- Test CO levels in mechanical room before and after repair

**Tone check:** "E02 means the fan isn't spinning at the right speed. Could be the fan, could be the vent. Check both before you call it the motor."

**Source:** https://www.manualslib.com/manual/818259/Lochinvar-40-120.html?page=13 | https://ukgasplumbers.com/lochinvar-boiler-fault-codes/ | https://www.lochinvar.com/lit/KB-SER-08.pdf

---

## SCENARIO B-02 — Lochinvar Knight boiler: E12 no flame on ignition (ignition failure lockout)

**Symptom (verbatim):** "Lochinvar Knight going to E12. Hear it trying to fire, clicks, then shuts down. Three tries and locks out."

**Equipment:** Lochinvar Knight condensing gas boiler, HSI (hot surface igniter) ignition.

**Correct diagnostic path:**
1. E12 = No Flame at Ignition — control board did not detect flame signal during ignition trial
2. Watch ignition sequence: inducer purge → pre-purge → HSI glow → gas valve open → ignition trial
3. Check HSI element: visually inspect for cracks; measure resistance (cold ohms per spec — typically 40-90Ω)
4. Check gas valve: measure 24VAC at gas valve terminals during ignition trial
5. Verify gas pressure at manifold during trial: manometer — natural gas 3.5" WC, LP 11" WC
6. Check for gas supply issues: main shutoff, regulator, other appliances starving supply
7. Flame sensor (rectification rod): clean carbon deposits with fine emery cloth — improper flame signal is common
8. Check igniter grounding: grounded flame sensor wire = E11 (flame sensed out of sequence), not E12
9. If all above check out: control board flame rectification circuit may be failed

**Most likely root cause:** Dirty/cracked HSI element OR contaminated flame sensor OR low gas pressure

**Safety flags Mike MUST mention:**
- Gas valve opening during each ignition trial — if no ignition, raw gas enters the heat exchanger; proper trial-for-ignition timing limits accumulation
- Do NOT bypass ignition lockout control
- Check for gas odor after failed trials — ventilate if detected

**Tone check:** "E12 means it tried and the flame sensor never said 'yes.' Check the igniter, then the gas, then the sensor."

**Source:** https://www.lochinvar.com/lit/KB-SER-08.pdf | https://www.manualslib.com/manual/818259/Lochinvar-40-120.html?page=13

---

## SCENARIO B-03 — Burnham K2 boiler: Soft Lockout 11 (ignition failure after 5 attempts)

**Symptom (verbatim):** "Burnham K2-080 display showing soft lockout, help button is blinking. Code says ignition failure."

**Equipment:** Burnham (U.S. Boiler) K2 series condensing gas boiler.

**Correct diagnostic path:**
1. Soft Lockout Code 11 = flame failure after 5 restart attempts — boiler auto-reset but returns to lockout
2. Soft lockout: boiler shuts down, display turns red, Help button blinks — auto-restarts once condition corrected
3. Press Help to read code — Code 11 on K2-080 through K2-180
4. Verify gas pressure at inlet: K2 requires minimum 4.5" WC natural gas supply pressure
5. Check condensate trap: K2 condensate trap can freeze or plug — frozen trap = blocked flue = ignition failure
6. Inspect flue and intake: direct vent termination may be iced over in cold weather
7. Clean flame sensor rod with fine steel wool
8. Check for air in gas line (especially on first startup of season): purge gas line per procedure
9. If condensate trap frozen: wrap with approved heat tape or relocate drain

**Most likely root cause:** Clogged condensate trap → blocked flue → air pressure switch fault → no ignition OR dirty flame sensor

**Safety flags Mike MUST mention:**
- Frozen condensate in PVC drain line is a common wintertime Burnham K2 service call — preventive insulation
- Do NOT shorten the condensate drain line or eliminate the trap — combustion gases can backdraft
- After repeated lockouts: test CO in the occupied space

**Tone check:** "Soft lockout 11 in cold weather — check the condensate trap first. They freeze and plug all the time."

**Source:** https://www.manualslib.com/manual/986214/U-S-Boiler-Company-K2.html?page=36 | https://www.usboiler.net/wp-content/uploads/2016/09/K2FT_Past-Present_Repair_Troubleshooting.pdf

---

## SCENARIO B-04 — Weil-McLain Ultra boiler: E02 ignition failure lockout

**Symptom (verbatim):** "Weil-McLain Ultra 155 showing E02. Tried resetting twice, comes back. No call from previous tech."

**Equipment:** Weil-McLain Ultra series condensing gas boiler.

**Correct diagnostic path:**
1. E02 = Ignition Failure Lockout — boiler attempted ignition but flame was not established
2. Hard lockout requires manual reset at control board (max 2 resets before investigating)
3. Access fault history in Ultra control to see repeated E02 pattern
4. Remove and inspect flame sensor electrode: clean with fine emery cloth
5. Check igniter: remove and visually inspect; measure resistance — Ultra uses silicon nitride HSI
6. Verify gas supply: check gas valve for 24VAC during trial
7. Check combustion air and flue connections: Ultra is direct-vent, PVC or CPVC — look for joint separations
8. Inspect condensate drain: blockage causes pressure switch fault that mimics ignition failure (sequence aborts at air proving)
9. Weil-McLain recommends no more than two consecutive resets — if it returns, fix the root cause

**Most likely root cause:** Dirty flame sensor OR cracked HSI element OR blocked condensate/flue pressure issue

**Safety flags Mike MUST mention:**
- E04 (power loss after lockout) sometimes appears alongside E02 — verify incoming power quality
- Ultra uses aluminum heat exchanger — condensate must drain freely; pooled condensate causes rapid corrosion
- CO test before return to service

**Tone check:** "E02 on a Weil-McLain Ultra — two resets is your diagnostic budget. After that, use your tools."

**Source:** https://ghac.makekb.com/entry/54/ | https://fireplacehubs.com/weil-mclain-ultra-155-lockout/ | https://thefurnaceoutlet.com/blogs/news/common-weil-mclain-boiler-error-codes-and-what-they-mean-and-what-you-can-do-about-them

---

## SCENARIO B-05 — Triangle Tube Prestige boiler: E28 blower motor fault

**Symptom (verbatim):** "Triangle Tube Prestige Solo 110 showing E28. Boiler shuts down, no heat. Tried resetting."

**Equipment:** Triangle Tube Prestige Solo 110 condensing gas boiler.

**Correct diagnostic path:**
1. E28 = Blower Motor Fault — control module is not receiving the blower's feedback signal
2. Can hear the blower running but E28 persists: tachometer/feedback circuit issue
3. Check blower motor speed feedback wire: verify Hall-effect sensor connector at motor housing
4. Inspect 3-wire blower connector: 24VDC power, ground, and tachometer feedback signal
5. Test tachometer signal with oscilloscope or frequency meter: should pulse proportionally to RPM
6. Check blower motor for mechanical binding: disconnect and spin by hand
7. Measure blower motor supply voltage: nominal 24VDC to 170VDC (ECM motor) or 120VAC (PSC)
8. If feedback signal is present but E28 persists: control board input circuit failed — board replacement

**Most likely root cause:** Failed blower motor tachometer feedback circuit OR ECM motor failure

**Safety flags Mike MUST mention:**
- Prestige uses an aluminum heat exchanger — condensate must drain freely or heat exchanger corrodes
- E28 forces shutdown to prevent uncontrolled combustion with inadequate draft

**Tone check:** "E28 on the Prestige — the board hears the blower but doesn't trust the speed signal. Check that third wire."

**Source:** https://bostonheatingsupply.com/TriangleTube/Prestige%20TroubleShooting%20Guide.pdf | https://www.manualslib.com/manual/1240642/Triangletube-Prestige.html | https://troubleshootinglab.com/triangle-tube-prestige-troubleshooting-guide/

---

## SCENARIO B-06 — Navien NPE tankless combi: E003 ignition failure

**Symptom (verbatim):** "Navien NPE-240A showing E003. No hot water, no heat. Hear it click but nothing lights."

**Equipment:** Navien NPE-A series condensing tankless combi (DHW + heat).

**Correct diagnostic path:**
1. E003 = Ignition Failure — unit cycled but flame was not established
2. Verify gas supply: main valve open, check pressure with manometer at unit inlet
3. Check unit power supply and ground wire: inadequate ground = ignition arc won't form
4. Inspect spark electrode and ground electrode: gap should be 4mm (0.16") per Navien spec
5. Check DIP switch settings: gas type (NG vs. LP), altitude settings — wrong DIP causes gas valve to open incorrectly
6. Verify Dual Venturi assembly is not clogged with condensate or debris
7. Clean or replace ignition electrode if corroded or contaminated
8. After many service cycles, flame rod accumulates carbon — clean with fine abrasive

**Most likely root cause:** Inadequate ground wire OR incorrect gas pressure OR corroded spark electrode

**Safety flags Mike MUST mention:**
- Navien combi is both DHW and space heating — E003 means the customer has no heat AND no hot water
- Gas valve opens on each trial — if repeated failures, ventilate space before continuing
- Verify CO detector is working in mechanical room

**Tone check:** "E003 is almost always the ground wire or the gas pressure. Check both before touching the electrodes."

**Source:** https://www.tanklesshelp.com/how-to-fix-navien-e003-code-ignition-failure-error-easily/ | https://hotwaternowco.com/products/navien-water-heaters/error-codes/ | https://www.monkeywrenchplumbers.com/fix-navien-error-code-e003/

---

## SCENARIO B-07 — Navien NCB combi boiler: E351 low water pressure / auto feeder fault

**Symptom (verbatim):** "Navien NCB-240E showing E351. Keeps going to error then refilling. Pressure gauge shows 8 psi."

**Equipment:** Navien NCB combi boiler with auto-feeder valve.

**Correct diagnostic path:**
1. E351 = Abnormal Auto Feeder Valve — boiler detected low pressure (< 10 PSI) and auto-feeder ran for > 5 minutes without reaching target
2. Normal operating pressure: 15-25 PSI — below 10 PSI causes lockout
3. Inspect system for active leak: visible water at pump flanges, zone valves, baseboards, expansion tank connection
4. Check auto-feeder (pressure reducing valve/fill valve): stuck partially open = fills but leaks → chronic low pressure
5. Test fill valve: close manual shutoff upstream of feeder, note if pressure holds — if pressure holds, leak is downstream
6. Inspect expansion tank: waterlogged tank causes pressure relief valve to open repeatedly → pressure loss → E351
7. Test expansion tank: press Schrader valve — if water comes out, bladder failed; replace tank
8. Purge system of air after repair: air in system causes pressure gauge to read erroneously

**Most likely root cause:** Waterlogged expansion tank causing pressure relief valve cycling OR system leak from failed component

**Safety flags Mike MUST mention:**
- Chronic E351 with repeated auto-filling = system is losing water somewhere — find the leak
- Pressure relief valve may be weeping from repeated opening — inspect and replace if seat is damaged

**Tone check:** "E351 keeps coming back because it's filling, something is losing that water, and it's filling again. Find where the water's going."

**Source:** https://www.manualslib.com/manual/733684/Navien-Ncb-180.html?page=107 | https://hotwaternowco.com/products/navien-water-heaters/error-codes/

---

## SCENARIO B-08 — Rinnai combi boiler: LC scale code (heat exchanger scale buildup)

**Symptom (verbatim):** "Rinnai I-Series combi showing LC code. Customer says hot water is weak. System has hard water."

**Equipment:** Rinnai I-Series condensing combi boiler, hard water area.

**Correct diagnostic path:**
1. LC = Scale Accumulation Alert — Rinnai detects reduced flow through DHW heat exchanger from scale
2. Scale reduces flow rate → flow sensor sees reduced GPM → LC code triggers
3. LC code auto-resets when scaling is removed — but recurrence means cleaning is needed
4. Descaling procedure: shut unit down, isolate DHW heat exchanger ports, circulate food-grade descaling solution
5. Rinnai recommends descaling when LC appears — full procedure in service manual
6. After descaling: check flow sensor and DHW thermistor for accurate readings
7. Check condensate trap: scale can also plug condensate drain — inspect and clear
8. If LC persists after descaling: DHW thermistor or flow sensor failure — test resistance and replace

**Most likely root cause:** Scale accumulation on DHW heat exchanger reducing flow below minimum threshold

**Safety flags Mike MUST mention:**
- Scale buildup can eventually crack an aluminum heat exchanger from hot spots — do not ignore repeated LC codes
- Recommend whole-house water softener or scale inhibitor to owner for prevention

**Tone check:** "LC is the boiler telling you it's scaling up. In hard water areas this comes up every season. Descale and recommend a filter."

**Source:** https://media.rinnai.us/salsify_asset/s-5ca016a8-bbcd-4124-a428-d4417312b19c/800000221%20I-Series%20Plus%20175K%20BTU%20and%20Larger%20Condensing%20Combi%20Boiler%20Tech%20Sheet%20(1).pdf | https://sensibledigs.com/rinnai-tankless-error-code-troubleshooting/ | https://hotwaternowco.com/rinnai-error-codes.php

---

## SCENARIO B-09 — Boiler carbon monoxide: high CO from incomplete combustion (SAFETY)

**Symptom (verbatim):** "Tech checked CO with analyzer on a Weil-McLain Ultra. Reading 450 ppm air-free at the flue. Boiler running fine otherwise."

**Equipment:** Weil-McLain Ultra condensing gas boiler.

**Correct diagnostic path — SAFETY SCENARIO:**
1. 450 ppm air-free CO at flue exceeds the 400 ppm air-free maximum threshold — this is an unsafe appliance
2. Standard: CO in vent > 400 ppm air-free = shut down the appliance
3. Boilers operate 24/7 (unlike furnaces with on/off cycles) — CO from a boiler runs continuously into living space
4. Shut off boiler at service switch; notify homeowner immediately
5. Ventilate the space; check CO detectors in home
6. Diagnose combustion problem: likely causes for high CO on condensing boiler:
   - Condensate pooled in heat exchanger (flooded passages cause incomplete combustion)
   - Dirty burner or heat exchanger
   - Air-gas ratio incorrect (combustion analysis: CO2 %, O2 %, CO ppm)
   - Condensate drain line blocked — most common cause of flooded heat exchanger
7. Run full combustion analysis: target CO2 ~9-10% for natural gas, O2 ~3-5%, CO < 50 ppm at burner
8. Clear condensate drain; clean heat exchanger; retest — do NOT return to service until CO is below 400 ppm air-free

**Most likely root cause:** Blocked condensate drain → pooling in aluminum heat exchanger → combustion gas maldistribution → CO spike

**Safety flags Mike MUST mention:**
- 400 ppm air-free is the technician action limit — DO NOT leave the boiler running above this
- Boilers run 24/7 heating season — CO exposure from a continuous source can be lethal before occupants detect symptoms
- CO symptoms in occupants: headache, nausea, dizziness — ask about symptoms before finishing the call
- Document the CO reading, the shutdown, and the repair action in writing for the owner

**Tone check:** "Over 400 ppm air-free means you shut it down. Period. Boilers run all night — CO from a furnace is bad enough; CO from a boiler runs for 10 hours straight."

**Source:** https://hvacknowitall.com/blog/carbon-monoxide-testing-and-co-action-limits | https://hvacknowitall.com/blog/carbon-monoxide-the-silent-killer-every-tech-should-know-how-to-handle | https://www.hvacproblog.com/high_co_reading_now_what | https://forum.heatinghelp.com/discussion/187061/weil-mclain-ultra-230-heat-exchanger-condensate-corrosion-and-leak

---

## SCENARIO B-10 — Boiler gas leak: manifold fitting leak response (SAFETY)

**Symptom (verbatim):** "Smell gas at the boiler. Customer says they noticed it when they came down to the basement this morning."

**Equipment:** Any gas-fired hot water boiler, gas manifold/piping.

**Correct diagnostic path — SAFETY SCENARIO:**
1. Gas odor at boiler = treat as active gas leak until proven otherwise
2. DO NOT operate any electrical switches, lights, thermostats in the area — spark ignition hazard
3. Evacuate occupants from the building immediately
4. Shut off gas at main shutoff outside the building (not inside — no sparks near gas)
5. Do NOT use cell phone inside building if strong gas odor
6. Call gas utility for immediate response — they have the right to lock off the meter
7. Ventilate by opening windows and doors from outside only
8. Do NOT re-enter until gas utility or first responders clear the building
9. After building is cleared: locate leak with electronic combustible gas detector (not open flame)
10. Common boiler manifold leak locations: gas valve inlet fitting, manifold tee fittings, unions, flex connectors
11. Repair: use approved thread sealant (not Teflon tape alone on gas fittings), torque to spec, test with leak detector and soap solution

**Most likely root cause:** Loose fitting or failed flare/compression at gas manifold — brass fittings vibrate loose over heating cycles

**Safety flags Mike MUST mention:**
- NEVER use an open flame to locate a gas leak
- If gas concentration is > 25% LEL: call the fire department, do not attempt to ventilate
- Gas utility response takes priority over technician diagnosis — let utility clear the building first
- Document the repair and test results; give written confirmation to homeowner

**Tone check:** "You smell gas, everyone leaves, gas gets shut off at the street. That's the sequence. The diagnosis comes after the building is safe."

**Source:** https://emcinsurance.com/losscontrol/techsheet/gas-leak-response-procedure | https://www.vanguardehs.com/articles/responding-to-a-potential-natural-gas-leak-investigation-monitoring-and-emergency-planning

---

## SCENARIO B-11 — Boiler: pressure relief valve weeping / pressure vessel safety

**Symptom (verbatim):** "Boiler pressure relief valve keeps dripping. Owner put a bucket under it. System pressure gauge shows 28 psi."

**Equipment:** Hot water boiler, 30 PSI relief valve, closed hydronic loop.

**Correct diagnostic path:**
1. Relief valve weeping at 28 PSI on a 30 PSI valve = valve is approaching setpoint — investigate cause before replacing valve
2. Common cause: waterlogged expansion tank — bladder failed, tank 100% water, system has no expansion volume
3. Test expansion tank: press Schrader valve — if water flows out, bladder has failed
4. Correct expansion tank pre-charge: drain system, remove tank, check pre-charge pressure (factory 12 PSI typically, should match system fill pressure)
5. If bladder failed: replace tank (cannot repair bladder)
6. After new tank installation: verify system pressure at cold fill (12 PSI typical residential)
7. Pressure at operating temp (180°F): should rise to ~20-25 PSI on a properly charged system — not exceed 30 PSI
8. Do NOT replace relief valve without addressing root cause — new valve will weep too
9. Test new or existing relief valve annually: pull test lever, verify it releases and reseats

**Most likely root cause:** Waterlogged expansion tank eliminating system expansion volume → pressure spikes to relief valve setpoint on each firing

**Safety flags Mike MUST mention:**
- Relief valve is the last line of defense on a pressure vessel — do NOT cap or block a weeping relief valve
- A failed relief valve that won't open = boiler overpressure risk → catastrophic failure
- ASME boiler code requires relief valve rated at or below maximum working pressure of vessel

**Tone check:** "The relief valve isn't bad — it's doing its job. The expansion tank is waterlogged. Fix the tank, then test the valve."

**Source:** https://www.deppmann.com/blog/monday-morning-minutes/hydronic-and-steam-heating-pressure-relief-valves/ | https://ranshaw.com/help-guides/tips/what-is-an-expansion-tank-on-a-boiler/ | https://inspectapedia.com/heat/Boiler-Expansion-Tanks.php

---

## SCENARIO B-12 — Taco 007 circulator pump: cavitation / no heat

**Symptom (verbatim):** "Hot water boiler zone has no heat. Pump is running but making a rattling/gurgling noise. Other zones work fine."

**Equipment:** Taco 007 wet-rotor circulator pump, closed hydronic loop.

**Correct diagnostic path:**
1. Gurgling/rattling from running pump = cavitation (vapor formation in pump impeller) or air entrainment
2. Check system pressure: Taco 007 requires minimum fill pressure to suppress cavitation; min 12 PSI cold fill, 20 PSI at elevation > 5,000 ft
3. Low system pressure → water flashes to vapor at pump inlet → cavitation → no flow, noise, bearing damage
4. Check air vents upstream of pump: air pocket at pump inlet creates same cavitation symptom
5. Verify pump is pumping away from expansion tank (pump should be downstream of expansion tank connection — not upstream)
6. Feel pump body: if pump hot but pipes cold, impeller may be spinning in wrong direction (possible after wiring work)
7. Check wiring: Taco 007 is single-direction — incorrect wiring reversal on 3-wire model causes reverse rotation and reduced flow
8. If impeller seized: motor hums but no flow — replace pump cartridge

**Most likely root cause:** Air pocket in suction side of pump OR low system pressure causing cavitation

**Safety flags Mike MUST mention:**
- Cavitation rapidly destroys wet-rotor pump bearings — do not run in cavitation condition; find and fix root cause
- Confirm expansion tank is correctly positioned (pump should push away from tank connection point per hydronic design best practice)

**Tone check:** "Gurgling pump is either eating air or starved for pressure. Both will kill the pump. Get the air out and check the fill pressure."

**Source:** https://jacksonsystems.com/wp-content/uploads/2023/08/Taco_007e_Submittal_Instruction_Manual.pdf | https://www.doityourself.com/forum/boilers-home-heating-steam-hot-water-systems/463198-taco-007-f5-circulation-pump-suddenly-having-problems-replacements-loud.html

---

## SCENARIO B-13 — Grundfos UP15 circulator: pump runs but no heat, seized rotor

**Symptom (verbatim):** "Grundfos circulator is humming but nothing is warm. Just replaced last year."

**Equipment:** Grundfos UPS or UP15 wet-rotor circulator pump.

**Correct diagnostic path:**
1. Humming motor with no flow = motor energized but impeller/rotor seized (most common cause of apparent pump failure)
2. Most common cause of new pump seizure: pump sat idle over summer, iron oxide (rust) fused shaft
3. Grundfos service procedure: use a flat-blade screwdriver at pump bleed screw to manually turn rotor
4. Remove pump cap (bleed screw end), insert screwdriver in rotor slot, turn to free rotor
5. Bleed air from pump body after freeing rotor (water lubricated — air destroys bearings rapidly)
6. If rotor cannot be freed: replace pump
7. Prevention: run pump briefly once per month during summer (Grundfos recommendation)
8. Check pump mounting orientation: wet-rotor pumps must be mounted with shaft horizontal — vertical mount traps air and accelerates bearing failure

**Most likely root cause:** Rotor seized from summer inactivity (iron oxide on stainless shaft sleeve)

**Safety flags Mike MUST mention:**
- Do NOT run a pump with air trapped in the motor housing — water-lubricated bearings chew up within minutes dry
- After freeing rotor: bleed the pump before restarting

**Tone check:** "Grundfos humming with no flow is almost always a seized rotor from sitting all summer. Two minutes with a screwdriver fixes it."

**Source:** https://www.ifixit.com/Guide/Grundfos+circulation+pump+for+heating+is+stuck/130859 | https://www.grundfos.com/us/learn/ecademy/all-courses/alpha-and-upse-circulators-for-residential-heating/troubleshooting--warnings-and-alarms | https://inspectapedia.com/heat/Circulator_Pump_Diagnostic_Tests.php

---

## SCENARIO B-14 — Bell & Gossett NRF circulator: mechanical seal leak

**Symptom (verbatim):** "Bell & Gossett circulator has water dripping from around the motor shaft. Just started a few weeks ago."

**Equipment:** Bell & Gossett NRF wet-rotor circulator pump.

**Correct diagnostic path:**
1. Water from shaft/motor area = mechanical seal failure on wet-rotor pump
2. Wet-rotor pumps use water as lubricant — when seal fails, system water escapes at shaft
3. Leaking seal: inspect junction between motor body and volute — water trail usually starts here
4. NRF/NBF pumps: seal is part of the cartridge assembly — replace entire cartridge or pump
5. Do NOT run leaking pump: dry bearings follow seal failure rapidly
6. Check system water chemistry: aggressive (low pH, high oxygen) water destroys seals in 2-3 seasons
7. Test system pH: ideal range 7.0-8.5 for ferrous systems — acidic water (< 7) corrosive to copper and cast iron
8. Add corrosion inhibitor per boiler manufacturer spec — improves seal and heat exchanger life

**Most likely root cause:** Failed mechanical seal due to age, contaminated system water, or dry-run damage

**Safety flags Mike MUST mention:**
- Wet seal leak will worsen — if ignored, motor floods and requires replacement
- Shut down pump for repair; do not allow drip to run onto electrical connections below

**Source:** https://www.xylem.com/siteassets/brand/bell-amp-gossett/resources/manual/p86203f.pdf | https://forum.heatinghelp.com/discussion/82502/bell-gossett-booster-pump-leaking

---

## SCENARIO B-15 — Taco 571 zone valve: stuck closed, no heat to one zone

**Symptom (verbatim):** "One zone has no heat. All other zones work. Thermostat calls, can hear the system running."

**Equipment:** Taco 571 zone valve, multi-zone hydronic system.

**Correct diagnostic path:**
1. One zone no heat with system running = zone valve or thermostat fault
2. Test thermostat: verify 24VAC signal at zone valve head terminals when thermostat calls
3. Taco 571 requires 24VAC across terminals to open — listen for valve motor (takes ~1.5 minutes to open fully)
4. If 24V present but no valve movement: actuator motor or gear train failed — replace valve head
5. Manual override: Taco 571 has a manual lever — push to manually open valve; if heat flows, valve body is OK, actuator is failed
6. If manual open shows heat: replace valve head only (body stays in system)
7. If no heat on manual open: zone is air-bound or circulator not reaching this zone — check air vents and system balance
8. Inspect valve body for corrosion or scale debris blocking seat — may need replacement if physically blocked

**Most likely root cause:** Failed Taco 571 valve head actuator (motor/gear failure) — head is replaceable independently of valve body

**Safety flags Mike MUST mention:**
- Manual override bypasses the normal control — return valve to auto position after confirming heat flow
- If the zone was suddenly cold after power restoration: check if thermostat was reset to incorrect setpoint

**Tone check:** "One dead zone with everything else working — start at the zone valve. Manual lever tells you in 30 seconds if it's the valve or the zone."

**Source:** https://www.justanswer.com/hvac/awji4-seems-one-taco-zone-valve-stuck-closed.html | https://forum.heatinghelp.com/discussion/191722/taco-zone-valve-troubleshooting-heating-issue-manually-opening-zone-valve-still-no-heat

---

## SCENARIO B-16 — Honeywell V8043 zone valve: stuck open, zone overheating

**Symptom (verbatim):** "One zone is always warm even when the thermostat is off. Other zones working normally."

**Equipment:** Honeywell V8043 spring-return zone valve, normally closed.

**Correct diagnostic path:**
1. V8043 is normally closed — spring returns it closed when power is removed
2. Zone warm with no thermostat call = valve stuck open mechanically (spring failed or valve body fouled)
3. Test: remove 24V wiring from valve head — if zone continues to be warm, valve is mechanically stuck open
4. Remove valve head from body: actuator is independently removable (2 mounting screws)
5. Test head alone: does it return to closed position when de-energized? If not, head/spring failed
6. If head tests good but valve body is stuck: debris or corrosion in valve seat holding disk open
7. Replacement: V8043 head is available separately; entire valve body replacement if seat is damaged
8. Inspect system for glycol or corrosion inhibitor residue — can foul valve seats over time

**Most likely root cause:** Failed return spring in valve head OR fouled valve seat preventing closure

**Safety flags Mike MUST mention:**
- Zone stuck open causes continuous heat to that zone — occupant complaint of overheating + wasted fuel
- If multiple zones show abnormal behavior: check zone board or aquastat for miswiring

**Tone check:** "V8043 is spring-close — if the zone's hot with no call, the spring isn't doing its job. Pull the head and test it separately."

**Source:** https://forum.heatinghelp.com/discussion/181814/honeywell-v8043f10-zone-valve-getting-stuck-open | https://highperformancehvac.com/honeywell-zone-valve-problem/ | https://engineerfix.com/how-to-replace-a-honeywell-zone-valve/

---

## SCENARIO B-17 — Hydronic system: air in the loop (no heat, whooshing noise)

**Symptom (verbatim):** "Boiler fires, pump is running, but baseboards are cold. Hear a whooshing sound from the pipes."

**Equipment:** Closed hydronic heating system, baseboard convectors, circulator pump.

**Correct diagnostic path:**
1. Whooshing sound + cold baseboards + boiler firing = air lock in the distribution loop
2. Air collects at high points in the system; air pockets stop water circulation through that section
3. Locate air vents at all high points: automatic air vents or manual Schrader-valve purge points
4. Manual purge procedure: with system pressurized and pump running, open each zone's purge valve from the boiler outward
5. Purge until solid water stream (no air bubbles) from each zone
6. Close each zone valve as it is purged, open next zone — isolate and purge each zone individually
7. Check automatic air vents: Taco Hy-Vent or Spirovent — cap stuck closed or float jammed
8. After purge: verify system pressure holds at 12-15 PSI cold; re-check after running at temperature

**Most likely root cause:** Air introduced during recent system repair, add-on zone, or fill after draining

**Safety flags Mike MUST mention:**
- Air in ferrous pipe systems causes oxygen corrosion — do not leave system air-bound for extended periods
- Oxygen attack degrades circulator pump seals and cast iron components within months

**Tone check:** "Whoosh in the pipes and cold baseboards — that's air. Purge it zone by zone with the pump running."

**Source:** https://inspectapedia.com/heat/Air_Separators_Scoops.php | https://pexuniverse.com/air-eliminators | https://inspectapedia.com/heat/Air-Separators-Scoops-FAQs.php

---

## SCENARIO B-18 — Radiant PEX system: one cold zone, tempering valve set wrong

**Symptom (verbatim):** "Radiant floor in master bedroom is cold. Rest of the house is fine. PEX manifold installed last year."

**Equipment:** PEX radiant floor heating, hydronic manifold, thermostatic mixing/tempering valve.

**Correct diagnostic path:**
1. One cold zone on a manifold system: zone valve actuator on that manifold port, or flow meter closed
2. Check manifold flow meter on cold zone: some manifolds have integral flow meters — verify open and set to correct GPM
3. Inspect zone actuator on manifold: thermostatic electric actuator for radiant zone — test 24VAC signal
4. Tempering valve: radiant systems require supply water at 85-120°F (vs. 140-180°F boiler supply)
5. Verify tempering valve setpoint — Watts, Honeywell, or Caleffi mixing valve should be set to floor supply temp per design
6. Return water temperature sensing: some systems use return sensor to verify loop is circulating — if sensor failed, flow stops
7. Check for air in PEX loop: air can bind a single loop even when manifold appears pressurized
8. PEX loop purge: isolate all loops except cold zone, force-purge through manifold drain point

**Most likely root cause:** Closed manifold flow meter OR failed zone actuator OR air-bound individual PEX loop

**Safety flags Mike MUST mention:**
- Tempering valve is critical for radiant: boiler temperature water (180°F) through floor PEX will cause floor damage and potential burn hazard
- Always verify tempering valve function after any boiler repair/replacement

**Tone check:** "Radiant cold zone with good manifold pressure — start at the flow meter and the actuator. One of those is almost always the answer."

**Source:** https://www.pmmag.com/articles/88035-the-dos-and-donts-of-three-way-thermostatic-valvesbrjohn-siegenthaler-pe | https://wbiwarm.com/blog/underfloor-heating-repair-guide/

---

## SCENARIO B-19 — Steam boiler: low water cutoff trips, no steam

**Symptom (verbatim):** "Burnham steam boiler shuts off on low water. Sight glass shows water. Keeps tripping."

**Equipment:** Burnham steam boiler, probe-type or float-type low water cutoff (LWCO).

**Correct diagnostic path:**
1. LWCO trips despite visible water in sight glass = LWCO probe fault or foamy/oily water condition
2. Probe-type LWCO: probe detects water conductivity — oil contamination causes probe to not sense water properly
3. Burnham steam boilers are particularly sensitive to oil contamination in boiler water (skimming required on new boilers)
4. Drain 2-3 gallons from LWCO blowdown port (monthly maintenance procedure) — flush sediment and oil
5. Clean probe: remove probe assembly, clean with fine abrasive, reinstall
6. Test probe continuity at LWCO control: probe submerged = continuity to ground; probe dry = open
7. Float-type LWCO: inspect float chamber for scale or debris binding float — float moves freely?
8. If sight glass shows water but LWCO sees dry: sight glass piping may be blocked — blow down sight glass connections

**Most likely root cause:** Contaminated boiler water (oil from system) coating probe OR blocked sight glass connection giving false water level reading

**Safety flags Mike MUST mention:**
- Low water cutoff is life-safety on a steam boiler — do NOT bypass or jumper LWCO to force firing
- Dry-fired steam boiler can be destroyed in seconds and may cause explosion
- Monthly LWCO blowdown is a safety maintenance item, not optional

**Tone check:** "LWCO tripping with visible water is usually an oily probe or a sight glass lie. Blow it down and clean the probe before assuming the control is bad."

**Source:** https://www.justanswer.com/hvac/fiiez-when-turn-burnham-gas-steam-boiler-light.html | https://forum.heatinghelp.com/discussion/167040/low-water-cutoff | https://www.hunker.com/13415667/how-to-troubleshoot-a-burnham-steam-boiler/

---

## SCENARIO B-20 — Steam boiler: Hartford loop / near-boiler piping water hammer

**Symptom (verbatim):** "Burnham steam boiler makes loud banging sounds near the beginning and end of each cycle. Neighbors can hear it."

**Equipment:** Burnham or Slant/Fin one-pipe steam system with Hartford loop and equalizer.

**Correct diagnostic path:**
1. Loud banging on steam system = water hammer — steam meets liquid water in pipe, condenses rapidly, creates hydraulic shock
2. Hartford loop function: equalizer pipe balances pressure between steam header and wet return; prevents water from being blown out of boiler
3. Check Hartford loop connection: close nipple should be 2" below normal boiler water line — if too high, steam enters wet return → hammer
4. Verify boiler water level: normal operating level = center of sight glass (±)
5. Examine equalizer pipe for correct sizing and pitch: undersized equalizer = unsteady waterline → surging
6. Check main vents: if main air vents are failing (clogged), steam can't push air out → condensate backs up → hammer
7. Boiler water quality: excessive TDS or oils cause foaming/surging → water carry-over into supply mains → hammer
8. Test with TDS meter: if > 7,000 ppm, blow down and refill with clean water

**Most likely root cause:** Failed main vents OR Hartford loop nipple incorrectly sized/positioned OR high TDS water causing surging

**Safety flags Mike MUST mention:**
- Water hammer can fracture old cast-iron radiator sections — inspect system for any cracked fittings after repeated events
- Do not attempt to eliminate the Hartford loop — it prevents catastrophic boiler damage from complete water loss

**Tone check:** "Steam hammer near the boiler is almost always about the near-boiler piping or the water quality. Start there before touching any mains."

**Source:** https://heatinghelp.com/systems-help-center/a-hartford-loop-q-and-a/ | https://www.boilersondemand.com/steam/taming-your-steam-system-the-hartford-loop-and-equalizer-piping/ | https://inspectapedia.com/heat/Hartford_Loop.php

---

## SCENARIO B-21 — Burnham cast-iron boiler: ignition failure with cad cell / pilot assembly

**Symptom (verbatim):** "Old Burnham gas boiler won't stay lit. Pilot lights fine but main burner shuts off after 5 seconds."

**Equipment:** Burnham Series 2 cast-iron gas boiler, standing pilot or intermittent pilot, thermocouple/flame rectification.

**Correct diagnostic path:**
1. Pilot lights but main burner shuts off = thermocouple or flame sensor not proving flame to gas valve
2. Standing pilot thermocouple: generates millivolt signal (should read 15-30 mV DC) — test with multimeter
3. Millivolts below 15 mV: thermocouple tip not fully in pilot flame OR thermocouple failing — replace
4. Intermittent pilot (IPI): uses cad cell or flame rod — not thermocouple; check ignition module
5. Measure microamps of flame rectification signal in series with flame rod: should read 0.5-5 µA DC for IPI systems
6. Low microamps: clean flame rod with fine steel wool; verify rod ground path through burner chassis
7. Burnham-specific: electrode mounting plate over-tightened blocks light path to cad cell — flatten plate, realign electrodes
8. Verify gas valve operators: PV and MV-PV terminals should read 24VAC when thermostat calls and pilot is proven

**Most likely root cause:** Weak thermocouple (millivolts low) OR dirty/misaligned cad cell OR cracked electrode mounting plate blocking light path

**Safety flags Mike MUST mention:**
- Main burner gas valve opening and closing repeatedly without sustained ignition = gas accumulation — ventilate space
- Do NOT jumper gas valve safety operators to test — fire hazard

**Tone check:** "Shuts off after 5 seconds means the gas valve never got confident the flame was there. Test the millivolts or the microamps before replacing the valve."

**Source:** https://www.beckettcorp.com/bulletins/troubleshooting-the-cad-cell/ | https://inspectapedia.com/heat/Cad_Cell_Relay_Reset_Button.php | https://forum.heatinghelp.com/discussion/188383/burnham-p209-electric-intermittent-pilot-igniter-replacement

---

## SCENARIO B-22 — Beckett oil burner: primary control lockout (cad cell diagnosis)

**Symptom (verbatim):** "Oil boiler locked out again. Reset button on the primary control. Customer says it locks out every morning."

**Equipment:** Beckett AFG or NX oil burner with Genisys primary control, cad cell flame detector.

**Correct diagnostic path:**
1. Primary control lockout = flame not proven to cad cell within trial period
2. Beckett Genisys hard lockout: requires 15-second hold or 30-second press on reset button
3. Cad cell resistance in light: should read < 1,600 Ω (resistance drops as light increases)
4. Cad cell resistance in dark: should read > 100,000 Ω (or infinity)
5. Measure cad cell resistance with ohmmeter in dark conditions — high resistance in light = dirty or failing cad cell
6. Clean cad cell eye with soft cloth — soot and oil film cause false dark reading
7. Check cad cell alignment: cad cell must view flame directly; bent or misaligned cad cell holder common cause
8. Inspect electrode gap and tip condition: correct gap is 5/32" (4mm) per Beckett spec
9. Verify oil pressure at nozzle: 100 PSI nominal — low oil pressure = weak flame = poor cad cell response

**Most likely root cause:** Dirty cad cell (resistance high despite flame) OR misaligned electrode mounting blocking cad cell view

**Safety flags Mike MUST mention:**
- Oil burner lockout is a hard lockout — do NOT reset more than once without investigation
- Repeated resets = raw oil misting into combustion chamber — explosion risk on next ignition
- Check stack temperature and CO at flue after successful ignition — incomplete combustion with cad cell issues

**Tone check:** "Cad cell is how the burner knows there's a flame. Clean it, check its view, check resistance. Most lockout calls on oil burners start right there."

**Source:** https://www.beckettcorp.com/bulletins/troubleshooting-the-cad-cell/ | https://www.beckettcorp.com/support/troubleshooting-guides/ | https://inspectapedia.com/heat/Oil_Burner_Wont_Run.php

---

## SCENARIO B-23 — Tekmar 260 boiler control: no heat, outdoor reset not calling boiler

**Symptom (verbatim):** "Tekmar 260 outdoor reset control installed. Boiler never fires even though it's 10 degrees outside."

**Equipment:** Tekmar 260 boiler control with outdoor temperature reset, single-stage gas boiler.

**Correct diagnostic path:**
1. Tekmar 260 operates boiler by adjusting supply water temperature based on outdoor temperature
2. Control requires: 24VAC power supply, outdoor sensor connected, boiler sensor (supply) connected, boiler output relay wired to boiler enable
3. Check wiring: outdoor temperature sensor terminals — if sensor open or shorted, control may default to no call
4. Verify outdoor sensor value is reading correctly on display
5. Check heat curve setting (slope): if set too flat for climate, calculated supply setpoint may be below current supply temp → no call
6. Verify lower limit setting: if lower limit setpoint is above current supply temp, boiler fires for DHW even without heat call
7. Check heat relay output: voltmeter across boiler enable terminals when heat is being requested
8. Verify thermostat/heat demand wiring: Tekmar 260 can operate from indoor stat or operate via fixed schedule

**Most likely root cause:** Outdoor sensor wiring open circuit (no sensor signal) OR heat curve slope set incorrectly for the climate

**Safety flags Mike MUST mention:**
- In sub-zero temperatures: if Tekmar 260 fails to call boiler, building can freeze in hours — document and confirm operation before leaving
- On first installation: verify all sensor resistances match Tekmar specification for NTC sensor type

**Tone check:** "Tekmar 260 needs to see a valid outdoor sensor AND a heat call to do anything. Check both wires and the curve setting."

**Source:** https://bostonheatingsupply.com/Tekmar/T260%20Installation%20and%20Operation%20Manual.pdf | https://www.watts.com/products/hvac-hot-water-solutions/controls/boiler-and-mixing-controls/260

---

## SCENARIO B-24 — Condensing boiler: condensate trap plugged, pressure switch fault

**Symptom (verbatim):** "Navien / Lochinvar condensing boiler shuts down on pressure switch fault in cold weather. Air switch isn't the problem."

**Equipment:** Condensing gas boiler (any brand with PVC flue), condensate trap in drain line.

**Correct diagnostic path:**
1. Condensing boilers produce acidic condensate (pH 3-5) — must drain continuously through trap
2. Frozen or plugged condensate trap: condensate backs up into heat exchanger → water in heat exchanger → back-pressure on flue → air pressure switch reads inadequate draft → shuts down
3. Inspect condensate drain line: frozen? Plugged with debris or scale?
4. Trap test: disconnect trap, blow through with lungs — should flow freely; if restricted, flush or replace
5. Verify drain line pitch: condensate line must pitch continuously downward to drain — no high spots
6. On Burnham K2: condensate trap is a known freeze point in unheated spaces — wrap with approved heat tape
7. Check drain line material: PVC or CPVC required — copper or iron will corrode from acidic condensate
8. Verify drain terminates to appropriate drain: condensate at pH 3-5 may require neutralizer per local code

**Most likely root cause:** Frozen or plugged condensate trap causing back-pressure on flue system

**Safety flags Mike MUST mention:**
- Condensate from condensing boilers is corrosive — do NOT drain directly onto lawn or into storm drain in jurisdictions that require neutralization
- Frozen condensate: if heat tape is installed, verify it is operational — thermostatically controlled heat tapes are preferred

**Source:** https://www.velocityboilerworks.com/troubleshoot/phantom/slo-2/ | https://forum.heatinghelp.com/discussion/195822/weil-mclain-control-fault-lockout

---

## SCENARIO B-25 — Hydronic system: Spirovent air separator not working, chronic air problems

**Symptom (verbatim):** "New boiler system, constant air in the loops. Installed an air separator but it doesn't seem to be helping."

**Equipment:** Closed hydronic heating system, Spirotherm Spirovent or Taco air separator.

**Correct diagnostic path:**
1. Air separators work by creating turbulence or centrifugal force to coalesce micro-bubbles → collect → vent
2. Most common installation error: pump pumping toward expansion tank (pump should push away from expansion tank connection)
3. When pump pushes toward expansion tank: pressure at separator is reduced by pump curve → less effective air removal
4. Correct piping: expansion tank connection at separator inlet (suction side of pump); pump outlet to system
5. Verify air vent on separator is not capped or fouled: float vent inside must move freely
6. Air separator location: must be at the highest temperature point (immediately off boiler supply) — hot water holds less dissolved gas
7. Check auto air vents at high points in the system: if these are capped or failed, separator works harder than designed
8. New system fill: factory-dissolved air in tap water takes several heating cycles to fully remove — patience + purge cycles

**Most likely root cause:** Incorrect pump/expansion tank piping orientation (pump toward tank rather than away from it)

**Safety flags Mike MUST mention:**
- Dissolved air in ferrous systems causes oxygen corrosion — chronic air problems accelerate system degradation

**Tone check:** "Air separators only work when the pressure is right. If the pump is pushing into the tank connection, you're fighting the physics."

**Source:** https://inspectapedia.com/heat/Air_Separators_Scoops.php | https://pexuniverse.com/air-eliminators | https://forum.heatinghelp.com/discussion/180631/fixing-old-system-where-to-put-expansion-air-separator


---

# ADDITIONAL REFRIGERATION AND HYBRID SCENARIOS

---

## SCENARIO R-21 — Walk-in cooler overcharge: high suction, flooding TXV

**Symptom (verbatim):** "Just recharged a walk-in cooler. Now the suction line is frosting back to the compressor. Suction pressure is higher than before."

**Equipment:** Walk-in cooler, R-448A, TXV metered system.

**Correct diagnostic path:**
1. Frost on suction line returning to compressor + high suction pressure + recently recharged = overcharge OR flooding TXV
2. Overcharged system: excess liquid refrigerant backs up in condenser → high subcooling → TXV sees more liquid → floods evaporator → liquid to compressor
3. Measure subcooling at condenser outlet: > 15°F on most systems suggests overcharge (verify OEM spec)
4. Measure suction superheat: < 5°F or frost on suction line = liquid floodback
5. Check TXV superheat setting: if adjusted too low (or bulb slipped off suction line), will flood independently of charge
6. Recovery option: recover small amount of refrigerant, re-check subcooling and superheat
7. Verify TXV bulb is clamped properly at 4 o'clock position on suction line and insulated from ambient
8. On TXV systems: proper charge is determined by subcooling — not weight and not sight glass alone

**Most likely root cause:** Overcharge from excessive refrigerant added OR TXV bulb slipped off suction line

**Safety flags Mike MUST mention:**
- Liquid refrigerant reaching compressor = compressor damage (liquid slugging) — check oil for refrigerant dilution
- Do NOT leave overcharged system running; recover refrigerant to correct subcooling target before departure

**Tone check:** "Frosting suction line after a charge usually means too much refrigerant or a loose TXV bulb. Measure subcooling, not just suction pressure."

**Source:** https://www.acservicetech.com/post/should-i-check-the-refrigerant-charge-with-superheat-or-subcooling | https://hvac-talk.com/vbb/threads/1504371-Superheat-and-Subcooling-on-walk-in-cooler-and-freezers

---

## SCENARIO R-22 — Supermarket rack: Emerson E2 offline unit controller (communication fault)

**Symptom (verbatim):** "E2 controller showing offline alarms for two of the display cases. Cases seem to be running but alarms won't clear."

**Equipment:** Hussmann display cases with Emerson electronic unit controllers (EUC), E2 rack controller.

**Correct diagnostic path:**
1. E2 offline alarm = controller cannot communicate with case unit controller via ECHELON or RS-485 network
2. Perform rescan at E2 system manager — forces network to find offline devices
3. Check network termination: RS-485 network requires 120Ω EOL termination resistor at each end of bus — missing or duplicate terminator causes intermittent comm failures
4. Verify power at offline case controllers: unit controllers need stable 24VAC supply — power supply failure common after lighting retrofit
5. Check communications cable continuity: shielded twisted-pair, no splices without proper connectors
6. If rescan doesn't recover device: cycle power to case controller — controls reset on power-up and re-register
7. E2 alarm: "P1 error code" with 135 PSI flashing = EUC energized contactor but suction pressure stayed high → EUC suspects suction transducer — verify transducer wiring

**Most likely root cause:** EOL termination resistor missing or failed on communications network bus

**Safety flags Mike MUST mention:**
- Cases may be running on last valid setpoints after comm loss — verify temperatures independently with probe thermometer
- Document any E2 parameter changes; rack control setpoint changes affect the entire refrigerated store

**Source:** https://media.copeland.com/18c39c3e-ce29-40f4-a9cb-b16d003ebc6b/026-1614_E2%20Enhanced%20User%20Manual.pdf | https://emersonvilter.custhelp.com/ci/fattach/get/343673/0/filename/E2+Alarm+Advisory+Message+List.pdf

---

## SCENARIO R-23 — CO2 transcritical system: trapped liquid pressure hazard (SAFETY)

**Symptom (verbatim):** "Tech was going to isolate a section of CO2 system for a filter change. Closing two manual valves. Should I be worried?"

**Equipment:** CO2 transcritical booster system (Hill Phoenix Advansor or similar).

**Correct diagnostic path — SAFETY SCENARIO:**
1. CO2 CRITICAL SAFETY: trapping liquid CO2 between two closed valves creates an extreme pressure buildup hazard
2. CO2 coefficient of thermal expansion is much higher than HFC refrigerants
3. Thermal expansion rate: CO2 pressure increases approximately 145 PSI per 1.8°F temperature rise in trapped liquid
4. Example: liquid CO2 trapped at 40°F; room temperature rises to 75°F (+35°F) → pressure rise ~2,800 PSI → pipe rupture
5. RULE: NEVER isolate a liquid CO2 section between two valves without a pressure relief path
6. Proper isolation procedure: use service valves with integral pressure relief OR install temporary relief valve before isolation
7. Standard CO2 high-pressure piping is rated to 1,800 PSI — exceeding this from trapped liquid = catastrophic failure
8. Always verify system pressure before any service — CO2 systems use specialized high-pressure gauges only

**Most likely root cause:** This is a procedural safety scenario — the hazard is the isolation procedure, not an equipment failure

**Safety flags Mike MUST mention:**
- This is a life-safety issue — pipe rupture from trapped CO2 can cause severe injury or death
- CO2 system service requires manufacturer-specific training; do NOT service CO2 transcritical systems without proper training
- Use only CO2-rated tools and gauges — standard HVAC gauges are not rated for CO2 high-side pressures

**Tone check:** "You can NEVER trap CO2 liquid between two closed valves. That section of pipe turns into a pressure bomb as the temperature rises."

**Source:** https://www.hillphoenix.com/wp-content/uploads/2019/05/Advansor-co2-refigeration-system-i-o-manual-05-20-2020.pdf | https://hvacinsider.com/demystifying-co2-refrigeration/ | https://downloads.regulations.gov/EERE-2020-BT-WAV-0025-0004/content.pdf

---

## SCENARIO R-24 — Hoshizaki ice machine: bin control thermistor failure (E2 code)

**Symptom (verbatim):** "Hoshizaki KML-500 keeps shutting off like the bin is full, but the bin is empty. Shows E2."

**Equipment:** Hoshizaki KML-series modular crescent cuber, bin control thermistor.

**Correct diagnostic path:**
1. E2 = bin control thermistor fault — control detects temperature condition indicating full bin OR sensor failure
2. Bin control thermistor: located in ice bin chute, senses when ice contacts and cools the thermistor → shuts down machine
3. Test: physically verify ice is NOT blocking thermistor location in chute
4. Measure thermistor resistance at ambient temperature: compare to Hoshizaki spec chart (NTC thermistor — resistance decreases as temperature increases)
5. If thermistor resistance is out of spec at room temperature: thermistor failed — replace
6. Check thermistor wiring: corrosion at connector in humid ice bin environment is common cause of intermittent E2
7. Verify thermistor mounting: thermistor must be secured in correct position — drooping into bin gives false full-bin signal
8. Clean thermistor surface: ice slurry or mold growth on thermistor alters resistance reading

**Most likely root cause:** Failed bin control thermistor (resistance out of spec) OR corroded wiring connector

**Safety flags Mike MUST mention:**
- After thermistor replacement: run machine through full freeze/harvest cycle and verify bin control restarts machine normally

**Source:** https://www.pacificiceservices.com/post/hoshizaki-ice-machine-error-codes | https://www.hoshizakiamerica.com/support/training/

---

## SCENARIO R-25 — Walk-in cooler: condenser refrigerant overcharge causing high head pressure

**Symptom (verbatim):** "Walk-in cooler just had condenser replaced. Now trips on high-pressure cutout every afternoon when it's hot outside."

**Equipment:** Walk-in cooler, remote air-cooled condenser, R-404A or R-448A.

**Correct diagnostic path:**
1. Trips after condenser replacement in hot weather = system overcharged at install OR undersized replacement condenser
2. Pull gauges: high discharge pressure compared to expected for ambient temperature
3. High subcooling + high head pressure = overcharge (excess refrigerant in condenser)
4. Check subcooling: > 15-20°F on most commercial systems suggests overcharge
5. New condenser may have different internal volume than original — system charge may need adjustment
6. Verify condenser coil is clean and fins straight from installation damage
7. Verify all condenser fans running and in correct direction
8. If head pressure correct for ambient but still tripping: verify high-pressure cutout setting matches system design

**Most likely root cause:** System overcharged after condenser replacement OR replacement condenser internal volume differs from original (requiring charge adjustment)

**Safety flags Mike MUST mention:**
- After any condenser replacement: recheck refrigerant charge based on subcooling, not original system weight
- High-pressure cutout must be set to manufacturer specification — do not raise setpoint to "stop the tripping"

**Source:** https://hvacprosales.com/low-suction-pressure-diagnosis-guide | https://hvac-talk.com/vbb/threads/1504371-Superheat-and-Subcooling-on-walk-in-cooler-and-freezers

---

## SCENARIO B-26 — Oil-fired steam boiler: Beckett primary lockout after oil delivery

**Symptom (verbatim):** "Oil was just delivered yesterday. Now boiler keeps locking out. Worked fine before the delivery."

**Equipment:** Burnham Independence or Slant/Fin oil-fired steam boiler, Beckett AFG burner.

**Correct diagnostic path:**
1. Lockout after oil delivery = air introduced into oil supply line during delivery process
2. Air in oil line: burner ignites briefly on residual oil, flame fails when air pocket hits nozzle → primary lockout
3. Single reset often resolves if only small air pocket — monitor for recurrence
4. If repeated lockouts: bleed oil line at nozzle assembly (use bleed screw if equipped) or purge by loosening copper oil line at pump and catching oil in rag
5. Check oil filter: delivery stirs up tank sediment — new sediment load can plug filter almost immediately
6. Replace oil filter: 30-minute labor during delivery seasons saves many lockout calls
7. Check nozzle: old nozzle with contaminated strainer basket — replace at start of each season
8. Verify oil pressure at pump: 100 PSI nominal — low pressure = weak flame = cad cell lockout

**Most likely root cause:** Air in oil line from delivery process OR stirred sediment clogging oil filter

**Safety flags Mike MUST mention:**
- Do NOT reset primary control more than 3 times without investigation — raw oil misting into combustion chamber creates fire hazard
- Recommend owner change oil filter annually at delivery time — prevents emergency calls

**Tone check:** "Locks out right after delivery — that's air in the line or a freshly plugged filter. Those are both 20-minute fixes."

**Source:** https://www.beckettcorp.com/support/troubleshooting-guides/ | https://inspectapedia.com/heat/Oil_Burner_Wont_Run.php | https://www.beckettcorp.com/bulletins/the-development-of-modern-primary-controls/

---

## SCENARIO B-27 — Condensing boiler: flue condensate backing up (improper PVC pitch)

**Symptom (verbatim):** "New boiler install. Boiler shuts down and sometimes water drips from the flue connector at the boiler."

**Equipment:** Condensing gas boiler (Navien, Lochinvar, Weil-McLain Ultra), PVC venting.

**Correct diagnostic path:**
1. Water dripping at boiler flue connection = condensate in vent pipe not draining — flowing backward toward boiler
2. Condensing boilers produce 1-3 gallons of condensate per hour during operation
3. Vent pipe must pitch continuously toward boiler (to drain to boiler's integral condensate port) at minimum 1/4" per foot
4. Check vent pipe run: any sections that are level or slope away from boiler will pool condensate
5. Pooled condensate in flue: creates back-pressure on induced draft → pressure switch fault → shutdown
6. Verify condensate drain from boiler flows freely to appropriate drain
7. On horizontal vent: water in bottom of pipe blocks combustion air intake on combined intake/exhaust systems
8. Long horizontal runs: consider condensate tees at low points to drain before reaching boiler

**Most likely root cause:** PVC vent pipe not pitched correctly toward boiler — condensate flows backward

**Safety flags Mike MUST mention:**
- Condensate backup into heat exchanger causes corrosion damage; aluminum heat exchangers fail within 1-2 seasons if chronically flooded
- Condensate pH 3-5 must drain to appropriate drain; verify with AHJ whether neutralizer is required

**Tone check:** "Water dripping off the flue connector on a new install — the vent pipe isn't pitched back to the boiler. Check every horizontal run."

**Source:** https://forum.heatinghelp.com/discussion/187061/weil-mclain-ultra-230-heat-exchanger-condensate-corrosion-and-leak | https://www.justanswer.com/home-improvement/2vr1a-weil-mclain-ultra-boiler-leaking-hot-water-condensate.html

---

## SCENARIO B-28 — Boiler: cold startup, system not heating evenly (zone balance issue)

**Symptom (verbatim):** "Multi-zone boiler system. Front of house heats up fast. Back bedrooms take forever to warm up. All zones active."

**Equipment:** Multi-zone hot water boiler system, multiple Taco or B&G circulators or zone valves, unbalanced.

**Correct diagnostic path:**
1. Uneven heating = hydraulic imbalance — zones with least resistance receive most flow; high-resistance zones starved
2. Check return water temperatures per zone: higher delta-T on underperforming zone = flow starvation
3. Install flow meters or measure pump differential pressure: compare across zones
4. Long-run zone vs. short-run zone: long zone has more pipe resistance — will always get less flow in a non-balanced system
5. Solutions: install balancing valves on each zone supply, throttle easy zones to force flow to hard zones
6. Verify circulator sizing: if all zones share one pump, check if pump curve is adequate for longest zone
7. On zone valve systems: all valves open simultaneously may exceed pump capacity — verify pump head matches system curve
8. Check for partially closed zone valves or manual balancing valves from previous service work

**Most likely root cause:** Hydraulic imbalance — close zones dominate flow, leaving distant zones underserved

**Safety flags Mike MUST mention:**
- Do not close zone valve more than 50% on any individual zone as a balance measure — flow must be maintained to prevent heat exchanger damage on low-flow boilers

**Source:** https://heatinghelp.com/systems-help-center/a-hartford-loop-q-and-a/ | https://www.pmmag.com/articles/88035-the-dos-and-donts-of-three-way-thermostatic-valvesbrjohn-siegenthaler-pe

---

## SCENARIO B-29 — Weil-McLain boiler: E04 incoming power fault after reset

**Symptom (verbatim):** "Weil-McLain Ultra showing E04. Just started this week. Nothing changed on the boiler."

**Equipment:** Weil-McLain Ultra condensing gas boiler.

**Correct diagnostic path:**
1. E04 = Voltage lost after lockout occurred OR AC voltage fluctuations on incoming power
2. E04 indicates control module detected abnormal power supply conditions
3. Check line voltage at boiler: should be 120VAC ±10% (108-132VAC)
4. Monitor voltage during boiler firing: compressor or pump start-up elsewhere on circuit can cause momentary voltage sag
5. Verify dedicated circuit: boiler should be on its own circuit breaker — not shared with other loads
6. Check for loose neutral connection at panel: loose neutral causes voltage fluctuation
7. Weil-McLain recommends: install Time Delay Relay (Part 383-500-021) — provides 3-minute incoming power stabilization delay
8. If E04 persists with stable power: control board power supply circuit failure — board replacement

**Most likely root cause:** Shared circuit with high-load motor causing voltage sag OR loose neutral at electrical panel

**Safety flags Mike MUST mention:**
- Shared boiler circuit with HVAC equipment is a code violation in most jurisdictions — boiler should have dedicated circuit
- Loose neutral is a fire and shock hazard — if suspected, call licensed electrician

**Source:** https://ghac.makekb.com/entry/54/ | https://thefurnaceoutlet.com/blogs/news/how-to-read-and-reset-weil-mclain-boiler-error-codes-like-a-pro

---

## SCENARIO B-30 — Radiant heating: Weil-McLain or Lochinvar boiler, low return temperature protection

**Symptom (verbatim):** "New condensing boiler installed with radiant. Service tech says return water is too cold and could damage the boiler. How low is too low?"

**Equipment:** Condensing gas boiler (Lochinvar, Weil-McLain Ultra) with radiant floor heating (low return water temperature application).

**Correct diagnostic path:**
1. Condensing boilers REQUIRE low return water temperatures (< 130°F) to condense — this is efficient, not damaging
2. Non-condensing boilers require return water > 130-140°F to prevent flue gas condensation and heat exchanger corrosion
3. Identify boiler type before advising: cast-iron non-condensing = protect from low return; aluminum/stainless condensing = designed for low return
4. Radiant floor systems typically deliver 100-140°F supply, 80-110°F return — ideal for condensing boilers
5. If non-condensing cast-iron with radiant: primary-secondary piping with a mixing valve to guarantee 140°F minimum return
6. Check boiler manual for minimum return water temperature specification
7. Lochinvar Knight (condensing): no minimum return temperature concern — designed for return as low as 55°F
8. Weil-McLain Ultra (condensing): stainless steel heat exchanger, handles very low return water temperatures

**Most likely root cause:** This is a system design knowledge question, not a failure — important for preventing misguided "fixes"

**Safety flags Mike MUST mention:**
- Installing a non-condensing boiler on a radiant system WITHOUT proper mixing protection will destroy the heat exchanger within 2-3 seasons from acidic condensate
- Always verify boiler type before designing radiant connection strategy

**Source:** https://www.weil-mclain.com/faq/ | https://www.lochinvar.com/lit/KB-SER-08.pdf | https://www.pmmag.com/articles/88035-the-dos-and-donts-of-three-way-thermostatic-valvesbrjohn-siegenthaler-pe

---

# SAFETY-ONLY SCENARIO RECAP (for Mike routing)

---

## SCENARIO S-01 — Boiler room: CO alarm activation response

**Symptom (verbatim):** "CO detector in the boiler room went off. Two beeps, shows 50 ppm. Boiler is running."

**Equipment:** Gas-fired boiler, CO detector.

**Correct diagnostic path — SAFETY SCENARIO:**
1. 50 ppm CO alarm = take seriously, investigate immediately
2. Evacuate occupants from the building (CO at sustained 50 ppm causes symptoms over time; at 400+ ppm is life-threatening)
3. Ventilate the building: open windows, doors
4. Shut down the boiler at the service switch
5. Do NOT re-enter without CO monitoring device showing safe levels (< 35 ppm)
6. Call HVAC technician to perform combustion analysis before restarting
7. Boiler runs 24/7 heating season — even low-level CO (35-50 ppm) causes chronic exposure; occupant blood levels build
8. Check for flue gas spillage: test draft at draft hood or barometric damper with smoke pencil
9. Combustion analysis: CO > 50 ppm in flue gas products suggests incomplete combustion; > 400 ppm air-free = unsafe appliance

**Safety flags Mike MUST mention:**
- 50 ppm in a living space is actionable — do NOT assume the detector is "oversensitive"
- Boilers run while occupants sleep — nocturnal CO exposure from boilers is specifically more dangerous than furnace exposure (furnaces cycle off)
- Check all occupants for symptoms; recommend medical evaluation if anyone has headache or nausea
- Mike must instruct homeowner to call 911 if anyone feels ill

**Tone check:** "50 ppm and the boiler's running — everybody gets out. That's the only first step."

**Source:** https://hvacknowitall.com/blog/carbon-monoxide-the-silent-killer-every-tech-should-know-how-to-handle | https://hvacknowitall.com/blog/carbon-monoxide-testing-and-co-action-limits | https://www.tcmemt.com/post/everything-you-need-to-know-about-gas-boilers-and-carbon-monoxide-essential-safety-guide-for-homeowners

---

## SCENARIO S-02 — CO2 refrigerant leak in store (SAFETY)

**Symptom (verbatim):** "Store CO2 leak alarm going off. Employees feel dizzy near the dairy case."

**Equipment:** CO2 transcritical refrigeration system, supermarket.

**Correct diagnostic path — SAFETY SCENARIO:**
1. CO2 leak alarm + dizziness = EMERGENCY — evacuate store immediately
2. CO2 is odorless and heavier than air — employees near floor level or in low areas are at greatest risk
3. Call 911 if anyone is symptomatic (dizziness, headache, confusion, rapid breathing)
4. Shut off HVAC and ventilation that might spread CO2 to other areas — OR increase ventilation to dilute, depending on system design
5. Do NOT send employees to find the leak — asphyxiation risk
6. Building must be evacuated before any service technician enters
7. Service entry: only with SCBA or supplied air respirator + partner outside with communication
8. Verify CO2 monitor reads < 5,000 ppm at breathing height before non-respiratory entry
9. Leak source: CO2 systems typically leak at brazed joints, relief valve discharge lines, or service valve packing
10. Repair per CO2 system manufacturer protocol (Hill Phoenix Advansor, Hussmann CO2 Cascade, etc.)

**Safety flags Mike MUST mention:**
- CO2 OSHA PEL: 5,000 ppm. IDLH: 40,000 ppm. Concentrations dangerous to life can accumulate in seconds in enclosed areas
- ASHRAE 15 requires refrigerant detectors in occupied machinery rooms — verify system detectors are operational after repair
- Employees may have CO2 on their breath (natural metabolic CO2 masks symptoms relative to pure fresh air scenarios)

**Source:** https://e360hub.copeland.com/refrigerant-energy-regulations/co2-as-a-refrigerant-five-potential-hazards-of-r744 | https://www.acrjournal.uk/features/applying-co-leak-detection-in-food-retail/ | https://osha.prod.pace.dol.gov/publications/hib19960605

---

## SCENARIO S-03 — Boiler pressure relief valve discharging steam (SAFETY)

**Symptom (verbatim):** "Steam boiler pressure relief valve is shooting steam. Never happened before. Loud hissing near the boiler."

**Equipment:** Steam boiler, pressure relief valve.

**Correct diagnostic path — SAFETY SCENARIO:**
1. PRV discharging steam = system pressure has exceeded relief valve setpoint — EMERGENCY
2. Do NOT stand near the relief valve discharge — steam discharge can cause severe burns
3. Turn off the boiler at the service switch or thermostat immediately
4. Do NOT attempt to close or remove the PRV while discharging
5. Allow system to cool and pressure to drop naturally
6. After pressure drops below PRV setpoint, discharge stops
7. Investigate cause: water feed valve stuck open (overfilling causes steam pressure rise), LWCO failed, or thermostat stuck calling
8. If PRV seat is damaged from discharge: replace PRV before returning to service (will not reseat properly)
9. Do NOT install a higher-rated PRV to "stop the problem" — this is a code violation and safety hazard

**Safety flags Mike MUST mention:**
- Steam at 15 PSI is 212°F+ — burns from PRV discharge are severe; maintain safe distance
- PRV is the last line of defense; its activation means something else has failed first — find that root cause
- Replacing a PRV with a higher-pressure unit is a SERIOUS code violation (ASME boiler code)

**Tone check:** "PRV discharging — kill the boiler, step back, let it settle. The PRV is doing its job. Something else failed first."

**Source:** https://www.deppmann.com/blog/monday-morning-minutes/hydronic-and-steam-heating-pressure-relief-valves/ | https://pexuniverse.com/boiler-pressure-relief-valves | https://www.nationalpumpsupply.com/asme-safety-relief-valves/

---

## End of v3 — Refrigeration, Boilers, and Hydronics

---

TOTAL SCENARIOS: 58
SAFETY SCENARIOS: 7 (R-18, R-19, R-23, B-09, B-10, S-01, S-02, S-03)
EQUIPMENT TYPES COVERED: walk-in coolers, walk-in freezers, Heatcraft/Bohn/Hoshizaki/Manitowoc/Scotsman/Ice-O-Matic/True/Beverage-Air/Hussmann reach-in cases and ice machines, supermarket refrigeration racks (Hussmann/Hill Phoenix), CO2 transcritical systems, Danfoss EKC controllers, Emerson E2 controllers, Sporlan TXV, Lochinvar Knight boilers, Burnham K2 boilers, Weil-McLain Ultra boilers, Triangle Tube Prestige boilers, Navien NPE/NCB tankless combi, Rinnai I-Series combi, Taco 007/571 circulators and zone valves, Grundfos UP/UPS circulators, Bell & Gossett NRF circulators, Honeywell V8043 zone valves, Tekmar 260 outdoor reset control, Beckett oil burner/primary control, PEX radiant manifold and tempering valves, cast-iron steam boilers, Hartford loop steam piping, hydronic air separators/expansion tanks
SOURCES CITED: 44 distinct domains
