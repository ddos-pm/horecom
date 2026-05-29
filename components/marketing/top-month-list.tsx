"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { formatUnit } from "@/lib/units";
import { useCart } from "@/lib/cart-store";
import { getDisplayPrices, formatKzt } from "@/lib/pricing";
import { PRODUCT_BLUR_DATA_URL, PRODUCT_IMAGE_QUALITY } from "@/lib/image-blur";
import type { Prisma } from "@prisma/client";

type FeaturedProduct = Prisma.ProductGetPayload<{
  include: {
    prices: { take: 1; orderBy: { createdAt: "desc" } };
    inventorySnapshot: true;
    category: true;
  };
}>;

export function TopMonthList({ products }: { products: FeaturedProduct[] }) {
  const locale = useLocale();
  const isEn = locale === "en";
  const [expanded, setExpanded] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const INITIAL = 6;
  const visible = expanded ? products : products.slice(0, INITIAL);
  const hasMore = products.length > INITIAL;

  function handleAdd(e: React.MouseEvent, p: FeaturedProduct) {
    e.preventDefault();
    e.stopPropagation();
    const price = p.prices[0];
    if (!price) return;
    addItem({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: p.imageUrl,
      price: Number(price.basePrice),
      minOrderQty: p.minOrderQty,
      packLabel: p.packLabel,
      unitType: p.unitType,
    });
    toast.success(isEn ? "Added to cart" : "В корзине", { description: p.name });
  }

  return (
    <>
      <div className="prods">
        {visible.map((p) => {
          const price = p.prices[0];
          const stock = p.inventorySnapshot;
          const prices = price ? getDisplayPrices(Number(price.basePrice), {
            groupPrice: price.groupPrice ? Number(price.groupPrice) : null,
          }) : null;
          const outOfStock = stock?.stockStatus === "OUT_OF_STOCK";

          // Card is a <div>, NOT a <Link>. Two child Links (image + name)
          // navigate to the PDP; action buttons stay outside those Links
          // so there's no <a> nested inside <a> (the older shape caused a
          // React #418 hydration mismatch — browsers silently un-nest the
          // inner <a>, SSR HTML and client DOM diverge).
          return (
            <div key={p.id} className="prod">
              <Link href={`/product/${p.slug}`} className="prod-img-link" aria-label={p.name}>
                <div className="prod-img">
                  {p.imageUrl && (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 200px"
                      style={{ objectFit: "contain" }}
                      quality={PRODUCT_IMAGE_QUALITY}
                      placeholder="blur"
                      blurDataURL={PRODUCT_BLUR_DATA_URL}
                    />
                  )}
                </div>
              </Link>
              <div className="prod-info">
                <div className="prod-meta">
                  {p.brand ? `${p.brand} · ` : ""}
                  {p.packLabel}
                </div>
                <Link href={`/product/${p.slug}`} className="prod-name">
                  {p.name}
                </Link>

                {prices && (
                  <div className="prod-price-table">
                    <div className="prod-price-row">
                      <span className="lbl">{isEn ? "One-off" : "Разово"}</span>
                      <span className="val tabular">{formatKzt(prices.base)}</span>
                    </div>
                    {p.isSubscriptionEligible && (
                      <div className="prod-price-row sub">
                        <span className="lbl">{isEn ? "Subscription" : "Подписка"}</span>
                        <span className="val tabular">
                          {formatKzt(prices.subscription)}
                          <span className="save">−{prices.subscriptionSavingsPct}%</span>
                        </span>
                      </div>
                    )}
                    {p.isGroupEligible && (
                      <div className="prod-price-row grp">
                        <span className="lbl">{isEn ? "Group" : "Группа"}</span>
                        <span className="val tabular">
                          {formatKzt(prices.group)}
                          <span className="save">−{prices.groupSavingsPct}%</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {stock && stock.availableQty > 0 && (
                  <div className={`prod-stock${stock.stockStatus === "LOW_STOCK" ? " low" : ""}`}>
                    <span className="live-dot" />
                    {stock.availableQty} {formatUnit(p.unitType)}
                  </div>
                )}

                <div className="prod-actions">
                  <button
                    type="button"
                    className="btn-card btn-card-primary"
                    onClick={(e) => handleAdd(e, p)}
                    disabled={outOfStock || !price}
                    aria-label={isEn ? "Add to cart" : "Добавить в корзину"}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isEn ? "Cart" : "Корзина"}
                  </button>
                  {p.isSubscriptionEligible && (
                    <Link
                      href={`/subscription?product=${encodeURIComponent(p.sku)}`}
                      className="btn-card btn-card-outline"
                    >
                      {isEn ? "Subscription" : "Подписка"}
                    </Link>
                  )}
                  {p.isGroupEligible && (
                    <Link
                      href={`/group-buying?product=${encodeURIComponent(p.sku)}`}
                      className="btn-card btn-card-outline"
                    >
                      {isEn ? "Group" : "Группа"}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && !expanded && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button type="button" onClick={() => setExpanded(true)} className="btn btn-ghost">
            {isEn ? "MORE" : "ЕЩЁ"}
          </button>
        </div>
      )}
    </>
  );
}
