"use client";

import { useEffect } from "react";
import { BadgeCheck, Minus, Plus, ShieldCheck, Trash2, Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { formatUSD } from "@/lib/money";
import { MAX_QTY, useCart } from "./CartProvider";
import { ProductImage } from "./ProductImage";

export type CartLabels = {
  title: string; close: string; emptyTitle: string; emptyBody: string; emptyCta: string; subtotal: string;
  shippingNote: string; checkout: string; checkoutSoon: string; remove: string; policies: string;
  decrease: string; increase: string; quantity: string;
  removed: string; undo: string; trustCert: string; trustWarranty: string;
};

export function CartDrawer({ labels, checkoutEnabled }: { labels: CartLabels; checkoutEnabled: boolean }) {
  const { lines, open, setOpen, setQty, remove, subtotalCents, lastRemoved, undoRemove, clearRemoved } = useCart();
  const close = () => setOpen(false);
  // "Deshacer" visible 5 s tras quitar una pieza
  useEffect(() => {
    if (!lastRemoved) return;
    const id = setTimeout(clearRemoved, 5000);
    return () => clearTimeout(id);
  }, [lastRemoved, clearRemoved]);

  const undoToast = lastRemoved && (
    <div role="status" className="rise mx-4 mb-3 flex items-center justify-between gap-3 rounded-[4px] bg-ink px-4 py-2 text-[14px] text-on-dark">
      <span className="line-clamp-2">{labels.removed.replace("{name}", lastRemoved.line.name)}</span>
      <button type="button" onClick={undoRemove} className="press min-h-11 shrink-0 font-semibold text-gold underline underline-offset-4">{labels.undo}</button>
    </div>
  );

  const footer = lines.length > 0 && (
    <div className="border-t border-line bg-surface px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
      <div className="flex items-baseline justify-between">
        <span className="text-[15px]">{labels.subtotal}</span>
        <span className="tabular text-[20px] font-semibold">{formatUSD(subtotalCents)}</span>
      </div>
      <p className="mt-1 text-[13px] text-ink-2">{labels.shippingNote}</p>
      <button type="button" disabled={!checkoutEnabled} aria-describedby={checkoutEnabled ? undefined : "checkout-soon"}
        className="press mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-on-dark disabled:cursor-not-allowed disabled:bg-ink-3">
        <Lock aria-hidden="true" size={16} /> {labels.checkout}
      </button>
      {!checkoutEnabled && <p id="checkout-soon" className="mt-2 text-center text-[13px] text-gold-deep">{labels.checkoutSoon}</p>}
      <p className="mt-3 text-center text-[12px] leading-[1.5] text-ink-3">{labels.policies}</p>
    </div>
  );

  return (
    <Sheet open={open} onClose={close} side="right" title={labels.title} closeLabel={labels.close} footer={footer || undefined}>
      {undoToast && <div className="pt-3">{undoToast}</div>}
      {lines.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-8 py-12 text-center">
          <div className="filete-doble grid size-28 place-items-center rounded-full bg-surface">
            <ProductImage image={{ url: null, illustration: "hoops", alt: "" }} className="size-20 rounded-full" />
          </div>
          <p className="mt-6 font-display text-[20px]">{labels.emptyTitle}</p>
          <p className="mt-2 text-[15px] text-ink-2">{labels.emptyBody}</p>
          <Link href="/tienda" onClick={close} className="press mt-6 flex h-12 items-center rounded-full bg-ink px-6 text-[15px] font-semibold text-on-dark">{labels.emptyCta}</Link>
        </div>
      ) : (
        <ul className="divide-y divide-line px-4">
          {lines.map((l) => (
            <li key={l.variantId} className="flex gap-3 py-4">
              <Link href={`/${l.categorySlug}/${l.productSlug}`} onClick={close} className="shrink-0">
                <ProductImage image={l.image} className="size-20 rounded-[4px]" />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{l.name}</p>
                {l.variantTitle && <p className="text-[13px] text-ink-2">{l.variantTitle}</p>}
                <p className="tabular mt-1 text-[15px] font-semibold">{formatUSD(l.priceCents)}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-line bg-surface" role="group" aria-label={labels.quantity}>
                    <button type="button" onClick={() => setQty(l.variantId, l.qty - 1)} disabled={l.qty <= 1} aria-label={labels.decrease} className="press grid size-11 place-items-center disabled:opacity-40"><Minus aria-hidden="true" size={16} /></button>
                    <span className="tabular w-6 text-center text-[15px]" aria-live="polite">{l.qty}</span>
                    <button type="button" onClick={() => setQty(l.variantId, l.qty + 1)} disabled={l.qty >= MAX_QTY} aria-label={labels.increase} className="press grid size-11 place-items-center disabled:opacity-40"><Plus aria-hidden="true" size={16} /></button>
                  </div>
                  <button type="button" onClick={() => remove(l.variantId)} aria-label={labels.remove.replace("{name}", l.name)} className="press grid size-11 place-items-center text-ink-2 hover:text-danger"><Trash2 aria-hidden="true" size={18} strokeWidth={1.5} /></button>
                </div>
              </div>
            </li>
          ))}
          <li className="grid gap-2 py-4 text-[13px] text-ink-2">
            <span className="flex items-center gap-2"><BadgeCheck aria-hidden="true" size={16} className="text-gold-deep" strokeWidth={1.5} />{labels.trustCert}</span>
            {lines.every((l) => l.hasWarranty) && <span className="flex items-center gap-2"><ShieldCheck aria-hidden="true" size={16} className="text-gold-deep" strokeWidth={1.5} />{labels.trustWarranty}</span>}
          </li>
        </ul>
      )}
    </Sheet>
  );
}
