import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/tienda/ProductCard";
import { SectionHeading } from "@/components/tienda/SectionHeading";
import { AddToCart } from "@/components/catalogo/AddToCart";
import { ProductGallery } from "@/components/catalogo/ProductGallery";
import { VariantProvider } from "@/components/catalogo/VariantContext";
import { getProduct, getRelated, getStoreSettings } from "@/server/catalog";
import { discountPercent } from "@/lib/money";
import { whatsappLink } from "@/lib/whatsapp";

type Params = { locale: string; slug: string; producto: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, producto } = await params;
  const p = await getProduct(slug, producto);
  if (!p) return {};
  const url = `/${p.categorySlug}/${p.slug}`;
  return {
    title: p.name,
    description: p.shortDescription ?? undefined,
    alternates: { canonical: url },
    openGraph: { title: p.name, description: p.shortDescription ?? undefined, url, type: "website" },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { locale, slug, producto } = await params;
  setRequestLocale(locale);
  const p = await getProduct(slug, producto);
  if (!p) notFound();
  if (p.categorySlug !== slug) permanentRedirect(`/${p.categorySlug}/${p.slug}`); // URL canónica única

  const [t, related, settings] = await Promise.all([getTranslations("product"), getRelated(p), getStoreSettings()]);
  const pct = discountPercent(p.priceCents, p.compareAtCents);
  const firstSku = p.variants[0]?.sku ?? "";
  const ask = whatsappLink(settings.whatsappE164, t("whatsappMessage", { name: p.name, sku: firstSku }));
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dorata18k.com";

  // Datos estructurados (schema.org/Product) para Google.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.shortDescription,
    sku: firstSku,
    brand: { "@type": "Brand", name: "D'ORATA" },
    material: p.material,
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      price: (v.priceCents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: v.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${site}/${p.categorySlug}/${p.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <VariantProvider variants={p.variants}>
      <div className="mx-auto max-w-6xl md:grid md:grid-cols-2 md:gap-12 md:px-8 md:pt-8">
        {/* Galería: deslizar en móvil */}
        <div className="relative">
          <ProductGallery images={p.images} label={t("photos")} />
          <div className="absolute left-4 top-4 z-[2] flex gap-1">
            {p.isNew && <span className="rounded-[4px] bg-surface px-2 py-1 text-[12px] font-semibold uppercase tracking-[.1em]">{t("new")}</span>}
            {pct && <span className="rounded-[4px] bg-ink px-2 py-1 text-[12px] font-semibold uppercase tracking-[.1em] text-gold">{t("save", { percent: pct })}</span>}
          </div>
          <p className="absolute bottom-3 right-4 z-[2] rounded-full bg-surface/90 px-2 py-0.5 text-[12px] text-ink-2 md:hidden" aria-hidden="true">1 / {p.images.length}</p>
        </div>

        <div className="px-4 pb-12 pt-6 md:px-0 md:pt-0">
          <nav aria-label={t("breadcrumb")} className="text-[12px] text-ink-3">
            <Link href="/" className="hover:underline">{t("home")}</Link> <span aria-hidden="true">/</span>{" "}
            <Link href={`/${p.categorySlug}`} className="hover:underline">{p.categoryName}</Link>
          </nav>
          <h1 className="rise rise-1 mt-2 font-display text-[32px] leading-[1.1]">{p.name}</h1>
          {p.shortDescription && <p className="rise rise-2 mt-3 text-[15px] leading-[1.55] text-ink-2">{p.shortDescription}</p>}

          <div className="rise rise-3 mt-6">
            <AddToCart
              product={{ slug: p.slug, categorySlug: p.categorySlug, name: p.name, image: p.image, hasWarranty: !!p.warranty }}
              labels={{ variant: p.variants.some((x) => x.swatch) ? t("optionLabel") : t("variant"), soldOutShort: t("soldOut"), quantity: t("quantity"), decrease: t("decrease"), increase: t("increase"), addToCart: t("addToCart"), added: t("added"), soldOut: t("soldOut"), lowStock: t("lowStock") }}
            />
          </div>

          {ask && (
            <a href={ask} target="_blank" rel="noopener noreferrer" className="press mt-3 flex h-12 items-center justify-center gap-2 rounded-full border border-ink text-[15px] font-semibold">
              <MessageCircle aria-hidden="true" size={18} strokeWidth={1.5} /> {t("askWhatsapp")}
            </a>
          )}

          {/* Garantía: tarjeta destacada solo cuando la pieza tiene garantía con nombre */}
          {p.warranty ? (
            <div className="rise rise-4 filete-doble velvet mt-6 rounded-[4px] p-5">
              <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[.14em] text-gold"><ShieldCheck aria-hidden="true" size={16} strokeWidth={1.75} /> {t("warranty")}</p>
              <p className="mt-2 font-display text-[20px] leading-tight">{p.warranty.name}</p>
              <p className="mt-1 text-[15px] leading-[1.5] text-on-dark-2">{p.warranty.summary}</p>
              <Link href="/garantia" className="mt-3 inline-flex min-h-11 items-center text-[15px] font-semibold text-gold underline decoration-gold/60 underline-offset-4">{t("warrantyLink")}</Link>
            </div>
          ) : null}

          <ul className="mt-6 grid gap-3 text-[15px] text-ink-2">
            <li className="flex gap-3"><BadgeCheck aria-hidden="true" size={18} className="shrink-0 text-gold-deep" strokeWidth={1.5} />{t("certificate")}</li>
            {!p.warranty && (
              <li className="flex gap-3"><ShieldCheck aria-hidden="true" size={18} className="shrink-0 text-gold-deep" strokeWidth={1.5} />
                <span>{t("noWarranty")}{" "}<Link href="/contacto" className="font-semibold text-ink underline decoration-gold underline-offset-4">{t("noWarrantyContact")}</Link></span>
              </li>
            )}
            {p.shippingNotes && <li className="flex gap-3"><Truck aria-hidden="true" size={18} className="shrink-0 text-gold-deep" strokeWidth={1.5} />{p.shippingNotes}</li>}
          </ul>

          <section aria-labelledby="details-title" className="mt-8 border-t border-line pt-6">
            <h2 id="details-title" className="text-[13px] font-semibold uppercase tracking-[.14em] text-ink-2">{t("details")}</h2>
            <dl className="mt-3 divide-y divide-line">
              {[[t("material"), p.material], [t("measurements"), p.measurements], [p.variants.some((x) => x.swatch) ? t("metalColor") : t("color"), p.color]].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3 text-[15px]"><dt className="text-ink-2">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      </VariantProvider>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mx-auto max-w-6xl pb-16">
          <div className="px-4"><SectionHeading id="related-title" kicker={t("relatedKicker")} title={t("relatedTitle")} /></div>
          <ul className="rail">
            {related.map((r) => <li key={r.id} className="w-[168px] md:w-[240px]"><ProductCard product={r} /></li>)}
          </ul>
        </section>
      )}
    </>
  );
}
