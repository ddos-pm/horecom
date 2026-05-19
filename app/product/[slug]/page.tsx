import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MessageCircle, RefreshCcw, Users, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/json-ld";
import { formatPrice, stockStatusInfo } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 300;

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
    description: `${product.brand ?? ""} ${product.packLabel}. ${product.description ?? ""}. Оптовая цена в Horecom.`.trim(),
    openGraph: {
      title: product.name,
      description: product.description ?? "",
      type: "website",
      url: `https://horecom.kz/product/${product.slug}`,
    },
    alternates: { canonical: `https://horecom.kz/product/${product.slug}` },
  };
}

function stockStatusToSchema(s?: string) {
  if (s === "IN_STOCK") return "https://schema.org/InStock";
  if (s === "LOW_STOCK") return "https://schema.org/LimitedAvailability";
  return "https://schema.org/OutOfStock";
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      prices: { take: 1, orderBy: { createdAt: "desc" } },
      inventorySnapshot: true,
    },
  });

  if (!product || !product.isActive) notFound();

  const price = product.prices[0];
  const stock = product.inventorySnapshot;
  const stockInfo = stock ? stockStatusInfo(stock.stockStatus) : null;

  // JSON-LD Product schema for AI/SEO
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `https://horecom.kz/product/${product.slug}#product`,
    name: product.name,
    description: product.description,
    sku: product.sku,
    ...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
    category: product.category.name,
    ...(price && {
      offers: {
        "@type": "Offer",
        url: `https://horecom.kz/product/${product.slug}`,
        priceCurrency: price.currency,
        price: price.basePrice.toString(),
        availability: stockStatusToSchema(stock?.stockStatus),
        seller: { "@id": "https://horecom.kz/#organization" },
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          minValue: product.minOrderQty,
          unitText: product.unitType,
        },
      },
    }),
  };

  // Breadcrumb
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: "https://horecom.kz" },
      { "@type": "ListItem", position: 2, name: "Каталог", item: "https://horecom.kz/catalog" },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category.name,
        item: `https://horecom.kz/catalog?category=${product.category.id}`,
      },
      { "@type": "ListItem", position: 4, name: product.name },
    ],
  };

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="container-tight py-6">
        {/* Breadcrumb nav */}
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href="/catalog" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3 w-3" />
            Назад к каталогу
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div>
            <div className="flex aspect-square items-center justify-center rounded-lg border border-border bg-muted">
              <span className="text-8xl opacity-50">📦</span>
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              {product.brand && <span>{product.brand}</span>}
              {product.brand && <span>·</span>}
              <span>SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{product.name}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {stockInfo && <Badge variant={stockInfo.tone}>{stockInfo.label}</Badge>}
              {product.isSubscriptionEligible && <Badge variant="info">Доступна подписка</Badge>}
              {product.isGroupEligible && <Badge variant="secondary">Доступна группа</Badge>}
            </div>

            {price && (
              <div className="mt-6 rounded-lg border border-border bg-card p-5">
                <div className="flex items-baseline gap-3">
                  <span className="tabular text-3xl font-bold">{formatPrice(price.basePrice.toString())}</span>
                  <span className="text-sm text-muted-foreground">{price.unitLabel}</span>
                </div>

                {/* Volume tiers (Pack 1 idea) */}
                {price.wholesaleThreshold && price.wholesalePrice && (
                  <div className="mt-4 rounded-md bg-success/5 p-3 text-sm ring-1 ring-success/20">
                    <div className="font-medium text-success">
                      От {price.wholesaleThreshold} {product.unitType === "piece" ? "шт" : product.unitType}:{" "}
                      <span className="tabular">{formatPrice(price.wholesalePrice.toString())}</span>{" "}
                      {price.unitLabel}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Сэкономьте{" "}
                      {formatPrice(
                        (Number(price.basePrice) - Number(price.wholesalePrice)).toString()
                      )}{" "}
                      на каждой единице
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="flex-1">
                    Добавить в корзину
                  </Button>
                  <a
                    href={`https://api.whatsapp.com/send/?phone=77078607779&text=${encodeURIComponent(
                      `Здравствуйте! Интересует ${product.name} (${product.sku})`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" variant="outline">
                      <MessageCircle className="h-4 w-4" />
                      Спросить
                    </Button>
                  </a>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  Минимальный заказ: {product.minOrderQty} {product.unitType === "piece" ? "шт" : product.unitType}.
                  Общий минимум заказа в Horecom — 5 000 ₸.
                </div>
              </div>
            )}

            {/* Quick facts */}
            <div className="mt-6 space-y-3 text-sm">
              <Fact label="Категория" value={product.category.name} />
              <Fact label="Бренд" value={product.brand ?? "—"} />
              <Fact label="Фасовка" value={product.packLabel} />
              <Fact label="Тип хранения" value={storageTypeLabel(product.storageType)} />
              {stock && <Fact label="Доступно" value={`${stock.availableQty} ${product.unitType === "piece" ? "шт" : product.unitType}`} />}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold">Описание</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Value props */}
        <section className="mt-12 grid gap-4 rounded-lg border border-border bg-muted/30 p-6 md:grid-cols-3">
          <ValueProp
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Без молчаливой замены"
            text="Если товара нет, мы предложим замену в WhatsApp и подождём вашего ответа."
          />
          {product.isSubscriptionEligible && (
            <ValueProp
              icon={<RefreshCcw className="h-5 w-5" />}
              title="Регулярная подписка"
              text="Настройте график доставки, мы напомним за день до отгрузки."
            />
          )}
          {product.isGroupEligible && (
            <ValueProp
              icon={<Users className="h-5 w-5" />}
              title="Групповая закупка"
              text="Объединитесь с другими кондитерами для оптовой цены без больших объёмов."
            />
          )}
        </section>
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ValueProp({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}

function storageTypeLabel(s: string) {
  return { AMBIENT: "Обычная температура", REFRIGERATED: "Холодильник", FROZEN: "Заморозка" }[s] ?? s;
}
