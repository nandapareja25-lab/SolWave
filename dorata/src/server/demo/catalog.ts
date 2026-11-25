import "server-only";
import type { Category, LegalPage, ProductDetail, StoreSettings, WarrantyPolicy } from "@/server/types";
import type { Announcement } from "@/lib/announcement";

/**
 * DATOS DE DEMOSTRACIÓN — solo para desarrollar y revisar el diseño sin base conectada.
 * Nombres y precios son de ejemplo (excepto los que dio la dueña). En producción todo
 * viene de Supabase y se edita desde el panel.
 */

export const DEMO_SETTINGS: StoreSettings = {
  storeName: "D'ORATA",
  descriptor: "Oro laminado 18K",
  logoUrl: null,
  whatsappE164: null, // ⚠ pendiente: número de WhatsApp de la dueña (sin número no se muestra el botón)
  contactEmail: null,
  social: { instagram: "https://www.instagram.com/dorata18k", tiktok: "https://www.tiktok.com/@dorata18k" },
  socialHandle: "@dorata18k",
  testimonialsEnabled: false, // sin testimonios reales → la sección no se muestra
  newsletterEnabled: true,
  isDemo: true,
};

/** Garantías: texto entregado por D'ORATA (igual al seed SQL). */
const COVERAGE = `Cubre la pérdida o el cambio de color y las condiciones propias del proceso de laminado, incluso con exposición a piscina, mar, sudor, cremas y lociones.

Según corresponda, también puede cubrir:
- Defectos de ensamble.
- Fallas del proceso de laminado.
- Porosidad.`;
const EXCLUSIONS = `No cubre:
- Modificaciones realizadas a la pieza.
- Golpes, roturas o caídas.
- Mal uso.
- Desgaste natural.
- Intervención de terceros.
- Daños producidos por ácidos o químicos fuertes.

Las joyas incompletas no se reciben para evaluación de garantía.`;

export const DEMO_WARRANTIES: WarrantyPolicy[] = [
  { code: "finished_pieces_1y", months: 12, name: "Garantía 1 año", summary: "Garantía de color por 1 año en piezas terminadas, incluso con piscina, mar, sudor, cremas y lociones.", coverageMd: COVERAGE, exclusionsMd: EXCLUSIONS, categoryNames: ["Cadenas", "Dijes", "Aretes", "Topitos", "Pulseras"] },
  { code: "ball_beads_5y", months: 60, name: "Garantía 5 años", summary: "Garantía de color por 5 años en balinería de oro laminado, incluso con piscina, mar, sudor, cremas y lociones.", coverageMd: COVERAGE, exclusionsMd: EXCLUSIONS, categoryNames: ["Balinería"] },
];
const W1 = DEMO_WARRANTIES[0]!;
const W5 = DEMO_WARRANTIES[1]!;

const cat = (id: string, slug: string, name: string, illustration: Category["image"]["illustration"], autoRule: Category["autoRule"] = null, tint?: string): Category => ({
  id, slug, name, description: null, autoRule, showInNav: true,
  image: { url: null, illustration, tint, alt: name },
});

/** Las 12 categorías iniciales de la dueña (mismo orden que el seed). */
export const DEMO_CATEGORIES: Category[] = [
  cat("c1", "cadenas", "Cadenas", "chain"),
  cat("c2", "dijes", "Dijes", "clover"),
  cat("c3", "aretes", "Aretes", "hoops"),
  cat("c4", "topitos", "Topitos", "studs"),
  cat("c5", "pulseras", "Pulseras", "links"),
  cat("c6", "pulseras-de-hilo", "Pulseras de hilo", "thread", null, "#1C1915"),
  cat("c7", "balineria", "Balinería", "beads"),
  cat("c8", "sets", "Sets", "set"),
  cat("c9", "religiosos", "Religiosos", "medal"),
  cat("c10", "treboles", "Tréboles", "clover"),
  cat("c11", "nuevos", "Nuevos", "studs", "new"),
  cat("c12", "ofertas", "Ofertas", "hoops", "sale"),
];

type Seed = {
  id: string; slug: string; cat: string; name: string; price: number; compare?: number;
  isNew?: boolean; featured?: boolean; sale?: boolean; set?: boolean; ill: Category["image"]["illustration"]; tint?: string;
  warranty: WarrantyPolicy | null; material?: string; measurements?: string; color?: string; short: string;
  variants?: { title: string; swatch: string; soldOut?: boolean; low?: boolean }[]; days: number;
};

