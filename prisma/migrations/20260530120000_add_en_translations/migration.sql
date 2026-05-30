-- English-translation columns for catalog data.
-- Nullable so existing rows stay valid until the merch team backfills them.
-- The rendering layer falls back to the Russian columns when these are null.

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "nameEn" TEXT;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "nameEn" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT;
