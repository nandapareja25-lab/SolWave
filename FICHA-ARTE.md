# FICHA-ARTE — Solwave

> Cosa juzgada. Ninguna decisión de paleta, tipografía ni motion se re-abre.
> Toda pantalla se mide contra esta ficha antes de declararse terminada.

---

## Tabla de Líderes (PASO 0.2bis)

| App | Tipografía | Lógica de color | Radius/cards | Patrón robable |
|-----|-----------|-----------------|--------------|----------------|
| Apple Music | SF Pro (system) | oscuro, color extraído del artwork | 12px, foto dominante | reproductor full-bleed + artwork como UI |
| Airbnb | Cereal (grotesca) | claro cálido, coral sutil como acento | 16px, foto full-bleed | fotografía = emoción, no decoración |
| Spotify | Circular Std | oscuro, verde reservado para play | 8px, densidad alta | restricción del acento = fuerza |
| Endel | Circular Std | oscuro abstracto, gradientes | grande/orgánico | gradiente = estado emocional |
| Calm | Feijoa (serif) | azul/lavanda, claro editorial | 20px, muy aireado | el silencio como diseño |

FUSIÓN elegida:
- Lógica de profundidad oscura de Apple Music (la foto es el contenido, el chrome es invisible)
- Fotografía-como-emoción de Airbnb (la foto hace el trabajo emocional)
- Restricción del acento de Spotify (el gold solo en play/acción)
- Respiración y silencio de Calm (espacio como lujo)
- Serif editorial de Calm → elevada a Playfair Display (más alta moda)

---

## REFERENCIA DEL USUARIO → CONTRATO

Imagen de referencia: inspiración de atmósfera (NO de layout ni componentes)

**Extracción de la tabla:**
```
Modo:                    oscuro
Fondo:                   #111820 (near-black con tinte azul-índigo cálido)
Superficie/card:         #1C1F28 (+1 nivel), #252830 (+2 nivel)
Texto 1º / 2º:           #F5EFE6 / #8A8070
Acento:                  #F4B860 — aparece en: CTA play, título destacado, hora activa
Secundario:              #F47C5C (coral) — en: estados secundarios, tags
Teal:                    #4DB6AC — en: collection Caribbean Flow, accents de naturaleza
Semánticos:              —
Display:                 Playfair Display — serif alto contraste, elegante, editorial
                         (confirmado en la referencia: "Playfair Display Light / Regular")
Body:                    DM Sans — humanista, limpia, moderna
                         (confirmado en la referencia: "DM Sans Light / Regular / Medium")
Radio:                   cards 16-20px / botón play 50% (círculo) / contenedor 24px
Espaciado base:          muy aireado · mínimo 24px márgenes · secciones 40px+ gap
Sombras:                 sutiles · 0 4px 24px rgba(0,0,0,0.4)
Bordes:                  1px rgba(255,255,255,0.06) en cards oscuras
Textura/grano:           grano fotográfico muy sutil en overlays
Gradiente:               overlay lineal descendente en fotos (transparente → #111820)
Íconos:                  line · grosor 1.5px · estilo minimal
Layout:                  vertical · fotografía dominante · hero grande + scroll de colecciones
Mood:                    cinematic · tranquil · warm luxury
Detalle firma:           fotografía de atardecer tropical como base emocional de cada card
```

**Referencia del usuario levanta:** ninguna prohibición — la atmósfera es la dirección.

---

## Dirección de arte elegida

**Nombre interno:** Golden Stillness
**Concepto:** "Entrar a un hotel boutique frente al mar al atardecer."

No es un dashboard. No es una app SaaS. Es un lugar.

La fotografía hace todo el trabajo emocional.
La tipografía es la única voz de la marca.
El chrome (botones, navegación, iconos) es casi invisible.
El espacio es el lujo.

---

## Paleta definitiva

```
--color-base:        #111820   ← fondo · near-black con tinte índigo cálido
--color-surface-1:   #1A1E28   ← cards primer nivel
--color-surface-2:   #242830   ← cards segundo nivel / inputs
--color-border:      rgba(245,239,230,0.07)  ← bordes sutiles
--color-gold:        #F4B860   ← acento principal · SOLO en play/CTA/dato clave
--color-coral:       #F47C5C   ← acento secundario · tags / estados
--color-teal:        #4DB6AC   ← terciario · Caribbean / naturaleza
--color-indigo:      #243B6B   ← nocturno / Midnight Calm
--color-text-1:      #F5EFE6   ← texto principal · cream cálido
--color-text-2:      #8A8070   ← texto secundario · warm grey
--color-text-3:      rgba(245,239,230,0.35)  ← texto terciario / labels
```

