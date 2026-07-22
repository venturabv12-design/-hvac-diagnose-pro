'use strict';
const fs=require('fs');
const { auditLadder } = require('./audit-ladder.js');
const JOBS=[
 {name:'medium', image:'/tmp/diagtest/25hpa5_p1.png', ladder:'/tmp/diagtest/ladder-medium.json'},
 {name:'hard',   image:'/tmp/diagtest/38yza_p1.png',  ladder:'/tmp/diagtest/ladder-hard.json'},
];
(async()=>{
 for(const j of JOBS){
   console.log(`\n===== AUDIT ${j.name} =====`);
   try{
     const L=JSON.parse(fs.readFileSync(j.ladder,'utf8'));
     const {audit,usage}=await auditLadder(j.image,L);
     console.log(`fidelity ${audit.fidelity}/100 | safe_to_use ${audit.safe_to_use} | ${usage?.input_tokens}in/${usage?.output_tokens}out`);
     console.log('summary:',audit.summary);
     const show=(t,a)=>{if(a&&a.length){console.log(`${t} (${a.length}):`);a.forEach(x=>console.log('  -',x));}};
     show('INVENTED',audit.invented);show('MISSING',audit.missing);show('WRONG',audit.wrong);
   }catch(e){console.log('ERR',e.message);}
 }
})();
