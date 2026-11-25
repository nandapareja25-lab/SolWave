-- =============================================================================
-- Pruebas de inventario + RLS. Se ejecutan dentro de una transacción que se revierte.
-- Uso local:  psql -v ON_ERROR_STOP=1 -f supabase/tests/inventory_and_rls_test.sql
-- =============================================================================
begin;

-- ---------- Datos de prueba ----------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'staff@test.local'),
  ('00000000-0000-0000-0000-0000000000c3', 'cliente@test.local');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'),
  ('00000000-0000-0000-0000-0000000000b2', 'staff');

insert into public.products (id, status, primary_category_id)
select '10000000-0000-0000-0000-000000000001', 'active', c.id
  from public.categories c join public.category_translations t on t.category_id = c.id
 where t.slug = 'pulseras-de-hilo';
insert into public.product_translations (product_id, locale, name, slug)
values ('10000000-0000-0000-0000-000000000001', 'es', 'Pulsera de hilo con balines', 'pulsera-hilo-balines');
insert into public.product_variants (id, product_id, sku, title, price_cents, is_default) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PH-NEGRO', 'Hilo negro', 5999, true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'PH-ROJO',  'Hilo rojo',  5999, false);
insert into public.variant_costs (variant_id, original_currency, original_amount, fx_cop_per_usd, packaging_cents)
values ('20000000-0000-0000-0000-000000000001', 'COP', 80000, 4000, 150);

-- ---------- Test 1: costo COP → USD calculado por la base ----------
do $$
declare v record;
begin
  select product_cost_usd_cents, total_unit_cost_cents into v from public.variant_costs
   where variant_id = '20000000-0000-0000-0000-000000000001';
  assert v.product_cost_usd_cents = 2000, 'COP 80,000 a 4,000 debe dar $20.00';
  assert v.total_unit_cost_cents = 2150, 'costo total con empaque debe ser $21.50';
  raise notice 'OK 1 — costo COP→USD: % centavos', v.total_unit_cost_cents;
end $$;

-- ---------- Test 2: inventorio inicial vía ajuste de staff ----------
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
select public.adjust_inventory('20000000-0000-0000-0000-000000000001', 'initial_count', 2, 'Conteo inicial');
reset role;

-- ---------- Test 3: reservas — evitar sobreventa ----------
insert into public.checkouts (id, items, subtotal_cents, expires_at) values
  ('30000000-0000-0000-0000-00000000000a', '[]', 0, now() + interval '35 min'),
  ('30000000-0000-0000-0000-00000000000b', '[]', 0, now() + interval '35 min');

set local role service_role;
select public.reserve_stock('30000000-0000-0000-0000-00000000000a',
  '[{"variant_id":"20000000-0000-0000-0000-000000000001","quantity":2}]', now() + interval '35 min');
do $$
begin
  begin
    perform public.reserve_stock('30000000-0000-0000-0000-00000000000b',
      '[{"variant_id":"20000000-0000-0000-0000-000000000001","quantity":1}]', now() + interval '35 min');
    raise exception 'debió fallar por falta de stock';
  exception when others then
    assert sqlerrm = 'INSUFFICIENT_STOCK', 'error esperado INSUFFICIENT_STOCK, fue ' || sqlerrm;
  end;
  raise notice 'OK 3 — segundo carrito bloqueado: no hay sobreventa';
end $$;

-- ---------- Test 4: checkout abandonado → la reserva se libera sola ----------
update public.inventory_reservations set expires_at = now() - interval '1 min'
 where checkout_id = '30000000-0000-0000-0000-00000000000a';
do $$
declare n integer; l record;
begin
  n := public.release_expired_reservations();
  select * into l from public.inventory_levels where variant_id = '20000000-0000-0000-0000-000000000001';
  assert n = 1 and l.reserved = 0 and l.on_hand = 2, 'la reserva vencida debe liberarse sin tocar on_hand';
  assert (select status from public.checkouts where id = '30000000-0000-0000-0000-00000000000a') = 'expired';
  raise notice 'OK 4 — reserva vencida liberada (on_hand=%, reserved=%)', l.on_hand, l.reserved;
end $$;

-- ---------- Test 5: pago exitoso (webhook) → descuenta definitivamente ----------
select public.reserve_stock('30000000-0000-0000-0000-00000000000b',
  '[{"variant_id":"20000000-0000-0000-0000-000000000001","quantity":1}]', now() + interval '35 min');
insert into public.orders (id, checkout_id, status, payment_status, subtotal_cents, total_cents, email)
values ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000000b', 'paid', 'paid', 5999, 5999, 'cliente@test.local');
insert into public.order_items (order_id, variant_id, product_name, sku, quantity, unit_price_cents, line_total_cents)
values ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Pulsera de hilo con balines', 'PH-NEGRO', 1, 5999, 5999);
do $$
declare r text; l record;
begin
  r := public.consume_stock_for_order('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000000b');
  select * into l from public.inventory_levels where variant_id = '20000000-0000-0000-0000-000000000001';
  assert r = 'ok' and l.on_hand = 1 and l.reserved = 0, 'venta debe dejar on_hand=1 reserved=0';
  assert (select count(*) from public.inventory_movements where order_id = '40000000-0000-0000-0000-000000000001' and type = 'sale') = 1;
  raise notice 'OK 5 — venta confirmada por webhook descuenta stock y deja movimiento';
