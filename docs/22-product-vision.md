# 02 · Product Vision & Roadmap

## 2.1 Три value‑mode на одном каталоге

Ключевая идея Horecom: **один и тот же товарный каталог** и физическая инфраструктура могут обслуживать три разных режима ценности для трёх сегментов:

1. **Fast Wholesale Ordering (S1)**  
   - Быстрое оформление оптовых заказов.
   - Быстрый поиск, фильтры, сохранённые корзины.
   - Повтор заказа и небольшие изменения.

2. **Guided Replenishment via Subscription (S2)**  
   - Подписка на регулярную доставку.
   - Предиктивный движок, который считает, когда товар закончится.
   - WhatsApp‑напоминания с кнопками Confirm / Edit / Skip.

3. **Pooled Group Buying (S3)**  
   - Групповые закупки для самозанятых.
   - Порог объёма, после которого включается оптовая цена.
   - Защищённая экономическая модель: цена в группе фиксируется на момент старта.

Ни один игрок в регионе не предлагает сразу все три режима в рамках одного стека.

## 2.2 Архитектура продукта V1

### Общий стек

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript.
- **UI:** Tailwind CSS v4, shadcn/ui (new‑york), lucide‑react.
- **State:** Zustand (корзина), TanStack Query (серверный стейт).
- **Backend:** Next.js API routes, Prisma 5, PostgreSQL (Neon serverless).
- **Auth:** NextAuth.js v5, OTP через WhatsApp (360dialog).
- **Оплата:** Kaspi Pay API (инвойсы + webhook).
- **Коммуникации:** WhatsApp Business API (360dialog), Email как резерв.
- **CRM:** AmoCRM через webhooks.
- **Инфраструктура:** Vercel (деплой), Sentry (ошибки), PostHog (аналитика).

### Ключевые сущности (уровень модели)

- **Company** — юридическое лицо/ИП клиента.
- **User** — конкретный человек, привязанный к Company.
- **Product, Category, InventorySnapshot, ProductPrice.**
- **Order, OrderItem** — десятистадийная state machine (WAITING_PAYMENT, CONFIRMED, PARTIALLY_CONFIRMED, PICKING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED и др.).
- **SubscriptionPlan, SubscriptionPlanItem, UpcomingSubscriptionOrder** — ядро подписочного движка.
- **GroupBuyOffer, GroupBuyParticipation** — ядро групповых закупок (V1.5).
- **WhatsAppTemplate, NotificationLog** — управление шаблонами и отправками.

## 2.3 Roadmap: V1 / V1.5 / V2 (12+ недель)

### V1 (12 недель) — Каталог, заказы, подписка

**Цель V1:** закрыть S1 и S2, оставить Group Buy на V1.5.

**Sprint 1–2: Foundation + AI Discoverability**
- Базовый каркас приложения (Next.js, Tailwind, shadcn/ui, Prisma, auth OTP).
- App shell (mobile‑first, bottom‑nav, sticky CTA).
- Подключение PostHog и Sentry.
- AI Discoverability слой: `llms.txt`, `robots.txt` с AI‑ботами, Organization/WebSite JSON‑LD, sitemap, IndexNow ping.

**Sprint 3–4: Catalog + Trust Layer**
- Каталог с поиском, фильтрами, категориями.
- PDP: цена, MOQ, наличие, оптовые ценовые тиры.
- Trust Layer: FAQ, SLA, политика замены (substitution), политика частичной отгрузки.
- Сегмент‑онбординг: выбор S1/S2/S3 на входе.

**Sprint 5–6: Order Core**
- Корзина (Zustand), валидация MOQ, подсветка предупреждений по стоку.
- 3‑шаговый checkout, handoff в Kaspi Pay.
- Полноценная state machine заказа.
- Повтор заказа (reorder) и “reorder with changes”.
- Интеграция с AmoCRM (сделки, кастомные поля).

**Sprint 7–8: Subscription (S2)**
- Wizard создания плана подписки (частота, дни, список SKU).
- Upcoming orders workspace с cutoff и предупреждениями.
- Предиктивный движок: rolling average после 2+ заказов, дефолт — раз в две недели.
- WhatsApp‑напоминания с кнопками (Confirm / Edit / Skip).
- Настройки Substitution и pre‑approval на уровне компании.

**Sprint 9–10: Polish + Admin**
- Админ‑панель: заказы, подписки, ручное обновление стока.
- Performance‑budget: FCP < 1.5s, LCP < 2.5s на мобильном.
- i18n: RU+KZ для публичных страниц и онбординга.
- Базовый returns/complaints flow, интеграция с AmoCRM.

### V1.5 — Group Buy + Urgent Reorder

- Запуск workspace для S3 (самозанятые кондитеры):
  - Создание группы, share‑link.
  - Порог объёма и дедлайн.
  - Фиксированная цена на момент создания группы.
  - 8 edge cases (не достигли порога, частичный объём, price change и т.д.).
- Urgent Reorder flow для S1/S2 — быстрый дозакуп “на завтра утром”.

### V2 — UCP, мобилки, BNPL

- UCP/MCP‑интеграция (заказ через ИИ‑агентов типа ChatGPT/Claude).
- Mobile app (iOS/Android) с теми же API.
- BNPL/факторинг для HoReCa (Net 30/45).
- Расширение на Алмату (вторая локация).

## 2.4 Что отличает Horecom от “ещё одного оптового сайта”

1. **Company‑centric модель**  
   Все сущности (адреса, подписки, заказы) привязаны к Company, а не к пользователю. Это критично для кафе/цеха с текучкой персонала.

2. **Substitution как first‑class concept**  
   Horecom не заменяет товар тихо: каждая замена — отдельное предложение в интерфейсе и WhatsApp, с таймером и учётом разницы в цене.

3. **Предиктивная подписка**  
   Цель — не просто "подписка", а уменьшение вероятности сток‑аута. Алгоритм считает средний интервал между заказами и заранее предлагает дозакуп.

4. **Групповые закупки с защищённой экономикой**  
   При создании группы цена фиксируется и не меняется для участников, даже если поставщик поднял прайс. Риск берёт на себя Horecom.

5. **AI‑orderable с первого дня**  
   Слой `llms.txt`, Schema.org и UCP/MCP‑интеграции делается не пост‑фактум, а как часть архитектуры V1.

## 2.5 Как этим пользоваться для презентаций

- **Product Overview slide**: взять раздел 2.1, добавить картинку с тремя сегментами и тремя режимами.
- **Roadmap slide**: таблица Sprints 1–5/6 для V1, затем V1.5 и V2.
- **Differentiation slide**: пункты в разделе 2.4, каждый с коротким примером.
