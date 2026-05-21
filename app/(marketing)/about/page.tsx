import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "О компании — оптовая поставка ингредиентов в Астане",
  description:
    "Horecom — B2B-платформа закупок для кондитерских и HoReCa в Центральной Азии. 10 лет работы, 50+ клиентов, 50 поставщиков.",
};

export default function AboutPage() {
  return (
    <div className="container-tight py-8 max-w-3xl">
      <h1 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">О компании</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Horecom — оптовый поставщик ингредиентов и расходных материалов для кондитерских и HoReCa в Астане.
        Работаем 10 лет.
      </p>

      <div className="prose prose-slate max-w-none space-y-4 text-foreground">
        <p>
          Мы начинали как небольшой склад в районе Сарыарки, поставляя бакалею в семейные кондитерские.
          Сегодня обслуживаем 50+ компаний — от частных мастеров до сетевых кафе — и работаем напрямую с
          50 поставщиками: Barry Callebaut, Callebaut, IRCA, Sicao, AmeriColor, Andros и другие.
        </p>

        <p>
          Наш склад и точка самовывоза находятся в Астане, на улице Шамши Калдаякова 1. Доставка по городу
          отправляется каждые 3 часа. В 2026 году запускаем Алматы как второй город.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Что мы строим</h2>
        <p>
          Horecom — не просто оптовый магазин. Это B2B-платформа закупок с тремя режимами работы на одном
          каталоге: быстрый оптовый заказ для крупных кафе и ресторанов, регулярная подписочная доставка для
          небольших кондитерских, и групповые закупки для самозанятых мастеров.
        </p>

        <p>
          В 2026 году мы запускаем новый софт: web-приложение, мобильное приложение, предиктивный движок
          подписки и групповые закупки. Цель — стать procurement-инфраструктурой для ~50 000 заведений HoReCa
          в пяти странах Центральной Азии.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Команда</h2>
        <p>
          <strong>co-founder</strong> — директор и операционный со-основатель. До Horecom 5+ лет вела
          сеть кондитерских магазинов (redacted) в Астане по франшизе.
        </p>
        <p>
          <strong>Даулет Досаманов</strong> — со-основатель и CPO, отвечает за продукт и платформу.
          Senior Product Manager в a major mobility tech company, ранее (redacted) super-app. (redacted) alumnus. В 2024 году получил
          награду (redacted) за инициативу в активации новых пользователей.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Контакты</h2>
        <ul className="space-y-2 list-none p-0">
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Астана, ул. Шамши Калдаякова 1
          </li>
          <li className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href="tel:+77078607779" className="text-primary hover:underline">+7 707 860 77 79</a>
          </li>
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href="mailto:info@horecom.kz" className="text-primary hover:underline">info@horecom.kz</a>
          </li>
        </ul>

        <div className="mt-8 flex gap-3">
          <a
            href="https://api.whatsapp.com/send/?phone=77078607779"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>
              <MessageCircle className="h-4 w-4" />
              Написать в WhatsApp
            </Button>
          </a>
          <Link href="/catalog">
            <Button variant="outline">Открыть каталог</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
