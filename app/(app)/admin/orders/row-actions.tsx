"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateOrderStatus } from "./actions";

const NEXT: Record<string, { value: string; label: string }[]> = {
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

export function OrderRowActions({ orderId, status }: { orderId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const next = NEXT[status] ?? [];

  function trigger(value: string) {
    if (value === "CANCELLED" && !confirm("Отменить заказ?")) return;
    startTransition(async () => {
      const r = await updateOrderStatus(orderId, value as Parameters<typeof updateOrderStatus>[1]);
      if (r.success) toast.success("Статус обновлён");
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
      <option value="">Действие…</option>
      {next.map((n) => (
        <option key={n.value} value={n.value}>
          {n.label}
        </option>
      ))}
    </select>
  );
}
