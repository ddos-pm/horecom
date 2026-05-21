# Horecom V0 — Финальный план для Claude Code

> **Цель:** за 7-10 дней собрать V0 платформы Horecom, которая полностью реплицирует функционал текущего сайта на Tilda, плюс наши новые фичи (segment-first, subscription request, group-buy waitlist, личный кабинет, минимальная админка), с правильной локализацией RU/KZ для публичных страниц.
>
> **Платежи и WhatsApp бот = заглушки.** Когда co-founder получит доступы (360dialog, Kaspi Pay Business) — отдельной задачей привяжем. UI и flow всё равно делаем сразу — чтобы место для интеграции было готово.
>
> **Этот файл заменяет** все предыдущие брифы (`BRIEF_FOR_CLAUDE_CODE.md`, `BUILD_PLAN.md`). Если они есть в репо — игнорируй или удали.

---

## Сначала — обязательно прочти

1. `CLAUDE.md` — мастер-контекст
2. `PROGRESS.md` — текущий статус
3. `docs/22-product-vision.md` — 3 value-modes и сегменты
4. `lib/company.ts` — реквизиты individual entrepreneur (details on request)
5. `horecom-brand-kit/README.md` — если brand kit не применён

Понял что делаем? Отвечай "go" в чате и начинай Этап 0. Если непонятно — спроси, **не угадывай**.

---

## Принятые архитектурные defaults

Это не предложения, это **зафиксированные решения**. Не релитигировать.

| # | Решение | Почему |
|---|---|---|
| 1 | **Auth: Supabase Auth (email magic link)** | Работает завтра. WhatsApp OTP заблокирован Meta-approval (1-2 недели), не блокируем V0 этим |
| 2 | **Платежи в V0: заглушка** | После checkout показываем "Заказ принят, менеджер свяжется в течение часа". Kaspi Pay API будем привязывать после approval (1-4 недели) |
| 3 | **WhatsApp бот в V0: заглушка** | НЕТ автоматических template messages. Вместо — email клиенту + кнопка "Открыть чат в WhatsApp" (deep link на менеджера). 360dialog придёт позже |
| 4 | **Subscription в V0: форма-запрос** | Клиент подаёт запрос → менеджер обрабатывает вручную через админку. Полноценный workspace (cron, predictive, WA confirmations) — V1 |
| 5 | **Group Buy в V0: waitlist** | Лендинг + форма "Хочу участвовать в первой группе". Mechanics (threshold, locked price) — V1.5 |
| 6 | **Email отправка: Supabase Auth + Supabase SMTP** | В V0 не подключаем Resend/Postmark. Supabase даёт magic link + базовые transactional emails. Перейдём на Resend в V1 когда нужны сложные шаблоны |
| 7 | **i18n: RU + KZ для marketing, RU only для (app)** | Через next-intl. KZ для софта — V1 |
| 8 | **Admin panel: минимальная** | Список заказов / смена статуса / обновление стока. Без substitution email flow в V0 — менеджер использует WhatsApp |

---

## Что строим — функциональный обзор

### Публичный лендинг (`(marketing)` route group, на `horecom.kz`)

Полная копия функционала Tilda + наши фичи:
- Главная: segment-first onboarding, trust strip, категории, featured
- Каталог: 190 SKU с поиском и фильтрами по категориям
- Карточка товара (PDP): цена, MOQ, наличие, фото, описание
- Subscription лендинг + форма-запрос
- Group buying лендинг + форма-waitlist
- About / FAQ / Доставка / Конфиденциальность
- Контакты в header/footer (WhatsApp + телефон)
- RU/KZ переключатель
- Logo + favicon + OG image

### Софт (`(app)` route group, на `app.horecom.kz` или те же роуты в V0)

- Регистрация / вход через email magic link
- Onboarding: сегмент → компания (БИН/ИИН опц.) → первый адрес
- Личный кабинет:
  - `/dashboard` — обзор: последние заказы, активные подписки
  - `/orders` — список всех заказов
  - `/orders/[id]` — детали заказа со статусом и кнопками
  - `/profile` — данные компании, адреса
  - `/subscription/manage` — список запрошенных подписок
- Корзина (`/cart`) — с MOQ валидацией
- Checkout (`/checkout`) — адрес + время + комментарий → создание заказа
- Email подтверждение клиенту + менеджер

### Админка (`/admin/*`, доступ только с `isAdmin = true`)

- `/admin/orders` — список заказов, фильтр по статусу, смена статуса
- `/admin/orders/[id]` — детализация, обработка позиций
- `/admin/catalog` — таблица товаров, inline обновление стока и бренда
- `/admin/subscriptions` — запросы на подписку (manual)
- `/admin/group-buy-interests` — waitlist на группы (manual)

---

# Этапы

Делать строго по порядку. После каждого: `npm run build` проходит → `git commit` → обновить `PROGRESS.md`. Если этап не проходит, не двигайся дальше.

---

## Этап 0 — Подготовка (2 часа)

**Цель:** проверить что среда готова и brand-kit + базовый скелет работают.

### Шаги

