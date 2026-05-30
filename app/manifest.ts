import type { MetadataRoute } from "next";
import { getLocaleFromCookie } from "@/lib/locale-cookie";

/**
 * PWA manifest. Icons live in public/ at stable URLs so the manifest can
 * reference them — Next's app/icon.png convention uses hashed URLs that
 * wouldn't survive being copied into a PWA install record.
 *
 * Theme color matches the orange brand mark for the chrome tint shown
 * around the address bar / app shell when installed.
 *
 * Locale awareness: when the user installs the PWA from /en/ the cookie
 * is set to "en", and the manifest exposes English name + description.
 * start_url respects the same locale so the installed app opens to the
 * right home page.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await getLocaleFromCookie();
  const isEn = locale === "en";

  return {
    name: isEn ? "Horecom — B2B wholesale platform" : "Horecom — B2B оптовая платформа",
    short_name: "Horecom",
    description: isEn
      ? "Wholesale ingredient supply for HoReCa in Astana"
      : "Оптовая поставка ингредиентов для HoReCa в Астане",
    start_url: `/${locale}`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#F18305",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
