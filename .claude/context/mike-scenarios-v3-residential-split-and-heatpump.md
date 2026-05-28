# Mike Scenario Library v3 — Residential Split Systems & Heat Pumps
<!-- Scope: Trane, American Standard, Carrier, Bryant, Payne, Lennox, Allied Air, Goodman, Amana, Daikin (North America), Rheem, Ruud, York, Coleman, Mitsubishi Electric, Bosch, Fujitsu, LG, Samsung, Bard, Cold-Climate Heat Pumps -->
<!-- Refrigerants covered: R-410A, R-22 (legacy/retrofit), R-454B (A2L) -->
<!-- Last updated: 2026-05-28 -->

---

## SCN-RES-001 — Trane XR14 Heat Pump: Low Pressure Lockout (1-Flash)
**Equipment:** Trane XR14 residential split heat pump, R-410A
**Tech describes:** "Outdoor unit not running. Single LED flash on the control board repeating. No compressor noise. Thermostat calling for cooling."

### Symptoms / readings
- Suction PSI: 45 psig (R-410A, well below normal 115–130 psig)
- Head PSI: Not building (compressor off, in lockout)
- Superheat / subcooling: Not measurable — compressor locked out
- Ambient OAT: 88°F
- Indoor RAT / SAT: 76°F / 76°F (no cooling occurring)
- Flash code: **1 flash** repeating = Low Pressure Switch Open
- Status LED pattern: ¼ sec on / ¼ sec off, one count, 5-sec pause, repeat

### Correct diagnosis
Low pressure lockout triggered by low refrigerant charge, most likely a leak in the system. The LPS opened three times within the same cooling operation, causing the control board to lock out the compressor.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm the 1-flash code matches "Low Pressure Switch Open" per Trane XR14 service data. Ask tech to document the flash pattern precisely.
2. Attempt to clear lockout by recycling power at disconnect (wait 5 minutes for anti-short-cycle timer). Note whether lockout returns immediately.
3. With compressor running (after reset), check suction pressure. R-410A normal cooling suction is 115–130 psig at 95°F OAT. Below 60 psig is severely low.
4. Check system superheat — if suction pressure is very low and superheat is high (>20°F), strongly suspect low charge from a leak, not just a bad LPS.
5. Perform electronic leak check at common leak points: Schrader valve cores, evaporator coil tubing, service valve stems, lineset brazed joints, filter drier connections.
6. Do NOT add refrigerant until the leak is found. EPA Section 608 requires repair before recharge if the leak rate exceeds EPA thresholds.
7. If no leak is found and pressures remain low after lockout reset, check LPS wiring continuity and LPS switch itself (should be N.C., opens on low pressure).

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- Tech must disconnect power at both the indoor disconnect and outdoor disconnect before accessing control board or refrigerant circuit components.

