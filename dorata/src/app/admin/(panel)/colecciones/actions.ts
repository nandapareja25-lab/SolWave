"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction } from "@/server/admin/auth";
import { refreshStore } from "@/server/admin/result";
import { wallTimeToUtc } from "@/lib/tz";
import { isValidSlug } from "@/lib/slug";

export type CollectionResult = { ok: boolean; message: string; id?: string } | null;
const fail = (message: string): CollectionResult => ({ ok: false, message });
const wall = z.string().trim().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v), "Fecha no válida");
const schema = z.object({
  id: z.string().uuid().or(z.literal("")),
  name: z.string().trim().min(1, "Escribe el nombre.").max(60, "El nombre puede tener hasta 60 caracteres."),
  slug: z.string().trim().max(80),
  description: z.string().trim().max(600, "La descripción puede tener hasta 600 caracteres."),
  is_visible: z.boolean(), is_set: z.boolean(),
  starts_at: wall, ends_at: wall,
  image_path: z.string().max(300).nullable(),
});
export type CollectionInput = z.infer<typeof schema>;
function done() { refreshStore(); revalidatePath("/admin/colecciones"); }

export async function saveCollection(input: CollectionInput): Promise<CollectionResult> {
  const auth = await adminAction("staff"); if (!auth.ok) return fail(auth.error);
  const p = schema.safeParse(input); if (!p.success) return fail(p.error.issues[0]?.message ?? "Revisa los datos.");
  const d = p.data;
  if (!isValidSlug(d.slug)) return fail("La dirección solo puede tener minúsculas, números y guiones.");
  if (d.image_path && d.id && !d.image_path.startsWith(`colecciones/${d.id}/`)) return fail("Foto no válida.");
  const { data: s } = await auth.sb.from("store_settings").select("timezone").eq("id", 1).single();
  const tz = s?.timezone ?? "America/New_York";
  const starts = d.starts_at ? wallTimeToUtc(d.starts_at, tz) : null;
  const ends = d.ends_at ? wallTimeToUtc(d.ends_at, tz) : null;
  if (starts && ends && Date.parse(ends) <= Date.parse(starts)) return fail("La fecha de fin debe ser posterior al inicio.");
  const { data: other } = await auth.sb.from("collection_translations").select("collection_id").eq("locale", "es").eq("slug", d.slug).limit(1);
  if ((other ?? []).some((o) => o.collection_id !== d.id)) return fail("Ya existe otra colección con esa dirección.");

  let id = d.id;
  const row = { is_visible: d.is_visible, is_set: d.is_set, starts_at: starts, ends_at: ends, image_path: d.image_path };
  if (!id) {
    const { data: last } = await auth.sb.from("collections").select("sort_order").order("sort_order", { ascending: false }).limit(1);
    const { data, error } = await auth.sb.from("collections").insert({ ...row, sort_order: ((last?.[0]?.sort_order as number | undefined) ?? 0) + 1 }).select("id").single();
    if (error || !data) return fail("No se pudo crear la colección.");
    id = data.id as string;
  } else {
    const { error } = await auth.sb.from("collections").update(row).eq("id", id);
    if (error) return fail("No se pudo guardar.");
  }
  const { error: e2 } = await auth.sb.from("collection_translations").upsert({ collection_id: id, locale: "es", name: d.name, slug: d.slug, description: d.description || null });
  if (e2) return fail("No se pudo guardar el nombre o la dirección.");
  if (d.id) {
    const { data: files } = await auth.sb.storage.from("category-media").list(`colecciones/${d.id}`);
    const stale = (files ?? []).map((f) => `colecciones/${d.id}/${f.name}`).filter((x) => x !== d.image_path);
    if (stale.length) await auth.sb.storage.from("category-media").remove(stale);
  }
  done();
  return { ok: true, message: d.is_visible ? "Guardado. Se ve en la tienda en menos de un minuto." : "Guardado (oculta: no se ve en la tienda).", id };
}

export async function deleteCollection(id: string): Promise<CollectionResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  if (!z.string().uuid().safeParse(id).success) return fail("Colección no válida.");
  const { error } = await auth.sb.from("collections").delete().eq("id", id);
  if (error) return fail("No se pudo eliminar.");
  const { data: files } = await auth.sb.storage.from("category-media").list(`colecciones/${id}`);
  if (files?.length) await auth.sb.storage.from("category-media").remove(files.map((f) => `colecciones/${id}/${f.name}`));
  done();
  return { ok: true, message: "Eliminada. Los productos siguen en sus categorías." };
}
