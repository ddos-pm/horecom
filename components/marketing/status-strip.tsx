import { prisma } from "@/lib/prisma";

export async function StatusStrip() {
  const skuCount = await prisma.product.count({ where: { isActive: true } }).catch(() => 190);

  return (
    <div className="hero-status">
      <div className="container-x">
        <div className="hero-status-inner">
          <span>
            <span className="live-dot" /> Склад открыт
          </span>
          <span className="sep" />
          <span>
            Отгрузка <b style={{ color: "#fff" }}>12:00</b>
          </span>
          <span className="sep status-extra" />
          <span className="status-extra">
            Каталог <b style={{ color: "#fff" }}>{skuCount} товаров</b>
          </span>
          <span className="sep status-extra" />
          <span className="status-extra">
            WhatsApp ≈ <b style={{ color: "#fff" }}>4 мин</b>
          </span>
        </div>
      </div>
    </div>
  );
}
