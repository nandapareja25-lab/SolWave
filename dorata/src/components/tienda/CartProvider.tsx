"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ImageRef } from "@/server/types";

/**
 * Carrito local (localStorage "dorata_cart", declarado en la política de cookies como esencial).
 * Solo guarda qué piezas y cuántas; el precio que vale es SIEMPRE el que recalcula el servidor al pagar (fase 4).
 */
export type CartLine = {
  variantId: string;
  productSlug: string;
  categorySlug: string;
  name: string;
  variantTitle: string | null;
  priceCents: number;
  image: ImageRef;
  /** La pieza tiene garantía definida (para no prometer garantía en el carrito si no la tiene). */
  hasWarranty: boolean;
  qty: number;
};

type Ctx = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  lastAddedAt: number;
  lastRemoved: { line: CartLine; index: number } | null;
  undoRemove: () => void;
  clearRemoved: () => void;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "dorata_cart";
export const MAX_QTY = 10;

function read(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CartLine[]).filter((l) => typeof l?.variantId === "string" && Number.isInteger(l.qty) && l.qty > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [lastRemoved, setLastRemoved] = useState<{ line: CartLine; index: number } | null>(null);

  useEffect(() => {
    setLines(read());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setLines(read()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* almacenamiento lleno o bloqueado: el carrito sigue en memoria */ }
  }, [lines, hydrated]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.variantId === line.variantId);
      if (found) return prev.map((l) => (l.variantId === line.variantId ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l));
      return [...prev, { ...line, qty: Math.min(MAX_QTY, qty) }];
    });
    setLastAddedAt(Date.now());
  }, []);
  const setQty = useCallback((variantId: string, qty: number) => {
    setLines((prev) => prev.map((l) => (l.variantId === variantId ? { ...l, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : l)));
  }, []);
  const remove = useCallback((variantId: string) => {
    setLines((prev) => {
      const index = prev.findIndex((l) => l.variantId === variantId);
      if (index >= 0) setLastRemoved({ line: prev[index]!, index });
      return prev.filter((l) => l.variantId !== variantId);
    });
  }, []);
  const clearRemoved = useCallback(() => setLastRemoved(null), []);
  const undoRemove = useCallback(() => {
    setLastRemoved((r) => {
      if (r) setLines((prev) => (prev.some((l) => l.variantId === r.line.variantId) ? prev : [...prev.slice(0, r.index), r.line, ...prev.slice(r.index)]));
      return null;
    });
  }, []);

  const value = useMemo<Ctx>(() => ({
    lines, open, setOpen, add, setQty, remove, lastAddedAt, lastRemoved, undoRemove, clearRemoved,
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotalCents: lines.reduce((n, l) => n + l.qty * l.priceCents, 0),
  }), [lines, open, add, setQty, remove, lastAddedAt, lastRemoved, undoRemove, clearRemoved]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Ctx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart fuera de CartProvider");
  return ctx;
}
