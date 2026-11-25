-- =============================================================================
-- Pruebas: banner programado, políticas versionadas, consentimiento, privacidad.
-- Se ejecuta en una transacción que se revierte.
-- =============================================================================
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'staff@test.local');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'),
  ('00000000-0000-0000-0000-0000000000b2', 'staff');

-- ---------- A1: tu ejemplo — lanzamiento 25-nov → 2-dic 11:59 p. m. ----------
update public.announcement_campaigns set is_active = true where internal_name = 'Lanzamiento D''ORATA';
do $$
declare r jsonb;
begin
  r := public.current_announcement('es', timestamp '2026-11-24 23:59:00' at time zone 'America/New_York');
  assert r is null, 'antes del inicio no debe mostrarse';
  r := public.current_announcement('es', timestamp '2026-11-26 12:00:00' at time zone 'America/New_York');
  assert r ->> 'mode' = 'messages' and r -> 'items' -> 0 ->> 'text' = '✨ LANZAMIENTO D''ORATA — 2 DE DICIEMBRE ✨', r::text;
  assert r ->> 'motion' = 'marquee';
  r := public.current_announcement('es', timestamp '2026-12-02 23:59:30' at time zone 'America/New_York');
  assert r is not null, 'el 2-dic a las 11:59 p. m. sigue visible';
  r := public.current_announcement('es', timestamp '2026-12-03 00:00:00' at time zone 'America/New_York');
  assert r is null, 'después del fin desaparece solo';
  -- Una clienta en California a las 9:30 p. m. del 2-dic: en Nueva York ya son las 00:30 del 3-dic → oculto
  r := public.current_announcement('es', timestamp '2026-12-02 21:30:00' at time zone 'America/Los_Angeles');
  assert r is null, 'el fin es un instante único para todo el país (zona del negocio)';
  r := public.current_announcement('es', timestamp '2026-12-02 20:30:00' at time zone 'America/Los_Angeles');
  assert r is not null, '8:30 p. m. en California = 11:30 p. m. en Nueva York → visible';
  raise notice 'OK A1 — el banner aparece y desaparece solo en las fechas exactas, con zona horaria';
end $$;

-- ---------- A2: prioridad entre campañas que se cruzan ----------
with c as (
  insert into public.announcement_campaigns (internal_name, is_active, priority, starts_at, ends_at, style, motion)
  values ('Envío gratis', true, 20, '2026-11-28 00:00-05', '2026-11-30 00:00-05', 'gold', 'rotate')
  returning id
), m as (
  insert into public.announcement_messages (campaign_id, position)
  select c.id, g from c, generate_series(1, 2) g returning id, position
)
insert into public.announcement_message_translations (message_id, locale, text)
select id, 'es', case position when 1 then 'Envíos disponibles en USA' else 'Oro Laminado 18K' end from m;
do $$
declare r jsonb;
begin
  r := public.current_announcement('es', '2026-11-29 10:00-05');
  assert r ->> 'style' = 'gold' and jsonb_array_length(r -> 'items') = 2, 'gana la de mayor prioridad, con 2 mensajes en rotación';
  r := public.current_announcement('es', '2026-11-27 10:00-05');
  assert r ->> 'style' = 'black', 'antes de que empiece la prioritaria, se ve la de lanzamiento';
  assert (r ->> 'next_change_at')::timestamptz = '2026-11-28 00:00-05', 'avisa cuándo cambiará';
  raise notice 'OK A2 — prioridad, rotación de varios mensajes y aviso del próximo cambio';
end $$;

