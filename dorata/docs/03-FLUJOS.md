# D'ORATA — Flujos de tienda y administración

## 1. Flujo general (cliente)

```
Instagram / TikTok / WhatsApp / Google
            │
            ▼
   Home ──▶ Categoría (filtros) ──▶ Ficha de producto ──▶ Carrito (drawer)
     │            ▲                     │  fotos, variantes,        │
     └── Sets ────┘                     │  garantía visible,         ▼
                                        │  "Pregunta por WhatsApp"  Checkout (Stripe)
                                        ▼                            │
                                  Agregar al carrito                 ▼
                                                        Página "Recibimos tu pedido"
                                                        (consulta estado; el webhook confirma)
                                                                     │
                                                                     ▼
                                                Email de confirmación → (opcional) crear cuenta
```

- **Sin cuenta obligatoria.** Checkout como invitado; después se ofrece crear cuenta con el mismo email
  (magic link) para ver pedidos, certificados y garantías.
- El **carrito** vive en el navegador (localStorage) con solo `variant_id` + cantidad; precios siempre del servidor.
- Botón de **WhatsApp** flotante y en la ficha, con mensaje prellenado ("Hola, me interesa {producto} {SKU}").

## 2. Flujo de checkout

```
[Carrito] "Pagar"
   │  Turnstile + rate limit
   ▼
POST /api/checkout  (servidor)
   1. Valida items con zod; recalcula precio, descuento y envío DESDE LA BASE
   2. Crea fila en `checkouts` (status open, expires_at = ahora + 35 min)
   3. reserve_stock() ──✗ sin stock → vuelve al carrito: "Quedan 0 de Hilo rojo. ¿Lo cambiamos?"
   4. Crea Stripe Checkout Session:
        mode=payment · currency=usd · line_items con price_data (precio del servidor)
        shipping_options (métodos activos) · automatic_tax si stripe_tax_enabled
        expires_at = 30 min · metadata.checkout_id · idempotency key = checkout_id
        phone_number_collection · shipping_address_collection: US
   5. Redirige a Stripe (tarjeta, Apple Pay, Google Pay, Link)
   ▼
Webhook /api/webhooks/stripe  (firma verificada; evento registrado en stripe_events)
   ├─ checkout.session.completed (paid) ──▶ finalize_paid_checkout():
   │       upsert cliente → pedido + items + costos congelados + garantía por pieza
   │       → consume_stock_for_order() → redención del descuento → evento "pagado"
   │       → email de confirmación
   ├─ checkout.session.async_payment_succeeded ─▶ igual que arriba
   ├─ checkout.session.async_payment_failed ───▶ release_reservations(); checkout=failed
   ├─ checkout.session.expired ────────────────▶ release_reservations(); checkout=expired
   ├─ charge.refunded ─────────────────────────▶ refunds + estado reembolsado/parcial
   └─ (red de seguridad) pg_cron libera reservas vencidas cada 5 min
```

**Regla de oro:** la página de éxito NUNCA crea ni confirma pedidos. Solo muestra "Estamos confirmando tu
pago…" hasta que el webhook lo marque pagado.

## 3. Flujo de inventario

```
        disponible = on_hand − reserved

Reposición/ajuste (panel) ──adjust_inventory──▶ on_hand ±  ──▶ movimiento (restock/adjustment/…)
Inicio de pago ────────────reserve_stock──────▶ reserved +
Pago exitoso ──────consume_stock_for_order────▶ on_hand −, reserved − ──▶ movimiento "sale"
Pago fallido / abandono ──release_reservations▶ reserved −  (on_hand intacto)
Venta manual (IG/WhatsApp) consume_stock_for_order (sin reserva) ──▶ movimiento "sale"
Cancelación / devolución ──adjust_inventory (cancellation/return)──▶ on_hand +
Reemplazo por garantía ───adjust_inventory (warranty_replacement)──▶ on_hand −
```
Alertas: `v_inventory_status.is_low` cuando disponible ≤ stock mínimo (de la variante o el global).

