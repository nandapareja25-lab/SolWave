import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CategoryView } from "@/components/catalogo/CategoryView";
import { LegalView } from "@/components/catalogo/LegalView";
import { getCategoryBySlug, getLegalPage } from "@/server/catalog";

type Params = { locale: string; slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (category) return { title: category.name, description: category.description ?? `${category.name} en oro laminado 18K con garantía de color.`, alternates: { canonical: `/${slug}` } };
  const page = await getLegalPage(slug);
  if (page) return { title: page.title, alternates: { canonical: `/${slug}` }, robots: page.inReview ? { index: false } : undefined };
  return {};
}

/** Un segmento: categoría (editable en el panel) o página legal (editable). */
export default async function SlugPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<{ filtro?: string; orden?: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const category = await getCategoryBySlug(slug);
  if (category) return <CategoryView category={category} basePath={`/${slug}`} search={await searchParams} />;
  const page = await getLegalPage(slug);
  if (page) return <LegalView page={page} />;
  notFound();
}
