#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
 * Mike's manual-grounded RAG — OFFLINE ingestion pipeline.
 *
 * Parses OEM service-manual PDFs → chunks (fault-code rows / spec rows / prose)
 * → embeds → upserts into Supabase `manual_chunks` (pgvector). Never deployed,
 * never in the request path. Run locally:
 *
 *   npm i pdf-parse            # dev-only dep, not in production package.json
 *   export SUPABASE_URL=...    SUPABASE_SERVICE_KEY=...
 *   export EMBED_PROVIDER=voyage   VOYAGE_API_KEY=...          # recommended
 *   #   or: EMBED_PROVIDER=openai  OPENAI_API_KEY=...
 *   node scripts/ingest-manuals.js db/manuals.manifest.json
 *
 * Manifest = JSON array of docs:
 *   [{ "brand":"carrier","model_family":"58MVC",
 *      "doc_id":"carrier-58mvc-service",
 *      "doc_title":"Carrier 58MVC Gas Furnace Service Manual",
 *      "doc_url":"https://.../58mvc.pdf",
 *      "pdf":"https://.../58mvc.pdf" }]      // pdf = URL or local path
 *
 * Idempotent: re-running upserts on (doc_id, chunk_index). Safe to re-ingest.
 * EMBEDDING MODEL must match the vector(N) dimension in db/manual_chunks.sql.
 * ════════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PROVIDER = (process.env.EMBED_PROVIDER || 'voyage').toLowerCase();
const EMBED_MODEL = process.env.EMBED_MODEL ||
  (PROVIDER === 'openai' ? 'text-embedding-3-large' : 'voyage-4-large');
const EMBED_DIM = parseInt(process.env.EMBED_DIM || (PROVIDER === 'openai' ? '3072' : '1024'), 10);
const BATCH = 96;            // embeddings per request
const CHUNK_CHARS = 1200;    // ~300 tokens
const CHUNK_OVERLAP = 200;   // ~50 tokens

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) fail('SUPABASE_URL + SUPABASE_SERVICE_KEY required');
const EMBED_KEY = PROVIDER === 'openai' ? process.env.OPENAI_API_KEY : process.env.VOYAGE_API_KEY;
if (!EMBED_KEY) fail(`EMBED_PROVIDER=${PROVIDER} requires ${PROVIDER === 'openai' ? 'OPENAI_API_KEY' : 'VOYAGE_API_KEY'}`);

let pdfParse;
try { pdfParse = require('pdf-parse'); }
catch (_) { fail('pdf-parse not installed. Run:  npm i pdf-parse  (dev only)'); }

function fail(m) { console.error('✗ ' + m); process.exit(1); }
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Embeddings (provider-abstracted) ──────────────────────────────────────────
async function embedBatch(texts, inputType) {
  if (PROVIDER === 'openai') {
    const r = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${EMBED_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, input: texts,
        ...(EMBED_DIM ? { dimensions: EMBED_DIM } : {}) }),
    });
    if (!r.ok) throw new Error('OpenAI embed ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return (await r.json()).data.map(d => d.embedding);
  }
  // Voyage
  const r = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${EMBED_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts, input_type: inputType,
      output_dimension: EMBED_DIM }),
  });
  if (!r.ok) throw new Error('Voyage embed ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return (await r.json()).data.map(d => d.embedding);
}

