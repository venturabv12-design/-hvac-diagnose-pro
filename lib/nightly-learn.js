'use strict';
/* ════════════════════════════════════════════════════════════════════════════
 * MIKE'S NIGHTLY LEARNING LOOP — he closes his own gaps while nobody's working.
 *
 * The claim this makes true: "Mike gets new information every day and keeps it."
 * Before this, the manual library was loaded by hand three times (June 3, June 4,
 * July 17) and then sat still. Mike was frozen between those dates and a buyer
 * asking "what did he learn this week?" had no answer.
 *
 * WHY DEMAND-DRIVEN, and not a crawler:
 *   Crawling manufacturer sites for "new manuals" scrapes thousands of documents
 *   nobody asked for, and grows the library in directions that don't help anyone.
 *   Instead Mike learns the units his OWN techs actually touched. Every time the
 *   retriever comes back with no confident manual for a unit, that miss is logged.
 *   Overnight, the most-asked misses become the shopping list. So the library
 *   grows toward the fleet the techs actually service, and it compounds: the more
 *   they use Mike, the faster his blind spots close. That is a real moat and it is
 *   demonstrable with dates.
 *
 * FAIL TOWARD DISTRUST — the whole value of this library is that it is verified to
 * source. One garbage PDF poisons that. So a candidate must clear EVERY gate in
 * verifyManual() before a single chunk is written; anything ambiguous is rejected
 * and the gap simply stays open for a human to fill. A gap Mike admits to is
 * survivable. A wrong wiring diagram he states confidently is not.
 *
 * Bounded on purpose: MAX_PER_NIGHT documents, size caps, and a per-gap attempt
 * limit so a manual that doesn't exist online isn't retried forever.
 * ════════════════════════════════════════════════════════════════════════════ */

const crypto = require('crypto');

// ── CONFIG ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const PROVIDER = (process.env.EMBED_PROVIDER || 'voyage').toLowerCase();
const EMBED_MODEL = process.env.EMBED_MODEL ||
  (PROVIDER === 'openai' ? 'text-embedding-3-large' : 'voyage-4-large');
const EMBED_DIM = parseInt(process.env.EMBED_DIM || (PROVIDER === 'openai' ? '3072' : '1024'), 10);
const EMBED_KEY = PROVIDER === 'openai' ? process.env.OPENAI_API_KEY : process.env.VOYAGE_API_KEY;

// Discovery runs on a cheap model — it only has to find a URL, not reason about HVAC.
const SCOUT_MODEL = process.env.LEARN_SCOUT_MODEL || 'claude-sonnet-4-6';

const MAX_PER_NIGHT   = parseInt(process.env.LEARN_MAX_PER_NIGHT || '5', 10);
const MAX_ATTEMPTS    = parseInt(process.env.LEARN_MAX_ATTEMPTS || '3', 10);
const GAP_LOOKBACK_D  = parseInt(process.env.LEARN_LOOKBACK_DAYS || '7', 10);
const RUN_HOUR        = parseInt(process.env.LEARN_HOUR || '3', 10);   // 3am, nobody's working

// Chunking must match scripts/ingest-manuals.js EXACTLY or retrieval quality drifts
// between hand-loaded and nightly-loaded documents.
const BATCH = 96, CHUNK_CHARS = 1200, CHUNK_OVERLAP = 200;

// PDF sanity bounds. Under 100KB is a spec sheet or a 404 page; over 40MB is a
// full parts catalogue that will blow memory in the web process.
const MIN_PDF_BYTES = 100 * 1024;
const MAX_PDF_BYTES = 40 * 1024 * 1024;
const MIN_TEXT_CHARS = 5000;

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log('[learn]', ...a);

// pdf-parse v2 exposes a PDFParse class (v1's callable default is gone). The page
// text is normalised exactly the way scripts/ingest-manuals.js did it, so chunks
// produced overnight are indistinguishable from the 43k loaded by hand.
let PDFParse = null;
try { PDFParse = require('pdf-parse').PDFParse; } catch (_) { /* reported at start() */ }

