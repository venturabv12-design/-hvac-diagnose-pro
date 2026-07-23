#!/usr/bin/env node
/* Mike Redraw Engine — the vision EXTRACTOR (the genuinely-missing brain).
 *
 * extractNetlist(image, opts) → netlist JSON (conforms to netlist-schema.json)
 *
 * The whole accuracy story: the AI's job is EXTRACTION, not drawing. It traces
 * the REAL OEM wiring diagram and emits a structured netlist (components /
 * terminals / nets) via FORCED tool-use — it never emits an SVG coordinate, so
 * a hallucinated wire has nowhere to hide. render-netlist-svg.js draws it
 * deterministically; verify-gate.js round-trips it against this source.
 *
 * Fail-toward-distrust: if the diagram is unreadable, the extractor is told to
 * emit an empty/partial netlist and set a note — never to guess a connection.
 * validateNetlist() then rejects any structurally-broken output BEFORE the
 * renderer or verify gate ever sees it.
 *
 * No locked files touched. No prod mutation. Pairs with the existing pure
 * render + verify modules in this folder.
 *
 * CLI:  node scripts/redraw/extract-netlist.js <image-path-or-url> <MODEL_KEY> [circuit_type]
 *       (needs ANTHROPIC_API_KEY in env; MIKE_MODEL optional, defaults to claude-opus-4-8)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const fsExistsSafe = (p) => { try { return typeof p === 'string' && p.length < 4096 && fs.existsSync(p); } catch { return false; } };

const SCHEMA = JSON.parse(fs.readFileSync(path.join(__dirname, 'netlist-schema.json'), 'utf8'));
const MODEL = process.env.MIKE_MODEL || 'claude-opus-4-8';
const ANTHROPIC_VERSION = '2023-06-01';

// ── The extraction contract, as an Anthropic tool. input_schema IS the netlist
//    schema (minus the JSON-Schema meta keys the API rejects), so the model is
//    forced to return validated structure, not prose. ──────────────────────────
function toolInputSchema() {
  const s = JSON.parse(JSON.stringify(SCHEMA));
  delete s.$schema;
  delete s.$id;
  delete s.title;
  return s;
}

const SYSTEM = [
  'You are the wiring-diagram TRACER for Mike, a master HVAC tech assistant.',
  'You are shown ONE real OEM equipment wiring diagram (a photograph or a rendered manual page).',
  'Your ONLY job is to TRANSCRIBE the circuit into a structured netlist — you never draw, you never design.',
  '',
  'HARD RULES (a wrong wire on a live unit = shock or a fried board — accuracy is the whole job):',
  '1. Trace EXACTLY what is drawn. Every net (electrical node) you output must correspond to a conductor you can actually see connecting the terminals.',
  '2. NEVER infer, complete, or "correct" a connection that is not clearly drawn. If two things are not visibly wired together, they are not on the same net.',
  '3. If part of the diagram is illegible, cropped, or ambiguous, DO NOT guess. Omit that connection and add a string to notes[] naming what was unreadable. Fail toward distrust.',
  '4. Use the terminal designations printed on the diagram (C, R, S, HERM, FAN, Y, W, G, C, 24V, L1, L2, A1, A2, T1, T2, etc.). Do not invent designations.',
  '5. Every nets[].endpoints[] {component,terminal} MUST reference a component you declared in components[] and a terminal you declared in terminals[]. No dangling references.',
  '6. Assign voltage_class honestly: line = 208/240V line side, low-voltage = 24V control, start-winding = start/run-cap windings, ground = equipment ground. If unsure, use "unknown".',
  '7. Capture the real wire_color when the diagram shows/labels it. Do not fabricate a color.',
  '',
  'COMPLETENESS (this redraw is shown to apprentices, techs, AND homeowners — EVERY wire must be traced, nothing left hanging):',
  '8. Trace the WHOLE circuit. Include EVERY component drawn: contactor, compressor, run capacitor, condenser fan motor, control transformer, crankcase heater + its switch, ALL pressure/temp switches (LPS/HPS/DTS), the time-delay/anti-short-cycle, thermostat, indoor blower lead, and any start components ACTUALLY drawn.',
  '9. NO DANGLING TERMINALS: every terminal that is wired in the source must appear in at least one net. If you declare a terminal, it must connect to something (unless the diagram truly shows it unused). Do not leave a compressor S, a cap spade, a transformer lead, or a switch pole unconnected if the drawing wires it.',
  '10. THE CONTROL TRANSFORMER IS POWERED FROM THE LINE: its PRIMARY (H1/H2 or 240V side) connects across the line voltage (L1/L2 / the contactor line side). This is always true for a unit-mounted transformer — trace it. Its SECONDARY (R/C, 24V) feeds the control circuit. Both sides must be wired.',
  '11. Trace the FULL 24V control path end to end: transformer secondary → thermostat call → each safety switch in series → time delay → contactor coil → back to transformer common. Every hop is a net.',
  '',
  'PLAIN ENGLISH (the apprentice/homeowner view — this is required, not optional):',
  '12. For EVERY net, fill nets[].plain with ONE short plain-English sentence a brand-new apprentice or a homeowner could read — what that wire actually DOES. NO abbreviations, spell it all out: HERM -> "compressor run terminal", FAN (on cap) -> "outdoor fan", OFM -> "outdoor fan motor", LPS/HPS/DTS -> "low/high-pressure / discharge-temp safety switch", CTD -> "compressor time-delay", CCH -> "crankcase heater", LLS -> "liquid-line solenoid", L1/L2 -> "one leg of the 240-volt power", 24V -> "24-volt control power". Example: "24-volt power to the contactor coil — starts the compressor." Keep it tight, under ~60 characters so it fits on one line.',
  '',
  'Prefer COMPLETE, fully-connected tracing over cosmetic detail — but never invent a connection that is not drawn. Return ONLY the tool call.',
].join('\n');

// ── Image loading: data-URL / raw base64 / local path / http(s) URL → {media_type, data(base64)} ─────
async function loadImage(imageRef) {
  let buf, contentType;
  // data URL from a client upload: data:image/png;base64,XXXX  (also tolerates raw base64)
  const dm = typeof imageRef === 'string' && imageRef.match(/^data:(image\/[a-z+]+);base64,(.*)$/i);
  if (dm) {
    contentType = dm[1].toLowerCase(); buf = Buffer.from(dm[2], 'base64');
  } else if (typeof imageRef === 'string' && /^[A-Za-z0-9+/=\s]+$/.test(imageRef) && imageRef.length > 256 && !/^https?:\/\//i.test(imageRef) && !fsExistsSafe(imageRef)) {
    buf = Buffer.from(imageRef.replace(/\s+/g, ''), 'base64'); contentType = '';
  } else if (/^https?:\/\//i.test(imageRef)) {
    const r = await fetch(imageRef, {
      headers: {
        // OEM manual hosts (Cloudflare) 520 a bare fetch — send a real UA.
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Accept': 'image/avif,image/webp,image/png,image/jpeg,*/*',
      },
    });
    if (!r.ok) throw new Error(`image fetch ${r.status} for ${imageRef}`);
    contentType = (r.headers.get('content-type') || '').split(';')[0].trim();
    buf = Buffer.from(await r.arrayBuffer());
  } else {
    buf = fs.readFileSync(imageRef);
    const ext = path.extname(imageRef).toLowerCase();
    contentType = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' }[ext] || '';
  }
  const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!ALLOWED.includes(contentType)) {
    // sniff magic bytes as a fallback
    if (buf[0] === 0x89 && buf[1] === 0x50) contentType = 'image/png';
    else if (buf[0] === 0xff && buf[1] === 0xd8) contentType = 'image/jpeg';
    else if (buf.slice(0, 4).toString() === 'RIFF') contentType = 'image/webp';
    else throw new Error(`unsupported image type "${contentType}" (need png/jpeg/webp/gif)`);
  }
  return { media_type: contentType, data: buf.toString('base64'), bytes: buf.length };
}

