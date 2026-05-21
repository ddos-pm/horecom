/**
 * scripts/seed-inventory.ts
 *
 * Populates InventorySnapshot with a realistic distribution so the catalog
 * doesn't read "in_stock: false" for every product after a fresh seed.
 *
 * Distribution:
 *   30% out-of-stock (availableQty = 0, status = OUT_OF_STOCK) — for substitution testing
 *   50% medium stock (availableQty 10–50, status = IN_STOCK)
 *   20% high stock  (availableQty 50–200, status = IN_STOCK) — bestsellers
 *
 * Idempotent: uses prisma.inventorySnapshot.upsert keyed on productId.
 *
 *   npx tsx scripts/seed-inventory.ts                 # full distribution
 *   npx tsx scripts/seed-inventory.ts --reset-out-of-stock 0   # zero everything (test substitution)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function pickBucket(seed: number) {
  // Stable bucket by hash of cuid so re-running yields same distribution
  const r = (seed % 100);
  if (r < 30) return "out";
  if (r < 80) return "medium";
  return "high";
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function qtyFor(bucket: string) {
  if (bucket === "out") return 0;
  if (bucket === "medium") return 10 + Math.floor(Math.random() * 41); // 10–50
  return 50 + Math.floor(Math.random() * 151); // 50–200
}

function statusFor(qty: number) {
  if (qty === 0) return "OUT_OF_STOCK";
  if (qty < 10) return "LOW_STOCK";
  return "IN_STOCK";
}

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, sku: true, name: true },
    orderBy: { sku: "asc" },
  });

  console.log(`Seeding inventory for ${products.length} products…`);

  let out = 0, medium = 0, high = 0;
  for (const p of products) {
    const bucket = pickBucket(hash(p.sku));
    const qty = qtyFor(bucket);
    const status = statusFor(qty);
    if (bucket === "out") out += 1;
    else if (bucket === "medium") medium += 1;
    else high += 1;

    await prisma.inventorySnapshot.upsert({
      where: { productId: p.id },
      create: {
        productId: p.id,
        availableQty: qty,
        stockStatus: status as "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK",
        source: "MANUAL_ADMIN",
      },
      update: {
        availableQty: qty,
        stockStatus: status as "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK",
        source: "MANUAL_ADMIN",
      },
    });
  }

  console.log(`✓ Done. ${out} out-of-stock · ${medium} medium · ${high} high · total ${products.length}`);
  const inStockNow = await prisma.inventorySnapshot.count({ where: { availableQty: { gt: 0 } } });
  console.log(`✓ In-stock products now: ${inStockNow}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
