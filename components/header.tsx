import Link from "next/link";
import { Search, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container-tight flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">H</span>
          </div>
          <span className="hidden sm:inline">Horecom</span>
        </Link>

        {/* Search (desktop) */}
        <div className="hidden flex-1 md:flex md:max-w-xl">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Шоколад, мука, сгущёнка…"
              className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Link href="/catalog">
            <Button variant="ghost" className="hidden md:inline-flex">
              Каталог
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="ghost" size="icon" aria-label="Заказы" className="hidden md:inline-flex">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="outline" size="icon" aria-label="Корзина">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
