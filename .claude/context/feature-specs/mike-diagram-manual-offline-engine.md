# Mike Diagram · Manual · Offline Engine — Implementation Spec

**Author:** Ricky (senior eng) · **Date:** 2026-07-16 · **Status:** SPEC ONLY — no code written yet
**Greenlit architecture:** `~/.claude/.../memory/mike-diagram-manual-offline-engine.md` (follow exactly)
**Related code (do not edit in this task):** `index.js` (backend, LOCKED whole-file), `public/index.html` (frontend, per-region locked)

---

## 0. Guiding rules baked into every piece below

- **Accuracy is pass/fail.** A redrawn wire on a live 240V board = shock / fried control board. Every redraw is **fail-toward-distrust**: unverified until it round-trips against the real source, and even then the real diagram is always one tap away.
- **Do the expensive AI work ONCE per model, cache forever.** Cost scales with the count of NEW models seen, not with usage. Every cache hit = zero AI cost.
- **Reuse what exists.** The verified-library tables (`library_models`, `library_diagrams`, `library_flags`) and routes (`/api/library/*`, `index.js:1246–1377`) and the RAG stack (`index.js:1438–1556`) already exist. We extend them, we don't reinvent.
- **Same work, two surfaces.** The online redraw engine and the offline pack are the *same* cached artifacts served two ways (HTTP now, service-worker/IndexedDB offline).
- **Locked-file discipline:** `index.js` is a locked whole file; every backend change here goes on a branch, `TRAZER_HOOK_OVERRIDE=1` at session launch, one commit per logical change, gates 1–7 + `shasum` re-baseline. `public/index.html` edits surface diff-before-edit and must pass the 7-gate audit (`parseJSON`/`renderDiagCards`/`JOB_SAVED`/`data-lucide=` counts + brace delta unchanged). Nothing ships to prod without Brandon's plain-English confirm.

---

## PIECE 1 — DIAGRAM REDRAW ENGINE (accuracy-safe)

**Goal:** Mike reads the REAL manufacturer wiring diagram in the background, extracts the circuit as structured data (a netlist), deterministically renders a clean legible SVG (big labels, color-coded, one circuit at a time), and **verifies the redraw against the source before a tech ever sees it as trusted.**

### 1.1 Data model changes

Extend the existing library tables (dead-exact keyed on `normalizeModelKey`, `index.js:1484`). No new match logic.

**`library_diagrams`** — add columns (all nullable, additive):
| column | type | purpose |
|---|---|---|
| `netlist` | `jsonb` | the extracted structured circuit (see 1.2). Source of truth for the render + verify. |
| `source_diagram_url` | `text` | the real OEM diagram image/PDF-page URL the redraw was traced from (mirrors `manual_chunks.diagram_image_url`). |
| `verify_state` | `text` | `'draft' \| 'verified' \| 'failed'`. `draft` = redraw exists, not yet trusted. Distinct from admin `verified` bool (human sign-off) — auto-verify sets `verify_state='verified'`; admin can still promote `verified=true`. |
| `verify_score` | `real` | 0..1 round-trip agreement from the auto-check (1.4). |
| `verify_notes` | `text` | machine-readable list of mismatches on a failure. |
| `redraw_model` | `text` | which AI model produced the extraction (audit / cost tracking). |

`source` column stays `'mike-svg'` for redraws (existing routes filter on it — keep them working).

**New table `library_manuals`** (used by Pieces 2–3, referenced here for `source_diagram_url` provenance):
```
library_manuals(
  id uuid pk default gen_random_uuid(),
  model_key text,            -- normalizeModelKey; nullable (brand-level manuals)
  brand text,
  doc_type text,             -- 'service' | 'spec' | 'iom' | 'wiring'
  title text,
  storage_path text,         -- Supabase Storage object path (2.2)
  page_count int,
  wiring_page_nums int[],    -- pages detected to hold a schematic (2.3)
  source_url text,           -- where we fetched it
  sha256 text,               -- dedup / idempotency (Piece 3)
  bytes int,
  fetched_at timestamptz default now()
)
```

### 1.2 Netlist schema (the structured circuit)

