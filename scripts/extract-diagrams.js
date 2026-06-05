#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
 * Mike's manual-grounded RAG — PHASE 2: wiring-diagram IMAGE extraction.
 *
 * Finds wiring-diagram / schematic / ladder pages in OEM service-manual PDFs,
 * renders each to a PNG, stores it, and stamps `diagram_image_url` onto the
 * matching `manual_chunks` rows (doc_id + page_num) so retrieval can surface the
 * real diagram in chat. Offline only — never deployed, never in the request path.
 *
 *   node scripts/extract-diagrams.js db/manuals.manifest.json [--doc <doc_id>] [--smoke]
 *
 * Sinks (auto): if SUPABASE_SERVICE_KEY is set → Supabase Storage bucket
 * `manual-diagrams` (public). Else → local public/diagrams/<brand>/<doc>/pN.png,
 * served same-origin by the Express app at /diagrams/... . URL is written to
 * manual_chunks.diagram_image_url via PG_CONNECTION.
 *
 * --smoke renders the first detected diagram page of the first matched doc to
 * /tmp and prints the path, no upload, no DB write — pipeline sanity check.
 * Idempotent: re-running overwrites the same page PNG + re-stamps the same rows.
 * ════════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wqmfcbsrxeqopfxlohey.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const PG_CONNECTION = process.env.PG_CONNECTION || process.env.PG_CONN || '';
const APP_URL = process.env.APP_URL || '';            // prefix for local-sink URLs; '' = same-origin relative
const DPI = parseInt(process.env.DIAGRAM_DPI || '120', 10);
const MAX_PAGES_PER_DOC = parseInt(process.env.DIAGRAM_MAX_PER_DOC || '6', 10);
const REPO_ROOT = path.resolve(__dirname, '..');
const LOCAL_DIR = path.join(REPO_ROOT, 'public', 'diagrams');

// A page is a wiring/schematic page when it's TITLED as one — OEM manuals put
// "WIRING DIAGRAM" / "SCHEMATIC" as the page heading. Heading match (first ~60
// chars) is far more reliable than word-count: real diagram pages carry a lot of
// embedded label text (warnings + terminal labels), so a sparseness cap misses
// them. Mid-prose mentions of "wiring diagram" don't sit in the heading.
const HEADING_RE = /(wiring|schematic|connection|ladder)\s+diagram|electrical\s+schematic|wiring\s+schematic/i;
const DIAGRAM_RE = /\b(wiring\s+diagram|schematic\s+diagram|connection\s+diagram|ladder\s+diagram|electrical\s+schematic|wiring\s+schematic)\b/i;
const LABELY_RE = /\b(L1|L2|24\s?V|terminal|transformer|contactor|capacitor|relay|thermostat)\b/i;

function fail(m){ console.error('✗ ' + m); process.exit(1); }
const slug = (s) => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);

async function loadPdfjs(){
  // pdfjs renders some pages with DOMMatrix/Path2D/ImageData — browser globals that
  // don't exist in Node. @napi-rs/canvas ships compatible implementations; install
  // them globally BEFORE pdfjs loads or those pages throw "DOMMatrix is not defined".
  const napi = require('@napi-rs/canvas');
  for (const g of ['DOMMatrix', 'Path2D', 'ImageData']) {
    if (typeof globalThis[g] === 'undefined' && napi[g]) globalThis[g] = napi[g];
  }
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  return pdfjs;
}

async function fetchPdf(url){
  const r = await fetch(url, { redirect:'follow', signal: AbortSignal.timeout(45000),
    headers:{ 'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' } });
  if (!r.ok) throw new Error('HTTP '+r.status+' '+url);
  const ct = (r.headers.get('content-type')||'').toLowerCase();
  const buf = Buffer.from(await r.arrayBuffer());
  if (!ct.includes('pdf') && buf.slice(0,5).toString() !== '%PDF-') throw new Error('not a pdf ('+ct+')');
  return buf;
}

// pdfjs v4 has no built-in Node canvas factory; supply one backed by @napi-rs/canvas.
function makeCanvasFactory(){
  const { createCanvas } = require('@napi-rs/canvas');
  return {
    create(width, height){ const canvas = createCanvas(width|0 || 1, height|0 || 1); return { canvas, context: canvas.getContext('2d') }; },
    reset(cc, width, height){ cc.canvas.width = width|0 || 1; cc.canvas.height = height|0 || 1; },
    destroy(cc){ if (cc.canvas){ cc.canvas.width = 0; cc.canvas.height = 0; } cc.canvas = null; cc.context = null; },
  };
}

async function renderPageToPng(canvasFactory, doc, pageNum, scale){
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const cc = canvasFactory.create(Math.ceil(viewport.width), Math.ceil(viewport.height));
  cc.context.fillStyle = '#ffffff';
  cc.context.fillRect(0, 0, cc.canvas.width, cc.canvas.height);
  await page.render({ canvasContext: cc.context, viewport, canvasFactory }).promise;
  const buf = cc.canvas.toBuffer('image/png');
  return buf;
}

async function detectDiagramPages(pdfjs, doc){
  const hits = [];
  const n = doc.numPages;
  for (let p = 1; p <= n; p++){
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const text = tc.items.map(i => i.str).join(' ');
    const head = text.slice(0, 60);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    // Diagram page if TITLED as one (heading hit), or an untitled but clearly
    // label-heavy + sparse schematic page. Mid-prose "wiring" mentions are excluded.
    if (HEADING_RE.test(head) ||
        (DIAGRAM_RE.test(text) && LABELY_RE.test(text) && wordCount < 140)) {
      hits.push(p);
    }
    if (hits.length >= MAX_PAGES_PER_DOC) break;
  }
  return hits;
}

