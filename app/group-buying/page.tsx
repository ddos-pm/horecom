import type { Metadata } from "next";
import Link from "next/link";
import { Users, ShieldCheck, Timer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Групповые закупки — оптовые цены для самозанятых кондитеров",
  description:
    "Объединяйтесь с другими кондитерами для оптовых цен без необходимости держать склад. Цена фиксируется при старте группы.",
};

export default function GroupBuyingPage() {
  return (
    <div className="container-tight py-8 max-w-3xl">
      <Badge variant="info" className="mb-3">Запускаем в V1.5</Badge>
      <h1 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">Групповые закупки</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Маленькие кондитерские и самозанятые мастера объединяются для покупки одного товара по оптовой
        цене — без необходимости каждый раз заказывать тонну муки в одиночку.
      </p>

      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        <Feature
          icon={<Users className="h-5 w-5" />}
          title="Объединяете спрос"
          text="Создаёте группу на нужный товар или присоединяетесь к существующей. Делитесь ссылкой в чатах."
        />
        <Feature
          icon={<Timer className="h-5 w-5" />}
          title="Дедлайн и порог"
          text="Если до дедлайна набирается нужный объём — все получают оптовую цену."
        />
        <Feature
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Цена защищена"
          text="При создании группы цена фиксируется и не меняется, даже если поставщик поднимает прайс."
        />
        <Feature
          icon={<RefreshCw className="h-5 w-5" />}
          title="Если группа не собралась"
          text="Никаких списаний. Можно купить по обычной цене, дождаться следующего окна или отказаться без штрафа."
        />
      </div>

      <section className="prose prose-slate max-w-none">
        <h2>Как это работает</h2>
        <ol>
          <li>Найдите товар который продаётся в групповом режиме (отмечен «Доступна группа»)</li>
          <li>Создайте новую группу или присоединитесь к открытой</li>
          <li>Поделитесь ссылкой с другими кондитерами в WhatsApp / Telegram</li>
          <li>Когда суммарный объём достигнет порога — оплата проходит по оптовой цене для всех</li>
          <li>Доставка на адрес создателя группы (с разделением — в V2)</li>
        </ol>

        <h2>Почему это работает</h2>
        <p>
          Большинство поставщиков ингредиентов в Казахстане отдают опт только от 4+ единиц. Для одной
          небольшой кондитерской это означает либо переплачивать рознично, либо замораживать капитал в
          складе на месяц. Групповые закупки решают эту проблему: 4 кондитера по 1 мешку = опт.
        </p>

        <h2>Когда запускаем</h2>
        <p>
          Групповые закупки — часть V1.5. Сейчас мы готовим механику и подбираем 20–30 пилотных
          участников из текущей базы (76 000 подписчиков в Instagram). Если хотите участвовать в пилоте —
          напишите нам в WhatsApp.
        </p>
      </section>

      <div className="mt-12">
        <a
          href="https://api.whatsapp.com/send/?phone=77078607779&text=Хочу+участвовать+в+пилоте+групповых+закупок"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button size="lg">Участвовать в пилоте</Button>
        </a>
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
