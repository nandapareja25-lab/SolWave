import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/server/supabase/ssr";

export type AdminRole = "staff" | "admin" | "owner";
const RANK: Record<AdminRole, number> = { staff: 1, admin: 2, owner: 3 };

/**
 * Puerta de TODA pantalla y acción del panel. Exige: sesión + verificación en dos pasos (aal2)
 * + rol suficiente. La base vuelve a exigir lo mismo en cada consulta (RLS + has_role con aal2).
 */
export async function requireAdmin(min: AdminRole = "staff") {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect("/admin/verificar");
  const { data: role } = await sb.rpc("my_admin_role");
  if (!role || RANK[role as AdminRole] < RANK[min]) redirect("/admin/sin-acceso");
  return { sb, user, role: role as AdminRole };
}

/** Variante para Server Actions: en vez de redirigir, devuelve error (el formulario lo muestra). */
export async function adminAction(min: AdminRole = "staff") {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false as const, error: "Tu sesión terminó. Vuelve a entrar." };
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") return { ok: false as const, error: "Falta tu código de verificación." };
  const { data: role } = await sb.rpc("my_admin_role");
  if (!role || RANK[role as AdminRole] < RANK[min]) return { ok: false as const, error: "Tu rol no permite esta acción." };
  return { ok: true as const, sb, user, role: role as AdminRole };
}
