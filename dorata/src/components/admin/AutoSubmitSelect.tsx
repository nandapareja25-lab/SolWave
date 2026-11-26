"use client";

/** Desplegable que aplica el filtro apenas se elige (sin botón "Filtrar"). */
export function AutoSubmitSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
