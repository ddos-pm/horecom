"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Receipt, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Issue a Kaspi Pay invoice for the order and copy the resulting URL to
 * clipboard so the manager can paste it into WhatsApp. If creds are not
 * configured the API returns a stub URL — same UX, just clearly marked.
 */
export function IssueInvoiceButton({
  orderId,
  locale,
  existingPaymentUrl,
}: {
  orderId: string;
  locale: string;
  existingPaymentUrl?: string | null;
}) {
  const isEn = locale === "en";
  const [pending, setPending] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(existingPaymentUrl ?? null);

  async function issue() {
    setPending(true);
    try {
      const res = await fetch("/api/payments/kaspi/invoice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = (await res.json()) as { paymentUrl?: string; error?: string; mode?: string };
      if (!res.ok || !data.paymentUrl) {
        toast.error(data.error ?? (isEn ? "Could not issue invoice" : "Не удалось выставить счёт"));
        return;
      }
      setPaymentUrl(data.paymentUrl);
      if (data.mode === "stub") {
        toast.success(
          isEn
            ? "Stub invoice created (no Kaspi creds)"
            : "Создан заглушка-счёт (нет ключей Kaspi)",
        );
      } else {
        toast.success(isEn ? "Invoice issued" : "Счёт выставлен");
      }
    } finally {
      setPending(false);
    }
  }

  async function copy() {
    if (!paymentUrl) return;
    try {
      await navigator.clipboard.writeText(paymentUrl);
      toast.success(isEn ? "Link copied" : "Ссылка скопирована");
    } catch {
      toast.error(isEn ? "Could not copy" : "Не удалось скопировать");
    }
  }

  if (paymentUrl) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline truncate max-w-[240px]"
          title={paymentUrl}
        >
          {paymentUrl}
        </a>
        <Button size="sm" variant="ghost" onClick={copy} title={isEn ? "Copy link" : "Скопировать"}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={issue} disabled={pending}>
      <Receipt className="h-4 w-4" />
      {pending
        ? isEn
          ? "Issuing…"
          : "Выставляю…"
        : isEn
          ? "Issue Kaspi invoice"
          : "Выставить счёт Kaspi"}
    </Button>
  );
}
