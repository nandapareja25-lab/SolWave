# ESTADO — D'ORATA (tienda online propia)
Última actualización: 2026-11-26 | Fase actual: 2 — Supabase real conectado (falta despliegue en Cloudflare con cuentas de la dueña)

⏸️ CHECKPOINT — Última acción: Fase 2 base lista — Supabase "dorata" con 8 migraciones + seed, tienda leyendo la
base real, funciones de administración probadas, fotos (WebP en navegador), build Cloudflare OK.
Siguiente acción exacta: la dueña crea cuenta Cloudflare + dominio + secretos (docs/08) → verificar Próximamente
en vivo → Fase 3 (panel: modo de tienda, banner, productos con subida de fotos).

## Qué es (3 líneas)
Tienda online propia de accesorios en oro laminado 18K, marca D'ORATA (empresa legal futura: Mafer Studio LLC).
Mercado: EE. UU., español (inglés después), USD, móvil primero. Venta web + manual (IG/TikTok/WhatsApp/persona).
Stack: Next.js 15 en Cloudflare Workers (OpenNext) · Supabase · Stripe Checkout (fase 4). Panel privado (fase 3).

## Infraestructura real
- Supabase: proyecto "dorata" (ref rsjbhvlfqlpqethplawp, us-east-1, org Quotronex). Migraciones 1–8 aplicadas
  vía MCP; seed aplicado; newsletter_enabled=true; redes @dorata18k (⚠ confirmar que existen las cuentas).
- Modo actual en la base: coming_soon. Banner de lanzamiento activo (countdown 2-dic 00:00 NY → "ya disponible").
- Entorno de trabajo "dorata" (cloud) con acceso a rsjbhvlfqlpqethplawp.supabase.co. Node necesita
  NODE_USE_ENV_PROXY=1 en este entorno (solo desarrollo).
- ⚠ En el entorno "Default" quedó guardada una credencial inválida para api.supabase.com (no era token sbp_):
  la dueña puede borrarla en Configuración del entorno → Network secrets.
- Cloudflare: pendiente cuenta/dominio/secretos de la dueña (guía docs/08-DESPLIEGUE-CLOUDFLARE.md).

## Ubicación en el repo
`dorata/` dentro del repo SolWave (la raíz es otro proyecto: Solwave). Recomendado: repo propio antes de la fase 7.
⚠ GitHub: push bloqueado (403, falta permiso de la app de Claude en el repo). Commits locales en la rama
`claude/dorata-ecommerce-platform-qu0ubx`; reintentar push en cada hito.

## Decisiones confirmadas por la dueña
- Dirección visual: mezcla A+B (hero oscuro B, luego marfil/crema, categorías circulares A, alternar oscuro/claro).
- Zona horaria oficial: America/New_York. Lanzamiento: 2-dic-2026.
- Banner: "✦ LANZAMIENTO D'ORATA · 02.12.26 · MUY PRONTO ✦" + "Faltan {countdown}" → a las 00:00 NY del 2-dic
  cambia solo a "✦ D'ORATA YA ESTÁ DISPONIBLE · COMPRA AHORA ✦" (sin fecha fin; ella lo reemplaza en el panel).
- Estado de tienda controlable sin código: Próximamente / Tienda activa / Mantenimiento (+ apertura programable live_at).
  Arranca en Próximamente. Si el 2-dic está lista y probada → Tienda activa; si no → sigue Próximamente.

## Decisiones técnicas (detalle en docs/01-ARQUITECTURA.md y docs/07-FASE-1.md)
- Next.js 15.5 App Router + TS estricto + Tailwind v4 + next-intl (es sin prefijo) + OpenNext/Workers.
- Supabase: 70 tablas con RLS, funciones de inventario, banner (current_announcement), modo (effective_store_mode),
  políticas versionadas, consentimiento, privacidad, subscribe_marketing. Pruebas: 23/23.
- Fase 1 usa repositorio con fuente DEMO (mismas firmas); banner, modo, versión de cookies e integraciones ya leen
  Supabase cuando hay variables. Fase 2 reemplaza catálogo/ajustes/políticas por Supabase.
- Middleware: modo de tienda (caché 30 s) + vista previa privada `?vista_previa=TOKEN` (hash, cookie httpOnly 12 h).
- htmlLimitedBots=/.*/ para que 404/308 sean reales (sin streaming de metadatos). Sin loading.tsx a nivel de grupo.
- Tienda sin librerías de animación (CSS); nunca ocultar contenido con animación de scroll.
- Íconos: Lucide + íconos propios de redes (Lucide v1 no trae marcas).
- Radios: 4px contenedores · píldora botones/chips/inputs/círculos. Escala tipográfica 56/36/32/28/20/15/13/12.