The AI's job is extraction, NOT drawing. It returns strict JSON that a deterministic renderer turns into SVG. This separation is the whole accuracy story — the model never emits SVG path coordinates (where hallucination hides).

```jsonc
{
  "circuit_type": "low-voltage",         // 'low-voltage' | 'line-voltage' | 'full' | 'defrost' | 'ignition'
  "model_key": "GOODMAN:GSX130361",
  "components": [
    { "id": "TSTAT", "label": "Thermostat", "terminals": ["R","Y","G","C","W"] },
    { "id": "CONTACTOR", "label": "Contactor", "terminals": ["A1","A2","T1","T2"] },
    { "id": "CAP", "label": "Dual Run Cap 45/5", "terminals": ["HERM","FAN","C"] }
  ],
  "nets": [
    { "id": "n1", "wire_color": "yellow", "gauge": "18",
      "connects": [ {"comp":"TSTAT","term":"Y"}, {"comp":"CONTACTOR","term":"A1"} ] }
  ],
  "notes": ["Factory jumper R-Rc present"],
  "source_ref": { "doc_title": "Goodman GSX13 Service Manual", "page": 22 }
}
```
Hard schema rules the extractor MUST satisfy (rejected + retried if not): every `nets[].connects[].comp`/`term` must resolve to a declared component+terminal; ≥2 endpoints per net; no free-text coordinates.

### 1.3 Control flow (background, non-blocking, cache-first)

Trigger points (both cache-first — the tech NEVER waits on a redraw):
1. **On-demand:** `/api/ai` handler already sets `_wiringDiagramIntent` (`index.js:1644`) and surfaces `_ragDiagrams`. When intent is true AND `library_diagrams` has no `mike-svg` row for the model_key, enqueue a redraw job (fire-and-forget) and return the *real* diagram image inline this turn (existing `⟦MIKE_DIAGRAM⟧` sentinel, `index.js:1900`). Next tech on that model gets the clean redraw.
2. **Batch:** the ingestion pipeline (Piece 3) redraws the wiring page of every manual it ingests.

Redraw job (`redrawDiagram(modelKey, opts)`), sequential, all steps fail-safe:
```
async function redrawDiagram(modelKey) {
  // a. resolve the real source: library_manuals.wiring_page → page image (2.3),
  //    else manual_chunks.diagram_image_url for this model/brand.
  // b. EXTRACT (big model, vision): source image → netlist JSON (1.2), strict-schema-validated.
  //    retry ≤2 on schema-invalid; on final fail → mark verify_state='failed', keep real image only.
  // c. RENDER (deterministic, NO AI): renderNetlistSVG(netlist) → clean SVG string.
  // d. VERIFY (1.4): auto-check redraw vs source → {score, ok, notes}.
  // e. PERSIST via POST /api/library/diagram (existing, index.js:1275) extended to carry
  //    netlist + verify fields; verify_state = ok?'verified':'draft'.
}
```

**Key signatures:**
```
async function extractNetlist(sourceImageBuf, modelKey, brand): Promise<Netlist|null>   // big model, vision
function renderNetlistSVG(netlist): string                                             // deterministic, pure
async function verifyRedraw(netlist, sourceImageBuf): Promise<{score:number, ok:boolean, notes:string[]}>
async function redrawDiagram(modelKey, {force=false}): Promise<{diagram_id, verify_state, score}>
```

**Renderer style (reference the already-demoed clean look):** one circuit per SVG; components as labeled boxes on a grid; nets as orthogonal color-coded polylines using the real `wire_color`; terminal labels ≥14px; a legend; a watermark band showing `verify_state`. Fully deterministic layout (e.g. layered/Sugiyama-lite: components ranked by net degree, nets routed on lanes) so the same netlist always renders identically (byte-stable → cacheable + diffable).

### 1.4 The verify gate (the whole ballgame)

Redraw is `draft` until it round-trips. Two independent checks; BOTH must pass for `verified`:

