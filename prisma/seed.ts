/**
 * Horecom — Seed Data
 * 
 * Categories: from existing Tilda site (horecom.kz)
 * Top SKUs: from Tilda views data (April 2025 – May 2026)
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

const prisma = new PrismaClient();

// ============================================================
// CATEGORIES (from current horecom.kz Tilda)
// ============================================================

const CATEGORIES = [
  { name: "Шоколад и глазури", nameKz: "Шоколад және глазурьдер", slug: "chocolate-glazes", sortOrder: 1 },
  { name: "Бакалея", nameKz: "Бакалея", slug: "bakery-staples", sortOrder: 2 },
  { name: "Молочная продукция", nameKz: "Сүт өнімдері", slug: "dairy", sortOrder: 3 },
  { name: "Наполнители и начинки", nameKz: "Толтырғыштар", slug: "fillings", sortOrder: 4 },
  { name: "Ингредиенты и сырьё", nameKz: "Ингредиенттер", slug: "ingredients", sortOrder: 5 },
  { name: "Посыпки", nameKz: "Себіндер", slug: "sprinkles", sortOrder: 6 },
  { name: "Красители пищевые", nameKz: "Тағамдық бояғыштар", slug: "food-colorings", sortOrder: 7 },
  { name: "Замороженная продукция", nameKz: "Мұздатылған өнімдер", slug: "frozen", sortOrder: 8 },
  { name: "Соусы и специи", nameKz: "Соустар және дәмдеуіштер", slug: "sauces-spices", sortOrder: 9 },
  { name: "Пергамент, фольга и плёнка", nameKz: "Пергамент және фольга", slug: "parchment-foil", sortOrder: 10 },
  { name: "Упаковка", nameKz: "Қаптама", slug: "packaging", sortOrder: 11 },
];

// ============================================================
// PRODUCTS (top viewed on Tilda + extras to fill catalog)
// ============================================================

const PRODUCTS = [
  // Top viewed (real Tilda data)
  {
    sku: "HC-DRAJ-001",
    name: "Драже зерновое в глазури 6-8 мм, 500 г",
    brand: "Корпус-Групп",
    categorySlug: "sprinkles",
    description: "Зерновое драже в шоколадной глазури для декора тортов и десертов. Размер 6-8 мм. Упаковка 500 г.",
    unitType: "piece",
    packLabel: "500 г",
    minOrderQty: 2,
    basePrice: 2400,
    unitLabel: "₸/упак",
    stock: 48,
    isSubscriptionEligible: true,
    isGroupEligible: true,
    storageType: StorageType.AMBIENT,
  },
  {
    sku: "HC-DRAJ-002",
    name: "Драже зерновое в цветной кондитерской глазури, 500 г",
    brand: "Корпус-Групп",
    categorySlug: "sprinkles",
    description: "Цветное драже для декора кондитерских изделий. Микс цветов. Упаковка 500 г.",
    unitType: "piece",
    packLabel: "500 г",
    minOrderQty: 2,
    basePrice: 2600,
    unitLabel: "₸/упак",
    stock: 32,
    isSubscriptionEligible: true,
    isGroupEligible: true,
    storageType: StorageType.AMBIENT,
  },
  {
    sku: "HC-MUKA-RJ-25",
    name: "Мука ржаная, 25 кг",
    brand: "Алтайская",
    categorySlug: "bakery-staples",
    description: "Мука ржаная хлебопекарная. Мешок 25 кг. Для производства ржаного и заварного хлеба.",
    unitType: "kg",
    packLabel: "25 кг",
    minOrderQty: 1,
    basePrice: 8500,
    wholesaleThreshold: 4,
    wholesalePrice: 7900,
    unitLabel: "₸/мешок",
    stock: 24,
    isSubscriptionEligible: true,
    isGroupEligible: true,
    storageType: StorageType.AMBIENT,
  },
  {
    sku: "HC-MUKA-GR-25",
    name: "Мука гречневая, 25 кг",
    brand: "Алтайская",
    categorySlug: "bakery-staples",
    description: "Мука гречневая. Мешок 25 кг. Для безглютеновой выпечки и блинов.",
    unitType: "kg",
    packLabel: "25 кг",
    minOrderQty: 1,
    basePrice: 14500,
    wholesaleThreshold: 4,
    wholesalePrice: 13800,
    unitLabel: "₸/мешок",
    stock: 12,
    isSubscriptionEligible: true,
    isGroupEligible: true,
    storageType: StorageType.AMBIENT,
  },
  {
    sku: "HC-SG-VOST-1",
    name: "Сгущёнка-варёнка Восточная, 1 кг",
    brand: "Восточная",
    categorySlug: "fillings",
    description: "Варёное сгущённое молоко. Упаковка 1 кг. Для начинок, кремов, эклеров.",
    unitType: "kg",
    packLabel: "1 кг",
    minOrderQty: 6,
    basePrice: 1850,
    wholesaleThreshold: 24,
    wholesalePrice: 1720,
    unitLabel: "₸/банка",
    stock: 96,
    isSubscriptionEligible: true,
    isGroupEligible: true,
    storageType: StorageType.AMBIENT,
  },
  {
    sku: "HC-FILO-340",
    name: "Тесто фило, 340 г",
    brand: "Antico",
    categorySlug: "frozen",
    description: "Тонкое слоёное тесто фило. Упаковка 340 г. Хранение замороженное.",
    unitType: "piece",
    packLabel: "340 г",
    minOrderQty: 6,
    basePrice: 1290,
    unitLabel: "₸/упак",
    stock: 8,
    isSubscriptionEligible: true,
    isGroupEligible: false,
    storageType: StorageType.FROZEN,
  },
  {
    sku: "HC-PUR-MANGO",
    name: "Пюре манго Andros, 1 кг",
    brand: "Andros",
    categorySlug: "fillings",
    description: "Фруктовое пюре манго без сахара. Упаковка 1 кг. Для муссов, прослоек, начинок.",
    unitType: "kg",
    packLabel: "1 кг",
    minOrderQty: 2,
    basePrice: 3800,
    wholesaleThreshold: 12,
    wholesalePrice: 3600,
    unitLabel: "₸/кг",
    stock: 18,
    isSubscriptionEligible: true,
    isGroupEligible: true,
    storageType: StorageType.REFRIGERATED,
  },
  {
    sku: "HC-CHE-KALE",
    name: "Сыр «Сир Кале» сливочный 74%, 500 г",
    brand: "Сир Кале",
    categorySlug: "dairy",
    description: "Сыр сливочный 74% жирности. Упаковка 500 г. Для крем-чиз кремов, чизкейков.",
    unitType: "kg",
    packLabel: "500 г",
    minOrderQty: 4,
    basePrice: 2750,
    wholesaleThreshold: 20,
    wholesalePrice: 2600,
    unitLabel: "₸/упак",
    stock: 36,
    isSubscriptionEligible: true,
    isGroupEligible: true,
    storageType: StorageType.REFRIGERATED,
  },
  // Additional realistic SKUs to fill catalog
  {
    sku: "HC-CHOC-BC-54",
    name: "Шоколад Barry Callebaut 54% тёмный, 2.5 кг",
    brand: "Barry Callebaut",
    categorySlug: "chocolate-glazes",
    description: "Тёмный шоколад в каплях, какао 54%. Профессиональная фасовка 2.5 кг.",
    unitType: "kg",
    packLabel: "2.5 кг",
    minOrderQty: 1,
    basePrice: 24500,
    wholesaleThreshold: 4,
    wholesalePrice: 23200,
    unitLabel: "₸/упак",
    stock: 14,
    isSubscriptionEligible: true,
    isGroupEligible: true,
    storageType: StorageType.AMBIENT,
  },
  {
    sku: "HC-CHOC-CL-MILK",
    name: "Шоколад Callebaut молочный 33.6%, 2.5 кг",
    brand: "Callebaut",
    categorySlug: "chocolate-glazes",
    description: "Молочный шоколад в каплях, какао 33.6%. Профессиональная фасовка 2.5 кг.",
    unitType: "kg",
    packLabel: "2.5 кг",
    minOrderQty: 1,
    basePrice: 22800,
    wholesaleThreshold: 4,
    wholesalePrice: 21500,
    unitLabel: "₸/упак",
    stock: 10,
    isSubscriptionEligible: true,
    isGroupEligible: true,
    storageType: StorageType.AMBIENT,
  },
  {
    sku: "HC-CR-LACT-35",
    name: "Сливки Lactel 35%, 1 л",
    brand: "Lactel",
    categorySlug: "dairy",
    description: "Сливки питьевые 35% жирности. УВТ-обработка. Упаковка 1 л.",
    unitType: "l",
    packLabel: "1 л",
    minOrderQty: 6,
    basePrice: 1450,
    unitLabel: "₸/л",
    stock: 72,
    isSubscriptionEligible: true,
    isGroupEligible: false,
    storageType: StorageType.AMBIENT,
  },
  {
    sku: "HC-MAS-FIL",
    name: "Мастика сахарная Saracino белая, 1 кг",
    brand: "Saracino",
    categorySlug: "ingredients",
    description: "Профессиональная сахарная мастика для покрытия тортов и моделирования. Белая.",
    unitType: "kg",
    packLabel: "1 кг",
    minOrderQty: 1,
    basePrice: 4900,
    unitLabel: "₸/кг",
    stock: 28,
    isSubscriptionEligible: false,
    isGroupEligible: true,
    storageType: StorageType.AMBIENT,
  },
  {
    sku: "HC-PARCH-50",
    name: "Пергамент в рулоне 50 м",
    brand: "Hozplast",
    categorySlug: "parchment-foil",
    description: "Силиконизированный пергамент. Ширина 38 см, длина 50 м.",
    unitType: "piece",
    packLabel: "1 рулон",
    minOrderQty: 2,
    basePrice: 1980,
    wholesaleThreshold: 12,
    wholesalePrice: 1850,
    unitLabel: "₸/рулон",
    stock: 65,
    isSubscriptionEligible: true,
    isGroupEligible: true,
    storageType: StorageType.AMBIENT,
  },
  {
    sku: "HC-DYE-AME-RED",
    name: "Краситель гелевый AmeriColor Red, 130 г",
    brand: "AmeriColor",
    categorySlug: "food-colorings",
    description: "Профессиональный гелевый краситель для крема, мастики, теста. Цвет: красный.",
    unitType: "piece",
    packLabel: "130 г",
    minOrderQty: 1,
    basePrice: 3200,
    unitLabel: "₸/шт",
    stock: 22,
    isSubscriptionEligible: false,
    isGroupEligible: true,
    storageType: StorageType.AMBIENT,
  },
  {
    sku: "HC-BOX-25",
    name: "Коробка для торта 25×25×15 см, белая",
    brand: "Pak-Pro",
    categorySlug: "packaging",
    description: "Коробка картонная для торта с прозрачным окошком. Белая. 25×25×15 см.",
    unitType: "piece",
    packLabel: "1 шт",
    minOrderQty: 10,
    basePrice: 580,
    wholesaleThreshold: 50,
    wholesalePrice: 530,
    unitLabel: "₸/шт",
    stock: 240,
    isSubscriptionEligible: true,
    isGroupEligible: true,
    storageType: StorageType.AMBIENT,
  },
];

// ============================================================
// WHATSAPP TEMPLATES (to be submitted to Meta)
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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[а-я]/g, (c) => {
      const map: Record<string, string> = {
        а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
        з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
        п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
        ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
      };
      return map[c] ?? c;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("🌱 Seeding Horecom database…");

  // Categories
  console.log("→ Categories");
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  // Products + Prices + InventorySnapshots
  console.log("→ Products");
  for (const p of PRODUCTS) {
    const category = await prisma.category.findUnique({ where: { slug: p.categorySlug } });
    if (!category) throw new Error(`Category ${p.categorySlug} not found`);

    const slug = slugify(p.name);
    const stockStatus: StockStatus =
      p.stock === 0 ? StockStatus.OUT_OF_STOCK : p.stock < 10 ? StockStatus.LOW_STOCK : StockStatus.IN_STOCK;

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        slug,
        description: p.description,
        brand: p.brand,
        categoryId: category.id,
        storageType: p.storageType,
        unitType: p.unitType,
        packLabel: p.packLabel,
        minOrderQty: p.minOrderQty,
        isSubscriptionEligible: p.isSubscriptionEligible,
        isGroupEligible: p.isGroupEligible,
      },
      create: {
        sku: p.sku,
        name: p.name,
        slug,
        description: p.description,
        brand: p.brand,
        categoryId: category.id,
        storageType: p.storageType,
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
        wholesaleThreshold: p.wholesaleThreshold,
        wholesalePrice: p.wholesalePrice,
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
  }

  // WhatsApp templates (DRAFT state — to be submitted to Meta)
  console.log("→ WhatsApp templates");
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

  console.log("✅ Seed complete");
  console.log(`   ${CATEGORIES.length} categories`);
  console.log(`   ${PRODUCTS.length} products`);
  console.log(`   ${WA_TEMPLATES.length} WhatsApp templates (DRAFT)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
