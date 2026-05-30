import { COMPANY } from "@/lib/company";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Public offer" : "Публичная оферта",
    description: isEn
      ? "Horecom public offer terms: wholesale ingredient supply for HoReCa in Astana. Payment, delivery, returns, liability."
      : "Условия публичной оферты Horecom: оптовая поставка ингредиентов для HoReCa в Астане. Оплата, доставка, возврат, ответственность сторон.",
  };
}

export default async function OfferPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";

  if (isEn) {
    return (
      <div className="container-tight max-w-3xl py-8 prose prose-slate">
        <h1>Public offer</h1>
        <p className="text-muted-foreground">In effect since January 1, 2026.</p>

        <div
          style={{
            background: "var(--c-warning-bg)",
            color: "var(--c-warning)",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            margin: "12px 0 24px",
          }}
        >
          <b>Reference translation.</b> The Russian version of this offer is the
          authoritative legal text under Kazakhstan law. This English translation is
          provided for convenience and is not legally binding.
        </div>

        <h2>1. General provisions</h2>
        <p>
          This document is a public offer (proposal) by Horecom (hereinafter "the
          Supplier") to enter into a wholesale-supply contract on the terms set out below.
          Acceptance of the offer occurs when an order is placed through{" "}
          <a href="https://horecom.kz">horecom.kz</a> or WhatsApp. After acceptance the
          contract is considered concluded in accordance with article 396 of the Civil
          Code of the Republic of Kazakhstan.
        </p>

        <h2>2. Subject of the contract</h2>
        <p>
          The Supplier undertakes to deliver, and the Buyer to accept and pay for, food
          goods (ingredients, products, packaging) for catering establishments, pastry
          shops, and independent pastry makers.
        </p>

        <h2>3. Price and payment</h2>
        <ul>
          <li>Current prices are listed in the site catalog and are locked at order confirmation.</li>
          <li>
            Payment methods: KaspiPay link (individuals and sole proprietors), bank
            transfer by invoice (legal entities), deferred payment under a separate
            arrangement for recurring customers.
          </li>
          <li>
            Bank-transfer payment term — 3 business days from invoice issuance, unless
            otherwise agreed separately.
          </li>
        </ul>

        <h2>4. Delivery</h2>
        <ul>
          <li>Delivery zone: Astana.</li>
          <li>
            Free delivery for orders from 20,000 ₸. Smaller orders — 1,000 ₸. For supply
            subscriptions — free from 7,000 ₸.
          </li>
          <li>Delivery time is chosen by the Buyer at checkout from the available windows.</li>
          <li>
            Pickup — from the warehouse at {COMPANY.physicalAddressEn} by prior arrangement.
          </li>
        </ul>

        <h2>5. Product quality and substitutions</h2>
        <p>
          The Supplier guarantees that products match their declared specifications and
          shelf life. If a product is out of stock — the Buyer is offered an alternative
          on WhatsApp with the price delta. Substitution proceeds only after the Buyer's
          explicit approval.
        </p>

        <h2>6. Returns and claims</h2>
        <ul>
          <li>Quality or completeness claims are accepted within 24 hours of receipt.</li>
          <li>Refund or replacement happens within 1–3 business days via the same payment channel.</li>
          <li>
            Channel for claims: WhatsApp to {COMPANY.phoneWhatsAppDisplay} or in your
            dashboard → "Order problem".
          </li>
        </ul>

        <h2>7. Liability</h2>
        <p>
          The parties bear liability in accordance with the current legislation of the
          Republic of Kazakhstan. The Supplier is not liable for breaches caused by
          force-majeure circumstances, including (but not limited to) emergency
          situations, disruptions in the banking system, and delays by logistics partners.
        </p>

        <h2>8. Personal-data protection</h2>
        <p>
          Personal data is processed in accordance with the Republic of Kazakhstan Law
          "On Personal Data and Its Protection". Details — in the{" "}
          <a href={`/${locale}/privacy`}>Privacy policy</a>.
        </p>

        <h2>9. Supplier details</h2>
        <p>
          Full legal company details (legal name, BIN/IIN, bank account, registered
          address) are listed in the issued invoice and in the separate contract
          concluded with legal entities on request.
        </p>
        <ul>
          <li>Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li>
          <li>WhatsApp: {COMPANY.phoneWhatsAppDisplay}</li>
          <li>Warehouse and pickup point: {COMPANY.physicalAddressEn}</li>
        </ul>

        <h2>10. Amendments to the offer</h2>
        <p>
          The Supplier may amend the terms of this offer unilaterally. The current
          version is always available on this page. The effective date is shown at the
          top of the document.
        </p>
      </div>
    );
  }

  return (
    <div className="container-tight max-w-3xl py-8 prose prose-slate">
      <h1>Публичная оферта</h1>
      <p className="text-muted-foreground">Действует с 1 января 2026 года.</p>

      <h2>1. Общие положения</h2>
      <p>
        Настоящий документ является публичной офертой (предложением) Horecom (далее — «Поставщик»)
        заключить договор оптовой поставки товаров на условиях, изложенных ниже. Принятие оферты
        (акцепт) осуществляется путём оформления заказа через сайт{" "}
        <a href="https://horecom.kz">horecom.kz</a> или WhatsApp. После акцепта договор считается
        заключённым в соответствии со статьёй 396 Гражданского кодекса Республики Казахстан.
      </p>

      <h2>2. Предмет договора</h2>
      <p>
        Поставщик обязуется поставить, а Покупатель — принять и оплатить товары пищевого назначения
        (ингредиенты, продукция, упаковка) для предприятий общественного питания, кондитерских и
        самозанятых кондитеров.
      </p>

      <h2>3. Цена и порядок оплаты</h2>
      <ul>
        <li>Актуальные цены указаны в каталоге на сайте и фиксируются на момент подтверждения заказа.</li>
        <li>Способы оплаты: ссылка KaspiPay (физические лица и ИП), безналичный перевод по счёту
          (юридические лица), отсрочка по индивидуальному соглашению для постоянных клиентов.</li>
        <li>Срок оплаты по безналичному расчёту — 3 рабочих дня от выставления счёта, если иное не
          согласовано отдельно.</li>
      </ul>

      <h2>4. Доставка</h2>
      <ul>
        <li>Зона доставки: г. Астана.</li>
        <li>Бесплатная доставка для заказов от 20 000 ₸. Заказы меньше — 1 000 ₸. Для подписки на
          поставку — бесплатно от 7 000 ₸.</li>
        <li>Время доставки выбирается Покупателем при оформлении заказа из доступных слотов.</li>
        <li>Самовывоз — со склада по адресу {COMPANY.physicalAddress} по предварительной договорённости.</li>
      </ul>

      <h2>5. Качество товара и замены</h2>
      <p>
        Поставщик гарантирует соответствие товаров заявленным характеристикам и сроку годности. Если
        товара нет в наличии — Покупателю предлагается аналог через WhatsApp с указанием разницы в
        цене. Замена производится только после явного согласия Покупателя.
      </p>

      <h2>6. Возврат и претензии</h2>
      <ul>
        <li>Претензии по качеству или комплектности принимаются в течение 24 часов после получения.</li>
        <li>Возврат или замена осуществляется в течение 1–3 рабочих дней через тот же канал оплаты.</li>
        <li>Канал подачи претензии: WhatsApp на номер {COMPANY.phoneWhatsAppDisplay} либо личный
          кабинет → «Проблема с заказом».</li>
      </ul>

      <h2>7. Ответственность сторон</h2>
      <p>
        Стороны несут ответственность согласно действующему законодательству Республики Казахстан.
        Поставщик не несёт ответственности за нарушения, вызванные форс-мажорными обстоятельствами,
        включая (но не ограничиваясь): чрезвычайные ситуации, перебои в работе банковской системы,
        задержки логистических партнёров.
      </p>

      <h2>8. Защита персональных данных</h2>
      <p>
        Обработка персональных данных осуществляется в соответствии с Законом РК «О персональных
        данных и их защите». Подробности — в{" "}
        <a href={`/${locale}/privacy`}>Политике конфиденциальности</a>.
      </p>

      <h2>9. Реквизиты Поставщика</h2>
      <p>
        Полные юридические реквизиты (наименование, БИН/ИИН, расчётный счёт, юридический адрес)
        указываются в выставленном счёте на оплату и в договоре, заключаемом отдельно с юридическими
        лицами по запросу.
      </p>
      <ul>
        <li>Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li>
        <li>WhatsApp: {COMPANY.phoneWhatsAppDisplay}</li>
        <li>Склад и точка самовывоза: {COMPANY.physicalAddress}</li>
      </ul>

      <h2>10. Изменения оферты</h2>
      <p>
        Поставщик вправе вносить изменения в условия оферты в одностороннем порядке. Актуальная
        редакция всегда доступна на этой странице. Дата вступления в силу указана в начале документа.
      </p>
    </div>
  );
}
