import { consentRecordSchema } from "@/lib/consent";
import { clientKey, json, rateLimit, sameOrigin } from "@/server/security/request-guard";
import { callPublicRpc, insertWithSecret, supabasePublicConfig } from "@/server/supabase/rpc";

/** Registro mínimo del consentimiento de cookies (sin IP, sin email, sin navegador). */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json(403, { error: "forbidden" });
  if (!rateLimit(await clientKey(req, "consent"), 20, 10 * 60_000)) return json(429, { error: "too_many" });

  let parsed;
  try { parsed = consentRecordSchema.safeParse(await req.json()); } catch { return json(400, { error: "invalid" }); }
  if (!parsed.success) return json(400, { error: "invalid" });
  if (!supabasePublicConfig() || !process.env.SUPABASE_SECRET_KEY) return new Response(null, { status: 204 });

  const country = req.headers.get("cf-ipcountry");
  const regionCode = (req as Request & { cf?: { regionCode?: string } }).cf?.regionCode;
  const region = country && /^[A-Z]{2}$/.test(country) ? (regionCode && /^[A-Z0-9]{1,3}$/.test(regionCode) ? `${country}-${regionCode}` : country) : null;

  // Versión vigente de la Política de Cookies (null mientras no haya una publicada).
  let policyVersionId: string | null = null;
  try {
    const v = await callPublicRpc<{ id: string | null; version_label: string | null } | null>("policy_version_at", { p_kind: "cookies" }, { revalidate: 300 });
    policyVersionId = v?.id ?? null;
  } catch { /* sin versión publicada: se registra sin ella */ }

  const d = parsed.data;
  const res = await insertWithSecret("cookie_consent_records", {
    subject_id: d.subject_id, action: d.action, analytics: d.analytics, marketing: d.marketing,
    personalization: d.personalization, gpc: d.gpc, region, policy_version_id: policyVersionId,
  });
  if (!res.ok) {
    console.error("consent_record_failed", res.status);
    return json(502, { error: "unavailable" });
  }
  return new Response(null, { status: 204 });
}
