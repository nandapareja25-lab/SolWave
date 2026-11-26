import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="velvet flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Logo tone="dark" size="lg" />
      <div className="filete-doble mt-8 w-full max-w-sm rounded-[4px] bg-surface p-6 text-ink">
        <h1 className="font-display text-[28px] leading-tight">Panel D&apos;ORATA</h1>
        <p className="mt-1 text-[14px] text-ink-2">Acceso privado. Después te pediremos el código de tu app de verificación.</p>
        <LoginForm />
      </div>
    </main>
  );
}
