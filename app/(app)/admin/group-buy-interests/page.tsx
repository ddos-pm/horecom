import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { InterestRowActions } from "./row-actions";

export const metadata = { title: "Group Buy · Admin" };

export default async function AdminGroupBuyInterestsPage() {
  const interests = await prisma.groupBuyInterest.findMany({
    orderBy: [{ processedAt: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { company: { select: { name: true } } },
  });

  // Lookup product names for productIds shown across all interests
  const allProductIds = Array.from(new Set(interests.flatMap((i) => i.productIds)));
  const products =
    allProductIds.length === 0
      ? []
      : await prisma.product.findMany({
          where: { id: { in: allProductIds } },
          select: { id: true, name: true },
        });
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  return (
    <div className="container-tight py-6 md:py-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold md:text-2xl">Group Buy waitlist</h1>
        <p className="text-xs text-muted-foreground">{interests.length} заявок</p>
      </div>

      {interests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Пока никто не записался.
        </div>
      ) : (
        <ul className="space-y-2">
          {interests.map((it) => {
            const processed = !!it.processedAt;
            return (
              <li
                key={it.id}
                className={`rounded-lg border bg-card p-3 ${processed ? "border-border opacity-60" : "border-border"}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <span>{it.email}</span>
                      {processed ? (
                        <Badge variant="success">Обработано</Badge>
                      ) : (
                        <Badge variant="warning">Новое</Badge>
                      )}
                      {it.company?.name && (
                        <span className="text-xs font-normal text-muted-foreground">
                          · {it.company.name}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {it.phone && <span>{it.phone} · </span>}
                      {new Date(it.createdAt).toLocaleString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {processed && it.processedBy && (
                        <span>
                          {" · обработал "}
                          {it.processedBy}
                        </span>
                      )}
                    </div>
                  </div>
                  <InterestRowActions
                    id={it.id}
                    processed={processed}
                    email={it.email}
                    phone={it.phone}
                  />
                </div>

                {it.productIds.length > 0 && (
                  <div className="mt-2 text-xs">
                    <span className="text-muted-foreground">Интересные товары: </span>
                    {it.productIds.slice(0, 5).map((pid, idx) => (
                      <span key={pid}>
                        {idx > 0 && ", "}
                        {productMap.get(pid) ?? pid}
                      </span>
                    ))}
                    {it.productIds.length > 5 && (
                      <span className="text-muted-foreground"> и ещё {it.productIds.length - 5}</span>
                    )}
                  </div>
                )}

                {it.message && (
                  <p className="mt-2 rounded-md bg-muted/50 p-2 text-xs">«{it.message}»</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
