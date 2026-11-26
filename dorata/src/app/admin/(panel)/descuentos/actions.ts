"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction } from "@/server/admin/auth";
import { toCents } from "@/server/admin/result";
import { wallTimeToUtc } from "@/lib/tz";

export type DiscountResult = { ok: boolean; message: string; id?: string } | null;
const fail = (message: string): DiscountResult => ({ ok: false, message });
const wall = z.string().trim().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v), "Fecha no válida");
const schema = z.object({
  id: z.string().uuid().or(z.literal("")),
  code: z.string().trim().toUpperCase().max(32),
  description: z.string().trim().max(200),
  type: z.enum(["percentage", "fixed_amount", "free_shipping"]),
  value: z.string().trim().max(10),
  scope: z.enum(["all", "categories", "products"]),
  category_ids: z.array(z.string().uuid()).max(50),
  product_ids: z.array(z.string().uuid()).max(200),
  min_subtotal: z.string().trim().max(10),
  starts_at: wall, ends_at: wall,
  usage_limit: z.string().trim().max(7),
  usage_limit_per_customer: z.string().trim().max(4),
  first_order_only: z.boolean(),
  is_active: z.boolean(),
});
export type DiscountInput = z.infer<typeof schema>;
const optInt = (v: string) => (v === "" ? null : /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : NaN);

export async function saveDiscount(input: DiscountInput): Promise<DiscountResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  const p = schema.safeParse(input); if (!p.success) return fail(p.error.issues[0]?.message ?? "Revisa los datos.");
  const d = p.data;
  if (!/^[A-Z0-9_-]{3,32}$/.test(d.code)) return fail("El código debe tener de 3 a 32 letras o números, sin espacios (ej: NAVIDAD15).");
  let percent: number | null = null, amount: number | null = null;
  if (d.type === "percentage") {
    percent = Number(d.value.replace(",", "."));
    if (!d.value || Number.isNaN(percent) || percent <= 0 || percent > 90) return fail("Escribe el porcentaje entre 1 y 90 (ej: 15).");
  } else if (d.type === "fixed_amount") {
    amount = toCents(d.value);
    if (amount === null || Number.isNaN(amount) || amount <= 0) return fail("Escribe cuánto se descuenta en dólares (ej: 10).");
  }
  const min = toCents(d.min_subtotal);
  if (Number.isNaN(min)) return fail("La compra mínima va en dólares (ej: 50).");
  if (amount !== null && min !== null && amount >= min) return fail("El descuento no puede ser igual o mayor que la compra mínima.");
  const limit = optInt(d.usage_limit), perCustomer = optInt(d.usage_limit_per_customer);
  if (Number.isNaN(limit) || Number.isNaN(perCustomer)) return fail("Los límites de uso deben ser números enteros (o déjalos vacíos).");
  if (d.scope === "categories" && d.category_ids.length === 0) return fail("Elige al menos una categoría.");
  if (d.scope === "products" && d.product_ids.length === 0) return fail("Elige al menos un producto.");
  const { data: s } = await auth.sb.from("store_settings").select("timezone").eq("id", 1).single();
  const tz = s?.timezone ?? "America/New_York";
  const starts = d.starts_at ? wallTimeToUtc(d.starts_at, tz) : null, ends = d.ends_at ? wallTimeToUtc(d.ends_at, tz) : null;
  if (starts && ends && Date.parse(ends) <= Date.parse(starts)) return fail("La fecha de fin debe ser posterior al inicio.");

  const row = {
    code: d.code, description: d.description || null, type: d.type, percent_off: percent, amount_off_cents: amount, scope: d.scope,
    min_subtotal_cents: min, starts_at: starts, ends_at: ends, usage_limit: limit, usage_limit_per_customer: perCustomer,
    first_order_only: d.first_order_only, is_active: d.is_active,
    stripe_coupon_id: null, // se vuelve a crear en Stripe al cambiar (fase 4)
  };
  let id = d.id;
  if (id) {
    const { error } = await auth.sb.from("discounts").update(row).eq("id", id);
    if (error) return fail(error.code === "23505" ? "Ya existe otro descuento con ese código." : "No se pudo guardar.");
  } else {
    const { data, error } = await auth.sb.from("discounts").insert(row).select("id").single();
    if (error || !data) return fail(error?.code === "23505" ? "Ya existe otro descuento con ese código." : "No se pudo crear.");
    id = data.id as string;
  }
  await auth.sb.from("discount_categories").delete().eq("discount_id", id);
  await auth.sb.from("discount_products").delete().eq("discount_id", id);
  if (d.scope === "categories") await auth.sb.from("discount_categories").insert(d.category_ids.map((category_id) => ({ discount_id: id, category_id })));
  if (d.scope === "products") await auth.sb.from("discount_products").insert(d.product_ids.map((product_id) => ({ discount_id: id, product_id })));
  revalidatePath("/admin/descuentos");
  return { ok: true, message: d.is_active ? "Guardado y activo. Funcionará en el pago cuando conectemos Stripe." : "Guardado (inactivo).", id };
}

export async function deleteDiscount(id: string): Promise<DiscountResult> {
  const auth = await adminAction("admin"); if (!auth.ok) return fail(auth.error);
  if (!z.string().uuid().safeParse(id).success) return fail("Descuento no válido.");
  const { data } = await auth.sb.from("discounts").select("times_used").eq("id", id).single();
  if ((data?.times_used ?? 0) > 0) return fail("Ya se usó en pedidos: mejor desactívalo para conservar el historial.");
  const { error } = await auth.sb.from("discounts").delete().eq("id", id);
  if (error) return fail("No se pudo eliminar.");
  revalidatePath("/admin/descuentos");
  return { ok: true, message: "Eliminado." };
}
