import Image from "next/image";
import type { Metadata } from "next";
import { Filter, ArrowDownUp, Grid3x3, List, ChevronDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { QuickAddButton } from "@/components/cart/quick-add-button";
import { CatalogSearchInput } from "@/components/marketing/catalog-search-input";
import { JsonLd } from "@/components/json-ld";
import { SITE_URL } from "@/lib/base-url";
import { formatUnit } from "@/lib/units";
import "./catalog.css";

// Catalog is filter-heavy (category, q, subscription, group). Marking it
// `revalidate` made the Next 15 router cache reuse the base /catalog RSC
// when soft-navigating to filtered URLs — sidebar clicks looked like
// no-ops. Force dynamic: each navigation gets a fresh server render keyed
// to the exact searchParams.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Каталог · опт ингредиентов для кондитерских и HoReCa",
  description:
    "Полный каталог Horecom: шоколад, бакалея, начинки, молочная продукция, упаковка. Оптовые цены, доставка по Астане.",
};

const STOCK_CLASS: Record<string, string> = {
  IN_STOCK: "v green",
  LOW_STOCK: "v amber",
  OUT_OF_STOCK: "v red",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; subscription?: string; group?: string }>;
}) {
  const sp = await searchParams;
  const query = sp.q?.trim() ?? "";
  const categorySlug = sp.category;
  const subscriptionOnly = sp.subscription === "true";
  const groupOnly = sp.group === "true";

  const [categories, products, total] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        ...(subscriptionOnly ? { isSubscriptionEligible: true } : {}),
        ...(groupOnly ? { isGroupEligible: true } : {}),
        ...(query
          ? {
              // Search across the AI-enriched fields too — a query like
              // "для макарон" hits products whose useCases mentions the
              // dish even when the SKU title doesn't.
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { brand: { contains: query, mode: "insensitive" as const } },
                { sku: { contains: query, mode: "insensitive" as const } },
                { descriptionExtended: { contains: query, mode: "insensitive" as const } },
                { useCases: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include: {
        prices: { take: 1, orderBy: { createdAt: "desc" } },
        inventorySnapshot: true,
        category: true,
      },
      orderBy: [{ inventorySnapshot: { availableQty: "desc" } }, { name: "asc" }],
      take: 200,
    }),
    prisma.product.count({ where: { isActive: true } }),
  ]);

  const activeCategory = categorySlug ? categories.find((c) => c.slug === categorySlug) : null;
  const [subscriptionCount, groupCount, inStockCount] = await Promise.all([
    prisma.product
      .count({ where: { isActive: true, isSubscriptionEligible: true } })
      .catch(() => 0),
    prisma.product.count({ where: { isActive: true, isGroupEligible: true } }).catch(() => 0),
    prisma.product
      .count({ where: { isActive: true, inventorySnapshot: { availableQty: { gt: 0 } } } })
      .catch(() => 0),
  ]);

  // ItemList JSON-LD — gives Google + AI crawlers a structured view of
  // the catalog grid. Position-keyed so order is preserved. Caps at the
  // rendered page size (200) to keep payload sane.
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: activeCategory ? `${activeCategory.name} · Horecom` : "Каталог Horecom",
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/ru/product/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <>
      <JsonLd data={itemListJsonLd} />
      <section className="cat-head">
        <div className="container-x cat-head-inner">
          <div className="breadcrumb">
            <Link href="/">Главная</Link>
            <span className="sep">/</span>
            <span>Каталог</span>
            {activeCategory && (
              <>
                <span className="sep">/</span>
                <span>{activeCategory.name}</span>
              </>
            )}
          </div>

          <h1>
            {activeCategory ? `${activeCategory.name} · ${products.length} SKU` : `Каталог · ${total} SKU`}
          </h1>
          <div className="sub">
            <b>
              {products.length} {plural(products.length, "товар", "товара", "товаров")}
            </b>{" "}
            {activeCategory ? `в категории «${activeCategory.name}»` : `в ${categories.length} категориях`} ·{" "}
            обновлено сегодня ·{" "}
            <span style={{ color: "var(--c-success)", fontWeight: 600 }}>
              <span className="live-dot-blue" style={{ background: "var(--c-success)" }} /> данные о наличии в реальном времени
            </span>
          </div>

          <div className="toolbar">
            <CatalogSearchInput
              defaultValue={query}
              placeholder="Шоколад Barry Callebaut, мука 25 кг, пюре манго…"
            />
            <div className="toolbar-right">
              <button type="button" className="filt-mobile-btn">
                <Filter className="h-3.5 w-3.5" />
                Фильтры
              </button>
              <button type="button" className="sort">
                <ArrowDownUp className="h-3.5 w-3.5" />
                В наличии
                <ChevronDown className="h-3 w-3" />
              </button>
              <div className="view-toggle">
                <button type="button" className="active" aria-label="Сетка">
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Список">
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {(categorySlug || subscriptionOnly || groupOnly || query) && (
            <div className="chips">
              <span className="t-meta" style={{ color: "var(--c-fg-3)", fontSize: 12, marginRight: 4 }}>
                Фильтры:
              </span>
              {activeCategory && (
                <Link href="/catalog" className="chip active">
                  {activeCategory.name} <span className="x">×</span>
                </Link>
              )}
              {subscriptionOnly && (
                <Link
                  href={{ pathname: "/catalog", query: { category: categorySlug } }}
                  className="chip active"
                >
                  Подписка <span className="x">×</span>
                </Link>
              )}
              {groupOnly && (
                <Link
                  href={{ pathname: "/catalog", query: { category: categorySlug } }}
                  className="chip active"
                >
                  Группа <span className="x">×</span>
                </Link>
              )}
              {query && (
                <Link
                  href={{ pathname: "/catalog", query: { category: categorySlug } }}
                  className="chip active"
                >
                  «{query}» <span className="x">×</span>
                </Link>
              )}
              <Link
                href="/catalog"
                className="t-meta"
                style={{ fontSize: 12, color: "var(--c-blue)", fontWeight: 500 }}
              >
                Сбросить
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="container-x">
        <div className="cat-layout">
          <aside className="sidebar">
            <div className="filt">
              <h4>Категории</h4>
              <div className="cat-list">
                <Link
                  href="/catalog"
                  className={!categorySlug ? "active" : ""}
                >
                  <span>Все товары</span>
                  <span className="n">{total}</span>
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={{ pathname: "/catalog", query: { category: c.slug } }}
                    className={categorySlug === c.slug ? "active" : ""}
                  >
                    <span>{c.name}</span>
                    <span className="n">{c._count.products}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="filt">
              <h4>Наличие</h4>
              <label className="check">
                <input type="checkbox" readOnly /> В наличии <span className="n">{inStockCount}</span>
              </label>
            </div>

            <div className="filt" style={{ borderBottom: 0 }}>
              <h4>Режим работы</h4>
              <Link
                href={{
                  pathname: "/catalog",
                  query: { category: categorySlug, subscription: subscriptionOnly ? undefined : "true" },
                }}
                className="filt-toggle"
                style={{ display: "flex", alignItems: "center", padding: "8px 0" }}
              >
                <input type="checkbox" checked={subscriptionOnly} readOnly /> Доступна{" "}
                <span className="pill pill-orange" style={{ marginLeft: "auto" }}>
                  Подписка · {subscriptionCount}
                </span>
              </Link>
              <Link
                href={{
                  pathname: "/catalog",
                  query: { category: categorySlug, group: groupOnly ? undefined : "true" },
                }}
                className="filt-toggle"
                style={{ display: "flex", alignItems: "center", padding: "8px 0" }}
              >
                <input type="checkbox" checked={groupOnly} readOnly /> Доступна{" "}
                <span className="pill pill-blue" style={{ marginLeft: "auto" }}>
                  Группа · {groupCount}
                </span>
              </Link>
            </div>
          </aside>

          <div>
            <div className="results-bar">
              <div className="count">
                <b>{products.length}</b> {plural(products.length, "товар", "товара", "товаров")} найдено
                {activeCategory ? ` в категории «${activeCategory.name}»` : ""}
              </div>
            </div>

            {products.length === 0 ? (
              <div
                style={{
                  padding: "60px 24px",
                  textAlign: "center",
                  border: "1px dashed var(--c-border)",
                  borderRadius: 12,
                  color: "var(--c-fg-3)",
                }}
              >
                Ничего не найдено. Попробуй сбросить фильтры или открой полный каталог.
              </div>
            ) : (
              <div className="grid" data-products-grid>
                {products.map((p) => {
                  const price = p.prices[0];
                  const stock = p.inventorySnapshot;
                  const pricePerUnit = price?.unitLabel ?? "";
                  return (
                    <div key={p.id} className="card">
                      <Link href={`/product/${p.slug}`} className="card-img-link">
                        <div className="card-img">
                          {p.imageUrl ? (
                            <Image src={p.imageUrl} alt={p.name} fill sizes="240px" />
                          ) : (
                            <div className="img-ph" style={{ width: "100%", height: "100%" }} />
                          )}
                          {(p.isSubscriptionEligible || p.isGroupEligible) && (
                            <div className="card-badges">
                              {p.isSubscriptionEligible && (
                                <span className="pill pill-orange">Подписка</span>
                              )}
                              {p.isGroupEligible && <span className="pill pill-blue">Группа</span>}
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="card-info">
                        <div className="card-meta">
                          {(() => {
                            const brand = p.brandResolved ?? p.brand;
                            return brand ? (
                              <>
                                <span>{brand}</span>
                                <span>·</span>
                              </>
                            ) : null;
                          })()}
                          <span className="pack">{p.packLabel}</span>
                        </div>
                        <Link href={`/product/${p.slug}`} className="card-name">
                          {p.name}
                        </Link>
                        <div className="card-data">
                          <div>
                            <div className="k">MOQ</div>
                            <div className="v">
                              {p.minOrderQty} {formatUnit(p.unitType)}
                            </div>
                          </div>
                          <div>
                            <div className="k">Стек</div>
                            <div className={STOCK_CLASS[stock?.stockStatus ?? "OUT_OF_STOCK"]}>
                              {stock?.availableQty && stock.availableQty > 0
                                ? `${stock.availableQty} ${formatUnit(p.unitType)}`
                                : "Под заказ"}
                            </div>
                          </div>
                          <div>
                            <div className="k">Кат.</div>
                            <div className="v" title={p.category.name}>
                              {p.category.name.split(" ")[0].toLowerCase()}
                            </div>
                          </div>
                        </div>
                        <div className="card-bot">
                          <div>
                            <div className="card-price tabular">
                              {price ? Number(price.basePrice.toString()).toLocaleString("ru-RU") : "—"} ₸
                            </div>
                            <div className="card-unit">{pricePerUnit}</div>
                          </div>
                          {price && (
                            <QuickAddButton
                              product={{
                                productId: p.id,
                                slug: p.slug,
                                name: p.name,
                                image: p.imageUrl ?? null,
                                price: Number(price.basePrice.toString()),
                                minOrderQty: p.minOrderQty,
                                packLabel: p.packLabel,
                                unitType: p.unitType,
                                stockStatus: stock?.stockStatus ?? null,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
