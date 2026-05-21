import type { Metadata } from "next";
import Link from "next/link";
import { Bell, RefreshCcw, Sliders, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Подписка на доставку ингредиентов",
  description:
    "Регулярная доставка для кондитерских: гибкий график, WhatsApp-напоминания, edit/skip/pause всегда доступны. Бесплатно.",
};

export default function SubscriptionPage() {
  return (
    <div className="container-tight py-8 max-w-3xl">
      <h1 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">Подписка на доставку</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Не успеваете отслеживать когда что заканчивается? Подключите подписку — мы доставим вовремя
        и напомним заранее.
      </p>

      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        <Feature
          icon={<Sliders className="h-5 w-5" />}
          title="Гибкий график"
          text="Выберите дни недели, частоту (еженедельно, дважды в неделю, раз в 2 недели) и время доставки."
        />
        <Feature
          icon={<Bell className="h-5 w-5" />}
          title="Напоминание за день"
          text="Получите WhatsApp с составом следующей доставки. Можете подтвердить, изменить или пропустить."
        />
        <Feature
          icon={<RefreshCcw className="h-5 w-5" />}
          title="Предиктивная доставка"
          text="После 2 успешных доставок система предсказывает оптимальную частоту по вашей истории."
        />
        <Feature
          icon={<PauseCircle className="h-5 w-5" />}
          title="Edit / Skip / Pause"
          text="Изменить состав, пропустить одну доставку или приостановить подписку — в один клик."
        />
      </div>

      <section className="prose prose-slate max-w-none">
        <h2>Как настроить подписку</h2>
        <ol>
          <li>Выберите товары которые регулярно покупаете</li>
          <li>Определите частоту и дни доставки</li>
          <li>Укажите адрес доставки</li>
          <li>Подключите Kaspi для автоматических платежей или платите вручную после подтверждения</li>
        </ol>

        <h2>Что бывает с подпиской</h2>
        <ul>
          <li><strong>За 24 часа до доставки</strong> — приходит WhatsApp с составом</li>
          <li><strong>Если цена изменилась</strong> — мы сообщим за 48 часов, можно отказаться от этой доставки</li>
          <li><strong>Если товара нет на складе</strong> — предложим замену аналогом по той же цене</li>
          <li><strong>Если вы не ответили в течение 2 часов до cutoff</strong> — отменяем эту доставку (default-fallback)</li>
        </ul>

        <h2>Стоимость</h2>
        <p>
          Сервис подписки <strong>бесплатный</strong>. Вы платите только за товары. Бесплатная доставка
          для заказов от 7 000 ₸ в режиме подписки (вместо 30 000 ₸ для разовых).
        </p>

        <h2>Можно отменить?</h2>
        <p>
          Да, в любой момент. Никаких штрафов, никаких контрактов. Возможна также «пауза» — например,
          если вы уехали в отпуск и хотите вернуться через 2 недели.
        </p>
      </section>

      <div className="mt-12 flex gap-3">
        <Link href="/catalog?subscription=true">
          <Button size="lg">Подобрать товары</Button>
        </Link>
        <Link href="/how-ordering-works">
          <Button size="lg" variant="outline">Подробнее о заказе</Button>
        </Link>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{text}</div>
    </div>
  );
}
