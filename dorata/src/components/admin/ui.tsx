/** Piezas visuales comunes del panel (servidor o cliente). Escala de FICHA-ARTE: h1 32 · etiqueta 12/.14em. */
export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="rise mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[12px] font-semibold uppercase tracking-[.14em] text-gold-deep">{eyebrow}</p>}
        <h1 className="font-display text-[32px] leading-[1.1]">{title.split(" + ").map((part, i) => <span key={i}>{i > 0 && <span className="font-sans font-medium"> + </span>}{part}</span>)}</h1>
        <span aria-hidden="true" className="mt-3 block h-[5px] w-16 border-y border-gold/70" />
        {description && <p className="mt-3 max-w-2xl text-[14px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = "", step = 0, aside, collapsible, summary, defaultOpen = false, id }: {
  title?: string; children: React.ReactNode; className?: string; step?: number; aside?: React.ReactNode;
  /** Sección secundaria plegable: muestra `summary` (una línea) mientras está cerrada. */
  collapsible?: boolean; summary?: React.ReactNode; defaultOpen?: boolean; id?: string;
}) {
  const cls = `rise rounded-[4px] border border-line bg-surface shadow-[0_1px_0_rgb(22_19_15/.03)] ${className}`;
  const style = step ? { animationDelay: `${Math.min(step, 6) * 60}ms` } : undefined;
  if (collapsible) {
    return (
      <details id={id} open={defaultOpen} className={`group ${cls}`} style={style}>
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 p-4 md:px-6 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-semibold uppercase tracking-[.14em] text-ink-2">{title}</span>
            {summary && <span className="mt-1 block truncate text-[14px] text-ink group-open:hidden">{summary}</span>}
          </span>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="shrink-0 text-ink-3 transition-transform group-open:rotate-180 motion-reduce:transition-none"><path d="m6 9 6 6 6-6" /></svg>
        </summary>
        <div className="px-4 pb-4 md:px-6 md:pb-6">{children}</div>
      </details>
    );
  }
  return (
    <section id={id} className={`${cls} p-4 md:p-6`} style={style}>
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

/**
 * Barra de guardado fija abajo: el botón siempre a mano y el estado siempre visible.
 * Debe ser hija directa del <form>. Ctrl/Cmd+S guarda (ver useSaveShortcut).
 */
export function SaveBar({ children, dirty, status, quiet }: { children: React.ReactNode; dirty?: boolean; status?: React.ReactNode;
  /** true = no hay nada que guardar: el botón se ve con contorno (como en las tarjetas de Configuración). */
  quiet?: boolean }) {
  return (
    <div className={`sticky bottom-0 z-20 order-last -mx-4 grid gap-2 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur lg:col-span-full lg:-mx-8 lg:flex lg:items-center lg:px-8 [&>button]:w-full lg:[&>button]:w-auto ${quiet ? "[&>button]:border [&>button]:border-line [&>button]:bg-surface [&>button]:text-ink" : ""}`}>
      <div className="min-h-5 text-[13px] lg:order-2" aria-live="polite">
        {status ?? (dirty ? <span className="fade-in text-gold-deep">Cambios sin guardar</span> : <span className="text-ink-3">Todo guardado</span>)}
      </div>
      {children}
    </div>
  );
}

export const inputCls = "h-11 w-full rounded-[4px] border border-line bg-ivory px-3 text-[15px] outline-none focus:border-gold-deep disabled:opacity-60";
export const areaCls = "w-full rounded-[4px] border border-line bg-ivory p-3 text-[15px] leading-relaxed outline-none focus:border-gold-deep";
export const labelCls = "grid gap-1 text-[13px] font-medium text-ink-2";
export const helpCls = "text-[12px] font-normal text-ink-3";
export const btnPrimary = "press inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[14px] font-semibold text-on-dark disabled:opacity-60";
export const btnSecondary = "press inline-flex h-11 items-center justify-center gap-2 rounded-full border border-ink px-5 text-[14px] font-semibold text-ink disabled:opacity-60";
/** Acción secundaria dentro de una tarjeta (agregar, registrar). Un solo estilo para todas. */
export const btnQuiet = "press inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 text-[14px] text-ink disabled:opacity-40";
/** Chip pequeño de acción en una fila (activar, hacer principal). */
export const chipBtn = "press inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] disabled:opacity-40";

/** Lee los campos con `name` dentro de un contenedor (para mini-formularios dentro de otro <form>, donde un <form> anidado no es válido). */
export function collectFields(el: Element | null): Record<string, string> {
  const out: Record<string, string> = {};
  el?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input[name],select[name],textarea[name]").forEach((f) => { out[f.name] = f.value; });
  return out;
}
