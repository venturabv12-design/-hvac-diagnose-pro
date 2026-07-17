# Mike Redraw Engine — RECONCILED against what already exists

**Author:** Ricky (senior eng) · **Date:** 2026-07-16 · **Branch:** `feat/mike-diagram-redraw-engine`
**Supersedes the "already-built" assumptions in** `mike-diagram-manual-offline-engine.md` (the earlier spec proposed re-building three pipelines that already exist in this repo).

The earlier spec treated Pieces 2 (manual fetch + page render) and 3 (batch ingestion) and 5a (offline cache) as green-field. They are **not** — the ingestion + diagram-image extraction + offline-cache primitives are already committed and working. This doc corrects the record and isolates the ONE genuinely-new thing: **the deterministic redraw + verify layer.**

---

## Reconciliation table — ALREADY BUILT vs GENUINELY NEW

| Capability | Status | Where it already lives | Notes |
|---|---|---|---|
| **Manual PDF → text chunks → embeddings → `manual_chunks` upsert** | ✅ BUILT | `scripts/ingest-manuals.js` (whole file, 228 lines) | Manifest-driven, provider-abstracted (Voyage/OpenAI), idempotent on `(doc_id, chunk_index)`, PG or Supabase-REST sink. The earlier spec's "Piece 3 `scripts/ingest-manuals.js`" **already exists** — do not recreate. |
| **210 manuals across ~64 brands assembled** | ✅ BUILT (data) | `db/manuals.manifest.json` (12) + `db/manuals.batch2..7.json` (4/23/29/35/50/57 = 198) → **210 docs total** | Brand-keyed, doc_url + pdf per row. This is the ingestion input catalog the spec's "Piece 3.3 model list" asked for. |
| **Real wiring-diagram IMAGE extraction (PDF page → PNG) + `manual_chunks.diagram_image_url` stamp** | ✅ BUILT | `scripts/extract-diagrams.js` (whole file, 207 lines) | pdfjs + `@napi-rs/canvas`, heading-based schematic-page detection (`HEADING_RE`/`DIAGRAM_RE`/`LABELY_RE`, lines 39–41), Supabase-Storage-or-local sink, `--smoke` mode. This IS the earlier spec's "Piece 2.3 wiring-page extraction" + "Piece 2.2 store." Do not recreate. |
| **`manual_chunks` pgvector schema + `match_manual_chunks` RPC** | ✅ BUILT | `db/manual_chunks.sql` | `vector(1024)` default (Voyage), cosine ivfflat, brand/model_family filter. Already includes `diagram_image_url` column. |
| **RAG retrieval in the request path (embed → RPC → rerank → surface diagram)** | ✅ BUILT | `index.js` `retrieveManualContext` 1527–1556, `_needsManualRetrieval` 1460, `_embedQuery` 1492, `_rerank` 1514, `_RAG_ENABLED` 1449 | Env-gated no-op until keys set. Already collects up to 2 `diagram_image_url`s and surfaces them via the `⟦MIKE_DIAGRAM⟧` sentinel. |
| **Verified-library tables (models / diagrams / flags) + fail-toward-distrust** | ✅ BUILT | `scripts/library-schema.sql`; routes `index.js` 1246–1377 | `library_diagrams.svg` already stores SVG for `source='mike-svg'`; `/api/library/diagram` POST upserts, `/api/library/flag` auto-demotes at ≥2 flags, `/api/library/verify/:id` admin promote, `/api/library/admin/unverified` review queue. `normalizeModelKey` (1484) is the dead-exact key. |
| **`⟦MIKE_DIAGRAM⟧` inline diagram sentinel (client render of real diagram)** | ✅ BUILT | `public/index.html` parse at 9264–9271, `_hasRealDiagram` 9896 | Already parses `[{url,title,page}]` and renders. |
| **Client-side SVG diagram generation (Mike-drawn)** | ✅ BUILT | `public/index.html` `triggerDiagram` 10919, `buildArcSVG`/`buildGrowthSVG` ~6294/6359, POST to `/api/library/diagram` ~11291, admin verify `admVerifyDiagram` 6465 | Establishes the existing SVG style + the save path. |
| **Offline cache (IndexedDB) for diagrams/specs** | ✅ BUILT | `public/index.html` `_idbOpen` 8713, `idbSaveDiagram` 8733, `idbGetDiagram` 8755, `idbListDiagrams` 8769, `idbDeleteDiagram` 8785, `openSavedDiagrams` 8801 | Store `trazer_offline` / objectStore `diagrams` (`IDB_NAME`/`IDB_STORE`/`IDB_VER` at 8712). The earlier spec's "Piece 5a IndexedDB" **already exists.** |
| **Service worker + PWA offline groundwork** | ✅ BUILT | `public/sw.js` (network-first HTML, network-only `/api/*`, SWR static + `/diagrams/*`), `public/manifest.json` | The offline-serving primitive for diagram images already exists (SWR on `/diagrams/*`). |
| **Nameplate scanner (drives model into chat)** | ✅ BUILT | `public/index.html` `handleDiagNameplateScan` 7012, `scanNameplate` 7073, `scanNameplateLib` 7074 | The "prefetch-kit on nameplate scan" trigger point already exists as a hook. |
| — | — | — | — |
| **Netlist JSON schema (structured circuit as the AI's extraction target)** | 🆕 NEW | `scripts/redraw/netlist-schema.json` (this build) | The whole accuracy story: AI extracts structure, never SVG coordinates. Nothing like this exists yet. |
| **Deterministic `renderNetlistSVG(netlist) → clean SVG`** | 🆕 NEW | `scripts/redraw/render-netlist-svg.js` (this build) | Pure, no AI, no network, byte-stable. Distinct from `buildArcSVG`/`buildGrowthSVG` (those are dashboard gauges, not circuit renderers). |
| **`verifyRedraw(source, redraw) → {state, score, mismatches}` structural round-trip gate** | 🆕 NEW | `scripts/redraw/verify-gate.js` (this build) | Threshold 0.98, fail-toward-distrust. The "verify gate is the whole ballgame" from the earlier spec's §1.4-A (structural) as a standalone pure fn. The §1.4-B second-model AI check is later wiring, not tonight. |
| `extractNetlist(image) → netlist` (vision model) | 🔜 LATER (wire into `/api/ai`, NOT tonight) | — | Needs the Anthropic vision call + the `library_diagrams` schema columns (`netlist`, `verify_state`, `verify_score`) added to `library-schema.sql`. Backend-locked; behind Brandon's confirm. |
| `library_diagrams` new columns (`netlist`, `verify_state`, `verify_score`, `source_diagram_url`, `redraw_model`) | 🔜 LATER (schema migration) | `scripts/library-schema.sql` | Additive/nullable. Not tonight — schema is applied by Brandon in Supabase. |
| `library_manuals` table + `/api/manual/*` routes (full-PDF serve) | 🔜 LATER | `index.js` (locked) | The earlier spec's Piece 2.4. Backend-locked. |
| Batch ingestion re-run for all `_HVAC_BRANDS` | 🔜 BLOCKED on Brandon | Needs `VOYAGE_API_KEY`/`OPENAI_API_KEY` + `SUPABASE_SERVICE_KEY`/`PG_CONNECTION` on Railway | `_RAG_ENABLED` is false locally; ingestion cannot run/verify here. |
| On-device thinking model (offline conversation) | 🔜 PHASE 2 (native) | — | Physically can't run Opus on-device; reference layer (already built) is the offline value now. |

---

## What "genuinely new" reduces to (tonight's build)

The redraw engine's novel, testable core is **three pure/deterministic pieces** — no network, no AI, no DB, no `index.js`/`index.html` edits:

1. **`netlist-schema.json`** — the contract the vision extractor must satisfy.
2. **`render-netlist-svg.js`** — netlist → clean, color-coded, big-label SVG (deterministic layout so the same netlist is byte-identical every time → cacheable + diffable).
3. **`verify-gate.js`** — structural round-trip: every source net/terminal must reappear in the redraw; score ≥ 0.98 → `verified`, else `draft`. Fail-toward-distrust.

Everything around them (fetch, embed, vision-extract, DB persist, client render, offline prefetch) **already exists or is a locked-file wiring job for later.** This build produces the isolated, tested engine those later steps plug into.

---

## Exact integration points for LATER (do NOT edit these files tonight)

- **Extraction call:** `/api/ai` handler already has `_wiringDiagramIntent` and surfaces `_ragDiagrams` (retrieval at `index.js:1527–1556`). A `redrawDiagram(modelKey)` job would call the vision model on `manual_chunks.diagram_image_url` (already populated by `extract-diagrams.js`) → `netlist` → `renderNetlistSVG` (this build) → `verifyRedraw` (this build) → persist via the existing `POST /api/library/diagram` (`index.js:1275`).
- **Persist:** existing `/api/library/diagram` (`index.js:1275`) stores `svg` into `library_diagrams` for `source='mike-svg'`. To carry `netlist`/`verify_state`/`verify_score`, add nullable columns to `scripts/library-schema.sql` and extend that route — locked, later, behind confirm.
- **Serve:** existing `GET /api/library/:modelKey` (`index.js:1247`) returns diagrams verified-first. Add `verify_state`/`verify_score` to the projection later.
- **Client render:** the clean SVG rides the existing `⟦MIKE_DIAGRAM⟧` path (`public/index.html:9264`) or `library_diagrams.svg` render; a `draft` ribbon is a later `public/index.html` edit (must not change `parseJSON`/`renderDiagCards`/`JOB_SAVED`/`data-lucide=` counts).
- **Offline:** the redraw SVG caches via the existing IndexedDB `idbSaveDiagram` (`public/index.html:8733`) and the SW `/diagrams/*` SWR path — no new offline primitive needed.

---

## Blocked-on-Brandon (credentials/decisions)

1. **`VOYAGE_API_KEY` (or `OPENAI_API_KEY` + `EMBED_PROVIDER=openai`)** on Railway → flips `_RAG_ENABLED` true. Running/verifying ingestion is impossible without it. **Not available locally.**
2. **`SUPABASE_SERVICE_KEY` or `PG_CONNECTION`** to run `ingest-manuals.js` / `extract-diagrams.js` against the real DB, and to verify chunk counts. **Not available locally** — the redraw engine below is therefore built + tested with a self-contained sample netlist, no DB.
3. **Embedding provider lock** (Voyage 1024 vs OpenAI 3072) — can't be changed after ingesting.
4. **Schema migration** on `library_diagrams` + any `index.js` route change — locked files, behind his plain-English confirm.
5. **Auto-`verified` threshold (0.98)** and flipping any redraw from `draft` to broadly-served — safety-critical sign-off.
