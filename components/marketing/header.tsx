import Image from "next/image";
import { Search, ShoppingCart, Phone, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/company";
import { LanguageSwitcher } from "./language-switcher";

export async function MarketingHeader() {
  const t = await getTranslations("header");

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
            <span className="text-muted-foreground">· {t("phoneWhatsApp")}</span>
          </a>
          <a
            href={`tel:${COMPANY.phoneCallback}`}
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <Phone className="h-3.5 w-3.5 text-brand-blue" />
            <span>{COMPANY.phoneCallbackDisplay}</span>
            <span className="text-muted-foreground">· {t("phoneVoice")}</span>
          </a>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main bar */}
      <div className="container-tight flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center" aria-label="Horecom">
          <Image
            src="/logos/logo-horizontal.png"
            alt="Horecom"
            width={160}
            height={86}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <div className="hidden flex-1 md:flex md:max-w-xl">
          <form action="/catalog" method="get" className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              placeholder={t("searchPlaceholder")}
              className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        </div>

        <nav className="flex items-center gap-2">
          <Link href="/catalog" className="hidden md:inline-flex">
            <Button variant="ghost">{t("nav.catalog")}</Button>
          </Link>
          <Link href="/subscription" className="hidden lg:inline-flex">
            <Button variant="ghost">{t("nav.subscription")}</Button>
          </Link>
          <a href="/login">
            <Button variant="outline" size="sm">{t("login")}</Button>
          </a>
          <a href="/cart">
            <Button variant="default" size="icon" aria-label={t("cart")}>
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </a>
        </nav>
      </div>
    </header>
  );
}
