/**
 * Fechas "de pared" (lo que la dueña escribe: 2026-12-02T00:00 en America/New_York) ⇄ instante UTC.
 * Sin librerías: usa Intl, maneja horario de verano.
 */
function offsetMinutes(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - utcMs) / 60000);
}

/** "2026-12-02T00:00" + "America/New_York" → ISO UTC. Devuelve null si el texto no es válido. */
export function wallTimeToUtc(local: string, timeZone: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const naive = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!);
  let guess = naive - offsetMinutes(naive, timeZone) * 60000;
  guess = naive - offsetMinutes(guess, timeZone) * 60000; // segunda pasada: cruce de horario de verano
  return new Date(guess).toISOString();
}

/** ISO UTC → "2026-12-02T00:00" en la zona indicada (para precargar <input type="datetime-local">). */
export function utcToWallTime(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  const local = new Date(ms + offsetMinutes(ms, timeZone) * 60000);
  return local.toISOString().slice(0, 16);
}

export function formatInZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("es-US", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(iso));
}

export const BUSINESS_TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix", "America/Bogota",
] as const;

/** Nombre sencillo de la zona para la dueña (sin "America/New_York"). */
export const TZ_LABELS: Record<string, string> = {
  "America/New_York": "Hora del Este (Nueva York, Miami)",
  "America/Chicago": "Hora del Centro (Chicago, Houston)",
  "America/Denver": "Hora de la Montaña (Denver)",
  "America/Los_Angeles": "Hora del Pacífico (Los Ángeles)",
  "America/Phoenix": "Hora de Arizona (Phoenix)",
  "America/Bogota": "Hora de Colombia (Bogotá)",
};
export const tzLabel = (tz: string) => TZ_LABELS[tz] ?? tz.replace(/_/g, " ");

/** "2026-12-02T00:00" (hora de pared) → "miércoles 2 de diciembre de 2026, 12:00 a. m." */
export function readableWallTime(local: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return "";
  const d = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!));
  return new Intl.DateTimeFormat("es-US", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(d);
}
