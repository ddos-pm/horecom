"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useLocale } from "next-intl";
import { localizePackLabel } from "@/lib/format-pack";

export type PickerProduct = {
  id: string;
  name: string;
  brand: string | null;
  packLabel: string;
  sku: string;
};

export function ProductPicker({
  products,
  selected,
  onChange,
  max,
}: {
  products: PickerProduct[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const locale = useLocale();
  const isEn = locale === "en";
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return products;
    const lc = q.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lc) ||
        (p.brand?.toLowerCase().includes(lc) ?? false) ||
        p.sku.toLowerCase().includes(lc),
    );
  }, [q, products]);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      if (max && selected.length >= max) return;
      onChange([...selected, id]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={isEn ? "Search by name, brand, SKU" : "Поиск по названию, бренду, SKU"}
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-muted"
            aria-label={isEn ? "Clear" : "Очистить"}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {isEn ? "Selected: " : "Выбрано: "}<b>{selected.length}</b>
          {max ? (isEn ? ` of ${max}` : ` из ${max}`) : ""}
        </div>
      )}

      <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-input p-1.5">
        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            {isEn ? "Nothing found" : "Ничего не найдено"}
          </div>
        )}
        {filtered.map((p) => {
          const isSel = selected.includes(p.id);
          return (
            <label
              key={p.id}
              className={`flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted ${
                isSel ? "bg-primary/5" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={isSel}
                onChange={() => toggle(p.id)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="line-clamp-1">{p.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {p.brand ? `${p.brand} · ` : ""}
                  {localizePackLabel(p.packLabel, locale)} · {p.sku}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