-- ---------- A3: cuenta regresiva → cambia de mensaje / se oculta ----------
with c as (
  insert into public.announcement_campaigns
    (internal_name, is_active, priority, starts_at, ends_at, countdown_enabled, countdown_target_at, countdown_end_behavior, after_link_url)
  values ('Cuenta regresiva', true, 50, '2026-12-01 00:00-05', '2026-12-10 00:00-05', true, '2026-12-02 09:00-05', 'swap_message', '/')
  returning id
)
insert into public.announcement_campaign_translations (campaign_id, locale, countdown_text, after_text, after_link_label)
select id, 'es', 'D''ORATA llega en {countdown}', '✨ D''ORATA YA ESTÁ DISPONIBLE — COMPRA AHORA ✨', 'Comprar' from c;
do $$
declare r jsonb;
begin
  r := public.current_announcement('es', '2026-12-01 12:00-05');
  assert r ->> 'mode' = 'countdown' and (r -> 'items' -> 0 ->> 'countdown')::boolean, r::text;
  assert (r ->> 'countdown_target_at')::timestamptz = '2026-12-02 09:00-05';
  r := public.current_announcement('es', '2026-12-02 09:00-05');
  assert r ->> 'mode' = 'after' and r -> 'items' -> 0 ->> 'text' like '%YA ESTÁ DISPONIBLE%', 'al llegar a cero cambia el mensaje';
  update public.announcement_campaigns set countdown_end_behavior = 'hide' where internal_name = 'Cuenta regresiva';
  r := public.current_announcement('es', '2026-12-02 10:00-05');
  assert r ->> 'style' = 'black', 'con "ocultar", al llegar a cero vuelve la campaña siguiente en prioridad';
  raise notice 'OK A3 — contador: cambia de mensaje u oculta según configuración';
end $$;

-- ---------- A4: campaña sin textos no rompe nada; el público no ve campañas futuras ----------
insert into public.announcement_campaigns (internal_name, is_active, priority, starts_at)
values ('Vacía', true, 99, '2026-11-01 00:00-05');
do $$
begin
  assert public.current_announcement('es', '2026-11-26 12:00-05') ->> 'style' = 'black', 'la vacía se salta';
end $$;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$
begin
  assert (select count(*) from public.announcement_campaigns) = 0, 'anon no lee campañas (ni futuras)';
  assert public.current_announcement('es', '2026-11-26 12:00-05') is not null, 'anon sí obtiene el anuncio vigente';
  raise notice 'OK A4 — robusto ante campañas incompletas; lanzamientos futuros no se filtran';
end $$;
reset role;

-- ---------- L1: historial de versiones de políticas ----------
insert into public.page_versions (page_id, locale, version_label, title, body_md, effective_at)
select id, 'es', '1.0', 'Política de Privacidad', 'Texto v1', '2026-11-01 00:00-05' from public.pages where kind = 'privacy';
insert into public.page_versions (page_id, locale, version_label, title, body_md, effective_at)
select id, 'es', '1.1', 'Política de Privacidad', 'Texto v1.1', now() + interval '30 days' from public.pages where kind = 'privacy';
do $$
declare v public.page_versions;
begin
  v := public.policy_version_at('privacy', 'es', '2026-11-20 00:00-05');
  assert v.version_label = '1.0' and length(v.content_sha256) = 64, 'vigente en esa fecha: 1.0 con huella';
  v := public.policy_version_at('privacy', 'es', now() + interval '40 days');
  assert v.version_label = '1.1', 'después de su fecha efectiva rige 1.1';
  begin
    update public.page_versions set body_md = 'editado' where version_label = '1.0';
    raise exception 'debió fallar';
  exception when others then assert sqlerrm like 'IMMUTABLE_LEDGER%', sqlerrm;
  end;
  update public.page_versions set legal_review_status = 'approved', legal_review_note = 'Revisado' where version_label = '1.0';
  raise notice 'OK L1 — versiones inmutables y consulta "qué estaba vigente en tal fecha"';
end $$;
set local role anon;
do $$
begin
  assert (select count(*) from public.page_versions) = 1, 'el público no ve versiones futuras';
end $$;
reset role;

