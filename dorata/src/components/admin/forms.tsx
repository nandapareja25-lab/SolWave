"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { btnPrimary, btnSecondary } from "./ui";
import { useUnsavedGuard } from "./useUnsavedGuard";

export type ActionResult = { ok: boolean; message: string } | null;

/**
 * Tarjeta de ajustes que se guarda sola (páginas con varias tarjetas independientes, como Configuración).
 * Regla del panel: el botón dice QUÉ guarda ("Guardar contacto") y solo se vuelve negro (principal) cuando
 * esa tarjeta tiene cambios; así nunca hay varios botones principales compitiendo.
 * Los editores de una sola cosa (producto, categoría…) usan la barra fija SaveBar.
 * Avisa "Cambios sin guardar" (y antes de salir), muestra el resultado en lenguaje simple y bloquea el doble envío.
 */
export function ActionForm({ action, children, submitLabel = "Guardar", className = "", primary = false }: {
  action: (prev: ActionResult, form: FormData) => Promise<ActionResult>;
  children: React.ReactNode; submitLabel?: string; className?: string;
  /** Acciones que no dependen de cambios (ej. "Publicar versión"): siempre botón principal. */
  primary?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, null);
  const [dirty, setDirty] = useState(false);
  const [shown, setShown] = useState<ActionResult>(null);
  const msgRef = useRef<HTMLParagraphElement>(null);
  useUnsavedGuard(dirty);
  useEffect(() => {
    if (!state) return;
    setShown(state);
    if (state.ok) setDirty(false);
    msgRef.current?.focus();
  }, [state]);
  return (
    <form action={formAction} onChange={() => { setDirty(true); setShown(null); }}
      onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); e.currentTarget.requestSubmit(); } }}
      className={`grid gap-4 ${className}`}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={dirty || primary ? btnPrimary : btnSecondary.replace("border-ink", "border-line")}>
          {pending ? <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <Check aria-hidden="true" size={16} />}
          {submitLabel}
        </button>
        {shown ? (
          <p ref={msgRef} tabIndex={-1} role={shown.ok ? "status" : "alert"} className={`fade-in text-[14px] outline-none ${shown.ok ? "text-success" : "text-danger"}`}>
            {shown.message}
          </p>
        ) : dirty && <span className="fade-in text-[13px] text-gold-deep">Cambios sin guardar</span>}
      </div>
    </form>
  );
}
