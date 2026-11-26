"use client";

import { averageColor, checkImage, mediaPaths, plannedWidths, scaledSize, type ImageWidth } from "@/lib/images";

export type PreparedImage = {
  imageId: string;
  width: number;
  height: number;
  dominantColor: string;
  storagePath: string;
  variants: Record<string, string>;
  blobs: { path: string; blob: Blob }[];
};

/**
 * Reduce una foto en el navegador a WebP de 400/800/1600 px (calidad 0.82), sin metadatos EXIF
 * (se eliminan ubicación y datos del teléfono). Se usa en el panel (fase 3) antes de subir a Storage.
 */
export async function prepareProductImage(file: File, productId: string): Promise<PreparedImage> {
  const first = checkImage(file);
  if (!first.ok) throw new Error(`IMAGE_${first.reason.toUpperCase()}`);
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const dims = checkImage(file, { width: bitmap.width, height: bitmap.height });
  if (!dims.ok) { bitmap.close(); throw new Error(`IMAGE_${dims.reason.toUpperCase()}`); }

  const imageId = crypto.randomUUID();
  const widths: ImageWidth[] = plannedWidths(bitmap.width);
  const { storagePath, variants } = mediaPaths(productId, imageId, widths);
  const blobs: { path: string; blob: Blob }[] = [];
  let dominantColor = "#F2EADB";

  for (const w of widths) {
    const size = scaledSize(bitmap.width, bitmap.height, w);
    const canvas = new OffscreenCanvas(size.width, size.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("CANVAS_UNAVAILABLE");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    if (w === widths[0]) dominantColor = averageColor(ctx.getImageData(0, 0, size.width, size.height).data);
    const blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.82 });
    blobs.push({ path: variants[String(w)]!, blob });
  }
  const out = { imageId, width: bitmap.width, height: bitmap.height, dominantColor, storagePath, variants, blobs };
  bitmap.close();
  return out;
}

/** Una sola imagen WebP (por defecto 800 px de ancho) para categorías y colecciones. */
export async function prepareSingleImage(file: File, width = 800): Promise<Blob> {
  const first = checkImage(file);
  if (!first.ok) throw new Error(`IMAGE_${first.reason.toUpperCase()}`);
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const size = scaledSize(bitmap.width, bitmap.height, Math.min(width, bitmap.width));
  const canvas = new OffscreenCanvas(size.width, size.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) { bitmap.close(); throw new Error("CANVAS_UNAVAILABLE"); }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  return canvas.convertToBlob({ type: "image/webp", quality: 0.82 });
}
