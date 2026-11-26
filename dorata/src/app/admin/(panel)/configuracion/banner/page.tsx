import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { Card, btnPrimary } from "@/components/admin/ui";
import { CampaignRowActions } from "@/components/admin/CampaignRowActions";
import { formatInZone } from "@/lib/tz";

export const metadata = { title: "Barra de anuncios" };

type Row = { id: string; internal_name: string; is_active: boolean; priority: number; starts_at: string; ends_at: string | null; timezone: string; style: string; countdown_enabled: boolean; countdown_target_at: string | null };

function status(r: Row, liveId: string | null, now: number) {
  if (r.id === liveId) return { label: "Se ve ahora", cls: "bg-success/10 text-success" };
  if (!r.is_active) return { label: "Inactiva", cls: "bg-line/60 text-ink-2" };
  if (Date.parse(r.starts_at) > now) return { label: "Programada", cls: "bg-gold/15 text-gold-deep" };
  if (r.ends_at && Date.parse(r.ends_at) <= now) return { label: "Terminada", cls: "bg-line/60 text-ink-2" };
  return { label: "Tapada por otra de mayor prioridad", cls: "bg-line/60 text-ink-2" };
}

export default async function BannerPage() {
  const { sb } = await requireAdmin("admin");
  const [{ data: rows }, { data: live }] = await Promise.all([
    sb.from("announcement_campaigns").select("id,internal_name,is_active,priority,starts_at,ends_at,timezone,style,countdown_enabled,countdown_target_at").order("priority", { ascending: false }).order("starts_at", { ascending: false }),
    sb.rpc("current_announcement", { p_locale: "es" }),
  ]);
  const liveId = (live as { campaign_id?: string } | null)?.campaign_id ?? null;
  const now = Date.now();
  const list = (rows ?? []) as Row[];

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-[14px] text-ink-2">
            La barra superior de la tienda. Si hay varias campañas activas al mismo tiempo, se muestra la de <strong>mayor prioridad</strong>.
            Las fechas se escriben en la hora del negocio.
          </p>
          <Link href="/admin/configuracion/banner/nueva" className={btnPrimary}><Plus aria-hidden="true" size={16} />Nueva campaña</Link>
        </div>
      </Card>

      {list.length === 0 ? (
        <Card><p className="text-[15px]">No hay campañas. Crea una para mostrar un aviso arriba de la tienda.</p></Card>
      ) : (
        <ul className="grid gap-3">
          {list.map((r) => {
            const st = status(r, liveId, now);
            return (
              <li key={r.id} className="rounded-[4px] border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/admin/configuracion/banner/${r.id}`} className="text-[17px] font-semibold underline-offset-4 hover:underline">{r.internal_name}</Link>
                    <p className="mt-1 text-[13px] text-ink-2">
                      Desde {formatInZone(r.starts_at, r.timezone)}{r.ends_at ? ` hasta ${formatInZone(r.ends_at, r.timezone)}` : " · sin fecha de fin"}
                      {r.countdown_enabled && r.countdown_target_at ? ` · contador a ${formatInZone(r.countdown_target_at, r.timezone)}` : ""}
                      {` · prioridad ${r.priority}`}
                    </p>
                  </div>
                  <span className={`rounded-[4px] px-2 py-1 text-[12px] font-semibold ${st.cls}`}>{st.label}</span>
                </div>
                <CampaignRowActions id={r.id} active={r.is_active} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