## 4. Flujo de venta manual (Instagram, TikTok, WhatsApp, en persona)

```
Panel › Pedidos › "Nuevo pedido manual"
  1. Canal (Instagram/TikTok/WhatsApp/En persona/Otro)
  2. Cliente: buscar por nombre/email/teléfono o crear (Instagram @usuario opcional)
  3. Productos + variantes (muestra disponible en vivo) · descuento manual o código
  4. Envío (método o "entrega en persona") · método de pago (tu lista: Zelle, efectivo…)
  5. Estado: "Pagado" → descuenta stock ya · "Pendiente de pago" → reserva hasta que marques pagado
  6. Se genera número DOR-xxxx, certificado(s) y queda en el historial del cliente
```

## 5. Flujo de garantías

```
Cliente escribe (WhatsApp/email/formulario con Turnstile) con su número de orden
   ▼
Panel › Garantías › Buscar "DOR-1042"
   → cliente, fecha, piezas, garantía de cada una con fecha de vencimiento (vigente / vencida)
   ▼
"Registrar solicitud" sobre la pieza
   motivo (color, ensamble, laminado, porosidad, otro) · descripción · fotos (privadas)
   ☐ La pieza llegó completa  ← obligatorio; incompleta = no se recibe (la base lo impide)
   ▼
En revisión → Decisión (aprobada/rechazada + nota)
   ▼
Resolución: reemplazo (elige variante → descuenta stock) · reparación · reembolso · ninguna
   ▼
Resuelta — todo con historial (warranty_claim_events) y auditoría
```
Las **políticas de garantía** (1 año / 5 años, qué cubre, qué no) se editan en Configuración › Garantías
y alimentan automáticamente: ficha de producto, página de garantía, FAQ y certificado.

## 6. Flujo del administrador (día a día)

```
Login (Cloudflare Access → email+clave → código MFA)
   ▼
Dashboard: ventas hoy/semana/mes · pedidos por preparar · ticket promedio · utilidad aprox.
           inventario bajo · más vendidos · ventas por categoría y canal
   ▼
Pedidos por preparar → marcar "preparando" → "enviado" (+ tracking) → "entregado"
Productos → crear/editar, fotos (arrastrar para ordenar), variantes, costo en COP,
           calculadora de precio → "Aplicar $59.99" (tú decides)
Inventario → reposición con costo del lote · historial por pieza
Finanzas → ingresos · costo de mercancía · ganancia bruta · gastos · ganancia estimada
           · valor del inventario — por semana/mes/año/categoría/producto
Configuración → marca, logo, colores, redes, WhatsApp, políticas, garantías, envíos, tasa COP/USD, márgenes
```

## 7. Calculadora de precio (fase 6, lógica definida hoy)

Entradas (todas editables): costo real por unidad (de `variant_costs`), comisión Stripe (% + fijo),
costos variables (%), margen mínimo/objetivo/premium, rango de mercado del segmento, redondeo (x.99).

```
precio_para_margen(m) = (costo_total + fee_fijo) / (1 − fee_% − variable_% − m)
mínimo      = precio_para_margen(margen_mínimo)
recomendado = max(precio_para_margen(margen_objetivo), percentil 50 del rango de mercado si posicionamiento=premium)
premium     = max(precio_para_margen(margen_premium), tope del rango de mercado)
margen real = (precio − costo_total − fees − variables) / precio
```
- Nunca recomienda por debajo del mínimo aunque el mercado sea más barato (y lo avisa).
- Nunca baja a "lo más barato del mercado": con posicionamiento premium ancla en la mitad alta del rango.
- **No cambia el precio**: muestra los 3 escenarios y un botón "Aplicar" que guarda tu decisión en `price_recommendations`.
- Ejemplo con tus números ($12 de costo, mercado $45–$85) se valida con tests cuando se construya.
