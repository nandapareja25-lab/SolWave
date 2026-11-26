# D'ORATA — Legal, cookies y privacidad (§33–45)

> ⚠️ **Esto NO es asesoría legal ni hace a la tienda "100 % compliant".** La plataforma trae la
> *infraestructura* para cumplir (textos editables y versionados, consentimiento registrado,
> solicitudes de privacidad, separación de marketing). Los **textos** y varias **decisiones**
> deben revisarse con un abogado en EE. UU. antes del lanzamiento. Lista al final.

## 1. Políticas editables y con historial (§33, §44)

| Página | URL | Tipo |
|---|---|---|
| Política de Privacidad | `/privacidad` | `privacy` |
| Política de Cookies | `/cookies` | `cookies` (incluye la tabla de cookies generada automáticamente) |
| Términos y Condiciones | `/terminos-y-condiciones` | `terms` |
| Términos de uso del sitio | `/terminos-de-uso` | `site_terms` |
| Envíos | `/envios` | `shipping` (+ tarifas en vivo desde Configuración › Envíos) |
| Cambios y Devoluciones | `/cambios-y-devoluciones` | `returns` |
| Reembolsos | `/reembolsos` | `refunds` |
| Garantía | `/garantia` | `warranty` (+ coberturas en vivo desde Configuración › Garantías) |
| Contacto comercial | `/contacto` | `contact` |

**Cómo funciona:**
1. Escribes el **borrador** en Configuración → Legal y Privacidad.
2. **Publicas una versión** (1.0, 1.1, 2.0…) con su fecha de vigencia y un resumen del cambio.
3. Una versión publicada **no se puede editar**: se publica otra. Cada versión guarda una huella digital (SHA-256) del texto exacto.
4. `policy_version_at(política, fecha)` responde **qué texto estaba vigente en una fecha dada** (probado).
5. Cada versión tiene estado de revisión legal: *borrador · requiere revisión legal · aprobada*. El panel muestra una alerta mientras haya políticas sin aprobar.
6. **Avisos por estado / país**: la misma página puede tener variantes por jurisdicción (`US-CA`, `US-CO`, `EU`…). Así se agregan derechos estatales o ventas internacionales sin rehacer nada.

Configuración → Legal y Privacidad también guarda: razón social, nombre comercial, correo de privacidad, dirección comercial, plazo de respuesta a solicitudes y plazo de conservación de consentimientos.

Las 9 páginas quedaron creadas como **borradores con estructura**. No escribí texto legal inventado; cada una dice `[REQUIERE REVISIÓN LEGAL]`.

## 2. Banner de cookies y centro de preferencias (§34–35)

- **Primera visita:** aviso con **"Aceptar todas"** y **"Rechazar no esenciales"** del mismo tamaño (sin trucos), más **"Configurar"**, que abre 4 categorías:
  - Esenciales: siempre activas.
  - Analíticas, Marketing y Personalización: apagadas por defecto.
- **"Preferencias de privacidad"** en el footer reabre el panel en cualquier momento. Retirar el consentimiento es tan fácil como darlo.
- **Nada no esencial se carga antes de que el cliente diga que sí.** Los scripts de Google/Meta/TikTok no están en el HTML: un cargador los inyecta solo si la categoría correspondiente está aceptada **y** la integración está encendida en el panel. Google usa *Consent Mode v2* con todo "denegado" por defecto.
- **Señal GPC** (Global Privacy Control, la opción "no vender mis datos" del navegador): se respeta automáticamente como rechazo de marketing. Lo exigen leyes como la de California.
- **Registro mínimo** de cada decisión (`cookie_consent_records`, inmutable):
  - Un identificador técnico aleatorio guardado en la cookie `dorata_consent`.
  - La acción, las categorías, la versión de la política, si hubo GPC, la región aproximada y la fecha.
  - **No se guarda** IP, email ni navegador.
  - Se purga sola tras el plazo configurado (24 meses por defecto, ⚠ a confirmar).
- **Tabla de cookies:** se genera desde `cookie_declarations`. Al encender una integración se declaran sus cookies.

## 3. Analítica y píxeles (§39)

| Integración | Categoría | Estado inicial |
|---|---|---|
| Google Analytics 4 | Analíticas | Apagada, sin ID |
| Meta Pixel | Marketing | Apagada, sin ID |
| TikTok Pixel | Marketing | Apagada, sin ID |
| Otras | La que elijas | — |

Se encienden en Configuración → Integraciones pegando el ID **público** (G-XXXX, ID del píxel). Las claves de servidor (por ejemplo, Conversions API de Meta) van como secretos en Cloudflare, nunca en la base. Sin integraciones activas, la tienda usa solo Cloudflare Web Analytics, que no usa cookies.

## 4. Minimización de datos y uso (§36, §40, §43)

- **Datos que se piden:**
  - En el checkout: nombre, email, teléfono (opcional; ⚠ decidir si es obligatorio para envíos) y dirección de envío.
  - Nada de fecha de nacimiento, género ni documento.
