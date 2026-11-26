import { requireAdmin } from "@/server/admin/auth";
import { Card, helpCls, inputCls, labelCls } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/forms";
import { BUSINESS_TIMEZONES, formatInZone, tzLabel, utcToWallTime } from "@/lib/tz";
import { StoreModeFields } from "@/components/admin/StoreModeFields";
import { saveGeneral, saveRate, saveStoreMode } from "./actions";

export const metadata = { title: "Configuración" };


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
      <Card title="Estado de la tienda" step={1}>
        <ActionForm action={saveStoreMode}>
          <StoreModeFields mode={s.store_mode} liveAt={utcToWallTime(s.live_at, tz)} maintenance={(s.maintenance_message as Record<string, string>)?.es ?? ""} timezone={tz} />
        </ActionForm>
      </Card>

      <Card title="Contacto, redes y presentación" step={2}>
        <ActionForm action={saveGeneral}>
          <label className={labelCls}>Correo de contacto
            <input name="contact_email" type="email" defaultValue={s.contact_email ?? ""} placeholder="Ej: hola@dorata18k.com" className={inputCls} />
            {!s.contact_email && <span className="text-[12px] font-normal text-gold-deep">Sin correo, tus clientas no tienen cómo escribirte desde la tienda.</span>}
          </label>
          <label className={labelCls}>
            WhatsApp
            <input name="whatsapp_e164" inputMode="tel" placeholder="Ej: +1 305 555 0100" defaultValue={s.whatsapp_e164 ?? ""} className={inputCls} />
            <span className={helpCls}>Con + y código de país. Mientras esté vacío, el botón de WhatsApp no aparece en la tienda.</span>
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
                {BUSINESS_TIMEZONES.map((z) => <option key={z} value={z}>{tzLabel(z)}</option>)}
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
        <Card title="Tasa de cambio COP / USD" step={3}>
          <p className="mb-4 text-[14px] text-ink-2">
            Se usa para convertir el costo de tus piezas compradas en pesos colombianos. No cambia sola: tú la defines.
            {b?.cop_per_usd ? <> Vigente: <strong className="tabular">{Number(b.cop_per_usd).toLocaleString("es-US")} COP</strong> por 1 USD{b.cop_rate_updated_at ? ` (desde ${formatInZone(b.cop_rate_updated_at, tz)})` : ""}.</> : <> Aún no hay tasa definida.</>}
          </p>
          <ActionForm action={saveRate} submitLabel="Guardar tasa">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelCls}>COP por 1 USD<input name="cop_per_usd" inputMode="decimal" required placeholder="Ej: 4100" className={inputCls} /></label>
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
