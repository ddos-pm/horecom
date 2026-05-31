/**
 * Product loader for the PDP — two-layer cache.
 *
 * Layer 1: unstable_cache (cross-request, 10 min revalidate, per-slug key)
 *   First visitor to a SKU pays for the Tokyo Supabase round-trip.
 *   Every subsequent visitor in the next 10 min gets the data from the
 *   Next data cache — no DB hit, no Tokyo network cost.
 *
 * Layer 2: React.cache (intra-request, dedup)
 *   generateMetadata and ProductPage both call getProductBySlug(slug)
 *   inside the same request. React.cache memoizes by argument identity
 *   so the second call resolves from the in-memory memo without going
 *   through unstable_cache again.
 *
 * Tag: `product:<slug>` lets a downstream admin mutation hit
 * revalidateTag(`product:${slug}`) and invalidate one PDP cache entry
 * without burning the whole catalog.
 */

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

function fetchProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      prices: { orderBy: { createdAt: "desc" } },
      inventorySnapshot: true,
    },
  });
}

// Layer 1: cross-request data cache, per-slug.
function buildCachedFetch(slug: string) {
  return unstable_cache(() => fetchProduct(slug), [`product:${slug}`], {
    revalidate: 600,
    tags: [`product:${slug}`],
  });
}

// Layer 2: intra-request React cache. The outer cache() wrapper dedupes
// the unstable_cache builder itself so both PDP call sites share the
// same memo for one render pass.
const getCachedFetcher = cache((slug: string) => buildCachedFetch(slug));

export async function getProductBySlug(slug: string) {
  const fetcher = getCachedFetcher(slug);
  return fetcher();
}

export type LoadedProduct = NonNullable<Awaited<ReturnType<typeof fetchProduct>>>;
