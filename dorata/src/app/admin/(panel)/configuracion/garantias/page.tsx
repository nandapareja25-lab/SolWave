import { requireAdmin } from "@/server/admin/auth";
import { Card, inputCls, labelCls } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/forms";
import { saveWarrantyPolicy } from "./actions";

export const metadata = { title: "Garantías" };
const areaCls = "min-h-28 w-full rounded-[4px] border border-line bg-ivory p-3 text-[15px] leading-relaxed outline-none focus:border-gold-deep";

export default async function WarrantiesPage() {
  const { sb } = await requireAdmin("admin");
  const [{ data }, { data: cats }] = await Promise.all([
    sb.from("warranty_policies").select("id,code,duration_months,is_active,warranty_policy_translations(locale,name,summary,coverage_md,exclusions_md)").order("sort_order"),
    sb.from("categories").select("default_warranty_policy_id"),
  ]);
  const usage = new Map<string, number>();
  for (const c of cats ?? []) if (c.default_warranty_policy_id) usage.set(c.default_warranty_policy_id, (usage.get(c.default_warranty_policy_id) ?? 0) + 1);
  return (
    <div className="grid gap-6">
      <p className="max-w-2xl text-[14px] text-ink-2">
        Cada producto toma la garantía de su categoría, o una propia; y un producto con varias partes (por ejemplo balines + hilo) puede tener una garantía por componente.
        Si dejas la duración vacía, la tienda dice “por definir” en lugar de prometer un plazo.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        {(data ?? []).map((w) => {
          const t = (w.warranty_policy_translations as { locale: string; name: string; summary: string; coverage_md: string; exclusions_md: string }[]).find((x) => x.locale === "es");
          const n = usage.get(w.id) ?? 0;
          return (
            <Card key={w.id} title={`${t?.name ?? w.code} · ${n} ${n === 1 ? "categoría" : "categorías"}`}>
              <ActionForm action={saveWarrantyPolicy} submitLabel="Guardar esta garantía">
                <input type="hidden" name="id" value={w.id} />
                <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-4">
                  <label className={labelCls}>Nombre<input name="name" maxLength={60} required defaultValue={t?.name ?? ""} className={inputCls} /></label>
                  <label className={labelCls}>Meses<input name="duration_months" inputMode="numeric" defaultValue={w.duration_months ?? ""} placeholder="Por definir" className={inputCls} /></label>
                </div>
                <label className={labelCls}>Resumen para la ficha de producto<input name="summary" maxLength={200} defaultValue={t?.summary ?? ""} className={inputCls} /></label>
                <label className={labelCls}>Qué cubre<textarea name="coverage_md" defaultValue={t?.coverage_md ?? ""} className={areaCls} /></label>
                <label className={labelCls}>Qué no cubre<textarea name="exclusions_md" defaultValue={t?.exclusions_md ?? ""} className={areaCls} /></label>
                <label className="flex items-center gap-3 text-[15px] font-medium">
                  <input type="checkbox" name="is_active" defaultChecked={w.is_active} className="size-5 accent-[var(--ink)]" />Disponible para asignar
                </label>
              </ActionForm>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