const seeds: Seed[] = [
  { id: "p1", slug: "cadena-singapur", cat: "cadenas", name: "Cadena Singapur 45 cm", price: 8900, featured: true, ill: "chain", warranty: W1, material: "Oro laminado 18K", measurements: "45 cm · 2 mm", short: "Eslabón torcido que refleja la luz en cada movimiento. Para usar sola o con dije.", days: 30 },
  { id: "p2", slug: "pulsera-hilo-balines", cat: "pulseras-de-hilo", name: "Pulsera de hilo con balines", price: 5999, featured: true, ill: "thread", tint: "#7A1E22", warranty: null, material: "Hilo + balines en oro laminado 18K", measurements: "Ajustable", short: "Hilo trenzado ajustable con balines de oro laminado. Elige tu color.", days: 12,
    variants: [{ title: "Hilo negro", swatch: "#1C1915" }, { title: "Hilo rojo", swatch: "#7A1E22", low: true }, { title: "Hilo azul", swatch: "#22406E" }, { title: "Hilo rosado", swatch: "#C2456E", soldOut: true }] },
  { id: "p3", slug: "aretes-argolla-mediana", cat: "aretes", name: "Aretes argolla mediana", price: 6400, compare: 7800, sale: true, featured: true, ill: "hoops", warranty: W1, material: "Oro laminado 18K", measurements: "2,5 cm", short: "La argolla que va con todo: ligera, cómoda y con brillo pulido.", days: 40 },
  { id: "p4", slug: "dije-trebol", cat: "dijes", name: "Dije trébol", price: 7200, featured: true, ill: "clover", warranty: W1, material: "Oro laminado 18K", measurements: "1,5 cm", short: "Cuatro hojas pulidas con centro brillante. Combínalo con la Cadena Singapur.", days: 25 },
  { id: "p5", slug: "topitos-esfera", cat: "topitos", name: "Topitos esfera 6 mm", price: 3800, isNew: true, ill: "studs", warranty: W1, material: "Oro laminado 18K", measurements: "6 mm", short: "Esferas pulidas para todos los días. Cierre de mariposa.", days: 3 },
  { id: "p6", slug: "pulsera-balineria-4mm", cat: "balineria", name: "Pulsera balinería 4 mm", price: 8400, isNew: true, ill: "beads", warranty: W5, material: "Balinería en oro laminado 18K", measurements: "18 cm · 4 mm", short: "Balines de oro laminado con garantía de color de 5 años.", days: 5 },
  { id: "p7", slug: "medalla-virgen", cat: "religiosos", name: "Medalla Virgen", price: 6800, isNew: true, ill: "medal", warranty: W1, material: "Oro laminado 18K", measurements: "2 cm", short: "Medalla con relieve fino para llevar cerca.", days: 8 },
  { id: "p8", slug: "set-corona", cat: "sets", name: "Set Corona: cadena, dije y topitos", price: 14900, compare: 17900, sale: true, set: true, featured: false, ill: "set", warranty: null, material: "Oro laminado 18K", short: "Tres piezas que ya combinan, listas para regalar.", days: 15 },
  { id: "p9", slug: "pulsera-eslabones", cat: "pulseras", name: "Pulsera eslabones", price: 7900, ill: "links", warranty: W1, material: "Oro laminado 18K", measurements: "19 cm", short: "Eslabones ovalados con cierre de langosta.", days: 50 },
  { id: "p10", slug: "dije-trebol-mini", cat: "treboles", name: "Dije trébol mini", price: 5400, isNew: true, ill: "clover", warranty: W1, material: "Oro laminado 18K", measurements: "1 cm", short: "La versión delicada del trébol, para combinar en capas.", days: 2 },
];

const NOW = Date.parse("2026-11-25T12:00:00Z");

export const DEMO_PRODUCTS: ProductDetail[] = seeds.map((s) => {
  const category = DEMO_CATEGORIES.find((c) => c.slug === s.cat)!;
  const variants = (s.variants ?? [{ title: "Única", swatch: "" }]).map((v, i) => ({
    id: `${s.id}-v${i + 1}`,
    sku: `${s.slug.toUpperCase().slice(0, 14)}-${i + 1}`.replace(/[^A-Z0-9-]/g, ""),
    title: v.title,
    priceCents: s.price,
    compareAtCents: s.compare ?? null,
    available: !("soldOut" in v && v.soldOut),
    lowStock: "low" in v && !!v.low,
    swatch: v.swatch || null,
  }));
  const image = { url: null, illustration: s.ill, tint: s.tint, alt: s.name };
  return {
    id: s.id, slug: s.slug, categorySlug: s.cat, categoryName: category.name, name: s.name,
    priceCents: s.price, compareAtCents: s.compare ?? null,
    isNew: !!s.isNew, isOnSale: !!s.sale, isFeatured: !!s.featured, isSet: !!s.set,
    warrantyName: s.warranty?.name ?? null,
    image,
    images: [image, { ...image, alt: `${s.name}, detalle` }],
    defaultVariantId: variants[0]!.id, variantCount: variants.length,
    available: variants.some((v) => v.available),
    publishedAt: new Date(NOW - s.days * 86_400_000).toISOString(),
    shortDescription: s.short, descriptionMd: `${s.short}\n\nCada pieza D'ORATA llega con su certificado de autenticidad.`,
    material: s.material ?? null, measurements: s.measurements ?? null, color: s.color ?? "Dorado",
    shippingNotes: null, // ⚠ pendiente: empaque/estuche — solo si la dueña lo confirma
    variants, warranty: s.warranty,
  };
});

