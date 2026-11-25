/** Dinero siempre en centavos enteros (USD). */
export type Cents = number;

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatUSD(cents: Cents): string {
  if (!Number.isInteger(cents)) throw new Error("formatUSD espera centavos enteros");
  return usd.format(cents / 100);
}

/** Porcentaje de descuento redondeado hacia abajo (nunca prometer más de lo real). */
export function discountPercent(priceCents: Cents, compareAtCents: Cents | null | undefined): number | null {
  if (!compareAtCents || compareAtCents <= priceCents) return null;
  return Math.floor(((compareAtCents - priceCents) / compareAtCents) * 100);
}
