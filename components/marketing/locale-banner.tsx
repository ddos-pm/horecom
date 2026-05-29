import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";

/**
 * Translation-status banner.
 *
 * Russian is the source of truth; KZ + EN routes are reachable (so any
 * pre-indexed URL or external link still resolves) but the marketing
 * copy is still mostly Russian. The banner explains that to reviewers
 * and offers a one-click bounce back to /ru so they don't mistake the
 * Russian content on /kz or /en for a deployment bug.
 */
export async function LocaleBanner() {
  const locale = await getLocale();
  if (locale === "ru") return null;

  let messagePrimary = "";
  let messageSecondary = "";
  let ctaLabel = "";

  if (locale === "kz") {
    messagePrimary = "Қазақша нұсқа дайындалуда.";
    messageSecondary = "Осы парақтың мазмұны әзірге орыс тілінде көрсетіледі. (Казахская версия в разработке.)";
    ctaLabel = "Открыть на русском →";
  } else if (locale === "en") {
    messagePrimary = "English UI is in progress.";
    messageSecondary = "Most catalog and landing copy is still rendered in Russian. The home hero and the MCP / About sections are available in English.";
    ctaLabel = "Open in Russian →";
  } else {
    return null;
  }

  return (
    <div
      role="status"
      style={{
        background: "var(--c-warning-bg)",
        color: "var(--c-warning)",
        borderBottom: "1px solid rgba(180, 83, 9, 0.2)",
        fontSize: 13,
        lineHeight: 1.4,
      }}
    >
      <div className="container-x" style={{ padding: "10px 16px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <span>
          <b>{messagePrimary}</b> {messageSecondary}
        </span>
        <Link href="/" locale="ru" style={{ textDecoration: "underline" }}>
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
