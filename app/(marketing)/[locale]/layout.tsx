import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Toaster } from "sonner";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { LocaleBanner } from "@/components/marketing/locale-banner";
import { FloatingCartBar } from "@/components/cart/floating-cart-bar";
import { JsonLd, ORG_JSON_LD, WEBSITE_JSON_LD } from "@/components/json-ld";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
      <JsonLd data={ORG_JSON_LD} />
      <JsonLd data={WEBSITE_JSON_LD} />
      <MarketingHeader />
      <LocaleBanner />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      <FloatingCartBar />
      <Toaster richColors position="bottom-right" />
    </NextIntlClientProvider>
  );
}
