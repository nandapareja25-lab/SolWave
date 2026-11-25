-- =============================================================================
-- D'ORATA — Esquema inicial (Supabase / PostgreSQL 15+)
-- -----------------------------------------------------------------------------
-- Convenciones:
--   * Dinero SIEMPRE en centavos enteros (integer). Moneda de la tienda: USD.
--   * Pesos colombianos (COP) en numeric(14,2) — solo para costos de proveedor.
--   * Tasa de cambio = COP por 1 USD, numeric(12,4).
--   * Código en inglés; los textos visibles al cliente viven en tablas *_translations
--     (locale 'es' hoy; 'en' mañana sin reconstruir nada).
--   * RLS activo en TODAS las tablas. Lo que no tiene política está cerrado.
--   * Datos sensibles del negocio (costos, márgenes, notas internas) viven en tablas
--     separadas, porque RLS filtra FILAS, no columnas.
-- =============================================================================

create schema if not exists extensions;
create extension if not exists citext   with schema extensions;
create extension if not exists pg_trgm  with schema extensions;

-- -----------------------------------------------------------------------------
-- 0. Tipos y dominios
-- -----------------------------------------------------------------------------
create domain public.locale_code as text check (value in ('es', 'en'));
create domain public.cents       as integer check (value >= 0);

create type public.app_role               as enum ('staff', 'admin', 'owner'); -- orden = jerarquía
create type public.product_status         as enum ('draft', 'active', 'archived');
create type public.sales_channel          as enum ('web', 'instagram', 'tiktok', 'whatsapp', 'in_person', 'other');
create type public.order_status           as enum ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded');
create type public.payment_status         as enum ('unpaid', 'processing', 'paid', 'failed', 'partially_refunded', 'refunded');
create type public.payment_provider       as enum ('stripe', 'manual');
create type public.inventory_movement_type as enum ('initial_count', 'sale', 'adjustment', 'restock', 'return', 'cancellation', 'manual_correction', 'warranty_replacement');
create type public.reservation_status     as enum ('active', 'committed', 'released', 'expired');
create type public.checkout_status        as enum ('open', 'completed', 'expired', 'failed');
create type public.discount_type          as enum ('percentage', 'fixed_amount', 'free_shipping');
create type public.discount_scope         as enum ('all', 'categories', 'products');
create type public.shipping_method_type   as enum ('standard', 'express', 'free');
create type public.warranty_claim_status  as enum ('submitted', 'in_review', 'approved', 'rejected', 'resolved');
create type public.warranty_resolution    as enum ('replacement', 'repair', 'refund', 'none');
create type public.media_kind             as enum ('image', 'video');
create type public.page_kind              as enum ('privacy', 'cookies', 'terms', 'site_terms', 'shipping', 'returns', 'refunds', 'warranty', 'contact', 'about', 'care', 'other');
create type public.category_auto_rule     as enum ('new', 'sale');

-- -----------------------------------------------------------------------------
-- 1. Utilidades
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Zona horaria IANA válida (America/New_York, America/Bogota…). Se usa en checks.
create or replace function public.is_valid_timezone(p_tz text)
returns boolean language plpgsql immutable set search_path = '' as $$
begin
  perform now() at time zone p_tz;
  return true;
exception when others then
  return false;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Roles de administración
-- -----------------------------------------------------------------------------
create table public.user_roles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       public.app_role not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

-- has_role: ¿el usuario actual tiene al menos este rol? (owner ⊇ admin ⊇ staff)
create or replace function public.has_role(p_min public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = (select auth.uid()) and r.role >= p_min
  );
$$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = ''
  as $$ select public.has_role('staff'::public.app_role) $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = ''
  as $$ select public.has_role('admin'::public.app_role) $$;
create or replace function public.is_owner() returns boolean language sql stable security definer set search_path = ''
  as $$ select public.has_role('owner'::public.app_role) $$;

