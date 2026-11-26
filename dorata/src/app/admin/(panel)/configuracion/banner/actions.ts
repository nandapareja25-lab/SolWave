"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { adminAction } from "@/server/admin/auth";
import { wallTimeToUtc } from "@/lib/tz";
import { contrastRatio } from "@/lib/announcement";

export type CampaignResult = { ok: boolean; message: string; id?: string } | null;

const link = z.string().trim().max(300).refine((v) => v === "" || /^(https:\/\/[^\s]+|\/[^\s]*)$/.test(v), "Los enlaces deben empezar por / (página de tu tienda) o https://");
const hex = z.string().trim().refine((v) => v === "" || /^#[0-9A-Fa-f]{6}$/.test(v), "Color no válido");
const wall = z.string().trim().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v), "Fecha no válida");

const campaignSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  internal_name: z.string().trim().min(1, "Ponle un nombre interno a la campaña.").max(120),
  is_active: z.boolean(),
  priority: z.coerce.number().int().min(0).max(1000),
  timezone: z.string().trim().max(60),
  starts_at: wall.refine((v) => v !== "", "Indica cuándo empieza."),
  ends_at: wall,
  style: z.enum(["gold", "cream", "white", "black", "custom"]),
  bg_color: hex, text_color: hex,
  motion: z.enum(["static", "marquee", "rotate"]),
  marquee_speed: z.coerce.number().int().min(10).max(200),
  rotate_interval_seconds: z.coerce.number().int().min(2).max(60),
  repeat: z.boolean(),
  link_url: link, link_label: z.string().trim().max(40),
  messages: z.array(z.object({ text: z.string().trim().max(140, "Cada mensaje puede tener hasta 140 caracteres."), link_url: link, link_label: z.string().trim().max(40) })).max(8),
  countdown_enabled: z.boolean(),
  countdown_target_at: wall,
  countdown_text: z.string().trim().max(140),
  countdown_end_behavior: z.enum(["hide", "swap_message"]),
  after_text: z.string().trim().max(140),
  after_link_url: link, after_link_label: z.string().trim().max(40),
});
export type CampaignInput = z.infer<typeof campaignSchema>;

const fail = (message: string): CampaignResult => ({ ok: false, message });
function refresh() { revalidateTag("catalog"); revalidatePath("/", "layout"); revalidatePath("/admin/configuracion/banner"); }

export async function saveCampaign(input: CampaignInput): Promise<CampaignResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  const p = campaignSchema.safeParse(input);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Revisa los datos.");
  const d = p.data;
  const tz = d.timezone;
  const startsAt = wallTimeToUtc(d.starts_at, tz);
  const endsAt = d.ends_at ? wallTimeToUtc(d.ends_at, tz) : null;
  const target = d.countdown_target_at ? wallTimeToUtc(d.countdown_target_at, tz) : null;
  if (!startsAt) return fail("La fecha de inicio no es válida.");
  if (endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) return fail("La fecha de fin debe ser posterior al inicio.");
  const messages = d.messages.filter((m) => m.text);
  if (d.countdown_enabled) {
    if (!target) return fail("Indica la fecha y hora a la que cuenta el contador.");
    if (!d.countdown_text.includes("{countdown}")) return fail("El texto del contador debe incluir {countdown} donde va el tiempo restante.");
    if (d.countdown_end_behavior === "swap_message" && !d.after_text) return fail("Escribe el mensaje que aparece cuando el contador llega a cero.");
  } else if (messages.length === 0) return fail("Escribe al menos un mensaje.");
  if (d.style === "custom") {
    if (!d.bg_color || !d.text_color) return fail("Elige color de fondo y de texto.");
    if (contrastRatio(d.bg_color, d.text_color) < 4.5) return fail("Esos colores no se leen bien juntos (contraste bajo). Elige un texto más claro u oscuro.");
  }
  const { data, error } = await auth.sb.rpc("admin_save_campaign", { p: {
    ...d, id: d.id || null, starts_at: startsAt, ends_at: endsAt, countdown_target_at: target, messages,
    countdown_text: d.countdown_enabled ? d.countdown_text : "", after_text: d.countdown_enabled ? d.after_text : "",
  } });
  if (error) return fail(error.message.includes("timezone") ? "Zona horaria no válida." : "No se pudo guardar la campaña. Inténtalo de nuevo.");
  refresh();
  return { ok: true, message: d.is_active ? "Guardada. La tienda la muestra en menos de un minuto (si está dentro de sus fechas)." : "Guardada como inactiva: no se muestra hasta que la actives.", id: data as string };
}

export async function setCampaignActive(id: string, active: boolean): Promise<CampaignResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  if (!z.string().uuid().safeParse(id).success) return fail("Campaña no válida.");
  const { error } = await auth.sb.from("announcement_campaigns").update({ is_active: active }).eq("id", id);
  if (error) return fail("No se pudo cambiar.");
  refresh();
  return { ok: true, message: active ? "Activada." : "Desactivada." };
}

export async function deleteCampaign(id: string): Promise<CampaignResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  if (!z.string().uuid().safeParse(id).success) return fail("Campaña no válida.");
  const { error } = await auth.sb.rpc("admin_delete_campaign", { p_id: id });
  if (error) return fail("No se pudo eliminar.");
  refresh();
  return { ok: true, message: "Eliminada." };
}
