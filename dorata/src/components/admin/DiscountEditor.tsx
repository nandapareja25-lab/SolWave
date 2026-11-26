"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search, Trash2 } from "lucide-react";
import { deleteDiscount, saveDiscount, type DiscountInput } from "@/app/admin/(panel)/descuentos/actions";
import { DateTimeField } from "./DateTimeField";
import { Card, PageHeader, SaveBar, StatusText, btnPrimary, helpCls, inputCls, labelCls } from "./ui";
import { useUnsavedGuard } from "./useUnsavedGuard";
import { useSaveShortcut } from "./useSaveShortcut";

const TYPES = [
  { value: "percentage", label: "Porcentaje", help: "Ej: 15% menos." },
  { value: "fixed_amount", label: "Monto fijo", help: "Ej: $10 menos." },
  { value: "free_shipping", label: "Envío gratis", help: "Solo quita el costo de envío." },
] as const;
const SCOPES = [
  { value: "all", label: "Toda la tienda" }, { value: "categories", label: "Algunas categorías" }, { value: "products", label: "Algunos productos" },
] as const;

/** Resumen en una frase de lo que hace el código (para revisar antes de guardar). */
function summary(d: DiscountInput, cats: number, prods: number) {
  if (!d.code || (d.type !== "free_shipping" && !d.value)) return "Escribe el código y cuánto descuenta para ver aquí el resumen.";
  const v = d.type === "percentage" ? `${d.value || "?"}% de descuento` : d.type === "fixed_amount" ? `$${d.value || "?"} de descuento` : "Envío gratis";
  const where = d.scope === "all" ? "en toda la tienda" : d.scope === "categories" ? `en ${cats} categoría(s)` : `en ${prods} producto(s)`;
  const extra = [d.min_subtotal && `con compras desde $${d.min_subtotal}`, d.first_order_only && "solo en la primera compra", d.usage_limit_per_customer && `máximo ${d.usage_limit_per_customer} vez/veces por clienta`].filter(Boolean).join(", ");
  return `${d.code || "EL CÓDIGO"}: ${v} ${where}${extra ? `, ${extra}` : ""}.`;
}