- **A. Structural round-trip (deterministic):** re-derive an adjacency signature from the rendered SVG's data attributes (each polyline carries `data-net`, `data-from`, `data-to`) and assert it is set-equal to `netlist.nets`. Any missing/extra/renamed connection → fail. This catches renderer bugs.
- **B. Second-model source agreement (AI, cheap-ish vision model, different prompt):** show the second model the ORIGINAL source image + the netlist-as-a-connection-table and ask "does every listed connection appear in this diagram, and are there connections in the diagram not listed?" Return `{missing:[], extra:[], mismatched:[]}`. `score = 1 - (missing+extra+mismatched)/total`. Threshold `verify_score ≥ 0.98` AND `missing==0` AND `mismatched==0` (extra on the source is tolerable — we may intentionally draw one circuit).

`ok = A_passes && B_passes`. On `ok=false` → `verify_state='draft'`, store `verify_notes`, still serve it **labeled "draft — check the real manual"** with the real diagram one tap away. Admin review queue (`/api/library/admin/unverified`, `index.js:1365`) extended to show `verify_state`, `verify_score`, `verify_notes` so a human can promote/flag. Existing flag route (`index.js:1327`) already auto-demotes at ≥2 flags — reuse unchanged.

### 1.5 Endpoints (new/changed)

- **CHANGE `POST /api/library/diagram`** (`index.js:1275`): accept `netlist`, `source_diagram_url`, `verify_state`, `verify_score`, `verify_notes`, `redraw_model` and persist them. Backward-compatible (all optional).
- **CHANGE `GET /api/library/:modelKey`** (`index.js:1247`): include `verify_state`, `verify_score` per diagram, and prefer `verify_state='verified'` in the existing order (`verified.desc,created_at.desc` → add `verify_state`). Still zero-AI.
- **NEW `POST /api/library/redraw`** (auth, admin OR internal token): body `{brand, model, force?}` → enqueues/awaits `redrawDiagram`. Used by the batch pipeline and the admin dashboard "redraw now" button. Rate-limited; guarded by `globalActive` cap like `/api/ai`.
- **NEW `GET /api/library/diagram/:id/source`** (auth): 302/streams the real `source_diagram_url` (or the manual page image, Piece 2) — powers the always-present "check the real manual" tap.

### 1.6 Client hook (public/index.html — spec only)

Where the `⟦MIKE_DIAGRAM⟧` sentinel is already parsed and rendered inline, extend the render to: show the clean SVG when `verify_state==='verified'`; when `'draft'`, render with an amber "DRAFT — verify against the real manual" ribbon + a prominent "Open real manual" button hitting `/api/library/diagram/:id/source`. Must not change `parseJSON`/`renderDiagCards`/`JOB_SAVED` counts.

### 1.7 Failure modes + fallbacks

| failure | behavior |
|---|---|
| No source diagram found for model | No redraw. Mike answers from RAG text + offers real manual if one exists; never invents a schematic. |
| Extractor returns invalid schema after retries | `verify_state='failed'`; serve real image only. Logged for admin. |
| Verify B (second model) unreachable | `verify_state='draft'` (never auto-`verified` without B). Serve draft + real manual. |
| Renderer throws | Catch → no SVG persisted; real image path unaffected. |
| Supabase null (existing pattern) | Routes already fail-safe to `{found:false}`/`{ok:false}` — preserve. |

---

## PIECE 2 — REAL MANUAL FETCH + SERVE

**Goal:** given a model, fetch the real service-manual PDF, store it, expose "show real manual," and extract the wiring-page image for Piece 1's source.

### 2.1 Fetch (targeted, browser-UA)

```
async function fetchManualPdf(brand, model): Promise<{buf:Buffer, sourceUrl:string}|null>
```
- Query construction: `"{brand} {model} service manual filetype:pdf"` against a search step, restricted to a hostlist of manufacturer + known aggregators (`hvacpartsshop.com`, `manualslib.com`, OEM domains). Reuse the existing `web_search` capability pattern or a direct search API — spec leaves the search transport to build-time (must be server-side, keyed).
- **Cloudflare note (proven 2026-07-16):** a bare `curl`/`python-urllib` gets 520/1010-banned. MUST send a real browser `User-Agent` + `Accept`/`Accept-Language` headers on the PDF GET. Node `fetch` with a spoofed UA succeeded on the Goodman GSX PDF from hvacpartsshop.com.
- Validate: `%PDF` magic bytes, `bytes < 60MB`, `Content-Type` pdf-ish. Compute `sha256` for dedup.

