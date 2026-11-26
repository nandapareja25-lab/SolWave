"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Menu as MenuIcon } from "lucide-react";
import { moveCategory, toggleCategory } from "@/app/admin/(panel)/categorias/actions";

type C = { id: string; name: string; slug: string; visible: boolean; nav: boolean; auto: string | null; products: number; warranty: string | null; image: string | null };
const icon = "press grid size-11 place-items-center rounded-full border border-line disabled:opacity-30";

export function CategoryRow({ c, first, last }: { c: C; first: boolean; last: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; message: string } | null>) => start(async () => {
    const r = await fn(); setErr(r && !r.ok ? r.message : null); router.refresh();
  });
  return (
    <li className={`rounded-[4px] border border-line bg-surface p-3 ${pending ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-gold/40 bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel */}
          {c.image ? <img src={c.image} alt="" width={56} height={56} className="size-full object-cover" /> : <span className="font-display text-[20px] text-gold-deep">{c.name[0]}</span>}
        </div>
        <Link href={`/admin/categorias/${c.id}`} className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-semibold">{c.name}</span>
          <span className="block truncate text-[13px] text-ink-2">
            {c.auto ? (c.auto === "new" ? "Automática: novedades" : "Automática: ofertas") : `${c.products} ${c.products === 1 ? "producto" : "productos"}`}
            {" · "}{c.warranty ?? "sin garantía asignada"}
          </span>
          <span className="mt-1 flex flex-wrap gap-1">
            {!c.visible && <span className="rounded-full bg-line/60 px-2 text-[12px] text-ink-2">Oculta</span>}
            {c.visible && !c.nav && <span className="rounded-full bg-line/60 px-2 text-[12px] text-ink-2">Fuera del menú</span>}
          </span>
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" aria-label={`Subir ${c.name}`} disabled={first || pending} onClick={() => run(() => moveCategory(c.id, -1))} className={icon}><ArrowUp aria-hidden="true" size={16} /></button>
        <button type="button" aria-label={`Bajar ${c.name}`} disabled={last || pending} onClick={() => run(() => moveCategory(c.id, 1))} className={icon}><ArrowDown aria-hidden="true" size={16} /></button>
        <button type="button" disabled={pending} onClick={() => run(() => toggleCategory(c.id, "is_visible", !c.visible))} className="press inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-[14px]">
          {c.visible ? <EyeOff aria-hidden="true" size={15} /> : <Eye aria-hidden="true" size={15} />}{c.visible ? "Ocultar" : "Mostrar"}
        </button>
        {c.visible && (
          <button type="button" disabled={pending} onClick={() => run(() => toggleCategory(c.id, "show_in_nav", !c.nav))} className="press inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-[14px]">
            <MenuIcon aria-hidden="true" size={15} />{c.nav ? "Quitar del menú" : "Poner en el menú"}
          </button>
        )}
      </div>
      {err && <p role="alert" className="mt-2 text-[14px] text-danger">{err}</p>}
    </li>
  );
}
