CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS rag_chunks (
  id bigserial PRIMARY KEY,
  source_document_id uuid NOT NULL,
  source_page_number integer NOT NULL CHECK (source_page_number > 0),
  part text NOT NULL CHECK (part IN ('Part I', 'Part II', 'Part III')),
  filename text NOT NULL,
  chunk_index integer NOT NULL CHECK (chunk_index >= 0),
  content text NOT NULL,
  verification_status text NOT NULL DEFAULT 'NEEDS_REVIEW',
  embedding_model text NOT NULL,
  embedding vector NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_document_id, source_page_number, chunk_index, embedding_model)
);

CREATE INDEX IF NOT EXISTS rag_chunks_source_page_idx
  ON rag_chunks (source_document_id, source_page_number, chunk_index);

CREATE INDEX IF NOT EXISTS rag_chunks_part_idx
  ON rag_chunks (part, source_page_number);
