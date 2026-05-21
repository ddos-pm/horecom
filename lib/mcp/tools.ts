import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/company";

/* ──────────────────────────────────────────────────────────────────────────
 * Horecom MCP — tool registry
 * Read-only catalog tools are safe for open access. create_draft_order
 * persists a DRAFT_PENDING_CONFIRMATION order that the customer must confirm
 * via WhatsApp before fulfillment begins (no autonomous purchases).
 * ────────────────────────────────────────────────────────────────────────── */

const WHATSAPP_PHONE = "77078607779";

// Public site URL used inside MCP responses (product_url, confirmation_url).
// Prefers NEXT_PUBLIC_BASE_URL env (set per-deploy), falls back to the
// stable Vercel alias, then to the future canonical domain.
const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
  "https://horecom-platform-eosin.vercel.app";

function productUrl(slug: string) {
  return `${PUBLIC_BASE_URL}/ru/product/${slug}`;
}

// ────────────────────────────────────────────────────────────────────
// Schemas

export const searchProductsSchema = z.object({
  query: z.string().min(1).max(200),
  category: z.string().optional(),
  brand: z.string().optional(),
  in_stock_only: z.boolean().default(false),
  max_results: z.number().int().min(1).max(50).default(10),
});

export const getProductSchema = z.object({
  slug: z.string().min(1).max(200),
});

export const checkInventorySchema = z.object({
  sku: z.string().min(1).max(60),
  quantity: z.number().int().positive(),
});

export const getVolumePricingSchema = z.object({
  sku: z.string().min(1).max(60),
});

export const findSimilarSchema = z.object({
  sku: z.string().min(1).max(60),
  max_results: z.number().int().min(1).max(20).default(3),
  prefer_in_stock: z.boolean().default(true),
});

export const createDraftOrderSchema = z.object({
  items: z
    .array(
      z.object({
        sku: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(50),
  delivery_address: z.string().min(2).max(500),
  delivery_date: z.string().optional(),
  notes: z.string().max(500).optional(),
  customer_phone: z.string().min(5).max(40),
  customer_name: z.string().min(1).max(120),
});

// ────────────────────────────────────────────────────────────────────
// Helpers

function productToCard(p: {
  sku: string;
  slug: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  packLabel: string;
  unitType: string;
  minOrderQty: number;
  category: { name: string };
  prices: { basePrice: { toString: () => string }; unitLabel: string }[];
  inventorySnapshot: { availableQty: number; stockStatus: string } | null;
}) {
  const price = p.prices[0];
  const basePrice = price ? Number(price.basePrice.toString()) : 0;
  const stock = p.inventorySnapshot;
  return {
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category.name,
    pack_label: p.packLabel,
    price_per_pack: basePrice,
    price_per_unit: price?.unitLabel ?? `за ${p.packLabel}`,
    in_stock: (stock?.availableQty ?? 0) > 0,
    available_quantity: stock?.availableQty ?? 0,
    moq: p.minOrderQty,
    image_url: p.imageUrl ?? null,
    product_url: productUrl(p.slug),
  };
}

// ────────────────────────────────────────────────────────────────────
// Tool handlers

export async function searchProducts(input: z.infer<typeof searchProductsSchema>) {
  const q = input.query.trim();
  const where = {
    isActive: true,
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { brand: { contains: q, mode: "insensitive" as const } },
              { sku: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
      input.category ? { category: { slug: input.category } } : {},
      input.brand ? { brand: { equals: input.brand, mode: "insensitive" as const } } : {},
      input.in_stock_only ? { inventorySnapshot: { availableQty: { gt: 0 } } } : {},
    ],
  };

  const [total_count, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      take: input.max_results,
      orderBy: { name: "asc" },
      include: {
        category: { select: { name: true } },
        prices: { take: 1, orderBy: { createdAt: "desc" } },
        inventorySnapshot: true,
      },
    }),
  ]);

  return { total_count, products: products.map(productToCard) };
}

