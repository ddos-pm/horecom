# Horecom — Substitution UX Spec
### Закрывает Gap #3 (не покрыт ни одним из двух пакетов) | Май 2026

> Substitution — момент, когда на складе нет ровно того SKU, который клиент заказал, и предлагается замена. Это самый рискованный UX в B2B food procurement: молчаливая замена → отравленный customer trust на годы. Оба пакета называют это требованием ("substitution policy"), но **никто** не показывает реальный экран. Этот документ закрывает гэп.

---

## 1. Триггер substitution

Substitution proposal создаётся в одном из 4 случаев:

| # | Trigger | Кто инициирует | Когда |
|---|---|---|---|
| 1 | Out of stock на picking | Warehouse staff / admin | После `Order.status = PICKING`, до `OUT_FOR_DELIVERY` |
| 2 | Damaged at picking | Warehouse staff | Тот же момент |
| 3 | Predictive (на подписке) | System | За 24ч до `cutoffAt` upcoming order, если stock < required |
| 4 | Discontinued by supplier | Admin | В любой момент, по всем активным заказам/планам с этим SKU |

В каждом случае создаётся запись:
```ts
OrderItem.substituteProductId = newProductId;
OrderItem.substituteReason = "OUT_OF_STOCK" | "DAMAGED" | "PREDICTIVE_LOW_STOCK" | "DISCONTINUED";
OrderItem.substituteProposedAt = new Date();
OrderItem.itemStatus = "PENDING"; // ждём решения клиента
Order.status = "PARTIALLY_CONFIRMED"; // если >= 1 SKU в substitution
```

И запускается уведомление по политике компании:
- `Company.substitutionPreference === "AUTO_APPROVE"` → auto-approve, идём дальше
- `Company.substitutionPreference === "NEVER_SUBSTITUTE"` → отказ, `itemStatus = CANCELLED`, перерасчёт суммы
- `Company.substitutionPreference === "ASK"` (default) → WhatsApp + экран

## 2. Policy на уровне компании

В `/profile/company` — секция "Замены товаров":

```
Если товар закончился на складе:

  ( ) Всегда спрашивать меня
      Мы пришлём WhatsApp с предложением замены и аналогом.
      Заказ ждёт вашего ответа до 2 часов.

  ( ) Автоматически принимать аналог
      Подходит для стабильных категорий (мука, сахар).
      Мы заменим только аналогом того же бренда или равноценным.

  ( ) Никогда не заменять
      Если товара нет — отменим эту позицию из заказа.
      Сумма пересчитается, документы тоже.

[Сохранить настройки]

Изменения вступят в силу для следующих заказов.
```

Pre-approval можно настроить **per category** (V1.5):
- "Для муки и сахара: auto-approve"
- "Для шоколада и брендовых ингредиентов: всегда спрашивать"

## 3. WhatsApp flow (основной канал)

Template: `substitution_review` (см. `04_Technical_Context_FINAL.md` §9).

**Сообщение (RU):**
```
🔄 Замена в заказе HC-2026-00123

К сожалению, на складе закончился:
🚫 Шоколад Barry Callebaut 54%, 1 кг

Предлагаем равноценную замену:
✅ Шоколад Callebaut Mona Lisa 53%, 1 кг
   Та же цена: 1 850 ₸/кг

Что делаем?
```

**Кнопки (interactive):**
- ✅ Согласен на замену
- ❌ Отказаться (убрать из заказа)
- 📋 Открыть в кабинете

**Тайминг:**
- T+0: WhatsApp отправлен, `OrderItem.itemStatus = PENDING`
- T+1ч: если нет ответа → SMS-напоминание + Push
- T+2ч: если нет ответа → дефолтное действие по `substitutionPreference`. По умолчанию (если `ASK`) — **отказ**, не молчаливая замена. Клиент потом может оспорить.

## 4. Web/Mobile UX (для тех, кто открыл кабинет)

### 4.1 Notification banner в /home

