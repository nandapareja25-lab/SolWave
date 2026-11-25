"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useCart, type CartLine } from "./CartProvider";

/** "+" de la tarjeta: agrega la pieza (si tiene una sola opción) con confirmación visible. */
export function QuickAdd({ line, label, addedLabel }: { line: Omit<CartLine, "qty">; label: string; addedLabel: string }) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { add(line); setDone(true); setTimeout(() => setDone(false), 1400); }}
      aria-label={done ? addedLabel : label}
      className={`press absolute bottom-2 right-2 z-[2] grid size-11 place-items-center rounded-full shadow-[0_2px_8px_rgba(40,30,15,.14)] ${done ? "shine bg-ink text-gold" : "bg-surface text-ink"}`}
    >
      {done ? <Check aria-hidden="true" size={18} strokeWidth={2} /> : <Plus aria-hidden="true" size={18} strokeWidth={1.75} />}
    </button>
  );
}
