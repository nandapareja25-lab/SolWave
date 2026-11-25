"use client";

import { useState } from "react";
import { useVariant } from "./VariantContext";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { formatUSD } from "@/lib/money";
import { MAX_QTY, useCart } from "@/components/tienda/CartProvider";
import type { ImageRef } from "@/server/types";

type Labels = Record<"variant" | "soldOutShort" | "quantity" | "decrease" | "increase" | "addToCart" | "added" | "soldOut" | "lowStock", string>;

export function AddToCart({ product, labels }: {
  product: { slug: string; categorySlug: string; name: string; image: ImageRef; hasWarranty: boolean };
  labels: Labels;
}) {
  const { add, setOpen } = useCart();
  const { variants, selected: v, select } = useVariant();
  const selected = v.id;
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const many = variants.length > 1;

  function onAdd() {
    if (!v.available) return;
    add({ variantId: v.id, productSlug: product.slug, categorySlug: product.categorySlug, name: product.name, variantTitle: many ? v.title : null, priceCents: v.priceCents, image: { ...product.image, tint: v.swatch ?? product.image.tint }, hasWarranty: product.hasWarranty }, qty);
    setAdded(true);
    setTimeout(() => { setAdded(false); setOpen(true); }, 500);
  }

  return (
    <div>
      {many && (
        <fieldset>
          <legend className="text-[13px] font-semibold uppercase tracking-[.12em] text-ink-2">{labels.variant}: <span className="normal-case tracking-normal text-ink">{v.title}</span></legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {variants.map((x) => (
              <label key={x.id} className={`press relative flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-[14px] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold-deep ${x.id === selected ? "border-ink bg-surface font-semibold" : "border-line bg-surface"} ${!x.available ? "text-ink-3" : ""}`}>
                <input type="radio" name="variant" value={x.id} checked={x.id === selected} onChange={() => { select(x.id); setQty(1); }} className="sr-only" />
                {x.swatch && <span aria-hidden="true" className="size-4 rounded-full ring-1 ring-line" style={{ backgroundColor: x.swatch }} />}
                {x.title}
                {!x.available && <span className="text-[12px] font-semibold uppercase tracking-[.08em] text-ink-3 no-underline [text-decoration:none]">· {labels.soldOutShort}</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <p className="tabular mt-6 text-[20px] font-semibold">
        {formatUSD(v.priceCents)}
        {v.compareAtCents && <s className="ml-2 text-[15px] font-normal text-ink-3">{formatUSD(v.compareAtCents)}</s>}
      </p>
      {v.available && v.lowStock && <p className="mt-1 text-[13px] font-semibold text-warning">{labels.lowStock}</p>}

      <div className="mt-4 flex gap-2">
        <div className="flex items-center rounded-full border border-line bg-surface" role="group" aria-label={labels.quantity}>
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1 || !v.available} aria-label={labels.decrease} className="press grid size-12 place-items-center disabled:opacity-40"><Minus aria-hidden="true" size={16} /></button>
          <span className="tabular w-6 text-center text-[15px]" aria-live="polite">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY || !v.available} aria-label={labels.increase} className="press grid size-12 place-items-center disabled:opacity-40"><Plus aria-hidden="true" size={16} /></button>
        </div>
        <button type="button" onClick={onAdd} disabled={!v.available}
          className={`press flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-semibold disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-3 ${added ? "shine bg-ink text-gold" : "bg-ink text-on-dark"}`}>
          {added ? <Check aria-hidden="true" size={18} /> : <ShoppingBag aria-hidden="true" size={18} strokeWidth={1.75} />}
          {!v.available ? labels.soldOut : added ? labels.added : labels.addToCart}
        </button>
      </div>
    </div>
  );
}
