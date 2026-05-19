import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { JsonLd, ORG_JSON_LD, WEBSITE_JSON_LD } from "@/components/json-ld";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://horecom.kz"),
  title: {
    default: "Horecom — оптовый магазин ингредиентов для кондитеров и HoReCa в Астане",
    template: "%s · Horecom",
  },
  description:
    "Шоколад Barry Callebaut, начинки IRCA, бакалея и упаковка оптом. Подписка с доставкой по Астане. 10 лет на рынке. 50+ B2B-клиентов.",
  keywords: [
    "оптовый кондитерский магазин Астана",
    "ингредиенты для HoReCa Казахстан",
    "Barry Callebaut Астана",
    "шоколад оптом",
    "доставка кондитерских ингредиентов",
    "B2B procurement Kazakhstan",
  ],
  openGraph: {
    type: "website",
    locale: "ru_KZ",
    url: "https://horecom.kz",
    siteName: "Horecom",
    title: "Horecom — оптовый магазин ингредиентов для кондитеров и HoReCa",
    description:
      "B2B-платформа закупок для кондитеров и HoReCa в Центральной Азии. Подписка, оптовые цены, доставка по Астане.",
  },
  alternates: {
    canonical: "https://horecom.kz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <head>
        <JsonLd data={ORG_JSON_LD} />
        <JsonLd data={WEBSITE_JSON_LD} />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
