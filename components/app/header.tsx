import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getLocaleFromCookie } from "@/lib/locale-cookie";
import { LanguageSwitcherCookie } from "@/components/marketing/language-switcher-cookie";
import { UserMenu } from "./user-menu";

export async function AppHeader() {
  const supabase = await createClient();
  const [{ data: { user } }, locale] = await Promise.all([
    supabase.auth.getUser(),
    getLocaleFromCookie(),
  ]);
  const isEn = locale === "en";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white">
      <div className="container-tight flex h-14 items-center justify-between gap-4">
        <Link href={user ? "/dashboard" : `/${locale}`} className="flex items-center gap-2">
          <Image
            src="/logos/logo-horizontal-transparent.png"
            alt="Horecom"
            width={320}
            height={86}
            className="h-7 w-auto"
            unoptimized
            priority
          />
        </Link>

        <div className="flex items-center gap-1">
          <LanguageSwitcherCookie />
          <Link href="/cart" aria-label={isEn ? "Cart" : "Корзина"}>
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>
          <UserMenu email={user?.email ?? null} locale={locale} />
        </div>
      </div>
    </header>
  );
}
