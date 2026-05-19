import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  const categories = await prisma.category.findMany({ select: { slug: true } });

  const staticPages: MetadataRoute.Sitemap = [
    { url: "https://horecom.kz", priority: 1.0, lastModified: new Date(), changeFrequency: "daily" },
    { url: "https://horecom.kz/catalog", priority: 0.9, changeFrequency: "daily" },
    { url: "https://horecom.kz/about", priority: 0.5, changeFrequency: "monthly" },
    { url: "https://horecom.kz/how-ordering-works", priority: 0.8, changeFrequency: "monthly" },
    { url: "https://horecom.kz/subscription", priority: 0.8, changeFrequency: "monthly" },
    { url: "https://horecom.kz/group-buying", priority: 0.8, changeFrequency: "monthly" },
    { url: "https://horecom.kz/delivery-and-payment", priority: 0.7, changeFrequency: "monthly" },
    { url: "https://horecom.kz/faq", priority: 0.7, changeFrequency: "monthly" },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `https://horecom.kz/catalog?category=${c.slug}`,
    priority: 0.7,
    changeFrequency: "weekly",
  }));

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `https://horecom.kz/product/${p.slug}`,
    lastModified: p.updatedAt,
    priority: 0.6,
    changeFrequency: "weekly",
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
