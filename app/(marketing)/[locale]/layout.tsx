import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Toaster } from "sonner";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { LocaleBanner } from "@/components/marketing/locale-banner";
import { FloatingCartBar } from "@/components/cart/floating-cart-bar";
import { JsonLd, buildOrgJsonLd, buildWebsiteJsonLd } from "@/components/json-ld";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/base-url";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Per-locale metadata override.
 *
 * Root app/layout.tsx provides a Russian default. This generateMetadata
 * wins for any URL under the [locale] segment, so /en/* gets an English
 * title + description in browser tabs and link previews. Each individual
 * page can still override further with its own metadata export.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  const title = isEn
    ? "Horecom — wholesale ingredients for pastry shops and HoReCa in Astana"
    : "Horecom — оптовый магазин ингредиентов для кондитеров и HoReCa в Астане";
  const description = isEn
    ? "Barry Callebaut chocolate, IRCA fillings, staples and packaging — wholesale. Supply subscriptions with delivery across Astana. 10 years on the market. 50+ B2B customers."
    : "Шоколад Barry Callebaut, начинки IRCA, бакалея и упаковка оптом. Подписка с доставкой по Астане. 10 лет на рынке. 50+ B2B-клиентов.";

  return {
    title: { default: title, template: "%s · Horecom" },
    description,
    keywords: isEn
      ? [
          "wholesale pastry ingredients Astana",
          "HoReCa supplies Kazakhstan",
          "Barry Callebaut Astana",
          "chocolate wholesale",
          "Central Asia B2B procurement",
        ]
      : [
          "оптовый кондитерский магазин Астана",
          "ингредиенты для HoReCa Казахстан",
          "Barry Callebaut Астана",
          "шоколад оптом",
          "B2B procurement Kazakhstan",
        ],
    openGraph: {
      type: "website",
      locale: isEn ? "en_US" : "ru_KZ",
      url: `${SITE_URL}/${locale}`,
      siteName: "Horecom",
      title,
      description,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Horecom" }],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        ru: `${SITE_URL}/ru`,
        en: `${SITE_URL}/en`,
        kk: `${SITE_URL}/kz`,
        "x-default": `${SITE_URL}/ru`,
      },
    },
  };
}

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      <JsonLd data={buildOrgJsonLd(locale)} />
      <JsonLd data={buildWebsiteJsonLd(locale)} />
      <MarketingHeader />
      <LocaleBanner />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      <FloatingCartBar />
      <Toaster richColors position="bottom-right" />
    </NextIntlClientProvider>
  );
}
