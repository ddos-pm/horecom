import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { MobileDrawer } from "./mobile-drawer";
import { CartIconBadge } from "@/components/cart/cart-icon-badge";
import { HeaderSearchInput } from "./header-search-input";

export async function MarketingHeader() {
  const t = await getTranslations("header");

  return (
    <>
      <header className="hc-header">
        <div className="container-x hc-main">
          <MobileDrawer />

          <Link href="/" className="hc-logo" aria-label={t("logoAria")}>
            <img src="/logos/logo-horizontal-transparent.png" alt="Horecom" className="logo-img" />
          </Link>

          <nav className="hc-nav show-md">
            <Link href="/catalog">{t("nav.catalog")}</Link>
            <Link href="/subscription">{t("nav.subscription")}</Link>
            <Link href="/group-buying">{t("nav.groupBuying")}</Link>
          </nav>

          <HeaderSearchInput
            className="hc-search show-md"
            placeholder={t("searchPlaceholder")}
            showShortcut
          />

          {/* /login and /cart live OUTSIDE the locale segment (APP_PREFIXES
              in middleware) — using next-intl <Link> here would prefix them
              with /ru and produce 404. Plain <a> hits the real path. */}
          <div className="hc-actions">
            <a href="/login" className="hc-login show-md">
              {t("login")}
            </a>
            <CartIconBadge />
          </div>
        </div>
      </header>
    </>
  );
}
