# SESSION STATE — Solwave

> Estado exacto del proyecto al cerrar esta sesión.
> Un nuevo chat debe leer este archivo primero, luego EDITORIAL_SYSTEM.md, luego CATALOG_STATUS.md.

---

## Fecha de cierre: agosto 2026

---

## DECISIÓN DEFINITIVA — agosto 2026

La Constitución Editorial de Solwave está **congelada**. No se modifica.

`docs/EDITORIAL_GUIDE.md` — 13 capítulos, aprobado por la artista.

**Regla de catálogo:** ninguna canción entra al catálogo hasta que pase todas las pruebas de la Constitución. 20 canciones extraordinarias antes que 200 canciones buenas.

**Flujo a partir de ahora:**
1. ✅ Constitución Editorial — CONGELADA (una adición quirúrgica: prueba de la frase sola en Recognition)
2. ✅ Ya No Vuelvo Atrás — APROBADA (`editorial/ya-no-vuelvo-atras.md`)
3. ✅ Hoy Elijo Paz — APROBADA (`editorial/hoy-elijo-paz.md`)
4. ✅ Todavía Hay Camino — APROBADA (`editorial/todavia-hay-camino.md`)
5. ✅ Volví a Sonreír — BORRADOR AUTÓNOMO (`editorial/volvi-a-sonreir.md`)
6. ✅ 15 canciones restantes — BORRADORES AUTÓNOMOS ESCRITOS (ver lista abajo)
7. ⏸ No Tengo Que Saberlo Todo — DIFERIDA (territorio demasiado cercano a Hoy Elijo Paz)
8. → PENDIENTE: Revisión global por la artista de los 16 borradores autónomos
9. → Después de aprobación: mapear MP3s al catálogo y pasar campos al JSON

## BORRADORES AUTÓNOMOS ESCRITOS — PENDIENTES DE REVISIÓN

| Archivo | Recognition | Nota |
|---|---|---|
| `editorial/volvi-a-sonreir.md` | Sanaste sin fecha, sin decisión, sin que nadie te avisara | |
| `editorial/mi-ritmo-tambien-cuenta.md` | El sol no pregunta cuándo salió. Simplemente vuelve a existir | |
| `editorial/me-encontre-primero.md` | Nunca fui perderte. Fui encontrarme primero | |
| `editorial/si-me-escuchas-manana.md` | Lo que hoy parece una demora, mañana será libertad | |
| `editorial/siempre-vuelvo-a-mi.md` | No es que no caigas. Es que siempre encuentras el camino de regreso a ti | |
| `editorial/volvi-a-mi.md` | Esta es mi vida. Nadie la va a escribir por mí | |
| `editorial/a-mi-tiempo.md` | No llego tarde. Solo llego cuando debo llegar | |
| `editorial/todo-florece-cuando-llega-su-tiempo.md` | Nada se pierde. Todo está creciendo alrededor, aunque todavía no lo veas | |
| `editorial/un-paso-mas.md` | Hoy me regalo tranquilidad. Eso también es avanzar | |
| `editorial/hoy-es-un-nuevo-comienzo.md` | No hace falta mirar atrás. La mañana siempre estuvo esperando que la dejaras entrar | |
| `editorial/hoy-todo-comienza.md` | No importa lo que pasó. Hoy vuelvo a empezar desde aquí | |
| `editorial/respiro-y-confio.md` | Cerré los ojos — yo, que siempre necesité ver para creer — y sentí que lo mejor ya viene | |
| `editorial/ya-puedes-descansar.md` | Lo que sembraste te sigue. La vida también trabaja en silencio | ⚠️ Título dudoso: coro dice "Todo empieza hoy" |
| `editorial/me-elegi.md` | El milagro nunca estuvo afuera. Siempre vivía dentro de mi corazón | |
| `editorial/hoy-me-elijo.md` | Había algo distinto en esa mirada. Alguien que por fin decidió volver, sin pedir permiso | |
| `editorial/volvi-a-elegirme.md` | No es grandioso. Es simple. Es mi verdad. Y ya puedo descansar | |

**Frase reservada para futura canción:**
> "No te perdiste. Te fuiste apagando tan despacio que no te diste cuenta."
Territorio: el apagarse gradual — distinto al reencuentro de Todavía Hay Camino.

**Territorios ya protegidos (no reutilizar):**
- Ya No Vuelvo Atrás → la primera mañana donde el cuerpo descubre que el peso desapareció
- Hoy Elijo Paz → la mañana donde quedarse quieta por fin no duele
- Todavía Hay Camino → el reencuentro con una versión propia, en movimiento, sin buscarlo

---

## Qué estaba haciendo Claude en esta sesión

Construyendo y refinando el **sistema editorial de Solwave** — el mecanismo que conecta cada canción con el momento exacto de vida del oyente.

**El trabajo central de esta sesión:**
1. Corregir la arquitectura del catálogo (de hardcodeado a schema dinámico con campos nulos)
2. Cargar los 65 títulos definitivos del catálogo
3. Construir el pipeline de audio: Whisper local + librosa → JSON editorial
4. Analizar los 20 MP3s disponibles
5. Escribir y refinar el estándar editorial iterativamente con la artista
6. Crear el sistema de documentación persistente en `/docs/`

