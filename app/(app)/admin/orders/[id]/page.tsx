import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { OrderStatusControls } from "./status-controls";
import { ItemControls } from "./item-controls";

export const metadata = { title: "Заказ · Admin" };

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

const ITEM_STATUS_LABEL: Record<string, string> = {
  PENDING: "В ожидании",
  CONFIRMED: "Подтверждена",
  SUBSTITUTED: "Замена",
  OUT_OF_STOCK: "Нет в наличии",
  CANCELLED: "Отменена",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      company: true,
      address: true,
      items: { include: { product: true } },
    },
  });
  if (!order) notFound();

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, brand: true, packLabel: true, sku: true },
    orderBy: { name: "asc" },
  });

  const window = order.deliveryWindow as { date?: string; slot?: string };

  return (
    <div className="container-tight py-6 md:py-8">
      <Link href="/admin/orders" className="mb-3 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← К списку
      </Link>

      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Заказ {order.number}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {order.company.name} · Создан{" "}
            {new Date(order.createdAt).toLocaleString("ru-RU")}
          </p>
        </div>
        <Badge variant={order.status === "CANCELLED" ? "danger" : "info"}>
          {STATUS_LABEL[order.status] ?? order.status}
        </Badge>
      </header>

      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <div className="mb-2 text-xs font-medium text-muted-foreground">Действия со статусом</div>
        <OrderStatusControls orderId={order.id} status={order.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Позиции</h3>
          {order.items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.product.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.productNameSnapshot}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl opacity-60">📦</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col text-sm">
                  <div className="font-medium">{item.productNameSnapshot}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.unitLabelSnapshot} · {formatPrice(item.unitPrice.toString())} × {item.quantity}
                  </div>
                  <div className="mt-1">
                    <Badge variant={item.itemStatus === "CANCELLED" || item.itemStatus === "OUT_OF_STOCK" ? "danger" : "info"}>
                      {ITEM_STATUS_LABEL[item.itemStatus] ?? item.itemStatus}
                    </Badge>
                  </div>
                </div>
                <div className="tabular-nums text-sm font-medium">
                  {formatPrice(item.lineTotal.toString())}
                </div>
              </div>
              <ItemControls
                itemId={item.id}
                itemStatus={item.itemStatus}
                substituteProductId={item.substituteProductId}
                substituteReason={item.substituteReason}
                products={products}
              />
            </div>
          ))}
        </section>

        <aside className="h-fit space-y-3 rounded-lg border border-border bg-card p-4 text-sm">
          <div>
            <div className="text-xs font-medium text-muted-foreground">Клиент</div>
            <div className="mt-1">{order.company.name}</div>
            {order.company.binOrIin && (
              <div className="text-xs text-muted-foreground">БИН/ИИН {order.company.binOrIin}</div>
            )}
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Адрес</div>
            <div className="mt-1">
              {order.address.street}, {order.address.house}
              {order.address.details ? `, ${order.address.details}` : ""}
            </div>
            {window.date && (
              <div className="text-xs text-muted-foreground">
                {new Date(window.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                {", "}
                {window.slot}
              </div>
            )}
          </div>
          {order.comment && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Комментарий клиента</div>
              <div className="mt-1 text-sm">«{order.comment}»</div>
            </div>
          )}
          <div className="border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Товары</span>
              <span className="tabular-nums">{formatPrice(order.subtotal.toString())}</span>
            </div>
            <div className="mt-1 flex justify-between font-semibold">
              <span>Итого</span>
              <span className="tabular-nums">{formatPrice(order.total.toString())}</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Замены</div>
            <div className="mt-1">{order.substitutionPreference}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
