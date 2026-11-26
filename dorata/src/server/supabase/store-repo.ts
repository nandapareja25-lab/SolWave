import "server-only";
import { supabasePublicConfig } from "@/server/supabase/rpc";
import type {
  Category, ImageRef, JewelKind, LegalPage, LegalPageSummary, ProductDetail, StoreSettings, Variant, WarrantyComponent, WarrantyPolicy,
} from "@/server/types";

/**
 * Lectura de la tienda desde Supabase con la clave PUBLICABLE: todo pasa por RLS
 * (solo productos activos, categorías visibles, políticas publicadas). Caché ISR de 60 s
 * con la etiqueta "catalog" para invalidarla al guardar en el panel (fase 3).
 */
const REVALIDATE = 60;
const TAG = "catalog";

async function rest<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const cfg = supabasePublicConfig();
  if (!cfg) throw new Error("SUPABASE_NOT_CONFIGURED");
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    method: init?.method ?? "GET",
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json", "Accept-Profile": "public" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    next: { revalidate: REVALIDATE, tags: [TAG] },
  });
  if (!res.ok) throw new Error(`SUPABASE_${res.status}_${path.split("?")[0]}`);
  return (await res.json()) as T;
}

export function publicStorageUrl(bucket: string, path: string | null | undefined): string | null {
  const cfg = supabasePublicConfig();
  if (!cfg || !path) return null;
  return `${cfg.url}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** Ilustración de respaldo según la categoría mientras la pieza no tenga foto. */
const FALLBACK: Record<string, JewelKind> = {
  cadenas: "chain", dijes: "clover", aretes: "hoops", topitos: "studs", pulseras: "links", "pulseras-de-hilo": "thread",
  balineria: "beads", sets: "set", religiosos: "medal", treboles: "clover", nuevos: "studs", ofertas: "hoops",
};
const fallbackFor = (slug: string): JewelKind => FALLBACK[slug] ?? "chain";

// ---------- ajustes ----------
type SettingsRow = {
  store_name: string; descriptor: string; logo_path: string | null; whatsapp_e164: string | null; contact_email: string | null;
  social_links: Record<string, string>; newsletter_enabled: boolean; testimonials_enabled: boolean; packaging_note: Record<string, string>;
};

export async function sbSettings(): Promise<StoreSettings> {
  const [s] = await rest<SettingsRow[]>(
    "store_settings?select=store_name,descriptor,logo_path,whatsapp_e164,contact_email,social_links,newsletter_enabled,testimonials_enabled,packaging_note&id=eq.1");
  if (!s) throw new Error("SETTINGS_MISSING");
  const ig = s.social_links?.instagram ?? null;
  const handle = ig ? `@${ig.replace(/\/+$/, "").split("/").pop()}` : null;
  return {
    storeName: s.store_name, descriptor: s.descriptor, logoUrl: publicStorageUrl("brand", s.logo_path),
    whatsappE164: s.whatsapp_e164, contactEmail: s.contact_email,
    social: { instagram: s.social_links?.instagram, tiktok: s.social_links?.tiktok, facebook: s.social_links?.facebook },
    socialHandle: handle, testimonialsEnabled: s.testimonials_enabled, newsletterEnabled: s.newsletter_enabled,
    packagingNote: s.packaging_note?.es ?? null, isDemo: false,
  };
}

// ---------- garantías y categorías ----------
type PolicyRow = { id: string; code: string; duration_months: number | null; sort_order: number;
  warranty_policy_translations: { locale: string; name: string; summary: string; coverage_md: string; exclusions_md: string }[] };
type CategoryRow = { id: string; image_path: string | null; is_visible: boolean; show_in_nav: boolean; sort_order: number;
  auto_rule: "new" | "sale" | null; default_warranty_policy_id: string | null;
  category_translations: { locale: string; name: string; slug: string; description: string | null }[] };

async function policyRows() {
  return rest<PolicyRow[]>("warranty_policies?select=id,code,duration_months,sort_order,warranty_policy_translations(locale,name,summary,coverage_md,exclusions_md)&is_active=is.true&order=sort_order");
}
async function categoryRows() {
  return rest<CategoryRow[]>("categories?select=id,image_path,is_visible,show_in_nav,sort_order,auto_rule,default_warranty_policy_id,category_translations(locale,name,slug,description)&order=sort_order");
}

function toPolicy(p: PolicyRow, categoryNames: string[]): WarrantyPolicy | null {
  const t = p.warranty_policy_translations.find((x) => x.locale === "es");
  if (!t) return null;
  return { code: p.code, months: p.duration_months, name: t.name, summary: t.summary, coverageMd: t.coverage_md, exclusionsMd: t.exclusions_md, categoryNames };
}

export async function sbCategories(): Promise<Category[]> {
  const rows = await categoryRows();
  return rows.flatMap((c) => {
    const t = c.category_translations.find((x) => x.locale === "es");
    if (!t) return [];
    return [{
      id: c.id, slug: t.slug, name: t.name, description: t.description, autoRule: c.auto_rule, showInNav: c.show_in_nav,
      image: { url: publicStorageUrl("category-media", c.image_path), illustration: fallbackFor(t.slug), alt: t.name },
    }];
  });
}

type CollectionRow = { id: string; image_path: string | null; starts_at: string | null; ends_at: string | null;
  collection_translations: { locale: string; name: string; slug: string; description: string | null }[] };

/** Colecciones visibles y dentro de sus fechas (si las tienen). Se muestran como Category para reutilizar la vista. */
export async function sbCollections(): Promise<Category[]> {
  const rows = await rest<CollectionRow[]>("collections?select=id,image_path,starts_at,ends_at,collection_translations(locale,name,slug,description)&is_visible=is.true&order=sort_order");
  const now = Date.now();
  return rows.flatMap((c) => {
    const t = c.collection_translations.find((x) => x.locale === "es");
    if (!t || (c.starts_at && Date.parse(c.starts_at) > now) || (c.ends_at && Date.parse(c.ends_at) <= now)) return [];
    return [{ id: c.id, slug: t.slug, name: t.name, description: t.description, autoRule: null, showInNav: false,
      image: { url: publicStorageUrl("category-media", c.image_path), illustration: "set" as JewelKind, alt: t.name } }];
  });
}

export async function sbWarranties(): Promise<WarrantyPolicy[]> {
  const [policies, cats] = await Promise.all([policyRows(), categoryRows()]);
  return policies.flatMap((p) => {
    const names = cats.filter((c) => c.default_warranty_policy_id === p.id && !c.auto_rule)
      .map((c) => c.category_translations.find((x) => x.locale === "es")?.name).filter((n): n is string => !!n);
    const pol = toPolicy(p, names);
    return pol ? [pol] : [];
  });
}

// ---------- productos ----------
type ProductRow = {
  id: string; is_featured: boolean; is_new: boolean; is_on_sale: boolean; published_at: string | null; created_at: string;
  material: string | null; measurements: string | null; color: string | null; shipping_notes: string | null;
  warranty_policy_id: string | null;
  product_translations: { locale: string; name: string; slug: string; short_description: string | null; description_md: string | null }[];
  product_variants: { id: string; sku: string; title: string; price_cents: number; compare_at_cents: number | null; is_default: boolean;
    is_active: boolean; position: number; options: Record<string, string> }[];
  product_media: { storage_path: string; variants: Record<string, string>; alt: Record<string, string>; position: number; kind: string }[];
  product_warranty_components: { position: number; label: Record<string, string>; warranty_policy_id: string | null }[];
  category: { id: string; default_warranty_policy_id: string | null; category_translations: { locale: string; name: string; slug: string }[] } | null;
  product_collections: { collections: { is_set: boolean; is_visible: boolean; collection_translations: { locale: string; slug: string }[] } | null }[];
  product_categories: { categories: { is_visible: boolean; category_translations: { locale: string; slug: string }[] } | null }[];
};

const PRODUCT_SELECT = [
  "id,is_featured,is_new,is_on_sale,published_at,created_at,material,measurements,color,shipping_notes,warranty_policy_id",
  "product_translations(locale,name,slug,short_description,description_md)",
  "product_variants(id,sku,title,price_cents,compare_at_cents,is_default,is_active,position,options)",
  "product_media(storage_path,variants,alt,position,kind)",
  "product_warranty_components(position,label,warranty_policy_id)",
  "category:categories!products_primary_category_id_fkey(id,default_warranty_policy_id,category_translations(locale,name,slug))",
  "product_collections(collections(is_set,is_visible,collection_translations(locale,slug)))",
  "product_categories(categories(is_visible,category_translations(locale,slug)))",
].join(",");

/** Colores de hilo para la muestra de color de la variante (solo presentación; editable en el panel en fase 3). */
const SWATCH_HINTS: [RegExp, string][] = [
  [/negr/i, "#1C1915"], [/roj/i, "#7A1E22"], [/azul/i, "#22406E"], [/rosad|rosa/i, "#C2456E"], [/blanc/i, "#F5F1EA"], [/verde/i, "#2F5D46"],
];
const swatchFor = (title: string) => SWATCH_HINTS.find(([re]) => re.test(title))?.[1] ?? null;

function mediaUrl(m: ProductRow["product_media"][number], size: "800" | "1600"): string | null {
  return publicStorageUrl("product-media", m.variants?.[size] ?? m.variants?.["800"] ?? m.storage_path);
}

export async function sbProducts(): Promise<ProductDetail[]> {
  const [rows, policies] = await Promise.all([
    rest<ProductRow[]>(`products?select=${PRODUCT_SELECT}&status=eq.active&order=published_at.desc.nullslast`),
    policyRows(),
  ]);
  const policyById = new Map(policies.map((p) => [p.id, toPolicy(p, [])] as const));
  const variantIds = rows.flatMap((r) => r.product_variants.filter((v) => v.is_active).map((v) => v.id));
  const availability = variantIds.length
    ? await rest<{ variant_id: string; available: boolean; low_stock: boolean }[]>("rpc/variant_availability", { method: "POST", body: { p_variant_ids: variantIds } })
    : [];
  const stock = new Map(availability.map((a) => [a.variant_id, a]));

  return rows.flatMap((r): ProductDetail[] => {
    const t = r.product_translations.find((x) => x.locale === "es");
    const ct = r.category?.category_translations.find((x) => x.locale === "es");
    const variantsRaw = r.product_variants.filter((v) => v.is_active).sort((a, b) => a.position - b.position);
    if (!t || !ct || variantsRaw.length === 0) return [];
    const def = variantsRaw.find((v) => v.is_default) ?? variantsRaw[0]!;
    const variants: Variant[] = variantsRaw.map((v) => ({
      id: v.id, sku: v.sku, title: v.title, priceCents: v.price_cents, compareAtCents: v.compare_at_cents,
      available: stock.get(v.id)?.available ?? false, lowStock: stock.get(v.id)?.low_stock ?? false,
      swatch: variantsRaw.length > 1 ? swatchFor(v.title) : null,
    }));
    const media = [...r.product_media].filter((m) => m.kind === "image").sort((a, b) => a.position - b.position);
    const illustration = fallbackFor(ct.slug);
    const images: ImageRef[] = media.length
      ? media.map((m) => ({ url: mediaUrl(m, "1600"), illustration, alt: m.alt?.es || t.name }))
      : [{ url: null, illustration, alt: t.name }];
    const cardImage: ImageRef = media[0] ? { url: mediaUrl(media[0], "800"), illustration, alt: media[0].alt?.es || t.name } : images[0]!;

    const warranty = policyById.get(r.warranty_policy_id ?? r.category?.default_warranty_policy_id ?? "") ?? null;
    const components: WarrantyComponent[] = [...r.product_warranty_components].sort((a, b) => a.position - b.position)
      .map((c) => ({ label: c.label?.es ?? "", policy: c.warranty_policy_id ? policyById.get(c.warranty_policy_id) ?? null : null }));
    const firstDefined = components.find((c) => c.policy?.months);
    // Cobertura COMPLETA: si hay componentes, todos deben tener duración definida (regla de integridad del carrito).
    const hasWarranty = components.length ? components.every((c) => c.policy?.months != null) : warranty?.months != null;
    const warrantyName = components.length
      ? firstDefined ? `${firstDefined.label.split(" ")[0]}: ${firstDefined.policy!.name.replace("Garantía ", "garantía ")}` : null
      : warranty?.name ?? null;

    return [{
      id: r.id, slug: t.slug, categorySlug: ct.slug, categoryName: ct.name, name: t.name,
      priceCents: def.price_cents, compareAtCents: def.compare_at_cents,
      isNew: r.is_new, isOnSale: r.is_on_sale, isFeatured: r.is_featured,
      isSet: ct.slug === "sets" || r.product_collections.some((pc) => pc.collections?.is_set),
      extraCategorySlugs: r.product_categories.flatMap((pc) => (pc.categories?.is_visible ? pc.categories.category_translations.filter((x) => x.locale === "es").map((x) => x.slug) : [])),
      collectionSlugs: r.product_collections.flatMap((pc) => (pc.collections?.is_visible ? pc.collections.collection_translations.filter((x) => x.locale === "es").map((x) => x.slug) : [])),
      warrantyName, hasWarranty, image: cardImage, images,
      defaultVariantId: def.id, variantCount: variants.length, available: variants.some((v) => v.available),
      publishedAt: r.published_at ?? r.created_at,
      shortDescription: t.short_description, descriptionMd: t.description_md,
      material: r.material, measurements: r.measurements, color: r.color, shippingNotes: r.shipping_notes,
      variants, warranty, warrantyComponents: components,
    }];
  });
}

// ---------- políticas ----------
type LegalListRow = { kind: string; slug: string; title: string; show_in_footer: boolean; has_published_version: boolean };
type LegalRow = { kind: string; slug: string; title: string; body_md: string | null; version_label: string | null;
  effective_at: string | null; legal_review_status: string | null } | null;

export async function sbLegalPages(): Promise<LegalPageSummary[]> {
  const rows = await rest<LegalListRow[]>("rpc/public_legal_pages", { method: "POST", body: { p_locale: "es" } });
  return rows.map(({ kind, slug, title, show_in_footer }) => ({ kind, slug, title, inFooter: show_in_footer }));
}

export async function sbLegalPage(slug: string): Promise<LegalPage | null> {
  const r = await rest<LegalRow>("rpc/public_legal_page", { method: "POST", body: { p_slug: slug, p_locale: "es" } });
  if (!r) return null;
  return {
    kind: r.kind, slug: r.slug, title: r.title, bodyMd: r.body_md ?? "",
    versionLabel: r.version_label, effectiveAt: r.effective_at,
    // Sin versión publicada, o publicada pero sin aprobación legal → se muestra el aviso "en preparación".
    inReview: !r.body_md || r.legal_review_status !== "approved",
  };
}
