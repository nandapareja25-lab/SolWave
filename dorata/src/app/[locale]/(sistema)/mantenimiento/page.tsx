import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { getStoreSettings } from "@/server/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "En mantenimiento", robots: { index: false } };

export default async function MaintenancePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, settings] = await Promise.all([getTranslations("maintenance"), getStoreSettings()]);
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <Logo logoUrl={settings.logoUrl} tone="dark" size="lg" />
      <div className="hairline-gold mt-8 w-24" />
      <h1 className="mt-8 font-display text-[32px] leading-[1.1]">{t("title")}</h1>
      <p className="mt-3 text-[15px] leading-[1.55] text-on-dark-2">{t("body")}</p>
      {settings.social.instagram && <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer" className="press mt-8 inline-flex h-12 items-center rounded-full border border-gold px-6 text-[15px] font-semibold text-gold">{settings.socialHandle ?? "Instagram"}</a>}
    </div>
  );
}
