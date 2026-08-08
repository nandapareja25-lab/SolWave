# ESTADO — Solwave

## Resumen del proyecto
**Sello discográfico digital.** Crea y publica música original con letra y voz, organizada por álbumes conceptuales. Cada álbum representa una emoción, etapa o historia distinta. Los géneros abarcan bachata, salsa, dancehall, indie folk, regional romántico, pop — unidos por un hilo conductor: acompañar emociones reales. La unidad principal es el **álbum**, no la canción. Las canciones son capítulos de un álbum.

Tagline actualizado: *"Un sello para cada emoción que has vivido."*

## Álbumes del catálogo (v1)
| Álbum | Emoción central | Concepto |
|---|---|---|
| Llegaste muy tarde | Desamor tardío | Personas que no supieron valorar un amor hasta que fue demasiado tarde |
| Ya no vuelvo atrás | Empoderamiento | Volver a elegirse a una misma después de una relación que apagaba la identidad |
| Las pequeñas cosas | Gratitud / calma | Aprender a disfrutar los momentos cotidianos |
| Volví a escucharme | Crecimiento personal | Reencontrarse con uno mismo, autoestima |
| Desde que llegaste | Amor sano | Amor tranquilo, estable, sin drama ni toxicidad |
| Vuelvo a sentir la vida | Alegría / celebración | Recuperar la alegría, volver a sonreír |

## Fase actual
**SESIÓN 7 — 5 MEJORAS DE PRODUCTO COMPLETADAS.**

### Resumen de implementación (agosto 2026)
Todas las mejoras implementadas en `app.html` (single-file HTML/JS/CSS):

**Fase 1 ✅ — Recognition overlay en el player**
- Campo `recognition` en los 20 tracks reales (7º arg de `trackReal()`)
- Overlay aparece al 70% de duración (una vez por reproducción, flag `recognitionShown`)
- Overlay full-bleed sobre el player con texto, label track/álbum, botón compartir, botón cerrar
- `showRecognition()`, `closeRecognition()` funcionando

**Fase 2 ✅ — Tab "Mi momento" + pantalla cero**
- Tab "Historia" renombrado a "Mi momento" en la nav
- `h-idle` rediseñado: hero con mosaico de portadas de álbumes, overlay gradiente, pregunta central
- Pantalla cero: primer launch va directamente a screen-historia (flag `sw_has_opened`)
- `renderMomentoAlbumCards()` + `onHistoriaScreenEnter()` implementados

**Fase 3 ✅ — Arco narrativo de álbum + sistema pasajes**
- `arc: [{label, tracks:[]}]` en los 6 álbumes
- Player muestra "CAPÍTULO X DE Y · [SECCIÓN]" cuando `playingFullAlbum && album.arc`
- Tracklist muestra headers de sección (arc-section-header) antes de cada grupo de tracks
- Overlay de álbum completo (`showAlbumComplete()`, `closeAlbumComplete()`)

**Fase 4 ✅ — Sistema de pasajes completo**
- `sw_pasajes` + `sw_app_state` en localStorage
- Pre-activo → activo cuando: sessions >= 2 && tracksListened.length >= 3
- Chip "Llevas N días aquí" en cards del Home para álbumes con pasaje activo
- Return banner al regresar después de 3+ días (una vez por ausencia)
- Sesión = 4h de gap entre aperturas

**Fase 5 ✅ — Share bottom sheet (3 tipos de card)**
- Bottom sheet con tipo (Reconocimiento / Mi momento / Inspirada por) + formato (9:16 / 1:1)
- `openShareSheet(albumId, trackNum)`: puebla pills según contenido disponible del track
- `generateCard(albumId, trackNum, type, format)`: Canvas API 1080×1920 o 1080×1080, fondo dark con glow del color del álbum, tipografía Playfair + DM Sans, marca Solwave
- Web Share API con fallback a descarga directa
- `shareRecognition()` ahora abre el sheet en vez de compartir directamente
- Eliminadas funciones duplicadas (vieja `generateRecognitionCard`, vieja `shareRecognition`)

### Auditoría end-to-end (agosto 2026)
- ✅ 0 errores de consola al cargar
- ✅ 20/20 checks de función y elemento presentes
- ✅ Canvas genera a 1080×1920 correctamente
- ✅ Share sheet abre con pills correctas según track
- ✅ Return banner y pasaje chip activos en Home
- ✅ Pantalla cero activa (sw_has_opened = '1' en esta sesión)

## Álbumes en el catálogo (v3 — agosto 2026)
8 álbumes · 86 canciones · editorial 100% completo

