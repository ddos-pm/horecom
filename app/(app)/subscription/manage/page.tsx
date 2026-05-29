import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLocaleFromCookie } from "@/lib/locale-cookie";
import { PlanActions } from "./plan-actions";

export const metadata = { title: "Подписки" };

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

const CADENCE_LABEL_RU: Record<string, string> = {
  WEEKLY: "Раз в неделю",
  BIWEEKLY: "Раз в 2 недели",
  TWICE_WEEKLY: "Дважды в неделю",
  MONTHLY: "Раз в месяц",
  CUSTOM: "По индивидуальному графику",
};

const CADENCE_LABEL_EN: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 weeks",
  TWICE_WEEKLY: "Twice a week",
  MONTHLY: "Monthly",
  CUSTOM: "Custom schedule",
};

export default async function SubscriptionManagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/subscription/manage");

  const [dbUser, locale] = await Promise.all([
    prisma.user.findUnique({ where: { supabaseId: user.id } }),
    getLocaleFromCookie(),
  ]);
  if (!dbUser?.companyId) redirect("/onboarding");
  const isEn = locale === "en";
  const SUB_STATUS_LABEL = isEn ? SUB_STATUS_LABEL_EN : SUB_STATUS_LABEL_RU;
  const CADENCE_LABEL = isEn ? CADENCE_LABEL_EN : CADENCE_LABEL_RU;
  const numFmt = isEn ? "en-US" : "ru-RU";

  const plans = await prisma.subscriptionPlan.findMany({
    where: { companyId: dbUser.companyId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });

  if (plans.length === 0) {
    return (
      <div className="container-tight py-12">
        <div className="mx-auto max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-semibold">
            {isEn ? "No subscriptions yet" : "Подписок ещё нет"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEn
              ? "Set up a subscription for recurring deliveries — we'll bring your basket on the chosen days. First month at 10% off."
              : "Оформите подписку на регулярную доставку — мы будем привозить нужный набор в выбранные дни. Первый месяц со скидкой 10%."}
          </p>
          <Link href={`/${locale}/subscription`} className="inline-block">
            <Button size="lg">
              {isEn ? "Submit a subscription request" : "Оформить подписку"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-tight py-6 md:py-10">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold md:text-3xl">
          {isEn ? "My subscriptions" : "Мои подписки"}
        </h1>
        <Link href={`/${locale}/subscription`} className="text-sm text-primary hover:underline">
          {isEn ? "Submit another request →" : "Подать ещё запрос →"}
        </Link>
      </div>

      <div className="mb-4 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
        {isEn
          ? "Requests are processed manually — an account manager reaches out on WhatsApp within a day. The full workspace with a predictive calendar and automatic reminders ships in the next release."
          : "Запросы обрабатываются вручную — менеджер свяжется в WhatsApp в течение дня. Полноценный workspace с предиктивным календарём и автоматическими напоминаниями появится в следующей версии."}
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
                  {isEn ? "Created " : "Создана "}
                  {new Date(plan.createdAt).toLocaleDateString(numFmt)}
                  {plan.nextDeliveryDate && (
                    <>
                      {" · "}
                      {isEn ? "Next: " : "Следующая: "}
                      {new Date(plan.nextDeliveryDate).toLocaleDateString(numFmt, {
                        day: "numeric",
                        month: "short",
                      })}
                    </>
                  )}
                </div>
              </div>
              <PlanActions
                locale={locale}
                planId={plan.id}
                status={plan.status as "ACTIVE" | "PAUSED" | "REVIEW_REQUIRED" | "CANCELLED"}
              />
            </div>

            {plan.notes && (
              <p className="mt-2 text-sm text-muted-foreground">«{plan.notes}»</p>
            )}

            {plan.items.length > 0 && (
              <div className="mt-3 border-t border-border pt-3">
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                  {isEn ? "Basket" : "Состав"}
                </div>
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