-- -----------------------------------------------------------------------------
-- 3. Configuración de la tienda (todo editable desde el panel)
-- -----------------------------------------------------------------------------
-- 3a. Pública: lo que la tienda necesita mostrar.
create table public.store_settings (
  id                 smallint primary key default 1 check (id = 1),
  store_name         text not null default 'D''ORATA',
  descriptor         text not null default 'Oro laminado 18K',
  legal_name         text,                       -- p.ej. Mafer Studio LLC (cuando exista)
  logo_path          text,                       -- Storage: brand/...
  logo_dark_path     text,
  favicon_path       text,
  theme              jsonb not null default '{}'::jsonb,  -- overrides de tokens de color validados con zod
  domain             text not null default 'dorata18k.com',
  contact_email      text,
  whatsapp_e164      text check (whatsapp_e164 is null or whatsapp_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  phone_e164         text check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  social_links       jsonb not null default '{}'::jsonb,  -- {"instagram":"https://...","tiktok":"...","facebook":"..."}
  social_display_name text not null default 'D''ORATA | Oro Laminado 18K',
  order_prefix       text not null default 'DOR' check (order_prefix ~ '^[A-Z]{2,6}$'),
  default_locale     public.locale_code not null default 'es',
  enabled_locales    text[] not null default array['es'],
  currency           char(3) not null default 'USD' check (currency = 'USD'),
  newsletter_enabled boolean not null default false,
  testimonials_enabled boolean not null default false,
  timezone           text not null default 'America/New_York' check (public.is_valid_timezone(timezone)), -- zona del negocio (editable)
  privacy_email      text,
  business_address   jsonb,                      -- dirección comercial cuando corresponda
  cookie_banner_enabled boolean not null default true,
  privacy_response_days integer not null default 45 check (privacy_response_days between 1 and 90),   -- ⚠ revisar con abogado
  consent_retention_months integer not null default 24 check (consent_retention_months between 1 and 120), -- ⚠ revisar con abogado
  updated_at         timestamptz not null default now(),
  updated_by         uuid references auth.users (id)
);
insert into public.store_settings (id) values (1);

-- 3b. Privada: parámetros financieros (solo admin).
create table public.business_settings (
  id                         smallint primary key default 1 check (id = 1),
  cop_per_usd                numeric(12,4) check (cop_per_usd is null or cop_per_usd > 0), -- tasa manual vigente
  cop_rate_updated_at        timestamptz,
  stripe_fee_pct             numeric(5,3) not null default 2.900 check (stripe_fee_pct between 0 and 20),  -- editable: verifica tu tarifa real
  stripe_fee_fixed_cents     public.cents not null default 30,
  default_packaging_cents    public.cents not null default 0,
  default_intl_shipping_cents public.cents not null default 0,   -- envío internacional imputado por unidad
  default_other_cost_cents   public.cents not null default 0,
  variable_cost_pct          numeric(5,2) not null default 0 check (variable_cost_pct between 0 and 50), -- p.ej. publicidad, merma
  minimum_margin_pct         numeric(5,2) check (minimum_margin_pct is null or minimum_margin_pct between 0 and 95),
  target_margin_pct          numeric(5,2) check (target_margin_pct is null or target_margin_pct between 0 and 95),
  premium_margin_pct         numeric(5,2) check (premium_margin_pct is null or premium_margin_pct between 0 and 95),
  price_rounding             text not null default 'x.99' check (price_rounding in ('none', 'x.99', 'x.00', 'x.95')),
  low_stock_default          integer not null default 2 check (low_stock_default >= 0),
  reservation_minutes        integer not null default 35 check (reservation_minutes between 30 and 1440), -- Stripe Checkout expira en ≥30 min
  manual_payment_methods     text[] not null default array[]::text[],  -- etiquetas que tú defines (Zelle, efectivo…)
  stripe_tax_enabled         boolean not null default false,
  updated_at                 timestamptz not null default now(),
  updated_by                 uuid references auth.users (id),
  constraint margins_ordered check (
    minimum_margin_pct is null or target_margin_pct is null or minimum_margin_pct <= target_margin_pct
  )
);
insert into public.business_settings (id) values (1);

-- Historial de tasas (trazabilidad: qué tasa usaste en cada compra).
create table public.exchange_rates (
  id            bigint generated always as identity primary key,
  cop_per_usd   numeric(12,4) not null check (cop_per_usd > 0),
  source        text not null default 'manual',
  note          text,
  effective_at  timestamptz not null default now(),
  created_by    uuid references auth.users (id)
);

-- -----------------------------------------------------------------------------
-- 4. Contenido editable: políticas, FAQ, testimonios
-- -----------------------------------------------------------------------------
-- Políticas y páginas. region_code null = general; 'US-CA', 'US-CO', 'EU'… = aviso específico por jurisdicción.
-- El texto PUBLICADO vive en page_versions (historial inmutable, migración 5). page_translations es el borrador.
create table public.pages (
  id           uuid primary key default gen_random_uuid(),
  kind         public.page_kind not null,
  region_code  text check (region_code is null or region_code ~ '^[A-Z]{2}(-[A-Z0-9]{1,3})?$'),
  is_published boolean not null default false,
  show_in_footer boolean not null default true,
  sort_order   integer not null default 0,
  updated_at   timestamptz not null default now(),
  unique nulls not distinct (kind, region_code)
);
create table public.page_translations (
  page_id         uuid not null references public.pages (id) on delete cascade,
  locale          public.locale_code not null,
  slug            text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null,
  body_md         text not null default '',
  seo_title       text,
  seo_description text,
  primary key (page_id, locale),
  unique (locale, slug)
);

create table public.faq_items (
  id           uuid primary key default gen_random_uuid(),
  topic        text not null default 'general',   -- general, garantia, envios, cuidado…
  is_published boolean not null default true,
  sort_order   integer not null default 0
);
create table public.faq_item_translations (
  faq_item_id uuid not null references public.faq_items (id) on delete cascade,
  locale      public.locale_code not null,
  question    text not null,
  answer_md   text not null,
  primary key (faq_item_id, locale)
);

-- Preparado para el futuro: se muestra SOLO con testimonios reales publicados.
create table public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  author_name  text not null,
  author_place text,
  body         text not null,
  rating       smallint check (rating between 1 and 5),
  source       text,                -- instagram, google, whatsapp… (evidencia)
  product_id   uuid,                -- FK añadida tras crear products
  is_published boolean not null default false,
  consent_at   timestamptz,         -- permiso del cliente para publicarlo
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- Suscripciones de marketing: ver migración 5 (marketing_subscriptions + historial de consentimiento).

-- -----------------------------------------------------------------------------
-- 5. Garantías (políticas editables)
-- -----------------------------------------------------------------------------
create table public.warranty_policies (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique check (code ~ '^[a-z0-9_]+$'),
  duration_months integer not null check (duration_months between 0 and 600),
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  updated_at      timestamptz not null default now()
);
create table public.warranty_policy_translations (
  warranty_policy_id uuid not null references public.warranty_policies (id) on delete cascade,
  locale             public.locale_code not null,
  name               text not null,             -- "Garantía 1 año"
  summary            text not null,             -- 1-2 líneas para la ficha de producto
  coverage_md        text not null,
  exclusions_md      text not null,
  primary key (warranty_policy_id, locale)
);

-- -----------------------------------------------------------------------------
-- 6. Catálogo: categorías, colecciones, productos, variantes, medios
-- -----------------------------------------------------------------------------
create table public.categories (
  id                 uuid primary key default gen_random_uuid(),
  parent_id          uuid references public.categories (id) on delete set null,
  image_path         text,
  is_visible         boolean not null default true,
  show_in_nav        boolean not null default true,
  sort_order         integer not null default 0,
  auto_rule          public.category_auto_rule,  -- 'new'/'sale' = categoría automática por flags
  default_warranty_policy_id uuid references public.warranty_policies (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);
create table public.category_translations (
  category_id     uuid not null references public.categories (id) on delete cascade,
  locale          public.locale_code not null,
  name            text not null,
  slug            text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description     text,
  seo_title       text,
  seo_description text,
  primary key (category_id, locale),
  unique (locale, slug)
);

create table public.collections (
  id          uuid primary key default gen_random_uuid(),
  image_path  text,
  is_visible  boolean not null default true,
  is_set      boolean not null default false,   -- colecciones tipo "Sets" para la home
  sort_order  integer not null default 0,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create table public.collection_translations (
  collection_id   uuid not null references public.collections (id) on delete cascade,
  locale          public.locale_code not null,
  name            text not null,
  slug            text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description     text,
  seo_title       text,
  seo_description text,
  primary key (collection_id, locale),
  unique (locale, slug)
);

-- Segmentos de mercado (estudio de precios): "Pulsera de hilo + balines oro laminado".
create table public.pricing_segments (
  id                uuid primary key default gen_random_uuid(),
  name              text not null unique,
  market_low_cents  public.cents,
  market_high_cents public.cents,
  positioning       text not null default 'premium' check (positioning in ('accessible', 'mid', 'premium')),
  notes             text,
  updated_at        timestamptz not null default now(),
  check (market_low_cents is null or market_high_cents is null or market_low_cents <= market_high_cents)
);

create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  status              public.product_status not null default 'draft',
  primary_category_id uuid not null references public.categories (id) on delete restrict,
  warranty_policy_id  uuid references public.warranty_policies (id) on delete set null, -- null = hereda de la categoría
  pricing_segment_id  uuid references public.pricing_segments (id) on delete set null,
  material            text,              -- "Oro laminado 18K"
  measurements        text,              -- "45 cm · 3 mm"
  color               text,
  tags                text[] not null default array[]::text[],
  is_featured         boolean not null default false,
  is_new              boolean not null default false,
  new_until           date,
  is_on_sale          boolean not null default false,
  weight_grams        numeric(8,2) check (weight_grams is null or weight_grams >= 0),
  shipping_notes      text,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create table public.product_translations (
  product_id        uuid not null references public.products (id) on delete cascade,
  locale            public.locale_code not null,
  name              text not null,
  slug              text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text,
  description_md    text,
  seo_title         text,
  seo_description   text,
  primary key (product_id, locale),
  unique (locale, slug)
);
-- Categorías adicionales (un producto vive en 1 principal — su URL — y puede aparecer en más).
create table public.product_categories (
  product_id  uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  sort_order  integer not null default 0,
  primary key (product_id, category_id)
);
create table public.product_collections (
  product_id    uuid not null references public.products (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  sort_order    integer not null default 0,
  primary key (product_id, collection_id)
);
alter table public.testimonials
  add constraint testimonials_product_fk foreign key (product_id) references public.products (id) on delete set null;

-- Variantes: todo producto tiene ≥1 (la "default"). Precio y stock viven aquí.
create table public.product_variants (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products (id) on delete cascade,
  sku                 text not null unique check (sku ~ '^[A-Z0-9][A-Z0-9-]{1,39}$'),
  title               text not null default 'Única',   -- "Hilo negro"
  options             jsonb not null default '{}'::jsonb, -- {"Color de hilo":"Negro"}
  price_cents         public.cents not null,
  compare_at_cents    public.cents,
  weight_grams        numeric(8,2) check (weight_grams is null or weight_grams >= 0),
  low_stock_threshold integer check (low_stock_threshold is null or low_stock_threshold >= 0),
  is_default          boolean not null default false,
  is_active           boolean not null default true,
  position            integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (compare_at_cents is null or compare_at_cents > price_cents)
);
create unique index product_variants_one_default on public.product_variants (product_id) where is_default;

create table public.product_variant_translations (
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  locale     public.locale_code not null,
  title      text not null,
  options    jsonb not null default '{}'::jsonb,
  primary key (variant_id, locale)
);

create table public.product_media (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  variant_id     uuid references public.product_variants (id) on delete set null,
  kind           public.media_kind not null default 'image',
  storage_path   text not null,          -- product-media/{product_id}/{uuid}.webp (original optimizado)
  variants       jsonb not null default '{}'::jsonb, -- {"400":"...-400.webp","800":"...","1600":"..."}
  width          integer check (width > 0),
  height         integer check (height > 0),
  dominant_color text check (dominant_color is null or dominant_color ~ '^#[0-9a-fA-F]{6}$'),
  alt            jsonb not null default '{}'::jsonb, -- {"es":"Cadena singapur 45 cm","en":"..."}
  position       integer not null default 0,
  created_at     timestamptz not null default now(),
  unique (product_id, position) deferrable initially deferred
);

-- Redirecciones 301 cuando cambia un slug (no perder SEO).
create table public.slug_redirects (
  id         bigint generated always as identity primary key,
  locale     public.locale_code not null,
  from_path  text not null,
  to_path    text not null,
  created_at timestamptz not null default now(),
  unique (locale, from_path),
  check (from_path <> to_path)
);

-- -----------------------------------------------------------------------------
-- 7. Costos (PRIVADO — solo admin). Historial por variante.
-- -----------------------------------------------------------------------------
create table public.suppliers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  country    char(2) not null default 'CO',
  contact    text,
  whatsapp   text,
  notes      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.variant_costs (
  id                   uuid primary key default gen_random_uuid(),
  variant_id           uuid not null references public.product_variants (id) on delete cascade,
  supplier_id          uuid references public.suppliers (id) on delete set null,
  original_currency    char(3) not null default 'COP' check (original_currency in ('COP', 'USD')),
  original_amount      numeric(14,2) not null check (original_amount >= 0),     -- 80000.00 COP
  fx_cop_per_usd       numeric(12,4) check (fx_cop_per_usd is null or fx_cop_per_usd > 0), -- tasa usada
  intl_shipping_cents  public.cents not null default 0,
  packaging_cents      public.cents not null default 0,
  other_cents          public.cents not null default 0,
  product_cost_usd_cents integer generated always as (
    case when original_currency = 'USD' then round(original_amount * 100)::integer
         else round(original_amount * 100 / fx_cop_per_usd)::integer end
  ) stored,
  total_unit_cost_cents integer generated always as (
    (case when original_currency = 'USD' then round(original_amount * 100)::integer
          else round(original_amount * 100 / fx_cop_per_usd)::integer end)
    + intl_shipping_cents + packaging_cents + other_cents
  ) stored,
  is_current           boolean not null default true,
  valid_from           timestamptz not null default now(),
  notes                text,
  created_by           uuid references auth.users (id),
  created_at           timestamptz not null default now(),
  check (original_currency = 'USD' or fx_cop_per_usd is not null)
);
create unique index variant_costs_one_current on public.variant_costs (variant_id) where is_current;

-- Al registrar un costo nuevo como vigente, el anterior deja de serlo (se conserva en historial).
create or replace function public.variant_costs_rotate_current()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.is_current then
    update public.variant_costs set is_current = false
     where variant_id = new.variant_id and is_current and id <> new.id;
  end if;
  return new;
end $$;
create trigger variant_costs_rotate before insert or update of is_current on public.variant_costs
  for each row when (new.is_current) execute function public.variant_costs_rotate_current();

-- Estudio de mercado: referencias observadas de competidores.
create table public.market_references (
  id                  uuid primary key default gen_random_uuid(),
  pricing_segment_id  uuid references public.pricing_segments (id) on delete cascade,
  product_id          uuid references public.products (id) on delete set null,
  competitor_name     text not null,
  url                 text,
  description         text,
  observed_price_cents public.cents not null,
  observed_at         date not null default current_date,
  notes               text,
  created_by          uuid references auth.users (id),
  created_at          timestamptz not null default now(),
  check (pricing_segment_id is not null or product_id is not null)
);

-- Recomendaciones de precio guardadas (la calculadora NUNCA cambia el precio sola).
create table public.price_recommendations (
  id                    uuid primary key default gen_random_uuid(),
  variant_id            uuid not null references public.product_variants (id) on delete cascade,
  inputs                jsonb not null,          -- snapshot de costos/tasa/margen/fees usados
  total_cost_cents      public.cents not null,
  minimum_price_cents   public.cents not null,
  recommended_price_cents public.cents not null,
  premium_price_cents   public.cents not null,
  applied_price_cents   public.cents,            -- lo que tú decidiste aplicar (si aplicaste)
  applied_at            timestamptz,
  created_by            uuid references auth.users (id),
  created_at            timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 8. Inventario: niveles, reservas y libro de movimientos (append-only)
-- -----------------------------------------------------------------------------
create table public.inventory_levels (
  variant_id uuid primary key references public.product_variants (id) on delete cascade,
  on_hand    integer not null default 0 check (on_hand >= 0),
  reserved   integer not null default 0 check (reserved >= 0),
  updated_at timestamptz not null default now(),
  check (reserved <= on_hand)
);
-- Cada variante nace con su fila de inventario en 0.
create or replace function public.create_inventory_level()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.inventory_levels (variant_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger product_variants_inventory after insert on public.product_variants
  for each row execute function public.create_inventory_level();

-- Carritos que pasaron a pagar (antes de que exista el pedido).
create table public.checkouts (
  id                  uuid primary key default gen_random_uuid(),
  status              public.checkout_status not null default 'open',
  email               extensions.citext,
  locale              public.locale_code not null default 'es',
  items               jsonb not null,      -- snapshot [{variant_id, quantity, unit_price_cents}]
  subtotal_cents      public.cents not null,
  discount_id         uuid,                -- FK añadida tras discounts
  discount_cents      public.cents not null default 0,
  shipping_method_id  uuid,                -- FK añadida tras shipping_methods
  shipping_cents      public.cents not null default 0,
  stripe_session_id   text unique,
  expires_at          timestamptz not null,
  order_id            uuid,                -- FK añadida tras orders
  client_ip_hash      text,                -- para rate limit/fraude, nunca la IP cruda
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.inventory_reservations (
  id          uuid primary key default gen_random_uuid(),
  variant_id  uuid not null references public.product_variants (id) on delete cascade,
  checkout_id uuid not null references public.checkouts (id) on delete cascade,
  quantity    integer not null check (quantity > 0),
  status      public.reservation_status not null default 'active',
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  unique (checkout_id, variant_id)
);
create index inventory_reservations_active_exp on public.inventory_reservations (expires_at) where status = 'active';

create table public.inventory_movements (
  id                bigint generated always as identity primary key,
  variant_id        uuid not null references public.product_variants (id) on delete restrict,
  type              public.inventory_movement_type not null,
  quantity_delta    integer not null check (quantity_delta <> 0),
  on_hand_after     integer not null check (on_hand_after >= 0),
  reason            text,
  order_id          uuid,                 -- FK añadida tras orders
  warranty_claim_id uuid,                 -- FK añadida tras warranty_claims
  variant_cost_id   uuid references public.variant_costs (id) on delete set null,
  created_by        uuid references auth.users (id),
  created_at        timestamptz not null default now(),
  check (type <> 'manual_correction' or (reason is not null and length(trim(reason)) >= 3))
);
create index inventory_movements_variant on public.inventory_movements (variant_id, created_at desc);

-- El libro de movimientos no se edita ni se borra: se corrige con otro movimiento.
create or replace function public.forbid_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'IMMUTABLE_LEDGER: % no admite %', tg_table_name, tg_op;
end $$;
create trigger inventory_movements_immutable before update or delete on public.inventory_movements
  for each row execute function public.forbid_mutation();

-- -----------------------------------------------------------------------------
-- 9. Clientes
-- -----------------------------------------------------------------------------
create table public.customers (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid unique references auth.users (id) on delete set null, -- null = invitado
  email              extensions.citext not null unique,
  full_name          text,
  phone_e164         text,
  anonymized_at      timestamptz,             -- solicitud de eliminación atendida (datos fiscales conservados)
  stripe_customer_id text unique,
  instagram_handle   text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index customers_name_trgm on public.customers using gin (full_name extensions.gin_trgm_ops);

create table public.customer_addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  full_name   text not null,
  line1       text not null,
  line2       text,
  city        text not null,
  state       text,
  postal_code text,
  country     char(2) not null default 'US',
  phone_e164  text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index customer_addresses_customer on public.customer_addresses (customer_id);

-- Notas internas en tabla aparte: el cliente con cuenta NUNCA puede leerlas.
create table public.customer_notes (
  id          bigint generated always as identity primary key,
  customer_id uuid not null references public.customers (id) on delete cascade,
  body        text not null,
  created_by  uuid references auth.users (id),
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 10. Envíos y descuentos
-- -----------------------------------------------------------------------------
create table public.shipping_methods (
  id                    uuid primary key default gen_random_uuid(),
  code                  text not null unique check (code ~ '^[a-z0-9_]+$'),
  type                  public.shipping_method_type not null,
  price_cents           public.cents not null default 0,
  free_over_cents       public.cents,       -- envío gratis desde este subtotal (null = no aplica)
  min_subtotal_cents    public.cents,       -- condición para mostrar el método
  eta_min_days          integer check (eta_min_days is null or eta_min_days >= 0),
  eta_max_days          integer check (eta_max_days is null or eta_max_days >= 0),
  countries             text[] not null default array['US'],
  provider              text not null default 'manual',  -- futuro: 'usps' | 'ups' | 'shippo' | 'easypost'
  provider_service_code text,
  is_active             boolean not null default false,
  sort_order            integer not null default 0,
  updated_at            timestamptz not null default now(),
  check (eta_min_days is null or eta_max_days is null or eta_min_days <= eta_max_days)
);
create table public.shipping_method_translations (
  shipping_method_id uuid not null references public.shipping_methods (id) on delete cascade,
  locale             public.locale_code not null,
  name               text not null,
  description        text,
  primary key (shipping_method_id, locale)
);

create table public.discounts (
  id                       uuid primary key default gen_random_uuid(),
  code                     extensions.citext unique check (code is null or code ~ '^[A-Za-z0-9_-]{3,32}$'),
  description              text,                 -- interno
  type                     public.discount_type not null,
  percent_off              numeric(5,2) check (percent_off is null or (percent_off > 0 and percent_off <= 100)),
  amount_off_cents         public.cents,
  scope                    public.discount_scope not null default 'all',
  min_subtotal_cents       public.cents,
  starts_at                timestamptz,
  ends_at                  timestamptz,
  usage_limit              integer check (usage_limit is null or usage_limit > 0),
  usage_limit_per_customer integer check (usage_limit_per_customer is null or usage_limit_per_customer > 0),
  first_order_only         boolean not null default false,
  times_used               integer not null default 0 check (times_used >= 0),
  is_active                boolean not null default false,
  stripe_coupon_id         text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  check ((type = 'percentage'   and percent_off is not null and amount_off_cents is null)
      or (type = 'fixed_amount' and amount_off_cents is not null and percent_off is null)
      or (type = 'free_shipping' and percent_off is null and amount_off_cents is null)),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create table public.discount_categories (
  discount_id uuid not null references public.discounts (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (discount_id, category_id)
);
create table public.discount_products (
  discount_id uuid not null references public.discounts (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  primary key (discount_id, product_id)
);
alter table public.checkouts
  add constraint checkouts_discount_fk foreign key (discount_id) references public.discounts (id) on delete set null,
  add constraint checkouts_shipping_fk foreign key (shipping_method_id) references public.shipping_methods (id) on delete set null;

-- -----------------------------------------------------------------------------
-- 11. Pedidos, pagos, reembolsos, envíos
-- -----------------------------------------------------------------------------
create sequence public.order_number_seq start 1001;

create table public.orders (
  id                        uuid primary key default gen_random_uuid(),
  order_number              bigint not null unique default nextval('public.order_number_seq'),
  channel                   public.sales_channel not null default 'web',
  status                    public.order_status not null default 'pending',
  payment_status            public.payment_status not null default 'unpaid',
  customer_id               uuid references public.customers (id) on delete set null,
  email                     extensions.citext,
  phone_e164                text,
  customer_name             text,
  shipping_address          jsonb,        -- snapshot inmutable de la dirección
  billing_address           jsonb,
  locale                    public.locale_code not null default 'es',
  currency                  char(3) not null default 'USD' check (currency = 'USD'),
  subtotal_cents            public.cents not null default 0,
  discount_cents            public.cents not null default 0,
  shipping_cents            public.cents not null default 0,
  tax_cents                 public.cents not null default 0,
  total_cents               public.cents not null default 0,
  refunded_cents            public.cents not null default 0,
  discount_id               uuid references public.discounts (id) on delete set null,
  discount_code             text,
  shipping_method_id        uuid references public.shipping_methods (id) on delete set null,
  shipping_method_name      text,
  payment_provider          public.payment_provider not null default 'stripe',
  payment_method_label      text,         -- "Tarjeta", "Apple Pay", "Zelle"…
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id  text unique,
  checkout_id               uuid unique references public.checkouts (id) on delete set null,
  customer_note             text,
  needs_attention           boolean not null default false,  -- p.ej. conflicto de stock post-pago
  attention_reason          text,
  created_by                uuid references auth.users (id), -- admin que creó un pedido manual
  placed_at                 timestamptz not null default now(),
  paid_at                   timestamptz,
  shipped_at                timestamptz,
  delivered_at              timestamptz,
  cancelled_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  check (total_cents = subtotal_cents - discount_cents + shipping_cents + tax_cents),
  check (refunded_cents <= total_cents)
);
create index orders_customer on public.orders (customer_id);
create index orders_placed_at on public.orders (placed_at desc);
create index orders_status on public.orders (status);
create index orders_email on public.orders (email);

alter table public.checkouts
  add constraint checkouts_order_fk foreign key (order_id) references public.orders (id) on delete set null;
alter table public.inventory_movements
  add constraint inventory_movements_order_fk foreign key (order_id) references public.orders (id) on delete restrict;

create table public.order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders (id) on delete cascade,
  variant_id         uuid references public.product_variants (id) on delete set null,
  product_id         uuid references public.products (id) on delete set null,
  product_name       text not null,      -- snapshot: si renombras el producto, el pedido no cambia
  variant_title      text,
  sku                text not null,
  quantity           integer not null check (quantity > 0),
  unit_price_cents   public.cents not null,
  discount_cents     public.cents not null default 0,
  line_total_cents   public.cents not null,
  warranty_policy_id uuid references public.warranty_policies (id) on delete set null,
  warranty_months    integer not null default 0 check (warranty_months >= 0),
  warranty_starts_on date,
  warranty_ends_on   date,
  created_at         timestamptz not null default now(),
  check (line_total_cents = unit_price_cents * quantity - discount_cents)
);
create index order_items_order on public.order_items (order_id);
create index order_items_variant on public.order_items (variant_id);

-- Costo congelado al momento de la venta (PRIVADO). Base del costo de mercancía vendida.
create table public.order_item_costs (
  order_item_id   uuid primary key references public.order_items (id) on delete cascade,
  unit_cost_cents public.cents not null,
  variant_cost_id uuid references public.variant_costs (id) on delete set null
);

create table public.order_events (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  type        text not null,            -- status_changed, payment_succeeded, note, refund…
  from_status public.order_status,
  to_status   public.order_status,
  message     text,
  is_internal boolean not null default true,
  actor_id    uuid references auth.users (id),
  created_at  timestamptz not null default now()
);
create index order_events_order on public.order_events (order_id, created_at);

create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  provider      public.payment_provider not null,
  provider_ref  text,                     -- pi_… / ch_…
  method_label  text,
  amount_cents  public.cents not null,
  fee_cents     public.cents,             -- comisión REAL de Stripe (balance transaction)
  status        public.payment_status not null,
  created_at    timestamptz not null default now(),
  unique (provider, provider_ref)
);

create table public.refunds (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  payment_id    uuid references public.payments (id) on delete set null,
  amount_cents  integer not null check (amount_cents > 0),
  reason        text,
  provider_ref  text unique,              -- re_…
  restocked     boolean not null default false,
  created_by    uuid references auth.users (id),
  created_at    timestamptz not null default now()
);

create table public.shipments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  carrier         text,                   -- USPS, UPS…
  service         text,
  tracking_number text,
  tracking_url    text,
  label_cost_cents public.cents,          -- costo real del envío (finanzas)
  shipped_at      timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz not null default now()
);

create table public.discount_redemptions (
  id           bigint generated always as identity primary key,
  discount_id  uuid not null references public.discounts (id) on delete cascade,
  order_id     uuid not null unique references public.orders (id) on delete cascade,
  customer_id  uuid references public.customers (id) on delete set null,
  email        extensions.citext,
  amount_cents public.cents not null,
  created_at   timestamptz not null default now()
);

-- Idempotencia de webhooks: cada evento de Stripe se procesa una sola vez.
create table public.stripe_events (
  id           text primary key,          -- evt_…
  type         text not null,
  status       text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  error        text,
  received_at  timestamptz not null default now(),
  processed_at timestamptz
);

-- -----------------------------------------------------------------------------
-- 12. Garantías: solicitudes y certificados de autenticidad
-- -----------------------------------------------------------------------------
create sequence public.warranty_claim_number_seq start 1;

create table public.warranty_claims (
  id                   uuid primary key default gen_random_uuid(),
  claim_number         bigint not null unique default nextval('public.warranty_claim_number_seq'),
  order_id             uuid not null references public.orders (id) on delete restrict,
  order_item_id        uuid references public.order_items (id) on delete set null,
  customer_id          uuid references public.customers (id) on delete set null,
  status               public.warranty_claim_status not null default 'submitted',
  reason_category      text not null,       -- color, ensamble, laminado, porosidad, otro
  description          text,
  piece_is_complete    boolean not null,    -- las piezas incompletas no se reciben
  received_on          date not null default current_date,
  within_warranty      boolean,             -- calculado al registrar contra warranty_ends_on
  decision_notes       text,
  decided_at           timestamptz,
  decided_by           uuid references auth.users (id),
  resolution           public.warranty_resolution,
  replacement_variant_id uuid references public.product_variants (id) on delete set null,
  resolved_at          timestamptz,
  internal_notes       text,
  created_by           uuid references auth.users (id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (status not in ('approved', 'resolved') or piece_is_complete),
  check (status <> 'resolved' or resolution is not null)
);
create index warranty_claims_order on public.warranty_claims (order_id);
alter table public.inventory_movements
  add constraint inventory_movements_claim_fk foreign key (warranty_claim_id) references public.warranty_claims (id) on delete restrict;

create table public.warranty_claim_photos (
  id           uuid primary key default gen_random_uuid(),
  claim_id     uuid not null references public.warranty_claims (id) on delete cascade,
  storage_path text not null,               -- bucket PRIVADO warranty-claims
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);
create table public.warranty_claim_events (
  id         bigint generated always as identity primary key,
  claim_id   uuid not null references public.warranty_claims (id) on delete cascade,
  type       text not null,
  message    text,
  actor_id   uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- Espejo digital de la tarjeta física. Un pedido puede tener varias tarjetas (3 joyas c/u).
create table public.authenticity_certificates (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete restrict,
  issued_on     date not null,
  customer_name text not null,
  sequence      smallint not null default 1 check (sequence > 0),
  created_by    uuid references auth.users (id),
  created_at    timestamptz not null default now(),
  unique (order_id, sequence)
);
create table public.certificate_items (
  certificate_id  uuid not null references public.authenticity_certificates (id) on delete cascade,
  position        smallint not null check (position between 1 and 3),   -- máximo 3 joyas por tarjeta
  order_item_id   uuid references public.order_items (id) on delete set null,
  piece_name      text not null,
  price_cents     public.cents not null,
  warranty_months integer not null check (warranty_months >= 0),
  primary key (certificate_id, position)
);

-- -----------------------------------------------------------------------------
-- 13. Finanzas: gastos
-- -----------------------------------------------------------------------------
create table public.expense_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order integer not null default 0
);
create table public.expenses (
  id                  uuid primary key default gen_random_uuid(),
  incurred_on         date not null,
  category_id         uuid references public.expense_categories (id) on delete set null,
  description         text not null,
  original_currency   char(3) not null default 'USD' check (original_currency in ('USD', 'COP')),
  original_amount     numeric(14,2) not null check (original_amount >= 0),
  fx_cop_per_usd      numeric(12,4) check (fx_cop_per_usd is null or fx_cop_per_usd > 0),
  amount_usd_cents    integer generated always as (
    case when original_currency = 'USD' then round(original_amount * 100)::integer
         else round(original_amount * 100 / fx_cop_per_usd)::integer end
  ) stored,
  receipt_path        text,                 -- bucket PRIVADO expense-receipts
  created_by          uuid references auth.users (id),
  created_at          timestamptz not null default now(),
  check (original_currency = 'USD' or fx_cop_per_usd is not null)
);
create index expenses_incurred on public.expenses (incurred_on);

-- -----------------------------------------------------------------------------
-- 14. Auditoría de acciones administrativas
-- -----------------------------------------------------------------------------
create table public.admin_audit_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid,
  action     text not null,                 -- INSERT/UPDATE/DELETE o acción de negocio
  table_name text not null,
  record_id  text,
  old_data   jsonb,
  new_data   jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_log_created on public.admin_audit_log (created_at desc);
create index admin_audit_log_record on public.admin_audit_log (table_name, record_id);
create trigger admin_audit_log_immutable before update or delete on public.admin_audit_log
  for each row execute function public.forbid_mutation();

create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_id text;
begin
  v_id := coalesce(
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'id',
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'user_id');
  insert into public.admin_audit_log (actor_id, action, table_name, record_id, old_data, new_data)
  values ((select auth.uid()), tg_op, tg_table_name, v_id,
          case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'user_roles', 'store_settings', 'business_settings', 'exchange_rates', 'pages', 'page_translations',
    'warranty_policies', 'warranty_policy_translations', 'categories', 'category_translations',
    'collections', 'products', 'product_translations', 'product_variants', 'product_media',
    'variant_costs', 'suppliers', 'pricing_segments', 'shipping_methods', 'discounts',
    'orders', 'refunds', 'warranty_claims', 'authenticity_certificates', 'expenses', 'customer_notes'
  ] loop
    execute format('create trigger %I after insert or update or delete on public.%I
                    for each row execute function public.audit_row()', t || '_audit', t);
  end loop;
end $$;

-- updated_at automático
do $$
declare t text;
begin
  foreach t in array array[
    'store_settings', 'business_settings', 'pages', 'warranty_policies', 'categories', 'collections',
    'pricing_segments', 'products', 'product_variants', 'checkouts', 'customers', 'shipping_methods',
    'discounts', 'orders', 'warranty_claims', 'inventory_levels'
  ] loop
    execute format('create trigger %I before update on public.%I
                    for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 15. Índices de catálogo
-- -----------------------------------------------------------------------------
create index products_status_cat on public.products (status, primary_category_id);
create index products_featured on public.products (is_featured) where status = 'active';
create index products_new on public.products (is_new) where status = 'active';
create index products_tags on public.products using gin (tags);
create index product_translations_name_trgm on public.product_translations using gin (name extensions.gin_trgm_ops);
create index product_variants_product on public.product_variants (product_id);
create index product_media_product on public.product_media (product_id, position);
create index product_categories_category on public.product_categories (category_id);
create index product_collections_collection on public.product_collections (collection_id);
create index categories_parent on public.categories (parent_id);
create index variant_costs_variant on public.variant_costs (variant_id, valid_from desc);
create index market_references_segment on public.market_references (pricing_segment_id);
create index inventory_reservations_checkout on public.inventory_reservations (checkout_id);
create index warranty_claim_photos_claim on public.warranty_claim_photos (claim_id);
create index refunds_order on public.refunds (order_id);
create index payments_order on public.payments (order_id);
create index shipments_order on public.shipments (order_id);
