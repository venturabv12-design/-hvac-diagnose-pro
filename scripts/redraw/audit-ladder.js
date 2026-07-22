#!/usr/bin/env node
/* Second-model ACCURACY AUDIT — the trust gate.
 *
 * A clean redraw that is WRONG is dangerous. This runs an INDEPENDENT vision pass:
 * show the model the ORIGINAL OEM diagram + Mike's redrawn ladder as a connection
 * list, and have it hunt for INVENTED / MISSING / WRONG connections. Fail toward
 * distrust — anything uncertain is flagged, not waved through.
 *
 * CLI: node scripts/redraw/audit-ladder.js <original-image> <ladder.json>
 */
'use strict';
const fs = require('fs');
const { loadImage } = require('./extract-netlist.js');
const MODEL = process.env.MIKE_MODEL || 'claude-opus-4-8';

function ladderToText(L) {
  const lines = [];
  (L.sections || []).forEach(s => {
    lines.push(`SECTION ${s.title} (rails ${s.left_rail}..${s.right_rail}):`);
    (s.rungs || []).forEach(r => {
      const chain = (r.elements || []).map(e => {
        let t = e.label + (e.state ? `[${e.state}]` : '') + (e.terminals ? `{${e.terminals.join(',')}}` : '');
        return t;
      }).join('  →  ');
      lines.push(`  • ${r.label}: ${s.left_rail} → ${chain} → ${s.right_rail}`);
    });
  });
  (L.bridges || []).forEach(b => lines.push(`BRIDGE ${b.label}: ${(b.between||[]).join(' ↔ ')} (${b.tap||''})`));
  return lines.join('\n');
}

const AUDIT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['fidelity', 'safe_as_simplified_guide', 'misleading_errors', 'acceptable_simplifications', 'summary'],
  properties: {
    fidelity: { type: 'integer', description: '0-100: how faithfully the redraw represents the CORE power/control topology actually drawn' },
    safe_as_simplified_guide: { type: 'boolean', description: 'true if a tech could follow this redraw for the main circuits without being MISLED — i.e. ZERO misleading_errors. Simplification (omitted harness/test/optional detail) does NOT make it unsafe.' },
    misleading_errors: { type: 'array', items: { type: 'string' }, description: 'ONLY topology that would actively MISDIRECT a tech troubleshooting the core compressor / fan / heater / contactor / control circuits: a fabricated series string, a wrong rail, a load switched by the wrong contact, a meaningless/wrong bridge. These are the dangerous ones.' },
    acceptable_simplifications: { type: 'array', items: { type: 'string' }, description: 'detail omitted or simplified but NOT misrepresented: plug harnesses (PL), test/speed-up pins, comms bus, optional external-power, wire colors, non-load notes. Not safety-relevant.' },
    summary: { type: 'string' },
  },
};

const SYSTEM = [
  'You are a senior HVAC controls engineer auditing an AI-redrawn wiring LADDER against the ORIGINAL OEM diagram (shown).',
  'CONTEXT: the redraw is deliberately a SIMPLIFIED, clean guide for a tech IN THE FIELD, with the full OEM manual one tap away. Judge it as such — NOT as a 1:1 reproduction.',
  'Your job is to separate two very different things:',
  '  • MISLEADING ERRORS — topology that would actively MISDIRECT a tech troubleshooting the CORE circuits (compressor, condenser fan, crankcase heater, contactor, the main 24V control string): a fabricated series string, a load on the wrong rail, a load switched by the wrong contact, a meaningless or wrong bridge. These are dangerous. List every real one you can see.',
  '  • ACCEPTABLE SIMPLIFICATIONS — detail merely omitted or condensed but NOT misrepresented: plug/harness receptacles (PL1-5), test/speed-up/forced-defrost pins, communication bus, optional external-power sources, wire colors, and functional-only notes. These do NOT make the redraw unsafe.',
  'safe_as_simplified_guide = true ONLY if there are ZERO misleading errors. Do not let acceptable simplifications lower it. But do fail toward distrust on anything genuinely misleading — only flag REAL discrepancies visible in the image.',
].join('\n');

async function auditLadder(imageRef, ladder, opts = {}) {
  const apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  const img = await loadImage(imageRef);
  const body = {
    model: opts.model || MODEL,
    max_tokens: 4096,
    system: SYSTEM,
    tools: [{ name: 'emit_audit', description: 'Report the accuracy audit.', input_schema: AUDIT_SCHEMA }],
    tool_choice: { type: 'tool', name: 'emit_audit' },
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } },
      { type: 'text', text: `Here is the AI redraw's claimed circuit (as a connection list). Audit it against the ORIGINAL diagram above.\n\n${ladderToText(ladder)}` },
    ] }],
  };
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 120000);
  let data;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body), signal: controller.signal,
    });
    data = await r.json();
    if (!r.ok) throw new Error(`Anthropic ${r.status}: ${data?.error?.message}`);
  } finally { clearTimeout(to); }
  const tb = (data.content || []).find(b => b.type === 'tool_use' && b.name === 'emit_audit');
  if (!tb) throw new Error('no emit_audit');
  return { audit: tb.input, usage: data.usage };
}

module.exports = { auditLadder, ladderToText };

if (require.main === module) {
  const [image, ladderPath] = process.argv.slice(2);
  (async () => {
    const L = JSON.parse(fs.readFileSync(ladderPath, 'utf8'));
    const { audit, usage } = await auditLadder(image, L);
    console.log(`fidelity: ${audit.fidelity}/100 | safe_as_simplified_guide: ${audit.safe_as_simplified_guide} | ${usage?.input_tokens}in/${usage?.output_tokens}out`);
    console.log(`summary: ${audit.summary}`);
    const show = (t, a) => { if (a && a.length) { console.log(`${t} (${a.length}):`); a.forEach(x => console.log('   -', x)); } };
    show('⚠ MISLEADING', audit.misleading_errors); show('~ simplifications', audit.acceptable_simplifications);
  })().catch(e => { console.error('FATAL', e.message); process.exit(1); });
}
