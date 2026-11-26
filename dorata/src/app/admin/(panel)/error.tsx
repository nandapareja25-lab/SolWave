"use client";

import { RotateCw } from "lucide-react";

/** Si una sección del panel falla, el resto sigue funcionando y se puede reintentar. */
export default function PanelError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="filete-doble rounded-[4px] border border-line bg-surface p-6">
      <p className="font-display text-[22px]">No pudimos cargar esta sección</p>
      <p className="mt-2 max-w-md text-[14px] text-ink-2">Puede ser la conexión a internet. Tus datos están a salvo: no se perdió nada.</p>
      <button type="button" onClick={reset} className="press mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-semibold text-on-dark">
        <RotateCw aria-hidden="true" size={16} />Intentar de nuevo
      </button>
    </div>
  );
}