---

## El estándar editorial vigente

El estándar fue refinado en múltiples iteraciones durante esta sesión. La versión final está en `docs/EDITORIAL_SYSTEM.md`. Resumen ejecutivo:

**Schema de cada canción:**
- `moment` — escena extremadamente específica (8-12 seg). Reconocimiento inmediato. No poético por poético.
- `sintiendo` — diálogo interno que nadie escucha. Comprensión profunda.
- `intencion` — "Existe para ___." La misión de esa canción. No la describe.
- `recognition` — Una frase que golpea. Shareable. Vive sola. El campo más importante.
- `searchPhrases` — Frases reales de búsqueda (Google/YouTube, 11pm, buscando ayuda).
- `semanticTags` — Categorías estructuradas: emoción + etapa + contexto + comportamiento + identidad.

**La prueba editorial:** ¿Esto podría haberlo escrito alguien que realmente sobrevivió ese momento?

**Regla central:** Si el texto puede servir para diez canciones diferentes, no sirve para ninguna.

---

## Las 3 canciones piloto del nuevo estándar

Estas 3 canciones fueron trabajadas al nuevo estándar editorial y están PENDIENTES DE APROBACIÓN por la artista:

1. **Ya No Vuelvo Atrás** (ya-no-vuelvo-atra-s.json) — empoderamiento post-ruptura
2. **Hoy Elijo Paz** (hoy-elijo-paz.json) — soltar el control
3. **Todavía Hay Camino** (todavi-a-hay-camino.json) — incertidumbre en movimiento

Los editoriales de estas 3 canciones están **en el chat de esta sesión** pero aún no han sido escritos en los JSONs con el nuevo schema (recognition + searchPhrases separado de semanticTags). Escribirlos en los JSONs es el primer paso del siguiente chat.

---

## Archivos del pipeline editorial

```
scripts/
  analyze_track.py         → pipeline de audio (Whisper + librosa)
  write_editorial.py       → aplica borradores al schema viejo (20 canciones)
  editorial/               → 20 JSONs con análisis completo
    _index.json
    [slug].json            → perfil por canción (20 archivos)

revision-editorial.html    → documento de revisión visual (generado)
```

**Estado de los 20 JSONs:** tienen borradores del estándar ANTERIOR (sin `recognition`, sin separación `searchPhrases`/`semanticTags`). Deben actualizarse al nuevo schema antes de aprobarse.

---

## Qué debe hacer el siguiente chat al abrir el proyecto

### Paso 1 — Leer estos archivos en este orden:
```
docs/SESSION_STATE.md      (este archivo — ya lo estás leyendo)
docs/EDITORIAL_SYSTEM.md   (el estándar vigente completo)
docs/CATALOG_STATUS.md     (qué está hecho, qué falta)
ESTADO.md                  (memoria técnica del proyecto)
FICHA-ARTE.md              (identidad visual — cosa juzgada)
FICHA-AVATAR.md            (avatar Valentina — cosa juzgada)
```

### Paso 2 — Verificar el estado de aprobación de las 3 canciones piloto
Preguntar a la artista: ¿Aprueba los editoriales de Ya No Vuelvo Atrás, Hoy Elijo Paz, y Todavía Hay Camino?

### Paso 3 — Si están aprobados:
Actualizar los 3 JSONs con el nuevo schema (agregar `recognition`, separar `searchPhrases` de `semanticTags`), luego continuar con las 17 canciones restantes.

### Paso 4 — Si se pide ajuste:
Ajustar según el feedback, documentar la decisión en `docs/DECISIONS.md`, y luego continuar.

### Paso 5 — Después de aprobar todas las editoriales de los 20 MP3s:
Confirmar con la artista el mapeo MP3 → track del catálogo (ver CATALOG_STATUS.md), luego actualizar app.html CATALOG con los campos editoriales.

---

## Decisiones pendientes que requieren respuesta de la artista

1. **Aprobación del estándar editorial** — ¿Las 3 canciones piloto son la dirección correcta?
2. **Mapeo de MP3s al catálogo** — confirmar qué archivo corresponde a qué track (ver CATALOG_STATUS.md)
3. **`Ya Puedes Descansar.mp3`** — ⚠️ el coro dice "Todo empieza hoy" — ¿es "Hoy empieza todo" (Álbum 4, track 11)?

---

## Configuración técnica del entorno

```
Python 3 con:  openai-whisper, librosa, numpy, ffprobe
Música local:  /Users/mariafernandapareja/Desktop/SOLWAVES MUSIC/ (20 MP3s)
Pipeline:      scripts/analyze_track.py --all
Editorial:     scripts/write_editorial.py
```

Para analizar un nuevo MP3:
```bash
python3 scripts/analyze_track.py "/ruta/al/archivo.mp3"
```

Para aplicar borradores editoriales:
```bash
python3 scripts/write_editorial.py
```
