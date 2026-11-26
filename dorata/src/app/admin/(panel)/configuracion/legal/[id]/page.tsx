import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { Card, inputCls, labelCls } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/forms";
import { formatInZone } from "@/lib/tz";
import { renderMarkdown } from "@/lib/markdown";
import { publishVersion, saveDraft, setFooter } from "../actions";

export const metadata = { title: "Política" };
type V = { id: string; version_label: string; effective_at: string; legal_review_status: string; change_summary: string | null; published_at: string };
const REVIEW: Record<string, string> = { draft: "Borrador", needs_legal_review: "Falta revisión legal", approved: "Revisada por abogado" };

function nextLabel(versions: V[]): string {
  if (versions.length === 0) return "1.0";
  const top = versions.map((v) => v.version_label.split(".").map(Number)).sort((a, b) => (b[0]! - a[0]!) || ((b[1] ?? 0) - (a[1] ?? 0)))[0]!;
  return `${top[0]}.${(top[1] ?? 0) + 1}`;
}

export default async function LegalEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { sb } = await requireAdmin("admin");
  const [{ data: p }, { data: s }] = await Promise.all([
    sb.from("pages").select("id,kind,show_in_footer,page_translations(locale,title,slug,body_md),page_versions(id,version_label,effective_at,legal_review_status,change_summary,published_at)").eq("id", id).maybeSingle(),
    sb.from("store_settings").select("timezone").eq("id", 1).single(),
  ]);
  if (!p) notFound();
  const tz = s?.timezone ?? "America/New_York";
  const t = (p.page_translations as { locale: string; title: string; slug: string; body_md: string }[]).find((x) => x.locale === "es");
  const versions = (p.page_versions as V[]).sort((a, b) => b.published_at.localeCompare(a.published_at));
  const placeholders = (t?.body_md.match(/\[[^\]\n]+\](?!\()/g) ?? []).length;

  return (
    <div className="grid gap-6">
      <Link href="/admin/configuracion/legal" className="inline-flex h-10 items-center gap-2 text-[14px] text-ink-2"><ArrowLeft aria-hidden="true" size={16} />Todas las políticas</Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 gap-6">
          <Card title="Borrador">
            {placeholders > 0 && <p role="note" className="mb-4 rounded-[4px] bg-gold/10 p-3 text-[14px]">Este texto tiene {placeholders} {placeholders === 1 ? "parte" : "partes"} entre corchetes por completar. Revísalas antes de publicar.</p>}
            <ActionForm action={saveDraft} submitLabel="Guardar borrador">
              <input type="hidden" name="page_id" value={p.id} />
              <label className={labelCls}>Título<input name="title" required maxLength={120} defaultValue={t?.title ?? ""} className={inputCls} /></label>
              <label className={labelCls}>
                Texto (formato simple: ## para subtítulos, - para listas, **negrita**)
                <textarea name="body_md" defaultValue={t?.body_md ?? ""} className="min-h-[420px] w-full rounded-[4px] border border-line bg-ivory p-3 font-mono text-[14px] leading-relaxed outline-none focus:border-gold-deep" />
              </label>
              <p className="text-[13px] text-ink-3">Dirección en la tienda: dorata18k.com/{t?.slug}</p>
            </ActionForm>
          </Card>
          {t?.body_md && (
            <Card title="Así se lee (borrador guardado)">
              <div className="prose-legal max-w-none text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(t.body_md) }} />
            </Card>
          )}
        </div>
        <div className="grid content-start gap-6">
          <Card title="Publicar">
            <ActionForm action={publishVersion} submitLabel="Publicar versión" primary>
              <input type="hidden" name="page_id" value={p.id} />
              <p className="text-[14px] text-ink-2">Publica el último borrador guardado. Las versiones anteriores quedan en el historial.</p>
              <label className={labelCls}>Número de versión<input name="version_label" required defaultValue={nextLabel(versions)} className={inputCls} /></label>
              <label className={labelCls}>Qué cambió (opcional)<input name="change_summary" maxLength={300} className={inputCls} placeholder="Ej: Agregamos plazos de envío" /></label>
              <label className={labelCls}>Vigente desde (vacío = ahora)<input type="datetime-local" name="effective_at" className={inputCls} /></label>
              <label className={labelCls}>Revisión legal
                <select name="legal_review_status" defaultValue="needs_legal_review" className={inputCls}>
                  {Object.entries(REVIEW).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </ActionForm>
          </Card>
          <Card title="Pie de página">
            <ActionForm action={setFooter} submitLabel="Guardar pie de página">
              <input type="hidden" name="page_id" value={p.id} />
              <label className="flex items-center gap-3 text-[15px]"><input type="checkbox" name="show_in_footer" defaultChecked={p.show_in_footer} className="size-5 accent-[var(--ink)]" />Mostrar enlace en el pie de la tienda</label>
            </ActionForm>
          </Card>
          <Card title="Historial">
            {versions.length === 0 ? <p className="text-[14px] text-ink-2">Aún no hay versiones publicadas.</p> : (
              <ol className="grid gap-3">
                {versions.map((v) => (
                  <li key={v.id} className="text-[13px]">
                    <span className="font-semibold text-ink">v{v.version_label}</span> · vigente desde {formatInZone(v.effective_at, tz)}
                    <span className="block text-ink-2">{REVIEW[v.legal_review_status]}{v.change_summary ? ` · ${v.change_summary}` : ""}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
