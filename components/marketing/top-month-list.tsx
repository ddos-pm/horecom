"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { formatUnit } from "@/lib/units";
import type { Prisma } from "@prisma/client";

type FeaturedProduct = Prisma.ProductGetPayload<{
  include: {
    prices: { take: 1; orderBy: { createdAt: "desc" } };
    inventorySnapshot: true;
    category: true;
  };
}>;

export function TopMonthList({ products }: { products: FeaturedProduct[] }) {
  const [expanded, setExpanded] = useState(false);
  const INITIAL = 6;
  const visible = expanded ? products : products.slice(0, INITIAL);
  const hasMore = products.length > INITIAL;

  return (
    <>
      <div className="prods">
        {visible.map((p) => {
          const price = p.prices[0];
          const stock = p.inventorySnapshot;
          return (
            <Link key={p.id} href={`/product/${p.slug}`} className="prod">
              <div className="prod-img">
                {p.imageUrl && (
                  <Image src={p.imageUrl} alt={p.name} fill sizes="200px" style={{ objectFit: "contain" }} />
                )}
                {(p.isSubscriptionEligible || p.isGroupEligible) && (
                  <div className="prod-badges">
                    {p.isSubscriptionEligible && <span className="pill pill-orange">Подписка на поставку</span>}
                    {p.isGroupEligible && <span className="pill pill-blue">Групповая закупка</span>}
                  </div>
                )}
              </div>
              <div className="prod-info">
                <div className="prod-meta">
                  {p.brand ? `${p.brand} · ` : ""}
                  {p.packLabel}
                </div>
                <div className="prod-name">{p.name}</div>
                <div className="prod-bot">
                  <div>
                    <div className="prod-price tabular">
                      {price ? Number(price.basePrice).toLocaleString("ru-RU") : "—"} ₸
                    </div>
                    <div className="prod-unit">{price?.unitLabel ?? `за ${p.packLabel}`}</div>
                  </div>
                  {stock && stock.availableQty > 0 && (
                    <div className={`prod-stock${stock.stockStatus === "LOW_STOCK" ? " low" : ""}`}>
                      <span className="live-dot" />
                      {stock.availableQty} {formatUnit(p.unitType)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {hasMore && !expanded && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button type="button" onClick={() => setExpanded(true)} className="btn btn-ghost">
            ЕЩЁ
          </button>
        </div>
      )}
    </>
  );
}
