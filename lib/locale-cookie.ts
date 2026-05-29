/**
 * Locale-cookie helpers for routes that live OUTSIDE the [locale] segment
 * (cart, checkout, profile, dashboard, login, onboarding, admin, …).
 *
 * next-intl's middleware writes NEXT_LOCALE on every marketing-path response.
 * The browser then sends it on subsequent navigations to /cart etc., so we
 * can recover "the locale this user is browsing in" without putting the
 * locale in the URL.
 *
 * Server: getLocaleFromCookie() — async, uses next/headers cookies().
 * Client: useLocaleFromCookie() — reads document.cookie, defaults to "ru".
 *
 * Both return one of routing.locales; unknown values fall back to defaultLocale.
 */

import { routing, type Locale } from "@/i18n/routing";

const LOCALES = routing.locales as readonly string[];

function pickLocale(raw: string | undefined): Locale {
  if (raw && LOCALES.includes(raw)) return raw as Locale;
  return routing.defaultLocale;
}

export async function getLocaleFromCookie(): Promise<Locale> {
  // Dynamic import keeps this module usable from client code (where
  // next/headers throws on import). The async server call only runs on
  // server invocations.
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return pickLocale(store.get("NEXT_LOCALE")?.value);
}

export function readLocaleFromDocument(): Locale {
  if (typeof document === "undefined") return routing.defaultLocale;
  const m = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/);
  return pickLocale(m?.[1]);
}
