# D'ORATA — Arquitectura técnica

> Documento base. Fase 0 (definición). Fecha: 25-nov-2026.
> Decisiones técnicas tomadas aquí = cosa juzgada; cambiarlas requiere justificarlo en `ESTADO.md`.

---

## 1. Vista general

```
                    ┌──────────────────────── Cloudflare ────────────────────────┐
 Cliente (móvil) ──▶│ DNS + SSL + WAF + Turnstile + Rate limiting + CDN          │
                    │                                                            │
                    │  Worker "dorata-web" (Next.js vía OpenNext)                │
                    │   ├─ Tienda pública  /  /[categoria]/[producto]  /carrito  │
                    │   ├─ Panel privado   /admin/*  (+ Cloudflare Access)       │
                    │   ├─ API (BFF)       /api/checkout  /api/webhooks/stripe   │
                    │   └─ /media/*  → proxy con caché de fotos de Supabase      │
                    │  R2: caché incremental de páginas (ISR)                    │
                    └───────────────┬───────────────────────────┬────────────────┘
                                    │ (clave secreta solo aquí) │
                     ┌──────────────▼─────────────┐   ┌─────────▼──────────┐
                     │ Supabase                   │   │ Stripe             │
                     │  Postgres + RLS + funciones│   │  Checkout hosted   │
                     │  Auth (admin + clientes)   │   │  Webhooks firmados │
                     │  Storage (fotos, evidencias)│  │  Tax / Wallets     │
                     │  pg_cron (liberar reservas)│   └────────────────────┘
                     └────────────────────────────┘
                     Resend (emails de pedido, fase 5) · Cloudflare Web Analytics (sin cookies)
```

**Una sola aplicación**, un solo despliegue, dos caras: la tienda (pública, rápida, casi sin
JavaScript) y el panel (privado, más interactivo). Compartir código evita duplicar tipos,
validaciones y la lógica de precios.

## 2. Decisiones técnicas (y por qué)

| Tema | Decisión | Razón |
|---|---|---|
| Framework | **Next.js 15 App Router + TypeScript estricto** | SEO de producto (RSC = HTML servido, 0 JS innecesario), rutas API para el BFF, un solo proyecto para tienda + panel. |
| Hosting | **Cloudflare Workers con `@opennextjs/cloudflare`** | Lo pediste; es el adaptador oficial para Next en Workers. Plan gratis al inicio; Workers Paid (~$5/mes) cuando haya tráfico. |
| Caché de páginas | ISR con **R2** como caché incremental + `revalidateTag` al guardar en el panel | La tienda se sirve estática desde el borde; cuando editas un producto, solo esa página se regenera. |
| Base de datos | **Supabase Postgres** con RLS en todas las tablas | Ver `02-BASE-DE-DATOS.md`. 58 tablas pequeñas y claras, no una tabla gigante. |
| Lógica crítica | **Funciones SQL transaccionales** (reservar, vender, ajustar stock) | La sobreventa se evita DENTRO de la base con bloqueo de filas; ningún bug del frontend puede saltárselo. Probado: 12/12. |
| Pagos | **Stripe Checkout** (página de pago alojada por Stripe) | PCI a cargo de Stripe, Apple Pay/Google Pay/Link automáticos, Stripe Tax con un flag. La verdad del pago = **webhook firmado**. |
| Estilos | **Tailwind CSS v4** (tokens en CSS) + shadcn/ui **solo en el panel** | La tienda usa componentes propios livianos; el panel usa shadcn por productividad. |
| Íconos | Lucide (tree-shaken) | Trazo fino 1.5px = estética de joyería. |
| Animación | **CSS + View Transitions** en la tienda; `motion` solo en el panel | Performance: la tienda no carga librerías de animación. |
| Gráficos | Recharts **solo en /admin** (carga diferida) | No pesa en la tienda. |
| Validación | **zod** compartido cliente/servidor | Un esquema, dos usos; el servidor siempre revalida. |
| i18n | **next-intl**, `localePrefix: 'as-needed'` | Español sin prefijo (`/cadenas/cadena-singapur`); inglés mañana en `/en/...`. Textos de catálogo en tablas `*_translations`. |
| Imágenes | Redimensionado **en el navegador del admin** (WebP 400/800/1600) antes de subir + proxy `/media/*` con caché de Cloudflare | Cero costo de transformaciones, fotos servidas desde tu dominio, menos tráfico de Supabase. |
| Emails | Resend (fase 5) | Confirmación de pedido, envío, garantía. |
| Analítica | Cloudflare Web Analytics + métricas propias desde pedidos | Sin cookies de terceros; las ventas se miden desde la base, no desde un píxel. |
| Monitoreo | Logs de Workers + Sentry (plan gratis) en fase 7 | Errores con contexto, sin datos personales. |

