/** Duración legible de una garantía. null = la dueña aún no la define → "por definir". */
export function formatWarranty(months: number | null | undefined): string {
  if (months === null || months === undefined) return "por definir";
  if (months % 12 === 0) { const y = months / 12; return `${y} ${y === 1 ? "año" : "años"}`; }
  return `${months} ${months === 1 ? "mes" : "meses"}`;
}

/** Solo políticas con duración definida, de menor a mayor (para "1 año / 5 años"). */
export function definedByDuration<T extends { months: number | null }>(list: T[]): (T & { months: number })[] {
  return list.filter((p): p is T & { months: number } => p.months !== null).sort((a, b) => a.months - b.months);
}
