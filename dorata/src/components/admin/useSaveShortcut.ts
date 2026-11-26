"use client";

import { useEffect } from "react";

/** Ctrl+S / Cmd+S guarda el formulario indicado (en vez de "guardar página" del navegador). */
export function useSaveShortcut(formRef: React.RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); formRef.current?.requestSubmit(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [formRef]);
}
