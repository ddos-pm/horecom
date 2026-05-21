-- Requires pgvector extension enabled in Supabase
-- (Dashboard → Database → Extensions → "vector" → Enable). This migration is
-- safe to deploy after enabling — CREATE EXTENSION IF NOT EXISTS is idempotent.
CREATE EXTENSION IF NOT EXISTS vector;

-- pgvector column on Product (text-embedding-3-small dim=1536)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

-- HNSW cosine-similarity index for nearest-neighbour search
CREATE INDEX IF NOT EXISTS "Product_embedding_idx"
  ON "Product"
  USING hnsw ("embedding" vector_cosine_ops);
