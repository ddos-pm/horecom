# Horecom V1 — Техническое задание (мастер)

> Документ для co-founderа / Дияра / любого нового подрядчика. Описывает то что **есть на проде сейчас** и то что осталось доделать. Сначала — реальное состояние, потом — план развития.
>
> Последняя сверка с прод-кодом: 2026-05-24. Базовая ветка: `main` на `ddos-pm/horecom`. Прод: `https://horecom-platform-eosin.vercel.app`.

---

## 0. TL;DR — что это

Horecom — **B2B-платформа закупок для HoReCa в Центральной Азии**. Заменяет существующий MVP на Tilda. Серверная часть — Next.js 15 / Prisma / Supabase. Уже задеплоено на Vercel и публично доступно. Каталог из 189 SKU, обогащённых Claude (descriptions / use-cases / storage), доступен через HTML, через JSON-LD и через **MCP server** для AI-агентов.

Что готово:
- Полный публичный лендинг (home, catalog, PDP × 189, subscription, group-buying, FAQ, about, delivery, privacy, /llms.txt, /robots.txt, sitemap)
- AI-discoverability layer (MCP server с 6 tools, JSON-LD на всех страницах, `/.well-known/ai-plugin.json`)
- Auth-stack (Supabase email magic-link)
- Заказ end-to-end (cart → checkout → POST `/api/orders` → order row → email-stub)
- Subscription request flow (создаёт `SubscriptionPlan` со статусом `REVIEW_REQUIRED`)
- Daily Vercel Cron, генерирующий `UpcomingSubscriptionOrder` drafts
- Sentry scaffold (ждёт DSN)
- Healthz endpoint, security headers, PWA manifest

Что заблокировано на ключи co-founderа (см. §9):
- WhatsApp OTP — 360dialog API key
- Реальный email-send — Resend API key
- Семантический поиск (find_similar) — OpenAI billing
- Live error tracking — Sentry DSN
- Kaspi Pay handoff, AmoCRM webhooks — credentials

---

## 1. Бизнес-контекст (что и зачем)

### 1.1 Кому продаём
Три сегмента, обозначенные `enum Segment` в БД:

| Код | Сегмент | Что для них важно |
|---|---|---|
| `ENTERPRISE` | Крупные HoReCa: кафе, рестораны, отели | Скорость заказа, многоадресность, аналитика |
| `SMB_REPLENISHMENT` | Малые пекарни, кондитерские | Предсказуемое пополнение через подписку, WhatsApp напоминания |
| `MICRO_GROUPBUY` | Self-employed домашние кондитеры | Доступ к опту через групповые закупки |

Основной differentiator V1 = **подписка** (S2). Group buy → V1.5. Wholesale (S1) — уже работает на Tilda, переносим как baseline.

### 1.2 Откуда трафик
- 90% — мобильный
- Tilda (`horecom.kz`) + Instagram `@horecom.kz` (76k) + WhatsApp база ≈ 5000 контактов
- После запуска V1 — Tilda остаётся параллельно, пока миграция доменов не закончена

### 1.3 Метрики (см. `docs/23-traction-metrics.md`)
- ~$43k/мес GMV
- 50+ B2B-аккаунтов
- 10+ подписчиков-пекарен
- AOV ~$88

---

## 2. Архитектура высокого уровня

### 2.1 Стек (фиксирован, не «обновлять до latest»)

| Слой | Технология | Версия |
|---|---|---|
| Фреймворк | Next.js App Router | 15.5.18 |
| UI | React | 19.0.0-rc |
| Стили | Tailwind CSS v3 + shadcn-style компоненты (без CLI) | 3.4.14 |
| Типизация | TypeScript strict | 5.x |
| ORM | Prisma | 5.22 |
| БД | PostgreSQL (Supabase) | 16 |
| Auth | Supabase Auth — email magic-link | @supabase/ssr 0.10 |
| Cart state | Zustand с persist (localStorage) | 5.0 |
| Тосты | Sonner | 2.0 |
| i18n | next-intl | 4.12 |
| Валидация | Zod | 3.23 |
| AI | @anthropic-ai/sdk + (openai когда подключим billing) | 0.97 |
| Мониторинг | @sentry/nextjs (scaffold, ждёт DSN) | 10.53 |
| Хостинг | Vercel — регион `fra1` (Frankfurt) | — |

### 2.2 Регионы и латентность

```
Пользователь (Астана) → Vercel Edge (fra1, Frankfurt) → Supabase (aws-1-ap-northeast-1, Токио)
```

