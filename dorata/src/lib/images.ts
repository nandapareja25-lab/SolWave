/**
 * Fotos de producto: reglas puras (probadas) para preparar y nombrar las variantes WebP
 * que se suben a Storage (product-media/{product_id}/{uuid}-{ancho}.webp).
 */
export const IMAGE_WIDTHS = [400, 800, 1600] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] as const;
export const MAX_INPUT_BYTES = 25 * 1024 * 1024; // fotos de celular grandes; se reducen antes de subir
export const MIN_SIDE = 600;                       // menos que esto se ve borroso en la ficha

export type ImageCheck = { ok: true } | { ok: false; reason: "type" | "size" | "too_small" };

export function checkImage(file: { type: string; size: number }, dims?: { width: number; height: number }): ImageCheck {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) return { ok: false, reason: "type" };
  if (file.size > MAX_INPUT_BYTES) return { ok: false, reason: "size" };
  if (dims && Math.min(dims.width, dims.height) < MIN_SIDE) return { ok: false, reason: "too_small" };
  return { ok: true };
}

/** Tamaños a generar sin agrandar nunca la foto original. Siempre al menos uno. */
export function plannedWidths(originalWidth: number): ImageWidth[] {
  const fit = IMAGE_WIDTHS.filter((w) => w <= originalWidth);
  return fit.length ? fit : [IMAGE_WIDTHS[0]];
}

export function scaledSize(width: number, height: number, target: number): { width: number; height: number } {
  if (width <= target) return { width, height };
  return { width: target, height: Math.round((height * target) / width) };
}

/** Rutas dentro del bucket: todo bajo la carpeta del producto (la base rechaza otra ruta). */
export function mediaPaths(productId: string, imageId: string, widths: ImageWidth[]) {
  if (!/^[0-9a-f-]{36}$/i.test(productId) || !/^[0-9a-f-]{36}$/i.test(imageId)) throw new Error("INVALID_ID");
  const variants = Object.fromEntries(widths.map((w) => [String(w), `${productId}/${imageId}-${w}.webp`])) as Record<string, string>;
  const largest = widths[widths.length - 1]!;
  return { storagePath: variants[String(largest)]!, variants };
}

/** Color dominante aproximado (#RRGGBB) a partir de píxeles RGBA (para el fondo mientras carga). */
export function averageColor(rgba: Uint8ClampedArray): string {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < rgba.length; i += 16) { // muestreo de 1 de cada 4 píxeles
    if (rgba[i + 3]! < 128) continue;
    r += rgba[i]!; g += rgba[i + 1]!; b += rgba[i + 2]!; n++;
  }
  if (!n) return "#F2EADB";
  const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
}
