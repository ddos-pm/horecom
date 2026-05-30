"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { updateStock, updateProduct } from "./actions";

type Product = {
  id: string;
  name: string;
  sku: string;
  brand: string | null;
  packLabel: string;
  unitType: string;
  category: string;
  isActive: boolean;
  stock: number;
  stockStatus: string | null;
};

const STOCK_TONE: Record<string, "success" | "warning" | "danger"> = {
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "danger",
};

const STOCK_LABEL_RU: Record<string, string> = {
  IN_STOCK: "В наличии",
  LOW_STOCK: "Мало",
  OUT_OF_STOCK: "Нет",
};

const STOCK_LABEL_EN: Record<string, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low",
  OUT_OF_STOCK: "Out",
};

export function ProductRow({ locale, product }: { locale: string; product: Product }) {
  const isEn = locale === "en";
  const STOCK_LABEL = isEn ? STOCK_LABEL_EN : STOCK_LABEL_RU;
  const [pending, startTransition] = useTransition();
  const [stock, setStock] = useState(String(product.stock));
  const [brand, setBrand] = useState(product.brand ?? "");
  const [isActive, setIsActive] = useState(product.isActive);

  function saveStock() {
    const n = Number(stock);
    if (Number.isNaN(n) || n < 0) {
      toast.error(isEn ? "Invalid quantity" : "Неверное количество");
      return;
    }
    if (n === product.stock) return;
    startTransition(async () => {
      const r = await updateStock(product.id, { availableQty: n });
      if (r.success) toast.success(isEn ? "Stock updated" : "Сток обновлён");
      else toast.error(r.error);
    });
  }

  function saveBrand() {
    if (brand === (product.brand ?? "")) return;
    startTransition(async () => {
      const r = await updateProduct(product.id, { brand });
      if (r.success) toast.success(isEn ? "Brand updated" : "Бренд обновлён");
      else toast.error(r.error);
    });
  }

  function toggleActive() {
    startTransition(async () => {
      const next = !isActive;
      const r = await updateProduct(product.id, { isActive: next });
      if (r.success) {
        setIsActive(next);
        toast.success(
          next
            ? isEn
              ? "Activated"
              : "Активирован"
            : isEn
              ? "Hidden"
              : "Скрыт",
        );
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <tr className="border-t border-border align-top">
      <td className="px-3 py-2">
        <div className="line-clamp-2 font-medium">{product.name}</div>
        <div className="text-[11px] text-muted-foreground">
          {product.sku} · {product.packLabel}
        </div>
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          onBlur={saveBrand}
          placeholder="—"
          disabled={pending}
          className="w-32 rounded-md border border-input bg-background px-2 py-1 text-xs"
        />
      </td>
      <td className="px-3 py-2 text-xs">{product.category}</td>
      <td className="px-3 py-2 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            onBlur={saveStock}
            disabled={pending}
            className="w-20 rounded-md border border-input bg-background px-2 py-1 text-right text-xs tabular-nums"
          />
          {product.stockStatus && (
            <Badge variant={STOCK_TONE[product.stockStatus] ?? "info"}>
              {STOCK_LABEL[product.stockStatus] ?? product.stockStatus}
            </Badge>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-center">
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={isActive}
            disabled={pending}
            onChange={toggleActive}
          />
        </label>
      </td>
    </tr>
  );
}
