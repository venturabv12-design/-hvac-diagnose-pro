#!/usr/bin/env node
/* Mike Redraw Engine — LADDER extractor.
 *
 * extractLadder(image, opts) → ladder JSON (sections → rungs → elements).
 *
 * The vision model already SEES the schematic in ladder form; here it transcribes
 * that structure (rail → series contacts → LOAD → rail) instead of a flat netlist.
 * render-ladder-svg.js then stacks the rungs into a clean, tech-readable ladder.
 *
 * Same discipline as extract-netlist.js: extraction only (structure, never
 * coordinates), forced tool-use, fail-toward-distrust (flag illegible, never
 * invent a connection).
 *
 * CLI: node scripts/redraw/extract-ladder.js <image> <MODEL_KEY> [circuit_type]
 *      (needs ANTHROPIC_API_KEY; MIKE_MODEL optional)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { loadImage } = require('./extract-netlist.js');

const MODEL = process.env.MIKE_MODEL || 'claude-opus-4-8';

const LADDER_TOOL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['model_key', 'sections'],
  properties: {
    schema_version: { type: 'string' },
    model_key: { type: 'string' },
    circuit_type: { type: 'string' },
    sections: {
      type: 'array', minItems: 1,
      description: 'Ladder sections — typically one LINE-voltage ladder (between L1/L2) and one CONTROL 24V ladder (between R and C).',
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'title', 'voltage_class', 'left_rail', 'right_rail', 'rungs'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string', description: 'e.g. "LINE VOLTAGE — 240V" or "CONTROL — 24V"' },
          voltage_class: { type: 'string', enum: ['line', 'low-voltage', 'start-winding', 'unknown'] },
          left_rail: { type: 'string', description: 'left bus label, e.g. L1 or R' },
          right_rail: { type: 'string', description: 'right bus label, e.g. L2 or C' },
          rungs: {
            type: 'array', minItems: 1,
            description: 'One LOAD per rung. Elements ordered LEFT→RIGHT exactly as current flows: series switches/contacts FIRST, then the load LAST.',
            items: {
              type: 'object', additionalProperties: false,
              required: ['id', 'label', 'elements'],
              properties: {
                id: { type: 'string' },
                label: { type: 'string', description: 'what this rung powers, e.g. "Compressor", "Contactor coil"' },
                elements: {
                  type: 'array', minItems: 1,
                  items: {
                    type: 'object', additionalProperties: false,
                    required: ['kind', 'label'],
                    properties: {
                      kind: { type: 'string', enum: ['contact', 'switch', 'coil', 'motor', 'heater', 'solenoid', 'transformer', 'board', 'terminal', 'capacitor', 'fuse', 'overload', 'other'] },
                      state: { type: 'string', enum: ['NO', 'NC'], description: 'for contacts/switches: normally-open or normally-closed as drawn' },
                      label: { type: 'string', description: 'designation drawn on it, e.g. CONT, HPS, COMP, RVS' },
                      sub: { type: 'string', description: 'optional descriptor, e.g. "hi-press", "contactor", "from t-stat"' },
                      terminals: { type: 'array', items: { type: 'string' }, description: 'terminal designations, e.g. ["C","R","S"] or ["A1","A2"]' },
                      windings: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    bridges: {
      type: 'array',
      description: 'Parallel elements that span two points off the rungs — mainly the dual run capacitor between compressor S/R (HERM) and fan (FAN).',
      items: {
        type: 'object', additionalProperties: false,
        required: ['kind', 'label', 'between'],
        properties: {
          kind: { type: 'string', enum: ['capacitor', 'other'] },
          label: { type: 'string' },
          between: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2, description: 'two "COMPONENT/TERMINAL" refs, e.g. ["COMP/S","COMP/R"]' },
          tap: { type: 'string', description: 'cap terminal, e.g. HERM / FAN / C' },
          note: { type: 'string' },
        },
      },
    },
    notes: { type: 'array', items: { type: 'string' } },
  },
};

const SYSTEM = [
  'You are the wiring-diagram TRACER for Mike, a master HVAC tech assistant.',
  'You are shown ONE real OEM equipment wiring diagram. If it shows BOTH a pictorial "connection diagram" and a "schematic / ladder diagram", TRACE THE LADDER (schematic) form — it is the clearest source of true circuit topology. Use the connection diagram + legend only to resolve terminal designations and wire colors.',
  'Transcribe the circuit into LADDER STRUCTURE: sections (line-voltage between L1/L2, control between R and C), each with rungs. ONE LOAD PER RUNG. Elements ordered LEFT→RIGHT as current flows: the series SWITCHES/CONTACTS that control the load come FIRST, then the LOAD itself LAST.',
  '',
  'A REDRAW THAT IS PRETTY BUT WRONG IS DANGEROUS. These topology rules matter more than anything — a senior tech will reject the whole diagram over any one of them:',
  '',
  'A) START-ASSIST IS A CALLOUT, NOT A RUNG OR A BRIDGE. A start relay (SR/PRC), start/boost capacitor (SC), and start thermistor / PTCR (ST) do NOT form a load spanning L1→L2, and do NOT reduce to a clean two-point bridge. They are a nuanced assist network across the compressor start winding, and are usually optional/factory-installed (marked *). DO NOT wire them into the ladder and DO NOT emit a start-assist bridge. Instead put ONE entry in notes[] listing exactly which start-assist parts are drawn (e.g. "Start assist present: *SR start relay + *SC start capacitor across compressor start winding") and any printed mutual-exclusivity note (e.g. "when *SR/*SC installed, *ST is not used"). This keeps the redraw honest without drawing a wrong connection.',
  '',
  'B) BOARD/RELAY COIL vs CONTACT ARE TWO DIFFERENT THINGS ON TWO DIFFERENT RUNGS. When a relay or contactor is driven by a control-board OUTPUT or a thermostat call:',
  '   - the relay/contactor COIL is a load on a CONTROL rung, fed by the board output or the t-stat wire (e.g. rung "Reversing valve relay coil": R → [board RVSR output] → coil RVSR → C).',
  '   - that relay\'s CONTACT appears IN THE POWER RUNG of whatever it switches, labeled as a contact of that relay (e.g. the RVS solenoid rung uses an "RVSR contact"; the ODF fan rung uses a "DR/ODFR contact").',
  '   Do NOT collapse "thermostat input → relay → load" into one fake series string. The thermostat O/W2/Y wires are INPUTS to the board — show them feeding the board, not wired straight through to a solenoid.',
  '',
  'C) THE DEFROST CONTROL BOARD IS ONE COMPONENT WITH MANY I/O — do not scatter it into many near-identical "INPUT/LOGIC" rungs, and do not collapse its sensors away. Represent the board once (a board element), and list its real sensor inputs (defrost thermostat DFT, outdoor coil thermistor OCT/DFT, outdoor air thermistor OAT), its power (R/C), and its named outputs (RVSR, AUXR, ODFR, W2, K4) in that board element\'s terminals + notes[].',
  '',
  'D) DUAL RUN CAPACITOR — be precise in bridges[]: HERM ↔ compressor START winding (S), FAN ↔ condenser fan motor (its start lead), C (common) ↔ the LINE/CONTACTOR side (NOT to COMP/R). State the actual terminal each spade lands on.',
  'E) CONTROL TRANSFORMER — if the unit has its own 24V control transformer, include it as a load in the LINE section (primary across L1/L2); it is what sources the R/C control rails. Do not omit it. (If the unit is powered by an external/indoor 24V supply with no condenser transformer, note that instead.)',
  '',
  'F) A COIL IS NEVER GATED BY ITS OWN CONTACT. Never place a CONT contact in series with the CONT coil (nor RVSR contact with the RVSR coil, etc.) — a relay/contactor cannot switch its own coil; that is a physical impossibility and a fabricated self-latch. A coil rung is driven ONLY by upstream switches, thermostat calls, or board outputs. The relay/contactor’s OWN contacts appear only in the OTHER (power) rungs it switches.',
  'G) COMPRESSOR TIME DELAY (CTD / ASCD / anti-short-cycle) is a single timer element in the coil’s control string — represent it as ONE element (kind "board" or "coil", label CTD) in series; do not invent extra contacts around it.',
  'H) Only mark a contact NO or NC when the diagram clearly shows that state. If the state is not clearly drawn, leave state blank rather than asserting one.',
  '',
  'GENERAL RULES:',
  '1. Trace EXACTLY what is drawn. Never invent a rung, contact, or load. Never force a networked circuit into a straight series string just to make a rung.',
  '2. Correct rail per load: compressor, condenser fan, crankcase heater, transformer primary → LINE; contactor coil, relay coils, reversing-valve solenoid, control board → CONTROL.',
  '3. Mark each contact/switch NO or NC exactly as drawn. Use the real printed designations.',
  '4. If a structure is a network you cannot cleanly express as a rung, put it in bridges[] or describe it in notes[] rather than drawing it wrong. When in doubt, notes[] — fail toward distrust.',
  '5. If any part is illegible/ambiguous, omit it and name it in notes[]. Never guess.',
  'Return ONLY the emit_ladder tool call.',
].join('\n');

function validateLadder(L) {
  const errors = [];
  if (!L || typeof L !== 'object') return { ok: false, errors: ['not an object'] };
  if (!Array.isArray(L.sections) || !L.sections.length) errors.push('no sections');
  let rungCount = 0, loadCount = 0;
  (L.sections || []).forEach((s, si) => {
    if (!Array.isArray(s.rungs)) { errors.push(`section ${si} no rungs`); return; }
    s.rungs.forEach((r, ri) => {
      rungCount++;
      if (!Array.isArray(r.elements) || !r.elements.length) errors.push(`section ${si} rung ${ri} no elements`);
      else {
        const hasLoad = r.elements.some(e => ['motor', 'coil', 'heater', 'solenoid', 'transformer', 'board'].includes(e.kind));
        if (hasLoad) loadCount++;
      }
    });
  });
  return { ok: errors.length === 0, errors, rungCount, loadCount };
}

async function extractLadder(imageRef, opts = {}) {
  const apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  const modelKey = opts.modelKey || 'UNKNOWN:UNKNOWN';
  const circuitType = opts.circuitType || 'full';
  const img = await loadImage(imageRef);

  const body = {
    model: opts.model || MODEL,
    max_tokens: opts.maxTokens || 8192,
    system: SYSTEM,
    tools: [{ name: 'emit_ladder', description: 'Emit the traced circuit as ladder structure. Structure only, never coordinates.', input_schema: LADDER_TOOL_SCHEMA }],
    tool_choice: { type: 'tool', name: 'emit_ladder' },
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } },
      { type: 'text', text: `Trace this into ladder structure. model_key "${modelKey}", circuit "${circuitType}". One load per rung, elements left→right (controls first, load last). Flag anything illegible in notes — never guess.` },
    ] }],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs || 120000);
  let data;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body), signal: controller.signal,
    });
    data = await r.json();
    if (!r.ok) throw new Error(`Anthropic ${r.status}: ${data?.error?.message || 'error'}`);
  } finally { clearTimeout(timeout); }

  const tb = (data.content || []).find(b => b.type === 'tool_use' && b.name === 'emit_ladder');
  if (!tb) throw new Error('no emit_ladder tool call');
  const ladder = tb.input;
  ladder.schema_version = ladder.schema_version || '1';
  ladder.model_key = modelKey;
  ladder.circuit_type = ladder.circuit_type || circuitType;

  return { ladder, validation: validateLadder(ladder), usage: data.usage || null, model: data.model || body.model };
}

module.exports = { extractLadder, validateLadder, LADDER_TOOL_SCHEMA };

if (require.main === module) {
  const [imageRef, modelKey, circuitType] = process.argv.slice(2);
  if (!imageRef) { console.error('usage: extract-ladder.js <image> <MODEL_KEY> [circuit_type]'); process.exit(2); }
  (async () => {
    const out = await extractLadder(imageRef, { modelKey, circuitType });
    const L = out.ladder;
    console.log(`sections: ${L.sections.length} | rungs: ${out.validation.rungCount} | loads: ${out.validation.loadCount}`);
    console.log(`validation: ${out.validation.ok ? 'OK' : 'ISSUES — ' + out.validation.errors.join('; ')}`);
    console.log(`tokens: ${out.usage?.input_tokens}in/${out.usage?.output_tokens}out | notes: ${(L.notes||[]).length}`);
    const p = `/tmp/diagtest/ladder-${(modelKey||'x').replace(/[^a-z0-9]/gi,'_')}.json`;
    fs.writeFileSync(p, JSON.stringify(L, null, 2));
    console.log('→', p);
  })().catch(e => { console.error('FATAL', e.message); process.exit(1); });
}
