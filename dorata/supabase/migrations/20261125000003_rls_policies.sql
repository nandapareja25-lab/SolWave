-- =============================================================================
-- D'ORATA — Row Level Security
-- -----------------------------------------------------------------------------
-- Matriz de acceso:
--   anon / cliente   → lee catálogo publicado, contenido publicado y su config pública.
--   cliente con cuenta → además lee SUS pedidos, items, certificados y garantías.
--   staff            → opera: pedidos, clientes, inventario, garantías, catálogo (sin costos).
--   admin            → todo lo anterior + costos, finanzas, descuentos, configuración.
--   owner            → todo + gestionar roles.
--   service_role     → (servidor) salta RLS: webhooks, checkout, cron. Nunca en el navegador.
-- Forma de alto rendimiento: (select fn()) se evalúa una vez por consulta, no por fila.
-- =============================================================================

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('alter table public.%I force row level security', t.tablename);
  end loop;
end $$;

-- Helper: ¿el cliente logueado es dueño de este customer_id?
create or replace function public.current_customer_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select c.id from public.customers c where c.user_id = (select auth.uid());
$$;

-- ---------- Lectura pública del catálogo ----------
create policy "public read visible categories" on public.categories
  for select to anon, authenticated using (is_visible or (select public.is_staff()));
create policy "public read category translations" on public.category_translations
  for select to anon, authenticated using (
    exists (select 1 from public.categories c where c.id = category_id and (c.is_visible or (select public.is_staff()))));

create policy "public read visible collections" on public.collections
  for select to anon, authenticated using (
    (is_visible and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()))
    or (select public.is_staff()));
create policy "public read collection translations" on public.collection_translations
  for select to anon, authenticated using (
    exists (select 1 from public.collections c where c.id = collection_id and (c.is_visible or (select public.is_staff()))));

create policy "public read active products" on public.products
  for select to anon, authenticated using (status = 'active' or (select public.is_staff()));
create policy "public read product translations" on public.product_translations
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and (p.status = 'active' or (select public.is_staff()))));
create policy "public read product variants" on public.product_variants
  for select to anon, authenticated using (
    (is_active and exists (select 1 from public.products p where p.id = product_id and p.status = 'active'))
    or (select public.is_staff()));
create policy "public read variant translations" on public.product_variant_translations
  for select to anon, authenticated using (
    exists (select 1 from public.product_variants v join public.products p on p.id = v.product_id
             where v.id = variant_id and ((v.is_active and p.status = 'active') or (select public.is_staff()))));
create policy "public read product media" on public.product_media
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and (p.status = 'active' or (select public.is_staff()))));
create policy "public read product categories" on public.product_categories
  for select to anon, authenticated using (true);
create policy "public read product collections" on public.product_collections
  for select to anon, authenticated using (true);
create policy "public read redirects" on public.slug_redirects
  for select to anon, authenticated using (true);

create policy "public read warranty policies" on public.warranty_policies
  for select to anon, authenticated using (is_active or (select public.is_staff()));
create policy "public read warranty translations" on public.warranty_policy_translations
  for select to anon, authenticated using (true);
create policy "public read active shipping" on public.shipping_methods
  for select to anon, authenticated using (is_active or (select public.is_staff()));
create policy "public read shipping translations" on public.shipping_method_translations
  for select to anon, authenticated using (true);

create policy "public read store settings" on public.store_settings
  for select to anon, authenticated using (true);
create policy "public read published pages" on public.pages
  for select to anon, authenticated using (is_published or (select public.is_staff()));
create policy "public read page translations" on public.page_translations
  for select to anon, authenticated using (
    exists (select 1 from public.pages p where p.id = page_id and (p.is_published or (select public.is_staff()))));
create policy "public read faq" on public.faq_items
  for select to anon, authenticated using (is_published or (select public.is_staff()));
create policy "public read faq translations" on public.faq_item_translations
  for select to anon, authenticated using (true);
create policy "public read published testimonials" on public.testimonials
  for select to anon, authenticated using ((is_published and consent_at is not null) or (select public.is_staff()));