export async function getProduct(input: z.infer<typeof getProductSchema>) {
  const p = await prisma.product.findUnique({
    where: { slug: input.slug },
    include: {
      category: true,
      prices: { orderBy: { createdAt: "desc" } },
      inventorySnapshot: true,
    },
  });
  if (!p) return null;

  const base = p.prices[0];
  return {
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category.name,
    description: p.description ?? "",
    pack_label: p.packLabel,
    storage: p.storageType,
    pricing: {
      base_price: base ? Number(base.basePrice.toString()) : 0,
      volume_tiers: p.prices
        .filter((pr) => pr.wholesaleThreshold && pr.wholesalePrice)
        .map((pr) => {
          const baseN = Number(pr.basePrice.toString());
          const wholesale = Number(pr.wholesalePrice!.toString());
          return {
            min_quantity: pr.wholesaleThreshold!,
            price_per_pack: wholesale,
            discount_percent: baseN > 0 ? Math.round(((baseN - wholesale) / baseN) * 1000) / 10 : 0,
          };
        }),
    },
    inventory: {
      in_stock: (p.inventorySnapshot?.availableQty ?? 0) > 0,
      available_quantity: p.inventorySnapshot?.availableQty ?? 0,
      unit: p.unitType,
      last_updated: p.inventorySnapshot?.updatedAt.toISOString() ?? null,
    },
    images: p.imageUrl ? [p.imageUrl, ...p.imageUrls] : p.imageUrls,
    product_url: productUrl(p.slug),
  };
}

export async function checkInventory(input: z.infer<typeof checkInventorySchema>) {
  const p = await prisma.product.findUnique({
    where: { sku: input.sku },
    include: { inventorySnapshot: true, category: true },
  });
  if (!p) {
    return {
      sku: input.sku,
      requested_quantity: input.quantity,
      available_quantity: 0,
      can_fulfill: false,
      error: "SKU not found",
    };
  }
  const available = p.inventorySnapshot?.availableQty ?? 0;
  const canFulfill = available >= input.quantity;
  const result: Record<string, unknown> = {
    sku: p.sku,
    requested_quantity: input.quantity,
    available_quantity: available,
    can_fulfill: canFulfill,
  };
  if (!canFulfill) {
    const alternatives = await prisma.product.findMany({
      where: {
        categoryId: p.categoryId,
        id: { not: p.id },
        isActive: true,
        inventorySnapshot: { availableQty: { gte: input.quantity } },
      },
      take: 3,
      orderBy: { name: "asc" },
      select: { sku: true, name: true, slug: true },
    });
    result.alternatives = alternatives.map((a) => ({
      sku: a.sku,
      name: a.name,
      product_url: productUrl(a.slug),
      similarity_score: 0.7,
    }));
  }
  return result;
}

export async function getVolumePricing(input: z.infer<typeof getVolumePricingSchema>) {
  const p = await prisma.product.findUnique({
    where: { sku: input.sku },
    include: { prices: { orderBy: { createdAt: "desc" } } },
  });
  if (!p) return null;
  const base = p.prices[0];
  if (!base) return { sku: p.sku, base_price: 0, tiers: [], recommendation: null };
  const baseN = Number(base.basePrice.toString());

  const tiers = p.prices
    .filter((pr) => pr.wholesaleThreshold && pr.wholesalePrice)
    .map((pr) => {
      const wholesale = Number(pr.wholesalePrice!.toString());
      const discount = baseN > 0 ? ((baseN - wholesale) / baseN) * 100 : 0;
      return {
        min_quantity: pr.wholesaleThreshold!,
        max_quantity: null as number | null,
        price_per_pack: wholesale,
        discount_from_base_percent: Math.round(discount * 10) / 10,
      };
    });

  const bestTier = tiers[0];
  const recommendation = bestTier
    ? `Order ${bestTier.min_quantity}+ packs to save ${bestTier.discount_from_base_percent}% per pack.`
    : "No volume discounts available for this SKU.";

  return {
    sku: p.sku,
    base_price: baseN,
    tiers,
    recommendation,
  };
}

