"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useCart,
  getCartSubtotal,
  getDeliveryFee,
  getCartTotal,
  CART_LIMITS,
} from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import { useLocaleCookie } from "@/lib/use-locale-cookie";

type AddressOption = {
  id: string;
  label: string;
  street: string;
  house: string;
  details: string | null;
  isDefault: boolean;
};

const SLOTS = ["09:00-12:00", "12:30-15:30", "16:00-19:00"] as const;
type Slot = (typeof SLOTS)[number];

const SUBSTITUTION_OPTIONS_RU: { value: "ASK" | "SAME_BRAND_ONLY" | "NEVER"; label: string; hint: string }[] = [
  {
    value: "ASK",
    label: "Всегда спрашивать перед заменой",
    hint: "Менеджер свяжется в WhatsApp и предложит аналог. Подходит большинству.",
  },
  {
    value: "SAME_BRAND_ONLY",
    label: "Заменять аналогом того же бренда",
    hint: "Если разница в цене больше 5% — всё равно подтвердят.",
  },
  {
    value: "NEVER",
    label: "Никогда не заменять",
    hint: "Позиция уйдёт в отказ. Если другие позиции есть в наличии — отгрузят их.",
  },
];

const SUBSTITUTION_OPTIONS_EN: { value: "ASK" | "SAME_BRAND_ONLY" | "NEVER"; label: string; hint: string }[] = [
  {
    value: "ASK",
    label: "Always ask before substituting",
    hint: "Your account manager messages you on WhatsApp with an alternative. Recommended for most.",
  },
  {
    value: "SAME_BRAND_ONLY",
    label: "Substitute only with the same brand",
    hint: "If the price delta exceeds 5% — we still confirm with you.",
  },
  {
    value: "NEVER",
    label: "Never substitute",
    hint: "The item is dropped from the order. Other in-stock items still ship.",
  },
];

