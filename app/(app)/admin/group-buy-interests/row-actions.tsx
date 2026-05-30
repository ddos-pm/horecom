"use client";

import { useTransition } from "react";
import { MessageCircle, Mail, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markInterestProcessed, unmarkInterestProcessed } from "./actions";

export function InterestRowActions({
  locale,
  id,
  processed,
  email,
  phone,
}: {
  locale: string;
  id: string;
  processed: boolean;
  email: string;
  phone: string | null;
}) {
  const isEn = locale === "en";
  const [pending, startTransition] = useTransition();

  function markDone() {
    startTransition(async () => {
      const r = await markInterestProcessed(id, "");
      if (r.success) toast.success(isEn ? "Marked as processed" : "Помечено как обработано");
      else toast.error(r.error);
    });
  }

  function undo() {
    startTransition(async () => {
      const r = await unmarkInterestProcessed(id);
      if (r.success) toast.success(isEn ? "Sent back to queue" : "Возвращено в работу");
      else toast.error(r.error);
    });
  }

  const cleanedPhone = phone?.replace(/\D/g, "");
  const waLink = cleanedPhone
    ? `https://api.whatsapp.com/send/?phone=${cleanedPhone}&text=${encodeURIComponent(
        isEn
          ? "Hello! Regarding your group-buying request at Horecom…"
          : "Здравствуйте! По вашей заявке на групповые закупки в Horecom…",
      )}`
    : null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <a href={`mailto:${email}`}>
        <Button size="sm" variant="ghost" title="Email">
          <Mail className="h-4 w-4" />
        </Button>
      </a>
      {waLink && (
        <a href={waLink} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="ghost" title="WhatsApp">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </a>
      )}
      {processed ? (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={undo}
          title={isEn ? "Return to queue" : "Вернуть в работу"}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      ) : (
        <Button size="sm" disabled={pending} onClick={markDone}>
          <Check className="h-4 w-4" />
          {isEn ? "Processed" : "Обработано"}
        </Button>
      )}
    </div>
  );
}
