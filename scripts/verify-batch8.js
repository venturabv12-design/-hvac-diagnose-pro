#!/usr/bin/env node
/* Read-only. Confirms batch8 manuals are in AND retrievable above the 0.5 floor.
 * railway run node scripts/verify-batch8.js */
'use strict';
const U=process.env.SUPABASE_URL, K=process.env.SUPABASE_SERVICE_KEY, V=process.env.VOYAGE_API_KEY;
const DIM=+(process.env.EMBED_DIM||1024), M=process.env.EMBED_MODEL||'voyage-4-large', RR=process.env.RERANK_MODEL||'rerank-2.5';
const H={'apikey':K,'Authorization':`Bearer ${K}`,'Content-Type':'application/json'};
const FLOOR=0.5;
const embed=async t=>(await(await fetch('https://api.voyageai.com/v1/embeddings',{method:'POST',headers:{'Authorization':`Bearer ${V}`,'Content-Type':'application/json'},body:JSON.stringify({model:M,input:t,input_type:'query',output_dimension:DIM})})).json()).data[0].embedding;
const match=async(e,b)=>{const r=await fetch(`${U}/rest/v1/rpc/match_manual_chunks`,{method:'POST',headers:H,body:JSON.stringify({query_embedding:e,match_threshold:0.0,match_count:20,filter_brand:b,filter_model_family:null})});return r.ok?await r.json():[];};
const rerank=async(q,d)=>{const r=await fetch('https://api.voyageai.com/v1/rerank',{method:'POST',headers:{'Authorization':`Bearer ${V}`,'Content-Type':'application/json'},body:JSON.stringify({model:RR,query:q,documents:d,top_k:3})});return r.ok?(await r.json()).data:null;};

(async()=>{
  const c=await fetch(`${U}/rest/v1/manual_chunks?select=doc_id&limit=1`,{headers:{...H,'Prefer':'count=exact'}});
  console.log('\n  TOTAL chunks now:', (c.headers.get('content-range')||'?/?').split('/')[1], '(was 32,054 before this load)\n');
  const cases=[
    ['goodman','THE ORIGINAL PROBLEM: Goodman single-stage','Goodman GSX14 single stage air conditioner condenser wiring service specifications'],
    ['champion','Champion (NEW brand)','Champion air conditioner condenser service troubleshooting'],
    ['ducane','Ducane (NEW brand)','Ducane 4AC13 air conditioner service wiring'],
    ['ameristar','Ameristar (NEW brand)','Ameristar heat pump service troubleshooting fault'],
    ['runtru','RunTru (NEW brand)','RunTru A4AC4 air conditioner service specifications'],
    ['rheem','Rheem RA14/RA16','Rheem RA14 RA16 air conditioner condenser service wiring'],
  ];
  console.log('  BRAND        BEST   VERDICT      TOP MATCH');
  console.log('  '+'-'.repeat(74));
  for(const[b,label,q]of cases){
    try{
      const e=await embed(q); const rows=await match(e,b);
      let best=0,top='(none in library)';
      if(rows.length){const rk=await rerank(q,rows.map(x=>x.chunk_text||''));if(rk&&rk.length){best=rk[0].relevance_score;top=(rows[rk[0].index]?.doc_title||'').slice(0,44);}}
      console.log(`  ${b.padEnd(11)} ${best.toFixed(2)}   ${(best>=FLOOR?'CITE ✅':'DECLINE ⛔').padEnd(11)} ${top}`);
    }catch(e){console.log(`  ${b.padEnd(11)} ERR  ${e.message.slice(0,40)}`);}
  }
  console.log('\n  All should now CITE with a real, on-brand manual. The Goodman one = your original test unit.\n');
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
