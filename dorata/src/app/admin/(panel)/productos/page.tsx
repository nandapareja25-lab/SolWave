import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { PageHeader, btnPrimary, inputCls } from "@/components/admin/ui";
import { formatUSD } from "@/lib/money";

export const metadata = { title: "Productos" };

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Activo", cls: "bg-success/10 text-success" },
  draft: { label: "Borrador", cls: "bg-gold/15 text-gold-deep" },
  archived: { label: "Archivado", cls: "bg-line/60 text-ink-2" },
};
type Sp = { q?: string; estado?: string; categoria?: string; stock?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const { sb } = await requireAdmin("staff");
  const [{ data: rows }, { data: cats }, { data: stock }] = await Promise.all([
    sb.from("products").select("id,status,primary_category_id,updated_at,product_translations(locale,name,slug),product_variants(id,sku,price_cents,is_active),product_media(variants,position)").order("updated_at", { ascending: false }),
    sb.from("categories").select("id,auto_rule,category_translations(locale,name)").order("sort_order"),
    sb.from("v_inventory_status").select("variant_id,product_id,available,is_low"),
  ]);
  const catName = new Map((cats ?? []).map((c) => [c.id, (c.category_translations as { locale: string; name: string }[]).find((t) => t.locale === "es")?.name ?? ""]));
  const stockBy = new Map<string, { available: number; low: boolean }>();
  for (const s of stock ?? []) {
    const cur = stockBy.get(s.product_id) ?? { available: 0, low: false };
    stockBy.set(s.product_id, { available: cur.available + (s.available ?? 0), low: cur.low || !!s.is_low });
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const q = (sp.q ?? "").trim().toLowerCase();
  const all = (rows ?? []).map((p) => {
    const t = (p.product_translations as { locale: string; name: string; slug: string }[]).find((x) => x.locale === "es");
    const vs = (p.product_variants as { sku: string; price_cents: number; is_active: boolean }[]).filter((v) => v.is_active);
    const prices = vs.map((v) => v.price_cents);
    const media = (p.product_media as { variants: Record<string, string>; position: number }[]).sort((a, b) => a.position - b.position)[0];
    const s = stockBy.get(p.id) ?? { available: 0, low: false };
    return {
      id: p.id, status: p.status as string, name: t?.name ?? "(sin nombre)", category: catName.get(p.primary_category_id) ?? "", categoryId: p.primary_category_id,
      skus: vs.map((v) => v.sku).join(" "), variants: vs.length,
      price: prices.length ? (Math.min(...prices) === Math.max(...prices) ? formatUSD(prices[0]!) : `${formatUSD(Math.min(...prices))} – ${formatUSD(Math.max(...prices))}`) : "—",
      thumb: media && base ? `${base}/storage/v1/object/public/product-media/${media.variants["400"] ?? Object.values(media.variants)[0]}` : null,
      available: s.available, low: s.low,
    };
  });
  const list = all.filter((p) =>
    (!q || p.name.toLowerCase().includes(q) || p.skus.toLowerCase().includes(q)) &&
    (!sp.estado || p.status === sp.estado) && (!sp.categoria || p.categoryId === sp.categoria) &&
    (sp.stock !== "agotado" || p.available === 0) && (sp.stock !== "pocas" || (p.low && p.available > 0)));
  const filtered = !!(q || sp.estado || sp.categoria || sp.stock);
  const counts = { active: all.filter((p) => p.status === "active").length, draft: all.filter((p) => p.status === "draft").length };

  return (
    <div>
      <PageHeader title="Productos" description={`${counts.active} activos · ${counts.draft} en borrador`}
        actions={<Link href="/admin/productos/nuevo" className={btnPrimary}><Plus aria-hidden="true" size={16} />Nuevo producto</Link>} />
      <form className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_repeat(3,auto)_auto]" role="search">
        <label className="relative">
          <span className="sr-only">Buscar por nombre o código</span>
          <Search aria-hidden="true" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar por nombre o código" className={`${inputCls} pl-9`} />
        </label>
        <select name="estado" defaultValue={sp.estado ?? ""} aria-label="Estado" className={inputCls}>
          <option value="">Todos los estados</option><option value="active">Activos</option><option value="draft">Borradores</option><option value="archived">Archivados</option>
        </select>
        <select name="categoria" defaultValue={sp.categoria ?? ""} aria-label="Categoría" className={inputCls}>
          <option value="">Todas las categorías</option>
          {(cats ?? []).filter((c) => !c.auto_rule).map((c) => <option key={c.id} value={c.id}>{catName.get(c.id)}</option>)}
        </select>
        <select name="stock" defaultValue={sp.stock ?? ""} aria-label="Stock" className={inputCls}>
          <option value="">Cualquier stock</option><option value="pocas">Quedan pocas</option><option value="agotado">Agotados</option>
        </select>
        <button type="submit" className="press h-11 rounded-full border border-ink px-5 text-[14px] font-semibold">Filtrar</button>
      </form>
      {filtered && <p className="mb-3 text-[14px] text-ink-2">{list.length} de {all.length} productos · <Link href="/admin/productos" className="underline underline-offset-4">Quitar filtros</Link></p>}

      {all.length === 0 ? (
        <div className="filete-doble rounded-[4px] border border-line bg-surface p-6 text-center">
          <p className="font-display text-[22px]">Tu catálogo empieza aquí</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-ink-2">Crea tu primer producto con su precio, variantes y fotos. Puedes dejarlo en borrador hasta que esté listo.</p>
          <Link href="/admin/productos/nuevo" className={`${btnPrimary} mt-4`}><Plus aria-hidden="true" size={16} />Crear el primer producto</Link>
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-[4px] border border-line bg-surface p-6 text-[15px]">Ningún producto coincide con la búsqueda.</p>
      ) : (
        <ul className="divide-y divide-line rounded-[4px] border border-line bg-surface">
          {list.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/productos/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-ivory">
                <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[4px] border border-line bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel */}
                  {p.thumb ? <img src={p.thumb} alt="" width={64} height={64} className="size-full object-cover" /> : <span className="text-[11px] text-ink-3">Sin foto</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{p.name}</p>
                  <p className="truncate text-[13px] text-ink-2">{p.category} · {p.variants} {p.variants === 1 ? "variante" : "variantes"}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px]">
                    <span className="tabular font-semibold">{p.price}</span>
                    <span className={p.available === 0 ? "text-danger" : p.low ? "text-gold-deep" : "text-ink-2"}>
                      {p.available === 0 ? "Agotado" : `${p.available} disponibles${p.low ? " · quedan pocas" : ""}`}
                    </span>
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold ${STATUS[p.status]?.cls}`}>{STATUS[p.status]?.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
