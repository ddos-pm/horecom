# HoreCom — Synthesis of Two Expert Specs
### Сводный анализ двух пакетов ТЗ + рекомендации | Май 2026

---

## TL;DR — что забрать в финальное ТЗ

| Решение | Откуда брать | Почему |
|---|---|---|
| Стек | **Пакет 1** | С версиями (Next.js 15, React 19, NextAuth v5, Zustand, TanStack Query, Neon) — готов к работе |
| Доменная модель | **Пакет 2** | Company как сущность (а не поле на User) — критично для B2B |
| Order status machine | **Пакет 2** | 10 состояний с `PARTIALLY_CONFIRMED` и `PICKING` — реальный procurement |
| Подписочный UX | **Пакет 2** | Паттерн "upcoming order + cutoff + edit/skip/pause" — корректнее, чем "wizard с частотой" |
| Predictive алгоритм | **Пакет 1** | Готовый код (скользящее среднее по 4 точкам) |
| Group buy механика | **Пакет 1** | Подробные corner cases, share-link шаблоны, таймер 24–72ч, lock цены |
| Activation flow + KPI | **Пакет 1** | Конкретные цели (60/40/35% по сегментам), aha-моменты |
| Дизайн-палитра | **Пакет 1** | Конкретные hex'ы + сегментные акценты (green/amber/purple) |
| CSS-токены / discipline | **Пакет 2** | `--background`, `--primary` через CSS vars — правильно для dark mode V2 |
| State matrices (каждый экран) | **Пакет 2** | Loading/empty/error/partial — явная дисциплина |
| Интеграции (Kaspi/WhatsApp/AmoCRM) | **Пакет 1** | Готовые сигнатуры функций |
| UCP / LLM SEO разделение | **Пакет 2** | Чистое разделение на 2 workstream'а как фреймворк |
| UCP / LLM SEO конкретика | **Пакет 1** | Готовый /llms.txt контент, GEO статьи, IndexNow код, MCP пример |
| DoD | **Пакет 2** | Жёсткий чек-лист для каждой фичи |
| **Scope V1 / V1.5 / V2** | **Пакет 2 (с компромиссом)** | Subscription и Group Buy в V1.5, не V1 — реалистичнее для соло-разработчика. Но для гранта нужен хотя бы один из них в V1. См. §2.7 |
| Trust layer (FAQ, SLA, реквизиты, документы) | **Пакет 2** | В V1, первоклассный модуль. У Пакета 1 размазано по другим экранам |
| Urgent reorder flow | **Пакет 2** | Отдельный flow с fast-delivery eligible SKU. Пакет 1 только трекает событие |
| Release risks | **Пакет 2** | Явный список рисков для пресейла |

---

## 1. Где эксперты согласны (консенсус — закладывать без споров)

- **Стек:** Next.js (App Router) + Tailwind + shadcn/ui + Prisma + PostgreSQL + Vercel
- **Auth:** OTP по телефону, минимум полей при регистрации
- **БИН/ИИН не запрашивать при регистрации** — только при первом заказе
- **Каталог открыт без регистрации** (browse-only, цены могут быть скрыты)
- **3 сегмента → 3 разных дашборда**, общий каталог
- **Mobile-first**, sticky CTA, bottom sheets вместо modal
- **Цена + единица + MOQ всегда видны** (никогда не прятать)
- **Edit / Skip / Pause** — всегда на виду в карточке подписки
- **Threshold + fallback + deadline** — всегда видимы в карточке группы
- **Substitution policy** — нельзя молча подменять SKU
- **WhatsApp Business + Kaspi Pay + AmoCRM** — сохранить текущий backend-флоу
- **/llms.txt + Schema.org + robots.txt** — обязательно в V1 (это улучшает и обычный SEO)
- **UCP — отдельный workstream**, не V1
- **Loading / empty / error states** — обязательны для каждого экрана

---

## 2. Где эксперты расходятся — с вердиктами

### 2.1 Доменная модель: User-centric vs Company-centric

| | Пакет 1 | Пакет 2 |
|---|---|---|
| Подход | `User.segment` — поле на пользователе | `Company` отдельная сущность, `User.companyId`, `Address.companyId` |

