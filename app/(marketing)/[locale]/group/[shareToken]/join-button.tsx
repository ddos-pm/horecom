"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Users, Check } from "lucide-react";
import { useLocale } from "next-intl";
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
  const locale = useLocale();
  const isEn = locale === "en";
  const [qty, setQty] = useState(defaultQty);
  const [pending, startTransition] = useTransition();

  if (alreadyJoined) {
    return (
      <div className="gb-join-state ok">
        <Check className="h-4 w-4" />
        {isEn ? "You're in this group" : "Вы участник этой закупки"}
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <a
        href={`/login?redirectTo=${typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : ""}`}
        className="btn btn-orange btn-lg"
      >
        {isEn ? "Sign in to join" : "Войти и присоединиться"}
      </a>
    );
  }

  if (!canJoin) {
    return (
      <div className="gb-join-state closed">
        {isEn ? "Closed" : "Приём закрыт"}
      </div>
    );
  }

  function handleJoin() {
    startTransition(async () => {
      const res = await joinGroupBuy(offerId, qty);
      if (!res.ok) {
        toast.error(res.error ?? (isEn ? "Could not join" : "Не удалось присоединиться"));
        return;
      }
      toast.success(
        res.alreadyJoined
          ? isEn
            ? "You're already in this group"
            : "Вы уже в этой закупке"
          : isEn
            ? "You joined the group"
            : "Вы присоединились",
      );
    });
  }

  return (
    <div className="gb-join">
      <label className="gb-join-qty">
        <span>{isEn ? "Quantity" : "Сколько берёте"}</span>
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
        {pending
          ? isEn
            ? "Joining…"
            : "Присоединяюсь…"
          : isEn
            ? "Join"
            : "Присоединиться"}
      </Button>
    </div>
  );
}