| ID | Título | Género | Tracks | Audios | Editorial |
|---|---|---|---|---|---|
| llegaste-muy-tarde | Llegaste muy tarde | Bachata | 10 | ✅ copiados | ✅ completo |
| ya-no-vuelvo-atras | Ya no vuelvo atrás | Dancehall | 11 | ✅ copiados | ✅ completo |
| las-pequenas-cosas | Las pequeñas cosas | Indie Folk | 11 | ✅ copiados | ✅ completo |
| volvi-a-escucharme | Volví a escucharme | Pop Soul | 11 | ✅ copiados | ✅ completo |
| desde-que-llegaste | Desde que llegaste | Regional | 11 | ✅ copiados | ✅ completo |
| esto-es-todo-lo-que-soy | Esto es todo lo que soy | Pop Soul/Balada | 11 | ✅ copiados | ✅ completo |
| vuelvo-a-sentir-la-vida | Vuelvo a sentir la vida | Salsa | 11 | ✅ copiados | ✅ completo |
| hoy-empieza-algo-bueno | Hoy Empieza Algo Bueno | Cumbia argentina | 11 | ✅ copiados | ✅ completo |

### Workflow de preview (importante)
El servidor sirve desde `/tmp/solwave-preview/`. Después de cada edición:
```bash
cp "/Users/mariafernandapareja/Desktop/Claude App Nueva/Solwave/app.html" /tmp/solwave-preview/app.html
rsync -a "/Users/mariafernandapareja/Desktop/Claude App Nueva/Solwave/audio/" /tmp/solwave-preview/audio/
```
Luego navegar con cache-buster: `http://localhost:8080/app.html?bust=N`

### Territorio emocional (cosa juzgada)
- **Salsa "Vuelvo a sentir la vida"**: movimiento social, alegría celebratoria, sentirse viva — no parte del despecho sino de la certeza de que seguís.
- **Cumbia "Hoy Empieza Algo Bueno"**: ilusión por lo que viene, ganas de planes/amigas/bailar/improvisar — sin necesitar haber sufrido primero.

### Pipeline editorial (agosto 2026)
- Whisper + librosa corrido sobre los 22 tracks de los dos álbumes nuevos
- JSONs en `scripts/editorial/`
- Editorial completo escrito para "Hoy Empieza Algo Bueno" (11 tracks): moment + intencion + recognition en app.html
- "Vuelvo a sentir la vida": editorial completo (11 tracks) basado en transcripciones Whisper — moment + intención + recognition para todos
- "Hoy Empieza Algo Bueno": editorial completo (11 tracks) — tracks 1 y 11 con letras reales, resto con Whisper
- Letras reales recibidas: tracks 1 y 11 de "Hoy Empieza Algo Bueno"

### Pendiente real
1. Letras del resto de "Hoy Empieza Algo Bueno" (tracks 2-10) para afinar editorial si la artista quiere revisarlo
3. Confirmar título "Ya Puedes Descansar" → candidato "Hoy Empieza Todo"
4. Chips de emoción del Home — agregar "Alegría cotidiana" para el álbum de cumbia
5. GitHub push → Vercel deploy
6. Supabase (tablas + RLS + auth + storage)
7. Hotmart webhook + Resend
8. Migrar a Next.js con datos reales

## Sistema editorial (nuevo — agosto 2026)
Schema vigente por canción: moment · sintiendo · intención · recognition · searchPhrases · semanticTags
Estándar completo en: `docs/EDITORIAL_SYSTEM.md`
El `moment` = escena específica (reconocimiento inmediato, 8-12 seg)
El `recognition` = frase que golpea, shareable, vive sola — el campo más importante
Las `searchPhrases` = lo que alguien escribe a las 11pm buscando ayuda
Los `semanticTags` = emoción + etapa + contexto + comportamiento + identidad
Prueba editorial: ¿Podría haberlo escrito alguien que realmente sobrevivió ese momento?

## Documentación persistente (docs/)
`PROJECT_VISION.md` · `PRODUCT_PRINCIPLES.md` · `EDITORIAL_SYSTEM.md`
`CATALOG_SCHEMA.md` · `CATALOG_STATUS.md` · `ROADMAP.md`
`DECISIONS.md` · `SESSION_STATE.md` · `TODO.md`
Un nuevo chat debe leer SESSION_STATE.md primero — contiene las instrucciones exactas de continuación.

