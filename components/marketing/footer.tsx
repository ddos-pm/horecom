import Image from "next/image";
import { MessageCircle, Instagram, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { COMPANY } from "@/lib/company";

export async function MarketingFooter() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-black text-white">
      <div className="container-tight grid gap-8 py-12 md:grid-cols-4">
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
          <p className="mt-3 text-sm text-white/70">{t("tagline")}</p>
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

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">
            {t("columns.catalog")}
          </h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/catalog" className="hover:text-white">{t("links.about")}</Link></li>
            <li><Link href="/subscription" className="hover:text-white">{t("links.subscription")}</Link></li>
            <li><Link href="/group-buying" className="hover:text-white">{t("links.groupBuying")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">
            {t("columns.info")}
          </h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/about" className="hover:text-white">{t("links.about")}</Link></li>
            <li><Link href="/how-ordering-works" className="hover:text-white">{t("links.howOrdering")}</Link></li>
            <li><Link href="/delivery-and-payment" className="hover:text-white">{t("links.delivery")}</Link></li>
            <li><Link href="/faq" className="hover:text-white">{t("links.faq")}</Link></li>
            <li><Link href="/privacy" className="hover:text-white">{t("links.privacy")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">
            {t("columns.contacts")}
          </h3>
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
                  <div className="text-xs text-white/50">WhatsApp</div>
                </div>
              </a>
            </li>
            <li>
              <a href={`tel:${COMPANY.phoneCallback}`} className="flex items-start gap-2 hover:text-white">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-blue" />
                <div>
                  <div>{COMPANY.phoneCallbackDisplay}</div>
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
              <span>{COMPANY.physicalAddress}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-tight flex flex-col gap-2 py-4 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <span>
            © {t("legal", { year, legalName: COMPANY.legalNameShort, iin: COMPANY.iin })}
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            {COMPANY.bank}
          </span>
        </div>
      </div>
    </footer>
  );
}
