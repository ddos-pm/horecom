"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareGroupButton({
  url,
  productName,
  groupPrice,
}: {
  url: string;
  productName: string;
  groupPrice: number;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = `Собираем оптовую закупку: ${productName} по ${groupPrice.toLocaleString("ru-RU")} ₸. Присоединяйся:`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "Групповая закупка · Horecom", text, url });
        return;
      } catch {
        // user dismissed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      toast.success("Ссылка скопирована");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  }

  return (
    <Button onClick={handleShare} variant="outline" size="lg">
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Скопировано" : "Пригласить друзей"}
    </Button>
  );
}
