-- AI-enriched columns on Product (populated by scripts/enrich-products.ts)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "brandResolved" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "descriptionExtended" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "useCases" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "composition" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "storageInfo" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "enrichedAt" TIMESTAMP(3);
