import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn
      ? "FAQ — payment, delivery, supply subscription"
      : "Частые вопросы — оплата, доставка, подписка на поставку",
    description: isEn
      ? "Payment methods, delivery across Astana, how the supply subscription works, what happens when an item is out of stock."
      : "Способы оплаты, доставка по Астане, как работает подписка на поставку, что делать если товара нет.",
  };
}

const FAQ_RU = [
  {
    question: "Сколько стоит доставка?",
    answer:
      "Бесплатная доставка по Астане для заказов от 20 000 ₸. Заказы меньше — доставка 1 000 ₸. Для подписки на поставку — бесплатно от 7 000 ₸.",
  },
  {
    question: "Как быстро доставляете?",
    answer:
      "По Астане отгружаем доставки каждые 3 часа. Заказы до 14:00 — доставка в этот же день. После 14:00 — следующим утром. Время доставки выбирается на этапе оформления.",
  },
  {
    question: "Как работает подписка?",
    answer:
      "Вы настраиваете план: товары, частоту (еженедельно, 2 раза в неделю или раз в 2 недели), дни и время доставки. За день до каждой доставки приходит WhatsApp с уведомлением, где можно подтвердить, изменить количество или пропустить эту доставку. Отменить или поставить на паузу можно в любой момент. Сервис подписки бесплатный.",
  },
  {
    question: "Что такое групповая закупка?",
    answer:
      "Несколько кондитеров объединяются для покупки одного товара по оптовой цене. Когда суммарный объём в группе достигает порога, оптовая цена активируется для всех участников. Если группа не собралась к дедлайну — оплата не списывается, и можно купить товар по обычной цене.",
  },
  {
    question: "Какие способы оплаты?",
    answer:
      "Kaspi Pay для частных и юридических лиц, безналичный перевод для компаний по реквизитам. Карты не сохраняются на сайте — оплата проходит через защищённое окно Kaspi.",
  },
  {
    question: "Что если товара нет в наличии?",
    answer:
      "Если на складе не оказалось заказанной позиции, мы пришлём WhatsApp с предложением замены аналогом. Вы можете согласиться, отказаться или подождать поступления. Без вашего согласия товар никогда не заменяется на другой.",
  },
  {
    question: "Предоставляете ли вы счёт-фактуры?",
    answer:
      "Да, для юридических лиц и ИП предоставляем полный пакет документов: счёт-фактуру, накладную, договор на разовое сотрудничество или абонентский. Документы приходят на email сразу после оплаты и доступны в личном кабинете.",
  },
  {
    question: "Можно ли вернуть товар?",
    answer:
      "Если товар пришёл некачественным или не соответствует заявленному, мы заменим его или вернём деньги. Сообщите нам в течение 24 часов после получения через WhatsApp или в личном кабинете → «Проблема с заказом».",
  },
  {
    question: "Доставляете ли в другие города?",
    answer:
      "Сейчас доставка только по Астане. План по второму городу обсудим лично — если вы из другого города и хотите узнать о возможности доставки, напишите нам в WhatsApp.",
  },
  {
    question: "Можно ли работать с НДС и без?",
    answer:
      "Да, работаем как с компаниями на НДС, так и без. При оформлении заказа укажите БИН/ИИН — система сама подставит нужный формат документов.",
  },
];

const FAQ_EN = [
  {
    question: "How much is delivery?",
    answer:
      "Free delivery across Astana for orders from 20,000 ₸. Smaller orders — 1,000 ₸ delivery fee. For supply subscriptions — free from 7,000 ₸.",
  },
  {
    question: "How fast do you deliver?",
    answer:
      "We dispatch every 3 hours within Astana. Orders placed before 14:00 ship the same day. After 14:00 — next morning. Delivery window is picked at checkout.",
  },
  {
    question: "How does the subscription work?",
    answer:
      "You set up a plan: products, frequency (weekly, twice a week, or every other week), and delivery day/time. A day before each delivery you receive a WhatsApp message where you can confirm, adjust quantities, or skip that delivery. You can pause or cancel at any time. The subscription service is free.",
  },
  {
    question: "What is group buying?",
    answer:
      "Several pastry chefs team up to buy one SKU at the wholesale price. Once the combined volume hits the threshold, the wholesale price activates for everyone. If the group doesn't fill by the deadline — no charge, and you can buy at the regular price.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "Kaspi Pay for individuals and legal entities, bank transfer for companies by invoice. We don't store card details — payment goes through Kaspi's secure window.",
  },
  {
    question: "What if a product is out of stock?",
    answer:
      "If a requested item isn't in the warehouse, we'll send a WhatsApp with a specific substitution proposal. You can accept, decline, or wait for restock. We never substitute silently — your approval is required.",
  },
  {
    question: "Do you provide invoices?",
    answer:
      "Yes, for legal entities and sole proprietors we provide a full document set: invoice, waybill, one-off or recurring contract. Documents arrive by email right after payment and are available in your dashboard.",
  },
  {
    question: "Can I return a product?",
    answer:
      "If a product arrives defective or doesn't match the description, we'll replace it or refund. Notify us within 24 hours of receipt via WhatsApp or in your dashboard → \"Order problem\".",
  },
  {
    question: "Do you deliver to other cities?",
    answer:
      "Currently we deliver only within Astana. Plans for a second city — happy to discuss one-on-one. Message us on WhatsApp if you're outside Astana and want to know more.",
  },
  {
    question: "Can you work both with and without VAT?",
    answer:
      "Yes, we work with both VAT-registered companies and non-VAT entities. At checkout enter your BIN/IIN — the system selects the right document format automatically.",
  },
];

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";
  const FAQ = isEn ? FAQ_EN : FAQ_RU;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />

      <div className="container-tight py-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight md:text-3xl">
          {isEn ? "Frequently asked questions" : "Частые вопросы"}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {isEn ? "Can't find the answer? Message us on " : "Если не нашли ответ — напишите в "}
          <a
            href="https://api.whatsapp.com/send/?phone=77078607779"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            WhatsApp
          </a>
          {isEn ? ", we reply within an hour during business hours." : ", ответим в течение часа в рабочее время."}
        </p>

        <div className="space-y-3">
          {FAQ.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-lg border border-border bg-card p-4 transition-shadow open:shadow-sm"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="text-muted-foreground transition-transform group-open:rotate-180">↓</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
