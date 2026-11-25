# ESTADO — D'ORATA (tienda online propia)
Última actualización: 2026-11-25 | Fase actual: 0 — Definición (arquitectura + propuesta visual)

⏸️ CHECKPOINT — Última acción: añadidos banner de anuncios (§46) y legal/privacidad (§33–45): esquema
(70 tablas, 20/20 pruebas), maqueta funcional y docs 05/06. / Siguiente acción exacta: que la dueña elija A, B, C o una combinación → llenar FICHA-ARTE.md
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
- Banner: campañas (prioridad, periodo UTC + zona de edición) con mensajes; current_announcement() decide;
  público no lee campañas. SSR + revalidate 60s + temporizador a next_change_at. Pausa WCAG 2.2.2.
- Legal: borradores en page_translations → publicar crea page_versions inmutables (SHA-256, estado de
  revisión legal). Variantes por región (region_code) para leyes estatales / internacional.
- Cookies: modelo estricto (no esenciales OFF hasta aceptar), GPC = rechazo de marketing, registro mínimo
  sin IP. Píxeles GA4/Meta/TikTok vía tracking_integrations (apagados), cargador condicionado al consentimiento.
- Marketing separado: marketing_subscriptions + ledger; comprar NO suscribe. Remitentes distintos.
- Eliminación de datos = anonymize_customer() (conserva registro fiscal).

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
- [ ] 1 · Base: scaffold, tokens de la dirección elegida, layout, navegación, home con semilla,
        banner de anuncios, aviso de cookies + preferencias, footer legal
- [ ] 2 · BD conectada, catálogo, producto, inventario
- [ ] 3 · Panel administrativo (incl. Banner de anuncios, Legal y Privacidad, Integraciones)
- [ ] 4 · Carrito, Stripe (finalize_paid_checkout en SQL), impuestos, envíos
- [ ] 5 · Pedidos, clientes, garantías, certificados, emails (transaccional/marketing), solicitudes de privacidad
- [ ] 6 · Finanzas, calculadora de precio, estudio de mercado, analítica
- [ ] 7 · SEO, auditoría de seguridad (27/61), testing, deploy, lanzamiento

## Pendiente / preguntas para la dueña
- Elegir dirección visual (A/B/C/combinar).
- Archivo oficial del logo (SVG o PNG grande) y fotos reales de producto.
- Aprobar o corregir FICHA-AVATAR.md.
- (Fase 4) Tarifas y tiempos de envío; ¿activar código BIENVENIDA10?; cuenta de Stripe.
- (Fase 7) Comprar/conectar dorata18k.com en Cloudflare; Supabase Pro antes del lanzamiento.
- Confirmar zona horaria del negocio (valor inicial America/New_York).
- Revisión legal: lista de 9 puntos en docs/05-LEGAL-Y-PRIVACIDAD.md §9 (políticas en borrador).
- ⚠ Fecha de lanzamiento 2-dic-2026 vs. plan por fases: la tienda completa no estará lista en 7 días.
  Opción propuesta: página "próximamente" + lista de espera + banner con contador, y tienda completa después.

## Problemas conocidos
- Ninguno en código (aún no hay app). El dev server/tsc/build se verifican desde la FASE 1.
- La comparativa visual NO pasó por el subagente revisor-visual: es propuesta de dirección, no pantalla
  terminada. El revisor puntuará la home real en la FASE 1.