### Source(s)
- Trane XR14 Heat Pump LED flash codes — [heatpumppricesreviews.com/trane-heat-pump-led-codes](https://www.heatpumppricesreviews.com/trane-heat-pump-led-codes/)
- EPA Section 608 leak repair requirement — [epa.gov/snap](https://www.epa.gov/snap/substitutes-residential-and-light-commercial-air-conditioning-and-heat-pumps)
- R-410A normal operating pressures — [refrigerantscenter.com](https://refrigerantscenter.com/blogs/refrigerant-review/r410a-operating-pressures-charts-readings-and-best-practices)

### Notes for Mike's tone / style
- Tech-facing: Walk them through the pressure check methodically. Don't jump to "low charge" without ruling out a bad LPS.
- Homeowner-facing: Never say "needs refrigerant" — say "we found the system isn't running at the right pressure and we need to find out why before we can fix it."
- Never quote recharge cost to homeowner.

---

## SCN-RES-002 — Trane XV20i Heat Pump: High Pressure Lockout (2-Flash)
**Equipment:** Trane XV20i variable-speed heat pump, R-410A
**Tech describes:** "Unit was running fine then kicked off. Two-flash LED code on outdoor board. Fan running, compressor tripped off."

### Symptoms / readings
- Suction PSI: 135 psig (slightly elevated)
- Head PSI: 420 psig (R-410A, normal max ~400 psig — high)
- Superheat: 8°F (normal)
- Subcooling: 22°F (elevated — normal target 8–12°F)
- Ambient OAT: 96°F
- Indoor RAT / SAT: 78°F / 62°F
- Flash code: **2 flashes** = High Pressure Switch Open
- Outdoor coil: Visibly clogged with cottonwood debris on three sides

### Correct diagnosis
High-pressure lockout caused by condenser coil restriction (cottonwood/debris plugging), reducing airflow and spiking head pressure. Elevated subcooling confirms refrigerant is backing up in the condenser.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm 2-flash = High Pressure Switch Open per Trane residential LED code chart.
2. Inspect condenser coil from all four sides for debris, cottonwood, grass clippings. A coil blocked even 30% will cause HPS trips at high ambient.
3. Check head pressure correlation: at 96°F OAT, R-410A head pressure should be approximately 320–360 psig. At 420 psig, airflow restriction is likely cause.
4. Clean coil with water (garden hose, fin brush). Do NOT use a pressure washer directly on fins — bends fins and makes it worse.
5. After cleaning, reset lockout and recheck head pressure. Should drop to normal range within 10–15 minutes of operation.
6. Measure subcooling after cleaning — should return to 8–12°F range. If still >15°F after confirmed clean coil, suspect overcharge.
7. If head pressure stays high after clean coil: check outdoor fan motor RPM, check for refrigerant overcharge, verify condenser airflow isn't recirculating (unit too close to wall/fence).

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- Lock out power before accessing control board or condenser fan.

### Source(s)
- Trane heat pump LED codes — [heatpumppricesreviews.com/trane-heat-pump-led-codes](https://www.heatpumppricesreviews.com/trane-heat-pump-led-codes/)
- R-410A pressure-temperature relationship and subcooling — [acdirect.com/blog/r410a-pressure-temperature-chart-pdf](https://www.acdirect.com/blog/r410a-pressure-temperature-chart-pdf/)
- Subcooling charging method — [acservicetech.com/post/the-hvac-subcooling-charging-method-explained](https://www.acservicetech.com/post/the-hvac-subcooling-charging-method-explained)

### Notes for Mike's tone / style
- Tech-facing: "Cottonwood season will load this up fast. Always walk the unit first."
- Never recommend replacement to homeowner for a dirty coil scenario.

---

## SCN-RES-003 — Carrier Infinity 24VNA / 25VNA: Fault Code 16 — High Pressure Switch Open
**Equipment:** Carrier Infinity 24VNA0 variable-speed heat pump, R-410A
**Tech describes:** "Infinity system showing fault 16 on the thermostat. Unit was cooling then tripped. Head pressure was high when I got gauges on it."

### Symptoms / readings
- Suction PSI: 128 psig
- Head PSI: 425 psig
- Superheat: 6°F
- Subcooling: 18°F
- Ambient OAT: 102°F (heat wave conditions)
- Indoor RAT / SAT: 80°F / 68°F
- Fault code: **16 = "High Pressure Switch Open"** per Carrier 25VNA service manual, Table of Fault Codes
- COMM LED (green) on outdoor board: normal
- STATUS LED (amber): fault indicated

### Correct diagnosis
High-pressure trip from combined factors: very high ambient (102°F) and elevated subcooling suggesting mild overcharge. System is right at the edge of its design envelope; if subcooling drops to 10–12°F after ambient drops, overcharge is confirmed.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm fault 16 = High Pressure Switch Open per Carrier 25VNA service manual (shareddocs.com/hvac/docs/1009/Public/01/24VNA6-25VNA4-1SM.pdf).
2. Check outdoor coil for debris. At 102°F ambient, even a partially restricted coil will spike head pressure.
3. Verify condenser fan is running at correct speed. Infinity variable-speed units modulate fan RPM — a fan controller fault can reduce airflow.
4. With unit running after reset: head pressure at 102°F OAT for R-410A should be approximately 375–395 psig. At 425 psig, check subcooling.
5. Subcooling at 18°F with a clean coil at 102°F OAT suggests mild overcharge. Target 8–12°F for TXV systems.
6. If overcharge confirmed, recover a small amount of refrigerant (1–2 oz at a time) and recheck subcooling.
7. Verify HPS wiring and switch continuity before condemning the refrigerant circuit.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Carrier 25VNA Fault Codes, Table of Fault Codes — [manualslib.com/manual/860578/Carrier-25vna.html?page=12](https://www.manualslib.com/manual/860578/Carrier-25vna.html?page=12)
- Carrier 25VNA service manual — [shareddocs.com/hvac/docs/1009/Public/01/24VNA6-25VNA4-1SM.pdf](https://www.shareddocs.com/hvac/docs/1009/Public/01/24VNA6-25VNA4-1SM.pdf)

### Notes for Mike's tone / style
- Tech-facing: Fault 16 is the same on both 24VNA and 25VNA Infinity product lines. Confirm the amber STATUS LED matches the fault code on the thermostat display.

---

## SCN-RES-004 — Carrier Infinity 25VNA: Fault Code 45 — Lost Inverter Communications
**Equipment:** Carrier Infinity 25VNA8 variable-speed heat pump, R-410A
**Tech describes:** "Fault code 45 showing. Outdoor unit not running at all. Checked power, it's good. Board looks fine."

### Symptoms / readings
- Suction PSI: Not measurable (compressor off)
- Head PSI: Not measurable
- Ambient OAT: 85°F
- Flash code / fault code: **45 = "Lost Inverter Communications"** per Carrier 25VNA service manual
- Power supply: 240VAC confirmed at disconnect
- 24VAC control voltage: present
- Inverter board: no visible burn marks

### Correct diagnosis
Communication fault between the main outdoor control board and the inverter/compressor drive module. Root causes include failed inverter board, loose wiring harness between boards, or main control board failure.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm fault 45 = "Lost Inverter Communications" per Carrier 25VNA service manual fault table.
2. Cycle power completely (both disconnects, wait 2 minutes) and attempt restart. Intermittent communication faults sometimes clear with a full power cycle.
3. Inspect the wiring harness between the main outdoor control board and the inverter module for loose pins, corrosion, or chafed insulation.
4. Check DC bus voltage on the inverter — should be approximately 340VDC on a 240VAC supply. Below 300VDC or above 380VDC indicates a power quality issue (see fault codes 86–95 for voltage faults).
5. If harness is intact and DC voltage is correct but fault 45 persists: the inverter module is the primary suspect. Replacement is the typical resolution.
6. Cross-reference with fault 31 (Control Fault) — if both appear in fault history, control board may also be implicated.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- The inverter module stores lethal DC voltage even after power is removed. Wait a minimum of 5 minutes after disconnecting power before touching inverter connections. Verify DC bus is below 50VDC with a meter before touching.

### Source(s)
- Carrier 25VNA Fault Code 45 — [manualslib.com/manual/860578/Carrier-25vna.html?page=12](https://www.manualslib.com/manual/860578/Carrier-25vna.html?page=12)
- Carrier 25VNA8 service manual — [shareddocs.com/hvac/docs/1009/Public/01/25VNA8-24VNA9-4SM.pdf](https://www.shareddocs.com/hvac/docs/1009/Public/01/25VNA8-24VNA9-4SM.pdf)

### Notes for Mike's tone / style
- Tech-facing: The DC bus capacitor warning is not boilerplate — it's real. This kills techs. Verify the bus is discharged before touching anything inside the inverter enclosure.
- Homeowner-facing: "The electronic drive that controls the compressor speed has lost communication with the main controller. We're diagnosing which board needs to be replaced."

---

## SCN-RES-005 — Goodman/Amana Communicating System: Code b0 — Indoor Blower Motor Error
**Equipment:** Goodman GSXC18 / AVPTC air handler, communicating system, R-410A
**Tech describes:** "System showing code b0 on the control. Indoor fan not running. Outdoor unit tries to start then shuts down."

### Symptoms / readings
- Suction PSI: Not measurable (system won't run)
- Head PSI: Not measurable
- Ambient OAT: 78°F
- Indoor RAT / SAT: 72°F / no airflow
- Flash / fault code: **b0 = "Indoor blower motor problem / Communications error between indoor and outdoor unit"**
- Indoor ECM blower: no movement when commanded
- 24VAC control power: present at air handler

### Correct diagnosis
ECM (electronically commutated motor) blower motor failure or motor control module failure. The b0 code on Goodman/Amana communicating systems indicates the motor is not responding to the control command or the indoor/outdoor communication link is broken.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm b0 code definition per Goodman diagnostic code identification system. b0 = indoor blower motor problem or communication error.
2. Distinguish motor failure from communication fault: If the outdoor unit shows a related code (like "no indoor communication"), suspect the communication wiring first.
3. Check the 24VAC communication wiring between indoor and outdoor units for loose connections or damage.
4. Attempt to run the blower in fan-only mode (G call at thermostat). If blower still doesn't run in fan-only, isolate to blower motor/module.
5. Check ECM module for fault LED on the module itself. Many ECM modules (Genteq, Regal-Beloit) have a green LED that flashes fault codes independently.
6. Verify motor capacitor (if applicable) or DC bus voltage on the ECM module. ECM motors in Goodman/Amana AVPTC air handlers are typically 24VDC-commanded variable speed.
7. Swap to a known-good communication wire run first — it's a $10 fix if communication wire is the root cause.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- LOCKOUT_TAGOUT before accessing blower compartment.

### Source(s)
- Goodman communicating system codes b0, b9 — [twintechheating.ca/goodman-air-conditioner-error-codes](https://twintechheating.ca/goodman-air-conditioner-error-codes/)
- Goodman Diagnosis Code Identification System — [mobile.goodmanmfg.com/mobileapp/faultcodes/index.jsp](https://mobile.goodmanmfg.com/mobileapp/faultcodes/index.jsp)

### Notes for Mike's tone / style
- Tech-facing: b0 has two root causes — always chase the cheap fix (communication wire) before condemning the expensive motor module.

---

## SCN-RES-006 — Goodman/Amana: Code E5 — Low Voltage Short Circuit
**Equipment:** Goodman GSX14 split system AC, R-410A
**Tech describes:** "E5 code on the board. System won't run at all. Breaker is fine."

### Symptoms / readings
- Suction PSI: Not measurable
- Head PSI: Not measurable
- Ambient OAT: 82°F
- Flash / fault code: **E5 = "Short in low voltage wiring"**
- 24VAC at transformer secondary: 26VAC (normal)
- Resistance from R to ground: less than 1 ohm (should be open)

### Correct diagnosis
Low-voltage short circuit — a wire in the 24VAC control circuit is shorted to ground (chassis or common). Most commonly caused by a thermostat wire pinched against sheet metal, a wire abraded against the cabinet, or a shorted contactor coil.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm E5 = short in low voltage wiring per Goodman fault code system.
2. Check 24VAC transformer output — if below 20VAC, a dead short is pulling it down. If normal voltage with no load, the short is in the field wiring.
3. Disconnect the thermostat wires at the board one at a time. When the short clears (resistance to ground increases), the last wire disconnected is the shorted wire.
4. Walk the entire thermostat wire run from air handler to outdoor unit to thermostat. Look for wire pinched in a door, cabinet edge, or conduit fitting.
5. Inspect contactor coil for a shorted coil winding (common failure on 5+ year old units in humid climates).
6. Check reversing valve solenoid coil resistance — should be 8–15 ohms. Zero ohms = shorted coil.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE — verify 24VAC circuit only after confirming 240VAC power is off.

### Source(s)
- Goodman E5 fault code — [twintechheating.ca/goodman-air-conditioner-error-codes](https://twintechheating.ca/goodman-air-conditioner-error-codes/)

### Notes for Mike's tone / style
- Tech-facing: "Pull each thermostat wire off the board one at a time. Fast systematic elimination beats chasing the wire run for an hour."

---

## SCN-RES-007 — Lennox XC21 Communicating System: Alert Code 180 — Ambient Sensor Fault
**Equipment:** Lennox XC21 communicating heat pump, iComfort S30, R-410A
**Tech describes:** "Alert code 180 on the S30 thermostat. Unit was running in heating, dropped to fault. No heat output."

### Symptoms / readings
- Suction PSI: Not measured (unit shut down on fault)
- Ambient OAT: 28°F
- Indoor RAT: 68°F
- Flash / fault code: **Alert Code 180 = Ambient sensor problem** per Lennox XC21 series manual, Table 9
- DS11 (green LED) on outdoor board: not lit
- DS14 (red LED): lit, indicating fault

### Correct diagnosis
Outdoor ambient temperature sensor failure. The iComfort control uses the ambient sensor to modulate compressor speed and initiate defrost cycles — without it, the system defaults to fault lockout to prevent running the compressor outside its design envelope.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm alert code 180 = ambient sensor fault per Lennox XC21 Series manual (ManualsLib manual 922657, page 36).
2. Locate the ambient sensor on the outdoor unit — typically clipped to the outdoor coil tubing or mounted on the control board chassis.
3. Disconnect the sensor and measure resistance with an ohmmeter. Compare to the Lennox NTC thermistor resistance-temperature table in the service manual. At 28°F, resistance should be approximately 15–20 kΩ for a standard NTC sensor.
4. If sensor reads open (infinite resistance) or shorted (near zero), replace the sensor.
5. After sensor replacement, clear the fault via the S30 thermostat (Settings > Diagnostics > Clear Faults) and restart.
6. Monitor system operation through one complete heating cycle to confirm no recurrence.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE — lock out outdoor unit before accessing control board and sensor wiring.

### Source(s)
- Lennox XC21 Series LED fault codes, Table 9 — [manualslib.com/manual/922657/Lennox-Xc21-Series.html?page=36](https://www.manualslib.com/manual/922657/Lennox-Xc21-Series.html?page=36)
- Lennox Residential Communicating Systems Alert Code Guide — [lennox.com/dA/d89d9db1dd/100017c.pdf](https://www.lennox.com/dA/d89d9db1dd/100017c.pdf)

### Notes for Mike's tone / style
- Tech-facing: "iComfort fault history will timestamp the event. Check if it's been recurring over multiple days — a sensor that intermittently drifts is worse than one that fails hard."

---

## SCN-RES-008 — Rheem RPNE Heat Pump: Dual LED — Pressure Switch Lockout
**Equipment:** Rheem RPNE heat pump, R-410A (standard efficiency)
**Tech describes:** "Defrost board showing LED1 steady on, LED2 off. Compressor locked out. System was heating fine yesterday."

### Symptoms / readings
- Suction PSI: Not measured (locked out)
- Head PSI: Not measured
- Ambient OAT: 34°F
- Flash code: **LED1 On / LED2 Off = Pressure Switch Lockout** per Rheem RPNE diagnostic code chart
- System status: No compressor, no fan, no output
- Recent history: Unit ran fine previous day

### Correct diagnosis
Pressure switch lockout — either the low-pressure or high-pressure switch tripped three times in a short period, causing the defrost board to lock out the compressor. At 34°F ambient in heating mode, low-pressure trips are more common (low charge or severe ice on outdoor coil).

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm LED1 On / LED2 Off = pressure switch lockout per Rheem RPNE dual-LED diagnostic chart.
2. Inspect outdoor coil for heavy ice accumulation. At 34°F with humidity, defrost cycles can fall behind. A coil completely iced over will trip LPS in heating mode.
3. Reset lockout: cycle power at disconnect (5-minute anti-short-cycle timer). Do NOT use a short-cycle bypass without understanding why it tripped.
4. After reset, run unit in heating mode with gauges on. R-410A suction in heating mode at 34°F OAT should be approximately 70–90 psig (saturation temp ~10–20°F below OAT).
5. If suction pressure drops below 50 psig within 5 minutes, suspect low charge (leak) or severely restricted metering device.
6. Distinguish LED1 On/LED2 Flash (LPS open) from LED1 On/LED2 Off (lockout after repeated trips). The lockout state means the switch tripped at least three times.
7. If unit repeatedly trips LPS in heating mode at 34°F OAT: check for iced coil (defrost control failure), low charge, or TXV/orifice restriction.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Rheem RPNE diagnostic codes — [ghac.makekb.com/entry/677/](https://ghac.makekb.com/entry/677/)
- Rheem EcoNet and Flash Codes — [pdf4pro.com/amp/view/econet-and-flash-codes-myrheem-com-735958.html](https://pdf4pro.com/amp/view/econet-and-flash-codes-myrheem-com-735958.html)

### Notes for Mike's tone / style
- Tech-facing: "Lockout vs. trip — the lockout means it's already failed three times. That history matters. Don't just reset and leave."

---

## SCN-RES-009 — Rheem/Ruud EcoNet: Code T958_O — High Refrigerant Pressure Trip
**Equipment:** Rheem RP20 variable-speed inverter heat pump, R-410A, EcoNet communicating
**Tech describes:** "EcoNet showing T958_O in the Current Faults menu. Outdoor unit kicked off mid-cycle in cooling. Head pressure was 435 when I arrived."

### Symptoms / readings
- Suction PSI: 110 psig
- Head PSI: 435 psig (tripped off, residual)
- Superheat: 7°F
- Subcooling: 20°F (elevated)
- Ambient OAT: 98°F
- Indoor RAT / SAT: 77°F / 60°F
- Fault code: **T958_O = High refrigerant pressure — High pressure switch has opened** per Rheem EcoNet documentation
- EcoNet fault displayed at: EcoNet Control Center > Service > Current Faults

### Correct diagnosis
High-pressure switch trip from elevated subcooling (mild refrigerant overcharge) combined with high ambient operation. The high-pressure switch opened to protect the compressor from over-pressure.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm T958_O fault definition per Rheem EcoNet documentation.
2. Check outdoor coil for blockage first — eliminate the obvious before chasing charge.
3. With clean coil at 98°F OAT, target R-410A head pressure is approximately 350–380 psig. At 435 psig, and subcooling of 20°F (target 8–12°F), the system is overcharged.
4. Recover refrigerant in small increments (1–2 oz) until subcooling reaches 8–12°F range, then recheck head pressure.
5. If head pressure normalizes with correct subcooling, the previous tech overcharged the system.
6. Note: EcoNet also logs fault history with timestamps. Check fault history (Service > Fault History) for how often T958_O has appeared — intermittent faults that occur only at high ambient may not need charge adjustment.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Rheem EcoNet Fault T958_O — [pdf4pro.com/amp/view/econet-and-flash-codes-myrheem-com-735958.html](https://pdf4pro.com/amp/view/econet-and-flash-codes-myrheem-com-735958.html)

### Notes for Mike's tone / style
- Tech-facing: "EcoNet's fault history with timestamps is gold. Before touching the charge, pull the history and see if this only happens above 95°F OAT — that's a different diagnosis than a unit that trips at 80°F."

---

## SCN-RES-010 — York/Coleman Residential Heat Pump: dF Fault — Defrost Cycle Fault
**Equipment:** York YZF036 heat pump, R-410A
**Tech describes:** "Getting dF code on the thermostat display. Unit running in heating but outdoor coil is covered in ice. Been iced up for over an hour."

### Symptoms / readings
- Suction PSI: 55 psig (very low for heating mode at 35°F OAT — should be ~70–85 psig)
- Head PSI: 210 psig
- Superheat: 25°F (high — indicating possible low charge or airflow issue)
- Ambient OAT: 35°F
- Indoor RAT / SAT: 68°F / 72°F
- Fault code: **dF = Defrost Cycle Active or Fault** per York heat pump diagnostics
- Outdoor coil: Completely iced over, including fan blade area
- Defrost board: Thermostat sensing terminal shorted to 24V — no defrost initiation

### Correct diagnosis
Defrost control fault — the defrost thermostat (temperature sensor on outdoor coil) is failing to close at the setpoint to initiate defrost. Coil is well below freezing but defrost board never receives the initiation signal.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm dF code per York/Coleman heat pump diagnostics.
2. Force a manual defrost test: On most York defrost boards, jump the TEST terminals briefly (< 2 seconds) to initiate defrost. Observe: reversing valve should click to cooling mode, aux heat should energize, outdoor fan should stop.
3. If manual defrost test succeeds (unit enters defrost normally), the defrost thermostat (snap-disc on coil) is the likely failure. It is not closing to initiate defrost automatically.
4. Test defrost thermostat: Disconnect and use ohmmeter. At 35°F OAT and fully iced coil (coil temp near 0°F), the thermostat should be closed (continuity). If open, thermostat has failed open.
5. Measure voltage at defrost board initiation terminal — should see continuity to ground when defrost thermostat is closed. No continuity = failed thermostat or broken wire.
6. Check termination thermostat (typically opens at 65°F coil temperature to end defrost) — if shorted closed, defrost would run too long, not prevent it.
7. If defrost board itself is at fault: board should initiate defrost every 30/60/90 minutes of compressor run time. Check board jumper settings.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- York heat pump error codes and dF fault — [pickcomfort.com/york-heat-pump-error-codes-troubleshooting](https://www.pickcomfort.com/york-heat-pump-error-codes-troubleshooting/)
- Heat pump defrost troubleshooting — [hvacrschool.com/heat-pump-defrost-troubleshooting-tips](http://www.hvacrschool.com/heat-pump-defrost-troubleshooting-tips/)

### Notes for Mike's tone / style
- Tech-facing: "Always do the manual defrost jump test first. It tells you in 30 seconds whether the board works at all."
- Homeowner-facing: "The defrost system that prevents ice build-up isn't triggering correctly. It's a sensor or control board issue — not a refrigerant problem."

---

## SCN-RES-011 — Bard Single-Zone Heat Pump CH4S1: Code 2 — High Pressure Soft Lockout
**Equipment:** Bard CH4S1 single-zone heat pump (wall-mount), R-410A
**Tech describes:** "Bard wall unit showing Code 2 blink on the solid-state control LED. Compressor off. Fan still running."

### Symptoms / readings
- Suction PSI: 115 psig
- Head PSI: 405 psig
- Subcooling: 15°F
- Ambient OAT: 90°F
- Flash code: **Code 2 = High pressure switch failure / 'Soft' Lockout** per Bard CH4S1 Installation Instructions Manual, Troubleshooting Table 4
- Outdoor fan: running
- Compressor: off on lockout

### Correct diagnosis
High-pressure soft lockout — the high-pressure switch tripped and the Bard solid-state control went into soft lockout (can be reset without power cycling). Primary cause: dirty condenser coil or mild overcharge.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm Code 2 = High pressure soft lockout per Bard CH4S1 manual (ManualsLib manual 452517, page 21). A soft lockout means the control will attempt restart automatically after a time delay.
2. Distinguish from Code 4 = High pressure HARD lockout — hard lockout requires power cycle to clear.
3. Inspect condenser coil on this wall-mount unit — Bard units are often installed in confined equipment rooms. Check for restricted return air to the unit.
4. Measure head pressure: At 90°F OAT, R-410A should be ~310–340 psig. At 405 psig with subcooling 15°F, suspect mild restriction or slight overcharge.
5. Clean condenser section. Check that the unit has at least 6" clearance on intake side per Bard installation specs.
6. If head pressure normalizes after cleaning: no charge adjustment needed.
7. If head pressure remains elevated: recover to achieve 8–12°F subcooling.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Bard CH4S1 LED blink codes — [manualslib.com/manual/452517/Bard-Ch4s1.html?page=21](https://www.manualslib.com/manual/452517/Bard-Ch4s1.html?page=21)

### Notes for Mike's tone / style
- Tech-facing: "Soft vs hard lockout is important on Bard — Code 2 can reset itself. If you get there and it's already running again, pull the fault history on the board if available."

---

## SCN-RES-012 — Mitsubishi MXZ/MSZ Ductless: E6 — Communication Fault Indoor/Outdoor
**Equipment:** Mitsubishi MSZ-GL12NA / MXZ-2C20NAHZ2 ductless heat pump, R-410A
**Tech describes:** "E6 flashing on the remote display. Indoor unit LED blinking. Outdoor unit powered up but not running."

### Symptoms / readings
- Suction PSI: Not measurable (no compressor operation)
- Head PSI: Not measurable
- Ambient OAT: 65°F
- Flash code: **E6 = Communication fault between indoor and outdoor units** per Mitsubishi Electric error code documentation
- Remote display: E6 showing in error window
- 240VAC power to outdoor unit: confirmed
- Communication wire (A-B terminals): to be verified

### Correct diagnosis
Communication loss between indoor and outdoor PCBs. Most commonly caused by loose or reversed A-B communication wire connections, a failed indoor PCB, or a failed outdoor PCB.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm E6 = indoor/outdoor communication fault per Mitsubishi Electric error code documentation.
2. Check the A-B communication wiring at both the indoor unit terminal board and the outdoor unit terminal board. Polarity matters — A and B must match on both ends.
3. Inspect wire for damage along the lineset run (staple through wire is common).
4. Measure DC voltage on the communication line: With outdoor unit powered, should see approximately 12–24VDC between A and B terminals.
5. Try power cycling the entire system — outdoor unit power off for 5 minutes, then restore. E6 clears if the fault was a momentary dropout.
6. If E6 persists after power cycle and wiring checks out: test indoor PCB. On multi-zone MXZ systems, if only one indoor head shows E6, the indoor PCB on that head is suspect.
7. If all indoor heads show E6 simultaneously, outdoor PCB is more likely the fault.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Mitsubishi mini split error codes E6 — [choosesanford.com/common-error-codes-for-mitsubishi-heat-pumps](https://choosesanford.com/common-error-codes-for-mitsubishi-heat-pumps/)
- Mitsubishi error code overview — [highground.com/articles/mitsubishi-ductless-mini-split-error-codes](https://www.highground.com/articles/mitsubishi-ductless-mini-split-error-codes)

### Notes for Mike's tone / style
- Tech-facing: "Check the communication wire polarity first — it's the most common cause of E6 and it takes 30 seconds."
- Multi-zone tip: "Isolate which heads are showing E6. All heads = outdoor PCB. One head = indoor PCB on that zone."

---

## SCN-RES-013 — Mitsubishi Hyper-Heat MXZ: P8 — High Pressure / Overload Protection
**Equipment:** Mitsubishi MXZ-3C30NAHZ2 Hyper-Heat multi-zone, R-410A
**Tech describes:** "P8 error on all indoor units. This system is only two years old. Running in cooling, tripped in afternoon heat."

### Symptoms / readings
- Suction PSI: 130 psig
- Head PSI: 418 psig
- Superheat: 6°F
- Subcooling: 22°F
- Ambient OAT: 97°F
- Flash code: **P8 = High pressure overload protection** per Mitsubishi error code reference
- Outdoor coil: visibly loaded with grass clippings, lawn was mowed this morning

### Correct diagnosis
P8 high-pressure protection triggered by restricted condenser coil airflow from fresh grass clippings. Elevated subcooling confirms refrigerant is stacking in the condenser from reduced heat rejection.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm P8 = high pressure or overload protection per Mitsubishi Electric error documentation.
2. Walk the outdoor unit — lawn debris on the coil face immediately after mowing is a classic same-day service call.
3. Rinse the condenser coil with a garden hose. On Mitsubishi units, the coil wraps around three sides — clean all accessible surfaces.
4. After cleaning, power cycle (wait 3 minutes for anti-short-cycle timer) and restart.
5. Recheck head pressure and subcooling after 15 minutes of operation at the same ambient. Head pressure should drop to 340–370 psig range at 97°F OAT with clean coil.
6. If P8 recurs after cleaning, check the subcooling: at 22°F (target 8–12°F for TXV system), consider mild overcharge as secondary cause.
7. Verify that condenser fan speeds are correct — P8 can also indicate outdoor fan motor sluggishness on aging units.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Mitsubishi P8 error code — [choosesanford.com/mitsubishi-ductless-mini-split-p8-error-code](https://choosesanford.com/mitsubishi-ductless-mini-split-p8-error-code)
- Mitsubishi heat pump error codes — [choosesanford.com/common-error-codes-for-mitsubishi-heat-pumps](https://choosesanford.com/common-error-codes-for-mitsubishi-heat-pumps/)

---

## SCN-RES-014 — Mitsubishi Ductless: P6 — Compressor Lockout (Refrigerant Circuit)
**Equipment:** Mitsubishi MSZ-FH18NA / MUZ-FH18NA single-zone heat pump, R-410A
**Tech describes:** "P6 showing on remote. No cooling. System is 6 years old, had a previous tech add refrigerant last year."

### Symptoms / readings
- Suction PSI: 38 psig (severely low)
- Head PSI: 225 psig (low for cooling at 90°F OAT)
- Superheat: 35°F (very high — coil is starved)
- Subcooling: Not measurable (not enough liquid to measure)
- Ambient OAT: 90°F
- Flash code: **P6 = Protection for Compressor Lock / Compressor protection active** per Mitsubishi error code documentation
- Last service: refrigerant added 11 months ago

### Correct diagnosis
Active refrigerant leak — system is severely undercharged. The P6 protection engaged because low suction pressure indicates the compressor is operating without adequate refrigerant mass flow. The previous refrigerant addition without finding the leak is a compliance red flag.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm P6 = compressor protection / compressor lock protection per Mitsubishi error documentation.
2. Suction at 38 psig is critically low for R-410A cooling — saturation temperature at 38 psig is approximately -10°F, meaning the coil is starving for refrigerant.
3. Do NOT run the compressor under these conditions — risk of overheating the compressor motor from inadequate refrigerant cooling.
4. Perform a thorough leak search. Priority locations on Mitsubishi ductless: lineset flare connections at both indoor and outdoor units, service valve stems, and indoor unit coil.
5. Flare connections are the #1 leak point on ductless systems — check with an electronic leak detector, particularly at the indoor flare fittings (often behind the indoor unit cover).
6. Repair the leak, pressure-test with nitrogen (400 psig hold for 30 minutes on R-410A systems), evacuate to 300 microns, and recharge to factory weight per nameplate.
7. Note: Adding refrigerant to a known-leaking system without repair is an EPA Section 608 violation if the system contains more than the EPA reporting threshold amount.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- EPA 608 compliance: Document leak location and repair before adding refrigerant.

### Source(s)
- Mitsubishi P6 error code — [highground.com/articles/mitsubishi-ductless-mini-split-error-codes](https://www.highground.com/articles/mitsubishi-ductless-mini-split-error-codes)
- EPA Section 608 leak repair requirements — [epa.gov/snap/substitutes-residential-and-light-commercial-air-conditioning-and-heat-pumps](https://www.epa.gov/snap/substitutes-residential-and-light-commercial-air-conditioning-and-heat-pumps)

### Notes for Mike's tone / style
- Tech-facing: "P6 with those pressures — the compressor protection is doing its job. Don't bypass it to 'see what the pressures do.' It's already telling you."
- The previous tech's refusal to find the leak is a liability for the contractor. Document everything.

---

## SCN-RES-015 — LG Ductless: CH05 — Indoor/Outdoor Communication Error
**Equipment:** LG LSU/LSN18HVXV ductless heat pump, R-410A
**Tech describes:** "CH05 blinking on the indoor unit. Outdoor unit is powered but not running. Wire connections look fine from the street."

### Symptoms / readings
- Suction PSI: Not measurable
- Head PSI: Not measurable
- Ambient OAT: 72°F
- Flash code: **CH05 = Indoor/Outdoor communication error** per LG error code documentation (HVAC Toolkit LG reference)
- 3-wire communication connection: L1, L2, S (signal) from outdoor to indoor
- 240VAC power to outdoor unit: confirmed
- Visual wire inspection: "looks fine from street" — NOT verified at terminals

### Correct diagnosis
Communication failure between indoor and outdoor units. CH05 is the most frequently reported LG ductless error. Primary cause is loose or incorrect wiring at the S (signal) terminal at either the indoor or outdoor unit.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm CH05 = Indoor/Outdoor communication error per LG HVAC Toolkit error code reference.
2. "Looks fine from the street" is not a wire check — get on a ladder and physically tug each terminal at both the outdoor unit AND the indoor unit terminal board.
3. Check polarity and terminal assignment: LG units use L1, L2 (power), and S (signal). The S wire must connect S-to-S on both ends. Some installations use the wrong terminal color.
4. Check for physical wire damage along the lineset run — staple through the wire during install is extremely common.
5. Power cycle the outdoor unit (main breaker off for 5 minutes, restore). CH05 can be caused by a momentary signal dropout during a voltage fluctuation.
6. If CH05 persists after confirming all wiring: measure 12–24VDC on the S terminal while outdoor unit is powered. No voltage = outdoor PCB not generating signal.
7. Isolate: disconnect indoor unit from communication wiring. If outdoor unit still shows CH05, outdoor PCB is faulty. If fault clears when indoor is disconnected, indoor PCB is suspect.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- LG CH05 error code — [hvactoolkit.org/resources/error-codes/lg](https://hvactoolkit.org/resources/error-codes/lg)
- LG mini split error codes — [machinelounge.com/lg-mini-split-error-codes](https://machinelounge.com/lg-mini-split-error-codes/)

---

## SCN-RES-016 — LG Ductless: CH32 — Outdoor High Pressure Protection
**Equipment:** LG LMU/LMN24CHV multi-zone ductless, R-410A
**Tech describes:** "CH32 showing on all three indoor heads. Outdoor unit shutdown. This is a new install from 3 weeks ago."

### Symptoms / readings
- Suction PSI: 125 psig
- Head PSI: 445 psig (very high)
- Superheat: 5°F
- Subcooling: 28°F (significantly elevated)
- Ambient OAT: 88°F
- Flash code: **CH32 = Outdoor unit high pressure protection** per LG error code documentation
- Install date: 3 weeks ago; refrigerant added at install

### Correct diagnosis
Refrigerant overcharge from installation. Subcooling at 28°F (target 8–12°F) and head pressure 445 psig at 88°F OAT are classic overcharge signatures. The new install is the most likely source.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm CH32 = outdoor high pressure protection per LG HVAC Toolkit error code documentation.
2. With subcooling at 28°F on a TXV system at 88°F OAT, overcharge is almost certain. This is not a coil cleanliness issue on a 3-week-old unit.
3. Recover refrigerant. On LG multi-zone ductless, the system is factory-charged for a specific lineset length. Check the installation manual for the pre-charge amount and any additional charge required for the actual lineset run.
4. Recover in small increments (4 oz at a time) until subcooling reaches 8–12°F. Verify head pressure drops to 330–360 psig range at 88°F OAT.
5. Document the total amount recovered — that is the amount the installer overcharged.
6. After correct charge: run system through all zones, verify each zone achieves target superheat/subcooling.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- LG CH32 error code — [hvactoolkit.org/resources/error-codes/lg](https://hvactoolkit.org/resources/error-codes/lg)

---

## SCN-RES-017 — Samsung Ductless: E601 — Communication Fault (Outdoor PCB to Control Board)
**Equipment:** Samsung AR18TXHQASINUA ductless mini-split heat pump, R-410A
**Tech describes:** "E601 on the remote display. Indoor unit won't run. Outdoor unit is powered but silent."

### Symptoms / readings
- Suction PSI: Not measurable
- Head PSI: Not measurable
- Ambient OAT: 78°F
- Flash code: **E601 = Communication fault — outdoor unit compressor driver PCB to H/P control board** per Samsung error code reference
- Power to outdoor unit: 240VAC confirmed
- Communication wiring: 3-wire between indoor and outdoor

### Correct diagnosis
E601 is an internal outdoor unit communication fault between the inverter drive PCB and the outdoor main control board, not just a wiring issue between indoor and outdoor. This is typically a PCB-level failure in the outdoor unit.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm E601 = compressor driver PCB to H/P control board communication fault per Samsung error code documentation. Distinguish from E101 (indoor-to-outdoor communication) — E601 is internal to the outdoor unit.
2. Power cycle the outdoor unit completely. Some E601 faults are caused by a momentary power event affecting the inverter PCB.
3. Inspect the ribbon cable or harness between the inverter drive board and main outdoor PCB. These connectors can vibrate loose over time.
4. Check for water intrusion in the outdoor control box — Samsung outdoor units in humid climates sometimes get moisture in the PCB enclosure.
5. If the fault persists after power cycle and harness inspection: the inverter PCB or main outdoor PCB requires replacement. Most techs replace the inverter PCB first as it is more failure-prone.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- Inverter PCB stores DC bus voltage — wait 5 minutes after power removal, verify <50VDC on DC bus before touching.

### Source(s)
- Samsung E601 error code — [choosesanford.com/samsung-ductless-mini-split-error-code-e601](https://choosesanford.com/samsung-ductless-mini-split-error-code-e601)
- Samsung error code categories — [hvactoolkit.org/resources/error-codes/samsung](https://hvactoolkit.org/resources/error-codes/samsung)

---

## SCN-RES-018 — Daikin FTX/FTXS: U0 — Low Refrigerant Pressure (Leak)
**Equipment:** Daikin FTXS24LVJU / RXS24LVJU residential mini-split, R-410A
**Tech describes:** "U0 error. System cooling barely. Remote shows error. This unit is 4 years old, no previous service."

### Symptoms / readings
- Suction PSI: 42 psig (critically low)
- Head PSI: 190 psig (low)
- Superheat: 40°F (extremely high — coil starving)
- Subcooling: Not measurable
- Ambient OAT: 85°F
- Flash code: **U0 = Low refrigerant pressure / refrigerant leak** per Daikin mini-split error code guide
- Indoor unit: blowing warm air

### Correct diagnosis
U0 is Daikin's primary refrigerant-low fault. At 4 years old with no prior service, and suction at 42 psig with 40°F superheat, this is a refrigerant leak — most likely at the indoor or outdoor flare connections.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm U0 = low refrigerant pressure per Daikin error code documentation (minisplitsizer.com/daikin-mini-split-error-codes).
2. With 40°F superheat and 42 psig suction on R-410A, the system has lost a significant charge. Do NOT attempt to run the compressor — it is running without adequate lubrication and refrigerant cooling.
3. Shut system down via remote (or outdoor disconnect).
4. Leak search priority order on Daikin FTXS ductless: (1) indoor flare fittings behind the indoor unit — remove the front cover and access panel; (2) outdoor unit service valves and flare fittings; (3) lineset run if any bends or fittings mid-run.
5. Use an electronic refrigerant leak detector capable of detecting R-410A. Ultrasonic detectors also work at active leaks.
6. After locating and repairing the leak: nitrogen pressure test (400 psig for R-410A equipment, hold 30 minutes), then evacuate to 300 microns, hold 5 minutes vacuum decay test.
7. Charge by weight per Daikin factory charge for the specific model + any lineset adjustment per the installation manual.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- EPA 608: Repair before recharge. Verify all refrigerant is recovered before opening the refrigerant circuit.

### Source(s)
- Daikin U0 error code — [minisplitsizer.com/daikin-mini-split-error-codes](https://minisplitsizer.com/daikin-mini-split-error-codes/)
- Common refrigerant leak locations — [acservicetech.com/post/where-to-find-r-22-r410a-leaks-on-ac-units-top-10-spots](https://www.acservicetech.com/post/where-to-find-r-22-r410a-leaks-on-ac-units-top-10-spots)

---

## SCN-RES-019 — Daikin FTXS: F3 — High Discharge Temperature (Dirty Coil + Low Charge)
**Equipment:** Daikin FTXS18LVJU / RXS18LVJU mini-split, R-410A
**Tech describes:** "F3 error. Unit running in cooling but not keeping up. Discharge temp is through the roof."

### Symptoms / readings
- Suction PSI: 68 psig (low for cooling at 88°F OAT — normal ~115 psig)
- Head PSI: 310 psig
- Discharge line temp: 215°F (normal max ~225°F — approaching limit)
- Superheat: 22°F (elevated)
- Subcooling: 5°F (low — borderline undercharged)
- Ambient OAT: 88°F
- Flash code: **F3 = High discharge temperature / Low refrigerant or dirty outdoor coil** per Daikin error code guide

### Correct diagnosis
F3 on Daikin indicates the compressor discharge temperature is approaching the protection threshold. Combined low suction pressure, elevated superheat, and low subcooling points to a mildly undercharged system — possibly a slow leak — compounded by a partially dirty condenser coil.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm F3 = high discharge temperature per Daikin error code documentation.
2. Inspect and clean the outdoor condenser coil. Even a 20% blocked coil at 88°F OAT will push discharge temperature up.
3. After cleaning, recheck pressures. If suction pressure comes up to 110+ psig and superheat drops to 8–12°F, the dirty coil was the primary driver.
4. If after cleaning, suction remains below 90 psig and superheat above 15°F, proceed to check for refrigerant loss. The 5°F subcooling suggests mild undercharge.
5. Leak check per priority locations for Daikin FTXS series. With F3 as the primary code (not U0), the leak is likely slow. Look especially at flare connections.
6. If a small leak is confirmed and repaired, recover remaining charge, reweigh, and recharge to factory spec.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Daikin F3 error code — [minisplitsizer.com/daikin-mini-split-error-codes](https://minisplitsizer.com/daikin-mini-split-error-codes/)

---

## SCN-RES-020 — Fujitsu Halcyon: 5-Blink Red LED — Indoor Fan Motor Problem
**Equipment:** Fujitsu ASU18RLF / AOU18RLXFZ ductless heat pump, R-410A
**Tech describes:** "Red LED on the indoor unit blinking 5 times. Indoor fan not running. Outdoor unit starts then shuts off after a few seconds."

### Symptoms / readings
- Suction PSI: Not measurable (trips off before stabilizing)
- Head PSI: Not measurable
- Ambient OAT: 82°F
- Flash code: **5 red blinks = Indoor fan motor problem** per Fujitsu Halcyon flashing light code documentation
- Indoor unit: no airflow, fan not spinning
- Outdoor unit: starts, then shuts down within 10–15 seconds (no airflow across indoor coil = protection trip)

### Correct diagnosis
Indoor BLDC (brushless DC) fan motor failure. The motor is receiving a run command but not running (or not running at speed), triggering the protection code. Outdoor unit shuts down to protect the indoor coil from icing or overheating.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm 5-blink red LED = indoor fan motor fault per Fujitsu Halcyon flashing light codes.
2. Remove the indoor unit front cover. Check for any physical obstruction on the fan wheel or scroll — debris lodged in the wheel is common and quick to fix.
3. Check the fan wheel rotation by hand with power OFF. If it does not spin freely, the motor bearings are seized.
4. With power ON: measure 12–24VDC from the fan motor control signal wire at the motor connector. If signal is present and motor does not run, the motor itself has failed.
5. Fujitsu Halcyon indoor fan motors (BLDC type) are typically non-serviceable components — full motor replacement is the repair.
6. On the AOU18RLXFZ outdoor unit, verify no additional fault codes were stored. Outdoor unit secondary faults may appear if indoor unit repeatedly fails to provide airflow.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE — de-energize before accessing indoor fan compartment.

### Source(s)
- Fujitsu Halcyon 5-blink red LED — [smartacsolutions.com/fujitsu-halcyon-flashing-light-codes](https://smartacsolutions.com/fujitsu-halcyon-flashing-light-codes/)
- Fujitsu troubleshooting guide — [fujitsugeneral.com/us/support/faq/halcyon/troubleshooting.html](https://www.fujitsugeneral.com/us/support/faq/halcyon/troubleshooting.html)

---

## SCN-RES-021 — Bosch IDS Ultra Cold-Climate: R-454B A2L Refrigerant Leak Service Call
**Equipment:** Bosch IDS Ultra 3-ton cold-climate heat pump, R-454B (A2L refrigerant)
**Tech describes:** "Homeowner says unit stopped heating. Pressures look low. Opened the outdoor cabinet and got a leak detector alarm. System is less than a year old."

### Symptoms / readings
- Suction PSI: 55 psig (low for R-454B heating mode at 25°F OAT)
- Head PSI: Not building (compressor locked out)
- Superheat: Not stable
- Ambient OAT: 25°F
- Flash code: Low pressure lockout condition (Bosch IDS Ultra)
- A2L refrigerant leak detector: alarmed upon opening outdoor cabinet
- System age: 10 months

### Correct diagnosis
Active R-454B refrigerant leak — this is a **safety-critical A2L event**. R-454B is mildly flammable (ASHRAE A2L classification). The leak triggered the tech's A2L-rated detector. Specialized handling procedures required.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. STOP — do not operate the system or use any tools that produce sparks or arcs near the leak.
2. Confirm all ignition sources are eliminated from the work area (no open flames, no sparking power tools, no cell phones near the refrigerant concentration).
3. Ensure adequate ventilation at the outdoor cabinet location. If the leak is indoors (line penetrations, indoor unit), evacuate the space and ventilate before proceeding.
4. Recover all remaining R-454B refrigerant using an A2L-rated recovery machine (UL60335-2-91 certified). Standard R-410A recovery machines are NOT rated for A2L refrigerants — using them is a fire/explosion risk.
5. Locate the leak using an A2L-compatible infrared (IR) or electrochemical sensor detector. Heated diode detectors are NOT approved for A2L refrigerants per HVAC Toolkit A2L Safety Guide.
6. After repair: double-purge protocol — purge with nitrogen, evacuate, purge again for 5 minutes, evacuate again to ≤300 microns before opening any connections for brazing.
7. Recharge with R-454B using dedicated A2L-rated recovery cylinders (red stripe, left-hand threads). Fill to no more than 80% of tank capacity.
8. R-454B tanks: do NOT mix with R-410A tanks, equipment, or recovery cylinders.

### Safety flags
- A2L_REFRIGERANT
- ELECTRICAL_HIGH_VOLTAGE
- **REQUIRED PROTOCOL:** Eliminate all ignition sources before opening refrigerant circuit. Use A2L-rated recovery machine only. Use A2L-compatible leak detector only. Double-purge before brazing. ASHRAE 15 and IBC require refrigerant leak detection with automatic mitigation in occupied spaces for A2L systems.

### Source(s)
- A2L Refrigerant Safety Guide — [hvactoolkit.org/resources/a2l-safety](https://hvactoolkit.org/resources/a2l-safety)
- Bosch IDS Ultra R-454B — [bosch-homecomfort.com/us/en/residential/knowledge/a2l-refrigerant-change-guide](https://www.bosch-homecomfort.com/us/en/residential/knowledge/a2l-refrigerant-change-guide/)
- R-454B handling requirements — [cedarshvac.com/r454b-refrigerant-guide](https://cedarshvac.com/r454b-refrigerant-guide/)
- ASHRAE 15 A2L leak detection requirement — [servicemag.org/guides/refrigerant-handling-epa-608-compliance](https://www.servicemag.org/guides/refrigerant-handling-epa-608-compliance)

### Notes for Mike's tone / style
- Tech-facing: "A2L leak is not the same as an R-410A leak. The rules are different. Non-A2L-rated equipment is not optional — it's a safety issue."
- This is a manufacturer warranty scenario — 10-month-old unit with a refrigerant leak should be escalated to Bosch warranty service immediately.

---

## SCN-RES-022 — Bosch IDS Ultra: Cold-Climate Operation at -13°F — Capacity Loss vs Fault
**Equipment:** Bosch IDS Ultra 4-ton cold-climate heat pump, R-454B
**Tech describes:** "Homeowner says the heat pump is barely heating at -5°F OAT. Aux heat kicked in. Is it broken or is this normal?"

### Symptoms / readings
- Suction PSI: Low-normal for -5°F OAT heating (R-454B)
- Head PSI: Elevated (normal for cold ambient heating)
- Ambient OAT: -5°F
- Indoor RAT / SAT: 66°F / 68°F (barely above setpoint)
- Aux heat: on (electric strips, 10 kW)
- System behavior: compressor running at high speed, EVI active
- No fault codes present

### Correct diagnosis
Normal cold-climate heat pump capacity reduction — not a fault. The Bosch IDS Ultra delivers 100% heating capacity down to 5°F OAT and continues operating down to -13°F. At -5°F, the system is below its 100% capacity point and auxiliary heat staging is working as designed.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. No fault codes present — this is a "no-fault service call." The homeowner's concern is performance, not a malfunction.
2. Confirm the Bosch IDS Ultra spec: "delivers up to 100% heating capacity down to 5°F at 2.1 COP, continues heating down to -13°F" per Bosch product documentation.
3. At -5°F OAT, the system is operating below its rated capacity threshold. Auxiliary heat staging is normal behavior.
4. Verify aux heat is functioning correctly: electric strips should energize in sequence when heat pump alone cannot maintain setpoint.
5. Check Enhanced Vapor Injection (EVI) system is active — listen for the EVI valve operation. EVI is what allows the Bosch IDS Ultra to heat below 0°F. If EVI valve is stuck, capacity will be further reduced.
6. Verify the system was sized correctly per ACCA Manual J — a heat pump designed for a 65°F design day will struggle at -5°F regardless of brand.
7. If indoor temperature is maintaining setpoint (even slowly) with aux heat active: the system is working as designed. Document and educate the homeowner.

### Safety flags
- NONE

### Source(s)
- Bosch IDS Ultra cold-climate specs — [bosch-homecomfort.com/us/en/ocs/residential/ids-ultra-inverter-ducted-split-cold-climate-heat-pump-20831889-p](https://www.bosch-homecomfort.com/us/en/ocs/residential/ids-ultra-inverter-ducted-split-cold-climate-heat-pump-20831889-p/)
- Cold-climate heat pump performance — [acdirect.com/blog/r410a-heat-pump-buying-guide](https://www.acdirect.com/blog/r410a-heat-pump-buying-guide/)

### Notes for Mike's tone / style
- Tech-facing: "Educate the homeowner call — capacity reduction at deep cold is spec, not a failure. Your job is to confirm aux heat is staged correctly."
- Never recommend replacement to a homeowner for a system operating within design parameters.

---

## SCN-RES-023 — Carrier/Bryant/Payne: TXV Restricted — High Superheat, Low Suction
**Equipment:** Bryant 186BNA036 heat pump / FV4 air handler, R-410A (TXV metering)
**Tech describes:** "Not cooling well. Suction is low, superheat is through the roof. Just recharged this unit 6 months ago."

### Symptoms / readings
- Suction PSI: 78 psig (low for cooling at 85°F OAT — normal ~120 psig)
- Head PSI: 295 psig (below normal — low suction means less mass flow)
- Superheat (suction line): 28°F (very high — target 8–12°F for TXV)
- Subcooling (liquid line): 3°F (very low)
- Ambient OAT: 85°F
- Indoor RAT / SAT: 74°F / 62°F (barely cooling despite running)
- No fault codes (conventional system)

### Correct diagnosis
Restricted TXV — the thermostatic expansion valve is not opening enough to allow adequate refrigerant flow. This produces the classic pattern: low suction, high superheat, low subcooling. A known Carrier service bulletin exists for certain FV4 indoor coils where TXV contamination from the condenser unit caused premature TXV restriction.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Pressure and superheat pattern is a textbook restricted TXV: low suction + high superheat + low subcooling.
2. Distinguish from low charge: Low charge would also show high superheat but subcooling should still be readable (low but not near zero). At 3°F subcooling with visible charge in the sight glass, TXV restriction is more likely than low charge.
3. Warm the TXV sensing bulb with your hand for 30–60 seconds. If TXV is functional, suction pressure should rise 10–15 psig and superheat should drop. If no response, TXV is failed.
4. Check TXV sensing bulb clamp is secure against the suction line and insulated properly — a loose bulb reads ambient instead of suction line temperature, causing TXV to close down.
5. If bulb is properly clamped and TXV is unresponsive: replace the TXV.
6. Reference Carrier service bulletin: For Bryant/Carrier/Payne 1.5–2.5 ton indoor coils with certain condensing units, an unauthorized change to a rust inhibitor in the condensing unit caused TXV contamination. Replace TXV and install the updated filter assembly.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Carrier/Bryant/Payne TXV service bulletin — [justanswer.com/hvac/nmi31-just-getting-around-working-heat-pump](https://www.justanswer.com/hvac/nmi31-just-getting-around-working-heat-pump.html)
- TXV diagnosis pressure patterns — [hvactoolkit.org/resources/txv-troubleshooting](https://hvactoolkit.org/resources/txv-troubleshooting)
- TXV failure diagnosis — [hvacrschool.com/how-to-diagnose-a-txv-failure](http://www.hvacrschool.com/how-to-diagnose-a-txv-failure/)

---

## SCN-RES-024 — Lennox/Allied Air: Run Capacitor Failure — Condenser Fan Not Running
**Equipment:** Lennox XP21 heat pump, R-410A
**Tech describes:** "Outdoor unit compressor running but condenser fan not spinning. Head pressure is climbing fast."

### Symptoms / readings
- Suction PSI: 108 psig (slightly below normal, rising)
- Head PSI: 385 psig and climbing (heat building due to no condenser fan)
- Superheat: 9°F
- Ambient OAT: 88°F
- Condenser fan: not rotating
- Run capacitor (dual, 35+5 µF): measured 1.2 µF on the 5 µF section (should be 4.5–5.5 µF)

### Correct diagnosis
Failed run capacitor — the 5 µF section of the dual run capacitor that serves the condenser fan motor has failed (open or out of spec by more than 10%). Fan motor hums or draws locked rotor amps trying to start.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Shut down the system immediately — running the compressor with no condenser fan will rapidly spike head pressure and trip HPS or damage the compressor.
2. After shutdown: discharge the capacitor with an insulated resistor (10,000Ω, 10W) before touching terminals. Capacitors can hold lethal charge even after power is removed.
3. Measure capacitor with a meter set to capacitance mode: 35 µF section (compressor) should be 31.5–38.5 µF; 5 µF section (fan) should be 4.5–5.5 µF. Per HVAC industry standard, more than 10% deviation = failed.
4. At 1.2 µF on the 5 µF section, the fan capacitor is completely failed.
5. Replace the dual run capacitor with an exact rated match (35+5 µF, 440VAC minimum). Uprate to 440VAC if the original was 370VAC — Lennox recommends 440VAC replacement for longevity.
6. After replacement: verify fan starts normally and spins in the correct direction (air must blow up through the top of the unit).
7. Recheck head pressure after 10 minutes of operation — should normalize to 310–350 psig range at 88°F OAT.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- **REQUIRED:** Discharge capacitor before touching terminals. A failed capacitor can still hold charge sufficient to cause cardiac arrest.

### Source(s)
- Run capacitor diagnosis and 10% tolerance rule — [technicalhotandcoldparts.com/hvac-repair-blog/how-to-diagnose-test-and-replace-a-bad-ac-capacitor](https://www.technicalhotandcoldparts.com/hvac-repair-blog/how-to-diagnose-test-and-replace-a-bad-ac-capacitor/)
- Trane capacitor guide (general heat pump capacitor reference) — [trane.com/residential/en/resources/troubleshooting/heat-pumps/heat-pump-capacitor](https://www.trane.com/residential/en/resources/troubleshooting/heat-pumps/heat-pump-capacitor/)

### Notes for Mike's tone / style
- Tech-facing: "Head pressure climbing with no fan — shut it down first. You're not diagnosing anything if you pop the HPS."
- Homeowner-facing: "The fan motor capacitor failed — it's a wear-and-tear part, like a battery for the fan motor start-up."

---

## SCN-RES-025 — Goodman/Amana: Compressor Capacitor Failure — Compressor Hums, Won't Start
**Equipment:** Goodman GSXC16 split system, R-410A
**Tech describes:** "Compressor humming but not starting. Fan running. Outdoor unit just installed last year."

### Symptoms / readings
- Suction PSI: Equalizing (pressures equalized because compressor never started)
- Head PSI: Same as suction (equalized overnight)
- Compressor: audible hum, ~2–3 seconds, then internal overload clicks off
- Ambient OAT: 78°F
- Run capacitor (dual, 50+5 µF): measured 22 µF on 50 µF section
- Start capacitor: not installed (single-phase PSC compressor)

### Correct diagnosis
Failed run capacitor on the compressor winding. The 50 µF section measured at 22 µF (56% of rated — well outside 10% tolerance). Without adequate capacitance, the compressor cannot develop starting torque and pulls locked rotor amps, causing the internal thermal overload to trip.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm the compressor hum pattern: hum for 2–3 seconds then click off = internal thermal overload tripping on locked rotor amps. This pattern is diagnostic for capacitor failure.
2. Wait 5–10 minutes for the internal overload to reset (thermal overload, not a manual reset).
3. Discharge the run capacitor before measuring — use an insulated resistor.
4. Measure both sections: 50 µF compressor section = 22 µF (failed). 5 µF fan section = check also.
5. Replace dual run capacitor with exact rated match. On Goodman GSXC16, the factory capacitor is typically 50+5 µF, 440VAC.
6. After replacement: confirm compressor starts cleanly on the first attempt (no hum, no delay). Measure amp draw — should match or be below nameplate RLA within 30 seconds.
7. If compressor still hums after new capacitor: install a hard-start kit (start capacitor + potential relay) and retry. If it still won't start, suspect the compressor itself (locked rotor, internal mechanical failure).

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- **REQUIRED:** Discharge capacitor before measuring. Compressor terminals are energized — do not touch compressor terminal block until power is confirmed off.

### Source(s)
- Capacitor failure symptoms and testing — [technicalhotandcoldparts.com/hvac-repair-blog/how-to-diagnose-test-and-replace-a-bad-ac-capacitor](https://www.technicalhotandcoldparts.com/hvac-repair-blog/how-to-diagnose-test-and-replace-a-bad-ac-capacitor/)
- Start capacitor and locked rotor explanation — [acservicetech.com/post/why-a-start-capacitor-fails-and-testing](https://www.acservicetech.com/post/why-a-start-capacitor-fails-and-testing)


---

## SCN-RES-026 — Trane/American Standard: Compressor Locked Rotor After Long Shutdown
**Equipment:** American Standard Silver 13 (4A6H3) split system, R-410A
**Tech describes:** "Homeowner turned it on for first time this season. Compressor hums 3 seconds, trips breaker. Capacitor checks out good."

### Symptoms / readings
- Suction PSI: Equalized (~175 psig — refrigerant migrated to compressor over winter)
- Head PSI: Same as suction
- Compressor: hum, breaker trips within 3 seconds
- Run capacitor: 45+5 µF, tests 44.1/4.8 µF (within tolerance)
- Contactor: pulls in normally, 24VAC coil
- Ambient OAT: 72°F (first spring startup)
- Crankcase heater: not installed on this model

### Correct diagnosis
Refrigerant migration into the compressor crankcase during winter shutdown — "liquid slugging" on startup. Without a crankcase heater, refrigerant migrates to the coldest point (compressor sump) over months of non-operation. Compressor tries to compress liquid on startup, causing locked-rotor condition.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Capacitor is good — eliminate that as cause. Breaker trip on startup with equalized pressures points to liquid slugging.
2. Do NOT install a hard-start kit yet — if there is liquid in the compressor, the hard-start will force the rotor to try to turn harder against liquid, which can break connecting rods.
3. Engage a crankcase heating alternative: set thermostat to emergency heat (if heat pump) or fan-only for 20–30 minutes to circulate warm air around the outdoor unit. If possible, use a heat lamp near the compressor body for 30 minutes.
4. Alternatively, short-cycle the system: turn it on for 5 seconds (just enough to vibrate the compressor), off for 10 minutes, repeat 3–4 times. The vibration helps drive refrigerant out of the oil while the compressor is too brief to slug.
5. After heating/cycling, attempt normal startup. If compressor starts cleanly and runs — refrigerant migration was the cause.
6. Recommend crankcase heater installation to prevent recurrence. Cost-effective prevention.
7. If compressor still won't start after liquid migration treatment: check for locked mechanical rotor (try to rotate compressor shaft with a strap wrench — should move with significant but not immovable resistance). Truly locked rotor = compressor replacement.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Compressor slugging diagnosis — [achrnews.com/articles/114412-the-professor-flooding-and-slugging](https://www.achrnews.com/articles/114412-the-professor-flooding-and-slugging)
- Locked rotor diagnosis — [yorkcentraltechtalk.wordpress.com/2014/04/23/compressor-locked-rotor-diagnostic](https://yorkcentraltechtalk.wordpress.com/2014/04/23/compressor-locked-rotor-diagnostic)

---

## SCN-RES-027 — Carrier/Bryant: Contactor Welded Contacts — Compressor Won't Shut Off
**Equipment:** Carrier Performance 14 (24ACC) split AC, R-410A
**Tech describes:** "Homeowner says the outdoor unit keeps running even after the thermostat is turned off. Unit won't shut off."

### Symptoms / readings
- Suction PSI: 115 psig (normal — compressor running continuously)
- Head PSI: 315 psig (normal)
- Thermostat: set to OFF
- 24VAC to contactor coil: 0VAC (no Y signal from thermostat)
- Contactor coil: de-energized (coil not pulling in)
- Contactor contacts: closed (stuck, pitted/welded from arcing)
- Amp draw: 14A (normal operating amps — compressor running despite no Y call)

### Correct diagnosis
Welded contactor contacts — the contacts have pitted and fused together from repeated arcing over years of operation. Even with the coil de-energized (no 24VAC), the contacts remain closed, keeping the compressor running indefinitely.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm 24VAC at contactor coil terminals = 0V (coil is de-energized). Contacts should be open (compressor should be off). They are not.
2. Do NOT attempt to manually pry the contacts open with a screwdriver — this is a life-safety hazard with 240VAC live contacts.
3. Shut off power at the outdoor disconnect to stop the compressor.
4. With power off: test resistance across the contactor contacts with a multimeter — should be infinite (open) with coil de-energized. If reading ~0.2 ohms or less, contacts are welded.
5. Replace the contactor with an exact amp-rated replacement. Match the Full Load Amps (FLA) rating and coil voltage (24VAC for residential).
6. Inspect the compressor for potential damage from extended uncontrolled operation (particularly overheating from running without adequate load cycle control). If discharge line temperatures were extreme, check compressor amp draw and current draw after restart.
7. Recommend to homeowner: contactor replacement is a routine maintenance item on systems over 7–10 years. Suggest inspection next annual service.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE — Do NOT attempt to separate welded contacts manually with power energized.

### Source(s)
- Welded contactor contacts diagnosis — [acservicetech.com/post/top-5-hvac-contactor-troubleshooting-problems](https://www.acservicetech.com/post/top-5-hvac-contactor-troubleshooting-problems)
- Contactor failure modes — [thehvacoutlet.com/2023/11/29/hvac-contactor-troubleshooting](https://thehvacoutlet.com/2023/11/29/hvac-contactor-troubleshooting/)

---

## SCN-RES-028 — Rheem/Ruud: Heat Pump Stuck in Cooling Mode — Reversing Valve Solenoid Failure
**Equipment:** Rheem RPLB-060JEZ heat pump, R-410A
**Tech describes:** "Customer complaining of no heat. System blowing cold air in heat mode. Thermostat set to heat, calling for heat."

### Symptoms / readings
- Suction PSI: 120 psig (reads like a cooling-mode suction — too high for heating at 45°F OAT)
- Head PSI: 285 psig (reads like cooling head — not heating mode)
- Outdoor coil: warm to touch (acting as condenser, not evaporator — confirming cooling mode)
- Ambient OAT: 45°F
- Indoor supply air: 52°F (cooling, not heating)
- 24VAC at reversing valve solenoid: 24VAC present (thermostat calling for heat)
- Reversing valve solenoid resistance: infinite (open coil — failed)

### Correct diagnosis
Reversing valve solenoid coil failure. The thermostat is correctly calling for heat and sending 24VAC to the reversing valve solenoid (O or B wire, depending on configuration), but the solenoid coil is open-circuited. The valve body remains in cooling position.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm the thermostat is configured correctly (O=cooling energized, B=heating energized) — establish the baseline first.
2. Measure 24VAC at the reversing valve solenoid terminals: 24VAC present = thermostat is doing its job. The solenoid coil is the fault.
3. Disconnect the solenoid wires and measure resistance: Should be 8–15 ohms for a standard Rheem/Ruud reversing valve solenoid. Infinite resistance = open coil (failed).
4. The solenoid coil is typically replaceable without replacing the entire reversing valve body. Order the specific coil for the valve manufacturer (Ranco, Sporlan, Sanhua, etc.) stamped on the valve body.
5. After solenoid coil replacement: recheck 24VAC at the new coil and listen for the valve to shift (audible click or hiss). Verify mode change: outdoor coil should become cold (now acting as evaporator in heating mode) within 2–3 minutes.
6. If solenoid is correct resistance (8–15 ohms) but valve doesn't shift: suspect a mechanically stuck reversing valve body. A stuck valve requires a minimum of 75 PSI pressure differential to shift — if pressures have equalized, the valve may not shift until the system is running.
7. Stuck valve body mitigation: run system in cooling (to build pressure differential), then command heating mode. Rapid pressure change sometimes unsticks the slider. If it remains stuck, valve body replacement is required.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Reversing valve diagnosis and pressure differential requirement — [pickcomfort.com/heat-pump-reversing-valve-stuck-causes-diagnosis-repair](https://www.pickcomfort.com/heat-pump-reversing-valve-stuck-causes-diagnosis-repair/)
- Stuck reversing valve diagnostic — [achrnews.com/articles/166134-heat-pump-troubleshooting-part-3-stuck-sliders-and-hidden-leaks](https://www.achrnews.com/articles/166134-heat-pump-troubleshooting-part-3-stuck-sliders-and-hidden-leaks)

---

## SCN-RES-029 — Trane/American Standard: Heat Pump Stuck in Heating Mode (Reversing Valve Slug)
**Equipment:** Trane XR15 heat pump, R-410A
**Tech describes:** "Homeowner says no cooling in summer. Unit cooling barely at all. Coming out of winter — was heating fine."

### Symptoms / readings
- Suction PSI: 65 psig (too low for cooling — looks like heating-mode suction)
- Head PSI: 350 psig (looks like heating-mode head at cooling conditions)
- Indoor supply air: 78°F (not cooling)
- Outdoor coil: cold (acting as evaporator — heating mode)
- Ambient OAT: 92°F
- 24VAC at reversing valve solenoid (O terminal): 24VAC present (thermostat calling for cooling)
- Solenoid resistance: 11 ohms (good)

### Correct diagnosis
Reversing valve mechanically stuck in heating position. The solenoid coil is good and receiving the correct signal, but the internal slider valve is physically stuck. The valve has been in heating mode all winter and the slider has seized due to contaminants or a mechanical defect.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Solenoid coil is good (11 ohms) and 24VAC is present — coil is not the issue. Valve body is stuck.
2. Attempt dynamic unsticking: run system in heating mode (reversing valve de-energized) to build a 100+ PSI pressure differential across the valve. Then command cooling mode (energize solenoid) while system is running. The pressure spike as the compressor runs sometimes unseats a stuck slider.
3. Tap the reversing valve body lightly with a rubber mallet (not a metal hammer) while in the pressure differential condition. Sometimes vibration dislodges the slider.
4. If valve does not shift after 3–4 attempts: reversing valve replacement is required.
5. Note: Replacing the reversing valve on a TXV system requires recovering all refrigerant, brazing out the old valve, installing the new valve with nitrogen purge during brazing to prevent internal contamination, then recharging by weight.
6. On R-410A systems, do NOT overheat brazed connections — the higher system pressures require properly rated fittings and care during brazing.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- Nitrogen purge during brazing is mandatory to prevent copper oxide contamination of the new valve.

### Source(s)
- Stuck reversing valve diagnosis — [hvacprosales.com/blog/heat-pump-stuck-in-cooling-mode-reversing-valve-fix](https://hvacprosales.com/blog/heat-pump-stuck-in-cooling-mode-reversing-valve-fix)
- Reversing valve pressure differential — [achrnews.com/articles/166134-heat-pump-troubleshooting-part-3-stuck-sliders-and-hidden-leaks](https://www.achrnews.com/articles/166134-heat-pump-troubleshooting-part-3-stuck-sliders-and-hidden-leaks)

---

## SCN-RES-030 — Mitsubishi Hyper-Heat: Defrost Cycle Not Completing — Coil Icing in Heating
**Equipment:** Mitsubishi MXZ-3C30NAHZ2 Hyper-Heat, R-410A, -13°F rated
**Tech describes:** "Outdoor coil completely iced over. It's 22°F outside. Unit is running but heating output is poor. No error codes."

### Symptoms / readings
- Suction PSI: 42 psig (too low for heating at 22°F — normal ~55–65 psig)
- Head PSI: 220 psig (low)
- Ambient OAT: 22°F
- Outdoor coil: heavily iced, including top and side panels
- No active error codes
- Last defrost cycle: cannot be confirmed (homeowner unaware)
- Defrost sensor on coil: accessible on the U-tube section of outdoor coil

### Correct diagnosis
Defrost cycle not completing — either defrost initiation is failing or the defrost termination sensor is cutting defrost short before the coil clears. At 22°F OAT, a Mitsubishi Hyper-Heat should defrost every 30–90 minutes depending on frost accumulation.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. First, manually initiate a defrost cycle: On Mitsubishi MXZ units, use the service port (usually on the outdoor PCB) or the remote control test mode. Observe: reversing valve should click to cooling mode (outdoor coil becomes hot), outdoor fan should stop.
2. If defrost initiates manually but does not clear the coil fully (runs less than 5 minutes): check the defrost termination temperature sensor. Defrost should continue until the coil reaches approximately 55–65°F. If the coil temperature sensor reads incorrectly (high), it terminates defrost prematurely.
3. Measure the defrost thermistor resistance at 22°F OAT. Compare to Mitsubishi service manual NTC thermistor chart. Incorrect resistance = sensor replacement.
4. If defrost never initiates even manually: check the outdoor PCB defrost control logic. May require PCB replacement.
5. While the coil is iced: do not force-defrost repeatedly — alternating heating/defrost cycles too rapidly can stress the compressor.
6. Note: at 22°F OAT on a Hyper-Heat, some frost accumulation is normal. The question is whether automatic defrost is cycling every 30–90 minutes. If it is, and the coil still builds excessive ice, suspect low refrigerant charge (also causes excess icing at low ambient).

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Heat pump defrost troubleshooting — [hvacrschool.com/heat-pump-defrost-troubleshooting-tips](http://www.hvacrschool.com/heat-pump-defrost-troubleshooting-tips/)
- Heat pump stuck in defrost — [pantherhvac.com/blog/heat-pump-defrost-cycle](https://pantherhvac.com/blog/heat-pump-defrost-cycle/)

---

## SCN-RES-031 — Lennox XC25: 7-Segment Alert Code 417 — Coil Sensor Problem
**Equipment:** Lennox XC25-036-230-01 communicating heat pump, R-410A
**Tech describes:** "Alert code 417 on the outdoor 7-segment display. Unit ran briefly then faulted. iComfort S30 shows the same code."

### Symptoms / readings
- Suction PSI: Not measured (faulted off)
- Head PSI: Not measured
- Ambient OAT: 88°F
- Flash / fault code: **417 = Coil sensor problem** per Lennox XC25 Installation and Service Procedure (ManualsLib manual 1280744, page 30)
- Outdoor unit 7-segment display: showing 417
- iComfort thermostat: mirroring the same alert

### Correct diagnosis
Outdoor coil temperature sensor fault. The sensor is either open, shorted, or out of the expected range for current operating conditions. Lennox communicating systems use this sensor for capacity modulation and defrost initiation.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm 417 = coil sensor problem per Lennox XC25 service procedure documentation.
2. Locate the coil sensor on the outdoor unit — typically a small thermistor clipped to the refrigerant tubing on the outdoor coil.
3. Measure sensor resistance with an ohmmeter: At 88°F ambient, an NTC thermistor should read approximately 5–8 kΩ depending on the specific sensor. Check the Lennox service manual NTC chart for the exact value.
4. Open (infinite resistance) or shorted (near zero) readings = sensor replacement required.
5. Inspect the sensor mounting — if it has fallen off the tube or been bent away, it reads ambient air instead of coil temperature. This will cause the iComfort system to calculate incorrect operating conditions.
6. After sensor replacement: clear fault via S30 thermostat (Settings > Diagnostics > Clear Faults) and run one complete cooling cycle to verify no recurrence.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Lennox XC25 7-segment alert codes — [manualslib.com/manual/1280744/Lennox-Xc25-024-230-01.html?page=30](https://www.manualslib.com/manual/1280744/Lennox-Xc25-024-230-01.html?page=30)
- Lennox XC21 fault LED codes — [manualslib.com/manual/922657/Lennox-Xc21-Series.html?page=36](https://www.manualslib.com/manual/922657/Lennox-Xc21-Series.html?page=36)

---

## SCN-RES-032 — Carrier Infinity: Fault Code 25 — Low Pressure Trip (TXV Failure Cascade)
**Equipment:** Carrier Infinity 24VNA6 heat pump, R-410A
**Tech describes:** "Fault code 25 — low pressure trip. This is the third time this week. I've checked the charge twice and it's fine. No leaks found."

### Symptoms / readings
- Suction PSI: 58 psig (trips at 40–50 psig on LPS)
- Head PSI: 285 psig
- Superheat: 32°F (high)
- Subcooling: 14°F (higher than expected for undercharged system)
- Ambient OAT: 82°F
- Fault code: **25 = "Low Pressure Trip"** per Carrier 25VNA fault code table
- Charge has been verified twice — no leak found

### Correct diagnosis
TXV (thermostatic expansion valve) hunting or restriction causing intermittent low-pressure trips. The elevated superheat (32°F) and relatively normal subcooling (14°F) pattern does not match a simple undercharge — it matches a TXV that is hunting (oscillating suction pressure) or partially restricting.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm fault 25 = low pressure trip per Carrier 25VNA fault table. Recurring code with confirmed charge points away from refrigerant loss.
2. Watch suction pressure in real-time for 5–10 minutes without touching anything. If suction oscillates (cycles up/down rather than stable), the TXV is hunting.
3. A hunting TXV shows swinging suction pressure — common pattern: 58 psig, rises to 90 psig, drops to 55 psig, rises again. Superheat swings accordingly.
4. Warm the TXV sensing bulb with your hand: If suction pressure quickly rises and superheat drops, the TXV is responsive but was chasing an unstable condition. Check sensing bulb clamp and insulation.
5. If suction is stably low with stable high superheat: TXV is stuck (restricted), not hunting.
6. Either way — replace the TXV. Carrier Infinity systems use TXV metering. Replacement requires refrigerant recovery.
7. Before replacement, verify the sensing bulb is properly clamped to the suction line and wrapped with insulation tape. A poorly mounted bulb is the #1 cause of TXV hunting.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Carrier 25VNA Fault Code 25 — [manualslib.com/manual/860578/Carrier-25vna.html?page=12](https://www.manualslib.com/manual/860578/Carrier-25vna.html?page=12)
- Hunting vs restricted TXV diagnostic — [hvactoolkit.org/resources/txv-troubleshooting](https://hvactoolkit.org/resources/txv-troubleshooting)

---

## SCN-RES-033 — Rheem EcoNet: Code A111_A — EXV Temp Thermistor Failure
**Equipment:** Rheem RP20 variable-speed inverter heat pump, R-410A, EcoNet communicating
**Tech describes:** "A111_A code showing on EcoNet. 8 LED flashes on the air handler control. System running in emergency heat, heat pump bypassed."

### Symptoms / readings
- Suction PSI: Not monitored (system running on aux only)
- Ambient OAT: 38°F
- Fault code: **A111_A (8 flashes) = EXV Temp Thermistor Failure** — suction thermistor controlling the electronic expansion valve per Rheem EcoNet documentation
- Air handler: running in emergency heat only
- Heat pump compressor: locked out on fault

### Correct diagnosis
Suction line thermistor failure — the sensor that the EXV (electronic expansion valve) uses to control its opening position has failed. Without this sensor, the EXV cannot operate correctly, so the system locks out the heat pump to prevent compressor damage from improper refrigerant metering.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm A111_A (8 flash) = EXV temp thermistor failure per Rheem EcoNet documentation (MyRheem service portal).
2. Locate the suction thermistor — on Rheem RP20 variable-speed units, this is typically on the suction line inside the outdoor unit cabinet.
3. Measure thermistor resistance: At 38°F OAT, normal NTC thermistor reading is approximately 12–18 kΩ. Open or shorted values confirm failure.
4. Check physical condition of the sensor: corrosion on the sensor wire connector is a common cause of false-open readings on RP20 units.
5. Replace the suction thermistor with the Rheem-specific replacement part. After replacement, verify placement (must be in contact with suction line, insulated over).
6. Clear fault via EcoNet Control Center > Service > Clear Faults. Restart system and verify heat pump runs without fault recurrence.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Rheem A111_A EcoNet fault — [pdf4pro.com/amp/view/econet-and-flash-codes-myrheem-com-735958.html](https://pdf4pro.com/amp/view/econet-and-flash-codes-myrheem-com-735958.html)

---

## SCN-RES-034 — York/Coleman: E1 Compressor Overcurrent Lockout
**Equipment:** York YHE036 heat pump, R-410A
**Tech describes:** "E1 code on the thermostat display. Outdoor unit not running. Tried resetting — comes back in 5 minutes."

### Symptoms / readings
- Suction PSI: Equalized (~175 psig — compressor off)
- Head PSI: Equalized
- Ambient OAT: 95°F
- Flash code: **E1 = Compressor Overcurrent or System Lockout** per York heat pump diagnostics
- Amp draw on compressor: Could not measure — unit trips before running 5 minutes
- Run capacitor: 40+5 µF, tests 41.2/4.9 µF (within tolerance)
- Contactor: pulling in correctly

### Correct diagnosis
Compressor overcurrent lockout — the compressor is drawing more than its rated Full Load Amps (FLA) on startup or during run. At 95°F OAT, high head pressure from a dirty coil or refrigerant overcharge can cause the compressor to draw excessive current. Alternatively, a compressor with weakening motor windings will overcurrent at high ambient.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm E1 = compressor overcurrent lockout per York heat pump fault documentation.
2. Inspect the condenser coil for blockage. At 95°F OAT, a partially blocked coil will spike head pressure and increase compressor load (more torque required = more amps).
3. Clean the coil, wait for lockout to reset, and recheck compressor amp draw while running with a clamp meter. Compare to nameplate RLA (usually 12–18A for a 3-ton R-410A compressor).
4. If amp draw is within 10% of RLA with a clean coil: no compressor issue, the dirty coil was the cause.
5. If amp draw exceeds RLA significantly even with clean coil: measure winding resistance (COMM to START and COMM to RUN on the compressor terminals). Unbalanced windings = motor winding failure.
6. Verify refrigerant charge is not overcharged — elevated subcooling with high amp draw = overcharge is contributing.
7. Hard-start kit: if compressor draws high amps only at startup (first 2–3 seconds), a hard-start kit can reduce startup amps. But if amp draw is high during run, a hard-start kit won't help.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE — Do not touch compressor terminals until power is confirmed off and contactor is locked out.

### Source(s)
- York heat pump E1 error code — [pickcomfort.com/york-heat-pump-error-codes-troubleshooting](https://www.pickcomfort.com/york-heat-pump-error-codes-troubleshooting/)
- Compressor locked rotor diagnosis — [yorkcentraltechtalk.wordpress.com/2014/04/23/compressor-locked-rotor-diagnostic](https://yorkcentraltechtalk.wordpress.com/2014/04/23/compressor-locked-rotor-diagnostic)

---

## SCN-RES-035 — Goodman/Amana: Code d2 — System Incompatibility in Communicating Install
**Equipment:** Goodman GSXC20 / AMEC air handler, new communicating install, R-410A
**Tech describes:** "Got d2 after completing a new communicating system install today. Outdoor unit won't run. Indoor unit showing d2."

### Symptoms / readings
- Flash / fault code: **d2 = Outdoor unit requires airflow greater than indoor unit's airflow capability / shared data incompatible** per Goodman communicating system fault codes
- System: brand-new install, GSXC20 outdoor matched with AMEC indoor
- Equipment selection: tech selected components independently

### Correct diagnosis
Equipment mismatch in a communicating system — the outdoor unit's required airflow (CFM) exceeds the capability of the matched indoor unit, or the shared data (capacity and efficiency pairing data) is incompatible. Goodman's communicating system verifies matched pairs at startup.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm d2 = system data incompatibility or mismatched equipment per Goodman communicating system code documentation.
2. Pull the equipment model numbers for both the indoor and outdoor unit. Cross-reference against Goodman's matched system pairings — not all GSXC20 outdoor units are approved for all AMEC air handler sizes.
3. Check the Goodman AHRIMatch application or the installation manual for approved matched pairs. A 4-ton GSXC20 paired with a 3-ton AMEC air handler will generate d2.
4. If the pairing is incorrect: the correct fix is to swap the indoor or outdoor unit for the properly matched model. This is an installation error.
5. If the pairing appears correct: verify the communicating system data sharing — pull the memory card from the air handler (AVPTC or AMEC models) and ensure it was properly programmed or allow the system to complete its initial shared data setup cycle (some systems require a 10-minute data-sharing startup cycle).
6. If still d2 after confirming correct pair: check communication wiring polarity and verify both boards are running the same firmware generation.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Goodman d2 communicating system code — [twintechheating.ca/goodman-air-conditioner-error-codes](https://twintechheating.ca/goodman-air-conditioner-error-codes/)

### Notes for Mike's tone / style
- Tech-facing: "Communicating systems are not plug-and-play across model lines. Verify the AHRI-listed matched pair before installation, not after."

---

## SCN-RES-036 — Mitsubishi Ductless: E1 — Indoor PCB Fault
**Equipment:** Mitsubishi MSZ-GS12NA wall-mounted indoor unit, R-410A
**Tech describes:** "E1 on one indoor head out of a 3-zone system. Other two zones running fine."

### Symptoms / readings
- Flash / fault code: **E1 = Indoor PCB (circuit board) fault / sensor error** per Mitsubishi error code reference
- Affected zone: one indoor head only
- Other zones: operating normally on same MXZ outdoor unit
- 240VAC power to outdoor unit: present
- Communication wiring to faulted indoor unit: present (checked with voltmeter)

### Correct diagnosis
Indoor PCB failure on the affected zone's wall-mounted head. Since two other zones are running normally on the same outdoor unit, the outdoor PCB is not the issue. E1 on a single zone = indoor PCB on that zone.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm E1 = indoor PCB or sensor error per Mitsubishi error documentation.
2. Presence of E1 on only one of three zones confirms the outdoor unit is functioning. Fault is localized to the affected indoor head.
3. Power cycle the affected indoor unit (turn off its zone breaker or use the remote off → standby → on). E1 sometimes clears on momentary faults.
4. If E1 persists after power cycle: access the indoor unit PCB (remove front cover and filter, then front cover of electrical compartment). Look for visible burn marks, bulging capacitors, or corrosion on the board.
5. Check the thermistor connectors on the indoor PCB — E1 can be caused by a thermistor plug that has vibrated loose rather than a full PCB failure.
6. If board visually clear and thermistor connections secure: indoor PCB replacement is the resolution.
7. On warranty claims: E1 on a zone head inside warranty period should be submitted to Mitsubishi for warranty credit before condemning the board.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Mitsubishi E1 indoor PCB error — [choosesanford.com/common-error-codes-for-mitsubishi-heat-pumps](https://choosesanford.com/common-error-codes-for-mitsubishi-heat-pumps/)

---

## SCN-RES-037 — LG Ductless: CH04 — Drain Pump Error
**Equipment:** LG LMN09HVT ductless unit (ceiling cassette), R-410A
**Tech describes:** "CH04 on a ceiling cassette in a commercial office space. Unit not running. Floor is getting wet — there was already water on the tile."

### Symptoms / readings
- Flash / fault code: **CH04 = Drain pump error** per LG error code documentation (HVAC Toolkit)
- Indoor unit: ceiling cassette style
- Water: visible at the drip pan inspection cover
- Drain pump: not audible during operation test
- Ambient: 74°F (no high-heat scenario)

### Correct diagnosis
Drain pump failure or drain float switch activation. The drain pump has either seized/failed electrically, or the condensate reservoir is full and the float switch has tripped to prevent overflow.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm CH04 = drain pump error per LG HVAC Toolkit error code reference.
2. First priority: get a bucket and check the condensate reservoir. If it's full (float tripped), drain it manually and check the drain line for blockage.
3. Probe the drain line: blow compressed air or use a wet-vac to clear any algae or debris blockage. On ceiling cassette units, the drain line must slope properly — check that no sag exists in the drain line that creates a trap.
4. After draining the reservoir: attempt to test the drain pump directly by applying 24VDC or 120VAC (depending on the specific pump model) directly to the pump motor leads. If the pump runs, the pump motor itself is ok and the issue was a blocked line or float switch activation.
5. If the pump does not run on direct power: the pump motor has failed. Replace the drain pump assembly.
6. Note: Water on the floor from a ceiling cassette is a potential slip/fall liability. Document the existing water damage before service and advise the building manager.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- Water on floor combined with electrical equipment — verify the water has not reached any electrical components before energizing. Dry the area before powering up the unit.

### Source(s)
- LG CH04 error code — [hvactoolkit.org/resources/error-codes/lg](https://hvactoolkit.org/resources/error-codes/lg)

### Notes for Mike's tone / style
- Tech-facing: "Ceiling cassette with water on the floor is a priority call. The water was there before you arrived — document that before touching anything."
- Homeowner/building manager-facing: "The condensate drainage system has backed up or the pump has failed. We'll get the water cleared and the pump tested."

---

## SCN-RES-038 — Samsung Ductless: E101 — Indoor-to-Outdoor Communication Lost
**Equipment:** Samsung AR18BXHZCWKNEU ductless, R-410A
**Tech describes:** "E101 on the indoor display. Brand new install, just finished wiring. Never ran."

### Symptoms / readings
- Flash / fault code: **E101 = Communication error — indoor unit cannot receive data from outdoor unit** per Samsung error code documentation
- Install age: same day install, never operated
- Power supply: 240VAC confirmed at outdoor unit
- Communication wiring: installed by tech during today's install

### Correct diagnosis
Communication wiring error on new installation. E101 on a brand-new install almost always means incorrect terminal assignment, reversed polarity, or a wiring omission during the installation. The indoor unit cannot receive the outdoor unit's communication signal.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm E101 = indoor unit unable to receive data from outdoor unit per Samsung error code documentation.
2. On a new install, do not assume the wiring is correct. Pull the installation manual for this specific Samsung model and verify the terminal assignments at both the indoor and outdoor unit terminal boards.
3. Samsung residential ductless units use L1, L2 (240VAC power) and S (signal) in a 3-wire configuration between units. Verify S terminal is correctly landed at both ends.
4. Check that the S wire was not accidentally landed on N (neutral) or L (live) — a common wiring error.
5. Check for 12–24VDC on the S line (measured between S and L2/N) with outdoor unit powered — this is the communication signal. No voltage = outdoor unit not generating the signal, or S terminal not landed correctly.
6. If wiring is confirmed correct: power cycle both units (off for 5 minutes), then restart. Samsung communicating systems sometimes need a full cold restart to establish the communication link.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Samsung E101 error code — [choosesanford.com/samsung-ductless-mini-split-error-codes](https://choosesanford.com/samsung-ductless-mini-split-error-codes/)
- Samsung error code categories — [hvactoolkit.org/resources/error-codes/samsung](https://hvactoolkit.org/resources/error-codes/samsung)

---

## SCN-RES-039 — R-22 Legacy System: Refrigerant Leak — R-22 Availability and MO99 Retrofit
**Equipment:** Carrier 38CKB split AC (R-22, approximately 2008 vintage)
**Tech describes:** "R-22 system, lost about half its charge over the winter. Low suction, high superheat. Customer asking about options."

### Symptoms / readings
- Suction PSI: 45 psig (low for R-22 cooling at 85°F OAT — normal R-22 suction ~65–75 psig)
- Head PSI: 190 psig (low)
- Superheat: 30°F (high)
- Subcooling: 2°F (very low — undercharged)
- Ambient OAT: 85°F
- Refrigerant type: R-22 (confirmed on nameplate)
- System age: ~16 years
- No leak has been located yet

### Correct diagnosis
Significant R-22 refrigerant loss from a leak — roughly half charge depleted over winter. R-22 production and import banned in the USA as of January 1, 2020. R-22 is available only from reclaimed/recycled stocks.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm refrigerant type as R-22 from nameplate. Do NOT add any refrigerant until the refrigerant type is confirmed — mixing refrigerants is an EPA violation.
2. Perform a leak search before adding any refrigerant. Priority locations on R-22 Carrier systems of this era: evaporator coil (formicary corrosion pinholes are extremely common on aluminum fin/copper tube coils in VOC-rich indoor environments), service valve stems, and Schrader cores.
3. If a leak is found and repaired: the system can be recharged with reclaimed R-22. Cost of reclaimed R-22 is significant ($100+/lb in 2024 — pricing fluctuates). A 3-ton system may need 2–5 lbs.
4. MO99 (R-438A) retrofit option: MO99 is an EPA SNAP-approved R-22 retrofit refrigerant that does NOT require a compressor oil change for most POE-compatible systems. Procedure: recover remaining R-22, replace the filter drier (mandatory), add 20% POE oil if the system has a liquid receiver or known oil-return issues, charge with MO99 to achieve correct subcooling/superheat.
5. R-407C retrofit option also acceptable — but REQUIRES an oil change to POE oil, as R-407C is NOT miscible with mineral oil.
6. Mike's guidance to the contractor: "The economics of R-22 repair vs. replacement are real. On a 16-year-old system, the repair cost and R-22 cost together may approach the cost of new equipment. That's a conversation the contractor needs to have with the homeowner, not Mike."

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- EPA Section 608: Venting R-22 is illegal. Must recover before opening system.

### Source(s)
- EPA SNAP R-22 substitutes — [epa.gov/snap/substitutes-residential-and-light-commercial-air-conditioning-and-heat-pumps](https://www.epa.gov/snap/substitutes-residential-and-light-commercial-air-conditioning-and-heat-pumps)
- MO99 retrofit procedures — [freon.com/en/-/media/files/freon/freon-mo99-retrofit-guidelines.pdf](https://www.freon.com/en/-/media/files/freon/freon-mo99-retrofit-guidelines.pdf)
- R-22 phase-out status — [acacos.com/tips/r22-service-phase-out](https://www.acacos.com/tips/r22-service-phase-out)

### Notes for Mike's tone / style
- Homeowner-facing: Mike NEVER recommends replacement to a homeowner. Mike tells the tech what the options are, and the tech/contractor advises the homeowner.
- Tech-facing: "R-22 recharge is legal for existing systems. Just make sure the leak is found first — adding to a leaking system is a waste of expensive refrigerant and an EPA issue."

---

## SCN-RES-040 — Carrier Infinity 25VNA: Fault 93 — High Current Lockout
**Equipment:** Carrier Infinity 25VNA8 variable-speed heat pump, R-410A
**Tech describes:** "Fault code 93. Outdoor unit locked out. System is 2 years old. Running in cooling at 100°F ambient."

### Symptoms / readings
- Suction PSI: Not measurable (locked out)
- Head PSI: Not measurable
- Ambient OAT: 100°F
- Fault code: **93 = "High Current Lockout"** per Carrier 25VNA fault code table
- Previous faults in history: 16 (High Pressure) appeared twice before 93
- System age: 2 years

### Correct diagnosis
High current lockout is a secondary protection that triggers after the inverter compressor exceeds rated current. At 100°F OAT with a previous history of fault 16 (high pressure), the root cause is likely a dirty condenser coil pushing head pressure high, which in turn requires more compressor torque (= more current) until fault 93 trips.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm fault 93 = High Current Lockout per Carrier 25VNA fault table.
2. Pull fault history — fault 16 appearing before fault 93 tells the story. High pressure drove high torque demand, which drove high current.
3. Inspect condenser coil. At 100°F OAT with a partially blocked coil, head pressure can easily exceed 420 psig, requiring the compressor to work harder.
4. Clean condenser coil thoroughly. Allow unit to cool down (the inverter module may need 15–20 minutes to reset from thermal overload).
5. After cleaning, power cycle and allow restart. Monitor head pressure at the gauges — it should stabilize in the 380–410 psig range at 100°F OAT.
6. If fault 93 recurs with clean coil and head pressure is normal: the inverter module itself may be degrading (fault 93 can be caused by a failing inverter board that trips current limits prematurely). Consider inverter module replacement.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- Inverter module DC bus — wait 5 minutes after power removal before accessing inverter compartment.

### Source(s)
- Carrier 25VNA Fault Code 93 — [manualslib.com/manual/860578/Carrier-25vna.html?page=12](https://www.manualslib.com/manual/860578/Carrier-25vna.html?page=12)


---

## SCN-RES-041 — Goodman GSXC18: Compressor Internal Mechanical Failure (Valve Failure)
**Equipment:** Goodman GSXC18048 split AC, R-410A, 8 years old
**Tech describes:** "Running but barely cooling. Suction and head both look low. Superheat is very high. Replaced the TXV last month and it didn't fix it."

### Symptoms / readings
- Suction PSI: 95 psig (elevated for normal cooling — should be 110–130 psig)
- Head PSI: 235 psig (low for 85°F OAT — should be 280–320 psig)
- Superheat: 38°F (very high)
- Subcooling: 2°F (very low)
- Ambient OAT: 85°F
- Compressor amp draw: 10A (nameplate RLA: 18A — significantly below rated)
- TXV: replaced last month

### Correct diagnosis
Compressor valve failure — worn internal discharge valves are allowing high-pressure discharge gas to leak back into the low-pressure suction side on every compression stroke. This produces: reduced head pressure, elevated suction pressure, high superheat (compressor isn't pumping efficiently), and below-normal amp draw (less work being done).

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. The pattern of low head + elevated suction + low amp draw after TXV replacement is a strong compressor valve signature.
2. Confirm with a pump-down test: Close the liquid line service valve. Run the compressor. The suction pressure should pull down to below 20 psig within 1–2 minutes if the compressor valves are intact. If suction pulls down slowly (takes more than 4–5 minutes) or won't pull below 40 psig, compressor valves are failing.
3. Check compression ratio: Compression ratio = head PSI / suction PSI (in absolute pressure). At 235/95 (both psig), add 14.7: (249.7)/(109.7) = 2.28. For a healthy scroll compressor on R-410A, compression ratio should be 3.5–4.5 at these conditions. At 2.28, the compressor is barely compressing.
4. Compressor motor windings: check COMM-START and COMM-RUN resistance. If windings are electrically intact but the pump-down test confirms poor compression: the compressor has mechanical internal valve failure.
5. Resolution: compressor replacement. On a 8-year-old GSXC18, quote the compressor replacement but also discuss system age with the contractor (repair vs replace analysis is contractor's call, not Mike's).

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- Compressor terminals: Do not touch with power on. Lock out power before accessing compressor electrical compartment.

### Source(s)
- Compressor valve failure diagnosis — [justintimeref.net/diagnosing-bad-hvac-compressor-valves](https://www.justintimeref.net/diagnosing-bad-hvac-compressor-valves)
- 5 pillars of refrigerant circuit diagnosis — [hvacrschool.com/the-5-pillars-of-residential-ac-refrigerant-circuit-diagnosis](http://www.hvacrschool.com/the-5-pillars-of-residential-ac-refrigerant-circuit-diagnosis/)

---

## SCN-RES-042 — Trane XV20i: Low Refrigerant — Formicary Corrosion Evaporator Leak
**Equipment:** Trane XV20i split AC (with Trane XL air handler), R-410A, 7 years old
**Tech describes:** "Gradual cooling loss. Checked charge last summer, was fine. Now pressures are down. Can't find a leak with my leak detector."

### Symptoms / readings
- Suction PSI: 88 psig (below normal — normal 115–130 psig)
- Head PSI: 255 psig (below normal)
- Superheat: 24°F (elevated)
- Subcooling: 5°F (low)
- Ambient OAT: 80°F
- Indoor environment: newer home, lots of new furniture/cabinets, kitchen renovation last year (high VOC environment)
- Leak detector: no alarm at outdoor unit or line set

### Correct diagnosis
Formicary corrosion (also called "ant's nest" corrosion) on the evaporator coil — a chemical reaction between formic acid (from VOCs in the indoor air: carpets, furniture, cleaning products, new cabinets) and the copper tubing of the evaporator coil, creating microscopic pinholes. Leaks are typically too small for electronic detectors to find directly.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. No leak found at outdoor unit or line set — focus on the evaporator coil.
2. Access the evaporator coil (indoor unit). Look for a green-white powdery residue on the copper tubes or at the distributor tube connections — this is the characteristic sign of formicary corrosion.
3. To confirm: nitrogen pressure test the indoor coil in isolation. Cap off the liquid and suction line stubs at the service valves, pressurize the coil with 150 psig nitrogen, apply soap bubbles to the coil surface. The pinholes are often too small for an electronic detector but visible as soap bubbles.
4. Formicary corrosion is not repairable — evaporator coil replacement is required.
5. On 7-year-old XV20i with formicary corrosion: if the homeowner continues to use products that generate formic acid, the new coil will corrode as well. Recommend improved indoor air quality (ventilation, air purifier, addressing VOC sources).
6. Document the leak on the service invoice — EPA Section 608 requires documentation of leak detection and repair.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- EPA 608 documentation requirement.

### Source(s)
- Formicary corrosion and evaporator coil leak locations — [acservicetech.com/post/where-to-find-r-22-r410a-leaks-on-ac-units-top-10-spots](https://www.acservicetech.com/post/where-to-find-r-22-r410a-leaks-on-ac-units-top-10-spots)
- VOC-driven corrosion in indoor environments — [interstateac.com/blog/causes-of-refrigerant-leaks](https://interstateac.com/blog/causes-of-refrigerant-leaks/)

---

## SCN-RES-043 — Daikin North America: U4 — Indoor/Outdoor Communication Error (Multi-Zone)
**Equipment:** Daikin MXS3F48TVJU multi-zone outdoor / FTXS indoor units, R-410A
**Tech describes:** "U4 on two of the three indoor heads. One zone still running. System powered up fine before this install."

### Symptoms / readings
- Flash / fault code: **U4 = Communication error between indoor and outdoor units** per Daikin error code guide
- Affected zones: 2 of 3 indoor heads
- One zone functioning normally
- Install type: new multi-zone installation, completed today
- 240VAC to outdoor unit: confirmed
- Communication wiring: field-installed today

### Correct diagnosis
Communication wiring error on the two affected zones. The fact that one zone communicates correctly while two do not, and this is a new install, points to field wiring errors on the affected zone connections at the outdoor unit multi-zone control board.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm U4 = communication error per Daikin error code documentation.
2. With one zone running and two failing on a new install: check the wiring on the two failed zones at the outdoor unit's multi-zone board. Compare terminal assignments to the working zone — the working zone shows what correct wiring looks like.
3. Common new-install U4 causes: S-terminal wire landed on wrong terminal, communication wires reversed (A/B polarity), or communication wire accidentally not terminated.
4. Power cycle the affected zones (turn each indoor unit off at the breaker for 5 minutes, restore). Daikin multi-zone systems need a cold restart to re-establish communication.
5. Check for 12–24VDC between the S terminal and power common at the two affected indoor units with the outdoor unit running.
6. If wiring is confirmed correct and power cycle doesn't clear U4: check for a damaged wire run from the outdoor board to the affected indoor units.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Daikin U4 communication error — [minisplitsizer.com/daikin-mini-split-error-codes](https://minisplitsizer.com/daikin-mini-split-error-codes/)

---

## SCN-RES-044 — Rheem/Ruud: Dual LED — Coil Sensor Failure (Defrost Board)
**Equipment:** Ruud UPMB heat pump, R-410A
**Tech describes:** "Both LEDs lit solid on the defrost board. No cooling. Outdoor unit completely shut down."

### Symptoms / readings
- Flash code: **LED1 On / LED2 On = Coil Sensor Failure** per Rheem RPNE dual-LED diagnostic chart
- Ambient OAT: 72°F
- System: cooling call active, no response from outdoor unit
- Outdoor unit: no compressor, no fan

### Correct diagnosis
Coil temperature sensor failure on the defrost control board. The defrost board uses the coil sensor both for defrost initiation in heating mode and for protection monitoring year-round. A failed coil sensor causes the system to shut down as a protection measure.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm LED1 On / LED2 On = coil sensor failure per Rheem RPNE diagnostic documentation.
2. Locate the coil sensor — a small NTC thermistor typically clipped to the outdoor coil tubing, connected via a 2-wire harness to the defrost board.
3. Measure sensor resistance: At 72°F ambient, a typical Rheem coil sensor should read approximately 8–12 kΩ. Open (infinite) = sensor failed open. Near-zero = sensor failed shorted.
4. Check the wire harness for damage (rodent chewing is common on outdoor unit low-voltage wiring).
5. Replace the coil sensor with the Rheem-specific replacement (or an NTC thermistor matching the exact resistance-temperature curve from the service manual).
6. After replacement: power cycle, verify LEDs return to normal flash/flash (normal operation), run through one cooling cycle.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Rheem RPNE dual-LED codes — [ghac.makekb.com/entry/677/](https://ghac.makekb.com/entry/677/)

---

## SCN-RES-045 — York/Coleman Simplicity Controls: HOP Fault — High-Pressure Outdoor Sensor
**Equipment:** York YZF (Simplicity controls) heat pump, R-410A
**Tech describes:** "HOP alarm on the control display. Condenser shut down. It's 98°F outside."

### Symptoms / readings
- Flash / fault code: **HOP = High-side pressure above safe threshold** per York Simplicity diagnostics
- Head PSI: 440 psig (when system was running)
- Suction PSI: 118 psig
- Ambient OAT: 98°F
- Subcooling: 17°F (elevated)
- Outdoor condenser coil: clean (confirmed)
- Outdoor fan: running (confirmed)

### Correct diagnosis
HOP (High Outdoor Pressure) fault with clean coil and a running fan at 98°F OAT. With subcooling at 17°F (target 8–12°F), mild refrigerant overcharge is the likely cause driving head pressure above the HOP threshold.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm HOP = high pressure fault per York/Simplicity diagnostic documentation.
2. Clean coil is confirmed and fan is running — rule out airflow restriction.
3. At 98°F OAT, R-410A target head pressure is approximately 360–395 psig for a properly charged system. At 440 psig with subcooling 17°F, this system is overcharged.
4. Recover refrigerant in small increments (2–3 oz) until subcooling reaches 8–12°F. Recheck head pressure — it should drop to within the 360–395 psig range.
5. After charge correction: reset the HOP fault via the Simplicity control (cycle power or use the control's reset procedure per the York Simplicity installation manual) and verify no recurrence.
6. Document the amount of refrigerant recovered. This is evidence that a previous service visit overcharged the system.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- York Simplicity diagnostic codes — [yorkcentraltechtalk.wordpress.com/2013/11/15/simplicity-diagnostics-flash-codes](https://yorkcentraltechtalk.wordpress.com/2013/11/15/simplicity-diagnostics-flash-codes/)
- York heat pump HOP fault — [pickcomfort.com/york-heat-pump-error-codes-troubleshooting](https://www.pickcomfort.com/york-heat-pump-error-codes-troubleshooting/)

---

## SCN-RES-046 — Fujitsu Halcyon: 9-Blink — Communication Error (Outdoor Controller)
**Equipment:** Fujitsu AOU24RLXFZH / ASU18RLF multi-zone, R-410A
**Tech describes:** "9 blinks on the indoor unit. Was working yesterday. Nothing was touched."

### Symptoms / readings
- Flash code: **9 blinks = communication error between internal components** per Fujitsu Halcyon flashing light code documentation
- Outdoor unit: powered, not running
- Indoor unit: 9-blink LED pattern on the operation LED
- 240VAC to outdoor unit: confirmed
- Recent weather: thunderstorm last night

### Correct diagnosis
Communication error following a power event (thunderstorm). The 9-blink pattern on Fujitsu Halcyon indicates communication failure between indoor and outdoor controllers. A power surge or momentary outage can corrupt the communication startup sequence.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm 9 blinks = communication error per Fujitsu Halcyon flashing code reference.
2. Power surge during the thunderstorm is the likely trigger. First step: complete power cycle. Shut off outdoor unit breaker for 5 full minutes. Restore power. This clears most surge-related communication faults.
3. If 9 blinks persist after power cycle: physically inspect the communication wiring between indoor and outdoor units for any weather-related damage.
4. Check for loose connections at both terminal boards — lightning-induced power events can cause connector thermal expansion that loosens terminals.
5. On multi-zone Fujitsu systems: with indoor heads, isolate which head is generating the 9-blink. If one head, that indoor PCB is suspect. If multiple heads simultaneously, suspect the outdoor PCB.
6. If power cycle does not clear 9 blinks and wiring is intact: PCB replacement will be required. Determine whether indoor or outdoor board based on fault isolation above.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Fujitsu 9-blink communication error — [smartacsolutions.com/fujitsu-halcyon-flashing-light-codes](https://smartacsolutions.com/fujitsu-halcyon-flashing-light-codes/)

---

## SCN-RES-047 — Trane/American Standard: Heat Pump No Heat, Aux Heat Running — Low Refrigerant in Heating Mode
**Equipment:** Trane XR15 heat pump, R-410A
**Tech describes:** "Heat pump running but aux heat is on full time. Suction is low. Heating capacity terrible."

### Symptoms / readings
- Suction PSI: 48 psig (heating mode at 32°F OAT — very low, normal should be ~65–80 psig)
- Head PSI: 240 psig (heating mode, low)
- Superheat: 28°F (very high — coil is starving in heating mode too)
- Subcooling: Not measurable
- Ambient OAT: 32°F
- Indoor RAT: 68°F / SAT: 70°F (barely above setpoint — aux heat doing all the work)
- Aux heat: continuously running

### Correct diagnosis
Low refrigerant in heating mode. At 32°F OAT, the heat pump is already near the lower end of its capacity curve. With suction at 48 psig and high superheat, the system is significantly undercharged, forcing the auxiliary heat to carry the full heating load. This will cause a large electric bill.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Low suction (48 psig) at 32°F OAT heating: R-410A saturation at 48 psig is approximately 0°F. The outdoor coil is operating far below ambient, which means inadequate refrigerant mass flow.
2. Perform leak search before adding any refrigerant. Priority areas: outdoor unit service valves and stem caps, flare connections, filter drier, and any lineset transitions.
3. Leak found and repaired: pressure test with nitrogen, evacuate, recharge to manufacturer spec by weight or to achieve 10–15°F subcooling in cooling mode.
4. After recharge: verify heat pump heating capacity improves. Suction pressure at 32°F OAT should rise to 65–80 psig range. Aux heat should cycle off when heat pump alone can maintain setpoint.
5. Homeowner communication (via tech): "The heat pump was running with low refrigerant, so your auxiliary electric heat was running much more than it should. After we repair and recharge the system, your heating bills should drop significantly."

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- EPA 608: Find and repair the leak before recharging.

### Source(s)
- R-410A pressure-temperature relationship — [refrigerantscenter.com/blogs/refrigerant-review/r410a-operating-pressures-charts-readings-and-best-practices](https://refrigerantscenter.com/blogs/refrigerant-review/r410a-operating-pressures-charts-readings-and-best-practices)
- Low charge diagnosis in heating mode — [hvacrschool.com/the-5-pillars-of-residential-ac-refrigerant-circuit-diagnosis](http://www.hvacrschool.com/the-5-pillars-of-residential-ac-refrigerant-circuit-diagnosis/)

---

## SCN-RES-048 — Daikin FTXS: E7 — Outdoor Fan Motor Stopped
**Equipment:** Daikin FTXS18LVJU / RXS18LVJU, R-410A
**Tech describes:** "E7 error. Outdoor fan not spinning. Compressor tries to run but trips off within a minute."

### Symptoms / readings
- Flash / fault code: **E7 = Outdoor fan motor stopped / DC fan lock / Input overcurrent detection** per Daikin error code documentation
- Outdoor fan: not rotating
- Compressor: brief start then trips (high head pressure from no outdoor fan)
- Head PSI: 410 psig (measured during brief run — climbing fast)
- Ambient OAT: 88°F
- Fan motor: not rotating when commanded

### Correct diagnosis
Outdoor DC fan motor failure. The EC/DC fan motor on Daikin RXS series units has failed to start or respond to the outdoor PCB command. Without condenser fan airflow, head pressure spikes and the compressor protection trips.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm E7 = outdoor fan motor fault per Daikin error code documentation.
2. With power OFF: attempt to spin the outdoor fan blade by hand. Should rotate smoothly and freely. Resistance or seized bearing = mechanical motor failure.
3. If fan spins freely by hand: the motor receives power but fails to operate. Check the DC fan motor power leads at the outdoor PCB — measure voltage when the unit is commanded to run. If voltage is present (typically 300–340VDC for DC inverter fan motors) and the motor does not run: motor has failed.
4. If no voltage at the fan motor leads: outdoor PCB is not generating the fan drive signal. Check for debris blocking the fan blade that caused the motor to draw locked rotor amps and fail the PCB fan driver.
5. Daikin DC fan motors are not field-repairable — replace the motor assembly.
6. After fan motor replacement, clear the E7 fault (power cycle) and verify the fan starts and achieves operating speed within 60 seconds of compressor startup.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- DC fan motors on inverter-driven systems can hold charge. Verify DC bus is below 50V before touching motor leads.

### Source(s)
- Daikin E7 error code — [minisplitsizer.com/daikin-mini-split-error-codes](https://minisplitsizer.com/daikin-mini-split-error-codes/)

---

## SCN-RES-049 — Cold-Climate Heat Pump (Mitsubishi MXZ-H): Operation at Extreme Low Ambient — Vapor Injection Active
**Equipment:** Mitsubishi MXZ-3C24NAHZ2 Hyper-Heat, R-410A, rated to -13°F
**Tech describes:** "It's -8°F outside. Homeowner says system is running but not keeping up. Aux heat is on. No fault codes. Is this normal?"

### Symptoms / readings
- Suction PSI: Very low for -8°F OAT (normal for extreme cold)
- Head PSI: Elevated (compressor working hard)
- Ambient OAT: -8°F
- Indoor supply air: 78°F (warm — system producing heat)
- Aux heat: running concurrently
- No fault codes
- Compressor: running at high speed (vapor injection active)

### Correct diagnosis
Normal cold-climate operation near the design limit. Mitsubishi Hyper-Heat MXZ-H series is rated to produce heat at 100% capacity to approximately 5°F and continues operating to -13°F. At -8°F, the system is working near its design floor and vapor injection (a flash injection circuit into the compressor mid-stage) is active to improve capacity. Aux heat concurrent operation is expected at these temperatures.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm no fault codes present — this is a performance inquiry, not a fault diagnosis.
2. Verify the system is the Hyper-Heat (NAHZ) variant rated to -13°F, not a standard MXZ rated to +5°F. The H suffix matters.
3. At -8°F, Mitsubishi Hyper-Heat maintains meaningful capacity but aux heat staging is expected. The system is not malfunctioning.
4. Check that vapor injection is operating: listen for the EVI (enhanced vapor injection) solenoid valve clicking in the outdoor unit. This is normal operation at deep cold temperatures.
5. Verify the aux heat capacity is adequate for the heating load at -8°F. If the home is still losing temperature despite both heat pump and aux running: this is a Manual J sizing issue, not a heat pump fault.
6. Check that backup heat output is correct (strip heaters or gas furnace) — that's where the capacity gap will be made up.
7. No further diagnostic action needed unless performance deviates from design spec.

### Safety flags
- NONE

### Source(s)
- Mitsubishi Hyper-Heat cold climate specs — [choosesanford.com/common-error-codes-for-mitsubishi-heat-pumps](https://choosesanford.com/common-error-codes-for-mitsubishi-heat-pumps/)
- Cold climate heat pump general operation — [acdirect.com/blog/r410a-heat-pump-buying-guide](https://www.acdirect.com/blog/r410a-heat-pump-buying-guide/)
- Mitsubishi MXZ technical service manual — [mitsubishitechinfo.ca/sites/default/files/SH_MXZ-...](https://www.mitsubishitechinfo.ca/sites/default/files/SH_MXZ-%284%29%285%29%288%29C%2836%29%2842%29%2848%29%2860%29NA%28HZ%29_PAC-MKA%2830%29%2831%29%2850%29%2851%29BC_OCH573E_1.pdf)

### Notes for Mike's tone / style
- Tech-facing: "Vapor injection click is your tell that the system is working correctly at deep cold. If you don't hear it, that's something to investigate."
- Homeowner-facing (via tech): "At -8°F, your heat pump is working harder than it's designed to run indefinitely. The backup heat kicking in is correct behavior."

---

## SCN-RES-050 — Carrier 25VNA: Fault 57 — Compressor Scroll Temp Out of Range
**Equipment:** Carrier Infinity 25VNA variable-speed heat pump, R-410A
**Tech describes:** "Fault 57 on the outdoor board. Scroll compressor discharge thermistor was replaced last month but fault came back."

### Symptoms / readings
- Fault code: **57 = "Compressor Scroll Temp Out of Range"** per Carrier 25VNA fault table
- Head PSI: 395 psig (borderline high)
- Suction PSI: 112 psig (slightly low)
- Superheat: 14°F (slightly elevated)
- Discharge line temp: 195°F (high — target <200°F, was higher before gauges)
- Ambient OAT: 92°F
- Compressor scroll temp sensor replaced: last month

### Correct diagnosis
Discharge temperature out of range from mild refrigerant undercharge. With suction at 112 psig (below normal 120+ psig) and superheat at 14°F (above target 8–12°F), the system is likely slightly undercharged, causing the compressor to run hotter than spec. The replaced sensor is likely reporting accurately — the problem is the operating condition.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm fault 57 = Compressor scroll temp out of range per Carrier 25VNA fault table.
2. The sensor was replaced and the fault returned — the sensor is probably not the issue. Look at the operating data instead.
3. Suction at 112 psig and superheat at 14°F with 92°F OAT: the system is slightly undercharged. Normal R-410A suction in cooling at 92°F ambient should be closer to 122–132 psig.
4. Add a small amount of refrigerant (4–6 oz) and verify suction rises to 120–130 psig range and superheat drops to 8–12°F.
5. After charge correction, allow the system to run for 20 minutes and verify fault 57 does not recur and discharge temperature stays below 180°F.
6. Find where the refrigerant went — this is a slow leak. Perform a leak check focusing on service valves and any recently serviced connections.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Carrier 25VNA Fault Code 57 — [manualslib.com/manual/860578/Carrier-25vna.html?page=12](https://www.manualslib.com/manual/860578/Carrier-25vna.html?page=12)


---

## SCN-RES-051 — LG Ductless: CH21 — Outdoor DC Peak Current (Compressor Overcurrent)
**Equipment:** LG LMU/LMN36CHV multi-zone ductless, R-410A
**Tech describes:** "CH21 on all indoor heads. Outdoor unit shuts off after about 2 minutes of running. New install, 3 months old."

### Symptoms / readings
- Flash / fault code: **CH21 = Outdoor unit DC peak current / compressor overcurrent protection** per LG HVAC Toolkit error code reference
- Head PSI: 380 psig (measured during 2-minute run window)
- Suction PSI: 125 psig
- Subcooling: 10°F (normal)
- Ambient OAT: 90°F
- System age: 3 months, no previous faults
- Compressor amp draw: 28A peak on startup (nameplate LRA ~45A, RLA ~18A)

### Correct diagnosis
Compressor overcurrent protection — at 3 months old, this is either a defective compressor (rare) or the inverter module is incorrectly calibrating the compressor startup profile. On a new LG multi-zone, CH21 within 90 days frequently indicates an inverter PCB issue.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm CH21 = outdoor DC peak current / compressor overcurrent per LG error code documentation.
2. Check the refrigerant charge — an overcharged system can cause the compressor to draw high current on startup by starting against elevated system pressures. Subcooling at 10°F is normal, so overcharge is not the cause.
3. Verify the outdoor unit wiring: undersized or long line-set power runs can cause voltage drop, which increases compressor current draw. Check that the power supply conductors are sized correctly per the LG installation manual.
4. Check the inverter PCB for fault code history — LG multi-zone outdoor units log fault history internally. Pull the history via the service port or service port diagnostic mode.
5. If power supply is correct, charge is correct, and fault recurs: the inverter PCB is the likely faulty component on a 3-month-old unit. This is a warranty repair — contact LG warranty support before condemning the board.
6. Do not run the system repeatedly into CH21 — each overcurrent event potentially stresses the compressor motor windings.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- Inverter module DC bus — wait 5 minutes, verify <50VDC before touching.

### Source(s)
- LG CH21 error code — [hvactoolkit.org/resources/error-codes/lg](https://hvactoolkit.org/resources/error-codes/lg)

---

## SCN-RES-052 — Samsung: E3xx Compressor Overcurrent — Locked Rotor at Startup
**Equipment:** Samsung AR24TXHQASINUA heat pump, R-410A
**Tech describes:** "E301 or similar 3xx code. Compressor not starting. Unit hums and trips. 5-year-old unit."

### Symptoms / readings
- Flash / fault code: **E3xx = Compressor overcurrent / inverter fault** per Samsung error code categories (E3xx series = compressor errors)
- Compressor: audible hum 3–4 seconds, then trips
- Head/suction: equalized (~175 psig — not running)
- Ambient OAT: 82°F
- Run capacitor (Samsung PSC-type models): 45 µF, tests 42 µF (within tolerance)
- Contactor (if applicable): pulling in
- System history: ran fine last fall, first startup this spring

### Correct diagnosis
Compressor locked rotor or hard-start condition from refrigerant migration during winter storage. Samsung residential ductless inverter compressors do not use run capacitors — the inverter drive handles starting. If the inverter cannot overcome startup torque (from liquid in the compressor), it trips on overcurrent.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm E3xx = compressor overcurrent/inverter fault category per Samsung error code structure.
2. First spring startup with equalized pressures and 5-year-old unit: refrigerant migration is the most likely cause.
3. Crankcase heating: Samsung ductless outdoor units typically have a crank heater that activates when the unit is in standby with power connected. If the unit was unplugged or the power was off all winter, the crankcase heater did not operate.
4. Apply heat to the compressor body (heat lamp, warm air from a forced air heater — not open flame) for 30–45 minutes to vaporize migrated refrigerant.
5. Attempt restart. If compressor starts after the heating treatment: crankcase heater installation or ensuring the power remains connected in winter will prevent recurrence.
6. If compressor still trips after warm-up: measure winding resistance. Inverter-driven compressors have three-phase windings (U, V, W terminals). All three should read the same resistance (typically 0.5–2 ohms). Any open winding = compressor replacement.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- Inverter PCB DC bus — wait 5 minutes after power removal.

### Source(s)
- Samsung E3xx error code categories — [hvactoolkit.org/resources/error-codes/samsung](https://hvactoolkit.org/resources/error-codes/samsung)
- Compressor slugging diagnosis — [achrnews.com/articles/114412-the-professor-flooding-and-slugging](https://www.achrnews.com/articles/114412-the-professor-flooding-and-slugging)

---

## SCN-RES-053 — Lennox iComfort: Alert Code — Discharge Line Temperature High (XP21)
**Equipment:** Lennox XP21 heat pump, R-410A, 4 years old
**Tech describes:** "iComfort thermostat showing high discharge temperature alert. Unit running but barely cooling at 95°F OAT. Previous tech added refrigerant twice this season."

### Symptoms / readings
- Discharge line temp: 218°F (approaching protection threshold of ~225°F)
- Suction PSI: 70 psig (significantly low at 95°F OAT — normal ~125 psig)
- Head PSI: 280 psig (low)
- Superheat: 36°F (very high)
- Subcooling: Not measurable
- Ambient OAT: 95°F
- Refrigerant added twice this season without locating a leak

### Correct diagnosis
Active refrigerant leak that was partially masked by adding refrigerant twice without finding the source. The extremely high superheat (36°F) and low suction combined with high discharge temperature indicate a severely undercharged system with a compressor running hot from inadequate refrigerant cooling of the motor windings.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Stop compressor operation immediately — discharge at 218°F with this suction pressure means the compressor is being cooked. Running further risks burning out the motor windings.
2. The fact that refrigerant was added twice and the system lost charge again means there is an active leak. Adding refrigerant to a known leaking system without repair is an EPA Section 608 violation.
3. Shut down, recover remaining refrigerant. Document total amount in system.
4. Perform a thorough nitrogen pressure test (isolate indoor and outdoor separately) to locate the leak. On 4-year-old XP21 systems, pay close attention to the outdoor micro-channel condenser coil for corrosion pinholes (aluminum fins fail faster near coastal environments or road salt areas).
5. Repair the leak. After repair, pressure-test for 30 minutes with nitrogen at 400 psig, evacuate to 300 microns, recharge by weight.
6. Document all work — this system has had an ongoing leak event and the history must be clear on the invoice.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- EPA 608: Repair leak before recharge. Running with severely low charge risks compressor motor burnout and refrigerant contamination (acid in the system from burnt oil).

### Source(s)
- Discharge temperature and refrigerant loss — [hvacrschool.com/the-5-pillars-of-residential-ac-refrigerant-circuit-diagnosis](http://www.hvacrschool.com/the-5-pillars-of-residential-ac-refrigerant-circuit-diagnosis/)
- EPA 608 leak repair requirements — [epa.gov/snap](https://www.epa.gov/snap/substitutes-residential-and-light-commercial-air-conditioning-and-heat-pumps)

### Notes for Mike's tone / style
- Tech-facing: "Two refrigerant adds without a leak repair is not service — that's just kicking the can. This time, find the leak first."

---

## SCN-RES-054 — Trane/American Standard: Hard Start Kit Need — PSC Compressor Won't Start
**Equipment:** American Standard 4A7A5036 single-stage split AC, R-410A, 10 years old
**Tech describes:** "Compressor hums 2-3 seconds then trips on thermal overload. Replaced the run capacitor yesterday — same problem. Pressures are equalized."

### Symptoms / readings
- Run capacitor: brand new, 45+5 µF, tests correctly
- Compressor: hums 3 seconds, thermal overload trips
- Suction/head pressure: equalized (~175 psig)
- Ambient OAT: 88°F
- Compressor startup amps (measured with clamp): 58A peak (nameplate LRA: 72A)
- Hard-start kit: not installed

### Correct diagnosis
The compressor needs a hard-start kit (start capacitor + potential relay). At 10 years old with equalized pressures, the compressor motor is starting under load and drawing high amps but the run capacitor alone is insufficient to provide adequate starting torque. A hard-start kit adds a start capacitor that provides extra torque for the first 100–300 milliseconds of startup.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. New run capacitor did not fix the problem — starting torque is the issue, not run torque.
2. Verify the pressures have equalized (they have). The compressor should be starting against equal suction and head pressure — the best condition for startup. If it can't start here, it has degraded starting capability.
3. Install a hard-start kit (start capacitor + relay, sized for the compressor's start capacitor rating per the hard-start kit manufacturer's guide — typically 88–108 µF for a 3-ton compressor).
4. After hard-start installation: attempt startup. The compressor should start cleanly without humming. Measure startup amps — should peak and rapidly drop to RLA within 1–2 seconds.
5. If compressor starts with hard-start kit: this is the repair. Inform the contractor that the compressor is aging and the hard-start kit extends its life but does not address the underlying mechanical wear.
6. If compressor still trips with hard-start: windings are failing. Measure winding resistance (COMM-START, COMM-RUN). Resistance dropping outside spec = motor winding deterioration. Compressor replacement is needed.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Hard-start kit and locked rotor — [hvacprosales.com/blog/ac-compressor-hard-lockout-can-it-be-saved](https://hvacprosales.com/blog/ac-compressor-hard-lockout-can-it-be-saved/)
- Start capacitor facts — [hvacrschool.com/start-capacitor-inrush-facts-myths-part-4](https://www.hvacrschool.com/start-capacitor-inrush-facts-myths-part-4/)

---

## SCN-RES-055 — Bard CH4S1: Code 3 — Defrost Mode Active (Normal)
**Equipment:** Bard CH4S1 wall-mounted heat pump, R-410A
**Tech describes:** "Homeowner says unit is blowing cold air. Went to check and got Code 3 on the control LED. Is this a problem?"

### Symptoms / readings
- Flash code: **Code 3 = Defrost mode active** per Bard CH4S1 Installation Instructions Manual, Table 4
- Ambient OAT: 30°F
- Outdoor coil: was visibly frosted before defrost initiated
- Indoor air: temporarily cool (during defrost cycle, system runs in cooling briefly to heat the outdoor coil)
- Homeowner complaint: "unit blowing cold air"

### Correct diagnosis
Normal defrost cycle — this is NOT a fault. Code 3 on Bard CH4S1 is an informational indicator that the unit is actively defrosting the outdoor coil. During defrost, the reversing valve shifts to cooling mode to push hot refrigerant through the outdoor coil to melt the frost. Indoor air temporarily gets cooler (or warm if auxiliary heat is staged).

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm Code 3 = Defrost mode active per Bard CH4S1 installation manual. This is NOT a fault — it is a status indicator.
2. Explain to the homeowner (via tech) what defrost mode is: "In heating mode, the outdoor coil gets cold and ice builds up on it. The system has to periodically reverse to melt that ice. During those few minutes, some cooler air comes through the vents. That's normal."
3. Verify the defrost cycle completes normally: defrost should end within 10 minutes. After defrost, the system should return to heating mode and the Code 3 LED should stop.
4. If Code 3 stays on for more than 15 minutes without completing: suspect a stuck defrost board or a failed defrost termination sensor (unit is locked in defrost). That is a fault.
5. Verify defrost termination: the defrost cycle should end when the outdoor coil temperature reaches approximately 60–65°F (sensed by the defrost termination thermostat). If the coil clears but the LED stays on Code 3: defrost board or termination thermostat issue.

### Safety flags
- NONE (for normal defrost cycle)
- ELECTRICAL_HIGH_VOLTAGE for any board or sensor access.

### Source(s)
- Bard CH4S1 LED codes — [manualslib.com/manual/452517/Bard-Ch4s1.html?page=21](https://www.manualslib.com/manual/452517/Bard-Ch4s1.html?page=21)

### Notes for Mike's tone / style
- Tech-facing: "Your first job on a 'no heat' call in winter is to determine whether the unit is in defrost. That's not a service issue."
- Homeowner-facing: Never say "the unit is broken" before confirming what code 3 means. This is a normal operation call.

---

## SCN-RES-056 — Carrier/Bryant/Payne: Micro-Channel Condenser Coil Leak (Coastal Installation)
**Equipment:** Bryant 186BNH060 heat pump (micro-channel condenser), R-410A, coastal installation (within 0.5 miles of ocean)
**Tech describes:** "Unit's only 3 years old. Low on charge. Can't find the leak. Losing a pound a season."

### Symptoms / readings
- Suction PSI: 95 psig (low for cooling at 85°F OAT)
- Head PSI: 270 psig
- Superheat: 22°F (elevated)
- Subcooling: 6°F
- Ambient OAT: 85°F
- Location: beach community, 0.5 miles from ocean
- Coil material: aluminum micro-channel condenser

### Correct diagnosis
Salt-air corrosion pinholes in the micro-channel aluminum condenser coil. Aluminum micro-channel coils degrade rapidly in coastal environments. The coil is too thin for liquid leak detection but can be confirmed with nitrogen pressure testing isolated to the outdoor coil.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Perform nitrogen pressure test isolated to the outdoor unit: close the service valves, pressurize the outdoor coil to 150 psig with nitrogen, check with soap bubbles on the coil faces. Micro-channel coils develop tiny pinholes — look for fine bubbling on the flat face of the coil.
2. Confirm salt corrosion: white/grey powdery deposits on the aluminum fins and tubes indicate salt corrosion.
3. Micro-channel coil pinholes are not field-repairable (no brazing access to the micro-channels). Condenser coil replacement is required.
4. After coil replacement: recommend application of a coil corrosion coating (e.g., Heresite or similar) to the new micro-channel coil. This significantly extends coil life in coastal environments.
5. Note: Bryant/Carrier offers specific coastal installation guidelines for micro-channel coils. If the unit was installed within 0.5 miles of salt water without the appropriate coil coating, this may be a warranty or installation standard dispute.
6. Inform the contractor (not homeowner directly) about the coastal installation coil issue. The contractor decides how to handle the warranty/remediation conversation.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Micro-channel coil coastal corrosion — [acservicetech.com/post/where-to-find-r-22-r410a-leaks-on-ac-units-top-10-spots](https://www.acservicetech.com/post/where-to-find-r-22-r410a-leaks-on-ac-units-top-10-spots)

---

## SCN-RES-057 — Goodman/Amana Communicating: Code b9 — Blower Motor / Restrictive Ductwork
**Equipment:** Goodman GSXC18048 / AMEC36BX1 communicating system, R-410A
**Tech describes:** "b9 code on the air handler. Blower is running but at low speed. Indoor static is through the roof."

### Symptoms / readings
- Flash / fault code: **b9 = Indoor blower motor problem / blocked filters / restrictive or undersized ductwork / indoor-outdoor unit mismatch** per Goodman communicating system codes
- Indoor external static pressure: 0.85 in. WC (very high — target typically ≤0.50 in. WC)
- Air filter: just replaced (clean)
- Ductwork: original 1990s supply trunk with recent high-SEER retrofit
- Blower motor: ECM variable-speed, running but at reduced RPM

### Correct diagnosis
b9 from restrictive ductwork — the ECM blower on the communicating system is reducing speed in response to detected motor overcurrent from fighting excessive static pressure. The 1990s ductwork is undersized for the new high-SEER system's airflow requirements.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm b9 = blower motor protection / restrictive ductwork per Goodman communicating system documentation.
2. Measure external static pressure with a manometer (supply + return). At 0.85 in. WC, the duct system is severely undersized for this air handler. Target for most residential systems is ≤0.50 in. WC at design airflow.
3. The ECM motor is smart — it ramps down speed when it detects excessive current (from fighting static). The system is protecting itself, not failing.
4. Identifying the specific restriction: check supply trunk at the air handler outlet (often a sharp 90° from a horizontal AHU), check return duct size and grille size, check for any flex duct pinching or sharp turns.
5. This is a ductwork design problem, not an equipment failure. The fix is duct modification (adding a trunk run, enlarging grilles, replacing undersized flex duct sections) — a Manual D calculation would identify the specific constraints.
6. Inform the contractor: "b9 is the system telling you the duct system needs work, not that the equipment is bad."

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Goodman b9 fault code — [twintechheating.ca/goodman-air-conditioner-error-codes](https://twintechheating.ca/goodman-air-conditioner-error-codes/)
- ACCA Manual D duct design — [acca.org](https://www.acca.org)

---

## SCN-RES-058 — Rheem/Ruud: Heat Pump Defrost Failure — Defrost Board Not Initiating
**Equipment:** Ruud RPLB-048JEZ heat pump, R-410A
**Tech describes:** "Outdoor coil completely iced over in heating mode. OAT is 28°F. Defrost never fires. Tried the jump-test terminals — nothing happens."

### Symptoms / readings
- Suction PSI: 38 psig (very low — coil is completely blocked with ice)
- Head PSI: 180 psig
- Ambient OAT: 28°F
- Outdoor coil: solid ice block, including fan shroud
- Defrost board test terminals: jumped for 2 seconds — no defrost initiation
- 24VAC at transformer: 26VAC (good)
- 24VAC at defrost board power terminals: 26VAC (good)

### Correct diagnosis
Defrost board failure. With 24VAC confirmed at the board and the manual TEST terminal jump producing no response, the defrost control board is not functioning. This is not a sensor issue — the board itself has failed.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. 24VAC is present and the manual TEST jump produced no response — the defrost board is not functioning.
2. Before condemning the board, verify the wiring: check all connector plugs on the defrost board for proper seating. A partially unseated 4-pin connector can cause exactly this symptom.
3. Manually check the reversing valve solenoid operation: disconnect the O terminal from the defrost board and apply 24VAC directly to the reversing valve solenoid. If the reversing valve clicks (mode change audible), the solenoid works — the board is not triggering it.
4. Check the defrost initiation thermistor independently: disconnect and measure resistance. At 28°F OAT with the coil at near 0°F, the thermistor should be closed (low resistance). An open thermistor prevents defrost initiation but the manual TEST jump should bypass the thermistor on most Ruud boards.
5. If TEST jump bypasses sensors but board still doesn't initiate defrost: defrost board replacement.
6. Allow the coil to thaw before restarting — forced fan operation for 20–30 minutes may be needed to melt the ice before attempting to restart.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- Do NOT use a heat gun or torch to thaw the coil — risk of fire and PCB damage from rapid temperature change.

### Source(s)
- Rheem/Ruud defrost board diagnosis — [pdf4pro.com/amp/view/econet-and-flash-codes-myrheem-com-735958.html](https://pdf4pro.com/amp/view/econet-and-flash-codes-myrheem-com-735958.html)
- Heat pump defrost troubleshooting steps — [hvacrschool.com/heat-pump-defrost-troubleshooting-tips](http://www.hvacrschool.com/heat-pump-defrost-troubleshooting-tips/)

---

## SCN-RES-059 — Mitsubishi Ductless: P1 — Return Air Thermistor Fault (TH1)
**Equipment:** Mitsubishi MSZ-FH12NA / MUZ-FH12NA, R-410A
**Tech describes:** "P1 error. Temperature in the room is 85°F but the wall unit isn't running. Just installed a new filter."

### Symptoms / readings
- Flash / fault code: **P1 = Return air thermistor (TH1) abnormality** per Mitsubishi P-series error documentation
- Recent service: new filter installed (filter was removed and reinstalled)
- Room temperature: 85°F (homeowner confirms room is hot)
- Indoor unit: not running, P1 flashing
- P1 can indicate: TH1 disconnected, open, shorted, or out of expected range

### Correct diagnosis
Return air thermistor (TH1) connector was not reseated properly during the filter service. TH1 is typically mounted near the air intake of the indoor unit — the exact location a tech touches when accessing the filter.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm P1 = return air thermistor (TH1) fault per Mitsubishi error code documentation.
2. The timing correlation is clear: P1 appeared after filter replacement. The TH1 sensor connector was likely dislodged when the filter was removed.
3. Remove the indoor unit front cover. Locate the TH1 thermistor — a small sensor typically mounted in the return air stream behind the filter or on the evaporator inlet.
4. Check that the thermistor connector is fully seated on the indoor PCB. Press it firmly into its socket.
5. Power cycle the indoor unit. If P1 was caused by a disconnected sensor, the fault should clear immediately.
6. If P1 persists after reseating the connector: measure TH1 resistance. At 85°F, an NTC thermistor should read approximately 5–7 kΩ. Out-of-range = sensor replacement.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Mitsubishi P1 return air thermistor fault — [beaconsaves.com/blog/mitsubishi-mini-split-p9-error-code](https://www.beaconsaves.com/blog/mitsubishi-mini-split-p9-error-code) [P9 article references P-series sensor codes]
- Mitsubishi error code documentation — [orionair.co.uk/PDF/Mitsubishi_elec_Fault_codes.pdf](https://orionair.co.uk/PDF/Mitsubishi_elec_Fault_codes.pdf)

---

## SCN-RES-060 — Daikin: A3 — Condensate Drain Clog (Indoor Drain Overflow)
**Equipment:** Daikin FTXS24LVJU wall-mounted mini-split, R-410A
**Tech describes:** "A3 error. Indoor unit dripping water. Homeowner says it started yesterday when it rained a lot."

### Symptoms / readings
- Flash / fault code: **A3 = Clogged condensate drain — drain level too high** per Daikin error code documentation
- Indoor unit: dripping water from the front panel
- Ambient OAT: 82°F, high humidity (post-rain)
- Drain line: exits through wall to exterior
- Drain pan: visually full of water

### Correct diagnosis
Clogged or restricted condensate drain line. High humidity operation produced more condensate than normal, overwhelming a partially blocked drain. The A3 fault is the float switch or drain sensor detecting drain pan overflow.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm A3 = clogged condensate drain per Daikin error code documentation.
2. Access the indoor unit's drain pan (remove front cover, filter, and front panel). Manually empty the drain pan with a towel or vacuum.
3. Find the drain outlet — typically a 3/4" PVC line exiting through the wall to the exterior.
4. Blow compressed air through the drain line (from the unit toward the exterior) to clear any algae, debris, or insect nest blockage.
5. Pour 1 cup of water into the drain pan and verify it drains freely out the exterior drain terminus. If it backs up: the blockage is still present. Repeat blowout.
6. Preventive maintenance: pour a cup of diluted bleach (1:10 ratio) into the drain pan monthly during cooling season to prevent algae growth.
7. After clearing the drain: power cycle and clear the A3 fault (power off/on via remote). Verify no recurrence.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- Water around electrical equipment: verify drain pan is dry before energizing the unit.

### Source(s)
- Daikin A3 drain fault — [minisplitsizer.com/daikin-mini-split-error-codes](https://minisplitsizer.com/daikin-mini-split-error-codes/)


---

## SCN-RES-061 — Trane/American Standard: 4-Flash — Defrost Mode Indicator (Normal Status)
**Equipment:** Trane XR14 heat pump, R-410A
**Tech describes:** "Customer called about a 4-flash on the outdoor unit. No heat complaint. Just noticed the flashing."

### Symptoms / readings
- Flash code: **4 flashes = Defrost Mode Active** per Trane residential heat pump LED code chart
- Ambient OAT: 28°F
- System: running in heating mode, producing normal output
- No other faults in history

### Correct diagnosis
Normal operation — 4-flash on Trane residential heat pumps indicates the defrost cycle is actively running. This is not a fault or error condition. The system is working correctly.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm 4-flash = Defrost Mode Active (not a fault) per Trane residential heat pump LED code reference.
2. Observe the system: defrost should complete within 10 minutes. After defrost, the LED should return to normal steady or slow flash pattern.
3. If the customer called because of the flash, educate: "The 4-flash code means the defrost cycle is running. That's normal in below-freezing weather."
4. Only escalate to diagnostic investigation if: the 4-flash never clears (stuck in defrost), the unit stays in defrost for over 15 minutes, or the system is not producing adequate heat outside of defrost cycles.

### Safety flags
- NONE

### Source(s)
- Trane 4-flash = Defrost Mode Active — [heatpumppricesreviews.com/trane-heat-pump-led-codes](https://www.heatpumppricesreviews.com/trane-heat-pump-led-codes/)

### Notes for Mike's tone / style
- Tech-facing: "Make sure your techs know the informational flash codes vs fault flash codes. A 4-flash call-back is a wasted truck roll."

---

## SCN-RES-062 — LG Ductless: CH07 — Indoor BLDC Fan Motor Error
**Equipment:** LG LMN24CHV ceiling cassette, R-410A
**Tech describes:** "CH07 on the display. Unit not running. Fan blade is accessible through the grille — I can see it."

### Symptoms / readings
- Flash / fault code: **CH07 = Indoor unit BLDC fan motor error** per LG error code documentation
- Indoor unit type: ceiling cassette
- Fan blade: visible through grille opening, appears to have debris on it

### Correct diagnosis
BLDC fan motor fault — could be motor failure or physical obstruction. Debris in the fan assembly is often the cause of CH07 on ceiling cassettes in commercial environments.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm CH07 = Indoor BLDC fan motor error per LG HVAC Toolkit documentation.
2. Before accessing any electrical components, power down the unit at the breaker.
3. Check for debris through the grille: a piece of cardboard, plastic packaging, or similar material caught in the fan blade is a common cause of CH07 in commercial settings (ceiling cassettes above storage areas).
4. If accessible through the grille: carefully remove debris. Try to turn the fan blade by hand — it should rotate freely with slight resistance.
5. Restore power and attempt to restart. If the fan now runs: debris was the cause.
6. If CH07 persists with no visible obstruction and the fan blade spins freely by hand: the BLDC motor itself has failed. On ceiling cassette units, the motor replacement requires removing the cassette from the ceiling — coordinate ceiling access with building management.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE — confirm power is off before any access.

### Source(s)
- LG CH07 error code — [hvactoolkit.org/resources/error-codes/lg](https://hvactoolkit.org/resources/error-codes/lg)

---

## SCN-RES-063 — Bosch IDS Ultra: R-454B System — First Startup Verification Protocol
**Equipment:** Bosch IDS Ultra 3-ton, R-454B (A2L), new installation
**Tech describes:** "Just completed installation. Ready to start it up. Any specific steps for A2L first startup?"

### Symptoms / readings
- System: brand-new installation, not yet started
- Refrigerant: R-454B (A2L, mildly flammable)
- Lineset: brazed connections completed, nitrogen pressure test completed (400 psig, 30-minute hold — passed)
- Evacuation: system evacuated to 300 microns
- Pre-charge: factory-precharged outdoor unit, additional charge for lineset length calculated

### Correct diagnosis
This is a first-startup verification protocol for an A2L system — not a fault scenario. R-454B systems require additional verification steps beyond standard R-410A startups.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Verify refrigerant type on the equipment nameplate and factory charge sticker — confirm R-454B.
2. Before opening refrigerant circuit: verify A2L leak detector is available and operational. Infrared (IR) or electrochemical detectors rated for A2L are required per HVAC Toolkit A2L safety guide.
3. Confirm no ignition sources within 10 feet of the outdoor unit during initial startup: no open flames, no arc-producing tools, no active welding nearby.
4. Open the liquid and suction service valves per Bosch IDS Ultra installation manual procedure.
5. If additional charge was added: verify the cylinder used was an R-454B cylinder (red stripe, left-hand threads) and NOT an R-410A cylinder.
6. Power up the system. Allow the 3-minute anti-short-cycle delay before compressor starts.
7. Verify operating parameters: R-454B has slightly different pressure-temperature characteristics than R-410A. Use an R-454B P-T chart (built into most digital manifolds with 2026 refrigerant profiles). Target subcooling 8–12°F, superheat 8–15°F.
8. Scan all accessible connections with the A2L leak detector before leaving the site.

### Safety flags
- A2L_REFRIGERANT
- ELECTRICAL_HIGH_VOLTAGE
- **REQUIRED:** A2L-rated leak detector on-site for first startup. Eliminate ignition sources before opening system. Use A2L-rated recovery machine only.

### Source(s)
- Bosch IDS Ultra R-454B installation — [bosch-homecomfort.com/us/en/residential/knowledge/a2l-refrigerant-change-guide](https://www.bosch-homecomfort.com/us/en/residential/knowledge/a2l-refrigerant-change-guide/)
- A2L safety guide — [hvactoolkit.org/resources/a2l-safety](https://hvactoolkit.org/resources/a2l-safety)
- A2L equipment requirements — [cedarshvac.com/r454b-refrigerant-guide](https://cedarshvac.com/r454b-refrigerant-guide/)

---

## SCN-RES-064 — York/Coleman: LOP Fault — Low-Side Pressure at Metering Device Orifice
**Equipment:** York YZF036 heat pump, R-410A, fixed orifice metering
**Tech describes:** "LOP fault showing. Low suction. But charge is fine — I checked it last week."

### Symptoms / readings
- Flash / fault code: **LOP = Low-side pressure below safe limits** per York heat pump diagnostics
- Suction PSI: 52 psig (low for 85°F OAT cooling)
- Head PSI: 295 psig
- Superheat: 32°F (very high for fixed orifice system)
- Subcooling: 14°F (relatively normal)
- Charge: "verified last week" per tech
- Ambient OAT: 85°F
- Metering device: fixed orifice (piston)

### Correct diagnosis
Restricted orifice (piston) metering device — not a charge issue. The fixed orifice piston is either clogged with debris/particles from the system or has partially failed. Subcooling at 14°F means refrigerant is present but the metering device is not allowing it to flow through at the correct rate.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm LOP = low pressure fault per York heat pump diagnostics.
2. Pattern analysis: subcooling is normal-to-slightly-high (meaning charge is present in the liquid line) but suction is low and superheat is very high. This is a classic metering device restriction, not low charge.
3. Locate the orifice piston (typically at the indoor coil inlet). On York systems with fixed orifice metering, the piston is in a fitting at the inlet of the indoor coil distributor.
4. Remove the piston and inspect: look for copper oxide, oil residue with debris, or physical deformation of the orifice hole. Even a 20% reduction in orifice diameter significantly reduces flow.
5. Clean or replace the piston. If a filter-drier is not present upstream of the metering device, install one as part of this repair.
6. System should not need recharging after piston replacement if charge was confirmed intact and no refrigerant was lost.
7. After piston replacement: verify suction rises to 110–125 psig and superheat drops to 10–20°F (fixed orifice systems have wider superheat variation than TXV systems).

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- York LOP fault — [pickcomfort.com/york-heat-pump-error-codes-troubleshooting](https://www.pickcomfort.com/york-heat-pump-error-codes-troubleshooting/)
- Orifice restriction diagnosis patterns — [hvacrschool.com/the-5-pillars-of-residential-ac-refrigerant-circuit-diagnosis](http://www.hvacrschool.com/the-5-pillars-of-residential-ac-refrigerant-circuit-diagnosis/)

---

## SCN-RES-065 — Carrier Infinity: Fault 49 — Suction Temp Sensor Fault
**Equipment:** Carrier Infinity 24VNA6 heat pump, R-410A
**Tech describes:** "Fault 49 on the outdoor board. System running but controls are acting erratic."

### Symptoms / readings
- Fault code: **49 = "Suction Temp Sensor Fault"** per Carrier 25VNA fault code table
- System: running but not optimizing speed correctly
- Compressor speed: hunting/oscillating
- Suction line temperature (measured with clamp probe): 48°F
- Ambient OAT: 80°F
- Suction pressure: 108 psig (saturation temp ~38°F — suction line is 10°F superheat, which is correct, but the board is reporting a sensor fault)

### Correct diagnosis
Suction temperature sensor fault — the sensor that provides suction line temperature to the inverter control for superheat calculation and compressor speed modulation has drifted out of range or failed. The system is running but can't modulate correctly without accurate suction temperature data.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm fault 49 = suction temp sensor fault per Carrier 25VNA fault table.
2. Locate the suction temperature sensor — on Carrier 24VNA variable-speed units, the suction thermistor is typically clamped to the suction line at the outdoor unit.
3. Verify the sensor clamp is tight against the suction line and insulated. A loose or uninsulated sensor reads ambient air temperature, not suction line temperature. This causes the board to report an out-of-range reading.
4. Measure sensor resistance: compare to expected value at the measured suction line temperature (48°F suction → check Carrier NTC chart for expected resistance at that temperature).
5. If sensor is properly mounted and resistance is within spec: fault 49 may be an intermittent contact issue at the connector. Clean and reseat the sensor connector on the outdoor PCB.
6. If sensor resistance is out of spec: replace sensor with Carrier-specified replacement part.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Carrier 25VNA Fault Code 49 — [manualslib.com/manual/860578/Carrier-25vna.html?page=12](https://www.manualslib.com/manual/860578/Carrier-25vna.html?page=12)

---

## SCN-RES-066 — Rheem/Ruud: Dual LED — Ambient Sensor Failure
**Equipment:** Rheem RPNL heat pump, R-410A
**Tech describes:** "LED1 off / LED2 steady on. Defrost board. System running strangely — going into defrost in July."

### Symptoms / readings
- Flash code: **LED1 Off / LED2 On = Ambient sensor failure** per Rheem RPNE/RPNL diagnostic chart
- Ambient OAT: 92°F (July)
- System: entering defrost cycle incorrectly in cooling mode conditions (defrost only appropriate in heating mode below ~40°F OAT)

### Correct diagnosis
Ambient temperature sensor failure — the sensor has failed in a way that makes the defrost board "think" the outdoor temperature is below the defrost threshold, triggering inappropriate defrost cycles in summer.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm LED1 Off / LED2 On = ambient sensor failure per Rheem dual-LED diagnostic chart.
2. The system going into defrost in July at 92°F confirms the sensor is feeding the control incorrect data (reporting very low temperature).
3. Locate the ambient temperature sensor on the outdoor unit — typically near the outdoor coil inlet.
4. Measure resistance: at 92°F, the NTC thermistor should read approximately 3–5 kΩ. A shorted thermistor (near zero ohms) would read as a very cold temperature, causing the defrost board to initiate defrost.
5. Replace the ambient sensor. After replacement, run the system through one complete cooling cycle and verify defrost does NOT initiate at 92°F.
6. Also verify the system operates correctly: at 92°F OAT, a heat pump in cooling mode should not enter defrost under any circumstances.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Rheem RPNE/RPNL ambient sensor failure code — [ghac.makekb.com/entry/677/](https://ghac.makekb.com/entry/677/)

---

## SCN-RES-067 — Mitsubishi Hyper-Heat: E9 — Outdoor Air Sensor Fault
**Equipment:** Mitsubishi MUZ-FH24NAH Hyper-Heat outdoor unit, R-410A
**Tech describes:** "E9 fault. Unit shut down. OAT is 15°F and homeowner has no heat."

### Symptoms / readings
- Flash / fault code: **E9 = Outdoor air sensor (outdoor ambient thermistor) malfunction** per Mitsubishi error code documentation
- Ambient OAT: 15°F
- Indoor temperature: 58°F and falling (no heat)
- Outdoor unit: locked out on E9

### Correct diagnosis
Outdoor ambient air thermistor failure. This sensor is critical for Hyper-Heat operation at low ambient — the system uses it to determine when to engage enhanced vapor injection and how to modulate compressor speed for cold-climate performance. A failure at 15°F means the unit cannot operate safely.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm E9 = outdoor air sensor fault per Mitsubishi error code documentation. Note: E9 is a high-priority fault in cold climates because the homeowner has no heat.
2. Locate the outdoor air sensor (ambient thermistor) on the MUZ-FH24NAH — typically positioned at the outdoor coil inlet to measure incoming air temperature.
3. Measure resistance: at 15°F, a Mitsubishi outdoor ambient thermistor should read approximately 25–35 kΩ (high resistance at low temperature for NTC sensors). Open or extremely out-of-range = sensor failure.
4. Replace the outdoor ambient thermistor. This is a stocked wear part for Mitsubishi service technicians.
5. After replacement: clear fault via remote (hold OFF button for 5 seconds on some models, or power cycle), verify E9 clears, and confirm the system returns to heating mode.
6. Priority escalation: This is a winter emergency service call. Get the system running or enable backup heat (recommend homeowner use portable electric heaters to prevent pipe freeze while awaiting repair).

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- Cold-weather safety: 15°F outdoor temperature with no heat is a pipe-freeze risk. Advise homeowner on pipe freeze prevention while awaiting parts.

### Source(s)
- Mitsubishi E9 outdoor sensor error — [choosesanford.com/mitsubishi-ductless-mini-split-e9-error-code](https://choosesanford.com/mitsubishi-ductless-mini-split-e9-error-code)

---

## SCN-RES-068 — Goodman/Daikin SEER2 R-454B New Installation: A2L Pre-Startup Safety Checklist
**Equipment:** Goodman GSZH6 (R-454B A2L) / ASPT air handler, new installation 2025+
**Tech describes:** "New 2025 Goodman R-454B system going in. Never worked on A2L before. What do I need to know?"

### Symptoms / readings
- System: brand new, post-2025 production R-454B equipment
- Tech's experience: first A2L installation
- Available equipment: standard R-410A manifold gauges, standard heated-diode leak detector, standard recovery machine (not A2L-rated)

### Correct diagnosis
Pre-startup safety education — this tech does NOT have the correct equipment to safely service R-454B (A2L) systems with what they've described.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. **STOP** — the tech's stated equipment is not suitable for R-454B. Do NOT proceed until appropriate A2L equipment is on-site.
2. Required equipment that the tech does NOT have:
   - A2L-rated recovery machine (UL60335-2-91 certified) — standard R-410A machines are NOT A2L-rated.
   - A2L-compatible leak detector: infrared (IR) or electrochemical — heated diode detectors are NOT approved for A2L per HVAC Toolkit.
   - A2L-rated recovery cylinders (red stripe, left-hand threads).
   - Digital manifold gauge with R-454B refrigerant profile.
3. Safety rules for A2L work on-site:
   - No open flames within 10 feet of open refrigerant circuit.
   - Eliminate all arc-producing power tools near open refrigerant.
   - Always recover — never vent. "Never vent A2L refrigerants" per A2L Safety Guide.
   - Purge with nitrogen before brazing.
   - Keep A2L recovery tanks below 80% full.
4. After getting correct equipment: proceed with standard good installation practices (nitrogen pressure test, deep evacuation to ≤300 microns, charge by weight with R-454B).
5. As of January 1, 2025, all new residential HVAC equipment must use low-GWP refrigerants (including R-454B). Every tech servicing new equipment needs A2L safety training.

### Safety flags
- A2L_REFRIGERANT
- ELECTRICAL_HIGH_VOLTAGE
- **REQUIRED PROTOCOL:** Do not proceed without A2L-rated equipment. Heating diode detectors and non-rated recovery machines are prohibited.

### Source(s)
- A2L Safety Guide — [hvactoolkit.org/resources/a2l-safety](https://hvactoolkit.org/resources/a2l-safety)
- R-454B tech requirements — [cedarshvac.com/r454b-refrigerant-guide](https://cedarshvac.com/r454b-refrigerant-guide/)
- 2025 refrigerant regulations — [servicemag.org/guides/r410a-phase-down-hvac-technicians](https://www.servicemag.org/guides/r410a-phase-down-hvac-technicians)

---

## SCN-RES-069 — Samsung Ductless: E5xx — High Pressure Protection Trip
**Equipment:** Samsung AR24TXHQASINUA ductless heat pump, R-410A
**Tech describes:** "E5 series code. High pressure alarm. System tripped off. Unit is in a mechanical room with other equipment."

### Symptoms / readings
- Flash / fault code: **E5xx = High pressure protection** per Samsung error code categories (E5xx = System Protection)
- Head PSI: 415 psig (when running before trip)
- Suction PSI: 120 psig
- Subcooling: 14°F (slightly elevated)
- Ambient OAT: 80°F (outdoor)
- Indoor unit location: mechanical room with server racks, high heat load
- Condenser fan: running

### Correct diagnosis
E5xx high pressure protection triggered by high return air temperature to the indoor unit in a hot mechanical room. The indoor unit is processing 90°F+ return air (from server heat), causing the refrigerant system to work harder than expected, pushing head pressure up. This is an application mismatch — the Samsung ductless unit is not sized or designed for a high-heat server room environment.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm E5xx = high pressure protection per Samsung error code documentation.
2. Measure the return air temperature at the indoor unit intake. If it's 90°F+ (from server/equipment heat), the indoor coil is being asked to cool a much higher temperature than the system was sized for.
3. The outdoor conditions (80°F, normal) are not the cause. This is an indoor application problem.
4. Determine the design condition: what was the room temperature when the system was selected? If the room was expected to be 78°F and it's actually 95°F (from added servers), the system is undersized.
5. Short-term fix: Increase the indoor unit's cooling setpoint to reduce load cycling frequency, improve mechanical room ventilation to pre-cool incoming air.
6. Inform the contractor: "This is an application sizing issue. The Samsung ductless unit is running at its design limit because the mechanical room heat load exceeds what the system was sized for."

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Samsung E5xx high pressure protection — [hvactoolkit.org/resources/error-codes/samsung](https://hvactoolkit.org/resources/error-codes/samsung)

---

## SCN-RES-070 — Rheem/Ruud: Heat Pump Schrader Valve Core Leak — Slow Charge Loss
**Equipment:** Ruud UPMB-030JAZ heat pump, R-410A
**Tech describes:** "Found this unit 6 oz low on charge. No obvious leak. Last service was 8 months ago with a charge check."

### Symptoms / readings
- Suction PSI: 105 psig (slightly below normal — 115 psig expected at 85°F)
- Head PSI: 280 psig
- Superheat: 18°F (slightly elevated)
- Subcooling: 6°F (slightly low)
- Ambient OAT: 85°F
- Service port caps: one missing from the suction Schrader valve

### Correct diagnosis
Slow refrigerant leak from a Schrader valve core — the missing service port cap on the suction line service port is the likely leak point. Schrader valve cores leak through the valve's rubber seat when the cap is missing and exposed to weather and UV.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. The missing cap is a red flag. Schrader valve cores are the most commonly overlooked leak source per field service data.
2. With the system off and pressurized: apply soap bubbles directly to the open Schrader valve port (without connecting gauges). Even a slow Schrader leak will show small bubbles within 30 seconds.
3. If the Schrader is leaking: close the manifold gauges, use a Schrader valve tool to replace the core (available in multi-packs). Replace both the suction and liquid line Schrader cores while you have the tool out.
4. Always install a new cap with an internal rubber gasket on every Schrader port after service. Metal-to-metal caps without gaskets do not seal against refrigerant.
5. After Schrader repair: verify with soap bubbles again under pressure.
6. Add the 6 oz of R-410A that was lost (charge to correct subcooling). Verify suction returns to 115–120 psig and superheat to 8–12°F.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- EPA 608: Even small Schrader leaks are reportable if above EPA threshold. Document.

### Source(s)
- Schrader valve as top leak location — [acservicetech.com/post/where-to-find-r-22-r410a-leaks-on-ac-units-top-10-spots](https://www.acservicetech.com/post/where-to-find-r-22-r410a-leaks-on-ac-units-top-10-spots)

---

## SCN-RES-071 — Lennox XP21: Compressor Short-Cycling — Anti-Short-Cycle Timer
**Equipment:** Lennox XP21-060 heat pump, R-410A
**Tech describes:** "Compressor starts, runs for 2-3 minutes, shuts off, waits 5 minutes, starts again. Keeps repeating. No fault codes."

### Symptoms / readings
- Suction PSI: 108 psig (slightly low, but not in fault range)
- Head PSI: 360 psig (slightly elevated)
- Superheat: 14°F
- Subcooling: 10°F
- Ambient OAT: 90°F
- Compressor: cycling on/off every 5–7 minutes
- Fault codes: none
- Indoor thermostat: 78°F set, 82°F actual — system can't keep up

### Correct diagnosis
Compressor short-cycling from an undersized system — the heat load exceeds the equipment's capacity at 90°F OAT. The system runs at 100% output for 2–3 minutes, satisfies the thermostat's "satisfied" range momentarily (or trips a mild protection), waits through the anti-short-cycle timer, then restarts. No fault — the equipment is simply undersized for the load.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Pressures and superheat/subcooling are borderline normal — not a refrigerant or mechanical fault.
2. Measure the indoor wet-bulb temperature and compare to the system's rated capacity at 90°F OAT. At high OAT, the XP21-060's cooling capacity may be below the home's actual heat gain.
3. Check: how many square feet is the conditioned space? What is the load at 90°F? If the home was designed for a 3-ton system but is actually a 4-ton load, short cycling is the result.
4. Check for duct leaks or sealed rooms that are blocking airflow — supply air that never reaches the conditioned space reduces effective cooling.
5. Inspect attic insulation level — if a recent heat wave is causing more solar gain than the Manual J assumed, the load can temporarily exceed capacity.
6. Inform the contractor: "The equipment is not failing — the load is exceeding equipment capacity. This is a load calculation or system sizing issue."

### Safety flags
- NONE

### Source(s)
- ACCA Manual J residential load calculation — [acca.org](https://www.acca.org)

---

## SCN-RES-072 — Goodman/Amana: Compressor Burnout — Acid in System
**Equipment:** Goodman GSX14 split AC, R-410A, 11 years old
**Tech describes:** "Compressor seized. Pulled it — oil is black. Smells like burnt. What do I do before putting the new compressor in?"

### Symptoms / readings
- Compressor: mechanically seized, electrically open on one winding
- Compressor oil: black, burnt smell — acid indicator test positive
- Acid test kit: positive (high acid content in oil)
- System age: 11 years
- Total refrigerant mass: lost (compressor failed)

### Correct diagnosis
Compressor burnout with system acid contamination. Burned motor windings break down the POE oil into acidic byproducts. Before installing a replacement compressor, the refrigerant circuit must be flushed and the acid-contaminated oil removed, or the acid will destroy the new compressor within months.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm burnout: black oil, positive acid test, and open winding are the three-point confirmation.
2. Recover all remaining refrigerant (will be contaminated with acid and moisture — dispose of appropriately per EPA 608).
3. Remove the failed compressor. Check suction and liquid service valve screens for debris from the failed compressor.
4. Flush the refrigerant circuit with an appropriate HVAC circuit flusher or by running nitrogen through the lineset and indoor coil to expel contaminated oil.
5. Replace the filter-drier with an extra-capacity acid-rated drier (double-duty drier or a Sporlan/Emerson EK-series drier rated for burnout cleanup).
6. Install the new compressor. Add the correct amount of fresh POE oil (match the new compressor manufacturer's spec).
7. After installation: install a new filter-drier, deep-evacuate to ≤300 microns, hold for 10 minutes, recharge by weight.
8. Schedule a follow-up service visit in 3–4 weeks: pull the drier sight glass and do another acid test. If acid is still present, replace the filter-drier again. Continue until the acid test is negative.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- Burned refrigerant oil contains hydrofluoric acid — wear nitrile gloves and eye protection. Do not inhale fumes.

### Source(s)
- Compressor burnout cleanup procedures — [mingledorffs.com/compressor-problems-troubleshooting](https://www.mingledorffs.com/compressor-problems-troubleshooting/)
- EPA 608 contaminated refrigerant handling — [epa.gov/snap](https://www.epa.gov/snap/substitutes-residential-and-light-commercial-air-conditioning-and-heat-pumps)

---

## SCN-RES-073 — Trane/American Standard: Low-Ambient Lockout — Heat Pump Won't Run in Cooling Below 60°F
**Equipment:** Trane XR14 heat pump, R-410A
**Tech describes:** "Customer says the AC won't turn on. It's 58°F outside. Thermostat calling for cool."

### Symptoms / readings
- Ambient OAT: 58°F
- Thermostat: cooling call active
- Outdoor unit: not running
- No fault codes
- System: operating correctly before this call

### Correct diagnosis
Low-ambient lockout — many residential heat pump controllers have a factory-set low-ambient lockout that prevents the compressor from running in cooling mode below approximately 55–60°F OAT. This is a protection against liquid refrigerant slugging (suction pressure would be too low in cooling mode at 58°F ambient).

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. At 58°F OAT with no fault codes and no cooling operation: check the thermostat or outdoor unit control board for a low-ambient lockout setting.
2. Trane XR14 and similar non-communicating units typically use a factory setting of ~55°F as the low-ambient cooling cutout.
3. Explain to the homeowner: "The system is designed not to run cooling when it's below about 60°F outside. This protects the compressor."
4. If the homeowner wants cooling below 60°F OAT (e.g., server room, year-round cooling need): a low-ambient kit can be installed that allows operation at lower outdoor temperatures. This typically adds an outdoor ambient sensor and allows the system to run cooling with reduced fan speed down to 35–40°F OAT.
5. If the homeowner simply wants to cool the house on a mild day: suggest setting the thermostat to fan-only mode to circulate air without running the compressor.

### Safety flags
- NONE

### Source(s)
- Low-ambient lockout explanation — [trane.com/residential/en/resources/troubleshooting/heat-pumps](https://www.trane.com/residential/en/resources/troubleshooting/heat-pumps/)

---

## SCN-RES-074 — Daikin: A5 — Indoor Coil Frozen or Overheating
**Equipment:** Daikin FTXS12LVJU wall-mounted mini-split, R-410A
**Tech describes:** "A5 fault. Unit running but ice visible on the indoor coil through the front cover gap. Low airflow."

### Symptoms / readings
- Flash / fault code: **A5 = Frozen coil or overheating** per Daikin error code documentation
- Indoor unit: visible ice on coil
- Indoor airflow: reduced (feels weak at discharge louver)
- Air filter: checked by homeowner "last month" (may be dirty)
- Ambient OAT: 72°F

### Correct diagnosis
A5 indoor coil freeze from restricted airflow — most likely a clogged air filter causing reduced airflow across the evaporator. Reduced airflow drops coil temperature below the dew point and then below freezing, causing ice accumulation.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm A5 = frozen coil per Daikin error code documentation.
2. Shut down the system (fan-only or full off) to allow ice to melt before proceeding. Running the system with a frozen coil can strain the compressor and worsen the ice accumulation.
3. Remove and inspect the air filter. "Checked last month" often means "looked at it but didn't replace it." A filter that appears lightly dirty can be 40% blocked when loaded with fine particles.
4. Clean or replace the filter. Also inspect the evaporator coil surface itself for dust/lint accumulation (common on ductless units in dusty environments — pet dander, construction dust).
5. After ice melts (typically 30–60 minutes with fan-only mode): restart and verify airflow is restored.
6. If airflow remains low after filter replacement: inspect the blower wheel for debris accumulation. Ductless blower wheels collect a thick layer of dust/lint over time and must be periodically cleaned.
7. If coil re-ices within 30 minutes of restart with clean filter and clean coil: suspect low refrigerant charge as the cause of the low coil temperature. Check suction pressure.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Daikin A5 fault code — [minisplitsizer.com/daikin-mini-split-error-codes](https://minisplitsizer.com/daikin-mini-split-error-codes/)

---

## SCN-RES-075 — Carrier 25VNA: Fault 32 — Brownout Protection
**Equipment:** Carrier Infinity 25VNA variable-speed heat pump, R-410A
**Tech describes:** "Fault 32 — brownout. Third time this week. Power company says voltage is fine."

### Symptoms / readings
- Fault code: **32 = "Brownout"** per Carrier 25VNA fault code table
- Reported line voltage: 240VAC (power company claim)
- Actual line voltage (measured at disconnect): 218VAC (below 230V ± 10% = 207–253V acceptable, but system may be marginal)
- Fault 46 also in history: "230VAC Dropout Reset Event"
- Heat wave conditions: multiple AC units in neighborhood running
- Conductor size: checked — undersized service entrance wiring (200A service with #2 AWG — borderline for this locality)

### Correct diagnosis
Voltage sag from neighborhood demand + undersized service entrance conductors. The Carrier Infinity system's brownout protection (fault 32) is tripping on momentary voltage sags below the fault threshold, not a sustained low voltage that the power company would detect.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm fault 32 = brownout and fault 46 = voltage dropout per Carrier 25VNA fault table.
2. Install a data logger or use the digital manifold's voltage monitoring on the 240VAC supply at the disconnect for 24–48 hours during a heat wave. This will capture the momentary sag events.
3. Measure voltage at the main panel (not just the disconnect) during compressor startup — startup inrush creates a momentary sag at the panel. A hard-start kit reduces startup current draw and reduces the voltage sag.
4. Check conductor sizing from the panel to the outdoor unit. Undersized wire (voltage drop under load) is a common cause of fault 32 on Carrier Infinity units.
5. For power quality issues: the resolution is electrical infrastructure (panel upgrade, larger conductors, power quality conditioner) — not an HVAC system fix.
6. Inform the contractor: "The Infinity system's electronics are sensitive to voltage quality. The fault 32 is accurate — there's a power quality problem on this service. An electrician needs to verify conductor sizing and service entrance condition."

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Carrier 25VNA Fault Code 32 — [manualslib.com/manual/860578/Carrier-25vna.html?page=12](https://www.manualslib.com/manual/860578/Carrier-25vna.html?page=12)
- Carrier 25VNA Fault Code 46 — same source

---

## SCN-RES-076 — American Standard Gold 17: No Cool, Dirty Evaporator Coil, High Suction
**Equipment:** American Standard Gold 17 (4A7A5036) split AC, R-410A
**Tech describes:** "High suction, barely cooling, low superheat. System is 5 years old in a beach rental — runs constantly all summer."

### Symptoms / readings
- Suction PSI: 145 psig (elevated — normal ~120 psig at 85°F OAT)
- Head PSI: 290 psig (low)
- Superheat: 3°F (very low)
- Subcooling: 8°F (normal)
- Ambient OAT: 85°F
- Indoor SAT: 66°F (barely cooling)
- Evaporator coil: access panel removed — coil visually caked with a 1/4" layer of white/grey fibrous material (lint, sand, sea grass)

### Correct diagnosis
Severely dirty evaporator coil causing high suction pressure and low superheat. The caked-on debris has reduced airflow across the evaporator so severely that: (1) the coil temperature has risen (less heat exchange), (2) suction pressure rises with warm coil, and (3) superheat collapses to near zero because the coil is essentially hot.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Visual diagnosis is conclusive — a 1/4" coating on the evaporator coil is a textbook dirty evaporator pattern.
2. The pressure pattern confirms it: high suction (warm coil) + low superheat + low subcooling (charge is present, coil just isn't absorbing heat).
3. Clean the evaporator coil: spray coil cleaner (appropriate for aluminum fin/copper tube), let dwell 10–15 minutes, rinse with water and wet-vac the drain pan.
4. After cleaning: run the system for 20 minutes. Suction should drop to 115–125 psig, superheat should rise to 8–15°F, and SAT should drop to 55–60°F.
5. Verify the air filter: it was clearly not changed regularly. Recommend quarterly filter changes at minimum for beach rental properties with high occupancy.
6. Beach rental recommendation: add a thick pleated filter on the return and schedule biannual coil cleaning service. Salt air + high occupancy + near-constant operation = accelerated coil fouling.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Dirty evaporator coil diagnosis — [hvacrschool.com/the-5-pillars-of-residential-ac-refrigerant-circuit-diagnosis](http://www.hvacrschool.com/the-5-pillars-of-residential-ac-refrigerant-circuit-diagnosis/)

---

## SCN-RES-077 — Carrier Infinity: Fault 77 — Suction Over-Temperature Lockout
**Equipment:** Carrier Infinity 25VNA8 heat pump, R-410A
**Tech describes:** "Fault 77 lockout. System completely locked out. Previous fault 69 in the history."

### Symptoms / readings
- Fault code: **77 = "Suction Over Temp Lockout"** per Carrier 25VNA fault table
- Prior fault: **69 = "Suction Over Temperature"** per same table
- System: locked out — will not restart on its own
- Head PSI: Not measurable
- Suction line temperature (measured): 68°F (ambient — system not running)
- Ambient OAT: 82°F

### Correct diagnosis
Suction line over-temperature lockout — fault 69 is the initial trip (suction temp exceeded threshold), fault 77 is the locked-out state requiring manual intervention. This is caused by insufficient suction superheat that led to a high suction temperature condition, most likely from refrigerant overcharge causing liquid slugging or a failed TXV that opened excessively.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm fault 77 = suction over-temperature lockout and fault 69 = suction over temperature per Carrier 25VNA fault table. A lockout requires clearing — cycle power to clear it.
2. After clearing lockout: run the system and watch the suction pressure and suction temperature closely. If fault 69 returns within minutes, the system is running at abnormal suction superheat.
3. Over-temperature on the suction line most commonly comes from: TXV stuck open (floods the suction with liquid, the liquid eventually boils to very high superheat past the TXV), or refrigerant overcharge.
4. Check suction line temp vs. saturation temp: superheat = suction line temp − saturation temp at measured suction pressure. If superheat is extreme (>30°F) at startup, TXV is suspect. If superheat is very low and suction temp climbs during run, overcharge may be driving liquid into the suction above the TXV.
5. Refer to fault 49 (suction temp sensor) in the fault history — a faulty sensor can cause false suction-over-temp faults without an actual temperature problem.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Carrier 25VNA Fault Codes 69 and 77 — [manualslib.com/manual/860578/Carrier-25vna.html?page=12](https://www.manualslib.com/manual/860578/Carrier-25vna.html?page=12)

---

## SCN-RES-078 — Goodman/Amana: Code A2 / A3 — Temperature Sensor Open or Shorted
**Equipment:** Goodman GSZC18 communicating heat pump, R-410A
**Tech describes:** "Code A2 showing. System not running optimally — sometimes works, sometimes goes into fault."

### Symptoms / readings
- Flash / fault code: **A2 = Shorted sensor / A3 = Open sensor** per Goodman diagnostic code system (sensor out of range)
- System: intermittent fault — sometimes running, sometimes in A2 or A3
- Suction PSI: 108–125 psig (varying — possibly related to intermittent sensor dropout)
- Ambient OAT: 80°F

### Correct diagnosis
Intermittent temperature sensor fault — either shorted (A2) or open (A3). The intermittent nature suggests a sensor with a cracked cable, corroded connector, or a thermistor that is sensitive to vibration (loose mounting clip).

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm A2 = shorted sensor or A3 = open sensor per Goodman diagnostic code system.
2. For an intermittent fault: wiggle test the sensor wire harness connections at the control board while monitoring for the code. If the fault appears/disappears with wire movement: the connector or cable is the issue.
3. Identify which sensor is generating the A2/A3 — the Goodman communicating system logs multiple sensor channels. Check the fault history to see if the same sensor ID repeats.
4. Inspect the sensor mounting: a sensor vibrating loose from its mounting clip will read erratic temperatures that alternate between in-range and out-of-range.
5. Replace the suspect sensor and connector assembly. For intermittent faults, replacing just the connector plug may be sufficient if the thermistor itself tests within spec.
6. Monitor through one full heating and cooling cycle to confirm the fault does not recur.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Goodman A2/A3 sensor fault codes — [twintechheating.ca/goodman-air-conditioner-error-codes](https://twintechheating.ca/goodman-air-conditioner-error-codes/)


---

## SCN-RES-079 — Trane XV20i: No-Cool, Capacitor Kills Fan Then Compressor Trips
**Equipment:** Trane XV20i variable-speed heat pump, R-410A
**Tech describes:** "Outdoor fan not running. Compressor started but tripped off in 45 seconds. Head pressure climbing fast."

### Symptoms / readings
- Suction PSI: 118 psig (normal on startup)
- Head PSI: 390 psig and climbing rapidly (no condenser fan)
- Superheat: 8°F (normal)
- Outdoor fan: completely stopped, making no sound
- Compressor: started, ran 45 seconds, then HPS tripped
- Run capacitor (dual): 45+5 µF — 5 µF section tests at 0.8 µF (failed)

### Correct diagnosis
Same scenario as SCN-RES-024 but on a variable-speed platform — failed run capacitor on the condenser fan causing a high-pressure cascade. On the XV20i, the system's variable-speed drive manages compressor speed but cannot compensate for a completely absent condenser fan.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Fan not running + compressor tripped on HPS = failed capacitor until proven otherwise. Immediately shut down the system.
2. Discharge the capacitor (insulated resistor, 10,000Ω) before measuring.
3. Dual run capacitor: 5 µF section at 0.8 µF is 84% below spec — completely failed.
4. Replace the dual run capacitor (45+5 µF, 440VAC minimum). Note: on Trane XV20i, verify whether the outdoor fan is a PSC type (uses capacitor) or an ECM/DC type (no capacitor needed). Some variable-speed Trane systems use an ECM outdoor fan. If ECM: the fan drive, not the capacitor, is the suspect.
5. After capacitor replacement: verify fan starts at speed and runs correctly. Confirm head pressure returns to 310–350 psig range at OAT within 10–15 minutes.
6. If the fan motor was running at locked-rotor amps before tripping on thermal overload: the motor may need 30 minutes to cool before testing. Confirm it runs freely by hand before applying power.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- **REQUIRED:** Discharge capacitor before touching.

### Source(s)
- Capacitor diagnosis and testing — [technicalhotandcoldparts.com/hvac-repair-blog/how-to-diagnose-test-and-replace-a-bad-ac-capacitor](https://www.technicalhotandcoldparts.com/hvac-repair-blog/how-to-diagnose-test-and-replace-a-bad-ac-capacitor/)

---

## SCN-RES-080 — LG Ductless: CH45 — Outdoor Unit Fan Motor Error
**Equipment:** LG LMU/LMN36CHV multi-zone, R-410A
**Tech describes:** "CH45 code. Outdoor fan blade visible and appears intact. System ran fine this morning."

### Symptoms / readings
- Flash / fault code: **CH45 = Outdoor unit fan motor error** per LG HVAC Toolkit documentation
- Outdoor fan: blade appears intact when viewed from above
- Recent weather: 90°F ambient, heavy afternoon run period
- System: ran fine through morning cooling cycle

### Correct diagnosis
Outdoor fan motor overcurrent or speed fault — likely caused by a motor that is thermally overloaded after a heavy afternoon run period at 90°F, or debris caught in the fan assembly that wasn't visible from above.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm CH45 = outdoor fan motor error per LG error code documentation.
2. "Appears intact from above" — the fan blade is only partially visible from above. Remove the top grille (requires screwdriver on most LG multi-zone units) to fully inspect the fan assembly.
3. Check for debris between the fan blade and the shroud: a small branch, large leaf, or bird/rodent material can partially restrict the fan without being visible from the outside.
4. Check that the fan blade is fully seated on the motor shaft — the blade can shift upward on a vertical shaft motor and contact the shroud.
5. With power OFF: rotate the fan blade by hand. Should move freely. If restricted: remove the obstruction.
6. If the fan spins freely and no debris: the DC fan motor itself may have failed. Measure the DC bus voltage and fan motor drive signal at the outdoor PCB. If drive signal is present and motor doesn't spin: motor replacement.
7. After clearing the fault (power cycle): verify fan operates normally for a full 15-minute cooling cycle before leaving.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- LG CH45 error code — [hvactoolkit.org/resources/error-codes/lg](https://hvactoolkit.org/resources/error-codes/lg)

---

## SCN-RES-081 — York/Coleman: LOP Fault in Heating Mode — Defrost Issue Masking Charge Issue
**Equipment:** York YZF036 heat pump, R-410A
**Tech describes:** "LOP in heat mode. OAT is 38°F. Outdoor coil is iced. Replaced the defrost board last week."

### Symptoms / readings
- Flash / fault code: **LOP = Low-side pressure below safe limits** (heating mode)
- Suction PSI: 42 psig (heating mode at 38°F — severely low)
- Ambient OAT: 38°F
- Outdoor coil: iced over
- Defrost board: replaced last week
- System: LOP tripping in heating mode after new defrost board

### Correct diagnosis
Two problems present simultaneously: (1) defrost still not working correctly despite new board (coil is icing), and (2) low refrigerant charge. The ice buildup from defrost failure is collapsing suction pressure further, but even without ice, the charge is insufficient for 38°F heating operation.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. The ice on the coil and the new defrost board: verify the new board is wired correctly. On York units, the defrost initiation thermistor must be connected to the correct terminal. Review the installation diagram from the board's packaging vs. the original board.
2. Force a manual defrost: jump the test terminals on the new board briefly. If defrost initiates (reversing valve clicks, fan stops): the new board is functional and the defrost thermostat may be the issue, not the board.
3. Melt all existing ice before doing charge work — ice on the coil artificially suppresses suction pressure and gives you a false reading.
4. After ice is melted and defrost confirmed working: recheck suction pressure in heating mode at 38°F OAT. Normal R-410A suction in heating at 38°F should be 70–85 psig. At 42 psig even with a clear coil: the system is low on charge.
5. Find the leak (the charge didn't just disappear — it's going somewhere). Add refrigerant after the leak is confirmed and repaired.
6. Multiple service visits on the same system: the defrost board replacement was probably the right call, but it was masking an underlying charge issue. Both need to be addressed.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- EPA 608: find and repair the leak before recharging.

### Source(s)
- York LOP fault in heating — [pickcomfort.com/york-heat-pump-error-codes-troubleshooting](https://www.pickcomfort.com/york-heat-pump-error-codes-troubleshooting/)
- Defrost troubleshooting — [hvacrschool.com/heat-pump-defrost-troubleshooting-tips](http://www.hvacrschool.com/heat-pump-defrost-troubleshooting-tips/)

---

## SCN-RES-082 — Fujitsu Halcyon: Red/Green Flash — System in Diagnostic Mode
**Equipment:** Fujitsu AOUS24LZAH1 / ASUH24LZAH1 ducted mini-split, R-410A
**Tech describes:** "Green and red LEDs both flashing simultaneously on the indoor air handler. No heating or cooling. New customer, first visit."

### Symptoms / readings
- Flash code: **Green + Red flashing simultaneously = System in diagnostic mode checking all components** per Fujitsu Halcyon flashing light code reference
- System: not providing heating or cooling
- Last service: unknown

### Correct diagnosis
The system is in a self-diagnostic or check mode — this is often triggered by the previous technician or homeowner pressing a combination of buttons on the remote control or the unit's service switch. The system is not in a fault state — it is actively running diagnostics.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm green + red simultaneous flash = diagnostic mode per Fujitsu Halcyon flashing light code documentation.
2. Do not power-cycle immediately — let the diagnostic cycle complete (typically 1–5 minutes). After the cycle, the system should display either a normal operating state or a specific fault code.
3. If the system returns to normal operation after the diagnostic cycle: no fault exists. The homeowner or a previous tech activated the diagnostic mode inadvertently.
4. If the system displays a fault code after the diagnostic cycle: record that fault code and diagnose per that code's definition.
5. On Fujitsu Halcyon ducted systems: ensure the test/check switch on the control board has not been left in the "test" position by the previous technician. This can lock the system in diagnostic mode indefinitely.

### Safety flags
- NONE (for diagnostic mode itself)
- ELECTRICAL_HIGH_VOLTAGE for any physical access.

### Source(s)
- Fujitsu green/red flash = diagnostic mode — [smartacsolutions.com/fujitsu-halcyon-flashing-light-codes](https://smartacsolutions.com/fujitsu-halcyon-flashing-light-codes/)

---

## SCN-RES-083 — Lennox/Allied Air: Communicating System Communication Fault — S30 Thermostat Lost Signal
**Equipment:** Lennox Merit 16 heat pump with iComfort S30, R-410A
**Tech describes:** "S30 thermostat showing 'communication lost' to the outdoor unit. Everything else seems powered up."

### Symptoms / readings
- Fault: Communication lost between iComfort S30 thermostat and outdoor unit control
- Power: 24VAC at air handler confirmed
- 24VAC at outdoor unit control board: confirmed
- Communication wiring (2-wire, iComfort bus between AHU and outdoor unit): to be verified
- System: recently rerouted thermostat wiring through a new wall chase

### Correct diagnosis
Communication wire issue introduced during the thermostat wire rerouting. The iComfort S30 communicating system uses a dedicated 2-wire bus between the air handler and the outdoor unit control — this is separate from standard thermostat wiring.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm communication lost per iComfort S30 display.
2. The recent wire rerouting is the likely culprit. Trace the communication wire from the air handler to the outdoor unit.
3. Verify the communication wire is landed on the correct terminals at both ends. On Lennox communicating systems, the communication bus uses specific terminal designations (often "A" and "B" or "+" and "−") that are different from standard R/G/Y/W thermostat wiring.
4. Check for a staple or screw through the communication wire in the new chase run. A wire pinched by a staple can intermittently lose signal.
5. If the wire checks out: power cycle both the air handler and the outdoor unit (both breakers, wait 5 minutes, restore). The iComfort communicating system requires a synchronized power-up to re-establish the communication link.
6. If communication still lost after power cycle and wiring verified: check for a failed outdoor unit control board communication module (less common but possible on older iComfort equipment).

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Lennox iComfort communicating system — [lennox.com/dA/d89d9db1dd/100017c.pdf](https://www.lennox.com/dA/d89d9db1dd/100017c.pdf)
- Lennox communicating systems service manual — [tech.lennoxintl.com/C03e7o14l/VIu12Ch2uV/Corp1817-L8f.pdf](https://tech.lennoxintl.com/C03e7o14l/VIu12Ch2uV/Corp1817-L8f.pdf)

---

## SCN-RES-084 — Samsung/Mitsubishi/LG Ductless: Electronic Expansion Valve (EEV) Failure — E6xx / P Series
**Equipment:** Samsung AR18BXHZCWKNEU ductless, R-410A
**Tech describes:** "E601 cleared, then system started. Now suction is all over the place. Superheat swinging from 5°F to 30°F in 2 minutes."

### Symptoms / readings
- Flash / fault code: **E6xx = Valve errors** per Samsung error code categories
- Suction PSI: oscillating 70–130 psig (cycling)
- Superheat: oscillating 5–30°F in 2-minute cycles
- Head PSI: relatively stable at 340 psig
- Ambient OAT: 82°F
- Original fault E601 cleared by power cycle

### Correct diagnosis
Electronic expansion valve (EEV) hunting or failure. After the E601 communication fault cleared, the EEV may have reopened in an incorrect position. The oscillating suction pressure and swinging superheat is a classic EEV hunting or feedback control failure pattern on inverter-driven ductless systems.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Samsung E6xx = valve error per Samsung error code categories. After the communication fault cleared, the EEV may not have returned to its control baseline.
2. Power cycle the entire system again (full 5-minute power removal). The EEV should return to its initialization position (typically partially open) on cold startup.
3. After restart: watch suction pressure for the first 10 minutes. If the oscillation continues with 2-minute cycles: the EEV itself is hunting (feedback control is unstable) or the EEV coil/motor is failing.
4. Samsung EEV failure: the valve should receive a stepped signal from the outdoor PCB. If the outdoor PCB's EEV driver circuit is damaged (from the original communication event / voltage spike), the EEV will oscillate.
5. Verify EEV coil resistance: Samsung EEV coils typically measure 40–60 ohms across the coil winding pair. Open or shorted = coil failure.
6. If coil is intact and oscillation persists: the outdoor PCB's EEV driver circuit is suspect. PCB replacement will be required.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Samsung E6xx valve error category — [hvactoolkit.org/resources/error-codes/samsung](https://hvactoolkit.org/resources/error-codes/samsung)
- EEV hunting diagnosis patterns — [hvactoolkit.org/resources/txv-troubleshooting](https://hvactoolkit.org/resources/txv-troubleshooting)

---

## SCN-RES-085 — Carrier 25VNA: Fault 72 — Inverter Over Current (Compressor Overload)
**Equipment:** Carrier Infinity 25VNA6 heat pump, R-410A
**Tech describes:** "Fault 72 on the outdoor board. System keeps tripping off after 10 minutes of run time. Been through two cooling seasons fine."

### Symptoms / readings
- Fault code: **72 = "Inverter Over Current"** per Carrier 25VNA fault table
- Run time before fault: 10 minutes (consistent)
- Ambient OAT: 95°F
- Head PSI: 385 psig (normal for 95°F OAT)
- Suction PSI: 122 psig (normal)
- Subcooling: 10°F (normal)
- Compressor amp draw: 22A at fault point (nameplate RLA: 18A — elevated)

### Correct diagnosis
Inverter over-current — the variable-speed inverter is tripping because the compressor is drawing more current than expected. At 95°F OAT with normal pressures and charge, the likely causes are: (1) compressor motor windings degrading with age, (2) inverter module beginning to fail thermally (overheats after 10 minutes), or (3) refrigerant issue that only manifests at high ambient.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm fault 72 = inverter over current per Carrier 25VNA fault table.
2. The consistent 10-minute fault timing at 95°F OAT points to a thermal issue — either the inverter module overheating or the compressor motor running hot.
3. Check the inverter heat sink for debris/obstruction. The inverter module on the 25VNA is cooled by the outdoor ambient air. A dirty heat sink will cause the inverter to overheat and trip on overcurrent protection.
4. Verify the inverter heat sink fins are clean and have adequate clearance (no debris against the inverter case).
5. Check compressor amp draw: 22A vs. 18A RLA nameplate. At 95°F OAT, some uprating is expected. But if the compressor motor is developing winding-to-winding resistance imbalance, current will be higher than spec.
6. For inverter module overheating: cleaning the heat sink often resolves fault 72 on systems 3–5 years old. If cleaning does not resolve and fault 72 persists: inverter module replacement.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- Inverter DC bus: wait 5 minutes, verify <50VDC before accessing.

### Source(s)
- Carrier 25VNA Fault Code 72 — [manualslib.com/manual/860578/Carrier-25vna.html?page=12](https://www.manualslib.com/manual/860578/Carrier-25vna.html?page=12)

---

## SCN-RES-086 — Cold-Climate Heat Pump: R-454B Vapor Injection System — Reduced Capacity at -5°F
**Equipment:** Bosch IDS Ultra 4-ton, R-454B, cold-climate rated to -13°F
**Tech describes:** "Unit is running but heating output is reduced. It's -5°F outside. No fault codes. EVI valve — should it be clicking?"

### Symptoms / readings
- Ambient OAT: -5°F
- Suction PSI: Very low (normal for -5°F R-454B heating)
- Indoor supply air: 78°F (warm but system working hard)
- EVI (Enhanced Vapor Injection) valve: audible click confirmed
- No fault codes
- Heating capacity: approximately 75–80% of rated (normal capacity reduction at this temperature)

### Correct diagnosis
Normal cold-climate operation with Enhanced Vapor Injection active. The EVI click confirms the vapor injection circuit is operating. The modest capacity reduction at -5°F is consistent with published Bosch IDS Ultra specifications.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. No fault codes, EVI active, warm supply air = normal operation.
2. Confirm EVI is functioning: the EVI valve audible click is the positive confirmation that vapor injection is active. Without vapor injection at -5°F, the unit's heating capacity would be significantly lower.
3. Verify indoor supply temperature: at -5°F OAT, the Bosch IDS Ultra should deliver approximately 90–100°F supply air (compared to 110–115°F at 35°F OAT) due to reduced capacity. A supply temp of 78°F at -5°F OAT is within the expected range.
4. Verify that the auxiliary heat stages are armed and configured correctly in the thermostat. At -5°F, aux heat should be available to assist.
5. This is a "no-fault" education call — the tech and homeowner need to understand that cold-climate heat pumps deliver less capacity at extreme cold, not zero capacity. The system is working.

### Safety flags
- NONE

### Source(s)
- Bosch IDS Ultra vapor injection and cold-climate specs — [bosch-homecomfort.com/us/en/ocs/residential/ids-ultra-inverter-ducted-split-cold-climate-heat-pump-20831889-p](https://www.bosch-homecomfort.com/us/en/ocs/residential/ids-ultra-inverter-ducted-split-cold-climate-heat-pump-20831889-p/)

---

## SCN-RES-087 — Mitsubishi: U4 Communication Error — Multi-Zone Power Event
**Equipment:** Mitsubishi MXZ-4C36NAHZ2, R-410A (4-zone)
**Tech describes:** "U4 on all four indoor heads after the power came back on from a storm outage. Everything was working fine before."

### Symptoms / readings
- Flash / fault code: **U4 = Communication error between indoor and outdoor** per Mitsubishi error code documentation
- All four zones: showing U4 simultaneously
- Power status: recently restored after storm outage
- Pre-storm operation: confirmed normal

### Correct diagnosis
Post-power-outage communication fault. When power is restored after a utility outage, the Mitsubishi multi-zone outdoor unit and all indoor units must re-synchronize. If the power restoration was abrupt or involved a surge, the communication synchronization fails, generating U4 on all connected zones simultaneously.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm U4 = communication error per Mitsubishi documentation.
2. The simultaneous U4 on all four zones (not just one) after a power outage is a classic post-restoration communication sync failure — not a wiring or board failure.
3. Complete power cycle: shut off the outdoor unit breaker AND all indoor unit zone breakers for 5 full minutes. Restore the outdoor unit breaker first, wait 2 minutes, then restore all indoor breakers. The outdoor unit must initialize first.
4. Wait 3–5 minutes for the communication link to establish. U4 should clear on all zones.
5. If one zone still shows U4 after the power cycle with all others cleared: that individual zone's wiring or indoor PCB is suspect (but the storm event may have damaged that zone's PCB from a surge).
6. If all four zones still show U4 after power cycle: the outdoor PCB may have been damaged by the power surge. Check outdoor unit for visible PCB burn marks or breaker that trips under load.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Mitsubishi U4 communication error — [minisplitsizer.com/daikin-mini-split-error-codes](https://minisplitsizer.com/daikin-mini-split-error-codes/) [General ductless U4 reference; Mitsubishi-specific via error code documentation]

---

## SCN-RES-088 — Trane XR14: Refrigerant Overcharge — High Head, High Subcooling
**Equipment:** Trane XR14 split AC, R-410A
**Tech describes:** "System was recharged by a different company last week. Now it's running but not cooling as well. Head pressure seems high."

### Symptoms / readings
- Suction PSI: 130 psig (slightly elevated)
- Head PSI: 400 psig (high for 82°F OAT — should be 275–310 psig)
- Superheat: 6°F (low)
- Subcooling: 28°F (significantly elevated — target 8–12°F for TXV)
- Ambient OAT: 82°F
- Previous service: recharged by another company last week

### Correct diagnosis
Refrigerant overcharge from the previous service. Classic overcharge signature: high head pressure, elevated subcooling, low-normal suction, and low superheat. The previous tech added too much refrigerant.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Overcharge is one of the most common post-service problems. Subcooling at 28°F on a TXV system = overcharged.
2. Recover refrigerant in small increments (3–4 oz at a time) while monitoring subcooling. Target 8–12°F subcooling at the liquid line.
3. After each recovery increment, allow 5 minutes for the system to stabilize before measuring.
4. Once subcooling reaches 10°F: check head pressure — should be 275–310 psig at 82°F OAT.
5. Document total amount recovered. This is the amount the system was overcharged.
6. Check the superheat as well — after correct charge, suction line superheat should be 8–12°F for a TXV system.
7. Inform the contractor (not the homeowner) about the previous overcharge. The contractor decides how to handle the customer relationship.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Overcharge diagnosis and subcooling — [acservicetech.com/post/the-hvac-subcooling-charging-method-explained](https://www.acservicetech.com/post/the-hvac-subcooling-charging-method-explained)

---

## SCN-RES-089 — Lennox Allied Air: Split System No-Cool — Contactor Not Pulling In
**Equipment:** Allied Air Estates 4AC13 split AC, R-410A
**Tech describes:** "Outdoor unit not running at all. Can hear the air handler, thermostat calling for cool. No fault codes."

### Symptoms / readings
- Suction PSI: equalized (compressor not running)
- Head PSI: equalized
- 24VAC at contactor coil terminals: 0VAC (no Y call reaching the contactor)
- 24VAC at thermostat R terminal: 26VAC (present)
- Y terminal at outdoor unit: 0VAC
- Air handler: running in fan mode

### Correct diagnosis
No Y (compressor call) signal reaching the outdoor unit contactor coil. With 24VAC at the thermostat but 0VAC at the outdoor unit Y terminal, the signal is being lost between the thermostat and the outdoor unit — either a broken thermostat wire, a bad connection at the air handler control board, or a tripped safety that is interrupting the Y circuit.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. 0VAC at contactor coil, 26VAC at the source — the signal is being dropped somewhere in the circuit.
2. Check the Y wire at the air handler control board: measure 24VAC between Y and C. If 0V at the air handler Y-out terminal: the air handler is not passing the Y call. Check for a tripped float switch (condensate), a tripped freeze limit, or a control board fault that's blocking Y.
3. Check for a condensate float switch in the Y circuit. A common installation puts the float switch in series with the Y wire. If the condensate pan is full, the float switch opens the Y circuit — no compressor call.
4. If 24VAC is present at the air handler Y terminal: the problem is in the thermostat wire run between the air handler and the outdoor unit. Check for a broken wire, a wire that has corroded or chewed (at the outdoor unit entry point, rodent damage is common).
5. With the Y signal interrupted: jump R to Y at the outdoor unit directly to confirm the contactor pulls in and the compressor runs. If it does — the Y signal path is confirmed intact from that point. Work backward.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE — Do NOT use a screwdriver to short across contactor terminals. Use proper jumper leads.

### Source(s)
- Contactor not pulling in diagnosis — [northnjhvac.com/heat-pump-contactor-not-pulling-causes](https://northnjhvac.com/heat-pump-contactor-not-pulling-causes/)

---

## SCN-RES-090 — LG Ductless: CH38 — Refrigerant Gas Leak / Low Refrigerant Alarm
**Equipment:** LG LMN/LMU36CHV multi-zone, R-410A
**Tech describes:** "CH38 on two of three zones. Suction is low. This system has had no prior service."

### Symptoms / readings
- Flash / fault code: **CH38 = Refrigerant gas leak detected / low refrigerant (or electrical fault from unstable power)** per LG error code documentation
- Affected zones: 2 of 3 indoor heads showing CH38
- Suction PSI: 55 psig (critically low at 80°F OAT)
- Head PSI: 215 psig (low)
- Superheat: 38°F (extremely high)
- Ambient OAT: 80°F
- System age: 3 years, no prior service

### Correct diagnosis
Active refrigerant leak — the CH38 code, critically low suction, extremely high superheat, and 3-year-old system without service all point to a slow leak that has depleted a significant portion of the charge. On LG multi-zone systems, a CH38 on multiple zones simultaneously typically indicates outdoor unit charge loss, not individual zone failures.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm CH38 = refrigerant gas leak / low refrigerant per LG error code documentation. Note that CH38 can also indicate electrical issues from unstable power — verify power supply is stable before pursuing refrigerant.
2. Suction at 55 psig with 38°F superheat: the compressor is running without adequate refrigerant. Shut down to prevent compressor damage.
3. Perform leak search starting at the outdoor unit service valves and flare connections. Then check each indoor unit flare connection (these are the #1 leak location on LG ductless multi-zone systems).
4. Also check the outdoor unit's factory flare fittings — some LG multi-zone units have a known issue with the factory flare fittings on the branch connections.
5. After locating and repairing the leak: nitrogen pressure test all connections, deep evacuate, and recharge by weight per the LG nameplate specification for the actual lineset length installed.
6. After recharge: verify CH38 clears and both affected zones run normally through a full cooling cycle.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- EPA 608: Repair before recharge.

### Source(s)
- LG CH38 error code — [hvactoolkit.org/resources/error-codes/lg](https://hvactoolkit.org/resources/error-codes/lg)
- LG CH38 investigation — [classlawdc.com/2025/08/26/lg-mini-split-ch38-error-code-investigation](https://classlawdc.com/2025/08/26/lg-mini-split-ch38-error-code-investigation/)


---

## SCN-RES-091 — Goodman GSXC18: Communicating System d0 — New Install, No Shared Data
**Equipment:** Goodman GSXC18 / AVPTC communicating system, R-410A, brand new install
**Tech describes:** "d0 fault on the new install. System won't run. Everything's wired up."

### Symptoms / readings
- Flash / fault code: **d0 = Air conditioner/heat pump is wired as part of a communicating system but the indoor unit's ICM (integrated control module) does not contain any shared data** per Goodman communicating system documentation
- System: brand new install, never operated
- Indoor / outdoor communication wiring: installed
- Memory card in air handler: appears installed

### Correct diagnosis
d0 means the indoor unit has not received the shared data from the outdoor unit yet. On a new Goodman communicating install, the system requires a first-time startup data-sharing sequence. This is not a fault — it is an initialization state.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm d0 = no shared data in indoor unit per Goodman communicating system documentation.
2. d0 on a new install is expected if the system has not completed its initialization sequence. Ensure power has been applied to both units simultaneously for at least 10 minutes.
3. Verify communication wiring polarity: on Goodman communicating systems, the ABC wiring between indoor and outdoor units must be correct (A-to-A, B-to-B, C-to-C). A single reversed wire prevents data sharing.
4. Check that the memory card is fully seated in the air handler's ICM — d0 can also appear if the memory card is loose or partially inserted.
5. If d0 persists after 10 minutes with correct wiring: power cycle both units simultaneously. Some GSXC18 communicating systems require a synchronized cold start to initiate the data-sharing protocol.
6. If d0 still appears after power cycle and wiring is confirmed: check that the outdoor unit model number matches an approved communicating pair for this AVPTC air handler. Mismatched pairs will not share data (see d2, d3 codes).

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Goodman d0 communicating system code — [twintechheating.ca/goodman-air-conditioner-error-codes](https://twintechheating.ca/goodman-air-conditioner-error-codes/)

---

## SCN-RES-092 — Mitsubishi MXZ: P9 — Pipe Temperature Sensor (TH5) Fault
**Equipment:** Mitsubishi MSZ-GL15NA / MXZ-2C20NA, R-410A
**Tech describes:** "P9 error on one of the two zones in this dual-zone system. The other zone is running fine."

### Symptoms / readings
- Flash / fault code: **P9 = TH5 (condenser/evaporator pipe thermistor) open or shorted circuit** per Mitsubishi P-series error documentation
- Affected zone: one of two indoor heads
- Other zone: running normally
- System: 4 years old

### Correct diagnosis
TH5 pipe temperature sensor fault on the affected indoor head. This sensor monitors the evaporator coil pipe temperature and is used for freeze protection and capacity modulation. With one zone working and one showing P9, the fault is localized to the P9 zone's indoor unit.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm P9 = TH5 pipe sensor fault per Mitsubishi error documentation.
2. One zone working confirms the outdoor unit and multi-zone branch controller are functional.
3. Access the affected indoor unit. Locate the TH5 thermistor — on Mitsubishi MSZ-GL series, TH5 is the sensor on the evaporator coil pipe, typically a clip-on type sensor on the refrigerant tube.
4. Check that TH5 is physically clipped to the pipe — they can vibrate off over time, causing an out-of-range reading (reads ambient instead of pipe temperature).
5. Measure TH5 resistance: at room temperature (72°F), TH5 should read approximately 8–12 kΩ for a Mitsubishi NTC thermistor. Open = failed. Very low resistance = shorted.
6. If TH5 is properly mounted and measures correctly: check the TH5 connector on the indoor PCB — corrosion or a loose pin.
7. Replace TH5 if out of spec. After replacement: power cycle and verify P9 clears on the affected zone.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Mitsubishi P9 TH5 thermistor fault — [beaconsaves.com/blog/mitsubishi-mini-split-p9-error-code](https://www.beaconsaves.com/blog/mitsubishi-mini-split-p9-error-code)

---

## SCN-RES-093 — Carrier/Bryant Payne: Fault 48 — Outdoor Air Temp Sensor Fault (Variable Speed)
**Equipment:** Bryant Evolution 18VS (288BNV) heat pump, R-410A
**Tech describes:** "Fault 48. System running but operating erratically — changing speeds constantly. Heating output is inconsistent."

### Symptoms / readings
- Fault code: **48 = "Outdoor Air Temp Sensor Fault"** per Carrier 25VNA fault code table (applies to Bryant Evolution as well — same control platform)
- System behavior: compressor hunting speeds, no stable operating point
- Ambient OAT: 32°F
- Suction PSI: oscillating 60–90 psig
- No lockout — system continuing to run despite fault 48

### Correct diagnosis
Outdoor air temperature sensor fault causing the variable-speed control to lose its ambient reference. The control cannot optimize compressor speed for the actual outdoor temperature, causing erratic speed hunting. At 32°F, an incorrect ambient reading can also affect defrost cycle timing.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm fault 48 = outdoor air temp sensor fault per Carrier/Bryant 25VNA fault code table (same table used for Bryant Evolution on the same control platform).
2. Locate the outdoor ambient sensor — typically near the outdoor coil inlet or in the outdoor control box.
3. Verify sensor mounting: the sensor must be in free air, not touching the coil or chassis. If touching a metal surface, it reads metal temperature, not air temperature.
4. Measure sensor resistance: at 32°F OAT, the NTC sensor should read approximately 20–25 kΩ. Correct value = sensor is intact, check the connector.
5. If sensor resistance is correct but fault 48 persists: the outdoor PCB's sensor input circuit may be faulty. Try clearing the fault (power cycle) — if fault 48 does not immediately return, it was a momentary event.
6. If fault 48 returns within one cycle: replace the outdoor ambient sensor.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Carrier 25VNA Fault Code 48 — [manualslib.com/manual/860578/Carrier-25vna.html?page=12](https://www.manualslib.com/manual/860578/Carrier-25vna.html?page=12)

---

## SCN-RES-094 — American Standard/Trane: Heat Pump No Heating — Emergency Heat Engaged, Why
**Equipment:** American Standard Silver 14 heat pump, R-410A
**Tech describes:** "Homeowner is only getting heat from the emergency heat strips. The heat pump itself is not coming on. No fault codes visible."

### Symptoms / readings
- Thermostat: set to HEAT, Emergency Heat mode ACTIVE (switch or button deliberately activated)
- Heat pump compressor: not running (correct — EM Heat disables heat pump)
- Electric strip heat: running
- No fault codes
- Homeowner activated EM Heat "because it seemed like the heat pump wasn't heating well"

### Correct diagnosis
No mechanical failure — the homeowner manually engaged Emergency Heat mode, which deliberately bypasses the heat pump and runs only the auxiliary electric strip heaters. The heat pump was likely operating normally before EM Heat was enabled.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm thermostat is in Emergency Heat mode — there will be an indicator light or mode display showing "EM HEAT" active.
2. Explain to the homeowner (via tech): Emergency Heat mode turns off the heat pump entirely and runs only electric resistance heat. It is for use when the heat pump has failed, not for boosting heating.
3. Disable Emergency Heat mode on the thermostat. Return to standard HEAT mode.
4. After mode change: verify the heat pump starts normally within a few minutes (anti-short-cycle delay).
5. After the heat pump restarts: confirm it is producing adequate heating (supply air should be 90–100°F in heating mode at moderate OAT).
6. If the homeowner enabled EM Heat because the heat pump "wasn't heating well": investigate the original concern. Check pressures, suction temp, defrost cycle operation. There may be an underlying heat pump performance issue that caused the homeowner to switch to EM Heat.

### Safety flags
- NONE (for the mode issue itself)
- ELECTRICAL_HIGH_VOLTAGE for any diagnostic access.

### Source(s)
- Emergency heat mode explanation — [trane.com/residential/en/resources/troubleshooting/heat-pumps](https://www.trane.com/residential/en/resources/troubleshooting/heat-pumps/)

### Notes for Mike's tone / style
- Tech-facing: "Half of all 'no-heat on heat pump' calls in winter are homeowners who switched to EM Heat and forgot."

---

## SCN-RES-095 — Daikin A6 — Indoor Fan Motor Fault
**Equipment:** Daikin FTXS12LVJU wall-mounted mini-split, R-410A
**Tech describes:** "A6 fault. Indoor fan not running. No visible obstruction. Unit is 2 years old."

### Symptoms / readings
- Flash / fault code: **A6 = Indoor fan motor fault** per Daikin error code documentation
- Indoor fan: not rotating
- Visible obstruction: none
- System age: 2 years

### Correct diagnosis
Daikin indoor DC fan motor failure. At 2 years old, this is a premature failure — likely a warranty repair if within the 5-year parts warranty period (varies by model and registration).

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm A6 = indoor fan motor fault per Daikin error documentation.
2. Power down the unit and manually rotate the fan wheel — should spin freely. Any mechanical resistance = physical motor bearing failure.
3. With power ON but fan not running: measure the DC drive signal at the fan motor connector on the indoor PCB. DC voltage present and motor not running = motor failed. No DC voltage = PCB fan driver failed.
4. Check for active warranty: Daikin residential ductless units have a manufacturer parts warranty (5 years for registered units). At 2 years old, this should be a warranty claim.
5. Before ordering a new motor: verify the model number and serial number and contact Daikin warranty support. A2-year motor failure on a wall-mounted unit should be covered.
6. After motor replacement: clear A6 fault (power cycle) and verify fan runs at all speed settings.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Daikin A6 fan motor fault — [minisplitsizer.com/daikin-mini-split-error-codes](https://minisplitsizer.com/daikin-mini-split-error-codes/)

---

## SCN-RES-096 — Goodman DSZC18: High-Efficiency 2-Stage — Proper Subcooling Charging at Low Stage
**Equipment:** Goodman DSZC18 2-stage heat pump, R-410A
**Tech describes:** "Having trouble getting a good subcooling reading. Pressures keep changing. Is this unit overcharged or not?"

### Symptoms / readings
- Suction PSI: cycling between 110 and 128 psig as compressor stages
- Head PSI: cycling between 295 and 340 psig
- Subcooling: measured at 14°F (low stage) and 10°F (high stage)
- Superheat: 12°F at high stage
- Ambient OAT: 82°F
- Stage: unit cycling between low (first-stage) and high (second-stage) compressor

### Correct diagnosis
This is a proper-charging procedure issue, not a fault. A 2-stage heat pump must be charged at the correct compressor stage — subcooling target changes between low and high stage. Subcooling at 14°F on low stage vs. 10°F on high stage is within normal variance. The tech must hold high stage for at least 5 minutes before taking a charge measurement.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. For charging a 2-stage unit: the unit must be held in high stage (second-stage compressor operation) for all charge verification. Low-stage measurements are not used for charge verification.
2. To force high stage: raise the thermostat setpoint significantly above current indoor temperature (e.g., set to 60°F cooling in a 78°F house). This creates a large enough load to force second-stage operation.
3. Wait 10 minutes in high stage for the system to stabilize.
4. Subcooling on high stage: target 8–12°F for TXV systems. At 10°F (high stage) — the charge is correct.
5. The 14°F subcooling reading taken at low stage is not actionable. Ignore it.
6. Inform the tech: "Never charge a 2-stage unit from low-stage readings. Always force high stage first."

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Multi-stage charging methodology — [acservicetech.com/post/the-hvac-subcooling-charging-method-explained](https://www.acservicetech.com/post/the-hvac-subcooling-charging-method-explained)
- Ideal superheat and subcooling R-410A — [hvacallianceexpert.com/faq/ideal-superheat-and-subcooling-levels-for-r-410a](https://hvacallianceexpert.com/faq/ideal-superheat-and-subcooling-levels-for-r-410a/)

---

## SCN-RES-097 — Mitsubishi Hyper-Heat: No Operation Below -13°F Design Limit
**Equipment:** Mitsubishi MXZ-3C30NAHZ2 Hyper-Heat, R-410A
**Tech describes:** "Unit completely shut down. It's -18°F outside. No fault codes. System just stopped running."

### Symptoms / readings
- Ambient OAT: -18°F
- No fault codes
- Compressor: off
- Outdoor unit: powered, control board lit, but no compressor operation
- System design limit: -13°F

### Correct diagnosis
Normal low-ambient shutdown — the system has reached the lower limit of its operating design envelope. The Mitsubishi MXZ-3C30NAHZ2 Hyper-Heat is rated to -13°F. At -18°F, the system's low-ambient protection has shut down the compressor. This is a design protection, not a failure.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. No fault codes + OAT below the unit's rated minimum = low-ambient protection shutdown. This is correct behavior.
2. The MXZ-3C30NAHZ2 NAHZ specification: rated capacity down to -13°F. At -18°F, the unit is 5°F below its rated design floor.
3. This is a homeowner expectation and equipment sizing issue. Advise the homeowner (via the contractor) that the heat pump will not operate below approximately -13°F and that the backup heat system must carry the full load in these conditions.
4. Verify the backup heating system (gas furnace, electric strips, boiler) is operational and sized to handle the full heating load at -18°F OAT.
5. If the site requires reliable heating below -13°F, discuss with the contractor whether a different cold-climate heat pump model with a lower design floor, or increased backup heat capacity, is appropriate.
6. The system will resume normal operation when OAT rises above -13°F.

### Safety flags
- NONE

### Source(s)
- Mitsubishi Hyper-Heat MXZ cold climate specs — [mitsubishitechinfo.ca/sites/default/files/SH_MXZ-...](https://www.mitsubishitechinfo.ca/sites/default/files/SH_MXZ-%284%29%285%29%288%29C%2836%29%2842%29%2848%29%2860%29NA%28HZ%29_PAC-MKA%2830%29%2831%29%2850%29%2851%29BC_OCH573E_1.pdf)

### Notes for Mike's tone / style
- Tech-facing: "The system did the right thing by shutting down. Running a compressor at -18°F below its design floor risks compressor damage."
- Homeowner-facing: "Your heat pump is designed to operate down to -13°F. At -18°F, it needs to let your backup heating system take over."

---

## SCN-RES-098 — R-454B Post-2025 System: No R-410A Tools Available — Cannot Service
**Equipment:** Goodman GSZH6 (R-454B, 2025 production), new install
**Tech describes:** "I got dispatched to this job. The R-454B recovery machine is at the shop. I only have my R-410A tools. Can I do the service?"

### Symptoms / readings
- System: R-454B (A2L mildly flammable)
- Tech's equipment: R-410A manifold, R-410A recovery machine (NOT A2L-rated), heated diode leak detector (NOT A2L-compatible)
- Requested service: refrigerant charge verification and leak check

### Correct diagnosis
The tech CANNOT safely service this R-454B system with R-410A tools. This is a safety and legal compliance issue. Proceeding with non-rated equipment on an A2L refrigerant system is prohibited.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Non-negotiable: R-410A recovery machine is NOT rated for R-454B. It lacks explosion-proof motor and A2L-rated seals. Using it creates a fire/explosion risk.
2. Heated diode leak detectors are NOT approved for A2L refrigerants per HVAC Toolkit A2L safety guide. Do not use.
3. Stop work. Inform the dispatcher that the correct equipment is required before this service call can proceed.
4. Retrieve the A2L-rated recovery machine from the shop. If no A2L recovery machine is available at the company: this is a compliance gap. As of January 1, 2025, all new HVAC equipment uses A2L refrigerants — the company must have A2L-rated service equipment.
5. Required equipment minimum: A2L-rated recovery machine (UL60335-2-91), IR or electrochemical leak detector rated for A2L, digital manifold with R-454B refrigerant profile, A2L-rated recovery cylinders.
6. Do not attempt to use R-410A service tools on R-454B and document the stop-work for liability purposes.

### Safety flags
- A2L_REFRIGERANT
- ELECTRICAL_HIGH_VOLTAGE
- **REQUIRED PROTOCOL:** This is a stop-work scenario. Do not proceed without A2L-rated equipment.

### Source(s)
- A2L service equipment requirements — [hvactoolkit.org/resources/a2l-safety](https://hvactoolkit.org/resources/a2l-safety)
- 2025 refrigerant regulations — [servicemag.org/guides/r410a-phase-down-hvac-technicians](https://www.servicemag.org/guides/r410a-phase-down-hvac-technicians)
- EPA 608 refrigerant handling compliance — [servicemag.org/guides/refrigerant-handling-epa-608-compliance](https://www.servicemag.org/guides/refrigerant-handling-epa-608-compliance)

---

## SCN-RES-099 — York/Coleman: Com/Err — Thermostat Communication Fault
**Equipment:** York YHE048 heat pump with York communicating thermostat, R-410A
**Tech describes:** "Com/Err or Err communication code. System not responding to thermostat. New thermostat installed yesterday by homeowner."

### Symptoms / readings
- Fault code: **Com / Err = Communication failure between indoor/outdoor boards or thermostat and control modules** per York heat pump diagnostics
- Recent action: homeowner installed a standard non-communicating thermostat on a communicating York system
- 24VAC at outdoor unit: present
- Outdoor unit: not responding to thermostat calls

### Correct diagnosis
Thermostat incompatibility — a standard non-communicating thermostat was installed on a York communicating system. York communicating systems (with Comfort+ or similar controls) require a compatible communicating thermostat and cannot be properly controlled by a standard 5-wire thermostat.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm the thermostat that was installed is a standard non-communicating model. York Comfort+/YorkGuard communicating systems require proprietary or compatible communicating thermostats.
2. A standard thermostat on a communicating York system will generate communication errors because the control board is looking for digital communication signals, not simple 24VAC Y/G/W signals.
3. The fix: replace with the correct communicating thermostat for this York system. Contact York/Johnson Controls technical support with the outdoor unit model number to confirm the compatible thermostat model.
4. If the homeowner insists on a non-communicating thermostat: verify whether the York system has a "standard thermostat" mode that can be enabled at the control board. Some York communicating systems allow this — check the installation manual.
5. Document the situation: homeowner replaced the thermostat themselves. This is a self-created fault.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- York Com/Err fault — [pickcomfort.com/york-heat-pump-error-codes-troubleshooting](https://www.pickcomfort.com/york-heat-pump-error-codes-troubleshooting/)

---

## SCN-RES-100 — Carrier/Bryant: Low-Refrigerant at Service Port — Schrader Core and Missing Cap Leak
**Equipment:** Carrier Comfort 13 (24ACC) split AC, R-410A, 4 years old
**Tech describes:** "Called out for poor cooling. Pressures are a bit low. No obvious leak found. Service port caps are missing."

### Symptoms / readings
- Suction PSI: 102 psig (slightly low at 88°F OAT — normal ~120 psig)
- Head PSI: 285 psig (slightly low)
- Superheat: 18°F (slightly elevated)
- Subcooling: 6°F (slightly low — system mildly undercharged)
- Ambient OAT: 88°F
- Service port caps: both missing (suction and liquid line Schrader ports)
- Electronic leak detector: not alarming in vicinity

### Correct diagnosis
Schrader valve core leaks from missing service port caps. When service port caps are absent, the Schrader valve cores are exposed to weather, UV, and contamination. Over 4 years without caps, the rubber valve seat inside each Schrader core degrades, creating a slow but consistent refrigerant leak. The loss is too gradual (few ounces per month) for most electronic detectors to alarm on.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Missing service port caps are the first red flag on a mild undercharge with no findable leak.
2. With the system running: apply soap bubbles directly to the exposed Schrader port openings. Even 0.5 oz/year loss through a degraded Schrader core will produce tiny bubbles within 60 seconds.
3. Replace both Schrader valve cores (suction and liquid line) using a Schrader valve tool while the system is under pressure. No need to recover refrigerant to replace Schrader cores.
4. After replacing both cores: soap-bubble test both ports again with gauges off. No bubbling = leaks resolved.
5. Add the 6–8 oz of refrigerant that was lost (based on subcooling target). Verify subcooling returns to 8–12°F and suction rises to 115–120 psig.
6. Install new caps with internal rubber gaskets on both service ports and advise the contractor to add "service port cap inspection" to every service check routine.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE
- EPA 608: Even small Schrader leaks must be documented and repaired.

### Source(s)
- Schrader valve as #1 overlooked leak source — [acservicetech.com/post/where-to-find-r-22-r410a-leaks-on-ac-units-top-10-spots](https://www.acservicetech.com/post/where-to-find-r-22-r410a-leaks-on-ac-units-top-10-spots)
- R-410A leak detection guide — [acdirect.com/blog/r410a-leak-detection-guide](https://www.acdirect.com/blog/r410a-leak-detection-guide/)

---

## SCN-RES-101 — Lennox XP21 / XC21: Discharge Sensor Code 417 — Coil Sensor Placement After Coil Replacement
**Equipment:** Lennox XP21 communicating heat pump, R-410A, post-coil-replacement
**Tech describes:** "Alert code 417 on the S30 after we replaced the condenser coil yesterday. It was reading fine before."

### Symptoms / readings
- Fault code: **417 = Coil sensor problem** per Lennox XC21 Series manual (code also applies to XP21)
- Recent service: condenser coil replacement completed previous day
- System: running but generating 417 alert
- Outdoor ambient: 75°F

### Correct diagnosis
Coil sensor was not re-mounted correctly after coil replacement. The sensor was likely left dangling (reading ambient air temperature) or attached to the wrong tube section after the new coil was installed.

### Diagnostic sequence (what Mike SHOULD walk the tech through)
1. Confirm 417 = coil sensor problem per Lennox XC21 manual documentation.
2. The timing correlation is clear: the code appeared after coil replacement. The sensor was not correctly re-attached to the new coil.
3. Access the outdoor unit. Locate the coil sensor clip on the new condenser coil. It must be clipped tightly to the refrigerant tubing — typically on the liquid-line side of the condenser where it can read coil temperature accurately.
4. Re-attach the sensor clip, ensuring metal-to-metal contact between the sensor and the tube. Wrap with insulation tape if the original insulation was removed.
5. Clear the 417 fault via the S30 thermostat (Settings > Diagnostics > Clear Faults).
6. Run the system through one cooling cycle and confirm 417 does not recur.

### Safety flags
- ELECTRICAL_HIGH_VOLTAGE

### Source(s)
- Lennox XC21 Alert Code 417 — [manualslib.com/manual/922657/Lennox-Xc21-Series.html?page=36](https://www.manualslib.com/manual/922657/Lennox-Xc21-Series.html?page=36)

---

# Summary

TOTAL SCENARIOS: 101
SAFETY SCENARIOS: 12 (SCN-RES-001 EPA, SCN-RES-014 EPA, SCN-RES-021 A2L, SCN-RES-024 Capacitor, SCN-RES-025 Capacitor, SCN-RES-039 EPA R-22, SCN-RES-053 EPA, SCN-RES-063 A2L, SCN-RES-068 A2L Stop-Work, SCN-RES-072 Burnout Acid, SCN-RES-021 A2L Leak, SCN-RES-098 A2L Stop-Work)
BRANDS COVERED: Trane, American Standard, Carrier, Bryant, Payne, Lennox, Allied Air, Goodman, Amana, Daikin (North America), Rheem, Ruud, York, Coleman, Mitsubishi Electric, Bosch, Fujitsu, LG, Samsung, Bard, Cold-Climate Heat Pumps (Mitsubishi Hyper-Heat, Bosch IDS Ultra)
SOURCES CITED: 48 distinct sources

---

# Source Index

| # | Source |
|---|--------|
| 1 | [Trane Heat Pump LED Flash Codes](https://www.heatpumppricesreviews.com/trane-heat-pump-led-codes/) |
| 2 | [R-410A Pressure-Temperature Chart](https://www.acdirect.com/blog/r410a-pressure-temperature-chart-pdf/) |
| 3 | [HVAC Subcooling Charging Method](https://www.acservicetech.com/post/the-hvac-subcooling-charging-method-explained) |
| 4 | [Carrier 25VNA Fault Codes Table](https://www.manualslib.com/manual/860578/Carrier-25vna.html?page=12) |
| 5 | [Carrier 25VNA Service Manual](https://www.shareddocs.com/hvac/docs/1009/Public/01/24VNA6-25VNA4-1SM.pdf) |
| 6 | [Carrier 25VNA8 Service Manual](https://www.shareddocs.com/hvac/docs/1009/Public/01/25VNA8-24VNA9-4SM.pdf) |
| 7 | [Goodman Communicating System Codes](https://twintechheating.ca/goodman-air-conditioner-error-codes/) |
| 8 | [Goodman Diagnosis Code ID System](https://mobile.goodmanmfg.com/mobileapp/faultcodes/index.jsp) |
| 9 | [Lennox XC21 LED Fault Codes, p.36](https://www.manualslib.com/manual/922657/Lennox-Xc21-Series.html?page=36) |
| 10 | [Lennox XC25 7-Segment Alert Codes, p.30](https://www.manualslib.com/manual/1280744/Lennox-Xc25-024-230-01.html?page=30) |
| 11 | [Lennox Residential Communicating Alert Code Guide](https://www.lennox.com/dA/d89d9db1dd/100017c.pdf) |
| 12 | [Rheem RPNE Diagnostic Codes](https://ghac.makekb.com/entry/677/) |
| 13 | [Rheem EcoNet Fault Codes](https://pdf4pro.com/amp/view/econet-and-flash-codes-myrheem-com-735958.html) |
| 14 | [York Heat Pump Error Codes](https://www.pickcomfort.com/york-heat-pump-error-codes-troubleshooting/) |
| 15 | [York Simplicity Flash Codes](https://yorkcentraltechtalk.wordpress.com/2013/11/15/simplicity-diagnostics-flash-codes/) |
| 16 | [Bard CH4S1 LED Blink Codes, p.21](https://www.manualslib.com/manual/452517/Bard-Ch4s1.html?page=21) |
| 17 | [Mitsubishi Mini-Split Error Codes](https://choosesanford.com/common-error-codes-for-mitsubishi-heat-pumps/) |
| 18 | [Mitsubishi Ductless Error Codes Overview](https://www.highground.com/articles/mitsubishi-ductless-mini-split-error-codes) |
| 19 | [Mitsubishi P8 Error Code](https://choosesanford.com/mitsubishi-ductless-mini-split-p8-error-code) |
| 20 | [Mitsubishi E9 Error Code](https://choosesanford.com/mitsubishi-ductless-mini-split-e9-error-code) |
| 21 | [Mitsubishi P9 TH5 Sensor Fault](https://www.beaconsaves.com/blog/mitsubishi-mini-split-p9-error-code) |
| 22 | [Mitsubishi MXZ Technical Service Manual](https://www.mitsubishitechinfo.ca/sites/default/files/SH_MXZ-%284%29%285%29%288%29C%2836%29%2842%29%2848%29%2860%29NA%28HZ%29_PAC-MKA%2830%29%2831%29%2850%29%2851%29BC_OCH573E_1.pdf) |
| 23 | [Mitsubishi Fault Code Checklist](https://orionair.co.uk/PDF/Mitsubishi_elec_Fault_codes.pdf) |
| 24 | [LG Error Codes HVAC Toolkit](https://hvactoolkit.org/resources/error-codes/lg) |
| 25 | [Samsung Error Codes HVAC Toolkit](https://hvactoolkit.org/resources/error-codes/samsung) |
| 26 | [Samsung E601 Error Code](https://choosesanford.com/samsung-ductless-mini-split-error-code-e601) |
| 27 | [Samsung Ductless Error Codes General](https://choosesanford.com/samsung-ductless-mini-split-error-codes/) |
| 28 | [LG CH38 Error Code Investigation](https://classlawdc.com/2025/08/26/lg-mini-split-ch38-error-code-investigation/) |
| 29 | [LG CH10 Error Code](https://www.beaconsaves.com/blog/lg-mini-split-ch10-error-code) |
| 30 | [Daikin Mini-Split Error Codes Guide](https://minisplitsizer.com/daikin-mini-split-error-codes/) |
| 31 | [Daikin FTX-N Service Manual, p.128](https://www.manualslib.com/manual/1706209/Daikin-Ftx-N-Series.html?page=128) |
| 32 | [Bosch IDS Ultra Product Page](https://www.bosch-homecomfort.com/us/en/ocs/residential/ids-ultra-inverter-ducted-split-cold-climate-heat-pump-20831889-p/) |
| 33 | [Bosch A2L Refrigerant Guide](https://www.bosch-homecomfort.com/us/en/residential/knowledge/a2l-refrigerant-change-guide/) |
| 34 | [A2L Safety Guide HVAC Toolkit](https://hvactoolkit.org/resources/a2l-safety) |
| 35 | [R-454B Refrigerant Guide Cedars HVAC](https://cedarshvac.com/r454b-refrigerant-guide/) |
| 36 | [EPA SNAP R-22 Substitutes](https://www.epa.gov/snap/substitutes-residential-and-light-commercial-air-conditioning-and-heat-pumps) |
| 37 | [MO99 Retrofit Guidelines](https://www.freon.com/en/-/media/files/freon/freon-mo99-retrofit-guidelines.pdf) |
| 38 | [R-22 Phase-Out Status](https://www.acacos.com/tips/r22-service-phase-out) |
| 39 | [R-410A Phase-Down 2025](https://www.servicemag.org/guides/r410a-phase-down-hvac-technicians) |
| 40 | [EPA 608 Compliance Reference](https://www.servicemag.org/guides/refrigerant-handling-epa-608-compliance) |
| 41 | [TXV Troubleshooting HVAC Toolkit](https://hvactoolkit.org/resources/txv-troubleshooting) |
| 42 | [TXV Failure Diagnosis HVAC School](http://www.hvacrschool.com/how-to-diagnose-a-txv-failure/) |
| 43 | [Run Capacitor Diagnosis Guide](https://www.technicalhotandcoldparts.com/hvac-repair-blog/how-to-diagnose-test-and-replace-a-bad-ac-capacitor/) |
| 44 | [Start Capacitor Facts HVAC School](https://www.hvacrschool.com/start-capacitor-inrush-facts-myths-part-4) |
| 45 | [Reversing Valve Diagnosis Pick Comfort](https://www.pickcomfort.com/heat-pump-reversing-valve-stuck-causes-diagnosis-repair/) |
| 46 | [Heat Pump Defrost Troubleshooting HVAC School](http://www.hvacrschool.com/heat-pump-defrost-troubleshooting-tips/) |
| 47 | [5 Pillars Refrigerant Diagnosis HVAC School](http://www.hvacrschool.com/the-5-pillars-of-residential-ac-refrigerant-circuit-diagnosis/) |
| 48 | [Top 10 Refrigerant Leak Locations AC Service Tech](https://www.acservicetech.com/post/where-to-find-r-22-r410a-leaks-on-ac-units-top-10-spots) |

