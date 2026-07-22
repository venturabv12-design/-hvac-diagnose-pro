'use strict';
const fs = require('fs');
const { extractLadder } = require('./extract-ladder.js');
const JOBS = [
  { name:'easy',   image:'/tmp/diagtest/easy_ladder.png', modelKey:'CARRIER:25HPA5', tier:'EASY (isolated ladder)' },
  { name:'medium', image:'/tmp/diagtest/25hpa5_p1.png',   modelKey:'CARRIER:25HPA5', tier:'MEDIUM (full page)' },
  { name:'hard',   image:'/tmp/diagtest/38yza_p1.png',    modelKey:'CARRIER:38YZA',  tier:'HARD (2-stage full page)' },
];
(async () => {
  for (const j of JOBS) {
    process.stdout.write(`\n=== ${j.tier} ===\n`);
    try {
      const out = await extractLadder(j.image, { modelKey:j.modelKey });
      fs.writeFileSync(`/tmp/diagtest/ladder-${j.name}.json`, JSON.stringify(out.ladder, null, 2));
      console.log(`  sections=${out.ladder.sections.length} rungs=${out.validation.rungCount} loads=${out.validation.loadCount} | ${out.usage?.input_tokens}in/${out.usage?.output_tokens}out`);
      console.log(`  validation: ${out.validation.ok?'OK':'ISSUES — '+out.validation.errors.join('; ')} | notes: ${(out.ladder.notes||[]).length}`);
    } catch (e) { console.log('  ERROR', e.message); }
  }
  console.log('\n=== done ===');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
