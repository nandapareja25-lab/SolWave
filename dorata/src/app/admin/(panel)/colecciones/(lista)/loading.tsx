/** Mientras carga una sección del panel: esqueleto con la forma de una lista (sin spinner). */
export default function PanelLoading() {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <div className="skeleton mb-3 h-9 w-48 rounded-[4px]" />
      <div className="skeleton mb-6 h-4 w-72 max-w-full rounded-[4px]" />
      <ul className="grid gap-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-3 rounded-[4px] border border-line bg-surface p-3">
            <div className="skeleton size-16 shrink-0 rounded-[4px]" />
            <div className="grid flex-1 gap-2"><div className="skeleton h-4 w-3/4 rounded-[4px]" /><div className="skeleton h-3 w-1/2 rounded-[4px]" /><div className="skeleton h-3 w-1/3 rounded-[4px]" /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