**Вердикт: Пакет 2.** В B2B реально один бизнес = несколько пользователей (владелец + сотрудники). Сегмент принадлежит компании, не человеку. Адреса доставки тоже на уровне компании. Это особенно важно для S2 (memory упоминает "Staff Independence — история заказов видна без логина по QR для нового персонала") — без Company как сущности эту фичу не реализовать.

### 2.2 Order status machine

| | Пакет 1 | Пакет 2 |
|---|---|---|
| Состояния | 6: PENDING → INVOICE_SENT → PAID → IN_DELIVERY → DELIVERED → CANCELLED | 10: + WAITING_PAYMENT, CONFIRMED, **PARTIALLY_CONFIRMED**, PICKING, OUT_FOR_DELIVERY |

**Вердикт: Пакет 2.** `PARTIALLY_CONFIRMED` — критично. В реальности склад постоянно сообщает: "из 10 SKU 8 есть, 2 нет". Без отдельного состояния это превращается в кашу. `PICKING` тоже полезен: показывает клиенту, что заказ собирается, не просто "оплачен и ждёт".

### 2.3 Подписочная модель

| | Пакет 1 | Пакет 2 |
|---|---|---|
| Логика | Wizard: пользователь выбирает Frequency + Days + Time | `SubscriptionPlan` + `UpcomingSubscriptionOrder` с `cutoffAt` и `reviewRequired` |
| Predictive | Готовый код скользящего среднего | Только упомянуто "rules-based suggestions" |

**Вердикт: комбинировать.**
- За основу **UX-паттерн Пакета 2** (upcoming order с cutoff = главный экран модуля). Пользователь не "управляет подпиской" абстрактно — он работает с конкретной следующей доставкой.
- Из Пакета 1 — **алгоритм** прогнозирования + concrete cadence options (Weekly / Twice-weekly / Biweekly) как стартовый набор.
- Добавить: **default cadence для cold-start** (нет истории → еженедельно, понедельник утром).

### 2.4 Group buy

| | Пакет 1 | Пакет 2 |
|---|---|---|
| Глубина | 8 corner cases с решениями, таймер 24–72ч, share-link шаблоны, lock цены, типы групп (open/private) | Только список must-have элементов |

**Вердикт: Пакет 1.** Эта часть у Пакета 1 проработана значительно глубже. Пакет 2 даёт правильный общий принцип ("fallback всегда виден"), но не отвечает на реальные вопросы — что делать если 1 участник не оплатил, как фиксировать цену, как share-ссылка выглядит. Брать корнер-кейсы Пакета 1 целиком, плюс **`fallbackMode` enum** из Пакета 2 как поле на `GroupBuyOffer`.

### 2.5 Дизайн-палитра

| | Пакет 1 | Пакет 2 |
|---|---|---|
| Primary | Зелёный #1A6B3C | Teal #0F766E |
| Сегментные акценты | Да (green/amber/purple) | Нет |
| Способ задания | Tailwind config + hex | CSS variables |

**Вердикт: комбинировать.**
- **Палитру брать из Пакета 1** — она конкретнее и сегментные акценты — сильная идея для дифференциации дашбордов.
- **Задавать через CSS variables** как в Пакете 2 — заранее готово к dark mode V2.
- **Inter как шрифт** — оба согласны.

### 2.6 UCP / LLM SEO

| | Пакет 1 | Пакет 2 |
|---|---|---|
| Структура | Один файл, всё вперемешку: UCP + SEO + GEO + контентная стратегия | Чистое разделение на 2 workstream'а: agentic commerce + discoverability |
| Конкретика | Готовый код, OAuth scopes, MCP пример, 10 целевых GEO-запросов, IndexNow, Bing Webmaster | Принципы (UCP-001…010, LLM-001…010), acceptance criteria |

**Вердикт: комбинировать строго.**
- **Фреймворк из Пакета 2:** два независимых workstream'а с разной приоритизацией (discoverability → V1, UCP → V1.5/V2).
- **Содержимое из Пакета 1:** готовый /llms.txt, robots.txt с AI-ботами, JSON-LD шаблоны, IndexNow, GEO статьи, MCP server пример.
- **Acceptance criteria из Пакета 2** добавить в DoD.

### 2.7 Scope V1 / V1.5 / V2 (ВАЖНОЕ РАСХОЖДЕНИЕ)

