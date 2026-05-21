# Horecom — Progress Tracker

> Living document. Update this every time something ships or unblocks.
> Format: `[ ]` = todo, `[x]` = done, `[~]` = in progress, `[!]` = blocked

> **V0 plan locked 2026-05-21:** `HORECOM_V0_BUILD_PLAN.md` is the single source of truth.
> 9 этапов за ~8 рабочих дней. Defaults в плане non-negotiable.

## V0 Plan — Этап 0: Brand kit + Supabase + Prisma (DONE — May 21, 2026)

### Brand kit applied (from horecom-brand-kit/)
- [x] Logos copied to `public/logos/` (full/horizontal/header/mark + favicon + apple-touch + og-image)
- [x] `app/globals.css` + `tailwind.config.ts` → electric blue (#394AD4) + orange (#F18007) palette
- [x] `lib/company.ts` created — single source of truth (individual entrepreneur (details on request), ИИН ***REMOVED***, IBAN, banking)
- [x] `prisma/seed.ts` + `prisma/products.json` → 190 real SKUs from Tilda CSV export
- [x] `components/marketing/{header,footer}.tsx` with new branding + split phones (WA-only + voice-only)
- [x] `app/layout.tsx` — MarketingHeader/Footer imports + openGraph.images + icons
- [x] `app/privacy/page.tsx` — ТОО → individual entrepreneur (details on request) via `COMPANY` import
- [x] Old `components/header.tsx` and `components/footer.tsx` deleted

### Supabase + Prisma
- [x] Supabase project `gwalkelamvtdoamqnnle` provisioned
- [x] `.env.local` + `.env` populated (DATABASE_URL=DIRECT_URL on direct connection 5432; switch to pooler on Vercel deploy)
- [x] `prisma/schema.prisma` datasource updated with `directUrl`
- [x] `prisma migrate dev --name initial` → migration `20260521000350_initial` applied
- [x] `prisma.seed` block added to `package.json`
- [x] `npm run db:seed` succeeded: 11 categories, 190 products, 6 WhatsApp templates (DRAFT)

### Verification
- [x] `npm install --legacy-peer-deps` clean
- [x] `npm run dev` → HTTP 200 on /, /catalog, /product/[slug]
- [x] Home renders real categories + individual entrepreneur (details on request) + WA phone
- [x] /catalog renders 190 unique product links
- [x] PDP renders product name + SKU + ₸ symbol
- [x] `npm run build` passes (11 routes, 7 static + 4 dynamic)

### Known follow-ups (not blocking)
- [ ] Switch `DATABASE_URL` to Transaction Pooler (port 6543) on Vercel deploy — region currently unknown
- [ ] Rotate Supabase secret key after V0 ships — leaked once in session chat
- [ ] Stock quantities = 0 for all 190 products — менеджер to set via admin panel (Этап 6)
- [ ] Brands detected for only 5/190 products — manual enrichment via admin (Этап 6)

## V0 Plan — Этап 1: Route groups (marketing) и (app) (DONE — May 21, 2026)

### Structure
- [x] `app/(marketing)/` создан, 12 маршрутов перенесены (page, catalog, product/[slug], about, how-ordering-works, subscription, group-buying, delivery-and-payment, faq, privacy, llms.txt, sitemap)
- [x] `app/(app)/` создан, 9 маршрутов (cart перенесён, login + dashboard + checkout + orders + orders/[id] + profile + subscription/manage + admin как placeholders)
- [x] `app/layout.tsx` урезан до root (html + body + Inter font, без UI chrome)
- [x] `app/(marketing)/layout.tsx` создан — MarketingHeader + main + MarketingFooter + JSON-LD (Org + WebSite)
- [x] `app/(app)/layout.tsx` создан — AppHeader (компактный) + AppSidebar (desktop) + mobile bottom nav

### Components
- [x] `components/app/header.tsx` — sticky header с логотипом + cart icon + Аккаунт dropdown (placeholder, wires in Этап 2)
- [x] `components/app/sidebar.tsx` — Обзор / Заказы / Подписки / Профиль + Admin link; desktop side-nav + mobile bottom-nav

### Middleware
- [x] `middleware.ts` — placeholder для subdomain split (`app.horecom.kz`) и future auth gates
- [x] Matcher исключает `_next/static`, images, favicon, logos

### Verification
- [x] `npm run build` clean (22 routes: 12 marketing + 9 app + sitemap + middleware 31.8 kB)
- [x] `/catalog` → MarketingHeader/Footer + JSON-LD
- [x] `/cart`, `/dashboard` → AppHeader/Sidebar, no JSON-LD
- [x] Route groups path resolution working (Next.js handles `/cart` → `(app)/cart`, `/catalog` → `(marketing)/catalog` без явной маршрутизации)

### Known issue addressed
- [x] **Prisma connection drops on idle direct connection** (Supabase port 5432 закрывает idle коннекции). Added `?connection_limit=1&pool_timeout=20` to `DATABASE_URL` in `.env`/`.env.local`. Fix: switch to Transaction Pooler (port 6543) on Vercel — нужен регион проекта.

## V0 Plan — Этап 2: Auth Supabase magic link + onboarding (DONE — May 21, 2026)

### Installed
- [x] `@supabase/supabase-js@2.106.1` + `@supabase/ssr@0.10.3` (--legacy-peer-deps)

### Schema
- [x] `User.supabaseId String? @unique` добавлен + index
- [x] `User.phone String?` стал опциональным (magic link даёт только email)
- [x] Migration `20260521010000_add_supabase_auth_fields` применена (deploy, не dev — non-interactive)

### Supabase clients
- [x] `lib/supabase/server.ts` — createServerClient с `await cookies()` (Next 15 async API)
- [x] `lib/supabase/client.ts` — createBrowserClient для клиентских компонентов
- [x] `lib/supabase/middleware.ts` — updateSession + защита `/cart|/checkout|/orders|/profile|/dashboard|/subscription/manage|/admin|/onboarding`

### Pages & routes
- [x] `middleware.ts` подключает updateSession на каждый запрос (auth gates + cookie refresh)
- [x] `app/auth/callback/route.ts` — exchangeCodeForSession → find-or-create User (по supabaseId, fallback по email) → redirect (/onboarding если companyId нет, иначе на next)
- [x] `app/(app)/login/page.tsx` — client form с signInWithOtp + post-submit success state + error из ?error param
- [x] `app/(app)/onboarding/page.tsx` — 3-шаговый wizard (сегмент → компания → адрес) с локальным state
- [x] `app/(app)/onboarding/actions.ts` — server action completeOnboarding (Zod валидация, Company+Address create, User.companyId link)

### UI
- [x] `components/app/user-menu.tsx` — client dropdown с email + Профиль/Выйти
- [x] `components/app/header.tsx` — server component, читает user через supabase.auth.getUser(), показывает UserMenu

### Verification
- [x] `npm run build` clean (24 routes; middleware 87.7 kB)

### Manual steps for co-founderа/Дияра in Supabase Dashboard (BLOCKER for testing)
- [!] **Authentication → URL Configuration** → добавить в **Site URL** или **Redirect URLs**: `http://localhost:3000/auth/callback` (для local) + `https://*.vercel.app/auth/callback` (для preview deploys). Без этого magic link отдаст error.
- [ ] (полировка, не блокер) **Authentication → Email Templates → Magic Link** — перевести на русский (текст в плане Этапа 2, шаг 7)

### Known limitations (V0)
- Supabase free tier SMTP: 4 emails/hour. Для production V1 — подключить Resend.
- `/login` рендерится в `(app)` layout c AppSidebar — sidebar показывает protected ссылки для unauth user. Косметика, не блокер. Полировка в Этапе 8 если нужно.

## V0 Plan — Этап 3: Cart + Checkout + WhatsApp handoff (DONE — May 21, 2026)

### Cart store + helpers
- [x] `lib/cart-store.ts` — Zustand с `persist` middleware (localStorage), CartItem, addItem (с MOQ auto-bump), updateQuantity, removeItem, clear; helpers: getCartSubtotal, getDeliveryFee (1000₸ ниже 30к, free от 30к), getCartTotal, getCartWarnings, CART_LIMITS
- [x] `lib/email.ts` — STUB sendOrderConfirmation / sendOrderToManager (console.log; TODO V1 Resend)

### Add-to-cart UI
- [x] `components/cart/add-to-cart-button.tsx` — PDP вариант: qty selector (шаг = MOQ) + "Добавить в корзину" + sonner toast
- [x] `components/cart/quick-add-button.tsx` — каталог вариант: моментальное добавление MOQ + toast
- [x] PDP (product/[slug]/page.tsx) — заменён placeholder Button на AddToCartButton; WhatsApp "Спросить" остаётся отдельно
- [x] Catalog (catalog/page.tsx) — карточки теперь рендерят next/image с реальным фото с Tilda CDN + QuickAddButton под Link
- [x] next.config.ts — добавлены domains `static.tildacdn.com` и `thb.tildacdn.com`
- [x] `<Toaster richColors />` подключён в обоих layout (marketing и app)

### /cart page (replaced placeholder)
- [x] Список позиций с фото, qty controls (±MOQ), удалить
- [x] Sticky summary справа (mobile: внизу): Subtotal / Доставка / Итого + warnings (минимум 5000₸ / до бесплатной доставки X₸)
- [x] Empty state с CTA "Открыть каталог"
- [x] "Оформить заказ" disabled когда subtotal < 5000₸

### /checkout (3-section, single page)
- [x] `checkout/page.tsx` — server component, авторизация + onboarding guards + read addresses
- [x] `checkout/form.tsx` — client; 3 секции: Адрес+время (7-day picker + 3 slots + comment) → Substitution preference (ASK / SAME_BRAND_ONLY / NEVER + сохраняется в Company) → Оплата ЗАГЛУШКА (single option "Договоримся при подтверждении")
- [x] Sticky summary с subtotal/delivery/total + error surface

### POST /api/orders
- [x] `app/api/orders/route.ts` — Zod валидация, auth gate, address ownership check, price snapshot, atomic Order + OrderItems create, Company.substitutionPreference update, email stubs, возвращает orderId
- [x] OrderNumber формат: `HC-{8 digits unix}`
- [x] Initial OrderStatus = `CREATED` (платёж не онлайн, не WAITING_PAYMENT)

### /orders/[id]
- [x] Server component; auth + company-scope доступ (чужой → notFound)
- [x] `?just_created=true` → большой success-блок c "Открыть чат в WhatsApp" (deep link c pre-filled текстом про номер заказа) + anchor "Посмотреть детали"
- [x] Статус-таймлайн (5 этапов CREATED → CONFIRMED → PICKING → OUT_FOR_DELIVERY → DELIVERED), скрыт для CANCELLED
- [x] Items list с фото и snapshot цен/названий
- [x] Address + delivery window + comment block
- [x] Кнопки: ReorderButton (клон в корзину → /cart) + Open WhatsApp

### /orders list
- [x] Server-rendered, only own company orders, sort by createdAt desc, take 50
- [x] Cards с number + status badge + создан + count позиций + total
- [x] Empty state с CTA "Открыть каталог"

### Verification
- [x] `npm run build` clean (25 routes: marketing + app + /api/orders; middleware 87.7 kB)
- [x] /cart 3.59 kB, /checkout 5.5 kB, /orders/[id] 3.53 kB — реалистичные размеры

### Limitations (V0, addressed in later этапах)
- Cart icon in app/marketing headers нет badge с count (плана это не требует, mini-polish в Этапе 8)
- Email уведомления — только console.log (Resend integration в V1)
- Substitution flow в админке без email клиенту — менеджер связывается через WhatsApp (V1)

## V0 Plan — Этап 4: Личный кабинет + Профиль + адреса (DONE — May 21, 2026)

### /dashboard
- [x] `dashboard/page.tsx` — server component, читает companyName, last order, active subscription, последние 5 заказов
- [x] 3 карточки: LastOrderCard (с CTA "Открыть" или "Сделать первый") / SubscriptionCard (status + nextDelivery или CTA "Подключить") / CartCard (client, Zustand-aware)
- [x] Last 5 orders inline list + "Все заказы →"
- [x] Welcome toast (?welcome=true) после онбординга

### /profile (3 секции)
- [x] CompanyForm (client + useTransition) — name, БИН/ИИН, segment (read-only с пояснением), substitutionPreference (select)
- [x] AddressList (client) — список + Add/Edit/Delete/SetDefault + модалка-редактор
- [x] ContactForm (client) — email (read-only из Supabase), name, phone

### actions.ts
- [x] `updateCompany` — Zod, обновляет name/binOrIin/substitutionPreference
- [x] `updateContact` — Zod, обновляет User.name/phone
- [x] `upsertAddress` — create or update (с проверкой ownership)
- [x] `deleteAddress` — guard: если адрес используется в заказах → 400; авто-promote другого как default если удалён default
- [x] `setDefaultAddress` — транзакция: всем false, выбранному true
- [x] revalidatePath после каждой мутации (/profile + /dashboard + /checkout)

### /subscription/manage
- [x] Server-rendered, по companyId
- [x] Empty state с CTA "Оформить подписку"
- [x] List planов: cadence badge + status badge + nextDeliveryDate + items с defaultQty
- [x] Info banner про ручную обработку в V0 + ссылка "Подать ещё запрос"

### Verification
- [x] `npm run build` clean (26 routes, /dashboard 3.03 kB, /profile 4.75 kB)
- [x] Server actions используют revalidatePath, без full refetch

### Limitations (V0)
- Address.createdAt отсутствует в schema → orderBy уюзаем `[isDefault desc, id asc]` (cuid примерно time-sortable). Если потребуется истинная сортировка по времени — миграция в V1.

## V0 Plan — Этап 5: Subscription request + Group Buy waitlist (DONE — May 21, 2026)

### Schema
- [x] Новая модель `GroupBuyInterest` (email + phone? + companyId? + productIds[] + message? + processedAt/By) с индексами по createdAt и companyId
- [x] `Company.groupBuyInterests GroupBuyInterest[]` обратное отношение
- [x] Migration `20260521020000_add_group_buy_interest` применена

### Server actions
- [x] `app/(marketing)/subscription/actions.ts` → submitSubscriptionRequest (Zod validation, auth+company guard, создаёт SubscriptionPlan со status REVIEW_REQUIRED + items с defaultQty=MOQ; days/timeOfDay укладываются в notes)
- [x] `app/(marketing)/group-buying/actions.ts` → submitGroupBuyInterest (Zod, доступно anonymous; companyId автоматически если залогинен)

### Reusable component
- [x] `components/product-picker.tsx` — клиентский ProductPicker с поиском по name/brand/sku + scrollable checkbox list

### /subscription (public)
- [x] Async server component, читает products + auth state
- [x] "Подать запрос" button скроллит к #request
- [x] `request-form.tsx` (client) — guard auth (если нет → "Войти" CTA), ProductPicker + cadence select + days toggle group (Пн-Вс) + time of day select + комментарий
- [x] On success → toast + redirect на `/subscription/manage`

### /group-buying (public)
- [x] Async server component, читает products + (опционально) user email
- [x] "Записаться в пилот" button скроллит к #waitlist
- [x] `waitlist-form.tsx` (client) — email (required, default из session) + phone + ProductPicker (optional) + message; работает для anonymous
- [x] On success → success card "Спасибо, свяжемся когда соберём первую группу"

### Verification
- [x] `npm run build` clean (/subscription 4.06 kB, /group-buying 3.53 kB)
- [x] Submission заявок создаёт корректные записи в БД через server actions

## V0 Plan — Этап 6: Минимальная админка (DONE — May 21, 2026)

### Schema
- [x] `User.isAdmin Boolean @default(false)` + index
- [x] Migration `20260521030000_add_user_is_admin` применена
- [!] **Manual step required:** в Supabase SQL editor выполнить `UPDATE "User" SET "isAdmin" = true WHERE email = '***REMOVED***';` (только после того как менеджер залогинится хотя бы раз — её User row должен существовать)

### /admin layout
- [x] `app/(app)/admin/layout.tsx` — auth + isAdmin guard (non-admin → notFound 404)
- [x] Sidebar: Заказы (badge: count CREATED/WAITING_PAYMENT/CONFIRMED), Каталог, Подписки (badge: REVIEW_REQUIRED), Group Buy (badge: unprocessed interests)
- [x] `/admin` → redirect на `/admin/orders`

### /admin/orders
- [x] Server-rendered таблица: number / client / total / status badge / created / actions
- [x] Filter pills по статусу (default — non-final активные)
- [x] `actions.ts`: updateOrderStatus + updateItemStatus + proposeSubstitute (Zod, requireAdmin gate, revalidatePath)
- [x] `row-actions.tsx`: статус-aware dropdown с next-state опциями

### /admin/orders/[id]
- [x] Header с статус badge + status controls (status-aware кнопки: Подтвердить / В сборку / В доставку / Доставлен / Отменить)
- [x] Items list с item-status badge + inline controls: ✓ Подтвердить / Нет в наличии / Замена / Отменить
- [x] `item-controls.tsx`: модалка-панель с ProductPicker (max=1) для предложения замены + reason input
- [x] Sidebar с клиентом, адресом, доставкой, итогами, substitutionPreference

### /admin/catalog
- [x] Поиск (name/brand/SKU) + фильтр по категории + пагинация по 50
- [x] Таблица: товар / бренд (inline edit) / категория / сток (inline edit + status badge) / активен (toggle)
- [x] `actions.ts`: updateStock (создаёт/обновляет InventorySnapshot с auto-status: IN_STOCK / LOW_STOCK / OUT_OF_STOCK по правилу <10 / >0 / 0) + updateProduct (brand + isActive)

### /admin/subscriptions
- [x] Список всех планов, REVIEW_REQUIRED первыми
- [x] Каждый план: company name + status badge + cadence + email + notes (где запросные параметры)
- [x] `actions.ts`: changeSubscriptionStatus (ACTIVE / PAUSED / CANCELLED)
- [x] Кнопка WhatsApp deep-link на телефон владельца с pre-filled текстом

### /admin/group-buy-interests
- [x] Список заявок, processed=null первыми; processed → opacity-60
- [x] Каждая заявка: email + phone + company? + status badge + product names + message
- [x] `actions.ts`: markInterestProcessed (processedAt + processedBy) + unmarkInterestProcessed (revert)
- [x] Buttons: Email (mailto), WhatsApp (deep-link), Mark processed / Undo

### Verification
- [x] `npm run build` clean (30 routes, 5 админских)
- [x] Non-admin user → notFound на /admin/*

## V0 Plan — Этап 7: Локализация RU/KZ для (marketing) (DONE — May 21, 2026)

### Setup
- [x] `next-intl@4.x` установлен (--legacy-peer-deps)
- [x] `i18n/routing.ts` — defineRouting locales=['ru','kz'], defaultLocale='ru', localePrefix='always' + createNavigation helpers (Link, redirect, usePathname, useRouter)
- [x] `i18n/request.ts` — getRequestConfig load messages/{locale}.json
- [x] `next.config.ts` — createNextIntlPlugin wrapper
- [x] `middleware.ts` — chain: app paths → updateSession (auth), marketing paths → intlMiddleware (locale routing)

### Structure
- [x] Move (marketing)/* → (marketing)/[locale]/*: page, about, catalog, delivery-and-payment, faq, group-buying, how-ordering-works, privacy, product, subscription
- [x] (marketing)/[locale]/layout.tsx async — hasLocale validation + setRequestLocale + NextIntlClientProvider + header/footer/Toaster + JSON-LD + generateStaticParams
- [x] llms.txt и sitemap остались в (marketing)/ (не локализованы)

### Translations
- [x] `messages/ru.json` — полный, ~85 ключей (header, footer, home segments/categories, catalog filters/stock, product labels, subscription/group landing CTAs, common UI)
- [x] `messages/kz.json` — draft переведённый, с `_TODO_REVIEW` флагом для native review (особенно: коммерческие/гастрономические термины, юр.формулировки)

### Header / Footer
- [x] MarketingHeader использует Link из @/i18n/routing + getTranslations("header") — auto-prefix /ru или /kz для каталога/подписки/корзины
- [x] MarketingFooter — getTranslations("footer"), все ссылки через locale-aware Link
- [x] `components/marketing/language-switcher.tsx` — client switcher Русский/Қазақша, replace pathname с новым locale

### SEO
- [x] sitemap.ts с alternates.languages — каждая страница в /ru и /kz, hreflang='kk' для KZ, 'ru' для RU
- [x] Build clean: /ru/* и /kz/* prerender'ятся через generateStaticParams (SSG)

### Verification
- [x] `npm run build` clean (32 routes; middleware 122 kB с next-intl)
- [x] curl: `/` → 200 на `/ru`, `/ru/catalog` → 200, `/kz/catalog` → 200, `/cart` → 200 после auth redirect

### V0 limitations (V1 follow-ups)
- Long-form prose внутри страниц (About, FAQ, Privacy, Subscription/Group landing tex, How-Ordering-Works) остаётся RU в JSX. KZ-варианты — TODO для native speaker review.
- Root html lang=ru фиксирован (app routes — RU only). На /kz/* пользователь видит KZ контент, но `<html lang>` остаётся "ru". Hreflang в sitemap корректные — для search engines достаточно.
- Internal Links в long-form страницах используют next/link с href="/catalog" — intl middleware редиректит на /{locale}/catalog (308). Производительно меньше, чем locale-aware Link, но работает.
- App pages → marketing links (например /cart → /catalog button) проходят через intl redirect → /ru/catalog. Косметика.

## V0 Plan — Этап 8: Pre-deploy polish (DONE — May 21, 2026)

### Polish
- [x] `app/not-found.tsx` — global 404 с CTA "Открыть каталог" + WhatsApp + ссылка на главную
- [x] `app/error.tsx` — global error boundary с "Перезагрузить" + WhatsApp + error.digest
- [x] `app/(marketing)/[locale]/catalog/loading.tsx` — skeleton (12 placeholder cards)
- [x] `app/(app)/orders/loading.tsx` — skeleton (5 placeholder rows)
- [x] Privacy Policy переписана — реальные данные individual entrepreneur (details on request) (legalName, ИИН, юр. + физ. адреса), убраны упоминания Neon/PostHog/Sentry/AmoCRM которых нет в V0
- [x] Sonner toasts уже подключены везде где нужно (Этапы 3-6)
- [x] Empty states покрыты (cart, orders, dashboard, subscription/manage, admin lists)
- [x] OG image (1200×630) уже в metadata (Этап 0)
- [x] Favicon в табе (Этап 0)
- [x] Старые компоненты `components/header.tsx` + `components/footer.tsx` удалены (Этап 0)

### Skipped for V0 (not blocking deploy)
- Lighthouse mobile audit (co-founder проверит на проде)
- Terms of Service — co-founder использует генератор (manual outside code)
- Полная extraction long-form контента в i18n keys (V1 follow-up)

### Verification
- [x] `npm run build` clean

## V0 Plan — Этап 9: pending

- [ ] **Этап 9** — Deploy на Vercel + v0.0.1 tag (15 мин)
- [ ] **Этап 3** — Корзина + Checkout + WhatsApp handoff (2 дня)
- [ ] **Этап 4** — Личный кабинет + Профиль + адреса (1 день)
- [ ] **Этап 5** — Subscription request + Group Buy waitlist (0.5 дня)
- [ ] **Этап 6** — Минимальная админка (1.5 дня)
- [ ] **Этап 7** — Локализация RU/KZ для (marketing) (1 день)
- [ ] **Этап 8** — Pre-deploy polish (0.5 дня)
- [ ] **Этап 9** — Deploy на Vercel + v0.0.1 tag (15 мин)

## Blockers / external dependencies

- [!] **GitHub push** to `ddos-pm/horecom` blocked — этот Mac авторизован как `Sariev-Alizhan`. Нужен `gh auth login` под co-founderа (см. memory). Локальные коммиты накапливаются, push сделаем когда auth разрулим.
- [~] **WhatsApp Business API approval (360dialog)** — нужно для перехода V0→V1 (auth + transactional). НЕ блокирует V0.
- [~] **Kaspi Pay Business API approval** — нужно для перехода V0→V1 (online payments). НЕ блокирует V0.

---

## Historic context: original V1 Sprint plan (May 19, 2026 — superseded by V0 plan)

### Sprint 0 — Foundation (DONE — May 19, 2026)

### Scaffolding
- [x] Next.js 15 + React 19 RC + TypeScript project initialized
- [x] Tailwind v3 + design tokens via CSS variables
- [x] Prisma 5.22 + full schema (Company-centric, 13 gaps closed)
- [x] Seed data: 11 categories + 16 SKUs from Tilda + 6 WhatsApp templates
- [x] Path alias `@/` configured
- [x] `.env.example` with all required vars
- [x] `.gitignore`
- [x] `--legacy-peer-deps` workaround documented

### Public pages
- [x] Layout with Inter font + Org/WebSite JSON-LD
- [x] Home page with segment-first onboarding (3 cards) + trust strip + categories + featured
- [x] Header (logo, search, cart icon)
- [x] Footer (4 cols: about, catalog menu, info, contacts with WA + IG)
- [x] Catalog page with sidebar filters + search via URL params
- [x] Product Detail Page with Product/Offer/Breadcrumb JSON-LD + volume tiers + MOQ + stock
- [x] About page
- [x] How-Ordering-Works page (operational tone, includes substitution policy)
- [x] Subscription landing
- [x] Group Buying landing (marked V1.5)
- [x] Delivery and Payment page (single source of truth — no more contradictions)
- [x] FAQ with FAQPage JSON-LD (10 questions)
- [x] Privacy Policy (PDPL-Kazakhstan compliant stub)
- [x] Cart placeholder

### AI Discoverability
- [x] Dynamic `/llms.txt` route generating from DB
- [x] `robots.txt` with GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc. whitelisted
- [x] `sitemap.xml` dynamic with all products + categories
- [x] Organization JSON-LD in root layout
- [x] WebSite JSON-LD with SearchAction
- [x] Product + Offer JSON-LD on PDP
- [x] BreadcrumbList JSON-LD on PDP
- [x] FAQPage JSON-LD on /faq

### Build verification
- [x] `npm install --legacy-peer-deps` works
- [x] `npx prisma generate` works
- [x] `npx next build` completes without errors
- [x] All 13 routes compile (7 static, 4 dynamic)

## Sprint 0.5 — Deploy + Live Data (NEXT — week of May 19)

### Infrastructure setup
- [ ] **Create Neon Postgres project** → copy `DATABASE_URL`
- [ ] **Push to GitHub** as private repo
- [ ] **Deploy to Vercel** → connect GitHub repo
- [ ] Add env vars in Vercel: `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 32`), `NEXT_PUBLIC_BASE_URL`
- [ ] Run migrations + seed against production DB
- [ ] Verify public URL works (https://horecom-platform.vercel.app)
- [ ] Decide: keep on subdomain (`app.horecom.kz`) or replace Tilda directly?

### WhatsApp setup (BLOCKS Sprint 4)
- [ ] **Register 360dialog account** for WhatsApp Business API
- [ ] **Verify Meta Business Manager** — the team's task, 1–2 days
- [ ] **Submit all 6 WhatsApp templates** from `prisma/seed.ts` → Meta approval queue (2–7 days)
- [ ] Get `WHATSAPP_API_KEY` from 360dialog → add to Vercel env

### Kaspi setup (BLOCKS Sprint 2)
- [ ] **Apply for Kaspi Pay Business API** — the team's task. 1–4 weeks. Start immediately.
- [ ] Receive `KASPI_API_KEY` + `KASPI_MERCHANT_ID` → add to Vercel env
- [ ] Decide: which payment method (Kaspi Invoice vs Kaspi Pay Direct)

### AmoCRM
- [ ] **Get AmoCRM API token** (the team, 1 day)
- [ ] Add `AMOCRM_*` vars to Vercel env

### Real product photos
- [ ] **Create Cloudinary account** (free tier OK)
- [ ] the team/co-founder to upload 30 real product photos
- [ ] Update seed.ts with real Cloudinary URLs in `imageUrl` field
- [ ] Re-seed

### Tilda data migration (3-day task)
- [ ] **Day 1:** Tilda Store → Export CSV → write `scripts/import-tilda-csv.ts` → import full catalog
- [ ] **Day 2:** AmoCRM API → `scripts/import-amocrm.ts` → seed companies + users + order history
- [ ] **Day 3:** co-founder interview → seed the 10+ existing `SubscriptionPlan` records manually

## Sprint 1 — Auth + Onboarding (Weeks 1–2 after deploy)

### Auth
- [ ] Install + configure NextAuth.js v5
- [ ] OTP endpoint: POST `/api/auth/otp/send` → calls 360dialog with `otp_verify` template
- [ ] OTP verify endpoint: POST `/api/auth/otp/verify` → creates session
- [ ] Throttling: max 3 OTP requests per phone per hour
- [ ] Track all OTP attempts in `OtpAttempt` table (need to add to schema)

### Auth UI
- [ ] `/auth/login` page with phone number input (E.164 format)
- [ ] `/auth/verify` page with 6-digit OTP input + "resend" button
- [ ] Auth middleware: redirect unauth users from `/cart`, `/profile`, `/orders`, `/subscription/manage` to `/auth/login`

### Onboarding flow (after first login)
- [ ] `/onboarding/segment` page: 3 cards (S1/S2/S3) + radio
- [ ] `/onboarding/company` page: name + BIN/IIN + business type
- [ ] `/onboarding/address` page: first delivery address
- [ ] On complete: create `Company` + `Address` + link to `User`
- [ ] Redirect to home with segment-specific tweaks

### Profile
- [ ] `/profile` page (read-only first version)
- [ ] `/profile/company` — edit company name, BIN/IIN
- [ ] `/profile/addresses` — list + add + delete addresses
- [ ] `/profile/substitution-preference` — Always Ask / Same Brand / Never

## Sprint 2 — Cart + Checkout (Weeks 3–4)

### Cart store
- [ ] Zustand store at `lib/cart-store.ts` with persistence in localStorage
- [ ] Add to cart button on PDP wired up
- [ ] Quantity selector on PDP (respects MOQ)
- [ ] "Buy now" quick-action

### Cart page
- [ ] `/cart` page rendering line items
- [ ] Editable quantities
- [ ] Remove item
- [ ] MOQ validation (warn if below product MOQ)
- [ ] Cart total validation (warn if below 5,000₸ order minimum)
- [ ] Volume tier indicator (highlight when next tier is X away)
- [ ] Substitution preference per-item override

### Checkout (3-step)
- [ ] Step 1: Cart review + warnings
- [ ] Step 2: Delivery address + slot picker (next 7 days × 3 windows)
- [ ] Step 3: Payment method (Kaspi vs Bank Transfer)
- [ ] Kaspi handoff for individual/SP customers
- [ ] Bank invoice generation for legal entities (PDF)
- [ ] Order created with `WAITING_PAYMENT` status
- [ ] Webhook from Kaspi → `PAID` → `CONFIRMED`
- [ ] AmoCRM webhook → create Deal in correct pipeline

### Order tracking
- [ ] `/orders` page list
- [ ] `/orders/[id]` detail with state timeline
- [ ] Status timeline component (10 states with current highlighted)

## Sprint 3 — Order Polish + Substitution (Weeks 5–6)

- [ ] Document generation: invoice + consignment note (PDF) → email
- [ ] Reorder button → clones order to cart
- [ ] "Reorder with changes" → opens cart with previous items, editable
- [ ] Substitution proposal flow (admin proposes from admin UI, customer sees in WhatsApp + web)
- [ ] Partial fulfillment UI (PARTIALLY_CONFIRMED state)
- [ ] Refund flow (admin → mark line item as refunded → Kaspi refund API)

## Sprint 4 — Subscription Workspace (Weeks 7–9) ⭐ V1 DIFFERENTIATOR

- [ ] `/subscription/create` wizard (cadence + days + SKUs)
- [ ] `/subscription/manage` workspace
- [ ] Upcoming orders preview (next 3)
- [ ] Cutoff timer visible
- [ ] Edit / Skip / Pause / Cancel actions (always visible, never hidden in menu)
- [ ] Cron job: 48h before next delivery → create `UpcomingSubscriptionOrder` + send WhatsApp template
- [ ] Cron job: 2h after cutoff → finalize as `Order` or skip
- [ ] Predictive cadence algorithm: rolling avg of last 4 successful orders
- [ ] Cold-start handling: weekly default until 2+ deliveries

## Sprint 5 — Admin + Polish (Weeks 10–12)

- [ ] Admin auth (separate role check)
- [ ] `/admin/orders` list + filter by status
- [ ] `/admin/orders/[id]` — full order detail + actions (substitute item, change status)
- [ ] `/admin/inventory` — quick stock update form
- [ ] `/admin/subscriptions` list of all subs with next delivery
- [ ] i18n: extract all RU strings, add KZ translations for public pages
- [ ] Performance budget verification (FCP < 1.5s, LCP < 2.5s on mobile 3G)
- [ ] Returns/complaint flow: customer triggers from order page, admin handles

## V1.5 — Group Buy + Urgent Reorder (Weeks 13–16)

- [ ] Group creation wizard
- [ ] Group share link (`/groups/[shareToken]`)
- [ ] Group join flow
- [ ] Threshold tracker UI
- [ ] Deadline countdown
- [ ] Fallback logic (group failed → solo / refund / wait)
- [ ] 8 edge cases per `docs/22-product-vision.md` §2.2
- [ ] Urgent reorder flow (S1/S2 → "deliver tomorrow morning" toggle)

## V2 — Strategic (After Almaty pilot success)

- [ ] UCP / MCP integration (agentic commerce — ChatGPT / Claude can place orders)
- [ ] Native mobile app (React Native or Expo)
- [ ] BNPL / Net 30 for select B2B customers
- [ ] Multi-city operational infra (Almaty pilot scale)
- [ ] Supplier portal (suppliers manage their own SKUs + stock)

---

## Known issues / decisions to revisit

- **`force-dynamic` on home/catalog/PDP.** Currently set to force-dynamic so build works without real DB. When deployed to Vercel with Neon, this slows TTFB unnecessarily. Switch back to ISR with `revalidate: 300` once Vercel has `DATABASE_URL`.
- **Cart page is placeholder.** No real state yet. Sprint 2 work.
- **No analytics events instrumented.** PostHog set up in env but not wired. Add `lib/analytics.ts` in Sprint 1 or 2.
- **`searchParams.q` filter is server-side only.** No client-side search-as-you-type. Sprint 2 or 3 polish.
- **Cookies for segment preference not yet implemented.** Once user picks a segment, we should remember it and personalize home page.

## Open questions for the team

- [ ] Logo high-res asset? Need PNG + SVG
- [ ] Should we keep horecom.kz domain on Tilda during V1 dev, or switch DNS once Vercel is live?
- [ ] BIN of legal entity (for invoice generation)
- [ ] Current 1С setup — what's the format of inventory export?
- [ ] Are 2 phone numbers on Tilda (+7 707 860-77-79 and +7 707 711-99-52) both active? Which is primary?
- [ ] Email `Horecomkz@gmail.com` vs `***REMOVED***` mismatch on Tilda — what's the canonical address?

---

*This is a living document. Update after every work session.*
*Last touched: May 19, 2026 — Sprint 0 complete, ready for deploy.*