**Цена выбора**: Frankfurt ↔ Tokyo RTT ≈ 250-300ms. Prisma на Transaction Pooler даёт ~400-500ms warm TTFB на каталоге/PDP и ~5-8s на холодный спин-ап функции.

**Что с этим делать** (важно для co-founderа):
- Идеал: перенести Supabase project в `eu-central-1` через Settings → General → Region. Latency упадёт до ~10-50ms.
- Альтернатива: переключить Vercel `regions` на `hnd1` (Tokyo) — но станет дальше от пользователей в Астане.
- Долгосрочно (V1.5+): Redis cache на static-ish queries (categories, counts) через Upstash.

### 2.3 Деплой
- GitHub → `ddos-pm/horecom` → main → Vercel auto-deploy
- Production алиас: `horecom-platform-eosin.vercel.app` (стабильный)
- Build pipeline в `vercel.json`:
  ```
  prisma migrate deploy && prisma generate && next build
  ```
- ENV vars нужны на Vercel — см. §8

---

## 3. Структура БД — модель Company-centric

> Главный архитектурный принцип, защищённый в `docs/10-synthesis-master.md` §«Verdict #2». **Все заказы / адреса / подписки привязаны к Company, не к User.** Кухня с ротацией персонала не теряет историю при увольнении сотрудника.

### 3.1 Текущее наполнение (на 2026-05-24)

| Таблица | Строк | Примечание |
|---|---|---|
| `Company` | 2 | demo + co-founder test |
| `User` | 1 | co-founder |
| `Address` | 2 | demo addresses |
| `Category` | 11 | реальные категории Tilda |
| `Product` | 189 (активных) | импортированы из Tilda |
| `Product` enriched | 189/189 | Claude descriptions + useCases + storageInfo |
| `InventorySnapshot` | 189 | hash-based seed distribution 30/50/20 |
| `Price` | 189 | base + volume tiers (~$0.57 enrichment) |
| `Order` | 1 | test |
| `SubscriptionPlan` | 0 | ожидает первого юзера |

### 3.2 Ключевые модели (контракты)

#### `Company`
- `id`, `name`, `iin/bin` (12-значный), `segment: Segment`, `substitutionPreference: FallbackMode`
- Имеет **`addresses`**, **`users`**, **`orders`**, **`subscriptionPlans`**, **`carts`**

#### `User`
- `id`, `supabaseId` (FK на `auth.users`), `email`, `phone`, `role: UserRole`
- `companyId` — **nullable**, заполняется через onboarding
- Без `companyId` юзер не может сделать заказ (`/api/orders` проверяет это)

#### `Product`
Все поля каталога + AI-enriched:
- Базовые из seed: `sku`, `slug`, `name`, `brand`, `categoryId`, `packLabel`, `minOrderQty`, `imageUrl`
- Toggle: `isActive`, `isSubscriptionEligible`, `isGroupEligible`
- AI-enriched (Claude pass): `descriptionExtended`, `useCases`, `composition`, `storageInfo`, `brandResolved`
- Векторный (готов, embeddings ожидают OpenAI): `embedding vector(1536)` + `pgvector` extension
- `enrichedAt: DateTime?` — timestamp последнего enrich-прогона

**MCP search и catalog UI оба ищут по `name | brand | sku | description | descriptionExtended | useCases`** — `useCases` особо ценны для запросов типа «для макарон».

#### `Order` + `OrderItem`
- 10-state machine `OrderStatus`: `CREATED → INVOICE_SENT → WAITING_PAYMENT → PAID → CONFIRMED → PARTIALLY_CONFIRMED → PICKING → OUT_FOR_DELIVERY → DELIVERED → CANCELLED`
- `PARTIALLY_CONFIRMED` критичен: если 8 из 10 SKU в наличии, мы отгружаем, остальное идёт в substitution flow.
- `OrderItem` хранит **snapshot** цены и названия — изменение цены продукта позже не меняет историю заказа.
- `substitutionPreference: FallbackMode` (`ASK | SAME_BRAND_ONLY | NEVER`)

#### `SubscriptionPlan` + `SubscriptionPlanItem` + `UpcomingSubscriptionOrder`
- `cadenceType: CadenceType` (`WEEKLY | TWICE_WEEKLY | BIWEEKLY | MONTHLY`)
- `isColdStart: Boolean` — флаг, пока нет 2+ успешных доставок (потом включается predictive rolling-average)
- `nextDeliveryDate` — таргет даты
- `UpcomingSubscriptionOrder` — драфт перед фактическим заказом, с **snapshot цен и количеств на момент драфта** (защита от silent изменения цены)
- `status: REVIEW_REQUIRED` — все новые подписки создаются в этом статусе и требуют ручного review (менеджер звонит/пишет)

