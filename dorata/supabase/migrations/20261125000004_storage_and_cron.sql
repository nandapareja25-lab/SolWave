-- =============================================================================
-- D'ORATA — Storage (fotos) y tareas programadas
-- =============================================================================

-- Buckets: públicos para lo que la tienda muestra; privados para evidencias y recibos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-media',    'product-media',    true,  10485760,  array['image/webp', 'image/avif', 'image/jpeg', 'image/png', 'video/mp4', 'video/webm']),
  ('brand',            'brand',            true,  5242880,   array['image/svg+xml', 'image/webp', 'image/png']),
  ('category-media',   'category-media',   true,  5242880,   array['image/webp', 'image/avif', 'image/jpeg', 'image/png']),
  ('warranty-claims',  'warranty-claims',  false, 10485760,  array['image/webp', 'image/jpeg', 'image/png', 'image/heic']),
  ('expense-receipts', 'expense-receipts', false, 10485760,  array['image/webp', 'image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;

-- Lectura pública solo de los buckets públicos (el CDN sirve las fotos).
create policy "public read storefront media" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('product-media', 'brand', 'category-media'));

-- Subir / reemplazar / borrar fotos de catálogo: staff+
create policy "staff write storefront media" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-media', 'category-media') and (select public.is_staff()));
create policy "staff update storefront media" on storage.objects
  for update to authenticated
  using (bucket_id in ('product-media', 'category-media') and (select public.is_staff()));
create policy "staff delete storefront media" on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-media', 'category-media') and (select public.is_staff()));

-- Logo / marca: admin+
create policy "admin write brand" on storage.objects
  for all to authenticated
  using (bucket_id = 'brand' and (select public.is_admin()))
  with check (bucket_id = 'brand' and (select public.is_admin()));

-- Evidencias de garantía: staff+ (lectura con URL firmada de corta duración)
create policy "staff all warranty evidence" on storage.objects
  for all to authenticated
  using (bucket_id = 'warranty-claims' and (select public.is_staff()))
  with check (bucket_id = 'warranty-claims' and (select public.is_staff()));

-- Recibos de gastos: admin+
create policy "admin all receipts" on storage.objects
  for all to authenticated
  using (bucket_id = 'expense-receipts' and (select public.is_admin()))
  with check (bucket_id = 'expense-receipts' and (select public.is_admin()));

-- Barrido de reservas vencidas cada 5 minutos (red de seguridad del webhook de Stripe).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('release-expired-reservations', '*/5 * * * *',
                          $cron$ select public.release_expired_reservations(); $cron$);
  end if;
end $$;
