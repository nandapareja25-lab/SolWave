import { getTranslations } from "next-intl/server";
import { FacebookIcon as Facebook, InstagramIcon as Instagram, TikTokIcon as Music2 } from "@/components/brand/SocialIcons";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/Logo";
import { PrivacyPreferencesButton } from "./CookieConsent";
import { getLegalPages, getNavCategories, getStoreSettings } from "@/server/catalog";

export async function Footer() {
  const [t, settings, legal, categories] = await Promise.all([getTranslations("footer"), getStoreSettings(), getLegalPages(), getNavCategories()]);
  const year = new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "America/New_York" }).format(new Date());
  const byKind = (k: string) => legal.find((p) => p.kind === k);
  const help = ["contact", "shipping", "returns", "refunds", "warranty"].map(byKind).filter(Boolean) as { slug: string; title: string }[];
  const legalLinks = ["privacy", "cookies", "terms", "site_terms"].map(byKind).filter(Boolean) as { slug: string; title: string }[];
  const short = (title: string) => title.replace(/^Política de (Cambios y )?/, "").replace("Información de contacto comercial", "Contacto").replace("Garantía D'ORATA", "Garantía");
  const social = [
    { href: settings.social.instagram, label: "Instagram", Icon: Instagram },
    { href: settings.social.tiktok, label: "TikTok", Icon: Music2 },
    { href: settings.social.facebook, label: "Facebook", Icon: Facebook },
  ].filter((s): s is { href: string; label: string; Icon: typeof Instagram } => !!s.href);

  return (
    <footer className="velvet border-t border-velvet-line px-4 pb-[max(32px,env(safe-area-inset-bottom))] pt-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <Logo logoUrl={settings.logoUrl} tone="dark" size="md" />
          {social.length > 0 && (
            <ul className="mt-6 flex gap-2" aria-label="Redes sociales">
              {social.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} ${settings.socialHandle ?? ""}`} className="press grid size-11 place-items-center rounded-full border border-gold/70 text-gold hover:bg-gold hover:text-ink">
                    <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
          <nav aria-label={t("shop")}>
            <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-gold">{t("shop")}</p>
            <ul className="mt-3">
              {categories.slice(0, 6).map((c) => (
                <li key={c.slug}><Link href={`/${c.slug}`} className="flex min-h-9 items-center text-[14px] text-on-dark-2 hover:text-on-dark">{c.name}</Link></li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t("help")}>
            <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-gold">{t("help")}</p>
            <ul className="mt-3">
              {help.map((p) => (
                <li key={p.slug}><Link href={`/${p.slug}`} className="flex min-h-9 items-center text-[14px] text-on-dark-2 hover:text-on-dark">{short(p.title)}</Link></li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t("legal")} className="col-span-2 md:col-span-1">
            <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-gold">{t("legal")}</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 md:grid-cols-1">
              {legalLinks.map((p) => (
                <li key={p.slug}><Link href={`/${p.slug}`} className="flex min-h-9 items-center text-[14px] text-on-dark-2 hover:text-on-dark">{short(p.title)}</Link></li>
              ))}
              <li className="col-span-2 text-[14px] text-on-dark-2 md:col-span-1"><PrivacyPreferencesButton label={t("privacyPrefs")} plain /></li>
            </ul>
          </nav>
        </div>
        <div className="hairline-gold mt-10" />
        <p className="mt-6 text-center text-[12px] text-on-dark-2">{t("rights", { year })}</p>
        {settings.isDemo && <p className="mt-2 text-center text-[12px] text-on-dark-2/70">{t("demo")}</p>}
      </div>
    </footer>
  );
}