// ── Structural validation — the same contract render + verify rely on.
//    Returns { ok, errors[] }. This is what keeps a broken extraction from ever
//    reaching the renderer or being trusted. ────────────────────────────────────
function validateNetlist(nl) {
  const errors = [];
  if (!nl || typeof nl !== 'object') return { ok: false, errors: ['netlist not an object'] };
  for (const k of ['model_key', 'circuit_type', 'components', 'terminals', 'nets']) {
    if (nl[k] == null) errors.push(`missing required "${k}"`);
  }
  const comps = Array.isArray(nl.components) ? nl.components : [];
  const terms = Array.isArray(nl.terminals) ? nl.terminals : [];
  const nets = Array.isArray(nl.nets) ? nl.nets : [];

  const compIds = new Set();
  for (const c of comps) {
    if (!c || !c.id) { errors.push('component with no id'); continue; }
    if (compIds.has(c.id)) errors.push(`duplicate component id "${c.id}"`);
    compIds.add(c.id);
  }
  // terminal ids are unique WITHIN a component
  const termKey = (comp, id) => `${comp} ${id}`;
  const termSet = new Set();
  for (const t of terms) {
    if (!t || !t.component || !t.id) { errors.push('terminal missing component/id'); continue; }
    if (!compIds.has(t.component)) errors.push(`terminal "${t.id}" references unknown component "${t.component}"`);
    const key = termKey(t.component, t.id);
    if (termSet.has(key)) errors.push(`duplicate terminal "${t.component}.${t.id}"`);
    termSet.add(key);
  }
  const netIds = new Set();
  for (const n of nets) {
    if (!n || !n.id) { errors.push('net with no id'); continue; }
    if (netIds.has(n.id)) errors.push(`duplicate net id "${n.id}"`);
    netIds.add(n.id);
    const eps = Array.isArray(n.endpoints) ? n.endpoints : [];
    if (eps.length < 2) errors.push(`net "${n.id}" has <2 endpoints`);
    for (const e of eps) {
      if (!e || !e.component || !e.terminal) { errors.push(`net "${n.id}" endpoint missing component/terminal`); continue; }
      if (!compIds.has(e.component)) errors.push(`net "${n.id}" endpoint → unknown component "${e.component}"`);
      else if (!termSet.has(termKey(e.component, e.terminal))) errors.push(`net "${n.id}" endpoint → undeclared terminal "${e.component}.${e.terminal}"`);
    }
  }
  return { ok: errors.length === 0, errors };
}

