/** Dos letras para distinguir piezas sin foto: "Pulseras de hilo" → "PH", "Pulseras" → "PU", "Día de la Madre" → "DM". */
export function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => w.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(w));
  const out = words.length > 1 ? words[0]![0]! + words[words.length - 1]![0]! : (words[0] ?? name).slice(0, 2);
  return (out || "?").toUpperCase();
}
