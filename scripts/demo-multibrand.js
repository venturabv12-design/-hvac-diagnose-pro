#!/usr/bin/env node
/* Read-only. Proves the relevance-floor fix behaves the SAME across brands/system types.
 * railway run node scripts/demo-multibrand.js  — no writes, no secrets. */
'use strict';
const SUPABASE_URL=process.env.SUPABASE_URL, KEY=process.env.SUPABASE_SERVICE_KEY, VOYAGE=process.env.VOYAGE_API_KEY;
const DIM=parseInt(process.env.EMBED_DIM||'1024',10), MODEL=process.env.EMBED_MODEL||'voyage-4-large', RERANK=process.env.RERANK_MODEL||'rerank-2.5';
const H={'apikey':KEY,'Authorization':`Bearer ${KEY}`,'Content-Type':'application/json'};
const FLOOR=0.50; // proposed cite/decline cutoff

async function embed(t){const r=await fetch('https://api.voyageai.com/v1/embeddings',{method:'POST',headers:{'Authorization':`Bearer ${VOYAGE}`,'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,input:t,input_type:'query',output_dimension:DIM})});return (await r.json()).data[0].embedding;}
async function match(emb,brand){const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_manual_chunks`,{method:'POST',headers:H,body:JSON.stringify({query_embedding:emb,match_threshold:0.0,match_count:20,filter_brand:brand,filter_model_family:null})});return r.ok?await r.json():[];}
async function rerank(q,docs){const r=await fetch('https://api.voyageai.com/v1/rerank',{method:'POST',headers:{'Authorization':`Bearer ${VOYAGE}`,'Content-Type':'application/json'},body:JSON.stringify({model:RERANK,query:q,documents:docs,top_k:4})});return r.ok?(await r.json()).data:null;}

const CASES=[
  ['Carrier',     'furnace',    'Carrier 58 gas furnace 3 flash fault code limit switch open'],
  ['Trane',       'AC',         'Trane XR condenser wiring contactor run capacitor compressor terminals'],
  ['Lennox',      'furnace',    'Lennox gas furnace control board error code flash recovery'],
  ['Honeywell',   'thermostat', 'Honeywell T6 Pro thermostat wiring R C W Y G heat pump O B'],
  ['Mitsubishi',  'mini-split', 'Mitsubishi mini split indoor unit blinking LED error code operation'],
  ['Bitzer',      'refrigeration','Bitzer semi-hermetic compressor oil pressure safety cut out'],
  ['Daikin',      'VRV',        'Daikin VRV fault code U4 communication error outdoor indoor'],
  ['Weil-Mclain', 'boiler',     'Weil-McLain gas boiler ignition lockout sequence troubleshooting'],
];
(async()=>{
  console.log(`\n  Proposed rule: cite the manual only if best relevance >= ${FLOOR}, else "I don't have that one — read the plate".\n`);
  console.log('  BRAND         SYSTEM        BEST   VERDICT        TOP MATCH');
  console.log('  ' + '-'.repeat(78));
  for(const [brand,sys,q] of CASES){
    try{
      const emb=await embed(q);
      const rows=await match(emb, brand.toLowerCase());
      let best=0, top='(nothing in library)';
      if(rows.length){
        const rr=await rerank(q, rows.map(x=>x.chunk_text||''));
        if(rr&&rr.length){ best=rr[0].relevance_score; top=(rows[rr[0].index]?.doc_title||'').slice(0,42); }
      }
      const verdict = best>=FLOOR ? 'CITE ✅' : 'DECLINE ⛔';
      console.log(`  ${brand.padEnd(13)} ${sys.padEnd(13)} ${best.toFixed(2)}   ${verdict.padEnd(13)}  ${top}`);
    }catch(e){ console.log(`  ${brand.padEnd(13)} ${sys.padEnd(13)} ERR   ${e.message.slice(0,40)}`); }
  }
  console.log('\n  Same rule, every brand & system type. CITE = real manual served; DECLINE = Mike says he');
  console.log('  does not have it (instead of handing over a wrong-family manual).\n');
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
