/**
 * scripts/generate-product-embeddings.ts
 *
 * Generates pgvector embeddings (text-embedding-3-small, 1536 dims) for all
 * active products. Used by the MCP `find_similar` tool to rank substitutes
 * via cosine similarity instead of the V0 category+brand+price heuristic.
 *
 * Prerequisites:
 *   1) pgvector extension enabled in Supabase
 *      (Dashboard → Database → Extensions → "vector" → Enable)
 *   2) Migration applied:
 *        psql "$DIRECT_URL" -f scripts/enable-pgvector.sql
 *      or via Supabase SQL editor — paste the contents of that file.
 *   3) OPENAI_API_KEY in .env.local
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/generate-product-embeddings.ts
 *   npx tsx scripts/generate-product-embeddings.ts --limit 10
 *   npx tsx scripts/generate-product-embeddings.ts --sku HC-DAIRY-0067
 *
 * Cost: ~$0.001 for all 190 products (text-embedding-3-small, $0.02 per 1M tokens).
 */

import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = parseArgs(process.argv.slice(2));
const singleSku = args.sku as string | undefined;
const limit = args.limit ? Number(args.limit) : undefined;

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is required. Add it to .env.local.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey });
const MODEL = "text-embedding-3-small"; // 1536 dim, cheap

function composeText(p: {
  name: string;
  brand: string | null;
  brandResolved: string | null;
  category: string;
  description: string | null;
  descriptionExtended: string | null;
  useCases: string | null;
  packLabel: string;
}) {
  return [
    p.name,
    p.brandResolved ?? p.brand,
    p.category,
    p.descriptionExtended ?? p.description,
    p.useCases,
    p.packLabel,
  ]
    .filter((x): x is string => Boolean(x?.trim()))
    .join(". ");
}

async function main() {
  const where = singleSku ? { sku: singleSku } : { isActive: true };
  const products = await prisma.product.findMany({
    where,
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
    ...(limit ? { take: limit } : {}),
  });

  console.log(`Generating embeddings for ${products.length} product(s) (model=${MODEL})…`);

  let ok = 0;
  let skip = 0;
  for (const p of products) {
    const text = composeText({
      name: p.name,
      brand: p.brand,
      brandResolved: p.brandResolved,
      category: p.category.name,
      description: p.description,
      descriptionExtended: p.descriptionExtended,
      useCases: p.useCases,
      packLabel: p.packLabel,
    });

    if (!text.trim()) {
      skip += 1;
      continue;
    }

    try {
      const resp = await openai.embeddings.create({ model: MODEL, input: text });
      const embedding = resp.data[0]?.embedding;
      if (!embedding || embedding.length !== 1536) {
        console.error(`  ✗ ${p.sku}: unexpected embedding length`);
        skip += 1;
        continue;
      }
      // pgvector expects '[0.1,0.2,...]' string form; cast at column type
      const literal = `[${embedding.join(",")}]`;
      await prisma.$executeRawUnsafe(
        `UPDATE "Product" SET "embedding" = $1::vector WHERE "id" = $2`,
        literal,
        p.id,
      );
      console.log(`✓ ${p.sku} · ${p.name.slice(0, 50)}`);
      ok += 1;
    } catch (err) {
      console.error(`  ✗ ${p.sku}: ${err instanceof Error ? err.message : String(err)}`);
      skip += 1;
    }
  }

  console.log(`\nDone. Embedded ${ok}, skipped ${skip}.`);
  console.log("Estimated cost: ~$0.001 (text-embedding-3-small).");
  console.log("MCP find_similar will automatically use embeddings on next call.");
  await prisma.$disconnect();
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        out[key] = next;
        i += 1;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
