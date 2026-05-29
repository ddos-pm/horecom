import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Как заказать — пошагово",
  description:
    "Заказ в Horecom за 4 шага: каталог → корзина → доставка → оплата. Доставка по Астане, оплата через Kaspi.",
};

export default async function HowOrderingWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";

  const STEPS = isEn
    ? [
        { n: 1, title: "Find products in the catalog", text: "Search by name, brand, or SKU. Filter by category, stock, and minimum order." },
        { n: 2, title: "Add to cart", text: "Price and minimum order are always visible. For wholesale-volume orders (above the threshold) a discount applies automatically." },
        { n: 3, title: "Choose delivery", text: "Pick the address, day, and time window. Free delivery from 20,000 ₸." },
        { n: 4, title: "Pay via Kaspi or bank transfer", text: "Individuals and sole proprietors — KaspiPay link on WhatsApp. Legal entities — invoice on request and bank transfer. Documents (invoice, waybill) arrive by email." },
      ]
    : [
        { n: 1, title: "Найдите товары в каталоге", text: "Поиск по названию, бренду или артикулу. Фильтры по категории, наличию, минимальному заказу." },
        { n: 2, title: "Добавьте в корзину", text: "Цена и минимальный заказ всегда видны. При оптовой закупке (от пороговой суммы) применяется скидка." },
        { n: 3, title: "Оформите доставку", text: "Выберите адрес, день и время доставки. Бесплатная доставка от 20 000 ₸." },
        { n: 4, title: "Оплатите через Kaspi или безналом", text: "Для физлиц и ИП — ссылка KaspiPay в WhatsApp. Для юрлиц — счёт на оплату по запросу и безналичный перевод по реквизитам. Документы (счёт-фактура, накладная) приходят на email." },
      ];

  return (
    <div className="container-tight py-8 max-w-3xl">
      <h1 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
        {isEn ? "How an order flows" : "Как работает заказ"}
      </h1>
      <p className="mb-8 text-lg text-muted-foreground">
        {isEn
          ? "You can order from Horecom three ways: through the site, on WhatsApp, or via a supply subscription."
          : "Заказать в Horecom можно тремя способами: через сайт, через WhatsApp или подключив подписку."}
      </p>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">{isEn ? "Through the site" : "Через сайт"}</h2>
        <ol className="space-y-4">
          {STEPS.map((s) => (
            <Step key={s.n} n={s.n} title={s.title} text={s.text} />
          ))}
        </ol>

        <h2 className="mt-12 text-xl font-semibold">{isEn ? "On WhatsApp" : "Через WhatsApp"}</h2>
        <p>
          {isEn ? "Message us on WhatsApp " : "Напишите нам в WhatsApp "}
          <a href="https://api.whatsapp.com/send/?phone=77078607779" className="text-primary hover:underline">
            +7 707 860 77 79
          </a>
          {isEn
            ? ". An account manager will confirm details, send an invoice, and dispatch the order at the chosen time. Useful for urgent orders or when you need a recommendation."
            : ". Менеджер уточнит детали, пришлёт счёт и отправит заказ к выбранному времени. Это удобно для срочных заказов или когда нужна консультация по подбору."}
        </p>

        <h2 className="mt-12 text-xl font-semibold">
          {isEn ? "Via a subscription (for recurring buys)" : "Через подписку (для постоянных закупок)"}
        </h2>
        <p>
          {isEn
            ? "If you regularly buy the same SKUs, set up a subscription: pick the items, frequency (weekly, twice a week, or every other week), and delivery day/time."
            : "Если вы регулярно покупаете одни и те же товары, настройте подписку: выберите SKU, частоту (еженедельно, дважды в неделю или раз в две недели), дни и время доставки."}
        </p>
        <ul className="space-y-2 list-disc pl-6">
          {isEn ? (
            <>
              <li>A day before delivery a WhatsApp notification arrives with the basket</li>
              <li>You can confirm, adjust quantities, skip this delivery, or pause the plan</li>
              <li>The subscription is free and can be cancelled at any time</li>
              <li>After 2 successful deliveries the system starts predicting the optimal cadence from your history</li>
            </>
          ) : (
            <>
              <li>За день до доставки приходит WhatsApp-уведомление с составом</li>
              <li>Можно подтвердить, изменить количество, пропустить эту доставку или поставить на паузу</li>
              <li>Подписка бесплатная и отменяется в любой момент</li>
              <li>После 2 успешных доставок система начинает предсказывать оптимальную частоту по вашей истории</li>
            </>
          )}
        </ul>

        <h2 className="mt-12 text-xl font-semibold">
          {isEn ? "Substitution policy" : "Политика замены товаров"}
        </h2>
        <p>
          {isEn ? (
            <><strong>We never substitute a product without your approval.</strong> If a requested item isn't in stock, we send a WhatsApp with a specific substitution proposal — photo and price included. You can:</>
          ) : (
            <><strong>Мы никогда не заменяем товар без вашего согласия.</strong> Если на складе не оказалось заказанной позиции, мы пришлём WhatsApp с конкретным предложением замены аналогом — с фото и ценой. Вы можете:</>
          )}
        </p>
        <ul className="space-y-2 list-disc pl-6">
          {isEn ? (
            <>
              <li>Accept the substitution</li>
              <li>Decline (the item is removed and the total is recalculated)</li>
              <li>Wait for restock (delivery is rescheduled)</li>
            </>
          ) : (
            <>
              <li>Согласиться на замену</li>
              <li>Отказаться (позиция убирается из заказа, сумма пересчитывается)</li>
              <li>Подождать поступления товара (доставка переносится)</li>
            </>
          )}
        </ul>
        <p>
          {isEn
            ? "In your company settings you can pre-configure: always ask, auto-accept same-brand alternatives, or never substitute."
            : "В настройках компании можно заранее выбрать: всегда спрашивать, автоматически принимать аналоги одного бренда, или никогда не заменять."}
        </p>

        <h2 className="mt-12 text-xl font-semibold">
          {isEn ? "Partial shipment" : "Частичная отгрузка"}
        </h2>
        <p>
          {isEn
            ? "If 8 of 10 items in an order are in stock and 2 are not, we don't hold the whole order. We ship what's available and start the substitution-or-refund flow for the missing items. The status of each line item is shown separately."
            : "Если из 10 позиций в заказе 8 есть на складе, а 2 — нет, мы не задерживаем весь заказ. Отгружаем доступные позиции, по двум пропавшим запускаем процесс замены или возврата. Статус каждой позиции в заказе виден отдельно."}
        </p>
      </section>

      <div className="mt-12">
        <Link href="/catalog">
          <Button size="lg">{isEn ? "Open catalog" : "Открыть каталог"}</Button>
        </Link>
      </div>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <li className="flex gap-4">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold tabular">
        {n}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="mt-1 text-muted-foreground">{text}</div>
      </div>
    </li>
  );
}