### 2.2 Store

- Upload to **Supabase Storage** (bucket `manuals`, private) at `storage_path = {brand}/{model_key}/{sha256}.pdf`. Insert a `library_manuals` row (1.1). Idempotent on `sha256` (skip upload if row exists).
- Access via the service key server-side only; clients never hit Storage directly.

### 2.3 Wiring-page extraction

```
async function extractWiringPages(pdfBuf): Promise<{pageNum:number, pngBuf:Buffer}[]>
```
- Render pages to PNG. **Proven toolchain 2026-07-16:** `pypdfium2 + Pillow` (installed `--user`; no brew/poppler on this Mac). This is a build-time/worker dependency (a small Python worker or a Node pdf-render lib) — NOT added to the Express hot path.
- Detect the schematic page(s): heuristic (page text density low + many thin lines + presence of terminal tokens `R/Y/G/C/W`, "SCHEMATIC", "WIRING") → store `wiring_page_nums` on the manual row and cache the page PNG (used as Piece 1 source and offline reference).

### 2.4 Endpoints

- **NEW `GET /api/manual/:modelKey`** (auth): returns `{found, title, page_count, wiring_page_nums, has_pdf}` for the model.
- **NEW `GET /api/manual/:modelKey/pdf`** (auth): streams the stored PDF (service-key read from Storage, piped through). `Cache-Control` long-lived + `ETag=sha256` so the service worker can cache it.
- **NEW `GET /api/manual/:modelKey/page/:n.png`** (auth): streams a rendered page PNG (renders on first request, caches to Storage `pages/` prefix). Powers "show the wiring page" + Piece 1 source.
- **NEW `POST /api/manual/fetch`** (admin/internal): `{brand, model}` → `fetchManualPdf` → store. Used by Piece 3 + admin.

### 2.5 Failure modes

| failure | behavior |
|---|---|
| No PDF found | `has_pdf:false`; Mike says "no manual on file for this exact model yet" — never fabricates one. |
| Cloudflare/host block | Retry with UA rotation ≤2, then log + skip. Pipeline continues to next model. |
| PDF renders but no wiring page detected | `wiring_page_nums=[]`; manual still served; redraw skipped (no source). |
| Storage write fails | Return the fetched buffer once (best-effort) but don't claim persistence; log. |

---

## PIECE 3 — MANUAL INGESTION PIPELINE (batch)

**Goal:** a batch job that fetches + ingests real service manuals/spec sheets for **every brand in `_HVAC_BRANDS`** (`index.js:1450`) into `manual_chunks` (embeddings) AND stores the PDFs (Piece 2). This is the fix for the "thin `manual_chunks`" root cause found 2026-07-16 (only some Goodman families ingested → nearest-DIFFERENT-family misses).

### 3.1 Prerequisite (blocking)

`_RAG_ENABLED` (`index.js:1449`) is `false` until an embeddings key is set on Railway: **`VOYAGE_API_KEY`** (default provider) or **`OPENAI_API_KEY`** with `EMBED_PROVIDER=openai`. Ingestion is pointless without it. This is a Brandon/Railway action — first item in the build sequence. Verify with a boot-log check (the RAG block computes `_RAG_ENABLED`) or a probe endpoint (3.5).

### 3.2 `manual_chunks` schema (must match `retrieveManualContext`, `index.js:1527`)

Retrieval expects: `chunk_text`, `doc_title`, `page_num`, `brand`, `diagram_image_url`, model-family filtering, and an RPC `match_manual_chunks(query_embedding, match_threshold, match_count, filter_brand, filter_model_family)`. The ingester MUST populate:
```
manual_chunks(
  id uuid pk,
  brand text,               -- canonical key (must match _extractBrand output, index.js:1470)
  model_family text,        -- _extractModelFamily style (index.js:1475)
  doc_title text,
  page_num int,
  chunk_text text,
  diagram_image_url text,   -- page PNG URL when the chunk's page holds a schematic (Piece 2.3)
  embedding vector(<_EMBED_DIM>),  -- 1024 voyage / 3072 openai (index.js:1447)
  manual_id uuid,           -- FK → library_manuals.id
  sha256 text,              -- source dedup
  created_at timestamptz default now()
)
```
Embedding dim MUST equal `_EMBED_DIM` (`index.js:1447`) or the pgvector RPC breaks. Lock the provider before ingesting — you cannot mix 1024-dim and 3072-dim vectors in one column.

