#!/usr/bin/env node
/* One-shot batch: run extractNetlist on a set of real diagrams, save netlists.
 * Run: railway run node scripts/redraw/_batch-extract.js  (injects ANTHROPIC_API_KEY) */
'use strict';
const fs = require('fs');
const { extractNetlist } = require('./extract-netlist.js');

const JOBS = [
  { name: 'easy',   tier: 'EASY (isolated HP ladder schematic)',    image: '/tmp/diagtest/easy_ladder.png', modelKey: 'CARRIER:25HPA5', circuit: 'full' },
  { name: 'medium', tier: 'MEDIUM (Carrier 25HPA5 full page)',      image: '/tmp/diagtest/25hpa5_p1.png',   modelKey: 'CARRIER:25HPA5', circuit: 'full' },
  { name: 'hard',   tier: 'HARD (Carrier 38YZA 2-stage full page)', image: '/tmp/diagtest/38yza_p1.png',    modelKey: 'CARRIER:38YZA',  circuit: 'full' },
];

(async () => {
  for (const j of JOBS) {
    process.stdout.write(`\n=== ${j.tier} ===\n  image: ${j.image}\n`);
    try {
      const out = await extractNetlist(j.image, { modelKey: j.modelKey, circuitType: j.circuit });
      const nl = out.netlist;
      fs.writeFileSync(`/tmp/diagtest/nl-${j.name}.json`, JSON.stringify(nl, null, 2));
      console.log(`  model: ${out.model} | tokens: ${out.usage?.input_tokens}in/${out.usage?.output_tokens}out`);
      console.log(`  extracted: ${nl.components?.length||0} components, ${nl.terminals?.length||0} terminals, ${nl.nets?.length||0} nets`);
      console.log(`  validation: ${out.validation.ok ? 'OK' : 'FAILED — ' + out.validation.errors.join('; ')}`);
      console.log(`  notes: ${(nl.notes||[]).length} illegible/uncertain flags`);
      (nl.notes||[]).slice(0,4).forEach(n => console.log(`     • ${n.slice(0,120)}`));
    } catch (e) {
      console.log(`  EXTRACT ERROR: ${e.message}`);
    }
  }
  console.log('\n=== batch done ===');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
