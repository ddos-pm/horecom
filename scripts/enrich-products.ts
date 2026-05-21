/**
 * scripts/enrich-products.ts
 *
 * Uses Claude (Anthropic API) to enrich Horecom products with:
 *   - brandResolved       — canonical brand pulled from the product name when missing
 *   - descriptionExtended — 2–3 sentences description aimed at HoReCa B2B audience
 *   - useCases            — "Когда использовать" — concrete kitchen scenarios
 *   - composition         — best-guess composition (only if obvious from name)
 *   - storageInfo         — typical storage conditions for this product class
 *
 * Output is conservative: model is told to skip fields it can't be sure about
 * rather than hallucinate. ~$0.003 per product with Claude Sonnet (cheap input,
 * short JSON output).
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/enrich-products.ts            # all unenriched products
 *   npx tsx scripts/enrich-products.ts --sku HC-DAIRY-0067 --dry              # single SKU, no DB write
 *   npx tsx scripts/enrich-products.ts --limit 5                              # process up to 5
 *   npx tsx scripts/enrich-products.ts --force                                # also re-enrich already-enriched
 */

import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = parseArgs(process.argv.slice(2));
const isDry = !!args.dry;
const force = !!args.force;
const limit = args.limit ? Number(args.limit) : undefined;
const singleSku = args.sku as string | undefined;

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY is required. Add it to .env.local.");
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey });
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

type EnrichmentInput = {
  sku: string;
  name: string;
  brand: string | null;
  category: string;
  packLabel: string;
  description: string | null;
};

type EnrichmentOutput = {
  brandResolved: string | null;
  descriptionExtended: string | null;
  useCases: string | null;
  composition: string | null;
  storageInfo: string | null;
};

const SYSTEM_PROMPT = `Ты — операционный директор по закупкам HoReCa (рестораны, кафе, кондитерские) в Казахстане.
Твоя задача — обогащать карточки оптовых ингредиентов точной, полезной информацией для шеф-кондитера или бариста.
Пиши на русском, кратко, без маркетинговой воды.
Если не уверен в факте — возвращай null для этого поля, не выдумывай.
Цена, состав конкретного производителя, точные ГОСТы — null если их не видно из исходных данных.`;

const USER_TEMPLATE = (p: EnrichmentInput) => `Исходные данные товара:
- Название: ${p.name}
- Бренд: ${p.brand ?? "(не указан в БД)"}
- Категория: ${p.category}
- Фасовка: ${p.packLabel}
- Текущее описание: ${p.description ?? "(нет)"}

Верни JSON со схемой:
{
  "brandResolved": "<бренд из названия если в БД пусто, или null>",
  "descriptionExtended": "<2-3 предложения для B2B покупателя: что это и где применимо>",
  "useCases": "<3-5 коротких сценариев применения через запятую: 'для крем-чиза, для начинок, для глазури'>",
  "composition": "<только если очевидно из названия, иначе null>",
  "storageInfo": "<типичные условия хранения для класса продукта>"
}

Только JSON. Без пояснений вокруг. Если поле неизвестно — null (не пустая строка).`;

async function enrichOne(p: EnrichmentInput): Promise<EnrichmentOutput | null> {
  try {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: USER_TEMPLATE(p) }],
    });
    const text = resp.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    // Strip code-fence if model wrapped JSON in ```json
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as EnrichmentOutput;
    return {
      brandResolved: parsed.brandResolved?.trim() || null,
      descriptionExtended: parsed.descriptionExtended?.trim() || null,
      useCases: parsed.useCases?.trim() || null,
      composition: parsed.composition?.trim() || null,
      storageInfo: parsed.storageInfo?.trim() || null,
    };
  } catch (err) {
    console.error(`  ✗ ${p.sku}: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

async function main() {
  const where = singleSku
    ? { sku: singleSku }
    : force
      ? { isActive: true }
      : { isActive: true, enrichedAt: null };

  const products = await prisma.product.findMany({
    where,
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
    ...(limit ? { take: limit } : {}),
  });

  console.log(
    `Found ${products.length} product(s) to enrich (model=${MODEL}, dry=${isDry}, force=${force})`,
  );

  let ok = 0;
  let skip = 0;
  for (const p of products) {
    process.stdout.write(`→ ${p.sku.padEnd(18)} ${p.name.slice(0, 60).padEnd(62)} `);
    const out = await enrichOne({
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      category: p.category.name,
      packLabel: p.packLabel,
      description: p.description,
    });
    if (!out) {
      skip += 1;
      continue;
    }
    if (isDry) {
      console.log("(dry)");
      console.log(JSON.stringify(out, null, 2));
      ok += 1;
      continue;
    }
    await prisma.product.update({
      where: { id: p.id },
      data: {
        brandResolved: out.brandResolved,
        descriptionExtended: out.descriptionExtended,
        useCases: out.useCases,
        composition: out.composition,
        storageInfo: out.storageInfo,
        enrichedAt: new Date(),
        ...(out.brandResolved && !p.brand ? { brand: out.brandResolved } : {}),
      },
    });
    console.log("✓");
    ok += 1;
  }

  console.log(`\nDone. Enriched ${ok}, skipped ${skip} (errors).`);
  console.log(
    `Approximate cost: ~$${(ok * 0.003).toFixed(2)} (Claude Sonnet, ~$3/1M input tokens, ~$15/1M output tokens).`,
  );
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
