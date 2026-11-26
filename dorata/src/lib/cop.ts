/** Pesos colombianos como los escribe la dueña: "40.000 COP" o "39.999,99 COP" (decimales solo si los hay). */
export function formatCOP(n: number | null | undefined): string {
  if (n == null) return "sin costo";
  const int = Math.trunc(n), cents = Math.round((n - int) * 100);
  const thousands = String(Math.abs(int)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${n < 0 ? "-" : ""}${thousands}${cents ? `,${String(Math.abs(cents)).padStart(2, "0")}` : ""} COP`;
}
