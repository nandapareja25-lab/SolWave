"use client";

import { useEffect } from "react";

const MESSAGE = "Tienes cambios sin guardar. ¿Salir de todas formas?";

/**
 * Mientras `dirty` sea true: avisa al cerrar/recargar la pestaña y al tocar cualquier enlace interno.
 * Así la dueña no pierde lo que escribió por tocar "volver" o el menú.
 */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = MESSAGE; };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement).closest("a[href]");
      if (!a || a.getAttribute("target") === "_blank") return;
      if (!window.confirm(MESSAGE)) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("click", onClick, true);
    return () => { window.removeEventListener("beforeunload", onUnload); document.removeEventListener("click", onClick, true); };
  }, [dirty]);
}
