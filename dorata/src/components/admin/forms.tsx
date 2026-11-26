"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, Loader2 } from "lucide-react";
import { btnPrimary } from "./ui";

export type ActionResult = { ok: boolean; message: string } | null;

/** Formulario con estado: muestra "Guardado" o el error en lenguaje simple, y bloquea el doble envío. */
export function ActionForm({ action, children, submitLabel = "Guardar", className = "" }: {
  action: (prev: ActionResult, form: FormData) => Promise<ActionResult>;
  children: React.ReactNode; submitLabel?: string; className?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, null);
  const msgRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state) msgRef.current?.focus(); }, [state]);
  return (
    <form action={formAction} className={`grid gap-4 ${className}`}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <Check aria-hidden="true" size={16} />}
          {submitLabel}
        </button>
        {state && (
          <p ref={msgRef} tabIndex={-1} role={state.ok ? "status" : "alert"} className={`text-[14px] outline-none ${state.ok ? "text-success" : "text-danger"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
