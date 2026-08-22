/* ─────────────────────────────────────────────────────────────────────────────
 * MIKE'S FIELD BRAIN — the part of Mike that works with no signal and no AI.
 *
 * Why this exists: every answer Mike gives goes through the model. So in a
 * basement, a crawlspace, or a mechanical room with no bars — exactly where a
 * tech most needs help — Mike had nothing. The message queued and the tech got
 * silence. Same when the upstream model has an incident: Mike went fully dark
 * for a day in June and every tech saw "error, try again".
 *
 * This is the pre-AI answer to that: deterministic lookup tables and arithmetic,
 * cached on the phone, no network required. It is deliberately NARROW. It only
 * covers values that are standard across the trade and do not vary by
 * manufacturer, because a wrong spec offered confidently is worse than silence.
 * Anything brand-or-model-specific stays with the manual library and the model —
 * this never guesses a fault code.
 *
 * EVERY answer it produces is labelled as an offline field reference and tells
 * the tech to confirm against the data plate. It assists; it does not diagnose.
 * ───────────────────────────────────────────────────────────────────────────── */
(function (global) {
  'use strict';

  // Run-capacitor tolerance. ±6% is the long-standing trade standard and is what
  // manufacturers print on the can; outside that band the cap is replaced.
  var CAP_TOLERANCE = 0.06;

  // ── A PRESSURE→SATURATION CONVERTER WAS HERE AND HAS BEEN REMOVED. ──────────
  // I built the R-410A / R-22 pressure-temperature tables from memory and the values
  // were wrong — it converted 58 psig R-410A to "about 105°F saturated" when the real
  // figure is near 10°F. A tech acting on that would chase a charge problem that does
  // not exist, or miss one that does.
  //
  // The rule for this file is the same rule Mike is held to: never state a number you
  // cannot source. Capacitor tolerance is arithmetic. Target split, superheat, subcool
  // and static are single standard figures that do not vary by manufacturer. A full
  // P-T chart is precise reference data per refrigerant, and it belongs in the manual
  // library where it can be cited — not reconstructed from memory in a fallback that
  // runs exactly when nobody can check it.
  // ────────────────────────────────────────────────────────────────────────────

  var NOTE = '\n\n_Offline field reference — no signal, so this is the standard spec, not a read on your unit. Confirm against the data plate._';

  var RULES = [
    {
      id: 'capacitor',
      // "cap reads 28 on a 45" / "45 mfd measuring 28"
      test: function (t) {
        return /\b(cap|capacitor|mfd|µf|uf)\b/i.test(t) && (t.match(/\d+(?:\.\d+)?/g) || []).length >= 2;
      },
      answer: function (t) {
        var n = (t.match(/\d+(?:\.\d+)?/g) || []).map(Number).filter(function (x) { return x > 0 && x < 200; });
        if (n.length < 2) return null;
        // The rated value is the larger of the two in every real-world phrasing.
        var rated = Math.max(n[0], n[1]), measured = Math.min(n[0], n[1]);
        var lo = +(rated * (1 - CAP_TOLERANCE)).toFixed(1), hi = +(rated * (1 + CAP_TOLERANCE)).toFixed(1);
        var off = +(((measured - rated) / rated) * 100).toFixed(0);
        var verdict = (measured < lo)
          ? 'That cap is toast — ' + Math.abs(off) + '% low, well outside the ±6% window. Replace it.'
          : (measured > hi)
            ? 'That reads ' + off + '% HIGH, outside the ±6% window — replace it.'
            : 'That is inside the ±6% window (' + lo + '–' + hi + ' µF), so the cap itself checks out. Keep looking.';
        return verdict + '\n\nA ' + rated + ' µF cap is good from **' + lo + ' to ' + hi + ' µF**. You read ' + measured + '.' + NOTE;
      }
    },
    {
      id: 'superheat-subcool',
      test: function (t) { return /\b(superheat|subcool|sub-?cooling)\b/i.test(t); },
      answer: function () {
        return 'Standard targets to work against:\n\n'
          + '• **TXV / EEV system — superheat 8–12°F.** Charge to SUBCOOLING on these, not superheat.\n'
          + '• **Fixed orifice / piston — superheat comes off the manufacturer\'s charging chart** (varies with indoor wet bulb and outdoor dry bulb). There is no single number, and anyone who gives you one is guessing.\n'
          + '• **Subcooling — 10–12°F** at the condenser outlet on most residential equipment.\n\n'
          + 'Low superheat = too much charge or a flooding metering device. High superheat = undercharge or restriction.' + NOTE;
      }
    },
    {
      id: 'delta-t',
      test: function (t) { return /\b(delta ?t|split|temp(erature)? drop|supply and return)\b/i.test(t); },
      answer: function () {
        return 'Target split across the indoor coil is **16–22°F** on a properly charged system with correct airflow.\n\n'
          + '• **Under 15°F** — low charge, or too much airflow.\n'
          + '• **Over 23°F** — restricted airflow: dirty filter, dirty blower wheel, closed registers, undersized duct.\n\n'
          + 'Check airflow before you touch the charge. A restriction reads like a refrigerant problem and gets a lot of good caps and compressors condemned.' + NOTE;
      }
    },
    {
      id: 'static',
      test: function (t) { return /\bstatic( pressure)?\b|\bw\.?c\.?\b|\biwc\b/i.test(t); },
      answer: function () {
        return 'Total external static pressure should be at or under **0.5" w.c.** on most residential equipment, and under **0.8"** on high-static air handlers — check the data plate for the rated value.\n\n'
          + 'Measure supply and return, add the absolute values. High static means the blower is fighting the duct: filter, coil, closed dampers, or undersized return.' + NOTE;
      }
    },
    {
      id: 'amp-draw',
      test: function (t) { return /\b(amp|amps|amperage|fla|rla|lra)\b/i.test(t); },
      answer: function () {
        return 'Compare the reading against the data plate, not a rule of thumb:\n\n'
          + '• **RLA** — rated load amps, the compressor\'s normal running draw. Pulling well over it means high head pressure, low voltage, or a failing compressor.\n'
          + '• **FLA** — full load amps for motors.\n'
          + '• **LRA** — locked rotor amps. Seeing LRA while running means the motor is stalled — kill it before it cooks.\n\n'
          + 'The plate is the source of truth on that unit.' + NOTE;
      }
    }
  ];

  function answerOffline(text) {
    var t = String(text || '');
    if (!t.trim()) return null;
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i].test(t)) {
        try {
          var a = RULES[i].answer(t);
          if (a) return { id: RULES[i].id, text: a };
        } catch (e) { /* a broken rule must never block the fallback */ }
      }
    }
    return null;
  }

  global.MikeFieldBrain = { answer: answerOffline, rules: RULES.map(function (r) { return r.id; }) };
})(typeof window !== 'undefined' ? window : this);
