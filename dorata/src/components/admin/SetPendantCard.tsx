"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Link2Off, Loader2 } from "lucide-react";
import { assignPendant } from "@/app/admin/(panel)/productos/actions";
import { Card, StatusText, btnQuiet, helpCls, inputCls, labelCls } from "./ui";

export type PendantOption = { id: string; name: string; costCop: number | null; takenBy: { id: string; name: string } | null };
const cop = (n: number | null) => (n == null ? "sin costo" : `${Math.round(n).toLocaleString("es-CO")} COP`);

/**
 * Cadena que espera su dije: la dueña elige cuál dije va con ella. Nunca se asigna sola.
 * El set no se puede publicar hasta tener dije (regla también en la base de datos).
 */
export function SetPendantCard({ setId, chainCostCop, current, options }: {
  setId: string; chainCostCop: number | null; current: PendantOption | null; options: PendantOption[];
}) {
  const router = useRouter();
  const [choice, setChoice] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const free = options.filter((o) => !o.takenBy);
  const total = current && chainCostCop != null && current.costCop != null ? chainCostCop + current.costCop : null;

  const run = (pendant: string) => start(async () => {
    const r = await assignPendant(setId, pendant);
    setMsg(r ? { ok: r.ok, text: r.message } : null);
    if (r?.ok) { setChoice(""); router.refresh(); }
  });

  return (
    <Card title="Dije del set" step={2} aside={<span className={helpCls}>{current ? "Asignado" : "Pendiente"}</span>}>
      {current ? (
        <div className="grid gap-3">
          <div className="rounded-[4px] border border-gold/50 bg-ivory p-3">
            <Link href={`/admin/productos/${current.id}`} className="text-[15px] font-semibold underline-offset-4 hover:underline">{current.name}</Link>
            <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-[13px]">
              <dt className="text-ink-2">Cadena</dt><dd className="tabular">{cop(chainCostCop)}</dd>
              <dt className="text-ink-2">Dije</dt><dd className="tabular">{cop(current.costCop)}</dd>
              <dt className="font-semibold">Costo del set</dt><dd className="font-semibold tabular">{cop(total)}</dd>
            </dl>
          </div>
          <button type="button" disabled={pending} onClick={() => run("")} className={btnQuiet}>
            {pending ? <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <Link2Off aria-hidden="true" size={16} />}Quitar este dije
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="text-[14px] text-ink-2">Elige qué dije va con esta cadena. El set no se puede publicar hasta tener su dije.</p>
          {free.length === 0 ? (
            <p className="text-[14px] text-gold-deep">No quedan dijes libres: todos están asignados a otros sets.</p>
          ) : (
            <label className={labelCls}>Dije disponible
              <select value={choice} onChange={(e) => { setChoice(e.target.value); setMsg(null); }} className={inputCls}>
                <option value="">Elige un dije</option>
                {free.map((o) => <option key={o.id} value={o.id}>{o.name} · {cop(o.costCop)}</option>)}
              </select>
            </label>
          )}
          <button type="button" disabled={!choice || pending} onClick={() => run(choice)} className={btnQuiet}>
            {pending ? <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <Link2 aria-hidden="true" size={16} />}Asignar dije
          </button>
          <p className={helpCls}>Cadena: {cop(chainCostCop)}. {free.length} {free.length === 1 ? "dije libre" : "dijes libres"}.</p>
        </div>
      )}
      {msg && <div className="mt-3"><StatusText ok={msg.ok}>{msg.text}</StatusText></div>}
    </Card>
  );
}
