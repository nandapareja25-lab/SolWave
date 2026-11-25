"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  applyGpc, categoriesFor, CONSENT_COOKIE, CONSENT_MAX_AGE_SECONDS, needsPrompt, parseConsent, serializeConsent,
  type ConsentAction, type ConsentCategories,
} from "@/lib/consent";

export type TrackingIntegration = { provider: "google_analytics" | "meta_pixel" | "tiktok_pixel" | "other"; public_id: string; category: "analytics" | "marketing" | "personalization" };
export type CookieLabels = Record<
  "title" | "body" | "policy" | "acceptAll" | "rejectAll" | "configure" | "save" | "saved" | "essential" | "essentialBody" |
  "analytics" | "analyticsBody" | "marketing" | "marketingBody" | "personalization" | "personalizationBody" | "gpc", string>;

export const OPEN_PRIVACY_EVENT = "dorata:open-privacy";

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? m[1]! : null;
}

/** Carga scripts de terceros SOLO para categorías aceptadas. Nada se carga antes del consentimiento. */
function loadIntegrations(list: TrackingIntegration[], c: ConsentCategories) {
  for (const it of list) {
    if (!c[it.category]) continue;
    const id = `trk-${it.provider}`;
    if (document.getElementById(id)) continue;
    const s = document.createElement("script");
    s.id = id;
    s.async = true;
    if (it.provider === "google_analytics") {
      const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void };
      w.dataLayer = w.dataLayer || [];
      w.gtag = function gtag() { w.dataLayer.push(arguments); }; // eslint-disable-line prefer-rest-params
      w.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
      w.gtag("consent", "update", { analytics_storage: c.analytics ? "granted" : "denied", ad_storage: c.marketing ? "granted" : "denied", ad_user_data: c.marketing ? "granted" : "denied", ad_personalization: c.marketing ? "granted" : "denied" });
      w.gtag("js", new Date());
      w.gtag("config", it.public_id, { anonymize_ip: true });
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(it.public_id)}`;
    } else if (it.provider === "meta_pixel") {
      s.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(it.public_id)});fbq('track','PageView');`;
    } else if (it.provider === "tiktok_pixel") {
      s.text = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e){var n="https://analytics.tiktok.com/i18n/pixel/events.js";var a=d.createElement("script");a.type="text/javascript";a.async=!0;a.src=n+"?sdkid="+e+"&lib="+t;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)};ttq.load(${JSON.stringify(it.public_id)});ttq.page()}(window,document,"ttq");`;
    } else {
      continue; // "other": se integra caso por caso
    }
    document.head.appendChild(s);
  }
}

export function CookieConsent({ labels, policyVersion, integrations }: { labels: CookieLabels; policyVersion: string; integrations: TrackingIntegration[] }) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [gpc, setGpc] = useState(false);
  const [prefs, setPrefs] = useState<ConsentCategories>({ analytics: false, marketing: false, personalization: false });

  useEffect(() => {
    const signal = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
    setGpc(signal);
    const current = parseConsent(readCookie(CONSENT_COOKIE));
    if (needsPrompt(current, policyVersion)) setVisible(true);
    else if (current) {
      const cats = applyGpc({ analytics: current.a, marketing: current.m, personalization: current.p }, signal);
      setPrefs(cats);
      loadIntegrations(integrations, cats);
    }
    const reopen = () => { setSaved(false); setExpanded(true); setVisible(true); };
    window.addEventListener(OPEN_PRIVACY_EVENT, reopen);
    return () => window.removeEventListener(OPEN_PRIVACY_EVENT, reopen);
  }, [policyVersion, integrations]);

  const persist = useCallback((action: ConsentAction, chosen: ConsentCategories) => {
    const cats = applyGpc(chosen, gpc);
    const prev = parseConsent(readCookie(CONSENT_COOKIE));
    const id = prev?.id ?? crypto.randomUUID();
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${CONSENT_COOKIE}=${serializeConsent({ v: policyVersion, id, a: cats.analytics, m: cats.marketing, p: cats.personalization, t: Date.now() })}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
    const finalAction: ConsentAction = gpc && action === "accept_all" ? "custom" : action;
    void fetch("/api/consent", {
      method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: id, action: finalAction, ...cats, gpc, policy_version: policyVersion }),
    }).catch(() => { /* el registro es best-effort; la preferencia ya quedó guardada en el navegador */ });
    setPrefs(cats);
    loadIntegrations(integrations, cats);
    // Si retiró un permiso, los scripts ya cargados solo se van recargando la página.
    if (prev && ((prev.a && !cats.analytics) || (prev.m && !cats.marketing))) setTimeout(() => location.reload(), 900);
    setSaved(true);
    setTimeout(() => { setVisible(false); setExpanded(false); }, 900);
  }, [gpc, policyVersion, integrations]);

  if (!visible) return null;

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="cookie-title"
      className="rise fixed inset-x-2 bottom-2 z-50 mx-auto max-h-[85dvh] max-w-md overflow-y-auto rounded-[4px] border border-line bg-surface p-4 shadow-[0_-8px_32px_-12px_rgba(40,30,15,.28)] md:left-auto md:right-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="cookie-title" className="font-display text-[20px] leading-tight">{labels.title}</h2>
        {!expanded && <button type="button" onClick={() => setExpanded(true)} className="min-h-11 shrink-0 text-[13px] font-semibold underline underline-offset-4">{labels.configure}</button>}
      </div>
      <p className="text-[14px] leading-[1.45] text-ink-2">
        {labels.body}{" "}
        <Link href="/cookies" className="text-ink underline decoration-gold underline-offset-[3px]">{labels.policy}</Link>
      </p>
      {gpc && <p className="mt-2 rounded-[4px] bg-cream px-3 py-2 text-[13px] text-ink-2">{labels.gpc}</p>}
      {expanded && (
        <div className="mt-3 border-t border-line">
          <div className="flex items-center gap-3 border-b border-line py-3">
            <div className="flex-1"><p className="text-[14px] font-semibold">{labels.essential}</p><p className="text-[13px] leading-[1.4] text-ink-2">{labels.essentialBody}</p></div>
            <span role="switch" aria-checked="true" aria-disabled="true" aria-label={labels.essential} className="relative h-[26px] w-11 shrink-0 rounded-full bg-gold-deep opacity-70"><span aria-hidden="true" className="absolute left-[3px] top-[3px] size-5 translate-x-[18px] rounded-full bg-surface" /></span>
          </div>
          <Toggle k="analytics" label={labels.analytics} body={labels.analyticsBody} prefs={prefs} setPrefs={setPrefs} locked={false} />
          <Toggle k="marketing" label={labels.marketing} body={labels.marketingBody} prefs={prefs} setPrefs={setPrefs} locked={gpc} />
          <Toggle k="personalization" label={labels.personalization} body={labels.personalizationBody} prefs={prefs} setPrefs={setPrefs} locked={false} />
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => persist("reject_all", categoriesFor("reject_all"))} className="press h-11 rounded-full border border-ink text-[14px] font-semibold">{labels.rejectAll}</button>
        <button type="button" onClick={() => persist("accept_all", categoriesFor("accept_all"))} className="press h-11 rounded-full bg-ink text-[14px] font-semibold text-on-dark">{labels.acceptAll}</button>
      </div>
      {expanded && (
        <button type="button" onClick={() => persist("custom", prefs)} className="press mt-1 h-11 w-full text-[14px] font-semibold underline underline-offset-4">
          {labels.save}
        </button>
      )}
      {saved && <p role="status" className="text-center text-[13px] text-gold-deep">{labels.saved}</p>}
    </div>
  );
}

function Toggle({ k, label, body, prefs, setPrefs, locked }: {
  k: keyof ConsentCategories; label: string; body: string; prefs: ConsentCategories;
  setPrefs: React.Dispatch<React.SetStateAction<ConsentCategories>>; locked: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3">
      <div className="flex-1"><p className="text-[14px] font-semibold">{label}</p><p className="text-[13px] leading-[1.4] text-ink-2">{body}</p></div>
      <button type="button" role="switch" aria-checked={prefs[k]} aria-label={label} disabled={locked}
        onClick={() => setPrefs((p) => ({ ...p, [k]: !p[k] }))}
        className={`relative h-[26px] w-11 shrink-0 rounded-full transition-colors duration-150 disabled:opacity-50 ${prefs[k] ? "bg-ink" : "bg-line"}`}>
        <span aria-hidden="true" className={`absolute left-[3px] top-[3px] size-5 rounded-full bg-surface shadow transition-transform duration-150 ${prefs[k] ? "translate-x-[18px]" : ""}`} />
      </button>
    </div>
  );
}

/** Botón del footer "Preferencias de privacidad": reabre el panel en cualquier momento. */
export function PrivacyPreferencesButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_PRIVACY_EVENT))}
      className="min-h-11 text-left text-[14px] text-gold underline decoration-gold/60 underline-offset-[3px]">
      {label}
    </button>
  );
}