## Decisiones técnicas
- Stack de código: HTML/CSS/JS puro por ahora (sesión 5 migra a Next.js + Supabase)
- Modelo de monetización: Suscripción mensual/anual vía Hotmart
- Música: generada con Minimax, subida a Supabase Storage
- Auth: Supabase Auth (pendiente sesión 5)
- Framework final: Next.js App Router (sesión 5)

## Pantallas creadas y verificadas
| Archivo | Pantallas | Estado |
|---|---|---|
| `landing.html` | Landing 9 secciones | ✅ Verificada, auditada |
| `onboarding.html` | 6 pantallas: 4 preguntas + loading + paywall | ✅ Verificada con fixes del revisor |
| `app.html` | **RECONSTRUIDA SESIÓN 4b** — Home + Explorar + Álbum detail + Favoritos + Perfil + Player | ✅ Verificada visualmente en navegador |

### Sesión 5 — Schema del catálogo (decisión de arquitectura)
El CATALOG ya no hardcodea contenido editorial. Cada track sigue un schema completo con todos los campos en `null` hasta que el equipo los escriba:

```
Track schema (→ tabla Supabase en Sesión 5):
  num, title, duration, status
  audioUrl        → Supabase Storage URL
  letra           → letra completa
  moment          → esencia emocional (activo editorial principal — se escribe con cuidado)
  sintiendo       → lo que probablemente estás sintiendo
  intencion       → lo que esta canción quiere decirte
  historia        → la historia real que la inspiró
  inspirada       → nombre (solo nombre de pila)
  inspiradaPrivacy → 'name' | 'initials' | 'anonymous'
  tags            → etiquetas emocionales para búsqueda y discovery

Album schema (→ tabla Supabase en Sesión 5):
  id, title, emotion, genre, concept, emoji, gradient, accentColor
  status, coverUrl, releaseDate
```

Tags (2-3 por track) funcionan como placeholder en el tracklist mientras `moment` = null.
La búsqueda opera sobre: moment + sintiendo + intencion + tags + título + álbum + emoción.
El player muestra el perfil completo (momento, sintiendo, intencion, inspirada) con animación de entrada cuando los campos existen.

Títulos definitivos — catálogo real (65 canciones):
- Álbum 1: Llegaste muy tarde (Bachata · Desamor) — 11 canciones
  Ahora me buscas · Qué te vaya bonito · Ya no tienes dónde volver · Me aprendí sin ti · Tu arrepentimiento · No era para siempre · La última llamada · No vuelvo a caer · Te quedaste solo · Llegaste muy tarde · Brindo por tu adiós
- Álbum 2: Ya no vuelvo atrás (Dancehall · Empoderamiento) — 11 canciones
  Ya no vuelvo atrás · Me elegí primero · No me apagues · Sola me queda bien · Sin pedir permiso · Bailando con mi sombra · Tú ya no decides · Más fuerte que ayer · No era amor · Libre de ti · Esta soy yo
- Álbum 3: Las pequeñas cosas (Indie Folk · Gratitud) — 11 canciones
  El olor del café · Todo florece a su tiempo · La lluvia también abraza · El banco del parque · Un día cualquiera · El sonido del viento · Donde el tiempo descansa · Las manos que conozco · Un lugar llamado hogar · La belleza de lo simple · Las pequeñas cosas
- Álbum 4: Volví a escucharme (Pop Soul · Crecimiento) — 11 canciones
  Volví a escucharme · Ya no me escondo · No era mi culpa · Después del miedo · Todavía puedo · Me debía esta canción · Mi lugar · Más fuerte que mis dudas · Nunca fue demasiado tarde · Ahora sí soy yo · Hoy empieza todo
- Álbum 5: Desde que llegaste (Regional romántico · Amor sano) — 11 canciones
  Desde que llegaste · Contigo entendí · Qué suerte encontrarte · Mi lugar favorito · Todo tiene sentido · Lo mejor de mis días · Eres mi calma · Si es contigo · Después de ti · Aquí quiero quedarme · Toda la vida
- Álbum 6: Vuelvo a sentir la vida (Salsa · Alegría) — 10 canciones
  Vuelvo a sentir la vida · Hoy me despertó la alegría · Baila conmigo la vida · Ya salió el sol · Sin miedo a sonreír · Que siga la música · Cada paso cuenta · La vida me encontró · ¡Que nadie me pare! · ¡Qué bonito es vivir!