**Moneda:** todo en **centavos enteros USD** (`5999` = $59.99). Nunca decimales flotantes para dinero.
**Costos en COP:** se guardan con la tasa usada en ese momento (historial), y la base calcula el USD.

## 3. Sistema de administración

- Ruta `/admin` dentro de la misma app, **protegida en 3 capas**:
  1. **Cloudflare Access** (Zero Trust, gratis hasta 50 usuarios) delante de `/admin*`: nadie llega ni a la pantalla de login sin pasar un código a tu correo.
  2. **Supabase Auth** con correo + contraseña + **MFA (código TOTP) obligatorio** para cualquier rol. El middleware exige sesión con nivel `aal2`.
  3. **Rol en la base** (`user_roles`: owner › admin › staff) verificado en el servidor en cada acción **y** por RLS en cada consulta.
- **Roles:**
  - `owner` (tú): todo + gestionar el equipo.
  - `admin`: todo menos roles (costos, finanzas, configuración).
  - `staff` (ayudante futura): pedidos, inventario, garantías, catálogo — **sin ver costos ni finanzas**.
- **Toda acción administrativa queda en `admin_audit_log`** (quién, qué, antes/después) mediante triggers; el log no se puede editar ni borrar.
- Menú: Dashboard · Productos · Categorías · Colecciones · Inventario · Pedidos · Clientes · Garantías · Descuentos · Finanzas · Analítica · Configuración.

## 4. Seguridad (resumen operativo)

