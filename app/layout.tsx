import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/base-url";
import { getLocaleFromCookie } from "@/lib/locale-cookie";

// Single Inter family covers both body text and display headings.
// Cyrillic subset is required for the Russian-first UI. Weights pruned to
// the four actually used in CSS (400 body, 500 medium, 600 semibold,
// 700 bold). Display swap so first paint isn't blocked on the woff2.
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

// Russian-default metadata — covers the (app) and (auth) trees which live
// outside the [locale] segment. The (marketing) tree provides a
// locale-aware override via app/(marketing)/[locale]/layout.tsx, so /en
// pages show English titles in the browser tab and link previews.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    url: SITE_URL,
    siteName: "Horecom",
    title: "Horecom — оптовый магазин ингредиентов для кондитеров и HoReCa",
    description:
      "B2B-платформа закупок для кондитеров и HoReCa в Центральной Азии. Подписка, оптовые цены, доставка по Астане.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Horecom" }],
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

// Theme color isn't auto-emitted from manifest.ts — declare it via Next's
// viewport export so the iOS Safari address bar + Android Chrome chrome tint
// match the orange mark.
export const viewport: import("next").Viewport = {
  themeColor: "#F18305",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // <html lang> drives screen-reader pronunciation, browser auto-translate
  // prompts, and language-aware CSS like quote glyphs. Read NEXT_LOCALE
  // cookie (set by next-intl middleware on every marketing-path response,
  // persists across navigation to app/admin routes). Map "kz" → "kk" for
  // BCP-47 conformance — schema.org and WCAG validators reject "kz" alone.
  const locale = await getLocaleFromCookie();
  const htmlLang = locale === "kz" ? "kk" : locale;

  return (
    <html lang={htmlLang} className={inter.variable}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
