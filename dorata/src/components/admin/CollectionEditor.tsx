"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { deleteCollection, saveCollection, type CollectionInput } from "@/app/admin/(panel)/colecciones/actions";
import { supabaseBrowser } from "@/server/supabase/browser";
import { prepareSingleImage } from "./prepare-image";
import { slugify } from "@/lib/slug";
import { monogram } from "@/lib/monogram";
import { DateTimeField } from "./DateTimeField";
import { Card, PageHeader, SaveBar, StatusText, areaCls, btnPrimary, helpCls, inputCls, labelCls } from "./ui";
import { useUnsavedGuard } from "./useUnsavedGuard";
import { useSaveShortcut } from "./useSaveShortcut";

export function CollectionEditor({ initial, timezone, products, storageBase, canDelete }: {
  initial: CollectionInput; timezone: string; products: { id: string; name: string }[]; storageBase: string; canDelete: boolean;
}) {
  const router = useRouter();
  const [d, setD] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [photoMsg, setPhotoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(d) !== saved;
  useUnsavedGuard(dirty);
  const formRef = useRef<HTMLFormElement>(null);
  useSaveShortcut(formRef);
  const set = <K extends keyof CollectionInput>(k: K, v: CollectionInput[K]) => { setMsg(null); setD((x) => ({ ...x, [k]: v })); };
  const imageUrl = d.image_path ? `${storageBase}/storage/v1/object/public/category-media/${d.image_path}` : null;

  async function onFile(file: File | undefined) {
    if (!file || !d.id) return;
    setUploading(true); setPhotoMsg(null);
    try {
      const blob = await prepareSingleImage(file, 1200);
      const path = `colecciones/${d.id}/${crypto.randomUUID()}.webp`;
      const { error } = await supabaseBrowser().storage.from("category-media").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw new Error("UPLOAD");
      const base = JSON.parse(saved) as CollectionInput;
      const r = await saveCollection({ ...base, image_path: path });
      if (r?.ok) { setD((x) => ({ ...x, image_path: path })); setSaved(JSON.stringify({ ...base, image_path: path })); }
      setPhotoMsg(r ? { ok: r.ok, text: r.ok ? "Foto guardada." : r.message } : null);
      router.refresh();
    } catch { setPhotoMsg({ ok: false, text: "No se pudo subir la foto. Usa JPG, PNG o WebP de al menos 600 px." }); }
    finally { setUploading(false); }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await saveCollection(d);
      if (!r) return;
      setMsg({ ok: r.ok, text: r.message });
      if (!r.ok) return;
      const next = { ...d, id: r.id ?? d.id };
      setSaved(JSON.stringify(next)); setD(next);
      if (!d.id && r.id) router.replace(`/admin/colecciones/${r.id}`);
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="lg:col-span-2">
        <PageHeader eyebrow={initial.id ? "Colección" : "Nueva colección"} title={d.name || "Nueva colección"}
          description={initial.id ? `${products.length} ${products.length === 1 ? "producto" : "productos"} · ${d.is_visible ? "visible" : "oculta"}` : "Guarda y luego agrega productos desde la ficha de cada uno (sección “Dónde aparece”)."} />
      </div>
      <div className="grid min-w-0 gap-6">
        <Card title="Datos" step={1}>
          <div className="grid gap-4">
            <label className={labelCls}>Nombre
              <input required maxLength={60} value={d.name} onChange={(e) => { const v = e.target.value; setMsg(null); setD((x) => ({ ...x, name: v, slug: slugTouched ? x.slug : slugify(v) })); }} placeholder="Ej: Día de la Madre" className={inputCls} />
            </label>
            <label className={labelCls}>Dirección en la tienda
              <span className="flex h-11 items-center overflow-hidden rounded-[4px] border border-line bg-ivory focus-within:border-gold-deep">
                <span className="shrink-0 border-r border-line bg-cream px-3 text-[14px] leading-[44px] text-ink-3">/colecciones/</span>
                <input required maxLength={80} value={d.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value) || e.target.value.toLowerCase()); }} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] outline-none" />
              </span>
            </label>
            <label className={labelCls}>Descripción (aparece arriba de los productos)
              <textarea maxLength={600} value={d.description} onChange={(e) => set("description", e.target.value)} placeholder="Ej: Piezas para regalarle a mamá, con garantía por escrito." className={`min-h-24 ${areaCls}`} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <DateTimeField label="Empieza a mostrarse (opcional)" value={d.starts_at} onChange={(v) => set("starts_at", v)} timezone={timezone} emptyText="Vacío: desde ya." />
              <DateTimeField label="Deja de mostrarse (opcional)" value={d.ends_at} onChange={(v) => set("ends_at", v)} timezone={timezone} emptyText="Vacío: sin fecha de fin." />
            </div>
          </div>
        </Card>
        <Card title="Productos en esta colección" step={2}>
          {products.length === 0 ? (
            <p className="text-[14px] text-ink-2">Aún no tiene productos. Abre un producto y márcala en “Dónde aparece”.</p>
          ) : (
            <ul className="divide-y divide-line">
              {products.map((p) => <li key={p.id}><Link href={`/admin/productos/${p.id}`} className="flex min-h-11 items-center gap-2 text-[15px] underline-offset-4 hover:underline"><span className="min-w-0 flex-1 truncate">{p.name}</span><ChevronRight aria-hidden="true" size={16} className="shrink-0 text-ink-3" /></Link></li>)}
            </ul>
          )}
          {products.length > 0 && <p className={`mt-3 ${helpCls}`}>Para agregar otra pieza, ábrela y márcala en “Dónde aparece”.</p>}
        </Card>
      </div>
      <div className="grid min-w-0 content-start gap-6">
        <Card title="Foto de portada" step={2}>
          <div className="grid gap-3">
            <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-[4px] border border-gold/40 bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa del panel */}
              {imageUrl ? <img src={imageUrl} alt={`Portada de ${d.name}`} className="fade-in size-full object-cover" /> : <span className="font-display text-[40px] text-gold-deep">{monogram(d.name)}</span>}
            </div>
            {d.id ? (
              <>
                <input id="col-photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
                <label htmlFor="col-photo" className={`press inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-ink px-5 text-[14px] font-semibold ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                  {uploading ? <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <ImagePlus aria-hidden="true" size={16} />}{imageUrl ? "Cambiar foto" : "Subir foto"}
                </label>
                {photoMsg ? <StatusText ok={photoMsg.ok}>{photoMsg.text}</StatusText> : <p className={helpCls}>Horizontal (3:2). Se optimiza sola.</p>}
              </>
            ) : <p className={helpCls}>Guarda la colección para poder subir su foto.</p>}
          </div>
        </Card>
        <Card title="Visibilidad" step={3}>
          <div className="grid gap-3">
            <label className="flex items-start gap-3 text-[15px]"><input type="checkbox" checked={d.is_visible} onChange={(e) => set("is_visible", e.target.checked)} className="mt-0.5 size-5 accent-[var(--ink)]" /><span>Visible en la tienda<span className={`block ${helpCls}`}>Oculta, su página no aparece y no se indexa.</span></span></label>
            <label className="flex items-start gap-3 text-[15px]"><input type="checkbox" checked={d.is_set} onChange={(e) => set("is_set", e.target.checked)} className="mt-0.5 size-5 accent-[var(--ink)]" /><span>Es un set<span className={`block ${helpCls}`}>Sus piezas se muestran con la marca “Set” en la tienda.</span></span></label>
          </div>
        </Card>
        {d.id && canDelete && (
          <div>
            {confirmDelete ? (
              <div className="fade-in grid gap-2 text-[14px]">
                <p>¿Eliminar esta colección? Los productos no se borran.</p>
                <div className="flex gap-2">
                  <button type="button" disabled={pending} onClick={() => start(async () => { const r = await deleteCollection(d.id); if (r?.ok) { setSaved(JSON.stringify(d)); router.replace("/admin/colecciones"); } else if (r) setMsg({ ok: false, text: r.message }); })} className="press inline-flex h-11 items-center rounded-full border border-danger px-4 text-danger">Sí, eliminar</button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="press inline-flex h-11 items-center rounded-full border border-line px-4">Cancelar</button>
                </div>
              </div>
            ) : <button type="button" onClick={() => setConfirmDelete(true)} className="press inline-flex h-11 items-center gap-2 text-[14px] text-danger"><Trash2 aria-hidden="true" size={15} />Eliminar colección</button>}
          </div>
        )}
      </div>
      <SaveBar dirty={dirty} status={msg ? <StatusText ok={msg.ok}>{msg.text}</StatusText> : undefined}>
        <button type="submit" disabled={pending || uploading} className={btnPrimary}>
          {pending ? <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <Check aria-hidden="true" size={16} />}{d.id ? "Guardar" : "Crear colección"}
        </button>
      </SaveBar>
    </form>
  );
}
