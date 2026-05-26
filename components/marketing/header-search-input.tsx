"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/routing";

/**
 * Header / drawer search input. Lives on every marketing page, so unlike the
 * catalog-inline input it has to handle both states:
 *
 *   - User is already on /catalog → debounce 300ms then router.replace,
 *     preserving any active category/subscription/group filter.
 *   - User is anywhere else (home, PDP, FAQ) → debounce 300ms then
 *     router.push("/catalog?q=…") so they land on filtered results.
 *
 * Pressing Enter triggers the navigation immediately (no debounce wait).
 *
 * We deliberately don't subscribe to `useSearchParams()` here — that would
 * bail every static marketing page out of pre-rendering. Instead we read
 * window.location.search synchronously at navigation time. Header has no
 * UI state that depends on the URL between renders.
 *
 * `onAfterSubmit` lets the mobile drawer close itself once a query is
 * dispatched.
 */
export function HeaderSearchInput({
  placeholder,
  className,
  showShortcut = false,
  onAfterSubmit,
}: {
  placeholder: string;
  className?: string;
  showShortcut?: boolean;
  onAfterSubmit?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Read ?q= from the URL via window after mount instead of useSearchParams —
  // subscribing here would bail every statically prerendered marketing page
  // out of the static export with a "missing-suspense-with-csr-bailout" error.
  const [value, setValue] = useState("");
  const [, startTransition] = useTransition();
  const lastSentRef = useRef("");

  // Hydrate the input from the URL once on mount and on history navigation
  // (back/forward, programmatic push from the catalog search box).
  useEffect(() => {
    function readUrl() {
      if (typeof window === "undefined") return;
      const q = new URLSearchParams(window.location.search).get("q") ?? "";
      if (q !== lastSentRef.current) {
        lastSentRef.current = q;
        setValue(q);
      }
    }
    readUrl();
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, [pathname]);

  function navigate(q: string) {
    if (typeof window === "undefined") return;
    const trimmed = q.trim();
    if (trimmed === lastSentRef.current) return;
    lastSentRef.current = trimmed;

    const onCatalog = pathname === "/catalog";
    if (onCatalog) {
      const next = new URLSearchParams(window.location.search);
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      const qs = next.toString();
      const target = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => router.replace(target as never));
    } else if (trimmed) {
      startTransition(() => router.push(`/catalog?q=${encodeURIComponent(trimmed)}` as never));
    }
  }

  // Debounce — fires 300ms after the last keystroke.
  useEffect(() => {
    const t = setTimeout(() => navigate(value), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate(value);
    onAfterSubmit?.();
  }

  return (
    <form onSubmit={handleSubmit} role="search" className={className}>
      <Search className="h-4 w-4" aria-hidden="true" />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Поиск товаров"
      />
      {showShortcut && <kbd className="kbd-shortcut">⌘K</kbd>}
    </form>
  );
}