1. Если `horecom-brand-kit/` ещё не применён — применить по `horecom-brand-kit/README.md` (8 шагов)
2. `npm install --legacy-peer-deps` — без ошибок
3. Проверить `.env.local` — должно быть:
   ```
   DATABASE_URL=postgresql://...pooler.supabase.com:5432/postgres
   DIRECT_URL=postgresql://...supabase.com:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   AUTH_SECRET=<openssl rand -base64 32>
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```
   Если чего-то нет — спросить Дияра/co-founderа, не угадывать
4. В `prisma/schema.prisma` обновить datasource если нужно для Supabase:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```
5. `npx prisma migrate dev --name initial` — должно создать таблицы в Supabase
6. `npx prisma db seed` — должно засеять 190 SKU + 11 категорий + 6 WA templates (DRAFT)
7. `npm run dev` → открыть `localhost:3000` → проверить что главная отображается с реальными категориями и фото

### Acceptance criteria

- [ ] Главная работает, реальные категории и фото видны
- [ ] `/catalog` показывает 190 товаров
- [ ] Какой-то PDP открывается с реальным фото и ценой
- [ ] `npm run build` проходит

### Commit

```
chore(prep): verify Supabase + Prisma + brand-kit applied
```

---

## Этап 1 — Разделение архитектуры на (marketing) и (app) (1 день)

**Цель:** разделить публичный лендинг и B2B-софт на route groups с разными layouts.

### Шаги

1. **Создать `app/(marketing)/` и переместить туда:**
   - `page.tsx` (главная)
   - `catalog/page.tsx`
   - `product/[slug]/page.tsx`
   - `about/page.tsx`
   - `how-ordering-works/page.tsx`
   - `subscription/page.tsx` (это публичный лендинг подписки)
   - `group-buying/page.tsx`
   - `delivery-and-payment/page.tsx`
   - `faq/page.tsx`
   - `privacy/page.tsx`
   - `llms.txt/route.ts`
   - `sitemap.ts`

2. **Создать `app/(app)/` с placeholder страницами:**
   - `login/page.tsx`
   - `dashboard/page.tsx`
   - `cart/page.tsx` (если уже есть — перенести)
   - `checkout/page.tsx`
   - `orders/page.tsx`
   - `orders/[id]/page.tsx`
   - `profile/page.tsx`
   - `subscription/manage/page.tsx`
   - `admin/page.tsx`

3. **Layouts:**
   - `app/(marketing)/layout.tsx` — `<MarketingHeader />` + children + `<MarketingFooter />`. Включает Organization + WebSite JSON-LD.
   - `app/(app)/layout.tsx` — `<AppHeader />` (компактный, с user dropdown) + sidebar nav + children. Без JSON-LD.

4. **Создать новые компоненты:**
   - `components/app/header.tsx` — компактный, лого слева, справа user dropdown с email + "Заказы / Подписки / Профиль / Выйти"
   - `components/app/sidebar.tsx` (desktop) или mobile bottom nav — навигация по разделам кабинета

5. **Middleware для subdomain routing** в `middleware.ts`:
   ```typescript
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';
   
   export function middleware(request: NextRequest) {
     const host = request.headers.get('host') || '';
     const url = request.nextUrl.clone();
     
     // For production deployment with subdomain
     if (host.startsWith('app.')) {
       // app.horecom.kz/orders → /(app)/orders
       // Next.js route groups handle this automatically if files are in (app)
       return NextResponse.next();
     }
     
     // Default: marketing
     return NextResponse.next();
   }
   
   export const config = {
     matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
   };
   ```
   
   *Локально на `localhost:3000` route groups работают по путям: `/cart` идёт в `(app)`, `/catalog` в `(marketing)` — Next.js разруливает сам.*

### Acceptance criteria

- [ ] Открыть `/catalog` → marketing layout с MarketingHeader/Footer
- [ ] Открыть `/cart` → app layout с AppHeader
- [ ] JSON-LD есть в HTML на marketing, нет на app
- [ ] `npm run build` проходит

### Commit

```
refactor(arch): split into (marketing) and (app) route groups

