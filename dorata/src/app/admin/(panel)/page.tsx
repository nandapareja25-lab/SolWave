import Link from "next/link";
import { AlertTriangle, Boxes, Gem, Mail, Store } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { Card, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

const MODE_LABEL = { coming_soon: "Próximamente", live: "Tienda activa", maintenance: "Mantenimiento" } as const;

export default async function DashboardPage() {
  const { sb, role } = await requireAdmin("staff");
  const [mode, products, low, waitlist] = await Promise.all([
    sb.rpc("effective_store_mode"),
    sb.from("products").select("status", { count: "exact", head: false }),
    sb.from("v_inventory_status").select("sku,variant_title,available,low_stock_threshold").eq("is_low", true).limit(8),
    role === "staff" ? Promise.resolve({ count: null }) : sb.from("marketing_subscriptions").select("id", { count: "exact", head: true }).eq("status", "subscribed"),
  ]);
  const byStatus = (s: string) => (products.data ?? []).filter((p) => p.status === s).length;
  const m = (mode.data as { mode: keyof typeof MODE_LABEL } | null)?.mode ?? "coming_soon";

  const stats = [
    { icon: Store, label: "Estado de la tienda", value: MODE_LABEL[m], href: "/admin/configuracion" },
    { icon: Gem, label: "Productos activos", value: String(byStatus("active")), sub: `${byStatus("draft")} en borrador`, href: "/admin/productos" },
    { icon: Boxes, label: "Inventario bajo", value: String(low.data?.length ?? 0), href: "/admin/inventario" },
    ...(waitlist.count !== null ? [{ icon: Mail, label: "Lista de espera y novedades", value: String(waitlist.count), href: "/admin/configuracion" }] : []),
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Ventas, pedidos y utilidad aparecerán aquí cuando la tienda empiece a vender (fases 4–6)." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, sub, href }) => (
          <Link key={label} href={href} className="press rounded-[4px] border border-line bg-surface p-4 hover:border-gold">
            <Icon aria-hidden="true" size={18} className="text-gold-deep" strokeWidth={1.75} />
            <p className="mt-3 text-[12px] font-medium uppercase tracking-[.1em] text-ink-3">{label}</p>
            <p className={`mt-1 font-display leading-tight ${/^\d+$/.test(value) ? "text-[28px] leading-none" : "text-[20px]"}`}>{value}</p>
            {sub && <p className="mt-1 text-[12px] text-ink-3">{sub}</p>}
          </Link>
        ))}
      </div>
      <Card title="Inventario bajo" className="mt-6">
        {(low.data ?? []).length === 0 ? (
          <p className="text-[14px] text-ink-2">Todo en orden: ninguna variante por debajo de su stock mínimo.</p>
        ) : (
          <ul className="divide-y divide-line">
            {(low.data ?? []).map((v) => (
              <li key={v.sku} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                <span className="flex items-center gap-2"><AlertTriangle aria-hidden="true" size={16} className="text-warning" />{v.sku} · {v.variant_title}</span>
                <span className="tabular font-semibold">{v.available} / mín. {v.low_stock_threshold}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
