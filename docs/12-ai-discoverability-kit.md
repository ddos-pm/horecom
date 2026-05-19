# Horecom — AI Discoverability Kit
### Готовые файлы для деплоя на horecom.kz | Май 2026

Этот kit можно деплоить на текущий MVP (Tilda или новая версия) **сегодня** — не требует завершения тех. редизайна. Улучшает и обычный SEO, и AI-видимость (ChatGPT, Perplexity, Claude search).

> Структура из Пакета 2 (два workstream'а: UCP и discoverability разделены). Содержание из Пакета 1.

---

## 1. `/llms.txt` — публикуется в корне сайта

```markdown
# Horecom

> B2B procurement platform for HoReCa businesses in Kazakhstan. Wholesale supplier of food ingredients and confectionery raw materials, headquartered in Astana. Three modes of value on a single catalog: fast wholesale ordering, guided replenishment via subscription, and pooled group buying for small businesses.

## About

- **Company name:** Horecom
- **Location:** Astana, Kazakhstan (physical store: ул. Шамши Калдаякова 1)
- **Founded:** 2016
- **Languages:** Russian (primary), Kazakh
- **Website:** https://horecom.kz
- **Instagram:** @horecom.kz

## Who we serve

Horecom serves three customer segments:

1. **Large HoReCa businesses** (cafes, restaurants, hotels) — fast wholesale ordering with reorder shortcuts, multi-location support, and order analytics.
2. **Small bakeries and pastry shops** — predictive subscription delivery to prevent stock-outs of critical ingredients (chocolate, flour, dairy, decor).
3. **Self-employed home bakers** — group buying to access wholesale prices without holding wholesale inventory individually.

## Product catalog categories

- Chocolate and glazes (Barry Callebaut, Callebaut, Sicao, IRCA)
- Flour and grains (premium baker's flour, almond flour, semolina)
- Dairy products (cream, butter, condensed milk, mascarpone)
- Nuts and dried fruits (almonds, hazelnuts, pistachios, candied peel)
- Food colorings and flavorings
- Packaging (boxes, ribbons, parchment)
- Decor (mastic, sprinkles, edible images)

## How ordering works

1. Browse catalog with search, filters, and unit pricing (per kg, per liter, per piece)
2. Add items to cart with quantity (minimum order: 5,000 ₸)
3. Choose delivery slot (same day or next day in Astana)
4. Pay via Kaspi Pay or bank transfer
5. Receive WhatsApp confirmation with order tracking

## Subscription delivery

For small bakeries with recurring needs: configure a subscription plan with cadence (weekly, twice-weekly, biweekly), delivery days, and SKU list. Receive proactive WhatsApp reminders before each delivery with options to confirm, edit quantities, or skip. Cancel or pause anytime.

## Group buying

For home bakers and small studios: join open groups buying specific SKUs at wholesale prices. When the volume threshold is reached, the wholesale price activates. If a group does not reach the threshold by the deadline, no charge is made and members can choose to buy at the standard price or wait for the next window.

## Delivery and payment

- **Delivery area:** Astana city (expanding to Almaty in 2026)
- **Delivery time:** Same day (orders before 14:00) or next-day morning
- **Payment methods:** Kaspi Pay, bank transfer for legal entities
- **Documents:** Invoice and consignment note provided automatically
- **Minimum order:** 5,000 ₸

## Substitution policy

Horecom does not silently substitute products. If an SKU is unavailable, the customer is notified via WhatsApp with a proposed equivalent and given the choice to approve, reject, or wait. Pre-approval rules can be configured in the company profile.

## Key pages

- [Catalog](https://horecom.kz/catalog)
- [How ordering works](https://horecom.kz/how-ordering-works)
- [Subscription](https://horecom.kz/subscription)
- [Group buying](https://horecom.kz/group-buying)
- [Delivery and payment](https://horecom.kz/delivery-and-payment)
- [FAQ](https://horecom.kz/faq)
- [About](https://horecom.kz/about)
- [Full catalog dump (machine-readable)](https://horecom.kz/llms-full.txt)

## Contact

- WhatsApp: +7 ХХХ ХХХ ХХ ХХ
- Instagram: @horecom.kz
- Email: info@horecom.kz
```

---

## 2. `/llms-full.txt` — расширенная версия

Структура такая же, но добавить:
- Полный SKU-перечень основных категорий (top-200) с brand, unit, indicative price range
- Подробные политики (returns, complaints, partial fulfillment)
- Operational details (склад adress, packaging policy)
- Все статьи блога (когда появятся)

Генерировать программно из БД при каждом deploy:

```typescript
// app/llms-full.txt/route.ts
import { prisma } from '@/lib/prisma';

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true, prices: { take: 1 } },
    orderBy: { name: 'asc' },
  });
  
  const content = `# Horecom — Full Machine-Readable Overview

[... короткое intro как в /llms.txt ...]

## Full product catalog

${products.map(p => `
### ${p.name}
- SKU: ${p.sku}
- Brand: ${p.brand ?? 'N/A'}
- Category: ${p.category.name}
- Pack: ${p.packLabel}
- Unit: ${p.unitType}
- Price (indicative): ${p.prices[0]?.basePrice ?? 'on request'} ${p.prices[0]?.currency ?? 'KZT'}/${p.unitType}
- Subscription eligible: ${p.isSubscriptionEligible ? 'yes' : 'no'}
- Group buying eligible: ${p.isGroupEligible ? 'yes' : 'no'}
`).join('\n')}
`;
  
  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

---

## 3. `/robots.txt`

```
# Horecom — robots.txt
# AI crawlers explicitly allowed for product discoverability

User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /auth
Disallow: /profile
Disallow: /cart
Disallow: /checkout

# Major search engines
User-agent: Googlebot
Allow: /
Disallow: /admin
Disallow: /api

User-agent: Bingbot
Allow: /
Disallow: /admin
Disallow: /api

# AI crawlers — explicitly allowed
User-agent: GPTBot
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /profile

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /profile

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: YandexBot
Allow: /

Sitemap: https://horecom.kz/sitemap.xml
```

---

## 4. JSON-LD шаблоны (вставляются в `<head>` через `next/script`)

### 4.1 Organization (в layout.tsx, на всех страницах)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://horecom.kz/#organization",
  "name": "Horecom",
  "alternateName": "Хореком",
  "url": "https://horecom.kz",
  "logo": "https://horecom.kz/logo.png",
  "description": "B2B procurement platform for HoReCa businesses in Kazakhstan. Wholesale food ingredients and confectionery raw materials.",
  "foundingDate": "2016",
  "founder": {
    "@type": "Person",
    "name": "co-founder"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "ул. Шамши Калдаякова, 1",
    "addressLocality": "Астана",
    "addressCountry": "KZ"
  },
  "sameAs": [
    "https://www.instagram.com/horecom.kz",
    "https://www.threads.com/@horecom.kz"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": ["Russian", "Kazakh"]
  }
}
</script>
```

### 4.2 WebSite + SearchAction (layout.tsx)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://horecom.kz/#website",
  "url": "https://horecom.kz",
  "name": "Horecom",
  "publisher": { "@id": "https://horecom.kz/#organization" },
  "inLanguage": "ru-KZ",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://horecom.kz/catalog?search={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
</script>
```

### 4.3 Product + Offer (PDP — `/product/[slug]`)

```typescript
// generateProductJsonLd.ts
export function generateProductJsonLd(product: ProductWithPrice) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `https://horecom.kz/product/${product.slug}#product`,
    "name": product.name,
    "description": product.description,
    "sku": product.sku,
    "brand": product.brand ? { "@type": "Brand", "name": product.brand } : undefined,
    "image": product.imageUrls.length > 0 ? product.imageUrls : product.imageUrl,
    "category": product.category.name,
    "offers": {
      "@type": "Offer",
      "url": `https://horecom.kz/product/${product.slug}`,
      "priceCurrency": "KZT",
      "price": product.prices[0]?.basePrice.toString(),
      "priceValidUntil": product.prices[0]?.validUntil?.toISOString(),
      "availability": stockStatusToSchema(product.inventorySnapshot?.stockStatus),
      "seller": { "@id": "https://horecom.kz/#organization" },
      "eligibleQuantity": {
        "@type": "QuantitativeValue",
        "minValue": product.minOrderQty,
        "unitText": product.unitType
      }
    }
  };
}

