"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes, Gem, Layers, LayoutDashboard, LineChart, LogOut, Menu, Percent, Settings, ShieldCheck, ShoppingBag, Tags, Users, Wallet, X, ExternalLink,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import type { NavItem } from "./nav";

const ICONS = { Boxes, Gem, Layers, LayoutDashboard, LineChart, Percent, Settings, ShieldCheck, ShoppingBag, Tags, Users, Wallet } as const;

export function AdminShell({ nav, email, role, signOutAction, children }: {
  nav: NavItem[]; email: string; role: string; signOutAction: () => Promise<void>; children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  const links = (
    <nav aria-label="Panel" className="grid gap-1">
      {nav.map((n) => {
        const Icon = ICONS[n.icon as keyof typeof ICONS];
        return (
          <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={active(n.href) ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-[4px] px-3 text-[14px] transition-colors ${active(n.href) ? "bg-gold/15 font-semibold text-on-dark" : "text-on-dark-2 hover:bg-velvet-2 hover:text-on-dark"}`}>
            <Icon aria-hidden="true" size={18} strokeWidth={1.75} className={active(n.href) ? "text-gold" : ""} />
            <span className="flex-1">{n.label}</span>
            {n.phase && <span className="rounded-full border border-velvet-line px-2 text-[11px] text-on-dark-2">Fase {n.phase}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="mt-6 border-t border-velvet-line pt-4 text-[12px] text-on-dark-2">
      <p className="truncate">{email}</p>
      <p className="capitalize text-gold">{role === "owner" ? "Dueña" : role === "admin" ? "Administración" : "Equipo"}</p>
      <div className="mt-3 flex gap-2">
        <a href="/" target="_blank" rel="noopener" className="press flex h-10 flex-1 items-center justify-center gap-1 rounded-full border border-velvet-line text-[13px] text-on-dark">
          Ver tienda <ExternalLink aria-hidden="true" size={14} />
        </a>
        <form action={signOutAction}>
          <button type="submit" aria-label="Salir" className="press grid size-10 place-items-center rounded-full border border-velvet-line text-on-dark"><LogOut aria-hidden="true" size={16} /></button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="velvet sticky top-0 hidden h-dvh flex-col overflow-y-auto p-4 lg:flex">
        <div className="mb-6 flex justify-center"><Logo tone="dark" size="sm" /></div>
        <div className="flex-1">{links}</div>
        {footer}
      </aside>

      <header className="velvet sticky top-0 z-30 flex h-14 items-center justify-between px-2 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menú del panel" className="press grid size-11 place-items-center"><Menu aria-hidden="true" size={22} /></button>
        <Logo tone="dark" size="sm" />
        <span className="size-11" aria-hidden="true" />
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú del panel">
          <button type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)} className="absolute inset-0 bg-velvet/60" />
          <div className="velvet absolute inset-y-0 left-0 flex w-[min(86vw,300px)] flex-col overflow-y-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <Logo tone="dark" size="sm" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú" className="press grid size-11 place-items-center"><X aria-hidden="true" size={20} /></button>
            </div>
            <div className="flex-1">{links}</div>
            {footer}
          </div>
        </div>
      )}
      <main id="contenido" className="min-w-0 px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}
