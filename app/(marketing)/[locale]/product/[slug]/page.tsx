import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { ShieldCheck, FileText, Clock, RefreshCcw, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { JsonLd } from "@/components/json-ld";
import { COMPANY } from "@/lib/company";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatUnit } from "@/lib/units";
import { SITE_URL } from "@/lib/base-url";
import { getDisplayPrices, formatKzt } from "@/lib/pricing";
import { localizePackLabel } from "@/lib/format-pack";
import { pickLocalized } from "@/lib/i18n-field";
import { getProductBySlug } from "@/lib/product-loader";
import { Gallery } from "./gallery";
import "./product.css";

// ISR — top-30 bulk-pack products (by minOrderQty desc) are pre-rendered at
// build time so popular PDPs are instant; everything else is rendered on
// first hit and cached for 5 min. Keeps build wall-time + DB-connection
// pressure manageable on the Tokyo pooler.
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  // Tokyo Supabase pooler occasionally times out on the local "npm run build"
  // pass (transient Pacific→Pacific latency). Failing here aborts the whole
  // export and reports as "Failed to collect page data". Swallow + return
  // empty: the page is dynamicParams=true and ISR'd anyway, so an empty
  // pre-render set just means everything renders on-demand on the first hit.
  // Vercel's build env tends to succeed because it's closer to the pooler.
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { minOrderQty: "desc" },
      take: 30,
      select: { slug: true },
    });
    return products.map((p) => ({ slug: p.slug }));
  } catch (e) {
    console.warn(
      "[generateStaticParams] DB unreachable — skipping PDP pre-render",
      e instanceof Error ? e.message.slice(0, 100) : "unknown",
    );
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const isEn = locale === "en";
  // Cached loader — same call inside ProductPage() will reuse this result
  // for the duration of the request (saves a Tokyo round-trip per PDP).
  const product = await getProductBySlug(slug);
  if (!product) return { title: isEn ? "Product not found" : "Товар не найден" };

  return {
    title: product.name,
    description: isEn
      ? `${product.brand ?? ""} ${product.packLabel}. ${product.description ?? ""}. Wholesale price at Horecom.`.trim()
      : `${product.brand ?? ""} ${product.packLabel}. ${product.description ?? ""}. Оптовая цена в Horecom.`.trim(),
    openGraph: {
      title: product.name,
      description: product.description ?? "",
      type: "website",
      url: `https://horecom.kz/${locale}/product/${product.slug}`,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
    alternates: { canonical: `https://horecom.kz/${locale}/product/${product.slug}` },
  };
}

function stockStatusToSchema(s?: string | null) {
  if (s === "IN_STOCK") return "https://schema.org/InStock";
  if (s === "LOW_STOCK") return "https://schema.org/LimitedAvailability";
  return "https://schema.org/OutOfStock";
}

function storageLabel(s: string, isEn: boolean) {
  if (isEn) {
    return (
      { AMBIENT: "Ambient", REFRIGERATED: "Refrigerated", FROZEN: "Frozen" } as Record<string, string>
    )[s] ?? s;
  }
  return (
    { AMBIENT: "Обычная температура", REFRIGERATED: "Холодильник", FROZEN: "Заморозка" } as Record<
      string,
      string
    >
  )[s] ?? s;
}

function buildStockPill(stockKey: string, isEn: boolean) {
  if (stockKey === "IN_STOCK") {
    return {
      cls: "pill pill-green",
      label: (q: number, u: string) => (isEn ? `In stock · ${q} ${u}` : `В наличии · ${q} ${u}`),
    };
  }
  if (stockKey === "LOW_STOCK") {
    return {
      cls: "pill pill-amber",
      label: (q: number, u: string) =>
        isEn ? `Low stock · ${q} ${u}` : `Заканчивается · ${q} ${u}`,
    };
  }
  return {
    cls: "pill pill-red",
    label: () => (isEn ? "Made-to-order" : "Под заказ"),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isEn = locale === "en";

  // Stage 1: load the product. generateMetadata already called the same
  // cached loader earlier in the request, so this resolves from the
  // React.cache() memo with no DB hit. We still need the categoryId
  // before we can kick off the related-products query.
  const product = await getProductBySlug(slug);

  if (!product || !product.isActive) notFound();

  // Stage 2: related products — independent of all the derivations below,
  // kick it off and let it run while we compute the synchronous bits.
  const relatedPromise = prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
    take: 4,
    orderBy: [{ inventorySnapshot: { availableQty: "desc" } }, { name: "asc" }],
    include: { prices: { take: 1, orderBy: { createdAt: "desc" } } },
  });

  const basePrice = product.prices[0];
  const stock = product.inventorySnapshot;
  const stockKey = stock?.stockStatus ?? "OUT_OF_STOCK";
  const stockMeta = buildStockPill(stockKey, isEn);
  const unitWord = formatUnit(product.unitType);

  const images = [product.imageUrl, ...product.imageUrls].filter(Boolean) as string[];
  const fallbackImage = ["/logos/logo-mark.png"];
  const galleryImages = images.length > 0 ? images : fallbackImage;

  const related = await relatedPromise;

  // Volume tiers (synthesise simple ladder from base + wholesale fields)
  const tiers: { min: number; price: number; perUnit: number | null; saving: number | null; current?: boolean }[] = [];
  if (basePrice) {
    const base = Number(basePrice.basePrice);
    tiers.push({ min: 1, price: base, perUnit: null, saving: null, current: true });
    if (basePrice.wholesaleThreshold && basePrice.wholesalePrice) {
      const wholesale = Number(basePrice.wholesalePrice);
      tiers.push({
        min: basePrice.wholesaleThreshold,
        price: wholesale,
        perUnit: null,
        saving: Math.round(((base - wholesale) / base) * 1000) / 10,
      });
    }
  }

  // Price valid until end of next year — keeps Google Shopping happy
  // without committing to a hard expiration we'd have to maintain.
  const priceValidUntil = new Date(new Date().getFullYear() + 1, 11, 31)
    .toISOString()
    .slice(0, 10);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}/${locale}/product/${product.slug}#product`,
    name: product.name,
    description: product.descriptionExtended ?? product.description,
    sku: product.sku,
    ...((product.brandResolved ?? product.brand) && {
      brand: { "@type": "Brand", name: product.brandResolved ?? product.brand },
    }),
    category: product.category.name,
    image: galleryImages,
    ...(basePrice && {
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/${locale}/product/${product.slug}`,
        priceCurrency: basePrice.currency,
        price: basePrice.basePrice.toString(),
        priceValidUntil,
        availability: stockStatusToSchema(stock?.stockStatus),
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Horecom",
          url: SITE_URL,
        },
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          minValue: product.minOrderQty,
          unitText: product.unitType,
        },
        areaServed: { "@type": "City", name: isEn ? "Astana" : "Астана" },
        deliveryLeadTime: {
          "@type": "QuantitativeValue",
          minValue: 0,
          maxValue: 1,
          unitCode: "DAY",
        },
      },
    }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isEn ? "Home" : "Главная", item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: isEn ? "Catalog" : "Каталог", item: `${SITE_URL}/${locale}/catalog` },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category.name,
        item: `${SITE_URL}/${locale}/catalog?category=${product.category.slug}`,
      },
      { "@type": "ListItem", position: 4, name: product.name },
    ],
  };

  const waText = isEn
    ? `Hello, I'm interested in ${product.name} (${product.sku})`
    : `Здравствуйте, интересует ${product.name} (${product.sku})`;
  const waLink = `${COMPANY.whatsappLink}&text=${encodeURIComponent(waText)}`;

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="container-x pdp-wrap">
        <nav className="breadcrumb" aria-label={isEn ? "Breadcrumbs" : "Хлебные крошки"}>
          <Link href="/">{isEn ? "Home" : "Главная"}</Link>
          <span className="sep">/</span>
          <Link href="/catalog">{isEn ? "Catalog" : "Каталог"}</Link>
          <span className="sep">/</span>
          <Link href={{ pathname: "/catalog", query: { category: product.category.slug } }}>
            {pickLocalized(product.category, locale, "name")}
          </Link>
          <span className="sep">/</span>
          <span className="curr">{pickLocalized(product, locale, "name")}</span>
        </nav>

        <div className="pdp">
          <Gallery
            images={galleryImages}
            alt={product.name}
            badges={
              <>
                {product.isSubscriptionEligible && (
                  <span className="pill pill-orange">{isEn ? "Subscription" : "Подписка"}</span>
                )}
                {product.isGroupEligible && (
                  <span className="pill pill-blue">{isEn ? "Group" : "Группа"}</span>
                )}
              </>
            }
          />

          <div className="pdp-info">
            <div className="pdp-brand">
              {product.brand && (
                <>
                  <span className="b">{product.brand}</span>
                  <span>·</span>
                </>
              )}
              <span>{pickLocalized(product.category, locale, "name")}</span>
              <span className="sku">{product.sku}</span>
            </div>

            <h1 className="pdp-name">{pickLocalized(product, locale, "name")}</h1>

            <div className="pdp-badges">
              <span className={stockMeta.cls}>{stockMeta.label(stock?.availableQty ?? 0, unitWord)}</span>
              {product.isSubscriptionEligible && (
                <span className="pill pill-orange">
                  {isEn ? "Subscription available" : "Доступна подписка"}
                </span>
              )}
              {product.isGroupEligible && (
                <span className="pill pill-blue">
                  {isEn ? "Group buying available" : "Доступна группа"}
                </span>
              )}
              {product.storageType !== "AMBIENT" && (
                <span className="pill pill-outline">{storageLabel(product.storageType, isEn)}</span>
              )}
            </div>

            {basePrice && (() => {
              const modes = getDisplayPrices(Number(basePrice.basePrice), {
                groupPrice: basePrice.groupPrice ? Number(basePrice.groupPrice) : null,
              });
              return (
              <div className="price-block">
                <div className="price-head">
                  <div className="main">
                    <span className="amount tabular">
                      {Number(basePrice.basePrice).toLocaleString(isEn ? "en-US" : "ru-RU")} ₸
                    </span>
                    <span className="per">/ {localizePackLabel(product.packLabel, locale)}</span>
                  </div>
                </div>

                {(product.isSubscriptionEligible || product.isGroupEligible) && (
                  <div className="pdp-modes">
                    <div className="pdp-mode">
                      <div className="lbl">{isEn ? "One-off" : "Разово"}</div>
                      <div className="val tabular">{formatKzt(modes.base)}</div>
                    </div>
                    {product.isSubscriptionEligible && (
                      <div className="pdp-mode sub">
                        <div className="lbl">{isEn ? "Subscription" : "Подписка"}</div>
                        <div className="val tabular">{formatKzt(modes.subscription)}</div>
                        <div className="save">−{modes.subscriptionSavingsPct}%</div>
                      </div>
                    )}
                    {product.isGroupEligible && (
                      <div className="pdp-mode grp">
                        <div className="lbl">{isEn ? "Group" : "Группа"}</div>
                        <div className="val tabular">{formatKzt(modes.group)}</div>
                        <div className="save">−{modes.groupSavingsPct}%</div>
                      </div>
                    )}
                  </div>
                )}

                {tiers.length > 1 && (
                  <div className="tiers">
                    <div className="tier-head">
                      <div>{isEn ? "Quantity" : "От количества"}</div>
                      <div>{isEn ? "Price per pack" : "Цена за упак"}</div>
                      <div>{isEn ? "Savings" : "Экономия"}</div>
                    </div>
                    {tiers.map((t, i) => (
                      <div key={i} className={`tier-row${t.current ? " active" : ""}`}>
                        <div className="qty">
                          {t.current
                            ? isEn
                              ? `1–${(tiers[1]?.min ?? 4) - 1} pcs `
                              : `1–${(tiers[1]?.min ?? 4) - 1} шт `
                            : isEn
                              ? `from ${t.min} pcs`
                              : `от ${t.min} шт`}
                          {t.current && <span className="badge">{isEn ? "Current" : "Сейчас"}</span>}
                        </div>
                        <div>{t.price.toLocaleString(isEn ? "en-US" : "ru-RU")} ₸</div>
                        <div className={t.saving ? "save" : ""}>{t.saving ? `−${t.saving}%` : "—"}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="price-cta">
                  <AddToCartButton
                    product={{
                      productId: product.id,
                      slug: product.slug,
                      name: product.name,
                      image: product.imageUrl,
                      price: Number(basePrice.basePrice),
                      minOrderQty: product.minOrderQty,
                      packLabel: product.packLabel,
                      unitType: product.unitType,
                      stockStatus: stock?.stockStatus ?? null,
                    }}
                  />
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wa-cta"
                  >
                    <MessageCircle className="h-4 w-4" style={{ color: "#25D366" }} />
                    WhatsApp
                  </a>
                </div>

                {(product.isSubscriptionEligible || product.isGroupEligible) && (
                  <div className="pdp-mode-cta">
                    {product.isSubscriptionEligible && (
                      <Link
                        href={`/subscription?product=${encodeURIComponent(product.sku)}`}
                        className="btn-card btn-card-outline"
                      >
                        {isEn ? "+ to subscription" : "+ в подписку"}
                      </Link>
                    )}
                    {product.isGroupEligible && (
                      <Link
                        href={`/group-buying?product=${encodeURIComponent(product.sku)}`}
                        className="btn-card btn-card-outline"
                      >
                        {isEn ? "+ to group buy" : "+ в групповой заказ"}
                      </Link>
                    )}
                  </div>
                )}

                <div className="moq-note">
                  <b>{isEn ? "Minimum order:" : "Минимальный заказ:"}</b> {product.minOrderQty} {unitWord} ·{" "}
                  {isEn ? "Free delivery from 20,000 ₸" : "Бесплатная доставка от 20 000 ₸"}
                </div>
              </div>
              );
            })()}

            <div className="ops">
              <div>
                <div className="k">{isEn ? "In stock" : "В наличии"}</div>
                <div className={`v ${stockKey === "IN_STOCK" ? "green" : stockKey === "LOW_STOCK" ? "amber" : "red"} live`}>
                  {stock?.availableQty ?? 0} {unitWord}
                </div>
                <div className="sub">
                  {isEn ? "updated " : "обновлено "}
                  {stock?.updatedAt
                    ? new Date(stock.updatedAt).toLocaleString(isEn ? "en-US" : "ru-RU")
                    : "—"}
                </div>
              </div>
              <div>
                <div className="k">{isEn ? "Delivery" : "Доставка"}</div>
                <div className="v">{isEn ? "tomorrow by 12:00" : "завтра до 12:00"}</div>
                <div className="sub">
                  {isEn ? "pickup today after 14:00" : "самовывоз сегодня после 14:00"}
                </div>
              </div>
            </div>

            <div className="trust-line">
              <div className="trust-row">
                <div className="ic">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  {isEn ? (
                    <>
                      <b>No silent substitution.</b> If we run out — we propose an alternative on WhatsApp with the price delta and wait for your "ok".
                    </>
                  ) : (
                    <>
                      <b>Без молчаливой замены.</b> Если на складе закончится — предложим аналог в WhatsApp с разницей в цене и подождём «ок».
                    </>
                  )}
                </div>
              </div>
              <div className="trust-row">
                <div className="ic">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  {isEn ? (
                    <>
                      <b>Documents for accounting</b> arrive by email right after payment: invoice, waybill, contract.
                    </>
                  ) : (
                    <>
                      <b>Документы для бухгалтерии</b> приходят на email сразу после оплаты: счёт-фактура, накладная, договор.
                    </>
                  )}
                </div>
              </div>
              <div className="trust-row">
                <div className="ic">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  {isEn ? (
                    <>
                      <b>Dispatch every 3 hours.</b> Orders before 14:00 — same day. After 14:00 — next morning.
                    </>
                  ) : (
                    <>
                      <b>Отгрузки каждые 3 часа.</b> Заказы до 14:00 — сегодня. После 14:00 — завтра утром.
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-x pdp-below">
        {(product.description ||
          product.descriptionExtended ||
          product.useCases ||
          product.composition) && (
          <section className="pdp-sec">
            <div className="show-md-grid">
              <div>
                <h2>{isEn ? "Description" : "Описание"}</h2>
                <div className="pdp-desc">
                  {product.descriptionExtended ? (
                    <p>{product.descriptionExtended}</p>
                  ) : product.description ? (
                    <p>{product.description}</p>
                  ) : null}
                  {product.useCases && (
                    <div className="pdp-use" style={{ marginTop: 16 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--c-fg-2)", marginBottom: 6 }}>
                        {isEn ? "When to use" : "Когда использовать"}
                      </h3>
                      <p style={{ color: "var(--c-fg-2)" }}>{product.useCases}</p>
                    </div>
                  )}
                  {product.composition && (
                    <div className="pdp-comp" style={{ marginTop: 16 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--c-fg-2)", marginBottom: 6 }}>
                        {isEn ? "Composition" : "Состав"}
                      </h3>
                      <p style={{ color: "var(--c-fg-2)" }}>{product.composition}</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h2>{isEn ? "Specifications" : "Характеристики"}</h2>
                <div className="specs">
                  {(product.brandResolved ?? product.brand) && (
                    <div className="spec">
                      <span className="k">{isEn ? "Brand" : "Бренд"}</span>
                      <span className="v">{product.brandResolved ?? product.brand}</span>
                    </div>
                  )}
                  <div className="spec">
                    <span className="k">{isEn ? "Category" : "Категория"}</span>
                    <span className="v">{product.category.name}</span>
                  </div>
                  <div className="spec">
                    <span className="k">{isEn ? "Pack" : "Фасовка"}</span>
                    <span className="v">{localizePackLabel(product.packLabel, locale)}</span>
                  </div>
                  <div className="spec">
                    <span className="k">{isEn ? "Storage" : "Хранение"}</span>
                    <span className="v">{product.storageInfo ?? storageLabel(product.storageType, isEn)}</span>
                  </div>
                  <div className="spec">
                    <span className="k">{isEn ? "Min. order" : "Мин. заказ"}</span>
                    <span className="v">
                      {product.minOrderQty} {unitWord}
                    </span>
                  </div>
                  <div className="spec">
                    <span className="k">SKU</span>
                    <span className="v">{product.sku}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="pdp-sec">
          <h2>{isEn ? "If something goes wrong" : "Если что-то пойдёт не так"}</h2>
          <div className="policy">
            <div className="pol-item">
              <div className="ic">
                <RefreshCcw className="h-4 w-4" />
              </div>
              <div>
                <div className="ttl">
                  {isEn ? "Substitutions only with your approval" : "Замена — только с вашего «ок»"}
                </div>
                <div className="txt">
                  {isEn
                    ? "If a product is out of stock — we propose an alternative on WhatsApp with the price delta. We don't ship without your approval."
                    : "Если на складе не оказалось — предложим аналог в WhatsApp с разницей в цене. Без согласия не отправляем."}
                </div>
              </div>
            </div>
            <div className="pol-item">
              <div className="ic">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="ttl">{isEn ? "Defective or wrong item" : "Брак / пересорт"}</div>
                <div className="txt">
                  {isEn
                    ? "Message us on WhatsApp within 24 hours with a photo — we'll replace it or refund within 3 business days."
                    : "Сообщите в WhatsApp в течение 24 часов с фото — заменим или вернём деньги в течение 3 рабочих дней."}
                </div>
              </div>
            </div>
            <div className="pol-item">
              <div className="ic">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <div className="ttl">{isEn ? "Partial shipment" : "Частичная отгрузка"}</div>
                <div className="txt">
                  {isEn
                    ? "If something is missing from the order — we ship what we have and bring the rest separately, with no extra delivery charge."
                    : "Если в заказе чего-то не хватает — отправим что есть и допоставим остаток без дополнительной оплаты доставки."}
                </div>
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="pdp-sec">
            <h2>{isEn ? "Frequently bought together" : "Часто покупают вместе"}</h2>
            <div className="rel-grid">
              {related.map((r) => {
                const rp = r.prices[0];
                return (
                  <Link key={r.id} href={`/product/${r.slug}`} className="rel">
                    <div className="img">
                      {r.imageUrl && <Image src={r.imageUrl} alt={r.name} fill sizes="160px" />}
                    </div>
                    <div className="rel-info">
                      <div className="m">
                        {r.brand && <>{r.brand} · </>}
                        {localizePackLabel(r.packLabel, locale)}
                      </div>
                      <div className="n">{r.name}</div>
                      <div className="p">
                        {rp ? Number(rp.basePrice).toLocaleString(isEn ? "en-US" : "ru-RU") : "—"} ₸
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
