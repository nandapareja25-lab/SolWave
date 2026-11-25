import "server-only";

/** CSRF para rutas POST propias: el Origin debe ser el del sitio. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const o = new URL(origin);
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const allowed = new Set([host, process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host : null].filter(Boolean));
    return allowed.has(o.host);
  } catch {
    return false;
  }
}

/**
 * Límite de intentos por IP (hash) y ventana. Defensa en memoria por instancia; en producción se
 * suma la regla de rate limiting de Cloudflare (WAF) sobre /api/* — ver docs/01-ARQUITECTURA.md.
 */
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

export async function clientKey(req: Request, scope: string): Promise<string> {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${scope}:${ip}`));
  return [...new Uint8Array(digest)].slice(0, 12).map((x) => x.toString(16).padStart(2, "0")).join(""); // nunca la IP cruda
}

/** Cloudflare Turnstile: obligatorio cuando TURNSTILE_SECRET_KEY está configurado. */
export async function verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // aún no configurado (desarrollo); en producción la variable es obligatoria
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

export const json = (status: number, body: Record<string, unknown> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
