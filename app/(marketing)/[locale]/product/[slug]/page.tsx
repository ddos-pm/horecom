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
import { Gallery } from "./gallery";
import "./product.css";

// ISR — top-30 bulk-pack products (by minOrderQty desc) are pre-rendered at
// build time so popular PDPs are instant; everything else is rendered on
// first hit and cached for 5 min. Keeps build wall-time + DB-connection
// pressure manageable on the Tokyo pooler.
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { minOrderQty: "desc" },
    take: 30,
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, prices: { take: 1 } },
  });
  if (!product) return { title: "Товар не найден" };

  return {
    title: product.name,
    description:
      `${product.brand ?? ""} ${product.packLabel}. ${product.description ?? ""}. Оптовая цена в Horecom.`.trim(),
    openGraph: {
      title: product.name,
      description: product.description ?? "",
      type: "website",
      url: `https://horecom.kz/ru/product/${product.slug}`,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
    alternates: { canonical: `https://horecom.kz/ru/product/${product.slug}` },
  };
}

function stockStatusToSchema(s?: string | null) {
  if (s === "IN_STOCK") return "https://schema.org/InStock";
  if (s === "LOW_STOCK") return "https://schema.org/LimitedAvailability";
  return "https://schema.org/OutOfStock";
}

function storageLabel(s: string) {
  return (
    { AMBIENT: "Обычная температура", REFRIGERATED: "Холодильник", FROZEN: "Заморозка" } as Record<
      string,
      string
    >
  )[s] ?? s;
}

