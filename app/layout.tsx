import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/base-url";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter-tight",
  display: "swap",
});

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
  // No explicit `icons:` — Next.js auto-detects app/icon.png and
  // app/apple-icon.png (and emits <link rel="icon"> / <link rel="apple-touch-icon">
  // pointing at the hashed versions). An explicit override would short-circuit
  // that and point at stale paths.
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${interTight.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
