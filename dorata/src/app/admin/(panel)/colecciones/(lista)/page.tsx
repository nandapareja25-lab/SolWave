import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { PageHeader, btnPrimary } from "@/components/admin/ui";
import { formatInZone } from "@/lib/tz";

export const metadata = { title: "Colecciones" };

export default async function CollectionsPage() {
  const { sb } = await requireAdmin("staff");
  const [{ data: rows }, { data: s }] = await Promise.all([
    sb.from("collections").select("id,image_path,is_visible,is_set,starts_at,ends_at,collection_translations(locale,name,slug),product_collections(product_id)").order("sort_order"),
    sb.from("store_settings").select("timezone").eq("id", 1).single(),
  ]);
  const tz = s?.timezone ?? "America/New_York";
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const now = Date.now();
  const list = (rows ?? []).map((c) => {
    const t = (c.collection_translations as { locale: string; name: string; slug: string }[]).find((x) => x.locale === "es");
    const n = (c.product_collections as unknown[]).length;
    const future = c.starts_at && Date.parse(c.starts_at) > now, past = c.ends_at && Date.parse(c.ends_at) <= now;
    return { id: c.id, name: t?.name ?? "(sin nombre)", slug: t?.slug ?? "", n, isSet: c.is_set,
      state: !c.is_visible ? "Oculta" : future ? `Empieza ${formatInZone(c.starts_at!, tz)}` : past ? "Terminada" : "Visible",
      on: c.is_visible && !future && !past,
      image: c.image_path && base ? `${base}/storage/v1/object/public/category-media/${c.image_path}` : null };
  });
  return (
    <div>
      <PageHeader title="Colecciones" description="Agrupa piezas por tema (Navidad, Día de la Madre, Sets…) además de su categoría. Los productos se agregan desde su ficha."
        actions={list.length ? <Link href="/admin/colecciones/nueva" className={`${btnPrimary} w-full sm:w-auto`}><Plus aria-hidden="true" size={16} />Nueva colección</Link> : undefined} />
      {list.length === 0 ? (
        <div className="filete-doble rounded-[4px] border border-line bg-surface p-6 text-center">
          <p className="font-display text-[22px]">Aún no tienes colecciones</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-ink-2">Son opcionales. Úsalas para campañas o temas, por ejemplo “Día de la Madre” o “Navidad”: cada una tiene su propia página en la tienda.</p>
          <Link href="/admin/colecciones/nueva" className={`${btnPrimary} mt-4`}><Plus aria-hidden="true" size={16} />Crear la primera colección</Link>
        </div>
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {list.map((c, i) => (
            <li key={c.id} className="rise min-w-0" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
              <Link href={`/admin/colecciones/${c.id}`} className="flex items-center gap-3 rounded-[4px] border border-line bg-surface p-3 hover:bg-ivory">
                <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[4px] border border-gold/40 bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel */}
                  {c.image ? <img src={c.image} alt="" width={56} height={56} className="size-full object-cover" /> : <span className="font-display text-[20px] text-gold-deep">{c.name[0]}</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold">{c.name}</span>
                  <span className="block truncate text-[13px] text-ink-2">{c.n} {c.n === 1 ? "producto" : "productos"}{c.isSet ? " · set" : ""} · /colecciones/{c.slug}</span>
                </span>
                <span className={`shrink-0 rounded-[4px] px-2 py-1 text-[12px] font-semibold ${c.on ? "bg-success/10 text-success" : "bg-line/60 text-ink-2"}`}>{c.state}</span>
                <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-ink-3" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
