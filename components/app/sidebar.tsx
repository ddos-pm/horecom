import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Repeat, User, Shield } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Обзор", icon: LayoutDashboard },
  { href: "/orders", label: "Заказы", icon: ShoppingBag },
  { href: "/subscription/manage", label: "Подписки", icon: Repeat },
  { href: "/profile", label: "Профиль", icon: User },
];

export function AppSidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-white md:block">
        <nav className="sticky top-14 flex flex-col gap-1 p-4">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span>{label}</span>
            </Link>
          ))}
          <div className="mt-4 border-t pt-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground hover:bg-muted"
            >
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-border bg-white md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted-foreground"
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
