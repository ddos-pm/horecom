import Image from "next/image";
import { MessageCircle, Instagram, AtSign } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { COMPANY } from "@/lib/company";

// COMPANY is still imported for socials, email, phone, etc.
// Legal-entity fields (iin, iban, bank, legalAddress) are intentionally NOT
// rendered on public surfaces — they appear only in invoices and on the
// privacy page on request.

export async function MarketingFooter() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="hc-footer">
      <div className="container-x hc-footer-top">
        <div className="hc-footer-brand">
          <Link href="/" className="hc-logo hc-logo-dark inline-block" aria-label={t("logoAria")}>
            <Image
              src="/logos/logo-horizontal-transparent.png"
              alt="Horecom"
              width={569}
              height={113}
              className="h-10 w-auto md:h-12"
              unoptimized
              priority
            />
          </Link>
          <p className="t-body">{t("tagline")}</p>
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
          <h4 className="hc-footer-h">{t("columns.catalog")}</h4>
          <ul className="ul-clean hc-footer-links">
            <li><Link href="/catalog">{t("catalogLinks.all")}</Link></li>
            <li><Link href="/catalog?category=chocolate-glazes">{t("catalogLinks.chocolate")}</Link></li>
            <li><Link href="/catalog?category=syrups">{t("catalogLinks.syrups")}</Link></li>
            <li><Link href="/catalog?category=ingredients">{t("catalogLinks.ingredients")}</Link></li>
            <li><Link href="/catalog?category=dairy">{t("catalogLinks.dairy")}</Link></li>
            <li><Link href="/catalog?category=frozen">{t("catalogLinks.frozen")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="hc-footer-h">{t("columns.platform")}</h4>
          <ul className="ul-clean hc-footer-links">
            <li><Link href="/subscription">{t("platformLinks.subscription")}</Link></li>
            <li><Link href="/group-buying">{t("platformLinks.groupBuying")}</Link></li>
            <li><Link href="/how-ordering-works">{t("platformLinks.howOrdering")}</Link></li>
            <li><Link href="/delivery-and-payment">{t("platformLinks.delivery")}</Link></li>
            <li><Link href="/faq">{t("platformLinks.faq")}</Link></li>
            <li><Link href="/about">{t("platformLinks.about")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="hc-footer-h">{t("columns.contacts")}</h4>
          <ul className="ul-clean hc-footer-links">
            <li>
              <a
                href={COMPANY.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hc-contact-row"
              >
                <span style={{ color: "#F18007" }}>{COMPANY.phoneWhatsAppDisplay}</span>
                <span className="t-meta">{t("contactsCaption.whatsapp")}</span>
              </a>
            </li>
            <li>
              <a href={`tel:${COMPANY.phoneCallback}`} className="hc-contact-row">
                <span style={{ color: "#5564E0" }}>{COMPANY.phoneCallbackDisplay}</span>
                <span className="t-meta">{t("contactsCaption.voice")}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            </li>
            <li className="t-meta" style={{ marginTop: 8 }}>
              {COMPANY.physicalAddress}
              <br />
              {t("hours")}
            </li>
          </ul>
        </div>
      </div>

      <div className="container-x hc-footer-bottom">
        <span>{t("bottom.legal", { year })}</span>
        <span className="hc-footer-meta">
          <span>
            <span className="live-dot" /> {t("bottom.systemsOk")}
          </span>
          <span aria-hidden="true">·</span>
          <Link href="/privacy">{t("bottom.privacy")}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/offer">{t("bottom.offer")}</Link>
          <span aria-hidden="true">·</span>
          <a
            href="/llms.txt"
            title={t("bottom.forAiTitle")}
          >
            {t("bottom.forAi")}
          </a>
        </span>
      </div>
    </footer>
  );
}
