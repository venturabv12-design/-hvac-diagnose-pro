#!/usr/bin/env node
/* Read-only. Tests the FULL prod retrieval path incl. Voyage reranker to find the
 * right relevance cutoff. No writes, no secrets printed. railway run node scripts/tune-rag.js */
'use strict';
const SUPABASE_URL = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY, VOYAGE = process.env.VOYAGE_API_KEY;
const DIM = parseInt(process.env.EMBED_DIM || '1024', 10), MODEL = process.env.EMBED_MODEL || 'voyage-4-large';
const RERANK = process.env.RERANK_MODEL || 'rerank-2.5';
const H = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function embed(t) {
  const r = await fetch('https://api.voyageai.com/v1/embeddings', { method:'POST',
    headers:{'Authorization':`Bearer ${VOYAGE}`,'Content-Type':'application/json'},
    body: JSON.stringify({ model: MODEL, input: t, input_type:'query', output_dimension: DIM }) });
  return (await r.json()).data[0].embedding;
}
async function match(emb) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_manual_chunks`, { method:'POST', headers:H,
    body: JSON.stringify({ query_embedding: emb, match_threshold: 0.0, match_count: 20, filter_brand:'goodman', filter_model_family:null }) });
  return r.ok ? await r.json() : [];
}
async function rerank(query, docs) {
  const r = await fetch('https://api.voyageai.com/v1/rerank', { method:'POST',
    headers:{'Authorization':`Bearer ${VOYAGE}`,'Content-Type':'application/json'},
    body: JSON.stringify({ model: RERANK, query, documents: docs, top_k: 6 }) });
  return r.ok ? (await r.json()).data : null;
}
(async () => {
  const cases = [
    ['HAVE IT?  GSXC18 (doc IS in library)', 'Goodman GSXC18 two-stage condenser ComfortNet first stage cooling sequence of operation'],
    ['MISSING   GSX130181 single-stage (NO doc)', 'Goodman GSX130181 single stage condenser minimum circuit ampacity MCA max breaker RLA LRA'],
  ];
  for (const [label, q] of cases) {
    console.log('\n============================================================');
    console.log(label); console.log('  q:', q);
    const emb = await embed(q);
    const rows = await match(emb);
    console.log('  vector top-3 (raw cosine sim):');
    rows.slice(0,3).forEach(x => console.log(`     ${Number(x.similarity).toFixed(3)}  ${x.doc_title} p.${x.page_num||'-'}`));
    const rr = await rerank(q, rows.map(x => x.chunk_text || ''));
    if (rr) {
      console.log('  AFTER RERANK top-4 (relevance_score 0-1):');
      rr.slice(0,4).forEach(x => console.log(`     ${Number(x.relevance_score).toFixed(3)}  ${rows[x.index]?.doc_title} p.${rows[x.index]?.page_num||'-'}`));
      console.log('  >> best rerank score:', Number(rr[0].relevance_score).toFixed(3));
    } else console.log('  rerank unavailable');
  }
  console.log('\nREAD: if the HAVE-IT best rerank score is high (~0.5+) and the MISSING best is low (~<0.3),');
  console.log('a rerank-score cutoff cleanly separates "cite it" from "say I do not have it". That is the real fix.\n');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
