/**
 * scripts/cleanup-brands.ts
 *
 * Cleans up seed-extracted brand values that confused Дияр's audit:
 *
 *   - brand="TR" → null
 *       /TR is a Turkey country-of-origin suffix on compound-chocolate SKUs,
 *       not a brand. Should not appear in PDP "Бренд" or MCP brand fields.
 *
 *   - brand="Decol" → "DECOL"
 *       Case duplicate of the existing 15-SKU "DECOL" brand. Unify.
 *
 *   - brand="JB Cocoa" → "JB"
 *       Same supplier as the existing 3-SKU "JB" brand (cocoa products).
 *       Unify under the shorter canonical form.
 *
 * Idempotent — running twice is a no-op.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up seed-extracted brand values…");

  const trCount = await prisma.product.count({ where: { brand: "TR" } });
  if (trCount > 0) {
    await prisma.product.updateMany({ where: { brand: "TR" }, data: { brand: null } });
    console.log(`  ✓ ${trCount} SKUs: brand="TR" → null (TR is a country suffix, not a brand)`);
  }

  const decolCount = await prisma.product.count({ where: { brand: "Decol" } });
  if (decolCount > 0) {
    await prisma.product.updateMany({ where: { brand: "Decol" }, data: { brand: "DECOL" } });
    console.log(`  ✓ ${decolCount} SKUs: brand="Decol" → "DECOL" (case unify)`);
  }

  const jbcocoaCount = await prisma.product.count({ where: { brand: "JB Cocoa" } });
  if (jbcocoaCount > 0) {
    await prisma.product.updateMany({ where: { brand: "JB Cocoa" }, data: { brand: "JB" } });
    console.log(`  ✓ ${jbcocoaCount} SKUs: brand="JB Cocoa" → "JB" (canonical short form)`);
  }

  // Same pass for brandResolved (the enriched override), in case enrichment
  // copied any of these forward.
  await prisma.product.updateMany({ where: { brandResolved: "TR" }, data: { brandResolved: null } });
  await prisma.product.updateMany({ where: { brandResolved: "Decol" }, data: { brandResolved: "DECOL" } });
  await prisma.product.updateMany({ where: { brandResolved: "JB Cocoa" }, data: { brandResolved: "JB" } });

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
