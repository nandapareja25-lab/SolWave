import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, BadgeCheck, Check, Lock, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { InstagramIcon as Instagram, TikTokIcon as Music2 } from "@/components/brand/SocialIcons";
import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/tienda/ProductImage";
import { ProductCard } from "@/components/tienda/ProductCard";
import { SectionHeading } from "@/components/tienda/SectionHeading";
import { NewsletterForm } from "@/components/tienda/NewsletterForm";
import { newsletterLabels } from "@/components/tienda/labels";
import { getCategories, getHome, getStoreSettings, getWarrantyPolicies } from "@/server/catalog";
import { formatUSD } from "@/lib/money";

export const revalidate = 60;

const years = (months: number) => (months % 12 === 0 ? `${months / 12} ${months / 12 === 1 ? "año" : "años"}` : `${months} meses`);
const joinEs = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs.at(-1)}`).toLowerCase();

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, home, categories, warranties, settings] = await Promise.all([
    getTranslations("home"), getHome(), getCategories(), getWarrantyPolicies(), getStoreSettings(),
  ]);
  const hero = home.featured[0];
  const stories = categories.filter((c) => !c.autoRule);
  const sorted = [...warranties].sort((a, b) => a.months - b.months);
  const shortW = sorted[0];
  const longW = sorted.at(-1);

  return (
    <>
      {/* ───────── 1 · HERO (oscuro, de la opción B) ───────── */}
      <section aria-labelledby="hero-title" className="velvet overflow-hidden">
        <div className="mx-auto grid max-w-6xl md:grid-cols-2 md:items-center md:gap-12 md:px-8 md:py-16">
          {hero && (
            <Link href={`/${hero.categorySlug}/${hero.slug}`} className="rise block" aria-label={hero.name}>
              <ProductImage image={hero.image} surface="velvet" priority className="h-[180px] md:h-[520px] md:rounded-[4px]" />
            </Link>
          )}
          <div className="px-4 pb-8 pt-4 md:px-0 md:py-0">
            <p className="rise rise-1 text-[12px] font-semibold uppercase tracking-[.2em] text-gold">{t("heroEyebrow")}</p>
            <h1 id="hero-title" className="rise rise-2 mt-2 font-display text-[36px] leading-[1.08] tracking-[-0.01em] md:text-[56px]">
              {t("heroTitleA")} <em className="text-gold">{t("heroTitleB")}</em> {t("heroTitleC")}
            </h1>
            <p className="rise rise-3 mt-4 max-w-md text-[15px] leading-[1.55] text-on-dark-2">{t("heroSub")}</p>
            <div className="rise rise-4 mt-6 flex flex-col gap-2 sm:flex-row">
              <Link href="/tienda" className="press flex h-[52px] items-center justify-center gap-2 rounded-full bg-gold px-8 text-[15px] font-semibold text-ink hover:bg-gold-soft">
                {t("heroCta")} <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link href="/sets" className="press flex h-12 items-center justify-center px-4 text-[15px] font-semibold text-on-dark underline decoration-gold underline-offset-4">
                {t("heroSecondary")}
              </Link>
            </div>
          </div>
        </div>
        <p className="border-t border-velvet-line px-4 py-3 text-center text-[12px] font-medium uppercase tracking-[.12em] text-gold">{t("heroTrust")}</p>
        <div className="hairline-gold" />
      </section>

      {/* ───────── 2 · CATEGORÍAS circulares (de la opción A) ───────── */}
      <section aria-labelledby="cats-title" className="pt-8">
        <h2 id="cats-title" className="sr-only">{t("categoriesTitle")}</h2>
        <ul className="rail mx-auto max-w-6xl gap-4 pb-2">
          {stories.map((c) => (
            <li key={c.slug} className="w-[76px]">
              <Link href={`/${c.slug}`} className="group flex flex-col items-center gap-2 text-center">
                <span className="grid size-[76px] place-items-center rounded-full p-[3px] ring-1 ring-gold transition-[box-shadow] duration-200 [box-shadow:0_0_0_4px_var(--ivory),0_0_0_5px_var(--gold-soft)] group-hover:[box-shadow:0_0_0_4px_var(--ivory),0_0_0_5px_var(--gold)]">
                  <ProductImage image={c.image} className="size-full rounded-full" />
                </span>
                <span className="line-clamp-2 text-[12px] leading-[1.3] text-ink-2 group-hover:text-ink">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── 3 · DESTACADOS (claro) ───────── */}
      <section aria-labelledby="featured-title" className="mx-auto max-w-6xl px-4 pt-12">
        <SectionHeading id="featured-title" kicker={t("featuredKicker")} title={t("featuredTitle")} href="/tienda" linkLabel={t("seeAll")} />
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-6">
          {home.featured.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 2} />)}
        </div>
      </section>

      {/* ───────── 4 · GARANTÍA 1 / 5 años (oscuro, "estuche") ───────── */}
      {shortW && longW && (
        <section aria-labelledby="warranty-title" className="mt-16 bg-velvet px-4 py-12">
          <div className="filete-doble velvet mx-auto max-w-3xl rounded-[4px] border border-velvet-line px-6 py-8 md:px-12">
            <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[.16em] text-gold">
              <ShieldCheck aria-hidden="true" size={16} strokeWidth={1.75} /> {t("warrantyKicker")}
            </p>
            <h2 id="warranty-title" className="mt-2 font-display text-[28px] leading-[1.1]">{t("warrantyTitle")}</h2>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {[shortW, longW].map((w) => (
                <div key={w.code} className="rounded-[4px] bg-velvet-2 p-4">
                  <p className="font-display text-[32px] leading-none text-gold">{years(w.months)}</p>
                  <p className="mt-2 text-[13px] leading-[1.4] text-on-dark-2">{w.categoryNames.length ? `${joinEs(w.categoryNames).replace(/^./, (c) => c.toUpperCase())}` : w.name}</p>
                </div>
              ))}
            </div>
            <ul className="mt-6 grid gap-2 text-[14px] text-on-dark">
              {[t("warrantyCovers"), t("warrantyCertificate")].map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-gold/20 text-gold"><Check aria-hidden="true" size={12} strokeWidth={2.5} /></span>
                  {line}
                </li>
              ))}
            </ul>
            <Link href="/garantia" className="press mt-6 inline-flex min-h-11 items-center gap-1 text-[14px] font-semibold text-gold underline decoration-gold/60 underline-offset-4">
              {t("warrantyLink")} <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </section>
      )}

      {/* ───────── 5 · NUEVOS INGRESOS (claro, carrusel) ───────── */}
      {home.newArrivals.length > 0 && (
        <section aria-labelledby="new-title" className="mx-auto max-w-6xl pt-16">
          <div className="px-4"><SectionHeading id="new-title" kicker={t("newKicker")} title={t("newTitle")} href="/nuevos" linkLabel={t("seeAll")} /></div>
          <ul className="rail pb-2">
            {home.newArrivals.map((p) => <li key={p.id} className="w-[168px] md:w-[240px]"><ProductCard product={p} /></li>)}
          </ul>
        </section>
      )}

      {/* ───────── 6 · SETS (tarjeta oscura) ───────── */}
      <section aria-labelledby="sets-title" className="mx-auto max-w-6xl px-4 pt-16">
        <Link href="/sets" className="group velvet block overflow-hidden rounded-[4px] md:grid md:grid-cols-2 md:items-center">
          <ProductImage image={home.setProduct?.image ?? { url: null, illustration: "set", alt: t("setsTitle") }} surface="velvet" className="h-[240px] md:h-[360px]" />
          <div className="p-6 pt-2 text-on-dark md:p-12">
            <h2 id="sets-title" className="font-display text-[28px] leading-none">{t("setsTitle")}</h2>
            <p className="mt-2 max-w-xs text-[14px] text-on-dark-2">{t("setsSub")}</p>
            <p className="mt-4 flex items-center gap-2 text-[14px] font-semibold text-gold">
              {home.setProduct && <span className="tabular">{formatUSD(home.setProduct.priceCents)} ·</span>}
              {t("setsCta")} <ArrowRight aria-hidden="true" size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </p>
          </div>
        </Link>
      </section>

      {/* ───────── 7 · QUÉ ES EL ORO LAMINADO 18K (crema) ───────── */}
      <section aria-labelledby="explain-title" className="mt-16 bg-cream px-6 py-12 text-center">
        <div className="mx-auto max-w-xl">
          <p className="text-[12px] font-semibold uppercase tracking-[.2em] text-gold-deep">{t("explainKicker")}</p>
          <h2 id="explain-title" className="mt-3 font-display text-[28px] leading-[1.1]">{t("explainTitle")}</h2>
          <div aria-hidden="true" className="mx-auto my-8 grid w-56 gap-1">
            <div className="grid h-8 place-items-center rounded-[4px] bg-gradient-to-r from-gold-soft via-gold to-gold-soft text-[12px] font-semibold uppercase tracking-[.12em] text-ink">{t("explainLayerGold")}</div>
            <div className="grid h-11 place-items-center rounded-[4px] bg-line text-[12px] font-semibold uppercase tracking-[.12em] text-ink-2">{t("explainLayerBase")}</div>
          </div>
          <p className="text-[15px] leading-[1.6] text-ink-2">{t("explainBody")}</p>
        </div>
      </section>

      {/* ───────── 8 · BENEFICIOS (claro) ───────── */}
      <section aria-labelledby="benefits-title" className="mx-auto max-w-6xl px-4 pt-16">
        <SectionHeading id="benefits-title" title={t("benefitsTitle")} />
        <ul className="grid gap-2 md:grid-cols-2">
          {[
            { Icon: BadgeCheck, title: t("benefitCertTitle"), body: t("benefitCertBody") },
            { Icon: ShieldCheck, title: t("benefitWarrantyTitle"), body: shortW && longW ? t("benefitWarrantyBody", { short: years(shortW.months), long: years(longW.months) }) : "" },
            settings.whatsappE164
              ? { Icon: MessageCircle, title: t("benefitWhatsTitle"), body: t("benefitWhatsBody") }
              : { Icon: Truck, title: t("benefitShipTitle"), body: t("benefitShipBody") },
            { Icon: Lock, title: t("benefitPayTitle"), body: t("benefitPayBody") },
          ].map(({ Icon, title, body }) => (
            <li key={title} className="flex items-center gap-4 rounded-[4px] border border-line bg-surface p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-deep"><Icon aria-hidden="true" size={20} strokeWidth={1.5} /></span>
              <div><p className="text-[15px] font-semibold">{title}</p><p className="text-[14px] text-ink-2">{body}</p></div>
            </li>
          ))}
        </ul>
      </section>

      {/* Testimonios: solo con reseñas reales publicadas (settings.testimonialsEnabled) — hoy no hay. */}

      {/* ───────── 9 · REDES (oscuro) ───────── */}
      {(settings.social.instagram || settings.social.tiktok) && (
        <section aria-labelledby="social-title" className="velvet mt-16 px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <SectionHeading id="social-title" kicker={t("socialKicker")} title={settings.socialHandle ?? "D'ORATA"} tone="dark" />
            <p className="-mt-2 text-[14px] text-on-dark-2">{t("socialBody")}</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {settings.social.instagram && (
                <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer" className="press flex h-12 items-center justify-center gap-2 rounded-full border border-gold text-[14px] font-semibold text-gold hover:bg-gold hover:text-ink">
                  <Instagram aria-hidden="true" size={18} strokeWidth={1.5} /> Instagram
                </a>
              )}
              {settings.social.tiktok && (
                <a href={settings.social.tiktok} target="_blank" rel="noopener noreferrer" className="press flex h-12 items-center justify-center gap-2 rounded-full border border-gold text-[14px] font-semibold text-gold hover:bg-gold hover:text-ink">
                  <Music2 aria-hidden="true" size={18} strokeWidth={1.5} /> TikTok
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ───────── 10 · NOVEDADES (crema) ───────── */}
      {settings.newsletterEnabled && (
        <section aria-labelledby="news-title" className="bg-cream px-4 py-12">
          <div className="mx-auto max-w-md text-center">
            <h2 id="news-title" className="font-display text-[28px] leading-[1.1]">{t("newsletterTitle")}</h2>
            <p className="mb-6 mt-2 text-[15px] text-ink-2">{t("newsletterBody")}</p>
            <NewsletterForm labels={await newsletterLabels()} source="footer" />
          </div>
        </section>
      )}
    </>
  );
}
