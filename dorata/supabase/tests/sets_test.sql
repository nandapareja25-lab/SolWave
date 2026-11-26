begin;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000d4', 'owner-sets@test.local');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000d4', 'owner');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d4', true);
do $$
declare v_chain uuid; v_d1 uuid; v_d2 uuid; v_other uuid; v_var uuid;
begin
  v_chain := public.admin_upsert_product(jsonb_build_object('category_slug', 'cadenas', 'translation', jsonb_build_object('name', 'Set cadena test', 'slug', 'set-cadena-test'),
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-SET-1', 'price_cents', 0))));
  v_d1 := public.admin_upsert_product(jsonb_build_object('category_slug', 'dijes', 'translation', jsonb_build_object('name', 'Dije test 1', 'slug', 'dije-test-1'),
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-DIJ-1', 'price_cents', 0))));
  v_d2 := public.admin_upsert_product(jsonb_build_object('category_slug', 'dijes', 'translation', jsonb_build_object('name', 'Dije test 2', 'slug', 'dije-test-2'),
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-DIJ-2', 'price_cents', 0))));
  v_other := public.admin_upsert_product(jsonb_build_object('category_slug', 'cadenas', 'translation', jsonb_build_object('name', 'Otro set', 'slug', 'otro-set-test'),
    'variants', jsonb_build_array(jsonb_build_object('sku', 'TST-SET-2', 'price_cents', 0))));
  reset role;
  update public.products set kit_role = 'set_base' where id in (v_chain, v_other);
  update public.products set kit_role = 'set_component' where id in (v_d1, v_d2);
  set local role authenticated;
  -- no se puede publicar sin dije
  begin update public.products set status = 'active' where id = v_chain; raise exception 'debió fallar';
  exception when others then assert sqlerrm = 'SET_WITHOUT_PENDANT', sqlerrm; end;
  -- un dije no se vende solo
  begin update public.products set status = 'active' where id = v_d1; raise exception 'debió fallar';
  exception when others then assert sqlerrm = 'COMPONENT_NOT_SELLABLE', sqlerrm; end;
  perform public.admin_assign_pendant(v_chain, v_d1);
  -- el mismo dije no puede ir en dos sets
  begin perform public.admin_assign_pendant(v_other, v_d1); raise exception 'debió fallar';
  exception when others then assert sqlerrm = 'PENDANT_TAKEN', sqlerrm; end;
  update public.products set status = 'active' where id = v_chain;  -- ahora sí
  -- costo en pesos sin tasa: queda pendiente y se completa al definir la tasa
  select id into v_var from public.product_variants where product_id = v_chain;
  insert into public.variant_costs (variant_id, original_currency, original_amount) values (v_var, 'COP', 40000);
  assert (select total_unit_cost_cents from public.variant_costs where variant_id = v_var and is_current) is null;
  assert public.admin_apply_fx_to_pending(4000) >= 1;
  assert (select total_unit_cost_cents from public.variant_costs where variant_id = v_var and is_current) = 1000;
  raise notice 'OK K1 — sets: publicar exige dije, dije no se vende solo, dije único, costos COP con tasa pendiente';
end $$;
reset role;
rollback;
