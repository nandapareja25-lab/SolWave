# D'ORATA — Esquema de base de datos

> Fuente de verdad: `supabase/migrations/*.sql` (aplicadas y probadas en PostgreSQL 16 local:
> 58 tablas, 58 con RLS, 12/12 pruebas de inventario y permisos — `supabase/tests/`).

## Principios

1. **Dinero en centavos enteros (USD).** Costos de proveedor en COP con la tasa usada guardada al lado.
2. **Precio y stock viven en la variante.** Todo producto tiene al menos una (la "Única").
3. **Snapshots en pedidos.** Si mañana renombras un producto o cambias su precio/costo/garantía, los pedidos viejos no cambian.
4. **Lo privado, en tablas aparte.** Costos, márgenes, notas internas: RLS protege filas, no columnas.
5. **Nada se hardcodea.** Categorías, garantías, envíos, descuentos, tasas y políticas son filas editables.
6. **Multi-idioma desde el día 1.** Textos visibles en `*_translations (locale)`. Hoy `es`; `en` se agrega sin migrar datos.
7. **Historial inmutable** para inventario y auditoría (triggers que impiden editar/borrar).

## Mapa por dominio

```
CONFIGURACIÓN      store_settings (pública) · business_settings (privada: tasa, márgenes, fees)
                   exchange_rates (historial de tasas COP/USD)
CONTENIDO          pages + page_translations (garantía, envíos, privacidad…) · faq_items(+t)
                   testimonials (solo publicados con consentimiento) · newsletter_subscribers
GARANTÍAS          warranty_policies(+t)  ← categories.default · products.override · order_items.snapshot
CATÁLOGO           categories(+t, auto_rule new/sale) · collections(+t) · products(+t)
                   product_categories · product_collections · product_variants(+t)
                   product_media · slug_redirects (301 al cambiar URLs)
COSTOS (privado)   suppliers · variant_costs (COP/USD + envío intl + empaque + otros → costo real)
PRICING (privado)  pricing_segments (rango de mercado) · market_references (competidores)
                   price_recommendations (lo que sugirió la calculadora y lo que tú aplicaste)
INVENTARIO         inventory_levels (on_hand, reserved) · inventory_reservations
                   inventory_movements (libro inmutable) · checkouts
CLIENTES           customers (invitado o con cuenta) · customer_addresses · customer_notes (privado)
PEDIDOS            orders · order_items · order_item_costs (privado) · order_events (historial)
                   payments · refunds · shipments · discount_redemptions · stripe_events
ENVÍOS             shipping_methods(+t) — provider 'manual' hoy; 'usps'/'ups' mañana
DESCUENTOS         discounts · discount_categories · discount_products
GARANTÍA POSVENTA  warranty_claims · warranty_claim_photos · warranty_claim_events
CERTIFICADOS       authenticity_certificates · certificate_items (máx. 3 joyas por tarjeta)
FINANZAS           expense_categories · expenses (USD o COP con tasa)
SEGURIDAD          user_roles (owner/admin/staff) · admin_audit_log (inmutable)
```

## Tablas clave (campos que responden a tus requisitos)

### Producto (§5)
| Requisito | Dónde |
|---|---|
| Nombre, descripción corta/completa, SEO, URL | `product_translations` (name, short_description, description_md, slug, seo_*) |
| SKU, precio, precio comparativo, peso, stock mínimo | `product_variants` (sku, price_cents, compare_at_cents, weight_grams, low_stock_threshold) |
| Variantes (hilo negro/rojo/azul/rosado) | `product_variants.title` + `options` (`{"Color de hilo":"Rojo"}`) |
| Categoría + colecciones | `products.primary_category_id` (define la URL) + `product_categories` + `product_collections` |
| Fotos múltiples, video | `product_media` (kind image/video, position, alt por idioma) |
| Material, medidas, color, tags, info de envío | `products` (material, measurements, color, tags[], shipping_notes) |
| Destacado / Nuevo / Oferta / Estado | `products` (is_featured, is_new + new_until, is_on_sale, status draft/active/archived) |
| Garantía correspondiente | `products.warranty_policy_id` (si es null, hereda de la categoría) |
| Costo | `variant_costs` (privado, con historial) |