end $$;

-- ---------- Test 6: pago llega tarde y ya no hay stock → pedido marcado, nunca stock negativo ----------
insert into public.checkouts (id, items, subtotal_cents, expires_at)
values ('30000000-0000-0000-0000-00000000000c', '[]', 0, now() + interval '35 min');
insert into public.orders (id, checkout_id, status, payment_status, subtotal_cents, total_cents)
values ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-00000000000c', 'paid', 'paid', 11998, 11998);
insert into public.order_items (order_id, variant_id, product_name, sku, quantity, unit_price_cents, line_total_cents)
values ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Pulsera', 'PH-NEGRO', 2, 5999, 11998);
do $$
declare r text;
begin
  r := public.consume_stock_for_order('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-00000000000c');
  assert r = 'stock_conflict', 'debe detectar conflicto';
  assert (select needs_attention from public.orders where id = '40000000-0000-0000-0000-000000000002');
  assert (select on_hand from public.inventory_levels where variant_id = '20000000-0000-0000-0000-000000000001') = 1;
  raise notice 'OK 6 — conflicto de stock marcado para revisión, stock intacto';
end $$;
reset role;

-- ---------- Test 7: venta manual (Instagram) sin reserva ----------
insert into public.orders (id, channel, status, payment_status, payment_provider, payment_method_label, subtotal_cents, total_cents)
values ('40000000-0000-0000-0000-000000000003', 'instagram', 'paid', 'paid', 'manual', 'Zelle', 5999, 5999);
insert into public.order_items (order_id, variant_id, product_name, sku, quantity, unit_price_cents, line_total_cents)
values ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Pulsera', 'PH-NEGRO', 1, 5999, 5999);
set local role service_role;
do $$
begin
  assert public.consume_stock_for_order('40000000-0000-0000-0000-000000000003') = 'ok';
  assert (select on_hand from public.inventory_levels where variant_id = '20000000-0000-0000-0000-000000000001') = 0;
  raise notice 'OK 7 — venta manual descuenta inventario igual';
end $$;
reset role;

-- ---------- Test 8: el libro de movimientos es inmutable ----------
do $$
begin
  begin
    update public.inventory_movements set quantity_delta = 99;
    raise exception 'debió fallar';
  exception when others then
    assert sqlerrm like 'IMMUTABLE_LEDGER%', sqlerrm;
  end;
  raise notice 'OK 8 — historial de movimientos no se puede editar';
end $$;

-- ---------- Test 9: RLS — visitante anónimo ----------
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$
begin
  assert (select count(*) from public.products) = 1, 'anon ve productos activos';
  assert (select count(*) from public.variant_costs) = 0, 'anon NO ve costos';
  assert (select count(*) from public.orders) = 0, 'anon NO ve pedidos';
  assert (select count(*) from public.business_settings) = 0, 'anon NO ve márgenes ni tasa';
  assert (select count(*) from public.customers) = 0, 'anon NO ve clientes';
  begin
    perform public.reserve_stock(gen_random_uuid(), '[]', now() + interval '1 hour');
    raise exception 'anon no debe poder reservar';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.products (status, primary_category_id) select 'active', id from public.categories limit 1;
    raise exception 'anon no debe poder crear productos';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK 9 — anon: solo catálogo público';
end $$;
reset role;

-- ---------- Test 10: RLS — staff ve operación pero NO costos ----------
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
do $$
begin
  assert (select count(*) from public.orders) = 3, 'staff ve pedidos';
  assert (select count(*) from public.variant_costs) = 0, 'staff NO ve costos';
  assert (select count(*) from public.business_settings) = 0, 'staff NO ve finanzas';
  begin
    perform public.adjust_inventory('20000000-0000-0000-0000-000000000001', 'sale', -1);
    raise exception 'ventas no entran por ajuste';
  exception when others then assert sqlerrm = 'USE_ORDER_FLOW', sqlerrm;
  end;
  raise notice 'OK 10 — staff: opera sin ver costos';
end $$;

-- ---------- Test 11: RLS — owner ve todo; cliente sin rol no ve nada interno ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
do $$
begin
  assert (select count(*) from public.variant_costs) = 1, 'owner ve costos';
  assert (select count(*) from public.admin_audit_log) > 0, 'owner ve auditoría';
  raise notice 'OK 11a — owner ve costos y auditoría';
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c3', true);
do $$
begin
  assert (select count(*) from public.orders) = 0, 'cliente sin ficha no ve pedidos ajenos';
  assert (select count(*) from public.user_roles) = 0;
  begin
    insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000c3', 'owner');
    raise exception 'cliente no puede auto-asignarse rol';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK 11b — cliente no puede escalar privilegios';
end $$;
reset role;

-- ---------- Test 12: certificado máx. 3 joyas por tarjeta ----------
insert into public.authenticity_certificates (id, order_id, issued_on, customer_name)
values ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', current_date, 'Cliente Prueba');
do $$
begin
  begin
    insert into public.certificate_items (certificate_id, position, piece_name, price_cents, warranty_months)
    values ('50000000-0000-0000-0000-000000000001', 4, 'Cuarta pieza', 1000, 12);
    raise exception 'debió fallar';
  exception when check_violation then null;
  end;
  raise notice 'OK 12 — certificado limitado a 3 joyas';
end $$;

rollback;
