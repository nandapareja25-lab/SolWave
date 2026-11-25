# ESTADO — D'ORATA (tienda online propia)
Última actualización: 2026-11-25 | Fase actual: 0 — Definición (arquitectura + propuesta visual)

⏸️ CHECKPOINT — Última acción: arquitectura, esquema SQL probado (12/12), flujos y comparativa visual A/B/C
entregados. / Siguiente acción exacta: que la dueña elija A, B, C o una combinación → llenar FICHA-ARTE.md
→ arrancar FASE 1 (scaffold Next.js + Cloudflare, layout, navegación, home con datos semilla).

## Qué es (3 líneas)
Tienda online propia de accesorios en oro laminado 18K, marca D'ORATA (empresa legal futura: Mafer Studio LLC).
Mercado: EE. UU., español (inglés después), USD, móvil primero. Venta web + manual (IG/TikTok/WhatsApp/persona).
Stack: Next.js en Cloudflare Workers · Supabase · Stripe Checkout. Panel privado tipo "mini Shopify".

## Ubicación en el repo
Vive en `dorata/` dentro del repo SolWave para no tocar el proyecto Solwave (raíz). Recomendado: moverlo a
un repo propio (`dorata18k`) antes de la FASE 7 (deploy). El ESTADO/FICHAS de la raíz son de Solwave.

## Adaptación de la Secuencia Maestra del SO (ecommerce, no SaaS)
Landing → onboarding → paywall → login NO aplica literal. Equivalente: Home (venta) → Categoría/Ficha →
Carrito → Checkout Stripe → Confirmación → (cuenta opcional) · y el Panel admin en paralelo.

## Decisiones técnicas (cosa juzgada — detalle en docs/01-ARQUITECTURA.md)
- Next.js 15 App Router + TS estricto, desplegado con @opennextjs/cloudflare en Workers; ISR con caché R2.
- Supabase: Postgres + RLS en 58/58 tablas, Auth (admin con MFA obligatorio), Storage, pg_cron.
- Admin en /admin con 3 capas: Cloudflare Access + Supabase Auth MFA + rol en BD (owner/admin/staff) + RLS.
- Dinero en centavos USD; costos COP con tasa guardada; snapshots de precio/costo/garantía en pedidos.
- Inventario solo vía funciones SQL (reserva atómica, libro inmutable). Reserva 35 min (Stripe expira a 30).
- Pago confirmado SOLO por webhook firmado + idempotencia (stripe_events).
- i18n: next-intl `as-needed` (es sin prefijo) + tablas *_translations. UI mono-idioma español hoy.
- Imágenes: redimensionado en el navegador del admin (WebP 400/800/1600) + proxy /media con caché CF.
- Tienda sin librerías de animación (CSS + View Transitions); shadcn/Recharts solo en /admin.
- "Nuevos" y "Ofertas" = categorías automáticas (auto_rule) por flags del producto.
- Envíos: proveedor 'manual' hoy; interfaz lista para USPS/UPS/Shippo.

## Dirección de arte
- FICHA-ARTE.md: PENDIENTE (se llena al elegir). Comparativa: `dorata/direcciones-abc.html`.
- Contrato de marca (del brief): marfil/blanco/crema + dorado + negro secundario; serif elegante; corona;
  "ORO LAMINADO 18K"; sin "Joyería", sin corazones, sin degradados exagerados.
- Opciones: A Vitrina marfil (Cormorant+Jost) · B Estuche negro (Bodoni Moda+Manrope) · C Arco boutique (Marcellus+Figtree).
- Registro anti-repetición: Solwave usó Playfair Display + DM Sans → vetadas aquí.
- Logo de la maqueta es PROVISIONAL: falta el archivo oficial de la dueña.

## Avatar
- FICHA-AVATAR.md: BORRADOR, pendiente de aprobación (derivado solo del brief; campos [validar]).

## Fases
- [x] 0 · Definición: arquitectura, esquema BD (migraciones + seed + tests), flujos, propuesta visual
- [ ] 1 · Base: scaffold, tokens de la dirección elegida, layout, navegación, home con semilla
- [ ] 2 · BD conectada, catálogo, producto, inventario
- [ ] 3 · Panel administrativo
- [ ] 4 · Carrito, Stripe (finalize_paid_checkout en SQL), impuestos, envíos
- [ ] 5 · Pedidos, clientes, garantías, certificados, emails
- [ ] 6 · Finanzas, calculadora de precio, estudio de mercado, analítica
- [ ] 7 · SEO, auditoría de seguridad (27/61), testing, deploy, lanzamiento

## Pendiente / preguntas para la dueña
- Elegir dirección visual (A/B/C/combinar).
- Archivo oficial del logo (SVG o PNG grande) y fotos reales de producto.
- Aprobar o corregir FICHA-AVATAR.md.
- (Fase 4) Tarifas y tiempos de envío; ¿activar código BIENVENIDA10?; cuenta de Stripe.
- (Fase 7) Comprar/conectar dorata18k.com en Cloudflare; Supabase Pro antes del lanzamiento.

## Problemas conocidos
- Ninguno en código (aún no hay app). El dev server/tsc/build se verifican desde la FASE 1.
- La comparativa visual NO pasó por el subagente revisor-visual: es propuesta de dirección, no pantalla
  terminada. El revisor puntuará la home real en la FASE 1.
