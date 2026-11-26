"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Sparkles, Star, Trash2 } from "lucide-react";
import { saveProduct, type ProductInput, type VariantInput } from "@/app/admin/(panel)/productos/actions";
import { slugify } from "@/lib/slug";
import { formatWarranty } from "@/lib/warranty";
import { Card, PageHeader, SaveBar, StatusText, areaCls, btnPrimary, helpCls, inputCls, labelCls } from "./ui";
import { useUnsavedGuard } from "./useUnsavedGuard";
import { ProductPhotos, type MediaItem } from "./ProductPhotos";
import { VariantCosts, type CostInfo } from "./VariantCosts";

export type EditorData = {
  categories: { id: string; auto: string | null; warrantyId: string | null; name: string; slug: string }[];
  warranties: { id: string; code: string; months: number | null; name: string }[];
  collections: { id: string; name: string; slug: string }[];
  canSeeCosts: boolean; storageBase: string; fx: number | null; minMargin: number | null; targetMargin: number | null;
  stock: Record<string, { onHand: number; reserved: number; available: number }>;
  costs: Record<string, CostInfo>;
  media: MediaItem[];
};

const STATUS = [
  { value: "draft", label: "Borrador", help: "No se ve en la tienda. Ideal mientras completas fotos y precios." },
  { value: "active", label: "Activo", help: "Se ve y se puede comprar." },
  { value: "archived", label: "Archivado", help: "Ya no se vende; se conserva para pedidos y garantías antiguas." },
] as const;

/** Código sugerido: DOR-CAD-SING45-01 (marca-categoría-nombre-número). */
function suggestSku(name: string, catSlug: string, n: number) {
  const cat = catSlug.replace(/-/g, "").slice(0, 3).toUpperCase() || "GEN";
  const words = slugify(name).split("-").filter(Boolean);
  const core = (words.length > 1 ? words.map((w) => (/\d/.test(w) ? w : w[0])).join("") : (words[0] ?? "PZ").slice(0, 6)).toUpperCase().slice(0, 10);
  return `DOR-${cat}-${core}-${String(n).padStart(2, "0")}`.replace(/[^A-Z0-9-]/g, "");
}
const emptyVariant = (n: number): VariantInput => ({ id: "", title: n === 1 ? "Única" : "", sku: "", price: "", compare_at: "", low_stock_threshold: "", is_active: true, is_default: n === 1, initial_stock: "" });

