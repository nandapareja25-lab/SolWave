"use client";

import { useState } from "react";
import { readableWallTime, tzLabel } from "@/lib/tz";
import { helpCls, inputCls, labelCls } from "./ui";

/**
 * Campo de fecha y hora: el selector del navegador puede verse en formato de EE. UU. (mm/dd, AM/PM),
 * así que debajo se muestra siempre la fecha en español y la zona horaria en palabras.
 * Funciona controlado (value/onChange) o dentro de un <form> normal (name/defaultValue).
 */
export function DateTimeField({ label, name, value, defaultValue, onChange, timezone, emptyText, disabled, required }: {
  label: string; name?: string; value?: string; defaultValue?: string; onChange?: (v: string) => void;
  timezone: string; emptyText?: string; disabled?: boolean; required?: boolean;
}) {
  const [inner, setInner] = useState(defaultValue ?? "");
  const v = value ?? inner;
  return (
    <label className={labelCls}>
      {label}
      <input type="datetime-local" name={name} value={v} disabled={disabled} required={required}
        onChange={(e) => { setInner(e.target.value); onChange?.(e.target.value); }} className={inputCls} />
      <span className={helpCls}>{v ? `${readableWallTime(v)} · ${tzLabel(timezone)}` : (emptyText ?? `Elige día y hora · ${tzLabel(timezone)}`)}</span>
    </label>
  );
}
