"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Share2, Check } from "lucide-react";
import { useLocale } from "next-intl";
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
  const locale = useLocale();
  const isEn = locale === "en";
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const numFmt = isEn ? "en-US" : "ru-RU";
    const text = isEn
      ? `We're putting together a wholesale group buy: ${productName} at ${groupPrice.toLocaleString(numFmt)} ₸. Join:`
      : `Собираем оптовую закупку: ${productName} по ${groupPrice.toLocaleString(numFmt)} ₸. Присоединяйся:`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: isEn ? "Group buy · Horecom" : "Групповая закупка · Horecom",
          text,
          url,
        });
        return;
      } catch {
        // user dismissed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      toast.success(isEn ? "Link copied" : "Ссылка скопирована");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error(isEn ? "Could not copy the link" : "Не удалось скопировать ссылку");
    }
  }

  return (
    <Button onClick={handleShare} variant="outline" size="lg">
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied
        ? isEn
          ? "Copied"
          : "Скопировано"
        : isEn
          ? "Invite friends"
          : "Пригласить друзей"}
    </Button>
  );
}