// ── SUPABASE ──────────────────────────────────────────────────────────────────
async function sb(method, path, body, headers) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: Object.assign({
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    }, headers || {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`supabase ${method} ${path} → ${r.status} ${(await r.text()).slice(0, 200)}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

// Events are user-scoped, so system-authored rows need an owner. Resolved once
// from the admin account rather than hardcoding a UUID that would rot.
let _systemUser = process.env.LEARN_SYSTEM_USER_ID || null;
async function systemUserId() {
  if (_systemUser) return _systemUser;
  const rows = await sb('GET', 'users?select=id&role=eq.admin&limit=1');
  _systemUser = rows && rows[0] ? rows[0].id : null;
  return _systemUser;
}

async function record(type, payload) {
  try {
    const uid = await systemUserId();
    if (!uid) return;
    await sb('POST', 'events', { user_id: uid, type, payload }, { Prefer: 'return=minimal' });
  } catch (e) { log('record failed (non-fatal):', e.message); }
}

// ── STEP 1: WHAT DOESN'T MIKE KNOW? ──────────────────────────────────────────
// Reads the misses the retriever logged, ranks by how many techs hit them, and
// drops anything already in the library or already attempted too many times.
async function findGaps() {
  const since = new Date(Date.now() - GAP_LOOKBACK_D * 86400000).toISOString();
  const misses = await sb('GET',
    `events?select=payload,created_at&type=eq.rag_miss&created_at=gte.${since}&limit=2000`);
  if (!Array.isArray(misses) || !misses.length) return [];

  const tally = new Map();
  for (const m of misses) {
    const p = m.payload || {};
    if (!p.brand || !p.model) continue;               // can't shop without both
    const key = `${p.brand}:${p.model}`.toUpperCase();
    const cur = tally.get(key) || { brand: p.brand, model: p.model, key, hits: 0 };
    cur.hits++;
    tally.set(key, cur);
  }

  // Don't re-shop for something a previous night already failed to find.
  const tried = await sb('GET',
    `events?select=payload&type=eq.learn_attempt&limit=2000`).catch(() => []);
  const failCount = new Map();
  for (const t of (tried || [])) {
    const k = (t.payload && t.payload.key) || '';
    if (!k) continue;
    failCount.set(k, (failCount.get(k) || 0) + 1);
  }

  const gaps = [...tally.values()]
    .filter(g => (failCount.get(g.key) || 0) < MAX_ATTEMPTS)
    .sort((a, b) => b.hits - a.hits);

  // Only skip gaps THIS loop already filled. Deliberately not "is there any document
  // mentioning this model" — the first live gap proved why. Mike had a Trane XR16
  // PRODUCT DATA sheet and still told the tech "I don't have the XR16 manual", because
  // the retriever's relevance floor correctly rejected a spec sheet for a wiring
  // question. A doc_id match would have silently skipped a real gap forever. The miss
  // IS the evidence: the retriever already voted, and second-guessing it here would
  // let a thin document permanently block a proper service manual.
  const out = [];
  for (const g of gaps) {
    if (out.length >= MAX_PER_NIGHT) break;
    const docId = `auto-${g.brand}-${String(g.model)}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const have = await sb('GET',
      `manual_chunks?select=id&doc_id=eq.${encodeURIComponent(docId)}&limit=1`).catch(() => null);
    if (Array.isArray(have) && have.length) continue;
    out.push(g);
  }
  return out;
}

// ── STEP 2: GO FIND THE MANUAL ───────────────────────────────────────────────
// Claude with web search. It is asked for a URL and nothing else — no summarising,
// no judgement about the unit. Everything it returns is treated as an untrusted
// suggestion and must survive verifyManual() before it counts.
async function findManualUrl(brand, model) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: AbortSignal.timeout(90000),
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: SCOUT_MODEL,
      max_tokens: 900,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 6 }],
      messages: [{
        role: 'user',
        content:
          `Find the official manufacturer SERVICE or INSTALLATION manual PDF for the ` +
          `${brand} model ${model} (HVAC equipment).\n\n` +
          `Strongly prefer the manufacturer's own domain or an authorised distributor. ` +
          `The file must be a real PDF manual — not a brochure, not a parts list, not a ` +
          `login page, not an aggregator preview.\n\n` +
          `Reply with ONLY a JSON array of up to 3 direct PDF URLs, best first, like:\n` +
          `["https://example.com/manual.pdf"]\n` +
          `If you cannot find a genuine PDF manual, reply exactly: []`,
      }],
    }),
  });
  if (!r.ok) throw new Error('scout ' + r.status);
  const data = await r.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
  const m = text.match(/\[[\s\S]*?\]/);
  if (!m) return [];
  try {
    return JSON.parse(m[0]).filter(u => typeof u === 'string' && /^https?:\/\//i.test(u)).slice(0, 3);
  } catch (_) { return []; }
}

