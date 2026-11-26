"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { signIn, type LoginState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, { error: null });
  return (
    <form action={action} className="mt-6 grid gap-4">
      <label className="grid gap-1 text-[14px] font-medium">
        Correo
        <input name="email" type="email" autoComplete="username" required className="h-12 rounded-[4px] border border-line bg-ivory px-3 text-[16px] outline-none focus:border-gold-deep" />
      </label>
      <label className="grid gap-1 text-[14px] font-medium">
        Contraseña
        <input name="password" type="password" autoComplete="current-password" required minLength={8} className="h-12 rounded-[4px] border border-line bg-ivory px-3 text-[16px] outline-none focus:border-gold-deep" />
      </label>
      {state.error && <p role="alert" className="text-[14px] text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="press flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-on-dark disabled:opacity-70">
        {pending ? <Loader2 aria-hidden="true" size={18} className="animate-spin motion-reduce:animate-none" /> : <LogIn aria-hidden="true" size={18} />}
        Entrar
      </button>
    </form>
  );
}
