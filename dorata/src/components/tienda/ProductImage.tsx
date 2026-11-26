import { Jewel } from "@/components/brand/Jewel";
import type { ImageRef } from "@/server/types";

type Props = { image: ImageRef; surface?: "studio" | "velvet"; className?: string; sizes?: string; priority?: boolean };

/** Foto real si existe (variantes WebP del Storage); si no, ilustración sobre fondo de estudio. */
export function ProductImage({ image, surface = "studio", className = "", priority }: Props) {
  return (
    <div className={`relative grid place-items-center overflow-hidden ${surface === "velvet" ? "velvet-photo" : "studio"} ${className}`} role="img" aria-label={image.alt}>
      {image.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- variantes ya optimizadas al subir
        <img src={image.url} alt="" className="absolute inset-0 h-full w-full object-cover" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" />
      ) : (
        <>
          <Jewel kind={image.illustration} tint={image.tint} className="relative z-[1] h-[68%] w-[68%] drop-shadow-[0_6px_8px_rgba(70,50,20,.18)]" />
          <span aria-hidden="true" className="absolute bottom-[14%] left-[22%] right-[22%] h-2.5 rounded-[50%] bg-[radial-gradient(rgba(60,45,20,.18),transparent_70%)]" />
        </>
      )}
    </div>
  );
}
