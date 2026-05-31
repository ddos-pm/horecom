import { getLocale } from "next-intl/server";

/**
 * Hero strip with operational status (warehouse open, dispatch time,
 * catalog SKU count, WhatsApp response time).
 *
 * skuCount comes in as a prop from the parent page — the home page
 * already loads it via getHomePageData() so duplicating the
 * prisma.product.count call here was a wasted Tokyo round-trip.
 *
 * Default to 190 (the team's actual catalog size at the time of the
 * grant submission) so the component renders sanely if it's ever
 * mounted on a route that doesn't have a count handy.
 */
export async function StatusStrip({ skuCount = 190 }: { skuCount?: number }) {
  const locale = await getLocale();
  const isEn = locale === "en";

  return (
    <div className="hero-status">
      <div className="container-x">
        <div className="hero-status-inner">
          <span>
            <span className="live-dot" /> {isEn ? "Warehouse open" : "Склад открыт"}
          </span>
          <span className="sep" />
          <span>
            {isEn ? "Dispatch " : "Отгрузка "}
            <b style={{ color: "#fff" }}>12:00</b>
          </span>
          <span className="sep status-extra" />
          <span className="status-extra">
            {isEn ? "Catalog " : "Каталог "}
            <b style={{ color: "#fff" }}>{skuCount} {isEn ? "products" : "товаров"}</b>
          </span>
          <span className="sep status-extra" />
          <span className="status-extra">
            WhatsApp ≈ <b style={{ color: "#fff" }}>{isEn ? "4 min" : "4 мин"}</b>
          </span>
        </div>
      </div>
    </div>
  );
}