export function DiscountEditor({ initial, timezone, timesUsed, categories, products }: {
  initial: DiscountInput; timezone: string; timesUsed: number;
  categories: { id: string; name: string }[]; products: { id: string; name: string; draft: boolean }[];
}) {
  const router = useRouter();
  const [d, setD] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [q, setQ] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(d) !== saved;
  useUnsavedGuard(dirty);
  const formRef = useRef<HTMLFormElement>(null);
  useSaveShortcut(formRef);
  const set = <K extends keyof DiscountInput>(k: K, v: DiscountInput[K]) => { setMsg(null); setD((x) => ({ ...x, [k]: v })); };
  const toggleIn = (k: "category_ids" | "product_ids", id: string, on: boolean) => set(k, on ? [...d[k], id] : d[k].filter((x) => x !== id));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await saveDiscount(d);
      if (!r) return;
      setMsg({ ok: r.ok, text: r.message });
      if (!r.ok) return;
      const next = { ...d, id: r.id ?? d.id, code: d.code.toUpperCase() };
      setSaved(JSON.stringify(next)); setD(next);
      if (!d.id && r.id) router.replace(`/admin/descuentos/${r.id}`);
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="lg:col-span-2">
        <PageHeader eyebrow="Descuentos" title={d.code || "Nuevo código"}
          description={initial.id ? `${timesUsed} ${timesUsed === 1 ? "uso" : "usos"} · ${d.is_active ? "activo" : "inactivo"}` : "Elige el código, cuánto descuenta y dónde aplica."} />
      </div>
      <div className="order-2 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:order-none">
        <Card title="El código" step={1}>
          <div className="grid gap-4">
            <label className={labelCls}>Código que escribe la clienta
              <input required maxLength={32} value={d.code} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} placeholder="Ej: NAVIDAD15" className={`${inputCls} uppercase tabular tracking-[.08em]`} />
              <span className={helpCls}>Letras y números, sin espacios.</span>
            </label>
            <label className={labelCls}>Nota interna (opcional)<input maxLength={200} value={d.description} onChange={(e) => set("description", e.target.value)} placeholder="Ej: Para clientas de Instagram en diciembre" className={inputCls} /></label>
          </div>
        </Card>
        <Card title="Cuánto descuenta" step={2}>
          <fieldset className="grid gap-2 sm:grid-cols-3">
            <legend className="sr-only">Tipo de descuento</legend>
            {TYPES.map((t) => (
              <label key={t.value} className="flex cursor-pointer gap-3 rounded-[4px] border border-line p-3 transition-colors has-[:checked]:border-ink has-[:checked]:bg-ivory">
                <input type="radio" name="type" checked={d.type === t.value} onChange={() => set("type", t.value)} className="mt-1 accent-[var(--ink)]" />
                <span><span className="block text-[15px] font-semibold">{t.label}</span><span className="block text-[13px] text-ink-2">{t.help}</span></span>
              </label>
            ))}
          </fieldset>
          {d.type !== "free_shipping" && (
            <label className={`fade-in mt-4 ${labelCls}`}>{d.type === "percentage" ? "Porcentaje" : "Monto en dólares"}
              <span className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">{d.type === "percentage" ? "%" : "$"}</span>
                <input inputMode="decimal" value={d.value} onChange={(e) => set("value", e.target.value)} placeholder={d.type === "percentage" ? "15" : "10"} className={`${inputCls} pl-8 tabular`} />
              </span>
            </label>
          )}
        </Card>
        <Card title="Dónde aplica" step={3}>
          <div className="mb-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Dónde aplica">
            {SCOPES.map((sc) => (
              <button key={sc.value} type="button" role="radio" aria-checked={d.scope === sc.value} onClick={() => set("scope", sc.value)}
                className={`press inline-flex h-10 items-center rounded-full border px-4 text-[14px] ${d.scope === sc.value ? "border-ink bg-ink font-semibold text-on-dark" : "border-line"}`}>{sc.label}</button>
            ))}
          </div>
          {d.scope === "categories" && (
            <div className="fade-in grid gap-2 sm:grid-cols-2">
              {categories.map((c) => (
                <label key={c.id} className="flex min-h-11 items-center gap-3 text-[14px]"><input type="checkbox" checked={d.category_ids.includes(c.id)} onChange={(e) => toggleIn("category_ids", c.id, e.target.checked)} className="size-5 accent-[var(--ink)]" />{c.name}</label>
              ))}
            </div>
          )}
          {d.scope === "products" && (
            <div className="fade-in grid gap-2">
              <label className="relative">
                <span className="sr-only">Buscar producto</span>
                <Search aria-hidden="true" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto" className={`${inputCls} pl-9`} />
              </label>
              {products.length === 0 ? <p className="text-[14px] text-ink-2">Aún no hay productos.</p> : (
                <div className="max-h-72 overflow-y-auto rounded-[4px] border border-line p-2">
                  {products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase())).map((p) => (
                    <label key={p.id} className="flex min-h-11 items-center gap-3 text-[14px]">
                      <input type="checkbox" checked={d.product_ids.includes(p.id)} onChange={(e) => toggleIn("product_ids", p.id, e.target.checked)} className="size-5 accent-[var(--ink)]" />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>{p.draft && <span className="rounded-[4px] bg-line/60 px-1.5 text-[11px] text-ink-2">Borrador</span>}
                    </label>
                  ))}
                </div>
              )}
              <span className={helpCls}>{d.product_ids.length} seleccionado(s)</span>
            </div>
          )}
        </Card>
        <Card title="Condiciones (opcional)" step={4} collapsible defaultOpen={!!(d.min_subtotal || d.starts_at || d.ends_at || d.usage_limit || d.usage_limit_per_customer || d.first_order_only)}
          summary={[d.min_subtotal && `Desde $${d.min_subtotal}`, d.first_order_only && "Primera compra", d.ends_at && "Con fecha de fin", d.usage_limit && `${d.usage_limit} usos`].filter(Boolean).join(" · ") || "Sin condiciones"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelCls}>Compra mínima (USD)<span className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">$</span><input inputMode="decimal" value={d.min_subtotal} onChange={(e) => set("min_subtotal", e.target.value)} placeholder="Sin mínimo" className={`${inputCls} pl-7 tabular`} /></span></label>
            <label className="flex items-center gap-3 self-end text-[15px] sm:min-h-11"><input type="checkbox" checked={d.first_order_only} onChange={(e) => set("first_order_only", e.target.checked)} className="size-5 accent-[var(--ink)]" />Solo en la primera compra</label>
            <DateTimeField label="Válido desde" value={d.starts_at} onChange={(v) => set("starts_at", v)} timezone={timezone} emptyText="Vacío: desde que lo actives." />
            <DateTimeField label="Válido hasta" value={d.ends_at} onChange={(v) => set("ends_at", v)} timezone={timezone} emptyText="Vacío: sin fecha de fin." />
            <label className={labelCls}>Usos en total<input inputMode="numeric" value={d.usage_limit} onChange={(e) => set("usage_limit", e.target.value.replace(/\D/g, ""))} placeholder="Sin límite" className={`${inputCls} tabular`} /></label>
            <label className={labelCls}>Usos por clienta<input inputMode="numeric" value={d.usage_limit_per_customer} onChange={(e) => set("usage_limit_per_customer", e.target.value.replace(/\D/g, ""))} placeholder="Sin límite" className={`${inputCls} tabular`} /></label>
          </div>
        </Card>
      </div>
      <div className="order-1 grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6 lg:order-none lg:sticky lg:top-6">
        <Card title="Estado" step={1}>
          <label className="flex cursor-pointer items-start gap-3 text-[15px]">
            <input type="checkbox" checked={d.is_active} onChange={(e) => set("is_active", e.target.checked)} className="mt-0.5 size-5 accent-[var(--ink)]" />
            <span><span className="font-semibold">Activo</span><span className={`block ${helpCls}`}>Inactivo, el código no funciona aunque alguien lo escriba.</span></span>
          </label>
          <p className="mt-4 rounded-[4px] bg-ivory p-3 text-[14px]">{summary(d, d.category_ids.length, d.product_ids.length)}</p>
        </Card>
        {d.id && timesUsed === 0 && (
          confirmDelete ? (
            <div className="fade-in grid gap-2 text-[14px]">
              <p>¿Eliminar este código para siempre?</p>
              <div className="flex gap-2">
                <button type="button" disabled={pending} onClick={() => start(async () => { const r = await deleteDiscount(d.id); if (r?.ok) { setSaved(JSON.stringify(d)); router.replace("/admin/descuentos"); } else if (r) setMsg({ ok: false, text: r.message }); })} className="press inline-flex h-11 items-center rounded-full border border-danger px-4 text-danger">Sí, eliminar</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="press inline-flex h-11 items-center rounded-full border border-line px-4">Cancelar</button>
              </div>
            </div>
          ) : <button type="button" onClick={() => setConfirmDelete(true)} className="press inline-flex h-11 w-fit items-center gap-2 text-[14px] text-danger"><Trash2 aria-hidden="true" size={15} />Eliminar código</button>
        )}
      </div>
      <SaveBar dirty={dirty} status={msg ? <StatusText ok={msg.ok}>{msg.text}</StatusText> : !d.id ? <span className="text-ink-3">Aún no está creado</span> : undefined}>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <Check aria-hidden="true" size={16} />}{d.id ? "Guardar código" : d.is_active ? "Crear código" : "Crear código (inactivo)"}
        </button>
      </SaveBar>
    </form>
  );
}
