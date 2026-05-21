import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Мои заказы" };

const STATUS_LABEL: Record<string, string> = {
  CREATED: "Создан",
  INVOICE_SENT: "Счёт выставлен",
  WAITING_PAYMENT: "Ждёт оплату",
  PAID: "Оплачен",
  CONFIRMED: "Подтверждён",
  PARTIALLY_CONFIRMED: "Часть подтверждена",
  PICKING: "Собирается",
  OUT_FOR_DELIVERY: "В доставке",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/orders");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser?.companyId) redirect("/onboarding");

  const orders = await prisma.order.findMany({
    where: { companyId: dbUser.companyId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: { select: { id: true } } },
  });

  if (orders.length === 0) {
    return (
      <div className="container-tight py-12 text-center">
        <h1 className="text-2xl font-semibold">Заказов пока нет</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Откройте каталог и оформите первый заказ.
        </p>
        <Link href="/catalog" className="mt-4 inline-block">
          <Button size="lg">Открыть каталог</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-tight py-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">Мои заказы</h1>

      <div className="space-y-2">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 hover:border-foreground/20 hover:shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>{order.number}</span>
                <Badge variant={order.status === "CANCELLED" ? "danger" : "info"}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </Badge>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" · "}
                {order.items.length} поз.
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="tabular-nums font-semibold">{formatPrice(order.total.toString())}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
