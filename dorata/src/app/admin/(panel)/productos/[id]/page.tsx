import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { ProductEditor, type EditorData } from "@/components/admin/ProductEditor";
import type { ProductInput } from "../actions";

export const metadata = { title: "Producto" };
type Tr = { locale: string; name: string; slug: string };
const es = <T extends { locale: string }>(rows: unknown): T | undefined => (rows as T[] | null)?.find((x) => x.locale === "es");

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "nuevo";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { sb, role } = await requireAdmin("staff");
  const canSeeCosts = role !== "staff";

  const [{ data: cats }, { data: warranties }, { data: cols }, { data: p }] = await Promise.all([
    sb.from("categories").select("id,auto_rule,default_warranty_policy_id,category_translations(locale,name,slug)").order("sort_order"),
    sb.from("warranty_policies").select("id,code,duration_months,warranty_policy_translations(locale,name)").order("sort_order"),
    sb.from("collections").select("id,collection_translations(locale,name,slug)").order("sort_order"),
    isNew ? Promise.resolve({ data: null }) : sb.from("products")
      .select("*, product_translations(*), product_variants(id,sku,title,price_cents,compare_at_cents,low_stock_threshold,is_default,is_active,position), product_media(id,variant_id,storage_path,variants,alt,position,width,height), product_warranty_components(position,label,warranty_policy_id), product_categories(category_id), product_collections(collection_id)")
      .eq("id", id).maybeSingle(),
  ]);
  if (!isNew && !p) notFound();

  const variantIds = ((p?.product_variants ?? []) as { id: string }[]).map((v) => v.id);
  const kitRole = (p?.kit_role ?? null) as "set_base" | "set_component" | null;
  // Sets cadena + dije: costos en pesos de la cadena y de los dijes reservados (para que la dueña elija y vea el total)
  const curCop = async (productIds: string[]) => {
    if (!productIds.length) return new Map<string, number>();
    const { data } = await sb.from("product_variants").select("product_id, variant_costs(original_amount, original_currency, is_current)").in("product_id", productIds);
    const m = new Map<string, number>();
    for (const v of (data ?? []) as { product_id: string; variant_costs: { original_amount: number; original_currency: string; is_current: boolean }[] }[]) {
      const c = v.variant_costs.find((x) => x.is_current && x.original_currency === "COP");
      if (c) m.set(v.product_id, Number(c.original_amount));
    }
    return m;
  };
  let kit: EditorData["kit"] = null;
  if (kitRole === "set_base" && p) {
    const { data: pend } = await sb.from("products").select("id, product_translations(locale,name)").eq("kit_role", "set_component").neq("status", "archived");
    const { data: taken } = await sb.from("products").select("id, set_pendant_product_id, product_translations(locale,name)").not("set_pendant_product_id", "is", null);
    const costs = await curCop([p.id, ...(pend ?? []).map((x) => x.id)]);
    const takenBy = new Map((taken ?? []).map((t) => [t.set_pendant_product_id as string, { id: t.id, name: es<Tr>(t.product_translations)?.name ?? "" }]));
    const options = (pend ?? []).map((x) => ({ id: x.id, name: es<Tr>(x.product_translations)?.name ?? "", costCop: costs.get(x.id) ?? null, takenBy: takenBy.get(x.id) ?? null }))
      .sort((a, b) => a.name.localeCompare(b.name));
    kit = { role: "set_base", chainCostCop: costs.get(p.id) ?? null, current: options.find((o) => o.id === p.set_pendant_product_id) ?? null,
      options: options.filter((o) => !o.takenBy || o.takenBy.id === p.id).map((o) => (o.takenBy?.id === p.id ? { ...o, takenBy: null } : o)) };
  } else if (kitRole === "set_component" && p) {
    const { data: owner } = await sb.from("products").select("id, product_translations(locale,name)").eq("set_pendant_product_id", p.id).maybeSingle();
    kit = { role: "set_component", partOf: owner ? { id: owner.id, name: es<Tr>(owner.product_translations)?.name ?? "" } : null };
  }
  const [{ data: stock }, costRes, fxRes] = await Promise.all([
    variantIds.length ? sb.from("v_inventory_status").select("variant_id,on_hand,reserved,available").in("variant_id", variantIds) : Promise.resolve({ data: [] }),
    canSeeCosts && variantIds.length ? sb.from("variant_costs").select("variant_id,original_currency,original_amount,fx_cop_per_usd,intl_shipping_cents,packaging_cents,other_cents,total_unit_cost_cents,valid_from").in("variant_id", variantIds).eq("is_current", true) : Promise.resolve({ data: [] }),
    canSeeCosts ? sb.from("business_settings").select("cop_per_usd,minimum_margin_pct,target_margin_pct").eq("id", 1).single() : Promise.resolve({ data: null }),
  ]);

  const catList = (cats ?? []).map((c) => ({ id: c.id, auto: c.auto_rule as string | null, warrantyId: c.default_warranty_policy_id as string | null, ...(es<Tr>(c.category_translations) ?? { name: "", slug: "" }) }));
  const wList = (warranties ?? []).map((w) => ({ id: w.id, code: w.code, months: w.duration_months as number | null, name: es<Tr>(w.warranty_policy_translations)?.name ?? w.code }));
  const colList = (cols ?? []).map((c) => ({ id: c.id, ...(es<Tr>(c.collection_translations) ?? { name: "", slug: "" }) }));
  const t = p ? es<{ locale: string; name: string; slug: string; short_description: string | null; description_md: string | null; seo_title: string | null; seo_description: string | null }>(p.product_translations) : undefined;
  const variants = ((p?.product_variants ?? []) as { id: string; sku: string; title: string; price_cents: number; compare_at_cents: number | null; low_stock_threshold: number | null; is_default: boolean; is_active: boolean; position: number }[])
    .sort((a, b) => a.position - b.position);
  const usd = (c: number | null) => (c === null ? "" : (c / 100).toFixed(2));
  const slugOf = (cid: string) => catList.find((c) => c.id === cid)?.slug ?? "";

  const initial: ProductInput = {
    id: p?.id ?? "", name: t?.name ?? "", slug: t?.slug ?? "", status: (p?.status ?? "draft") as ProductInput["status"],
    category_slug: p ? slugOf(p.primary_category_id) : "",
    extra_category_slugs: ((p?.product_categories ?? []) as { category_id: string }[]).map((x) => slugOf(x.category_id)).filter(Boolean),
    collection_slugs: ((p?.product_collections ?? []) as { collection_id: string }[]).map((x) => colList.find((c) => c.id === x.collection_id)?.slug ?? "").filter(Boolean),
    short_description: t?.short_description ?? "", description_md: t?.description_md ?? "",
    material: p?.material ?? "Oro laminado 18K", measurements: p?.measurements ?? "", color: p?.color ?? "",
    tags: ((p?.tags ?? []) as string[]).join(", "),
    is_featured: p?.is_featured ?? false, is_new: p?.is_new ?? false, new_until: p?.new_until ?? "", is_on_sale: p?.is_on_sale ?? false,
    weight_grams: p?.weight_grams != null ? String(p.weight_grams) : "", shipping_notes: p?.shipping_notes ?? "",
    seo_title: t?.seo_title ?? "", seo_description: t?.seo_description ?? "",
    warranty_code: wList.find((w) => w.id === p?.warranty_policy_id)?.code ?? "",
    components: ((p?.product_warranty_components ?? []) as { position: number; label: Record<string, string>; warranty_policy_id: string | null }[])
      .sort((a, b) => a.position - b.position).map((c) => ({ label: c.label?.es ?? "", warranty_code: wList.find((w) => w.id === c.warranty_policy_id)?.code ?? "" })),
    variants: variants.length ? variants.map((v) => ({
      id: v.id, title: v.title, sku: v.sku, price: usd(v.price_cents), compare_at: usd(v.compare_at_cents),
      low_stock_threshold: v.low_stock_threshold != null ? String(v.low_stock_threshold) : "", is_active: v.is_active, is_default: v.is_default, initial_stock: "",
    })) : [{ id: "", title: "Única", sku: "", price: "", compare_at: "", low_stock_threshold: "", is_active: true, is_default: true, initial_stock: "" }],
  };

  const data: EditorData = {
    categories: catList, warranties: wList, collections: colList, canSeeCosts,
    storageBase: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    stock: Object.fromEntries((stock ?? []).map((s) => [s.variant_id, { onHand: s.on_hand as number, reserved: s.reserved as number, available: s.available as number }])),
    kit,
    costs: Object.fromEntries(((costRes.data ?? []) as { variant_id: string; original_currency: string; original_amount: number; fx_cop_per_usd: number | null; total_unit_cost_cents: number | null; valid_from: string }[])
      .map((c) => [c.variant_id, { currency: c.original_currency, amount: Number(c.original_amount), fx: c.fx_cop_per_usd ? Number(c.fx_cop_per_usd) : null, totalCents: c.total_unit_cost_cents, since: c.valid_from }])),
    fx: fxRes.data?.cop_per_usd ? Number(fxRes.data.cop_per_usd) : null,
    minMargin: fxRes.data?.minimum_margin_pct != null ? Number(fxRes.data.minimum_margin_pct) : null,
    targetMargin: fxRes.data?.target_margin_pct != null ? Number(fxRes.data.target_margin_pct) : null,
    media: ((p?.product_media ?? []) as { id: string; variant_id: string | null; variants: Record<string, string>; alt: Record<string, string>; position: number }[])
      .sort((a, b) => a.position - b.position).map((m) => ({ id: m.id, variantId: m.variant_id ?? "", thumb: m.variants["400"] ?? Object.values(m.variants)[0] ?? "", alt: m.alt?.es ?? "" })),
  };

  return (
    <div>
      <Link href="/admin/productos" className="mb-4 inline-flex h-10 items-center gap-2 text-[14px] text-ink-2"><ArrowLeft aria-hidden="true" size={16} />Todos los productos</Link>
      <ProductEditor initial={initial} data={data} />
    </div>
  );
}
