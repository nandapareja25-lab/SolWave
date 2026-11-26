import type { AdminRole } from "@/server/admin/auth";

export type NavItem = { href: string; label: string; icon: string; min: AdminRole; phase?: string };

/** Menú del panel (orden pedido por la dueña). `phase` = sección aún en construcción. */
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard", min: "staff" },
  { href: "/admin/productos", label: "Productos", icon: "Gem", min: "staff" },
  { href: "/admin/categorias", label: "Categorías", icon: "Tags", min: "staff" },
  { href: "/admin/colecciones", label: "Colecciones", icon: "Layers", min: "staff", phase: "3" },
  { href: "/admin/inventario", label: "Inventario", icon: "Boxes", min: "staff" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "ShoppingBag", min: "staff", phase: "5" },
  { href: "/admin/clientes", label: "Clientes", icon: "Users", min: "staff", phase: "5" },
  { href: "/admin/garantias", label: "Garantías", icon: "ShieldCheck", min: "staff", phase: "5" },
  { href: "/admin/descuentos", label: "Descuentos", icon: "Percent", min: "admin", phase: "4" },
  { href: "/admin/finanzas", label: "Finanzas", icon: "Wallet", min: "admin", phase: "6" },
  { href: "/admin/analitica", label: "Analítica", icon: "LineChart", min: "admin", phase: "6" },
  { href: "/admin/configuracion", label: "Configuración", icon: "Settings", min: "admin" },
];
