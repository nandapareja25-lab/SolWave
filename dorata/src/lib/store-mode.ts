export type StoreMode = "coming_soon" | "live" | "maintenance";

export type RouteDecision =
  | { action: "next" }
  | { action: "rewrite"; to: "/proximamente" | "/mantenimiento" }
  | { action: "redirect"; to: "/" };

/** Rutas que siempre deben verse (legales, privacidad, páginas de sistema). */
export type AlwaysPublic = (pathname: string) => boolean;

/**
 * Decide qué ve el visitante según el modo de la tienda.
 * - live: todo normal; /proximamente y /mantenimiento redirigen al inicio.
 * - coming_soon: todo lo de la tienda muestra Próximamente (las legales siguen visibles).
 * - maintenance: todo muestra Mantenimiento (las legales siguen visibles).
 * Quien tiene la cookie de vista previa ve la tienda real en cualquier modo.
 */
export function decideRoute(mode: StoreMode, pathname: string, hasPreview: boolean, isAlwaysPublic: AlwaysPublic): RouteDecision {
  const path = pathname.replace(/\/+$/, "") || "/";
  const isSystemPage = path === "/proximamente" || path === "/mantenimiento";

  if (mode === "live" || hasPreview) {
    return isSystemPage && mode === "live" ? { action: "redirect", to: "/" } : { action: "next" };
  }
  if (isAlwaysPublic(path)) return { action: "next" };
  const target = mode === "coming_soon" ? "/proximamente" : "/mantenimiento";
  if (path === target) return { action: "next" };
  return { action: "rewrite", to: target };
}

export function parseStoreMode(value: unknown): StoreMode | null {
  return value === "coming_soon" || value === "live" || value === "maintenance" ? value : null;
}