function next7Days() {
  const today = new Date();
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i + 1);
    return d;
  });
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function CheckoutForm({
  addresses,
  defaultSubstitutionPreference,
}: {
  addresses: AddressOption[];
  defaultSubstitutionPreference: string;
}) {
  const router = useRouter();
  const locale = useLocaleCookie();
  const isEn = locale === "en";
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const days = useMemo(next7Days, []);

  function humanDate(d: Date) {
    return d.toLocaleDateString(isEn ? "en-US" : "ru-RU", {
      day: "numeric",
      month: "short",
      weekday: "short",
    });
  }

  const SUBSTITUTION_OPTIONS = isEn ? SUBSTITUTION_OPTIONS_EN : SUBSTITUTION_OPTIONS_RU;

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState(defaultAddress?.id ?? "");
  const [deliveryDate, setDeliveryDate] = useState(formatDate(days[0]));
  const [slot, setSlot] = useState<Slot>("09:00-12:00");
  const [substitution, setSubstitution] = useState<"ASK" | "SAME_BRAND_ONLY" | "NEVER">(
    (defaultSubstitutionPreference as "ASK" | "SAME_BRAND_ONLY" | "NEVER") ?? "ASK",
  );
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = getCartSubtotal(items);
  const delivery = getDeliveryFee(subtotal);
  const total = getCartTotal(items);
  const belowMin = subtotal < CART_LIMITS.MIN_ORDER_TOTAL;

  if (items.length === 0) {
    return (
      <div className="container-tight py-12 text-center">
        <h1 className="text-2xl font-semibold">{isEn ? "Cart is empty" : "Корзина пуста"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEn ? "Add products before checkout." : "Добавьте товары перед оформлением."}
        </p>
        <Link href={`/${locale}/catalog`} className="mt-4 inline-block">
          <Button size="lg">{isEn ? "Open catalog" : "Открыть каталог"}</Button>
        </Link>
      </div>
    );
  }

  if (!defaultAddress) {
    return (
      <div className="container-tight py-12 text-center">
        <h1 className="text-2xl font-semibold">
          {isEn ? "No delivery addresses" : "Нет адресов доставки"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEn
            ? "Add a first address in profile or finish onboarding."
            : "Добавьте первый адрес в профиле или пройдите онбординг."}
        </p>
        <Link href="/profile" className="mt-4 inline-block">
          <Button size="lg">{isEn ? "Open profile" : "Открыть профиль"}</Button>
        </Link>
      </div>
    );
  }

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          addressId,
          deliveryDate,
          deliverySlot: slot,
          substitutionPreference: substitution,
          comment: comment.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (isEn ? "Could not create the order" : "Не удалось создать заказ"));
        setBusy(false);
        return;
      }
      clear();
      toast.success(isEn ? `Order #${data.number} accepted` : `Заказ #${data.number} принят`);
      router.push(`/orders/${data.orderId}?just_created=true`);
    } catch {
      setError(isEn ? "Network unavailable. Try again." : "Сеть недоступна. Попробуйте ещё раз.");
      setBusy(false);
    }
  }

  return (
    <div className="container-tight py-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">
        {isEn ? "Checkout" : "Оформление заказа"}
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Section title={isEn ? "1. Address and time" : "1. Адрес и время"}>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-xs font-medium text-muted-foreground">
                {isEn ? "Address" : "Адрес"}
              </legend>
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                    addressId === a.id ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={a.id}
                    checked={addressId === a.id}
                    onChange={() => setAddressId(a.id)}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <div className="font-medium">{a.label}</div>
                    <div className="text-muted-foreground">
                      {a.street}, {a.house}
                      {a.details ? `, ${a.details}` : ""}
                    </div>
                  </div>
                </label>
              ))}
            </fieldset>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {isEn ? "Delivery date" : "Дата доставки"}
                </label>
                <select
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {days.map((d) => (
                    <option key={formatDate(d)} value={formatDate(d)}>
                      {humanDate(d)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {isEn ? "Time" : "Время"}
                </label>
                <select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value as Slot)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {isEn ? "Note for the courier (optional)" : "Комментарий курьеру (необязательно)"}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder={
                  isEn
                    ? "e.g.: call 15 min ahead, entrance from courtyard"
                    : "Например: позвонить за 15 минут, въезд со двора"
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </Section>

          <Section title={isEn ? "2. Out-of-stock substitutions" : "2. Замены при отсутствии"}>
            <div className="space-y-2">
              {SUBSTITUTION_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                    substitution === opt.value ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="substitution"
                    value={opt.value}
                    checked={substitution === opt.value}
                    onChange={() => setSubstitution(opt.value)}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-muted-foreground">{opt.hint}</div>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          <Section title={isEn ? "3. Payment" : "3. Оплата"}>
            <label className="flex cursor-default items-start gap-3 rounded-md border border-primary bg-primary/5 p-3">
              <input type="radio" checked readOnly className="mt-1" />
              <div className="text-sm">
                <div className="font-medium">
                  {isEn ? "We'll arrange it on confirmation" : "Договоримся при подтверждении"}
                </div>
                <div className="text-muted-foreground">
                  {isEn
                    ? "After checkout your account manager reaches out on WhatsApp within an hour and offers the most convenient option: KaspiPay link or bank-transfer invoice."
                    : "После оформления менеджер свяжется в WhatsApp в течение часа и предложит удобный способ: ссылка KaspiPay или безналичный счёт."}
                </div>
              </div>
            </label>
          </Section>
        </div>

        <aside className="h-fit space-y-3 rounded-lg border border-border bg-card p-4 lg:sticky lg:top-20">
          <div className="space-y-1.5 text-sm">
            <Row
              label={
                isEn ? `Items (${items.length})` : `Товаров (${items.length})`
              }
              value={formatPrice(subtotal.toString())}
            />
            <Row
              label={isEn ? "Delivery" : "Доставка"}
              value={
                delivery === 0
                  ? isEn
                    ? "free"
                    : "бесплатно"
                  : formatPrice(delivery.toString())
              }
            />
            <div className="my-2 h-px bg-border" />
            <Row label={isEn ? "Total" : "Итого"} value={formatPrice(total.toString())} bold />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">{error}</div>
          )}
          {belowMin && (
            <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              {isEn
                ? `Minimum order — ${CART_LIMITS.MIN_ORDER_TOTAL.toLocaleString("en-US")} ₸.`
                : `Минимальный заказ — ${CART_LIMITS.MIN_ORDER_TOTAL.toLocaleString("ru-RU")} ₸.`}
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={busy || belowMin || !addressId}
          >
            {busy
              ? isEn
                ? "Creating…"
                : "Создаю…"
              : isEn
                ? "Confirm order"
                : "Подтвердить заказ"}
          </Button>
          <Link href="/cart">
            <Button size="lg" variant="ghost" className="w-full">
              {isEn ? "Back to cart" : "Назад в корзину"}
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 md:p-5">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "text-base font-semibold" : ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
