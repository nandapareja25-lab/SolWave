import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { MfaForm } from "@/components/admin/MfaForm";
import { supabaseServer } from "@/server/supabase/ssr";

export const metadata: Metadata = { title: "Verificación" };

export default async function VerifyPage() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") redirect("/admin");
  return (
    <main className="velvet flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Logo tone="dark" size="lg" />
      <div className="filete-doble mt-8 w-full max-w-sm rounded-[4px] bg-surface p-6 text-ink">
        <MfaForm hasFactor={aal?.nextLevel === "aal2"} />
      </div>
    </main>
  );
}
