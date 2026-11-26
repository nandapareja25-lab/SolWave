-- =============================================================================
-- D'ORATA — Sets cadena + dije armados por la dueña, y costos en COP con tasa pendiente
-- =============================================================================

-- 1) Costos en pesos sin tasa todavía: se guardan en COP y el valor en USD queda pendiente (NULL)
--    hasta que la dueña defina la tasa (al guardarla se completan los pendientes).
alter table public.variant_costs drop constraint if exists variant_costs_check;

-- 2) Sets armados: una "base" (la cadena) que solo se puede publicar con su "componente" (el dije) asignado.
alter table public.products
  add column kit_role text check (kit_role is null or kit_role in ('set_base', 'set_component')),
  add column set_pendant_product_id uuid unique references public.products (id) on delete set null,
  add constraint products_pendant_only_on_base check (set_pendant_product_id is null or kit_role = 'set_base'),
  add constraint products_pendant_not_self check (set_pendant_product_id is null or set_pendant_product_id <> id);
comment on column public.products.kit_role is 'set_base = cadena que espera su dije; set_component = dije reservado para sets (no se vende solo)';

create or replace function public.products_kit_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'active' and new.kit_role = 'set_base' and new.set_pendant_product_id is null then
    raise exception 'SET_WITHOUT_PENDANT' using errcode = 'P0001';
  end if;
  if new.status = 'active' and new.kit_role = 'set_component' then
    raise exception 'COMPONENT_NOT_SELLABLE' using errcode = 'P0001';
  end if;
  if new.set_pendant_product_id is not null and not exists (
       select 1 from public.products c where c.id = new.set_pendant_product_id and c.kit_role = 'set_component') then
    raise exception 'NOT_A_PENDANT' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger products_kit_guard before insert or update on public.products
  for each row execute function public.products_kit_guard();

-- Asignar (o quitar, con p_pendant = null) el dije de un set. Solo equipo con verificación en dos pasos.
create or replace function public.admin_assign_pendant(p_set uuid, p_pendant uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_staff() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if not exists (select 1 from public.products where id = p_set and kit_role = 'set_base') then raise exception 'NOT_A_SET'; end if;
  if p_pendant is not null and exists (select 1 from public.products where set_pendant_product_id = p_pendant and id <> p_set) then
    raise exception 'PENDANT_TAKEN';
  end if;
  update public.products set set_pendant_product_id = p_pendant where id = p_set;
end $$;
revoke all on function public.admin_assign_pendant(uuid, uuid) from public, anon;
grant execute on function public.admin_assign_pendant(uuid, uuid) to authenticated, service_role;

-- Completar la tasa en costos pendientes (lo llama el panel al guardar una tasa nueva).
create or replace function public.admin_apply_fx_to_pending(p_rate numeric)
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if p_rate is null or p_rate <= 0 then raise exception 'INVALID_RATE'; end if;
  update public.variant_costs set fx_cop_per_usd = p_rate where original_currency = 'COP' and fx_cop_per_usd is null;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.admin_apply_fx_to_pending(numeric) from public, anon;
grant execute on function public.admin_apply_fx_to_pending(numeric) to authenticated, service_role;
