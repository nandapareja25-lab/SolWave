# CLAIMS-LEDGER — Solwave

> Cada promesa pública debe tener capacidad real, plan/límite y evidencia.
> Un claim sin evidencia = NO APTO para lanzar.

## Estado: PRE-BACKEND (prototipo HTML)
Las columnas de "evidencia real" se completan en Sesión 5 (Supabase + Hotmart).

---

| Promesa pública (landing) | Capacidad implementada | Plan/límite | Evidencia | Estado |
|---|---|---|---|---|
| "Música 100% original, creada con IA" | Música generada con Minimax, subida a Supabase Storage | Incluida en todos los planes | Pendiente: URLs reales en Supabase Storage | ⏳ Pendiente Sesión 5 |
| "9 territorios emocionales" | 9 colecciones definidas en app.html y explorar | Sin límite de colecciones | app.html: Sunrise, Caribbean, Golden, Focus, Midnight, Love, Coffee, Island, Sunset | ✅ Implementado |
| "80+ tracks originales" | Datos semilla en app.html (5 tracks en Home + tracks por colección) | Sin límite de tracks | Pendiente: tracks reales en Supabase Storage | ⏳ Pendiente Sesión 5 |
| "100% música creada con IA" | Proceso: Minimax → revisión humana → Supabase | N/A (no es función de la app) | Pendiente: primeros tracks generados | ⏳ Pendiente contenido |
| "De abrir a escuchar en <10s" | App carga en <2s, selección en 1 tap, play inmediato | N/A | app.html: navegación directa, sin pantallas de carga intermedias | ✅ Implementado |
| "Prueba gratis 7 días" | Trial de 7 días via Hotmart | 7 días, sin tarjeta requerida | Pendiente: configuración del producto en Hotmart | ⏳ Pendiente Sesión 5 |
| "Cancela cuando quieras" | Hotmart gestiona cancelaciones | N/A | Pendiente: política de cancelación en Hotmart | ⏳ Pendiente Sesión 5 |
| "Sin tarjeta para el trial" | Hotmart soporta trial sin tarjeta | Trial gratis 7d | Pendiente: configuración Hotmart | ⏳ Pendiente Sesión 5 |
| Precio $9.90/mes o $79/año | Mostrado en paywall (onboarding.html) | Mensual y anual | onboarding.html: sección paywall con precios | ✅ Implementado en UI |
| Onboarding personalizado | 6 pantallas: 4 preguntas → loading → paywall | N/A | onboarding.html: flujo completo funcional | ✅ Implementado |

---

## Claims que NO están en la landing (no prometer sin implementar)

- ❌ No se promete descarga offline (no implementado)
- ❌ No se promete recomendaciones con IA en tiempo real (no implementado)
- ❌ No se prometen playlists ilimitadas personalizadas (las colecciones son fijas)
- ❌ No se promete multi-dispositivo sincronizado (pendiente backend)

---

## Responsable de verificación pre-lanzamiento

- [ ] María Fernanda revisa cada fila ✅/⏳ antes de abrir tráfico pagado
- [ ] Hotmart configurado con producto real + webhook + hottok
- [ ] Supabase Storage con tracks reales, RLS activo
- [ ] Trial de 7 días probado end-to-end (compra → acceso → cancelación)
