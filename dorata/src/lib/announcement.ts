import { z } from "zod";

/** Forma exacta que devuelve public.current_announcement() (migración 5). */
export const announcementItemSchema = z.object({
  text: z.string().min(1).max(140),
  link_url: z.string().nullable().optional(),
  link_label: z.string().nullable().optional(),
  countdown: z.boolean().optional(),
});

export const announcementSchema = z.object({
  campaign_id: z.string(),
  mode: z.enum(["messages", "countdown", "after"]),
  items: z.array(announcementItemSchema).min(1),
  style: z.enum(["gold", "cream", "white", "black", "custom"]),
  bg_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
  text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
  motion: z.enum(["static", "marquee", "rotate"]),
  marquee_speed: z.number().int().min(10).max(200),
  rotate_interval_seconds: z.number().int().min(2).max(60),
  repeat: z.boolean(),
  countdown_target_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  timezone: z.string(),
  next_change_at: z.string().nullable(),
  /** Mensaje al que cambia cuando el contador llega a cero (null = ocultar). */
  after: announcementItemSchema.nullable().optional(),
});

export type AnnouncementItem = z.infer<typeof announcementItemSchema>;
export type Announcement = z.infer<typeof announcementSchema>;

export type AnnouncementView =
  | { kind: "hidden" }
  | { kind: "visible"; items: AnnouncementItem[]; countdownTarget: string | null };

/**
 * Lo que el navegador debe mostrar en este instante, a partir de lo que pintó el servidor.
 * Cubre los cambios que ocurren con la página abierta: fin de campaña y contador en cero.
 */
export function viewAt(a: Announcement | null, nowMs: number): AnnouncementView {
  if (!a) return { kind: "hidden" };
  if (a.ends_at && Date.parse(a.ends_at) <= nowMs) return { kind: "hidden" };
  if (a.mode === "countdown" && a.countdown_target_at && Date.parse(a.countdown_target_at) <= nowMs) {
    return a.after ? { kind: "visible", items: [a.after], countdownTarget: null } : { kind: "hidden" };
  }
  return { kind: "visible", items: a.items, countdownTarget: a.mode === "countdown" ? a.countdown_target_at : null };
}

/** Duración de una vuelta del marquee según la velocidad configurada (px/s). */
export function marqueeDurationSeconds(trackWidthPx: number, speedPxPerSecond: number): number {
  if (trackWidthPx <= 0) return 0;
  return Math.max(4, trackWidthPx / Math.max(10, speedPxPerSecond));
}

/** Contraste WCAG entre dos colores hex (#RRGGBB). El panel bloquea < 4.5. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) =>
      c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
    ) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [l1, l2] = [lum(hexA), lum(hexB)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}
