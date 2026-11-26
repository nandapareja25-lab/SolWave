"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { deleteCategory, saveCategory, type CategoryInput } from "@/app/admin/(panel)/categorias/actions";
import { supabaseBrowser } from "@/server/supabase/browser";
import { prepareSingleImage } from "./prepare-image";
import { slugify } from "@/lib/slug";
import { monogram } from "@/lib/monogram";
import { formatWarranty } from "@/lib/warranty";
import { Card, PageHeader, SaveBar, StatusText, areaCls, btnPrimary, helpCls, inputCls, labelCls } from "./ui";
import { useUnsavedGuard } from "./useUnsavedGuard";
import { useSaveShortcut } from "./useSaveShortcut";
import { GooglePreview } from "./GooglePreview";

const IMG_ERR: Record<string, string> = {
  IMAGE_TYPE: "Usa una foto JPG, PNG, WebP o HEIC.", IMAGE_SIZE: "La foto pesa demasiado (máx. 20 MB).", IMAGE_TOO_SMALL: "La foto es muy pequeña: usa una de al menos 800 px.",
};

export function CategoryEditor({ initial, parents, warranties, storageBase, canDelete, productCount }: {
  initial: CategoryInput; parents: { id: string; name: string }[]; warranties: { code: string; name: string; months: number | null }[];
  storageBase: string; canDelete: boolean; productCount: number;
}) {
  const router = useRouter();
  const [d, setD] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [photoMsg, setPhotoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const dirty = JSON.stringify(d) !== saved;
  useUnsavedGuard(dirty);
  const formRef = useRef<HTMLFormElement>(null);
  useSaveShortcut(formRef);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof CategoryInput>(k: K, v: CategoryInput[K]) => { setMsg(null); setD((x) => ({ ...x, [k]: v })); };
  const imageUrl = d.image_path ? `${storageBase}/storage/v1/object/public/category-media/${d.image_path}` : null;

  async function onFile(file: File | undefined) {
    if (!file || !d.id) return;
    setUploading(true); setPhotoMsg(null);
    try {
      const blob = await prepareSingleImage(file, 800);
      const path = `${d.id}/${crypto.randomUUID()}.webp`;
      const { error } = await supabaseBrowser().storage.from("category-media").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw new Error("UPLOAD");
      // Solo cambia la foto: lo demás que esté sin guardar sigue pendiente
      const savedState = JSON.parse(saved) as CategoryInput;
      const r = await saveCategory({ ...savedState, image_path: path });
      if (r?.ok) { setD((x) => ({ ...x, image_path: path })); setSaved(JSON.stringify({ ...savedState, image_path: path })); }
      setPhotoMsg(r ? { ok: r.ok, text: r.ok ? "Foto guardada." : r.message } : null);
      router.refresh();
    } catch (e) {
      setPhotoMsg({ ok: false, text: IMG_ERR[(e as Error).message] ?? "No se pudo subir la foto. Revisa tu conexión e inténtalo de nuevo." });
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await saveCategory(d);
      if (!r) return;
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) setSaved(JSON.stringify({ ...d, id: r.id ?? d.id }));
      if (r.ok && r.id && !d.id) { setD((x) => ({ ...x, id: r.id! })); router.replace(`/admin/categorias/${r.id}`); }
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="lg:col-span-2">
        <PageHeader eyebrow={initial.id ? "Categoría" : "Nueva categoría"} title={d.name || (initial.id ? "Sin nombre" : "Nueva categoría")}
          description={initial.id ? (!d.is_visible ? "Oculta en la tienda" : d.show_in_nav ? "Visible · en el menú y la portada" : "Visible · fuera del menú") : "Completa los datos y guarda; después podrás subir su foto."} />
      </div>
      <div className="order-2 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:order-none">
        <Card title="Datos" step={2}>
          <div className="grid gap-4">
            <label className={labelCls}>Nombre
              <input required maxLength={60} value={d.name} onChange={(e) => { const v = e.target.value; setD((x) => ({ ...x, name: v, slug: slugTouched ? x.slug : slugify(v) })); }} placeholder="Ej: Pulseras de hilo" className={inputCls} />
            </label>
            <label className={labelCls}>Dirección en la tienda
              <span className="flex h-11 items-center overflow-hidden rounded-[4px] border border-line bg-ivory focus-within:border-gold-deep">
                <span className="shrink-0 border-r border-line bg-cream px-3 text-[14px] leading-[44px] text-ink-3">dorata18k.com/</span>
                <input required maxLength={80} value={d.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value) || e.target.value.toLowerCase()); }}
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-ink outline-none" />
              </span>
              <span className={helpCls}>Se crea sola a partir del nombre. Solo minúsculas, números y guiones.</span>
              {initial.slug && d.slug !== initial.slug && <span className="text-[12px] text-ink-3">La dirección anterior seguirá funcionando y llevará a la nueva.</span>}
            </label>
            <label className={labelCls}>Descripción (aparece arriba de los productos)
              <textarea maxLength={600} value={d.description} onChange={(e) => set("description", e.target.value)} placeholder="Ej: Pulseras tejidas a mano con balines de oro laminado 18K." className={`min-h-24 ${areaCls}`} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelCls}>Garantía por defecto
                <select value={d.warranty_code} onChange={(e) => set("warranty_code", e.target.value)} className={inputCls}>
                  <option value="">Sin garantía asignada</option>
                  {warranties.map((w) => <option key={w.code} value={w.code}>{w.name} ({formatWarranty(w.months)})</option>)}
                </select>
                <span className={helpCls}>Los productos de esta categoría usan esta garantía, salvo que les pongas otra.</span>
              </label>
              <label className={labelCls}>Dentro de (opcional)
                <select value={d.parent_id} onChange={(e) => set("parent_id", e.target.value)} className={inputCls}>
                  <option value="">Ninguna (principal)</option>
                  {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label className={labelCls}>Tipo
                <select value={d.auto_rule} onChange={(e) => set("auto_rule", e.target.value as CategoryInput["auto_rule"])} className={inputCls}>
                  <option value="">Normal (tú eliges los productos)</option>
                  <option value="new">Automática: novedades</option>
                  <option value="sale">Automática: ofertas</option>
                </select>
              </label>
            </div>
          </div>
        </Card>
        <Card title="Cómo se ve en Google (opcional)" step={2}>
          <div className="grid gap-4">
            <GooglePreview title={d.seo_title || `${d.name || "Categoría"} | D'ORATA`} url={`dorata18k.com › ${d.slug || "categoria"}`} description={d.seo_description || d.description} />
            <label className={labelCls}>Título en Google
              <input maxLength={70} value={d.seo_title} onChange={(e) => set("seo_title", e.target.value)} className={inputCls} />
              <span className={`${helpCls} flex justify-between gap-2`}><span>Vacío: “{d.name || "Categoría"} | D&apos;ORATA”.</span><span className="tabular">{d.seo_title.length}/70</span></span>
            </label>
            <label className={labelCls}>Descripción en Google
              <textarea maxLength={160} value={d.seo_description} onChange={(e) => set("seo_description", e.target.value)} className={`min-h-20 ${areaCls}`} />
              <span className={`${helpCls} flex justify-between gap-2`}><span>Vacío: se usa la descripción de arriba.</span><span className="tabular">{d.seo_description.length}/160</span></span>
            </label>
          </div>
        </Card>
      </div>

      <div className="order-1 grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6 lg:order-none">
        <Card title="Visibilidad" step={1}>
          <div className="grid gap-3">
            <label className="flex items-center gap-3 text-[15px]"><input type="checkbox" checked={d.is_visible} onChange={(e) => set("is_visible", e.target.checked)} className="size-5 accent-[var(--ink)]" />Visible en la tienda</label>
            <label className={`flex items-start gap-3 text-[15px] ${d.is_visible ? "" : "text-ink-3"}`}>
              <input type="checkbox" checked={d.is_visible && d.show_in_nav} disabled={!d.is_visible} onChange={(e) => set("show_in_nav", e.target.checked)} className="mt-0.5 size-5 accent-[var(--ink)]" />
              <span>Mostrar en el menú y la portada{!d.is_visible && <span className={`block ${helpCls}`}>Primero activa “Visible en la tienda”.</span>}</span>
            </label>
          </div>
        </Card>
        <Card title="Foto del círculo" step={3}>
          <div className="grid justify-items-center gap-3">
            <div className="grid size-36 place-items-center overflow-hidden rounded-full border-2 border-gold/50 bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa del panel */}
              {imageUrl ? <img src={imageUrl} alt={`Foto de ${d.name}`} className="size-full object-cover" /> : <span className="font-display text-[40px] text-gold-deep">{monogram(d.name)}</span>}
            </div>
            {d.id ? (
              <>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="sr-only" id="cat-photo" onChange={(e) => onFile(e.target.files?.[0])} />
                <label htmlFor="cat-photo" className={`press inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-ink px-5 text-[14px] font-semibold ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                  {uploading ? <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <ImagePlus aria-hidden="true" size={16} />}
                  {uploading ? "Subiendo…" : imageUrl ? "Cambiar foto" : "Subir foto"}
                </label>
                {photoMsg ? <StatusText ok={photoMsg.ok}>{photoMsg.text}</StatusText> : <p className="text-center text-[12px] text-ink-3">Cuadrada, con la pieza centrada. Se optimiza sola.</p>}
              </>
            ) : <p className="text-center text-[13px] text-ink-2">Guarda la categoría para poder subir su foto.</p>}
          </div>
        </Card>
      </div>
      <div className="order-3 lg:col-span-2 lg:order-none">
        {d.id && canDelete && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="grid gap-2 text-[14px]">
                <p>{productCount > 0 ? `Tiene ${productCount} producto(s). Muévelos antes, o mejor ocúltala.` : "¿Eliminar esta categoría para siempre?"}</p>
                <div className="flex gap-2">
                  <button type="button" disabled={pending || productCount > 0} onClick={() => start(async () => { const r = await deleteCategory(d.id); if (r?.ok) router.replace("/admin/categorias"); else if (r) setMsg({ ok: false, text: r.message }); })}
                    className="press inline-flex h-11 items-center rounded-full border border-danger px-4 text-danger disabled:opacity-40">Sí, eliminar</button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="press inline-flex h-11 items-center rounded-full border border-line px-4">Cancelar</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="press inline-flex h-11 items-center gap-2 text-[14px] text-danger"><Trash2 aria-hidden="true" size={15} />Eliminar categoría</button>
            )}
          </div>
        )}
      </div>
      <SaveBar dirty={dirty} quiet={!dirty && !!d.id} status={msg ? <StatusText ok={msg.ok}>{msg.text}</StatusText> : !d.id ? <span className="text-ink-3">Aún no está creada</span> : undefined}>
        <button type="submit" disabled={pending || uploading} className={btnPrimary}>
          {pending ? <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <Check aria-hidden="true" size={16} />}{d.id ? "Guardar categoría" : "Crear categoría"}
        </button>
      </SaveBar>
    </form>
  );
}