| | Пакет 1 | Пакет 2 |
|---|---|---|
| V1 | Catalog + Cart + Checkout + **Subscription (S2)** + **Group Buy (S3)** + Admin | Catalog + Cart + Checkout + Orders + Reorder + **Trust Layer** + базовая аналитика |
| V1.5 | (не выделено) | **Subscription + Group Buy** |
| V2 | Mobile app, dark mode, BNPL, 1С | Омниканальный inbox, smart рекомендации, role-based features |

Это самое серьёзное расхождение. Пакет 1 хочет всё сразу. Пакет 2 говорит: catalog-first, остальное потом.

**Вердикт: гибрид с учётом гранта.**

Чистый Пакет 2 (только catalog в V1) — слабая грант-история. Catalog уже есть на Tilda, грант для дифференциации.

Чистый Пакет 1 (всё в V1 за 10 недель соло) — рискованно. DoD по 3 модулям одновременно почти невыполним.

**Рекомендация:**
- **V1 (10–12 недель):** Catalog + Cart + Checkout + Orders + Reorder + Trust Layer + **ОДИН** из двух дифференциаторов. Выбрать тот, у которого выше верифицированный спрос — по memory это подписка (S2). Group Buy → V1.5.
- **V1.5 (4–6 недель после V1):** Group Buy + Urgent Reorder flow + Subscription polish.
- **V2 (после гранта или параллельно):** UCP, mobile app, dark mode.

Альтернатива: если есть второй разработчик — Пакет 1 в исходном виде с двумя параллельными потоками (Catalog+Subscription / Group Buy).

---

## 3. Что забрать целиком (без альтернатив)

### Только в Пакете 1:
- Predictive алгоритм подписки (готовый код)
- Kaspi / WhatsApp Business / AmoCRM сигнатуры функций
- SMS провайдеры для KZ (SMSAERO / Mobizon)
- Конкретные KPI targets (Activation S1 60%, S2 40%, S3 35%; Retention D30 70%; Group Completion 50%; NPS 40)
- Aha-моменты для каждого сегмента (concrete: "цена 1200₸ → 890₸ -26%")
- Share-link шаблон для WhatsApp/Telegram
- "Demand Pooling" (3+ wishlists → автосоздание группы)
- "Trusted Circle" (recurring closed groups для постоянных кондитеров)
- "Saved Carts" для S1 (Monday order / Weekend order)
- "Multi-location" для S1 (сети кафе)
- GEO контент-стратегия (10 целевых запросов, формат "answer-first")
- IndexNow + Bing Webmaster (для ChatGPT-видимости)
- Motion specs (fly-to-cart, confetti, prog bar pulse)

### Только в Пакете 2:
- **Company как сущность** + Address как сущность Company
- **PricingMode enum** (STANDARD / SUBSCRIPTION / GROUP) — для аналитики и pricing logic
- **InventorySnapshot** как отдельная сущность с `updatedAt`
- **Document** как сущность (счета, накладные, сертификаты)
- **PARTIALLY_CONFIRMED** в order state machine
- **Substitution на уровне OrderItem** (`substituteProductId`, `substituteReason`)
- **`cutoffAt`** на подписке — критическая UX-концепция (когда уже поздно менять)
- **`reviewRequired`** флаг на upcoming order
- **State matrices для каждого экрана** (catalog/cart/orders/subscription/group)
- **Suggested shadcn/ui component map** — экономит время разработчику
- **DoD per feature** — жёстче чем у Пакета 1
- **Trust Layer как первоклассный модуль V1** — FAQ, SLA, реквизиты, документы, политика замен, политика частичной поставки
- **Urgent Reorder отдельный flow** (не путать с обычным reorder) — fast-delivery eligible SKU + ближайшее окно
- **Funnel metrics** (Search → PDP → Cart → Checkout → Handoff → Paid) для аналитики
- **FR-numbered functional requirements** (FR-001…305) — нумерация для трекинга в Jira/Linear
- **Release risks** — явный список 5 продуктовых рисков для пресейла гранта

---

## 4. Гэпы, которые не закрыли оба пакета

Это критично — попробуй обсудить с разработчиком до старта.

1. **Inventory accuracy** — оба упоминают `InventorySnapshot.updatedAt`, но **как** обновляется? Webhook от поставщика? Manual admin update? Cron-опрос? Без ответа → реальная цена / наличие будет регулярно лгать.

2. **Refund flow** — Группа не собралась → "нет холда". Но как **физически** возвращаются деньги если уже был partial hold? Kaspi требует явный refund flow.

