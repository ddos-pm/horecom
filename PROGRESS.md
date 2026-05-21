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

## Этап 1.5 — Интеграция v2 дизайна от Claude Design (PARTIAL — May 21, 2026)

> Из `design-final-clean/INTEGRATION_BRIEF.md` (вставка между Этапом 1 и Этапом 2 по `HORECOM_V0_BUILD_PLAN.md`). Бриф 7 шагов. По времени в одной сессии — выполнены критичные 4, остальные оставлены под V1 follow-up (см. ниже).

### Done в этой сессии
- [x] **Шаг 1 — CSS tokens.** `app/globals.css` обновлён под v2: `--c-blue / --c-orange / --c-bg-soft #FAFAF9 / --r-* / --f-display Inter Tight / --f-text Inter`, утилитарные классы `.btn .btn-primary .btn-orange .btn-ghost / .pill / .live-dot / .card-x / .input-x / .t-eyebrow / .h1 .h2 .h3 .h4 / .container-x / .img-cover / show-md / show-mobile / dark-surface`. HSL-токены оставлены как мостик для shadcn-кнопок/бейджей.
- [x] **Inter Tight шрифт** подключён через `next/font/google` в `app/layout.tsx`, проброшен в CSS через `--f-display` / `--f-text` переменные.
- [x] **Шаг 2 — Layout shell:**
  - `components/marketing/header.tsx` — server component, single-bar header (logo, nav `show-md`, search `show-md`, login, cart, hamburger `show-mobile`)
  - `components/marketing/mobile-drawer.tsx` — `"use client"`, useState/useEffect для open/close, Escape-key, body scroll lock, search + nav + контакты
  - `components/marketing/footer.tsx` — 4-колоночный footer на чёрном фоне с COMPANY data
  - `components/marketing/status-strip.tsx` — server component с live `prisma.order.count` + `product.count`; mobile 2 метрики / desktop 5
  - все стили `.hc-*` добавлены в `app/globals.css` (~250 строк новых)
- [x] **Шаг 3 — Главная.** `app/(marketing)/[locale]/page.tsx` перенесена 1:1 из `home.html` body:
  - hero (status strip + h1 «Без звонков» + product card preview из БД) → trust strip (5 чисел + бренд-полоса) → segment cards (S1/S2/S3) → categories grid (11 из БД + Весь каталог tile) → featured products (8 из БД) → operations band (flow + 4 operational seriousness items) → proof (testimonial Анары + 4 stats) → final CTA
  - `home.css` (~640 строк) extracted из `home.html` `<style>` блока + дополнения для transparent WA-buttons, cats-head, ops-eyebrow, cat-dark
  - Все ссылки через `Link` из `@/i18n/routing` (locale-aware), DB-данные через Prisma
- [x] **Шаг 7 — Mobile kbd hide.** `.kbd-shortcut { display: none }` под `@media (max-width: 767.98px)` в globals.css.
- [x] **Логотипы** обновлены из v2 (`logo-horizontal.png`, `logo-horizontal-transparent.png`, `logo-mark.png`)
- [x] **Build clean:** 32 routes, middleware 122 kB

### Deferred to V1 follow-up
- [ ] **Шаг 4 — Каталог по v2.** Текущая страница `app/(marketing)/[locale]/catalog/page.tsx` функциональна (QuickAddButton, поиск из URL, рендер из БД), но не имеет v2-layout (sidebar filters, view toggle, sort dropdown). HTML `catalog.html` (1021 строка) → переписать с client-component `catalog-client.tsx` + URL-driven фильтры + sort.
- [ ] **Шаг 5 — PDP по v2.** Текущая `app/(marketing)/[locale]/product/[slug]/page.tsx` работает (AddToCartButton, JSON-LD, volume tiers), но не имеет v2-layout (photo gallery slider, расширенная volume tier table). HTML `product.html` (821 строка) → перенести.
- [ ] **Шаг 6 — Subscription + Group Buying landing по v2.** Текущие лендинги функциональны (форма-запрос, waitlist), но не имеют v2-визуала (predictive chart с Кофейней «Куст» в subscription; live-group card с countdown в group-buying). HTML `subscription.html` (955) + `group-buying.html` (944) → перенести SVG charts + countdown widget.