- Marketing pages under (marketing) with public Header/Footer + JSON-LD
- App pages under (app) with compact AppHeader + sidebar
- Middleware ready for app.horecom.kz subdomain routing
```

---

## Этап 2 — Auth через Supabase (1 день)

**Цель:** клиент регистрируется через email magic link, проходит onboarding, получает session.

### Шаги

1. **Установить:**
   ```bash
   npm install @supabase/supabase-js @supabase/ssr --legacy-peer-deps
   ```

2. **Supabase клиенты:**
   - `lib/supabase/server.ts` — server client (для server components, route handlers)
   - `lib/supabase/client.ts` — browser client
   - `lib/supabase/middleware.ts` — для refresh session в middleware

3. **Обновить `middleware.ts`** — добавить refresh session + protected routes:
   ```typescript
   // Если path начинается с /cart, /checkout, /orders, /profile, /subscription/manage, /admin
   // И user == null → redirect на /login?redirectTo={path}
   
   // Если path == /login или /auth/* AND user != null → redirect на /dashboard
   ```

4. **Schema update** — добавить в `User` model:
   ```prisma
   supabaseId String? @unique
   ```
   Затем `npx prisma migrate dev --name add_supabase_id`

5. **Pages:**

   - `app/(app)/login/page.tsx`:
     - Input email + "Войти" кнопка
     - Submit → `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '/auth/callback' } })`
     - После: страница "Проверьте почту, мы отправили ссылку на {email}"
   
   - `app/auth/callback/route.ts` (важно — НЕ в `(app)` или `(marketing)`, в корне `app/`):
     ```typescript
     // exchange code → session
     // Find or create User in our DB linked to supabase user
     // Check if User has Company:
     //   - has Company → redirect /dashboard
     //   - no Company → redirect /onboarding
     ```

6. **Onboarding flow** — `app/(app)/onboarding/page.tsx`:
   - Single-page 3-шаговый wizard (через локальный state):
     - **Шаг 1 — Сегмент:** 3 карточки (Ресторан / Кондитерская / Самозанятый кондитер) → set `Company.segment` enum
     - **Шаг 2 — Компания:** Название (обязательно), БИН/ИИН (опционально), Город (default Astana)
     - **Шаг 3 — Адрес:** Улица, дом, этаж/офис, комментарий курьеру
   - На завершении: создать `Company` + `Address` через server action, связать с `User`
   - Redirect на `/dashboard?welcome=true` (вывести toast "Добро пожаловать!")

7. **Email шаблоны в Supabase Dashboard → Auth → Email Templates:**
   - Перевести "Magic Link" на русский:
     ```
     Subject: Вход в Horecom
     
     Здравствуйте!
     
     Кликните по ссылке ниже чтобы войти в Horecom:
     
     {{ .ConfirmationURL }}
     
     Ссылка действительна 1 час.
     
     Если вы не запрашивали вход — просто проигнорируйте это письмо.
     
     ---
     Horecom · оптовая поставка для кондитерских и HoReCa
     +7 707 860 77 79 · horecom.kz
     ```
   - Добавить логотип Horecom в email (можно ссылкой на public URL после деплоя)

8. **Sign out** — добавить в AppHeader user dropdown пункт "Выйти":
   - `await supabase.auth.signOut()` → redirect на `/`

### Acceptance criteria

- [ ] `/login` → ввести email → получить magic link
- [ ] Клик по ссылке → попадаешь на `/onboarding` (если впервые) или `/dashboard` (если уже onboarded)
- [ ] Onboarding создаёт Company + Address в БД
- [ ] Открыть `/cart` без логина → редирект на `/login`
- [ ] "Выйти" работает, после — нельзя зайти на protected роуты
- [ ] `npm run build` проходит

### Commit

```
feat(auth): Supabase email magic link + onboarding flow

