"use client";

/**
 * Globe-icon language switcher for routes OUTSIDE the [locale] segment
 * (/cart, /checkout, /profile, /admin, …). Reads + writes NEXT_LOCALE
 * cookie, then router.refresh() so the server components re-render with
 * the new locale.
 *
 * Marketing-side equivalent: <LanguageSwitcher> (uses URL routing).
 */

import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocaleCookie } from "@/lib/use-locale-cookie";
import { routing, type Locale } from "@/i18n/routing";

const LOCALES: { value: Locale; label: string; native: string }[] = [
  { value: "ru", label: "RU", native: "Русский" },
  { value: "en", label: "EN", native: "English" },
  { value: "kz", label: "KZ", native: "Қазақша" },
];

export function LanguageSwitcherCookie({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const locale = useLocaleCookie();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function pick(target: Locale) {
    setOpen(false);
    if (target === locale) return;
    // 1 year cookie, root path so it works across the whole app.
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `NEXT_LOCALE=${target}; path=/; max-age=${oneYear}; samesite=lax`;
    router.refresh();
  }

  const current = LOCALES.find((l) => l.value === locale) ?? LOCALES[0];

  return (
    <div className="hc-lang" ref={wrapperRef}>
      <button
        type="button"
        className="hc-lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.native}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        {!compact && <span className="hc-lang-code">{current.label}</span>}
      </button>
      {open && (
        <div className="hc-lang-menu" role="listbox">
          {LOCALES.map((l) => {
            const active = l.value === locale;
            return (
              <button
                key={l.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => pick(l.value)}
                className={`hc-lang-item${active ? " active" : ""}`}
              >
                <span className="hc-lang-item-code">{l.label}</span>
                <span className="hc-lang-item-native">{l.native}</span>
                {active && <Check className="h-3.5 w-3.5 hc-lang-item-check" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
