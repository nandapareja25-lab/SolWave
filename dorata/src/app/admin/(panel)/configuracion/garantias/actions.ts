"use server";

import { z } from "zod";
import { adminAction } from "@/server/admin/auth";
import { done, fail, refreshStore, toInt } from "@/server/admin/result";
import type { ActionResult } from "@/components/admin/forms";

export async function saveWarrantyPolicy(_p: ActionResult, form: FormData): Promise<ActionResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  const id = String(form.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return fail("Garantía no válida.");
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const name = get("name"), summary = get("summary"), coverage = get("coverage_md"), exclusions = get("exclusions_md");
  const months = toInt(form.get("duration_months"));
  if (!name || name.length > 60) return fail("Escribe un nombre (máx. 60 caracteres).");
  if (summary.length > 200) return fail("El resumen es muy largo (máx. 200).");
  if (coverage.length > 6000 || exclusions.length > 6000) return fail("El texto es demasiado largo.");
  if (Number.isNaN(months) || (months !== null && months > 600)) return fail("La duración debe ser un número de meses (0 a 600), o vacío si aún no está definida.");
  const { error: e1 } = await auth.sb.from("warranty_policies").update({ duration_months: months, is_active: form.get("is_active") === "on" }).eq("id", id);
  const { error: e2 } = await auth.sb.from("warranty_policy_translations").upsert({ warranty_policy_id: id, locale: "es", name, summary, coverage_md: coverage, exclusions_md: exclusions });
  if (e1 || e2) return fail("No se pudo guardar. Inténtalo de nuevo.");
  refreshStore();
  return done(months === null ? "Guardado. La duración aparece como “por definir” en la tienda." : "Guardado.");
}
