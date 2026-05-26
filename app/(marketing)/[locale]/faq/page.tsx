import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Частые вопросы — оплата, доставка, подписка",
  description:
    "Минимальный заказ, способы оплаты, доставка по Астане, как работает подписка, что делать если товара нет.",
};

const FAQ = [
  {
    question: "Какой минимальный заказ?",
    answer:
      "Минимальная сумма заказа в Horecom — 5 000 ₸. Бесплатная доставка по Астане для заказов от 30 000 ₸. Заказы меньше — доставка 1 000 ₸.",
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

export default function FaqPage() {
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
        <h1 className="mb-2 text-2xl font-bold tracking-tight md:text-3xl">Частые вопросы</h1>
        <p className="mb-8 text-muted-foreground">
          Если не нашли ответ — напишите в{" "}
          <a
            href="https://api.whatsapp.com/send/?phone=77078607779"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            WhatsApp
          </a>
          , ответим в течение часа в рабочее время.
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
