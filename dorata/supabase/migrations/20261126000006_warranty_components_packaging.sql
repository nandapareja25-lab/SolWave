-- =============================================================================
-- D'ORATA — Garantía por componente, políticas "por definir" y texto de empaque
-- -----------------------------------------------------------------------------
-- Una pieza puede tener partes con condiciones distintas. Ejemplo (definido por la dueña):
--   Pulsera artesanal D'ORATA → balines de oro laminado: garantía de color 5 años;
--                                hilo/neopreno y armado: condiciones POR DEFINIR (configurable).
-- Garantía y devoluciones son conceptos separados (devoluciones viven en pages 'returns').
-- =============================================================================

-- Una política puede existir sin duración definida todavía (se muestra como "por definir").
alter table public.warranty_policies drop constraint if exists warranty_policies_duration_months_check;
alter table public.warranty_policies alter column duration_months drop not null;
alter table public.warranty_policies
  add constraint warranty_policies_duration_months_check
  check (duration_months is null or duration_months between 0 and 600);

-- Componentes de garantía por producto. Si un producto tiene componentes, mandan sobre la
-- garantía del producto/categoría; si no, aplica products.warranty_policy_id → categoría.
create table public.product_warranty_components (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references public.products (id) on delete cascade,
  position           smallint not null default 0,
  label              jsonb not null,           -- {"es":"Balines de oro laminado","en":"…"}
  warranty_policy_id uuid references public.warranty_policies (id) on delete set null,
  created_at         timestamptz not null default now(),
  unique (product_id, position),
  check (label ? 'es')
);
create index product_warranty_components_product on public.product_warranty_components (product_id, position);

alter table public.product_warranty_components enable row level security;
alter table public.product_warranty_components force row level security;
create policy "public read warranty components" on public.product_warranty_components
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and (p.status = 'active' or (select public.is_staff()))));
create policy "staff write warranty components" on public.product_warranty_components
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create trigger product_warranty_components_audit after insert or update or delete on public.product_warranty_components
  for each row execute function public.audit_row();

-- Snapshot en el pedido: qué cubría cada componente el día de la compra.
alter table public.order_items
  add column warranty_components jsonb not null default '[]'::jsonb;

-- Texto de empaque configurable (sin prometer modelo/color/presentación específica).
alter table public.store_settings
  add column packaging_note jsonb not null default '{}'::jsonb;

-- Estado de configuración de envíos: la tienda NO muestra tiempos ni umbrales de envío gratis
-- hasta que exista al menos un método activo con esos datos.
create or replace function public.public_shipping_summary()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'configured', exists (select 1 from public.shipping_methods where is_active),
    'free_over_cents', (select min(free_over_cents) from public.shipping_methods where is_active and free_over_cents is not null),
    'methods', coalesce((
      select jsonb_agg(jsonb_build_object(
               'code', m.code, 'type', m.type, 'price_cents', m.price_cents, 'free_over_cents', m.free_over_cents,
               'eta_min_days', m.eta_min_days, 'eta_max_days', m.eta_max_days,
               'name', t.name, 'description', t.description) order by m.sort_order)
        from public.shipping_methods m
        left join public.shipping_method_translations t on t.shipping_method_id = m.id and t.locale = 'es'
       where m.is_active), '[]'::jsonb));
$$;
grant execute on function public.public_shipping_summary() to anon, authenticated;
