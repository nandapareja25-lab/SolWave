import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { formatInZone } from "@/lib/tz";

export const metadata = { title: "Legal y privacidad" };

type V = { version_label: string; effective_at: string; legal_review_status: string; published_at: string };
const REVIEW: Record<string, string> = { draft: "Borrador", needs_legal_review: "Falta revisión legal", approved: "Revisada por abogado" };

export default async function LegalListPage() {
  const { sb } = await requireAdmin("admin");
  const [{ data }, { data: s }] = await Promise.all([
    sb.from("pages").select("id,kind,show_in_footer,sort_order,page_translations(locale,title,slug),page_versions(version_label,effective_at,legal_review_status,published_at)").is("region_code", null).order("sort_order"),
    sb.from("store_settings").select("timezone").eq("id", 1).single(),
  ]);
  const tz = s?.timezone ?? "America/New_York";
  return (
    <div className="grid gap-4">
      <div role="note" className="rounded-[4px] border border-gold/50 bg-gold/10 p-4 text-[14px]">
        Los textos legales son una base de trabajo, no asesoría legal. Antes de vender, pide a un abogado que los revise y marca cada versión como “Revisada por abogado”.
        Cada publicación queda guardada para siempre: así sabes qué texto aceptó cada clienta.
      </div>
      <ul className="divide-y divide-line rounded-[4px] border border-line bg-surface">
        {(data ?? []).map((p) => {
          const t = (p.page_translations as { locale: string; title: string; slug: string }[]).find((x) => x.locale === "es");
          const now = new Date().toISOString();
          const live = (p.page_versions as V[]).filter((v) => v.effective_at <= now).sort((a, b) => b.effective_at.localeCompare(a.effective_at))[0];
          return (
            <li key={p.id}>
              <Link href={`/admin/configuracion/legal/${p.id}`} className="flex min-h-16 items-center gap-3 p-4 hover:bg-ivory">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{t?.title ?? p.kind}</span>
                  <span className="block text-[13px] text-ink-2">
                    {live ? `Versión ${live.version_label} · vigente desde ${formatInZone(live.effective_at, tz)} · ${REVIEW[live.legal_review_status]}` : "Sin publicar: la tienda muestra “en preparación”"}
                  </span>
                </span>
                <span className={`hidden rounded-full px-3 py-1 text-[12px] font-semibold sm:inline ${live ? (live.legal_review_status === "approved" ? "bg-success/10 text-success" : "bg-gold/15 text-gold-deep") : "bg-line/60 text-ink-2"}`}>
                  {live ? (live.legal_review_status === "approved" ? "Publicada" : "Publicada · revisar") : "Borrador"}
                </span>
                <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-ink-3" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