// ── STEP 3: THE GATES ────────────────────────────────────────────────────────
// Every one of these must pass. A rejection here is a GOOD outcome — it means a
// wrong document didn't get into the library Mike cites as authoritative.
async function fetchAndVerify(url, brand, model) {
  const r = await fetch(url, { signal: AbortSignal.timeout(60000), redirect: 'follow' });
  if (!r.ok) return { ok: false, why: `download ${r.status}` };

  const ctype = (r.headers.get('content-type') || '').toLowerCase();
  const buf = Buffer.from(await r.arrayBuffer());

  if (buf.length < MIN_PDF_BYTES) return { ok: false, why: `too small (${buf.length}b)` };
  if (buf.length > MAX_PDF_BYTES) return { ok: false, why: `too large (${buf.length}b)` };
  // Trust the bytes over the header — plenty of servers mislabel PDFs.
  if (buf.slice(0, 5).toString() !== '%PDF-') return { ok: false, why: `not a PDF (${ctype})` };

  let pages;
  try { pages = await pdfPages(buf); }
  catch (e) { return { ok: false, why: 'unreadable PDF: ' + e.message }; }

  const all = pages.join(' ');
  if (all.length < MIN_TEXT_CHARS) return { ok: false, why: `only ${all.length} chars of text (scanned?)` };

  const hay = all.toLowerCase();
  // It has to actually be about this brand AND this unit. A Goodman manual is not
  // an answer to a Carrier question no matter how good the PDF is.
  if (!hay.includes(String(brand).toLowerCase())) return { ok: false, why: 'brand not in document' };
  const modelToken = String(model).toLowerCase().replace(/[^a-z0-9]/g, '');
  const hayToken = hay.replace(/[^a-z0-9]/g, '');
  if (modelToken.length >= 3 && !hayToken.includes(modelToken)) {
    return { ok: false, why: 'model not in document' };
  }
  // And it has to read like a service document, not marketing.
  const marks = ['service', 'installation', 'wiring', 'specification', 'troubleshoot', 'fault', 'maintenance'];
  const hits = marks.filter(w => hay.includes(w)).length;
  if (hits < 3) return { ok: false, why: `does not read like a manual (${hits}/7 markers)` };

  return { ok: true, buf, pages, bytes: buf.length };
}

// ── PDF → pages (mirrors scripts/ingest-manuals.js) ──────────────────────────
async function pdfPages(buf) {
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const r = await parser.getText();
    return (r.pages || []).map(pg => String(pg.text || '').replace(/\s+/g, ' ').trim());
  } finally {
    try { await parser.destroy(); } catch (_) {}
  }
}

function detectSection(t) {
  const l = t.toLowerCase();
  if (/fault\s+code|error\s+code|diagnostic\s+(code|led|flash)|status\s+code/.test(l)) return 'Fault Code Table';
  if (/wiring\s+(diagram|schematic)|ladder\s+diagram|connection\s+diagram/.test(l)) return 'Wiring Diagrams';
  if (/sequence\s+of\s+operation|operating\s+sequence/.test(l)) return 'Sequence of Operation';
  if (/specification|electrical\s+data|rated\s+(load|conditions)|physical\s+data/.test(l)) return 'Specs';
  return 'General';
}
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

async function embedBatch(texts) {
  if (PROVIDER === 'openai') {
    const r = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${EMBED_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, input: texts, ...(EMBED_DIM ? { dimensions: EMBED_DIM } : {}) }),
    });
    if (!r.ok) throw new Error('openai embed ' + r.status);
    return (await r.json()).data.map(d => d.embedding);
  }
  const r = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${EMBED_KEY}`, 'Content-Type': 'application/json' },
    // input_type MUST be 'document' here; the request path embeds with 'query'.
    body: JSON.stringify({ model: EMBED_MODEL, input: texts, input_type: 'document', output_dimension: EMBED_DIM }),
  });
  if (!r.ok) throw new Error('voyage embed ' + r.status);
  return (await r.json()).data.map(d => d.embedding);
}

async function upsertChunks(rows) {
  await sb('POST', 'manual_chunks?on_conflict=doc_id,chunk_index', rows,
    { Prefer: 'resolution=merge-duplicates,return=minimal' });
}

// ── STEP 4: LEARN IT ─────────────────────────────────────────────────────────
async function ingest(gap, url, pages, dryRun) {
  const docId = `auto-${gap.brand}-${String(gap.model)}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const docTitle = `${gap.brand.toUpperCase()} ${gap.model} Service Manual`;

  const records = [];
  pages.forEach((pageText, pi) => {
    if (!pageText || pageText.length < 40) return;
    const section = detectSection(pageText);
    let pieces;
    if (section === 'Fault Code Table' || section === 'Specs') {
      pieces = tableRowChunks(pageText);
      if (pieces.length < 2) pieces = proseChunks(pageText);
    } else {
      pieces = proseChunks(pageText);
    }
    pieces.forEach((text) => {
      records.push({
        brand: gap.brand, model_family: gap.model || null,
        doc_id: docId, doc_title: docTitle, doc_url: url,
        page_num: pi + 1, section, chunk_text: text, content_hash: sha(docId + text),
      });
    });
  });
  records.forEach((r, i) => { r.chunk_index = i; });
  if (!records.length) return { chunks: 0, docTitle };
  if (dryRun) return { chunks: records.length, docTitle, dryRun: true };

  for (let i = 0; i < records.length; i += BATCH) {
    const slice = records.slice(i, i + BATCH);
    let embs;
    for (let a = 0; a < 4; a++) {
      try { embs = await embedBatch(slice.map(s => s.chunk_text)); break; }
      catch (e) { if (a === 3) throw e; await sleep(1500 * (a + 1)); }
    }
    slice.forEach((r, j) => { r.embedding = embs[j]; });
    await upsertChunks(slice);
  }
  return { chunks: records.length, docTitle, docId };
}

