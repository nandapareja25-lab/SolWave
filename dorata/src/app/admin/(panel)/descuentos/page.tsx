import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { PageHeader, btnPrimary } from "@/components/admin/ui";
import { formatUSD } from "@/lib/money";
import { formatInZone } from "@/lib/tz";

export const metadata = { title: "Descuentos" };

export default async function DiscountsPage() {
  const { sb } = await requireAdmin("admin");
  const [{ data: rows }, { data: s }] = await Promise.all([
    sb.from("discounts").select("id,code,description,type,percent_off,amount_off_cents,scope,min_subtotal_cents,starts_at,ends_at,usage_limit,times_used,first_order_only,is_active").order("created_at", { ascending: false }),
    sb.from("store_settings").select("timezone").eq("id", 1).single(),
  ]);
  const tz = s?.timezone ?? "America/New_York";
  // render del servidor: la hora decide si está vigente
  const now = Date.now();
  const list = (rows ?? []).map((d) => {
    const value = d.type === "percentage" ? `${Number(d.percent_off)}% de descuento` : d.type === "fixed_amount" ? `${formatUSD(d.amount_off_cents!)} de descuento` : "Envío gratis";
    const future = d.starts_at && Date.parse(d.starts_at) > now, past = d.ends_at && Date.parse(d.ends_at) <= now;
    const used = d.usage_limit && d.times_used >= d.usage_limit;
    const state = !d.is_active ? "Inactivo" : future ? `Empieza ${formatInZone(d.starts_at!, tz)}` : past ? "Vencido" : used ? "Agotado" : "Activo";
    const details = [d.scope === "categories" ? "algunas categorías" : d.scope === "products" ? "algunos productos" : "toda la tienda",
      d.min_subtotal_cents ? `desde ${formatUSD(d.min_subtotal_cents)}` : null, d.first_order_only ? "solo primera compra" : null,
      `${d.times_used}${d.usage_limit ? ` de ${d.usage_limit}` : ""} usos`].filter(Boolean).join(" · ");
    return { id: d.id, code: d.code as string, value, details, state, on: state === "Activo", note: d.description as string | null };
  });
  return (
    <div>
      <PageHeader title="Descuentos" description="Códigos que tus clientas escriben al pagar. Empiezan inactivos: actívalos cuando quieras usarlos."
        actions={<Link href="/admin/descuentos/nuevo" className={`${btnPrimary} w-full sm:w-auto`}><Plus aria-hidden="true" size={16} />Nuevo código</Link>} />
      <div role="note" className="mb-4 rounded-[4px] border border-gold/50 bg-gold/10 p-3 text-[13px]">Los códigos se aplicarán en el pago cuando conectemos Stripe (siguiente fase). Puedes dejarlos preparados desde ya.</div>
      {list.length === 0 ? (
        <div className="filete-doble rounded-[4px] border border-line bg-surface p-6 text-center">
          <p className="font-display text-[22px]">Sin códigos de descuento</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-ink-2">Crea uno para una campaña, un evento o para tus clientas frecuentes.</p>
          <Link href="/admin/descuentos/nuevo" className={`${btnPrimary} mt-4`}><Plus aria-hidden="true" size={16} />Crear un código</Link>
        </div>
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {list.map((d, i) => (
            <li key={d.id} className="rise min-w-0" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
              <Link href={`/admin/descuentos/${d.id}`} className="flex items-center gap-3 rounded-[4px] border border-line bg-surface p-3 hover:bg-ivory">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-mono text-[16px] font-semibold tracking-wide">{d.code}</span>
                    <span className={`shrink-0 rounded-[4px] px-2 py-0.5 text-[12px] font-semibold ${d.on ? "bg-success/10 text-success" : "bg-line/60 text-ink-2"}`}>{d.state}</span>
                  </span>
                  <span className="block truncate text-[14px]">{d.value}</span>
                  <span className="block truncate text-[12px] text-ink-2">{d.details}</span>
                </span>
                <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-ink-3" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
