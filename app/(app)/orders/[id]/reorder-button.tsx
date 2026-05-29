"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/lib/cart-store";
import { useLocaleCookie } from "@/lib/use-locale-cookie";

export function ReorderButton({ items }: { items: CartItem[] }) {
  const router = useRouter();
  const locale = useLocaleCookie();
  const isEn = locale === "en";
  const addItem = useCart((s) => s.addItem);

  function handleReorder() {
    items.forEach((i) => addItem(i));
    toast.success(isEn ? "Items added to cart" : "Позиции добавлены в корзину", {
      description: isEn ? `${items.length} items.` : `${items.length} наименован.`,
    });
    router.push("/cart");
  }

  return (
    <Button size="lg" className="w-full" onClick={handleReorder}>
      <Repeat className="h-4 w-4" />
      {isEn ? "Reorder" : "Повторить заказ"}
    </Button>
  );
}
