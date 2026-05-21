import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Instagram, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { COMPANY } from "@/lib/company";

export function MarketingFooter() {
  return (
    <footer className="mt-16 bg-black text-white">
      {/* Main grid */}
      <div className="container-tight grid gap-8 py-12 md:grid-cols-4">
        {/* Brand */}
        <div>
          <Link href="/" className="mb-3 inline-block">
            <Image
              src="/logos/logo-horizontal.png"
              alt="Horecom"
              width={160}
              height={86}
              className="h-9 w-auto"
            />
          </Link>
          <p className="mt-3 text-sm text-white/70">
            B2B-поставка ингредиентов для кондитерских и HoReCa в Астане. 10 лет на рынке.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href={COMPANY.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 transition-colors hover:bg-brand-orange"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href={COMPANY.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 transition-colors hover:bg-brand-orange"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Catalog */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">Каталог</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/catalog" className="hover:text-white">Все товары</Link></li>
            <li><Link href="/catalog/chocolate-glazes" className="hover:text-white">Шоколад и глазури</Link></li>
            <li><Link href="/catalog/syrups" className="hover:text-white">Сиропы</Link></li>
            <li><Link href="/catalog/dairy" className="hover:text-white">Молочная продукция</Link></li>
            <li><Link href="/subscription" className="hover:text-white">Подписка</Link></li>
            <li><Link href="/group-buying" className="hover:text-white">Групповые закупки</Link></li>
          </ul>
        </div>

        {/* Info */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">Информация</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/about" className="hover:text-white">О нас</Link></li>
            <li><Link href="/how-ordering-works" className="hover:text-white">Как заказать</Link></li>
            <li><Link href="/delivery-and-payment" className="hover:text-white">Доставка и оплата</Link></li>
            <li><Link href="/faq" className="hover:text-white">Частые вопросы</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Конфиденциальность</Link></li>
          </ul>
        </div>

        {/* Contacts */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">Контакты</h3>
          <ul className="space-y-3 text-sm text-white/70">
            <li>
              <a
                href={COMPANY.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 hover:text-white"
              >
                <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-orange" />
                <div>
                  <div>{COMPANY.phoneWhatsAppDisplay}</div>
                  <div className="text-xs text-white/50">WhatsApp · приём заказов</div>
                </div>
              </a>
            </li>
            <li>
              <a href={`tel:${COMPANY.phoneCallback}`} className="flex items-start gap-2 hover:text-white">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-blue" />
                <div>
                  <div>{COMPANY.phoneCallbackDisplay}</div>
                  <div className="text-xs text-white/50">Звонки</div>
                </div>
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/60" />
              <a href={`mailto:${COMPANY.email}`} className="hover:text-white">
                {COMPANY.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/60" />
              <span>Астана, ул. Шамши Калдаякова 1</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Legal bar */}
      <div className="border-t border-white/10">
        <div className="container-tight flex flex-col gap-2 py-4 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <span>© 2026 Horecom · {COMPANY.legalNameShort}</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            ИИН {COMPANY.iin} · {COMPANY.bank}
          </span>
        </div>
      </div>
    </footer>
  );
}
