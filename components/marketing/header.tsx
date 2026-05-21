import { Search, ShoppingCart } from "lucide-react";
import { Link } from "@/i18n/routing";
import { MobileDrawer } from "./mobile-drawer";

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

          <form action="/catalog" method="get" className="hc-search show-md" role="search">
            <Search className="h-4 w-4" />
            <input
              type="search"
              name="q"
              placeholder="Barry Callebaut, мука 25 кг, пюре манго…"
              aria-label="Поиск"
            />
            <kbd className="kbd-shortcut">⌘K</kbd>
          </form>

          <div className="hc-actions">
            <a href="/login" className="hc-login show-md">
              Войти
            </a>
            <a href="/cart" className="hc-cart" aria-label="Корзина">
              <ShoppingCart className="h-5 w-5" />
            </a>
          </div>
        </div>
      </header>
    </>
  );
}
