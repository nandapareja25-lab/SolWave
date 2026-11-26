"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/server/supabase/ssr";
import { rateLimit } from "@/server/security/request-guard";

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(8).max(200) });

export type LoginState = { error: string | null };

/** Entrada al panel. Mensaje genérico (no revela si el correo existe) y límite de intentos por IP. */
export async function signIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`login:${ip}`, 8, 15 * 60_000)) return { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
  const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Correo o contraseña incorrectos." };
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Correo o contraseña incorrectos." };
  redirect("/admin/verificar");
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/admin/login");
}
