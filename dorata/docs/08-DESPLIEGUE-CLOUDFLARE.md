# D'ORATA — Publicar "Próximamente" (y luego la tienda) en Cloudflare

Estado: **preparado y verificado** (26-nov-2026). Falta solo lo que requiere TUS cuentas.

## Qué ya está listo
- Base de datos Supabase "dorata" (us-east-1) con las 8 migraciones, datos iniciales y la tienda en modo **Próximamente**.
- Banner de lanzamiento activo con cuenta regresiva al **2 de diciembre, 00:00 (Nueva York)**.
- El paquete para Cloudflare Workers compila (`npm run preview` / `npm run deploy`) y arranca en el motor real de Cloudflare.
- `wrangler.jsonc` ya trae la dirección del proyecto y la clave PÚBLICA de Supabase (no son secretas).

## Lo que necesito que hagas tú (15–20 min, una sola vez)

1. **Cuenta de Cloudflare** (gratis): cloudflare.com → crear cuenta.
2. **Dominio dorata18k.com en Cloudflare:**
   - Si ya lo compraste en otro lugar: Cloudflare → *Add a domain* → cambia los "nameservers" donde lo compraste por los 2 que te da Cloudflare.
   - Si no lo has comprado: Cloudflare → *Domain Registration* → buscar `dorata18k.com` (cuesta dinero: ~$10–12/año, lo decides tú).
3. **Conectar el código (GitHub → Cloudflare):** Cloudflare → *Workers & Pages* → *Create* → *Import a repository* → `nandapareja25-lab/SolWave`:
   - Root directory: `dorata`
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
   - Rama de producción: la que acordemos (hoy el trabajo está en `claude/dorata-ecommerce-platform-qu0ubx`).
4. **Secretos** (Cloudflare → Workers → `mafer-studio` → *Settings* → *Variables and Secrets* → tipo **Secret**). Nunca los pegues en el chat:
   | Nombre | De dónde sale | Para qué |
   |---|---|---|
   | `SUPABASE_SECRET_KEY` | Supabase → proyecto dorata → *Project Settings* → *API Keys* → **Secret key** (`sb_secret_…`) | Guardar correos de la lista de espera y registros de cookies |
   | `STORE_PREVIEW_TOKEN` | Inventa una frase larga (≥ 24 caracteres) | Tu enlace privado: `dorata18k.com/?vista_previa=TU_FRASE` para ver la tienda real mientras está en Próximamente |
   | `TURNSTILE_SECRET_KEY` + variable `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare → *Turnstile* → *Add site* (gratis) | Anti-bots en la lista de espera (opcional el día 1, recomendado) |
5. **Dominio del Worker:** Workers → `mafer-studio` → *Settings* → *Domains & Routes* → *Add* → `dorata18k.com` y `www.dorata18k.com`.
6. Escríbeme "listo" y verifico en vivo: Próximamente, cuenta regresiva, lista de espera guardando correos, cookies, políticas, y que la tienda NO se vea sin tu enlace.

## Si el despliegue falla con "error 10181" o menciona `env.DB` / D1
La tienda **no usa D1** (base de datos de Cloudflare): todos los datos están en Supabase. El código nunca usa `env.DB`
y `dorata/wrangler.jsonc` no declara ninguna base D1. Si Cloudflare intenta crear un binding `DB` (por ejemplo
`mafer-studio-db` con id `00000000-…`), está usando **otra configuración**, no la de la tienda. Revisa en el proyecto de
Cloudflare › *Settings* › *Build*:
1. **Root directory** = `dorata` (si está vacío, Cloudflare no encuentra nuestro `wrangler.jsonc` y genera uno propio).
2. **Rama de producción** = la rama donde está la tienda (hoy `claude/dorata-ecommerce-platform-qu0ubx`; `main` todavía
   no tiene la tienda).
3. **Build command** `npx opennextjs-cloudflare build` · **Deploy command** `npx opennextjs-cloudflare deploy`.
4. *Settings* › *Bindings*: si aparece un binding `DB` de tipo D1, elimínalo. No hace falta crear ninguna base D1.
5. El nombre del Worker debe coincidir con `"name"` de `wrangler.jsonc`: ya está ajustado a **`mafer-studio`**, el Worker
   que existe en tu cuenta (verificado el 26-nov: un solo Worker y ninguna base D1). No hace falta crear otro.

## El 2 de diciembre: tres opciones, sin tocar código
- **Abrir la tienda:** Supabase → *Table Editor* → `store_settings` → `store_mode` = `live`. (En la fase 3 será un botón en el panel.)
- **Abrir sola a una hora:** poner `live_at` = `2026-12-02 00:00` (Nueva York) y dejar `store_mode` = `coming_soon`.
- **Seguir en Próximamente:** no hacer nada. El público solo ve la página de lanzamiento (el banner "YA ESTÁ DISPONIBLE" aparece únicamente dentro de la tienda abierta, o en tu vista previa). Cuando la cuenta regresiva termine, la página dirá "Estamos abriendo las puertas" y la lista de espera sigue funcionando.

## Verificado aquí
- 32/32 pruebas SQL · 28/28 pruebas de lógica · tipos y lint limpios · `next build` y build de Cloudflare OK.
- Contra la base real: el público ve categorías y modo; NO ve costos, roles ni puede inscribir correos directamente (solo vía servidor).
- Si la base no responde, el sitio muestra "Volvemos en un momento" (nunca un error).
