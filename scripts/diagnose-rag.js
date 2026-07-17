#!/usr/bin/env node
/* Read-only diagnostic for Mike's manual RAG. Run via: railway run node scripts/diagnose-rag.js
 * Prints NO secrets. Mirrors retrieveManualContext() in index.js exactly. */
'use strict';
const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
const VOYAGE = process.env.VOYAGE_API_KEY;
const DIM = parseInt(process.env.EMBED_DIM || '1024', 10);
const MODEL = process.env.EMBED_MODEL || 'voyage-4-large';
const H = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function rest(path, extraHeaders) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { ...H, ...(extraHeaders||{}) } });
  return r;
}
async function embed(text) {
  const r = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST', headers: { 'Authorization': `Bearer ${VOYAGE}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, input: text, input_type: 'query', output_dimension: DIM }),
  });
  if (!r.ok) throw new Error('voyage ' + r.status + ' ' + (await r.text()).slice(0,150));
  return (await r.json()).data[0].embedding;
}
async function match(embedding, threshold, brand) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_manual_chunks`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ query_embedding: embedding, match_threshold: threshold, match_count: 20, filter_brand: brand, filter_model_family: null }),
  });
  if (!r.ok) return { err: r.status + ' ' + (await r.text()).slice(0,200) };
  return { rows: await r.json() };
}

(async () => {
  console.log('\n===== 1. TOTAL manual_chunks rows =====');
  let total = '?';
  try {
    const r = await rest('manual_chunks?select=doc_id&limit=1', { 'Prefer': 'count=exact' });
    total = (r.headers.get('content-range') || '?/?').split('/')[1];
    console.log('  total chunks:', total, '| http', r.status);
  } catch (e) { console.log('  ERR', e.message); }

  console.log('\n===== 2. Brands + chunk counts =====');
  try {
    const r = await rest('manual_chunks?select=brand', { 'Range': '0-99999', 'Range-Unit': 'items' });
    const rows = await r.json();
    if (Array.isArray(rows)) {
      const t = {}; rows.forEach(x => { t[x.brand||'(null)'] = (t[x.brand||'(null)']||0)+1; });
      const sorted = Object.entries(t).sort((a,b)=>b[1]-a[1]);
      console.log('  distinct brands:', sorted.length, '| rows fetched:', rows.length);
      sorted.forEach(([b,c]) => console.log(`    ${b}: ${c}`));
    } else console.log('  unexpected:', JSON.stringify(rows).slice(0,200));
  } catch (e) { console.log('  ERR', e.message); }

  console.log('\n===== 3. Goodman docs present (distinct) =====');
  try {
    const r = await rest('manual_chunks?select=doc_id,doc_title,model_family&brand=eq.goodman&limit=2000');
    const rows = await r.json();
    if (Array.isArray(rows)) {
      const seen = {}; rows.forEach(x => { seen[x.doc_id] = x.doc_title + ' [' + (x.model_family||'-') + ']'; });
      console.log('  goodman chunks:', rows.length, '| distinct docs:', Object.keys(seen).length);
      Object.entries(seen).forEach(([id,t]) => console.log('    -', id, '=', t));
    } else console.log('  unexpected:', JSON.stringify(rows).slice(0,200));
  } catch (e) { console.log('  ERR', e.message); }

  console.log('\n===== 4. Live retrieval test (Goodman GSX / MCA) =====');
  const queries = ['Goodman GSX130181 minimum circuit ampacity MCA breaker RLA', 'Goodman GSXC18 two stage ComfortNet cooling sequence'];
  for (const q of queries) {
    console.log(`\n  QUERY: "${q}"`);
    let emb;
    try { emb = await embed(q); console.log('    embedded ok, dim =', emb.length, '(expected', DIM + ')'); }
    catch (e) { console.log('    EMBED ERR', e.message); continue; }
    for (const [label, thr, brand] of [['prod-path thr=0.40 brand=goodman', 0.40, 'goodman'], ['loosened thr=0.20 brand=goodman', 0.20, 'goodman'], ['no brand filter thr=0.20', 0.20, null]]) {
      const res = await match(emb, thr, brand);
      if (res.err) { console.log(`    [${label}] RPC ERR:`, res.err); continue; }
      const rows = res.rows || [];
      console.log(`    [${label}] -> ${rows.length} hits` + (rows.length ? `; top sim=${(rows[0].similarity||rows[0].distance||0).toFixed?.(3) ?? rows[0].similarity}` : ''));
      rows.slice(0,3).forEach(x => console.log(`        ${(x.similarity!=null?Number(x.similarity).toFixed(3):'?')}  ${x.doc_title||''} p.${x.page_num||'-'}`));
    }
  }
  console.log('\n===== DONE =====\n');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
