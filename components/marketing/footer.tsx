import Image from "next/image";
import { MessageCircle, Instagram, AtSign } from "lucide-react";
import { Link } from "@/i18n/routing";
import { COMPANY } from "@/lib/company";

export function MarketingFooter() {
  return (
    <footer className="hc-footer">
      <div className="container-x hc-footer-top">
        <div className="hc-footer-brand">
          <Link href="/" className="hc-logo hc-logo-dark inline-block" aria-label="Horecom — главная">
            <Image
              src="/logos/logo-horizontal-transparent.png"
              alt="Horecom"
              width={569}
              height={113}
              className="h-10 w-auto md:h-12"
            />
          </Link>
          <p className="t-body">
            B2B-поставка ингредиентов для кондитерских и HoReCa в Астане. 10 лет на рынке, 50+ клиентов, 50
            поставщиков.
          </p>
          <div className="hc-footer-socials">
            <a
              href={COMPANY.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="hc-soc"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href={COMPANY.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hc-soc"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={COMPANY.threads ?? "https://www.threads.com/@horecom.kz"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Threads"
              className="hc-soc"
            >
              <AtSign className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="hc-footer-h">Каталог</h4>
          <ul className="ul-clean hc-footer-links">
            <li><Link href="/catalog">Все товары · 190</Link></li>
            <li><Link href="/catalog?category=chocolate-glazes">Шоколад и глазури</Link></li>
            <li><Link href="/catalog?category=syrups">Сиропы · 31</Link></li>
            <li><Link href="/catalog?category=ingredients">Сырьё · 40</Link></li>
            <li><Link href="/catalog?category=dairy">Молочная продукция</Link></li>
            <li><Link href="/catalog?category=frozen">Заморозка и пюре</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="hc-footer-h">Платформа</h4>
          <ul className="ul-clean hc-footer-links">
            <li><Link href="/subscription">Подписка</Link></li>
            <li><Link href="/group-buying">Группа · V1.5</Link></li>
            <li><Link href="/how-ordering-works">Как заказать</Link></li>
            <li><Link href="/delivery-and-payment">Доставка и оплата</Link></li>
            <li><Link href="/faq">Частые вопросы</Link></li>
            <li><Link href="/about">О компании</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="hc-footer-h">Контакты</h4>
          <ul className="ul-clean hc-footer-links">
            <li>
              <a
                href={COMPANY.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hc-contact-row"
              >
                <span style={{ color: "#F18007" }}>{COMPANY.phoneWhatsAppDisplay}</span>
                <span className="t-meta">WhatsApp · приём заказов</span>
              </a>
            </li>
            <li>
              <a href={`tel:${COMPANY.phoneCallback}`} className="hc-contact-row">
                <span style={{ color: "#5564E0" }}>{COMPANY.phoneCallbackDisplay}</span>
                <span className="t-meta">Звонки</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            </li>
            <li className="t-meta" style={{ marginTop: 8 }}>
              {COMPANY.physicalAddress}
              <br />
              09:00–19:00 без выходных
            </li>
          </ul>
        </div>
      </div>

      <div className="container-x hc-footer-bottom">
        <span>
          © {new Date().getFullYear()} Horecom · {COMPANY.legalNameShort} · ИИН {COMPANY.iin} · {COMPANY.bank}
        </span>
        <span className="hc-footer-meta">
          <span>
            <span className="live-dot" /> Все системы работают
          </span>
          <span aria-hidden="true">·</span>
          <Link href="/privacy">Конфиденциальность</Link>
          <span aria-hidden="true">·</span>
          <Link href="/delivery-and-payment">Оферта</Link>
        </span>
      </div>
    </footer>
  );
}