- **Tarjetas:** nunca tocan D'ORATA. Se escriben en la página de Stripe; la tienda solo recibe el resultado del pago.
- **Logs:** un registrador central **tacha automáticamente** emails, teléfonos, direcciones, tokens, cabeceras `Authorization`/`Cookie` y cuerpos de webhooks. Está prohibido `console.log` de objetos de pedido o cliente (regla en la revisión de código).
- **Conexión cifrada (HTTPS) obligatoria** en todo el sitio, con aviso al navegador para usar siempre conexión segura (HSTS). Secretos solo en variables seguras de Cloudflare.
- **No se venden datos.** Usar píxeles de publicidad puede contar como "compartir" bajo algunas leyes estatales (⚠ revisión legal). Por eso Marketing va apagado por defecto y se respeta GPC.
- **Menores:** la tienda no está dirigida a niños y no tiene funciones que pidan su edad o datos. La Política de Privacidad lo declara (sección prevista en el borrador).

## 5. Solicitudes de privacidad (§37)

- **Formulario público** `/privacidad/solicitud`, protegido contra bots (Turnstile) y con límite de intentos:
  - Tipo: acceso, corrección, eliminación, exportación, dejar de recibir marketing, no vender/compartir, limitar uso, otro.
  - Email, nombre, estado de residencia y detalle.
- **Verificación:** enlace al email registrado antes de entregar o borrar nada.
- **En Panel → Privacidad**, cada solicitud queda numerada con:
  - Fecha de recepción y **fecha límite automática** (45 días por defecto, ⚠ revisar).
  - Estado: recibida → verificando → en proceso → completada / denegada / retirada.
  - Resolución (obligatoria para cerrar), notas internas e historial.
- **Exportación:** genera un JSON con los datos de esa persona (cliente, direcciones, pedidos, garantías, suscripciones).
- **Eliminación "cuando corresponda":** `anonymize_customer()` (probado).
  - **Borra:** nombre, email, teléfono, Instagram, direcciones, notas y suscripciones.
  - **Conserva:** montos, fechas, productos y estado/país de cada venta, por obligaciones fiscales.
  - El certificado queda como "Cliente anonimizado". Solo admin/dueña puede ejecutarla.

## 6. Email: transaccional ≠ marketing (§38)

| | Transaccionales | Promocionales |
|---|---|---|
| Qué | Pedido, pago, envío, entrega, garantía, soporte | Ofertas, novedades, lanzamientos, descuentos |
| Base legal | Necesarios para cumplir la compra | **Consentimiento propio** |
| Quién los recibe | Todo comprador | Solo `marketing_subscriptions.status = 'subscribed'` |
| Remitente | `pedidos@dorata18k.com` | `novedades@dorata18k.com` (otro subdominio: no ensucia la entrega de los transaccionales) |
| Darse de baja | No aplica | Enlace en **cada** correo + cabecera de baja en un clic (`List-Unsubscribe`) → `opt_out` registrado |

Comprar **no** suscribe a nadie. Cada alta o baja queda en `marketing_consent_events` (origen y versión de la política).

## 7. Políticas en el checkout (§41)

- Antes de pagar, el carrito muestra enlaces a Términos, Privacidad, Envíos, Devoluciones y Garantía.
- En Stripe Checkout se activa la **aceptación de Términos** (`consent_collection.terms_of_service = required`), con enlace a la versión vigente. Al confirmarse el pago, el webhook guarda en `policy_acceptances` **qué versión exacta** aceptó (probado el esquema).
- **Marketing:** casilla **desmarcada** (`consent_collection.promotions = auto` de Stripe o la propia). Nunca premarcada.

## 8. Footer legal (§42)

D'ORATA · Oro Laminado 18K · Contacto · Privacidad · Cookies · Términos · Envíos · Devoluciones · Reembolsos · Garantía · **Preferencias de privacidad** · redes sociales · `© {año actual} D'ORATA. Todos los derechos reservados.` (año dinámico; ver maqueta).

## 9. ⚠️ Para revisar con un abogado ANTES de lanzar

1. Texto de las 9 políticas (están en borrador).
2. Qué leyes estatales de privacidad aplican según volumen y estados de clientes (California CCPA/CPRA, Colorado, Virginia, Connecticut, Texas, Oregón, Florida…). Si hace falta el enlace "No vender ni compartir mi información personal" y su aviso.
3. Si los píxeles de Meta/TikTok cuentan como "compartir" y cómo se presenta.
4. Plazo de respuesta a solicitudes (45 días configurado) y de conservación de consentimientos (24 meses).
5. Banner de cookies: en EE. UU. muchas leyes piden poder *excluirse* (opt-out), no consentimiento previo. La tienda usa el modelo más estricto (todo apagado hasta aceptar). El abogado puede confirmar si conviene relajarlo por región para no perder analítica.
6. Términos de venta: devoluciones, reembolsos, garantía (alineada con la ley federal de garantías, Magnuson-Moss) e impuestos sobre ventas (Stripe Tax).
7. Datos de Mafer Studio LLC cuando exista (razón social, dirección, estado de registro).
8. Correos de marketing: requisitos de la ley CAN-SPAM (dirección física en cada correo promocional).
9. Ventas internacionales futuras (UE/RGPD): la estructura por región ya lo permite, pero requiere textos y una base legal propios.
