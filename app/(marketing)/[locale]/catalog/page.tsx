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
import { getDisplayPrices, formatKzt } from "@/lib/pricing";
import { PRODUCT_BLUR_DATA_URL, PRODUCT_IMAGE_QUALITY } from "@/lib/image-blur";
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

const PER_PAGE = 24;

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    subscription?: string;
    group?: string;
    page?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const query = sp.q?.trim() ?? "";
  const categorySlug = sp.category;
  const brandFilter = sp.brand?.trim() ?? "";
  const subscriptionOnly = sp.subscription === "true";
  const groupOnly = sp.group === "true";
  const rawPage = Number(sp.page ?? "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  // Build the `where` once and reuse for findMany + count so the
  // pagination total matches what's actually filtered.
  const where = {
    isActive: true,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(brandFilter ? { brandResolved: brandFilter } : {}),
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
  };

  const [categories, products, total, brandAgg] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    }),
    prisma.product.findMany({
      where,
      include: {
        prices: { take: 1, orderBy: { createdAt: "desc" } },
        inventorySnapshot: true,
        category: true,
      },
      orderBy: [{ inventorySnapshot: { availableQty: "desc" } }, { name: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.product.count({ where }),
    // Top brands across active products (by count desc). brandResolved is
    // the AI-enriched canonical form; we use it instead of raw `brand` so
    // case duplicates / typos don't fragment the list. Cap to 24 — anything
    // longer becomes hard to scan in a sidebar. Sort case-insensitive when
    // counts tie so the alphabetical fallback reads cleanly.
    prisma.product.groupBy({
      by: ["brandResolved"],
      where: {
        isActive: true,
        brandResolved: { not: null },
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      },
      _count: { _all: true },
      orderBy: { _count: { brandResolved: "desc" } },
      take: 24,
    }),
  ]);
  const brands = brandAgg
    .filter((b): b is { brandResolved: string; _count: { _all: number } } => !!b.brandResolved)
    .map((b) => ({ name: b.brandResolved, count: b._count._all }));

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
            {activeCategory ? `${activeCategory.name} · ${products.length} товаров` : `Каталог · ${total} товаров`}
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

          {/* Mobile category strip — sidebar is hidden under 1024px so without
              this row the user has no way to switch category on phones. */}
          <div className="cats-mobile" aria-label="Категории">
            <a
              href={`/${locale}/catalog`}
              className={`cat-pill${!categorySlug ? " active" : ""}`}
            >
              Все
            </a>
            {categories.map((c) => (
              <a
                key={c.id}
                href={`/${locale}/catalog?category=${c.slug}`}
                className={`cat-pill${categorySlug === c.slug ? " active" : ""}`}
              >
                {c.name}
              </a>
            ))}
          </div>

          {(categorySlug || subscriptionOnly || groupOnly || query) && (
            <div className="chips">
              <span className="t-meta" style={{ color: "var(--c-fg-3)", fontSize: 12, marginRight: 4 }}>
                Фильтры:
              </span>
              {/* Same-pathname chip Links use plain <a> for the same reason
                  as the category sidebar — next-intl <Link> no-ops when the
                  destination pathname equals the current one. */}
              {activeCategory && (
                <a href={`/${locale}/catalog`} className="chip active">
                  {activeCategory.name} <span className="x">×</span>
                </a>
              )}
              {subscriptionOnly && (
                <a
                  href={categorySlug ? `/${locale}/catalog?category=${categorySlug}` : `/${locale}/catalog`}
                  className="chip active"
                >
                  Подписка <span className="x">×</span>
                </a>
              )}
              {groupOnly && (
                <a
                  href={categorySlug ? `/${locale}/catalog?category=${categorySlug}` : `/${locale}/catalog`}
                  className="chip active"
                >
                  Группа <span className="x">×</span>
                </a>
              )}
              {query && (
                <a
                  href={categorySlug ? `/${locale}/catalog?category=${categorySlug}` : `/${locale}/catalog`}
                  className="chip active"
                >
                  «{query}» <span className="x">×</span>
                </a>
              )}
              <a
                href={`/${locale}/catalog`}
                className="t-meta"
                style={{ fontSize: 12, color: "var(--c-blue)", fontWeight: 500 }}
              >
                Сбросить
              </a>
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
                <a
                  href={`/${locale}/catalog`}
                  className={!categorySlug ? "active" : ""}
                >
                  <span>Все товары</span>
                  <span className="n">{total}</span>
                </a>
                {categories.map((c) => (
                  // Plain <a> — next-intl <Link> intercepts the click via its
                  // onClick handler and no-ops when the pathname computes as
                  // "same" (we're going from /catalog to /catalog?…). With
                  // <a>, the browser does a real navigation that the server
                  // handles fresh. Locale is already in the URL prefix; we
                  // hard-code /ru since marketing layout always wraps locale.
                  <a
                    key={c.id}
                    href={`/${locale}/catalog?category=${c.slug}`}
                    className={categorySlug === c.slug ? "active" : ""}
                  >
                    <span>{c.name}</span>
                    <span className="n">{c._count.products}</span>
                  </a>
                ))}
              </div>
            </div>

            {brands.length > 0 && (
              <div className="filt">
                <h4>Бренды</h4>
                <div className="brand-chips">
                  {brands.map((b) => {
                    const isActive = brandFilter === b.name;
                    const next = new URLSearchParams();
                    if (categorySlug) next.set("category", categorySlug);
                    if (query) next.set("q", query);
                    if (subscriptionOnly) next.set("subscription", "true");
                    if (groupOnly) next.set("group", "true");
                    if (!isActive) next.set("brand", b.name);
                    const qs = next.toString();
                    return (
                      <a
                        key={b.name}
                        href={qs ? `/${locale}/catalog?${qs}` : `/${locale}/catalog`}
                        className={`brand-chip${isActive ? " active" : ""}`}
                      >
                        {b.name}
                        <span className="n">{b.count}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="filt">
              <h4>Наличие</h4>
              <label className="check">
                <input type="checkbox" readOnly /> В наличии <span className="n">{inStockCount}</span>
              </label>
            </div>

            <div className="filt" style={{ borderBottom: 0 }}>
              <h4>Режим работы</h4>
              <a
                href={(() => {
                  const params = new URLSearchParams();
                  if (categorySlug) params.set("category", categorySlug);
                  if (!subscriptionOnly) params.set("subscription", "true");
                  const qs = params.toString();
                  return qs ? `/${locale}/catalog?${qs}` : `/${locale}/catalog`;
                })()}
                className="filt-toggle"
                style={{ display: "flex", alignItems: "center", padding: "8px 0" }}
              >
                <input type="checkbox" checked={subscriptionOnly} readOnly /> Доступна{" "}
                <span className="pill pill-orange" style={{ marginLeft: "auto" }}>
                  Подписка · {subscriptionCount}
                </span>
              </a>
              <a
                href={(() => {
                  const params = new URLSearchParams();
                  if (categorySlug) params.set("category", categorySlug);
                  if (!groupOnly) params.set("group", "true");
                  const qs = params.toString();
                  return qs ? `/${locale}/catalog?${qs}` : `/${locale}/catalog`;
                })()}
                className="filt-toggle"
                style={{ display: "flex", alignItems: "center", padding: "8px 0" }}
              >
                <input type="checkbox" checked={groupOnly} readOnly /> Доступна{" "}
                <span className="pill pill-blue" style={{ marginLeft: "auto" }}>
                  Группа · {groupCount}
                </span>
              </a>
            </div>
          </aside>

          <div>
            <div className="results-bar">
              <div className="count">
                <b>{total}</b> {plural(total, "товар", "товара", "товаров")} найдено
                {activeCategory ? ` в категории «${activeCategory.name}»` : ""}
                {total > PER_PAGE ? ` · стр. ${page} из ${Math.max(1, Math.ceil(total / PER_PAGE))}` : ""}
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
                {products.map((p, idx) => {
                  const price = p.prices[0];
                  const stock = p.inventorySnapshot;
                  const prices = price
                    ? getDisplayPrices(Number(price.basePrice.toString()), {
                        groupPrice: price.groupPrice ? Number(price.groupPrice.toString()) : null,
                      })
                    : null;
                  // Above-the-fold candidates: first row at desktop (~5/row),
                  // first 2 rows on mobile (2/row). 8 covers both safely so
                  // the LCP candidate doesn't get lazy-loaded.
                  const isAboveFold = idx < 8;
                  return (
                    <div key={p.id} className="card">
                      <Link href={`/product/${p.slug}`} className="card-img-link">
                        <div className="card-img">
                          {p.imageUrl ? (
                            <Image
                              src={p.imageUrl}
                              alt={p.name}
                              fill
                              sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 240px"
                              priority={isAboveFold}
                              loading={isAboveFold ? "eager" : "lazy"}
                              quality={PRODUCT_IMAGE_QUALITY}
                              placeholder="blur"
                              blurDataURL={PRODUCT_BLUR_DATA_URL}
                            />
                          ) : (
                            <div className="img-ph" style={{ width: "100%", height: "100%" }} />
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
                        </div>
                        {prices && (
                          <div className="prod-price-table">
                            <div className="prod-price-row">
                              <span className="lbl">Разово</span>
                              <span className="val tabular">{formatKzt(prices.base)}</span>
                            </div>
                            {p.isSubscriptionEligible && (
                              <div className="prod-price-row sub">
                                <span className="lbl">Подписка</span>
                                <span className="val tabular">
                                  {formatKzt(prices.subscription)}
                                  <span className="save">−{prices.subscriptionSavingsPct}%</span>
                                </span>
                              </div>
                            )}
                            {p.isGroupEligible && (
                              <div className="prod-price-row grp">
                                <span className="lbl">Группа</span>
                                <span className="val tabular">
                                  {formatKzt(prices.group)}
                                  <span className="save">−{prices.groupSavingsPct}%</span>
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="prod-actions">
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
                          {p.isSubscriptionEligible && (
                            <Link
                              href={`/subscription?product=${encodeURIComponent(p.sku)}`}
                              className="btn-card btn-card-outline"
                            >
                              Подписка
                            </Link>
                          )}
                          {p.isGroupEligible && (
                            <Link
                              href={`/group-buying?product=${encodeURIComponent(p.sku)}`}
                              className="btn-card btn-card-outline"
                            >
                              Группа
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {total > PER_PAGE && (
              <CatalogPagination
                locale={locale}
                page={page}
                totalPages={Math.max(1, Math.ceil(total / PER_PAGE))}
                preserved={{
                  q: query || undefined,
                  category: categorySlug,
                  brand: brandFilter || undefined,
                  subscription: subscriptionOnly ? "true" : undefined,
                  group: groupOnly ? "true" : undefined,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function CatalogPagination({
  locale,
  page,
  totalPages,
  preserved,
}: {
  locale: string;
  page: number;
  totalPages: number;
  preserved: Record<string, string | undefined>;
}) {
  function hrefForPage(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(preserved)) {
      if (v) params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/${locale}/catalog?${qs}` : `/${locale}/catalog`;
  }

  // Build the visible page numbers — first, last, current ±1, with ellipses.
  const pages: (number | "…")[] = [];
  const window = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  let prev = 0;
  for (let p = 1; p <= totalPages; p++) {
    if (!window.has(p)) continue;
    if (p - prev > 1) pages.push("…");
    pages.push(p);
    prev = p;
  }

  return (
    <nav className="pagination" aria-label="Страницы каталога">
      {page > 1 ? (
        <a href={hrefForPage(page - 1)} className="pg-btn">← Назад</a>
      ) : (
        <span className="pg-btn disabled" aria-disabled>← Назад</span>
      )}
      <div className="pg-pages">
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="pg-ellipsis">…</span>
          ) : p === page ? (
            <span key={p} className="pg-num active" aria-current="page">{p}</span>
          ) : (
            <a key={p} href={hrefForPage(p)} className="pg-num">{p}</a>
          ),
        )}
      </div>
      {page < totalPages ? (
        <a href={hrefForPage(page + 1)} className="pg-btn">Вперёд →</a>
      ) : (
        <span className="pg-btn disabled" aria-disabled>Вперёд →</span>
      )}
    </nav>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
