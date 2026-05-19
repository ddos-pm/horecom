# Horecom Platform

B2B procurement platform for HoReCa businesses in Central Asia.

**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind v3 · Prisma 5 · PostgreSQL (Neon) · NextAuth.js v5 · WhatsApp Business API · Kaspi Pay · AmoCRM

## Что в этом проекте

Это V1-скелет платформы Horecom — замена текущего MVP на Tilda. Реализовано:

✅ **Mobile-first frontend** на Next.js 15 + Tailwind v3 + shadcn-style components
✅ **Company-centric data model** в Prisma (закрыто 4 из 13 gap'ов из synthesis-документа)
✅ **Segment-first home page** с тремя сегментами на одном лендинге (S1/S2/S3) — то чего не хватало Tilda
✅ **Catalog + Product pages** с реальными SKU из текущего Tilda-сайта
✅ **Trust Layer pages**: FAQ (с FAQPage JSON-LD), How ordering works, Subscription, Group Buying, Delivery
✅ **AI Discoverability layer**: `/llms.txt` (dynamic), `/robots.txt` с AI-ботами, `sitemap.xml`, Organization/WebSite/Product/Breadcrumb/FAQ JSON-LD
✅ **Seed data** с реальными категориями и топ-SKU из Tilda
✅ **WhatsApp templates** (DRAFT state, готовы к отправке в Meta)

## Что НЕ реализовано в этом скелете

🔄 OTP-аутентификация — нужен `WHATSAPP_API_KEY` от 360dialog
🔄 Cart/Checkout логика — placeholder кнопки
🔄 Subscription workspace — landing page готов, dashboard нет
🔄 Group Buy module — V1.5
🔄 Admin panel — V1 Sprint 5
🔄 Kaspi Pay integration — нужны API credentials
🔄 AmoCRM webhooks — нужны credentials
🔄 Predictive replenishment cron — после первых 2 успешных доставок на реальных данных

## Быстрый старт

### Требования

- Node.js 18.18+ (рекомендуется 20+)
- pnpm 9+ (можно npm/yarn, но рекомендуется pnpm)
- PostgreSQL database — самый быстрый путь: [Neon](https://console.neon.tech) (free tier)

### Установка

\`\`\`bash
# 1. Установить зависимости
pnpm install

# 2. Скопировать env
cp .env.example .env.local
# Открыть .env.local и заполнить минимум DATABASE_URL

# 3. Сгенерировать Prisma client
pnpm db:generate

# 4. Запустить миграции (создаст таблицы в БД)
pnpm db:migrate

# 5. Залить seed-данные (категории + ~16 SKU + WhatsApp templates)
pnpm db:seed

# 6. Запустить dev-сервер
pnpm dev
\`\`\`

Открыть http://localhost:3000

### Что работает сразу после seed

- `/` — главная страница с segment-first onboarding, trust strip, категориями, top-SKU
- `/catalog` — каталог с боковыми фильтрами по категориям
- `/catalog?category=chocolate-glazes` — категория шоколада
- `/catalog?q=мука` — поиск
- `/product/[slug]` — карточка товара с Product JSON-LD, volume tiers, MOQ, stock
- `/faq` — FAQ с FAQPage JSON-LD
- `/about` — о компании
- `/how-ordering-works` — описание процесса заказа
- `/subscription` — лендинг подписки
- `/group-buying` — лендинг групповых закупок
- `/delivery-and-payment` — условия доставки и оплаты
- `/llms.txt` — машиночитаемое описание для AI
- `/robots.txt` — с AI-ботами разрешёнными
- `/sitemap.xml` — со всеми продуктами и категориями

## Деплой на Vercel

\`\`\`bash
# 1. Запушить в GitHub
git init
git add .
git commit -m "Initial Horecom V1 skeleton"
git remote add origin https://github.com/yourorg/horecom-platform
git push -u origin main

# 2. Открыть https://vercel.com/new и выбрать репозиторий

# 3. Добавить environment variables в Vercel UI:
#    - DATABASE_URL (от Neon)
#    - AUTH_SECRET (openssl rand -base64 32)
#    - NEXT_PUBLIC_BASE_URL (production URL)
#    остальные по мере подключения сервисов

# 4. Vercel автоматически выполнит prisma generate + next build
\`\`\`

После первого деплоя:

\`\`\`bash
# Применить миграции к production БД (один раз)
DATABASE_URL="<production-url>" pnpm db:migrate:deploy

# Засеять production БД (один раз)
DATABASE_URL="<production-url>" pnpm db:seed
\`\`\`

## Структура проекта

\`\`\`
horecom-platform/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout с Inter + Org JSON-LD
│   ├── page.tsx                  # Главная (segment-first)
│   ├── globals.css               # Tailwind + CSS vars (design tokens)
│   ├── catalog/page.tsx          # Каталог с фильтрами
│   ├── product/[slug]/page.tsx   # PDP с Product JSON-LD
│   ├── about/page.tsx
│   ├── how-ordering-works/page.tsx
│   ├── subscription/page.tsx
│   ├── group-buying/page.tsx
│   ├── delivery-and-payment/page.tsx
│   ├── faq/page.tsx              # с FAQPage JSON-LD
│   ├── llms.txt/route.ts         # Dynamic /llms.txt
│   ├── sitemap.ts                # Dynamic sitemap
│   └── api/                      # API routes (для будущего)
├── components/
│   ├── ui/                       # shadcn-style: button, badge
│   ├── header.tsx
│   ├── footer.tsx
│   └── json-ld.tsx               # Org + WebSite JSON-LD
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   └── utils.ts                  # cn(), formatPrice(), stockStatusInfo()
├── prisma/
│   ├── schema.prisma             # Full schema (Company-centric)
│   └── seed.ts                   # Categories + top-SKUs from Tilda + WhatsApp templates
├── public/
│   └── robots.txt                # AI bots explicitly allowed
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
\`\`\`

## Что делать дальше

### Перед запуском (1 неделя)

1. **Создать Neon Postgres** проект, скопировать DATABASE_URL в `.env.local`
2. **Зарегистрироваться в 360dialog** для WhatsApp Business API
3. **Получить Kaspi Pay Business API credentials** (это занимает 1–4 недели — начинать сразу)
4. **Связаться с AmoCRM** для интеграционных credentials
5. **Отправить 6 WhatsApp templates** в Meta на approval (тексты уже в seed: `order_confirmed`, `subscription_reminder`, `substitution_review`, `group_threshold_reached`, `group_failed`, `order_delivered`). Approval занимает 2–7 дней.

### Sprint 1 (нед 1–2)

- OTP auth через 360dialog
- Сегмент-онбординг после первого логина (segment ∈ ENTERPRISE/SMB_REPLENISHMENT/MICRO_GROUPBUY)
- Базовая корзина (Zustand) — добавить в Cart
- Профиль компании: реквизиты, БИН/ИИН, адреса
- Sentry + PostHog подключены

### Sprint 2 (нед 3–4)

- Checkout 3 шага: cart → доставка → оплата
- Kaspi handoff
- Order state machine (все 10 состояний)
- Webhook от Kaspi → обновление order status
- AmoCRM webhook → создание сделки

### Sprint 3 (нед 5–6)

- Orders list + detail page с timeline
- Документы (счёт-фактура, накладная) — генерация PDF
- Reorder + "повторить с изменениями"
- Substitution UX (см. `06_Substitution_UX_Spec.md`)

### Sprint 4 (нед 7–9)

- Subscription module (S2)
- Wizard создания плана
- Upcoming order workspace с cutoff
- WhatsApp template отправка
- Cron-задача для следующих заказов
- Predictive алгоритм (rolling avg по 4 заказам)

### Sprint 5 (нед 10–12)

- Admin panel (orders, subscriptions, inventory)
- i18n (Kazakh для landing/onboarding/уведомлений)
- Performance optimization
- Returns/complaint flow

### V1.5 (4–6 нед после V1)

- Group Buy module (S3)
- Urgent Reorder flow

### V2

- UCP integration + MCP server
- Mobile native app
- Almaty operational expansion
- BNPL

## Дизайн-система

Цвета — primary teal (`#0F766E`), warm B2B operational tone. CSS variables в `app/globals.css`.

Карточки товаров с обязательными полями:
- Бренд + фасовка
- Название (line-clamp 2)
- Цена + единица (с tabular-nums)
- Минимальный заказ
- Status chip (In stock / Low stock / Out of stock)
- Badge "Подписка" / "Группа" где применимо

Любая страница где принимаются решения по заказу имеет:
- Loading state
- Empty state
- Error state
- Mobile + desktop версии

## Аналитика

Все события (см. `lib/analytics.ts` — TODO) отправляются в PostHog с props:
- `company_segment`
- `page_type`
- `device_type`
- `source`

Минимальный набор: `segment_selected`, `search_used`, `filter_applied`, `product_viewed`, `add_to_cart`, `checkout_started`, `order_submitted`, `subscription_plan_created`, и т.д.

## Тестирование

(не реализовано в скелете — приоритет после первых пользователей)

Рекомендация: Playwright для E2E на критичных flow:
1. Anon user → Catalog browse → PDP → Add to cart → Checkout → Kaspi handoff
2. Subscription create → upcoming order → edit → confirm
3. Substitution proposed → approve via web

## Лицензия

Proprietary. © 2026 Horecom (ТОО "Horecom"), Astana, Kazakhstan.

## Контакты

- co-founder, CPO — [***REMOVED***](https://www.***REMOVED***)
- co-founder, Director — ***REMOVED***