### Source design package
- `design-final-clean/horecom/*.html` — все 5 mockups + assets/{tokens.css, layout.js, catalog.js, logos}
- `design-final-clean/INTEGRATION_BRIEF.md` — бриф с пошаговой инструкцией
- Папка в `.gitignore` — на диске, не в репо (484KB статики мокапов).

## V0 Plan — Этап 9: Deploy на Vercel (LIVE — May 21, 2026)

### Production
- [x] **Live URL:** https://horecom-platform-eosin.vercel.app
- [x] Vercel scope: `dd-osaman-s-projects` (co-founder)
- [x] GitHub: `ddos-pm/horecom` (13 коммитов от skeleton до design v2)
- [x] Supabase Postgres подключён через Transaction pooler `aws-1-ap-northeast-1` (Tokyo, IPv4 proxy)
- [x] `DATABASE_URL` (6543, `pgbouncer=true`) + `DIRECT_URL` (5432, для миграций)
- [x] 7 env vars в Vercel production
- [x] Next.js 15.5.18 (CVE-патч, Vercel требует 15.5.x+)
- [x] GitHub auto-deploy подключён к Vercel project (push → auto-build)
- [x] Supabase Auth URL Configuration обновлён (Site URL + Redirect URLs включают production)
- [x] Vercel Deployment Protection выключен (production URL публичный для grant reviewers)

### Smoke test (passed 2026-05-21)
- [x] `/` → redirect `/ru` (200, 144KB)
- [x] `/ru/catalog` → 200, 1.3MB, реальные 190 SKU из БД
- [x] `/ru/subscription` → 200, 96KB
- [x] `/ru/group-buying` → 200, 165KB
- [x] `/kz` → 200, локаль работает
- [x] `/cart`, `/login` → 200
- [x] v2 markers в HTML: hc-header, hc-drawer, hc-footer, hero-status, trust-grid, segs, cats, prods, ops-band, cta-strip, Operational seriousness

### Deferred (manual, не блокеры)
- [ ] Custom domain (например `app.horecom.kz`) — ждёт решение от co-founderа
- [ ] менеджер admin: `UPDATE "User" SET "isAdmin"=true WHERE email='***REMOVED***';` — после её первого magic-link логина

## Этап X — MCP server (DONE — May 21, 2026)

> Из `MCP_SERVER_BRIEF.md` — добавляется между Этапом 4 и Этапом 6 по новому ТЗ.
> Цель: сделать Horecom доступным как MCP-сервер для AI-агентов (Claude Desktop, ChatGPT, Cursor, Gemini).

### Endpoints (production live)
- `GET  /api/mcp/manifest.json` — server metadata
- `GET  /api/mcp/tools` — каталог из 6 tools с JSON Schema
- `POST /api/mcp/call` — выполнить tool

### 6 tools реализованы
- [x] `search_products` — full-text search в каталоге с фильтрами (category/brand/stock)
- [x] `get_product` — detail by slug + volume tiers + inventory
- [x] `check_inventory` — SKU stock check + alternatives suggestion
- [x] `get_volume_pricing` — tier pricing с recommendation
- [x] `find_similar` — V0 heuristic (category + brand + price proximity); pgvector embeddings — V1 follow-up
- [x] `create_draft_order` — создаёт `DRAFT_PENDING_CONFIRMATION` Order с WhatsApp deep link для customer'а

### Schema
- [x] Migration `20260521040000_mcp_server` применена: новый OrderStatus `DRAFT_PENDING_CONFIRMATION`, новое `Order.agentMetadata JSONB`, новая модель `McpCall` для аналитики
- [x] `Order.source = "MCP_AGENT"` для отслеживания агент-инициированных заказов

### Infrastructure
- [x] `lib/mcp/tools.ts` — все 6 handlers с Zod validation
- [x] `lib/mcp/rate-limit.ts` — in-memory 60 req/мин/IP
- [x] `lib/mcp/logger.ts` — best-effort McpCall persistence для аналитики
- [x] `@modelcontextprotocol/sdk` installed
- [x] Local smoke test pass: search_products вернул 7 продуктов по запросу "сгущ"
- [x] Build clean (35 routes, MCP endpoints видны)

### Test через Claude Desktop
В Claude Desktop → Settings → Developer → Edit Config добавить:
```json
{
  "mcpServers": {
    "horecom": {
      "url": "https://horecom-platform-eosin.vercel.app/api/mcp"
    }
  }
}
```
После restart — «Search Horecom for сгущёнка» вызовет `search_products` tool.

