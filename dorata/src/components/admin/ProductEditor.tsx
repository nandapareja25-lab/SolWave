"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bold, Check, ChevronDown, ExternalLink, List, Loader2, Plus, Sparkles, Star, Trash2 } from "lucide-react";
import { saveProduct, type ProductInput, type VariantInput } from "@/app/admin/(panel)/productos/actions";
import { slugify } from "@/lib/slug";
import { formatWarranty } from "@/lib/warranty";
import { Card, PageHeader, SaveBar, StatusText, areaCls, btnPrimary, btnQuiet, chipBtn, helpCls, inputCls, labelCls } from "./ui";
import { formatUSD } from "@/lib/money";
import { useUnsavedGuard } from "./useUnsavedGuard";
import { useSaveShortcut } from "./useSaveShortcut";
import { GooglePreview } from "./GooglePreview";
import { ProductPhotos, type MediaItem } from "./ProductPhotos";
import { VariantCosts, type CostInfo } from "./VariantCosts";
import { SetPendantCard, type PendantOption } from "./SetPendantCard";

export type EditorData = {
  categories: { id: string; auto: string | null; warrantyId: string | null; name: string; slug: string }[];
  warranties: { id: string; code: string; months: number | null; name: string }[];
  collections: { id: string; name: string; slug: string }[];
  canSeeCosts: boolean; storageBase: string; fx: number | null; minMargin: number | null; targetMargin: number | null;
  stock: Record<string, { onHand: number; reserved: number; available: number }>;
  costs: Record<string, CostInfo>;
  media: MediaItem[];
  /** Sets cadena + dije: la cadena espera su dije; el dije está reservado para un set. */
  kit: { role: "set_base"; chainCostCop: number | null; current: PendantOption | null; options: PendantOption[] }
     | { role: "set_component"; partOf: { id: string; name: string } | null } | null;
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
  const [celebrate, setCelebrate] = useState(false);
  const [pending, start] = useTransition();
  const descRef = useRef<HTMLTextAreaElement>(null);
  /** Formato sin enseñar sintaxis: envuelve la selección en **negrita** o la convierte en lista. */
  function format(kind: "bold" | "list") {
    const el = descRef.current; if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const sel = value.slice(a, b) || (kind === "bold" ? "texto" : "elemento");
    const out = kind === "bold" ? `**${sel}**` : sel.split("\n").map((l) => (l.startsWith("- ") ? l : `- ${l}`)).join("\n");
    const prefix = kind === "list" && a > 0 && value[a - 1] !== "\n" ? "\n" : "";
    set("description_md", value.slice(0, a) + prefix + out + value.slice(b));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + prefix.length, a + prefix.length + out.length); });
  }
  const dirty = JSON.stringify(d) !== saved;
  useUnsavedGuard(dirty);
  const formRef = useRef<HTMLFormElement>(null);
  useSaveShortcut(formRef);

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => { setMsg(null); setD((x) => ({ ...x, [k]: v })); };
  const setV = (i: number, patch: Partial<VariantInput>) => { setMsg(null); setD((x) => ({ ...x, variants: x.variants.map((v, j) => (j === i ? { ...v, ...patch } : patch.is_default ? { ...v, is_default: false } : v)) })); };
  const mainCats = data.categories.filter((c) => !c.auto);
  const cat = data.categories.find((c) => c.slug === d.category_slug);
  const catWarranty = data.warranties.find((w) => w.id === cat?.warrantyId);
  const wLabel = (w: { name: string; months: number | null }) => `${w.name} (${formatWarranty(w.months)})`;
  const prices = initial.variants.filter((v) => v.is_active && v.price).map((v) => Math.round(Number(v.price) * 100));
  const priceText = !prices.length || Math.max(...prices) === 0 ? "sin precio" : Math.min(...prices) === Math.max(...prices) ? formatUSD(prices[0]!) : `${formatUSD(Math.min(...prices))} – ${formatUSD(Math.max(...prices))}`;
  const effWarranty = d.warranty_code ? data.warranties.find((w) => w.code === d.warranty_code) : catWarranty;
  const whereSummary = [d.is_featured && "En la portada", d.is_new && "Nuevo", d.is_on_sale && "En ofertas", d.extra_category_slugs.length > 0 && `+${d.extra_category_slugs.length} categoría(s)`].filter(Boolean).join(" · ") || "Solo en su categoría";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...d, components: useComponents ? d.components : [] };
    start(async () => {
      const r = await saveProduct(payload);
      if (!r) return;
      setMsg({ ok: r.ok, text: r.message });
      if (!r.ok) return;
      const wasActive = (JSON.parse(saved) as ProductInput).status === "active";
      setSaved(JSON.stringify(payload)); setD(payload);
      if (payload.status === "active" && !wasActive) { setCelebrate(true); setMsg({ ok: true, text: "¡Publicado! Ya se ve en la tienda." }); setTimeout(() => setCelebrate(false), 900); }
      if (!d.id && r.id) router.replace(`/admin/productos/${r.id}`);
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="lg:col-span-2">
        <PageHeader eyebrow={initial.id ? "Producto" : "Nuevo producto"} title={d.name || (initial.id ? "Sin nombre" : "Nuevo producto")}
          description={initial.id ? [STATUS.find((s) => s.value === initial.status)?.label, cat?.name, priceText].filter(Boolean).join(" · ") : "Empieza por el nombre, la categoría y el precio. Las fotos se agregan después de guardar."} />
      </div>

      <div className="order-2 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:order-none">
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
            <label className={labelCls}>Frase corta (aparece en la tarjeta y bajo el nombre)
              <textarea rows={2} maxLength={200} value={d.short_description} onChange={(e) => set("short_description", e.target.value)} placeholder="Ej: Brillo diario que no se apaga." className={`resize-none ${areaCls}`} />
            </label>
            <div className={labelCls}>
              <span className="flex items-end justify-between gap-2">
                <label htmlFor="desc">Descripción</label>
                <span className="flex gap-1">
                  <button type="button" onClick={() => format("bold")} aria-label="Poner en negrita lo seleccionado" className="press grid size-9 place-items-center rounded-full border border-line"><Bold aria-hidden="true" size={14} /></button>
                  <button type="button" onClick={() => format("list")} aria-label="Convertir en lista" className="press grid size-9 place-items-center rounded-full border border-line"><List aria-hidden="true" size={14} /></button>
                </span>
              </span>
              <textarea id="desc" ref={descRef} maxLength={8000} value={d.description_md} onChange={(e) => set("description_md", e.target.value)} placeholder="Cuenta cómo es la pieza, cómo se siente y con qué combina." className={`min-h-32 ${areaCls}`} />
            </div>
          </div>
        </Card>

        {data.kit?.role === "set_base" && d.id && (
          <SetPendantCard setId={d.id} chainCostCop={data.kit.chainCostCop} current={data.kit.current} options={data.kit.options} />
        )}
        {data.kit?.role === "set_component" && (
          <Card title="Dije reservado para sets" step={2}>
            <p className="text-[14px] text-ink-2">Esta pieza no se vende sola: se usa para armar un set con una cadena.</p>
            <p className="mt-2 text-[14px]">{data.kit.partOf
              ? <>Asignado a <Link href={`/admin/productos/${data.kit.partOf.id}`} className="font-semibold underline underline-offset-4">{data.kit.partOf.name}</Link>.</>
              : <span className="text-gold-deep">Todavía no está en ningún set.</span>}</p>
          </Card>
        )}

        <Card title="Precio y variantes" step={2} aside={<span className={helpCls}>Precios en USD</span>}>
          <p className="mb-4 text-[13px] text-ink-2">Si la pieza viene en un solo modelo, deja una variante “Única”. Si cambia el largo, color de hilo o talla, agrega una por opción.</p>
          <ol className="grid gap-4">
            {d.variants.map((v, i) => {
              const s = v.id ? data.stock[v.id] : undefined;
              return (
                <li key={v.id || `new-${i}`} className={`rounded-[4px] border ${v.is_active ? "border-line" : "border-dashed border-line opacity-70"}`}>
                  <details open={!v.id} className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center gap-2 p-3 [&::-webkit-details-marker]:hidden">
                    {v.is_default && <Star aria-label="Principal" size={14} className="shrink-0 fill-[var(--gold)] text-gold-deep" />}
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{v.title || `Variante ${i + 1}`}</span>
                    <span className="shrink-0 text-[14px] tabular">{v.price ? `$${Number(v.price.replace(",", ".")).toFixed(2)}` : "sin precio"}</span>
                    {v.id && <span className={`shrink-0 text-[13px] ${(s?.available ?? 0) === 0 ? "text-danger" : "text-ink-2"}`}>· {s?.available ?? 0} disp.</span>}
                    {!v.is_active && <span className="shrink-0 rounded-[4px] bg-line/60 px-1.5 text-[11px] text-ink-2">Desactivada</span>}
                    <ChevronDown aria-hidden="true" size={16} className="shrink-0 text-ink-3 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                  </summary>
                  <div className="grid gap-3 border-t border-line p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-ink-2">Variante {i + 1}{!v.is_active && " · desactivada"}</span>
                    <div className="flex items-center gap-1">
                      <label className={`${chipBtn} cursor-pointer has-[:checked]:border-gold/60 has-[:checked]:bg-gold/15 has-[:checked]:font-semibold`}>
                        <input type="radio" name="default_variant" checked={v.is_default} onChange={() => setV(i, { is_default: true })} className="sr-only" />
                        <Star aria-hidden="true" size={14} className={v.is_default ? "fill-[var(--gold)] text-gold-deep" : ""} />{v.is_default ? "Principal" : "Hacer principal"}
                      </label>
                      {v.id ? (
                        <button type="button" onClick={() => setV(i, { is_active: !v.is_active })} className={chipBtn}>{v.is_active ? "Desactivar" : "Activar"}</button>
                      ) : d.variants.length > 1 && (
                        <button type="button" aria-label={`Quitar variante ${i + 1}`} onClick={() => setD((x) => ({ ...x, variants: x.variants.filter((_, j) => j !== i) }))} className="press grid size-10 place-items-center text-danger"><Trash2 aria-hidden="true" size={16} /></button>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className={labelCls}>Nombre de la variante<input maxLength={60} value={v.title} onChange={(e) => setV(i, { title: e.target.value })} placeholder="Ej: 45 cm, Hilo negro" className={inputCls} /></label>
                    <label className={labelCls}>Código interno
                      <span className="flex gap-2">
                        <input maxLength={40} value={v.sku} onChange={(e) => setV(i, { sku: e.target.value.toUpperCase().replace(/\s/g, "-") })} placeholder="DOR-CAD-SING-01" className={`${inputCls} uppercase`} />
                        {!v.sku && <button type="button" onClick={() => setV(i, { sku: suggestSku(d.name, d.category_slug, i + 1) })} disabled={!d.name} className="press shrink-0 rounded-full border border-line px-3 text-[13px] disabled:opacity-40">Sugerir</button>}
                      </span>
                    </label>
                    <label className={labelCls}>Precio<span className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">$</span><input inputMode="decimal" value={v.price} onChange={(e) => setV(i, { price: e.target.value })} placeholder="0.00" className={`${inputCls} pl-7 tabular`} /></span></label>
                    <label className={labelCls}>Precio antes (opcional)<span className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">$</span><input inputMode="decimal" value={v.compare_at} onChange={(e) => setV(i, { compare_at: e.target.value })} placeholder="Sin descuento" className={`${inputCls} pl-7 tabular`} /></span>
                      <span className={helpCls}>Si lo llenas, la tienda lo muestra tachado.</span>
                    </label>
                    {v.id ? (
                      <div className={labelCls}>Unidades
                        <p className="flex h-11 items-center gap-2 text-[15px] text-ink">
                          <span className="tabular font-semibold">{s?.available ?? 0}</span> disponibles{s?.reserved ? <span className="text-[13px] text-ink-2">· {s.reserved} apartadas en compras</span> : null}
                        </p>
                        <Link href={`/admin/inventario?sku=${encodeURIComponent(v.sku)}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[13px] text-ink underline underline-offset-4">Ajustar en Inventario<ExternalLink aria-hidden="true" size={12} /><span className="sr-only"> (se abre en otra pestaña)</span></Link>
                      </div>
                    ) : (
                      <label className={labelCls}>Unidades que tienes hoy<input inputMode="numeric" value={v.initial_stock} onChange={(e) => setV(i, { initial_stock: e.target.value.replace(/\D/g, "") })} placeholder="0" className={`${inputCls} tabular`} /></label>
                    )}
                    <label className={labelCls}>Avisar cuando queden (opcional)<input inputMode="numeric" value={v.low_stock_threshold} onChange={(e) => setV(i, { low_stock_threshold: e.target.value.replace(/\D/g, "") })} placeholder="Usa el aviso general" className={`${inputCls} tabular`} /></label>
                  </div>
                  </div>
                  </details>
                </li>
              );
            })}
          </ol>
          {d.variants.length < 40 && (
            <button type="button" onClick={() => setD((x) => ({ ...x, variants: [...x.variants, emptyVariant(x.variants.length + 1)] }))} className={`${btnQuiet} mt-3`}>
              <Plus aria-hidden="true" size={16} />Agregar variante
            </button>
          )}
        </Card>

        {data.canSeeCosts && d.id && (
          <VariantCosts variants={d.variants.filter((v) => v.id).map((v) => ({ id: v.id, title: v.title, priceCents: Math.round(Number(v.price.replace(",", ".")) * 100) || 0 }))} costs={data.costs} fx={data.fx} minMargin={data.minMargin} targetMargin={data.targetMargin} />
        )}

        <ProductPhotos productId={d.id} storageBase={data.storageBase} items={data.media} variants={d.variants.filter((v) => v.id).map((v) => ({ id: v.id, title: v.title }))} productName={d.name} />

        <Card title="Garantía" step={5} collapsible summary={useComponents ? `Por partes: ${d.components.filter((c) => c.label).map((c) => c.label).join(", ") || "sin completar"}` : effWarranty ? wLabel(effWarranty) : "Sin garantía asignada"}>
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
                {d.components.length < 8 && <button type="button" onClick={() => set("components", [...d.components, { label: "", warranty_code: "" }])} className={btnQuiet}><Plus aria-hidden="true" size={16} />Agregar parte</button>}
              </ol>
            )}
          </div>
        </Card>

        <Card title="Detalles de la pieza" step={6} collapsible summary={[d.material, d.measurements, d.weight_grams && `${d.weight_grams} g`].filter(Boolean).join(" · ") || "Material, medidas y peso"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelCls}>Material<input maxLength={80} value={d.material} onChange={(e) => set("material", e.target.value)} className={inputCls} /></label>
            <label className={labelCls}>Medidas<input maxLength={120} value={d.measurements} onChange={(e) => set("measurements", e.target.value)} placeholder="Ej: 45 cm · 3 mm" className={inputCls} /></label>
            <label className={labelCls}>Color o tono<input maxLength={60} value={d.color} onChange={(e) => set("color", e.target.value)} placeholder="Ej: Dorado" className={inputCls} /></label>
            <label className={labelCls}>Peso en gramos (para envíos)<input inputMode="decimal" value={d.weight_grams} onChange={(e) => set("weight_grams", e.target.value)} placeholder="Ej: 6" className={inputCls} /></label>
            <label className={`${labelCls} sm:col-span-2`}>Palabras para encontrarlo (separadas por coma)<input maxLength={300} value={d.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Ej: regalo, mamá, minimalista" className={inputCls} /></label>
          </div>
        </Card>

        <Card title="Dónde aparece" step={7} collapsible summary={whereSummary}>
          <div className="grid gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-ink-3">Destacar</p>
            <label className="flex items-center gap-3 text-[15px]"><input type="checkbox" checked={d.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="size-5 accent-[var(--ink)]" /><Sparkles aria-hidden="true" size={16} className="text-gold-deep" />Mostrar en la portada</label>
            <label className="flex items-center gap-3 text-[15px]"><input type="checkbox" checked={d.is_new} onChange={(e) => set("is_new", e.target.checked)} className="size-5 accent-[var(--ink)]" />Marcar como nuevo</label>
            {d.is_new && <label className={`fade-in ${labelCls}`}>Nuevo hasta (opcional)<input type="date" value={d.new_until} onChange={(e) => set("new_until", e.target.value)} className={inputCls} /></label>}
            <label className="flex items-center gap-3 text-[15px]"><input type="checkbox" checked={d.is_on_sale} onChange={(e) => set("is_on_sale", e.target.checked)} className="size-5 accent-[var(--ink)]" />Incluir en Ofertas</label>
          </div>
          {mainCats.length > 1 && (
            <div className="mt-5 grid gap-2">
              <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-ink-3">También aparece en</p>
              {mainCats.filter((c) => c.slug !== d.category_slug).map((c) => (
                <label key={c.id} className="flex items-center gap-3 text-[14px]">
                  <input type="checkbox" checked={d.extra_category_slugs.includes(c.slug)} onChange={(e) => set("extra_category_slugs", e.target.checked ? [...d.extra_category_slugs, c.slug] : d.extra_category_slugs.filter((s) => s !== c.slug))} className="size-5 accent-[var(--ink)]" />{c.name}
                </label>
              ))}
            </div>
          )}
          {data.collections.length > 0 && (
            <div className="mt-5 grid gap-2">
              <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-ink-3">Colecciones</p>
              {data.collections.map((c) => (
                <label key={c.id} className="flex items-center gap-3 text-[14px]">
                  <input type="checkbox" checked={d.collection_slugs.includes(c.slug)} onChange={(e) => set("collection_slugs", e.target.checked ? [...d.collection_slugs, c.slug] : d.collection_slugs.filter((s) => s !== c.slug))} className="size-5 accent-[var(--ink)]" />{c.name}
                </label>
              ))}
            </div>
          )}
        </Card>
        <Card title="Dirección y Google (opcional)" step={8} collapsible summary={`dorata18k.com/${d.category_slug || "categoria"}/${d.slug || "…"}`}>
          <div className="grid gap-4">
            <GooglePreview title={d.seo_title || `${d.name || "Producto"} | D'ORATA`} url={`dorata18k.com › ${d.category_slug || "categoria"} › ${d.slug || "…"}`} description={d.seo_description || d.short_description} />
            <label className={labelCls}>Dirección en la tienda
              <span className="flex h-11 items-center overflow-hidden rounded-[4px] border border-line bg-ivory focus-within:border-gold-deep">
                <span className="max-w-[45%] shrink-0 truncate border-r border-line bg-cream px-3 text-[14px] leading-[44px] text-ink-3">/{d.category_slug || "categoria"}/</span>
                <input maxLength={100} value={d.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value) || e.target.value.toLowerCase()); }} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] outline-none" />
              </span>
              {initial.slug && (d.slug !== initial.slug || d.category_slug !== initial.category_slug) && <span className={helpCls}>La dirección anterior seguirá funcionando y llevará a la nueva.</span>}
            </label>

            <label className={labelCls}>Título en Google<input maxLength={70} value={d.seo_title} onChange={(e) => set("seo_title", e.target.value)} className={inputCls} />
              <span className={`${helpCls} flex justify-between gap-2`}><span>Vacío: “{d.name || "Producto"} | D&apos;ORATA”.</span><span className="tabular">{d.seo_title.length}/70</span></span>
            </label>
            <label className={labelCls}>Descripción en Google<textarea maxLength={160} value={d.seo_description} onChange={(e) => set("seo_description", e.target.value)} className={`min-h-20 ${areaCls}`} />
              <span className={`${helpCls} flex justify-between gap-2`}><span>Vacío: se usa la frase corta.</span><span className="tabular">{d.seo_description.length}/160</span></span>
            </label>
          </div>
        </Card>
      </div>

      <div className="order-1 grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6 lg:order-none lg:sticky lg:top-6">
        <Card title="Estado" step={1}>
          <fieldset className="grid gap-2">
            <legend className="sr-only">Estado del producto</legend>
            {STATUS.map((s) => (
              <label key={s.value} className="flex cursor-pointer gap-3 rounded-[4px] border border-line p-3 transition-colors has-[:checked]:border-ink has-[:checked]:bg-ivory">
                <input type="radio" name="status" checked={d.status === s.value} onChange={() => set("status", s.value)}
                  disabled={s.value === "active" && (data.kit?.role === "set_component" || (data.kit?.role === "set_base" && !data.kit.current))} className="mt-1 accent-[var(--ink)] disabled:opacity-40" />
                <span><span className="block text-[15px] font-semibold">{s.label}</span><span className="block text-[13px] text-ink-2">{s.help}</span></span>
              </label>
            ))}
          </fieldset>
          {d.status === "active" && data.media.length === 0 && d.id && <p className="fade-in mt-3 text-[13px] text-gold-deep">Aún no tiene fotos: en la tienda se verá una ilustración en su lugar.</p>}
          {data.kit?.role === "set_base" && !data.kit.current && <p className="mt-3 text-[13px] text-gold-deep">Para publicarlo, primero asígnale su dije.</p>}
          {data.kit?.role === "set_component" && <p className="mt-3 text-[13px] text-ink-2">Los dijes reservados para sets no se publican solos.</p>}
        </Card>
      </div>

      <SaveBar dirty={dirty} status={msg ? <StatusText ok={msg.ok}>{msg.text}</StatusText> : undefined}>
        <button type="submit" disabled={pending} className={`${btnPrimary} ${celebrate ? "shine" : ""}`}>
          {pending ? <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <Check aria-hidden="true" size={16} />}
          {d.id ? "Guardar" : "Crear producto"}
        </button>
      </SaveBar>
    </form>
  );
}