/** Políticas: mismos borradores del seed (sin texto legal inventado). */
const legal = (kind: string, slug: string, title: string, bodyMd: string): LegalPage => ({ kind, slug, title, bodyMd, versionLabel: null, effectiveAt: null, inReview: true });
export const DEMO_LEGAL: LegalPage[] = [
  legal("privacy", "privacidad", "Política de Privacidad", "## Quiénes somos\n[Razón social, nombre comercial, contacto de privacidad]\n\n## Qué datos recogemos y para qué\n[Pedidos, entrega, soporte, garantías, obligaciones fiscales, prevención de fraude, comunicaciones autorizadas]\n\n## Con quién los compartimos\n[Stripe (pagos), transportistas, proveedores de email y hosting]\n\n## No vendemos tu información personal\n\n## Tus derechos y cómo ejercerlos\n[Formulario de privacidad · plazos · derechos por estado]\n\n## Menores de edad\n[La tienda no está dirigida a niños; no recogemos intencionalmente datos de menores]\n\n## Cambios a esta política\n\n> [REQUIERE REVISIÓN LEGAL]"),
  legal("cookies", "cookies", "Política de Cookies", "## Qué son las cookies\n\n## Categorías\nEsenciales · Analíticas · Marketing · Personalización\n\n## Lista de cookies\n- **dorata_consent** (D'ORATA, esencial, 12 meses): guarda tus preferencias de cookies.\n- **dorata_cart** (D'ORATA, esencial, almacenamiento local): recuerda tu carrito en este dispositivo.\n\n## Cómo cambiar tus preferencias\nUsa el enlace \"Preferencias de privacidad\" al final de cada página.\n\n> [REQUIERE REVISIÓN LEGAL]"),
  legal("terms", "terminos-y-condiciones", "Términos y Condiciones", "> [REQUIERE REVISIÓN LEGAL]"),
  legal("site_terms", "terminos-de-uso", "Términos de uso del sitio", "> [REQUIERE REVISIÓN LEGAL]"),
  legal("shipping", "envios", "Política de Envíos", "[Métodos, costos y tiempos se muestran desde Configuración › Envíos]\n\n> [REQUIERE REVISIÓN]"),
  legal("returns", "cambios-y-devoluciones", "Política de Cambios y Devoluciones", "> [REQUIERE REVISIÓN LEGAL]"),
  legal("refunds", "reembolsos", "Política de Reembolsos", "> [REQUIERE REVISIÓN LEGAL]"),
  legal("warranty", "garantia", "Garantía D'ORATA", ""),
  legal("contact", "contacto", "Información de contacto comercial", "[Razón social · correo · WhatsApp · dirección comercial cuando corresponda]"),
];

/** Banner de lanzamiento: idéntico a lo que devuelve current_announcement() con el seed aprobado. */
export function demoAnnouncement(nowMs: number): Announcement | null {
  const target = "2026-12-02T05:00:00.000Z"; // 2-dic-2026 00:00 America/New_York
  const after = { text: "✦ D'ORATA YA ESTÁ DISPONIBLE · COMPRA AHORA ✦", link_url: "/", link_label: "Comprar" };
  const base = {
    campaign_id: "demo-launch", style: "black" as const, bg_color: null, text_color: null,
    motion: "marquee" as const, marquee_speed: 36, rotate_interval_seconds: 5, repeat: true,
    ends_at: null, timezone: "America/New_York",
  };
  if (nowMs >= Date.parse(target)) {
    return { ...base, mode: "after", items: [after], countdown_target_at: null, next_change_at: null, after: null };
  }
  return {
    ...base, mode: "countdown", countdown_target_at: target, next_change_at: target, after,
    items: [{ text: "Faltan {countdown}", countdown: true, link_url: null, link_label: null },
            { text: "✦ LANZAMIENTO D'ORATA · 02.12.26 · MUY PRONTO ✦", link_url: null, link_label: null }],
  };
}
