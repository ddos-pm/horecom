"use client";

import { useEffect, useState } from "react";
import { X, MessageCircle, Phone } from "lucide-react";
import { Link } from "@/i18n/routing";
import { COMPANY } from "@/lib/company";
import { HeaderSearchInput } from "./header-search-input";

const NAV = [
  { href: "/catalog", label: "Каталог", hint: "190 SKU" },
  { href: "/subscription", label: "Подписка", hint: "S2" },
  { href: "/group-buying", label: "Групповые закупки", hint: "V1.5", flag: true },
  { href: "/about", label: "О компании" },
  { href: "/faq", label: "Частые вопросы" },
];

export function MobileDrawer() {
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <button
        type="button"
        className="hc-hamb show-mobile"
        aria-label="Открыть меню"
        onClick={() => setOpen(true)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

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
            aria-label="Закрыть"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <HeaderSearchInput
          className="hc-drawer-search"
          placeholder="Поиск по 190 SKU…"
          onAfterSubmit={() => setOpen(false)}
        />

        <nav className="hc-drawer-nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              <span>{item.label}</span>
              {item.hint && (
                <span className={`count${item.flag ? " pill pill-orange" : ""}`}>{item.hint}</span>
              )}
            </Link>
          ))}
          <a href="/login" onClick={() => setOpen(false)}>
            <span>Войти / Регистрация</span>
          </a>
        </nav>

        <div className="hc-drawer-divider" />

        <div className="hc-drawer-contacts">
          <div className="t-eyebrow" style={{ marginBottom: 10 }}>Контакты</div>
          <a
            href={COMPANY.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hc-drawer-contact"
          >
            <MessageCircle className="h-5 w-5" style={{ color: "#25D366" }} />
            <div>
              <div className="ttl">{COMPANY.phoneWhatsAppDisplay}</div>
              <div className="sub">WhatsApp · приём заказов</div>
            </div>
          </a>
          <a href={`tel:${COMPANY.phoneCallback}`} className="hc-drawer-contact">
            <Phone className="h-5 w-5" style={{ color: "#394AD4" }} />
            <div>
              <div className="ttl">{COMPANY.phoneCallbackDisplay}</div>
              <div className="sub">Звонки</div>
            </div>
          </a>
          <div className="hc-drawer-meta">
            {COMPANY.physicalAddress}
            <br />
            самовывоз 09:00–19:00
          </div>
        </div>
      </aside>
    </>
  );
}
