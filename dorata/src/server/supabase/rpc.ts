import "server-only";

/** Configuración pública de Supabase. Si falta, la tienda corre con datos de demostración. */
export function supabasePublicConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

/** Llama una función pública (RPC) con la clave publishable: respeta RLS y los GRANT de la base. */
export async function callPublicRpc<T>(fn: string, args: Record<string, unknown>, init?: { revalidate?: number }): Promise<T> {
  const cfg = supabasePublicConfig();
  if (!cfg) throw new Error("SUPABASE_NOT_CONFIGURED");
  const res = await fetch(`${cfg.url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    next: init?.revalidate !== undefined ? { revalidate: init.revalidate } : undefined,
  });
  if (!res.ok) throw new Error(`RPC_${fn}_${res.status}`);
  return (await res.json()) as T;
}

/** Inserción con la clave SECRETA (solo servidor): formularios públicos ya validados. */
export async function insertWithSecret(table: string, row: Record<string, unknown>, opts?: { onConflict?: string; ignoreDuplicates?: boolean }): Promise<Response> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("SUPABASE_NOT_CONFIGURED");
  const qs = opts?.onConflict ? `?on_conflict=${encodeURIComponent(opts.onConflict)}` : "";
  return fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}${qs}`, {
    method: "POST",
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      Prefer: `return=minimal${opts?.ignoreDuplicates ? ",resolution=ignore-duplicates" : ""}`,
    },
    body: JSON.stringify(row),
    cache: "no-store",
  });
}
