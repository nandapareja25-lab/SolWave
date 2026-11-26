"use client";

import { useEffect } from "react";

/**
 * Entrada suave de secciones al bajar. NUNCA oculta contenido: solo desplaza (transform) y solo
 * a elementos que estaban fuera de la pantalla al cargar. Sin JS o con "reducir movimiento" no hace nada.
 */
export function Reveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal]")].filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.querySelectorAll<HTMLElement>("[data-reveal-item]").forEach((child, i) => { child.style.animationDelay = `${i * 60}ms`; child.classList.add("slide-up"); });
        el.classList.add("slide-up");
        io.unobserve(el);
      }
    }, { rootMargin: "0px 0px -10% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
