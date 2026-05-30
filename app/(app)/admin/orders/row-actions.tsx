"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateOrderStatus } from "./actions";

const NEXT_RU: Record<string, { value: string; label: string }[]> = {
  CREATED: [
    { value: "CONFIRMED", label: "Подтвердить" },
    { value: "CANCELLED", label: "Отменить" },
  ],
  CONFIRMED: [
    { value: "PICKING", label: "В сборку" },
    { value: "CANCELLED", label: "Отменить" },
  ],
  PICKING: [
    { value: "OUT_FOR_DELIVERY", label: "В доставку" },
    { value: "CANCELLED", label: "Отменить" },
  ],
  OUT_FOR_DELIVERY: [
    { value: "DELIVERED", label: "Доставлен" },
    { value: "CANCELLED", label: "Отменить" },
  ],
  WAITING_PAYMENT: [
    { value: "PAID", label: "Оплата получена" },
    { value: "CANCELLED", label: "Отменить" },
  ],
  PARTIALLY_CONFIRMED: [
    { value: "PICKING", label: "В сборку" },
    { value: "CANCELLED", label: "Отменить" },
  ],
};

const NEXT_EN: Record<string, { value: string; label: string }[]> = {
  CREATED: [
    { value: "CONFIRMED", label: "Confirm" },
    { value: "CANCELLED", label: "Cancel" },
  ],
  CONFIRMED: [
    { value: "PICKING", label: "To picking" },
    { value: "CANCELLED", label: "Cancel" },
  ],
  PICKING: [
    { value: "OUT_FOR_DELIVERY", label: "To delivery" },
    { value: "CANCELLED", label: "Cancel" },
  ],
  OUT_FOR_DELIVERY: [
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancel" },
  ],
  WAITING_PAYMENT: [
    { value: "PAID", label: "Payment received" },
    { value: "CANCELLED", label: "Cancel" },
  ],
  PARTIALLY_CONFIRMED: [
    { value: "PICKING", label: "To picking" },
    { value: "CANCELLED", label: "Cancel" },
  ],
};

export function OrderRowActions({
  locale,
  orderId,
  status,
}: {
  locale: string;
  orderId: string;
  status: string;
}) {
  const isEn = locale === "en";
  const [pending, startTransition] = useTransition();
  const next = (isEn ? NEXT_EN : NEXT_RU)[status] ?? [];

  function trigger(value: string) {
    if (value === "CANCELLED" && !confirm(isEn ? "Cancel the order?" : "Отменить заказ?")) return;
    startTransition(async () => {
      const r = await updateOrderStatus(orderId, value as Parameters<typeof updateOrderStatus>[1]);
      if (r.success) toast.success(isEn ? "Status updated" : "Статус обновлён");
      else toast.error(r.error);
    });
  }

  if (next.length === 0) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <select
      defaultValue=""
      disabled={pending}
      onChange={(e) => {
        if (e.target.value) {
          trigger(e.target.value);
          e.target.value = "";
        }
      }}
      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
    >
      <option value="">{isEn ? "Action…" : "Действие…"}</option>
      {next.map((n) => (
        <option key={n.value} value={n.value}>
          {n.label}
        </option>
      ))}
    </select>
  );
}
