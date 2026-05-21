"use client";

/**
 * Language switcher.
 *
 * V0 behaviour: the /kz routes exist and are reachable (so any external
 * link or pre-indexed URL still resolves), but the catalog/marketing content
 * isn't translated yet. To avoid showing the same Russian copy on a KZ URL —
 * which would look broken to a reviewer — KZ is rendered as a disabled
 * "Қазақша · скоро" label. The switcher will become interactive once
 * messages/kz.json gets a native-speaker pass.
 */

import { useLocale } from "next-intl";
import { useRouter, usePathname, routing, type Locale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function goRussian() {
    if (locale === "ru") return;
    router.replace(pathname, { locale: "ru" });
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={goRussian}
        aria-current={locale === "ru" ? "true" : undefined}
        className={`rounded px-1.5 py-0.5 text-[11px] ${
          locale === "ru" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Русский
      </button>
      <span
        title="Казахская версия в разработке"
        aria-disabled="true"
        className="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground/60 cursor-not-allowed"
      >
        Қазақша · скоро
      </span>
    </div>
  );
}

// Silence unused warnings — kept for future swap-in when KZ ships.
void routing;
