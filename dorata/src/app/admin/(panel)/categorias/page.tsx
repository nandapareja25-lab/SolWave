import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { PageHeader, btnPrimary } from "@/components/admin/ui";
import { CategoryRow } from "@/components/admin/CategoryRow";

export const metadata = { title: "Categorías" };

export default async function CategoriesPage() {
  const { sb } = await requireAdmin("staff");
  const [{ data: cats }, { data: prods }] = await Promise.all([
    sb.from("categories").select("id,image_path,is_visible,show_in_nav,sort_order,auto_rule,parent_id,category_translations(locale,name,slug),warranty_policies(warranty_policy_translations(locale,name))").order("sort_order").order("created_at"),
    sb.from("product_categories").select("category_id"),
  ]);
  const counts = new Map<string, number>();
  for (const p of prods ?? []) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const list = (cats ?? []).map((c) => {
    const t = (c.category_translations as { locale: string; name: string; slug: string }[]).find((x) => x.locale === "es");
    const w = (c.warranty_policies as unknown as { warranty_policy_translations: { locale: string; name: string }[] } | null)?.warranty_policy_translations.find((x) => x.locale === "es");
    return {
      id: c.id, name: t?.name ?? "(sin nombre)", slug: t?.slug ?? "", visible: c.is_visible, nav: c.show_in_nav,
      auto: c.auto_rule as string | null, products: counts.get(c.id) ?? 0, warranty: w?.name ?? null,
      image: c.image_path && base ? `${base}/storage/v1/object/public/category-media/${c.image_path}` : null,
    };
  });
  return (
    <div>
      <PageHeader title="Categorías" description="El orden de esta lista es el orden en el menú y en los círculos de la portada."
        actions={<Link href="/admin/categorias/nueva" className={btnPrimary}><Plus aria-hidden="true" size={16} />Nueva categoría</Link>} />
      <ol className="grid gap-3">
        {list.map((c, i) => <CategoryRow key={c.id} c={c} first={i === 0} last={i === list.length - 1} />)}
      </ol>
    </div>
  );
}
