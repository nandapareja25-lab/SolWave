import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { PageHeader, btnPrimary } from "@/components/admin/ui";
import { CategoryList } from "@/components/admin/CategoryList";

export const metadata = { title: "Categorías" };

export default async function CategoriesPage() {
  const { sb } = await requireAdmin("staff");
  const [{ data: cats }, { data: prods }] = await Promise.all([
    sb.from("categories").select("id,image_path,is_visible,show_in_nav,sort_order,auto_rule,parent_id,category_translations(locale,name,slug),warranty_policies(warranty_policy_translations(locale,name))").order("sort_order").order("created_at"),
    sb.from("products").select("id,primary_category_id,product_categories(category_id)").neq("status", "archived"),
  ]);
  // Productos por categoría: la principal + las categorías extra (sin contar dos veces)
  const counts = new Map<string, number>();
  for (const p of prods ?? []) {
    const ids = new Set([p.primary_category_id, ...((p.product_categories ?? []) as { category_id: string }[]).map((x) => x.category_id)]);
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const list = (cats ?? []).map((c) => {
    const t = (c.category_translations as { locale: string; name: string; slug: string }[]).find((x) => x.locale === "es");
    const w = (c.warranty_policies as unknown as { warranty_policy_translations: { locale: string; name: string }[] } | null)?.warranty_policy_translations.find((x) => x.locale === "es");
    return {
      id: c.id, name: t?.name ?? "(sin nombre)", visible: c.is_visible, nav: c.show_in_nav,
      auto: c.auto_rule as string | null, products: counts.get(c.id) ?? 0, warranty: w?.name ?? null,
      image: c.image_path && base ? `${base}/storage/v1/object/public/category-media/${c.image_path}` : null,
    };
  });
  return (
    <div>
      <PageHeader title="Categorías" description="El orden de esta lista es el orden en el menú y en los círculos de la portada."
        actions={<Link href="/admin/categorias/nueva" className={btnPrimary}><Plus aria-hidden="true" size={16} />Nueva categoría</Link>} />
      <CategoryList items={list} />
    </div>
  );
}
