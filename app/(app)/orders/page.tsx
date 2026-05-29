import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { getLocaleFromCookie } from "@/lib/locale-cookie";

export const metadata = { title: "Мои заказы" };

const STATUS_LABEL_RU: Record<string, string> = {
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

const STATUS_LABEL_EN: Record<string, string> = {
  CREATED: "Created",
  INVOICE_SENT: "Invoice sent",
  WAITING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  PARTIALLY_CONFIRMED: "Partially confirmed",
  PICKING: "Picking",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/orders");

  const [dbUser, locale] = await Promise.all([
    prisma.user.findUnique({ where: { supabaseId: user.id } }),
    getLocaleFromCookie(),
  ]);
  if (!dbUser?.companyId) redirect("/onboarding");
  const isEn = locale === "en";
  const STATUS_LABEL = isEn ? STATUS_LABEL_EN : STATUS_LABEL_RU;

  const orders = await prisma.order.findMany({
    where: { companyId: dbUser.companyId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: { select: { id: true } } },
  });

  if (orders.length === 0) {
    return (
      <div className="container-tight py-12 text-center">
        <h1 className="text-2xl font-semibold">
          {isEn ? "No orders yet" : "Заказов пока нет"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEn ? "Open the catalog and place your first order." : "Откройте каталог и оформите первый заказ."}
        </p>
        <Link href={`/${locale}/catalog`} className="mt-4 inline-block">
          <Button size="lg">{isEn ? "Open catalog" : "Открыть каталог"}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-tight py-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{isEn ? "My orders" : "Мои заказы"}</h1>

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
                {new Date(order.createdAt).toLocaleString(isEn ? "en-US" : "ru-RU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" · "}
                {order.items.length} {isEn ? (order.items.length === 1 ? "item" : "items") : "поз."}
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
