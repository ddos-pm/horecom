import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/base-url";

export const dynamic = "force-dynamic";

const BASE = SITE_URL;

function withAlternates(path: string, ru: Partial<MetadataRoute.Sitemap[number]> = {}): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE}/ru${path}`,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l === "kz" ? "kk" : l,
          `${BASE}/${l}${path}`,
        ]),
      ),
    },
    ...ru,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  const staticPages: MetadataRoute.Sitemap = [
    withAlternates("", { priority: 1.0, lastModified: new Date(), changeFrequency: "daily" }),
    withAlternates("/catalog", { priority: 0.9, changeFrequency: "daily" }),
    withAlternates("/about", { priority: 0.5, changeFrequency: "monthly" }),
    withAlternates("/how-ordering-works", { priority: 0.8, changeFrequency: "monthly" }),
    withAlternates("/subscription", { priority: 0.8, changeFrequency: "monthly" }),
    withAlternates("/group-buying", { priority: 0.8, changeFrequency: "monthly" }),
    withAlternates("/delivery-and-payment", { priority: 0.7, changeFrequency: "monthly" }),
    withAlternates("/faq", { priority: 0.7, changeFrequency: "monthly" }),
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) =>
    withAlternates(`/product/${p.slug}`, {
      lastModified: p.updatedAt,
      priority: 0.6,
      changeFrequency: "weekly",
    }),
  );

  return [...staticPages, ...productPages];
}