#### `InventorySnapshot`
- `availableQty`, `stockStatus: StockStatus`
- **`source: InventoryUpdateSource`** + `sourceRef` — мы знаем откуда пришла каждая цифра (`MANUAL_ADMIN | SUPPLIER_WEBHOOK | SCHEDULED_POLL | ORDER_DEDUCTION`)
- Это критично для разрешения споров «почему сайт обещал 47 кг»

#### `WhatsAppTemplate`
- `approvalStatus: TemplateApprovalStatus` (`DRAFT | SUBMITTED | APPROVED | REJECTED`)
- Шаблоны должны быть APPROVED Meta'й через 360dialog dashboard (2-7 дней)
- Сейчас 6 шаблонов в `DRAFT`: `order_confirmed`, `order_delivered`, `subscription_reminder`, `substitution_review`, `group_threshold_reached`, `group_failed`
- **Сабмитить в Meta нужно сейчас** — это блокер Sprint 4

#### `McpCall` — лог всех MCP-запросов
- IP, user-agent, tool name, input, output (если успех) или error, duration
- Используется и для rate limiting (текущая реализация — DB-based, без Redis)

#### `GroupBuyOffer`, `GroupBuyParticipation` — V1.5 module, схема готова

### 3.3 Индексы и производительность
Ключевые индексы (см. `prisma/schema.prisma`):
- `Product`: `slug` unique, `sku` unique, `(isActive, categoryId)` compound
- `Order`: `(companyId, status)`, `(createdAt desc)`
- `SubscriptionPlan`: `(companyId, status)`, `(nextDeliveryDate)` — для cron-сканирования
- `UpcomingSubscriptionOrder`: `(scheduledFor, status)`, `(cutoffAt)`
- `McpCall`: `(toolName, createdAt)`, `(ip, createdAt)` — для rate-limit окна

---

## 4. Маршрутизация и middleware

### 4.1 Три route group'а

```
app/
├── (marketing)/[locale]/    ← публичный лендинг + каталог, через next-intl с /ru, /kz префиксом
│   ├── page.tsx              /ru
│   ├── catalog/page.tsx      /ru/catalog
│   ├── product/[slug]/page.tsx  /ru/product/...
│   ├── subscription/page.tsx  /ru/subscription
│   ├── group-buying/page.tsx  /ru/group-buying  (есть badge V1.5)
│   ├── about, faq, delivery-and-payment, privacy, how-ordering-works
│   ├── layout.tsx            ← NextIntlClientProvider + LocaleBanner + Header + Footer
│   ├── sitemap.ts            /sitemap.xml (динамический)
│   └── llms.txt/route.ts     /llms.txt (динамический, с MCP-секцией)
│
├── (app)/                    ← залогиненная часть, БЕЗ locale префикса
│   ├── layout.tsx            ← Sidebar + auth-проверка
│   ├── cart/page.tsx         /cart
│   ├── checkout/page.tsx     /checkout
│   ├── dashboard/page.tsx    /dashboard
│   ├── orders/page.tsx       /orders
│   ├── orders/[id]/page.tsx  /orders/[id]
│   ├── profile/page.tsx      /profile
│   ├── onboarding/page.tsx   /onboarding
│   ├── subscription/manage/page.tsx
│   └── admin/                 /admin/... (только для админ-role'ей)
│
├── (auth)/                   ← логин/магик-линк
│   ├── layout.tsx            ← минимальный layout (без sidebar)
│   └── login/page.tsx        /login
│
├── api/                      ← все API endpoints
│   ├── mcp/manifest.json
│   ├── mcp/tools             (GET — список 6 инструментов)
│   ├── mcp/call              (POST — вызов конкретного tool)
│   ├── orders                (POST — создание заказа из cart)
│   ├── cron/subscription-reminders (GET — daily Vercel Cron)
│   └── healthz               (GET — uptime + DB latency)
│
├── auth/callback/route.ts    /auth/callback — Supabase magic-link landing
├── .well-known/ai-plugin.json/route.ts  — alias к /api/mcp/manifest.json
├── manifest.ts               /manifest.webmanifest
├── icon.png                  /icon.png   — favicon 32×32
└── apple-icon.png            /apple-icon.png — iOS home-screen 180×180
```

### 4.2 Middleware (`middleware.ts`)

```ts
const APP_PREFIXES = [
  "/cart", "/checkout", "/orders", "/profile", "/dashboard",
  "/subscription/manage", "/admin", "/onboarding", "/login",
  "/auth", "/api",
];
```