### 3.3 Pipeline (`scripts/ingest-manuals.js` — a standalone worker, NOT in index.js)

```
for each brand in _HVAC_BRANDS (+ _BRAND_ALIASES canonicalized):
  1. resolve a model list for the brand (brand model index / search)   → per-model
  2. fetchManualPdf(brand, model)            (Piece 2.1)  → skip if sha256 already in library_manuals
  3. store PDF + row                         (Piece 2.2)
  4. render pages, detect wiring pages       (Piece 2.3) → cache PNGs, set diagram_image_url
  5. chunk text (page-aware, ~800–1200 tok, overlap ~120)
  6. embed each chunk (_embedQuery-style call, batched)  → insert manual_chunks
  7. (optional, gated) redrawDiagram(model_key)          (Piece 1) for the wiring page
  8. record progress row (3.4)
```
Runs off the prod hot path (own process / Railway one-off / cron). Reuses `_embedQuery` logic (`index.js:1492`) but as a batch embed call. Respects rate limits with backoff.

### 3.4 Idempotency + progress

New table `ingestion_progress(brand text, model_key text, stage text, status text, sha256 text, error text, updated_at timestamptz)`.
- **Idempotent by `sha256`** (skip already-ingested PDFs) and by `(model_key, stage)` (resume mid-brand after a crash). Re-running the job is safe and only fills gaps.
- Per-brand progress so we can ship brand-by-brand ("Goodman + Carrier + Trane done" before "all 60 brands").

### 3.5 Verify ingestion

- **NEW `GET /api/rag/stats`** (admin): `{rag_enabled, embed_provider, embed_dim, chunks_total, per_brand:{brand:count}, manuals_total, models_with_wiring}`. This is how we confirm the thin-table problem is fixed (Goodman GSX13 present, every brand > 0).
- Spot-check: run the exact failing prod query ("Goodman GSX130361 fault code / MCA") and confirm retrieval now hits the right family, not a cousin.

### 3.6 Failure modes

| failure | behavior |
|---|---|
| `_RAG_ENABLED` false | Job refuses to start, prints the missing-key message. |
| Embedding dim mismatch vs column | Hard stop before insert (guardrail check on row 1). |
| One model fails fetch/render | Log to `ingestion_progress`, continue; never abort the whole brand. |
| Duplicate PDF across models | `sha256` dedup → one Storage object, multiple `manual_chunks.manual_id` allowed. |

---

## PIECE 4 — TOKEN / COST STRATEGY (explicit)

The cost curve **scales with the number of NEW models Mike has never seen, not with how many techs ask.** Once a model is cached, it's free forever.

### 4.1 Right model per step

| step | model | frequency |
|---|---|---|
| Cache hit (served redraw / manual / spec) | **NONE** (deterministic DB read) | every reuse — the common case |
| Routine chat, non-diagram | small/cheap model (env-selectable, e.g. Haiku-tier) | per message |
| Netlist EXTRACT (Piece 1.2) | **big model** (Opus-tier, vision) | ONCE per model, ever |
| Verify B second-model check (1.4) | cheaper vision model, DIFFERENT from extractor | ONCE per model |
| Static facts (PT charts, fault codes, cached specs) | **NONE** — deterministic table lookup from cached manual | always |

Rule enforced in code: **never run the big model on a cache hit.** `redrawDiagram` short-circuits if a `mike-svg` row exists and `force` is false.

### 4.2 Deterministic (no-AI) lookups

PT charts, fault-code tables, and cached specs are structured data pulled from the ingested manual / `library_models.specs` and returned WITHOUT an AI call. `_needsManualRetrieval` (`index.js:1460`) already routes these; extend so a direct table match (fault code X for model Y) returns the stored answer with a citation and skips the model entirely. Don't spend a token to read a table cell.

