import { z } from "zod";
import { clientKey, json, rateLimit, sameOrigin, verifyTurnstile } from "@/server/security/request-guard";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.enum(["footer", "waitlist"]),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot
  turnstileToken: z.string().max(2048).optional(),
});

/** Alta a novedades / lista de espera. Consentimiento explícito, registrado con su origen. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json(403, { error: "forbidden" });
  if (!rateLimit(await clientKey(req, "newsletter"), 5, 10 * 60_000)) return json(429, { error: "too_many" });

  let parsed;
  try { parsed = bodySchema.safeParse(await req.json()); } catch { return json(400, { error: "invalid" }); }
  if (!parsed.success) return json(400, { error: "invalid" });
  if (parsed.data.website) return json(200, { ok: true }); // bot: respuesta neutra, no se guarda nada

  if (!(await verifyTurnstile(parsed.data.turnstileToken, req.headers.get("cf-connecting-ip")))) return json(400, { error: "challenge" });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return json(503, { error: "not_configured" });

  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/subscribe_marketing`, {
    method: "POST",
    headers: { apikey: secret, Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_email: parsed.data.email, p_source: parsed.data.source }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("newsletter_failed", res.status); // sin el correo en el log
    return json(502, { error: "unavailable" });
  }
  return json(200, { ok: true });
}