// ── The extractor ─────────────────────────────────────────────────────────────
async function extractNetlist(imageRef, opts = {}) {
  const apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set (needed for the vision call)');
  const modelKey = opts.modelKey || 'UNKNOWN:UNKNOWN';
  const circuitType = opts.circuitType || 'full';

  const img = await loadImage(imageRef);

  const userText = [
    `Trace this wiring diagram into a netlist.`,
    `model_key: "${modelKey}"`,
    `circuit_type: "${circuitType}" (extract this circuit; if the diagram is a single combined schematic, extract the whole thing).`,
    opts.hint ? `Field note: ${opts.hint}` : '',
    `Remember: transcribe only conductors you can actually see. Omit anything illegible and note it. Never invent a connection.`,
  ].filter(Boolean).join('\n');

  const body = {
    model: opts.model || MODEL,
    max_tokens: opts.maxTokens || 8192,
    system: SYSTEM,
    tools: [{
      name: 'emit_netlist',
      description: 'Emit the traced wiring netlist. Structure only — never coordinates. Every net endpoint must resolve to a declared component + terminal.',
      input_schema: toolInputSchema(),
    }],
    tool_choice: { type: 'tool', name: 'emit_netlist' },
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } },
        { type: 'text', text: userText },
      ],
    }],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs || 90000);
  let data;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    data = await r.json();
    if (!r.ok) throw new Error(`Anthropic ${r.status}: ${data?.error?.message || 'error'}`);
  } finally {
    clearTimeout(timeout);
  }

  const toolBlock = (data.content || []).find(b => b.type === 'tool_use' && b.name === 'emit_netlist');
  if (!toolBlock) throw new Error('model returned no emit_netlist tool call');
  const netlist = toolBlock.input;

  // enforce the identity fields + provenance regardless of model drift
  netlist.schema_version = netlist.schema_version || '1';
  netlist.model_key = modelKey;
  netlist.circuit_type = netlist.circuit_type || circuitType;
  if (opts.sourceRef) netlist.source_ref = { ...(netlist.source_ref || {}), ...opts.sourceRef };

  const validation = validateNetlist(netlist);
  return {
    netlist,
    validation,
    usage: data.usage || null,
    model: data.model || body.model,
    imageBytes: img.bytes,
    stopReason: data.stop_reason,
  };
}