3. **Substitution UX** — оба называют как требование, но **никто** не показывает реальный экран: где клиент видит замену, как соглашается/отказывается, как это влияет на итог заказа.

4. **WhatsApp template governance** — Meta требует pre-approved templates. Нужен список: ORDER_CONFIRMED, SUBSCRIPTION_REMINDER, GROUP_THRESHOLD, LOW_STOCK + статус approval каждого. Без этого — отправка упадёт в проде.

5. **PDPL Казахстана / data protection** — нет ни слова. Учитывая Emergent Ventures и публичность, нужен хотя бы Privacy Policy + согласие на обработку.

6. **Cold start подписки** — Predictive алгоритм Пакета 1 требует ≥2 заказов. У нового пользователя их нет. Что показывать? Дефолт: еженедельно, понедельник утром, топ-5 SKU для его подкатегории.

7. **Returns / quality complaints** — продукты могут испортиться, прийти не те, недостача. Где экран жалобы? Net 60 / возврат как у Faire упоминается в P1 бенчмарках, но **в требованиях не отражено**.

8. **Performance budget каталога** — оба говорят "FCP < 1.5s на 3G". При 500+ SKU с фото — без virtual scroll / image CDN / aggressive lazy load это нереально.

9. **PWA / push на iOS** — оба говорят "Push (web)". iOS Safari поддерживает push только с iOS 16.4+ и только если установлено как PWA. Нужно либо WhatsApp как primary канал (фактически P1 так и делает), либо честно ограничить push до Android.

10. **Admin workflow** — оба упоминают `/admin`, но ни один не описывает реальный сценарий менеджера: получил заказ → подтвердил состав → сформировал доставку → отправил WhatsApp. Без этого админка превратится в Excel.

11. **A/B инфраструктура для активации** — KPI у Пакета 1 амбициозные (60% activation S1). Без experimentation layer (PostHog / Statsig) их не достичь.

12. **Multi-language pricing/SKU** — Пакет 1 правильно указывает Inter (хорошая кириллица) + казахский в `Product.nameKz`. Но **категории, фильтры, бренды** на казахском? И **search должен искать по обоим языкам** одновременно.

13. **Error monitoring** — ни Sentry, ни Datadog, ни даже простой Vercel-аналитики. Для гранта на 6 мес это обязательно.

---

## 5. Финальные рекомендации по приоритизации

### V1 (10–12 недель, sprint plan — вариант "1 дифференциатор")

Выбран Subscription (S2) как дифференциатор V1, т.к. по memory он верифицирован первым и имеет более стабильный retention-механизм. Group Buy переносится в V1.5.

**Sprint 1 (1–2 нед) — Foundation**
- Next.js 15 + Tailwind + shadcn проект
- Prisma schema (Company-centric — из Пакета 2 + поля из Пакета 1)
- Auth: OTP по телефону (SMSAERO)
- Сегмент-онбординг (3 карточки, выбор после OTP) — но S3 видит landing "скоро" вместо Group Buy
- App shell: header + mobile bottom nav
- `/llms.txt`, `robots.txt` (AI-боты разрешены), базовые JSON-LD (Organization, WebSite)
- Sentry + PostHog с самого старта
- Privacy Policy (PDPL Казахстана) — минимальная

**Sprint 2 (3–4 нед) — Catalog + Trust Layer**
- Каталог с фильтрами + поиск (debounce 300ms)
- PDP с volume pricing tiers + Product Schema.org
- **Trust Layer (из Пакета 2):** FAQ, SLA, политика замен, политика частичной поставки, документы, реквизиты
- Trust strip на Home (логотипы клиентов, число выполненных заказов)
- Профиль компании с реквизитами и адресами (Company-centric)

**Sprint 3 (5–6 нед) — Order Core**
- Cart (Zustand) + MOQ progress
- Checkout (3 шага) + Kaspi handoff
- Order state machine из Пакета 2 (все 10 состояний)
- Orders list + детальная страница + timeline
- **Reorder + Repeat-with-changes** (S1 main flow)
- AmoCRM webhook
- WhatsApp template: ORDER_CONFIRMED (отправить на согласование Meta заранее — это занимает дни)

