"use client";

import { useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { changeSubscriptionStatus } from "./actions";

export function SubscriptionRowActions({
  planId,
  status,
  waPhone,
  waPrefill,
}: {
  planId: string;
  status: string;
  waPhone: string | null;
  waPrefill: string;
}) {
  const [pending, startTransition] = useTransition();

  function trigger(next: "ACTIVE" | "PAUSED" | "CANCELLED") {
    if (next === "CANCELLED" && !confirm("Отменить подписку?")) return;
    startTransition(async () => {
      const r = await changeSubscriptionStatus(planId, next);
      if (r.success) toast.success("Статус обновлён");
      else toast.error(r.error);
    });
  }

  const waPhoneCleaned = waPhone?.replace(/\D/g, "");
  const waLink = waPhoneCleaned
    ? `https://api.whatsapp.com/send/?phone=${waPhoneCleaned}&text=${encodeURIComponent(waPrefill)}`
    : null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {status !== "ACTIVE" && (
        <Button size="sm" disabled={pending} onClick={() => trigger("ACTIVE")}>
          Активировать
        </Button>
      )}
      {status === "ACTIVE" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => trigger("PAUSED")}>
          Поставить на паузу
        </Button>
      )}
      {status !== "CANCELLED" && (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => trigger("CANCELLED")} className="text-destructive">
          Отклонить
        </Button>
      )}
      {waLink && (
        <a href={waLink} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="ghost" title="Связаться в WhatsApp">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </a>
      )}
    </div>
  );
}