### 4.3 Leverage existing prompt caching

`AGENT_SYSTEM` (~16k tokens) is already cached 1h (`index.js:1684–1698`, `cache_control ephemeral ttl:1h`). Keep the base rulebook in the cached block; RAG excerpts + redraw context go in the uncached tail (already the pattern). Retrieval already returns top-6 reranked chunks, not whole manuals (`index.js:1543`) — keeps per-message input tokens bounded.

### 4.4 Expected cost curve

- **One-time per model:** ~1 big vision extract + 1 cheaper verify + N cheap embeds (already sunk in ingestion). Amortized across every future tech on that model → approaches $0/use.
- **Steady state:** the fleet mostly hits cached artifacts (zero AI) + cheap routine chat. Big-model spend is a **one-time capex per model**, front-loaded by the batch pipeline (Piece 3), not a per-tech opex.
- **Guard:** the `globalActive`/`MAX_GLOBAL` cap (`index.js:1559`) already throttles concurrent big calls. Add a per-day redraw budget in the worker so a flood of new models can't spike spend unbounded.

---

## PIECE 5 — OFFLINE PACK

Honest ceiling stated first: **full Opus offline on a phone is physically impossible** (model too large). But the *reference layer* is 80% of the field value and is dead-accurate offline, and a small on-device *thinking layer* (phase 2, native) makes offline Mike genuinely useful.

### 5.1 (a) Reference layer — buildable now, deterministic = safest offline

Cache on-device the verified artifacts so a tech in a no-signal basement still has them:
- verified clean diagrams (SVG — tiny), the real manual PDF(s) + wiring-page PNGs, PT charts, fault-code tables, cached specs.

**Storage:** the app already has offline/PWA groundwork (service worker + PWA, per memory). Use:
- **Service worker Cache Storage** for static/binary assets (SVGs, PDFs, PNGs) keyed by the `/api/library`, `/api/manual` URLs (ETag/sha256 versioned).
- **IndexedDB** for structured JSON (netlists, PT charts, fault-code tables, specs) so lookups work offline without a server round-trip.

**Pre-fetch on job start (the key move):** when a tech scans a nameplate **with signal** (driveway), the client fires a **prefetch kit** for that unit before walking into the basement:
- **NEW `GET /api/library/kit/:modelKey`** (auth): returns a manifest `{ diagrams:[{id,url,verify_state}], manual:{pdf_url,pages:[...]}, pt_charts, fault_codes, specs }` — one call the client uses to warm every cache entry for that unit.
- Client downloads all manifest URLs into Cache Storage + writes the JSON into IndexedDB. Now the whole basement job is offline-capable.

**Always-on core pack:** a bundled/served baseline of common-brand content (top brands: Goodman, Carrier/Bryant, Trane/AmStd, Lennox, Rheem/Ruud, York) — PT charts for common refrigerants (R-410A, R-454B, R-32, R-22), universal fault-code sheets, common diagrams — cached on first launch so Mike is never empty offline even without a prefetch.
- **NEW `GET /api/library/core-pack`** (auth): returns the manifest for the core pack (versioned; service worker refreshes when the version bumps).

**Failure modes:** offline + artifact not in cache → Mike says plainly "I don't have that on this device — grab signal and I'll pull it," never guesses. Prefetch partial-fail → cache what succeeded, flag which pieces are missing.

### 5.2 (b) Thinking layer — phase 2, native app only

