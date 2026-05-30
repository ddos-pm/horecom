"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "../actions";

const NEXT_RU: Record<string, { value: string; label: string; variant?: "default" | "outline" | "ghost" }[]> = {
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

const NEXT_EN: Record<string, { value: string; label: string; variant?: "default" | "outline" | "ghost" }[]> = {
  CREATED: [
    { value: "CONFIRMED", label: "Confirm" },
    { value: "CANCELLED", label: "Cancel", variant: "outline" },
  ],
  CONFIRMED: [
    { value: "PICKING", label: "To picking" },
    { value: "CANCELLED", label: "Cancel", variant: "outline" },
  ],
  PICKING: [
    { value: "OUT_FOR_DELIVERY", label: "To delivery" },
    { value: "CANCELLED", label: "Cancel", variant: "outline" },
  ],
  OUT_FOR_DELIVERY: [
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancel", variant: "outline" },
  ],
  WAITING_PAYMENT: [
    { value: "PAID", label: "Payment received" },
    { value: "CANCELLED", label: "Cancel", variant: "outline" },
  ],
  PARTIALLY_CONFIRMED: [
    { value: "PICKING", label: "To picking" },
    { value: "CANCELLED", label: "Cancel", variant: "outline" },
  ],
};

export function OrderStatusControls({
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

  if (next.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {isEn ? "Terminal status — no further actions." : "Финальный статус — действий нет."}
      </p>
    );
  }

  function trigger(value: string) {
    if (value === "CANCELLED" && !confirm(isEn ? "Cancel the order?" : "Отменить заказ?")) return;
    startTransition(async () => {
      const r = await updateOrderStatus(orderId, value as Parameters<typeof updateOrderStatus>[1]);
      if (r.success) toast.success(isEn ? "Status updated" : "Статус обновлён");
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
