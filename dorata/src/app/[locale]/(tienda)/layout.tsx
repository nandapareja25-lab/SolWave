import { getTranslations } from "next-intl/server";
import { AnnouncementBar } from "@/components/tienda/AnnouncementBar";
import { Header } from "@/components/tienda/Header";
import { Footer } from "@/components/tienda/Footer";
import { CartProvider } from "@/components/tienda/CartProvider";
import { CartDrawer } from "@/components/tienda/CartDrawer";
import { CookieConsent } from "@/components/tienda/CookieConsent";
import { WhatsAppFab } from "@/components/tienda/WhatsAppFab";
import { OfflineNotice } from "@/components/tienda/OfflineNotice";
import { getAnnouncement, getCookiePolicyVersion, getStoreSettings, getTrackingConfig } from "@/server/catalog";
import { cookieLabels, cartLabels } from "@/components/tienda/labels";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [announcement, settings, tAnn, tSys, policyVersion, integrations] = await Promise.all([
    getAnnouncement("es"), getStoreSettings(), getTranslations("announcement"), getTranslations("system"),
    getCookiePolicyVersion(), getTrackingConfig(),
  ]);
  return (
    <CartProvider>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2">Saltar al contenido</a>
      <AnnouncementBar announcement={announcement} serverNow={Date.now()} labels={{ region: tAnn("region"), pause: tAnn("pause"), play: tAnn("play") }} />
      <Header />
      <main id="contenido" className="min-h-[60dvh]">{children}</main>
      <Footer />
      <CartDrawer labels={await cartLabels()} checkoutEnabled={false} packagingNote={settings.packagingNote} />
      <CookieConsent labels={await cookieLabels()} policyVersion={policyVersion} integrations={integrations} />
      <WhatsAppFab e164={settings.whatsappE164} message="Hola D'ORATA, tengo una pregunta." />
      <OfflineNotice label={tSys("offline")} />
    </CartProvider>
  );
}
