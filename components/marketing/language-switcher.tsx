"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { routing, type Locale } from "@/i18n/routing";

const LABEL: Record<Locale, string> = {
  ru: "Русский",
  kz: "Қазақша",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function change(next: Locale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="inline-flex items-center gap-1">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => change(l as Locale)}
          aria-current={l === locale ? "true" : undefined}
          className={`rounded px-1.5 py-0.5 text-[11px] ${
            l === locale ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {LABEL[l as Locale]}
        </button>
      ))}
    </div>
  );
}