// ── THE NIGHT'S WORK ─────────────────────────────────────────────────────────
let _running = false;
let _last = null;

async function runOnce(opts) {
  const dryRun = !!(opts && opts.dryRun);
  if (_running) { log('already running, skipping'); return _last; }
  _running = true;
  const started = Date.now();
  const learned = [], rejected = [];

  try {
    const gaps = await findGaps();
    log(`${gaps.length} gap(s) to close${dryRun ? ' [DRY RUN]' : ''}`);

    for (const gap of gaps) {
      let done = false;
      try {
        const urls = await findManualUrl(gap.brand, gap.model);
        if (!urls.length) { rejected.push({ ...gap, why: 'no candidate found' }); }

        for (const url of urls) {
          const v = await fetchAndVerify(url, gap.brand, gap.model);
          if (!v.ok) { log(`  ✗ ${gap.key} ${url.slice(0, 60)} — ${v.why}`); rejected.push({ ...gap, url, why: v.why }); continue; }

          const res = await ingest(gap, url, v.pages, dryRun);
          if (!res.chunks) { rejected.push({ ...gap, url, why: 'no chunks produced' }); continue; }

          log(`  ✓ ${gap.key} → ${res.chunks} chunks from ${res.docTitle}`);
          learned.push({ brand: gap.brand, model: gap.model, hits: gap.hits,
                         doc_title: res.docTitle, doc_url: url, chunks: res.chunks, pages: v.pages.length });
          done = true;
          break;
        }
      } catch (e) {
        log(`  ✗ ${gap.key} — ${e.message}`);
        rejected.push({ ...gap, why: e.message });
      }
      // Record the attempt either way so a manual that isn't online stops being retried.
      if (!dryRun) await record('learn_attempt', { key: gap.key, brand: gap.brand, model: gap.model, ok: done });
    }

    _last = {
      at: new Date().toISOString(),
      ms: Date.now() - started,
      gaps: gaps.length,
      learned, rejected: rejected.length, dryRun,
    };
    if (!dryRun && learned.length) await record('learned_manuals', { learned, rejected: rejected.length });
    log(`done — learned ${learned.length}, rejected ${rejected.length}, ${Math.round((Date.now() - started) / 1000)}s`);
    return _last;
  } finally {
    _running = false;
  }
}

// ── SCHEDULE ─────────────────────────────────────────────────────────────────
// Deliberately in-process: the app runs a single instance, so this needs no second
// Railway service, no dashboard step, and no cron infrastructure to forget about.
// It runs at RUN_HOUR local time and re-checks hourly, so a restart can't skip a night.
function start() {
  if (process.env.LEARN_ENABLED !== '1') { log('disabled (set LEARN_ENABLED=1)'); return; }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) { log('no database — not scheduling'); return; }
  if (!EMBED_KEY) { log('no embedding key — not scheduling'); return; }
  if (!PDFParse) { log('pdf-parse not installed — not scheduling'); return; }

  let lastRunDay = null;
  const tick = () => {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    if (now.getHours() === RUN_HOUR && lastRunDay !== day) {
      lastRunDay = day;
      runOnce({}).catch(e => log('nightly run failed:', e.message));
    }
  };
  const t = setInterval(tick, 10 * 60 * 1000);   // every 10 min, cheap
  if (t.unref) t.unref();
  log(`scheduled — ${RUN_HOUR}:00 local, max ${MAX_PER_NIGHT}/night`);
}

module.exports = { start, runOnce, findGaps, fetchAndVerify, findManualUrl,
                   status: () => _last, isRunning: () => _running };
