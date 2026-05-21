import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatPrice, stockStatusInfo } from "@/lib/utils";
import { QuickAddButton } from "@/components/cart/quick-add-button";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Каталог · опт ингредиентов для кондитерских и HoReCa",
  description:
    "Полный каталог Horecom: шоколад, бакалея, начинки, молочная продукция, упаковка. Оптовые цены, доставка по Астане.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const categorySlug = params.category;

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { brand: { contains: query, mode: "insensitive" } },
              { sku: { contains: query, mode: "insensitive" } },
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
  });

  return (
    <div className="container-tight py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Каталог</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? "товар" : "товаров"}
          {categorySlug ? ` в категории «${categories.find((c) => c.slug === categorySlug)?.name}»` : ""}
          {query ? ` по запросу «${query}»` : ""}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        {/* Sidebar: categories */}
        <aside className="space-y-1">
          <Link
            href="/catalog"
            className={`block rounded-md px-3 py-2 text-sm transition-colors ${
              !categorySlug ? "bg-primary/10 font-medium text-primary" : "hover:bg-accent"
            }`}
          >
            Все категории
            <span className="ml-2 text-xs text-muted-foreground">
              ({categories.reduce((sum, c) => sum + c._count.products, 0)})
            </span>
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog?category=${cat.slug}`}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                categorySlug === cat.slug ? "bg-primary/10 font-medium text-primary" : "hover:bg-accent"
              }`}
            >
              {cat.name}
              <span className="ml-2 text-xs text-muted-foreground">({cat._count.products})</span>
            </Link>
          ))}
        </aside>

        {/* Products grid */}
        <div>
          {products.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
      <div className="mb-3 text-4xl">🔍</div>
      <h3 className="text-lg font-semibold">Ничего не нашлось</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Попробуйте другой запрос или напишите в WhatsApp — поможем найти нужный товар или подобрать аналог.
      </p>
      <a
        href="https://api.whatsapp.com/send/?phone=77078607779"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 text-sm font-medium text-primary hover:underline"
      >
        Написать в WhatsApp →
      </a>
    </div>
  );
}

type ProductWithRelations = Awaited<ReturnType<typeof prisma.product.findMany>>[number] & {
  prices: { basePrice: { toString: () => string }; unitLabel: string }[];
  inventorySnapshot: { stockStatus: string } | null;
  category: { name: string };
};

function ProductCard({ product }: { product: ProductWithRelations }) {
  const price = product.prices[0];
  const stock = product.inventorySnapshot;
  const stockInfo = stock ? stockStatusInfo(stock.stockStatus) : null;

  return (
    <div className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md">
      <Link href={`/product/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl opacity-60">📦</div>
          )}
        </div>
        <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
          {product.brand && (
            <>
              <span>{product.brand}</span>
              <span>·</span>
            </>
          )}
          <span>{product.packLabel}</span>
        </div>
        <h3 className="mb-2 line-clamp-2 text-sm font-medium group-hover:text-primary">
          {product.name}
        </h3>
        <div className="mt-auto space-y-2">
          <div className="flex items-end justify-between">
            {price && (
              <div>
                <div className="tabular text-lg font-semibold">{formatPrice(price.basePrice.toString())}</div>
                <div className="text-xs text-muted-foreground">{price.unitLabel}</div>
              </div>
            )}
            {stockInfo && <Badge variant={stockInfo.tone}>{stockInfo.label}</Badge>}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Мин. заказ: {product.minOrderQty}</span>
            {product.isSubscriptionEligible && <Badge variant="info" className="text-[10px]">Подписка</Badge>}
          </div>
        </div>
      </Link>
      {price && (
        <div className="mt-3 pt-3 border-t border-border">
          <QuickAddButton
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              image: product.imageUrl ?? null,
              price: Number(price.basePrice.toString()),
              minOrderQty: product.minOrderQty,
              packLabel: product.packLabel,
              unitType: product.unitType,
              stockStatus: stock?.stockStatus ?? null,
            }}
          />
        </div>
      )}
    </div>
  );
}
