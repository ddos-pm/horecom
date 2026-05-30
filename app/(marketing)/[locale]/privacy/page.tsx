import { COMPANY } from "@/lib/company";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Privacy policy" : "Политика конфиденциальности",
    description: isEn
      ? 'How Horecom processes customer personal data in accordance with the Republic of Kazakhstan Law "On Personal Data and Its Protection".'
      : "Как Horecom обрабатывает персональные данные клиентов в соответствии с законом РК «О персональных данных и их защите».",
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";

  if (isEn) {
    return (
      <div className="container-tight max-w-3xl py-8 prose prose-slate">
        <h1>Privacy policy</h1>
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
          <b>Reference translation.</b> The Russian version of this policy is the
          authoritative legal text under Kazakhstan law. This English translation is
          provided for convenience and is not legally binding.
        </div>

        <h2>Data controller</h2>
        <p>
          The personal-data operator is an individual entrepreneur registered in the
          Republic of Kazakhstan. Full company details (BIN/IIN, registered address) are
          provided on request to the contact below — in accordance with the Republic of
          Kazakhstan Law "On Personal Data and Its Protection".
        </p>
        <ul>
          <li>Warehouse and pickup point: {COMPANY.physicalAddressEn}</li>
          <li>Inquiries email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li>
          <li>WhatsApp: {COMPANY.phoneWhatsAppDisplay}</li>
        </ul>

        <h2>What data we collect</h2>
        <ul>
          <li>Contact: email (used as login), contact-person name, phone</li>
          <li>Company details: name, BIN/IIN, delivery address</li>
          <li>Transactional: order history, cart contents, chosen payment methods</li>
          <li>Technical: session cookies, IP address</li>
        </ul>

        <h2>Why we collect data</h2>
        <ul>
          <li>Order processing and delivery</li>
          <li>Invoicing and accounting documents (e-invoice, waybill)</li>
          <li>Order- and subscription-status notifications</li>
          <li>Account-manager communication to confirm order details</li>
        </ul>

        <h2>Who we share data with</h2>
        <ul>
          <li>
            <strong>Supabase</strong> — account storage and session handling (US/EU
            infrastructure)
          </li>
          <li>
            <strong>Acquiring bank</strong> — for bank-transfer payments (the bank name
            appears on the issued invoice)
          </li>
          <li><strong>Vercel</strong> — application hosting</li>
        </ul>
        <p>We do NOT sell data to third parties and do NOT pass it to ad networks.</p>

        <h2>Your rights</h2>
        <p>
          Under the Republic of Kazakhstan Law "On Personal Data and Its Protection" you
          have the right to:
        </p>
        <ul>
          <li>Request information about the data we hold about you</li>
          <li>Request correction or deletion</li>
          <li>
            Withdraw consent for processing (the subscription/order service becomes
            unavailable in that case)
          </li>
          <li>
            File a complaint with the Information Security Committee of the Ministry of
            Digital Development of the Republic of Kazakhstan
          </li>
        </ul>

        <h2>How to contact us</h2>
        <p>
          For questions about data processing, email{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. We reply within 10
          business days.
        </p>
      </div>
    );
  }

  return (
    <div className="container-tight max-w-3xl py-8 prose prose-slate">
      <h1>Политика конфиденциальности</h1>
      <p className="text-muted-foreground">Действует с 1 января 2026 года.</p>

      <h2>Кто обрабатывает данные</h2>
      <p>
        Оператор персональных данных — индивидуальный предприниматель, зарегистрированный в Республике
        Казахстан. Полные реквизиты (БИН/ИИН, юридический адрес) предоставляются по запросу в адрес ниже —
        в соответствии с Законом РК «О персональных данных и их защите».
      </p>
      <ul>
        <li>Склад и точка самовывоза: {COMPANY.physicalAddress}</li>
        <li>Email для запросов: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li>
        <li>WhatsApp: {COMPANY.phoneWhatsAppDisplay}</li>
      </ul>

      <h2>Какие данные мы собираем</h2>
      <ul>
        <li>Контактные: email (для входа), имя контактного лица, телефон</li>
        <li>Реквизиты компании: название, БИН/ИИН, адрес доставки</li>
        <li>Транзакционные: история заказов, состав корзин, выбранные способы оплаты</li>
        <li>Технические: cookie сессии, IP-адрес</li>
      </ul>

      <h2>Зачем мы собираем данные</h2>
      <ul>
        <li>Оформление и доставка заказов</li>
        <li>Выставление счетов и документов (ЭСФ, накладная)</li>
        <li>Уведомления о статусе заказа и подписки</li>
        <li>Связь с менеджером для подтверждения деталей</li>
      </ul>

      <h2>С кем мы делимся данными</h2>
      <ul>
        <li><strong>Supabase</strong> — хранение учётной записи и сессии (US/EU инфраструктура)</li>
        <li><strong>Банк-эквайер</strong> — для безналичных платежей по реквизитам (название банка
          указывается в выставленном счёте)</li>
        <li><strong>Vercel</strong> — хостинг приложения</li>
      </ul>
      <p>Мы НЕ продаём данные третьим лицам и не передаём их рекламным сетям.</p>

      <h2>Ваши права</h2>
      <p>В соответствии с Законом РК «О персональных данных и их защите» вы вправе:</p>
      <ul>
        <li>Получить информацию о хранящихся данных</li>
        <li>Запросить исправление или удаление</li>
        <li>Отозвать согласие на обработку (при этом сервис подписки/заказа становится недоступен)</li>
        <li>Подать жалобу в Комитет по информационной безопасности МЦРИАП РК</li>
      </ul>

      <h2>Как с нами связаться</h2>
      <p>
        По вопросам обработки данных — пишите на{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. Ответим в течение 10 рабочих дней.
      </p>
    </div>
  );
}
