"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronRight, ChevronsDown, ChevronsUp, Eye, EyeOff, Menu as MenuIcon, MoreHorizontal, Pencil, X } from "lucide-react";
import { setCategoryOrder, toggleCategory } from "@/app/admin/(panel)/categorias/actions";

export type CategoryItem = { id: string; name: string; visible: boolean; nav: boolean; auto: string | null; products: number; warranty: string | null; image: string | null };
const iconBtn = "press grid size-11 place-items-center rounded-full border border-line disabled:opacity-30";
const menuItem = "flex min-h-11 w-full items-center gap-3 px-4 text-left text-[14px] hover:bg-ivory disabled:opacity-40";

/** Lista ordenable: el cambio se ve al instante y se guarda detrás; cada cambio de visibilidad se puede deshacer. */
export function CategoryList({ items }: { items: CategoryItem[] }) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [synced, setSynced] = useState(items);
  if (items !== synced) { setSynced(items); setList(items); } // datos nuevos del servidor
  const [, start] = useTransition();
  const [toast, setToast] = useState<{ text: string; ok: boolean; undo?: () => void } | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 7000); return () => clearTimeout(t); }, [toast]);

  function move(id: string, to: "up" | "down" | "first" | "last") {
    const i = list.findIndex((c) => c.id === id);
    const next = [...list]; const [item] = next.splice(i, 1);
    const j = to === "first" ? 0 : to === "last" ? next.length : to === "up" ? Math.max(0, i - 1) : Math.min(next.length, i + 1);
    next.splice(j, 0, item!);
    const prev = list;
    setList(next);
    start(async () => {
      const r = await setCategoryOrder(next.map((c) => c.id));
      if (!r?.ok) { setList(prev); setToast({ ok: false, text: r?.message ?? "No se pudo guardar el orden." }); }
      else setToast({ ok: true, text: `${item!.name}: orden guardado.` });
    });
  }

  function toggle(c: CategoryItem, field: "is_visible" | "show_in_nav") {
    const key = field === "is_visible" ? "visible" : "nav";
    const value = !c[key];
    const apply = (v: boolean) => setList((l) => l.map((x) => (x.id === c.id ? { ...x, [key]: v } : x)));
    apply(value);
    start(async () => {
      const r = await toggleCategory(c.id, field, value);
      if (!r?.ok) { apply(!value); setToast({ ok: false, text: r?.message ?? "No se pudo cambiar." }); return; }
      const text = field === "is_visible" ? (value ? `${c.name} ya se ve en la tienda.` : `${c.name} quedó oculta.`) : (value ? `${c.name} vuelve al menú.` : `${c.name} salió del menú.`);
      setToast({ ok: true, text, undo: () => { apply(!value); start(async () => { await toggleCategory(c.id, field, !value); setToast(null); router.refresh(); }); } });
      router.refresh();
    });
  }

  if (list.length === 0) {
    return (
      <div className="filete-doble rounded-[4px] border border-line bg-surface p-6 text-center">
        <p className="font-display text-[22px]">Aún no hay categorías</p>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-ink-2">Las categorías ordenan tu catálogo y forman los círculos de la portada.</p>
        <Link href="/admin/categorias/nueva" className="press mt-4 inline-flex h-11 items-center rounded-full bg-ink px-5 text-[14px] font-semibold text-on-dark">Crear la primera categoría</Link>
      </div>
    );
  }

  return (
    <>
      <ol className="grid grid-cols-[minmax(0,1fr)] gap-3">
        {list.map((c, i) => (
          <li key={c.id} className="rise min-w-0 rounded-[4px] border border-line bg-surface" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
            <div className="flex items-center gap-2 p-3">
              <Link href={`/admin/categorias/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-gold/40 bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel */}
                  {c.image ? <img src={c.image} alt="" width={56} height={56} className="size-full object-cover" /> : <span className="font-display text-[20px] text-gold-deep">{c.name[0]}</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold">{c.name}</span>
                  <span className="block truncate text-[13px] text-ink-2">
                    {c.auto ? (c.auto === "new" ? "Automática: novedades" : "Automática: ofertas") : `${c.products} ${c.products === 1 ? "producto" : "productos"}`} · {c.warranty ?? "sin garantía"}
                  </span>
                  {(!c.visible || !c.nav) && (
                    <span className="mt-1 inline-block rounded-full bg-line/60 px-2 text-[12px] text-ink-2">{!c.visible ? "Oculta" : "Fuera del menú"}</span>
                  )}
                </span>
                <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-ink-3" />
              </Link>
            </div>
            <div className="flex items-center gap-2 border-t border-line px-3 py-2">
              <button type="button" aria-label={`Subir ${c.name}`} disabled={i === 0} onClick={() => move(c.id, "up")} className={iconBtn}><ArrowUp aria-hidden="true" size={16} /></button>
              <button type="button" aria-label={`Bajar ${c.name}`} disabled={i === list.length - 1} onClick={() => move(c.id, "down")} className={iconBtn}><ArrowDown aria-hidden="true" size={16} /></button>
              <span className="flex-1 text-[12px] tabular text-ink-3">Posición {i + 1}</span>
              <details className="relative">
                <summary aria-label={`Más opciones de ${c.name}`} className="press grid size-11 cursor-pointer list-none place-items-center rounded-full border border-line [&::-webkit-details-marker]:hidden"><MoreHorizontal aria-hidden="true" size={18} /></summary>
                <div className="fade-in absolute right-0 bottom-12 z-10 w-60 overflow-hidden rounded-[4px] border border-line bg-surface py-1 shadow-[0_12px_32px_rgb(22_19_15/.14)]"
                  onClick={(e) => (e.currentTarget.parentElement as HTMLDetailsElement).removeAttribute("open")}>
                  <Link href={`/admin/categorias/${c.id}`} className={menuItem}><Pencil aria-hidden="true" size={16} />Editar</Link>
                  <button type="button" disabled={i === 0} onClick={() => move(c.id, "first")} className={menuItem}><ChevronsUp aria-hidden="true" size={16} />Mover al principio</button>
                  <button type="button" disabled={i === list.length - 1} onClick={() => move(c.id, "last")} className={menuItem}><ChevronsDown aria-hidden="true" size={16} />Mover al final</button>
                  <button type="button" onClick={() => toggle(c, "is_visible")} className={menuItem}>{c.visible ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}{c.visible ? "Ocultar de la tienda" : "Mostrar en la tienda"}</button>
                  {c.visible && <button type="button" onClick={() => toggle(c, "show_in_nav")} className={menuItem}><MenuIcon aria-hidden="true" size={16} />{c.nav ? "Quitar del menú y portada" : "Poner en el menú y portada"}</button>}
                </div>
              </details>
            </div>
          </li>
        ))}
      </ol>
      {toast && (
        <div role={toast.ok ? "status" : "alert"} className="fade-in fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center gap-3 rounded-[4px] bg-ink px-4 py-3 text-[14px] text-on-dark shadow-[0_12px_32px_rgb(22_19_15/.25)]">
          <span className="flex-1">{toast.text}</span>
          {toast.undo && <button type="button" onClick={toast.undo} className="press h-10 rounded-full px-3 font-semibold text-gold">Deshacer</button>}
          <button type="button" aria-label="Cerrar aviso" onClick={() => setToast(null)} className="press grid size-10 place-items-center text-on-dark-2"><X aria-hidden="true" size={16} /></button>
        </div>
      )}
    </>
  );
}
