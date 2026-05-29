"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCart, getCartSubtotal, getCartItemCount } from "@/lib/cart-store";

/**
 * Sticky bottom bar that surfaces after the first add-to-cart. Hidden on
 * /cart and /checkout (the bar would be redundant there), on PDP-image
 * fullscreen, and on auth screens.
 *
 * Visible-only-on-mobile by default — desktop has the header cart icon
 * with a count badge, which is enough screen real estate. The mobile
 * header crams nav + logo + cart icon into < 393px, so the inline cart
 * status often gets cut; the floating bar gives the "1 item in cart"
 * status its own row at the bottom of the viewport.
 */
export function FloatingCartBar() {
  const pathname = usePathname();
  const locale = useLocale();
  const isEn = locale === "en";
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);

  // Zustand+persist hydrates on the client only — avoid the SSR flash of
  // an empty cart by waiting for client mount before rendering anything.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (items.length === 0) return null;

  // Hide on routes where the bar would be redundant or in the way.
  const HIDE_ON = ["/cart", "/checkout", "/login", "/onboarding"];
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  const count = getCartItemCount(items);
  const subtotal = getCartSubtotal(items);
  const numFmt = isEn ? "en-US" : "ru-RU";

  const ariaSummary = isEn
    ? `Cart: ${count} items, ${subtotal.toLocaleString(numFmt)} tenge`
    : `Корзина: ${count} позиций, ${subtotal.toLocaleString(numFmt)} тенге`;

  return (
    <Link
      href="/cart"
      className="floating-cart-bar"
      aria-label={ariaSummary}
    >
      <ShoppingBag className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <span className="floating-cart-text">
        <b>{count}</b> {isEn ? pluralizeEn(count) : pluralizeRu(count)} ·{" "}
        {subtotal.toLocaleString(numFmt)} ₸
      </span>
      <span className="floating-cart-cta">
        {isEn ? "Open cart" : "Открыть корзину"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

function pluralizeRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "позиция";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "позиции";
  return "позиций";
}

function pluralizeEn(n: number): string {
  return n === 1 ? "item" : "items";
}
