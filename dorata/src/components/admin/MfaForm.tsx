"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabaseBrowser } from "@/server/supabase/browser";

/**
 * Verificación en dos pasos (TOTP: Google Authenticator, 1Password, Authy…).
 * Primera vez: muestra el QR para registrar la app. Luego: solo pide el código de 6 dígitos.
 */
export function MfaForm({ hasFactor }: { hasFactor: boolean }) {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    (async () => {
      const { data } = await sb.auth.mfa.listFactors();
      const verified = (data?.totp as { id: string; status: string }[] | undefined)?.find((f) => f.status === "verified");
      if (verified) { setFactorId(verified.id); return; }
      // Limpia intentos de registro sin terminar y crea uno nuevo
      for (const f of (data?.all ?? []) as { id: string; status: string }[]) if (f.status !== "verified") await sb.auth.mfa.unenroll({ factorId: f.id });
      const { data: enrolled, error: e } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "Panel D'ORATA" });
      if (e || !enrolled) { setError("No pudimos preparar la verificación. Recarga la página."); return; }
      setFactorId(enrolled.id); setQr(enrolled.totp.qr_code); setSecret(enrolled.totp.secret);
    })();
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) { setError("Escribe los 6 dígitos de tu app."); return; }
    setBusy(true); setError(null);
    const { error: err } = await supabaseBrowser().auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (err) { setError("Código incorrecto o vencido. Usa el que aparece ahora en tu app."); setCode(""); return; }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={verify} className="grid gap-4">
      <h1 className="font-display text-[28px] leading-tight">{qr ? "Activa tu verificación" : "Tu código de acceso"}</h1>
      {qr ? (
        <>
          <p className="text-[14px] text-ink-2">Escanea este código con tu app de verificación (por ejemplo Google Authenticator) y escribe el número de 6 dígitos.</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR en data URL generado por Supabase */}
          <img src={qr} alt="Código QR para tu app de verificación" width={180} height={180} className="mx-auto rounded-[4px] border border-line bg-surface p-2" />
          {secret && <p className="break-all text-center text-[12px] text-ink-3">Si no puedes escanear, escribe esta clave en la app: <span className="font-semibold text-ink-2">{secret}</span></p>}
        </>
      ) : (
        <p className="text-[14px] text-ink-2">{hasFactor ? "Abre tu app de verificación y escribe el código de 6 dígitos." : "Preparando…"}</p>
      )}
      <label className="grid gap-1 text-[14px] font-medium">
        Código de 6 dígitos
        <input inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="tabular h-12 rounded-[4px] border border-line bg-ivory px-3 text-center text-[22px] tracking-[.3em] outline-none focus:border-gold-deep" />
      </label>
      {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
      <button type="submit" disabled={busy || !factorId} className="press flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-on-dark disabled:opacity-70">
        {busy ? <Loader2 aria-hidden="true" size={18} className="animate-spin motion-reduce:animate-none" /> : <ShieldCheck aria-hidden="true" size={18} />}
        Verificar
      </button>
    </form>
  );
}