- Если путь начинается с одного из этих → запускается `updateSession` (Supabase session refresh + auth-гейт)
- Если `/.well-known/...` → пропуск (publicdiscovery)
- Иначе → `next-intl` middleware (locale routing)

### 4.3 Critical: cart/checkout/login — **вне locale**

Это решение по архитектуре. Поэтому:
- ❌ `<Link href="/cart">` из `@/i18n/routing` → даст `/ru/cart` → **404**
- ✅ `<a href="/cart">` или `next/link` → даст `/cart` → middleware → auth → cart

co-founder наткнулся на это (см. commit `b7daee2`). Все marketing-компоненты которые ссылаются на app-пути теперь используют raw `<a>`.

### 4.4 Auth flow

```
1. Юзер на /ru/catalog → клик cart icon (раньше Дияр поломал, сейчас работает)
2. Браузер → /cart
3. middleware видит /cart ∈ APP_PREFIXES → updateSession(request)
4. updateSession читает Supabase cookies. Не залогинен →
5. (app)/layout.tsx → AuthGuard → redirect 307 → /login?redirectTo=/cart
6. /login → email input → Supabase signInWithOtp({ email })
7. Юзер получает email с magic-link → клик
8. /auth/callback?next=/cart → exchangeCodeForSession() → set cookie → redirect /cart
9. Cart открыт, items берутся из Zustand localStorage (persist'нутые при QuickAdd)
10. "Оформить заказ" → /checkout
11. POST /api/orders → создаёт Order(status=CREATED) → email stub → redirect /orders/[id]
```

---

## 5. Реализованные surfaces (по слоям)

### 5.1 Marketing (публичные)

| Путь | Что делает | Notes |
|---|---|---|
| `/ru` (`/kz` → bilingual banner) | Home: 3 segment cards + featured products + trust elements | h1, 2 JSON-LD blocks (Organization, WebSite) |
| `/ru/catalog` | 11-category sidebar + 200 product cards + live debounced search | dynamic=force-dynamic, ItemList JSON-LD |
| `/ru/catalog?category=<slug>&q=<text>&subscription=true&group=true` | Все 4 фильтра комбинируются | Page handler читает `searchParams` (Promise в Next 15) |
| `/ru/product/<slug>` | Gallery + Specs + Description + Когда использовать + Состав + Volume tiers + JSON-LD Product+Offer+Breadcrumb | 30 top SKU pre-rendered, остальные ISR-on-demand |
| `/ru/subscription` | Лендинг + RequestForm (gated за auth) | server action создаёт SubscriptionPlan |
| `/ru/group-buying` | Лендинг с badge V1.5 + waitlist form | |
| `/ru/about`, `/ru/faq`, etc. | Статика | FAQ имеет FAQPage JSON-LD |
| `/ru/privacy` | Юридическая страница | linked в footer |

### 5.2 App (залогиненные)

| Путь | Что делает | Готовность |
|---|---|---|
| `/dashboard` | Главный экран после логина: recent orders, cart preview, subscription state | ✓ |
| `/cart` | Zustand items + MOQ/min-order warnings + Subtotal/Delivery/Total | ✓ |
| `/checkout` | 3-step: address + slot, substitution preference, comment → POST /api/orders | ✓ |
| `/orders` | Список всех заказов компании | ✓ |
| `/orders/[id]` | Детали заказа + 10-state machine status visualization | ✓ |
| `/profile` | Company form (name, BIN/IIN) + Contact form (менеджер) | ✓ |
| `/onboarding` | Multi-step: segment → company → address | ✓ |
| `/subscription/manage` | Управление активными подписками | базовая ✓ |
| `/admin/*` | Caталог/orders/subscriptions/group-buy admin views | базовая ✓ |

### 5.3 API endpoints

| Метод + путь | Что | Auth | Notes |
|---|---|---|---|
| `POST /api/orders` | Создаёт Order из cart payload | Supabase user + company gate | snapshot цен в `OrderItem`, MOQ-валидация, email stub |
| `GET /api/mcp/manifest.json` | MCP plugin manifest | none (public) | self-resolves origin |
| `GET /api/mcp/tools` | Список 6 tools со схемами | none | |
| `POST /api/mcp/call` | `{tool_name, arguments}` → результат | none + rate limit (per IP) | 400 на bad args, 429 на rate-limit, 500 только на реальные сбои |
| `GET /api/cron/subscription-reminders` | Daily Cron — генерирует UpcomingSubscriptionOrder drafts | Bearer CRON_SECRET (или ?secret= в dev) | scheduled `0 4 * * *` UTC |
| `GET /api/healthz` | Uptime + DB latency + commit/region | none | 200 / 503 |