-- ---------- Escritura del catálogo y contenido: staff+ ----------
do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'category_translations', 'collections', 'collection_translations',
    'products', 'product_translations', 'product_variants', 'product_variant_translations',
    'product_media', 'product_categories', 'product_collections', 'slug_redirects',
    'pages', 'page_translations', 'faq_items', 'faq_item_translations', 'testimonials'
  ] loop
    execute format('create policy "staff write %1$s" on public.%1$I for insert to authenticated with check ((select public.is_staff()))', t);
    execute format('create policy "staff update %1$s" on public.%1$I for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()))', t);
    execute format('create policy "staff delete %1$s" on public.%1$I for delete to authenticated using ((select public.is_staff()))', t);
  end loop;
end $$;

-- ---------- Operación diaria: staff+ (lectura y escritura) ----------
do $$
declare t text;
begin
  foreach t in array array[
    'customers', 'customer_addresses', 'customer_notes', 'orders', 'order_items', 'order_events',
    'shipments', 'warranty_claims', 'warranty_claim_photos', 'warranty_claim_events',
    'authenticity_certificates', 'certificate_items', 'newsletter_subscribers'
  ] loop
    execute format('create policy "staff all %1$s" on public.%1$I for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()))', t);
  end loop;
end $$;

-- Lectura sin escritura directa (se escriben solo vía funciones/servidor): staff+
do $$
declare t text;
begin
  foreach t in array array[
    'inventory_levels', 'inventory_movements', 'inventory_reservations', 'checkouts',
    'payments', 'refunds', 'discount_redemptions'
  ] loop
    execute format('create policy "staff read %1$s" on public.%1$I for select to authenticated using ((select public.is_staff()))', t);
  end loop;
end $$;

-- ---------- Dinero y configuración sensible: admin+ ----------
do $$
declare t text;
begin
  foreach t in array array[
    'business_settings', 'exchange_rates', 'suppliers', 'variant_costs', 'order_item_costs',
    'pricing_segments', 'market_references', 'price_recommendations', 'discounts',
    'discount_categories', 'discount_products', 'expense_categories', 'expenses',
    'warranty_policies', 'warranty_policy_translations', 'shipping_methods', 'shipping_method_translations'
  ] loop
    execute format('create policy "admin all %1$s" on public.%1$I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end $$;

create policy "admin update store settings" on public.store_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin read audit log" on public.admin_audit_log
  for select to authenticated using ((select public.is_admin()));
create policy "admin read stripe events" on public.stripe_events
  for select to authenticated using ((select public.is_admin()));

-- ---------- Roles: solo owner los gestiona; cada uno ve el suyo ----------
create policy "read own role" on public.user_roles
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_owner()));
create policy "owner manages roles" on public.user_roles
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

-- ---------- Clientes con cuenta: solo lo suyo ----------
create policy "customer reads self" on public.customers
  for select to authenticated using (user_id = (select auth.uid()));
create policy "customer reads own addresses" on public.customer_addresses
  for select to authenticated using (customer_id = (select public.current_customer_id()));
create policy "customer reads own orders" on public.orders
  for select to authenticated using (customer_id = (select public.current_customer_id()));
create policy "customer reads own order items" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select public.current_customer_id())));
create policy "customer reads own certificates" on public.authenticity_certificates
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select public.current_customer_id())));
create policy "customer reads own certificate items" on public.certificate_items
  for select to authenticated using (
    exists (select 1 from public.authenticity_certificates ac join public.orders o on o.id = ac.order_id
             where ac.id = certificate_id and o.customer_id = (select public.current_customer_id())));
create policy "customer reads own claims" on public.warranty_claims
  for select to authenticated using (customer_id = (select public.current_customer_id()));

-- Las notas internas, costos y eventos internos NO tienen política de cliente → invisibles.
-- Newsletter: el alta pública entra por el servidor (Turnstile + rate limit), no directo.

-- Índices de soporte para las políticas
create index customers_user on public.customers (user_id);
