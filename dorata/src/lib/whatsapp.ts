/** Enlace wa.me con mensaje prellenado. Devuelve null si el número no es E.164 válido. */
export function whatsappLink(e164: string | null | undefined, message?: string): string | null {
  if (!e164 || !/^\+[1-9][0-9]{6,14}$/.test(e164)) return null;
  const base = `https://wa.me/${e164.slice(1)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
