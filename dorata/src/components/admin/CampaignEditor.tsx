"use client";

import { useMemo, useState, useTransition } from "react";
import { DateTimeField } from "./DateTimeField";
import { useUnsavedGuard } from "./useUnsavedGuard";
import { useRouter } from "next/navigation";
import { Check, Clock, Loader2, Monitor, Plus, Smartphone, Trash2 } from "lucide-react";
import { AnnouncementBar } from "@/components/tienda/AnnouncementBar";
import { contrastRatio, type Announcement } from "@/lib/announcement";
import { BUSINESS_TIMEZONES, tzLabel, wallTimeToUtc } from "@/lib/tz";
import { saveCampaign, type CampaignInput } from "@/app/admin/(panel)/configuracion/banner/actions";
import { Card, SaveBar, StatusText, btnPrimary, helpCls, inputCls, labelCls } from "./ui";

const STYLES = [
  { value: "black", label: "Terciopelo oscuro" }, { value: "gold", label: "Dorado" },
  { value: "cream", label: "Crema" }, { value: "white", label: "Blanco" }, { value: "custom", label: "Colores propios" },
] as const;
const PRIORITIES = [
  { value: 0, label: "Baja (solo si no hay otra)" }, { value: 10, label: "Normal" },
  { value: 50, label: "Alta (tapa a las normales)" }, { value: 100, label: "Máxima (tapa a todas)" },
];
export type StorePage = { path: string; label: string };

/** Enlace: elegir una página de la tienda (o pegar un enlace https:// externo). */
function LinkFields({ url, label, onUrl, onLabel, pages, idPrefix, labelPlaceholder = "Ej: Ver sets" }: {
  url: string; label: string; onUrl: (v: string) => void; onLabel: (v: string) => void; pages: StorePage[]; idPrefix: string; labelPlaceholder?: string;
}) {
  const known = pages.some((p) => p.path === url);
  const [custom, setCustom] = useState(!!url && !known);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className={labelCls}>Al tocarlo lleva a (opcional)
        <select aria-label={`${idPrefix}: página`} value={custom ? "__custom" : url} onChange={(e) => { if (e.target.value === "__custom") { setCustom(true); onUrl(""); } else { setCustom(false); onUrl(e.target.value); } }} className={inputCls}>
          <option value="">No lleva a ninguna página</option>
          {pages.map((p) => <option key={p.path} value={p.path}>{p.label}</option>)}
          <option value="__custom">Otro enlace (https://…)</option>
        </select>
        {custom && <input aria-label={`${idPrefix}: enlace externo`} value={url} onChange={(e) => onUrl(e.target.value)} placeholder="https://…" className={inputCls} />}
      </label>
      <label className={labelCls}>Texto del enlace
        <input aria-label={`${idPrefix}: texto del enlace`} maxLength={40} value={label} disabled={!url} onChange={(e) => onLabel(e.target.value)} placeholder={url ? labelPlaceholder : "Primero elige a dónde lleva"} className={inputCls} />
      </label>
    </div>
  );
}

const MOTIONS = [
  { value: "static", label: "Fijo", help: "Un mensaje quieto (si hay varios, se muestra el primero)." },
  { value: "rotate", label: "Rotar", help: "Los mensajes se turnan cada pocos segundos." },
  { value: "marquee", label: "Desplazar", help: "El texto corre de derecha a izquierda." },
] as const;

/** Lo mismo que calcularía la tienda, pero con los datos sin guardar (para la vista previa). */
function toPreview(d: CampaignInput, now: number): Announcement | null {
  const tz = d.timezone;
  const target = d.countdown_target_at ? wallTimeToUtc(d.countdown_target_at, tz) : null;
  const linkLabel = d.link_label || null;
  const items = d.messages.filter((m) => m.text.trim()).map((m) => ({ text: m.text.trim(), link_url: m.link_url || d.link_url || null, link_label: m.link_label || linkLabel }));
  const after = d.after_text ? { text: d.after_text, link_url: d.after_link_url || null, link_label: d.after_link_label || null } : null;
  let mode: Announcement["mode"] = "messages";
  let list: Announcement["items"] = items;
  if (d.countdown_enabled && target && d.countdown_text.includes("{countdown}")) {
    if (Date.parse(target) <= now) {
      if (d.countdown_end_behavior === "hide" || !after) return null;
      mode = "after"; list = [after];
    } else {
      mode = "countdown"; list = [{ text: d.countdown_text, countdown: true, link_url: d.link_url || null, link_label: linkLabel }, ...items];
    }
  }
  if (list.length === 0) return null;
  const custom = d.style === "custom" && /^#[0-9A-Fa-f]{6}$/.test(d.bg_color) && /^#[0-9A-Fa-f]{6}$/.test(d.text_color);
  return {
    campaign_id: "preview", mode, items: list, style: d.style === "custom" && !custom ? "black" : d.style,
    bg_color: custom ? d.bg_color : null, text_color: custom ? d.text_color : null,
    motion: d.motion, marquee_speed: d.marquee_speed, rotate_interval_seconds: d.rotate_interval_seconds, repeat: d.repeat,
    countdown_target_at: mode === "countdown" ? target : null, ends_at: null, timezone: tz, next_change_at: null,
    after: mode === "countdown" && d.countdown_end_behavior === "swap_message" ? after : null,
  };
}

