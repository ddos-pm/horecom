import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const total = await p.product.count();
  const active = await p.product.count({ where: { isActive: true } });
  const copies = await p.product.count({ where: { name: { startsWith: "Copy:" } } });
  const copies2 = await p.product.count({ where: { name: { contains: "Copy", mode: "insensitive" } } });
  const withInventory = await p.inventorySnapshot.count();
  const inStock = await p.inventorySnapshot.count({ where: { availableQty: { gt: 0 } } });
  const products = await p.product.findMany({
    where: { name: { contains: "Copy", mode: "insensitive" } },
    select: { sku: true, name: true },
    take: 5,
  });
  console.log("TOTAL products:", total);
  console.log("ACTIVE products:", active);
  console.log("Products with 'Copy' prefix:", copies);
  console.log("Products with 'Copy' anywhere (case-insensitive):", copies2);
  console.log("Inventory snapshots total:", withInventory);
  console.log("Inventory IN_STOCK qty>0:", inStock);
  console.log("\nSample 'Copy' products:");
  products.forEach((p) => console.log(`  ${p.sku}  ${p.name}`));

  // Check SKU dupes (impossible since SKU is unique) — but maybe slug dupes
  const slugDupesRaw = await p.$queryRaw<{ slug: string; count: bigint }[]>`
    SELECT slug, count(*) AS count FROM "Product" GROUP BY slug HAVING count(*) > 1 LIMIT 5
  `;
  console.log("\nSlug duplicates:", slugDupesRaw);

  // Check DECOL count
  const decol = await p.product.count({ where: { name: { contains: "DECOL", mode: "insensitive" } } });
  console.log("\nDECOL products:", decol);

  // Check unitType values
  const units = await p.$queryRaw<{ unit_type: string; count: bigint }[]>`
    SELECT "unitType" as unit_type, count(*) AS count FROM "Product" GROUP BY "unitType" ORDER BY count DESC
  `;
  console.log("\nunitType distribution:");
  units.forEach((u) => console.log(`  ${u.unit_type}: ${u.count}`));

  await p.$disconnect();
}
main().catch(console.error);