### 5.4 AI Discoverability

| Файл | Где | Что |
|---|---|---|
| `/llms.txt` | dynamic route | Описание компании, категории, MCP-секция с endpoints |
| `/robots.txt` | static `public/robots.txt` | AI-боты (GPTBot, ClaudeBot, etc.) — `Allow: /api/mcp/` + `Allow: /.well-known/` |
| `/sitemap.xml` | dynamic | 197 URLs (8 static + 189 products), c hreflang alternates ru↔kk |
| `/.well-known/ai-plugin.json` | new | alias к MCP manifest для legacy plugin discovery |
| JSON-LD везде | inline в layouts | Organization+WebSite (home), Product+Offer+Breadcrumb (PDP), ItemList (catalog), FAQPage (FAQ) |
| Footer | `components/marketing/footer.tsx` | discrete link «Для AI-агентов» → /llms.txt |

---

## 6. MCP server — core differentiator для гранта

### 6.1 Зачем

Tyler Cowen / Mercatus и любые AI-coding-savvy reviewers подключают MCP к Claude Desktop, ChatGPT и тестируют. Это **первая B2B-платформа в ЦА**, выставляющая структурированный API для AI-агентов помимо обычного HTML.

### 6.2 6 tools (см. `lib/mcp/tools.ts`)

| Tool | Что делает | Использует enrichment |
|---|---|---|
| `search_products` | Полнотекстовый поиск с Russian-stemming + stop-words | ✓ (ILIKE на name/brand/sku/description/descriptionExtended/useCases) |
| `get_product` | Детальная карточка SKU | ✓ (returns description/use_cases/composition/storage_info) |
| `check_inventory` | Стек по SKU + suggested alternatives | — |
| `get_volume_pricing` | Volume tiers + recommendation | — |
| `find_similar` | pgvector cosine (когда embeddings) или эвристика (сейчас) | embedding fallback |
| `create_draft_order` | DRAFT order требует WhatsApp confirmation | — |

### 6.3 Поведение

- **Авторизация:** none (public read-only). `create_draft_order` возвращает draft, не реальный заказ. Customer обязан подтвердить через WhatsApp.
- **Rate limit:** DB-based через `McpCall` table — окно 60 секунд, лимит 30 запросов/IP (см. `lib/mcp/rate-limit.ts`). Известное ограничение: race condition в serverless — для V1 терпимо, Vercel edge ограничивает abuse.
- **Логирование:** каждый успешный/неуспешный вызов пишется в `McpCall` (async, не блокирует ответ)

### 6.4 Discoverability flow для AI агента

```
1. AI агент видит горецom.kz/llms.txt → читает «For AI agents — MCP server» секцию
2. Получает endpoints:
   - manifest: /api/mcp/manifest.json (или /.well-known/ai-plugin.json)
   - tools: GET /api/mcp/tools
   - call: POST /api/mcp/call
3. GET /api/mcp/tools → 6 tool schemas (Zod-derived JSON Schema)
4. POST /api/mcp/call {tool_name, arguments} → result
5. Если ошибка args → 400 + field-level details (`invalid_arguments`)
6. Если rate limit → 429 + reset_at
```

---

## 7. ENV vars — что нужно где

### 7.1 Локально (`.env.local`)

```bash
# Supabase pooler (для serverless DB connections)
DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5"
# Direct connection (для миграций)
DIRECT_URL="postgresql://postgres.<ref>:<pw>@db.<ref>.supabase.co:5432/postgres"

# Supabase client SDK
NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."

# Auth
AUTH_SECRET="(openssl rand -base64 32)"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# AI scripts (опционально для локалки)
ANTHROPIC_API_KEY="sk-ant-..."   ← подключено
OPENAI_API_KEY="sk-..."           ← подключено но billing ждёт
```

### 7.2 На Vercel (Production)

В дополнение к локальным, на проде также:
- `NEXT_PUBLIC_SITE_URL` (когда поменяется custom domain — указать на `https://horecom.kz`)
- `CRON_SECRET` (рандомная строка для защиты `/api/cron/*`)
- `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` (когда создадите проект)
- `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_MANAGER` (для реального email)
- `WHATSAPP_API_KEY` (360dialog, для OTP + cron-WhatsApp)
- `KASPI_API_KEY`, `KASPI_MERCHANT_ID` (V1 payment)
- `AMOCRM_DOMAIN`, `AMOCRM_ACCESS_TOKEN`, `AMOCRM_REFRESH_TOKEN` (V1 CRM sync)

---

## 8. Поэтапный план развёртывания с нуля

> Если кто-то новый поднимает локалку:

### Фаза 0 — установка
```bash
git clone https://github.com/ddos-pm/horecom.git
cd horecom
npm install --legacy-peer-deps     # ⚠️ legacy-peer-deps обязательно (React 19 RC)
cp .env.example .env.local
# Заполнить .env.local минимум: DATABASE_URL, DIRECT_URL, Supabase keys, AUTH_SECRET
```

### Фаза 1 — БД
```bash
npx prisma generate
npx prisma db execute --file scripts/enable-pgvector.sql    # включает pgvector extension
npx prisma migrate deploy
npx prisma db seed                  # 11 categories + 189 products + 6 WA templates
npx tsx scripts/seed-inventory.ts   # hash-based 30/50/20 stock distribution
npx tsx scripts/seed-volume-pricing.ts   # volume tiers на 189 SKUs
```

### Фаза 2 — обогащение (опционально, ~$0.57, ~25 мин)
```bash
# Требует ANTHROPIC_API_KEY
npx tsx scripts/enrich-products.ts                    # все unenriched
npx tsx scripts/enrich-products.ts --sku HC-... --dry # один SKU dry-run
npx tsx scripts/cleanup-brands.ts                     # убирает TR/Decol дубликаты
```

### Фаза 3 — embeddings (требует OpenAI billing — пока заблокировано)
```bash
npx tsx scripts/generate-product-embeddings.ts
```

### Фаза 4 — dev server
```bash
npm run dev                       # http://localhost:3000
```

### Фаза 5 — verify
```bash
curl -I localhost:3000/api/healthz   # 200, db.ok=true
curl -I localhost:3000/ru/catalog    # 200
curl localhost:3000/api/mcp/tools | jq    # 6 tools
```

### Фаза 6 — деплой на Vercel
1. Подключить GitHub repo на Vercel (co-founder аккаунт `dd-osaman-s-projects`)
2. Заполнить ENV vars на Vercel (см. §7.2)
3. Push в `main` → автодеплой
4. После первого деплоя: проверить `https://horecom-platform-eosin.vercel.app/api/healthz`

---

## 9. Что готово / что заблокировано

### 9.1 Готово на проде

- [x] Полный публичный лендинг (home + catalog + 189 PDP + landing pages)
- [x] AI-discoverability (llms.txt, robots, MCP, JSON-LD, manifest)
- [x] Auth (Supabase magic-link)
- [x] Cart + Checkout + Order creation
- [x] Subscription request flow
- [x] Daily Cron для UpcomingSubscriptionOrder drafts
- [x] Healthz endpoint
- [x] Security headers (X-Frame-Options, CSP-like, Permissions-Policy)
- [x] Sentry scaffolding (instrumentation + global-error.tsx)
- [x] PWA manifest + icon set (oranges-on-white)
- [x] i18n /kz fallback с bilingual banner
- [x] 189/189 products AI-enriched

### 9.2 Заблокировано на ключи co-founderа

| Что | Что нужно | Цена | Где взять |
|---|---|---|---|
| WhatsApp OTP + cron-reminders + substitution flow | `WHATSAPP_API_KEY` | ~$5/mo | 360dialog dashboard, ждём verification |
| Реальный email из `/api/orders` | `RESEND_API_KEY` + verified domain | бесплатно (3k/мес) | https://resend.com |
| Semantic search в MCP `find_similar` | OpenAI billing | ~$0.20 на embedding пасс | https://platform.openai.com/billing → +$5 |
| Live error tracking | Sentry DSN | бесплатно (5k events/мес) | https://sentry.io создать проект «horecom» |
| CI workflow file | `gh auth refresh -s workflow` от Дияра | бесплатно | вручную |
| Custom domain → V1 | DNS-настройка | бесплатно | когда `horecom.kz` смигрирует с Tilda |
| менеджер админ-доступ | SQL `UPDATE User SET role='ADMIN'` после её первого магик-линка | — | — |

### 9.3 Кросс-функциональные TODO

- [ ] Kaspi Pay integration (V1, после OTP)
- [ ] AmoCRM webhook sync (V1)
- [ ] Group Buy module (V1.5)
- [ ] Admin panel polish
- [ ] Predictive replenishment ML — после ~10 успешных подписочных циклов с реальными данными
- [ ] Tilda CSV import script (когда CSV придёт от co-founderа)
- [ ] AmoCRM API pull для миграции истории заказов

---

## 10. Roadmap по спринтам

