"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { deleteMedia, registerMedia, reorderMedia, updateMedia } from "@/app/admin/(panel)/productos/actions";
import { supabaseBrowser } from "@/server/supabase/browser";
import { prepareProductImage } from "./prepare-image";
import { Card, StatusText, collectFields, helpCls, inputCls, labelCls } from "./ui";

export type MediaItem = { id: string; variantId: string; thumb: string; alt: string };
const IMG_ERR: Record<string, string> = {
  IMAGE_TYPE: "usa JPG, PNG, WebP o HEIC", IMAGE_SIZE: "pesa más de 20 MB", IMAGE_TOO_SMALL: "es muy pequeña (mínimo 600 px)",
};
const iconBtn = "press grid size-10 place-items-center rounded-full border border-line bg-surface disabled:opacity-30";

/** Fotos del producto: se reducen en el celular/computador (WebP, sin ubicación GPS), se suben y se ordenan. */
export function ProductPhotos({ productId, storageBase, items, variants, productName }: {
  productId: string; storageBase: string; items: MediaItem[]; variants: { id: string; title: string }[]; productName: string;
}) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [synced, setSynced] = useState(items);
  if (items !== synced) { setSynced(items); setList(items); }
  const [progress, setProgress] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [, start] = useTransition();
  const url = (path: string) => `${storageBase}/storage/v1/object/public/product-media/${path}`;

  async function upload(files: FileList | null) {
    if (!files?.length || !productId) return;
    setMsg(null);
    const sb = supabaseBrowser();
    const errors: string[] = [];
    let added = 0;
    for (const [i, file] of [...files].entries()) {
      setProgress(`Preparando foto ${i + 1} de ${files.length}…`);
      try {
        const prep = await prepareProductImage(file, productId);
        setProgress(`Subiendo foto ${i + 1} de ${files.length}…`);
        for (const b of prep.blobs) {
          const { error } = await sb.storage.from("product-media").upload(b.path, b.blob, { contentType: "image/webp", cacheControl: "31536000" });
          if (error) { await sb.storage.from("product-media").remove(prep.blobs.map((x) => x.path)); throw new Error("UPLOAD"); }
        }
        const r = await registerMedia({ product_id: productId, variant_id: "", storage_path: prep.storagePath, variants: prep.variants, width: prep.width, height: prep.height, dominant_color: prep.dominantColor, alt: productName });
        if (!r?.ok) { await sb.storage.from("product-media").remove(prep.blobs.map((x) => x.path)); throw new Error("REGISTER"); }
        added++;
      } catch (e) {
        errors.push(`“${file.name}” ${IMG_ERR[(e as Error).message] ?? "no se pudo subir"}`);
      }
    }
    setProgress(null);
    setMsg(errors.length ? { ok: false, text: `${added ? `${added} subida(s). ` : ""}${errors.join("; ")}.` } : { ok: true, text: added === 1 ? "Foto agregada." : `${added} fotos agregadas.` });
    router.refresh();
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...list]; [next[i], next[i + dir]] = [next[i + dir]!, next[i]!];
    const prev = list; setList(next);
    start(async () => { const r = await reorderMedia(productId, next.map((m) => m.id)); if (!r?.ok) { setList(prev); setMsg({ ok: false, text: r?.message ?? "No se pudo ordenar." }); } });
  }

  function remove(id: string) {
    const prev = list; setList((l) => l.filter((m) => m.id !== id)); setConfirmId(null);
    start(async () => { const r = await deleteMedia(id); setMsg(r ? { ok: r.ok, text: r.message } : null); if (!r?.ok) setList(prev); router.refresh(); });
  }

  function saveMeta(id: string, alt: string, variantId: string) {
    start(async () => { const r = await updateMedia(id, alt, variantId); setMsg(r ? { ok: r.ok, text: r.ok ? "Datos de la foto guardados." : r.message } : null); router.refresh(); });
  }

  return (
    <Card title="Fotos" step={4} aside={list.length > 0 ? <span className={helpCls}>{list.length} {list.length === 1 ? "foto" : "fotos"}</span> : undefined}>
      {!productId ? (
        <p className="rounded-[4px] border border-dashed border-line p-4 text-[14px] text-ink-2">Crea el producto primero (botón de abajo) y aquí podrás subir sus fotos.</p>
      ) : (
        <div className="grid gap-4">
          {list.length > 0 && (
            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {list.map((m, i) => (
                <li key={m.id} className="fade-in grid content-start gap-2">
                  <div className="relative aspect-square overflow-hidden rounded-[4px] border border-line bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel */}
                    <img src={url(m.thumb)} alt={m.alt || `Foto ${i + 1}`} className="size-full object-cover" />
                    {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-on-dark">Principal</span>}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <button type="button" aria-label={`Mover foto ${i + 1} antes`} disabled={i === 0} onClick={() => move(i, -1)} className={iconBtn}><ArrowLeft aria-hidden="true" size={15} /></button>
                    <button type="button" aria-label={`Mover foto ${i + 1} después`} disabled={i === list.length - 1} onClick={() => move(i, 1)} className={iconBtn}><ArrowRight aria-hidden="true" size={15} /></button>
                    <button type="button" aria-label={`Eliminar foto ${i + 1}`} onClick={() => setConfirmId(m.id)} className={`${iconBtn} text-danger`}><Trash2 aria-hidden="true" size={15} /></button>
                  </div>
                  {confirmId === m.id && (
                    <div className="fade-in grid gap-2 rounded-[4px] border border-danger/40 p-2 text-[13px]">
                      ¿Eliminar esta foto?
                      <span className="flex gap-2">
                        <button type="button" onClick={() => remove(m.id)} className="press h-10 flex-1 rounded-full border border-danger text-danger">Eliminar</button>
                        <button type="button" onClick={() => setConfirmId(null)} className="press h-10 flex-1 rounded-full border border-line">No</button>
                      </span>
                    </div>
                  )}
                  <details className="text-[13px]">
                    <summary className="cursor-pointer py-2 text-ink-2 underline underline-offset-4">Descripción y variante</summary>
                    <div className="grid gap-2" onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault(); }}>
                      <label className={labelCls}>Qué se ve (para lectores de pantalla y Google)<input name="alt" defaultValue={m.alt} maxLength={200} className={inputCls} /></label>
                      {variants.length > 1 && (
                        <label className={labelCls}>Mostrar al elegir
                          <select name="variant" defaultValue={m.variantId} className={inputCls}>
                            <option value="">Todas las variantes</option>
                            {variants.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
                          </select>
                        </label>
                      )}
                      <button type="button" onClick={(e) => { const f = collectFields(e.currentTarget.parentElement); saveMeta(m.id, f.alt ?? "", f.variant ?? m.variantId); }} className="press h-10 rounded-full border border-ink text-[13px] font-semibold">Guardar foto</button>
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          )}
          <input id="product-photos" type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic" className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          <label htmlFor="product-photos" className={`press flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-[4px] border border-dashed border-gold/60 bg-ivory p-4 text-center ${progress ? "pointer-events-none opacity-70" : ""}`}>
            {progress ? <Loader2 aria-hidden="true" size={20} className="animate-spin text-gold-deep motion-reduce:animate-none" /> : <ImagePlus aria-hidden="true" size={22} className="text-gold-deep" />}
            <span className="text-[15px] font-semibold">{progress ?? (list.length ? "Agregar más fotos" : "Subir fotos")}</span>
            {!progress && <span className={helpCls}>Puedes elegir varias. Se optimizan solas y se les quita la ubicación del teléfono.</span>}
          </label>
          {msg && <StatusText ok={msg.ok}>{msg.text}</StatusText>}
        </div>
      )}
    </Card>
  );
}