- Email-based auth via Supabase (magic link in Russian)
- Middleware-protected (app) routes
- 3-step onboarding: segment → company → first address
- User model linked to Supabase via supabaseId
```

---

## Этап 3 — Корзина + Checkout (2 дня)

**Цель:** клиент добавляет в корзину, оформляет заказ, получает email-подтверждение и WhatsApp deep link.

### Шаги

1. **Zustand cart store** — `lib/cart-store.ts`:
   - Persisted в localStorage через `zustand/middleware/persist`
   - State: `items: CartItem[]` где `CartItem = { productId, slug, name, image, price, quantity, minOrderQty, packLabel }`
   - Actions: `addItem`, `updateQuantity`, `removeItem`, `clear`
   - Computed: `total`, `itemCount`, `validationWarnings`
   - При `addItem` если `qty < minOrderQty` → автоматически поднять до minOrderQty

2. **Add-to-cart UI:**
   - На PDP — кнопка "Добавить в корзину" + qty selector (шаг = MOQ)
   - На карточках в каталоге — компактная "+ В корзину" (добавляет сразу MOQ)
   - Toast уведомление: `npm install sonner`, добавить `<Toaster />` в `(app)/layout.tsx`

3. **`/cart` страница:**
   - Список позиций: фото + название + цена + qty selector + line total + кнопка удаления
   - Сводка справа (sticky на desktop, внизу на mobile):
     - Subtotal
     - Доставка (1000 ₸ если subtotal < 30 000, иначе бесплатно)
     - **Итого**
   - Warnings:
     - "Минимальный заказ — 5 000 ₸" (если subtotal < min)
     - "До бесплатной доставки осталось X ₸" (если subtotal < 30000)
   - Кнопка "Оформить заказ" → `/checkout` (disabled если subtotal < 5000)
   - Empty state: иллюстрация + "Корзина пуста" + кнопка "Открыть каталог"

4. **`/checkout` страница** — 3 секции на одной странице (accordion или stepper):

   **Секция 1 — Адрес и время:**
   - Список сохранённых адресов (radio buttons) + "Добавить новый адрес" (раскрывает форму)
   - Date picker: следующие 7 дней (исключить прошедшие)
   - Time slot select: 9:00-12:00 / 12:30-15:30 / 16:00-19:00
   - Поле "Комментарий курьеру" (опционально)

   **Секция 2 — Substitution preference:**
   - 3 радио:
     - "Всегда спрашивать перед заменой" (default)
     - "Заменять аналогом того же бренда автоматически"
     - "Никогда не заменять — отменить позицию"
   - Сохранить в `Company.substitutionPreference`

   **Секция 3 — Оплата (ЗАГЛУШКА в V0):**
   - Радио "Оплата:" но **только одна опция: "Договоримся при подтверждении"**
   - Под радио — info-блок:
     > "После оформления заказа менеджер свяжется с вами в течение часа в WhatsApp для подтверждения и расчёта. В V0 пробной версии онлайн-оплата временно недоступна — оплата либо по Kaspi-переводу, либо безналом по выставленному счёту, на ваш выбор."
   - Кнопка "Подтвердить заказ"

5. **Order creation** — `app/api/orders/route.ts`:
   - Валидация: cart не пуст, total >= 5000, все товары активны
   - Транзакционно:
     - Create `Order` со status `CREATED` (НЕ `WAITING_PAYMENT` потому что платёж не онлайн)
     - Create `OrderItem`s со snapshot цены и названия
     - Обнулить `Cart` в localStorage (через клиент)
   - Отправить email клиенту через Supabase Auth (см. шаг 6)
   - Отправить email менеджер (на `Horecomkz@gmail.com`)
   - Redirect на `/orders/[id]?just_created=true`

6. **Email-нотификации через Supabase** в V0:
   
   Supabase Auth поддерживает custom emails только для auth-related событий (magic link, etc). Для transactional (заказ принят) проще всего использовать **Supabase Edge Functions с встроенным SMTP** или просто использовать **встроенный API node-mailer + Gmail SMTP** через переменные env:
   
   Самое простое в V0 — **через Resend free tier (100 emails/день бесплатно)** — но Дияр сказал не подключать Resend. Альтернатива: использовать **Supabase Resend Integration** (Supabase сейчас интегрирован с Resend нативно).
   
   **Решение для V0:** написать `lib/email.ts` как абстракцию с TODO-комментарием:
   ```typescript
   // lib/email.ts
   // TODO V1: подключить Resend или Supabase Edge Function с реальным SMTP
   // V0: logging only — менеджер получает уведомления через WhatsApp от клиента (deep link)
   
   export async function sendOrderConfirmation(order, customer) {
     console.log('[EMAIL STUB] Order confirmation to', customer.email);
     console.log('[EMAIL STUB] Order details:', JSON.stringify(order, null, 2));
     
     // TODO V1: real send
     // const resend = new Resend(process.env.RESEND_API_KEY);
     // await resend.emails.send({ ... });
   }
   
   export async function sendOrderToManager(order, customer) {
     console.log('[EMAIL STUB] Manager notification for order', order.number);
   }
   ```
   
   В V0 это **OK** — клиент получает страницу "Заказ принят, ссылка в WhatsApp" — и сам пишет менеджер через deep link. менеджер видит заказ в админке + получает прямое WA-сообщение от клиента.

7. **`/orders/[id]` страница** — детали заказа:
   - Если URL содержит `?just_created=true` — показать большой success-блок:
     - "✅ Заказ #1234 принят"
     - "менеджер свяжется с вами в течение часа"
     - **Большая кнопка "Открыть чат в WhatsApp"** с deep link:
       ```
       https://api.whatsapp.com/send/?phone=77078607779&text=Здравствуйте! Я только что оформил заказ #1234 в Horecom. Свяжитесь со мной для подтверждения.
       ```
     - Кнопка "Посмотреть заказ" → скроллит к деталям ниже
   - Статус-таймлайн (визуально показывает где сейчас заказ)
   - Список позиций
   - Сумма / доставка / итого
   - Адрес и время
   - Кнопки: "Повторить заказ" (клонирует в корзину), "Открыть WhatsApp"
   - Доступ только если `order.companyId == user.companyId` (или `user.isAdmin`)

8. **`/orders` список:**
   - Простая таблица (на desktop) или карточки (на mobile)
   - Колонки: Номер, Дата, Сумма, Статус (badge), Открыть
   - Сортировка по дате убывания

### Acceptance criteria

- [ ] Залогиненный пользователь добавляет товар в корзину
- [ ] Корзина сохраняется при перезагрузке
- [ ] MOQ автоматически выставляется при `qty < MOQ`
- [ ] Checkout не пропускает если subtotal < 5000 ₸
- [ ] После "Подтвердить заказ" — Order создаётся в БД, redirect на `/orders/[id]?just_created=true`
- [ ] Success-страница показывает большую кнопку "Открыть WhatsApp" → ссылка ведёт на чат с pre-filled сообщением
- [ ] `/orders` показывает все заказы пользователя
- [ ] Чужой заказ открыть нельзя
- [ ] Кнопка "Повторить заказ" клонирует позиции обратно в корзину
- [ ] `npm run build` проходит

### Commit

```
feat(orders): cart + checkout + WhatsApp handoff (V0 - no online payment)

