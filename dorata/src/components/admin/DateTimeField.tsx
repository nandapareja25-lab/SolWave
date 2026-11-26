"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { readableWallTime, tzLabel } from "@/lib/tz";
import { helpCls } from "./ui";

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const sel = "h-11 min-w-0 rounded-[4px] border border-line bg-ivory px-2 text-[15px] outline-none focus:border-gold-deep disabled:opacity-60";
const pad = (n: number) => String(n).padStart(2, "0");

type Parts = { y: string; m: string; d: string; h: string; min: string; ap: "am" | "pm" };
function split(v: string): Parts | null {
  const x = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!x) return null;
  const H = Number(x[4]);
  return { y: x[1]!, m: String(Number(x[2])), d: String(Number(x[3])), h: String(H % 12 === 0 ? 12 : H % 12), min: x[5]!, ap: H >= 12 ? "pm" : "am" };
}
function join(p: Parts): string {
  const H = (Number(p.h) % 12) + (p.ap === "pm" ? 12 : 0);
  const maxDay = new Date(Date.UTC(Number(p.y), Number(p.m), 0)).getUTCDate(); // 31 → 30 en abril, 29/28 en febrero
  return `${p.y}-${pad(Number(p.m))}-${pad(Math.min(Number(p.d), maxDay))}T${pad(H)}:${p.min}`;
}

/**
 * Fecha y hora en español (día · mes · año · hora · a. m./p. m.), sin depender del formato del navegador
 * (que en EE. UU. muestra mm/dd/yyyy). Guarda "YYYY-MM-DDTHH:mm" en la hora del negocio.
 * Controlado (value/onChange) o dentro de un <form> (name/defaultValue → input oculto).
 */
export function DateTimeField({ label, name, value, defaultValue, onChange, timezone, emptyText, disabled, required }: {
  label: string; name?: string; value?: string; defaultValue?: string; onChange?: (v: string) => void;
  timezone: string; emptyText?: string; disabled?: boolean; required?: boolean;
}) {
  const id = useId();
  const [inner, setInner] = useState(defaultValue ?? "");
  const v = value ?? inner;
  // Avisa al <form> que hubo un cambio (para "Cambios sin guardar"), también cuando cambia con un botón.
  const hiddenRef = useRef<HTMLInputElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    hiddenRef.current?.dispatchEvent(new Event("change", { bubbles: true }));
  }, [v]);
  const p = split(v);
  const thisYear = new Date().getFullYear();
  const years = Array.from(new Set([thisYear, thisYear + 1, thisYear + 2, ...(p ? [Number(p.y)] : [])])).sort();
  const emit = (next: string) => { setInner(next); onChange?.(next); };
  const update = (patch: Partial<Parts>) => emit(join({ ...(p ?? defaultParts()), ...patch }));
  function defaultParts(): Parts {
    const now = new Date();
    return { y: String(now.getFullYear()), m: String(now.getMonth() + 1), d: String(now.getDate()), h: "12", min: "00", ap: "am" };
  }

  return (
    <fieldset className="grid min-w-0 gap-1" disabled={disabled}>
      <legend className="mb-1 text-[13px] font-medium text-ink-2">{label}</legend>
      <input ref={hiddenRef} type="hidden" name={name} value={v} />
      {p ? (
        <div className="grid gap-2">
          <div className="grid grid-cols-[64px_minmax(0,1fr)_84px] gap-2">
            <select aria-label={`${label}: día`} value={p.d} onChange={(e) => update({ d: e.target.value })} className={sel} id={`${id}-d`}>
              {Array.from({ length: 31 }, (_, i) => <option key={i} value={String(i + 1)}>{i + 1}</option>)}
            </select>
            <select aria-label={`${label}: mes`} value={p.m} onChange={(e) => update({ m: e.target.value })} className={sel}>
              {MONTHS.map((mo, i) => <option key={mo} value={String(i + 1)}>{mo}</option>)}
            </select>
            <select aria-label={`${label}: año`} value={p.y} onChange={(e) => update({ y: e.target.value })} className={sel}>
              {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select aria-label={`${label}: hora`} value={p.h} onChange={(e) => update({ h: e.target.value })} className={`${sel} w-16`}>
              {Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1)}>{i + 1}</option>)}
            </select>
            <span aria-hidden="true" className="text-ink-3">:</span>
            <select aria-label={`${label}: minutos`} value={p.min} onChange={(e) => update({ min: e.target.value })} className={`${sel} w-16`}>
              {Array.from(new Set([...Array.from({ length: 12 }, (_, i) => pad(i * 5)), p.min])).sort().map((mm) => <option key={mm} value={mm}>{mm}</option>)}
            </select>
            <select aria-label={`${label}: mañana o tarde`} value={p.ap} onChange={(e) => update({ ap: e.target.value as "am" | "pm" })} className={`${sel} w-20`}>
              <option value="am">a. m.</option><option value="pm">p. m.</option>
            </select>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className={helpCls}>{readableWallTime(v)} · {tzLabel(timezone)}</span>
            {!required && (
              <button type="button" onClick={() => emit("")} className="press -mt-1 shrink-0 whitespace-nowrap py-1 text-[13px] text-ink-2 underline underline-offset-4">
                Quitar fecha
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-1">
          <button type="button" onClick={() => emit(join(defaultParts()))} className="press flex h-11 w-full items-center justify-between rounded-[4px] border border-line bg-ivory px-3 text-left text-[15px] text-ink-3 hover:border-ink-3">
            Elegir fecha y hora<CalendarDays aria-hidden="true" size={18} className="text-ink-2" />
          </button>
          <span className={helpCls}>{emptyText ?? `Sin fecha · ${tzLabel(timezone)}`}</span>
        </div>
      )}
    </fieldset>
  );
}
