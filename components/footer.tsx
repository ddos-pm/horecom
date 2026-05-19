import Link from "next/link";
import { MessageCircle, Instagram, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/40">
      <div className="container-tight grid gap-8 py-12 md:grid-cols-4">
        {/* About */}
        <div>
          <div className="mb-3 flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-xs font-bold">H</span>
            </div>
            Horecom
          </div>
          <p className="text-sm text-muted-foreground">
            B2B-поставка ингредиентов для кондитерских и HoReCa в Астане. 10 лет на рынке.
          </p>
        </div>

        {/* Menu */}
        <div>
          <h3 className="mb-3 text-sm font-semibold">Каталог</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/catalog" className="text-muted-foreground hover:text-foreground">Все товары</Link></li>
            <li><Link href="/subscription" className="text-muted-foreground hover:text-foreground">Подписка</Link></li>
            <li><Link href="/group-buying" className="text-muted-foreground hover:text-foreground">Групповые закупки</Link></li>
            <li><Link href="/how-ordering-works" className="text-muted-foreground hover:text-foreground">Как заказать</Link></li>
          </ul>
        </div>

        {/* Info */}
        <div>
          <h3 className="mb-3 text-sm font-semibold">Информация</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="text-muted-foreground hover:text-foreground">О нас</Link></li>
            <li><Link href="/delivery-and-payment" className="text-muted-foreground hover:text-foreground">Доставка и оплата</Link></li>
            <li><Link href="/faq" className="text-muted-foreground hover:text-foreground">Частые вопросы</Link></li>
            <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Политика конфиденциальности</Link></li>
          </ul>
        </div>

        {/* Contacts */}
        <div>
          <h3 className="mb-3 text-sm font-semibold">Контакты</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <a href="tel:+77078607779" className="hover:text-foreground">+7 707 860 77 79</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <a href="mailto:info@horecom.kz" className="hover:text-foreground">info@horecom.kz</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>Астана, ул. Шамши Калдаякова 1</span>
            </li>
          </ul>
          <div className="mt-4 flex gap-2">
            <a
              href="https://api.whatsapp.com/send/?phone=77078607779"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent hover:text-accent-foreground"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href="https://www.instagram.com/horecom.kz/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent hover:text-accent-foreground"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-background">
        <div className="container-tight flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted-foreground md:flex-row">
          <span>© 2026 Horecom. Все права защищены.</span>
          <span>Astana, Kazakhstan · ТОО «Horecom»</span>
        </div>
      </div>
    </footer>
  );
}
