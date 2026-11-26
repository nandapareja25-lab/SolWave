/** Piezas visuales comunes del panel (servidor o cliente). Escala de FICHA-ARTE: h1 32 · etiqueta 12/.14em. */
export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="rise mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[12px] font-semibold uppercase tracking-[.14em] text-gold-deep">{eyebrow}</p>}
        <h1 className="font-display text-[32px] leading-[1.1]">{title}</h1>
        <span aria-hidden="true" className="mt-3 block h-[5px] w-16 border-y border-gold/70" />
        {description && <p className="mt-3 max-w-2xl text-[14px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = "", step = 0, aside }: { title?: string; children: React.ReactNode; className?: string; step?: number; aside?: React.ReactNode }) {
  return (
    <section className={`rise rounded-[4px] border border-line bg-surface p-4 shadow-[0_1px_0_rgb(22_19_15/.03)] md:p-6 ${className}`} style={step ? { animationDelay: `${Math.min(step, 6) * 60}ms` } : undefined}>
      {(title || aside) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[12px] font-semibold uppercase tracking-[.14em] text-ink-2">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Pending({ phase, children }: { phase: string; children: React.ReactNode }) {
  return (
    <div className="filete-doble rounded-[4px] border border-line bg-surface p-6">
      <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-gold-deep">En construcción · Fase {phase}</p>
      <div className="mt-2 max-w-xl text-[15px] text-ink-2">{children}</div>
    </div>
  );
}

/** Mensaje de resultado (guardado / error) con aparición suave. */
export function StatusText({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <p role={ok ? "status" : "alert"} className={`fade-in text-[14px] ${ok ? "text-success" : "text-danger"}`}>{children}</p>;
}

/** Barra de guardado fija abajo: el botón siempre a mano. Debe ser hija directa del <form> (para que quede fija en toda la página). */
export function SaveBar({ children, dirty }: { children: React.ReactNode; dirty?: boolean }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur lg:col-span-full lg:-mx-8 lg:px-8">
      {children}
      {dirty && <span className="fade-in text-[13px] text-gold-deep">Cambios sin guardar</span>}
    </div>
  );
}

export const inputCls = "h-11 w-full rounded-[4px] border border-line bg-ivory px-3 text-[15px] outline-none focus:border-gold-deep disabled:opacity-60";
export const areaCls = "w-full rounded-[4px] border border-line bg-ivory p-3 text-[15px] leading-relaxed outline-none focus:border-gold-deep";
export const labelCls = "grid gap-1 text-[13px] font-medium text-ink-2";
export const helpCls = "text-[12px] font-normal text-ink-3";
export const btnPrimary = "press inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[14px] font-semibold text-on-dark disabled:opacity-60";
export const btnSecondary = "press inline-flex h-11 items-center justify-center gap-2 rounded-full border border-ink px-5 text-[14px] font-semibold text-ink disabled:opacity-60";
