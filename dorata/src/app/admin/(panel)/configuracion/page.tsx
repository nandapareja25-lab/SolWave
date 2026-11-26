import { requireAdmin } from "@/server/admin/auth";
import { Card, inputCls, labelCls } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/forms";
import { BUSINESS_TIMEZONES, formatInZone, utcToWallTime } from "@/lib/tz";
import { saveGeneral, saveRate, saveStoreMode } from "./actions";

export const metadata = { title: "Configuración" };

const MODES = [
  { value: "coming_soon", label: "Próximamente", help: "Toda la tienda muestra la página de lanzamiento con cuenta regresiva y lista de espera. Las políticas siguen visibles." },
  { value: "live", label: "Tienda activa", help: "La tienda completa queda abierta al público." },
  { value: "maintenance", label: "Mantenimiento", help: "Toda la tienda muestra un aviso de “volvemos en un momento”. Úsalo si necesitas cerrar temporalmente." },
] as const;

export default async function StoreConfigPage() {
  const { sb, role } = await requireAdmin("admin");
  const [{ data: s }, { data: b }, { data: rates }] = await Promise.all([
    sb.from("store_settings").select("store_mode,live_at,maintenance_message,timezone,contact_email,whatsapp_e164,social_links,packaging_note,newsletter_enabled").eq("id", 1).single(),
    sb.from("business_settings").select("cop_per_usd,cop_rate_updated_at").eq("id", 1).single(),
    sb.from("exchange_rates").select("cop_per_usd,note,effective_at").order("effective_at", { ascending: false }).limit(5),
  ]);
  if (!s) return <p>No se pudo cargar la configuración.</p>;
  const tz = s.timezone as string;
  const social = (s.social_links ?? {}) as Record<string, string>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Estado de la tienda">
        <ActionForm action={saveStoreMode}>
          <fieldset className="grid gap-2">
            <legend className="sr-only">Estado</legend>
            {MODES.map((m) => (
              <label key={m.value} className="flex cursor-pointer gap-3 rounded-[4px] border border-line p-3 has-[:checked]:border-ink has-[:checked]:bg-ivory">
                <input type="radio" name="store_mode" value={m.value} defaultChecked={s.store_mode === m.value} className="mt-1 accent-[var(--ink)]" />
                <span><span className="block text-[15px] font-semibold">{m.label}</span><span className="block text-[13px] text-ink-2">{m.help}</span></span>
              </label>
            ))}
          </fieldset>
          <label className={labelCls}>
            Abrir automáticamente (opcional, solo en Próximamente) · hora de {tz.replace("_", " ")}
            <input type="datetime-local" name="live_at" defaultValue={utcToWallTime(s.live_at, tz)} className={inputCls} />
          </label>
          <label className={labelCls}>
            Mensaje de mantenimiento (opcional)
            <input name="maintenance_message" maxLength={240} defaultValue={(s.maintenance_message as Record<string, string>)?.es ?? ""} className={inputCls} placeholder="Volvemos en unas horas." />
          </label>
          <p className="text-[13px] text-ink-3">Para ver la tienda real mientras está cerrada usa tu enlace privado (dorata18k.com/?vista_previa=…).</p>
        </ActionForm>
      </Card>

      <Card title="Contacto, redes y presentación">
        <ActionForm action={saveGeneral}>
          <label className={labelCls}>Correo de contacto<input name="contact_email" type="email" defaultValue={s.contact_email ?? ""} className={inputCls} /></label>
          <label className={labelCls}>
            WhatsApp (con + y código de país). Sin número, el botón no aparece.
            <input name="whatsapp_e164" inputMode="tel" placeholder="+13055550100" defaultValue={s.whatsapp_e164 ?? ""} className={inputCls} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelCls}>Instagram<input name="instagram" defaultValue={social.instagram ?? ""} placeholder="https://www.instagram.com/…" className={inputCls} /></label>
            <label className={labelCls}>TikTok<input name="tiktok" defaultValue={social.tiktok ?? ""} placeholder="https://www.tiktok.com/@…" className={inputCls} /></label>
            <label className={labelCls}>Facebook<input name="facebook" defaultValue={social.facebook ?? ""} placeholder="https://www.facebook.com/…" className={inputCls} /></label>
          </div>
          <label className={labelCls}>
            Texto de empaque (déjalo vacío para no mencionarlo)
            <input name="packaging_note" maxLength={160} defaultValue={(s.packaging_note as Record<string, string>)?.es ?? ""} className={inputCls} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelCls}>
              Zona horaria del negocio
              <select name="timezone" defaultValue={tz} className={inputCls}>
                {BUSINESS_TIMEZONES.map((z) => <option key={z} value={z}>{z.replace("_", " ")}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-3 self-end text-[14px]">
              <input type="checkbox" name="newsletter_enabled" defaultChecked={s.newsletter_enabled} className="size-5 accent-[var(--ink)]" />
              Mostrar suscripción a novedades en la tienda
            </label>
          </div>
        </ActionForm>
      </Card>

      {role !== "staff" && (
        <Card title="Tasa de cambio COP / USD">
          <p className="mb-4 text-[14px] text-ink-2">
            Se usa para convertir el costo de tus piezas compradas en pesos colombianos. No cambia sola: tú la defines.
            {b?.cop_per_usd ? <> Vigente: <strong className="tabular">{Number(b.cop_per_usd).toLocaleString("es-US")} COP</strong> por 1 USD{b.cop_rate_updated_at ? ` (desde ${formatInZone(b.cop_rate_updated_at, tz)})` : ""}.</> : <> Aún no hay tasa definida.</>}
          </p>
          <ActionForm action={saveRate} submitLabel="Guardar tasa">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelCls}>COP por 1 USD<input name="cop_per_usd" inputMode="decimal" required placeholder="4100" className={inputCls} /></label>
              <label className={labelCls}>Nota (opcional)<input name="note" maxLength={200} placeholder="Tasa de mi compra de diciembre" className={inputCls} /></label>
            </div>
          </ActionForm>
          {(rates ?? []).length > 0 && (
            <ul className="mt-4 divide-y divide-line text-[13px] text-ink-2">
              {(rates ?? []).map((r) => (
                <li key={r.effective_at} className="flex justify-between gap-3 py-2"><span>{formatInZone(r.effective_at, tz)}{r.note ? ` · ${r.note}` : ""}</span><span className="tabular font-semibold text-ink">{Number(r.cop_per_usd).toLocaleString("es-US")}</span></li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
