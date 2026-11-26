"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { adjustStock } from "@/app/admin/(panel)/inventario/actions";
import { StatusText, inputCls, labelCls } from "./ui";

type R = { variantId: string; productId: string; product: string; sku: string; title: string; onHand: number; reserved: number; available: number; low: boolean; threshold: number };
const KINDS = [
  { value: "restock", label: "Llegó mercancía", qty: "¿Cuántas llegaron?", reason: false },
  { value: "count", label: "Conté y hay otra cantidad", qty: "¿Cuántas hay en total?", reason: true },
  { value: "damage", label: "Dañadas o perdidas", qty: "¿Cuántas sacas?", reason: true },
  { value: "return", label: "Devolución que se puede vender", qty: "¿Cuántas vuelven?", reason: false },
] as const;

export function StockRow({ r }: { r: R }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof KINDS)[number]["value"]>("restock");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const k = KINDS.find((x) => x.value === kind)!;
  const preview = qty === "" ? null : kind === "count" ? Number(qty) : kind === "damage" ? r.onHand - Number(qty) : r.onHand + Number(qty);

  function save() {
    start(async () => {
      const res = await adjustStock({ variant_id: r.variantId, kind, quantity: qty === "" ? -1 : Number(qty), reason });
      if (!res) return;
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) { setOpen(false); setQty(""); setReason(""); router.refresh(); }
    });
  }

  return (
    <li className="min-w-0 rounded-[4px] border border-line bg-surface p-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link href={`/admin/productos/${r.productId}`} className="block truncate text-[15px] font-semibold underline-offset-4 hover:underline">{r.product}</Link>
          <p className="truncate text-[13px] text-ink-2">{r.title} · {r.sku}</p>
          {r.reserved > 0 && <p className="text-[12px] text-ink-3">{r.onHand} en total · {r.reserved} apartadas en compras</p>}
        </div>
        <div className="text-right">
          <p className={`font-display text-[28px] leading-none tabular ${r.available === 0 ? "text-danger" : r.low ? "text-gold-deep" : ""}`}>{r.available}</p>
          <p className="text-[12px] text-ink-2">{r.available === 0 ? "agotada" : r.low ? "quedan pocas" : "disponibles"}</p>
        </div>
      </div>
      {open ? (
        <div className="fade-in mt-3 grid gap-3 border-t border-line pt-3">
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-[13px] font-medium text-ink-2">¿Qué pasó?</legend>
            <div className="grid grid-cols-2 gap-2">
              {KINDS.map((x) => (
                <label key={x.value} className="flex min-h-11 cursor-pointer items-center rounded-[4px] border border-line px-3 py-2 text-[13px] has-[:checked]:border-ink has-[:checked]:bg-ivory has-[:checked]:font-semibold">
                  <input type="radio" name={`kind-${r.variantId}`} checked={kind === x.value} onChange={() => { setKind(x.value); setMsg(null); }} className="sr-only" />{x.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className={labelCls}>{k.qty}<input inputMode="numeric" value={qty} onChange={(e) => { setQty(e.target.value.replace(/\D/g, "")); setMsg(null); }} className={`${inputCls} tabular`} /></label>
          {k.reason && <label className={labelCls}>Motivo<input maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={kind === "count" ? "Ej: conteo de fin de mes" : "Ej: el broche llegó roto"} className={inputCls} /></label>}
          {preview !== null && <p className={`text-[13px] ${preview < r.reserved || preview < 0 ? "text-danger" : "text-ink-2"}`}>Pasarás de <strong className="tabular">{r.onHand}</strong> a <strong className="tabular">{preview}</strong> unidades.</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={save} disabled={pending || qty === ""} className="press inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-semibold text-on-dark disabled:opacity-60">
              {pending && <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" />}Guardar ajuste
            </button>
            <button type="button" onClick={() => { setOpen(false); setMsg(null); }} className="press h-11 rounded-full border border-line px-4 text-[14px]">Cancelar</button>
          </div>
          {msg && !msg.ok && <StatusText ok={false}>{msg.text}</StatusText>}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setOpen(true)} className="press inline-flex h-10 items-center rounded-full border border-line px-4 text-[14px]">Ajustar unidades</button>
          {msg && <StatusText ok={msg.ok}>{msg.text}</StatusText>}
        </div>
      )}
    </li>
  );
}
