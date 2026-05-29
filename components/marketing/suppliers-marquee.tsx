import { getLocale } from "next-intl/server";

/**
 * Suppliers marquee for the home page.
 *
 * the team's V1 brief wants a horizontal logo carousel. We don't ship real
 * brand logos in this repo — using third-party SVGs without explicit
 * licensing is risky for a public marketing page, especially with the
 * grant submission attached. So this is a text-fallback marquee: each
 * supplier is a styled text card in a neutral frame.
 *
 * When the team provides licensed SVG/PNG assets, swap the <span> children
 * for <Image> — animation + structure stay identical.
 */

const SUPPLIERS_RU = [
  "Barry Callebaut",
  "IRCA",
  "Sicao",
  "1883 Maison Routin",
  "AmeriColor",
  "Andros",
  "Berybert",
  "Veliche",
  "Любимо",
  "Цесна",
];

const SUPPLIERS_EN = [
  "Barry Callebaut",
  "IRCA",
  "Sicao",
  "1883 Maison Routin",
  "AmeriColor",
  "Andros",
  "Berybert",
  "Veliche",
  "Lyubimo",
  "Tsesna",
];

export async function SuppliersMarquee() {
  const locale = await getLocale();
  const isEn = locale === "en";
  const suppliers = isEn ? SUPPLIERS_EN : SUPPLIERS_RU;

  // Render the list twice for a seamless infinite scroll: when the first
  // copy scrolls fully off-screen left, the second copy is already
  // on-screen, and the animation snaps back to start without a jump.
  return (
    <section className="suppliers-band">
      <div className="container-x">
        <div className="suppliers-eyebrow">
          {isEn ? "Direct supplier contracts" : "Работаем напрямую с поставщиками"}
        </div>
      </div>
      <div
        className="suppliers-marquee"
        aria-label={isEn ? "Horecom supplier logos" : "Логотипы поставщиков Horecom"}
      >
        <div className="suppliers-track">
          {[...suppliers, ...suppliers].map((name, i) => (
            <span key={i} className="suppliers-cell" aria-hidden={i >= suppliers.length}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
