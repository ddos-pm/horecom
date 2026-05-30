import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Delivery and payment" : "Доставка и оплата",
    description: isEn
      ? "Delivery across Astana every 3 hours. Payment by KaspiPay link or invoice. Free delivery from 20,000 ₸."
      : "Доставка по Астане каждые 3 часа. Оплата ссылкой KaspiPay или счётом на оплату. Бесплатная доставка от 20 000 ₸.",
  };
}

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";

  return (
    <div className="container-tight py-8 max-w-3xl">
      <h1 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
        {isEn ? "Delivery and payment" : "Доставка и оплата"}
      </h1>
      <p className="mb-8 text-lg text-muted-foreground">
        {isEn ? "Transparent terms for every customer." : "Прозрачные условия для всех клиентов."}
      </p>

      <section className="prose prose-slate max-w-none">
        <h2>{isEn ? "Delivery across Astana" : "Доставка по Астане"}</h2>
        <ul>
          {isEn ? (
            <>
              <li><strong>Zone:</strong> Astana (within city limits)</li>
              <li><strong>Schedule:</strong> dispatch every 3 hours during business hours</li>
              <li><strong>Lead time:</strong> orders before 14:00 ship same day. After 14:00 — next morning.</li>
              <li><strong>Windows:</strong> 9:00–12:00 / 12:30–15:30 / 16:00–19:00. Slot is picked at checkout.</li>
              <li><strong>Pricing:</strong>
                <ul>
                  <li>From 20,000 ₸ — free</li>
                  <li>From 7,000 ₸ for subscription deliveries — free</li>
                  <li>Below that — 1,000 ₸ within the city</li>
                </ul>
              </li>
            </>
          ) : (
            <>
              <li><strong>Зона:</strong> Астана (в пределах города)</li>
              <li><strong>Расписание:</strong> отгрузка каждые 3 часа в рабочее время</li>
              <li><strong>Срок:</strong> заказы до 14:00 — доставляем в этот же день. После 14:00 — следующим утром.</li>
              <li><strong>Время:</strong> 9:00–12:00 / 12:30–15:30 / 16:00–19:00. Слот выбирается при оформлении.</li>
              <li><strong>Стоимость:</strong>
                <ul>
                  <li>От 20 000 ₸ — бесплатно</li>
                  <li>От 7 000 ₸ для подписочных доставок — бесплатно</li>
                  <li>Меньше — 1 000 ₸ по городу</li>
                </ul>
              </li>
            </>
          )}
        </ul>

        <h2>{isEn ? "Payment methods" : "Способы оплаты"}</h2>
        <ul>
          {isEn ? (
            <>
              <li>
                <strong>KaspiPay link</strong> — for individuals and sole proprietors. Sent on WhatsApp
                after order confirmation.
              </li>
              <li>
                <strong>Invoice on request</strong> — for legal entities. Bank details arrive by email
                with the invoice. Payment term — 3 business days from invoice date.
              </li>
              <li>
                <strong>Net 30 / Deferred payment</strong> — for recurring customers with 6+ months of
                order history. Negotiated individually.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong>Ссылка KaspiPay</strong> — для физических лиц и ИП. Приходит в WhatsApp после
                подтверждения заказа.
              </li>
              <li>
                <strong>Счёт на оплату по запросу</strong> — для юридических лиц. Реквизиты приходят на
                email вместе со счётом. Срок оплаты — 3 рабочих дня от выставления счёта.
              </li>
              <li>
                <strong>Net 30 / Отсрочка</strong> — для постоянных клиентов с историей заказов от 6 месяцев.
                Обсуждается индивидуально.
              </li>
            </>
          )}
        </ul>

        <h2>{isEn ? "Documents" : "Документы"}</h2>
        <p>
          {isEn
            ? "For legal entities and sole proprietors we provide the full document set:"
            : "Для юр. лиц и ИП мы предоставляем полный пакет документов:"}
        </p>
        <ul>
          {isEn ? (
            <>
              <li>Invoice</li>
              <li>VAT invoice</li>
              <li>Waybill (TTN form)</li>
              <li>One-off or recurring contract (on request)</li>
            </>
          ) : (
            <>
              <li>Счёт на оплату</li>
              <li>Счёт-фактура</li>
              <li>Накладная (форма ТТН)</li>
              <li>Договор разового сотрудничества или абонентский (по запросу)</li>
            </>
          )}
        </ul>
        <p>
          {isEn
            ? "All documents arrive by email right after payment and are available in your dashboard."
            : "Все документы приходят на email сразу после оплаты и доступны в личном кабинете."}
        </p>

        <h2>{isEn ? "Returns and claims" : "Возвраты и претензии"}</h2>
        <p>
          {isEn
            ? "If a product arrives defective or doesn't match the description:"
            : "Если товар пришёл некачественным или не соответствует заявленному:"}
        </p>
        <ul>
          {isEn ? (
            <>
              <li>Notify us within 24 hours of receipt</li>
              <li>Via WhatsApp or in your dashboard → "Order problem"</li>
              <li>We'll replace the product or refund via Kaspi (1–3 business days)</li>
            </>
          ) : (
            <>
              <li>Сообщите нам в течение 24 часов после получения</li>
              <li>Через WhatsApp или в личном кабинете → «Проблема с заказом»</li>
              <li>Мы заменим товар или вернём деньги через Kaspi (1–3 рабочих дня)</li>
            </>
          )}
        </ul>

        <h2>{isEn ? "Pickup" : "Самовывоз"}</h2>
        <p>
          {isEn
            ? "You can pick up an order from our warehouse at 1 Shamshi Kaldayakov Street. Coordinate the pickup time with your account manager after order confirmation."
            : "Можно забрать заказ с нашего склада на ул. Шамши Калдаякова 1. Время самовывоза согласуйте с менеджером после подтверждения заказа."}
        </p>

        <h2>{isEn ? "Other cities" : "Другие города"}</h2>
        <p>
          {isEn
            ? "Currently we deliver only within Astana. If you're in another city and want to join the pilot — message us on WhatsApp."
            : "Сейчас доставка только по Астане. Если вы из другого города и хотите подключиться к пилоту — напишите в WhatsApp."}
        </p>
      </section>
    </div>
  );
}
