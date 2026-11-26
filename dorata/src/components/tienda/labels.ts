import "server-only";
import { getTranslations } from "next-intl/server";
import type { CookieLabels } from "./CookieConsent";
import type { CartLabels } from "./CartDrawer";
import type { NewsletterLabels } from "./NewsletterForm";

export async function cookieLabels(): Promise<CookieLabels> {
  const t = await getTranslations("cookies");
  const keys = ["title", "body", "policy", "acceptAll", "rejectAll", "configure", "save", "saved", "essential", "essentialBody", "analytics", "analyticsBody", "marketing", "marketingBody", "personalization", "personalizationBody", "gpc"] as const;
  return Object.fromEntries(keys.map((k) => [k, t(k)])) as CookieLabels;
}

export async function cartLabels(): Promise<CartLabels> {
  const [t, p] = await Promise.all([getTranslations("cart"), getTranslations("product")]);
  return {
    title: t("title"), close: t("close"), emptyTitle: t("emptyTitle"), emptyBody: t("emptyBody"), emptyCta: t("emptyCta"),
    subtotal: t("subtotal"), shippingNote: t("shippingNote"), checkout: t("checkout"), checkoutSoon: t("checkoutSoon"),
    remove: t.raw("remove") as string, policies: t("policies"), decrease: p("decrease"), increase: p("increase"), quantity: p("quantity"),
    removed: t.raw("removed") as string, undo: t("undo"), trustCert: t("trustCert"), trustWarranty: t("trustWarranty"),
  };
}

export async function newsletterLabels(waitlist = false): Promise<NewsletterLabels> {
  const t = await getTranslations("newsletter");
  return {
    label: t("label"), placeholder: t("placeholder"), submit: waitlist ? t("waitlistSubmit") : t("submit"), submitting: t("submitting"),
    success: waitlist ? t("waitlistSuccess") : t("success"), invalid: t("invalid"), unavailable: t("unavailable"), legal: t("legal"), offline: t("offline"),
  };
}
