# TODO — Solwave

> Lista priorizada de tareas pendientes. Actualizar al inicio y al final de cada sesión.
> Última actualización: agosto 2026

---

## 🔴 AHORA (próxima sesión)

- [ ] Aprobar o ajustar el estándar editorial de las 3 canciones piloto:
      Ya No Vuelvo Atrás · Hoy Elijo Paz · Todavía Hay Camino
- [ ] Actualizar los 3 JSONs piloto con el schema nuevo:
      agregar campo `recognition`, separar `searchPhrases` de `semanticTags`
- [ ] Escribir editoriales al nuevo estándar para las 17 canciones restantes (de los 20 MP3s)
- [ ] Confirmar con la artista el mapeo de cada MP3 → track del catálogo
- [ ] Resolver ⚠️ `Ya Puedes Descansar.mp3` — confirmar si es "Hoy empieza todo" (Álbum 4, track 11)

---

## 🟡 PRONTO (antes de abrir tráfico)

- [ ] Agregar campo `recognition` al schema del CATALOG en app.html
- [ ] Agregar `searchPhrases` y `semanticTags` al schema de app.html
- [ ] Actualizar player para mostrar `recognition` en grande (campo shareable)
- [ ] Actualizar buscador de app.html para buscar también sobre `searchPhrases`
- [ ] Actualizar revision-editorial.html con el nuevo schema (recognition + semanticTags)
- [ ] Aprobar editoriales de los 20 MP3s analizados con la artista
- [ ] Actualizar CATALOG de app.html con los editoriales aprobados

---

## 🟢 SESIÓN 5 (infraestructura de producción)

- [ ] GitHub repo — crear y hacer push inicial
- [ ] Vercel — deploy, dominio personalizado, auto-deploy
- [ ] Supabase — crear tablas (albums, tracks, users, subscriptions, favorites)
- [ ] Supabase — RLS en todas las tablas
- [ ] Supabase Auth — Google OAuth
- [ ] Supabase Storage — subir los 20 MP3s
- [ ] Hotmart — producto fachada + webhook con hottok
- [ ] Resend — dominio verificado + email de bienvenida + D-1 de vencimiento
- [ ] Migrar app.html → Next.js App Router con datos reales

---

## 🔵 FUTURO (V2+)

- [ ] Buscador semántico con embeddings (pgvector sobre searchPhrases)
- [ ] Panel backoffice para la artista
- [ ] Generador de cards de Instagram con el campo `recognition`
- [ ] Compartir canción con recognition como overlay de la cover
- [ ] Radio emocional (reproducción continua por emoción)
- [ ] Analizar los restantes 45 MP3s del catálogo (cuando estén producidos)
- [ ] Canal de YouTube como canal de adquisición principal
- [ ] Afiliados en Hotmart

---

## ✅ Completado (esta sesión)

- [x] Arquitectura del catálogo con schema dinámico (track() helper, campos en null)
- [x] 65 títulos definitivos del catálogo cargados en app.html
- [x] Pipeline de audio: analyze_track.py (Whisper + librosa)
- [x] 20 MP3s analizados — transcripción + análisis acústico + borradores editoriales
- [x] revision-editorial.html generado (documento de revisión visual)
- [x] Estándar editorial refinado en 3 iteraciones
- [x] 3 canciones piloto escritas al nuevo estándar (en el chat)
- [x] Sistema de documentación persistente en docs/ (6 archivos)
- [x] ESTADO.md actualizado