// Salvage a mostly-good trace: drop only the malformed nets (unresolvable/ <2 endpoints) and keep the
// rest. Fail-toward-distrust at the WIRE level, not the whole diagram — an ambiguous wire is omitted
// (real manual one tap away) instead of throwing away a diagram whose parts + other wires are fine.
function sanitizeNetlist(nl) {
  if (!nl || !Array.isArray(nl.components)) return nl;
  const comps = new Set(nl.components.filter(c => c && c.id).map(c => c.id));
  const terms = new Set((nl.terminals || []).filter(t => t && t.component && t.id).map(t => `${t.component} ${t.id}`));
  const nets = (nl.nets || []).map(n => {
    if (!n || !n.id) return null;
    const seen = new Set();
    const eps = (n.endpoints || []).filter(e => {
      if (!e || !e.component || !e.terminal) return false;
      if (!comps.has(e.component) || !terms.has(`${e.component} ${e.terminal}`)) return false;
      const k = `${e.component}/${e.terminal}`; if (seen.has(k)) return false; seen.add(k); return true;
    });
    return eps.length >= 2 ? { ...n, endpoints: eps } : null;
  }).filter(Boolean);
  const dropped = (nl.nets || []).length - nets.length;
  const notes = [...(nl.notes || [])];
  if (dropped > 0) notes.push(`Sanitized: dropped ${dropped} ambiguous/unresolvable wire(s) — omitted rather than guessed; verify against the real manual.`);
  return { ...nl, nets, notes };
}

module.exports = { extractNetlist, validateNetlist, sanitizeNetlist, loadImage, SYSTEM };

// ── CLI ───────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const [imageRef, modelKey, circuitType] = process.argv.slice(2);
  if (!imageRef) {
    console.error('usage: node scripts/redraw/extract-netlist.js <image-path-or-url> <MODEL_KEY> [circuit_type]');
    process.exit(2);
  }
  (async () => {
    console.log('── extractNetlist ─────────────────────────────');
    console.log('image     :', imageRef);
    console.log('model_key :', modelKey || '(none)');
    console.log('circuit   :', circuitType || 'full');
    console.log('vision    :', MODEL, '\n');
    const out = await extractNetlist(imageRef, { modelKey, circuitType });
    const nl = out.netlist;
    console.log(`extracted : ${nl.components?.length || 0} components, ${nl.terminals?.length || 0} terminals, ${nl.nets?.length || 0} nets`);
    console.log('usage     :', out.usage ? `${out.usage.input_tokens} in / ${out.usage.output_tokens} out` : '(n/a)');
    console.log('validation:', out.validation.ok ? 'OK ✅' : 'FAILED ❌');
    if (!out.validation.ok) out.validation.errors.forEach(e => console.log('   -', e));
    if (nl.notes?.length) { console.log('notes     :'); nl.notes.forEach(n => console.log('   •', n)); }
    const outPath = '/tmp/extracted-netlist.json';
    fs.writeFileSync(outPath, JSON.stringify(nl, null, 2));
    console.log('\nnetlist → ', outPath);
    process.exit(out.validation.ok ? 0 : 1);
  })().catch(e => { console.error('FATAL', e.message); process.exit(1); });
}
