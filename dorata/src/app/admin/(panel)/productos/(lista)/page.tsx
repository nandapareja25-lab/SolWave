import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { PageHeader, btnPrimary, inputCls } from "@/components/admin/ui";
import { AutoSubmitSelect } from "@/components/admin/AutoSubmitSelect";
import { formatUSD } from "@/lib/money";

export const metadata = { title: "Productos" };

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Activo", cls: "bg-success/10 text-success" },
  draft: { label: "Borrador", cls: "bg-gold/15 text-gold-deep" },
  archived: { label: "Archivado", cls: "bg-line/60 text-ink-2" },
};
type Sp = { q?: string; estado?: string; categoria?: string; stock?: string; tipo?: string; p?: string };
const PAGE = 20;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const { sb } = await requireAdmin("staff");
  const [{ data: rows }, { data: cats }, { data: stock }] = await Promise.all([
    sb.from("products").select("id,status,primary_category_id,updated_at,tags,kit_role,set_pendant_product_id,product_translations(locale,name,slug),product_variants(id,sku,title,price_cents,is_active),product_media(variants,position)").order("updated_at", { ascending: false }),
    sb.from("categories").select("id,auto_rule,category_translations(locale,name)").order("sort_order"),
    sb.from("v_inventory_status").select("variant_id,product_id,available,is_low"),
  ]);
  const catName = new Map((cats ?? []).map((c) => [c.id, (c.category_translations as { locale: string; name: string }[]).find((t) => t.locale === "es")?.name ?? ""]));
  const stockByVariant = new Map((stock ?? []).map((s) => [s.variant_id as string, { available: (s.available ?? 0) as number, low: !!s.is_low }]));
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const q = (sp.q ?? "").trim().toLowerCase();
  const all = (rows ?? []).map((p) => {
    const t = (p.product_translations as { locale: string; name: string; slug: string }[]).find((x) => x.locale === "es");
    const vs = (p.product_variants as { id: string; sku: string; title: string; price_cents: number; is_active: boolean }[]).filter((v) => v.is_active);
    const prices = vs.map((v) => v.price_cents);
    const media = (p.product_media as { variants: Record<string, string>; position: number }[]).sort((a, b) => a.position - b.position)[0];
    const vstock = vs.map((v) => ({ title: v.title, ...(stockByVariant.get(v.id) ?? { available: 0, low: false }) }));
    const available = vstock.reduce((n, v) => n + v.available, 0);
    const lowOnes = vstock.filter((v) => v.low && v.available > 0);
    const outOnes = vstock.filter((v) => v.available === 0);
    return {
      id: p.id, status: p.status as string, name: t?.name ?? "(sin nombre)", category: catName.get(p.primary_category_id) ?? "", categoryId: p.primary_category_id,
      skus: vs.map((v) => v.sku).join(" "), variants: vs.length,
      price: !prices.length || Math.max(...prices) === 0 ? "Sin precio" : Math.min(...prices) === Math.max(...prices) ? formatUSD(prices[0]!) : `${formatUSD(Math.min(...prices))} – ${formatUSD(Math.max(...prices))}`,
      noPrice: !prices.length || Math.max(...prices) === 0,
      flag: p.kit_role === "set_base" && !p.set_pendant_product_id ? "Falta dije" : p.kit_role === "set_component" ? "Dije para set" : ((p.tags ?? []) as string[]).includes("revisar") ? "Revisar" : null,
      kit: p.kit_role as string | null, review: ((p.tags ?? []) as string[]).includes("revisar"), hasPendant: !!p.set_pendant_product_id,
      thumb: media && base ? `${base}/storage/v1/object/public/product-media/${media.variants["400"] ?? Object.values(media.variants)[0]}` : null,
      available, low: lowOnes.length > 0,
      stockNote: available === 0 ? "Agotado" : `${available} disponibles`,
      stockAlert: available === 0 ? null : [...lowOnes.map((v) => vs.length > 1 ? `${v.title}: quedan ${v.available}` : `Quedan ${v.available}`), ...(vs.length > 1 ? outOnes.map((v) => `${v.title}: agotada`) : [])].join(" · ") || null,
    };
  });
  const list = all.filter((p) =>
    (!q || p.name.toLowerCase().includes(q) || p.skus.toLowerCase().includes(q)) &&
    (!sp.estado || p.status === sp.estado) && (!sp.categoria || p.categoryId === sp.categoria) &&
    (sp.stock !== "agotado" || p.available === 0) && (sp.stock !== "pocas" || (p.low && p.available > 0)) &&
    (sp.tipo !== "sets" || (p.kit === "set_base" && !p.hasPendant)) && (sp.tipo !== "dijes" || p.kit === "set_component") &&
    (sp.tipo !== "revisar" || p.review) && (sp.tipo !== "sinprecio" || (p.noPrice && p.kit !== "set_component")));
  const filtered = !!(q || sp.estado || sp.categoria || sp.stock || sp.tipo);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.p) || 1));
  const shown = list.slice((page - 1) * PAGE, page * PAGE);
  const counts = { active: all.filter((p) => p.status === "active").length, draft: all.filter((p) => p.status === "draft").length };
  const href = (patch: Partial<Sp>) => {
    // Cambiar un filtro vuelve a la página 1
    const qs = new URLSearchParams(Object.entries({ q: sp.q, categoria: sp.categoria, estado: sp.estado, stock: sp.stock, tipo: sp.tipo, p: undefined, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/productos${qs.size ? `?${qs}` : ""}`;
  };
  const chip = (patch: Partial<Sp>, text: string, on: boolean) => (
    <Link href={href(patch)} aria-current={on ? "page" : undefined}
      className={`press inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3 text-[13px] ${on ? "border-ink bg-ink font-semibold text-on-dark" : "border-line bg-surface"}`}>{text}</Link>
  );

  return (
    <div>
      <PageHeader title="Productos" description={`${counts.active} activos · ${counts.draft} en borrador`}
        actions={<Link href="/admin/productos/nuevo" className={`${btnPrimary} w-full sm:w-auto`}><Plus aria-hidden="true" size={16} />Nuevo producto</Link>} />
      <form className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px]" role="search">
        {sp.estado && <input type="hidden" name="estado" value={sp.estado} />}
        {sp.stock && <input type="hidden" name="stock" value={sp.stock} />}
        <label className="relative">
          <span className="sr-only">Buscar por nombre o código</span>
          <Search aria-hidden="true" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input name="q" type="search" defaultValue={sp.q ?? ""} placeholder="Buscar por nombre o código" className={`${inputCls} pl-9`} />
        </label>
        <AutoSubmitSelect name="categoria" defaultValue={sp.categoria ?? ""} aria-label="Categoría" className={inputCls}>
          <option value="">Todas las categorías</option>
          {(cats ?? []).filter((c) => !c.auto_rule).map((c) => <option key={c.id} value={c.id}>{catName.get(c.id)}</option>)}
        </AutoSubmitSelect>
      </form>
      <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" aria-label="Filtros">
        {chip({ estado: undefined, stock: undefined, tipo: undefined }, `Todos (${all.length})`, !sp.estado && !sp.stock && !sp.tipo)}
        {chip({ estado: "active", stock: undefined }, `Activos (${counts.active})`, sp.estado === "active")}
        {chip({ estado: "draft", stock: undefined }, `Borradores (${counts.draft})`, sp.estado === "draft")}
        {chip({ estado: undefined, stock: "pocas" }, `Quedan pocas (${all.filter((p) => p.low && p.available > 0).length})`, sp.stock === "pocas")}
        {chip({ estado: undefined, stock: "agotado" }, `Agotados (${all.filter((p) => p.available === 0).length})`, sp.stock === "agotado")}
      </div>
      {(all.some((p) => p.kit) || all.some((p) => p.review)) && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" aria-label="Por completar">
          {chip({ tipo: sp.tipo === "sinprecio" ? undefined : "sinprecio" }, `Sin precio (${all.filter((p) => p.noPrice && p.kit !== "set_component").length})`, sp.tipo === "sinprecio")}
          {chip({ tipo: sp.tipo === "sets" ? undefined : "sets" }, `Sets sin dije (${all.filter((p) => p.kit === "set_base" && !p.hasPendant).length})`, sp.tipo === "sets")}
          {chip({ tipo: sp.tipo === "dijes" ? undefined : "dijes" }, `Dijes para sets (${all.filter((p) => p.kit === "set_component").length})`, sp.tipo === "dijes")}
          {chip({ tipo: sp.tipo === "revisar" ? undefined : "revisar" }, `Por revisar (${all.filter((p) => p.review).length})`, sp.tipo === "revisar")}
        </div>
      )}
      {filtered && <p className="mb-3 text-[14px] text-ink-2">{list.length} de {all.length} productos · <Link href="/admin/productos" className="underline underline-offset-4">Quitar filtros</Link></p>}

      {all.length === 0 ? (
        <div className="filete-doble rounded-[4px] border border-line bg-surface p-6 text-center">
          <p className="font-display text-[22px]">Tu catálogo empieza aquí</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-ink-2">Crea tu primer producto con su precio, variantes y fotos. Puedes dejarlo en borrador hasta que esté listo.</p>
          <Link href="/admin/productos/nuevo" className={`${btnPrimary} mt-4`}><Plus aria-hidden="true" size={16} />Crear el primer producto</Link>
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-[4px] border border-line bg-surface p-6 text-[15px]">Ningún producto coincide con la búsqueda. <Link href="/admin/productos" className="underline underline-offset-4">Ver todos</Link></p>
      ) : (
        <ul className="divide-y divide-line rounded-[4px] border border-line bg-surface">
          {shown.map((p, i) => (
            <li key={p.id} className="rise" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
              <Link href={`/admin/productos/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-ivory">
                <div className="grid size-[72px] shrink-0 place-items-center overflow-hidden rounded-[4px] border border-gold/40 bg-cream p-[2px]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel */}
                  {p.thumb ? <img src={p.thumb} alt="" width={72} height={72} className="size-full rounded-[2px] object-cover" /> : <span className="text-[11px] text-ink-3">Sin foto</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[15px] font-semibold leading-snug">{p.name}</p>
                  {p.flag && <span className={`mt-0.5 inline-block rounded-[4px] px-1.5 text-[11px] font-semibold ${p.flag === "Dije para set" ? "bg-line/60 text-ink-2" : "bg-gold/15 text-gold-deep"}`}>{p.flag}</span>}
                  <p className="truncate text-[13px] text-ink-2">{p.category} · {p.variants} {p.variants === 1 ? "variante" : "variantes"}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px]">
                    <span className={`tabular font-semibold ${p.noPrice ? "text-gold-deep" : ""}`}>{p.price}</span>
                    <span className={p.available === 0 ? "text-danger" : "text-ink-2"}>{p.stockNote}</span>
                  </p>
                  {p.stockAlert && <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-gold-deep"><span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-gold" />{p.stockAlert}</p>}
                </div>
                {p.status !== "draft" && <span className={`shrink-0 self-start rounded-[4px] px-2 py-1 text-[12px] font-semibold ${STATUS[p.status]?.cls}`}>{STATUS[p.status]?.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav aria-label="Páginas" className="mt-4 flex items-center justify-between gap-3 text-[14px]">
          {page > 1 ? <Link href={href({ p: page > 2 ? String(page - 1) : undefined })} className="press inline-flex h-11 items-center rounded-full border border-line bg-surface px-4">← Anteriores</Link> : <span />}
          <span className="text-ink-2 tabular">Página {page} de {pages}</span>
          {page < pages ? <Link href={href({ p: String(page + 1) })} className="press inline-flex h-11 items-center rounded-full border border-line bg-surface px-4">Siguientes →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