**Sprint 4 (7–9 нед) — S2 Subscription**
- SubscriptionPlan + UpcomingSubscriptionOrder с **`cutoffAt`** и **`reviewRequired`**
- Wizard создания + cadence options Пакета 1
- Subscription dashboard с edit/skip/pause всегда видимыми
- Cron + predictive notifications (cold-start default + алгоритм Пакета 1)
- WhatsApp template: SUBSCRIPTION_REMINDER с interactive buttons
- **Substitution UX-экран** — реализовать целиком (это гэп, оба пакета пропустили)

**Sprint 5 (10–12 нед) — Polish**
- Admin panel: orders / subscriptions (минимальная, на shadcn Table)
- Notification center
- i18n (казахский для landing/onboarding/уведомлений)
- Performance optimization (image CDN, lazy load, virtual scroll каталога)
- Returns/complaint flow (минимальный — кнопка "Проблема с заказом" → AmoCRM)
- Acceptance criteria check по DoD Пакета 2

### V1.5 (4–6 недель после V1) — S3 Group Buy
- GroupBuyOffer + GroupBuyParticipation с `fallbackMode`
- Список активных групп + карточка с прогресс-баром
- Join flow с lock цены при создании
- Create group + share-link генератор
- Все 8 corner cases из Пакета 1
- **Urgent Reorder flow** (отдельный от обычного reorder, для S1/S2 — fast-delivery SKU)
- WhatsApp template: GROUP_THRESHOLD_REACHED
- S3 онбординг разблокирован

### V2 — параллельно с V1.5 или после
- Полная UCP интеграция + MCP Server (с готовым кодом из Пакета 1)
- "Order with AI" beta entry
- BlueCart-style аналитика (траты по категориям) для S1
- Mobile app (iOS/Android)
- Dark mode
- BNPL / Net 30
- 1С интеграция

### Альтернативный план (если есть 2-й разработчик)
Параллельно с Sprint 3–5 второй разработчик строит Group Buy → V1 запускается со всеми тремя модулями, как в Пакете 1. Требует +1 человека на ~6 недель.

---

## 6. Что отдать разработчику и в каком порядке

```
SPEC_PACKAGE/
├── 00_README.md                    ← навигация + DoD (взять из Пакета 2)
├── 01_PRD.md                       ← взять из Пакета 1 (нет аналога в П2)
├── 02_UX_UI.md                     ← Пакет 1 (палитра + сегментные акценты) 
│                                     + Пакет 2 (state matrices, IA таблица, anti-patterns)
├── 03_Benchmarks.md                ← Пакет 1 (он глубже) + segment must-haves из П2
├── 04_Technical_Context.md         ← Пакет 2 как скелет (Company-centric model, enums) 
│                                     + Пакет 1 (Kaspi/WhatsApp/AmoCRM code, predictive algo)
├── 05_AI_Commerce_LLM_SEO.md       ← Пакет 2 (разделение workstream'ов) 
│                                     + Пакет 1 (готовый код, контент)
└── 06_Gaps_To_Resolve_Before_Dev.md ← 13 пунктов из секции 4 этого документа
```

**Порядок чтения для Claude Code:**
1. `00_README.md` (контекст, DoD)
2. `04_Technical_Context.md` (модель данных, page map, sprint plan)
3. `01_PRD.md` (функциональные требования)
4. `02_UX_UI.md` (компоненты, состояния, дизайн-токены)
5. `03_Benchmarks.md` (для контекста — не для копирования)
6. `05_AI_Commerce_LLM_SEO.md` (отдельные workstream'ы, не блокируют V1)
7. `06_Gaps_To_Resolve.md` (обсудить с продактом ДО написания кода)

---

## 7. Главный вывод

Пакеты дополняют друг друга, а не конкурируют:
- **Пакет 1 = продуктовая глубина** (фичи, KPI, motion, контент, интеграции, AI-стратегия)
- **Пакет 2 = архитектурная дисциплина** (модель данных, state machines, разделение слоёв, DoD)

Сильное ТЗ = архитектура Пакета 2 + продуктовое наполнение Пакета 1 + закрытые гэпы из секции 4.

Грантодателей убедит не количество фич, а **связность между сегментами и единым каталогом**: один и тот же SKU работает в трёх режимах ценности (fast order / replenishment / group buy). Это уникальное позиционирование — формулировка из Пакета 2 "единый каталог как база для трёх режимов ценности" сильнее, чем "новый сайт для оптовых закупок".
