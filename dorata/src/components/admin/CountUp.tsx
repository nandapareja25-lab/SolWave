"use client";

import { useEffect, useRef, useState } from "react";

/** Número que cuenta desde 0 al valor (400 ms). Respeta "reducir movimiento" y empieza ya mostrado en el servidor. */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [shown, setShown] = useState(value);
  const first = useRef(true);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(value); return; }
    const from = first.current ? 0 : shown;
    first.current = false;
    const t0 = performance.now(); let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 400);
      setShown(Math.round(from + (value - from) * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo reacciona a cambios del valor final
  }, [value]);
  return <>{shown}{suffix}</>;
}
