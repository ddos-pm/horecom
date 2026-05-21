"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/lib/cart-store";

export function ReorderButton({ items }: { items: CartItem[] }) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);

  function handleReorder() {
    items.forEach((i) => addItem(i));
    toast.success("Позиции добавлены в корзину", {
      description: `${items.length} наименован.`,
    });
    router.push("/cart");
  }

  return (
    <Button size="lg" className="w-full" onClick={handleReorder}>
      <Repeat className="h-4 w-4" />
      Повторить заказ
    </Button>
  );
}
