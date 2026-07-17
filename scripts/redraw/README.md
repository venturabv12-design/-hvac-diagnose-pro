# Mike Redraw Engine (`scripts/redraw/`)

The **genuinely-new** piece of the diagram-redraw feature: Mike reads the REAL
OEM wiring diagram and **redraws it clean + easy — verified against the source**
before a tech ever trusts it. Everything else in the pipeline (manual ingest,
diagram-image extraction, RAG retrieval, verified-library tables, offline cache)
**already exists** — see `../../.claude/context/feature-specs/mike-redraw-engine-RECONCILED.md`.

## The accuracy story (why this design)

The AI's job is **extraction, not drawing.** It emits a structured **netlist**
(JSON), and a deterministic renderer turns that into SVG. The model never emits
a path coordinate — so there's nowhere for a hallucinated wire to hide. Every
rendered net carries `data-net` / `data-from` / `data-to` attributes = the
machine-readable proof of what was actually drawn, which the verify gate checks
set-equal to the source. **Fail-toward-distrust:** a redraw stays `draft`
(untrusted, real manual one tap away) until it round-trips at ≥ 0.98.

## Files

| file | what it is |
|---|---|
| `netlist-schema.json` | Strict JSON schema (draft-07) for a wiring netlist: `components[]`, `terminals[]`, `nets[]` (each net ties ≥2 terminals, carries `voltage_class` + `wire_color` + `label`). The contract the vision extractor MUST satisfy. |
| `render-netlist-svg.js` | **Pure, deterministic** `renderNetlistSVG(netlist) → SVG string`. No AI, no network. Big labels, voltage-class color-coding (240V line = red-orange, 24V control = teal, start/run = amber), one circuit laid out readably, legend + tagged nets. Byte-stable (same netlist → identical bytes → cacheable + diffable). Exported. |
| `verify-gate.js` | **Pure** `verifyRedraw(sourceNetlist, redraw) → {state, score, mismatches}`. Structural round-trip: derives the connection-pair set from source and from the redraw (netlist OR the rendered SVG's data-attrs) and asserts full coverage. Threshold 0.98; `verified` only if score ≥ 0.98 AND zero missing. Exported. |
| `sample-condenser.json` | A single-stage R-410A condenser netlist (240V line → contactor → compressor C/R/S + condenser fan + dual run cap HERM/FAN, 24V coil from Y/C). Lets the renderer run standalone. |
| `demo.js` | Loads the sample, renders to `/tmp/redraw-out.svg`, runs the verify gate (netlist round-trip, SVG round-trip, and a negative control that drops a net), prints the verdict. `node scripts/redraw/demo.js`. |

## Run it

```bash
node scripts/redraw/demo.js
# → writes /tmp/redraw-out.svg, prints PASS/FAIL verdict. exit 0 on success.
```

## How it fits the full pipeline (later wiring — NOT tonight; index.js/index.html are locked)

```
real diagram image                                    clean redraw               trust gate            serve + cache
──────────────────                                    ────────────               ──────────            ─────────────
manual_chunks.diagram_image_url   ──►  extractNetlist(image)  ──►  renderNetlistSVG(netlist)  ──►  verifyRedraw(src, redraw)  ──►  library_diagrams (svg + netlist + verify_state)
   (already populated by                (vision model, LATER —          (THIS FILE, pure)              (THIS FILE, pure)                   + IndexedDB / SW cache
    scripts/extract-diagrams.js)         wired into /api/ai)                                                                              (already built)
```

### Exact integration points for later (with line refs — do NOT edit these files now)

- **Source image (input):** `manual_chunks.diagram_image_url`, populated by
  `scripts/extract-diagrams.js` (whole file). Retrieval already surfaces up to 2
  of these in `retrieveManualContext` — `index.js:1527–1556`.
- **Extraction trigger:** the `/api/ai` handler already computes wiring intent
  (`_wiringDiagramIntent`) and surfaces `_ragDiagrams`; a `redrawDiagram(modelKey)`
  job would call the vision model here, then `renderNetlistSVG` + `verifyRedraw`
  (this folder), then persist. `/api/ai` at `index.js:1558`.
- **Persist:** existing `POST /api/library/diagram` — `index.js:1275`. Stores
  `svg` into `library_diagrams` for `source='mike-svg'`. To carry `netlist`,
  `verify_state`, `verify_score`, add nullable columns to
  `scripts/library-schema.sql` (`library_diagrams`, lines 28–43) and extend the
  route. Both are locked-file / migration work, behind Brandon's confirm.
- **Serve (zero-AI cache hit):** existing `GET /api/library/:modelKey` —
  `index.js:1247` — returns diagrams verified-first. Add `verify_state`/
  `verify_score` to the projection later.
- **Client render:** the clean SVG rides the existing `⟦MIKE_DIAGRAM⟧` path
  (`public/index.html:9264`) or `library_diagrams.svg`. A `draft` ribbon + "open
  real manual" button is a later `public/index.html` edit (must not change
  `parseJSON` / `renderDiagCards` / `JOB_SAVED` / `data-lucide=` counts).
- **Offline:** the redraw SVG caches via existing `idbSaveDiagram`
  (`public/index.html:8733`) and the SW `/diagrams/*` SWR path (`public/sw.js`).
  No new offline primitive needed.

### Second-model verify (the AI half of the gate) — later, not tonight

This build ships the **structural** round-trip (deterministic). The spec's
second, independent AI check (show a cheaper vision model the ORIGINAL image +
the netlist-as-a-connection-table, ask "is every listed connection present, and
are there connections not listed?") is a later `/api/ai`-side addition. Both must
pass for `verified`; until then, `verifyRedraw` alone gates to `draft` unless the
structural check is perfect — which is the safe default.

## Blocked on Brandon (can't run/verify locally)

- **Manual ingestion + diagram extraction** need `SUPABASE_SERVICE_KEY` or
  `PG_CONNECTION` (and `VOYAGE_API_KEY`/`OPENAI_API_KEY` for embeddings). None are
  available in this environment, so this engine is built + tested against the
  self-contained `sample-condenser.json` with **no DB and no network.**
