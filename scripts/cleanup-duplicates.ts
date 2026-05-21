/**
 * scripts/cleanup-duplicates.ts
 *
 * Removes test "Copy: …" duplicates from Product and tidies up.
 * Also re-checks slug uniqueness.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Find every product that starts with "Copy:" (case-insensitive)
  const copies = await prisma.product.findMany({
    where: { name: { startsWith: "Copy:", mode: "insensitive" } },
    select: { id: true, sku: true, name: true },
  });
  console.log(`Found ${copies.length} 'Copy:' product(s):`);
  copies.forEach((p) => console.log(`  - ${p.sku}  ${p.name}`));

  if (copies.length === 0) {
    console.log("Nothing to clean.");
  } else {
    // Detach inventory + delete (cascade handles InventorySnapshot via Product.id)
    const ids = copies.map((c) => c.id);
    // delete dependent inventory snapshots explicitly (in case cascade not set)
    await prisma.inventorySnapshot.deleteMany({ where: { productId: { in: ids } } });
    await prisma.price.deleteMany({ where: { productId: { in: ids } } });
    const res = await prisma.product.deleteMany({ where: { id: { in: ids } } });
    console.log(`Deleted ${res.count} products.`);
  }

  // Slug uniqueness audit
  const dupes = await prisma.$queryRaw<{ slug: string; count: bigint }[]>`
    SELECT slug, count(*) AS count FROM "Product" GROUP BY slug HAVING count(*) > 1
  `;
  if (dupes.length > 0) {
    console.warn("⚠ slug duplicates still present:", dupes);
  } else {
    console.log("✓ no slug duplicates");
  }

  const total = await prisma.product.count();
  console.log(`Total products now: ${total}`);
  await prisma.$disconnect();
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
