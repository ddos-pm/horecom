import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white">
      <div className="container-tight flex h-14 items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logos/logo-header.png"
            alt="Horecom"
            width={120}
            height={64}
            className="h-7 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/cart" aria-label="Корзина">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>

          {/* User dropdown placeholder — wired in Этап 2 (auth) */}
          <Button variant="ghost" className="gap-1.5">
            <span className="hidden text-sm sm:inline">Аккаунт</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
