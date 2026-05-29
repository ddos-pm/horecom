import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { getLocaleFromCookie } from "@/lib/locale-cookie";
import { CartCard } from "./cart-card";

export const metadata = { title: "Обзор" };

const STATUS_LABEL_RU: Record<string, string> = {
  CREATED: "Создан",
  CONFIRMED: "Подтверждён",
  PARTIALLY_CONFIRMED: "Часть подтверждена",
  PICKING: "Собирается",
  OUT_FOR_DELIVERY: "В доставке",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

const STATUS_LABEL_EN: Record<string, string> = {
  CREATED: "Created",
  CONFIRMED: "Confirmed",
  PARTIALLY_CONFIRMED: "Partially confirmed",
  PICKING: "Picking",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const SUB_STATUS_LABEL_RU: Record<string, string> = {
  ACTIVE: "Активна",
  PAUSED: "На паузе",
  REVIEW_REQUIRED: "На рассмотрении",
  CANCELLED: "Отменена",
};

const SUB_STATUS_LABEL_EN: Record<string, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  REVIEW_REQUIRED: "Under review",
  CANCELLED: "Cancelled",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/dashboard");

  const [dbUser, locale] = await Promise.all([
    prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { company: true },
    }),
    getLocaleFromCookie(),
  ]);
  if (!dbUser?.companyId || !dbUser.company) redirect("/onboarding");
  const isEn = locale === "en";
  const STATUS_LABEL = isEn ? STATUS_LABEL_EN : STATUS_LABEL_RU;
  const SUB_STATUS_LABEL = isEn ? SUB_STATUS_LABEL_EN : SUB_STATUS_LABEL_RU;
  const numFmt = isEn ? "en-US" : "ru-RU";

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentOrders, lastOrder, activeSub, monthAgg] = await Promise.all([
    prisma.order.findMany({
      where: { companyId: dbUser.companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: { select: { id: true } } },
    }),
    prisma.order.findFirst({
      where: { companyId: dbUser.companyId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscriptionPlan.findFirst({
      where: { companyId: dbUser.companyId, status: "ACTIVE" },
    }),
    prisma.order.aggregate({
      where: {
        companyId: dbUser.companyId,
        status: { not: "CANCELLED" },
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
  ]);
  const monthlySpend = Number(monthAgg._sum.total ?? 0);
  const monthlyOrderCount = monthAgg._count._all;

  return (
    <div className="container-tight py-6 md:py-10">
      {welcome && (
        <div className="mb-6 rounded-lg border border-success/30 bg-success/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <div className="font-semibold text-success">
                {isEn ? "Welcome to Horecom" : "Добро пожаловать в Horecom"}
              </div>
              <div className="mt-1 text-sm">
                {isEn
                  ? "Profile created. Open the catalog and place your first order — an account manager confirms on WhatsApp."
                  : "Профиль создан. Откройте каталог и оформите первый заказ — менеджер подтвердит в WhatsApp."}
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="mb-6">
        <p className="text-xs text-muted-foreground">{dbUser.company.name}</p>
        <h1 className="text-2xl font-bold md:text-3xl">{isEn ? "Overview" : "Обзор"}</h1>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LastOrderCard order={lastOrder} isEn={isEn} numFmt={numFmt} STATUS_LABEL={STATUS_LABEL} locale={locale} />
        <MonthlySpendCard total={monthlySpend} orderCount={monthlyOrderCount} isEn={isEn} numFmt={numFmt} />
        <SubscriptionCard sub={activeSub} isEn={isEn} numFmt={numFmt} SUB_STATUS_LABEL={SUB_STATUS_LABEL} locale={locale} />
        <CartCard />
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold">{isEn ? "Recent orders" : "Последние заказы"}</h2>
          {recentOrders.length > 0 && (
            <Link href="/orders" className="text-sm text-primary hover:underline">
              {isEn ? "All orders →" : "Все заказы →"}
            </Link>
          )}
        </div>
        {recentOrders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">{isEn ? "No orders yet." : "Заказов ещё нет."}</p>
            <Link href={`/${locale}/catalog`} className="mt-3 inline-block">
              <Button>{isEn ? "Open catalog" : "Открыть каталог"}</Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {recentOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-3 hover:border-foreground/20 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{o.number}</span>
                      <Badge variant={o.status === "CANCELLED" ? "danger" : "info"}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString(numFmt, {
                        day: "numeric",
                        month: "short",
                      })}
                      {" · "}
                      {o.items.length} {isEn ? (o.items.length === 1 ? "item" : "items") : "поз."}
                    </div>
                  </div>
                  <div className="tabular-nums text-sm font-semibold">
                    {formatPrice(o.total.toString())}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

type OrderLite = Awaited<ReturnType<typeof prisma.order.findFirst>> | null;

function LastOrderCard({
  order,
  isEn,
  numFmt,
  STATUS_LABEL,
  locale,
}: {
  order: OrderLite;
  isEn: boolean;
  numFmt: string;
  STATUS_LABEL: Record<string, string>;
  locale: string;
}) {
  if (!order) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs text-muted-foreground">{isEn ? "Last order" : "Последний заказ"}</div>
        <div className="mt-2 text-lg font-semibold">{isEn ? "Not yet" : "Ещё нет"}</div>
        <Link href={`/${locale}/catalog`} className="mt-3 inline-block">
          <Button size="sm" variant="outline">
            {isEn ? "Place first order" : "Сделать первый"}
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{isEn ? "Last order" : "Последний заказ"}</div>
      <div className="mt-2 text-lg font-semibold tabular-nums">{formatPrice(order.total.toString())}</div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {new Date(order.createdAt).toLocaleDateString(numFmt, { day: "numeric", month: "short" })}
        {" · "}
        {STATUS_LABEL[order.status] ?? order.status}
      </div>
      <Link href={`/orders/${order.id}`} className="mt-3 inline-block">
        <Button size="sm">{isEn ? "Open" : "Открыть"}</Button>
      </Link>
    </div>
  );
}

function MonthlySpendCard({
  total,
  orderCount,
  isEn,
  numFmt,
}: {
  total: number;
  orderCount: number;
  isEn: boolean;
  numFmt: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">
        {isEn ? "Total over 30 days" : "Сумма за 30 дней"}
      </div>
      <div className="mt-2 text-lg font-semibold tabular-nums">{total.toLocaleString(numFmt)} ₸</div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <TrendingUp className="h-3 w-3" />
        {orderCount === 0
          ? isEn
            ? "No orders"
            : "Заказов не было"
          : isEn
            ? `${orderCount} ${orderCount === 1 ? "order" : "orders"}`
            : `${orderCount} ${pluralOrdersRu(orderCount)}`}
      </div>
    </div>
  );
}

function pluralOrdersRu(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "заказ";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "заказа";
  return "заказов";
}

type SubLite = Awaited<ReturnType<typeof prisma.subscriptionPlan.findFirst>>;

function SubscriptionCard({
  sub,
  isEn,
  numFmt,
  SUB_STATUS_LABEL,
  locale,
}: {
  sub: SubLite;
  isEn: boolean;
  numFmt: string;
  SUB_STATUS_LABEL: Record<string, string>;
  locale: string;
}) {
  if (!sub) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs text-muted-foreground">{isEn ? "Subscription" : "Подписка"}</div>
        <div className="mt-2 text-lg font-semibold">{isEn ? "Not active" : "Не подключена"}</div>
        <Link href={`/${locale}/subscription`} className="mt-3 inline-block">
          <Button size="sm" variant="outline">
            {isEn ? "Activate" : "Подключить"}
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{isEn ? "Subscription" : "Подписка"}</div>
      <div className="mt-2 text-lg font-semibold">{SUB_STATUS_LABEL[sub.status] ?? sub.status}</div>
      <div className="text-xs text-muted-foreground">
        {isEn ? "Next: " : "Следующая: "}
        {new Date(sub.nextDeliveryDate).toLocaleDateString(numFmt, { day: "numeric", month: "short" })}
      </div>
      <Link href="/subscription/manage" className="mt-3 inline-block">
        <Button size="sm">{isEn ? "Manage" : "Управлять"}</Button>
      </Link>
    </div>
  );
}
