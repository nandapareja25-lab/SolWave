"use client";

import { ProductImage } from "@/components/tienda/ProductImage";
import { useVariant } from "./VariantContext";
import type { ImageRef } from "@/server/types";

export function ProductGallery({ images, label }: { images: ImageRef[]; label: string }) {
  const { selected } = useVariant();
  const tint = selected.swatch ?? undefined;
  return (
    <ul className="rail !gap-0 !px-0 md:!grid md:!gap-2" aria-label={label}>
      {images.map((img, i) => (
        <li key={`${selected.id}-${i}`} className="fade-in w-full md:w-auto">
          <ProductImage image={{ ...img, tint: tint ?? img.tint, alt: selected.title && images.length ? `${img.alt} · ${selected.title}` : img.alt }} priority={i === 0} className="aspect-square md:rounded-[4px]" />
        </li>
      ))}
    </ul>
  );
}
