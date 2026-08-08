# PRODUCT PRINCIPLES — Solwave

> Decisiones de producto. Lo que sí hacemos, lo que nunca haremos, el tono.

---

## Lo que SÍ hacemos

- **Álbumes conceptuales completos.** Cada álbum tiene un universo emocional propio — emoción central, concepto, géneros, identidad visual.
- **Curaduría editorial de cada canción.** Ninguna canción se publica sin sus campos editoriales completos y aprobados: moment, sintiendo, intención, recognition, searchPhrases, semanticTags.
- **Búsqueda por situación de vida.** El buscador entiende frases como "me cansé de esperarlo" o "no sé quién soy ahora" y devuelve la canción exacta.
- **Música sin memoria de otra persona.** Las canciones son nuevas — no tienen la historia de una relación pasada adherida.
- **Experiencia sin anuncios.** El producto de pago garantiza continuidad emocional sin interrupciones.
- **Escala con estándar.** El pipeline editorial (audio → transcripción → análisis → borrador → revisión humana) permite crecer el catálogo sin perder calidad.

---

## Lo que NUNCA haremos

- **Playlists genéricas.** No mezclamos emociones incompatibles en el mismo álbum. Desamor y empoderamiento son álbumes distintos — no canciones en la misma playlist.
- **Textos editoriales que sirvan para diez canciones.** Si el `moment` de una canción puede describir a otra, no sirve. Cada canción tiene una identidad emocional imposible de confundir.
- **Tono de terapeuta.** Sin consejos, sin explicaciones psicológicas, sin "recuerda que mereces amor". El tono es de alguien que ya vivió eso — no de alguien enseñándote cómo superarlo.
- **Copywriting disfrazado de editorial.** Si un texto suena a campaña de marketing, se reescribe. El estándar es: ¿podría haberlo escrito alguien que realmente sobrevivió ese momento?
- **Publicar sin campos editoriales completos.** Un track sin `recognition` o sin `searchPhrases` no está listo — aunque la música esté terminada.
- **Mezclar géneros dentro de un álbum sin intención.** Los géneros siguen a la emoción, no al revés.

---

## Tono editorial (la voz de Solwave)

**Es:** íntimo, preciso, directo, sin adornos innecesarios.
**No es:** poético por ser poético, inspiracional, terapéutico, motivacional.

La prueba del tono:
> ¿Esto podría haberlo escrito alguien que realmente sobrevivió este momento?

Si parece escrito por un copywriter → reescribir.
Si parece escrito por alguien que estuvo ahí → es Solwave.

**El texto editorial no admira. Reconoce.**
El oyente no debe pensar "qué bien escrito". Debe pensar "eso soy yo."

---

## Decisiones de monetización

- **Modelo:** suscripción mensual/anual vía Hotmart.
- **Trial:** 14 días gratis — acceso completo al primer álbum.
- **Sin freemium.** El producto completo requiere suscripción.
- **Precio:** a definir con benchmarks del sector (ver ROADMAP.md).

---

## El avatar principal

**Valentina**, 22–38 años, LATAM, predominantemente mujer.
Está en medio de algo — una ruptura, un proceso de crecimiento, enamorarse de nuevo.
Llega por YouTube buscando música para lo que siente.
Necesita música que entienda exactamente lo que está viviendo, sin que tenga la memoria de otra persona attached.

Ver FICHA-AVATAR.md para el perfil completo.

---

## Stack técnico vigente

```
Fase actual:  HTML/CSS/JS puro (prototipo funcional)
Fase 5:       Next.js App Router + Supabase + Vercel
Ventas:       Hotmart (producto fachada + webhook)
Email:        Resend (dominio propio)
Música:       Minimax (generación) → Supabase Storage (hosting)
Auth:         Supabase Auth + Google OAuth (fase 5)
```

Ver CATALOG_SCHEMA.md para el modelo de datos completo.
