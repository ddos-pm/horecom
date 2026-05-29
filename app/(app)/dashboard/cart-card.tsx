"use client";

import Link from "next/link";
import { useCart, getCartSubtotal, getCartItemCount } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocaleCookie } from "@/lib/use-locale-cookie";

export function CartCard() {
  const locale = useLocaleCookie();
  const isEn = locale === "en";
  const items = useCart((s) => s.items);
  const count = getCartItemCount(items);
  const subtotal = getCartSubtotal(items);

  if (count === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs text-muted-foreground">{isEn ? "Cart" : "Корзина"}</div>
        <div className="mt-2 text-lg font-semibold">{isEn ? "Empty" : "Пусто"}</div>
        <Link href={`/${locale}/catalog`} className="mt-3 inline-block">
          <Button size="sm" variant="outline">
            {isEn ? "Open catalog" : "Открыть каталог"}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{isEn ? "Cart" : "Корзина"}</div>
      <div className="mt-2 text-lg font-semibold tabular-nums">{formatPrice(subtotal.toString())}</div>
      <div className="text-xs text-muted-foreground">
        {isEn ? `${count} units in cart` : `${count} ед. в корзине`}
      </div>
      <Link href="/cart" className="mt-3 inline-block">
        <Button size="sm">{isEn ? "Open cart" : "Открыть корзину"}</Button>
      </Link>
    </div>
  );
}
