/** Piezas visuales comunes del panel (servidor o cliente). */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] leading-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[14px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[4px] border border-line bg-surface p-4 md:p-6 ${className}`}>
      {title && <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[.12em] text-ink-2">{title}</h2>}
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

export const inputCls = "h-11 w-full rounded-[4px] border border-line bg-ivory px-3 text-[15px] outline-none focus:border-gold-deep disabled:opacity-60";
export const labelCls = "grid gap-1 text-[13px] font-medium text-ink-2";
export const btnPrimary = "press inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[14px] font-semibold text-on-dark disabled:opacity-60";
export const btnSecondary = "press inline-flex h-11 items-center justify-center gap-2 rounded-full border border-ink px-5 text-[14px] font-semibold text-ink disabled:opacity-60";