-- ---------- C1: registro de consentimiento de cookies ----------
set local role service_role;
insert into public.cookie_consent_records (subject_id, action, analytics, marketing, personalization, region)
values (gen_random_uuid(), 'accept_all', true, true, true, 'US-FL');
insert into public.cookie_consent_records (subject_id, action, analytics, marketing, personalization, created_at)
values (gen_random_uuid(), 'reject_all', false, false, false, now() - interval '3 years');
do $$
declare n integer;
begin
  begin
    insert into public.cookie_consent_records (subject_id, action, analytics, marketing, personalization)
    values (gen_random_uuid(), 'reject_all', true, false, false);
    raise exception 'debió fallar';
  exception when check_violation then null;
  end;
  begin
    insert into public.cookie_consent_records (subject_id, action, analytics, marketing, personalization, gpc)
    values (gen_random_uuid(), 'custom', true, true, false, true);
    raise exception 'debió fallar';
  exception when check_violation then null;
  end;
  begin
    update public.cookie_consent_records set marketing = false;
    raise exception 'debió fallar';
  exception when others then assert sqlerrm like 'IMMUTABLE_LEDGER%', sqlerrm;
  end;
  n := public.purge_old_consent_records();
  assert n = 1 and (select count(*) from public.cookie_consent_records) = 1, 'purga solo lo vencido';
  raise notice 'OK C1 — consentimiento coherente, inmutable, con señal GPC y purga por antigüedad';
end $$;
reset role;

-- ---------- P1: solicitudes de privacidad ----------
insert into public.privacy_requests (type, email, received_at)
values ('access', 'alguien@test.local', '2026-11-25 10:00-05');
do $$
begin
  assert (select due_at from public.privacy_requests where email = 'alguien@test.local')
         = timestamptz '2026-11-25 10:00-05' + interval '45 days', 'plazo calculado desde la configuración';
  begin
    update public.privacy_requests set status = 'completed' where email = 'alguien@test.local';
    raise exception 'debió fallar';
  exception when check_violation then null;
  end;
  raise notice 'OK P1 — solicitud con plazo automático; no se cierra sin resolución';
end $$;

-- ---------- P2: eliminación = anonimizar conservando registros fiscales ----------
insert into public.customers (id, email, full_name, phone_e164) values
  ('60000000-0000-0000-0000-000000000001', 'clienta@test.local', 'Ana Pérez', '+13055550100');
insert into public.customer_addresses (customer_id, full_name, line1, city, state, postal_code)
values ('60000000-0000-0000-0000-000000000001', 'Ana Pérez', '1 Main St', 'Miami', 'FL', '33101');
insert into public.orders (id, customer_id, email, customer_name, status, payment_status, subtotal_cents, total_cents, shipping_address)
values ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'clienta@test.local', 'Ana Pérez',
        'delivered', 'paid', 5999, 5999, '{"line1":"1 Main St","city":"Miami","state":"FL","country":"US","postal_code":"33101"}');
insert into public.marketing_subscriptions (email, status, subscribed_at, customer_id)
values ('clienta@test.local', 'subscribed', now(), '60000000-0000-0000-0000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
do $$
begin
  begin
    perform public.anonymize_customer('60000000-0000-0000-0000-000000000001');
    raise exception 'staff no debe poder anonimizar';
  exception when insufficient_privilege then null;
  end;
  assert (select count(*) from public.marketing_subscriptions) = 0, 'staff no ve la lista de marketing';
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
select public.anonymize_customer('60000000-0000-0000-0000-000000000001');
do $$
declare o record; c record;
begin
  select * into o from public.orders where id = '70000000-0000-0000-0000-000000000001';
  select * into c from public.customers where id = '60000000-0000-0000-0000-000000000001';
  assert o.total_cents = 5999 and o.customer_name = 'Cliente anonimizado', 'el monto se conserva, el nombre no';
  assert o.shipping_address = '{"state":"FL","country":"US"}'::jsonb, 'solo estado/país para impuestos';
  assert c.full_name is null and c.email::text like 'anonimizado+%' and c.anonymized_at is not null;
  assert (select count(*) from public.customer_addresses where customer_id = c.id) = 0;
  assert (select count(*) from public.marketing_subscriptions) = 0, 'sale de marketing';
  raise notice 'OK P2 — eliminación por solicitud: datos personales fuera, registro fiscal intacto';
end $$;
reset role;

rollback;
