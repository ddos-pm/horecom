import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";

/**
 * Shown only on /kz/* routes for V0. The Russian site is the authoritative
 * source; Kazakh is a route reservation pending a native-speaker pass on
 * messages/kz.json. The banner keeps Tyler/reviewers from mistaking the
 * Russian copy on /kz/* for a deployment bug.
 */
export async function LocaleBanner() {
  const locale = await getLocale();
  if (locale !== "kz") return null;

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
          <b>Қазақша нұсқа дайындалуда.</b> Осы парақтың мазмұны әзірге орыс тілінде көрсетіледі. (Казахская версия в разработке.)
        </span>
        <Link href="/" locale="ru" style={{ textDecoration: "underline" }}>
          Открыть на русском →
        </Link>
      </div>
    </div>
  );
}
