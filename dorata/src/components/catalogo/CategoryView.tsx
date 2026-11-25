import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/tienda/ProductCard";
import { ProductImage } from "@/components/tienda/ProductImage";
import { listProducts } from "@/server/catalog";
import type { Category, ProductQuery } from "@/server/types";

type Search = { filtro?: string; orden?: string };

export function parseQuery(sp: Search): Pick<ProductQuery, "filter" | "sort"> {
  const filter = sp.filtro === "nuevos" ? "new" : sp.filtro === "oferta" ? "sale" : undefined;
  const sort = sp.orden === "nuevos" ? "new" : sp.orden === "precio-asc" ? "price-asc" : sp.orden === "precio-desc" ? "price-desc" : "featured";
  return { filter, sort };
}

/** Listado con filtros visibles (chips) y orden, guardados en la URL (se pueden compartir). */
export async function CategoryView({ category, basePath, search }: { category: Category | null; basePath: string; search: Search }) {
  const t = await getTranslations("category");
  const { filter, sort } = parseQuery(search);
  const products = await listProducts({ categorySlug: category?.slug, filter, sort });
  const title = category?.name ?? t("allProducts");
  const qs = (next: Partial<Search>) => {
    const merged = { ...search, ...next };
    const params = new URLSearchParams(Object.entries(merged).filter(([, v]) => v) as [string, string][]);
    const str = params.toString();
    return str ? `${basePath}?${str}` : basePath;
  };
  const filters = [
    { key: undefined, label: t("all") },
    ...(category?.autoRule !== "new" ? [{ key: "nuevos", label: t("onlyNew") }] : []),
    ...(category?.autoRule !== "sale" ? [{ key: "oferta", label: t("onlySale") }] : []),
  ];
  const sorts = [
    { key: undefined, label: t("sortFeatured") },
    { key: "nuevos", label: t("sortNew") },
    { key: "precio-asc", label: t("sortPriceAsc") },
    { key: "precio-desc", label: t("sortPriceDesc") },
  ];
  const chip = (active: boolean) =>
    `press flex h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-[14px] ${active ? "border-ink bg-ink font-semibold text-on-dark" : "border-line bg-surface text-ink hover:border-ink-3"}`;

  return (
    <>
      <header className="velvet">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-6">
          <span className="grid size-16 shrink-0 place-items-center rounded-full p-[3px] ring-1 ring-gold">
            <ProductImage image={category?.image ?? { url: null, illustration: "set", alt: "" }} className="size-full rounded-full" />
          </span>
          <div className="min-w-0">
            <nav aria-label="Ruta" className="text-[12px] text-on-dark-2"><Link href="/" className="underline-offset-2 hover:underline">Inicio</Link> <span aria-hidden="true">/</span> {title}</nav>
            <h1 className="mt-1 font-display text-[32px] leading-[1.1]">{title}</h1>
            <p className="text-[13px] text-on-dark-2" aria-live="polite">{t("count", { count: products.length })}</p>
          </div>
        </div>
        <div className="hairline-gold" />
      </header>

      <div className="mx-auto max-w-6xl">
        <nav aria-label={t("filters")} className="pt-4">
          <ul className="rail">
            {filters.map((f) => (
              <li key={f.label}><Link href={qs({ filtro: f.key })} aria-current={search.filtro === f.key || (!search.filtro && !f.key) ? "true" : undefined} className={chip(search.filtro === f.key || (!search.filtro && !f.key))}>{f.label}</Link></li>
            ))}
          </ul>
          <p className="mt-4 px-4 text-[12px] font-semibold uppercase tracking-[.14em] text-ink-3">{t("sort")}</p>
          <ul className="rail mt-2">
            {sorts.map((s) => (
              <li key={s.label}><Link href={qs({ orden: s.key })} aria-current={search.orden === s.key || (!search.orden && !s.key) ? "true" : undefined} className={chip(search.orden === s.key || (!search.orden && !s.key))}>{s.label}</Link></li>
            ))}
          </ul>
        </nav>

        {products.length === 0 ? (
          <div className="mx-4 mt-8 flex flex-col items-center rounded-[4px] border border-line bg-surface px-6 py-12 text-center">
            <div className="filete-doble grid size-24 place-items-center rounded-full bg-cream"><ProductImage image={{ url: null, illustration: "clover", alt: "" }} className="size-16 rounded-full" /></div>
            <h2 className="mt-6 font-display text-[20px]">{t("emptyTitle")}</h2>
            <p className="mt-2 max-w-xs text-[15px] text-ink-2">{t("emptyBody")}</p>
            <div className="mt-6 flex flex-col gap-2">
              {(search.filtro || search.orden) && <Link href={basePath} className="press flex h-12 items-center justify-center rounded-full border border-ink px-6 text-[15px] font-semibold">{t("clearFilters")}</Link>}
              <Link href="/tienda" className="press flex h-12 items-center justify-center rounded-full bg-ink px-6 text-[15px] font-semibold text-on-dark">{t("emptyCta")}</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 px-4 pb-16 pt-6 md:grid-cols-4 md:gap-x-6">
            {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 2} />)}
          </div>
        )}
      </div>
    </>
  );
}
