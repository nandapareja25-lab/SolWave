"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type NewsletterLabels = Record<"label" | "placeholder" | "submit" | "submitting" | "success" | "invalid" | "unavailable" | "legal" | "offline", string>;

type Status = "idle" | "submitting" | "success" | "error";

/** Alta de novedades / lista de espera. El consentimiento es explícito (enviar el formulario) y queda registrado en el servidor. */
export function NewsletterForm({ labels, source, tone = "light" }: { labels: NewsletterLabels; source: "footer" | "waitlist"; tone?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const dark = tone === "dark";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    if (!valid) { setError(labels.invalid); setStatus("error"); return; }
    if (!navigator.onLine) { setError(labels.offline); setStatus("error"); return; }
    setStatus("submitting"); setError(null);
    const hp = (new FormData(e.currentTarget).get("website") as string) || "";
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source, website: hp }),
      });
      if (res.ok) { setStatus("success"); return; }
      setError(res.status === 400 ? labels.invalid : labels.unavailable);
      setStatus("error");
    } catch {
      setError(labels.unavailable); setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p role="status" className={`rise shine flex items-center justify-center gap-2 rounded-full px-4 py-3 text-[15px] ${dark ? "bg-velvet-2 text-on-dark" : "bg-surface text-ink"}`}>
        <span className="grid size-6 place-items-center rounded-full bg-gold/20 text-gold-deep"><Check aria-hidden="true" size={14} strokeWidth={2.5} /></span>
        {labels.success}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full">
      <label htmlFor={`nl-${source}`} className="sr-only">{labels.label}</label>
      <div className={`flex gap-2 ${source === "waitlist" ? "flex-col" : ""}`}>
        <input
          id={`nl-${source}`} type="email" inputMode="email" autoComplete="email" required
          value={email} onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
          placeholder={labels.placeholder} aria-invalid={status === "error" || undefined} aria-describedby={`nl-${source}-msg`}
          className={`h-12 min-w-0 rounded-full border ${source === "waitlist" ? "w-full" : "flex-1"} px-4 text-[16px] outline-none transition-colors focus:border-gold-deep ${dark ? "border-velvet-line bg-velvet-2 text-on-dark placeholder:text-on-dark-2/70" : "border-line bg-surface text-ink placeholder:text-ink-3"}`}
        />
        {/* trampa para bots: invisible para personas */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] size-px opacity-0" />
        <button type="submit" disabled={status === "submitting"}
          className={`press flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold disabled:opacity-70 ${dark ? "bg-gold text-ink" : "bg-ink text-on-dark"}`}>
          {status === "submitting" && <Loader2 aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" />}
          {status === "submitting" ? labels.submitting : labels.submit}
        </button>
      </div>
      <p id={`nl-${source}-msg`} role={status === "error" ? "alert" : undefined}
        className={`mt-2 text-[13px] leading-[1.45] ${status === "error" ? (dark ? "text-danger-on-dark" : "text-danger") : dark ? "text-on-dark-2" : "text-ink-3"}`}>
        {status === "error" && error ? error : <>{labels.legal.replace(" Ver Privacidad.", "")} <Link href="/privacidad" className="underline underline-offset-2">Privacidad</Link>.</>}
      </p>
    </form>
  );
}
