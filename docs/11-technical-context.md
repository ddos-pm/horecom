# Horecom — Technical Context (FINAL)
### Слитая версия из двух пакетов с закрытыми гэпами | Май 2026

> Этот файл — финальный технический контекст. Используется вместе с `schema.prisma` (готова к `prisma migrate dev`), `01_PRD` из Пакета 1, `02_UX_UI` (Pack 1 палитра + Pack 2 state matrices), `06_Substitution_UX_Spec.md`, `05_AI_Discoverability_Kit.md`.

---

## 1. Архитектурный mindset

Horecom — web application с тремя режимами ценности на едином каталоге:
- **Fast wholesale ordering** (S1)
- **Guided replenishment** (S2)
- **Pooled buying power** (S3)

Не маркетинговый сайт с e-commerce врезкой. Ядро: catalog, cart, orders + workspace'ы подписки и группы.

## 2. Stack

```
Next.js 15 (App Router) + React 19
TypeScript strict mode
Tailwind CSS v4
shadcn/ui (new-york preset)
lucide-react
Zustand (cart store)
TanStack Query (server state)
Prisma 5 + PostgreSQL (Neon serverless)
NextAuth.js v5 (OTP via SMS — SMSAERO / Mobizon)
Kaspi Pay API (invoice handoff)
WhatsApp Business API via 360dialog
AmoCRM Webhooks
Vercel (deploy)
PostHog (analytics)
Sentry (error monitoring)
```

## 3. Доменная модель

См. `schema.prisma`. Ключевые отличия от исходных пакетов (закрытые гэпы):

