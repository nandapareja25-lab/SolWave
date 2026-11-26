"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/configuracion", label: "Tienda" },
  { href: "/admin/configuracion/banner", label: "Banner" },
  { href: "/admin/configuracion/envios", label: "Envíos" },
  { href: "/admin/configuracion/garantias", label: "Garantías" },
  { href: "/admin/configuracion/legal", label: "Legal y privacidad" },
];

export function ConfigTabs() {
  const path = usePathname();
  return (
    <nav aria-label="Secciones de configuración" className="-mx-4 mb-6 overflow-x-auto px-4">
      <ul className="flex gap-2">
        {TABS.map((t) => {
          const on = t.href === "/admin/configuracion" ? path === t.href : path.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={on ? "page" : undefined}
                className={`press flex h-10 items-center whitespace-nowrap rounded-full border px-4 text-[14px] ${on ? "border-ink bg-ink font-semibold text-on-dark" : "border-line bg-surface"}`}>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
