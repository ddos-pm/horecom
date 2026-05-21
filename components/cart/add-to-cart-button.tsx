"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/lib/cart-store";
import { formatUnit } from "@/lib/units";

type Props = {
  product: Omit<CartItem, "quantity"> & { stockStatus?: string | null };
};

export function AddToCartButton({ product }: Props) {
  const addItem = useCart((s) => s.addItem);
  const [qty, setQty] = useState(product.minOrderQty);

  const outOfStock = product.stockStatus === "OUT_OF_STOCK";

  function dec() {
    setQty((q) => Math.max(q - product.minOrderQty, product.minOrderQty));
  }
  function inc() {
    setQty((q) => q + product.minOrderQty);
  }
  function add() {
    addItem({ ...product, quantity: qty });
    toast.success("Добавлено в корзину", {
      description: `${product.name} · ${qty} ${formatUnit(product.unitType)}`,
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <div className="inline-flex items-stretch overflow-hidden rounded-md border border-input">
        <button
          type="button"
          onClick={dec}
          disabled={qty <= product.minOrderQty}
          className="px-3 hover:bg-muted disabled:opacity-50"
          aria-label="Уменьшить"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="flex min-w-[60px] items-center justify-center bg-background px-2 text-sm tabular-nums">
          {qty}
        </div>
        <button
          type="button"
          onClick={inc}
          className="px-3 hover:bg-muted"
          aria-label="Увеличить"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <Button size="lg" className="flex-1" onClick={add} disabled={outOfStock}>
        {outOfStock ? "Нет в наличии" : "Добавить в корзину"}
      </Button>
    </div>
  );
}
