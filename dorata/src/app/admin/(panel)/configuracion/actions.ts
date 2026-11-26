"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { adminAction } from "@/server/admin/auth";
import { wallTimeToUtc } from "@/lib/tz";
import type { ActionResult } from "@/components/admin/forms";

const fail = (message: string): ActionResult => ({ ok: false, message });
const done = (message = "Guardado."): ActionResult => ({ ok: true, message });
function refreshStore() { revalidateTag("catalog"); revalidatePath("/", "layout"); }

const optionalUrl = z.string().trim().max(300).refine((v) => v === "" || /^https:\/\/[^\s]+$/.test(v), "Usa un enlace completo que empiece por https://");

// ---------- Estado de la tienda ----------
const modeSchema = z.object({
  store_mode: z.enum(["coming_soon", "live", "maintenance"]),
  live_at: z.string().max(20).optional().default(""),
  maintenance_message: z.string().trim().max(240).optional().default(""),
});

export async function saveStoreMode(_p: ActionResult, form: FormData): Promise<ActionResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  const d = modeSchema.safeParse(Object.fromEntries(form)); if (!d.success) return fail("Revisa los datos del formulario.");
  const { data: s } = await auth.sb.from("store_settings").select("timezone").eq("id", 1).single();
  const tz = s?.timezone ?? "America/New_York";
  const liveAt = d.data.live_at ? wallTimeToUtc(d.data.live_at, tz) : null;
  if (d.data.live_at && !liveAt) return fail("La fecha de apertura no es válida.");
  const { error } = await auth.sb.from("store_settings").update({
    store_mode: d.data.store_mode, live_at: d.data.store_mode === "coming_soon" ? liveAt : null,
    maintenance_message: d.data.maintenance_message ? { es: d.data.maintenance_message } : {},
  }).eq("id", 1);
  if (error) return fail("No se pudo guardar. Inténtalo de nuevo.");
  refreshStore();
  return done("Guardado. La tienda aplica el cambio en menos de un minuto.");
}

// ---------- Datos generales ----------
const generalSchema = z.object({
  contact_email: z.string().trim().max(254).refine((v) => v === "" || z.string().email().safeParse(v).success, "Correo no válido"),
  whatsapp_e164: z.string().trim().max(20).refine((v) => v === "" || /^\+[1-9][0-9]{6,14}$/.test(v), "Escribe el número con + y código de país, sin espacios. Ej: +13055550100"),
  instagram: optionalUrl, tiktok: optionalUrl, facebook: optionalUrl,
  packaging_note: z.string().trim().max(160),
  timezone: z.string().trim().max(60),
  newsletter_enabled: z.string().optional(),
});

export async function saveGeneral(_p: ActionResult, form: FormData): Promise<ActionResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  const d = generalSchema.safeParse(Object.fromEntries(form));
  if (!d.success) return fail(d.error.issues[0]?.message ?? "Revisa los datos.");
  const social = Object.fromEntries((["instagram", "tiktok", "facebook"] as const).filter((k) => d.data[k]).map((k) => [k, d.data[k]]));
  const { error } = await auth.sb.from("store_settings").update({
    contact_email: d.data.contact_email || null, whatsapp_e164: d.data.whatsapp_e164 || null, social_links: social,
    packaging_note: d.data.packaging_note ? { es: d.data.packaging_note } : {},
    timezone: d.data.timezone, newsletter_enabled: d.data.newsletter_enabled === "on",
  }).eq("id", 1);
  if (error) return fail(error.message.includes("timezone") ? "Zona horaria no válida." : "No se pudo guardar. Inténtalo de nuevo.");
  refreshStore();
  return done();
}

// ---------- Tasa COP/USD ----------
const rateSchema = z.object({ cop_per_usd: z.coerce.number().positive().max(100000), note: z.string().trim().max(200).optional().default("") });

export async function saveRate(_p: ActionResult, form: FormData): Promise<ActionResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  const d = rateSchema.safeParse(Object.fromEntries(form)); if (!d.success) return fail("Escribe la tasa como número, por ejemplo 4100.");
  const rate = Math.round(d.data.cop_per_usd * 10000) / 10000;
  const { error: e1 } = await auth.sb.from("exchange_rates").insert({ cop_per_usd: rate, note: d.data.note || null, source: "manual", created_by: auth.user.id });
  const { error: e2 } = await auth.sb.from("business_settings").update({ cop_per_usd: rate, cop_rate_updated_at: new Date().toISOString() }).eq("id", 1);
  if (e1 || e2) return fail("No se pudo guardar la tasa.");
  revalidatePath("/admin/configuracion");
  return done(`Tasa guardada: ${rate.toLocaleString("es-US")} COP por 1 USD.`);
}
