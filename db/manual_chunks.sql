-- ════════════════════════════════════════════════════════════════════════════
-- Mike's manual-grounded RAG — Supabase pgvector schema + search function
-- Run once in the Supabase SQL editor (project: existing SUPABASE_URL).
--
-- EMBEDDING DIMENSION: must match the embed model used in scripts/ingest-manuals.js
--   voyage-3-large  -> 1024  (recommended: best technical retrieval)
--   voyage-3        -> 1024
--   openai text-embedding-3-large -> 3072
--   openai text-embedding-3-small -> 1536
-- Default below is 1024 (Voyage). If you use a different model, change vector(1024)
-- in BOTH the table and the function to match, then re-run.
-- ════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS manual_chunks (
  id            bigserial PRIMARY KEY,
  brand         text NOT NULL,          -- 'carrier','trane','goodman','lennox','york','rheem','daikin','mitsubishi','lg',...
  model_family  text,                   -- '58MVC','25VNA','XV80','GMVC96',... NULL = brand-wide
  doc_id        text NOT NULL,          -- slug e.g. 'carrier-58mvc-service-2019'
  doc_title     text NOT NULL,          -- human title for citation
  doc_url       text,                   -- canonical OEM PDF URL (citation + legal posture: link, don't redistribute)
  page_num      integer,
  section       text,                   -- 'Fault Code Table' | 'Wiring Diagrams' | 'Sequence of Operation' | 'Specs' | ...
  chunk_text    text NOT NULL,
  chunk_index   integer,                -- position within doc
  diagram_image_url text,               -- Phase 2: Supabase Storage URL when the page carries a diagram
  content_hash  text,                   -- dedupe / idempotent re-ingest
  embedding     vector(1024) NOT NULL,
  created_at    timestamptz DEFAULT now()
);

-- Idempotent re-ingest: one row per (doc, chunk).
CREATE UNIQUE INDEX IF NOT EXISTS manual_chunks_doc_chunk_uidx
  ON manual_chunks (doc_id, chunk_index);

-- Approximate nearest-neighbour index (cosine). Tune `lists` ~= sqrt(rowcount).
CREATE INDEX IF NOT EXISTS manual_chunks_embedding_idx
  ON manual_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS manual_chunks_brand_idx        ON manual_chunks (brand);
CREATE INDEX IF NOT EXISTS manual_chunks_model_family_idx ON manual_chunks (model_family);

-- ── Search function: scoped cosine match, called from /api/ai via Supabase RPC ──
CREATE OR REPLACE FUNCTION match_manual_chunks(
  query_embedding      vector(1024),
  match_threshold      float DEFAULT 0.72,
  match_count          int   DEFAULT 6,
  filter_brand         text  DEFAULT NULL,
  filter_model_family  text  DEFAULT NULL
)
RETURNS TABLE (
  id bigint, brand text, model_family text, doc_title text, doc_url text,
  page_num integer, section text, chunk_text text, diagram_image_url text, similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT
    id, brand, model_family, doc_title, doc_url, page_num, section,
    chunk_text, diagram_image_url,
    1 - (embedding <=> query_embedding) AS similarity
  FROM manual_chunks
  WHERE
    (filter_brand IS NULL OR brand = filter_brand)
    AND (filter_model_family IS NULL OR model_family = filter_model_family)
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
