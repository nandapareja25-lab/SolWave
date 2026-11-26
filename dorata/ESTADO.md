# ESTADO — D'ORATA (tienda online propia)
Última actualización: 2026-11-26 | Fase actual: 3 — Panel administrativo (casi completo)

⏸️ CHECKPOINT — Última acción: factura DLJ-1202 importada (41 piezas en borrador con costo real), sets cadena+dije
asignables desde el panel, ronda 6 de ajustes visuales del panel, Worker de Cloudflare alineado (mafer-studio, sin D1).
Siguiente acción exacta: cerrar revisión visual → despliegue Cloudflare (falta token válido o 2 ajustes de la dueña en el
panel de Cloudflare) → Fase 4 (Stripe, impuestos, envíos).
Decisión de la dueña: no agregar funciones fuera del alcance hasta cerrar estas tareas.

## Qué es (3 líneas)
Tienda online propia de accesorios en oro laminado 18K, marca D'ORATA (empresa legal futura: Mafer Studio LLC).
Mercado: EE. UU., español (inglés después), USD, móvil primero. Venta web + manual (IG/TikTok/WhatsApp/persona).
Stack: Next.js 15 en Cloudflare Workers (OpenNext) · Supabase · Stripe Checkout (fase 4). Panel privado (fase 3).

## Infraestructura real
- Supabase: proyecto "dorata" (ref rsjbhvlfqlpqethplawp, us-east-1, org Quotronex). Migraciones 1–10 aplicadas
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
- [~] 3 · Panel: acceso con contraseña + verificación en dos pasos (TOTP) y roles · Dashboard · Configuración
        (modo de tienda con apertura programada, contacto/redes/empaque, tasa COP, barra de anuncios con vista previa,
        envíos, garantías, políticas versionadas) · Categorías · Productos · Inventario. Falta: Colecciones.
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

## Catálogo real (factura DLUJO Joyería DLJ-1202, 25-nov-2026) — supabase/imports/2026-11-26_factura_DLJ-1202.sql
- Importado SOLO lo terminado, todo en BORRADOR y sin precio de venta (lo define la dueña). Costo = total neto / unidades
  (incluye IVA 19% y 50% de descuento), en COP, tasa a USD PENDIENTE (no se inventa; al guardar la tasa en Configuración
  se convierten solos los costos pendientes). Proveedor creado. Piezas terminadas ≈ $1.292.500 COP; insumos ≈ $1.247.500.
- Aretes 13 (incluye set candongas 2 pares → marcado "revisar"), Pulsera 1 ("P tipo trébol 18+5 cm" → "revisar"),
  2 sets ya armados por el proveedor (San Benito, Guadalupe → "revisar"), 13 cadenas sueltas = 13 sets "cadena + dije por
  asignar" (⚠ la dueña habló de 12; la factura suma 13: 1+3 caracol, 3 cubanita, 3 cart 3x1, 3 singapur), 12 dijes en la
  categoría oculta "Dijes" reservados para sets (no se venden solos).
- NO importado (insumos): balines, neoprenos, bolas de neopreno, herrajes (ítems 1-13, 19-25).
- Material vacío a propósito (la factura no dice "oro laminado 18K"): confirmar con la dueña.
- Visibles en la tienda: solo Pulseras, Cadenas y Aretes.
- Sets: products.kit_role (set_base/set_component) + set_pendant_product_id; la BD impide publicar un set sin dije, vender
  un dije solo o usar un dije en dos sets. Pendiente fase 5: al vender un set, descontar también el dije.

## Despliegue Cloudflare — sin D1
- La tienda NO usa D1: todo dato vive en Supabase; el código no usa env.DB. wrangler.jsonc sin d1_databases
  (verificado con `wrangler deploy --dry-run`: solo ASSETS + 3 variables públicas).
- Error 10181 (binding DB "mafer-studio-db" con id 0000…): viene de una configuración de Cloudflare ajena al repo
  (root directory vacío o rama main sin la tienda → Cloudflare genera su propio wrangler). Pasos en docs/08.
  La cuenta tiene 1 Worker ("mafer-studio") y 0 bases D1 (verificado con el conector). wrangler.jsonc ahora usa
  name = "mafer-studio" para no crear otro Worker.
  ⚠ Pendiente: en Cloudflare › mafer-studio › Settings › Build: Root directory = dorata y rama de producción con la tienda.
  El token guardado para api.cloudflare.com es inválido ("Invalid API Token"): la dueña puede crear uno nuevo
  ("Edit Cloudflare Workers") y volver a cargarlo, o hacer esos 2 ajustes ella misma.

## Revisión visual del panel (gate 36/40 · 16/20) — ronda 3
Config 31·15 · Banner 31·15 · Categorías 30·14 · Editor categoría 32·15 · Productos 32·14 · Editor producto 31·15 ·
Inventario 33·15 · Colecciones 31·15. NO SUPERADO todavía (subió desde 24-28·10-12). Pendientes ronda 4: fecha en
español dentro del campo (selector propio), guardar por pestaña en Configuración, categorías sin flechas en la fila
(modo "Ordenar"), monograma compartido, tipo "Ajuste deshecho" en inventario, chips de una fila.

## Panel — decisiones técnicas (fase 3)
- Rutas /admin/* con su propio layout; middleware exige sesión; has_role exige aal2 (MFA) en la BD.
- Escrituras por funciones seguras (admin_save_campaign, admin_upsert_category/product, media, adjust_inventory)
  o tablas con RLS por rol. Costos y márgenes solo admin/dueña (staff no los ve).
- Patrones compartidos: ActionForm/SaveBar con aviso de cambios sin guardar (beforeunload + enlaces), Ctrl/Cmd+S,
  Card plegable, DateTimeField (fecha en español + zona en palabras), CountUp, loading/error por sección.
- Prohibido <form> dentro de <form> (rompe hidratación): mini-formularios usan collectFields().
- Fotos: WebP 400/800/1600 en el navegador → Storage → admin_register_media; al borrar se limpian archivos.
- Usuario QA (qa-admin@dorata.test, rol owner) y producto de prueba "Cadena Singapur" (SKUs QA-…) en la base real:
  BORRAR antes del lanzamiento. Token de vista previa local solo en .env.local (no es el de producción).

## Problemas conocidos
- Mantenimiento responde 200 + noindex (no 503); aceptable, revisar en fase 7.
- CSP con nonce pendiente (fase 7). Rate limit en memoria por instancia; en producción se suma regla WAF.
