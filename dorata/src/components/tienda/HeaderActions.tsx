"use client";

import { useState } from "react";
import { Menu, ShoppingBag } from "lucide-react";
import { InstagramIcon as Instagram, TikTokIcon as Music2 } from "@/components/brand/SocialIcons";
import { Link } from "@/i18n/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { useCart } from "./CartProvider";
import type { Category, StoreSettings } from "@/server/types";

type NavLabels = { menu: string; close: string; categories: string; help: string; shop: string; home: string; cartWithCount: string; cart: string };

export function MenuButton({ categories, help, settings, labels }: {
  categories: Pick<Category, "slug" | "name">[];
  help: { slug: string; title: string }[];
  settings: Pick<StoreSettings, "social" | "socialHandle">;
  labels: NavLabels;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={labels.menu} aria-haspopup="dialog" aria-expanded={open}
        className="press grid size-11 place-items-center rounded-full">
        <Menu aria-hidden="true" size={22} strokeWidth={1.5} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} side="left" title={labels.categories} closeLabel={labels.close} tone="dark">
        <nav aria-label={labels.categories} className="px-4 py-4">
          <ul className="grid">
            <li><Link href="/tienda" onClick={() => setOpen(false)} className="flex min-h-12 items-center border-b border-velvet-line font-display text-[20px]">{labels.shop}</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} onClick={() => setOpen(false)} className="flex min-h-12 items-center border-b border-velvet-line text-[15px] text-on-dark-2 hover:text-on-dark">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[12px] font-semibold uppercase tracking-[.14em] text-gold">{labels.help}</p>
          <ul className="mt-2 grid">
            {help.map((h) => (
              <li key={h.slug}><Link href={`/${h.slug}`} onClick={() => setOpen(false)} className="flex min-h-11 items-center text-[15px] text-on-dark-2 hover:text-on-dark">{h.title}</Link></li>
            ))}
          </ul>
          {(settings.social.instagram || settings.social.tiktok) && (
            <div className="mt-8 flex gap-2">
              {settings.social.instagram && <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${settings.socialHandle ?? ""}`} className="press grid size-11 place-items-center rounded-full border border-gold text-gold"><Instagram aria-hidden="true" size={20} strokeWidth={1.5} /></a>}
              {settings.social.tiktok && <a href={settings.social.tiktok} target="_blank" rel="noopener noreferrer" aria-label={`TikTok ${settings.socialHandle ?? ""}`} className="press grid size-11 place-items-center rounded-full border border-gold text-gold"><Music2 aria-hidden="true" size={20} strokeWidth={1.5} /></a>}
            </div>
          )}
        </nav>
      </Sheet>
    </>
  );
}

export function CartButton({ labels }: { labels: Pick<NavLabels, "cart" | "cartWithCount"> }) {
  const { count, setOpen, lastAddedAt } = useCart();
  return (
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
      aria-label={count ? labels.cartWithCount.replace("#", String(count)) : labels.cart}
      className="press relative grid size-11 place-items-center rounded-full">
      <ShoppingBag aria-hidden="true" size={22} strokeWidth={1.5} />
      {count > 0 && (
        <span key={lastAddedAt} className="shine tabular absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold text-ink">
          {count}
        </span>
      )}
    </button>
  );
}
