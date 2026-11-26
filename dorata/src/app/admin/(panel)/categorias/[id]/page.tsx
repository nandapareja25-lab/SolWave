import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { CategoryEditor } from "@/components/admin/CategoryEditor";
import type { CategoryInput } from "../actions";

export const metadata = { title: "Categoría" };

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, role } = await requireAdmin("staff");
  const isNew = id === "nueva";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: cats }, { data: warranties }, { data: c }, { count }] = await Promise.all([
    sb.from("categories").select("id,category_translations(locale,name)").order("sort_order"),
    sb.from("warranty_policies").select("code,duration_months,warranty_policy_translations(locale,name)").order("sort_order"),
    isNew ? Promise.resolve({ data: null }) : sb.from("categories").select("*, category_translations(*), warranty_policies(code)").eq("id", id).maybeSingle(),
    isNew ? Promise.resolve({ count: 0 }) : sb.from("products").select("id", { count: "exact", head: true }).eq("primary_category_id", id),
  ]);
  if (!isNew && !c) notFound();
  const t = c ? (c.category_translations as { locale: string; name: string; slug: string; description: string | null; seo_title: string | null; seo_description: string | null }[]).find((x) => x.locale === "es") : null;
  const initial: CategoryInput = {
    id: c?.id ?? "", name: t?.name ?? "", slug: t?.slug ?? "", description: t?.description ?? "",
    seo_title: t?.seo_title ?? "", seo_description: t?.seo_description ?? "", parent_id: c?.parent_id ?? "",
    warranty_code: (c?.warranty_policies as { code: string } | null)?.code ?? "", auto_rule: (c?.auto_rule ?? "") as CategoryInput["auto_rule"],
    is_visible: c?.is_visible ?? true, show_in_nav: c?.show_in_nav ?? true, image_path: c?.image_path ?? null,
  };
  const name = (tr: unknown) => (tr as { locale: string; name: string }[]).find((x) => x.locale === "es")?.name ?? "";
  return (
    <div>
      <Link href="/admin/categorias" className="mb-4 inline-flex h-10 items-center gap-2 text-[14px] text-ink-2"><ArrowLeft aria-hidden="true" size={16} />Todas las categorías</Link>
      <CategoryEditor
        initial={initial}
        parents={(cats ?? []).filter((x) => x.id !== id).map((x) => ({ id: x.id, name: name(x.category_translations) }))}
        warranties={(warranties ?? []).map((w) => ({ code: w.code, name: name(w.warranty_policy_translations), months: w.duration_months }))}
        storageBase={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}
        canDelete={role !== "staff"} productCount={count ?? 0}
      />
    </div>
  );
}
