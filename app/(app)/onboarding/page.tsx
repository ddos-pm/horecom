"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { completeOnboarding, type OnboardingInput } from "./actions";

const SEGMENTS = [
  {
    value: "ENTERPRISE" as const,
    title: "Ресторан / кафе / отель",
    desc: "Большие заказы, регулярные поставщики, нужны быстрые повторные заказы.",
  },
  {
    value: "SMB_REPLENISHMENT" as const,
    title: "Кондитерская / пекарня",
    desc: "Не хочется забывать про критичные ингредиенты, нужен предсказуемый график.",
  },
  {
    value: "MICRO_GROUPBUY" as const,
    title: "Самозанятый кондитер",
    desc: "Делаю на заказ, хочу оптовые цены без своего склада.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingInput>({
    segment: "" as OnboardingInput["segment"],
    companyName: "",
    binOrIin: "",
    addressStreet: "",
    addressHouse: "",
    addressDetails: "",
    addressComment: "",
  });

  function update<K extends keyof OnboardingInput>(key: K, value: OnboardingInput[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFinish() {
    setBusy(true);
    setError(null);
    const result = await completeOnboarding(data);
    if (result.success) {
      router.push("/dashboard?welcome=true");
      router.refresh();
    } else {
      setError(result.error);
      setBusy(false);
    }
  }

  return (
    <div className="container-tight py-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Dot active={step >= 1} />
          <span>Сегмент</span>
          <span>·</span>
          <Dot active={step >= 2} />
          <span>Компания</span>
          <span>·</span>
          <Dot active={step >= 3} />
          <span>Адрес</span>
        </div>

        {step === 1 && (
          <section className="space-y-4">
            <h1 className="text-2xl font-semibold">Кто вы?</h1>
            <p className="text-sm text-muted-foreground">
              Выберите сегмент — мы подберём подходящий режим работы.
            </p>
            <div className="grid gap-3">
              {SEGMENTS.map((s) => (
                <label
                  key={s.value}
                  className={`cursor-pointer rounded-lg border p-4 transition ${
                    data.segment === s.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-foreground/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="segment"
                    value={s.value}
                    checked={data.segment === s.value}
                    onChange={() => update("segment", s.value)}
                    className="sr-only"
                  />
                  <div className="font-medium">{s.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <Button size="lg" disabled={!data.segment} onClick={() => setStep(2)}>
                Дальше
              </Button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <h1 className="text-2xl font-semibold">О компании</h1>
            <p className="text-sm text-muted-foreground">
              Название компании обязательно. БИН/ИИН можно указать позже в профиле.
            </p>
            <div className="space-y-3">
              <Field label="Название компании *">
                <input
                  type="text"
                  value={data.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  placeholder='Например: ТОО «Cake Studio»'
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <Field label="БИН / ИИН (необязательно)">
                <input
                  type="text"
                  value={data.binOrIin}
                  onChange={(e) => update("binOrIin", e.target.value)}
                  placeholder="12 цифр"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Назад
              </Button>
              <Button
                size="lg"
                disabled={data.companyName.trim().length < 2}
                onClick={() => setStep(3)}
              >
                Дальше
              </Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <h1 className="text-2xl font-semibold">Первый адрес доставки</h1>
            <p className="text-sm text-muted-foreground">
              Можно будет добавить ещё в профиле. Сейчас работаем по Астане.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Улица *">
                <input
                  type="text"
                  value={data.addressStreet}
                  onChange={(e) => update("addressStreet", e.target.value)}
                  placeholder="Например: ул. Кенесары"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <Field label="Дом *">
                <input
                  type="text"
                  value={data.addressHouse}
                  onChange={(e) => update("addressHouse", e.target.value)}
                  placeholder="42А"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <Field label="Квартира / офис / этаж (необязательно)">
                <input
                  type="text"
                  value={data.addressDetails}
                  onChange={(e) => update("addressDetails", e.target.value)}
                  placeholder="оф. 12, 3 этаж"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
            </div>
            <Field label="Комментарий курьеру (необязательно)">
              <textarea
                value={data.addressComment}
                onChange={(e) => update("addressComment", e.target.value)}
                placeholder="Например: позвонить за 15 минут, въезд со двора"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={busy}>
                Назад
              </Button>
              <Button
                size="lg"
                disabled={busy || !data.addressStreet.trim() || !data.addressHouse.trim()}
                onClick={handleFinish}
              >
                {busy ? "Сохраняю…" : "Готово"}
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
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

function Dot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${active ? "bg-primary" : "bg-muted-foreground/30"}`}
    />
  );
}
