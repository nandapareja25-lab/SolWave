"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction } from "@/server/admin/auth";
import { refreshStore, toCents } from "@/server/admin/result";
import { isValidSlug } from "@/lib/slug";

export type ProductResult = { ok: boolean; message: string; id?: string } | null;
const fail = (message: string): ProductResult => ({ ok: false, message });
const uuid = z.string().uuid();

const variantSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  title: z.string().trim().min(1, "Cada variante necesita un nombre (ej: Única, Hilo negro).").max(60),
  sku: z.string().trim().toUpperCase().max(40),
  price: z.string().trim().max(12),
  compare_at: z.string().trim().max(12),
  low_stock_threshold: z.string().trim().max(5),
  is_active: z.boolean(),
  is_default: z.boolean(),
  initial_stock: z.string().trim().max(6),
});
const productSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  name: z.string().trim().min(1, "Escribe el nombre del producto.").max(120),
  slug: z.string().trim().max(100),
  status: z.enum(["draft", "active", "archived"]),
  category_slug: z.string().min(1, "Elige la categoría principal."),
  extra_category_slugs: z.array(z.string()).max(20),
  collection_slugs: z.array(z.string()).max(20),
  short_description: z.string().trim().max(200, "La descripción corta puede tener hasta 200 caracteres."),
  description_md: z.string().trim().max(8000),
  material: z.string().trim().max(80), measurements: z.string().trim().max(120), color: z.string().trim().max(60),
  tags: z.string().trim().max(300),
  is_featured: z.boolean(), is_new: z.boolean(), new_until: z.string().trim().max(10), is_on_sale: z.boolean(),
  weight_grams: z.string().trim().max(8), shipping_notes: z.string().trim().max(300),
  seo_title: z.string().trim().max(70), seo_description: z.string().trim().max(160),
  warranty_code: z.string().max(60),
  components: z.array(z.object({ label: z.string().trim().max(60), warranty_code: z.string().max(60) })).max(8),
  variants: z.array(variantSchema).min(1, "Agrega al menos una variante.").max(40),
});
export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;

const ERR: [string, string][] = [
  ["INVALID_SKU", "Un código (SKU) no es válido: usa MAYÚSCULAS, números y guiones (ej: DOR-CAD-45)."],
  ["UNKNOWN_CATEGORY", "La categoría elegida no existe o es automática."],
  ["UNKNOWN_WARRANTY", "La garantía elegida no existe."],
  ["product_variants_sku_key", "Ese código (SKU) ya lo usa otro producto. Cada variante necesita un código único."],
  ["product_translations_locale_slug_key", "Ya existe otro producto con esa dirección. Cambia la dirección."],
  ["compare_at", "El precio “antes” debe ser mayor que el precio actual."],
  ["SET_WITHOUT_PENDANT", "Este set todavía no tiene dije: asígnalo en “Dije del set” antes de publicarlo."],
  ["COMPONENT_NOT_SELLABLE", "Este dije está reservado para armar sets: no se publica solo."],
];

