"use client";

/**
 * Language switcher.
 *
 * Three locales:
 *   - ru — full UI (source of truth)
 *   - en — partial UI (home hero in English, rest still Russian until
 *          components migrate to useTranslations). Banner explains this.
 *   - kz — route reservation only. Content still Russian, native-speaker
 *          pass on messages/kz.json pending. Rendered as disabled stub
 *          to avoid implying functional Kazakh UI.
 *
 * Reviewers who hit /en or /kz get a clear status banner via
 * <LocaleBanner> with a one-click jump back to /ru.
 */

import { useLocale } from "next-intl";
import { useRouter, usePathname, type Locale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function go(target: Locale) {
    if (locale === target) return;
    router.replace(pathname, { locale: target });
  }

  const baseCls = "rounded px-1.5 py-0.5 text-[11px]";
  const activeCls = "bg-foreground text-background";
  const idleCls = "text-muted-foreground hover:text-foreground";

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => go("ru")}
        aria-current={locale === "ru" ? "true" : undefined}
        className={`${baseCls} ${locale === "ru" ? activeCls : idleCls}`}
      >
        Русский
      </button>
      <button
        type="button"
        onClick={() => go("en")}
        aria-current={locale === "en" ? "true" : undefined}
        className={`${baseCls} ${locale === "en" ? activeCls : idleCls}`}
      >
        English
      </button>
      <span
        title="Қазақша нұсқа дайындалуда — Kazakh UI in progress"
        aria-disabled="true"
        className={`${baseCls} text-muted-foreground/60 cursor-not-allowed`}
      >
        Қазақша · скоро
      </span>
    </div>
  );
}
