import { Link } from "@/i18n/routing";
import { MobileDrawer } from "./mobile-drawer";
import { CartIconBadge } from "@/components/cart/cart-icon-badge";
import { HeaderSearchInput } from "./header-search-input";

export function MarketingHeader() {
  return (
    <>
      <header className="hc-header">
        <div className="container-x hc-main">
          <MobileDrawer />

          <Link href="/" className="hc-logo" aria-label="Horecom — главная">
            <img src="/logos/logo-horizontal-transparent.png" alt="Horecom" className="logo-img" />
          </Link>

          <nav className="hc-nav show-md">
            <Link href="/catalog">Каталог</Link>
            <Link href="/subscription">Подписка</Link>
            <Link href="/group-buying">
              Группа <span className="hc-nav-flag">V1.5</span>
            </Link>
          </nav>

          <HeaderSearchInput
            className="hc-search show-md"
            placeholder="Barry Callebaut, мука 25 кг, пюре манго…"
            showShortcut
          />

          <div className="hc-actions">
            <Link href="/login" className="hc-login show-md">
              Войти
            </Link>
            <CartIconBadge />
          </div>
        </div>
      </header>
    </>
  );
}
