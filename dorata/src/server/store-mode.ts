import "server-only";
import { parseStoreMode } from "@/lib/store-mode";
import { callPublicRpc, supabasePublicConfig } from "@/server/supabase/rpc";
import type { StoreModeInfo } from "@/server/types";

let memo: { at: number; value: StoreModeInfo } | null = null;
const TTL_MS = 30_000;

/**
 * Modo efectivo de la tienda (Próximamente / Tienda activa / Mantenimiento) desde
 * effective_store_mode(), con caché en memoria de 30 s. Sin Supabase: variable DORATA_STORE_MODE (demo).
 */
export async function fetchStoreMode(): Promise<StoreModeInfo> {
  if (!supabasePublicConfig()) {
    return { mode: parseStoreMode(process.env.DORATA_STORE_MODE) ?? "live", liveAt: null, timezone: "America/New_York" };
  }
  if (memo && Date.now() - memo.at < TTL_MS) return memo.value;
  try {
    const raw = await callPublicRpc<{ mode: string; live_at: string | null; timezone: string }>("effective_store_mode", {});
    const value: StoreModeInfo = { mode: parseStoreMode(raw.mode) ?? "coming_soon", liveAt: raw.live_at, timezone: raw.timezone };
    memo = { at: Date.now(), value };
    return value;
  } catch (e) {
    console.error("store_mode_unavailable", e instanceof Error ? e.message : "unknown");
    // Sin base no se puede vender: último valor conocido o, si no hay, mantenimiento.
    return memo?.value ?? { mode: "maintenance", liveAt: null, timezone: "America/New_York" };
  }
}

/** Rutas visibles en cualquier modo: políticas legales y solicitudes de privacidad. */
const ALWAYS_PUBLIC = new Set([
  "/privacidad", "/privacidad/solicitud", "/cookies", "/terminos-y-condiciones", "/terminos-de-uso",
  "/envios", "/cambios-y-devoluciones", "/reembolsos", "/garantia", "/contacto",
]);
export const isAlwaysPublic = (path: string) => ALWAYS_PUBLIC.has(path);

export const PREVIEW_COOKIE = "dorata_preview";

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Valor de la cookie de vista previa: hash del token secreto (el token nunca viaja en la cookie). */
export async function previewCookieValue(): Promise<string | null> {
  const token = process.env.STORE_PREVIEW_TOKEN;
  return token && token.length >= 24 ? hashPreviewToken(token) : null;
}

export function hashPreviewToken(token: string): Promise<string> {
  return sha256Hex(`dorata-preview:${token}`);
}
