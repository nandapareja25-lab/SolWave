"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction } from "@/server/admin/auth";
import { refreshStore } from "@/server/admin/result";

export type StockResult = { ok: boolean; message: string; onHand?: number } | null;
const schema = z.object({
  variant_id: z.string().uuid(),
  kind: z.enum(["restock", "count", "return", "damage"]),
  quantity: z.coerce.number().int().min(0).max(100000),
  reason: z.string().trim().max(300),
});

/**
 * restock: llegó mercancía (+N) · count: conteo físico (fija el total a N) ·
 * return: devolución que vuelve a la venta (+N) · damage: dañadas/perdidas (−N)
 */
export async function adjustStock(input: z.input<typeof schema>): Promise<StockResult> {
  const auth = await adminAction("staff"); if (!auth.ok) return { ok: false, message: auth.error };
  const p = schema.safeParse(input); if (!p.success) return { ok: false, message: "Escribe una cantidad válida (número entero)." };
  const d = p.data;
  const { data: lvl } = await auth.sb.from("inventory_levels").select("on_hand,reserved").eq("variant_id", d.variant_id).single();
  if (!lvl) return { ok: false, message: "No encontramos esa variante." };
  let type: string; let delta: number; let reason = d.reason;
  if (d.kind === "restock") { type = "restock"; delta = d.quantity; reason ||= "Llegó mercancía"; }
  else if (d.kind === "return") { type = "return"; delta = d.quantity; reason ||= "Devolución en buen estado"; }
  else if (d.kind === "damage") { type = "adjustment"; delta = -d.quantity; if (reason.length < 3) return { ok: false, message: "Cuéntanos qué pasó (ej: llegó dañada)." }; }
  else { type = "manual_correction"; delta = d.quantity - lvl.on_hand; if (reason.length < 3) return { ok: false, message: "Escribe por qué corriges el conteo (ej: conteo de fin de mes)." }; }
  if (delta === 0) return { ok: false, message: d.kind === "count" ? "El conteo coincide con lo que ya tenías: no hay nada que cambiar." : "La cantidad debe ser mayor que cero." };
  const { data, error } = await auth.sb.rpc("adjust_inventory", { p_variant_id: d.variant_id, p_type: type, p_delta: delta, p_reason: reason });
  if (error) {
    if (error.message.includes("BELOW_RESERVED")) return { ok: false, message: `No puedes dejar menos de ${lvl.reserved}: hay unidades apartadas en compras en curso.` };
    if (error.message.includes("on_hand")) return { ok: false, message: "No puedes quitar más unidades de las que hay." };
    return { ok: false, message: "No se pudo guardar el ajuste. Inténtalo de nuevo." };
  }
  refreshStore(); revalidatePath("/admin/inventario"); revalidatePath("/admin/productos");
  return { ok: true, message: `Listo: ahora hay ${data} en total.`, onHand: data as number };
}
