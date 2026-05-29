"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateContact } from "./actions";

type Props = {
  locale: string;
  initial: {
    email: string | null;
    name: string | null;
    phone: string | null;
  };
};

export function ContactForm({ locale, initial }: Props) {
  const isEn = locale === "en";
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initial.name ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateContact({ name, phone });
      if (result.success) toast.success(isEn ? "Saved" : "Сохранено");
      else toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-semibold">{isEn ? "Contact" : "Контакт"}</h2>
      <Field label={isEn ? "Email (used for sign-in)" : "Email (используется для входа)"}>
        <input
          type="email"
          value={initial.email ?? ""}
          readOnly
          className="w-full cursor-not-allowed rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={isEn ? "Contact-person name" : "Имя контактного лица"}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isEn ? "Name" : "Имя"}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
        <Field label={isEn ? "Phone" : "Телефон"}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 707 ..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
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
