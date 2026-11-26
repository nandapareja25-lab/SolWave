/** Esqueleto con la forma del contenido (nunca spinner). */
export function GridSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="mx-auto max-w-6xl px-4 pt-6">
      <div className="skeleton h-8 w-48 rounded-[4px]" />
      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}><div className="skeleton aspect-[4/5] rounded-[4px]" /><div className="skeleton mt-3 h-4 w-3/4 rounded" /><div className="skeleton mt-2 h-4 w-1/3 rounded" /></div>
        ))}
      </div>
    </div>
  );
}