### V1 follow-ups
- [ ] pgvector extension в Supabase + embeddings generation (`scripts/generate-product-embeddings.ts` готов в брифе)
- [ ] Перейти на native MCP wire format (JSON-RPC over SSE) — текущий REST-style API совместим для demo

## Этап 1.5 — Catalog v2 (DONE — May 21, 2026)

- [x] `(marketing)/[locale]/catalog/page.tsx` — переписан под v2 layout
- [x] Sidebar с категориями (live counts из БД) + stock + mode toggles (Subscription/Group)
- [x] cat-head: breadcrumb + h1 + live-data sub + toolbar (search/filter/sort/view-toggle) + active filter chips
- [x] Product cards в card-img + card-info + card-data (MOQ/Стек/Кат) + card-bot (price + QuickAddButton)
- [x] URL-driven фильтры (`?category=`, `?subscription=true`, `?group=true`, `?q=`)
- [x] `catalog.css` extracted из v2 mockup (387 lines)

## Этап 1.5 — Subscription v2 (DONE — May 21, 2026)

- [x] Hero с S2-eyebrow + h1 «Доставляем до того как у вас закончилось» + CTAs + meta
- [x] **Predictive timeline SVG chart** — Кофейня «Куст», 10 weeks stock-level, delivery dots, dashed forecast, confidence band, next-delivery callout (flagship visual)
- [x] WhatsApp flow: device mockup с 3-кнопочной карточкой + 5-step explanation
- [x] Comparison band: Subscription vs One-off (−14.3% savings на 12-SKU basket)
- [x] SubscriptionRequestForm preserved at `#request` anchor
- [x] `subscription.css` 420 lines extracted из v2 mockup

## Этап 1.5 — Group-Buying v2 (DONE — May 21, 2026)

- [x] Hero dark surface (grid-bg + glow) с V1.5 pilot pill + h1 «Опт на пятерых»
- [x] **Live group demo card** с product photo, prices (strike/new/save), progress bar 4/6, avatar stack
- [x] **LiveCountdown client component** — `setInterval`/`useState` real-time countdown к target date (2 дня 14 часов)
- [x] 4-step «Как это работает» с mock screens (последний в success green)
- [x] Economics band: 3 big stats (−18%, 4–6, 3 дня) + price calculator (розница vs опт = −58 800₸/год на муке)
- [x] GroupBuyWaitlistForm preserved at `#waitlist`
- [x] `group-buying.css` 459 lines extracted + helper classes

## Этап 1.5 — PDP v2 (DONE — May 21, 2026)

- [x] Breadcrumb по category slug
- [x] **Gallery** (client component) с thumbnail row + main image, click-to-swap, fallback на logo-mark
- [x] Brand line + h1 + colored stock pill + sub/group/storage badges
- [x] Price block с volume tier table (current row подсвечен, экономия %)
- [x] AddToCartButton (existing) + WhatsApp CTA + MOQ note
- [x] Ops summary + trust line (3 rows) + specs grid + policy callout + related grid
- [x] JSON-LD Product + BreadcrumbList preserved; locale-aware Links
- [x] `product.css` 480 lines extracted из v2 mockup

## Этап 1.5 СТАТУС: 5/5 v2-страниц DONE
- home, catalog, product, subscription, group-buying — все в production через auto-deploy

## Grant-readiness fixes (DONE — May 21, 2026)

> 6 пунктов критики Дияра + bonus fixes. Production verified.

### Step 1 — Duplicate cleanup ✅
- `Copy: DECOL` (HC-FOOD-0088) удалён из БД и из `prisma/products.json`
- 189 active products (было 190 с duplicate)
- Seed уже был idempotent (upsert по slug) — duplicate не вернётся при re-seed

### Step 2 — Inventory seed ✅
- `scripts/seed-inventory.ts` — hash-based distribution: 30% out / 50% medium (10-50) / 20% high (50-200)
- 119/189 products в наличии после запуска
- Idempotent (upsert keyed on productId)

### Step 3 — i18n unit names ✅
- `lib/units.ts` mapper: piece/pcs/unit → шт, pack → уп, kg → кг, l → л, g → г, ml → мл (+ kz варианты)
- Заменено в 4 местах: hero card / catalog cards / PDP / cart toast
- «0 piece» bug на главной → «0 шт»