export async function saveProduct(input: ProductInput): Promise<ProductResult> {
  const auth = await adminAction("staff"); if (!auth.ok) return fail(auth.error);
  const parsed = productSchema.safeParse(input); if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisa los datos.");
  const d = parsed.data;
  if (!isValidSlug(d.slug)) return fail("La dirección solo puede tener minúsculas, números y guiones.");
  const skus = new Set<string>();
  const variants = [];
  for (const [i, v] of d.variants.entries()) {
    const n = `Variante ${i + 1}`;
    if (!/^[A-Z0-9][A-Z0-9-]{1,39}$/.test(v.sku)) return fail(`${n}: el código (SKU) debe tener MAYÚSCULAS, números y guiones (ej: DOR-CAD-45).`);
    if (skus.has(v.sku)) return fail(`${n}: el código ${v.sku} está repetido.`);
    skus.add(v.sku);
    const price = toCents(v.price), compare = toCents(v.compare_at);
    if (price === null || Number.isNaN(price)) return fail(`${n}: escribe el precio en dólares, por ejemplo 39.00`);
    if (d.status === "active" && v.is_active && price <= 0) return fail(`${n}: un producto activo no puede costar $0.`);
    if (Number.isNaN(compare)) return fail(`${n}: el precio “antes” no es válido.`);
    if (compare !== null && compare <= price) return fail(`${n}: el precio “antes” debe ser mayor que el precio actual (o déjalo vacío).`);
    const low = v.low_stock_threshold === "" ? null : Number(v.low_stock_threshold);
    if (low !== null && (!Number.isInteger(low) || low < 0)) return fail(`${n}: el aviso de pocas unidades debe ser un número entero.`);
    if (v.initial_stock !== "" && !/^\d+$/.test(v.initial_stock)) return fail(`${n}: las unidades iniciales deben ser un número entero.`);
    variants.push({ id: v.id || null, sku: v.sku, title: v.title, price_cents: price, compare_at_cents: compare,
      low_stock_threshold: low, is_active: v.is_active, is_default: v.is_default });
  }
  if (d.status === "active" && !variants.some((v) => v.is_active)) return fail("Un producto activo necesita al menos una variante activa.");
  const weight = d.weight_grams === "" ? null : Number(d.weight_grams.replace(",", "."));
  if (weight !== null && (Number.isNaN(weight) || weight < 0)) return fail("El peso debe ser un número (gramos).");
  if (d.new_until && !/^\d{4}-\d{2}-\d{2}$/.test(d.new_until)) return fail("La fecha de “nuevo hasta” no es válida.");
  const components = d.components.filter((c) => c.label);

  const { data: id, error } = await auth.sb.rpc("admin_upsert_product", { p: {
    id: d.id || null, status: d.status, category_slug: d.category_slug,
    warranty_code: d.warranty_code || null, material: d.material || null, measurements: d.measurements || null, color: d.color || null,
    tags: d.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 20),
    is_featured: d.is_featured, is_new: d.is_new, new_until: d.is_new ? d.new_until : "", is_on_sale: d.is_on_sale,
    weight_grams: weight === null ? "" : String(weight), shipping_notes: d.shipping_notes || null,
    translation: { name: d.name, slug: d.slug, short_description: d.short_description || null, description_md: d.description_md || null,
      seo_title: d.seo_title || null, seo_description: d.seo_description || null },
    variants, components: components.map((c) => ({ label: c.label, warranty_code: c.warranty_code || null })),
    extra_category_slugs: d.extra_category_slugs, collection_slugs: d.collection_slugs,
  } });
  if (error) {
    const hit = ERR.find(([k]) => error.message.includes(k) || (error.details ?? "").includes(k));
    return fail(hit?.[1] ?? "No se pudo guardar. Inténtalo de nuevo.");
  }
  // Unidades iniciales de variantes nuevas
  const toCount = d.variants.filter((v) => !v.id && Number(v.initial_stock) > 0);
  if (toCount.length) {
    const { data: created } = await auth.sb.from("product_variants").select("id,sku").eq("product_id", id as string).in("sku", toCount.map((v) => v.sku));
    for (const v of toCount) {
      const vid = created?.find((c) => c.sku === v.sku)?.id;
      if (vid) await auth.sb.rpc("adjust_inventory", { p_variant_id: vid, p_type: "initial_count", p_delta: Number(v.initial_stock), p_reason: "Unidades iniciales al crear la variante" });
    }
  }
  refreshStore(); revalidatePath("/admin/productos");
  const msg = d.status === "active" ? "Guardado y publicado. Se ve en la tienda en menos de un minuto." : d.status === "draft" ? "Guardado como borrador (no se ve en la tienda)." : "Guardado como archivado (no se ve en la tienda).";
  return { ok: true, message: msg, id: id as string };
}

// ---------- Sets cadena + dije (la dueña decide qué dije va con cada cadena) ----------
export async function assignPendant(setId: string, pendantId: string): Promise<ProductResult> {
  const auth = await adminAction("staff"); if (!auth.ok) return fail(auth.error);
  if (!uuid.safeParse(setId).success || (pendantId && !uuid.safeParse(pendantId).success)) return fail("Datos no válidos.");
  const { error } = await auth.sb.rpc("admin_assign_pendant", { p_set: setId, p_pendant: pendantId || null });
  if (error) {
    if (error.message.includes("PENDANT_TAKEN")) return fail("Ese dije ya está asignado a otro set.");
    if (error.message.includes("SET_WITHOUT_PENDANT")) return fail("Este set está publicado: pásalo a borrador antes de quitarle el dije.");
    return fail("No se pudo asignar el dije. Inténtalo de nuevo.");
  }
  revalidatePath(`/admin/productos/${setId}`); revalidatePath("/admin/productos");
  return { ok: true, message: pendantId ? "Dije asignado. Revisa nombre, fotos y precio antes de publicar el set." : "Dije quitado: vuelve a estar disponible." };
}

// ---------- Costos (solo admin: la vendedora no ve costos ni márgenes) ----------
const costSchema = z.object({
  variant_id: uuid, currency: z.enum(["COP", "USD"]), amount: z.string().trim().max(14),
  intl_shipping: z.string().trim().max(10), packaging: z.string().trim().max(10), other: z.string().trim().max(10),
  supplier_id: z.string().uuid().or(z.literal("")), notes: z.string().trim().max(300),
});
export type CostInput = z.infer<typeof costSchema>;