### Спринт 0.5 (сейчас идёт) — production hardening
- [x] Deploy + healthz
- [x] AI enrichment 189/189
- [x] MCP exposure
- [ ] **Submit WhatsApp templates в Meta** (2-7 дней approval) ← ДАУЛЕТ, ДЕЛАТЬ СЕГОДНЯ
- [ ] OpenAI billing → embeddings prod-prog
- [ ] Resend setup → реальный email
- [ ] Sentry DSN

### Спринт 1 (2 недели) — Tilda data migration
1. **День 1**: экспорт Tilda Store → CSV → `scripts/import-tilda-csv.ts` → заменить seed
2. **День 2**: AmoCRM API pull `/companies + /contacts + /leads` → `scripts/import-amocrm.ts` → seed companies + users + order history
3. **День 3**: интервью с менеджер → seed 10+ существующих подписок

### Спринт 2 (2 недели) — payment + WhatsApp
- Kaspi Pay handoff (invoice generation + webhook на статус)
- Реальный WhatsApp OTP вместо email magic-link (опционально, гибрид)
- Substitution flow UI

### Спринт 3 (2 недели) — admin
- Полный admin panel: orders queue, inventory updates, customer cards
- менеджер работает оттуда

### Спринт 4 (1 неделя) — observability
- Метрики conversion / search drop-off / cart abandonment
- PostHog или Vercel Analytics
- Sentry alerts wired to Slack

### V1.5 (отдельный milestone) — Group Buy
- Group creation UI
- Threshold tracking
- Locked-price guarantee
- WhatsApp `group_threshold_reached` / `group_failed` templates

### V2 — нативное мобильное приложение
- React Native (Expo) обёртка над web
- Push-notifications вместо WhatsApp templates
- Offline cart

---

## 11. Известные тех-долги и риски

### 11.1 Performance
- **DB latency Frankfurt→Tokyo** — основной bottleneck. Решение: перенести Supabase в `eu-central-1` через project settings (требует подтверждения co-founderа, ≈30 минут migration).
- Catalog page при cold-cold-start функции (~8s TTFB) — связано с тем же. На прогретой функции 500-800ms.
- `force-dynamic` на catalog/PDP — каждый хит идёт в DB. Нужен Redis cache на static-ish queries (`Category.findMany`, total counts) — план для V1.5.

### 11.2 MCP rate-limit race
DB-based rate limit имеет race condition в serverless (несколько concurrent функций могут параллельно превысить лимит до того как первый запрос успеет записаться в `McpCall`). В V0 терпимо — Vercel edge защищает от настоящего DDoS. В V1 — мигрировать на Upstash Redis.

### 11.3 Безопасность
- ✅ Security headers выставлены
- ✅ Auth ↔ Supabase session, не самописное
- ✅ Server actions защищены Zod
- ⚠️ Нет CSP (Content-Security-Policy) — добавить когда стабилизируются inline-стили
- ⚠️ Кириллический поиск может пропустить запросы с латинской транслитерацией (`syrop` vs `сироп`) — fuzzy match через pgvector embeddings решит

### 11.4 SEO
- ✅ Sitemap + hreflang
- ✅ Schema.org coverage (Product, Offer, Breadcrumb, ItemList, FAQ, Organization, WebSite)
- ✅ AI bots whitelisted
- ⚠️ Все JSON-LD URLs указывают на `horecom-platform-eosin.vercel.app` — когда co-founder переключит DNS на `horecom.kz`, поменять `NEXT_PUBLIC_SITE_URL` env var
- ⚠️ Open Graph image (`/og-image.png`) — общая для всех страниц. Per-PDP OG-images через Next `ImageResponse` — задача для V1

### 11.5 Brand data quality
- ✅ Очистка TR (страна) / Decol-DECOL (case) / JB-JBCocoa (unify) сделана
- ⚠️ 35 из 189 SKU без brand вообще — enrichment не угадывает (`brandResolved = null`). Не ломает работу, но смотрится менее полно. Решение в V1.5: GPT-4 brand-extraction pass с confidence threshold ≥0.7

### 11.6 Тестирование
- ❌ Unit tests отсутствуют (V1.5)
- ✅ **E2E walkthrough** — `tests/e2e/site-walkthrough.spec.ts` (16 сценариев на Playwright Chromium): home, catalog filter, debounced search, PDP rendering, add-to-cart + badge, cart → /login redirect, login form, header & drawer search, footer AI link, KZ banner, subscription gate, group-buy V1.5 badge, icons, manifest, JSON-LD coverage
- ✅ **Smoke test** — `scripts/smoke-test.sh` (39 curl checks): все routes + auth gates + AI surfaces + icons + MCP bad-args validation
- ✅ Build на Vercel ловит большую часть TS-ошибок
- 🟡 CI workflow готов локально, но требует `gh auth refresh -s workflow` от Дияра