const STOCK_PILL: Record<string, { cls: string; label: (qty: number, unit: string) => string }> = {
  IN_STOCK: { cls: "pill pill-green", label: (q, u) => `В наличии · ${q} ${u}` },
  LOW_STOCK: { cls: "pill pill-amber", label: (q, u) => `Заканчивается · ${q} ${u}` },
  OUT_OF_STOCK: { cls: "pill pill-red", label: () => "Под заказ" },
};

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Stage 1: load the product (we need its categoryId before we can fetch
  // related). Each Tokyo round-trip is ~250ms from Frankfurt, so we keep
  // this one hop minimal.
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      prices: { orderBy: { createdAt: "desc" } },
      inventorySnapshot: true,
    },
  });

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
  const stockMeta = STOCK_PILL[stockKey] ?? STOCK_PILL.OUT_OF_STOCK;
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
    "@id": `${SITE_URL}/ru/product/${product.slug}#product`,
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
        url: `${SITE_URL}/ru/product/${product.slug}`,
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
        areaServed: { "@type": "City", name: "Астана" },
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
      { "@type": "ListItem", position: 1, name: "Главная", item: `${SITE_URL}/ru` },
      { "@type": "ListItem", position: 2, name: "Каталог", item: `${SITE_URL}/ru/catalog` },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category.name,
        item: `${SITE_URL}/ru/catalog?category=${product.category.slug}`,
      },
      { "@type": "ListItem", position: 4, name: product.name },
    ],
  };

  const waText = `Здравствуйте, интересует ${product.name} (${product.sku})`;
  const waLink = `${COMPANY.whatsappLink}&text=${encodeURIComponent(waText)}`;

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="container-x pdp-wrap">
        <nav className="breadcrumb" aria-label="Хлебные крошки">
          <Link href="/">Главная</Link>
          <span className="sep">/</span>
          <Link href="/catalog">Каталог</Link>
          <span className="sep">/</span>
          <Link href={{ pathname: "/catalog", query: { category: product.category.slug } }}>
            {product.category.name}
          </Link>
          <span className="sep">/</span>
          <span className="curr">{product.name}</span>
        </nav>

        <div className="pdp">
          <Gallery
            images={galleryImages}
            alt={product.name}
            badges={
              <>
                {product.isSubscriptionEligible && <span className="pill pill-orange">Подписка</span>}
                {product.isGroupEligible && <span className="pill pill-blue">Группа</span>}
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
              <span>{product.category.name}</span>
              <span className="sku">{product.sku}</span>
            </div>

            <h1 className="pdp-name">{product.name}</h1>

            <div className="pdp-badges">
              <span className={stockMeta.cls}>{stockMeta.label(stock?.availableQty ?? 0, unitWord)}</span>
              {product.isSubscriptionEligible && <span className="pill pill-orange">Доступна подписка</span>}
              {product.isGroupEligible && <span className="pill pill-blue">Доступна группа</span>}
              {product.storageType !== "AMBIENT" && (
                <span className="pill pill-outline">{storageLabel(product.storageType)}</span>
              )}
            </div>

            {basePrice && (
              <div className="price-block">
                <div className="price-head">
                  <div className="main">
                    <span className="amount tabular">
                      {Number(basePrice.basePrice).toLocaleString("ru-RU")} ₸
                    </span>
                    <span className="per">/ {product.packLabel}</span>
                  </div>
                </div>

                {tiers.length > 1 && (
                  <div className="tiers">
                    <div className="tier-head">
                      <div>От количества</div>
                      <div>Цена за упак</div>
                      <div>Экономия</div>
                    </div>
                    {tiers.map((t, i) => (
                      <div key={i} className={`tier-row${t.current ? " active" : ""}`}>
                        <div className="qty">
                          {t.current
                            ? `1–${(tiers[1]?.min ?? 4) - 1} шт `
                            : `от ${t.min} шт`}
                          {t.current && <span className="badge">Сейчас</span>}
                        </div>
                        <div>{t.price.toLocaleString("ru-RU")} ₸</div>
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

                <div className="moq-note">
                  <b>Минимальный заказ:</b> {product.minOrderQty} {unitWord} · Общий минимум по сайту — 5 000 ₸ ·
                  Бесплатная доставка от 30 000 ₸
                </div>
              </div>
            )}

            <div className="ops">
              <div>
                <div className="k">В наличии</div>
                <div className={`v ${stockKey === "IN_STOCK" ? "green" : stockKey === "LOW_STOCK" ? "amber" : "red"} live`}>
                  {stock?.availableQty ?? 0} {unitWord}
                </div>
                <div className="sub">обновлено {stock?.updatedAt ? new Date(stock.updatedAt).toLocaleString("ru-RU") : "—"}</div>
              </div>
              <div>
                <div className="k">Доставка</div>
                <div className="v">завтра до 12:00</div>
                <div className="sub">самовывоз сегодня после 14:00</div>
              </div>
            </div>

            <div className="trust-line">
              <div className="trust-row">
                <div className="ic">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <b>Без молчаливой замены.</b> Если на складе закончится — предложим аналог в WhatsApp с
                  разницей в цене и подождём «ок».
                </div>
              </div>
              <div className="trust-row">
                <div className="ic">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <b>Документы для бухгалтерии</b> приходят на email сразу после оплаты: счёт-фактура,
                  накладная, договор.
                </div>
              </div>
              <div className="trust-row">
                <div className="ic">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <b>Отгрузки каждые 3 часа.</b> Заказы до 14:00 — сегодня. После 14:00 — завтра утром.
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
                <h2>Описание</h2>
                <div className="pdp-desc">
                  {product.descriptionExtended ? (
                    <p>{product.descriptionExtended}</p>
                  ) : product.description ? (
                    <p>{product.description}</p>
                  ) : null}
                  {product.useCases && (
                    <div className="pdp-use" style={{ marginTop: 16 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--c-fg-2)", marginBottom: 6 }}>
                        Когда использовать
                      </h3>
                      <p style={{ color: "var(--c-fg-2)" }}>{product.useCases}</p>
                    </div>
                  )}
                  {product.composition && (
                    <div className="pdp-comp" style={{ marginTop: 16 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--c-fg-2)", marginBottom: 6 }}>
                        Состав
                      </h3>
                      <p style={{ color: "var(--c-fg-2)" }}>{product.composition}</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h2>Характеристики</h2>
                <div className="specs">
                  {(product.brandResolved ?? product.brand) && (
                    <div className="spec">
                      <span className="k">Бренд</span>
                      <span className="v">{product.brandResolved ?? product.brand}</span>
                    </div>
                  )}
                  <div className="spec">
                    <span className="k">Категория</span>
                    <span className="v">{product.category.name}</span>
                  </div>
                  <div className="spec">
                    <span className="k">Фасовка</span>
                    <span className="v">{product.packLabel}</span>
                  </div>
                  <div className="spec">
                    <span className="k">Хранение</span>
                    <span className="v">{product.storageInfo ?? storageLabel(product.storageType)}</span>
                  </div>
                  <div className="spec">
                    <span className="k">Мин. заказ</span>
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
          <h2>Если что-то пойдёт не так</h2>
          <div className="policy">
            <div className="pol-item">
              <div className="ic">
                <RefreshCcw className="h-4 w-4" />
              </div>
              <div>
                <div className="ttl">Замена — только с вашего «ок»</div>
                <div className="txt">
                  Если на складе не оказалось — предложим аналог в WhatsApp с разницей в цене. Без согласия не
                  отправляем.
                </div>
              </div>
            </div>
            <div className="pol-item">
              <div className="ic">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="ttl">Брак / пересорт</div>
                <div className="txt">
                  Сообщите в WhatsApp в течение 24 часов с фото — заменим или вернём деньги в течение 3 рабочих
                  дней.
                </div>
              </div>
            </div>
            <div className="pol-item">
              <div className="ic">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <div className="ttl">Частичная отгрузка</div>
                <div className="txt">
                  Если в заказе чего-то не хватает — отправим что есть и допоставим остаток без дополнительной
                  оплаты доставки.
                </div>
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="pdp-sec">
            <h2>Часто покупают вместе</h2>
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
                        {r.packLabel}
                      </div>
                      <div className="n">{r.name}</div>
                      <div className="p">
                        {rp ? Number(rp.basePrice).toLocaleString("ru-RU") : "—"} ₸
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
