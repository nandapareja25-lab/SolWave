begin;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000c3', 'admin-cost@test.local');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000c3', 'admin');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c3', true);
do $$
declare v_p uuid; v_v uuid;
begin
  v_p := public.admin_upsert_product(jsonb_build_object('category_slug', 'cadenas', 'translation', jsonb_build_object('name', 'Costo test', 'slug', 'costo-test'),
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-COST-1', 'price_cents', 3900))));
  select id into v_v from public.product_variants where product_id = v_p;
  perform set_config('test.variant', v_v::text, true);
end $$;
insert into public.variant_costs (variant_id, original_currency, original_amount, fx_cop_per_usd, intl_shipping_cents, packaging_cents, other_cents, supplier_id, notes, is_current, created_by)
values (current_setting('test.variant')::uuid, 'USD', 11.50, null, 120, 0, 0, null, null, true, '00000000-0000-0000-0000-0000000000c3');
do $$ begin
  assert (select total_unit_cost_cents from public.variant_costs where variant_id = current_setting('test.variant')::uuid and is_current) = 1270;
  raise notice 'OK V1 — costo por variante (admin) con total calculado';
end $$;
reset role;
rollback;
