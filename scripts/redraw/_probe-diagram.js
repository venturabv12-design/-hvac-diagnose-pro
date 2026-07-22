#!/usr/bin/env node
/* READ-ONLY probe: find real diagram_image_url rows in manual_chunks.
 * Prints NO secrets. Run: railway run node scripts/redraw/_probe-diagram.js */
'use strict';
const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

(async () => {
  if (!SUPABASE_URL || !KEY) { console.log('MISSING SUPABASE env (need railway run)'); process.exit(1); }
  // count rows carrying a diagram image
  const c = await fetch(`${SUPABASE_URL}/rest/v1/manual_chunks?select=doc_id&diagram_image_url=not.is.null&limit=1`, { headers: { ...H, Prefer: 'count=exact' } });
  console.log('rows with diagram_image_url:', (c.headers.get('content-range') || '?/?').split('/')[1], '| http', c.status);
  // pull a spread of distinct docs that have a diagram
  const r = await fetch(`${SUPABASE_URL}/rest/v1/manual_chunks?select=brand,doc_id,doc_title,page_num,diagram_image_url&diagram_image_url=not.is.null&limit=400`, { headers: H });
  const rows = await r.json();
  if (!Array.isArray(rows)) { console.log('unexpected:', JSON.stringify(rows).slice(0, 300)); process.exit(1); }
  const seen = {};
  for (const x of rows) if (!seen[x.doc_id]) seen[x.doc_id] = x;
  const docs = Object.values(seen);
  console.log('distinct docs w/ diagram:', docs.length, '\n');
  docs.slice(0, 25).forEach(x => console.log(`  [${x.brand}] ${x.doc_id} p.${x.page_num}  ${(x.doc_title||'').slice(0,42)}\n      ${x.diagram_image_url}`));
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