#### Команды
```bash
# Smoke (быстро, ~30 сек):
bash scripts/smoke-test.sh

# Browser walkthrough (~2 мин):
npx playwright test tests/e2e/site-walkthrough.spec.ts --reporter=list

# Если на локалке:
BASE_URL=http://localhost:3000 bash scripts/smoke-test.sh
BASE_URL=http://localhost:3000 npx playwright test
```

### 11.7 i18n
- ✅ Маршруты `/kz/*` существуют, redirect-safe
- 🟡 Контент на `/kz` сейчас всё ещё русский — показывается баннер "Қазақша нұсқа дайындалуда"
- ❌ Реальный перевод `messages/kz.json` ждёт native-speaker pass (нанять переводчика)

---

### 11.8 next-intl `<Link>` каверзы — known fix pattern

next-intl `<Link>` (import from `@/i18n/routing`) имеет два известных гнойника:

1. **Same-pathname click no-op.** При клике на `<Link href="/catalog?category=X">` со страницы `/catalog`, onClick handler видит «same pathname» и не вызывает `router.push` → URL не меняется, фильтр не применяется. SSR href в HTML правильный — только client click сломан. **Fix:** для same-pathname навигации использовать **plain `<a href="/${locale}/path?…">`** (полный путь с locale).

2. **App paths (`/cart`, `/login`, `/checkout`) → 404 при /ru/ префиксе.** Эти routes намеренно живут вне `[locale]` сегмента (см. APP_PREFIXES в middleware.ts). next-intl Link добавит `/ru` prefix → `/ru/cart` → 404. **Fix:** для app paths использовать plain `<a href="/cart">` или `next/link` (без locale wrapping).

Соблюдай эти правила в новом коде, или Playwright walkthrough поймает.

## 12. Контактные точки для разработчиков

| Ситуация | Что делать |
|---|---|
| Локалка не поднимается | Проверить `npm install --legacy-peer-deps`, потом `prisma generate`, потом `.env.local` |
| Build падает с `useSearchParams should be wrapped in Suspense` | Маркетинг-страница случайно подтянула client component с `useSearchParams()` — обернуть в `<Suspense fallback={null}>` или убрать subscription |
| MCP 500 | Проверить логи Vercel. Если ZodError — это уже 400 (правильно). Реальный 500 — Prisma timeout/недоступная DB |
| Cart icon ведёт в 404 | Проверить что link использует `<a href="/cart">`, **не** `<Link from "@/i18n/routing">` |
| TTFB > 1s | Cross-continent latency. Не баг — лимит инфраструктуры. См. §11.1 |
| Icon показывает чёрный фон | Браузер кеширует favicon агрессивно. Проверить в incognito |
| Push в `.github/workflows/*` отклоняется | OAuth token без workflow scope. См. §11.6 |

---

## 13. Текущая команда и ownership

- **co-founder** — CPO, founder. Архитектурные решения, integration keys (360dialog, Kaspi, AmoCRM, OpenAI billing)
- **co-founder** — CEO, ops. Catalog data quality, supplier relationships, customer success
- **Дияр** — координация, тестирование, frontend (через Claude Code)
- **Claude (этот документ)** — code execution, integration, debugging

---

## 14. Verification checklist (для нового deploy)

После любого нетривиального push'а в main, прогнать:

```bash
PROD="https://horecom-platform-eosin.vercel.app"

# 1. Healthz зелёный
curl -sS $PROD/api/healthz | jq '.status, .db.ok, .db.latency_ms'

# 2. Public surfaces 200
for u in / /ru /ru/catalog /ru/product/mindalnaya-muka-ispaniya-1kg \
         /ru/subscription /ru/group-buying /ru/about /ru/faq \
         /llms.txt /robots.txt /sitemap.xml \
         /favicon.ico /icon.png /manifest.webmanifest \
         /.well-known/ai-plugin.json /api/mcp/manifest.json /api/mcp/tools; do
  printf "  %-50s %s\n" "$u" "$(curl -sS -o /dev/null -w '%{http_code}' $PROD$u)"
done

# 3. Auth-gated routes 307 to /login
for u in /cart /checkout /orders /profile /dashboard; do
  curl -sS -I $PROD$u | head -1
done

# 4. MCP tool call works
curl -sS -X POST $PROD/api/mcp/call \
  -H "content-type: application/json" \
  -d '{"tool_name":"search_products","arguments":{"query":"шоколад","max_results":5}}' \
  | jq '.result.total_count'
```

---

*Документ актуализируется при каждом значимом изменении архитектуры. История правок — в `git log docs/40-tz-master.md`.*
