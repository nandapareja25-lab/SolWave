begin;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000b2', 'staff@test.local');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000b2', 'staff');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
do $$
declare v uuid; r jsonb;
begin
  v := public.admin_save_campaign(jsonb_build_object(
    'internal_name', 'Envío gratis fin de semana', 'is_active', true, 'priority', 50,
    'starts_at', '2026-12-05 00:00-05', 'ends_at', '2026-12-07 23:59-05', 'style', 'gold', 'motion', 'rotate',
    'messages', jsonb_build_array(jsonb_build_object('text', 'Mensaje 1'), jsonb_build_object('text', 'Mensaje 2', 'link_url', '/sets', 'link_label', 'Ver'))));
  r := public.current_announcement('es', '2026-12-06 12:00-05');
  assert r ->> 'campaign_id' = v::text and jsonb_array_length(r -> 'items') = 2 and r -> 'items' -> 1 ->> 'link_url' = '/sets', r::text;
  -- editar: reemplaza mensajes
  perform public.admin_save_campaign(jsonb_build_object('id', v, 'internal_name', 'Envío gratis', 'is_active', true, 'priority', 50,
    'starts_at', '2026-12-05 00:00-05', 'style', 'gold', 'motion', 'static', 'messages', jsonb_build_array(jsonb_build_object('text', 'Solo uno'))));
  assert (select count(*) from public.announcement_messages where campaign_id = v) = 1;
  begin perform public.admin_save_campaign('{"internal_name":"X","starts_at":"2026-12-01","messages":[]}'); raise exception 'debió fallar';
  exception when others then assert sqlerrm = 'MESSAGES_REQUIRED', sqlerrm; end;
  perform public.admin_delete_campaign(v);
  assert not exists (select 1 from public.announcement_campaigns where id = v);
  raise notice 'OK B1 — campañas del banner: crear, editar (mensajes reemplazados), validar y borrar';
end $$;
reset role;
rollback;
