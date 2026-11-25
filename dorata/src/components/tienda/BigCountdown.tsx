"use client";

import { useEffect, useState } from "react";
import { countdownParts, msToNextSecond } from "@/lib/countdown";

/** Cuenta regresiva grande (Próximamente). Al llegar a cero muestra el mensaje final. */
export function BigCountdown({ target, serverNow, labels }: { target: string; serverNow: number; labels: { days: string; hours: string; minutes: string; seconds: string; arrived: string } }) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const tick = () => { const t = Date.now(); setNow(t); id = setTimeout(tick, msToNextSecond(t)); };
    id = setTimeout(tick, msToNextSecond(Date.now()));
    return () => clearTimeout(id);
  }, []);
  const p = countdownParts(target, now);
  if (p.done) return <p role="status" className="font-display text-[20px] text-gold">{labels.arrived}</p>;
  const cells = [[p.days, labels.days], [p.hours, labels.hours], [p.minutes, labels.minutes], [p.seconds, labels.seconds]] as const;
  return (
    <div className="grid grid-cols-4 gap-2" role="timer" aria-label={`${p.days} ${labels.days}, ${p.hours} ${labels.hours}, ${p.minutes} ${labels.minutes}`}>
      {cells.map(([n, label]) => (
        <div key={label} className="rounded-[4px] border border-velvet-line bg-velvet-2 py-3 text-center">
          <p aria-hidden="true" className="tabular font-display text-[28px] leading-none text-on-dark"><span key={n} className="digit">{String(n).padStart(2, "0")}</span></p>
          <p aria-hidden="true" className="mt-2 text-[12px] font-medium text-gold">{label}</p>
        </div>
      ))}
    </div>
  );
}
