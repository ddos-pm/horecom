/**
 * React-cached product loader.
 *
 * The PDP at app/(marketing)/[locale]/product/[slug]/page.tsx calls
 * `prisma.product.findUnique({where:{slug}, ...})` twice per request:
 *   1. In generateMetadata to build the page title + OG description.
 *   2. In the page body to render the product card itself.
 *
 * Both calls hit the Tokyo Supabase pooler (~250 ms each from Frankfurt
 * edge). React's request-scoped `cache()` dedupes by argument identity
 * inside the same render, so wrapping the loader in `cache()` collapses
 * the two trips to one without changing any call sites' contracts.
 *
 * The loader uses the SUPERSET include shape (category + prices + inventory
 * snapshot) so both callers can rely on the same return type. The
 * generateMetadata path only reads a handful of scalar fields, so the
 * extra columns cost almost nothing to fetch over Postgres' row format.
 */

import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getProductBySlug = cache(async (slug: string) => {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      prices: { orderBy: { createdAt: "desc" } },
      inventorySnapshot: true,
    },
  });
});

export type LoadedProduct = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;
