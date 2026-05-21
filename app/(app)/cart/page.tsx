import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Корзина",
};

export default function CartPage() {
  return (
    <div className="container-tight py-12">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Корзина пуста</h1>
        <p className="mb-6 text-muted-foreground">
          Добавьте товары из каталога. Минимальный заказ — 5 000 ₸.
        </p>
        <Link href="/catalog">
          <Button size="lg">Открыть каталог</Button>
        </Link>
      </div>
    </div>
  );
}
