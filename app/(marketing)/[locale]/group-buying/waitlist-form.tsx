"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductPicker, type PickerProduct } from "@/components/product-picker";
import { submitGroupBuyInterest } from "./actions";

export function GroupBuyWaitlistForm({
  products,
  defaultEmail,
}: {
  products: PickerProduct[];
  defaultEmail: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [phone, setPhone] = useState("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitGroupBuyInterest({
        email,
        phone: phone || undefined,
        productIds,
        message: message || undefined,
      });
      if (result.success) {
        setSent(true);
        toast.success("Заявка отправлена");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-6 text-center">
        <h3 className="text-lg font-semibold text-success">Спасибо</h3>
        <p className="mt-1 text-sm">
          Мы свяжемся когда соберём первую группу — обычно в течение 2–3 недель.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-card p-5">
      <div>
        <h3 className="text-lg font-semibold">Заявка в пилот</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Регистрируем интерес, чтобы запустить первую группу с нужным количеством участников. Свяжемся,
          когда наберётся достаточно.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Email *">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Телефон / WhatsApp">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 707 ..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Какие товары интересны (необязательно)
        </label>
        <ProductPicker products={products} selected={productIds} onChange={setProductIds} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Комментарий</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="Расскажите о себе и о том, какие объёмы вам интересны"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending || !email}>
          {pending ? "Отправляю…" : "Отправить заявку"}
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