export function CampaignEditor({ initial, pages }: { initial: CampaignInput; pages: StorePage[] }) {
  const router = useRouter();
  const [d, setD] = useState<CampaignInput>(initial);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [previewNow, setPreviewNow] = useState(() => Date.now());
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const dirty = JSON.stringify(d) !== saved;
  useUnsavedGuard(dirty);
  const set = <K extends keyof CampaignInput>(k: K, v: CampaignInput[K]) => { setMsg(null); setD((x) => ({ ...x, [k]: v })); };
  const setMsgAt = (i: number, k: "text" | "link_url" | "link_label", v: string) => {
    setMsg(null); setD((x) => ({ ...x, messages: x.messages.map((m, j) => (j === i ? { ...m, [k]: v } : m)) }));
  };
  const missingToken = d.countdown_enabled && !d.countdown_text.includes("{countdown}");

  const preview = useMemo(() => toPreview(d, previewNow), [d, previewNow]);
  const lowContrast = d.style === "custom" && /^#[0-9A-Fa-f]{6}$/.test(d.bg_color) && /^#[0-9A-Fa-f]{6}$/.test(d.text_color) && contrastRatio(d.bg_color, d.text_color) < 4.5;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await saveCampaign(d);
      if (!r) return;
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) setSaved(JSON.stringify(d));
      if (r.ok && r.id && !d.id) { router.replace(`/admin/configuracion/banner/${r.id}`); }
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid min-w-0 gap-6">
        <Card title="Campaña" step={1}>
          <div className="grid gap-4">
            <label className={labelCls}>Nombre interno (solo lo ves tú)
              <input required maxLength={120} value={d.internal_name} onChange={(e) => set("internal_name", e.target.value)} placeholder="Ej: Envío gratis fin de semana" className={inputCls} />
            </label>
            <label className="flex items-center gap-3 text-[15px] font-medium">
              <input type="checkbox" checked={d.is_active} onChange={(e) => set("is_active", e.target.checked)} className="size-5 accent-[var(--ink)]" />
              Activa (se muestra dentro de sus fechas)
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <DateTimeField label="Empieza" required value={d.starts_at} onChange={(v) => set("starts_at", v)} timezone={d.timezone} />
              <DateTimeField label="Termina (opcional)" value={d.ends_at} onChange={(v) => set("ends_at", v)} timezone={d.timezone} emptyText="Vacío: se muestra hasta que la desactives." />
              <label className={labelCls}>Las fechas están en
                <select value={d.timezone} onChange={(e) => set("timezone", e.target.value)} className={inputCls}>
                  {BUSINESS_TIMEZONES.map((z) => <option key={z} value={z}>{tzLabel(z)}</option>)}
                </select>
              </label>
              <label className={labelCls}>Importancia
                <select value={d.priority} onChange={(e) => set("priority", Number(e.target.value))} className={inputCls}>
                  {!PRIORITIES.some((p) => p.value === d.priority) && <option value={d.priority}>Personalizada ({d.priority})</option>}
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <span className={helpCls}>Si dos campañas coinciden en fechas, se muestra la más importante.</span>
              </label>
            </div>
          </div>
        </Card>

        <Card title="Mensajes" step={2}>
          <ol className="grid gap-4">
            {d.messages.map((m, i) => (
              <li key={i} className="grid gap-2 rounded-[4px] border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-ink-2">Mensaje {i + 1}</span>
                  {d.messages.length > 1 && (
                    <button type="button" onClick={() => setD((x) => ({ ...x, messages: x.messages.filter((_, j) => j !== i) }))} className="press inline-flex h-10 items-center gap-1 px-2 text-[13px] text-danger">
                      <Trash2 aria-hidden="true" size={15} />Quitar
                    </button>
                  )}
                </div>
                <label className={labelCls}>Texto
                  <input aria-label={`Texto del mensaje ${i + 1}`} maxLength={140} value={m.text} onChange={(e) => setMsgAt(i, "text", e.target.value)} placeholder="Ej: ✦ Envío gratis este fin de semana ✦" className={inputCls} />
                  <span className={`${helpCls} text-right tabular`}>{m.text.length}/140</span>
                </label>
                <LinkFields idPrefix={`Mensaje ${i + 1}`} pages={pages} url={m.link_url} label={m.link_label} onUrl={(v) => setMsgAt(i, "link_url", v)} onLabel={(v) => setMsgAt(i, "link_label", v)} />
              </li>
            ))}
          </ol>
          {d.messages.length < 8 && (
            <button type="button" onClick={() => setD((x) => ({ ...x, messages: [...x.messages, { text: "", link_url: "", link_label: "" }] }))} className="press mt-3 inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-[14px]">
              <Plus aria-hidden="true" size={16} />Agregar mensaje
            </button>
          )}
        </Card>

        <Card title="Cuenta regresiva" step={3}>
          <div className="grid gap-4">
            <label className="flex items-center gap-3 text-[15px] font-medium">
              <input type="checkbox" checked={d.countdown_enabled} onChange={(e) => set("countdown_enabled", e.target.checked)} className="size-5 accent-[var(--ink)]" />
              Mostrar un contador
            </label>
            {d.countdown_enabled && (
              <>
                <DateTimeField label="Cuenta hasta" value={d.countdown_target_at} onChange={(v) => set("countdown_target_at", v)} timezone={d.timezone} />
                <div className="grid gap-2">
                  <label className={labelCls}>Texto del contador
                    <input maxLength={140} value={d.countdown_text} onChange={(e) => set("countdown_text", e.target.value)} placeholder="Ej: Faltan {countdown}" className={inputCls} />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => set("countdown_text", d.countdown_text.includes("{countdown}") ? d.countdown_text : `${d.countdown_text.trimEnd()} {countdown}`.trim())}
                      disabled={!missingToken} className="press inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[14px] disabled:opacity-50">
                      <Clock aria-hidden="true" size={15} />Insertar el tiempo
                    </button>
                    <span className={missingToken ? "text-[13px] text-danger" : helpCls}>
                      {missingToken ? "Falta indicar dónde va el tiempo: toca “Insertar el tiempo”." : "{countdown} es donde aparece el tiempo restante (ej: 6 días · 02:29:32)."}
                    </span>
                  </div>
                </div>
                <fieldset className="grid gap-2">
                  <legend className="mb-1 text-[13px] font-medium text-ink-2">Cuando llegue a cero</legend>
                  {([["hide", "Ocultar la campaña"], ["swap_message", "Cambiar a otro mensaje"]] as const).map(([v, l]) => (
                    <label key={v} className="flex items-center gap-3 text-[14px]">
                      <input type="radio" name="end" checked={d.countdown_end_behavior === v} onChange={() => set("countdown_end_behavior", v)} className="size-4 accent-[var(--ink)]" />{l}
                    </label>
                  ))}
                </fieldset>
                {d.countdown_end_behavior === "swap_message" && (
                  <div className="fade-in grid gap-2 rounded-[4px] border border-line p-3">
                    <label className={labelCls}>Mensaje al llegar a cero
                      <input aria-label="Mensaje al llegar a cero" maxLength={140} value={d.after_text} onChange={(e) => set("after_text", e.target.value)} placeholder="Ej: ✦ D'ORATA YA ESTÁ DISPONIBLE · COMPRA AHORA ✦" className={inputCls} />
                    </label>
                    <LinkFields idPrefix="Al llegar a cero" pages={pages} url={d.after_link_url} label={d.after_link_label} onUrl={(v) => set("after_link_url", v)} onLabel={(v) => set("after_link_label", v)} labelPlaceholder="Ej: Comprar" />
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        <Card title="Estilo y movimiento" step={4}>
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Estilo">
              {STYLES.map((s) => (
                <button key={s.value} type="button" role="radio" aria-checked={d.style === s.value} onClick={() => set("style", s.value)}
                  className={`press h-10 rounded-full border px-4 text-[14px] ${d.style === s.value ? "border-ink bg-ink font-semibold text-on-dark" : "border-line"}`}>{s.label}</button>
              ))}
            </div>
            {d.style === "custom" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelCls}>Fondo<span className="flex gap-2"><input type="color" value={d.bg_color || "#1d1712"} onChange={(e) => set("bg_color", e.target.value)} className="h-11 w-14 rounded-[4px] border border-line" /><input value={d.bg_color} onChange={(e) => set("bg_color", e.target.value)} placeholder="#1D1712" className={inputCls} /></span></label>
                <label className={labelCls}>Texto<span className="flex gap-2"><input type="color" value={d.text_color || "#f6efe3"} onChange={(e) => set("text_color", e.target.value)} className="h-11 w-14 rounded-[4px] border border-line" /><input value={d.text_color} onChange={(e) => set("text_color", e.target.value)} placeholder="#F6EFE3" className={inputCls} /></span></label>
                {lowContrast && <p role="alert" className="text-[13px] text-danger sm:col-span-2">Estos colores no se leen bien juntos. No se podrá guardar así.</p>}
              </div>
            )}
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-[13px] font-medium text-ink-2">Movimiento</legend>
              {MOTIONS.map((m) => (
                <label key={m.value} className="flex cursor-pointer gap-3 rounded-[4px] border border-line p-3 has-[:checked]:border-ink has-[:checked]:bg-ivory">
                  <input type="radio" name="motion" checked={d.motion === m.value} onChange={() => set("motion", m.value)} className="mt-1 accent-[var(--ink)]" />
                  <span><span className="block text-[15px] font-semibold">{m.label}</span><span className="block text-[13px] text-ink-2">{m.help}</span></span>
                </label>
              ))}
            </fieldset>
            {d.motion === "rotate" && <label className={labelCls}>Segundos por mensaje<input type="number" min={2} max={60} value={d.rotate_interval_seconds} onChange={(e) => set("rotate_interval_seconds", Number(e.target.value))} className={inputCls} /></label>}
            {d.motion === "marquee" && (
              <label className={labelCls}>Velocidad
                <input type="range" min={10} max={200} value={d.marquee_speed} onChange={(e) => set("marquee_speed", Number(e.target.value))} className="h-11 accent-[var(--ink)]" />
                <span className="flex justify-between text-[12px] text-ink-3"><span>Lenta</span><span>Rápida</span></span>
              </label>
            )}
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 content-start gap-4 lg:sticky lg:top-6">
        <Card title="Vista previa">
          <div className="mb-3 flex gap-2" role="radiogroup" aria-label="Dispositivo">
            {([["mobile", "Celular", Smartphone], ["desktop", "Computador", Monitor]] as const).map(([v, l, Icon]) => (
              <button key={v} type="button" role="radio" aria-checked={device === v} onClick={() => setDevice(v)}
                className={`press inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] ${device === v ? "border-ink bg-ink font-semibold text-on-dark" : "border-line"}`}>
                <Icon aria-hidden="true" size={15} />{l}
              </button>
            ))}
          </div>
          <div className="overflow-hidden rounded-[4px] border border-line bg-ivory">
            <div className={device === "mobile" ? "mx-auto w-[320px] max-w-full" : "w-full"}>
              {preview ? (
                <AnnouncementBar key={JSON.stringify(preview) + device} announcement={preview} serverNow={previewNow} labels={{ region: "Anuncio", pause: "Pausar", play: "Reanudar" }} />
              ) : (
                <p className="p-4 text-[13px] text-ink-2">Sin barra: escribe un mensaje{d.countdown_enabled ? " o revisa el contador" : ""}.</p>
              )}
              <div className="flex h-14 items-center justify-center border-t border-line font-display text-[20px] tracking-[.2em]">D&apos;ORATA</div>
            </div>
          </div>
          {d.countdown_enabled && d.countdown_target_at && (
            <button type="button" onClick={() => { const t = wallTimeToUtc(d.countdown_target_at, d.timezone); if (t) setPreviewNow(Date.parse(t) + 1000); }}
              className="press mt-3 h-10 text-[14px] underline underline-offset-4">Ver cómo queda al llegar a cero</button>
          )}
          {previewNow > Date.now() + 5000 && (
            <button type="button" onClick={() => setPreviewNow(Date.now())} className="press ml-3 mt-3 h-10 text-[14px] underline underline-offset-4">Volver a ahora</button>
          )}
        </Card>
      </div>
      <SaveBar dirty={dirty && !msg}>
        <button type="submit" disabled={pending || lowContrast} className={btnPrimary}>
          {pending ? <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <Check aria-hidden="true" size={16} />}
          Guardar campaña
        </button>
        {msg && <StatusText ok={msg.ok}>{msg.text}</StatusText>}
      </SaveBar>
    </form>
  );
}
