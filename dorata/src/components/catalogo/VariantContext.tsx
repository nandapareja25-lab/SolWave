"use client";

import { createContext, useContext, useState } from "react";
import type { Variant } from "@/server/types";

type Ctx = { variants: Variant[]; selected: Variant; select: (id: string) => void };
const VariantCtx = createContext<Ctx | null>(null);

/** Comparte la opción elegida entre la galería y el botón de compra (la foto sigue al color del hilo). */
export function VariantProvider({ variants, children }: { variants: Variant[]; children: React.ReactNode }) {
  const first = variants.find((v) => v.available) ?? variants[0]!;
  const [id, setId] = useState(first.id);
  const selected = variants.find((v) => v.id === id) ?? first;
  return <VariantCtx.Provider value={{ variants, selected, select: setId }}>{children}</VariantCtx.Provider>;
}

export function useVariant(): Ctx {
  const ctx = useContext(VariantCtx);
  if (!ctx) throw new Error("useVariant fuera de VariantProvider");
  return ctx;
}
