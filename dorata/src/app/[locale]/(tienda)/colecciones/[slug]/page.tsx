import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CategoryView } from "@/components/catalogo/CategoryView";
import { getCollectionBySlug } from "@/server/catalog";

type Params = { locale: string; slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCollectionBySlug(slug);
  if (!c) return {};
  return { title: c.name, description: c.description ?? `${c.name}: colección en oro laminado 18K.`, alternates: { canonical: `/colecciones/${slug}` } };
}

/** Colección (editable en el panel): misma vista que una categoría, filtrada por la colección. */
export default async function CollectionPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<{ filtro?: string; orden?: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const c = await getCollectionBySlug(slug);
  if (!c) notFound();
  return <CategoryView category={c} collection basePath={`/colecciones/${slug}`} search={await searchParams} />;
}