| Riesgo | Control |
|---|---|
| Claves expuestas | `STRIPE_SECRET_KEY`, `SUPABASE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `TURNSTILE_SECRET_KEY` solo como **secrets del Worker**. Nada secreto con prefijo `NEXT_PUBLIC_`. Módulos de servidor marcados con `import 'server-only'`. |
| Precio manipulado en el carrito | El servidor **recalcula** precios, descuentos y envío desde la base. El navegador solo envía `variant_id` + cantidad. |
| Pago falso ("página de éxito") | El pedido se crea **solo** en el webhook `checkout.session.completed` con firma verificada; la página de éxito solo consulta el estado. |
| Webhook repetido | Tabla `stripe_events` (id de evento = clave primaria) → idempotencia. |
| Sobreventa | Reserva atómica con `SELECT … FOR UPDATE` en `reserve_stock`. Probado con dos carritos compitiendo. |
| Acceso a datos ajenos | RLS en las 58 tablas (`force row level security`). Costos y notas internas en tablas aparte (RLS filtra filas, no columnas). Probado con anon / cliente / staff / owner. |
| Escalada de privilegios | Solo `owner` escribe en `user_roles`. Probado. |
| CSRF | Server Actions validan `Origin`; rutas POST propias validan `Origin === host`; cookies `HttpOnly`, `Secure`, `SameSite=Lax`. El webhook de Stripe no usa cookies (firma). |
| Bots / abuso | **Turnstile** en: iniciar pago, newsletter, solicitud de garantía, login del panel. **Rate limiting** (binding de Workers) en `/api/checkout`, login, búsqueda de pedido, newsletter. |
| XSS | React escapa por defecto; Markdown de políticas renderizado con sanitizado; **CSP con nonce**. |
| Fotos privadas | Evidencias de garantía y recibos en buckets **privados** con URLs firmadas de vida corta. |
| Datos personales | Nunca en logs; IP solo como hash para rate limit. |

## 5. Estructura de carpetas

```
dorata/
├── src/
│   ├── app/
│   │   ├── [locale]/                     # next-intl (es sin prefijo)
│   │   │   ├── (tienda)/
│   │   │   │   ├── page.tsx              # Home
│   │   │   │   ├── [categoria]/page.tsx  # Listado con filtros
│   │   │   │   ├── [categoria]/[producto]/page.tsx  # Ficha de producto
│   │   │   │   ├── colecciones/[slug]/page.tsx
│   │   │   │   ├── carrito/page.tsx
│   │   │   │   ├── pedido/[token]/page.tsx   # estado post-pago (no confirma nada)
│   │   │   │   ├── garantia/page.tsx · envios/ · preguntas/ · [pagina]/
│   │   │   │   └── cuenta/               # opcional, post-compra
│   │   ├── admin/                        # SIN locale; protegido (3 capas)
│   │   │   ├── layout.tsx                # verificación de rol en servidor
│   │   │   ├── page.tsx                  # Dashboard
│   │   │   ├── productos/ categorias/ colecciones/ inventario/ pedidos/
│   │   │   ├── clientes/ garantias/ descuentos/ finanzas/ analitica/ configuracion/
│   │   ├── api/
│   │   │   ├── checkout/route.ts         # crea checkout + reserva + sesión Stripe
│   │   │   ├── webhooks/stripe/route.ts  # única fuente de verdad del pago
│   │   │   └── newsletter/route.ts
│   │   ├── media/[...path]/route.ts      # proxy con caché de imágenes
│   │   ├── sitemap.ts · robots.ts
│   ├── components/
│   │   ├── tienda/                       # ProductCard, Gallery, CartDrawer, …
│   │   ├── admin/                        # DataTable, PriceCalculator, …
│   │   └── ui/                           # shadcn (solo lo usa el panel)
│   ├── server/                           # SOLO servidor ('server-only')
│   │   ├── supabase/ (server.ts, admin.ts)
│   │   ├── stripe/ (client.ts, webhook-handlers.ts)
│   │   ├── checkout/ (pricing-engine.ts, create-session.ts)
│   │   ├── shipping/ (provider.ts → manual.ts, usps.ts, ups.ts)   # interfaz de proveedor
│   │   ├── security/ (turnstile.ts, rate-limit.ts, origin.ts)
│   │   └── repositories/                 # consultas tipadas por dominio
│   ├── lib/                              # puro, sin React, compartible
│   │   ├── money.ts                      # centavos, formato USD
│   │   ├── pricing/calculator.ts         # calculadora de precio (pura + tests)
│   │   ├── validation/                   # esquemas zod
│   │   └── i18n/
│   ├── messages/es.json (+ en.json después)
│   └── middleware.ts                     # sesión, locale, protección /admin
├── supabase/
│   ├── migrations/                       # ✅ ya escritas y probadas
│   ├── tests/                            # ✅ pruebas SQL de inventario + RLS
│   └── seed.sql                          # ✅ categorías y garantías iniciales
├── tests/ (unit con Vitest · e2e con Playwright)
├── docs/ (este documento y los demás)
├── wrangler.jsonc · open-next.config.ts
└── .env.example
```

## 6. Variables de entorno

Ver `dorata/.env.example`. Regla: lo que empieza con `NEXT_PUBLIC_` llega al navegador; todo lo
demás vive solo como *secret* del Worker en Cloudflare (`wrangler secret put`) y en `.dev.vars` local
(ignorado por git).

## 7. Plan de despliegue

| Entorno | Dónde | Datos |
|---|---|---|
| Local | `next dev` + Supabase CLI local (Docker) | Semilla |
| Preview | **Workers Builds**: cada push a una rama genera una URL de vista previa | Proyecto Supabase *staging* + Stripe **modo prueba** |
| Producción | `dorata18k.com` (rama `main`) | Proyecto Supabase *prod* + Stripe **modo real** |

Pasos (fase 7, con checklist):
1. Dominio `dorata18k.com` en Cloudflare (DNS proxied, SSL Full Strict, HSTS).
2. Repo en GitHub → Cloudflare Workers Builds conectado (deploy automático al hacer merge).
3. Migraciones con `supabase db push` desde CI (GitHub Action) — nunca a mano en producción.
4. Secrets cargados en Cloudflare; endpoint del webhook registrado en Stripe con su secreto.
5. Cloudflare Access sobre `/admin*`; Turnstile y reglas de rate limit/WAF activas.
6. Prueba de compra real de $1 con reembolso; prueba de checkout abandonado (reserva liberada).
7. Respaldo: Supabase Pro (backups diarios) antes de recibir pedidos reales.

**Costo mensual estimado al arrancar** (verificar precios vigentes al contratar):
Cloudflare $0–5 · Supabase $0 (pruebas) → $25 (Pro, recomendado al lanzar por backups y sin pausas) ·
Stripe solo comisión por venta · Resend $0 (hasta 3.000 correos/mes) · dominio ~$10–12/año.
