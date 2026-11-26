import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { DiscountEditor } from "@/components/admin/DiscountEditor";
import { utcToWallTime } from "@/lib/tz";
import type { DiscountInput } from "../actions";

export const metadata = { title: "Código de descuento" };
const es = (rows: unknown) => (rows as { locale: string; name: string }[]).find((x) => x.locale === "es")?.name ?? "";

export default async function DiscountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "nuevo";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { sb } = await requireAdmin("admin");
  const [{ data: s }, { data: cats }, { data: prods }, { data: d }] = await Promise.all([
    sb.from("store_settings").select("timezone").eq("id", 1).single(),
    sb.from("categories").select("id,auto_rule,category_translations(locale,name)").order("sort_order"),
    sb.from("products").select("id,status,product_translations(locale,name)").neq("status", "archived"),
    isNew ? Promise.resolve({ data: null }) : sb.from("discounts").select("*, discount_categories(category_id), discount_products(product_id)").eq("id", id).maybeSingle(),
  ]);
  if (!isNew && !d) notFound();
  const tz = s?.timezone ?? "America/New_York";
  const cents = (c: number | null) => (c == null ? "" : String(c / 100));
  const initial: DiscountInput = {
    id: d?.id ?? "", code: (d?.code as string) ?? "", description: d?.description ?? "", type: d?.type ?? "percentage",
    value: d?.type === "percentage" ? String(Number(d.percent_off)) : d?.type === "fixed_amount" ? cents(d.amount_off_cents) : "",
    scope: d?.scope ?? "all",
    category_ids: ((d?.discount_categories ?? []) as { category_id: string }[]).map((x) => x.category_id),
    product_ids: ((d?.discount_products ?? []) as { product_id: string }[]).map((x) => x.product_id),
    min_subtotal: cents(d?.min_subtotal_cents ?? null), starts_at: utcToWallTime(d?.starts_at, tz), ends_at: utcToWallTime(d?.ends_at, tz),
    usage_limit: d?.usage_limit ? String(d.usage_limit) : "", usage_limit_per_customer: d?.usage_limit_per_customer ? String(d.usage_limit_per_customer) : "",
    first_order_only: d?.first_order_only ?? false, is_active: d?.is_active ?? false,
  };
  return (
    <div>
      <Link href="/admin/descuentos" className="mb-4 inline-flex h-10 items-center gap-2 text-[14px] text-ink-2"><ArrowLeft aria-hidden="true" size={16} />Todos los códigos</Link>
      <DiscountEditor initial={initial} timezone={tz} timesUsed={d?.times_used ?? 0}
        categories={(cats ?? []).filter((c) => !c.auto_rule).map((c) => ({ id: c.id, name: es(c.category_translations) }))}
        products={(prods ?? []).map((p) => ({ id: p.id, name: es(p.product_translations), draft: p.status === "draft" })).sort((a, b) => a.name.localeCompare(b.name))} />
    </div>
  );
}
