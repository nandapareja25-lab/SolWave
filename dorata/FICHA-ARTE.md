# FICHA DE DIRECCIÓN DE ARTE — D'ORATA

## Referencia del usuario (CONTRATO)
- Referencia: brief verbal de marca (no imagen). Marfil/crema + blanco + dorado; negro secundario;
  serif elegante; corona dorada sobre D'ORATA; "ORO LAMINADO 18K". Sin "Joyería", sin corazones,
  sin degradados exagerados, nada recargado. Femenina, premium, limpia, confiable.
- Elección A/B/C (25-nov-2026): **mezcla A+B** → hero de B (oscuro, dorado, producto protagonista),
  después marfil/crema, categorías circulares de A, alternar secciones oscuras y claras, filetes dorados finos.
- Prohibiciones anti-IA que el contrato levanta: modo oscuro SOLO en hero y bandas alternas (decisión de la dueña).

## Identidad derivada
- Líderes de joyería premium como referencia: Mejuri (marfil + foto protagonista + sans limpia),
  Cartier/Tiffany (serif de alto contraste, oro sobre negro, mucho aire), Ana Luisa (stories circulares, móvil).
- Par tipográfico (patrón probado "didone display + sans geométrica"): **Bodoni Moda** (display/logo) +
  **Manrope** (texto, precios, botones). Nunca serif+serif. Vetados: Playfair/DM Sans (Solwave).
- Arquetipo: Amante + Gobernante (deseo y prestigio accesible). Mundo del sujeto: joyero, terciopelo, vitrina, certificado.

## Personalidad compilada
- 3 adjetivos: **elegante, cálida, segura**.
- Motion: easing `cubic-bezier(.16,1,.3,1)` · base 240ms · tap 120ms · stagger 60ms · sin rebotes ·
  celebración nivel 1 (sutil: brillo dorado al agregar al carrito). Exclamaciones: 0.

## Brand kit final (tokens en `src/app/globals.css`)
- Claro: fondo `#FAF6EF` (marfil) · elevado `#FFFFFF` · hundido `#F2EADB` (crema) · línea `#E6DCC8`
- Oscuro: terciopelo `#16130F` · elevado `#221D17` · línea `#3A342C`
- Texto: `#1C1915` / `#5E554A` / `#8A8072` · sobre oscuro: `#FAF6EF` / `#CFC5B5`
- Dorado: decorativo `#C9A45C` (filetes, logo, íconos sobre oscuro) · texto/ícono sobre claro `#8A6628` (≥4.5:1)
  · CTA dorado sobre oscuro: fondo `#C9A45C` + texto `#1C1915`
- Acento SOLO en: CTA del hero, precios destacados de oferta, íconos de garantía, filetes finos.
- Semánticos: éxito `#3F6B4A` · error `#A3392F` · aviso `#9A6A12`
- Escala: hero 36 (móvil) / 56 (escritorio) · h1 32 · h2 de sección 28 · title 20 · body 15 · secundario 13-14 · label 12 (mayúsculas, tracking .14em)
- Radio: SOLO dos familias → 4px en todo contenedor (cards, imágenes, avisos, badges) · píldora (999px) en botones, chips, inputs de la tienda y círculos.
  Panel privado (formularios largos): campos de texto, desplegables y opciones de selección en caja = 4px; botones y chips siguen en píldora.
- Profundidad: bordes finos + elevación blanca sobre marfil; sombras solo en flotantes (drawer, FAB, cookies).
- Dispositivo ownable: **filete dorado doble** (marco de certificado) + anillo dorado en categorías.
- Imágenes: estudio cálido (marfil) en claro; terciopelo en oscuro.

## Trazabilidad
- Comparativa: `dorata/direcciones-abc.html` · capturas `docs/capturas/direcciones-abc-*.png`
- Modo derivado por: decisión de la dueña (hero oscuro de B) + mundo del sujeto (joyero).
- Idioma UI: español (en: preparado) · Fecha: 2026-11-25 · Aprobada por la dueña: SÍ (mezcla A+B).
