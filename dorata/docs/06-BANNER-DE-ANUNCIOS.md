# D'ORATA — Banner de anuncios (§46)

**Maqueta funcional:** `dorata/prototipos/banner-y-privacidad.html` · captura `docs/capturas/banner-y-privacidad.png`
**Base de datos:** migración `…05_announcements_legal_privacy.sql` · pruebas `supabase/tests/announcements_legal_privacy_test.sql` (A1–A4 ✅)

## Modelo: campañas con mensajes

| Concepto | Qué es | Ejemplo |
|---|---|---|
| **Campaña** | Un periodo programado con su estilo, movimiento, prioridad y (opcional) contador | "Lanzamiento", 25-nov → 2-dic 11:59 p. m., negro, marquee |
| **Mensajes** | 1 o varios textos dentro de la campaña (rotan o desfilan) | "✨ Lanzamiento 2 de diciembre" · "Envíos disponibles en USA" · "Oro Laminado 18K" |
| **Prioridad** | Si dos campañas se cruzan en el tiempo, gana la de número mayor | Envío gratis (20) le gana a Lanzamiento (10) ese fin de semana |

Nada de esto está escrito en el código. La campaña de lanzamiento quedó creada **apagada** con tus fechas; la enciendes en el panel.

## Lo que configuras en Configuración → Banner de anuncios

| Campo | Opciones |
|---|---|
| Estado | Activo / inactivo (interruptor) |
| Mensajes | Texto (máx. 140 caracteres), enlace opcional y texto del enlace por mensaje; arrastrar para ordenar |
| Inicio / fin | Fecha y hora + **zona horaria** (por defecto la del negocio, editable). Fin vacío = sin fin |
| Estilo | Dorado · Crema · Blanco · Negro · Personalizado (fondo + texto; el panel **bloquea** combinaciones con contraste menor a 4.5:1) |
| Movimiento | Estático · Marquee continuo · Rotación |
| Velocidad | Marquee: píxeles por segundo (10–200, recomendado 30–50) · Rotación: segundos por mensaje (2–60) |
| Repetir | En bucle, o detenerse en el último mensaje |
| Cuenta regresiva | Fecha objetivo · texto con `{countdown}` ("D'ORATA llega en {countdown}") · al llegar a cero: **ocultar** o **cambiar a otro mensaje** (con su enlace) |
| Prioridad / orden | Número; la lista del panel muestra la línea de tiempo de campañas futuras |
| Vista previa | Móvil (375 px) y escritorio, simulando cualquier fecha ("¿cómo se verá el 1 de diciembre a las 9 p. m.?") — usa la misma función que la tienda |

## Cómo decide qué mostrar

`current_announcement(idioma, ahora)` en la base (probado):
1. Toma campañas activas cuyo periodo incluye *ahora*.
2. Descarta las que tienen contador vencido con comportamiento "ocultar".
3. Gana la de mayor prioridad; si no tiene textos, pasa a la siguiente.
4. Devuelve los mensajes, el estilo y `next_change_at`: el próximo instante en que algo cambia (fin, contador a cero, inicio de otra campaña más prioritaria).
5. Si no hay nada → devuelve vacío y **el banner no existe en la página**: el menú queda arriba, sin hueco.

El público **no puede leer la lista de campañas**: así no se filtra un lanzamiento futuro antes de tiempo.

## Zonas horarias

- Las fechas se guardan como un **instante único** (UTC). El panel las muestra y edita en la zona elegida.
- Ejemplo probado: el fin "2-dic 11:59 p. m. Nueva York" es el mismo instante para todo el país. En California el banner desaparece a las 8:59 p. m. hora local.
- Zona horaria del negocio: **Configuración → General** (valor inicial `America/New_York`, ⚠ confírmalo).

## En la tienda (Fase 1)

- El servidor pinta el banner ya en el HTML (cero salto al cargar). La página se refresca cada 60 s y al instante cuando guardas en el panel.
- En el navegador, un temporizador programado a `next_change_at` cierra el banner con una transición de 240 ms. La altura llega a 0 y no queda hueco. Si cambia de mensaje (contador en cero), lo hace sin recargar.
- La altura es de 36 px y el texto de 12 px en mayúsculas espaciadas, legible a 375 px. El contador usa números de ancho fijo para que no "baile".
- **Accesibilidad:**
  - Botón de **pausa** visible (norma WCAG 2.2.2 para todo lo que se mueve más de 5 s).
  - Pausa al pasar el mouse o con el foco.
  - Los mensajes que rotan no se anuncian en bucle al lector de pantalla.
- **Reducir movimiento** (`prefers-reduced-motion`): el banner queda **estático** con el primer mensaje y el contador sigue actualizando sus números. Probado.
- Sin librerías: CSS + ~2 KB de JavaScript.
