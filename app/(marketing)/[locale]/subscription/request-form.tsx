"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { ProductPicker, type PickerProduct } from "@/components/product-picker";
import { submitSubscriptionRequest } from "./actions";

const CADENCE_OPTIONS_RU = [
  { value: "WEEKLY", label: "Раз в неделю" },
  { value: "TWICE_WEEKLY", label: "Дважды в неделю" },
  { value: "BIWEEKLY", label: "Раз в 2 недели" },
  { value: "MONTHLY", label: "Раз в месяц" },
] as const;

const CADENCE_OPTIONS_EN = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "TWICE_WEEKLY", label: "Twice a week" },
  { value: "BIWEEKLY", label: "Every 2 weeks" },
  { value: "MONTHLY", label: "Monthly" },
] as const;

const DAYS_RU = [
  { value: "MON", label: "Пн" },
  { value: "TUE", label: "Вт" },
  { value: "WED", label: "Ср" },
  { value: "THU", label: "Чт" },
  { value: "FRI", label: "Пт" },
  { value: "SAT", label: "Сб" },
  { value: "SUN", label: "Вс" },
] as const;

const DAYS_EN = [
  { value: "MON", label: "Mon" },
  { value: "TUE", label: "Tue" },
  { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" },
  { value: "FRI", label: "Fri" },
  { value: "SAT", label: "Sat" },
  { value: "SUN", label: "Sun" },
] as const;

const TIME_OPTIONS_RU = [
  { value: "MORNING", label: "Утро (9:00–12:00)" },
  { value: "AFTERNOON", label: "День (12:30–15:30)" },
  { value: "EVENING", label: "Вечер (16:00–19:00)" },
] as const;

const TIME_OPTIONS_EN = [
  { value: "MORNING", label: "Morning (9:00–12:00)" },
  { value: "AFTERNOON", label: "Afternoon (12:30–15:30)" },
  { value: "EVENING", label: "Evening (16:00–19:00)" },
] as const;

export function SubscriptionRequestForm({
  products,
  isAuthed,
  initialProductIds,
}: {
  products: PickerProduct[];
  isAuthed: boolean;
  initialProductIds?: string[];
}) {
  const router = useRouter();
  const locale = useLocale();
  const isEn = locale === "en";
  const CADENCE_OPTIONS = isEn ? CADENCE_OPTIONS_EN : CADENCE_OPTIONS_RU;
  const DAYS = isEn ? DAYS_EN : DAYS_RU;
  const TIME_OPTIONS = isEn ? TIME_OPTIONS_EN : TIME_OPTIONS_RU;

  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(initialProductIds ?? []);
  const [cadence, setCadence] = useState<(typeof CADENCE_OPTIONS_RU)[number]["value"]>("WEEKLY");
  const [days, setDays] = useState<string[]>(["MON"]);
  const [timeOfDay, setTimeOfDay] = useState<(typeof TIME_OPTIONS_RU)[number]["value"]>("MORNING");
  const [notes, setNotes] = useState("");

  if (!isAuthed) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <h3 className="text-lg font-semibold">
          {isEn ? "Sign in to set up a subscription" : "Войдите чтобы оформить подписку"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEn
            ? "The subscription is tied to your company. Sign in by email — a link will be sent to your inbox."
            : "Подписка привязывается к компании. Войдите по email — ссылка придёт в почту."}
        </p>
        <Link href="/login?redirectTo=/subscription" className="mt-4 inline-block">
          <Button size="lg">{isEn ? "Sign in" : "Войти"}</Button>
        </Link>
      </div>
    );
  }

  function toggleDay(d: string) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) {
      toast.error(isEn ? "Pick at least one product" : "Выберите хотя бы один товар");
      return;
    }
    if (days.length === 0) {
      toast.error(isEn ? "Pick at least one weekday" : "Выберите хотя бы один день недели");
      return;
    }
    startTransition(async () => {
      const result = await submitSubscriptionRequest({
        productIds: selected,
        cadence,
        days: days as ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[],
        timeOfDay,
        notes,
      });
      if (result.success) {
        toast.success(isEn ? "Request sent" : "Запрос отправлен");
        router.push("/subscription/manage");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-card p-5">
      <div>
        <h3 className="text-lg font-semibold">{isEn ? "Subscription request" : "Запрос на подписку"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEn
            ? "We'll reach out on WhatsApp within a day, confirm details, and your subscription becomes active."
            : "Мы свяжемся в WhatsApp в течение дня, уточним детали и подтвердим. После этого подписка станет активной."}
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {isEn ? "Products for recurring delivery" : "Товары для регулярной доставки"}
        </label>
        <ProductPicker products={products} selected={selected} onChange={setSelected} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{isEn ? "Frequency" : "Частота"}</label>
          <select
            value={cadence}
            onChange={(e) => setCadence(e.target.value as (typeof CADENCE_OPTIONS_RU)[number]["value"])}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {CADENCE_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            {isEn ? "Preferred delivery time" : "Желаемое время доставки"}
          </label>
          <select
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value as (typeof TIME_OPTIONS_RU)[number]["value"])}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">{isEn ? "Days of the week" : "Дни недели"}</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const active = days.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`rounded-md border px-3 py-2 text-sm ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">{isEn ? "Note" : "Комментарий"}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={
            isEn
              ? "Anything special: temperature-sensitive items, your peak days, any preferences"
              : "Особенности: чувствительные товары к температуре, ваши пиковые дни, любые пожелания"
          }
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending
            ? isEn
              ? "Sending…"
              : "Отправляю…"
            : isEn
              ? "Submit request"
              : "Подать запрос"}
        </Button>
      </div>
    </form>
  );
}
