import "server-only";
import { cache } from "react";
import { announcementSchema, type Announcement } from "@/lib/announcement";
import { callPublicRpc, supabasePublicConfig } from "@/server/supabase/rpc";
import { DEMO_CATEGORIES, DEMO_LEGAL, DEMO_PRODUCTS, DEMO_SETTINGS, DEMO_WARRANTIES, demoAnnouncement } from "@/server/demo/catalog";
import type { Category, LegalPage, LegalPageSummary, ProductCard, ProductDetail, ProductQuery, StoreSettings, WarrantyPolicy } from "@/server/types";

/**
 * Repositorio de la tienda. FASE 1: catálogo, ajustes y políticas desde datos de demostración;
 * banner y modo de tienda ya leen Supabase cuando está configurado.
 * FASE 2 reemplaza el resto de funciones por consultas a Supabase sin cambiar estas firmas.
 */

export const getStoreSettings = cache(async (): Promise<StoreSettings> => DEMO_SETTINGS);

export const getCategories = cache(async (): Promise<Category[]> => DEMO_CATEGORIES);

export const getNavCategories = cache(async (): Promise<Category[]> =>
  (await getCategories()).filter((c) => c.showInNav));

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export const getWarrantyPolicies = cache(async (): Promise<WarrantyPolicy[]> => DEMO_WARRANTIES);

function toCard(p: ProductDetail): ProductCard {
  return {
    id: p.id, slug: p.slug, categorySlug: p.categorySlug, name: p.name, priceCents: p.priceCents, compareAtCents: p.compareAtCents,
    isNew: p.isNew, isOnSale: p.isOnSale, isFeatured: p.isFeatured, isSet: p.isSet, warrantyName: p.warrantyName, image: p.image,
    defaultVariantId: p.defaultVariantId, variantCount: p.variantCount, available: p.available, publishedAt: p.publishedAt,
  };
}

export async function listProducts(q: ProductQuery = {}): Promise<ProductCard[]> {
  let list = [...DEMO_PRODUCTS];
  if (q.categorySlug) {
    const category = await getCategoryBySlug(q.categorySlug);
    if (category?.autoRule === "new") list = list.filter((p) => p.isNew);
    else if (category?.autoRule === "sale") list = list.filter((p) => p.isOnSale);
    else list = list.filter((p) => p.categorySlug === q.categorySlug);
  }
  if (q.filter === "new") list = list.filter((p) => p.isNew);
  if (q.filter === "sale") list = list.filter((p) => p.isOnSale);
  const byNew = (a: ProductDetail, b: ProductDetail) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  switch (q.sort) {
    case "new": list.sort(byNew); break;
    case "price-asc": list.sort((a, b) => a.priceCents - b.priceCents); break;
    case "price-desc": list.sort((a, b) => b.priceCents - a.priceCents); break;
    default: list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured)); // estable: respeta el orden definido en el panel
  }
  return list.map(toCard);
}

export async function getHome() {
  const all = await listProducts();
  return {
    featured: all.filter((p) => p.isFeatured).slice(0, 4),
    newArrivals: (await listProducts({ filter: "new", sort: "new" })).slice(0, 8),
    setProduct: all.find((p) => p.isSet) ?? null,
  };
}

export async function getProduct(categorySlug: string, productSlug: string): Promise<ProductDetail | null> {
  const p = DEMO_PRODUCTS.find((x) => x.slug === productSlug);
  if (!p) return null;
  return p.categorySlug === categorySlug ? p : { ...p, categorySlug: p.categorySlug }; // la página redirige a la URL canónica
}

export async function getRelated(product: ProductDetail): Promise<ProductCard[]> {
  return DEMO_PRODUCTS.filter((p) => p.id !== product.id && (p.categorySlug === product.categorySlug || p.isFeatured)).slice(0, 4).map(toCard);
}

export const getLegalPages = cache(async (): Promise<LegalPageSummary[]> =>
  DEMO_LEGAL.map(({ kind, slug, title }) => ({ kind, slug, title })));

export async function getLegalPage(slug: string): Promise<LegalPage | null> {
  return DEMO_LEGAL.find((p) => p.slug === slug) ?? null;
}

export async function getLegalSlugs(): Promise<string[]> {
  return (await getLegalPages()).map((p) => p.slug);
}

/** Banner vigente. Supabase cuando está configurado (revalida cada 60 s); si no, demostración. */
export async function getAnnouncement(locale = "es"): Promise<Announcement | null> {
  if (!supabasePublicConfig()) return demoAnnouncement(Date.now());
  try {
    const raw = await callPublicRpc<unknown>("current_announcement", { p_locale: locale }, { revalidate: 60 });
    if (raw === null) return null;
    const parsed = announcementSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("announcement_invalid", parsed.error.issues.map((i) => i.path.join(".")).join(","));
      return null;
    }
    return parsed.data;
  } catch (e) {
    console.error("announcement_unavailable", e instanceof Error ? e.message : "unknown");
    return null; // sin banner antes que romper la página
  }
}

/** Modo de la tienda para páginas del servidor. */
export { fetchStoreMode as getStoreModeInfo } from "@/server/store-mode";

/** Versión vigente de la Política de Cookies ("0" mientras no haya una publicada → se vuelve a preguntar al publicar). */
export async function getCookiePolicyVersion(): Promise<string> {
  if (!supabasePublicConfig()) return "0";
  try {
    const v = await callPublicRpc<{ version_label: string | null } | null>("policy_version_at", { p_kind: "cookies" }, { revalidate: 300 });
    return v?.version_label ?? "0";
  } catch {
    return "0";
  }
}

export type PublicIntegration = { provider: "google_analytics" | "meta_pixel" | "tiktok_pixel" | "other"; public_id: string; category: "analytics" | "marketing" | "personalization" };

/** Integraciones encendidas en el panel (solo IDs públicos). Sin Supabase: ninguna. */
export async function getTrackingConfig(): Promise<PublicIntegration[]> {
  if (!supabasePublicConfig()) return [];
  try {
    return await callPublicRpc<PublicIntegration[]>("public_tracking_config", {}, { revalidate: 300 });
  } catch {
    return []; // ante la duda, no se rastrea
  }
}
