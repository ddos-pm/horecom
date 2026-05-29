"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, MessageCircle, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { COMPANY } from "@/lib/company";
import { HeaderSearchInput } from "./header-search-input";

export function MobileDrawer() {
  const t = useTranslations("header");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal target needs document.body, which is client-only.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.classList.add("hc-locked");
    } else {
      document.body.classList.remove("hc-locked");
    }
    return () => document.body.classList.remove("hc-locked");
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const NAV: { href: string; label: string; hint?: string }[] = [
    { href: "/catalog", label: t("nav.catalog"), hint: t("nav.catalogHint") },
    { href: "/subscription", label: t("nav.subscription") },
    { href: "/group-buying", label: t("nav.groupBuying") },
    { href: "/about", label: t("nav.about") },
    { href: "/faq", label: t("nav.faq") },
  ];

  const drawerJsx = (
    <>
      <div
        className={`hc-drawer-bd${open ? " open" : ""}`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />

      <aside className={`hc-drawer${open ? " open" : ""}`} aria-hidden={!open}>
        <div className="hc-drawer-head">
          <Link href="/" className="hc-logo" onClick={() => setOpen(false)}>
            <img
              src="/logos/logo-horizontal-transparent.png"
              alt="Horecom"
              className="logo-img"
            />
          </Link>
          <button
            type="button"
            className="hc-icon-btn"
            aria-label={t("closeMenu")}
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <HeaderSearchInput
          className="hc-drawer-search"
          placeholder={t("drawerSearchPlaceholder")}
          onAfterSubmit={() => setOpen(false)}
        />

        <nav className="hc-drawer-nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              <span>{item.label}</span>
              {item.hint && <span className="count">{item.hint}</span>}
            </Link>
          ))}
          <a href="/login" onClick={() => setOpen(false)}>
            <span>{t("loginRegister")}</span>
          </a>
        </nav>

        <div className="hc-drawer-divider" />

        <div className="hc-drawer-contacts">
          <div className="t-eyebrow" style={{ marginBottom: 10 }}>{t("contacts")}</div>
          <a
            href={COMPANY.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hc-drawer-contact"
          >
            <MessageCircle className="h-5 w-5" style={{ color: "#25D366" }} />
            <div>
              <div className="ttl">{COMPANY.phoneWhatsAppDisplay}</div>
              <div className="sub">{t("contactsCaption.whatsapp")}</div>
            </div>
          </a>
          <a href={`tel:${COMPANY.phoneCallback}`} className="hc-drawer-contact">
            <Phone className="h-5 w-5" style={{ color: "#394AD4" }} />
            <div>
              <div className="ttl">{COMPANY.phoneCallbackDisplay}</div>
              <div className="sub">{t("contactsCaption.voice")}</div>
            </div>
          </a>
          <div className="hc-drawer-meta">
            {COMPANY.physicalAddress}
            <br />
            {t("contactsCaption.pickup")}
          </div>
        </div>
      </aside>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="hc-hamb show-mobile"
        aria-label={t("openMenu")}
        onClick={() => setOpen(true)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {/* Backdrop + drawer panel render at <body> root via portal — escapes
          the sticky <header>'s z-index:40 stacking context, so the drawer
          (z:50) is no longer trapped behind hero content with relative
          positioning. SSR pre-mount fallback returns null so first paint
          matches server HTML (avoids hydration mismatch). */}
      {mounted ? createPortal(drawerJsx, document.body) : null}
    </>
  );
}
