"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateCompany } from "./actions";

const SEGMENT_LABEL: Record<string, string> = {
  ENTERPRISE: "Ресторан / кафе / отель",
  SMB_REPLENISHMENT: "Кондитерская / пекарня",
  MICRO_GROUPBUY: "Самозанятый кондитер",
};

const SUBSTITUTION_LABEL: Record<string, string> = {
  ASK: "Всегда спрашивать перед заменой",
  SAME_BRAND_ONLY: "Заменять аналогом того же бренда",
  NEVER: "Никогда не заменять",
};

type Props = {
  initial: {
    name: string;
    binOrIin: string | null;
    segment: string;
    substitutionPreference: string;
  };
};

export function CompanyForm({ initial }: Props) {
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
      if (result.success) toast.success("Сохранено");
      else toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-semibold">Компания</h2>
      <Field label="Название компании">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>
      <Field label="БИН / ИИН">
        <input
          type="text"
          value={binOrIin}
          onChange={(e) => setBinOrIin(e.target.value)}
          placeholder="12 цифр"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Сегмент">
          <div className="rounded-md border border-dashed border-input bg-muted/40 px-3 py-2 text-sm">
            {SEGMENT_LABEL[initial.segment] ?? initial.segment}
          </div>
          <span className="mt-1 block text-[11px] text-muted-foreground">
            Для смены сегмента — связаться в WhatsApp.
          </span>
        </Field>
        <Field label="Замены при отсутствии">
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
          {pending ? "Сохраняю…" : "Сохранить"}
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