- A **small fine-tuned on-device model (3–4B, runs on modern iPhones)** for *conversation* offline (the native app, per `native-app-venture`). It handles phrasing/flow.
- **Safety-critical answers ALWAYS defer to cached verified data** — the small model never free-forms a shutdown threshold, a wiring connection, or a spec; it retrieves from the offline reference layer (5.1) and reads it back. Same fail-toward-distrust rule.
- **Store-and-forward queue:** questions asked with no signal (that the on-device model can't safely answer from cache) are queued in IndexedDB and auto-sent to `/api/ai` when signal returns, with a notification back to the tech.
- Fine-tuning corpus = verified field data + the ingested manuals (the long-game moat from `mike-outage-fallback-and-own-ai`).

---

## BUILD SEQUENCE

1. **[Brandon/Railway]** Set `VOYAGE_API_KEY` (or `OPENAI_API_KEY` + `EMBED_PROVIDER=openai`) on Railway → flips `_RAG_ENABLED` true. Verify via boot log / `/api/rag/stats`. **BLOCKING for Piece 3.**
2. **Piece 2** — manual fetch + store + page extraction (`fetchManualPdf`, Supabase Storage `manuals` bucket, `library_manuals` table, `/api/manual/*` routes, browser-UA, pypdfium2 worker). Standalone-testable.
3. **Piece 1** — redraw engine on top of Piece 2's page images: netlist schema, `extractNetlist` (big model), `renderNetlistSVG` (deterministic), `verifyRedraw` (A structural + B second-model), extend `library_diagrams` + `/api/library/diagram` + `/api/library/redraw`. Draft-vs-verified labeling.
4. **Piece 3** — batch ingestion (`scripts/ingest-manuals.js`), `manual_chunks` populated for every `_HVAC_BRANDS` entry, `ingestion_progress` idempotency, `/api/rag/stats` verify. Ship brand-by-brand (Goodman/Carrier/Trane first — fixes the known GSX13 miss).
5. **Run `eng-mike-quality-tester`** against the newly-grounded brain (re-cert safety + accuracy; every gap → a verified rule; per the accuracy-flywheel).
6. **Piece 4** is a *constraint on how 1–3 are built* (right model per step, cache-first, deterministic lookups) — verify it's honored, don't build it separately.
7. **Piece 5a** — offline reference layer (`/api/library/kit/:modelKey`, `/api/library/core-pack`, service-worker + IndexedDB caching, prefetch-on-nameplate-scan).
8. **Piece 5b** — on-device thinking layer (phase 2, native app; after native venture matures).

Crew: **Ricky** architects/builds, **Edwin** owns diagram labeling + Mike's voice around drafts, **Alex** ships. Branch always; `TRAZER_HOOK_OVERRIDE=1` at session launch for any `index.js` touch; 7-gate audit + `shasum` re-baseline per commit.

---

## MUST STAY BEHIND BRANDON'S CONFIRM (before prod)

- Any `index.js` change (locked whole file) — every route/schema hook above.
- Any `public/index.html` change (diagram render ribbon, prefetch client, offline caching).
- Setting the embedding key on Railway (his account) and choosing the provider (locks `_EMBED_DIM` — can't be changed after ingesting).
- Running the batch ingestion at scale (cost + Storage footprint + scraping hostlist).
- Flipping any redraw from `draft` to broadly-served, and the auto-`verified` threshold (0.98) — safety-critical.
- Shipping the offline core-pack (payload size on device) and the phase-2 on-device model.

---

## OPEN QUESTIONS

1. **Search transport for manual discovery** — reuse Anthropic `web_search` tool server-side, or a dedicated search API (Serper/Bing) for the hostlist-restricted `filetype:pdf` query? Affects cost + reliability.
2. **PDF render dependency in prod** — pypdfium2 is a Python `--user` install locally; on Railway/Nixpacks do we run a Python side-worker, or swap to a Node-native pdf-to-image lib? (Keep it OFF the Express hot path either way.)
3. **Model list per brand** — where does the per-brand model catalog come from (OEM model-lookup pages, a seed CSV, or discovered from manual filenames)? Determines Piece 3 coverage.
4. **Second-model verifier identity** — which cheaper vision model for verify B, and is cross-provider (e.g. verify on a non-Anthropic model) acceptable/desirable for independence?
5. **Storage bucket cost** — full-brand PDFs + page PNGs may exceed Supabase free-tier (already noted near limit). Budget/tier decision before batch run.
6. **Core-pack contents + size cap** — exact brand/refrigerant list and max on-device payload for the always-on pack.
7. **Legal/FTO on redistributing OEM manuals** — serving stored manufacturer PDFs to techs; confirm the same guardrails as the diagram-library moat (public-info, fair-use posture) hold for full-PDF hosting.
