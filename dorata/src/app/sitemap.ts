import type { MetadataRoute } from "next";
import { getCategories, getLegalPages, listProducts } from "@/server/catalog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dorata18k.com";
  const base: MetadataRoute.Sitemap = [
    { url: site, changeFrequency: "daily", priority: 1 },
    { url: `${site}/tienda`, changeFrequency: "daily", priority: 0.9 },
  ];
  try {
    const [cats, products, legal] = await Promise.all([getCategories(), listProducts(), getLegalPages()]);
    return [
      ...base,
      ...cats.map((c) => ({ url: `${site}/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
      ...products.map((p) => ({ url: `${site}/${p.categorySlug}/${p.slug}`, lastModified: p.publishedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
      ...legal.map((l) => ({ url: `${site}/${l.slug}`, changeFrequency: "monthly" as const, priority: 0.3 })),
    ];
  } catch (e) {
    console.error("sitemap_degraded", e instanceof Error ? e.message : "unknown");
    return base; // si la base no responde, un mapa mínimo antes que romper el despliegue
  }
}