```
┌─────────────────────────────────────────────┐
│  🔔  Заказ HC-2026-00123 требует решения    │
│      По 1 товару предложена замена          │
│      [Открыть заказ]                        │
└─────────────────────────────────────────────┘
```

Цвет: `--warning` (#B45309). Sticky до решения.

### 4.2 Экран `/orders/[id]` — секция "Требует вашего решения"

Появляется в верхней части страницы заказа, выше item list:

```
┌─────────────────────────────────────────────┐
│ ⚠️  Требует вашего решения                  │
│                                             │
│ ┌─ Заменяется ─────────────────────────────┐│
│ │ [Photo] Шоколад Barry Callebaut 54%, 1кг ││
│ │         5 кг × 1 850 ₸ = 9 250 ₸         ││
│ │         Причина: нет в наличии           ││
│ └──────────────────────────────────────────┘│
│                    ↓                        │
│ ┌─ На ──────────────────────────────────────┐│
│ │ [Photo] Шоколад Callebaut Mona Lisa 53%,  ││
│ │         1 кг                              ││
│ │         5 кг × 1 850 ₸ = 9 250 ₸          ││
│ │         Та же цена. Произ-ль: Callebaut   ││
│ │         [📄 Сравнить характеристики]      ││
│ └───────────────────────────────────────────┘│
│                                             │
│ [✅ Согласен на замену]                     │
│ [❌ Убрать из заказа (вернём 9 250 ₸)]      │
│                                             │
│ Дедлайн ответа: через 1 час 23 мин          │
└─────────────────────────────────────────────┘
```

**Важные UX-детали:**

1. **Фото обоих SKU** рядом — глазами понятно, что предлагают
2. **Цена и сумма** на каждой стороне — пересчёт сразу виден
3. **Производитель** обоих — для брендочувствительных категорий критично
4. **"Сравнить характеристики"** — раскрывает таблицу (% какао, состав, страна, фасовка, срок годности)
5. **Таймер до автодействия** — давление мягкое, без хайпа ("осталось 1ч 23м")
6. **Сумма возврата** явно в кнопке отказа
7. Если предложено **несколько замен** в одном заказе — каждая отдельной карточкой, можно решить независимо

### 4.3 Если разница в цене

```
┌─ На ──────────────────────────────────────┐
│ [Photo] Шоколад IRCA 55%, 1 кг            │
│         5 кг × 1 720 ₸ = 8 600 ₸          │
│         💚 Дешевле на 650 ₸ (-7%)         │
│                                           │
│ Или:                                      │
│         5 кг × 1 920 ₸ = 9 600 ₸          │
│         ⚠️ Дороже на 350 ₸ (+4%)         │
│                                           │
│         [Принять подешевле] [Принять]     │
└───────────────────────────────────────────┘
```

Никогда не молча списываем больше — даже при `AUTO_APPROVE` если новая цена > старой более чем на 5%, перехватываем в `ASK`-режим. Это записывается в `Company.substitutionPreference` поведение, но **код должен проверять разницу всегда**.

### 4.4 После решения

**Принято:**
```
┌─────────────────────────────────────────────┐
│ ✅ Замена принята                           │
│                                             │
│ В заказе теперь: Callebaut Mona Lisa 53%    │
│ Сумма заказа: 47 250 ₸ (без изменений)      │
│                                             │
│ Заказ продолжает сборку.                    │
└─────────────────────────────────────────────┘
```

`OrderItem.itemStatus = SUBSTITUTED`, `substituteApprovedAt = now()`, `substituteApprovedBy = user.id`. Все остальные SKU в заказе → `CONFIRMED`. `Order.status = CONFIRMED`.

**Отказано:**
```
┌─────────────────────────────────────────────┐
│ ❌ Позиция убрана из заказа                 │
│                                             │
│ Сумма пересчитана: 38 000 ₸                 │
│ К возврату: 9 250 ₸                         │
│                                             │
│ Возврат через Kaspi: 1–3 рабочих дня        │
│ Накладная и счёт обновлены.                 │
└─────────────────────────────────────────────┘
```

`OrderItem.itemStatus = CANCELLED`. Trigger refund job (Kaspi API). Re-generate Invoice document. Уведомление в AmoCRM для менеджера (если ещё не оплачен — adjust invoice; если оплачен — start refund).

## 5. Edge cases

| # | Сценарий | Поведение |
|---|---|---|
| 1 | Клиент ответил **дважды** разные кнопки в WhatsApp | Применяется **первый** ответ. Второй игнорируется + SMS "Заказ уже обработан" |
| 2 | Замена сама закончилась пока клиент думал | WhatsApp + экран: "К сожалению, и эта позиция закончилась. Убрать из заказа?" Кнопка "Убрать" + сумма к возврату |
| 3 | Несколько замен в одном заказе, разные решения | OK. Каждый `OrderItem` обрабатывается независимо. Order переходит в `CONFIRMED` после решения по всем |
| 4 | Клиент уехал, телефон выключен > 2ч | По истечении `substituteProposedAt + 2h` — fallback action по preference. Default `ASK` → отказ. В AmoCRM задача менеджеру: "позвонить клиенту, объяснить" |
| 5 | Клиент в подписке, замена для upcoming order | До `cutoffAt` — обычный flow с экраном выбора. После `cutoffAt` — `UpcomingSubscriptionOrder.reviewRequired = true`, доставка переносится на следующий цикл |
| 6 | Замена одобрена, но во время доставки клиент жалуется ("это не то") | Triggers `/orders/[id]/complaint` flow → задача в AmoCRM, не auto-refund |
| 7 | Pre-approved клиент (`AUTO_APPROVE`), но цена замены > original +5% | Игнорируем `AUTO_APPROVE`, перехватываем в `ASK`-flow |
| 8 | Клиент с `NEVER_SUBSTITUTE` — есть только эта позиция в заказе | Order переходит в `CANCELLED` целиком. Уведомление с извинениями + промокод на следующий заказ |

## 6. Admin side

`/admin/orders/[id]`:

Кнопка "Предложить замену":
1. Admin выбирает SKU из заказа который проблемный
2. Выбирает предлагаемую замену (autocomplete по каталогу, с фильтром "та же категория")
3. Указывает причину (dropdown)
4. Видит preview WhatsApp-сообщения которое уйдёт клиенту
5. Submit → WhatsApp letta + email + создание `OrderItem.substituteProductId`

Идеально: предлагать "smart suggestions" аналогов (по category + price band) — но это V1.5.

## 7. Метрики substitution

PostHog events:
- `substitution_proposed` — props: `order_id, original_sku, substitute_sku, reason, price_diff`
- `substitution_approved` — props: `order_id, time_to_response_seconds, channel (whatsapp/web)`
- `substitution_rejected` — props: same
- `substitution_timeout` — props: `order_id` (если auto-fallback сработал)

Что отслеживать:
- **% substitution approval rate** (target: > 70%) — если ниже, аналоги подбираются неудачно
- **Median time to response** (target: < 30 мин) — индикатор канала WhatsApp работает
- **% timeout rate** (target: < 10%) — если выше, клиенты не реагируют → пересмотреть UX уведомлений

## 8. DoD checklist

- [ ] `Company.substitutionPreference` UI на `/profile/company`
- [ ] `substitution_review` WhatsApp template отправлен в Meta на approval **до начала разработки** (займёт 1–7 дней)
- [ ] Экран `/orders/[id]` с substitution card (mobile + desktop)
- [ ] Таймер до auto-fallback с обновлением каждую минуту
- [ ] Fallback cron job (раз в минуту проверяет `substituteProposedAt + 2h < now`)
- [ ] Price-diff override для `AUTO_APPROVE` (>5% → перехват в ASK)
- [ ] Kaspi refund integration для `CANCELLED` items
- [ ] AmoCRM webhook для timeout cases
- [ ] PostHog events интегрированы
- [ ] Empty/loading/error states покрыты
- [ ] E2E тест: order → out of stock → propose → approve via web
- [ ] E2E тест: order → out of stock → propose → reject via WhatsApp button (mock)
- [ ] Edge case test: timeout → auto-fallback
