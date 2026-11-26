import type { Announcement } from "@/lib/announcement";
import type { StoreMode } from "@/lib/store-mode";

export type JewelKind = "chain" | "hoops" | "studs" | "clover" | "beads" | "thread" | "set" | "medal" | "links";

export type ImageRef = {
  url: string | null;          // foto real (Storage). null → ilustración de respaldo
  illustration: JewelKind;
  tint?: string;               // color del hilo en ilustraciones de pulsera de hilo
  alt: string;
};

export type StoreSettings = {
  storeName: string;
  descriptor: string;
  logoUrl: string | null;
  whatsappE164: string | null;
  contactEmail: string | null;
  social: { instagram?: string; tiktok?: string; facebook?: string };
  socialHandle: string | null;
  testimonialsEnabled: boolean;
  /** Texto de empaque configurable (null = no se menciona). */
  packagingNote: string | null;
  newsletterEnabled: boolean;
  isDemo: boolean;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: ImageRef;
  autoRule: "new" | "sale" | null;
  showInNav: boolean;
};

export type WarrantyPolicy = {
  code: string;
  /** null = duración aún no definida por la dueña ("por definir"). */
  months: number | null;
  name: string;
  summary: string;
  coverageMd: string;
  exclusionsMd: string;
  /** Categorías que usan esta garantía por defecto (se configura en cada categoría). */
  categoryNames: string[];
};

export type ProductCard = {
  id: string;
  slug: string;
  categorySlug: string;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  isNew: boolean;
  isOnSale: boolean;
  isFeatured: boolean;
  isSet: boolean;
  warrantyName: string | null;
  /** Toda la pieza tiene garantía con duración definida (parcial o pendiente → false). */
  hasWarranty: boolean;
  image: ImageRef;
  defaultVariantId: string;
  variantCount: number;
  available: boolean;
  publishedAt: string;
};

export type Variant = {
  id: string;
  sku: string;
  title: string;
  priceCents: number;
  compareAtCents: number | null;
  available: boolean;
  lowStock: boolean;
  swatch: string | null;
};

export type ProductDetail = ProductCard & {
  categoryName: string;
  shortDescription: string | null;
  descriptionMd: string | null;
  material: string | null;
  measurements: string | null;
  color: string | null;
  shippingNotes: string | null;
  images: ImageRef[];
  variants: Variant[];
  warranty: WarrantyPolicy | null;
  /** Si hay componentes, mandan sobre `warranty` (p. ej. balines 5 años + hilo por definir). */
  warrantyComponents: WarrantyComponent[];
};

export type WarrantyComponent = { label: string; policy: WarrantyPolicy | null };

export type LegalPageSummary = { kind: string; slug: string; title: string; inFooter?: boolean };
export type LegalPage = LegalPageSummary & {
  bodyMd: string;
  versionLabel: string | null;
  effectiveAt: string | null;
  inReview: boolean;
};

export type StoreModeInfo = { mode: StoreMode; liveAt: string | null; timezone: string };

export type ProductQuery = {
  categorySlug?: string;
  filter?: "new" | "sale";
  sort?: "featured" | "new" | "price-asc" | "price-desc";
};

export type { Announcement };
