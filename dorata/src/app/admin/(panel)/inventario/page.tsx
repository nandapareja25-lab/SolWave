import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { PageHeader, inputCls } from "@/components/admin/ui";
import { StockRow } from "@/components/admin/StockRow";
import { AutoSubmitSelect } from "@/components/admin/AutoSubmitSelect";
import { CountUp } from "@/components/admin/CountUp";
import { formatInZone } from "@/lib/tz";

export const metadata = { title: "Inventario" };
/** El motivo solo se muestra si agrega información (no repite el tipo ni el texto automático). */
const AUTO_REASONS = ["Llegó mercancía", "Devolución en buen estado", "Unidades iniciales al crear la variante", "Se deshizo el ajuste anterior"];
const UNDO_REASON = "Se deshizo el ajuste anterior";
const extra = (type: string, reason: string | null) => (!reason || AUTO_REASONS.includes(reason) || reason === TYPE[type] ? "" : ` · ${reason}`);
const TYPE: Record<string, string> = {
  initial_count: "Unidades iniciales", sale: "Venta", adjustment: "Dañadas o perdidas", restock: "Llegó mercancía", return: "Devolución",
  cancellation: "Pedido cancelado", manual_correction: "Corrección de conteo", warranty_replacement: "Reposición por garantía",
};
type Sp = { q?: string; sku?: string; ver?: string; categoria?: string; p?: string };
const PAGE = 20;

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const { sb } = await requireAdmin("staff");
  const [{ data: rows }, { data: prods }, { data: moves }, { data: s }] = await Promise.all([
    sb.from("v_inventory_status").select("variant_id,product_id,sku,variant_title,on_hand,reserved,available,low_stock_threshold,is_low"),
    sb.from("products").select("id,status,primary_category_id,product_translations(locale,name)").neq("status", "archived"),
    sb.from("inventory_movements").select("id,type,quantity_delta,on_hand_after,reason,created_at,variant_id").order("created_at", { ascending: false }).limit(25),
    sb.from("store_settings").select("timezone").eq("id", 1).single(),
  ]);
  const { data: cats } = await sb.from("categories").select("id,auto_rule,category_translations(locale,name)").is("auto_rule", null).order("sort_order");
  const catOf = new Map((prods ?? []).map((p) => [p.id, p.primary_category_id as string]));
  const tz = s?.timezone ?? "America/New_York";
  const pname = new Map((prods ?? []).map((p) => [p.id, (p.product_translations as { locale: string; name: string }[]).find((t) => t.locale === "es")?.name ?? ""]));
  const q = (sp.q ?? sp.sku ?? "").trim().toLowerCase();
  const all = (rows ?? []).filter((r) => pname.has(r.product_id)).map((r) => ({
    variantId: r.variant_id as string, productId: r.product_id as string, product: pname.get(r.product_id) ?? "", sku: r.sku as string, title: r.variant_title as string,
    onHand: r.on_hand as number, reserved: r.reserved as number, available: r.available as number, low: !!r.is_low, threshold: r.low_stock_threshold as number,
  })).sort((a, b) => a.product.localeCompare(b.product) || a.title.localeCompare(b.title));
  const list = all.filter((r) => (!q || r.product.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q)) &&
    (sp.ver !== "pocas" || (r.low && r.available > 0)) && (sp.ver !== "agotado" || r.available === 0) && (!sp.categoria || catOf.get(r.productId) === sp.categoria));
  const groups = [...new Set(list.map((r) => r.productId))];
  const pages = Math.max(1, Math.ceil(groups.length / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.p) || 1));
  const shown = groups.slice((page - 1) * PAGE, page * PAGE);
  const link = (patch: Partial<Sp>) => {
    const qs = new URLSearchParams(Object.entries({ q: sp.q ?? sp.sku, ver: sp.ver, categoria: sp.categoria, p: sp.p, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/inventario${qs.size ? `?${qs}` : ""}`;
  };
  const pageHref = (n: number) => link({ p: n > 1 ? String(n) : undefined });
  const out = all.filter((r) => r.available === 0).length, low = all.filter((r) => r.low && r.available > 0).length;
  const units = all.reduce((n, r) => n + r.onHand, 0);
  const label = new Map(all.map((r) => [r.variantId, r.title === "Única" ? r.product : `${r.product} · ${r.title}`]));
  const chip = (v: string | undefined, text: string) => (
    <Link href={link({ ver: v, p: undefined })} aria-current={sp.ver === v ? "page" : undefined}
      className={`press inline-flex h-9 items-center rounded-full border px-3 text-[13px] ${sp.ver === v ? "border-ink bg-ink font-semibold text-on-dark" : "border-line bg-surface"}`}>{text}</Link>
  );

  return (
    <div>
      <PageHeader title="Inventario" description="Las ventas descuentan solas. Aquí registras lo que llega, los conteos y las piezas dañadas." />
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[{ n: units, l: units === 1 ? "pieza en total" : "piezas en total", href: "/admin/inventario" },
          { n: low, l: "con pocas unidades", c: low ? "text-gold-deep" : "", href: "/admin/inventario?ver=pocas" },
          { n: out, l: "agotadas", c: out ? "text-danger" : "", href: "/admin/inventario?ver=agotado" }].map((k, i) => (
          <Link key={k.l} href={k.href} className={`rise press rounded-[4px] border border-line bg-surface p-3 hover:border-ink-3 ${i === 0 ? "filete-doble" : ""}`} style={{ animationDelay: `${i * 60}ms` }}>
            <p className={`font-display text-[32px] leading-none tabular ${k.c ?? ""}`}><CountUp value={k.n} /></p>
            <p className="mt-1 text-[12px] leading-tight text-ink-2">{k.l}</p>
          </Link>
        ))}
      </div>
      <p className="-mt-3 mb-4 text-[13px]"><a href="#movimientos" className="underline underline-offset-4">Ver últimos movimientos</a></p>
      <form role="search" className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px]">
        {sp.ver && <input type="hidden" name="ver" value={sp.ver} />}
        <label className="relative block">
          <span className="sr-only">Buscar por producto o código</span>
          <Search aria-hidden="true" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input name="q" type="search" defaultValue={sp.q ?? sp.sku ?? ""} placeholder="Buscar por producto o código" className={`${inputCls} pl-9`} />
        </label>
        <AutoSubmitSelect name="categoria" defaultValue={sp.categoria ?? ""} aria-label="Categoría" className={inputCls}>
          <option value="">Todas las categorías</option>
          {(cats ?? []).map((c) => <option key={c.id} value={c.id}>{(c.category_translations as { locale: string; name: string }[]).find((t) => t.locale === "es")?.name}</option>)}
        </AutoSubmitSelect>
      </form>
      <div className="mb-4 flex flex-wrap gap-2">{chip(undefined, "Todo")}{chip("pocas", `Quedan pocas (${low})`)}{chip("agotado", `Agotadas (${out})`)}</div>

      {all.length === 0 ? (
        <div className="filete-doble rounded-[4px] border border-line bg-surface p-6 text-center">
          <p className="font-display text-[22px]">Aún no hay piezas en inventario</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-ink-2">Cuando crees un producto e indiques cuántas unidades tienes, aparecerá aquí.</p>
          <Link href="/admin/productos/nuevo" className="press mt-4 inline-flex h-11 items-center rounded-full bg-ink px-5 text-[14px] font-semibold text-on-dark">Crear un producto</Link>
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-[4px] border border-line bg-surface p-6 text-[15px]">Nada coincide con este filtro. <Link href="/admin/inventario" className="underline underline-offset-4">Ver todo</Link></p>
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {shown.map((pid, gi) => {
            const rows = list.filter((r) => r.productId === pid);
            return (
              <li key={pid} className="rise min-w-0 rounded-[4px] border border-line bg-surface" style={{ animationDelay: `${Math.min(gi, 8) * 50}ms` }}>
                <Link href={`/admin/productos/${pid}`} className="flex min-h-12 items-center justify-between gap-2 border-b border-line px-3 text-[15px] font-semibold underline-offset-4 hover:underline">
                  <span className="line-clamp-2 py-2 leading-snug">{rows[0]!.product}</span>
                  {rows.length > 1 && <span className="shrink-0 text-[12px] font-normal text-ink-3">{rows.length} variantes</span>}
                </Link>
                <ul className="divide-y divide-line">{rows.map((r) => <StockRow key={r.variantId} r={r} single={rows.length === 1 && r.title === "Única"} />)}</ul>
              </li>
            );
          })}
        </ul>
      )}
      {pages > 1 && (
        <nav aria-label="Páginas" className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[14px]">
          {page > 1 ? <Link href={pageHref(page - 1)} className="press inline-flex h-11 items-center justify-self-start rounded-full border border-line bg-surface px-4">← Anteriores</Link> : <span />}
          <span className="text-center text-ink-2 tabular">Página {page} de {pages} · {groups.length} {groups.length === 1 ? "producto" : "productos"}</span>
          {page < pages ? <Link href={pageHref(page + 1)} className="press inline-flex h-11 items-center justify-self-end rounded-full border border-line bg-surface px-4">Siguientes →</Link> : <span />}
        </nav>
      )}

      {(moves ?? []).length > 0 && (
        <section id="movimientos" className="mt-8 scroll-mt-20">
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[.14em] text-ink-2">Últimos movimientos</h2>
          {(() => {
            const items = (moves ?? []).filter((m) => label.has(m.variant_id));
            const Row = (m: (typeof items)[number]) => (
              <li key={m.id} className="flex items-start gap-3 p-3 text-[14px]">
                <span className={`w-9 shrink-0 font-semibold tabular ${m.quantity_delta > 0 ? "text-success" : "text-danger"}`}>{m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{label.get(m.variant_id)}</span>
                  <span className="block text-[13px] text-ink-2">{m.reason === UNDO_REASON ? "Ajuste deshecho" : TYPE[m.type] ?? m.type}{extra(m.type, m.reason)} · {m.on_hand_after === 1 ? "queda 1" : `quedan ${m.on_hand_after}`}</span>
                  <span className="block text-[12px] text-ink-3">{formatInZone(m.created_at, tz)}</span>
                </span>
              </li>
            );
            return (
              <>
                <ol className="divide-y divide-line rounded-[4px] border border-line bg-surface">{items.slice(0, 5).map(Row)}</ol>
                {items.length > 5 && (
                  <details className="group mt-2">
                    <summary className="press inline-flex h-11 cursor-pointer list-none items-center rounded-full border border-line bg-surface px-4 text-[14px] [&::-webkit-details-marker]:hidden">
                      <span className="group-open:hidden">Ver los {items.length} últimos</span><span className="hidden group-open:inline">Ver menos</span>
                    </summary>
                    <ol className="mt-2 divide-y divide-line rounded-[4px] border border-line bg-surface">{items.slice(5).map(Row)}</ol>
                  </details>
                )}
              </>
            );
          })()}
        </section>
      )}
    </div>
  );
}
