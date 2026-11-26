import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/server/admin/auth";
import { CampaignEditor } from "@/components/admin/CampaignEditor";
import type { CampaignInput } from "../actions";
import { utcToWallTime } from "@/lib/tz";

export const metadata = { title: "Campaña de la barra de anuncios" };

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireAdmin("admin");
  const { data: settings } = await sb.from("store_settings").select("timezone").eq("id", 1).single();
  const defaultTz = settings?.timezone ?? "America/New_York";
  const { data: cats } = await sb.from("categories").select("category_translations(locale,name,slug)").eq("is_visible", true).order("sort_order");
  const pages = [
    { path: "/", label: "Portada" }, { path: "/tienda", label: "Toda la tienda" },
    ...(cats ?? []).flatMap((c) => (c.category_translations as { locale: string; name: string; slug: string }[]).filter((t) => t.locale === "es").map((t) => ({ path: `/${t.slug}`, label: t.name }))),
  ];

  let initial: CampaignInput;
  if (id === "nueva") {
    initial = {
      id: "", internal_name: "", is_active: false, priority: 10, timezone: defaultTz,
      starts_at: utcToWallTime(new Date().toISOString(), defaultTz), ends_at: "",
      style: "black", bg_color: "", text_color: "", motion: "static", marquee_speed: 40, rotate_interval_seconds: 5, repeat: true,
      link_url: "", link_label: "", messages: [{ text: "", link_url: "", link_label: "" }],
      countdown_enabled: false, countdown_target_at: "", countdown_text: "", countdown_end_behavior: "hide",
      after_text: "", after_link_url: "", after_link_label: "",
    };
  } else {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const { data: c } = await sb.from("announcement_campaigns")
      .select("*, announcement_campaign_translations(*), announcement_messages(id,position,link_url,announcement_message_translations(locale,text,link_label))")
      .eq("id", id).maybeSingle();
    if (!c) notFound();
    const tz = c.timezone as string;
    const tr = ((c.announcement_campaign_translations ?? []) as { locale: string; countdown_text: string | null; after_text: string | null; after_link_label: string | null }[]).find((t) => t.locale === "es");
    const msgs = ((c.announcement_messages ?? []) as { position: number; link_url: string | null; announcement_message_translations: { locale: string; text: string; link_label: string | null }[] }[])
      .sort((a, b) => a.position - b.position)
      .map((m) => { const t = m.announcement_message_translations.find((x) => x.locale === "es"); return { text: t?.text ?? "", link_url: m.link_url ?? "", link_label: t?.link_label ?? "" }; });
    initial = {
      id: c.id, internal_name: c.internal_name, is_active: c.is_active, priority: c.priority, timezone: tz,
      starts_at: utcToWallTime(c.starts_at, tz), ends_at: utcToWallTime(c.ends_at, tz),
      style: c.style, bg_color: c.bg_color ?? "", text_color: c.text_color ?? "", motion: c.motion,
      marquee_speed: c.marquee_speed, rotate_interval_seconds: c.rotate_interval_seconds, repeat: c.repeat,
      link_url: c.link_url ?? "", link_label: (c.link_label as Record<string, string>)?.es ?? "",
      messages: msgs.length ? msgs : [{ text: "", link_url: "", link_label: "" }],
      countdown_enabled: c.countdown_enabled, countdown_target_at: utcToWallTime(c.countdown_target_at, tz),
      countdown_text: tr?.countdown_text ?? "", countdown_end_behavior: c.countdown_end_behavior,
      after_text: tr?.after_text ?? "", after_link_url: c.after_link_url ?? "", after_link_label: tr?.after_link_label ?? "",
    };
  }

  return (
    <div>
      <Link href="/admin/configuracion/banner" className="mb-4 inline-flex h-10 items-center gap-2 text-[14px] text-ink-2"><ArrowLeft aria-hidden="true" size={16} />Todas las campañas</Link>
      <CampaignEditor initial={initial} pages={pages} />
    </div>
  );
}
