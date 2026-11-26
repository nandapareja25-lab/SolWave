# D'ORATA — Fase 1: base, diseño, navegación y estructura

Estado: **construida y verificada** (25-nov-2026). Código en `dorata/src/`.

## Qué incluye

| Pieza | Dónde | Notas |
|---|---|---|
| Banner de lanzamiento programable | `components/tienda/AnnouncementBar.tsx` | Lee `current_announcement()` (Supabase) o la demo idéntica. Marquee con velocidad en px/s, pausa accesible, contador que avanza solo, cambia a "YA ESTÁ DISPONIBLE" a las 00:00 del 2-dic (Nueva York) sin recargar, colapsa sin hueco al terminar, estático con "reducir movimiento". |
| Encabezado + menú móvil | `Header.tsx`, `HeaderActions.tsx`, `ui/Sheet.tsx` | `<dialog>` nativo: atrapa foco, Escape, devuelve foco. Categorías desde datos (no fijas). |
| Hero (B) | `app/[locale]/(tienda)/page.tsx` | Terciopelo + dorado, producto protagonista, CTA visible en la primera pantalla aunque esté el aviso de cookies. |
| Categorías circulares (A) | idem | Carrusel tipo historias con anillo dorado. |
| Secciones de productos | `ProductCard.tsx`, `QuickAdd.tsx` | Destacados (grilla) + Nuevos ingresos (carrusel). "+" agrega; con variantes lleva a elegir. |
| Garantía 1 / 5 años | page + `LegalView.tsx` | Sale de `warranty_policies` (editable). Página `/garantia` con qué cubre y qué no. |
| Sets, oro laminado 18K, beneficios | page | Alternancia oscuro/claro según la ficha. |
| Redes sociales | page, `Footer.tsx`, menú | @dorata18k (Instagram, TikTok). Facebook aparece al configurarlo. |
| Aviso de cookies + preferencias | `CookieConsent.tsx`, `api/consent` | 4 categorías, "Solo esenciales" = mismo peso que "Aceptar", GPC respetado, nada no esencial se carga antes. |
| Footer legal | `Footer.tsx` | Contacto, Envíos, Devoluciones, Reembolsos, Garantía, Privacidad, Cookies, Términos, Términos de uso, Preferencias de privacidad, redes, © año dinámico. |
| Catálogo, categoría, producto | `[slug]`, `[slug]/[producto]`, `tienda` | Filtros y orden en la URL, variantes con foto que sigue al color, 404 real, 308 a URL canónica, schema.org Product. |
| Carrito | `CartProvider.tsx`, `CartDrawer.tsx` | Local, con "Deshacer". El pago se habilita en la fase 4 (botón deshabilitado con explicación). |
| Próximamente / Tienda activa / Mantenimiento | `middleware.ts`, `lib/store-mode.ts`, `(sistema)/*` | Lee `effective_store_mode()` (Supabase): el modo se cambia desde el panel sin tocar código. Legales siempre visibles. Vista previa privada con `?vista_previa=TOKEN`. |
| Lista de espera / novedades | `NewsletterForm.tsx`, `api/newsletter`, `subscribe_marketing()` | Origen + misma URL, límite de intentos, trampa anti-bots, Turnstile cuando se configure, consentimiento registrado. |
| SEO base | `sitemap.ts`, `robots.ts`, metadata | Completo en la fase 7. |

## Cómo se decide el 2 de diciembre (sin tocar código)

1. Hoy la base arranca en **Próximamente** (`store_settings.store_mode = 'coming_soon'`).
2. Si la tienda está lista y probada: en el panel se pone **Tienda activa**, o se programa `live_at = 2-dic 00:00` para que abra sola.
3. Si no está lista: no se hace nada; sigue Próximamente con contador y lista de espera hasta activarla.
4. Mientras no exista el panel (fase 3), el mismo cambio se hace en Supabase → Table editor → `store_settings` (un campo, sin código).

## Verificación

- `tsc` ✓ · `eslint` ✓ (0 errores, 0 advertencias) · 22 pruebas unitarias ✓ · 23 pruebas SQL ✓ · `next build` ✓
- Servidor de producción: rutas 200/404/308 correctas; modos Próximamente y Mantenimiento; vista previa con token correcto ✓ y token falso ✗.
- Playwright a 375 px: sin scroll horizontal, contador avanza, cookies guardadas, carrito con variante y "Deshacer", reabrir preferencias desde el footer, "reducir movimiento" deja el banner quieto.
- Capturas: `docs/capturas/fase1/`.

## Pendiente para fases siguientes

- Fase 2: catálogo, ajustes y políticas desde Supabase (hoy: datos de demostración con las mismas firmas), búsqueda, fotos reales.
- Fase 3: panel (incluye el interruptor de modo de tienda y el editor del banner).
- Fase 4: checkout con Stripe (el botón "Finalizar compra" se habilita ahí).
