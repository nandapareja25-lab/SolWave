-- =============================================================================
-- D'ORATA — Funciones de inventario (la ÚNICA forma de mover stock)
-- -----------------------------------------------------------------------------
-- Reglas:
--   * disponible = on_hand - reserved
--   * Reservar no descuenta: sube `reserved`. Pagar (webhook) convierte reserva en venta.
--   * Pago fallido / checkout abandonado → la reserva se libera; on_hand nunca se tocó.
--   * Toda variación de on_hand deja un renglón en inventory_movements.
--   * Las filas de inventory_levels se bloquean en orden de variant_id (sin deadlocks).
-- Las funciones de checkout solo las ejecuta el servidor (service_role). Los ajustes manuales
-- los ejecuta un usuario con rol staff+ (se valida adentro).
-- =============================================================================

-- Reserva el carrito completo o nada (todo-o-nada, dentro de una transacción).
create or replace function public.reserve_stock(p_checkout_id uuid, p_items jsonb, p_expires_at timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
declare
  r record;
  v_available integer;
begin
  if p_expires_at <= now() then
    raise exception 'INVALID_EXPIRY';
  end if;

  for r in
    select (e ->> 'variant_id')::uuid as variant_id, sum((e ->> 'quantity')::integer) as qty
      from jsonb_array_elements(p_items) e
     group by 1
     order by 1
  loop
    if r.qty is null or r.qty <= 0 then
      raise exception 'INVALID_QUANTITY' using detail = r.variant_id::text;
    end if;

    -- Variante y producto deben estar a la venta.
    perform 1
       from public.product_variants v
       join public.products p on p.id = v.product_id
      where v.id = r.variant_id and v.is_active and p.status = 'active';
    if not found then
      raise exception 'VARIANT_UNAVAILABLE' using detail = r.variant_id::text;
    end if;

    select l.on_hand - l.reserved into v_available
      from public.inventory_levels l
     where l.variant_id = r.variant_id
       for update;

    if v_available is null or v_available < r.qty then
      raise exception 'INSUFFICIENT_STOCK'
        using detail = json_build_object('variant_id', r.variant_id, 'available', coalesce(v_available, 0))::text;
    end if;

    update public.inventory_levels set reserved = reserved + r.qty where variant_id = r.variant_id;

    insert into public.inventory_reservations (variant_id, checkout_id, quantity, expires_at)
    values (r.variant_id, p_checkout_id, r.qty, p_expires_at);
  end loop;
end $$;

-- Libera las reservas activas de un checkout (pago fallido, sesión expirada, abandono).
create or replace function public.release_reservations(
  p_checkout_id uuid,
  p_status public.reservation_status default 'released'
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  r record;
  n integer := 0;
begin
  if p_status not in ('released', 'expired') then
    raise exception 'INVALID_STATUS';
  end if;
  for r in
    select res.id, res.variant_id, res.quantity
      from public.inventory_reservations res
     where res.checkout_id = p_checkout_id and res.status = 'active'
     order by res.variant_id
       for update
  loop
    perform 1 from public.inventory_levels where variant_id = r.variant_id for update;
    update public.inventory_levels set reserved = reserved - r.quantity where variant_id = r.variant_id;
    update public.inventory_reservations set status = p_status, resolved_at = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- Barrido periódico (pg_cron cada 5 min) — red de seguridad si el webhook de expiración no llega.
create or replace function public.release_expired_reservations()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  c record;
  n integer := 0;
begin
  for c in
    select distinct res.checkout_id
      from public.inventory_reservations res
     where res.status = 'active' and res.expires_at < now()
  loop
    n := n + public.release_reservations(c.checkout_id, 'expired');
    update public.checkouts set status = 'expired' where id = c.checkout_id and status = 'open';
  end loop;
  return n;
end $$;

-- Descuenta stock definitivamente (venta). Usado por:
--   (a) el webhook de pago, consumiendo la reserva del checkout;
--   (b) pedidos manuales (Instagram/WhatsApp/en persona), sin reserva previa.
-- Devuelve 'ok' o 'stock_conflict' (solo posible en (a) si la reserva ya había expirado).
create or replace function public.consume_stock_for_order(p_order_id uuid, p_checkout_id uuid default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  r record;
  v_res_qty integer;
  v_res_id uuid;
  v_on_hand integer;
  v_reserved integer;
  v_conflict boolean := false;
  v_after integer;
begin
  for r in
    select oi.variant_id, sum(oi.quantity)::integer as qty
      from public.order_items oi
     where oi.order_id = p_order_id and oi.variant_id is not null
     group by 1
     order by 1
  loop
    select l.on_hand, l.reserved into v_on_hand, v_reserved
      from public.inventory_levels l where l.variant_id = r.variant_id for update;

    v_res_qty := 0; v_res_id := null;
    if p_checkout_id is not null then
      select res.id, res.quantity into v_res_id, v_res_qty
        from public.inventory_reservations res
       where res.checkout_id = p_checkout_id and res.variant_id = r.variant_id and res.status = 'active'
         for update;
      v_res_qty := coalesce(v_res_qty, 0);
    end if;

    -- Unidades que hay que tomar del disponible libre (lo no cubierto por la reserva).
    if (v_on_hand - v_reserved) < (r.qty - least(v_res_qty, r.qty)) then
      v_conflict := true;
      continue;
    end if;

    v_after := v_on_hand - r.qty;
    update public.inventory_levels
       set on_hand = v_after, reserved = reserved - least(v_res_qty, r.qty)
     where variant_id = r.variant_id;

    if v_res_id is not null then
      update public.inventory_reservations set status = 'committed', resolved_at = now() where id = v_res_id;
    end if;

    insert into public.inventory_movements (variant_id, type, quantity_delta, on_hand_after, order_id, created_by)
    values (r.variant_id, 'sale', -r.qty, v_after, p_order_id, (select auth.uid()));
  end loop;

  if p_checkout_id is not null then
    -- Cualquier sobrante reservado de ese checkout se libera.
    perform public.release_reservations(p_checkout_id, 'released');
  end if;

  if v_conflict then
    update public.orders
       set needs_attention = true,
           attention_reason = 'Pago recibido pero sin stock suficiente para una o más piezas'
     where id = p_order_id;
    return 'stock_conflict';
  end if;
  return 'ok';
end $$;

-- Ajustes de inventario hechos por una persona del equipo (reposición, conteo, corrección…).
create or replace function public.adjust_inventory(
  p_variant_id uuid,
  p_type public.inventory_movement_type,
  p_delta integer,
  p_reason text default null,
  p_variant_cost_id uuid default null,
  p_order_id uuid default null,
  p_warranty_claim_id uuid default null
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_on_hand integer;
  v_reserved integer;
  v_after integer;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_type = 'sale' then
    raise exception 'USE_ORDER_FLOW';   -- las ventas solo entran por pedidos
  end if;
  if p_delta = 0 then
    raise exception 'INVALID_QUANTITY';
  end if;
  if p_type in ('restock', 'return', 'cancellation', 'initial_count') and p_delta < 0 then
    raise exception 'DELTA_SIGN_MISMATCH';
  end if;
  if p_type = 'warranty_replacement' and p_delta > 0 then
    raise exception 'DELTA_SIGN_MISMATCH';
  end if;

  select on_hand, reserved into v_on_hand, v_reserved
    from public.inventory_levels where variant_id = p_variant_id for update;
  if not found then
    raise exception 'VARIANT_NOT_FOUND';
  end if;

  v_after := v_on_hand + p_delta;
  if v_after < v_reserved then
    raise exception 'BELOW_RESERVED' using detail = json_build_object('reserved', v_reserved)::text;
  end if;

  update public.inventory_levels set on_hand = v_after where variant_id = p_variant_id;
  insert into public.inventory_movements
    (variant_id, type, quantity_delta, on_hand_after, reason, variant_cost_id, order_id, warranty_claim_id, created_by)
  values
    (p_variant_id, p_type, p_delta, v_after, p_reason, p_variant_cost_id, p_order_id, p_warranty_claim_id, (select auth.uid()));
  return v_after;
end $$;

-- Permisos: nadie ejecuta funciones por defecto; se concede explícitamente.
revoke all on function public.reserve_stock(uuid, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.release_reservations(uuid, public.reservation_status) from public, anon, authenticated;
revoke all on function public.release_expired_reservations() from public, anon, authenticated;
revoke all on function public.consume_stock_for_order(uuid, uuid) from public, anon, authenticated;
revoke all on function public.adjust_inventory(uuid, public.inventory_movement_type, integer, text, uuid, uuid, uuid) from public, anon;
grant execute on function public.reserve_stock(uuid, jsonb, timestamptz) to service_role;
grant execute on function public.release_reservations(uuid, public.reservation_status) to service_role;
grant execute on function public.release_expired_reservations() to service_role;
grant execute on function public.consume_stock_for_order(uuid, uuid) to service_role;
grant execute on function public.adjust_inventory(uuid, public.inventory_movement_type, integer, text, uuid, uuid, uuid) to authenticated, service_role;

-- Vista de stock para el panel (security_invoker: respeta RLS de quien consulta).
create or replace view public.v_inventory_status with (security_invoker = true) as
select
  v.id                                    as variant_id,
  v.product_id,
  v.sku,
  v.title                                 as variant_title,
  l.on_hand,
  l.reserved,
  l.on_hand - l.reserved                  as available,
  coalesce(v.low_stock_threshold, bs.low_stock_default) as low_stock_threshold,
  (l.on_hand - l.reserved) <= coalesce(v.low_stock_threshold, bs.low_stock_default) as is_low
from public.product_variants v
join public.inventory_levels l on l.variant_id = v.id
cross join public.business_settings bs;

-- Disponibilidad pública (sin cifras exactas de stock: solo si se puede comprar y si quedan pocas).
create or replace function public.variant_availability(p_variant_ids uuid[])
returns table (variant_id uuid, available boolean, low_stock boolean)
language sql stable security definer set search_path = '' as $$
  select l.variant_id,
         (l.on_hand - l.reserved) > 0,
         (l.on_hand - l.reserved) between 1 and coalesce(v.low_stock_threshold, bs.low_stock_default)
    from public.inventory_levels l
    join public.product_variants v on v.id = l.variant_id
    join public.products p on p.id = v.product_id
   cross join public.business_settings bs
   where l.variant_id = any (p_variant_ids) and p.status = 'active' and v.is_active;
$$;
grant execute on function public.variant_availability(uuid[]) to anon, authenticated;
