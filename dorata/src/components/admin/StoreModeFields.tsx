"use client";

import { useState } from "react";
import { DateTimeField } from "./DateTimeField";
import { helpCls, inputCls, labelCls } from "./ui";

const MODES = [
  { value: "coming_soon", label: "Próximamente", help: "Toda la tienda muestra la página de lanzamiento con cuenta regresiva y lista de espera. Las políticas siguen visibles." },
  { value: "live", label: "Tienda activa", help: "La tienda completa queda abierta al público." },
  { value: "maintenance", label: "Mantenimiento", help: "Toda la tienda muestra un aviso de “volvemos en un momento”. Úsalo si necesitas cerrar temporalmente." },
] as const;

/** Modo de la tienda: cada campo extra aparece solo cuando aplica a la opción elegida. */
export function StoreModeFields({ mode, liveAt, maintenance, timezone }: { mode: string; liveAt: string; maintenance: string; timezone: string }) {
  const [m, setM] = useState(mode);
  return (
    <>
      <fieldset className="grid gap-2">
        <legend className="sr-only">Estado</legend>
        {MODES.map((x) => (
          <label key={x.value} className="flex cursor-pointer gap-3 rounded-[4px] border border-line p-3 transition-colors has-[:checked]:border-ink has-[:checked]:bg-ivory">
            <input type="radio" name="store_mode" value={x.value} checked={m === x.value} onChange={() => setM(x.value)} className="mt-1 accent-[var(--ink)]" />
            <span><span className="block text-[15px] font-semibold">{x.label}</span><span className="block text-[13px] text-ink-2">{x.help}</span></span>
          </label>
        ))}
      </fieldset>
      {m === "coming_soon" && (
        <div className="fade-in grid gap-1">
          <DateTimeField label="Abrir la tienda automáticamente (opcional)" name="live_at" defaultValue={liveAt} timezone={timezone}
            emptyText="Vacío: la tienda sigue en Próximamente hasta que la abras tú." />
        </div>
      )}
      {m === "maintenance" && (
        <label className={`fade-in ${labelCls}`}>
          Mensaje para tus clientas (opcional)
          <input name="maintenance_message" maxLength={240} defaultValue={maintenance} className={inputCls} placeholder="Ej: Volvemos en unas horas con novedades." />
          <span className={helpCls}>Vacío: se muestra “Volvemos en un momento”.</span>
        </label>
      )}
      {m !== "maintenance" && <input type="hidden" name="maintenance_message" value={maintenance} />}
      <p className="text-[13px] text-ink-3">
        Mientras la tienda está cerrada, tú puedes verla completa con tu enlace privado: tu dominio + <span className="whitespace-nowrap">“?vista_previa=”</span> + la frase secreta que guardaste al publicar.
      </p>
    </>
  );
}
