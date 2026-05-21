import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Package, Repeat, Users, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/admin");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser?.isAdmin) notFound();

  const [pendingOrders, pendingSubs, pendingInterests] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["CREATED", "WAITING_PAYMENT", "CONFIRMED"] } } }),
    prisma.subscriptionPlan.count({ where: { status: "REVIEW_REQUIRED" } }),
    prisma.groupBuyInterest.count({ where: { processedAt: null } }),
  ]);

  const NAV = [
    { href: "/admin/orders", label: "Заказы", icon: ShoppingBag, badge: pendingOrders },
    { href: "/admin/catalog", label: "Каталог", icon: Package, badge: 0 },
    { href: "/admin/subscriptions", label: "Подписки", icon: Repeat, badge: pendingSubs },
    { href: "/admin/group-buy-interests", label: "Group Buy", icon: Users, badge: pendingInterests },
  ];

  return (
    <div className="flex flex-1">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-muted/30 md:block">
        <div className="sticky top-14">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              Админ-панель
            </div>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {NAV.map(({ href, label, icon: Icon, badge }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-background"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </span>
                {badge > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
