import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";

export async function StatusStrip() {
  const [skuCount, locale] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }).catch(() => 190),
    getLocale(),
  ]);
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
