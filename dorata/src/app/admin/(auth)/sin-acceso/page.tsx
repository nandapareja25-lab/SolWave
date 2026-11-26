import { signOut } from "@/app/admin/actions";

export default function NoAccessPage() {
  return (
    <main className="velvet flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-[28px]">Esta cuenta no tiene acceso al panel</h1>
      <p className="mt-2 max-w-sm text-[15px] text-on-dark-2">Si deberías tenerlo, pídele a la dueña que te asigne un rol.</p>
      <form action={signOut} className="mt-6"><button className="press h-12 rounded-full border border-gold px-6 text-[15px] font-semibold text-gold">Salir</button></form>
    </main>
  );
}
