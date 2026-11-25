import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InstagramIcon as Instagram, TikTokIcon as Music2 } from "@/components/brand/SocialIcons";
import { Logo } from "@/components/brand/Logo";
import { ProductImage } from "@/components/tienda/ProductImage";
import { BigCountdown } from "@/components/tienda/BigCountdown";
import { NewsletterForm } from "@/components/tienda/NewsletterForm";
import { newsletterLabels } from "@/components/tienda/labels";
import { getAnnouncement, getStoreModeInfo, getStoreSettings, getWarrantyPolicies } from "@/server/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Muy pronto", description: "D'ORATA · Oro laminado 18K. Lanzamiento el 2 de diciembre de 2026." };

export default async function ComingSoonPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, settings, announcement, mode, warranties] = await Promise.all([getTranslations("comingSoon"), getStoreSettings(), getAnnouncement(locale), getStoreModeInfo(), getWarrantyPolicies()]);
  const ms = warranties.map((w) => w.months).sort((a, b) => a - b);
  const yrs = (m: number) => (m % 12 === 0 ? `${m / 12} ${m / 12 === 1 ? "año" : "años"}` : `${m} meses`);
  // Objetivo del contador: la cuenta regresiva del banner o, si no hay, la apertura programada.
  const target = announcement?.countdown_target_at ?? mode.liveAt;

  const launchDate = target
    ? new Intl.DateTimeFormat("es-US", { day: "numeric", month: "long", year: "numeric", timeZone: mode.timezone }).format(new Date(target))
    : null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-4 pb-12 pt-8 text-center">
      <Logo logoUrl={settings.logoUrl} tone="dark" size="md" className="rise" />
      <ProductImage image={{ url: null, illustration: "chain", alt: "Cadena en oro laminado 18K" }} surface="velvet" priority className="rise rise-1 filete-doble mt-4 h-[140px] w-full rounded-[4px]" />
      <p className="rise rise-2 mt-6 text-[12px] font-semibold uppercase tracking-[.2em] text-gold">{t("eyebrow")}</p>
      <h1 className="rise rise-2 mt-2 font-display text-[32px] leading-[1.1]">{t("title")}</h1>
      <p className="rise rise-3 mt-3 text-[15px] leading-[1.55] text-on-dark-2">{t("body", { short: yrs(ms[0] ?? 12), long: yrs(ms.at(-1) ?? 60) })}</p>
      <div className="rise rise-3 mt-6 w-full">
        <NewsletterForm labels={await newsletterLabels(true)} source="waitlist" tone="dark" />
      </div>
      {target && (
        <div className="rise rise-4 mt-8 w-full">
          <BigCountdown target={target} serverNow={Date.now()} labels={{ days: t("days"), hours: t("hours"), minutes: t("minutes"), seconds: t("seconds"), arrived: t("arrived") }} />
          {launchDate && <p className="mt-3 text-[13px] text-on-dark-2">{t("launch", { date: launchDate })}</p>}
        </div>
      )}
      {(settings.social.instagram || settings.social.tiktok) && (
        <div className="mt-8 flex gap-2">
          {settings.social.instagram && <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${settings.socialHandle ?? ""}`} className="press grid size-11 place-items-center rounded-full border border-gold/70 text-gold"><Instagram aria-hidden="true" size={20} strokeWidth={1.5} /></a>}
          {settings.social.tiktok && <a href={settings.social.tiktok} target="_blank" rel="noopener noreferrer" aria-label={`TikTok ${settings.socialHandle ?? ""}`} className="press grid size-11 place-items-center rounded-full border border-gold/70 text-gold"><Music2 aria-hidden="true" size={20} strokeWidth={1.5} /></a>}
        </div>
      )}
    </div>
  );
}