export function ProductEditor({ initial, data }: { initial: ProductInput; data: EditorData }) {
  const router = useRouter();
  const [d, setD] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);
  const [useComponents, setUseComponents] = useState(initial.components.length > 0);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(d) !== saved;
  useUnsavedGuard(dirty);

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => { setMsg(null); setD((x) => ({ ...x, [k]: v })); };
  const setV = (i: number, patch: Partial<VariantInput>) => { setMsg(null); setD((x) => ({ ...x, variants: x.variants.map((v, j) => (j === i ? { ...v, ...patch } : patch.is_default ? { ...v, is_default: false } : v)) })); };
  const mainCats = data.categories.filter((c) => !c.auto);
  const cat = data.categories.find((c) => c.slug === d.category_slug);
  const catWarranty = data.warranties.find((w) => w.id === cat?.warrantyId);
  const wLabel = (w: { name: string; months: number | null }) => `${w.name} (${formatWarranty(w.months)})`;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...d, components: useComponents ? d.components : [] };
    start(async () => {
      const r = await saveProduct(payload);
      if (!r) return;
      setMsg({ ok: r.ok, text: r.message });
      if (!r.ok) return;
      setSaved(JSON.stringify(payload)); setD(payload);
      if (!d.id && r.id) router.replace(`/admin/productos/${r.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="lg:col-span-2">
        <PageHeader eyebrow={initial.id ? "Producto" : "Nuevo producto"} title={d.name || (initial.id ? "Sin nombre" : "Nuevo producto")}
          description={initial.id ? `${STATUS.find((s) => s.value === initial.status)?.label} · ${cat?.name ?? "sin categoría"}` : "Empieza por el nombre, la categoría y el precio. Las fotos se agregan después de guardar."} />
      </div>

      <div className="grid min-w-0 gap-6">
        <Card title="Lo básico" step={1}>
          <div className="grid gap-4">
            <label className={labelCls}>Nombre
              <input required maxLength={120} value={d.name} onChange={(e) => { const v = e.target.value; setMsg(null); setD((x) => ({ ...x, name: v, slug: slugTouched ? x.slug : slugify(v) })); }} placeholder="Ej: Cadena Singapur 45 cm" className={inputCls} />
            </label>
            <label className={labelCls}>Categoría principal
              <select required value={d.category_slug} onChange={(e) => set("category_slug", e.target.value)} className={inputCls}>
                <option value="" disabled>Elige una categoría</option>
                {mainCats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <label className={labelCls}>Dirección en la tienda
              <span className="flex h-11 items-center overflow-hidden rounded-[4px] border border-line bg-ivory focus-within:border-gold-deep">
                <span className="max-w-[45%] shrink-0 truncate border-r border-line bg-cream px-3 text-[14px] leading-[44px] text-ink-3">/{d.category_slug || "categoria"}/</span>
                <input required maxLength={100} value={d.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value) || e.target.value.toLowerCase()); }} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] outline-none" />
              </span>
              {initial.slug && (d.slug !== initial.slug || d.category_slug !== initial.category_slug) && <span className={helpCls}>La dirección anterior seguirá funcionando y llevará a la nueva.</span>}
            </label>
            <label className={labelCls}>Frase corta (aparece en la tarjeta y bajo el nombre)
              <input maxLength={200} value={d.short_description} onChange={(e) => set("short_description", e.target.value)} placeholder="Ej: Brillo diario que no se apaga." className={inputCls} />
            </label>
            <label className={labelCls}>Descripción
              <textarea maxLength={8000} value={d.description_md} onChange={(e) => set("description_md", e.target.value)} placeholder="Cuenta cómo es la pieza, cómo se siente y con qué combina." className={`min-h-32 ${areaCls}`} />
              <span className={helpCls}>Formato simple: **negrita**, y una línea con - para listas.</span>
            </label>
          </div>
        </Card>

        <Card title="Precio y variantes" step={2} aside={<span className={helpCls}>Precios en USD</span>}>
          <p className="mb-4 text-[13px] text-ink-2">Si la pieza viene en un solo modelo, deja una variante “Única”. Si cambia el largo, color de hilo o talla, agrega una por opción.</p>
          <ol className="grid gap-4">
            {d.variants.map((v, i) => {
              const s = v.id ? data.stock[v.id] : undefined;
              return (
                <li key={v.id || `new-${i}`} className={`grid gap-3 rounded-[4px] border p-3 ${v.is_active ? "border-line" : "border-dashed border-line opacity-70"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-ink-2">Variante {i + 1}{!v.is_active && " · desactivada"}</span>
                    <div className="flex items-center gap-1">
                      <label className="press inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-[13px] has-[:checked]:bg-gold/15 has-[:checked]:font-semibold">
                        <input type="radio" name="default_variant" checked={v.is_default} onChange={() => setV(i, { is_default: true })} className="sr-only" />
                        <Star aria-hidden="true" size={14} className={v.is_default ? "fill-[var(--gold)] text-gold-deep" : ""} />{v.is_default ? "Principal" : "Hacer principal"}
                      </label>
                      {v.id ? (
                        <button type="button" onClick={() => setV(i, { is_active: !v.is_active })} className="press h-10 px-3 text-[13px] underline underline-offset-4">{v.is_active ? "Desactivar" : "Activar"}</button>
                      ) : d.variants.length > 1 && (
                        <button type="button" aria-label={`Quitar variante ${i + 1}`} onClick={() => setD((x) => ({ ...x, variants: x.variants.filter((_, j) => j !== i) }))} className="press grid size-10 place-items-center text-danger"><Trash2 aria-hidden="true" size={16} /></button>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className={labelCls}>Nombre de la variante<input required maxLength={60} value={v.title} onChange={(e) => setV(i, { title: e.target.value })} placeholder="Ej: 45 cm, Hilo negro" className={inputCls} /></label>
                    <label className={labelCls}>Código (SKU)
                      <span className="flex gap-2">
                        <input required maxLength={40} value={v.sku} onChange={(e) => setV(i, { sku: e.target.value.toUpperCase().replace(/\s/g, "-") })} placeholder="DOR-CAD-SING-01" className={`${inputCls} uppercase`} />
                        {!v.sku && <button type="button" onClick={() => setV(i, { sku: suggestSku(d.name, d.category_slug, i + 1) })} disabled={!d.name} className="press shrink-0 rounded-full border border-line px-3 text-[13px] disabled:opacity-40">Sugerir</button>}
                      </span>
                    </label>
                    <label className={labelCls}>Precio<span className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">$</span><input required inputMode="decimal" value={v.price} onChange={(e) => setV(i, { price: e.target.value })} placeholder="0.00" className={`${inputCls} pl-7 tabular`} /></span></label>
                    <label className={labelCls}>Precio antes (opcional)<span className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">$</span><input inputMode="decimal" value={v.compare_at} onChange={(e) => setV(i, { compare_at: e.target.value })} placeholder="Sin descuento" className={`${inputCls} pl-7 tabular`} /></span>
                      <span className={helpCls}>Si lo llenas, la tienda lo muestra tachado.</span>
                    </label>
                    {v.id ? (
                      <div className={labelCls}>Unidades
                        <p className="flex h-11 items-center gap-2 text-[15px] text-ink">
                          <span className="tabular font-semibold">{s?.available ?? 0}</span> disponibles{s?.reserved ? <span className="text-[13px] text-ink-2">· {s.reserved} apartadas en compras</span> : null}
                        </p>
                        <Link href={`/admin/inventario?sku=${encodeURIComponent(v.sku)}`} className="text-[13px] text-ink underline underline-offset-4">Ajustar en Inventario</Link>
                      </div>
                    ) : (
                      <label className={labelCls}>Unidades que tienes hoy<input inputMode="numeric" value={v.initial_stock} onChange={(e) => setV(i, { initial_stock: e.target.value.replace(/\D/g, "") })} placeholder="0" className={`${inputCls} tabular`} /></label>
                    )}
                    <label className={labelCls}>Avisar cuando queden (opcional)<input inputMode="numeric" value={v.low_stock_threshold} onChange={(e) => setV(i, { low_stock_threshold: e.target.value.replace(/\D/g, "") })} placeholder="Usa el aviso general" className={`${inputCls} tabular`} /></label>
                  </div>
                </li>
              );
            })}
          </ol>
          {d.variants.length < 40 && (
            <button type="button" onClick={() => setD((x) => ({ ...x, variants: [...x.variants, emptyVariant(x.variants.length + 1)] }))} className="press mt-3 inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-[14px]">
              <Plus aria-hidden="true" size={16} />Agregar variante
            </button>
          )}
        </Card>

        {data.canSeeCosts && d.id && (
          <VariantCosts variants={d.variants.filter((v) => v.id).map((v) => ({ id: v.id, title: v.title, priceCents: Math.round(Number(v.price.replace(",", ".")) * 100) || 0 }))} costs={data.costs} fx={data.fx} minMargin={data.minMargin} targetMargin={data.targetMargin} />
        )}

        <ProductPhotos productId={d.id} storageBase={data.storageBase} items={data.media} variants={d.variants.filter((v) => v.id).map((v) => ({ id: v.id, title: v.title }))} productName={d.name} />

        <Card title="Garantía" step={5}>
          <div className="grid gap-4">
            <label className={labelCls}>Garantía de la pieza
              <select value={d.warranty_code} onChange={(e) => set("warranty_code", e.target.value)} className={inputCls}>
                <option value="">Usar la de la categoría{catWarranty ? `: ${wLabel(catWarranty)}` : " (no tiene)"}</option>
                {data.warranties.map((w) => <option key={w.id} value={w.code}>{wLabel(w)}</option>)}
              </select>
            </label>
            <label className="flex items-start gap-3 text-[15px]">
              <input type="checkbox" checked={useComponents} onChange={(e) => { setUseComponents(e.target.checked); if (e.target.checked && d.components.length === 0) set("components", [{ label: "", warranty_code: "" }, { label: "", warranty_code: "" }]); }} className="mt-0.5 size-5 accent-[var(--ink)]" />
              <span>Tiene partes con garantías distintas<span className={`block ${helpCls}`}>Ej: pulsera de hilo con balines — balines 5 años, hilo y armado aparte.</span></span>
            </label>
            {useComponents && (
              <ol className="fade-in grid gap-3">
                {d.components.map((c, i) => (
                  <li key={i} className="grid gap-2 rounded-[4px] border border-line p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                    <label className={labelCls}>Parte<input maxLength={60} value={c.label} onChange={(e) => set("components", d.components.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder={i === 0 ? "Ej: Balines de oro laminado" : "Ej: Hilo y armado"} className={inputCls} /></label>
                    <label className={labelCls}>Garantía
                      <select value={c.warranty_code} onChange={(e) => set("components", d.components.map((x, j) => (j === i ? { ...x, warranty_code: e.target.value } : x)))} className={inputCls}>
                        <option value="">Sin garantía</option>
                        {data.warranties.map((w) => <option key={w.id} value={w.code}>{wLabel(w)}</option>)}
                      </select>
                    </label>
                    <button type="button" aria-label={`Quitar parte ${i + 1}`} onClick={() => set("components", d.components.filter((_, j) => j !== i))} className="press grid size-11 place-items-center text-danger"><Trash2 aria-hidden="true" size={16} /></button>
                  </li>
                ))}
                {d.components.length < 8 && <button type="button" onClick={() => set("components", [...d.components, { label: "", warranty_code: "" }])} className="press inline-flex h-11 w-fit items-center gap-2 rounded-full border border-line px-4 text-[14px]"><Plus aria-hidden="true" size={16} />Agregar parte</button>}
              </ol>
            )}
          </div>
        </Card>

        <Card title="Detalles de la pieza" step={6}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelCls}>Material<input maxLength={80} value={d.material} onChange={(e) => set("material", e.target.value)} className={inputCls} /></label>
            <label className={labelCls}>Medidas<input maxLength={120} value={d.measurements} onChange={(e) => set("measurements", e.target.value)} placeholder="Ej: 45 cm · 3 mm" className={inputCls} /></label>
            <label className={labelCls}>Color o tono<input maxLength={60} value={d.color} onChange={(e) => set("color", e.target.value)} placeholder="Ej: Dorado" className={inputCls} /></label>
            <label className={labelCls}>Peso en gramos (para envíos)<input inputMode="decimal" value={d.weight_grams} onChange={(e) => set("weight_grams", e.target.value)} placeholder="Ej: 6" className={inputCls} /></label>
            <label className={`${labelCls} sm:col-span-2`}>Palabras para encontrarlo (separadas por coma)<input maxLength={300} value={d.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Ej: regalo, mamá, minimalista" className={inputCls} /></label>
          </div>
        </Card>

        <Card title="Cómo se ve en Google (opcional)" step={7}>
          <div className="grid gap-4">
            <label className={labelCls}>Título en Google<input maxLength={70} value={d.seo_title} onChange={(e) => set("seo_title", e.target.value)} className={inputCls} />
              <span className={`${helpCls} flex justify-between gap-2`}><span>Vacío: “{d.name || "Producto"} | D&apos;ORATA”.</span><span className="tabular">{d.seo_title.length}/70</span></span>
            </label>
            <label className={labelCls}>Descripción en Google<textarea maxLength={160} value={d.seo_description} onChange={(e) => set("seo_description", e.target.value)} className={`min-h-20 ${areaCls}`} />
              <span className={`${helpCls} flex justify-between gap-2`}><span>Vacío: se usa la frase corta.</span><span className="tabular">{d.seo_description.length}/160</span></span>
            </label>
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 content-start gap-6 lg:sticky lg:top-6">
        <Card title="Estado" step={1}>
          <fieldset className="grid gap-2">
            <legend className="sr-only">Estado del producto</legend>
            {STATUS.map((s) => (
              <label key={s.value} className="flex cursor-pointer gap-3 rounded-[4px] border border-line p-3 transition-colors has-[:checked]:border-ink has-[:checked]:bg-ivory">
                <input type="radio" name="status" checked={d.status === s.value} onChange={() => set("status", s.value)} className="mt-1 accent-[var(--ink)]" />
                <span><span className="block text-[15px] font-semibold">{s.label}</span><span className="block text-[13px] text-ink-2">{s.help}</span></span>
              </label>
            ))}
          </fieldset>
          {d.status === "active" && data.media.length === 0 && d.id && <p className="fade-in mt-3 text-[13px] text-gold-deep">Aún no tiene fotos: en la tienda se verá una ilustración en su lugar.</p>}
        </Card>
        <Card title="Destacar" step={2}>
          <div className="grid gap-3">
            <label className="flex items-center gap-3 text-[15px]"><input type="checkbox" checked={d.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="size-5 accent-[var(--ink)]" /><Sparkles aria-hidden="true" size={16} className="text-gold-deep" />Mostrar en la portada</label>
            <label className="flex items-center gap-3 text-[15px]"><input type="checkbox" checked={d.is_new} onChange={(e) => set("is_new", e.target.checked)} className="size-5 accent-[var(--ink)]" />Marcar como nuevo</label>
            {d.is_new && <label className={`fade-in ${labelCls}`}>Nuevo hasta (opcional)<input type="date" value={d.new_until} onChange={(e) => set("new_until", e.target.value)} className={inputCls} /></label>}
            <label className="flex items-center gap-3 text-[15px]"><input type="checkbox" checked={d.is_on_sale} onChange={(e) => set("is_on_sale", e.target.checked)} className="size-5 accent-[var(--ink)]" />Incluir en Ofertas</label>
          </div>
        </Card>
        {mainCats.length > 1 && (
          <Card title="También aparece en" step={3}>
            <div className="grid gap-2">
              {mainCats.filter((c) => c.slug !== d.category_slug).map((c) => (
                <label key={c.id} className="flex items-center gap-3 text-[14px]">
                  <input type="checkbox" checked={d.extra_category_slugs.includes(c.slug)} onChange={(e) => set("extra_category_slugs", e.target.checked ? [...d.extra_category_slugs, c.slug] : d.extra_category_slugs.filter((s) => s !== c.slug))} className="size-5 accent-[var(--ink)]" />{c.name}
                </label>
              ))}
            </div>
          </Card>
        )}
        {data.collections.length > 0 && (
          <Card title="Colecciones" step={4}>
            <div className="grid gap-2">
              {data.collections.map((c) => (
                <label key={c.id} className="flex items-center gap-3 text-[14px]">
                  <input type="checkbox" checked={d.collection_slugs.includes(c.slug)} onChange={(e) => set("collection_slugs", e.target.checked ? [...d.collection_slugs, c.slug] : d.collection_slugs.filter((s) => s !== c.slug))} className="size-5 accent-[var(--ink)]" />{c.name}
                </label>
              ))}
            </div>
          </Card>
        )}
      </div>

      <SaveBar dirty={dirty && !msg}>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <Check aria-hidden="true" size={16} />}
          {d.id ? "Guardar" : "Crear producto"}
        </button>
        {msg && <StatusText ok={msg.ok}>{msg.text}</StatusText>}
      </SaveBar>
    </form>
  );
}
