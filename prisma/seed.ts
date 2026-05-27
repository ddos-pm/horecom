/**
 * Horecom — Seed Data (v2: 190 real SKUs from Tilda CSV export)
 *
 * Source: store-96425-202605201202.csv (Tilda export, May 20, 2026)
 * Photos: hosted on Tilda CDN — works as long as Tilda subscription active.
 *         Migrate to Cloudinary before Tilda subscription ends.
 *
 * Run: pnpm db:seed
 */

import {
  PrismaClient,
  StorageType,
  StockStatus,
  InventoryUpdateSource,
  NotificationKind,
  TemplateApprovalStatus,
} from "@prisma/client";
import productsData from "./products.json";

const prisma = new PrismaClient();

// ============================================================
// CATEGORIES & PRODUCTS — loaded from products.json
// ============================================================

interface CategoryDef {
  name: string;
  slug: string;
  nameKz: string;
  storage: string;
}

interface ProductDef {
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  categorySlug: string;
  imageUrl: string;
  storageType: string;
  unitType: string;
  packLabel: string;
  minOrderQty: number;
  basePrice: number;
  unitLabel: string;
  stock: number;
  isSubscriptionEligible: boolean;
  isGroupEligible: boolean;
  tildaUid: string;
}

const CATEGORIES = productsData.categories as CategoryDef[];
const PRODUCTS = productsData.products as ProductDef[];

// ============================================================
// WHATSAPP TEMPLATES (to be submitted to Meta for approval)
// ============================================================

const WA_TEMPLATES = [
  {
    name: "order_confirmed",
    kind: NotificationKind.ORDER_CONFIRMED,
    body: "Заказ {{1}} принят. Сумма: {{2}}. Доставка: {{3}}.",
    buttonsJson: [{ type: "url", text: "Посмотреть заказ", url: "/orders/{{1}}" }],
  },
  {
    name: "order_delivered",
    kind: NotificationKind.ORDER_DELIVERED,
    body: "Заказ {{1}} доставлен. Накладная в кабинете.",
    buttonsJson: [
      { type: "quick_reply", text: "Получил" },
      { type: "quick_reply", text: "Есть проблема" },
    ],
  },
  {
    name: "subscription_reminder",
    kind: NotificationKind.SUBSCRIPTION_REMINDER,
    body: "Завтра доставим {{1}}. Подтвердите или измените.",
    buttonsJson: [
      { type: "quick_reply", text: "Доставить" },
      { type: "quick_reply", text: "Изменить" },
      { type: "quick_reply", text: "Пропустить" },
    ],
  },
  {
    name: "substitution_review",
    kind: NotificationKind.SUBSTITUTION_REVIEW,
    body: "По заказу {{1}}: вместо {{2}} предлагаем {{3}}. Согласны?",
    buttonsJson: [
      { type: "quick_reply", text: "Согласен" },
      { type: "quick_reply", text: "Отказаться" },
    ],
  },
  {
    name: "group_threshold_reached",
    kind: NotificationKind.GROUP_THRESHOLD_REACHED,
    body: "Группа на {{1}} собрана! Цена: {{2}}. Оплата через Kaspi.",
    buttonsJson: [{ type: "url", text: "Оплатить", url: "/groups/{{1}}/pay" }],
  },
  {
    name: "group_failed",
    kind: NotificationKind.GROUP_FAILED,
    body: "Группа на {{1}} не собралась. Купить по обычной цене?",
    buttonsJson: [
      { type: "quick_reply", text: "Купить соло" },
      { type: "quick_reply", text: "Не сейчас" },
    ],
  },
];

// ============================================================
// SEED
// ============================================================

async function main() {
  console.log("🌱 Seeding Horecom (v2: 190 real SKUs from Tilda export)…");

  // Categories
  console.log(`→ Categories (${CATEGORIES.length})`);
  for (const [idx, cat] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, nameKz: cat.nameKz, sortOrder: idx },
      create: { name: cat.name, nameKz: cat.nameKz, slug: cat.slug, sortOrder: idx },
    });
  }

  // Products + Prices + InventorySnapshots
  console.log(`→ Products (${PRODUCTS.length})`);
  let done = 0;
  for (const p of PRODUCTS) {
    const category = await prisma.category.findUnique({ where: { slug: p.categorySlug } });
    if (!category) {
      console.warn(`⚠️  Skipping ${p.sku}: category ${p.categorySlug} not found`);
      continue;
    }

    const stockStatus: StockStatus =
      p.stock === 0 ? StockStatus.OUT_OF_STOCK : p.stock < 10 ? StockStatus.LOW_STOCK : StockStatus.IN_STOCK;

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        brand: p.brand,
        imageUrl: p.imageUrl,
        categoryId: category.id,
        storageType: p.storageType as StorageType,
        unitType: p.unitType,
        packLabel: p.packLabel,
        minOrderQty: p.minOrderQty,
        isSubscriptionEligible: p.isSubscriptionEligible,
        isGroupEligible: p.isGroupEligible,
      },
      create: {
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        description: p.description,
        brand: p.brand,
        imageUrl: p.imageUrl,
        categoryId: category.id,
        storageType: p.storageType as StorageType,
        unitType: p.unitType,
        packLabel: p.packLabel,
        minOrderQty: p.minOrderQty,
        isSubscriptionEligible: p.isSubscriptionEligible,
        isGroupEligible: p.isGroupEligible,
      },
    });

    // Replace price (delete old, create new)
    await prisma.price.deleteMany({ where: { productId: product.id } });
    await prisma.price.create({
      data: {
        productId: product.id,
        basePrice: p.basePrice,
        unitLabel: p.unitLabel,
      },
    });

    // Inventory snapshot
    await prisma.inventorySnapshot.upsert({
      where: { productId: product.id },
      update: {
        availableQty: p.stock,
        stockStatus,
        source: InventoryUpdateSource.MANUAL_ADMIN,
      },
      create: {
        productId: product.id,
        availableQty: p.stock,
        stockStatus,
        source: InventoryUpdateSource.MANUAL_ADMIN,
      },
    });

    done++;
    if (done % 50 === 0) console.log(`  …${done}/${PRODUCTS.length}`);
  }

  // WhatsApp templates (DRAFT state — to be submitted to Meta)
  console.log(`→ WhatsApp templates (${WA_TEMPLATES.length})`);
  for (const t of WA_TEMPLATES) {
    await prisma.whatsAppTemplate.upsert({
      where: { name: t.name },
      update: { body: t.body, kind: t.kind, buttonsJson: t.buttonsJson },
      create: {
        name: t.name,
        kind: t.kind,
        body: t.body,
        buttonsJson: t.buttonsJson,
        approvalStatus: TemplateApprovalStatus.DRAFT,
      },
    });
  }

  console.log("");
  console.log("✅ Seed complete");
  console.log(`   ${CATEGORIES.length} categories`);
  console.log(`   ${done} products with real photos from Tilda CDN`);
  console.log(`   ${WA_TEMPLATES.length} WhatsApp templates (DRAFT — submit to Meta)`);
  console.log("");
  console.log("ℹ️  Note: stock quantities are all 0 — operator to update via admin panel");
  console.log("ℹ️  Note: brands detected for 5/190 products — manual enrichment needed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
