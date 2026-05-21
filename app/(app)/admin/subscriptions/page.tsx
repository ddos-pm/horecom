import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { SubscriptionRowActions } from "./row-actions";

export const metadata = { title: "Подписки · Admin" };

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Активна",
  PAUSED: "На паузе",
  REVIEW_REQUIRED: "На рассмотрении",
  CANCELLED: "Отменена",
};

const CADENCE_LABEL: Record<string, string> = {
  WEEKLY: "Раз в неделю",
  TWICE_WEEKLY: "Дважды в неделю",
  BIWEEKLY: "Раз в 2 недели",
  MONTHLY: "Раз в месяц",
  CUSTOM: "По индивидуальному",
};

export default async function AdminSubscriptionsPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      company: { include: { users: { select: { phone: true, email: true } } } },
      items: { include: { product: { select: { name: true } } } },
    },
  });

  return (
    <div className="container-tight py-6 md:py-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold md:text-2xl">Подписки</h1>
        <p className="text-xs text-muted-foreground">{plans.length} планов</p>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Нет подписок.
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
                      создана {new Date(plan.createdAt).toLocaleDateString("ru-RU")}
                      {ownerEmail && ` · ${ownerEmail}`}
                    </div>
                  </div>
                  <SubscriptionRowActions
                    planId={plan.id}
                    status={plan.status}
                    waPhone={ownerPhone}
                    waPrefill={`Здравствуйте! По вашему запросу на подписку (${CADENCE_LABEL[plan.cadenceType]})…`}
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
                      Состав ({plan.items.length})
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
