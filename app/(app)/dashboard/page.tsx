import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { CartCard } from "./cart-card";

export const metadata = { title: "Обзор" };

const STATUS_LABEL: Record<string, string> = {
  CREATED: "Создан",
  CONFIRMED: "Подтверждён",
  PARTIALLY_CONFIRMED: "Часть подтверждена",
  PICKING: "Собирается",
  OUT_FOR_DELIVERY: "В доставке",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

const SUB_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Активна",
  PAUSED: "На паузе",
  REVIEW_REQUIRED: "На рассмотрении",
  CANCELLED: "Отменена",
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

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { company: true },
  });
  if (!dbUser?.companyId || !dbUser.company) redirect("/onboarding");

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
    // Last 30 days of non-cancelled orders. the team's brief — single
    // "Сумма за месяц" number on the dashboard. Cancelled excluded so
    // refunds don't double-count.
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
              <div className="font-semibold text-success">Добро пожаловать в Horecom</div>
              <div className="mt-1 text-sm">
                Профиль создан. Откройте каталог и оформите первый заказ — менеджер подтвердит в WhatsApp.
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="mb-6">
        <p className="text-xs text-muted-foreground">{dbUser.company.name}</p>
        <h1 className="text-2xl font-bold md:text-3xl">Обзор</h1>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LastOrderCard order={lastOrder} />
        <MonthlySpendCard total={monthlySpend} orderCount={monthlyOrderCount} />
        <SubscriptionCard sub={activeSub} />
        <CartCard />
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Последние заказы</h2>
          {recentOrders.length > 0 && (
            <Link href="/orders" className="text-sm text-primary hover:underline">
              Все заказы →
            </Link>
          )}
        </div>
        {recentOrders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">Заказов ещё нет.</p>
            <Link href="/catalog" className="mt-3 inline-block">
              <Button>Открыть каталог</Button>
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
                      {new Date(o.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}
                      {" · "}
                      {o.items.length} поз.
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

type OrderLite =
  | (Awaited<ReturnType<typeof prisma.order.findFirst>> & { __unused?: never })
  | null;

function LastOrderCard({ order }: { order: OrderLite }) {
  if (!order) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs text-muted-foreground">Последний заказ</div>
        <div className="mt-2 text-lg font-semibold">Ещё нет</div>
        <Link href="/catalog" className="mt-3 inline-block">
          <Button size="sm" variant="outline">
            Сделать первый
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">Последний заказ</div>
      <div className="mt-2 text-lg font-semibold tabular-nums">{formatPrice(order.total.toString())}</div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {new Date(order.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
        {" · "}
        {STATUS_LABEL[order.status] ?? order.status}
      </div>
      <Link href={`/orders/${order.id}`} className="mt-3 inline-block">
        <Button size="sm">Открыть</Button>
      </Link>
    </div>
  );
}

function MonthlySpendCard({ total, orderCount }: { total: number; orderCount: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">Сумма за 30 дней</div>
      <div className="mt-2 text-lg font-semibold tabular-nums">
        {total.toLocaleString("ru-RU")} ₸
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <TrendingUp className="h-3 w-3" />
        {orderCount === 0
          ? "Заказов не было"
          : `${orderCount} ${pluralOrders(orderCount)}`}
      </div>
    </div>
  );
}

function pluralOrders(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "заказ";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "заказа";
  return "заказов";
}

type SubLite = Awaited<ReturnType<typeof prisma.subscriptionPlan.findFirst>>;

function SubscriptionCard({ sub }: { sub: SubLite }) {
  if (!sub) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs text-muted-foreground">Подписка</div>
        <div className="mt-2 text-lg font-semibold">Не подключена</div>
        <Link href="/subscription" className="mt-3 inline-block">
          <Button size="sm" variant="outline">
            Подключить
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">Подписка</div>
      <div className="mt-2 text-lg font-semibold">{SUB_STATUS_LABEL[sub.status] ?? sub.status}</div>
      <div className="text-xs text-muted-foreground">
        Следующая: {new Date(sub.nextDeliveryDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
      </div>
      <Link href="/subscription/manage" className="mt-3 inline-block">
        <Button size="sm">Управлять</Button>
      </Link>
    </div>
  );
}