- Zustand cart store with MOQ validation and persistence
- 3-section checkout: address+time → substitution preference → payment
- Order creation with CREATED status (online payment stub for V0)
- Success page with prominent WhatsApp deep link to co-founder
- Order detail + list pages with reorder functionality
- Email stubs in lib/email.ts (logging only) — TODO V1 connect Resend
```

---

## Этап 4 — Личный кабинет + Профиль (1 день)

**Цель:** клиент видит свой dashboard, редактирует профиль компании, управляет адресами.

### Шаги

1. **`/dashboard` обзорная страница:**
   - Привет с именем компании
   - 3 карточки:
     - "Последний заказ" (с кнопкой "Посмотреть" → `/orders/[id]`)
     - "Активная подписка" (если есть `SubscriptionPlan.status == ACTIVE`) или "Подключить подписку" CTA
     - "Корзина" (количество товаров) — кнопка "Открыть"
   - Список последних 5 заказов (компактно)
   - Кнопка "Все заказы" → `/orders`

2. **`/profile` страница:**
   - Секция "Компания":
     - Название (редактируемое)
     - БИН/ИИН (редактируемое)
     - Сегмент (read-only с пояснением "связаться с поддержкой для смены")
     - Substitution preference (можно поменять)
   - Секция "Адреса доставки":
     - Список адресов с radio "По умолчанию"
     - Кнопки "Редактировать" и "Удалить" на каждом
     - Кнопка "Добавить адрес" → модалка с формой
   - Секция "Контакты владельца":
     - Email (read-only из Supabase)
     - Имя контактного лица (редактируемое)
     - Телефон (редактируемое)

3. **`/subscription/manage` (для V0 — простой список):**
   - Если `Company.subscriptionPlans.length === 0`:
     - Empty state с описанием подписки
     - Кнопка "Оформить подписку" → `/subscription` (публичный лендинг с формой)
   - Если есть плауы:
     - Список запрошенных планов с статусом (REVIEW_REQUIRED / ACTIVE / PAUSED / CANCELLED)
     - Информация: "Подписка обрабатывается в ручном режиме в V0. Полноценный workspace — в V1."
     - Кнопка "Подать ещё запрос"

### Acceptance criteria

- [ ] `/dashboard` показывает приветствие + последние заказы + активные подписки
- [ ] `/profile` позволяет редактировать данные компании
- [ ] Можно добавлять/удалять адреса
- [ ] `/subscription/manage` показывает запросы или empty state
- [ ] `npm run build` проходит

### Commit

```
feat(account): dashboard + profile + addresses + subscription requests

- /dashboard overview with last order, subscription status, cart
- /profile editing for company info, substitution preference
- Address book management (add/edit/delete/set-default)
- /subscription/manage simple list view (V0 manual processing)
```

---

## Этап 5 — Формы Subscription + Group Buy (0.5 дня)

**Цель:** в публичных лендингах добавить формы для сбора запросов.

### Шаги

1. **`/subscription` (публичный) — добавить блок "Подать запрос":**
   - Кнопка "Подключить подписку" → скроллит к форме внизу страницы
   - Форма (для залогиненного клиента):
     - Multi-select товаров (поиск по каталогу)
     - Частота: радио (раз в неделю / дважды в неделю / раз в 2 недели / раз в месяц)
     - Желаемые дни недели: чекбоксы (Пн-Вс)
     - Желаемое время: select (утро / день / вечер)
     - Комментарий
   - Submit → создать `SubscriptionPlan` со status `REVIEW_REQUIRED`, нотификация менеджер
   - Для незалогиненного — кнопка "Войти чтобы оформить" → `/login?redirectTo=/subscription`

2. **`/group-buying` (публичный) — добавить блок waitlist:**
   - Кнопка "Хочу участвовать в пилоте"
   - Форма (для всех — даже не залогиненных):
     - Email (или подтянуть из session если залогинен)
     - Телефон
     - Multi-select интересующих SKU из каталога
     - Submit → создать запись в `GroupBuyInterest` (новая модель ниже)
     - Показать "Спасибо, мы свяжемся когда соберём первую группу"

3. **Добавить модель в schema.prisma:**
   ```prisma
   model GroupBuyInterest {
     id          String   @id @default(cuid())
     email       String
     phone       String?
     companyId   String?
     company     Company? @relation(fields: [companyId], references: [id])
     productIds  String[]
     message     String?
     createdAt   DateTime @default(now())
     processedAt DateTime?
     processedBy String?
     
     @@index([createdAt])
   }
   ```
   И в `Company` добавить `groupBuyInterests GroupBuyInterest[]`
   
   `npx prisma migrate dev --name add_group_buy_interest`

### Acceptance criteria

- [ ] `/subscription` имеет рабочую форму запроса (для залогиненных)
- [ ] Submit → запись в БД, видна в `/admin/subscriptions`
- [ ] `/group-buying` имеет waitlist форму (для всех)
- [ ] Submit → запись в БД, видна в `/admin/group-buy-interests`
- [ ] `npm run build` проходит

### Commit

```
feat(v0): subscription request and group-buy waitlist forms

