/**
 * Cached loader for the marketing home page's 4 Prisma queries.
 *
 * The marketing home renders a hero card + category grid + featured-products
 * list + SKU count badge. All four come from the same `Product`/`Category`
 * tables and don't change per visitor — caching the bundle for 10 min knocks
 * the Tokyo Supabase round-trip cost off every cold home-page render
 * (measured: 4 s TTFB without cache → ~250 ms with).
 *
 * The build output marks /[locale] as ● (SSG) but Next/next-intl's
 * static-rendering combo doesn't actually emit prerendered HTML in this
 * codebase — see docs/41-performance-audit.md for the diagnosis. Until
 * that gets resolved upstream, `unstable_cache` is the most reliable
 * way to keep home-page TTFB close to flat regardless of edge cache state.
 *
 * Cache invalidation: time-based (revalidate=600s). When admins update a
 * product/category, the change shows up in ≤10 min — acceptable because
 * the home grid only shows a curated subset and admin SLA is "next day".
 *
 * For more granular invalidation later, swap to revalidateTag() and tag
 * each row with the table name (`prisma:Product`, `prisma:Category`).
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const FEATURED_INCLUDE = {
  prices: { take: 1, orderBy: { createdAt: "desc" } as const },
  inventorySnapshot: true,
  category: true,
} as const;

export const getHomePageData = unstable_cache(
  async () => {
    const [categories, heroProduct, featured, skuCount] = await Promise.all([
      prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: { where: { isActive: true } } } } },
      }),
      prisma.product.findFirst({
        where: { slug: "maslo-rogachev-82-5-5kg", isActive: true },
        include: FEATURED_INCLUDE,
      }),
      prisma.product.findMany({
        where: { isActive: true },
        take: 18,
        orderBy: { createdAt: "asc" },
        include: FEATURED_INCLUDE,
      }),
      prisma.product.count({ where: { isActive: true } }),
    ]);
    return { categories, heroProduct, featured, skuCount };
  },
  ["home-page-data"],
  { revalidate: 600, tags: ["home"] },
);
