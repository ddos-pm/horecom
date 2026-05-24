"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-store";

/**
 * Header cart icon with a live count badge. Reads the Zustand store so that
 * QuickAdd clicks update the visible count immediately. The badge only
 * renders client-side (after hydration) to avoid an SSR mismatch with the
 * persisted localStorage state.
 *
 * Uses plain <a> (not next-intl Link) because /cart lives OUTSIDE the
 * [locale] segment — APP_PREFIXES in middleware.ts route it through
 * Supabase auth instead of locale routing. A next-intl Link would prefix
 * /ru/cart and 404.
 */
export function CartIconBadge({ className }: { className?: string }) {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <a href="/cart" className={className ?? "hc-cart"} aria-label="Корзина">
      <ShoppingCart className="h-5 w-5" />
      {mounted && count > 0 && (
        <span className="hc-cart-count" aria-label={`${count} в корзине`}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </a>
  );
}
