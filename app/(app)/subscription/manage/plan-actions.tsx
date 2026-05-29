"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleSubscriptionStatus, cancelSubscription } from "./actions";

/**
 * Pause/Resume/Cancel actions for a single subscription plan.
 *
 * Pause/Resume is reversible and never asks for confirmation. Cancel is
 * destructive (the plan becomes CANCELLED and disappears from active
 * lists), so it goes through a native confirm() before firing.
 *
 * Hides itself for REVIEW_REQUIRED — those plans live in a manager
 * queue and toggling them client-side would skip the review gate.
 */
export function PlanActions({
  locale,
  planId,
  status,
}: {
  locale: string;
  planId: string;
  status: "ACTIVE" | "PAUSED" | "REVIEW_REQUIRED" | "CANCELLED";
}) {
  const isEn = locale === "en";
  const [pending, startTransition] = useTransition();

  // Cancelled plans show no actions.
  if (status === "CANCELLED" || status === "REVIEW_REQUIRED") return null;

  const isActive = status === "ACTIVE";

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleSubscriptionStatus(planId);
      if (!res.ok) {
        toast.error(res.error ?? (isEn ? "Could not toggle status" : "Не удалось переключить статус"));
        return;
      }
      toast.success(
        res.status === "PAUSED"
          ? isEn
            ? "Subscription paused"
            : "Подписка приостановлена"
          : isEn
            ? "Subscription resumed"
            : "Подписка возобновлена",
      );
    });
  }

  function handleCancel() {
    if (typeof window !== "undefined") {
      if (
        !window.confirm(
          isEn
            ? "Cancel the subscription? This is irreversible — the plan stops, history is kept."
            : "Отменить подписку? Действие необратимо — план перестанет работать, история сохранится.",
        )
      ) {
        return;
      }
    }
    startTransition(async () => {
      const res = await cancelSubscription(planId);
      if (!res.ok) {
        toast.error(res.error ?? (isEn ? "Could not cancel" : "Не удалось отменить"));
        return;
      }
      toast.success(isEn ? "Subscription cancelled" : "Подписка отменена");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button size="sm" variant="ghost" onClick={handleToggle} disabled={pending}>
        {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        {pending
          ? isEn
            ? "Saving…"
            : "Сохраняю…"
          : isActive
            ? isEn
              ? "Pause"
              : "Приостановить"
            : isEn
              ? "Resume"
              : "Возобновить"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCancel}
        disabled={pending}
        className="text-destructive hover:bg-destructive/10"
      >
        <X className="h-3.5 w-3.5" />
        {isEn ? "Cancel" : "Отменить"}
      </Button>
    </div>
  );
}