// ── Supabase upsert (REST, same posture as index.js supabase() helper) ────────
async function upsertChunks(rows) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/manual_chunks?on_conflict=doc_id,chunk_index`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error('Supabase upsert ' + r.status + ' ' + (await r.text()).slice(0, 300));
}

// ── PDF → per-page text ───────────────────────────────────────────────────────
async function pdfPages(buf) {
  const pages = [];
  await pdfParse(buf, {
    pagerender: (pageData) => pageData.getTextContent().then(tc => {
      const txt = tc.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
      pages.push(txt);
      return txt;
    }),
  });
  return pages;
}

// ── Chunking ──────────────────────────────────────────────────────────────────
function detectSection(t) {
  const l = t.toLowerCase();
  if (/fault\s+code|error\s+code|diagnostic\s+(code|led|flash)|status\s+code/.test(l)) return 'Fault Code Table';
  if (/wiring\s+(diagram|schematic)|ladder\s+diagram|connection\s+diagram/.test(l)) return 'Wiring Diagrams';
  if (/sequence\s+of\s+operation|operating\s+sequence/.test(l)) return 'Sequence of Operation';
  if (/specification|electrical\s+data|rated\s+(load|conditions)|physical\s+data/.test(l)) return 'Specs';
  return 'General';
}
// A fault-code / spec table page → one chunk per row, so retrieval lands on the exact code.
function tableRowChunks(t) {
  const rows = [];
  const re = /(?:^|\s)((?:[A-Z]{0,3}\d{1,3}|\d{1,2}\s*(?:flash|blink)(?:es|s)?|E\d{1,3}|F\d{1,3}|[A-Z]\d{1,2}))\s*[:=\-–]?\s+([^.\n]{8,180})/g;
  let m;
  while ((m = re.exec(t)) !== null) {
    const row = `CODE ${m[1].trim()}: ${m[2].trim()}`;
    if (row.length > 14) rows.push(row);
  }
  return rows;
}
function proseChunks(t) {
  const out = [];
  for (let i = 0; i < t.length; i += (CHUNK_CHARS - CHUNK_OVERLAP)) {
    const c = t.slice(i, i + CHUNK_CHARS).trim();
    if (c.length > 80) out.push(c);
    if (i + CHUNK_CHARS >= t.length) break;
  }
  return out;
}

async function ingestDoc(doc) {
  const src = doc.pdf || doc.doc_url;
  console.log(`\n• ${doc.doc_title}  [${doc.brand}/${doc.model_family || '*'}]`);
  let buf;
  if (/^https?:\/\//i.test(src)) {
    const r = await fetch(src);
    if (!r.ok) { console.error('  ✗ download ' + r.status); return 0; }
    buf = Buffer.from(await r.arrayBuffer());
  } else {
    buf = fs.readFileSync(src);
  }
  const pages = await pdfPages(buf);
  console.log(`  ${pages.length} pages`);

  // Build chunk records.
  const records = [];
  pages.forEach((pageText, pi) => {
    if (!pageText || pageText.length < 40) return;
    const section = detectSection(pageText);
    let pieces;
    if (section === 'Fault Code Table' || section === 'Specs') {
      pieces = tableRowChunks(pageText);
      if (pieces.length < 2) pieces = proseChunks(pageText); // fallback if rows didn't parse
    } else {
      pieces = proseChunks(pageText);
    }
    pieces.forEach((text) => {
      records.push({
        brand: doc.brand, model_family: doc.model_family || null,
        doc_id: doc.doc_id, doc_title: doc.doc_title, doc_url: doc.doc_url || src,
        page_num: pi + 1, section, chunk_text: text, content_hash: sha(doc.doc_id + text),
      });
    });
  });
  // Stable chunk_index for idempotent upsert.
  records.forEach((r, idx) => { r.chunk_index = idx; });
  console.log(`  ${records.length} chunks → embedding (${PROVIDER}/${EMBED_MODEL}, ${EMBED_DIM}d)`);

  // Embed + upsert in batches.
  let done = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const slice = records.slice(i, i + BATCH);
    let embs;
    for (let attempt = 0; attempt < 4; attempt++) {
      try { embs = await embedBatch(slice.map(s => s.chunk_text), 'document'); break; }
      catch (e) { if (attempt === 3) throw e; await sleep(1500 * (attempt + 1)); }
    }
    slice.forEach((r, j) => { r.embedding = embs[j]; });
    await upsertChunks(slice);
    done += slice.length;
    process.stdout.write(`\r  embedded+stored ${done}/${records.length}`);
  }
  process.stdout.write('\n  ✓ done\n');
  return records.length;
}

(async () => {
  const manifestPath = process.argv[2] || 'db/manuals.manifest.json';
  if (!fs.existsSync(manifestPath)) fail('manifest not found: ' + manifestPath + ' (JSON array of docs)');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`Ingest: ${manifest.length} docs · provider=${PROVIDER} model=${EMBED_MODEL} dim=${EMBED_DIM}`);
  let total = 0;
  for (const doc of manifest) {
    try { total += await ingestDoc(doc); }
    catch (e) { console.error('  ✗ ' + (e && e.message)); }
  }
  console.log(`\n═══ Ingest complete: ${total} chunks across ${manifest.length} docs ═══`);
})();
