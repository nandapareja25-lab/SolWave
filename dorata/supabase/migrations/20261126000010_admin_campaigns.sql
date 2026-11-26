-- =============================================================================
-- D'ORATA — Guardado atómico de campañas del banner (panel › Configuración › Banner)
-- =============================================================================
create or replace function public.admin_save_campaign(p jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  m jsonb;
  v_mid uuid;
  v_pos integer := 0;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if coalesce(trim(p ->> 'internal_name'), '') = '' then raise exception 'NAME_REQUIRED'; end if;
  if (p ->> 'starts_at') is null then raise exception 'START_REQUIRED'; end if;
  if jsonb_typeof(p -> 'messages') <> 'array' then raise exception 'MESSAGES_REQUIRED'; end if;
  if jsonb_array_length(p -> 'messages') = 0 and not coalesce((p ->> 'countdown_enabled')::boolean, false) then
    raise exception 'MESSAGES_REQUIRED';
  end if;

  if v_id is null then
    insert into public.announcement_campaigns (internal_name, starts_at, created_by) values (p ->> 'internal_name', (p ->> 'starts_at')::timestamptz, (select auth.uid()))
    returning id into v_id;
  end if;

  update public.announcement_campaigns set
    internal_name = trim(p ->> 'internal_name'),
    is_active = coalesce((p ->> 'is_active')::boolean, false),
    priority = coalesce((p ->> 'priority')::integer, 0),
    starts_at = (p ->> 'starts_at')::timestamptz,
    ends_at = nullif(p ->> 'ends_at', '')::timestamptz,
    timezone = coalesce(p ->> 'timezone', 'America/New_York'),
    style = coalesce(p ->> 'style', 'black')::public.announcement_style,
    bg_color = nullif(p ->> 'bg_color', ''),
    text_color = nullif(p ->> 'text_color', ''),
    motion = coalesce(p ->> 'motion', 'static')::public.announcement_motion,
    marquee_speed = coalesce((p ->> 'marquee_speed')::integer, 40),
    rotate_interval_seconds = coalesce((p ->> 'rotate_interval_seconds')::integer, 5),
    repeat = coalesce((p ->> 'repeat')::boolean, true),
    link_url = nullif(p ->> 'link_url', ''),
    link_label = case when coalesce(p ->> 'link_label', '') = '' then '{}'::jsonb else jsonb_build_object('es', p ->> 'link_label') end,
    countdown_enabled = coalesce((p ->> 'countdown_enabled')::boolean, false),
    countdown_target_at = nullif(p ->> 'countdown_target_at', '')::timestamptz,
    countdown_end_behavior = coalesce(p ->> 'countdown_end_behavior', 'hide')::public.countdown_end_behavior,
    after_link_url = nullif(p ->> 'after_link_url', '')
  where id = v_id;
  if not found then raise exception 'NOT_FOUND'; end if;

  insert into public.announcement_campaign_translations (campaign_id, locale, countdown_text, after_text, after_link_label)
  values (v_id, 'es', nullif(p ->> 'countdown_text', ''), nullif(p ->> 'after_text', ''), nullif(p ->> 'after_link_label', ''))
  on conflict (campaign_id, locale) do update set
    countdown_text = excluded.countdown_text, after_text = excluded.after_text, after_link_label = excluded.after_link_label;

  delete from public.announcement_messages where campaign_id = v_id;
  for m in select * from jsonb_array_elements(p -> 'messages') loop
    if coalesce(trim(m ->> 'text'), '') = '' then continue; end if;
    insert into public.announcement_messages (campaign_id, position, link_url) values (v_id, v_pos, nullif(m ->> 'link_url', ''))
    returning id into v_mid;
    insert into public.announcement_message_translations (message_id, locale, text, link_label)
    values (v_mid, 'es', trim(m ->> 'text'), nullif(m ->> 'link_label', ''));
    v_pos := v_pos + 1;
  end loop;
  return v_id;
end $$;

create or replace function public.admin_delete_campaign(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_staff() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  delete from public.announcement_campaigns where id = p_id;
end $$;

revoke all on function public.admin_save_campaign(jsonb) from public, anon;
revoke all on function public.admin_delete_campaign(uuid) from public, anon;
grant execute on function public.admin_save_campaign(jsonb) to authenticated, service_role;
grant execute on function public.admin_delete_campaign(uuid) to authenticated, service_role;
