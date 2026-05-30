"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCart,
  getCartSubtotal,
  getDeliveryFee,
  getCartTotal,
  getCartWarnings,
  CART_LIMITS,
} from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import { localizePackLabel } from "@/lib/format-pack";
import { useLocaleCookie } from "@/lib/use-locale-cookie";

export default function CartPage() {
  const locale = useLocaleCookie();
  const isEn = locale === "en";
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);

  if (items.length === 0) {
    return <EmptyCart isEn={isEn} />;
  }

  const subtotal = getCartSubtotal(items);
  const delivery = getDeliveryFee(subtotal);
  const total = getCartTotal(items);
  const warnings = getCartWarnings(items, locale as "ru" | "en" | "kz");
  const belowMin = subtotal < CART_LIMITS.MIN_ORDER_TOTAL;

  return (
    <div className="container-tight py-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{isEn ? "Cart" : "Корзина"}</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex gap-3 rounded-lg border border-border bg-card p-3"
            >
              <Link
                href={`/${locale}/product/${item.slug}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted"
              >
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl opacity-60">📦</div>
                )}
              </Link>
              <div className="flex flex-1 flex-col">
                <Link
                  href={`/${locale}/product/${item.slug}`}
                  className="line-clamp-2 text-sm font-medium hover:text-primary"
                >
                  {item.name}
                </Link>
                <div className="mt-1 text-xs text-muted-foreground">
                  {localizePackLabel(item.packLabel, locale)} · {formatPrice(item.price.toString())} ·{" "}
                  {isEn ? `min. ${item.minOrderQty}` : `мин. ${item.minOrderQty}`}
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="inline-flex items-stretch overflow-hidden rounded-md border border-input">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity - item.minOrderQty)}
                      disabled={item.quantity <= item.minOrderQty}
                      className="px-2 py-1 hover:bg-muted disabled:opacity-50"
                      aria-label={isEn ? "Decrease" : "Уменьшить"}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex min-w-[44px] items-center justify-center bg-background px-2 text-sm tabular-nums">
                      {item.quantity}
                    </div>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity + item.minOrderQty)}
                      className="px-2 py-1 hover:bg-muted"
                      aria-label={isEn ? "Increase" : "Увеличить"}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="tabular-nums text-sm font-semibold">
                      {formatPrice((item.price * item.quantity).toString())}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={isEn ? "Remove" : "Удалить"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-3 rounded-lg border border-border bg-card p-4 lg:sticky lg:top-20">
          {warnings.length > 0 && (
            <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              <ul className="space-y-1">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-1.5 text-sm">
            <Row label={isEn ? "Subtotal" : "Сумма товаров"} value={formatPrice(subtotal.toString())} />
            <Row
              label={isEn ? "Delivery" : "Доставка"}
              value={
                delivery === 0
                  ? isEn
                    ? "free"
                    : "бесплатно"
                  : formatPrice(delivery.toString())
              }
              muted={delivery === 0}
            />
            <div className="my-2 h-px bg-border" />
            <Row label={isEn ? "Total" : "Итого"} value={formatPrice(total.toString())} bold />
          </div>

          <Link href="/checkout" className={belowMin ? "pointer-events-none" : ""}>
            <Button size="lg" className="w-full" disabled={belowMin}>
              {isEn ? "Checkout" : "Оформить заказ"}
            </Button>
          </Link>
          <Link href={`/${locale}/catalog`}>
            <Button size="lg" variant="ghost" className="w-full">
              {isEn ? "Continue shopping" : "Продолжить покупки"}
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "text-base font-semibold" : ""}`}>
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function EmptyCart({ isEn }: { isEn: boolean }) {
  return (
    <div className="container-tight py-12">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">{isEn ? "Cart is empty" : "Корзина пуста"}</h1>
        <p className="mb-6 text-muted-foreground">
          {isEn
            ? `Add products from the catalog. Minimum order — ${CART_LIMITS.MIN_ORDER_TOTAL.toLocaleString("en-US")} ₸.`
            : `Добавьте товары из каталога. Минимальный заказ — ${CART_LIMITS.MIN_ORDER_TOTAL.toLocaleString("ru-RU")} ₸.`}
        </p>
        <Link href={isEn ? "/en/catalog" : "/ru/catalog"}>
          <Button size="lg">{isEn ? "Open catalog" : "Открыть каталог"}</Button>
        </Link>
      </div>
    </div>
  );
}
