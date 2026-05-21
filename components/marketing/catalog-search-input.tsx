"use client";

import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";

/**
 * Live search for the catalog. Debounces 300ms then pushes `?q=` to the URL,
 * which lets the server component re-fetch with the filter. We preserve any
 * existing searchParams (category, subscription, group) so the user can refine
 * within a category. Pressing Enter submits immediately.
 */
export function CatalogSearchInput({
  defaultValue,
  placeholder,
}: {
  defaultValue: string;
  placeholder: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      const trimmed = value.trim();
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      const qs = next.toString();
      const target = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => router.replace(target as never));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <label className="search-big">
      <Search className="h-4 w-4" />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Поиск товаров"
      />
      <kbd className="kbd-shortcut">⌘K</kbd>
    </label>
  );
}
