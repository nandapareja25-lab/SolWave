"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { saveVariantCost } from "@/app/admin/(panel)/productos/actions";
import { formatUSD } from "@/lib/money";
import { Card, StatusText, btnQuiet, collectFields, helpCls, inputCls, labelCls } from "./ui";

export type CostInfo = { currency: string; amount: number; fx: number | null; totalCents: number | null; since: string };

/** Costo por variante (en pesos colombianos o dólares) y margen bruto. Solo lo ven dueña y administración. */
export function VariantCosts({ variants, costs, fx, minMargin, targetMargin }: { variants: { id: string; title: string; priceCents: number }[]; costs: Record<string, CostInfo>; fx: number | null; minMargin: number | null; targetMargin: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function submit(container: Element | null, variantId: string) {
    const f = collectFields(container);
    const g = (k: string) => f[k] ?? "";
    start(async () => {
      const r = await saveVariantCost({ variant_id: variantId, currency: g("currency") as "COP" | "USD", amount: g("amount"), intl_shipping: g("intl_shipping"), packaging: g("packaging"), other: g("other"), supplier_id: "", notes: g("notes") });
      setMsg(r ? { ok: r.ok, text: r.message } : null);
      if (r?.ok) { setOpen(null); router.refresh(); }
    });
  }

  return (
    <Card title="Costo y ganancia" step={3} aside={<span className={helpCls}>Solo lo ves tú</span>}>
      <p className="mb-4 text-[13px] text-ink-2">
        {fx ? <>Tasa de cambio: <strong className="tabular text-ink">{fx.toLocaleString("es-US")} pesos</strong> por 1 dólar (se cambia en Configuración).</> : <span className="text-gold-deep">Tus costos en pesos quedan guardados; para verlos en dólares y calcular la ganancia, escribe la tasa de cambio en <Link href="/admin/configuracion" className="font-semibold underline underline-offset-4">Configuración › Tienda</Link>.</span>}
      </p>
      <ul className="grid gap-3">
        {variants.map((v) => {
          const c = costs[v.id];
          const margin = c && c.totalCents != null && v.priceCents > 0 ? Math.round(((v.priceCents - c.totalCents) / v.priceCents) * 100) : null;
          return (
            <li key={v.id} className="rounded-[4px] border border-line p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">{v.title}</p>
                  {c ? (
                    <p className="text-[13px] text-ink-2">
                      {c.totalCents != null ? <>Costo total <strong className="tabular text-ink">{formatUSD(c.totalCents)}</strong>{c.currency === "COP" ? ` · ${c.amount.toLocaleString("es-CO")} COP a ${c.fx?.toLocaleString("es-CO")}` : ""}</>
                        : <>Costo <strong className="tabular text-ink">{c.amount.toLocaleString("es-CO")} COP</strong> · en dólares: pendiente de la tasa de cambio</>}
                    </p>
                  ) : <p className="text-[13px] text-gold-deep">Sin costo registrado</p>}
                </div>
                {margin !== null && (
                  <div className="text-right">
                    <p className={`font-display text-[28px] leading-none tabular ${minMargin !== null && margin < minMargin ? "text-danger" : targetMargin !== null && margin >= targetMargin ? "text-success" : "text-ink"}`}>{margin}%</p>
                    <p className={helpCls}>{minMargin !== null && margin < minMargin ? `bajo tu mínimo (${minMargin}%)` : "de ganancia"}</p>
                  </div>
                )}
              </div>
              {open === v.id ? (
                <div role="group" aria-label={`Costo de ${v.title}`} className="fade-in mt-3 grid gap-3 border-t border-line pt-3"
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") { e.preventDefault(); submit(e.currentTarget, v.id); } }}>
                  <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
                    <label className={labelCls}>Moneda<select name="currency" defaultValue={fx ? "COP" : "USD"} className={inputCls}><option value="COP">Pesos (COP)</option><option value="USD">Dólares</option></select></label>
                    <label className={labelCls}>Lo que pagaste por la pieza<input name="amount" inputMode="decimal" placeholder="Ej: 85.000" className={`${inputCls} tabular`} /></label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className={labelCls}>Envío a EE. UU. (USD)<input name="intl_shipping" inputMode="decimal" placeholder="0.00" className={`${inputCls} tabular`} /></label>
                    <label className={labelCls}>Empaque (USD)<input name="packaging" inputMode="decimal" placeholder="0.00" className={`${inputCls} tabular`} /></label>
                    <label className={labelCls}>Otros (USD)<input name="other" inputMode="decimal" placeholder="0.00" className={`${inputCls} tabular`} /></label>
                  </div>
                  <label className={labelCls}>Nota (opcional)<input name="notes" maxLength={300} placeholder="Ej: Compra de noviembre, proveedor Medellín" className={inputCls} /></label>
                  <div className="flex gap-2">
                    <button type="button" onClick={(e) => submit(e.currentTarget.closest('[role="group"]'), v.id)} disabled={pending} className="press inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-semibold text-on-dark disabled:opacity-60">
                      {pending && <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" />}Guardar costo
                    </button>
                    <button type="button" onClick={() => setOpen(null)} className="press h-11 rounded-full border border-line px-4 text-[14px]">Cancelar</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => { setOpen(v.id); setMsg(null); }} className={`${btnQuiet} mt-3`}><Plus aria-hidden="true" size={15} />Registrar costo</button>
              )}
            </li>
          );
        })}
      </ul>
      <p className={`mt-3 ${helpCls}`}>Ganancia = lo que queda del precio después de pagar la pieza, su envío y empaque. Todavía no descuenta la comisión del pago ni el envío al cliente.</p>
      {msg && <div className="mt-2"><StatusText ok={msg.ok}>{msg.text}</StatusText></div>}
    </Card>
  );
}
