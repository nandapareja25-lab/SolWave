import { getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { discountPercent, formatUSD } from "@/lib/money";
import { ProductImage } from "./ProductImage";
import { QuickAdd } from "./QuickAdd";
import type { ProductCard as Card } from "@/server/types";

export async function ProductCard({ product, priority }: { product: Card; priority?: boolean }) {
  const t = await getTranslations("product");
  const href = `/${product.categorySlug}/${product.slug}`;
  const pct = discountPercent(product.priceCents, product.compareAtCents);
  return (
    <article className="relative min-w-0">
      <Link href={href} className="group block">
        <div className="relative">
          <ProductImage image={product.image} className="aspect-[4/5] rounded-[4px]" priority={priority} />
          <div className="absolute left-2 top-2 z-[2] flex flex-col items-start gap-1">
            {product.isNew && <span className="rounded-[4px] bg-surface px-2 py-1 text-[12px] font-semibold uppercase tracking-[.1em]">{t("new")}</span>}
            {pct && <span className="rounded-[4px] bg-ink px-2 py-1 text-[12px] font-semibold uppercase tracking-[.1em] text-gold">−{pct}%</span>}
            {!product.available && <span className="rounded-[4px] bg-surface px-2 py-1 text-[12px] font-semibold uppercase tracking-[.1em] text-ink-2">{t("soldOut")}</span>}
          </div>
        </div>
        <h3 className="mt-3 line-clamp-2 min-h-[2.7em] text-[15px] leading-[1.35] group-hover:underline group-hover:decoration-gold group-hover:underline-offset-4">{product.name}</h3>
        <p className="tabular mt-1 text-[15px] font-semibold">
          {formatUSD(product.priceCents)}
          {product.compareAtCents && <s className="ml-2 text-[13px] font-normal text-ink-3">{formatUSD(product.compareAtCents)}</s>}
        </p>
        <p className="mt-1 min-h-[1.4em] text-[12px] font-medium text-gold-deep">{product.warrantyName ?? ""}</p>
      </Link>
      {product.available && product.variantCount === 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/5] [&>*]:pointer-events-auto">
          <QuickAdd
            label={t("quickAdd", { name: product.name })}
            addedLabel={t("added")}
            line={{ variantId: product.defaultVariantId, productSlug: product.slug, categorySlug: product.categorySlug, name: product.name, variantTitle: null, priceCents: product.priceCents, image: product.image, hasWarranty: product.hasWarranty }}
          />
        </div>
      )}
      {product.available && product.variantCount > 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/5] [&>*]:pointer-events-auto">
          <Link href={href} aria-label={`${t("chooseOption")}: ${product.name}`}
            className="press absolute bottom-2 right-2 z-[2] grid size-11 place-items-center rounded-full bg-surface text-ink shadow-[0_2px_8px_rgba(40,30,15,.14)]">
            <ChevronRight aria-hidden="true" size={18} strokeWidth={1.75} />
          </Link>
        </div>
      )}
    </article>
  );
}
