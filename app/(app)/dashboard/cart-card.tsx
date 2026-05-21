"use client";

import Link from "next/link";
import { useCart, getCartSubtotal, getCartItemCount } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CartCard() {
  const items = useCart((s) => s.items);
  const count = getCartItemCount(items);
  const subtotal = getCartSubtotal(items);

  if (count === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs text-muted-foreground">Корзина</div>
        <div className="mt-2 text-lg font-semibold">Пусто</div>
        <Link href="/catalog" className="mt-3 inline-block">
          <Button size="sm" variant="outline">
            Открыть каталог
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">Корзина</div>
      <div className="mt-2 text-lg font-semibold tabular-nums">{formatPrice(subtotal.toString())}</div>
      <div className="text-xs text-muted-foreground">{count} ед. в корзине</div>
      <Link href="/cart" className="mt-3 inline-block">
        <Button size="sm">Открыть корзину</Button>
      </Link>
    </div>
  );
}