### Step 4 — Product enrichment ⏸️
- Скрипт `scripts/enrich-products.ts` готов (Claude Sonnet, 5 полей, dry-run + force)
- Заблокирован на `ANTHROPIC_API_KEY` в .env.local

### Step 5 — Embeddings ⏸️
- pgvector extension + Product.embedding column + HNSW index уже на проде
- Скрипт `scripts/generate-product-embeddings.ts` готов (OpenAI text-embedding-3-small)
- MCP `find_similar` авто-переключится на pgvector когда embeddings сгенерируются
- Заблокирован на `OPENAI_API_KEY`

### Step 6 — Volume pricing seed ✅
- `scripts/seed-volume-pricing.ts` ставит wholesale tier на каждый Price:
  - Top 15 (по minOrderQty desc) → threshold 10, −10%
  - Остальные 174 → threshold 4, −5%
- MCP `get_volume_pricing` теперь возвращает реальные tiers + recommendation
- PDP volume tier table перестала быть пустой

### Bonus 1 — Cyrillic search fix ⭐
- `buildSearchStems()` в MCP `search_products` handles:
  1. Declension: «сгущёнка» → также `сгущ` prefix → matches «Сгущённое/сгущёнки/сгущёнкой»
  2. ё↔е spelling: query с ё ↔ stored без ё (и наоборот)
  3. Multi-word: «Barry Callebaut» → OR per-word, finds любой из слов
- «сгущёнка» raw 0 → 7 hits

### Bonus 2 — Rate limit DB-backed ⭐
- In-memory `Map` не работает в serverless (Vercel routes между cold-start instances)
- `lib/mcp/rate-limit.ts` теперь async + DB count from McpCall таблицы
- Fast-path in-memory bucket остался как soft pre-deny
- 60 req/min/IP — true cross-instance limit через `prisma.mcpCall.count({ ip, createdAt: { gte: 60s ago } })`

### Bonus 3 — Stable production URL ⭐
- `horecom-platform-eosin.vercel.app` (Vercel project alias) вместо per-deploy hash URLs
- `PUBLIC_BASE_URL` constant + `productUrl(slug)` helper в MCP tools.ts
- При подключении custom domain (horecom.kz) — поменять только env var, без rebuild

### Production smoke verified
- `search_products('сгущёнка')` → 7 hits
- `search_products('шоколад')` → 37 hits
- `get_volume_pricing(HC-FOOD-0098)` → base 1800 ₸ + tier 4+ = 1710 ₸ (−5%) + recommendation
- `check_inventory(HC-FOOD-0098, 3)` → can_fulfill: true, available: 36
- `find_similar(HC-FOOD-0098)` → 3 DECOL substitutes (heuristic, score 0.8)
- `create_draft_order` → HC-73426586 с status DRAFT_PENDING_CONFIRMATION + WA deep link

## AI этапы (groundwork DONE, runtime — отложено)

### Готово в коде (commits `4c6d00b`, `296cd80`)
- [x] **Schema migration `20260521050000_product_enrichment_fields`** применена: Product.{brandResolved, descriptionExtended, useCases, composition, storageInfo, enrichedAt, embedding}
- [x] **pgvector extension** включён в Supabase + Product.embedding vector(1536) + HNSW cosine index через `prisma db execute scripts/enable-pgvector.sql`
- [x] **`scripts/enrich-products.ts`** — Claude Sonnet, 5 полей, --dry-run, --sku, --limit, --force; safe prompts (returns null when uncertain)
- [x] **`scripts/generate-product-embeddings.ts`** — OpenAI text-embedding-3-small (1536 dim) + raw SQL update Product.embedding
- [x] **`lib/mcp/tools.ts findSimilar`** — auto-uses pgvector если embeddings есть, fallback на heuristic
- [x] **`docs/MCP_INTEGRATION.md`** — полная инструкция для co-founderа (curl tests, Claude Desktop config)
- [x] **PUBLIC_BASE_URL** centralized — `productUrl(slug)` helper читает из `NEXT_PUBLIC_BASE_URL` env, fallback на stable Vercel alias `horecom-platform-eosin.vercel.app`

