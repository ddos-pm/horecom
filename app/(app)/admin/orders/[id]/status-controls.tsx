"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "../actions";

const NEXT: Record<string, { value: string; label: string; variant?: "default" | "outline" | "ghost" }[]> = {
  CREATED: [
    { value: "CONFIRMED", label: "Подтвердить" },
    { value: "CANCELLED", label: "Отменить", variant: "outline" },
  ],
  CONFIRMED: [
    { value: "PICKING", label: "В сборку" },
    { value: "CANCELLED", label: "Отменить", variant: "outline" },
  ],
  PICKING: [
    { value: "OUT_FOR_DELIVERY", label: "В доставку" },
    { value: "CANCELLED", label: "Отменить", variant: "outline" },
  ],
  OUT_FOR_DELIVERY: [
    { value: "DELIVERED", label: "Доставлен" },
    { value: "CANCELLED", label: "Отменить", variant: "outline" },
  ],
  WAITING_PAYMENT: [
    { value: "PAID", label: "Оплата получена" },
    { value: "CANCELLED", label: "Отменить", variant: "outline" },
  ],
  PARTIALLY_CONFIRMED: [
    { value: "PICKING", label: "В сборку" },
    { value: "CANCELLED", label: "Отменить", variant: "outline" },
  ],
};

export function OrderStatusControls({ orderId, status }: { orderId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const next = NEXT[status] ?? [];

  if (next.length === 0) {
    return <p className="text-sm text-muted-foreground">Финальный статус — действий нет.</p>;
  }

  function trigger(value: string) {
    if (value === "CANCELLED" && !confirm("Отменить заказ?")) return;
    startTransition(async () => {
      const r = await updateOrderStatus(orderId, value as Parameters<typeof updateOrderStatus>[1]);
      if (r.success) toast.success("Статус обновлён");
      else toast.error(r.error);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((n) => (
        <Button
          key={n.value}
          variant={n.variant ?? "default"}
          disabled={pending}
          onClick={() => trigger(n.value)}
        >
          {n.label}
        </Button>
      ))}
    </div>
  );
}
