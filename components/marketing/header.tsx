import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/company";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {/* Top utility bar with phones — visible on desktop */}
      <div className="hidden border-b border-border bg-muted/50 md:block">
        <div className="container-tight flex h-9 items-center justify-end gap-6 text-xs text-muted-foreground">
          <a
            href={COMPANY.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <MessageCircle className="h-3.5 w-3.5 text-brand-orange" />
            <span>{COMPANY.phoneWhatsAppDisplay}</span>
            <span className="text-muted-foreground">· WhatsApp</span>
          </a>
          <a
            href={`tel:${COMPANY.phoneCallback}`}
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <Phone className="h-3.5 w-3.5 text-brand-blue" />
            <span>{COMPANY.phoneCallbackDisplay}</span>
            <span className="text-muted-foreground">· Звонки</span>
          </a>
        </div>
      </div>

      {/* Main bar */}
      <div className="container-tight flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center" aria-label="Horecom — главная">
          <Image
            src="/logos/logo-horizontal.png"
            alt="Horecom"
            width={160}
            height={86}
            priority
            className="h-9 w-auto"
          />
        </Link>

        {/* Search (desktop) */}
        <div className="hidden flex-1 md:flex md:max-w-xl">
          <form action="/catalog" method="get" className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              placeholder="Шоколад Barry Callebaut, мука 25кг, сгущёнка…"
              className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          <Link href="/catalog" className="hidden md:inline-flex">
            <Button variant="ghost">Каталог</Button>
          </Link>
          <Link href="/subscription" className="hidden lg:inline-flex">
            <Button variant="ghost">Подписка</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">Войти</Button>
          </Link>
          <Link href="/cart">
            <Button variant="default" size="icon" aria-label="Корзина">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