Regla del acento: --color-gold aparece SOLO en el botón/ícono de play activo, en el CTA principal y como highlight de track actual. Nunca como decoración.

---

## Tipografía

```
Display:   Playfair Display
           Weights usados: 300 (Light) · 400 (Regular) · italic 300 · italic 400
           Tracking: -0.03em en títulos ≥28px · -0.01em en 18-28px
           Line-height: 1.1 en display grande · 1.3 en cuerpos

Body:      DM Sans
           Weights: 300 (Light) · 400 (Regular) · 500 (Medium)
           Tracking: 0 en cuerpo · +0.12em en labels mayúsculas
           Line-height: 1.6 en cuerpo · 1.2 en UI labels

Escala:
  --text-xs:    11px DM Sans 400 · +0.15em
  --text-sm:    13px DM Sans 300
  --text-base:  15px DM Sans 400
  --text-md:    18px DM Sans 300
  --text-lg:    22px Playfair 300 italic
  --text-xl:    28px Playfair 300 · -0.02em
  --text-2xl:   38px Playfair 300 · -0.03em
  --text-3xl:   52px Playfair 200 italic · -0.03em
```

---

## Motion signature

Arquetipo: Amante + Explorador → sereno, cálido, sin prisa.

```
--ease-brand:      cubic-bezier(0.22, 1, 0.36, 1)   ← ease-out lento · el estándar de la app
--ease-enter:      cubic-bezier(0.16, 1, 0.3, 1)    ← entradas de pantalla
--duration-fast:   220ms
--duration-base:   340ms
--duration-slow:   500ms
--duration-photo:  600ms   ← transiciones de fotografía (más lentas = más lujo)
```

Reglas:
- Stagger en listas: 60ms entre ítems (lento = sereno)
- Sin bounce (bounce = 0)
- Scroll con inercia natural del sistema
- Animaciones de foto: fade + scale sutil (1.02 → 1.0) en 600ms

---

## Estilo elegido del menú de estilos

**Aurora UI** + **Kenya-Hara minimal** aplicados al mundo tropical.
- Fotografías de atardecer/naturaleza como fondos de gradiente
- Chrome mínimo, casi invisible
- Espacio como protagonista
- UN acento (gold) usado con extrema restricción

---

## Artwork de colecciones (identidad visual por colección)

Cada colección tiene su gradiente CSS que evoca su mundo real:

```
Sunrise Sessions:  #0D0500 → #7A2A0A → #C4580A → #F0941C → #F4C860
Caribbean Flow:    #011C22 → #083840 → #0E6070 → #2A9E9A → #7AD4CF
Golden Drive:      #0F0500 → #5A2000 → #B04A00 → #D88020 → #F4B040
Focus Waves:       #050D10 → #0A2028 → #103040 → #1A5060 → #3A9090
Midnight Calm:     #040610 → #0A1025 → #142040 → #1E3060 → #2E4A88
Love Lounge:       #120208 → #3A0A1A → #6A1A30 → #A03050 → #D06070
Coffee Beats:      #0A0602 → #2A1600 → #5A3010 → #8A5820 → #C08840
Island Mood:       #010D08 → #062018 → #0E3C28 → #1E6040 → #4A9870
```

---

## Sistema de fotografía

Las fotografías de cada colección deben ser:
- Tomadas en golden hour o blue hour (amanecer / atardecer)
- Sin personas identificables (enfoque en ambiente, no en personaje)
- Composición: cielo que ocupa 60%+ del frame
- Temperatura: cálida (3200K–4500K)
- Procesado: ligeramente subexpuesto en sombras, altas luces cálidas

Mientras no hay fotografías reales: los gradientes CSS de arriba actúan como placeholders cromáticos fieles al mundo emocional de cada colección.

---

## Reglas absolutas de pantalla

1. Máximo 3 elementos compitiendo en el primer viewport
2. Fotografía o gradiente cubre siempre ≥50% de la pantalla
3. La navegación es casi invisible (opacidad baja, blur sutil)
4. El texto NUNCA compite con la foto — solo vive en zonas de contraste asegurado
5. Padding lateral mínimo: 24px. Ideal: 28px.
6. No hay borders visibles en el modo oscuro salvo 1px rgba muy sutil en cards
7. El botón play es el único elemento de color sólido dorado
8. Nunca más de 1 CTA visible por pantalla