export async function saveVariantCost(input: CostInput): Promise<ProductResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  const p = costSchema.safeParse(input); if (!p.success) return fail("Revisa los datos del costo.");
  const d = p.data;
  // COP: "85.000" = 85000 (el punto separa miles). USD: "12.50".
  const raw = d.currency === "COP" ? d.amount.replace(/[.\s]/g, "").replace(",", ".") : d.amount.replace(/\s/g, "").replace(",", ".");
  const amount = /^\d+(\.\d{1,2})?$/.test(raw) ? Number(raw) : NaN;
  if (!d.amount || Number.isNaN(amount) || amount < 0) return fail(d.currency === "COP" ? "Escribe el costo en pesos, por ejemplo 85000" : "Escribe el costo en dólares, por ejemplo 12.50");
  const extras = [toCents(d.intl_shipping), toCents(d.packaging), toCents(d.other)];
  if (extras.some((x) => Number.isNaN(x))) return fail("Los costos extra van en dólares, por ejemplo 1.50");
  let fx: number | null = null;
  if (d.currency === "COP") {
    const { data: b } = await auth.sb.from("business_settings").select("cop_per_usd").eq("id", 1).single();
    fx = b?.cop_per_usd ? Number(b.cop_per_usd) : null;
    if (!fx) return fail("Primero define la tasa COP/USD en Configuración › Tienda.");
  }
  const { error } = await auth.sb.from("variant_costs").insert({
    variant_id: d.variant_id, original_currency: d.currency, original_amount: amount, fx_cop_per_usd: fx,
    intl_shipping_cents: extras[0] ?? 0, packaging_cents: extras[1] ?? 0, other_cents: extras[2] ?? 0,
    supplier_id: d.supplier_id || null, notes: d.notes || null, is_current: true, created_by: auth.user.id,
  });
  if (error) return fail("No se pudo guardar el costo.");
  revalidatePath("/admin/productos");
  return { ok: true, message: "Costo guardado. El anterior queda en el historial." };
}

// ---------- Fotos ----------
const mediaSchema = z.object({
  product_id: uuid, variant_id: z.string().uuid().or(z.literal("")), storage_path: z.string().max(300),
  variants: z.record(z.string(), z.string().max(300)), width: z.number().int().positive(), height: z.number().int().positive(),
  dominant_color: z.string().regex(/^#[0-9a-fA-F]{6}$/), alt: z.string().trim().max(200),
});

export async function registerMedia(input: z.infer<typeof mediaSchema>): Promise<ProductResult> {
  const auth = await adminAction("staff"); if (!auth.ok) return fail(auth.error);
  const p = mediaSchema.safeParse(input); if (!p.success) return fail("Foto no válida.");
  const prefix = `${p.data.product_id}/`;
  if (!p.data.storage_path.startsWith(prefix) || Object.values(p.data.variants).some((v) => !v.startsWith(prefix))) return fail("Foto no válida.");
  const { data, error } = await auth.sb.rpc("admin_register_media", { p: { ...p.data, width: String(p.data.width), height: String(p.data.height) } });
  if (error) return fail("No se pudo registrar la foto.");
  refreshStore();
  return { ok: true, message: "Foto agregada.", id: data as string };
}

export async function reorderMedia(productId: string, ids: string[]): Promise<ProductResult> {
  const auth = await adminAction("staff"); if (!auth.ok) return fail(auth.error);
  if (!uuid.safeParse(productId).success || !ids.every((i) => uuid.safeParse(i).success)) return fail("Datos no válidos.");
  const { error } = await auth.sb.rpc("admin_reorder_media", { p_product_id: productId, p_ids: ids });
  if (error) return fail("No se pudo cambiar el orden. Recarga la página.");
  refreshStore();
  return { ok: true, message: "Orden guardado." };
}

export async function updateMedia(id: string, alt: string, variantId: string): Promise<ProductResult> {
  const auth = await adminAction("staff"); if (!auth.ok) return fail(auth.error);
  if (!uuid.safeParse(id).success || (variantId && !uuid.safeParse(variantId).success)) return fail("Datos no válidos.");
  const { error } = await auth.sb.from("product_media").update({ alt: { es: alt.trim().slice(0, 200) }, variant_id: variantId || null }).eq("id", id);
  if (error) return fail("No se pudo guardar.");
  refreshStore();
  return { ok: true, message: "Guardado." };
}

export async function deleteMedia(id: string): Promise<ProductResult> {
  const auth = await adminAction("staff"); if (!auth.ok) return fail(auth.error);
  if (!uuid.safeParse(id).success) return fail("Foto no válida.");
  const { data, error } = await auth.sb.rpc("admin_delete_media", { p_id: id });
  if (error) return fail("No se pudo eliminar la foto.");
  const r = data as { storage_path: string; variants: Record<string, string> };
  const paths = [...new Set([r.storage_path, ...Object.values(r.variants ?? {})])];
  await auth.sb.storage.from("product-media").remove(paths);
  refreshStore();
  return { ok: true, message: "Foto eliminada." };
}
