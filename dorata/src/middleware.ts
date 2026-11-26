import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routing } from "@/i18n/routing";
import { decideRoute } from "@/lib/store-mode";
import { fetchStoreMode, hashPreviewToken, isAlwaysPublic, PREVIEW_COOKIE, previewCookieValue } from "@/server/store-mode";

const intl = createIntlMiddleware(routing);

/**
 * 1) Vista previa: /?vista_previa=TOKEN (STORE_PREVIEW_TOKEN) deja a la dueña ver la tienda real
 *    aunque esté en Próximamente o Mantenimiento.
 * 2) Modo de la tienda (desde el panel): reescribe a /proximamente o /mantenimiento.
 * 3) Idioma (next-intl): español sin prefijo.
 */
/** Panel: refresca la sesión (cookies) y saca a quien no haya iniciado sesión. */
async function adminMiddleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return res;
  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  const isAuthPage = req.nextUrl.pathname === "/admin/login";
  if (!user && !isAuthPage) {
    const to = req.nextUrl.clone();
    to.pathname = "/admin/login";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return res;
}

export default async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/admin" || req.nextUrl.pathname.startsWith("/admin/")) return adminMiddleware(req);
  const expected = await previewCookieValue();
  const token = req.nextUrl.searchParams.get("vista_previa");
  if (token !== null && expected) {
    const url = req.nextUrl.clone();
    url.searchParams.delete("vista_previa");
    const res = NextResponse.redirect(url);
    const ok = (await hashPreviewToken(token)) === expected; // se comparan huellas, no el secreto
    if (ok) {
      res.cookies.set(PREVIEW_COOKIE, expected, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
    }
    return res;
  }
  const hasPreview = !!expected && req.cookies.get(PREVIEW_COOKIE)?.value === expected;

  const { mode } = await fetchStoreMode();
  const decision = decideRoute(mode, req.nextUrl.pathname, hasPreview, isAlwaysPublic);

  if (decision.action === "redirect") {
    return NextResponse.redirect(new URL(decision.to, req.url));
  }
  if (decision.action === "rewrite") {
    const url = req.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}${decision.to}`;
    const res = NextResponse.rewrite(url);
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Robots-Tag", decision.to === "/mantenimiento" ? "noindex" : "index");
    return res;
  }
  return intl(req);
}

export const config = {
  // Todo menos API, archivos de Next, el panel (fase 3) y archivos con extensión.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
