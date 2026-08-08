# PRIVACY-DATA-MAP — Solwave

> Mapa de datos personales: qué se recopila, para qué, base legal, retención y cómo borrarlos.
> Requerido por LGPD (Brasil), Ley 1581 (Colombia), LPDP y estándares LATAM.

## Estado: PRE-BACKEND
Se actualiza en Sesión 5 cuando Supabase y Hotmart estén conectados.

---

| Dato | Dónde se almacena | Finalidad | Base legal | Retención | Acceso/borrado |
|---|---|---|---|---|---|
| Email | Supabase Auth | Autenticación, comunicaciones | Contrato (acceso a servicio) | Mientras exista la cuenta + 30 días tras cierre | Botón "Eliminar cuenta" en Perfil → borrado lógico en 48h |
| Nombre (opcional) | Supabase `profiles` | Personalización (ej. "Buenas tardes, Sofía") | Consentimiento | Mientras exista la cuenta | Mismo flujo de borrado |
| Selecciones de onboarding | Supabase `profiles.preferences` | Personalización de colecciones | Contrato | Mientras exista la cuenta | Se borran con la cuenta |
| Estado de suscripción | Supabase `subscriptions` (ledger Hotmart) | Control de acceso al servicio | Contrato | 5 años (obligación fiscal) | No se borra; se anonimiza al cerrar cuenta |
| Historial de reproducción | Supabase `play_history` | "Escuchados reciente" en Home | Contrato | 90 días de historial activo | Borrable desde Perfil → Configuración → Borrar historial |
| Favoritos | Supabase `favorites` | Lista de tracks guardados | Contrato | Mientras exista la cuenta | Se borran con la cuenta |
| Datos de pago | Hotmart (no llegan a Solwave) | Procesamiento de pago | Contrato | Gestionado por Hotmart | Contactar Hotmart directamente |
| IP / logs de acceso | Vercel Edge Logs | Seguridad, anti-abuso | Interés legítimo | 30 días automático (Vercel) | No accesible por el usuario (uso interno) |

---

## Derechos del usuario (implementar en Sesión 5)

- **Ver sus datos**: exportar desde Perfil → Configuración → "Exportar mis datos" (JSON)
- **Corregirlos**: editar nombre desde Perfil → Configuración
- **Borrarlos**: Perfil → Configuración → "Eliminar mi cuenta" (soft-delete, borrado completo en 48h)
- **Portabilidad**: export en JSON desde la misma pantalla

## Cookies y tracking

- Sin cookies de terceros
- Sin Facebook Pixel, Google Analytics ni similares en v1
- Sin fingerprinting
- Analytics: Vercel Analytics (sin PII, solo pageviews agregados)

## Páginas del footer (pendiente Sesión 5)

- [ ] `/privacidad` — Política de privacidad completa
- [ ] `/terminos` — Términos y condiciones + política de reembolso
- [ ] `/cookies` — Política de cookies (mínima: solo esenciales)
