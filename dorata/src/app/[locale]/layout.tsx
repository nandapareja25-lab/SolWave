import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Bodoni_Moda, Manrope } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SvgDefs } from "@/components/brand/SvgDefs";
import "../globals.css";

const display = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-bodoni", display: "swap", axes: ["opsz"] });
const sans = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dorata18k.com";
  return {
    metadataBase: new URL(site),
    title: { default: t("title"), template: "%s · D'ORATA" },
    description: t("description"),
    openGraph: { siteName: "D'ORATA", locale: "es_US", type: "website", title: t("title"), description: t("description") },
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = { themeColor: "#16130F", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale} className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh bg-ivory text-ink antialiased">
        <SvgDefs />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
