# WhatsApp Template Submission Checklist (360dialog → Meta)

> Operations doc — Step 6 of the post-i18n audit checklist. Hands-off
> for the engineering team: this is what the team needs to paste into
> the 360dialog dashboard for Meta approval. Templates take 2–7 days to
> review; submit them all on the same day so they unlock together.

## Prerequisites

- 360dialog account onboarded and the WhatsApp Business number is
  approved (green-checkmark business display name).
- Access to the Templates → Create Template flow in 360dialog dashboard:
  https://hub.360dialog.com → Channel → WhatsApp → Templates
- All 6 templates use the same business display name and the same
  category (Transactional → Utility / Customer Care) so they're
  reviewed in a single batch.

## Submission settings (apply to every template)

| Field | Value |
|---|---|
| Category | **Utility** (NOT Marketing — these are post-purchase / operational) |
| Language | **Russian** (primary) — repeat the same template in **English** and **Kazakh** to cover the locale switch |
| Header type | None |
| Footer | Empty |
| Sample variables | Use the realistic examples in each table below — Meta rejects templates with empty / `[example]` placeholders |
| Allowed-category override | Tick "Utility — Order updates" on each |

## The 6 templates

Each row: paste the **body text** exactly as shown into the dashboard's
body field. The `{{1}}`, `{{2}}`, … markers are positional substitution
slots — Meta requires you to provide a sample value for each at
submission time. Sample values are listed under each template.

---

### 1. `order_confirmed`

**Purpose:** sent right after `/api/orders` accepts a new order.
Confirms acceptance, surfaces the total and delivery window, links the
customer back to the dashboard.

**RU body**
```
Заказ {{1}} принят. Сумма: {{2}}. Доставка: {{3}}.
```

**EN body**
```
Order {{1}} accepted. Total: {{2}}. Delivery: {{3}}.
```

**KZ body** (draft — replace with native review before submitting)
```
{{1}} тапсырысы қабылданды. Сома: {{2}}. Жеткізу: {{3}}.
```

**Buttons**
- URL button: text `"Посмотреть заказ"` (RU) / `"View order"` (EN) →
  URL `https://horecom.kz/orders/{{1}}`

**Sample variables**
- `{{1}}` → `HC-12345678`
- `{{2}}` → `187 200 ₸`
- `{{3}}` → `среда, 27 мая, 10:30`

---

### 2. `order_delivered`

**Purpose:** courier marks the order delivered; this template confirms
receipt and offers a problem-report shortcut.

**RU body**
```
Заказ {{1}} доставлен. Накладная в кабинете.
```

**EN body**
```
Order {{1}} delivered. Waybill is in your dashboard.
```

**KZ body**
```
{{1}} тапсырысы жеткізілді. Жүкқұжат жеке кабинеттен қолжетімді.
```

**Buttons** (both quick-reply)
- `"Получил"` / `"Received"` / `"Алдым"`
- `"Есть проблема"` / `"Have a problem"` / `"Мәселе бар"`

**Sample variables**
- `{{1}}` → `HC-12345678`

---

### 3. `subscription_reminder`

**Purpose:** sent 24 h before a scheduled subscription delivery so the
customer can confirm/edit/skip in WhatsApp without opening the app.

**RU body**
```
Завтра доставим {{1}}. Подтвердите или измените.
```

**EN body**
```
We're delivering {{1}} tomorrow. Confirm or edit.
```

**KZ body**
```
Ертең {{1}} жеткіземіз. Растаңыз немесе өзгертіңіз.
```

**Buttons** (all quick-reply)
- `"Доставить"` / `"Deliver"` / `"Жеткізу"`
- `"Изменить"` / `"Edit"` / `"Өзгерту"`
- `"Пропустить"` / `"Skip"` / `"Өткізіп жіберу"`

**Sample variables**
- `{{1}}` → `12 позиций · 187 200 ₸` (basket summary string)

---

### 4. `substitution_review`

**Purpose:** an item is out of stock; manager proposes an alternative
and the customer accepts or rejects in chat. Maps to the substitution
flow described in `docs/13-substitution-ux-spec.md`.

**RU body**
```
По заказу {{1}}: вместо {{2}} предлагаем {{3}}. Согласны?
```

**EN body**
```
For order {{1}}: instead of {{2}} we propose {{3}}. Agree?
```

**KZ body**
```
{{1}} тапсырысы бойынша: {{2}} орнына {{3}} ұсынамыз. Келісесіз бе?
```

**Buttons** (both quick-reply)
- `"Согласен"` / `"Agree"` / `"Келісемін"`
- `"Отказаться"` / `"Decline"` / `"Бас тарту"`

**Sample variables**
- `{{1}}` → `HC-12345678`
- `{{2}}` → `Какао JB 500 г`
- `{{3}}` → `Какао Sicao 500 г (+3% к цене)`

---

### 5. `group_threshold_reached`

**Purpose:** a group-buy reached its target volume; price activates and
customer is asked to pay via Kaspi link.

**RU body**
```
Группа на {{1}} собрана! Цена: {{2}}. Оплата через Kaspi.
```

**EN body**
```
Group for {{1}} is full! Price: {{2}}. Pay via Kaspi.
```

**KZ body**
```
{{1}} тобы жиналды! Бағасы: {{2}}. Kaspi арқылы төлеңіз.
```

**Buttons**
- URL button: text `"Оплатить"` / `"Pay"` / `"Төлеу"` → URL
  `https://horecom.kz/groups/{{1}}/pay`

**Sample variables**
- `{{1}}` → `Шоколад белый 10 кг`
- `{{2}}` → `26 240 ₸`

---

### 6. `group_failed`

**Purpose:** group didn't reach the threshold by the deadline; offer
the buyer the option to purchase solo at the regular price.

**RU body**
```
Группа на {{1}} не собралась. Купить по обычной цене?
```

**EN body**
```
The group for {{1}} didn't fill. Buy at the regular price?
```

**KZ body**
```
{{1}} тобы жиналмады. Әдеттегі бағамен сатып алу керек пе?
```

**Buttons** (both quick-reply)
- `"Купить соло"` / `"Buy solo"` / `"Жалғыз сатып алу"`
- `"Не сейчас"` / `"Not now"` / `"Қазір емес"`

**Sample variables**
- `{{1}}` → `Шоколад белый 10 кг`

---

## After approval

1. Each approved template's `id` from the 360dialog dashboard goes into
   `WhatsAppTemplate.providerTemplateId` in our DB. The seed script
   creates the rows in `DRAFT` state; flip to `APPROVED` once Meta
   confirms.
2. `lib/dialog360.ts` already reads `D360_API_KEY` and switches from
   stub mode to live sends — no code change needed when the templates
   go live.
3. Quick-reply buttons are NOT customizable per-message — the text in
   the dashboard becomes the literal button label users see. Make sure
   the wording matches the strings already used in
   `app/(app)/admin/orders/[id]/item-controls.tsx` and the
   subscription-manage UI so the experience stays consistent.

## Common rejection reasons (Meta)

- **"Marketing not Utility"** — make sure the category at submission is
  Utility, not Marketing. Order-confirmation is utility; promotional
  upsell would be marketing.
- **Variables with non-deterministic content** — Meta wants sample
  values to look real (use actual order numbers, real-looking amounts).
  Placeholder strings like `[order_number]` get rejected.
- **Buttons going to login-walled URLs** — the URL button can deep-link
  but should not require auth on first land (the `/orders/{{id}}`
  redirect-to-login is fine because the app handles unauth bounce).
- **All-caps shouting** — keep button labels Title Case in EN, sentence
  case in RU.