- **Company как сущность** (не поле на User). User.companyId → Company. Address.companyId. Для real B2B с несколькими пользователями.
- **`InventorySnapshot.source`** (Gap #1) — `MANUAL_ADMIN | SUPPLIER_WEBHOOK | SCHEDULED_POLL | ORDER_DEDUCTION`. Никогда не должно быть непонятно, **откуда** число пришло.
- **`OrderItem.substituteProductId/Reason/ProposedAt/ApprovedAt/ApprovedBy`** (Gap #3) — substitution как first-class. См. `06_Substitution_UX_Spec.md`.
- **`SubscriptionPlan.isColdStart`** (Gap #6) — флаг для нового плана. Пока true, predictive алгоритм не запускается, используется default cadence.
- **`SubscriptionPlanItem.avgIntervalDays`** — rolling average для predictive.
- **`UpcomingSubscriptionOrder` с `cutoffAt` + `reviewRequired`** — критическая UX-концепция.
- **`GroupBuyOffer.groupPrice` locked at creation** — corner case #3 из Пакета 1.
- **`NotificationLog` + `WhatsAppTemplate`** (Gap #4) — Meta требует pre-approved templates. Нужен трекинг approval state.
- **`Order.source`** = `WEB | UCP_AI | WHATSAPP | ADMIN` — для аналитики каналов и future UCP integration.

## 4. Page map

### Public (без auth, индексируется)
```
/                           — Home (landing с trust strip, segment cards)
/catalog                    — Browse каталога (цены могут быть скрыты)
/catalog/[slug]             — Категория
/product/[slug]             — PDP с JSON-LD Product/Offer
/about                      — О сервисе
/how-ordering-works         — Процесс заказа (для AI/LLM)
/delivery-and-payment       — Условия доставки и оплаты (для AI/LLM)
/subscription               — Что такое подписка (landing)
/group-buying               — Что такое групповая покупка (landing)
/faq                        — FAQPage JSON-LD
/auth/login                 — OTP вход
/llms.txt                   — машиночитаемое описание для LLM
/llms-full.txt              — расширенное
/robots.txt
/sitemap.xml
```

### Authenticated
```
/home                       — дашборд (сегмент-зависимый)
/cart                       — корзина
/checkout                   — оформление (3 шага)
/orders                     — история
/orders/[id]                — детали + timeline
/subscriptions              — Subscription workspace (S2)
/subscriptions/new          — создание плана
/subscriptions/[id]         — управление + upcoming order
/subscriptions/[id]/upcoming — обзор следующей доставки с cutoff
/groups                     — Group Buy workspace (S3) — V1.5
/groups/new                 — создание группы
/groups/[id]                — карточка группы
/groups/join/[token]        — join via share-link
/profile                    — профиль пользователя
/profile/company            — реквизиты компании (БИН/ИИН и т.д.)
/profile/addresses          — адреса доставки
/profile/documents          — документы (счета, накладные)
/notifications              — центр уведомлений
/help                       — FAQ + support
```

### Admin
```
/admin
/admin/orders
/admin/subscriptions
/admin/groups
/admin/products
/admin/inventory            — manual stock update + webhook log
/admin/templates            — WhatsApp templates с approval state
/admin/users
```

## 5. App shell

### Mobile (primary, ~70% трафика)
- Top header: logo (compact) + search icon + cart badge
- Bottom nav (5 items): Home / Catalog / Orders / Cart / Profile
- Sticky bottom CTA на task screens (PDP "Добавить", Cart "Оформить", Subscription "Подтвердить", Group "Вступить")
- Bottom sheets вместо modal
- Tap target ≥ 48×48px

### Desktop (~30%)
- Top header sticky: logo + global search + orders + cart + profile
- Optional left sidebar (categories) на catalog
- Right slide-over cart
- Table views для orders/admin

## 6. API контракты (краткий обзор)

Полный набор — в `01_PRD.md` Пакета 1. Ключевые endpoint'ы:

| Метод | Path | Назначение |
|---|---|---|
| POST | `/api/auth/otp/send` | Отправить OTP на телефон |
| POST | `/api/auth/otp/verify` | Проверить + получить JWT |
| GET | `/api/catalog` | Каталог с фильтрами (search, category, stock, price, group_eligible, sub_eligible, page, sort) |
| GET | `/api/products/[slug]` | PDP data: product, inventory, price tiers, alternatives, group offers, sub eligibility |
| POST | `/api/cart/items` | Add to cart |
| PATCH | `/api/cart/items/[id]` | Update qty |
| POST | `/api/checkout` | Создать заказ + Kaspi handoff |
| GET | `/api/orders` | Список |
| GET | `/api/orders/[id]` | Детали + timeline + actions |
| POST | `/api/orders/[id]/reorder` | Повторить заказ |
| POST | `/api/orders/[id]/substitution/approve` | Одобрить замену (Gap #3) |
| POST | `/api/orders/[id]/substitution/reject` | Отказаться от замены |
| POST | `/api/subscriptions` | Создать план |
| GET | `/api/subscriptions/[id]/upcoming` | Следующий заказ + cutoffAt + warnings |
| PATCH | `/api/subscriptions/[id]/upcoming` | Edit/skip |
| POST | `/api/subscriptions/[id]/pause` | Pause |
| GET | `/api/groups` | Активные группы |
| POST | `/api/groups` | Создать |
| POST | `/api/groups/[id]/join` | Вступить (qty) |
| POST | `/api/webhooks/kaspi` | Kaspi callbacks |
| POST | `/api/webhooks/amocrm` | AmoCRM sync |
| POST | `/api/webhooks/whatsapp` | WhatsApp delivery status + interactive replies |
| GET | `/.well-known/ucp.json` | UCP profile (V1.5) |
| GET | `/api/ucp/v1/catalog` | UCP catalog (V1.5) |

## 7. Алгоритм Predictive Subscription (S2)

Используется только для **не-cold-start** планов (после ≥2 успешных доставок).

```typescript
// pseudo-code
interface PredictionInput {
  itemId: string;
  orderDates: Date[]; // отсортированы по убыванию, последние 4
}

function predictNextDelivery(input: PredictionInput): Date | null {
  if (input.orderDates.length < 2) return null; // cold-start fallback
  
  const intervals = [];
  for (let i = 0; i < input.orderDates.length - 1; i++) {
    const days = differenceInDays(input.orderDates[i], input.orderDates[i + 1]);
    intervals.push(days);
  }
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const lastOrder = input.orderDates[0];
  const predicted = addDays(lastOrder, avgInterval);
  
  return predicted;
}

// Notification trigger: за 2 дня до predicted
// WhatsApp template: SUBSCRIPTION_REMINDER
// Buttons: [✅ Доставить] [📦 Изменить кол-во] [⏭ Пропустить]
```

**Cold-start default** (Gap #6): новый план → еженедельная доставка, понедельник утром, qty из последнего заказа. Через 2 успешные доставки `isColdStart` → false, включается предиктивный алгоритм.

## 8. Интеграции

### Kaspi Pay
```typescript
// POST /api/checkout вызывает:
async function createKaspiInvoice(order: Order): Promise<string> {
  const response = await fetch('https://api.kaspi.kz/business/v1/invoices', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KASPI_API_KEY}` },
    body: JSON.stringify({
      orderId: order.number,
      amount: order.total,
      currency: 'KZT',
      callbackUrl: `${BASE_URL}/api/webhooks/kaspi`,
      expiresAt: addHours(new Date(), 24).toISOString(),
    }),
  });
  return response.json().then(r => r.invoiceUrl);
}

// Callback handler обновляет Order.paymentStatus = PAID, status = CONFIRMED
```

### WhatsApp Business (360dialog)
```typescript
// Send template message (только pre-approved templates!)
async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  params: string[]
) {
  // Проверка: template.approvalStatus === APPROVED
  const template = await prisma.whatsAppTemplate.findUnique({
    where: { name: templateName, approvalStatus: 'APPROVED' },
  });
  if (!template) throw new Error(`Template ${templateName} not approved`);
  
  await fetch('https://waba.360dialog.io/v1/messages', {
    method: 'POST',
    headers: { 'D360-API-KEY': WA_API_KEY },
    body: JSON.stringify({
      to,
      type: 'template',
      template: {
        name: template.metaTemplateId,
        language: { code: template.language },
        components: [{ type: 'body', parameters: params.map(p => ({ type: 'text', text: p })) }],
      },
    }),
  });
}
```

### AmoCRM
```typescript
// POST /api/webhooks/amocrm-out — после создания Order
async function pushOrderToAmoCRM(order: Order, company: Company) {
  await fetch(`${AMOCRM_BASE}/api/v4/leads`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AMOCRM_TOKEN}` },
    body: JSON.stringify({
      name: `Заказ ${order.number}`,
      price: order.total,
      custom_fields_values: [
        { field_id: FIELD_PHONE, values: [{ value: company.users[0].phone }] },
        { field_id: FIELD_COMPANY, values: [{ value: company.name }] },
        { field_id: FIELD_ORDER_NUMBER, values: [{ value: order.number }] },
      ],
    }),
  });
}
```

## 9. Required WhatsApp Templates (Meta approval необходимо)

Отправить на согласование в Meta **заранее** — approval занимает 1–7 дней.

| Name | Kind | Body (RU) | Buttons |
|---|---|---|---|
| `order_confirmed` | ORDER_CONFIRMED | Заказ {{1}} принят. Сумма: {{2}}. Доставка: {{3}}. | View Order |
| `order_delivered` | ORDER_DELIVERED | Заказ {{1}} доставлен. Накладная в кабинете. | Получил, есть проблема |
| `subscription_reminder` | SUBSCRIPTION_REMINDER | Завтра доставим {{1}}. Подтвердите или измените. | Доставить, Изменить, Пропустить |
| `subscription_review_required` | SUBSCRIPTION_REVIEW_REQUIRED | Внимание: цена/наличие изменились по {{1}}. Откройте план. | Открыть план |
| `group_threshold_reached` | GROUP_THRESHOLD_REACHED | Группа на {{1}} собрана! Цена: {{2}}. Оплата через Kaspi. | Оплатить |
| `group_failed` | GROUP_FAILED | Группа на {{1}} не собралась. Купить по обычной цене? | Купить соло, Не сейчас |
| `substitution_review` | SUBSTITUTION_REVIEW | По заказу {{1}}: вместо {{2}} предлагаем {{3}}. Согласны? | Согласен, Отказаться |
| `price_changed` | PRICE_CHANGED | Цена на {{1}} в плане изменилась: {{2}} → {{3}}. Подтвердить? | Подтвердить, Открыть план |

Все templates → создать `WhatsAppTemplate` record с `approvalStatus = SUBMITTED`, после Meta approval → `APPROVED` + `metaTemplateId`.

## 10. State matrices

### 10.1 Catalog / PDP
- loading | success | empty results | error | partial data (часть SKU без цен)

### 10.2 Cart
- empty | ready | MOQ warning | stock warning | price changed warning | substitution review needed

### 10.3 Orders
- no orders | active order | delivered | partially confirmed | cancelled

### 10.4 Subscription
- no plan | active healthy | review required (price/stock changed) | paused | upcoming modified by user

### 10.5 Group Buy
- no offers | offer open | threshold reached | failed with fallback | user joined waiting | user fallback solo

## 11. Sprint Plan (финальный)

См. `HoreCom_Synthesis.md` §5. Краткое напоминание:

- **Sprint 1 (1–2 нед):** Foundation — Next.js + Prisma + Auth OTP + сегмент-онбординг + `/llms.txt` + Sentry/PostHog
- **Sprint 2 (3–4 нед):** Catalog + **Trust Layer**
- **Sprint 3 (5–6 нед):** Order Core — cart, checkout, Kaspi, AmoCRM, reorder
- **Sprint 4 (7–9 нед):** Subscription (S2) — plan, upcoming, cutoff, predictive
- **Sprint 5 (10–12 нед):** Polish — admin, i18n, perf, returns minimal

**V1.5 (после V1):** Group Buy (S3) + Urgent Reorder
**V2:** UCP, mobile app, dark mode, BNPL, 1С

## 12. Definition of Done (на каждую фичу)

Фича готова **только если**:
1. ✅ Happy path работает
2. ✅ Edge states реализованы (loading, empty, error, disabled, success)
3. ✅ Mobile **и** desktop версии (если применимо)
4. ✅ Semantic statuses (нет raduga из 5 бейджей)
5. ✅ Analytics events fire (см. PostHog events ниже)
6. ✅ Copy supports next step (CTA = глагол + результат)
7. ✅ Loading/error states — не placeholder'ы, а информативные
8. ✅ Accessibility: tap targets ≥ 44×44, focus order корректен
9. ✅ Если фича задевает заказ — substitution UX покрыт (см. §03)
10. ✅ Если есть уведомление — WhatsApp template `APPROVED`

## 13. PostHog events (обязательный минимум)

```
segment_selected
search_used
filter_applied
product_viewed
add_to_cart
cart_opened
checkout_started
payment_handoff_started
order_submitted
first_order_paid
reorder_started
urgent_reorder_started
subscription_offer_seen
subscription_plan_created
subscription_order_edited
subscription_review_required
substitution_proposed
substitution_approved
substitution_rejected
group_offer_viewed
group_joined
group_created
group_failed_fallback_selected

// Common props on every event:
{ company_segment, page_type, device_type, source }
```

## 14. KPI targets (из Пакета 1)

| Метрика | Target (3 мес) |
|---|---|
| Activation Rate S1 | > 60% |
| Activation Rate S2 | > 40% |
| Activation Rate S3 (V1.5) | > 35% |
| Subscription Retention D30 | > 70% |
| Group Completion Rate (V1.5) | > 50% |
| Time-to-First-Order | < 24 ч |
| NPS (после 2 нед) | > 40 |

## 15. Performance budget

- FCP < 1.5s на mobile 3G
- LCP < 2.5s
- CLS < 0.1
- INP < 200ms

Стратегия каталога:
- Image CDN (Vercel default + cloudinary fallback)
- Lazy load изображений вне viewport
- Virtual scroll если > 100 SKU в одной категории
- Prisma `select` минимально нужных полей
- Server components где возможно

## 16. Безопасность

- HTTPS everywhere (Vercel)
- OTP через SMSAERO, JWT в httpOnly cookies
- Rate limit на `/api/auth/otp/*` (5 req / 10 min per phone)
- Карты не хранятся (Kaspi обрабатывает)
- PDPL Казахстана: privacy policy + согласие на обработку (V1 минимальная версия)
- Sentry без PII (scrub phone/email из stacktraces)

## 17. Что НЕ в V1 (явно)

- Mobile native app (iOS/Android) → V2
- Доставка за пределы Астаны → после first 100 клиентов
- BNPL / кредитование → V2
- 1С / ERP интеграция → V2
- Отзывы / рейтинги → V2
- Программа лояльности → V2
- Dark mode → V2
- AI-рекомендации → V2 (только UCP / `/llms.txt` в V1)
- Group Buy → V1.5
- Multi-location для S1 → V1.5

---

**Сопутствующие файлы:**
- `schema.prisma` — drop-in Prisma schema
- `05_AI_Discoverability_Kit.md` — `/llms.txt`, `robots.txt`, JSON-LD
- `06_Substitution_UX_Spec.md` — Gap #3 closed
- `HoreCom_Synthesis.md` — обоснование каждого решения
