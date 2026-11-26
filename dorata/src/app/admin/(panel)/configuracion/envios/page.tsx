import { requireAdmin } from "@/server/admin/auth";
import { Card, inputCls, labelCls } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/forms";
import { saveShippingMethod } from "./actions";

export const metadata = { title: "Envíos" };
const usd = (c: number | null) => (c === null || c === undefined ? "" : (c / 100).toFixed(2));
const TYPE: Record<string, string> = { standard: "Estándar", express: "Exprés", free: "Gratis" };

export default async function ShippingPage() {
  const { sb } = await requireAdmin("admin");
  const { data } = await sb.from("shipping_methods")
    .select("id,code,type,price_cents,free_over_cents,eta_min_days,eta_max_days,is_active,shipping_method_translations(locale,name,description)")
    .order("sort_order");
  const methods = data ?? [];
  const anyActive = methods.some((m) => m.is_active);
  return (
    <div className="grid gap-6">
      {!anyActive && (
        <div role="note" className="rounded-[4px] border border-gold/50 bg-gold/10 p-4 text-[14px]">
          <strong>Aún no hay envíos activos.</strong> Mientras tanto la tienda dice “los costos de envío se confirman al finalizar la compra” y no promete tiempos.
          Completa precio y días de al menos un método y actívalo antes de abrir la tienda.
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {methods.map((m) => {
          const t = (m.shipping_method_translations as { locale: string; name: string; description: string | null }[]).find((x) => x.locale === "es");
          return (
            <Card key={m.id} title={`${TYPE[m.type] ?? m.type} · ${m.is_active ? "Activo" : "Inactivo"}`}>
              <ActionForm action={saveShippingMethod}>
                <input type="hidden" name="id" value={m.id} />
                <label className={labelCls}>Nombre que ve la clienta<input name="name" maxLength={60} required defaultValue={t?.name ?? ""} className={inputCls} /></label>
                <label className={labelCls}>Descripción (opcional)<input name="description" maxLength={200} defaultValue={t?.description ?? ""} placeholder="Ej: Entrega con número de rastreo" className={inputCls} /></label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={labelCls}>Precio (USD)<input name="price" inputMode="decimal" defaultValue={m.is_active || m.price_cents ? usd(m.price_cents) : ""} placeholder="Por definir" className={inputCls} /></label>
                  <label className={labelCls}>Gratis desde (USD, opcional)<input name="free_over" inputMode="decimal" defaultValue={usd(m.free_over_cents)} placeholder="Sin umbral" className={inputCls} /></label>
                  <label className={labelCls}>Días hábiles mín.<input name="eta_min" inputMode="numeric" defaultValue={m.eta_min_days ?? ""} placeholder="—" className={inputCls} /></label>
                  <label className={labelCls}>Días hábiles máx.<input name="eta_max" inputMode="numeric" defaultValue={m.eta_max_days ?? ""} placeholder="—" className={inputCls} /></label>
                </div>
                <label className="flex items-center gap-3 text-[15px] font-medium">
                  <input type="checkbox" name="is_active" defaultChecked={m.is_active} className="size-5 accent-[var(--ink)]" />Ofrecer este método en la tienda
                </label>
              </ActionForm>
            </Card>
          );
        })}
      </div>
      <p className="text-[13px] text-ink-3">Solo envíos dentro de EE. UU. Las tarifas automáticas por transportadora (USPS/UPS) se pueden conectar más adelante.</p>
    </div>
  );
}
