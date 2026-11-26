"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction } from "@/server/admin/auth";
import { refreshStore } from "@/server/admin/result";
import { RESERVED_SLUGS, isValidSlug } from "@/lib/slug";

export type CategoryResult = { ok: boolean; message: string; id?: string } | null;
const fail = (message: string): CategoryResult => ({ ok: false, message });

const schema = z.object({
  id: z.string().uuid().or(z.literal("")),
  name: z.string().trim().min(1, "Escribe el nombre.").max(60, "El nombre puede tener hasta 60 caracteres."),
  slug: z.string().trim().max(80),
  description: z.string().trim().max(600, "La descripción puede tener hasta 600 caracteres."),
  seo_title: z.string().trim().max(70, "El título para Google puede tener hasta 70 caracteres."),
  seo_description: z.string().trim().max(160, "La descripción para Google puede tener hasta 160 caracteres."),
  parent_id: z.string().uuid().or(z.literal("")),
  warranty_code: z.string().max(60),
  auto_rule: z.enum(["", "new", "sale"]),
  is_visible: z.boolean(),
  show_in_nav: z.boolean(),
  image_path: z.string().max(300).nullable(),
});
export type CategoryInput = z.infer<typeof schema>;

function done() { refreshStore(); revalidatePath("/admin/categorias"); }

export async function saveCategory(input: CategoryInput): Promise<CategoryResult> {
  const auth = await adminAction("staff"); if (!auth.ok) return fail(auth.error);
  const p = schema.safeParse(input); if (!p.success) return fail(p.error.issues[0]?.message ?? "Revisa los datos.");
  const d = p.data;
  if (!isValidSlug(d.slug)) return fail("La dirección solo puede tener minúsculas, números y guiones (ej: pulseras-de-hilo).");
  if (RESERVED_SLUGS.includes(d.slug)) return fail("Esa dirección ya la usa la tienda. Elige otra.");
  if (d.parent_id && d.parent_id === d.id) return fail("Una categoría no puede estar dentro de sí misma.");
  if (d.image_path && d.id && !d.image_path.startsWith(`${d.id}/`)) return fail("Foto no válida.");
  const [{ data: legal }, { data: other }] = await Promise.all([
    auth.sb.from("page_translations").select("slug").eq("slug", d.slug).limit(1),
    auth.sb.from("category_translations").select("category_id").eq("locale", "es").eq("slug", d.slug).limit(1),
  ]);
  if ((legal ?? []).length) return fail("Esa dirección ya la usa una política de la tienda. Elige otra.");
  if ((other ?? []).some((o) => o.category_id !== d.id)) return fail("Ya existe otra categoría con esa dirección.");
  const { data: order } = d.id ? { data: null } : await auth.sb.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const { data, error } = await auth.sb.rpc("admin_upsert_category", { p: {
    id: d.id || null, name: d.name, slug: d.slug, description: d.description || null,
    seo_title: d.seo_title || null, seo_description: d.seo_description || null,
    parent_id: d.parent_id || null, auto_rule: d.auto_rule || null, is_visible: d.is_visible, show_in_nav: d.show_in_nav,
    image_path: d.image_path, default_warranty_code: d.warranty_code || null,
    ...(d.id ? {} : { sort_order: ((order?.[0]?.sort_order as number | undefined) ?? 0) + 1 }),
  } });
  if (error) return fail(error.message.includes("INVALID_SLUG") ? "Dirección no válida." : "No se pudo guardar. Inténtalo de nuevo.");
  if (d.id) {
    // Borra fotos anteriores de esta categoría que ya no se usan
    const { data: files } = await auth.sb.storage.from("category-media").list(d.id);
    const stale = (files ?? []).map((f) => `${d.id}/${f.name}`).filter((path) => path !== d.image_path);
    if (stale.length) await auth.sb.storage.from("category-media").remove(stale);
  }
  done();
  return { ok: true, message: "Guardado. La tienda se actualiza en menos de un minuto.", id: data as string };
}

/** Guarda el orden completo (la pantalla ya lo mostró al instante). */
export async function setCategoryOrder(ids: string[]): Promise<CategoryResult> {
  const auth = await adminAction("staff"); if (!auth.ok) return fail(auth.error);
  if (ids.length > 200 || !ids.every((i) => z.string().uuid().safeParse(i).success)) return fail("Datos no válidos.");
  const { data: rows } = await auth.sb.from("categories").select("id,sort_order");
  const current = new Map((rows ?? []).map((r) => [r.id, r.sort_order as number]));
  if (ids.length !== current.size || ids.some((i) => !current.has(i))) return fail("La lista cambió mientras la ordenabas. Recarga la página.");
  const results = await Promise.all(ids.map((id, k) => (current.get(id) === k ? null : auth.sb.from("categories").update({ sort_order: k }).eq("id", id))));
  if (results.some((r) => r?.error)) return fail("No se pudo guardar el orden. Recarga la página.");
  done();
  return { ok: true, message: "Orden guardado." };
}

export async function toggleCategory(id: string, field: "is_visible" | "show_in_nav", value: boolean): Promise<CategoryResult> {
  const auth = await adminAction("staff"); if (!auth.ok) return fail(auth.error);
  if (!z.string().uuid().safeParse(id).success) return fail("Categoría no válida.");
  const { error } = await auth.sb.from("categories").update({ [field]: value }).eq("id", id);
  if (error) return fail("No se pudo cambiar.");
  done();
  return { ok: true, message: "Listo." };
}

export async function deleteCategory(id: string): Promise<CategoryResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  if (!z.string().uuid().safeParse(id).success) return fail("Categoría no válida.");
  const { count } = await auth.sb.from("products").select("id", { count: "exact", head: true }).eq("primary_category_id", id);
  if (count) return fail(`Tiene ${count} producto(s) como categoría principal. Muévelos a otra categoría antes de eliminarla, o mejor ocúltala.`);
  const { error } = await auth.sb.from("categories").delete().eq("id", id);
  if (error) return fail("No se pudo eliminar.");
  const { data: files } = await auth.sb.storage.from("category-media").list(id);
  if (files?.length) await auth.sb.storage.from("category-media").remove(files.map((f) => `${id}/${f.name}`));
  done();
  return { ok: true, message: "Eliminada." };
}
