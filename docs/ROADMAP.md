# ROADMAP — Solwave

> Todo lo construido, los próximos pasos, y las prioridades.

---

## ✅ Construido

### Sesión 1–3: Identidad y UI
- Identidad visual "Golden Stillness" (cinematic dark luxury): `#0E1118` base, `#F4B860` gold, `#F47C5C` coral, `#4DB6AC` teal
- Tipografía: Playfair Display + DM Sans
- `landing.html` — 9 secciones, mobile-first, verificada
- `onboarding.html` — 6 pantallas: 4 preguntas + loading + paywall, verificada
- `app.html` — app principal con: Home, Explorar, Álbum detail, Player, Favoritos, Perfil
- Fixes de pulido: fondo atmosférico desktop, toast de favoritos, swipe-down en player, estado vacío con chips de búsqueda, ícono altavoz correcto

### Sesión 4: Arquitectura del catálogo
- CATALOG reconstruido con `track()` helper — schema completo, todos los campos editoriales en `null`
- 65 canciones con títulos definitivos distribuidas en 6 álbumes
- Player expandido con campos: moment, sintiendo, intención, inspirada
- Búsqueda sobre: moment + sintiendo + intención + tags + título + álbum + emoción
- FICHA-AVATAR.md completada (Valentina, 22–38, LATAM)
- FICHA-ARTE.md completada (Golden Stillness, cosa juzgada)

### Sesión 4b: Pipeline editorial de audio
- `scripts/analyze_track.py` — pipeline completo: Whisper + librosa + heurísticas editoriales
- Instalación: `openai-whisper` + `librosa` locales
- 20 MP3s analizados desde `/Desktop/SOLWAVES MUSIC/`
- 20 JSONs en `scripts/editorial/` con transcripción, análisis acústico, borradores
- `scripts/write_editorial.py` — aplica borradores editoriales a los JSONs
- `revision-editorial.html` — documento visual de revisión generada por Python
- Sistema de documentación persistente en `docs/` (esta sesión)

### Sesión 5–6: Pulido y artefactos de lanzamiento
- `docs/release/CLAIMS-LEDGER.md` — promesas vs. capacidad real
- `docs/release/PRIVACY-DATA-MAP.md` — mapa de datos LATAM
- QA completo de interacciones (onboarding, búsqueda, player, favoritos, perfil)
- Pre-mortem documentado (5 riesgos top)

---

## 🔲 Próximos pasos (por orden de prioridad)

### INMEDIATO: Sistema editorial

1. **Confirmar mapeo MP3 → catálogo** con la artista
   - 20 archivos MP3 analizados, mapeo pendiente de confirmación
   - ⚠️ `Ya Puedes Descansar.mp3` tiene discrepancia de título — confirmar
   
2. **Aplicar nuevo estándar editorial a las 17 canciones restantes**
   - Las 3 canciones piloto (Ya No Vuelvo Atrás, Hoy Elijo Paz, Todavía Hay Camino) tienen el estándar vigente
   - Las otras 17 tienen borrador de versión anterior — reescribir al nuevo estándar
   - Nuevo schema: moment + sintiendo + intención + recognition + searchPhrases + semanticTags

3. **Revisión y aprobación de editoriales** por la artista canción por canción

4. **Actualizar app.html CATALOG** con los campos editoriales aprobados
   - Agregar campo `recognition` al schema del CATALOG JS
   - Agregar `searchPhrases` y `semanticTags` al schema
   - Actualizar player para mostrar `recognition` en grande

### SESIÓN 5: Infraestructura de producción

5. **GitHub repo** — push de todos los archivos, `.gitignore` cubriendo `.env`

6. **Vercel deploy** — dominio personalizado, auto-deploy desde GitHub

7. **Supabase**
   - Tablas: `albums`, `tracks`, `users`, `subscriptions`, `favorites`
   - RLS en todas las tablas
   - Google OAuth + Supabase Auth
   - Subir MP3s a Supabase Storage

8. **Hotmart**
   - Producto "fachada"
   - Webhook con hottok → crear usuario en Supabase al comprar
   - Webhook de cancelación → revocar acceso

9. **Resend**
   - Dominio propio verificado (SPF/DKIM/DMARC)
   - Email de bienvenida post-compra
   - Email D-1 antes de vencimiento del trial

10. **Migración de app.html → Next.js App Router**
    - Server Components para el catálogo
    - Datos reales desde Supabase
    - RLS verificando suscripción activa antes de servir audio

### FUTURO (V2+)

- Buscador semántico con embeddings (pgvector) sobre searchPhrases y semanticTags
- Panel de backoffice para la artista (analytics, revenue, usuarios activos)
- Más álbumes — el pipeline ya está construido para escalar
- Contenido orgánico de YouTube como canal de adquisición
- Afiliados en Hotmart

---

## Ideas pendientes de evaluar

- `recognition` como formato de Instagram Stories (generador de cards)
- Player con fondo que cambia según el álbum/emoción
- "Radio emocional" — reproducción continua dentro de una emoción
- Compartir una canción con el `recognition` como overlay de la cover
