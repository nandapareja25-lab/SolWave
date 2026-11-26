"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction } from "@/server/admin/auth";
import { done, fail, refreshStore } from "@/server/admin/result";
import { wallTimeToUtc } from "@/lib/tz";
import type { ActionResult } from "@/components/admin/forms";

const uuid = z.string().uuid();

export async function saveDraft(_p: ActionResult, form: FormData): Promise<ActionResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  const id = String(form.get("page_id") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body_md") ?? "");
  if (!uuid.safeParse(id).success) return fail("Página no válida.");
  if (!title || title.length > 120) return fail("Escribe un título (máx. 120 caracteres).");
  if (body.length > 60000) return fail("El texto es demasiado largo.");
  const { error } = await auth.sb.from("page_translations").update({ title, body_md: body }).eq("page_id", id).eq("locale", "es");
  if (error) return fail("No se pudo guardar el borrador.");
  revalidatePath(`/admin/configuracion/legal/${id}`);
  return done("Borrador guardado. La tienda sigue mostrando la versión publicada.");
}

export async function publishVersion(_p: ActionResult, form: FormData): Promise<ActionResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  const id = String(form.get("page_id") ?? "");
  const label = String(form.get("version_label") ?? "").trim();
  const summary = String(form.get("change_summary") ?? "").trim();
  const when = String(form.get("effective_at") ?? "").trim();
  const review = String(form.get("legal_review_status") ?? "needs_legal_review");
  if (!uuid.safeParse(id).success) return fail("Página no válida.");
  if (!/^[0-9]+(\.[0-9]+){0,2}$/.test(label)) return fail("La versión debe ser como 1.0, 1.1 o 2.0");
  if (!["draft", "needs_legal_review", "approved"].includes(review)) return fail("Estado de revisión no válido.");
  if (summary.length > 300) return fail("El resumen del cambio es muy largo.");
  const { data: s } = await auth.sb.from("store_settings").select("timezone").eq("id", 1).single();
  const effective = when ? wallTimeToUtc(when, s?.timezone ?? "America/New_York") : new Date().toISOString();
  if (!effective) return fail("La fecha de vigencia no es válida.");
  const { data: t } = await auth.sb.from("page_translations").select("title,body_md").eq("page_id", id).eq("locale", "es").single();
  if (!t || !t.body_md.trim()) return fail("El borrador está vacío: escribe el texto y guárdalo antes de publicar.");
  const { error } = await auth.sb.from("page_versions").insert({
    page_id: id, locale: "es", version_label: label, title: t.title, body_md: t.body_md, change_summary: summary || null,
    effective_at: effective, legal_review_status: review, published_by: auth.user.id,
  });
  if (error) return fail(error.code === "23505" ? `Ya existe la versión ${label}. Usa un número nuevo.` : "No se pudo publicar.");
  await auth.sb.from("pages").update({ is_published: true }).eq("id", id);
  refreshStore();
  revalidatePath(`/admin/configuracion/legal/${id}`);
  return done(Date.parse(effective) > Date.now() ? `Versión ${label} programada.` : `Versión ${label} publicada. Ya se ve en la tienda.`);
}

export async function setFooter(_p: ActionResult, form: FormData): Promise<ActionResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  const id = String(form.get("page_id") ?? "");
  if (!uuid.safeParse(id).success) return fail("Página no válida.");
  const { error } = await auth.sb.from("pages").update({ show_in_footer: form.get("show_in_footer") === "on" }).eq("id", id);
  if (error) return fail("No se pudo guardar.");
  refreshStore();
  return done();
}
