import { z } from "zod";

export const CONSENT_COOKIE = "dorata_consent";
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 12 meses (declarado en la política de cookies)

export type ConsentCategories = { analytics: boolean; marketing: boolean; personalization: boolean };
export type ConsentAction = "accept_all" | "reject_all" | "custom" | "withdraw" | "gpc_signal";

const stored = z.object({
  v: z.string().max(16),                 // versión de la política de cookies aceptada
  id: z.string().uuid(),                 // identificador técnico aleatorio
  a: z.boolean(), m: z.boolean(), p: z.boolean(),
  t: z.number().int().positive(),        // fecha (ms)
});
export type StoredConsent = z.infer<typeof stored>;

export function serializeConsent(c: StoredConsent): string {
  return encodeURIComponent(JSON.stringify(c));
}

export function parseConsent(raw: string | undefined | null): StoredConsent | null {
  if (!raw) return null;
  try {
    const parsed = stored.safeParse(JSON.parse(decodeURIComponent(raw)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** La señal Global Privacy Control siempre gana sobre marketing. */
export function applyGpc(c: ConsentCategories, gpc: boolean): ConsentCategories {
  return gpc ? { ...c, marketing: false } : c;
}

export function categoriesFor(action: Exclude<ConsentAction, "custom">): ConsentCategories {
  return action === "accept_all"
    ? { analytics: true, marketing: true, personalization: true }
    : { analytics: false, marketing: false, personalization: false };
}

/** Hay que volver a preguntar si no hay registro o si la política cambió de versión. */
export function needsPrompt(c: StoredConsent | null, currentVersion: string): boolean {
  return !c || c.v !== currentVersion;
}

export const consentRecordSchema = z.object({
  subject_id: z.string().uuid(),
  action: z.enum(["accept_all", "reject_all", "custom", "withdraw", "gpc_signal"]),
  analytics: z.boolean(),
  marketing: z.boolean(),
  personalization: z.boolean(),
  gpc: z.boolean(),
  policy_version: z.string().max(16),
}).refine((r) => r.action !== "reject_all" || !(r.analytics || r.marketing || r.personalization), "reject_all incoherente")
  .refine((r) => r.action !== "accept_all" || (r.analytics && r.marketing && r.personalization), "accept_all incoherente")
  .refine((r) => !r.gpc || !r.marketing, "GPC no admite marketing");
