import { revalidatePath, revalidateTag } from "next/cache";
import type { ActionResult } from "@/components/admin/forms";

export const fail = (message: string): ActionResult => ({ ok: false, message });
export const done = (message = "Guardado."): ActionResult => ({ ok: true, message });
/** Refresca la tienda pública (catálogo, ajustes, políticas) y el panel. */
export function refreshStore() { revalidateTag("catalog"); revalidatePath("/", "layout"); }
/** "12.50" → 1250 centavos. Vacío → null. Inválido → NaN. */
export function toCents(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim().replace(",", ".");
  if (s === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  return Math.round(Number(s) * 100);
}
export function toInt(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  return /^\d+$/.test(s) ? Number(s) : NaN;
}
