#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
 * Standalone demo of the redraw engine — NO network, NO AI, NO DB.
 *
 *   node scripts/redraw/demo.js
 *
 * 1. Loads sample-condenser.json (a single-stage R-410A condenser netlist).
 * 2. Renders it to a clean SVG via renderNetlistSVG (deterministic).
 * 3. Writes the SVG to /tmp/redraw-out.svg.
 * 4. Runs the verify gate two ways:
 *      a) redraw netlist == source netlist  -> must VERIFY (score 1.0).
 *      b) SVG round-trip (parse data-net attrs back out) -> must VERIFY.
 *    And a negative control (drop one net) -> must fall to DRAFT.
 * 5. Prints the verdict.
 *
 * Exit 0 on success, 1 if any expected verdict is wrong (so it's CI-usable).
 * ════════════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const { renderNetlistSVG } = require('./render-netlist-svg');
const { verifyRedraw, THRESHOLD } = require('./verify-gate');

function main() {
  const samplePath = path.join(__dirname, 'sample-condenser.json');
  const netlist = JSON.parse(fs.readFileSync(samplePath, 'utf8'));

  console.log('── Mike Redraw Engine · standalone demo ──────────────────────────');
  console.log('model_key   :', netlist.model_key);
  console.log('circuit     :', netlist.circuit_type);
  console.log('components  :', netlist.components.length);
  console.log('terminals   :', (netlist.terminals || []).length);
  console.log('nets        :', netlist.nets.length);

  // 1) RENDER (deterministic)
  const svg = renderNetlistSVG(netlist);
  const outPath = '/tmp/redraw-out.svg';
  fs.writeFileSync(outPath, svg);
  console.log('\nRendered SVG → ' + outPath + '  (' + (svg.length / 1024).toFixed(1) + ' KB)');

  // Byte-stability check: same netlist must render identical bytes.
  const svg2 = renderNetlistSVG(JSON.parse(fs.readFileSync(samplePath, 'utf8')));
  const stable = svg === svg2;
  console.log('deterministic (byte-stable re-render): ' + (stable ? 'YES' : 'NO'));

  // 2a) VERIFY: redraw netlist vs source netlist (identity → verified)
  const vNetlist = verifyRedraw(netlist, netlist);
  console.log('\n[A] verify (netlist round-trip):');
  console.log('    state=' + vNetlist.state + '  score=' + vNetlist.score.toFixed(4) +
    '  mismatches=' + vNetlist.mismatches.length + '  (threshold ' + THRESHOLD + ')');

  // 2b) VERIFY: parse the SVG's data-net attrs back out and compare to source
  const vSvg = verifyRedraw(netlist, svg);
  console.log('[B] verify (SVG data-attr round-trip):');
  console.log('    state=' + vSvg.state + '  score=' + vSvg.score.toFixed(4) +
    '  mismatches=' + vSvg.mismatches.length);

  // 2c) NEGATIVE CONTROL: a redraw missing one net must NOT verify.
  const broken = JSON.parse(JSON.stringify(netlist));
  broken.nets = broken.nets.slice(0, -1);       // drop the last net (n9, 24V common)
  const vBroken = verifyRedraw(netlist, broken);
  console.log('[C] verify (negative control — dropped 1 net):');
  console.log('    state=' + vBroken.state + '  score=' + vBroken.score.toFixed(4) +
    '  missing=' + vBroken.mismatches.filter(m => m.kind === 'missing').length);

  // Verdict
  const passA = vNetlist.state === 'verified' && vNetlist.score === 1;
  const passB = vSvg.state === 'verified' && vSvg.score >= THRESHOLD;
  const passC = vBroken.state === 'draft';
  const ok = stable && passA && passB && passC;

  console.log('\n── VERDICT ───────────────────────────────────────────────────────');
  console.log('  deterministic render : ' + (stable ? 'PASS' : 'FAIL'));
  console.log('  A netlist verify     : ' + (passA ? 'PASS' : 'FAIL'));
  console.log('  B SVG round-trip     : ' + (passB ? 'PASS' : 'FAIL'));
  console.log('  C fail-toward-distrust: ' + (passC ? 'PASS' : 'FAIL'));
  console.log('  OVERALL              : ' + (ok ? '✅ PASS' : '❌ FAIL'));
  console.log('  SVG written to       : ' + outPath);

  process.exit(ok ? 0 : 1);
}

main();
