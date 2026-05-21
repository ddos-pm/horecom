import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductRow } from "./row";

export const metadata = { title: "Каталог · Admin" };

const PER_PAGE = 50;

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page ?? "1"));
  const category = sp.category ?? "";

  const where = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { brand: { contains: q, mode: "insensitive" as const } },
              { sku: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
      category ? { category: { slug: category } } : {},
    ],
  };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { inventorySnapshot: true, category: true },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="container-tight py-6 md:py-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold md:text-2xl">Каталог</h1>
        <p className="text-xs text-muted-foreground">
          {total} {plural(total, "товар", "товара", "товаров")}
        </p>
      </div>

      <form className="mb-4 flex flex-wrap gap-2" action="/admin/catalog">
        <input
          name="q"
          defaultValue={q}
          placeholder="Поиск (имя / бренд / SKU)"
          className="flex-1 min-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <select
          name="category"
          defaultValue={category}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Найти</button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Товар</th>
              <th className="px-3 py-2 text-left">Бренд</th>
              <th className="px-3 py-2 text-left">Категория</th>
              <th className="px-3 py-2 text-right">Сток</th>
              <th className="px-3 py-2 text-center">Активен</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <ProductRow
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  sku: p.sku,
                  brand: p.brand,
                  packLabel: p.packLabel,
                  unitType: p.unitType,
                  category: p.category.name,
                  isActive: p.isActive,
                  stock: p.inventorySnapshot?.availableQty ?? 0,
                  stockStatus: p.inventorySnapshot?.stockStatus ?? null,
                }}
              />
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Страница {page} из {totalPages}
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={{ pathname: "/admin/catalog", query: { q, category, page: page - 1 } }}
                className="rounded-md border border-input bg-background px-3 py-1.5 hover:bg-muted"
              >
                ← Назад
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={{ pathname: "/admin/catalog", query: { q, category, page: page + 1 } }}
                className="rounded-md border border-input bg-background px-3 py-1.5 hover:bg-muted"
              >
                Вперёд →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
