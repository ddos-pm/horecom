import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn
      ? "About — wholesale ingredient supply in Astana"
      : "О компании — оптовая поставка ингредиентов в Астане",
    description: isEn
      ? "Horecom is a B2B procurement platform for pastry shops and HoReCa in Central Asia. 10 years on the market, 50+ customers, 50 suppliers."
      : "Horecom — B2B-платформа закупок для кондитерских и HoReCa в Центральной Азии. 10 лет работы, 50+ клиентов, 50 поставщиков.",
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";

  return (
    <div className="container-tight py-8 max-w-3xl">
      <h1 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
        {isEn ? "About" : "О компании"}
      </h1>
      <p className="mb-8 text-lg text-muted-foreground">
        {isEn
          ? "Horecom is a wholesale supplier of ingredients and consumables for pastry shops and HoReCa in Astana. We've been operating for 10 years."
          : "Horecom — оптовый поставщик ингредиентов и расходных материалов для кондитерских и HoReCa в Астане. Работаем 10 лет."}
      </p>

      <div className="prose prose-slate max-w-none space-y-4 text-foreground">
        <p>
          {isEn
            ? "We started as a small warehouse in the Saryarka district, supplying staples to family-run pastry shops. Today we serve 50+ companies — from independent pastry chefs to chain cafes — and work directly with 50 suppliers: Barry Callebaut, Callebaut, IRCA, Sicao, AmeriColor, Andros, and others."
            : "Мы начинали как небольшой склад в районе Сарыарки, поставляя бакалею в семейные кондитерские. Сегодня обслуживаем 50+ компаний — от частных мастеров до сетевых кафе — и работаем напрямую с 50 поставщиками: Barry Callebaut, Callebaut, IRCA, Sicao, AmeriColor, Andros и другие."}
        </p>

        <p>
          {isEn
            ? "Our warehouse and pickup point is in Astana, at 1 Shamshi Kaldayakov Street. City delivery dispatches every 3 hours."
            : "Наш склад и точка самовывоза находятся в Астане, на улице Шамши Калдаякова 1. Доставка по городу отправляется каждые 3 часа."}
        </p>

        <h2 className="mt-8 text-xl font-semibold">{isEn ? "What we're building" : "Что мы строим"}</h2>
        <p>
          {isEn
            ? "Horecom isn't just a wholesale shop. It's a B2B procurement platform with three workflows on one catalog: fast wholesale ordering for large cafes and restaurants, recurring subscription delivery for small pastry shops, and group buying for independent pastry makers."
            : "Horecom — не просто оптовый магазин. Это B2B-платформа закупок с тремя режимами работы на одном каталоге: быстрый оптовый заказ для крупных кафе и ресторанов, регулярная подписочная доставка для небольших кондитерских, и групповые закупки для самозанятых мастеров."}
        </p>

        <p>
          {isEn
            ? "In 2026 we're shipping new software: web app, mobile app, predictive subscription engine, and group buying. The goal — become procurement infrastructure for ~50,000 HoReCa establishments across five countries in Central Asia."
            : "В 2026 году мы запускаем новый софт: web-приложение, мобильное приложение, предиктивный движок подписки и групповые закупки. Цель — стать procurement-инфраструктурой для ~50 000 заведений HoReCa в пяти странах Центральной Азии."}
        </p>

        <h2 className="mt-8 text-xl font-semibold">{isEn ? "Team" : "Команда"}</h2>
        <p>
          {isEn
            ? "The team brings 10 years in pastry distribution in Astana plus product-management experience at tech companies. Happy to share details over WhatsApp."
            : "За плечами команды — 10 лет в кондитерской дистрибуции в Астане и опыт продуктового менеджмента в tech-компаниях. Подробности готовы рассказать в переписке."}
        </p>

        <h2 className="mt-8 text-xl font-semibold">{isEn ? "Contacts" : "Контакты"}</h2>
        <ul className="space-y-2 list-none p-0">
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {isEn ? "Astana, 1 Shamshi Kaldayakov St." : "Астана, ул. Шамши Калдаякова 1"}
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
              {isEn ? "Message on WhatsApp" : "Написать в WhatsApp"}
            </Button>
          </a>
          <Link href="/catalog">
            <Button variant="outline">{isEn ? "Open catalog" : "Открыть каталог"}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
