import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, Clock, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { COMPANY } from "@/lib/company";
import { ReorderButton } from "./reorder-button";

export const metadata = { title: "Заказ" };

const STATUS_LABEL: Record<string, string> = {
  CREATED: "Создан",
  INVOICE_SENT: "Счёт выставлен",
  WAITING_PAYMENT: "Ждёт оплату",
  PAID: "Оплачен",
  CONFIRMED: "Подтверждён",
  PARTIALLY_CONFIRMED: "Часть подтверждена",
  PICKING: "Собирается",
  OUT_FOR_DELIVERY: "В доставке",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

const STATUS_ORDER = [
  "CREATED",
  "CONFIRMED",
  "PICKING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ just_created?: string }>;
}) {
  const { id } = await params;
  const { just_created } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/orders/${id}`);

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser?.companyId) redirect("/onboarding");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      address: true,
      items: { include: { product: true } },
    },
  });
  if (!order) notFound();
  if (order.companyId !== dbUser.companyId && !dbUser.companyId) {
    notFound();
  }
  if (order.companyId !== dbUser.companyId) {
    // Strict: not your company → 404 to avoid info leaks
    notFound();
  }

  const window = order.deliveryWindow as { date?: string; slot?: string; deliveryFee?: number };
  const justCreated = just_created === "true";
  const subtotal = Number(order.subtotal);
  const total = Number(order.total);
  const deliveryFee = window.deliveryFee ?? Math.max(total - subtotal, 0);

  const waText = `Здравствуйте! Я только что оформил заказ ${order.number} в Horecom. Свяжитесь со мной для подтверждения.`;
  const waLink = `https://api.whatsapp.com/send/?phone=77078607779&text=${encodeURIComponent(waText)}`;

  const currentStatusIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="container-tight py-6 md:py-10">
      {justCreated && (
        <div className="mb-6 rounded-lg border border-success/30 bg-success/5 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" />
            <div>
              <h2 className="text-xl font-semibold text-success">
                Заказ {order.number} принят
              </h2>
              <p className="mt-1 text-sm text-foreground">
                менеджер свяжется с вами в течение часа в WhatsApp для подтверждения и расчёта.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="sm:flex-1">
              <Button size="lg" className="w-full">
                <MessageCircle className="h-4 w-4" />
                Открыть чат в WhatsApp
              </Button>
            </a>
            <a href="#details" className="sm:flex-1">
              <Button size="lg" variant="outline" className="w-full">
                Посмотреть детали заказа
              </Button>
            </a>
          </div>
        </div>
      )}

      <header id="details" className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Заказ {order.number}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Создан {new Date(order.createdAt).toLocaleString("ru-RU")}
          </p>
        </div>
        <Badge variant={isCancelled ? "danger" : "info"}>
          {STATUS_LABEL[order.status] ?? order.status}
        </Badge>
      </header>

      {!isCancelled && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Статус</h3>
          <ol className="flex items-center gap-2 overflow-x-auto text-xs">
            {STATUS_ORDER.map((s, idx) => {
              const done = idx <= currentStatusIdx;
              const active = idx === currentStatusIdx;
              return (
                <li key={s} className="flex shrink-0 items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? "✓" : idx + 1}
                  </span>
                  <span className={active ? "font-medium" : "text-muted-foreground"}>
                    {STATUS_LABEL[s]}
                  </span>
                  {idx < STATUS_ORDER.length - 1 && (
                    <span className="text-muted-foreground/30">›</span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Позиции</h3>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.product.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.productNameSnapshot}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl opacity-60">📦</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col text-sm">
                  <div className="font-medium">{item.productNameSnapshot}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.unitLabelSnapshot} · {formatPrice(item.unitPrice.toString())} × {item.quantity}
                  </div>
                </div>
                <div className="tabular-nums text-sm font-medium">
                  {formatPrice(item.lineTotal.toString())}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="h-fit space-y-3 rounded-lg border border-border bg-card p-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground">Доставка</div>
            <div className="mt-1 text-sm">
              {order.address.street}, {order.address.house}
              {order.address.details ? `, ${order.address.details}` : ""}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {window.date && (
                <>
                  {new Date(window.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                  {", "}
                  {window.slot}
                </>
              )}
            </div>
          </div>

          {order.comment && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Комментарий</div>
              <div className="mt-1 text-sm">{order.comment}</div>
            </div>
          )}

          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <Row label="Товары" value={formatPrice(subtotal.toString())} />
            <Row
              label="Доставка"
              value={deliveryFee === 0 ? "бесплатно" : formatPrice(deliveryFee.toString())}
            />
            <div className="my-2 h-px bg-border" />
            <Row label="Итого" value={formatPrice(total.toString())} bold />
          </div>

          <ReorderButton
            items={order.items.map((i) => ({
              productId: i.productId,
              slug: i.product.slug,
              name: i.product.name,
              image: i.product.imageUrl,
              price: Number(i.unitPrice),
              minOrderQty: i.product.minOrderQty,
              packLabel: i.product.packLabel,
              unitType: i.product.unitType,
              quantity: i.quantity,
            }))}
          />
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="w-full">
              <MessageCircle className="h-4 w-4" />
              Открыть чат с {COMPANY.shortName}
            </Button>
          </a>
        </aside>
      </div>

      <div className="mt-6">
        <Link href="/orders">
          <Button variant="ghost">← Все заказы</Button>
        </Link>
      </div>
    </div>
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
