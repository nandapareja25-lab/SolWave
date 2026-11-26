import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { CollectionEditor } from "@/components/admin/CollectionEditor";
import { utcToWallTime } from "@/lib/tz";
import type { CollectionInput } from "../actions";

export const metadata = { title: "Colección" };

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "nueva";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { sb, role } = await requireAdmin("staff");
  const [{ data: s }, { data: c }] = await Promise.all([
    sb.from("store_settings").select("timezone").eq("id", 1).single(),
    isNew ? Promise.resolve({ data: null }) : sb.from("collections").select("*, collection_translations(*), product_collections(products(id, product_translations(locale,name)))").eq("id", id).maybeSingle(),
  ]);
  if (!isNew && !c) notFound();
  const tz = s?.timezone ?? "America/New_York";
  const t = c ? (c.collection_translations as { locale: string; name: string; slug: string; description: string | null }[]).find((x) => x.locale === "es") : undefined;
  const initial: CollectionInput = {
    id: c?.id ?? "", name: t?.name ?? "", slug: t?.slug ?? "", description: t?.description ?? "",
    is_visible: c?.is_visible ?? true, is_set: c?.is_set ?? false,
    starts_at: utcToWallTime(c?.starts_at, tz), ends_at: utcToWallTime(c?.ends_at, tz), image_path: c?.image_path ?? null,
  };
  const products = ((c?.product_collections ?? []) as unknown as { products: { id: string; product_translations: { locale: string; name: string }[] } | null }[])
    .flatMap((pc) => (pc.products ? [{ id: pc.products.id, name: pc.products.product_translations.find((x) => x.locale === "es")?.name ?? "" }] : []));
  return (
    <div>
      <Link href="/admin/colecciones" className="mb-4 inline-flex h-10 items-center gap-2 text-[14px] text-ink-2"><ArrowLeft aria-hidden="true" size={16} />Todas las colecciones</Link>
      <CollectionEditor initial={initial} timezone={tz} products={products} storageBase={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""} canDelete={role !== "staff"} />
    </div>
  );
}
