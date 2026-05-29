"use client";

import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/lib/cart-store";

type Props = {
  product: Omit<CartItem, "quantity"> & { stockStatus?: string | null };
};

export function QuickAddButton({ product }: Props) {
  const locale = useLocale();
  const isEn = locale === "en";
  const addItem = useCart((s) => s.addItem);
  const outOfStock = product.stockStatus === "OUT_OF_STOCK";

  function add() {
    addItem(product);
    toast.success(isEn ? "Added to cart" : "В корзине", {
      description: product.name,
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        add();
      }}
      disabled={outOfStock}
      className="w-full"
    >
      <Plus className="h-4 w-4" />
      {isEn ? "Add to cart" : "В корзину"}
    </Button>
  );
}
