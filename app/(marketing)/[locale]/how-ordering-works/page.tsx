import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Как заказать — пошагово",
  description:
    "Заказ в Horecom за 4 шага: каталог → корзина → доставка → оплата. Доставка по Астане, оплата через Kaspi.",
};

export default function HowOrderingWorksPage() {
  return (
    <div className="container-tight py-8 max-w-3xl">
      <h1 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">Как работает заказ</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Заказать в Horecom можно тремя способами: через сайт, через WhatsApp или подключив подписку.
      </p>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Через сайт</h2>
        <ol className="space-y-4">
          <Step
            n={1}
            title="Найдите товары в каталоге"
            text="Поиск по названию, бренду или артикулу. Фильтры по категории, наличию, минимальному заказу."
          />
          <Step
            n={2}
            title="Добавьте в корзину"
            text="Цена и минимальный заказ всегда видны. При оптовой закупке (от пороговой суммы) применяется скидка."
          />
          <Step
            n={3}
            title="Оформите доставку"
            text="Выберите адрес, день и время доставки. Минимальный заказ — 5 000 ₸. Бесплатная доставка от 30 000 ₸."
          />
          <Step
            n={4}
            title="Оплатите через Kaspi или безналом"
            text="Для физлиц и ИП — Kaspi Pay. Для юрлиц — безналичный перевод по реквизитам. Документы (счёт-фактура, накладная) приходят на email."
          />
        </ol>

        <h2 className="mt-12 text-xl font-semibold">Через WhatsApp</h2>
        <p>
          Напишите нам в WhatsApp{" "}
          <a href="https://api.whatsapp.com/send/?phone=77078607779" className="text-primary hover:underline">
            +7 707 860 77 79
          </a>
          . Менеджер уточнит детали, пришлёт счёт и отправит заказ к выбранному времени. Это удобно для срочных
          заказов или когда нужна консультация по подбору.
        </p>

        <h2 className="mt-12 text-xl font-semibold">Через подписку (для постоянных закупок)</h2>
        <p>
          Если вы регулярно покупаете одни и те же товары, настройте подписку: выберите SKU, частоту
          (еженедельно, дважды в неделю или раз в две недели), дни и время доставки.
        </p>
        <ul className="space-y-2 list-disc pl-6">
          <li>За день до доставки приходит WhatsApp-уведомление с составом</li>
          <li>Можно подтвердить, изменить количество, пропустить эту доставку или поставить на паузу</li>
          <li>Подписка бесплатная и отменяется в любой момент</li>
          <li>После 2 успешных доставок система начинает предсказывать оптимальную частоту по вашей истории</li>
        </ul>

        <h2 className="mt-12 text-xl font-semibold">Политика замены товаров</h2>
        <p>
          <strong>Мы никогда не заменяем товар без вашего согласия.</strong> Если на складе не оказалось
          заказанной позиции, мы пришлём WhatsApp с конкретным предложением замены аналогом — с фото и
          ценой. Вы можете:
        </p>
        <ul className="space-y-2 list-disc pl-6">
          <li>Согласиться на замену</li>
          <li>Отказаться (позиция убирается из заказа, сумма пересчитывается)</li>
          <li>Подождать поступления товара (доставка переносится)</li>
        </ul>
        <p>
          В настройках компании можно заранее выбрать: всегда спрашивать, автоматически принимать аналоги
          одного бренда, или никогда не заменять.
        </p>

        <h2 className="mt-12 text-xl font-semibold">Частичная отгрузка</h2>
        <p>
          Если из 10 позиций в заказе 8 есть на складе, а 2 — нет, мы не задерживаем весь заказ. Отгружаем
          доступные позиции, по двум пропавшим запускаем процесс замены или возврата. Статус каждой
          позиции в заказе виден отдельно.
        </p>
      </section>

      <div className="mt-12">
        <Link href="/catalog">
          <Button size="lg">Открыть каталог</Button>
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
