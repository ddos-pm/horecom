"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinGroupBuy } from "./actions";

export function JoinGroupButton({
  offerId,
  canJoin,
  alreadyJoined,
  isAuthed,
  defaultQty,
}: {
  offerId: string;
  canJoin: boolean;
  alreadyJoined: boolean;
  isAuthed: boolean;
  defaultQty: number;
}) {
  const [qty, setQty] = useState(defaultQty);
  const [pending, startTransition] = useTransition();

  if (alreadyJoined) {
    return (
      <div className="gb-join-state ok">
        <Check className="h-4 w-4" />
        Вы участник этой закупки
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <a
        href={`/login?redirectTo=${typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : ""}`}
        className="btn btn-orange btn-lg"
      >
        Войти и присоединиться
      </a>
    );
  }

  if (!canJoin) {
    return (
      <div className="gb-join-state closed">
        Приём закрыт
      </div>
    );
  }

  function handleJoin() {
    startTransition(async () => {
      const res = await joinGroupBuy(offerId, qty);
      if (!res.ok) {
        toast.error(res.error ?? "Не удалось присоединиться");
        return;
      }
      toast.success(res.alreadyJoined ? "Вы уже в этой закупке" : "Вы присоединились");
    });
  }

  return (
    <div className="gb-join">
      <label className="gb-join-qty">
        <span>Сколько берёте</span>
        <input
          type="number"
          min={1}
          max={99}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
          className="gb-join-qty-input"
        />
      </label>
      <Button onClick={handleJoin} disabled={pending} size="lg">
        <Users className="h-4 w-4" />
        {pending ? "Присоединяюсь…" : "Присоединиться"}
      </Button>
    </div>
  );
}
