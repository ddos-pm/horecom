import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { getLocaleFromCookie } from "@/lib/locale-cookie";
import { SubscriptionRowActions } from "./row-actions";

export const metadata = { title: "Подписки · Admin" };

const STATUS_LABEL_RU: Record<string, string> = {
  ACTIVE: "Активна",
  PAUSED: "На паузе",
  REVIEW_REQUIRED: "На рассмотрении",
  CANCELLED: "Отменена",
};

const STATUS_LABEL_EN: Record<string, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  REVIEW_REQUIRED: "Under review",
  CANCELLED: "Cancelled",
};

const CADENCE_LABEL_RU: Record<string, string> = {
  WEEKLY: "Раз в неделю",
  TWICE_WEEKLY: "Дважды в неделю",
  BIWEEKLY: "Раз в 2 недели",
  MONTHLY: "Раз в месяц",
  CUSTOM: "По индивидуальному",
};

const CADENCE_LABEL_EN: Record<string, string> = {
  WEEKLY: "Weekly",
  TWICE_WEEKLY: "Twice a week",
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Monthly",
  CUSTOM: "Custom",
};

export default async function AdminSubscriptionsPage() {
  const [plans, locale] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        company: { include: { users: { select: { phone: true, email: true } } } },
        items: { include: { product: { select: { name: true } } } },
      },
    }),
    getLocaleFromCookie(),
  ]);
  const isEn = locale === "en";
  const STATUS_LABEL = isEn ? STATUS_LABEL_EN : STATUS_LABEL_RU;
  const CADENCE_LABEL = isEn ? CADENCE_LABEL_EN : CADENCE_LABEL_RU;
  const numFmt = isEn ? "en-US" : "ru-RU";

  return (
    <div className="container-tight py-6 md:py-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold md:text-2xl">{isEn ? "Subscriptions" : "Подписки"}</h1>
        <p className="text-xs text-muted-foreground">
          {plans.length} {isEn ? (plans.length === 1 ? "plan" : "plans") : "планов"}
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {isEn ? "No subscriptions." : "Нет подписок."}
        </div>
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => {
            const ownerPhone = plan.company.users[0]?.phone ?? null;
            const ownerEmail = plan.company.users[0]?.email ?? null;
            return (
              <li key={plan.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{plan.company.name}</span>
                      <Badge
                        variant={
                          plan.status === "CANCELLED"
                            ? "danger"
                            : plan.status === "ACTIVE"
                              ? "success"
                              : "info"
                        }
                      >
                        {STATUS_LABEL[plan.status] ?? plan.status}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {CADENCE_LABEL[plan.cadenceType] ?? plan.cadenceType}
                      {" · "}
                      {isEn ? "created " : "создана "}
                      {new Date(plan.createdAt).toLocaleDateString(numFmt)}
                      {ownerEmail && ` · ${ownerEmail}`}
                    </div>
                  </div>
                  <SubscriptionRowActions
                    locale={locale}
                    planId={plan.id}
                    status={plan.status}
                    waPhone={ownerPhone}
                    waPrefill={
                      isEn
                        ? `Hello! Regarding your subscription request (${CADENCE_LABEL[plan.cadenceType]})…`
                        : `Здравствуйте! По вашему запросу на подписку (${CADENCE_LABEL[plan.cadenceType]})…`
                    }
                  />
                </div>

                {plan.notes && (
                  <p className="mt-2 whitespace-pre-line rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                    {plan.notes}
                  </p>
                )}

                {plan.items.length > 0 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      {isEn ? `Basket (${plan.items.length})` : `Состав (${plan.items.length})`}
                    </div>
                    <ul className="space-y-0.5 text-sm">
                      {plan.items.map((it) => (
                        <li key={it.id} className="flex justify-between gap-2">
                          <span className="line-clamp-1">{it.product.name}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            × {it.defaultQty}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
