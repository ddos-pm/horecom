"use client";

import { useEffect, useState } from "react";
import { routing, type Locale } from "@/i18n/routing";
import { readLocaleFromDocument } from "./locale-cookie";

/**
 * Client hook to read NEXT_LOCALE cookie for app pages outside the
 * [locale] segment. Renders defaultLocale until hydrated to keep SSR
 * markup identical to first client paint (avoids hydration warnings).
 */
export function useLocaleCookie(): Locale {
  const [locale, setLocale] = useState<Locale>(routing.defaultLocale);
  useEffect(() => {
    setLocale(readLocaleFromDocument());
  }, []);
  return locale;
}
