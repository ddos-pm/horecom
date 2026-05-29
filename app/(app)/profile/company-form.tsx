"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateCompany } from "./actions";

const SEGMENT_LABEL_RU: Record<string, string> = {
  ENTERPRISE: "Ресторан / кафе / отель",
  SMB_REPLENISHMENT: "Кондитерская / пекарня",
  MICRO_GROUPBUY: "Самозанятый кондитер",
};

const SEGMENT_LABEL_EN: Record<string, string> = {
  ENTERPRISE: "Restaurant / cafe / hotel",
  SMB_REPLENISHMENT: "Bakery / pastry shop",
  MICRO_GROUPBUY: "Independent pastry maker",
};

const SUBSTITUTION_LABEL_RU: Record<string, string> = {
  ASK: "Всегда спрашивать перед заменой",
  SAME_BRAND_ONLY: "Заменять аналогом того же бренда",
  NEVER: "Никогда не заменять",
};

const SUBSTITUTION_LABEL_EN: Record<string, string> = {
  ASK: "Always ask before substituting",
  SAME_BRAND_ONLY: "Substitute only with the same brand",
  NEVER: "Never substitute",
};

type Props = {
  locale: string;
  initial: {
    name: string;
    binOrIin: string | null;
    segment: string;
    substitutionPreference: string;
  };
};

export function CompanyForm({ locale, initial }: Props) {
  const isEn = locale === "en";
  const SEGMENT_LABEL = isEn ? SEGMENT_LABEL_EN : SEGMENT_LABEL_RU;
  const SUBSTITUTION_LABEL = isEn ? SUBSTITUTION_LABEL_EN : SUBSTITUTION_LABEL_RU;

  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initial.name);
  const [binOrIin, setBinOrIin] = useState(initial.binOrIin ?? "");
  const [sub, setSub] = useState(initial.substitutionPreference);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateCompany({
        name,
        binOrIin,
        substitutionPreference: sub as "ASK" | "SAME_BRAND_ONLY" | "NEVER",
      });
      if (result.success) toast.success(isEn ? "Saved" : "Сохранено");
      else toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-semibold">{isEn ? "Company" : "Компания"}</h2>
      <Field label={isEn ? "Company name" : "Название компании"}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>
      <Field label="BIN / IIN">
        <input
          type="text"
          value={binOrIin}
          onChange={(e) => setBinOrIin(e.target.value)}
          placeholder={isEn ? "12 digits" : "12 цифр"}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={isEn ? "Segment" : "Сегмент"}>
          <div className="rounded-md border border-dashed border-input bg-muted/40 px-3 py-2 text-sm">
            {SEGMENT_LABEL[initial.segment] ?? initial.segment}
          </div>
          <span className="mt-1 block text-[11px] text-muted-foreground">
            {isEn ? "To change segment — message us on WhatsApp." : "Для смены сегмента — связаться в WhatsApp."}
          </span>
        </Field>
        <Field label={isEn ? "Out-of-stock substitutions" : "Замены при отсутствии"}>
          <select
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {Object.entries(SUBSTITUTION_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending
            ? isEn
              ? "Saving…"
              : "Сохраняю…"
            : isEn
              ? "Save"
              : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
