-- Garantía por componente + envíos sin configurar + empaque.
begin;

-- Pulsera artesanal: balines 5 años + hilo/armado "por definir"
insert into public.products (id, status, primary_category_id)
select '11000000-0000-0000-0000-000000000001', 'active', c.id
  from public.categories c join public.category_translations t on t.category_id = c.id where t.slug = 'pulseras-de-hilo';
insert into public.product_warranty_components (product_id, position, label, warranty_policy_id)
select '11000000-0000-0000-0000-000000000001', 1, '{"es":"Balines de oro laminado"}', id from public.warranty_policies where code = 'ball_beads_5y';
insert into public.product_warranty_components (product_id, position, label, warranty_policy_id)
select '11000000-0000-0000-0000-000000000001', 2, '{"es":"Hilo, neopreno y armado"}', id from public.warranty_policies where code = 'wear_components';

do $$
declare r record;
begin
  select array_agg(coalesce(w.duration_months::text, 'por definir') order by c.position) as d into r
    from public.product_warranty_components c join public.warranty_policies w on w.id = c.warranty_policy_id
   where c.product_id = '11000000-0000-0000-0000-000000000001';
  assert r.d = array['60', 'por definir'], r.d::text;
  begin
    insert into public.product_warranty_components (product_id, position, label) values ('11000000-0000-0000-0000-000000000001', 3, '{"en":"x"}');
    raise exception 'debió exigir etiqueta en español';
  exception when check_violation then null;
  end;
  raise notice 'OK W1 — una pieza con componentes de garantía distintos (5 años / por definir)';
end $$;

-- Sets y piezas terminadas: 1 año por categoría
do $$
begin
  assert (select w.duration_months from public.categories c join public.category_translations t on t.category_id = c.id
            join public.warranty_policies w on w.id = c.default_warranty_policy_id where t.slug = 'sets') = 12;
  assert (select c.default_warranty_policy_id from public.categories c join public.category_translations t on t.category_id = c.id
            where t.slug = 'pulseras-de-hilo') is null, 'pulseras de hilo: garantía por componente, no por categoría';
  raise notice 'OK W2 — sets 1 año; pulseras de hilo por componente';
end $$;

-- Envíos sin configurar: la tienda no debe mostrar tiempos ni umbrales
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$
declare s jsonb := public.public_shipping_summary();
begin
  assert (s ->> 'configured')::boolean = false and s -> 'free_over_cents' = 'null'::jsonb and jsonb_array_length(s -> 'methods') = 0, s::text;
  assert (select count(*) from public.product_warranty_components) = 2, 'componentes visibles en productos activos';
  assert (select packaging_note ->> 'es' from public.store_settings) like '%estuche D''ORATA%';
  raise notice 'OK W3 — envíos sin configurar no se anuncian; texto de estuche configurable';
end $$;
reset role;

rollback;
