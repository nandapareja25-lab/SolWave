# DECISIONS — Solwave

> Registro cronológico de decisiones importantes. Incluye qué se decidió, por qué, y qué se descartó.

---

## Agosto 2026

### Pivote fundacional: sello discográfico vs. app de productividad
**Decisión:** Solwave es un sello discográfico digital — no una app de productividad ni una plataforma de streaming genérica.
**Por qué:** El producto original era una app de bienestar/productividad. El pivote surgió de reconocer que la artista ya tiene música propia y la oportunidad real es crear un sello con identidad editorial única — con música creada para emociones específicas, sin la memoria de otra persona.
**Descartado:** App de productividad/bienestar con música de terceros.

---

### El álbum como unidad, no la canción
**Decisión:** La unidad de experiencia en Solwave es el álbum conceptual, no la canción suelta ni la playlist.
**Por qué:** Las playlists de Spotify mezclan emociones incompatibles. Los álbumes conceptuales permiten construir una narrativa emocional completa — cada canción es un capítulo de la misma experiencia.
**Descartado:** Sistema de playlists generadas algorítmicamente.

---

### Pipeline editorial basado en audio real
**Decisión:** Los campos editoriales (moment, sintiendo, intención) nacen del audio real de cada canción — no de su título ni de suposiciones.
**Por qué:** Al principio se intentó escribir editoriales desde los títulos de las canciones. La artista señaló que los títulos eran provisionales y que el contenido editorial sin escuchar la letra sería inventado. Pipeline correcto: Audio → Whisper (transcripción) → librosa (análisis acústico) → borrador editorial → revisión humana.
**Descartado:** Editoriales escritos desde títulos o descripciones de álbum.

---

### Whisper local (no API)
**Decisión:** Instalar `openai-whisper` localmente (modelo `small`) en vez de usar la API de OpenAI.
**Por qué:** Costo cero para el pipeline actual. Escalable para cientos o miles de canciones futuras sin costo incremental.
**Descartado:** API de OpenAI Whisper (costosa a escala).

---

### Ignorar archivos .mov completamente
**Decisión:** El pipeline de análisis solo procesa archivos .mp3. Los .mov se ignoran.
**Por qué:** Los videos no forman parte del proceso editorial de audio. El análisis acústico (BPM, tonalidad, transcripción) solo aplica al audio puro.

---

### Schema con campos nulos vs. contenido hardcodeado
**Decisión:** El CATALOG del app usa `track()` helper que crea objetos con todos los campos en `null` hasta que se completen editorialmente.
**Por qué:** El contenido editorial no debe vivir en el código — debe ser datos. Este schema mapea directamente a la tabla Supabase que se creará en Sesión 5.
**Descartado:** Hardcodear moment/sintiendo/intención directamente en el código JS.

---

### No mostrar placeholder cuando moment = null
**Decisión:** Si `moment` está vacío, el tracklist no muestra texto alternativo ni placeholder.
**Por qué:** Los tags genéricos usados como placeholder no aportan valor editorial y degradan la experiencia. Mejor no mostrar nada.
**Descartado:** Usar tags como fallback visual cuando moment = null.

---

### Estándar editorial: escenas vs. resúmenes emocionales
**Decisión:** El `moment` debe ser una escena extremadamente específica que provoque reconocimiento inmediato ("eso me pasó a mí") — no un resumen de la emoción de la canción.
**Por qué:** Los primeros borradores describían lo que la canción "hace" o "es para". El estándar correcto es identificar la situación exacta de vida para la que esa canción existe.
**Descartado:** Frases como "para cuando decides soltar", "cuando entiendes que mereces más".

---

### Nuevo campo: recognition
**Decisión:** Agregar campo `recognition` — una sola frase que golpea, compartible, que puede vivir fuera de Solwave.
**Por qué:** Este campo es el activo más shareable del catálogo. Puede ser portada de Instagram, puede citarse en redes, puede ser la identidad visual de Solwave. No describe — golpea.

---

### Nuevo campo: searchPhrases con dos niveles
**Decisión:** El campo de búsqueda se divide en `searchPhrases` (frases reales de búsqueda) y `semanticTags` (categorías estructuradas para IA/buscador semántico).
**Por qué:** Los dos tienen funciones distintas. Las searchPhrases conectan al oyente cuando busca ayuda en lenguaje natural. Los semanticTags categorizan para el buscador semántico con contexto más rico (etapa del proceso, tipo de relación, comportamiento, identidad).

---

### Sin mapeo al catálogo sin confirmar con la artista
**Decisión:** Los campos `album_probable` y `track_probable` en los JSON se dejan vacíos hasta confirmar con la artista. No se hacen suposiciones.
**Por qué:** Los nombres de los archivos MP3 no siempre coinciden con los títulos del catálogo. Asignar sin confirmar crea errores que son difíciles de corregir después.

---

### No avanzar con Hotmart/pagos todavía
**Decisión:** La integración de Hotmart (ventas, webhook, suscripciones) queda para Sesión 5 — después de que el catálogo y la experiencia principal estén definidos.
**Por qué:** La artista priorizó definir bien el catálogo y el sistema editorial antes de configurar el flujo de ventas.

---

### Sistema de documentación persistente en /docs/
**Decisión:** Todos los documentos del proyecto viven en `/docs/` y se actualizan en cada sesión. La carpeta del proyecto es la fuente oficial de verdad — no el chat.
**Por qué:** El contexto del chat se pierde entre sesiones. Un nuevo chat de Claude debe poder abrir la carpeta y continuar el proyecto sin perder contexto.
