#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════════
 * batch-cache.js — the DO-ONCE rollout engine.
 *
 * For every saved model: trace the REAL OEM diagram ONCE (verified vision
 * extractor + validation), render the clean apprentice illustration, and CACHE
 * the SVG keyed by model. First tech on a model pays the one AI pass; every tech
 * after gets the cached SVG for zero AI cost. Idempotent — a model already in the
 * cache is skipped, so re-runs are free and safe to resume.
 *
 * Cost control (Brandon's rule — "enough to flow, not burn credits"):
 *   • ONE vision extraction per model, then cached forever.
 *   • --limit N  caps how many NEW models are traced this run (bound the spend).
 *   • Already-cached models cost nothing.
 *
 * Input manifest (JSON array): [{ "modelKey":"CARRIER:24ABB3",
 *                                 "image":"<url-or-local-path to the OEM diagram>",
 *                                 "circuit":"full" }]
 *
 * Run (needs ANTHROPIC_API_KEY — inject prod env yourself, authorized):
 *   railway run node scripts/redraw/batch-cache.js db/diagram-batch.json --limit 20
 *
 * Output: scripts/redraw/cache/<MODEL_KEY>.{netlist.json, illustration.svg}
 *         plus a cache/_index.json roll-up.
 * ════════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');
const { extractNetlist } = require('./extract-netlist.js');
const { renderIllustrationSVG } = require('./render-illustration-svg.js');

const CACHE_DIR = path.join(__dirname, 'cache');
const safeKey = (k) => String(k).replace(/[^A-Za-z0-9._:-]/g, '_').replace(/:/g, '_');

async function cacheOne(job) {
  const key = job.modelKey;
  const base = path.join(CACHE_DIR, safeKey(key));
  if (fs.existsSync(base + '.illustration.svg')) return { key, status: 'cached-skip' };
  if (!job.image) return { key, status: 'no-image' };

  const out = await extractNetlist(job.image, { modelKey: key, circuitType: job.circuit || 'full' });
  if (!out.validation.ok) return { key, status: 'invalid', errors: out.validation.errors };

  const svg = renderIllustrationSVG(out.netlist);
  fs.writeFileSync(base + '.netlist.json', JSON.stringify(out.netlist, null, 2));
  fs.writeFileSync(base + '.illustration.svg', svg);
  return {
    key, status: 'traced',
    comps: out.netlist.components?.length || 0,
    nets: out.netlist.nets?.length || 0,
    tokens: out.usage ? `${out.usage.input_tokens}/${out.usage.output_tokens}` : 'n/a',
    notes: (out.netlist.notes || []).length,
  };
}

async function main() {
  const [manifestPath, ...flags] = process.argv.slice(2);
  if (!manifestPath) { console.error('usage: node batch-cache.js <manifest.json> [--limit N]'); process.exit(2); }
  const limIx = flags.indexOf('--limit');
  const limit = limIx >= 0 ? parseInt(flags[limIx + 1], 10) : Infinity;

  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  const jobs = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`batch-cache: ${jobs.length} models in manifest · new-trace cap = ${limit}\n`);

  const results = []; let newTraced = 0;
  for (const job of jobs) {
    if (newTraced >= limit && !fs.existsSync(path.join(CACHE_DIR, safeKey(job.modelKey) + '.illustration.svg'))) {
      results.push({ key: job.modelKey, status: 'skipped-limit' });
      continue;
    }
    let r;
    try { r = await cacheOne(job); } catch (e) { r = { key: job.modelKey, status: 'error', error: e.message }; }
    if (r.status === 'traced') newTraced++;
    results.push(r);
    console.log(`  [${r.status.padEnd(13)}] ${r.key}${r.comps ? `  (${r.comps} parts, ${r.nets} nets, ${r.tokens} tok)` : ''}${r.errors ? '  ' + r.errors.join('; ') : ''}${r.error ? '  ' + r.error : ''}`);
  }

  const index = results.reduce((m, r) => { (m[r.status] = m[r.status] || []).push(r.key); return m; }, {});
  fs.writeFileSync(path.join(CACHE_DIR, '_index.json'), JSON.stringify({ generated_from: manifestPath, counts: Object.fromEntries(Object.entries(index).map(([k, v]) => [k, v.length])), results }, null, 2));
  console.log(`\ndone: ${newTraced} newly traced+cached, ${(index['cached-skip'] || []).length} already cached, ${(index['error'] || []).length + (index['invalid'] || []).length + (index['no-image'] || []).length} needs-attention.`);
  console.log('cache → scripts/redraw/cache/  (index in cache/_index.json)');
}

main().catch(e => { console.error('FATAL', e.message); process.exit(1); });
