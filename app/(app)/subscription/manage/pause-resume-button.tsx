"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleSubscriptionStatus } from "./actions";

export function PauseResumeButton({
  planId,
  status,
}: {
  planId: string;
  status: "ACTIVE" | "PAUSED" | "REVIEW_REQUIRED" | "CANCELLED";
}) {
  const [pending, startTransition] = useTransition();
  if (status !== "ACTIVE" && status !== "PAUSED") return null;

  const isActive = status === "ACTIVE";

  function handleClick() {
    startTransition(async () => {
      const res = await toggleSubscriptionStatus(planId);
      if (!res.ok) {
        toast.error(res.error ?? "Не удалось переключить статус");
        return;
      }
      toast.success(res.status === "PAUSED" ? "Подписка приостановлена" : "Подписка возобновлена");
    });
  }

  return (
    <Button size="sm" variant="ghost" onClick={handleClick} disabled={pending}>
      {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      {pending ? "Сохраняю…" : isActive ? "Приостановить" : "Возобновить"}
    </Button>
  );
}
