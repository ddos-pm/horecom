"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductPicker, type PickerProduct } from "@/components/product-picker";
import { updateItemStatus, proposeSubstitute } from "../actions";

type Props = {
  locale: string;
  itemId: string;
  itemStatus: string;
  substituteProductId: string | null;
  substituteReason: string | null;
  products: PickerProduct[];
};

export function ItemControls({
  locale,
  itemId,
  itemStatus,
  substituteProductId,
  substituteReason,
  products,
}: Props) {
  const isEn = locale === "en";
  const [pending, startTransition] = useTransition();
  const [openSub, setOpenSub] = useState(false);
  const [subId, setSubId] = useState<string | null>(substituteProductId);
  const [reason, setReason] = useState(substituteReason ?? "");

  function setStatus(status: string) {
    startTransition(async () => {
      const r = await updateItemStatus(itemId, status as Parameters<typeof updateItemStatus>[1]);
      if (r.success) toast.success(isEn ? "Item updated" : "Позиция обновлена");
      else toast.error(r.error);
    });
  }

  function submitSubstitute() {
    if (!subId) {
      toast.error(isEn ? "Pick a substitute product" : "Выберите товар для замены");
      return;
    }
    startTransition(async () => {
      const r = await proposeSubstitute(itemId, subId, reason);
      if (r.success) {
        toast.success(
          isEn
            ? "Substitute proposed. Reach out to the customer on WhatsApp."
            : "Замена предложена. Свяжитесь с клиентом в WhatsApp.",
        );
        setOpenSub(false);
      } else {
        toast.error(r.error);
      }
    });
  }

  const sub = subId ? products.find((p) => p.id === subId) : null;

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          variant="ghost"
          disabled={pending || itemStatus === "CONFIRMED"}
          onClick={() => setStatus("CONFIRMED")}
        >
          {isEn ? "✓ Confirm" : "✓ Подтвердить"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending || itemStatus === "OUT_OF_STOCK"}
          onClick={() => setStatus("OUT_OF_STOCK")}
        >
          {isEn ? "Out of stock" : "Нет в наличии"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => setOpenSub((v) => !v)}
        >
          {isEn ? "Substitute" : "Замена"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending || itemStatus === "CANCELLED"}
          onClick={() => setStatus("CANCELLED")}
          className="text-destructive"
        >
          {isEn ? "Cancel" : "Отменить"}
        </Button>
      </div>

      {sub && !openSub && (
        <p className="mt-2 text-xs text-muted-foreground">
          {isEn ? "Substitute: " : "Замена: "}<b>{sub.name}</b>
          {substituteReason ? ` — ${substituteReason}` : ""}
        </p>
      )}

      {openSub && (
        <div className="mt-3 space-y-3 rounded-md bg-muted/30 p-3">
          <div className="text-xs font-medium text-muted-foreground">
            {isEn ? "Pick a substitute product" : "Выбрать товар-аналог"}
          </div>
          <ProductPicker
            products={products}
            selected={subId ? [subId] : []}
            onChange={(next) => setSubId(next[next.length - 1] ?? null)}
            max={1}
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isEn ? "Reason (optional)" : "Причина замены (необязательно)"}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpenSub(false)}>
              {isEn ? "Cancel" : "Отмена"}
            </Button>
            <Button size="sm" onClick={submitSubstitute} disabled={pending || !subId}>
              {pending
                ? isEn
                  ? "Saving…"
                  : "Сохраняю…"
                : isEn
                  ? "Propose substitute"
                  : "Предложить замену"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isEn
              ? "In V0 the customer notification is sent manually via WhatsApp. In V1 — auto-template via 360dialog."
              : "В V0 уведомление клиенту — через WhatsApp вручную. В V1 — авто-шаблон через 360dialog."}
          </p>
        </div>
      )}
    </div>
  );
}
