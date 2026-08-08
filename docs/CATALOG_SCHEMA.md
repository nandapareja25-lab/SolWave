# CATALOG SCHEMA — Solwave

> Modelo de datos completo. Aplica hoy al CATALOG de app.html y en Sesión 5 migra a Supabase.

---

## Estructura del catálogo

```
Sello (Solwave)
  └── Álbumes (6 en v1, escalable)
        └── Canciones (65 en v1, escalable a miles)
```

---

## Schema de álbum

```javascript
{
  id:           string,   // slug único: 'llegaste-muy-tarde'
  title:        string,   // 'Llegaste muy tarde'
  emotion:      string,   // emoción central del álbum
  genre:        string,   // género principal
  concept:      string,   // descripción del concepto del álbum (1-2 oraciones)
  emoji:        string,   // emoji representativo
  gradient:     string,   // CSS gradient (identidad visual del álbum)
  accentColor:  string,   // hex del color acento
  status:       'published' | 'draft' | 'coming_soon',
  coverUrl:     string | null,   // Supabase Storage URL
  releaseDate:  string | null,   // ISO date
  trackCount:   number,
}
```

**Álbumes vigentes (v1):**

| id | Título | Emoción | Género | Tracks |
|----|--------|---------|--------|--------|
| `llegaste-muy-tarde` | Llegaste muy tarde | Desamor tardío | Bachata | 11 |
| `ya-no-vuelvo-atras` | Ya no vuelvo atrás | Empoderamiento | Dancehall | 11 |
| `las-pequenas-cosas` | Las pequeñas cosas | Gratitud / calma | Indie Folk | 11 |
| `volvi-a-escucharme` | Volví a escucharme | Crecimiento personal | Pop Soul | 11 |
| `desde-que-llegaste` | Desde que llegaste | Amor sano | Regional romántico | 11 |
| `vuelvo-a-sentir-la-vida` | Vuelvo a sentir la vida | Alegría | Salsa | 10 |

---

## Schema de canción

```javascript
{
  // ── Identidad ──────────────────────────────────────────────────
  num:          number,   // número de track en el álbum (1-based)
  title:        string,   // título definitivo de la canción
  duration:     string,   // formato "3:42"
  status:       'published' | 'draft' | 'coming_soon',

  // ── Audio ──────────────────────────────────────────────────────
  audioUrl:     string | null,   // Supabase Storage URL (.mp3)

  // ── Letra ──────────────────────────────────────────────────────
  letra:        string | null,   // letra completa transcrita y aprobada

  // ── Perfil editorial (campos principales) ─────────────────────
  moment:       string | null,   // escena exacta — reconocimiento inmediato
  sintiendo:    string | null,   // diálogo interno — comprensión profunda
  intencion:    string | null,   // por qué existe esta canción
  recognition:  string | null,   // frase poderosa — shareable, vive sola

  // ── Búsqueda y discovery ──────────────────────────────────────
  searchPhrases: string[],  // frases reales que alguien escribiría buscando
  semanticTags:  string[],  // etiquetas estructuradas (emoción, etapa, contexto)
  tags:          string[],  // tags simples legacy (a deprecar con semanticTags)

  // ── Historia (opcional, privacidad configurable) ───────────────
  historia:         string | null,  // la historia real que inspiró la canción
  inspirada:        string | null,  // nombre de la persona que inspiró
  inspiradaPrivacy: 'name' | 'initials' | 'anonymous',

  // ── Metadata del pipeline editorial ──────────────────────────
  archivo_mp3:    string | null,   // nombre del archivo original analizado
  bpm:            number | null,
  tonalidad:      string | null,   // 'A mayor', 'E menor', etc.
  energia:        'alta' | 'media' | 'baja' | null,
  estado_editorial: 'borrador' | 'aprobado' | 'publicado' | null,
}
```

---

## Regla de publicación

Una canción solo puede cambiar a `status: 'published'` cuando:
1. `audioUrl` tiene URL real (no null)
2. `moment` aprobado
3. `sintiendo` aprobado
4. `intencion` aprobado
5. `recognition` aprobado
6. `searchPhrases` tiene mínimo 10 frases
7. `semanticTags` tiene mínimo 5 etiquetas
8. `letra` transcrita y aprobada

Una canción sin estos campos es `status: 'draft'` aunque la música esté lista.

---

## Cómo crece el catálogo

```
Nueva canción MP3 →
  python3 analyze_track.py <archivo.mp3>
  → JSON en scripts/editorial/

  python3 write_editorial.py
  → Borrador editorial aplicado

  Revisión humana en revision-editorial.html
  → Campos aprobados

  Confirmar mapeo (álbum + track number) con la artista
  → Actualizar app.html CATALOG (hoy)
  → Actualizar tabla Supabase (Sesión 5)

  audioUrl activo
  → status: 'published'
```

---

## Migración a Supabase (Sesión 5)

**Tablas a crear:**
```sql
albums (id, title, emotion, genre, concept, emoji, gradient, accent_color,
        status, cover_url, release_date, track_count)

tracks (id, album_id, num, title, duration, status, audio_url, letra,
        moment, sintiendo, intencion, recognition,
        search_phrases jsonb, semantic_tags jsonb, tags jsonb,
        historia, inspirada, inspirada_privacy,
        archivo_mp3, bpm, tonalidad, energia, estado_editorial,
        created_at, updated_at)

users (id, email, plan, trial_ends_at, created_at)

subscriptions (id, user_id, hotmart_id, status, plan, started_at, ends_at)

favorites (id, user_id, track_id, created_at)
```

**RLS:** activo en todas las tablas. Política por `(select auth.uid())`.
**Acceso a tracks:** solo usuarios con suscripción activa (`plan != 'free'` o `trial_ends_at > now()`).