function stockStatusToSchema(s?: StockStatus) {
  if (s === 'IN_STOCK') return 'https://schema.org/InStock';
  if (s === 'LOW_STOCK') return 'https://schema.org/LimitedAvailability';
  return 'https://schema.org/OutOfStock';
}
```

### 4.4 BreadcrumbList (на каждой странице с навигацией)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://horecom.kz" },
    { "@type": "ListItem", "position": 2, "name": "Каталог", "item": "https://horecom.kz/catalog" },
    { "@type": "ListItem", "position": 3, "name": "Шоколад", "item": "https://horecom.kz/catalog/chocolate" },
    { "@type": "ListItem", "position": 4, "name": "Шоколад Barry Callebaut 54%" }
  ]
}
</script>
```

### 4.5 FAQPage (на `/faq`)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Какой минимальный заказ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Минимальная сумма заказа в Horecom — 5 000 ₸. Доставка по Астане."
      }
    },
    {
      "@type": "Question",
      "name": "Как работает подписка?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Вы настраиваете план: товары, частоту (еженедельно, 2 раза в неделю или раз в 2 недели), дни и время доставки. За день до каждой доставки приходит WhatsApp-уведомление, где можно подтвердить, изменить количество или пропустить эту доставку. Отменить или поставить на паузу можно в любой момент."
      }
    },
    {
      "@type": "Question",
      "name": "Что такое групповая закупка?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Несколько небольших клиентов объединяются для покупки одного товара по оптовой цене. Когда суммарный объём в группе достигает порога, оптовая цена активируется для всех участников. Если группа не собралась к дедлайну — оплата не списывается."
      }
    },
    {
      "@type": "Question",
      "name": "Какие способы оплаты доступны?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Kaspi Pay для частных и юридических лиц, безналичный перевод для компаний по реквизитам. Карты не сохраняются на сайте — оплата проходит через Kaspi."
      }
    },
    {
      "@type": "Question",
      "name": "Что если товар закончился?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Если на складе не оказалось заказанной позиции, мы пришлём WhatsApp с предложением замены аналогом. Вы можете согласиться, отказаться или подождать поступления. Без вашего согласия товар никогда не заменяется."
      }
    }
  ]
}
</script>
```

---

## 5. Sitemap

`/sitemap.xml` генерировать через Next.js sitemap.ts:

```typescript
// app/sitemap.ts
export default async function sitemap() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });
  
  const categories = await prisma.category.findMany({
    select: { slug: true },
  });
  
  return [
    { url: 'https://horecom.kz', lastModified: new Date(), priority: 1.0 },
    { url: 'https://horecom.kz/catalog', priority: 0.9 },
    { url: 'https://horecom.kz/about', priority: 0.5 },
    { url: 'https://horecom.kz/how-ordering-works', priority: 0.8 },
    { url: 'https://horecom.kz/subscription', priority: 0.8 },
    { url: 'https://horecom.kz/group-buying', priority: 0.8 },
    { url: 'https://horecom.kz/delivery-and-payment', priority: 0.7 },
    { url: 'https://horecom.kz/faq', priority: 0.7 },
    ...categories.map(c => ({
      url: `https://horecom.kz/catalog/${c.slug}`,
      priority: 0.7,
    })),
    ...products.map(p => ({
      url: `https://horecom.kz/product/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.6,
    })),
  ];
}
```

---

## 6. IndexNow (для быстрой индексации в Bing → ChatGPT)

После каждого update Product/Price/InventorySnapshot — пинговать IndexNow:

```typescript
// lib/indexNow.ts
const INDEXNOW_KEY = process.env.INDEXNOW_KEY!; // одноразовая генерация

export async function notifyIndexNow(urls: string[]) {
  await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: 'horecom.kz',
      key: INDEXNOW_KEY,
      keyLocation: `https://horecom.kz/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });
}

// В hook'ах при создании/обновлении продукта:
afterProductUpdate: (product) => {
  notifyIndexNow([`https://horecom.kz/product/${product.slug}`]);
}
```

Также положить файл `{INDEXNOW_KEY}.txt` в `/public/` с тем же содержимым (это требование IndexNow).

---

## 7. Checklist для деплоя сегодня (на текущий MVP)

Даже без полного редизайна можно поднять AI-видимость прямо сейчас:

- [ ] Залить `/llms.txt` в корень horecom.kz (через Tilda — кастомный код или через CDN)
- [ ] Обновить `/robots.txt` со списком AI-ботов
- [ ] Добавить Organization JSON-LD в `<head>` главной страницы Tilda
- [ ] Добавить Product JSON-LD на каждую карточку товара (через Tilda T123 блок)
- [ ] Создать страницы `/how-ordering-works`, `/subscription`, `/group-buying`, `/delivery-and-payment`, `/faq` если их нет
- [ ] Зарегистрировать сайт в Bing Webmaster Tools (для ChatGPT discoverability)
- [ ] Зарегистрировать в Google Search Console
- [ ] Verify schema через https://validator.schema.org
- [ ] Через 1–2 недели — проверить упоминания: `site:horecom.kz` в Bing, и попробовать спросить ChatGPT "where to buy chocolate Barry Callebaut wholesale in Astana"

Эти 8 пунктов закрывают L1 discoverability requirements из синтеза. UCP (V1.5/V2) — отдельный workstream, не блокирующий этот.