### Costo real por pieza (§7)
`variant_costs`: `original_currency` (COP/USD), `original_amount` (80000), `fx_cop_per_usd` (la tasa que **tú** usaste),
`intl_shipping_cents`, `packaging_cents`, `other_cents` → la base calcula sola
`product_cost_usd_cents` y `total_unit_cost_cents`. Al registrar un costo nuevo, el anterior queda en historial.
La tasa vigente por defecto se edita en `business_settings.cop_per_usd` y cada cambio queda en `exchange_rates`.

### Pedidos (§10–11)
`orders`: número legible (`DOR-1001`, prefijo editable), canal (`web/instagram/tiktok/whatsapp/in_person/other`),
estado del pedido (pendiente → pagado → preparando → enviado → entregado / cancelado / reembolsado) **y**
estado de pago por separado, montos (subtotal, descuento, impuestos, envío, total — con verificación aritmética
en la base), dirección como snapshot, método de pago (Stripe o etiqueta manual que tú defines: Zelle, efectivo…).
`order_item_costs` congela el costo en el momento de la venta → el costo de mercancía vendida es exacto aunque cambie la tasa después.

### Garantías y certificado (§14–16)
- Cada `order_item` guarda `warranty_months`, `warranty_starts_on`, `warranty_ends_on` al pagar.
- Buscar por número de orden → ves cliente, fecha, piezas, garantía vigente y su historial.
- `warranty_claims`: solicitud, motivo, descripción, fotos (bucket privado), `piece_is_complete`
  (la base **impide aprobar** una pieza incompleta), decisión, resolución (reemplazo/reparación/reembolso),
  pieza de reemplazo (descuenta inventario como `warranty_replacement`), notas internas, historial.
- `authenticity_certificates` + `certificate_items`: fecha, nombre, hasta 3 joyas con precio y garantía, número de orden.
  Un pedido con 5 piezas genera 2 tarjetas.

## Funciones (la única forma de mover stock)

| Función | Quién la llama | Qué hace |
|---|---|---|
| `reserve_stock(checkout, items, expira)` | servidor al iniciar pago | Bloquea filas, verifica disponible, reserva todo o nada. Error `INSUFFICIENT_STOCK`. |
| `release_reservations(checkout)` | webhook de pago fallido / sesión expirada | Devuelve lo reservado. |
| `release_expired_reservations()` | **pg_cron cada 5 min** | Red de seguridad para carritos abandonados. |
| `consume_stock_for_order(pedido, checkout?)` | webhook de pago exitoso · pedido manual | Descuenta definitivo + movimiento `sale`. Si el pago llegó tarde y ya no hay stock → `stock_conflict` y el pedido queda marcado para revisión (nunca stock negativo). |
| `adjust_inventory(variante, tipo, delta, motivo)` | panel (staff+) | Reposición, conteo, devolución, cancelación, corrección manual (exige motivo). Ventas NO entran por aquí. |
| `variant_availability(ids[])` | tienda (público) | "Disponible" / "Últimas piezas" sin revelar cifras exactas. |

## Pruebas ejecutadas (PostgreSQL 16, 25-nov-2026)

```
OK 1  costo COP 80,000 @ 4,000 + empaque $1.50 → $21.50
OK 3  segundo carrito bloqueado: no hay sobreventa
OK 4  reserva vencida liberada sin tocar el stock físico
OK 5  pago confirmado descuenta stock y deja movimiento
OK 6  pago tardío sin stock → pedido marcado, stock nunca negativo
OK 7  venta manual (Instagram) descuenta inventario igual
OK 8  historial de movimientos no se puede editar
OK 9  visitante: solo catálogo público (sin costos, pedidos, clientes ni márgenes)
OK 10 staff: opera sin ver costos ni finanzas
OK 11 owner ve todo; un cliente no puede auto-asignarse rol
OK 12 certificado limitado a 3 joyas
```