### Sesión 4b — Reconstrucción album-céntrica completada
- CATALOG JS con 6 álbumes y 65 canciones con schema completo
- Home: featured album, chips de emoción ("Por lo que estás viviendo"), scroll horizontal de álbumes, discover card
- Álbum detail: hero full-bleed, concepto con border-left gold, tracklist numerado con `moment` en itálica + corazón por track, álbumes relacionados
- Player: artwork del álbum como card, "TRACK X DE Y · GÉNERO", `moment` bajo el título, controles gold, volumen
- Explorar: búsqueda sobre título + `moment`, filtros por emoción, grid 2 columnas
- Favoritos: agrupados por álbum con punto de color
- Perfil: avatar, stats animados, configuración
- Mini-player persistente sobre la nav
- Persistencia de favoritos en localStorage

## Identidad visual (cosa juzgada — FICHA-ARTE.md)
Dirección: Golden Stillness — cinematic dark luxury  
Tipografía: Playfair Display (serif) + DM Sans (sans)  
Tokens: base #0E1118 · gold #F4B860 · coral #F47C5C · teal #4DB6AC  
Gradientes: 8 colecciones con gradientes CSS únicos (atardeceres tropicales)

## Avatar (cosa juzgada — FICHA-AVATAR.md)
Sofía, 26–36, LATAM, trabaja desde casa. Cansada de buscar música. Quiere que la música ya esté lista.

## Colecciones definidas (9)
Sunrise Sessions · Caribbean Flow · Golden Drive · Focus Waves · Midnight Calm · Love Lounge · Coffee Beats · Island Mood · Sunset Groove

## Sesión 6 — Pulido y auditoría (completado)

### Fixes de pulido aplicados
- app.html + onboarding.html: fondo atmosférico en desktop (gradiente radial gold/teal sutil)
- app.html: chips de sugerencia en estado vacío de búsqueda
- app.html: ícono altavoz correcto en "Calidad de audio" (era reloj)
- app.html: overlay oscuro consistente en cards de colección (Home = Explorar)
- app.html: toast de feedback al marcar/desmarcar favorito
- app.html: swipe-down para cerrar el player

### Pre-mortem — 5 riesgos top
1. **El primer cliente abre la app y no hay tracks reales** → Mitigación: datos semilla visibles (ok en prototipo); en Sesión 5 se suben tracks reales a Supabase Storage antes de abrir tráfico
2. **Alguien compra y Hotmart no da acceso** → Mitigación: webhook con hottok + Supabase crea usuario automático (implementar en Sesión 5); hasta entonces: acceso manual por email
3. **El trial de 7 días termina y el usuario no sabe que vence** → Mitigación: email D-1 con Resend (implementar en Sesión 5); mostrar fecha de vencimiento en Perfil
4. **La música generada suena genérica o mala** → Mitigación: revisión humana de cada track antes de subir; curación editorial como promesa de marca
5. **El landing se ve mal en móvil y no convierte** → Mitigación: landing diseñada mobile-first a 375px; probada visualmente con screenshots a 375px

### Artefactos de lanzamiento creados
- `docs/release/CLAIMS-LEDGER.md` — promesas vs capacidad real
- `docs/release/PRIVACY-DATA-MAP.md` — mapa de datos LATAM

### QA de interacciones verificado
- Onboarding: selectChip() funciona ✅
- App Home: goToScreen(), mini-player, togglePlay() ✅
- App Explorar: búsqueda, filterCollections(), estado vacío con chips ✅
- App Perfil: animateCount() en estadísticas ✅
- Player: openPlayer(), closePlayer(), swipe-down, toggleHeart() con toast ✅

## Pendiente editorial
1. **Ya Puedes Descansar** — en pausa. El coro dice "Todo empieza hoy", posible título alternativo "Hoy Empieza Todo". Confirmar título antes de escribir editorial. JSON en borrador, sin campos editoriales.
2. **Ya No Pido Permiso** — NUEVA canción detectada en carpeta de audio (no estaba en el catálogo previo). Editorial completo en `editorial/ya-no-pido-permiso.md` y JSON en `scripts/editorial/ya-no-pido-permiso.json`. Requiere asignación de álbum por parte de la artista. Candidata natural: "Ya No Vuelvo Atrás" (Dancehall · Empoderamiento).
3. **Volví a Sonreír 1.mp3** — versión duplicada del mismo track detectada en la carpeta. No es canción nueva.

## Pendiente (Sesión 5)
1. GitHub repo + push de todos los archivos
2. Vercel deploy (dominio personalizado)
3. Supabase: tablas (users, collections, tracks, subscriptions) + RLS
4. Auth: Supabase Auth + Google OAuth
5. Hotmart: producto "fachada" + webhook con hottok
6. Resend: email transaccional (bienvenida + acceso)
7. Conectar app.html → Next.js con datos reales de Supabase Storage
