import Link from "next/link";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { getLocaleFromCookie } from "@/lib/locale-cookie";
import { OrderRowActions } from "./row-actions";

export const metadata = { title: "Заказы · Admin" };

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

const ALL_STATUSES = Object.keys(STATUS_LABEL_RU);

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filterStatus = status && ALL_STATUSES.includes(status) ? status : null;
  const locale = await getLocaleFromCookie();
  const isEn = locale === "en";
  const STATUS_LABEL = isEn ? STATUS_LABEL_EN : STATUS_LABEL_RU;
  const numFmt = isEn ? "en-US" : "ru-RU";

  const where: Prisma.OrderWhereInput = filterStatus
    ? { status: filterStatus as OrderStatus }
    : { status: { notIn: ["DELIVERED", "CANCELLED"] } };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { company: true, items: { select: { id: true } } },
  });

  return (
    <div className="container-tight py-6 md:py-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold md:text-2xl">{isEn ? "Orders" : "Заказы"}</h1>
        <p className="text-xs text-muted-foreground">
          {orders.length} {isEn ? (orders.length === 1 ? "order" : "orders") : "заказов"}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        <FilterPill href="/admin/orders" label={isEn ? "Active" : "Активные"} active={!filterStatus} />
        {ALL_STATUSES.map((s) => (
          <FilterPill key={s} href={`/admin/orders?status=${s}`} label={STATUS_LABEL[s]} active={filterStatus === s} />
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">{isEn ? "Number" : "Номер"}</th>
              <th className="px-3 py-2 text-left">{isEn ? "Customer" : "Клиент"}</th>
              <th className="px-3 py-2 text-right">{isEn ? "Total" : "Сумма"}</th>
              <th className="px-3 py-2 text-left">{isEn ? "Status" : "Статус"}</th>
              <th className="px-3 py-2 text-left">{isEn ? "Created" : "Создан"}</th>
              <th className="px-3 py-2 text-right">{isEn ? "Actions" : "Действия"}</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  {isEn ? "No orders in this filter" : "Нет заказов в этом фильтре"}
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-primary">
                    {o.number}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {o.items.length} {isEn ? (o.items.length === 1 ? "item" : "items") : "поз."}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs">{o.company.name}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatPrice(o.total.toString())}</td>
                <td className="px-3 py-2">
                  <Badge variant={o.status === "CANCELLED" ? "danger" : "info"}>
                    {STATUS_LABEL[o.status] ?? o.status}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleString(numFmt, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-2 text-right">
                  <OrderRowActions locale={locale} orderId={o.id} status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"
      }`}
    >
      {label}
    </Link>
  );
}
