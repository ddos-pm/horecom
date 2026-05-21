/**
 * scripts/seed-volume-pricing.ts
 *
 * Populates wholesaleThreshold + wholesalePrice on every Price that doesn't
 * already have them set, so MCP `get_volume_pricing` and the PDP volume-tier
 * table show real numbers instead of an empty array.
 *
 * Logic per product:
 *   - threshold = 4 (or 4 * minOrderQty for sub-unit products)
 *   - wholesalePrice = basePrice * 0.95  (−5%)
 *
 * Bestseller SKUs (top 15 by minOrderQty desc, i.e. bulk-pack products) get
 * a steeper tier:
 *   - threshold = 10
 *   - wholesalePrice = basePrice * 0.90  (−10%)
 *
 * Idempotent: skips Prices that already have wholesale set unless --force.
 *
 *   npx tsx scripts/seed-volume-pricing.ts
 *   npx tsx scripts/seed-volume-pricing.ts --force        # overwrite existing tiers
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const force = process.argv.includes("--force");

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { prices: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { minOrderQty: "desc" },
  });

  console.log(`Found ${products.length} active products. Force=${force}.`);

  // Top 15 — steepest tier
  const steepIds = new Set(products.slice(0, 15).map((p) => p.id));

  let updated = 0;
  let skipped = 0;
  let missingPrice = 0;

  for (const p of products) {
    const price = p.prices[0];
    if (!price) {
      missingPrice += 1;
      continue;
    }
    if (!force && price.wholesaleThreshold && price.wholesalePrice) {
      skipped += 1;
      continue;
    }

    const base = Number(price.basePrice);
    const isSteep = steepIds.has(p.id);
    const threshold = isSteep ? 10 : 4;
    const discount = isSteep ? 0.9 : 0.95;
    const wholesalePrice = Math.round(base * discount * 100) / 100;

    await prisma.price.update({
      where: { id: price.id },
      data: { wholesaleThreshold: threshold, wholesalePrice },
    });
    updated += 1;
  }

  console.log(`✓ Updated ${updated} Prices · skipped ${skipped} (already had tier) · ${missingPrice} products had no Price record`);
  console.log(`✓ Steep tier (10+ → −10%): top ${steepIds.size} products`);
  console.log(`✓ Standard tier (4+ → −5%): remaining products`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