export async function findSimilar(input: z.infer<typeof findSimilarSchema>) {
  const source = await prisma.product.findUnique({
    where: { sku: input.sku },
    include: {
      category: { select: { id: true, name: true } },
      prices: { take: 1, orderBy: { createdAt: "desc" } },
    },
  });
  if (!source) return null;
  const basePrice = source.prices[0] ? Number(source.prices[0].basePrice.toString()) : 0;

  // Try pgvector cosine ranking first. Falls back to the V0 heuristic if
  // embeddings aren't generated yet, source has no embedding, or pgvector
  // extension isn't enabled (raw query throws → caught below).
  type VectorRow = {
    sku: string;
    name: string;
    brand: string | null;
    slug: string;
    similarity: number;
    in_stock: boolean;
    price_per_pack: number | null;
  };
  let vectorMatches: VectorRow[] = [];
  try {
    const inStockFilter = input.prefer_in_stock ? "AND COALESCE(i.\"availableQty\", 0) > 0" : "";
    const rows = await prisma.$queryRawUnsafe<VectorRow[]>(
      `
      WITH src AS (
        SELECT "embedding" FROM "Product" WHERE id = $1 AND "embedding" IS NOT NULL
      )
      SELECT
        p.sku,
        p.name,
        p.brand,
        p.slug,
        (1 - (p."embedding" <=> (SELECT "embedding" FROM src)))::float AS similarity,
        COALESCE(i."availableQty", 0) > 0 AS in_stock,
        (SELECT pr."basePrice"::float FROM "Price" pr WHERE pr."productId" = p.id ORDER BY pr."createdAt" DESC LIMIT 1) AS price_per_pack
      FROM "Product" p
      LEFT JOIN "InventorySnapshot" i ON i."productId" = p.id
      WHERE p.id != $1
        AND p."isActive" = true
        AND p."embedding" IS NOT NULL
        AND EXISTS (SELECT 1 FROM src)
        ${inStockFilter}
      ORDER BY p."embedding" <=> (SELECT "embedding" FROM src)
      LIMIT $2
      `,
      source.id,
      input.max_results,
    );
    vectorMatches = rows;
  } catch {
    vectorMatches = [];
  }

  if (vectorMatches.length > 0) {
    return {
      source_product: { sku: source.sku, name: source.name, brand: source.brand },
      similar_products: vectorMatches.map((r) => {
        const priceDiff =
          basePrice > 0 && r.price_per_pack ? ((r.price_per_pack - basePrice) / basePrice) * 100 : 0;
        return {
          sku: r.sku,
          name: r.name,
          brand: r.brand,
          similarity_score: Math.round(r.similarity * 100) / 100,
          similarity_reason: `Semantic embedding match (cosine ${r.similarity.toFixed(2)})`,
          in_stock: r.in_stock,
          price_per_pack: r.price_per_pack ?? 0,
          price_difference_percent: Math.round(priceDiff * 10) / 10,
          product_url: productUrl(r.slug),
        };
      }),
    };
  }

  // Fallback heuristic
  const candidates = await prisma.product.findMany({
    where: {
      categoryId: source.categoryId,
      id: { not: source.id },
      isActive: true,
      ...(input.prefer_in_stock ? { inventorySnapshot: { availableQty: { gt: 0 } } } : {}),
    },
    take: Math.max(input.max_results * 3, 10),
    include: {
      prices: { take: 1, orderBy: { createdAt: "desc" } },
      inventorySnapshot: true,
    },
  });

  const ranked = candidates
    .map((c) => {
      const cPrice = c.prices[0] ? Number(c.prices[0].basePrice.toString()) : 0;
      const priceDiff = basePrice > 0 ? ((cPrice - basePrice) / basePrice) * 100 : 0;
      // Similarity heuristic: same category (+0.5), same brand (+0.2), close price (+0.1..0.3)
      let score = 0.5;
      if (c.brand && source.brand && c.brand === source.brand) score += 0.2;
      const priceProximity = Math.max(0, 0.3 - Math.abs(priceDiff) / 100);
      score += priceProximity;
      return { product: c, cPrice, priceDiff, score: Math.min(score, 1) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, input.max_results);

  return {
    source_product: { sku: source.sku, name: source.name, brand: source.brand },
    similar_products: ranked.map((r) => ({
      sku: r.product.sku,
      name: r.product.name,
      brand: r.product.brand,
      similarity_score: Math.round(r.score * 100) / 100,
      similarity_reason: `Same category (${source.category.name})${r.product.brand === source.brand && r.product.brand ? `, same brand` : ""}${Math.abs(r.priceDiff) < 10 ? `, close price` : `, ${r.priceDiff > 0 ? "+" : ""}${Math.round(r.priceDiff)}% price`}`,
      in_stock: (r.product.inventorySnapshot?.availableQty ?? 0) > 0,
      price_per_pack: r.cPrice,
      price_difference_percent: Math.round(r.priceDiff * 10) / 10,
      product_url: productUrl(r.product.slug),
    })),
  };
}

export async function createDraftOrder(
  input: z.infer<typeof createDraftOrderSchema>,
  context: { agentName?: string; agentIp?: string },
) {
  const skuList = input.items.map((i) => i.sku);
  const products = await prisma.product.findMany({
    where: { sku: { in: skuList }, isActive: true },
    include: { prices: { take: 1, orderBy: { createdAt: "desc" } } },
  });

  const itemsDetailed = input.items.map((item) => {
    const p = products.find((x) => x.sku === item.sku);
    if (!p) throw new Error(`SKU not found: ${item.sku}`);
    const price = p.prices[0] ? Number(p.prices[0].basePrice.toString()) : 0;
    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      quantity: item.quantity,
      price_per_pack: price,
      line_total: price * item.quantity,
      unitLabel: p.prices[0]?.unitLabel ?? p.packLabel,
    };
  });

  const subtotal = itemsDetailed.reduce((s, i) => s + i.line_total, 0);
  const deliveryCost = subtotal >= 30000 ? 0 : 1000;
  const total = subtotal + deliveryCost;
  const number = `HC-${Date.now().toString().slice(-8)}`;

  // No Company linked yet (MCP open access). The draft sits in DB until the
  // customer follows the WhatsApp link and reconciles with a manager.
  // We need a Company stub for FK; create or find a synthetic "MCP guest" company.
  const guest = await prisma.company.upsert({
    where: { id: "mcp-guest-company" },
    create: {
      id: "mcp-guest-company",
      name: "MCP Guest Orders",
      segment: "ENTERPRISE",
      city: "Astana",
    },
    update: {},
  });

  const address = await prisma.address.upsert({
    where: { id: "mcp-guest-address" },
    create: {
      id: "mcp-guest-address",
      companyId: guest.id,
      label: "MCP guest placeholder",
      street: "(to be confirmed via WhatsApp)",
      house: "—",
      isDefault: true,
    },
    update: {},
  });

  const order = await prisma.order.create({
    data: {
      number,
      companyId: guest.id,
      addressId: address.id,
      status: "DRAFT_PENDING_CONFIRMATION",
      paymentStatus: "PENDING",
      fulfillmentStatus: "PENDING",
      deliveryWindow: {
        date: input.delivery_date ?? null,
        slot: null,
        deliveryFee: deliveryCost,
      },
      subtotal,
      total,
      substitutionPreference: "ASK",
      comment: [
        `MCP draft from agent: ${context.agentName ?? "unknown"}`,
        `Customer: ${input.customer_name} · ${input.customer_phone}`,
        `Delivery address: ${input.delivery_address}`,
        input.notes ? `Notes: ${input.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      source: "MCP_AGENT",
      agentMetadata: {
        agentName: context.agentName ?? null,
        agentIp: context.agentIp ?? null,
        createdVia: "mcp",
        customer: {
          name: input.customer_name,
          phone: input.customer_phone,
        },
      },
      items: {
        create: itemsDetailed.map((i) => ({
          productId: i.productId,
          productNameSnapshot: i.name,
          unitLabelSnapshot: i.unitLabel,
          quantity: i.quantity,
          unitPrice: i.price_per_pack,
          lineTotal: i.line_total,
        })),
      },
    },
  });

  const confirmationUrl = `${PUBLIC_BASE_URL}/ru/orders/${order.id}?just_created=true`;
  const waText = `Здравствуйте! Я хочу подтвердить заказ ${number} (создан через AI-агент). Состав: ${itemsDetailed
    .map((i) => `${i.name} × ${i.quantity}`)
    .join(", ")}. Итого: ${total.toLocaleString("ru-RU")} ₸. Адрес: ${input.delivery_address}. Связь: ${input.customer_name}, ${input.customer_phone}.`;
  const whatsappLink = `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(waText)}`;

  return {
    draft_order_id: order.id,
    draft_order_number: order.number,
    status: "DRAFT_PENDING_CONFIRMATION",
    items: itemsDetailed.map((i) => ({
      sku: i.sku,
      name: i.name,
      quantity: i.quantity,
      price_per_pack: i.price_per_pack,
      line_total: i.line_total,
    })),
    subtotal,
    estimated_delivery_cost: deliveryCost,
    estimated_total: total,
    confirmation_url: confirmationUrl,
    whatsapp_link: whatsappLink,
    message_to_customer: `Заказ ${number} создан как DRAFT. Откройте ссылку и подтвердите по WhatsApp: ${whatsappLink}`,
    notes_for_agent: `This is a DRAFT order. The customer (${input.customer_name}, ${input.customer_phone}) must confirm via WhatsApp before fulfillment begins. Manager (${COMPANY.shortName}) will respond within 1 hour.`,
  };
}

// ────────────────────────────────────────────────────────────────────
// Registry

export type ToolName =
  | "search_products"
  | "get_product"
  | "check_inventory"
  | "get_volume_pricing"
  | "find_similar"
  | "create_draft_order";

export type ToolContext = { agentName?: string; agentIp?: string };

type ToolEntry = {
  description: string;
  schema: z.ZodTypeAny;
  handler: (input: unknown, ctx: ToolContext) => Promise<unknown>;
};

export const TOOL_REGISTRY: Record<ToolName, ToolEntry> = {
  search_products: {
    description: "Full-text search of the Horecom catalog (190 SKU). Filter by category slug, brand, and stock availability.",
    schema: searchProductsSchema,
    handler: async (input) => searchProducts(searchProductsSchema.parse(input)),
  },
  get_product: {
    description: "Detailed product info by slug — pricing tiers, inventory, descriptions.",
    schema: getProductSchema,
    handler: async (input) => getProduct(getProductSchema.parse(input)),
  },
  check_inventory: {
    description: "Check available quantity for a SKU and suggest alternatives if not in stock.",
    schema: checkInventorySchema,
    handler: async (input) => checkInventory(checkInventorySchema.parse(input)),
  },
  get_volume_pricing: {
    description: "Volume tier pricing for a SKU — discounts available at higher quantities.",
    schema: getVolumePricingSchema,
    handler: async (input) => getVolumePricing(getVolumePricingSchema.parse(input)),
  },
  find_similar: {
    description: "Find similar products as substitutes when desired item is out of stock or for browsing alternatives. V0 uses category + brand + price heuristics (will switch to pgvector embeddings when configured).",
    schema: findSimilarSchema,
    handler: async (input) => findSimilar(findSimilarSchema.parse(input)),
  },
  create_draft_order: {
    description: "Create a DRAFT order that the customer must confirm via WhatsApp before fulfillment begins. Always inform the user the order is a draft and provide the WhatsApp confirmation link.",
    schema: createDraftOrderSchema,
    handler: async (input, ctx) => createDraftOrder(createDraftOrderSchema.parse(input), ctx),
  },
};

export const TOOL_NAMES = Object.keys(TOOL_REGISTRY) as ToolName[];