### Runtime запуск отложен
- [ ] `ANTHROPIC_API_KEY` в .env.local + Vercel — для запуска `enrich-products.ts` (~$0.60, 15 мин)
- [ ] `OPENAI_API_KEY` в .env.local + Vercel — для embeddings (~$0.001, 2 мин)
- После добавления keys: dry-run на 1 SKU → confirm output → full enrich → embeddings → тест `find_similar` на 3 SKU (сгущёнка, сироп, шоколад)

## 🌍 Stable production URL: https://horecom-platform-eosin.vercel.app

- Это Vercel project alias, не меняется при push (в отличие от per-deploy URL с random hash)
- Все docs (MCP, README) и MCP tool responses сейчас указывают на него
- Когда подключим custom domain `horecom.kz` — поменяем только `NEXT_PUBLIC_BASE_URL` env var, без редеплоя

### Что подготовлено в коде
- [x] `vercel.json` создан: installCommand `npm install --legacy-peer-deps`, buildCommand `prisma migrate deploy && prisma generate && next build`, framework `nextjs`, region `fra1` (Frankfurt — ближе к KZ)
- [x] Все миграции в `prisma/migrations/` — будут авто-применены на prod при первом deploy

### Что нужно сделать вручную (Дияр / co-founder)

**Шаг 1: Авторизоваться в Vercel CLI (одноразово)**
```bash
vercel login
# Выбрать "Continue with Email" или "Continue with GitHub"
# Открыть письмо / браузер, подтвердить
```

**Шаг 2: Сделать первый deploy из этой директории**
```bash
cd /Users/alizhan/Desktop/horecom-platform
vercel --prod
# Vercel CLI спросит:
#   - Set up and deploy "horecom-platform"? → Y
#   - Which scope? → выбрать аккаунт co-founderа
#   - Link to existing project? → N (первый раз)
#   - What's your project's name? → horecom (или другое)
#   - In which directory is your code located? → ./ (текущая)
#   - Modify settings? → N (vercel.json уже задаёт всё)
```

**Шаг 3: Добавить env vars (через Vercel Dashboard или CLI)**

Открыть https://vercel.com/dashboard → project horecom → Settings → Environment Variables. Добавить все из `.env.local` (см. файл локально):
- `DATABASE_URL` (на pooler если знаешь регион — иначе пока direct, переключим позже)
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET` (можно ту же, можно сгенерировать новую `openssl rand -base64 32`)
- `NEXT_PUBLIC_BASE_URL=https://horecom.vercel.app` (или другой production URL который выдаст Vercel)

После добавления env vars — Vercel автоматически сделает Redeploy.

**Шаг 4: Обновить Supabase redirect URLs**

В Supabase Dashboard → Authentication → URL Configuration добавить в **Redirect URLs**:
```
https://horecom.vercel.app/auth/callback
https://*.vercel.app/auth/callback
```

(замени `horecom` на реальный slug проекта если другой)

**Шаг 5: Тестовый прогон**

1. Открой production URL
2. Пройди registration → magic link → onboarding → catalog → cart → checkout → success page
3. Если что-то падает: `vercel logs <project-url>` покажет server logs

**Шаг 6: Tag v0.0.1**
```bash
git tag v0.0.1
git push --tags
```
(но push блокирован — см. ниже)

### По-прежнему блокируется

- [!] **GitHub push** в `ddos-pm/horecom` — этот Mac авторизован как `Sariev-Alizhan`. До `gh auth login` под co-founderа (или PAT) — 9 локальных коммитов не уходят в репо. Vercel может deploy без GitHub link (через `vercel --prod` напрямую), но preview-deployments на PR не будут работать пока репо не подключён.

### V0 готовность

- [x] Sprint 0 — каркас + brand kit + 190 SKU
- [x] Sprint 1-2 — Supabase auth + onboarding + cart/checkout
- [x] Sprint 3-4 — dashboard + profile + admin
- [x] Sprint 5-6 — subscription/group-buy forms + admin panel
- [x] Sprint 7 — i18n RU/KZ
- [x] Sprint 8 — pre-deploy polish
- [ ] Sprint 9 — deploy (ready, ждёт Vercel login)

### V1 dependencies (external — после grant)

- 360dialog WhatsApp Business approval → OTP auth + template messages
- Kaspi Pay Business API approval → online payments
- Resend → real email notifications
- Native KZ-speaker review для `messages/kz.json`
- ЭСФ provider для авто-генерации счёт-фактур
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
