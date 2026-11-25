import { getTranslations } from "next-intl/server";
import { CookieConsent, PrivacyPreferencesButton } from "@/components/tienda/CookieConsent";
import { cookieLabels } from "@/components/tienda/labels";
import { Link } from "@/i18n/navigation";
import { getCookiePolicyVersion, getLegalPages, getTrackingConfig } from "@/server/catalog";

/** Páginas de sistema (Próximamente / Mantenimiento): sin menú de tienda, con legales y cookies. */
export default async function SystemLayout({ children }: { children: React.ReactNode }) {
  const [t, legal, policyVersion, integrations] = await Promise.all([getTranslations("footer"), getLegalPages(), getCookiePolicyVersion(), getTrackingConfig()]);
  const year = new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "America/New_York" }).format(new Date());
  const links = legal.filter((p) => ["privacy", "cookies", "terms", "contact"].includes(p.kind));
  return (
    <div className="velvet flex min-h-dvh flex-col">
      <main id="contenido" className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-velvet-line px-4 py-6 text-center text-[12px] text-on-dark-2">
        <ul className="flex flex-wrap justify-center gap-x-4">
          {links.map((p) => <li key={p.slug}><Link href={`/${p.slug}`} className="inline-flex min-h-11 items-center hover:text-on-dark">{p.title.replace(/^Política de /, "").replace("Información de contacto comercial", "Contacto")}</Link></li>)}
          <li><PrivacyPreferencesButton label={t("privacyPrefs")} /></li>
        </ul>
        <p className="mt-2">{t("rights", { year })}</p>
      </footer>
      <CookieConsent labels={await cookieLabels()} policyVersion={policyVersion} integrations={integrations} />
    </div>
  );
}
