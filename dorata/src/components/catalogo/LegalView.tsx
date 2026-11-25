import { getTranslations } from "next-intl/server";
import { FileClock, ShieldCheck } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { getWarrantyPolicies } from "@/server/catalog";
import type { LegalPage } from "@/server/types";

const years = (m: number) => (m % 12 === 0 ? `${m / 12} ${m / 12 === 1 ? "año" : "años"}` : `${m} meses`);

export async function LegalView({ page }: { page: LegalPage }) {
  const t = await getTranslations("legal");
  const warranties = page.kind === "warranty" ? await getWarrantyPolicies() : [];
  const date = page.effectiveAt
    ? new Intl.DateTimeFormat("es-US", { dateStyle: "long", timeZone: "America/New_York" }).format(new Date(page.effectiveAt))
    : null;

  return (
    <article className="mx-auto max-w-2xl px-4 pb-16 pt-8">
      <h1 className="font-display text-[32px] leading-[1.1]">{page.title}</h1>
      <p className="mt-2 text-[13px] text-ink-3">
        {page.versionLabel && <>{t("version", { version: page.versionLabel })} · </>}
        {date && t("updated", { date })}
      </p>
      {page.inReview && (
        <p className="mt-4 flex items-start gap-2 rounded-[4px] border border-gold-soft bg-cream px-4 py-3 text-[14px] text-ink-2">
          <FileClock aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-gold-deep" /> {t("inReview")}
        </p>
      )}

      {page.kind === "warranty" && (
        <div className="mt-6">
          <p className="text-[15px] text-ink-2">{t("warrantyIntro")}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {warranties.map((w) => (
              <div key={w.code} className="filete-doble velvet rounded-[4px] p-5">
                <ShieldCheck aria-hidden="true" size={20} className="text-gold" strokeWidth={1.5} />
                <p className="mt-2 font-display text-[28px] leading-none text-gold">{years(w.months)}</p>
                <p className="mt-2 text-[13px] leading-[1.4] text-on-dark-2">{w.categoryNames.map((n, i) => (i === 0 ? n : n.toLowerCase())).join(", ").replace(/, ([^,]*)$/, " y $1")}</p>
              </div>
            ))}
          </div>
          {warranties[0] && (
            <div className="prose-legal">
              <h2>{t("covers")}</h2>
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(warranties[0].coverageMd) }} />
              <h2>{t("excludes")}</h2>
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(warranties[0].exclusionsMd) }} />
            </div>
          )}
        </div>
      )}

      {page.bodyMd && <div className="prose-legal mt-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.bodyMd) }} />}
    </article>
  );
}