async function uploadSupabase(buf, objectPath){
  const url = `${SUPABASE_URL}/storage/v1/object/manual-diagrams/${objectPath}`;
  const r = await fetch(url, { method:'POST',
    headers:{ 'apikey':SUPABASE_SERVICE_KEY, 'Authorization':`Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type':'image/png', 'x-upsert':'true' },
    body: buf });
  if (!r.ok && r.status !== 200) throw new Error('storage upload '+r.status+' '+(await r.text()).slice(0,140));
  return `${SUPABASE_URL}/storage/v1/object/public/manual-diagrams/${objectPath}`;
}

async function ensureBucket(){
  // Create the public bucket if it doesn't exist (idempotent — 409 = already there).
  await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { method:'POST',
    headers:{ 'apikey':SUPABASE_SERVICE_KEY, 'Authorization':`Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ id:'manual-diagrams', name:'manual-diagrams', public:true }) }).catch(()=>{});
}

function sinkLocal(buf, brand, docId, pageNum){
  const dir = path.join(LOCAL_DIR, slug(brand), slug(docId));
  fs.mkdirSync(dir, { recursive:true });
  const file = path.join(dir, `p${pageNum}.png`);
  fs.writeFileSync(file, buf);
  const rel = `/diagrams/${slug(brand)}/${slug(docId)}/p${pageNum}.png`;
  return APP_URL ? (APP_URL.replace(/\/$/,'') + rel) : rel;
}

async function main(){
  const args = process.argv.slice(2);
  const manifestPath = args.find(a => !a.startsWith('--')) || 'db/manuals.manifest.json';
  const smoke = args.includes('--smoke');
  const docFilter = (() => { const i = args.indexOf('--doc'); return i >= 0 ? args[i+1] : null; })();
  if (!fs.existsSync(manifestPath)) fail('manifest not found: ' + manifestPath);
  let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (docFilter) manifest = manifest.filter(d => d.doc_id === docFilter);
  if (!manifest.length) fail('no docs (after --doc filter)');

  const useSupabase = !!SUPABASE_SERVICE_KEY && !smoke;
  console.log(`Extract diagrams: ${manifest.length} docs · DPI=${DPI} · sink=${smoke?'smoke(/tmp)':(useSupabase?'supabase-storage':'local public/diagrams')}`);
  const pdfjs = await loadPdfjs();
  const canvasFactory = makeCanvasFactory();
  if (useSupabase) await ensureBucket();

  let pg = null;
  if (!smoke) {
    if (!PG_CONNECTION) fail('PG_CONNECTION required to stamp diagram_image_url (or pass --smoke)');
    const { Client } = require('pg');
    pg = new Client({ connectionString: PG_CONNECTION });
    await pg.connect();
  }

  const scale = DPI / 72;
  let totalImgs = 0, totalStamped = 0;
  for (const d of manifest){
    const src = d.pdf || d.doc_url;
    process.stdout.write(`\n• ${d.doc_title}  [${d.brand}/${d.model_family||'*'}]\n`);
    let buf;
    try { buf = await fetchPdf(src); } catch(e){ console.log('  ✗ download: '+e.message); continue; }
    let doc;
    try { doc = await pdfjs.getDocument({ data: new Uint8Array(buf), canvasFactory, disableFontFace:true, verbosity:0 }).promise; }
    catch(e){ console.log('  ✗ parse: '+e.message); continue; }
    let pages;
    try { pages = await detectDiagramPages(pdfjs, doc); } catch(e){ console.log('  ✗ scan: '+e.message); continue; }
    if (!pages.length){ console.log('  · no diagram pages detected'); continue; }
    console.log('  diagram pages: ' + pages.join(', '));

    for (const p of pages){
      let png;
      try { png = await renderPageToPng(canvasFactory, doc, p, scale); } catch(e){ console.log('  ✗ render p'+p+': '+e.message); continue; }
      if (smoke){
        const out = `/tmp/diagram-${slug(d.doc_id)}-p${p}.png`;
        fs.writeFileSync(out, png);
        console.log('  ✓ SMOKE rendered p'+p+' → '+out+' ('+(png.length/1024|0)+' KB)');
        await pg?.end?.(); return;
      }
      let url;
      try { url = useSupabase ? await uploadSupabase(png, `${slug(d.brand)}/${slug(d.doc_id)}/p${p}.png`)
                              : sinkLocal(png, d.brand, d.doc_id, p); }
      catch(e){ console.log('  ✗ store p'+p+': '+e.message); continue; }
      totalImgs++;
      // Stamp every chunk on this page; if the doc has no page_num rows, stamp the
      // nearest-by-index chunk so the diagram still rides along on a match.
      const res = await pg.query(
        'update manual_chunks set diagram_image_url=$1 where doc_id=$2 and page_num=$3', [url, d.doc_id, p]);
      let stamped = res.rowCount;
      if (stamped === 0){
        const res2 = await pg.query(
          'update manual_chunks set diagram_image_url=$1 where ctid in (select ctid from manual_chunks where doc_id=$2 order by abs(coalesce(page_num,chunk_index)-$3) limit 1)',
          [url, d.doc_id, p]);
        stamped = res2.rowCount;
      }
      totalStamped += stamped;
      console.log('  ✓ p'+p+' → '+url+'  ('+(png.length/1024|0)+' KB, stamped '+stamped+' chunk'+(stamped===1?'':'s')+')');
    }
  }
  await pg?.end?.();
  console.log(`\n═══ Diagrams: ${totalImgs} images, ${totalStamped} chunks stamped ═══`);
}
main().catch(e => fail(e.stack || e.message));
