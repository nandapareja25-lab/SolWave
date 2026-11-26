"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus } from "lucide-react";
import { adjustStock } from "@/app/admin/(panel)/inventario/actions";
import { StatusText, inputCls, labelCls } from "./ui";

type R = { variantId: string; productId: string; product: string; sku: string; title: string; onHand: number; reserved: number; available: number; low: boolean; threshold: number };
const KINDS = [
  { value: "restock", label: "Llegó mercancía", qty: "¿Cuántas llegaron?", reason: false },
  { value: "count", label: "Conté y hay otra cantidad", qty: "¿Cuántas hay en total?", reason: true },
  { value: "damage", label: "Dañadas o perdidas", qty: "¿Cuántas sacas?", reason: true },
  { value: "return", label: "Devolución que se puede vender", qty: "¿Cuántas vuelven?", reason: false },
] as const;

export function StockRow({ r, single = false }: { r: R; single?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof KINDS)[number]["value"]>("restock");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [undo, setUndo] = useState<{ before: number } | null>(null);
  useEffect(() => { if (!undo) return; const t = setTimeout(() => setUndo(null), 8000); return () => clearTimeout(t); }, [undo]);
  const k = KINDS.find((x) => x.value === kind)!;
  const step = (n: number) => { setMsg(null); setQty((q) => String(Math.max(0, (Number(q) || 0) + n))); };
  const preview = qty === "" ? null : kind === "count" ? Number(qty) : kind === "damage" ? r.onHand - Number(qty) : r.onHand + Number(qty);

  function save() {
    start(async () => {
      const res = await adjustStock({ variant_id: r.variantId, kind, quantity: qty === "" ? -1 : Number(qty), reason });
      if (!res) return;
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) { setUndo({ before: r.onHand }); setOpen(false); setQty(""); setReason(""); router.refresh(); }
    });
  }

  function revert() {
    if (!undo) return;
    const before = undo.before; setUndo(null);
    start(async () => {
      const res = await adjustStock({ variant_id: r.variantId, kind: "count", quantity: before, reason: "Se deshizo el ajuste anterior" });
      setMsg(res ? { ok: res.ok, text: res.ok ? `Deshecho: vuelves a tener ${before}.` : res.message } : null);
      router.refresh();
    });
  }

  return (
    <li className="min-w-0 p-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          {!single && <p className="truncate text-[15px] font-medium">{r.title}</p>}
          <p className="truncate text-[12px] text-ink-3">{single ? `Código ${r.sku}` : r.sku}</p>
          {r.reserved > 0 && <p className="text-[12px] text-ink-3">{r.onHand} en total · {r.reserved} apartadas en compras</p>}
        </div>
        {!open && <button type="button" aria-label={`Ajustar unidades de ${r.product}${r.title === "Única" ? "" : ` (${r.title})`}`} onClick={() => setOpen(true)} className="press inline-flex h-11 shrink-0 items-center rounded-full border border-line px-4 text-[14px]">Ajustar</button>}
        <div className="w-[92px] shrink-0 text-right">
          <p className={`font-display text-[22px] leading-none tabular ${r.available === 0 ? "text-danger" : r.low ? "text-gold-deep" : ""}`}>{r.available}</p>
          <p className="text-[12px] text-ink-2">{r.available === 0 ? "agotada" : r.low ? (r.available === 1 ? "queda 1" : "quedan pocas") : r.available === 1 ? "disponible" : "disponibles"}</p>
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
          <label className={labelCls}>{k.qty}
            <span className="flex items-center gap-2">
              <button type="button" aria-label="Una menos" onClick={() => step(-1)} className="press grid size-11 shrink-0 place-items-center rounded-full border border-line"><Minus aria-hidden="true" size={16} /></button>
              <input inputMode="numeric" value={qty} onChange={(e) => { setQty(e.target.value.replace(/\D/g, "")); setMsg(null); }} placeholder="Ej: 3" className={`${inputCls} text-center tabular`} />
              <button type="button" aria-label="Una más" onClick={() => step(1)} className="press grid size-11 shrink-0 place-items-center rounded-full border border-line"><Plus aria-hidden="true" size={16} /></button>
            </span>
          </label>
          {k.reason && <label className={labelCls}>Motivo<input maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={kind === "count" ? "Ej: conteo de fin de mes" : "Ej: el broche llegó roto"} className={inputCls} /></label>}
          {preview !== null && <p className={`text-[13px] ${preview < r.reserved || preview < 0 ? "text-danger" : "text-ink-2"}`}>Pasarás de <strong className="tabular">{r.onHand}</strong> a <strong className="tabular">{preview}</strong> unidades.</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={save} disabled={pending || qty === ""} className="press inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-semibold text-on-dark disabled:bg-line disabled:text-ink-3">
              {pending && <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" />}Guardar ajuste
            </button>
            <button type="button" onClick={() => { setOpen(false); setMsg(null); }} className="press h-11 rounded-full border border-line px-4 text-[14px]">Cancelar</button>
            {qty === "" && <span className="text-[12px] text-ink-3">Escribe cuántas para guardar.</span>}
          </div>
          {msg && !msg.ok && <StatusText ok={false}>{msg.text}</StatusText>}
        </div>
      ) : (
        (msg || undo) ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {msg && <StatusText ok={msg.ok}>{msg.text}</StatusText>}
            {undo && <button type="button" onClick={revert} className="press h-11 rounded-full px-3 text-[14px] font-semibold text-ink underline underline-offset-4">Deshacer</button>}
          </div>
        ) : null
      )}
    </li>
  );
}
