/** "Pulseras de Hilo Ñandú" → "pulseras-de-hilo-nandu" (minúsculas, sin acentos, guiones). */
export function slugify(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/&/g, " y ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-").slice(0, 80).replace(/-+$/, "");
}
export const isValidSlug = (s: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
/** Direcciones que ya usa la tienda: una categoría no puede llamarse así. */
export const RESERVED_SLUGS = ["tienda", "admin", "api", "proximamente", "mantenimiento", "carrito", "checkout", "cuenta", "buscar", "en", "es"];
