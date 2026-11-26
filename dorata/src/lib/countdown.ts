export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

export function countdownParts(targetIso: string, nowMs: number): CountdownParts {
  const total = Math.max(0, Math.floor((Date.parse(targetIso) - nowMs) / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
    done: total === 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "5 días · 04:32:18" · "1 día · 00:00:09" · "04:32:18" (sin días) */
export function formatCountdown(p: CountdownParts): string {
  const clock = `${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}`;
  if (p.days === 0) return clock;
  return `${p.days} ${p.days === 1 ? "día" : "días"} · ${clock}`;
}

/** Milisegundos hasta el siguiente segundo exacto (el contador no "deriva"). */
export function msToNextSecond(nowMs: number): number {
  return 1000 - (nowMs % 1000);
}
