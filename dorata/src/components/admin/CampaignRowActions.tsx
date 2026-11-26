"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Power, Trash2 } from "lucide-react";
import { deleteCampaign, setCampaignActive } from "@/app/admin/(panel)/configuracion/banner/actions";

const btn = "press inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[14px] disabled:opacity-60";

export function CampaignRowActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; message: string } | null>) => start(async () => {
    const r = await fn();
    if (r) setMsg({ ok: r.ok, text: r.message });
    router.refresh();
  });

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Link href={`/admin/configuracion/banner/${id}`} className={btn}><Pencil aria-hidden="true" size={15} />Editar</Link>
      <button type="button" disabled={pending} onClick={() => run(() => setCampaignActive(id, !active))} className={btn}>
        {pending ? <Loader2 aria-hidden="true" size={15} className="animate-spin motion-reduce:animate-none" /> : <Power aria-hidden="true" size={15} />}
        {active ? "Desactivar" : "Activar"}
      </button>
      {confirm ? (
        <span className="flex items-center gap-2 text-[14px]">
          ¿Eliminar para siempre?
          <button type="button" disabled={pending} onClick={() => run(() => deleteCampaign(id))} className={`${btn} border-danger text-danger`}>Sí, eliminar</button>
          <button type="button" onClick={() => setConfirm(false)} className={btn}>No</button>
        </span>
      ) : (
        <button type="button" onClick={() => setConfirm(true)} className={`${btn} text-danger`}><Trash2 aria-hidden="true" size={15} />Eliminar</button>
      )}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-[14px] ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
    </div>
  );
}