- /subscription has Submit form for logged-in users
- /group-buying has waitlist form for everyone
- New GroupBuyInterest model for collecting demand signals
- All requests routed to admin for manual processing
```

---

## Этап 6 — Минимальная админка (1.5 дня)

**Цель:** менеджер может реально работать с заказами и стоком через UI.

### Шаги

1. **Добавить `isAdmin Boolean @default(false)` в User model.** Migration.
   Назначить вручную через Supabase SQL editor:
   ```sql
   UPDATE "User" SET "isAdmin" = true WHERE email = '***REMOVED***';
   ```

2. **Middleware:** если path `/admin/*` AND `!user.isAdmin` → return 403

3. **`/admin` layout** — отдельный layout с sidebar:
   - Заказы (с badge: число CREATED + WAITING_PAYMENT)
   - Каталог
   - Подписки (с badge: число REVIEW_REQUIRED)
   - Group Buy (с badge: число unprocessed interests)

4. **`/admin/orders` — список заказов:**
   - Таблица: Номер | Клиент | Сумма | Статус | Создан | Действия
   - Фильтр сверху: статус (default: показывать только non-final, т.е. не DELIVERED и не CANCELLED)
   - Сортировка: по дате убывания
   - На каждой строке — dropdown actions в зависимости от текущего статуса:
     - `CREATED` → "Подтвердить" (CONFIRMED) | "Отменить" (CANCELLED)
     - `CONFIRMED` → "В сборке" (PICKING)
     - `PICKING` → "В доставке" (OUT_FOR_DELIVERY)
     - `OUT_FOR_DELIVERY` → "Доставлено" (DELIVERED)
     - Везде → "Отменить" с обязательным комментарием

5. **`/admin/orders/[id]` — детализация:**
   - Всё что в клиентской версии PLUS:
     - Кнопки смены статуса (как в списке)
     - Список позиций с возможностью inline:
       - Установить `itemStatus` (CONFIRMED / OUT_OF_STOCK / CANCELLED)
       - Кнопка "Предложить замену" → модалка с поиском по каталогу → save substitute info (в V0 без отправки email клиенту — менеджер связывается через WhatsApp)
     - Поле "Внутренний комментарий" (видит только админ)

6. **`/admin/catalog` — таблица товаров:**
   - 190 строк (с пагинацией по 50)
   - Поиск + фильтр по категории
   - Inline editable поля:
     - Stock quantity (input + save кнопка → новый InventorySnapshot)
     - Brand (input — массовое enrichment)
     - isActive (checkbox)
   - НЕ делать UI для добавления/удаления товаров — это сложно. Только редактирование.

7. **`/admin/subscriptions` — запросы:**
   - Таблица: Клиент | Товары | Частота | Дни | Статус | Создан | Действия
   - Кнопка "Помечать обработанным" (REVIEW_REQUIRED → ACTIVE)
   - Кнопка "Отклонить" (REVIEW_REQUIRED → CANCELLED с комментарием)
   - Кнопка "Связаться в WhatsApp" → deep link на телефон клиента

8. **`/admin/group-buy-interests` — waitlist:**
   - Таблица: Email | Phone | Товары | Создан | Обработан?
   - Кнопка "Пометить обработанным" → set processedAt + processedBy
   - Кнопка "Связаться" (mailto или WhatsApp deep link)

### Acceptance criteria

- [ ] Не-admin user не может зайти на `/admin/*`
- [ ] менеджер может зайти, видит свои заказы
- [ ] Может прогнать заказ через все статусы
- [ ] Может обновить stock товара
- [ ] Видит и может обработать запросы подписки и waitlist
- [ ] `npm run build` проходит

### Commit

```
feat(admin): minimal admin panel for ops

- isAdmin guard on /admin/*
- Orders list with status-aware actions
- Order detail with item-level substitution (manual processing)
- Catalog inline editing for stock and brand
- Subscription requests page
- Group buy interests page
```

---

## Этап 7 — Локализация RU/KZ для (marketing) (1 день)

**Цель:** все публичные страницы доступны на казахском с правильными hreflang тегами.

### Шаги

1. **Установить next-intl:**
   ```bash
   npm install next-intl --legacy-peer-deps
   ```

2. **URL структура:**
   - `/` → редирект на `/ru` (или по Accept-Language)
   - `/ru/*` → русская версия marketing pages
   - `/kz/*` → казахская версия marketing pages
   - `/cart`, `/orders`, `/admin/*` etc. — БЕЗ префикса локали (только RU в V0)

3. **Реорганизация:** все файлы из `app/(marketing)/` обернуть в `app/(marketing)/[locale]/`:
   ```
   app/(marketing)/[locale]/page.tsx
   app/(marketing)/[locale]/catalog/page.tsx
   ...
   ```

4. **Конфиг next-intl:**
   - `i18n.ts` в корне с настройками
   - `middleware.ts` обновить чтобы добавить createMiddleware от next-intl для marketing-роутов

5. **Структура переводов:**
   ```
   messages/
     ru.json
     kz.json
   ```
   Namespace структура: `marketing.home.hero.title`, `marketing.catalog.filters.brand`, etc.

6. **Перенос ВСЕХ строк** с marketing страниц в JSON. Главные блоки:
   - Header (logo alt, search placeholder, nav items, login/cart)
   - Footer (все секции с заголовками и ссылками)
   - Home: hero, trust strip, segment cards (S1/S2/S3), categories, featured
   - Catalog: filter labels, sort labels, empty state, MOQ/stock labels
   - PDP: все лейблы (Бренд, Фасовка, Минимальный заказ, Описание, кнопки)
   - Subscription landing: 4 шага, описания фич, форма запроса
   - Group buying landing: feature blocks, waitlist form
   - About, FAQ (вопросы и ответы), Delivery, Privacy

7. **Казахский перевод — draft + TODO:**
   - НЕ использовать машинный перевод как финальный
   - Сделать draft через свои знания (если уверен) ИЛИ оставить TODO ключи
   - В `messages/kz.json` сверху добавить:
     ```json
     {
       "_TODO_REVIEW": "Этот файл требует review нативным казахским speaker'ом. Особенно проверить: коммерческие термины, гастрономические термины (наполнители, кондитерские термины), юридические формулировки в Privacy"
     }
     ```

8. **`hreflang` теги** в `<head>` каждой marketing страницы:
   - `<link rel="alternate" hreflang="ru" href="https://horecom.kz/ru/..." />`
   - `<link rel="alternate" hreflang="kk" href="https://horecom.kz/kz/..." />`
   - `<link rel="alternate" hreflang="x-default" href="https://horecom.kz/ru/..." />`
   
   ВАЖНО: код локали в hreflang = `kk` (ISO 639-1 для казахского). В URL оставляем `/kz/` для пользовательской интуитивности.

9. **Language switcher** в MarketingHeader:
   - Простой dropdown с двумя опциями: "Русский" / "Қазақша"
   - При переключении: сохранять путь, менять только locale префикс
   - Использовать `useRouter` + `useLocale` от next-intl

10. **Sitemap update:** каждая marketing страница в 2-х вариантах (ru/kz), `alternates.languages`

11. **`/llms.txt` — только русская версия.** Не делать /kz/llms.txt — AI боты разберутся.

### Acceptance criteria

- [ ] Открыть `/` → редирект на `/ru`
- [ ] Открыть `/kz` → казахская версия главной (хотя бы draft)
- [ ] Language switcher работает, сохраняет path
- [ ] Нет hardcoded строк в JSX marketing страниц
- [ ] `ru.json` и `kz.json` имеют одинаковую структуру ключей
- [ ] `hreflang` теги корректные в `<head>`
- [ ] Sitemap содержит обе версии
- [ ] `npm run build` проходит

### Commit

```
feat(i18n): RU/KZ localization for marketing pages

- next-intl integration with /ru and /kz URL prefixes
- All marketing strings extracted to messages/ru.json + messages/kz.json
- KZ marked TODO for native speaker review
- Language switcher in header
- hreflang tags + sitemap alternates
- (app) routes remain RU-only (V1 will add KZ)
```

---

## Этап 8 — Pre-deploy polish (0.5 дня)

**Цель:** платформа готова показу клиентам и grant reviewers.

### Чек-лист

- [ ] **404 page** — красивая с навигацией и поиском
- [ ] **Loading skeletons** на catalog, orders, product pages
- [ ] **Error boundary** глобальный (`app/error.tsx`) с кнопкой "Перезагрузить" + кнопкой WhatsApp
- [ ] **Toast notifications** (через sonner) на all key user actions
- [ ] **Empty states** везде: cart, orders, search results, admin lists
- [ ] **Privacy Policy** обновить с реальными данными из `lib/company.ts` (individual entrepreneur (details on request), ИИН, юр.адрес, IBAN)
- [ ] **Terms of Service** — добавить базовый шаблон (можно generator с правкой имени)
- [ ] **OG image preview** работает: проверить через https://opengraph.xyz
- [ ] **Favicon** виден в табе
- [ ] **Lighthouse mobile score** > 80 (если хуже — оптимизировать images через `next/image`)
- [ ] **SEO basics:** unique title + description + canonical на всех страницах
- [ ] Удалить старые компоненты (`components/header.tsx`, `components/footer.tsx`) если они дублируют `components/marketing/*`
- [ ] Удалить или архивировать старые брифы из репо если они там: `BRIEF_FOR_CLAUDE_CODE.md`, `BUILD_PLAN.md` (если есть) — только этот файл остаётся как single source

### Pre-deploy тест

- [ ] `npm run build` без ошибок
- [ ] `npm run start` запускает production-сервер
- [ ] End-to-end test: регистрация → onboarding → каталог → корзина → checkout → success page → WhatsApp deep link
- [ ] Проверить mobile (Chrome DevTools mobile emulation)
- [ ] Проверить казахскую версию хотя бы главной

### Commit

```
chore(polish): pre-deploy refinements

- 404 page, loading skeletons, error boundary
- Toast notifications on all user actions
- Empty states everywhere
- Privacy + Terms with real IP Ospanova details
- OG image, favicon, Lighthouse mobile > 80
- Cleaned up stale components and brief files
```

---

## Этап 9 — Deploy на Vercel (15 минут)

**Цель:** живой URL.

### Шаги

1. **В Vercel Project Settings → Environment Variables:**
   - `DATABASE_URL`, `DIRECT_URL` (Supabase)
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `AUTH_SECRET`
   - `NEXT_PUBLIC_BASE_URL=https://<project>.vercel.app`

2. **Build & Install:**
   - Build Command: `prisma generate && next build`
   - Install Command: `npm install --legacy-peer-deps`

3. **Domain:**
   - Сейчас default `<project>.vercel.app`
   - Позже (когда co-founder решит) — добавить `app.horecom.kz`

4. **Database setup на prod:**
   - Если используется тот же Supabase что и dev — миграции и seed уже выполнены, ничего не нужно
   - Если отдельный prod Supabase — выполнить:
     ```bash
     DATABASE_URL="<prod>" DIRECT_URL="<prod-direct>" npx prisma migrate deploy
     DATABASE_URL="<prod>" DIRECT_URL="<prod-direct>" npx prisma db seed
     ```

5. **После деплоя:**
   - Открыть live URL
   - Пройти full flow: регистрация → заказ → success
   - `git tag v0.0.1 && git push --tags`

### Commit

```
chore(deploy): production deployment v0.0.1

- All env vars in Vercel
- Build verified end-to-end
- Tagged v0.0.1
```

---

# Что НЕ делать в V0 (явно)

- ❌ Kaspi Pay интеграция — заглушка
- ❌ 360dialog WhatsApp templates — заглушка (deep link вместо)
- ❌ Resend / Postmark email — STUB в `lib/email.ts` (только console.log)
- ❌ Полноценный subscription workspace (cron, predictive) — V1
- ❌ Group Buy mechanics (threshold, locked price) — V1.5
- ❌ Substitution email flow в админке — V0 это manual через WhatsApp
- ❌ Mobile native app
- ❌ Менять Prisma schema без явной причины (только добавления типа `supabaseId`, `isAdmin`, `GroupBuyInterest`)
- ❌ Микросервисы / Redis / cache layers
- ❌ A/B testing
- ❌ Полная локализация (app) на казахском — V1
- ❌ AmoCRM webhook интеграция — V1
- ❌ Sentry/PostHog — V1 (опционально, когда есть пользователи)

# Что подключится в V1 (post-grant)

| Фича | Что нужно | Что меняется в коде |
|---|---|---|
| WhatsApp OTP | 360dialog credentials | Заменить `signInWithOtp` на свой OTP flow |
| WhatsApp templates | Meta-approved templates | Заменить `sendOrderConfirmation` stub на 360dialog API call |
| Kaspi Pay | API credentials | Добавить опцию "Kaspi Pay" в checkout step 3, webhook handler |
| Resend emails | RESEND_API_KEY | Заменить stub в `lib/email.ts` |
| Subscription workspace | — (можно начать когда угодно) | Новый раздел в `(app)`, cron jobs, predictive алгоритм |
| Sentry monitoring | SENTRY_DSN | `npx @sentry/wizard@latest -i nextjs` |
| PostHog analytics | NEXT_PUBLIC_POSTHOG_KEY | `lib/posthog.ts` + Provider в layout |
| AmoCRM sync | API token | Webhook handler + sync service |

V0 готов их принять — точки интеграции уже размечены TODO-комментариями в коде.

---

# Timeline сводный

| День | Этап | Результат |
|---|---|---|
| День 1 утро | 0 + 1 | Скелет на Supabase, route groups разделены |
| День 1 вечер | 2 | Auth работает, можно зарегистрироваться |
| День 2-3 | 3 | Полный checkout flow с WhatsApp handoff |
| День 4 | 4 | Личный кабинет + профиль |
| День 5 утро | 5 | Subscription/Group Buy формы |
| День 5-6 | 6 | Минимальная админка |
| День 7 | 7 | Локализация RU/KZ |
| День 8 утро | 8 | Polish |
| День 8 вечер | 9 | Deploy |

**Итого: 8 рабочих дней. Календарно: ~2 недели.**

---

# Если что-то непонятно

1. **Архитектура** → `docs/10-synthesis-master.md` или `CLAUDE.md` секция "Critical architectural decisions"
2. **Бизнес-логика** → `docs/22-product-vision.md`
3. **Реквизиты/контакты** → `lib/company.ts` (single source of truth)
4. **Метрики для UI** → `docs/23-traction-metrics.md` (только реальные числа)
5. **Дизайн** → пока Claude Design рисует, используем текущий brand-kit (electric blue + orange, minimum chrome)
6. **Что-то структурно важное** → лучше задать вопрос чем тихо принять решение

---

# После выполнения

Обнови `PROGRESS.md`:
- Sprint V0 → DONE
- V1 work (WhatsApp/Kaspi/Resend/Subscription workspace) → ready when external deps unblock

Финальный milestone commit:
```
chore(milestone): V0 platform shipped — functional B2B procurement site

V0 features:
- 190 SKU catalog with search and filters from real Tilda export
- Email magic link auth via Supabase
- Cart with MOQ validation
- 3-step checkout with WhatsApp handoff (no online payment in V0)
- Customer dashboard with orders, profile, addresses
- Subscription request form (manual processing)
- Group buy waitlist (manual processing)
- Minimal admin panel for orders, stock, requests
- Marketing pages localized to RU and KZ
- Brand: official Horecom logo with electric blue + orange palette
- Legal entity: individual entrepreneur (details on request)

V1 dependencies (external):
- 360dialog WhatsApp Business approval → enables OTP auth + template messages
- Kaspi Pay Business API approval → enables online payments
- Resend account → enables real email notifications
- Native KZ speaker review for /kz translations

Live: https://<project>.vercel.app
```

---

Поехали. Спрашивай если что-то структурное непонятно.
