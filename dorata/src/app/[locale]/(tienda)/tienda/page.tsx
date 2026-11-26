import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CategoryView } from "@/components/catalogo/CategoryView";

export const metadata: Metadata = { title: "Toda la tienda", alternates: { canonical: "/tienda" } };

export default async function ShopPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ filtro?: string; orden?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CategoryView category={null} basePath="/tienda" search={await searchParams} />;
}
