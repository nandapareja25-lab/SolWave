"use server";

import { z } from "zod";
import { adminAction } from "@/server/admin/auth";
import { done, fail, refreshStore, toCents, toInt } from "@/server/admin/result";
import type { ActionResult } from "@/components/admin/forms";

export async function saveShippingMethod(_p: ActionResult, form: FormData): Promise<ActionResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  const id = String(form.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return fail("Método no válido.");
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const price = toCents(form.get("price"));
  const freeOver = toCents(form.get("free_over"));
  const etaMin = toInt(form.get("eta_min")), etaMax = toInt(form.get("eta_max"));
  const active = form.get("is_active") === "on";
  if (!name || name.length > 60) return fail("Escribe un nombre (máx. 60 caracteres).");
  if (description.length > 200) return fail("La descripción es muy larga (máx. 200).");
  if ([price, freeOver].some((x) => Number.isNaN(x))) return fail("Escribe los precios en dólares, por ejemplo 7.95");
  if ([etaMin, etaMax].some((x) => Number.isNaN(x))) return fail("Los días deben ser números enteros.");
  if (etaMin !== null && etaMax !== null && etaMin > etaMax) return fail("El mínimo de días no puede ser mayor que el máximo.");
  if (active && (price === null || etaMin === null || etaMax === null)) return fail("Para activarlo necesita precio y tiempo de entrega (mín. y máx.). Así no se promete nada sin definir.");
  const { error: e1 } = await auth.sb.from("shipping_methods").update({
    price_cents: price ?? 0, free_over_cents: freeOver, eta_min_days: etaMin, eta_max_days: etaMax, is_active: active,
  }).eq("id", id);
  const { error: e2 } = await auth.sb.from("shipping_method_translations").upsert({ shipping_method_id: id, locale: "es", name, description: description || null });
  if (e1 || e2) return fail("No se pudo guardar. Inténtalo de nuevo.");
  refreshStore();
  return done(active ? "Guardado y visible en la tienda." : "Guardado (inactivo: no se ofrece todavía).");
}