## Dirección de arte
- FICHA-ARTE.md: aprobada (A+B). Par: Bodoni Moda + Manrope. Dispositivo: filete dorado doble + anillo dorado.
- Registro anti-repetición: Solwave usó Playfair + DM Sans (vetadas). D'ORATA: Bodoni Moda + Manrope.

## Avatar
- FICHA-AVATAR.md: BORRADOR pendiente de aprobación (campos [validar]).

## Fases
- [x] 0 · Definición: arquitectura, esquema BD, flujos, propuesta visual, banner, legal/privacidad
- [x] 1 · Base: scaffold, tokens, layout, navegación, banner, cookies, footer legal, home, catálogo, producto,
        carrito local, Próximamente/Mantenimiento, lista de espera (revisión visual: ver abajo)
- [x] 2 · Supabase real: base, repositorio, admin RPCs (categorías/productos/fotos), garantías por componente,
        políticas públicas, lista de espera (función), fotos WebP, preparación Cloudflare.
        Pendiente de fase 2: búsqueda en la tienda; verificación en vivo tras el despliegue.
- [ ] 3 · Panel administrativo (primero: interruptor de modo de tienda y editor del banner)
- [ ] 4 · Carrito → Stripe Checkout, impuestos, envíos
- [ ] 5 · Pedidos, clientes, garantías, certificados, emails, solicitudes de privacidad
- [ ] 6 · Finanzas, calculadora de precio, estudio de mercado, analítica
- [ ] 7 · SEO completo, auditoría de seguridad (27/61), testing e2e, deploy, lanzamiento

## Revisión visual (subagente revisor-visual, gate ≥36/40 y ≥16/20)
- Ronda 1: home 27/40·11/20·copy 11/20 · Próximamente 29/40·12/20 · producto 28/40·13/20 → corregidos radios,
  primera vista, copy con dolor, WhatsApp falso, foto por variante, deshacer, garantía sin salida, escala tipográfica.
- Ronda 2: Próximamente 32/40·14/20 · producto 29/40·14/20 · home invalidada por .reveal (contenido oculto) → quitado.
- Ronda 3: home 29/40·13/20·copy 14/20 · Próximamente 33/40·15/20·copy 14/20 · producto 33/40·15/20.
  Después se aplicaron sus últimos ajustes (1 acción en hero, filete en hero, cards alineadas, entrada suave sin
  ocultar, subtítulo corto, garantía sin definir como línea simple, variante agotada no seleccionable) — NO
  re-puntuados. GATE NO SUPERADO. Lo que falta según el revisor depende sobre todo de la dueña: fotos reales,
  datos de envío/devoluciones, beneficio de la lista de espera, garantía de pulseras de hilo/sets, fecha del
  banner; y búsqueda (fase 2).
- ⚠ La regla de radios de FICHA-ARTE.md (4px contenedores · píldora en botones/chips/inputs) se precisó durante la
  revisión: pendiente de que la dueña la confirme.

## Pendiente / preguntas para la dueña
- Número de WhatsApp (sin él no se muestra el botón), correo de contacto, Facebook si existe; confirmar @dorata18k.
- Logo oficial (SVG/PNG) y fotos reales de producto.
- Envíos: tarifas, plazos, umbral de envío gratis; política de devoluciones (para la línea de confianza y checkout).
- ¿Beneficio por unirse a la lista de espera? (acceso anticipado / precio fundadora) — no se inventa.
- Fecha "02.12.26": en EE. UU. puede leerse 12 de febrero. Sugerencia: "2 DE DICIEMBRE". Editable en el panel.
- Garantía de pulseras de hilo con balines y de los sets (hoy sin garantía asignada).
- ¿Las piezas se envían en estuche? (se quitó esa afirmación hasta confirmarlo).
- Aprobar FICHA-AVATAR.md. Revisión legal (docs/05 §9). Cuenta Stripe (fase 4). Dominio en Cloudflare (fase 7).
- Antes del 2-dic: crear proyecto Supabase, aplicar migraciones, desplegar en Cloudflare (sin esto, Próximamente
  y la lista de espera no están en internet).

## Problemas conocidos
- Mantenimiento responde 200 + noindex (no 503); aceptable, revisar en fase 7.
- CSP con nonce pendiente (fase 7). Rate limit en memoria por instancia; en producción se suma regla WAF.
