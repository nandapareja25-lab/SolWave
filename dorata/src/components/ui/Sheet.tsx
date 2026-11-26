"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  title: string;
  closeLabel: string;
  tone?: "light" | "dark";
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Panel lateral accesible con <dialog> nativo: atrapa el foco, cierra con Escape y al tocar fuera,
 * devuelve el foco al botón que lo abrió y bloquea el scroll de fondo.
 */
export function Sheet({ open, onClose, side, title, closeLabel, tone = "light", children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && d.open) {
      d.close();
    }
    if (!open) document.documentElement.style.overflow = "";
  }, [open]);

  useEffect(() => () => { document.documentElement.style.overflow = ""; }, []);

  const dark = tone === "dark";
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className={`sheet sheet-${side} m-0 h-dvh max-h-dvh w-[min(88vw,400px)] max-w-none p-0 ${side === "left" ? "mr-auto" : "ml-auto"} ${dark ? "velvet on-dark" : "bg-ivory text-ink"}`}
    >
      <div className="flex h-full flex-col">
        <div className={`flex items-center justify-between border-b px-4 py-2 ${dark ? "border-velvet-line" : "border-line"}`}>
          <h2 className="font-display text-[20px] leading-tight">{title}</h2>
          <button type="button" onClick={onClose} aria-label={closeLabel} className="press grid size-11 place-items-center rounded-full">
            <X aria-hidden="true" size={22} strokeWidth={1.5} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer}
      </div>
    </dialog>
  );
}
