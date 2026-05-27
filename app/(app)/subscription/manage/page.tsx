import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanActions } from "./plan-actions";

export const metadata = { title: "Подписки" };

const SUB_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Активна",
  PAUSED: "На паузе",
  REVIEW_REQUIRED: "На рассмотрении",
  CANCELLED: "Отменена",
};

const CADENCE_LABEL: Record<string, string> = {
  WEEKLY: "Раз в неделю",
  BIWEEKLY: "Раз в 2 недели",
  TWICE_WEEKLY: "Дважды в неделю",
  MONTHLY: "Раз в месяц",
  CUSTOM: "По индивидуальному графику",
};

export default async function SubscriptionManagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/subscription/manage");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser?.companyId) redirect("/onboarding");

  const plans = await prisma.subscriptionPlan.findMany({
    where: { companyId: dbUser.companyId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });

  if (plans.length === 0) {
    return (
      <div className="container-tight py-12">
        <div className="mx-auto max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-semibold">Подписок ещё нет</h1>
          <p className="text-sm text-muted-foreground">
            Оформите подписку на регулярную доставку — мы будем привозить нужный набор в выбранные дни. Первый месяц со скидкой 10%.
          </p>
          <Link href="/subscription" className="inline-block">
            <Button size="lg">Оформить подписку</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-tight py-6 md:py-10">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold md:text-3xl">Мои подписки</h1>
        <Link href="/subscription" className="text-sm text-primary hover:underline">
          Подать ещё запрос →
        </Link>
      </div>

      <div className="mb-4 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
        Запросы обрабатываются вручную — менеджер свяжется в WhatsApp в течение дня. Полноценный workspace с
        предиктивным календарём и автоматическими напоминаниями появится в следующей версии.
      </div>

      <ul className="space-y-3">
        {plans.map((plan) => (
          <li key={plan.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>{CADENCE_LABEL[plan.cadenceType] ?? plan.cadenceType}</span>
                  <Badge
                    variant={
                      plan.status === "CANCELLED"
                        ? "danger"
                        : plan.status === "ACTIVE"
                          ? "success"
                          : "info"
                    }
                  >
                    {SUB_STATUS_LABEL[plan.status] ?? plan.status}
                  </Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Создана {new Date(plan.createdAt).toLocaleDateString("ru-RU")}
                  {plan.nextDeliveryDate && (
                    <>
                      {" · "}
                      Следующая: {new Date(plan.nextDeliveryDate).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}
                    </>
                  )}
                </div>
              </div>
              <PlanActions
                planId={plan.id}
                status={plan.status as "ACTIVE" | "PAUSED" | "REVIEW_REQUIRED" | "CANCELLED"}
              />
            </div>

            {plan.notes && (
              <p className="mt-2 text-sm text-muted-foreground">«{plan.notes}»</p>
            )}

            {plan.items.length > 0 && (
              <div className="mt-3 border-t border-border pt-3">
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">Состав</div>
                <ul className="space-y-1 text-sm">
                  {plan.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-2">
                      <span className="line-clamp-1">{item.product.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        × {item.defaultQty}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
