-- =============================================================================
-- D'ORATA — Banner de anuncios, políticas versionadas, cookies, privacidad y marketing
-- -----------------------------------------------------------------------------
-- Ninguna de estas piezas declara cumplimiento legal automático: dan la INFRAESTRUCTURA
-- (registro, versiones, consentimiento, solicitudes). Los textos legales requieren revisión
-- de un abogado antes del lanzamiento (ver docs/05-LEGAL-Y-PRIVACIDAD.md).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Banner de anuncios: campañas programadas con mensajes en rotación
-- -----------------------------------------------------------------------------
create type public.announcement_motion    as enum ('static', 'marquee', 'rotate');
create type public.announcement_style     as enum ('gold', 'cream', 'white', 'black', 'custom');
create type public.countdown_end_behavior as enum ('hide', 'swap_message');

-- Una CAMPAÑA = un periodo con su estilo, movimiento y (opcional) cuenta regresiva.
-- Si varias se cruzan en el tiempo, se muestra la de mayor prioridad.
create table public.announcement_campaigns (
  id                      uuid primary key default gen_random_uuid(),
  internal_name           text not null,                      -- "Lanzamiento 2 dic" (solo panel)
  is_active               boolean not null default false,     -- interruptor manual
  priority                integer not null default 0,         -- mayor gana
  starts_at               timestamptz not null,               -- instante absoluto (UTC)
  ends_at                 timestamptz,                        -- null = sin fin
  timezone                text not null default 'America/New_York' check (public.is_valid_timezone(timezone)),
  style                   public.announcement_style not null default 'black',
  bg_color                text check (bg_color is null or bg_color ~ '^#[0-9A-Fa-f]{6}$'),
  text_color              text check (text_color is null or text_color ~ '^#[0-9A-Fa-f]{6}$'),
  motion                  public.announcement_motion not null default 'static',
  marquee_speed           integer not null default 40 check (marquee_speed between 10 and 200),   -- px por segundo
  rotate_interval_seconds integer not null default 5 check (rotate_interval_seconds between 2 and 60),
  repeat                  boolean not null default true,      -- marquee/rotación en bucle; si no, se detiene en el último
  link_url                text check (link_url is null or link_url ~ '^(https://|/)'),
  link_label              jsonb not null default '{}'::jsonb, -- {"es":"Ver más"}
  countdown_enabled       boolean not null default false,
  countdown_target_at     timestamptz,
  countdown_end_behavior  public.countdown_end_behavior not null default 'hide',
  after_link_url          text check (after_link_url is null or after_link_url ~ '^(https://|/)'),
  created_by              uuid references auth.users (id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (style <> 'custom' or (bg_color is not null and text_color is not null)),
  check (not countdown_enabled or countdown_target_at is not null)
);
create index announcement_campaigns_window on public.announcement_campaigns (starts_at, ends_at) where is_active;

create table public.announcement_campaign_translations (
  campaign_id      uuid not null references public.announcement_campaigns (id) on delete cascade,
  locale           public.locale_code not null,
  countdown_text   text check (countdown_text is null or countdown_text like '%{countdown}%'), -- "D'ORATA llega en {countdown}"
  after_text       text check (after_text is null or length(after_text) <= 140),                -- "D'ORATA ya está disponible — compra ahora"
  after_link_label text,
  primary key (campaign_id, locale)
);

create table public.announcement_messages (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.announcement_campaigns (id) on delete cascade,
  position    integer not null default 0,
  link_url    text check (link_url is null or link_url ~ '^(https://|/)'),  -- enlace propio del mensaje (opcional)
  created_at  timestamptz not null default now()
);
create index announcement_messages_campaign on public.announcement_messages (campaign_id, position);
create table public.announcement_message_translations (
  message_id uuid not null references public.announcement_messages (id) on delete cascade,
  locale     public.locale_code not null,
  text       text not null check (length(text) between 1 and 140),
  link_label text,
  primary key (message_id, locale)
);

-- Lo que la tienda debe mostrar AHORA (o en p_now, para la vista previa del panel).
-- Devuelve null si no hay nada → el banner no se renderiza (sin hueco).
-- next_change_at le dice al navegador cuándo volver a evaluar (fin, fin del contador…).
create or replace function public.current_announcement(
  p_locale public.locale_code default 'es',
  p_now timestamptz default now()
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  c record;
  v_items jsonb;
  v_mode text;
  v_t record;
  v_next timestamptz;
begin
  for c in
    select ac.*
      from public.announcement_campaigns ac
     where ac.is_active
       and ac.starts_at <= p_now
       and (ac.ends_at is null or ac.ends_at > p_now)
       -- un contador vencido con comportamiento "ocultar" saca a la campaña de la carrera
       and not (ac.countdown_enabled and ac.countdown_end_behavior = 'hide' and ac.countdown_target_at <= p_now)
     order by ac.priority desc, ac.starts_at desc
  loop
    select t.* into v_t
      from public.announcement_campaign_translations t
     where t.campaign_id = c.id and t.locale in (p_locale, 'es')
     order by (t.locale = p_locale) desc
     limit 1;

    if c.countdown_enabled and c.countdown_target_at <= p_now then
      -- contador terminado y comportamiento "cambiar mensaje"
      if v_t.after_text is null then continue; end if;
      v_mode := 'after';
      v_items := jsonb_build_array(jsonb_build_object(
        'text', v_t.after_text, 'link_url', c.after_link_url, 'link_label', v_t.after_link_label));
    else
      select coalesce(jsonb_agg(jsonb_build_object(
               'text', mt.text,
               'link_url', coalesce(m.link_url, c.link_url),
               'link_label', coalesce(mt.link_label, c.link_label ->> p_locale, c.link_label ->> 'es'))
             order by m.position), '[]'::jsonb)
        into v_items
        from public.announcement_messages m
        join lateral (
          select x.* from public.announcement_message_translations x
           where x.message_id = m.id and x.locale in (p_locale, 'es')
           order by (x.locale = p_locale) desc limit 1
        ) mt on true
       where m.campaign_id = c.id;

      if c.countdown_enabled and v_t.countdown_text is not null then
        v_mode := 'countdown';
        v_items := jsonb_build_array(jsonb_build_object(
          'text', v_t.countdown_text, 'countdown', true, 'link_url', c.link_url,
          'link_label', coalesce(c.link_label ->> p_locale, c.link_label ->> 'es'))) || v_items;
      else
        v_mode := 'messages';
      end if;
      if jsonb_array_length(v_items) = 0 then continue; end if;
    end if;

    -- próximo instante en que el resultado puede cambiar
    select min(x) into v_next from (values
      (c.ends_at),
      (case when c.countdown_enabled and c.countdown_target_at > p_now then c.countdown_target_at end),
      ((select min(o.starts_at) from public.announcement_campaigns o
         where o.is_active and o.starts_at > p_now and o.priority >= c.priority and o.id <> c.id))
    ) v(x);

    return jsonb_build_object(
      'campaign_id', c.id,
      'mode', v_mode,
      'items', v_items,
      'style', c.style,
      'bg_color', c.bg_color,
      'text_color', c.text_color,
      'motion', c.motion,
      'marquee_speed', c.marquee_speed,
      'rotate_interval_seconds', c.rotate_interval_seconds,
      'repeat', c.repeat,
      'countdown_target_at', case when v_mode = 'countdown' then c.countdown_target_at end,
      'ends_at', c.ends_at,
      'timezone', c.timezone,
      'next_change_at', v_next
    );
  end loop;

  -- nada activo → el banner no existe (sin hueco sobre el menú)
  return null;
end $$;
revoke all on function public.current_announcement(public.locale_code, timestamptz) from public;
grant execute on function public.current_announcement(public.locale_code, timestamptz) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2. Políticas legales versionadas (qué texto estaba vigente en cada fecha)
-- -----------------------------------------------------------------------------
create type public.legal_review_status as enum ('draft', 'needs_legal_review', 'approved');

create table public.page_versions (
  id                  uuid primary key default gen_random_uuid(),
  page_id             uuid not null references public.pages (id) on delete restrict,
  locale              public.locale_code not null,
  version_label       text not null check (version_label ~ '^[0-9]+(\.[0-9]+){0,2}$'),   -- 1.0, 1.1, 2.0
  title               text not null,
  body_md             text not null,
  change_summary      text,
  effective_at        timestamptz not null,       -- "Última actualización" visible
  content_sha256      text not null default '',  -- huella del texto exacto publicado (trigger)
  legal_review_status public.legal_review_status not null default 'needs_legal_review',
  legal_review_note   text,
  published_by        uuid references auth.users (id),
  published_at        timestamptz not null default now(),
  unique (page_id, locale, version_label)
);
create index page_versions_lookup on public.page_versions (page_id, locale, effective_at desc);

create or replace function public.page_versions_hash()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.content_sha256 := encode(sha256(convert_to(new.title || E'\n' || new.body_md, 'UTF8')), 'hex');
  return new;
end $$;
create trigger page_versions_hash before insert on public.page_versions
  for each row execute function public.page_versions_hash();

-- Una versión publicada no se reescribe: solo puede cambiar su estado de revisión legal.
create or replace function public.page_versions_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'IMMUTABLE_LEDGER: page_versions no admite DELETE';
  end if;
  if (new.page_id, new.locale, new.version_label, new.title, new.body_md, new.effective_at, new.content_sha256)
     is distinct from (old.page_id, old.locale, old.version_label, old.title, old.body_md, old.effective_at, old.content_sha256) then
    raise exception 'IMMUTABLE_LEDGER: publica una versión nueva en lugar de editar la vigente';
  end if;
  return new;
end $$;
create trigger page_versions_immutable before update or delete on public.page_versions
  for each row execute function public.page_versions_guard();

-- Versión vigente de una política en un instante dado (por defecto, ahora).
create or replace function public.policy_version_at(
  p_kind public.page_kind,
  p_locale public.locale_code default 'es',
  p_at timestamptz default now(),
  p_region text default null
) returns public.page_versions language sql stable security definer set search_path = '' as $$
  select v.*
    from public.page_versions v
    join public.pages p on p.id = v.page_id
   where p.kind = p_kind
     and p.region_code is not distinct from p_region
     and v.locale = p_locale
     and v.effective_at <= p_at
   order by v.effective_at desc, v.published_at desc
   limit 1;
$$;
grant execute on function public.policy_version_at(public.page_kind, public.locale_code, timestamptz, text) to anon, authenticated, service_role;

-- Aceptaciones registradas (checkout u otras), con la versión exacta aceptada.
create table public.policy_acceptances (
  id              bigint generated always as identity primary key,
  page_version_id uuid not null references public.page_versions (id) on delete restrict,
  order_id        uuid references public.orders (id) on delete set null,
  checkout_id     uuid references public.checkouts (id) on delete set null,
  method          text not null check (method in ('stripe_terms_of_service', 'checkbox', 'notice')),
  accepted_at     timestamptz not null default now(),
  check (order_id is not null or checkout_id is not null)
);
create index policy_acceptances_order on public.policy_acceptances (order_id);
create trigger policy_acceptances_immutable before update or delete on public.policy_acceptances
  for each row execute function public.forbid_mutation();

-- -----------------------------------------------------------------------------
-- 3. Cookies: categorías, integraciones (píxeles) y registro de consentimiento
-- -----------------------------------------------------------------------------
create type public.cookie_category    as enum ('essential', 'analytics', 'marketing', 'personalization');
create type public.tracking_provider  as enum ('google_analytics', 'meta_pixel', 'tiktok_pixel', 'other');
create type public.consent_action     as enum ('accept_all', 'reject_all', 'custom', 'withdraw', 'gpc_signal');

-- Integraciones que el panel enciende/apaga. Solo IDs PÚBLICOS (G-XXXX, pixel id).
-- Tokens de servidor (p.ej. Conversions API) van como secrets, nunca aquí.
create table public.tracking_integrations (
  id              uuid primary key default gen_random_uuid(),
  provider        public.tracking_provider not null,
  display_name    text not null,
  is_enabled      boolean not null default false,
  public_id       text check (public_id is null or public_id ~ '^[A-Za-z0-9_-]{3,64}$'),
  consent_category public.cookie_category not null check (consent_category <> 'essential'),
  settings        jsonb not null default '{}'::jsonb,
  updated_at      timestamptz not null default now(),
  check (not is_enabled or public_id is not null)
);

-- Inventario de cookies/almacenamiento → genera la tabla de la Política de Cookies.
create table public.cookie_declarations (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  provider       text not null,                -- "D'ORATA", "Google", "Meta"…
  category       public.cookie_category not null,
  storage        text not null default 'cookie' check (storage in ('cookie', 'local_storage', 'session_storage')),
  purpose        jsonb not null,               -- {"es":"…","en":"…"}
  duration       text not null,                -- "12 meses", "sesión"
  integration_id uuid references public.tracking_integrations (id) on delete cascade,
  is_active      boolean not null default true,
  unique (name, provider)
);

-- Registro de consentimiento. Mínimo necesario: id técnico aleatorio (cookie first-party),
-- versión de la política, categorías y fecha. Sin IP, sin email, sin user agent.
create table public.cookie_consent_records (
  id                bigint generated always as identity primary key,
  subject_id        uuid not null,               -- aleatorio, generado en el navegador; no identifica a la persona
  action            public.consent_action not null,
  analytics         boolean not null,
  marketing         boolean not null,
  personalization   boolean not null,
  policy_version_id uuid references public.page_versions (id) on delete restrict,
  gpc               boolean not null default false,   -- señal Global Privacy Control del navegador
  region            text check (region is null or region ~ '^[A-Z]{2}(-[A-Z0-9]{1,3})?$'), -- país/estado aproximado
  created_at        timestamptz not null default now(),
  check (action <> 'reject_all' or not (analytics or marketing or personalization)),
  check (action <> 'accept_all' or (analytics and marketing and personalization)),
  check (not gpc or not marketing)    -- con GPC no se acepta venta/compartición para publicidad
);
create index cookie_consent_subject on public.cookie_consent_records (subject_id, created_at desc);
-- Inmutable; la única excepción es la purga por antigüedad (bandera de transacción).
create or replace function public.cookie_consent_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and current_setting('dorata.consent_purge', true) = 'on' then
    return old;
  end if;
  raise exception 'IMMUTABLE_LEDGER: cookie_consent_records no admite %', tg_op;
end $$;
create trigger cookie_consent_immutable before update or delete on public.cookie_consent_records
  for each row execute function public.cookie_consent_guard();

-- Purga por antigüedad (plazo configurable en store_settings.consent_retention_months).
create or replace function public.purge_old_consent_records()
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  perform set_config('dorata.consent_purge', 'on', true);
  delete from public.cookie_consent_records r
   using public.store_settings s
   where r.created_at < now() - make_interval(months => s.consent_retention_months);
  get diagnostics n = row_count;
  perform set_config('dorata.consent_purge', 'off', true);
  return n;
end $$;
revoke all on function public.purge_old_consent_records() from public, anon, authenticated;
grant execute on function public.purge_old_consent_records() to service_role;

-- Configuración pública de rastreo: lo que el navegador necesita para cargar (o NO cargar) scripts.
create or replace function public.public_tracking_config()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'provider', provider, 'public_id', public_id, 'category', consent_category)), '[]'::jsonb)
    from public.tracking_integrations where is_enabled;
$$;
grant execute on function public.public_tracking_config() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Marketing separado de lo transaccional (consentimiento propio + historial)
-- -----------------------------------------------------------------------------
create type public.marketing_channel as enum ('email', 'sms');

create table public.marketing_subscriptions (
  id                uuid primary key default gen_random_uuid(),
  email             extensions.citext not null,
  channel           public.marketing_channel not null default 'email',
  status            text not null check (status in ('subscribed', 'unsubscribed')),
  locale            public.locale_code not null default 'es',
  customer_id       uuid references public.customers (id) on delete set null,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  subscribed_at     timestamptz,
  unsubscribed_at   timestamptz,
  updated_at        timestamptz not null default now(),
  unique (email, channel),
  check (status <> 'subscribed' or subscribed_at is not null)
);

create table public.marketing_consent_events (
  id                bigint generated always as identity primary key,
  subscription_id   uuid not null references public.marketing_subscriptions (id) on delete cascade,
  action            text not null check (action in ('opt_in', 'opt_out')),
  source            text not null check (source in ('checkout', 'footer', 'popup', 'account', 'admin', 'unsubscribe_link', 'privacy_request')),
  policy_version_id uuid references public.page_versions (id) on delete set null,
  created_at        timestamptz not null default now()
);
create index marketing_consent_events_sub on public.marketing_consent_events (subscription_id);

-- -----------------------------------------------------------------------------
-- 5. Solicitudes de privacidad (acceso, corrección, eliminación, exportación, exclusión)
-- -----------------------------------------------------------------------------
create type public.privacy_request_type   as enum ('access', 'correction', 'deletion', 'export', 'opt_out_marketing', 'opt_out_sale_share', 'limit_use', 'other');
create type public.privacy_request_status as enum ('received', 'verifying', 'in_progress', 'completed', 'denied', 'withdrawn');
create sequence public.privacy_request_number_seq start 1;

create table public.privacy_requests (
  id                  uuid primary key default gen_random_uuid(),
  request_number      bigint not null unique default nextval('public.privacy_request_number_seq'),
  type                public.privacy_request_type not null,
  status              public.privacy_request_status not null default 'received',
  email               extensions.citext not null,
  full_name           text,
  customer_id         uuid references public.customers (id) on delete set null,
  region              text,                        -- estado/país declarado (aplica derechos según jurisdicción)
  details             text,
  received_at         timestamptz not null default now(),
  due_at              timestamptz,                 -- se calcula con store_settings.privacy_response_days
  verified_at         timestamptz,
  verification_method text,
  resolution          text,
  resolved_at         timestamptz,
  resolved_by         uuid references auth.users (id),
  internal_notes      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (status not in ('completed', 'denied') or (resolved_at is not null and resolution is not null))
);
create index privacy_requests_status on public.privacy_requests (status, due_at);

create or replace function public.privacy_requests_set_due()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.due_at is null then
    select new.received_at + make_interval(days => s.privacy_response_days) into new.due_at
      from public.store_settings s where s.id = 1;
  end if;
  return new;
end $$;
create trigger privacy_requests_due before insert on public.privacy_requests
  for each row execute function public.privacy_requests_set_due();

create table public.privacy_request_events (
  id         bigint generated always as identity primary key,
  request_id uuid not null references public.privacy_requests (id) on delete cascade,
  type       text not null,
  message    text,
  actor_id   uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- Eliminación "cuando corresponda": borra/anonimiza datos personales pero CONSERVA los registros
-- de venta que exige la ley fiscal (montos, fechas, productos, estado/país para impuestos).
create or replace function public.anonymize_customer(p_customer_id uuid, p_request_id uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_anon text := 'anonimizado+' || replace(p_customer_id::text, '-', '') || '@invalid.dorata';
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  update public.orders
     set email = v_anon,
         phone_e164 = null,
         customer_name = 'Cliente anonimizado',
         shipping_address = case when shipping_address is null then null
                                 else jsonb_strip_nulls(jsonb_build_object(
                                   'state', shipping_address ->> 'state',
                                   'country', shipping_address ->> 'country')) end,
         billing_address = null,
         customer_note = null
   where customer_id = p_customer_id;

  update public.authenticity_certificates ac set customer_name = 'Cliente anonimizado'
    from public.orders o where o.id = ac.order_id and o.customer_id = p_customer_id;

  delete from public.customer_addresses where customer_id = p_customer_id;
  delete from public.customer_notes where customer_id = p_customer_id;
  delete from public.marketing_subscriptions
   where customer_id = p_customer_id
      or email = (select email from public.customers where id = p_customer_id);

  update public.customers
     set email = v_anon, full_name = null, phone_e164 = null, instagram_handle = null,
         user_id = null, stripe_customer_id = null, anonymized_at = now()
   where id = p_customer_id;

  if p_request_id is not null then
    insert into public.privacy_request_events (request_id, type, message, actor_id)
    values (p_request_id, 'customer_anonymized', 'Datos personales anonimizados; registros fiscales conservados', (select auth.uid()));
  end if;
end $$;
revoke all on function public.anonymize_customer(uuid, uuid) from public, anon;
grant execute on function public.anonymize_customer(uuid, uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 6. RLS, auditoría y updated_at de lo nuevo
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'announcement_campaigns', 'announcement_campaign_translations', 'announcement_messages',
    'announcement_message_translations', 'page_versions', 'policy_acceptances', 'tracking_integrations',
    'cookie_declarations', 'cookie_consent_records', 'marketing_subscriptions', 'marketing_consent_events',
    'privacy_requests', 'privacy_request_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- Banner: el público NO lee las campañas (no se filtran lanzamientos futuros); usa current_announcement().
do $$
declare t text;
begin
  foreach t in array array['announcement_campaigns', 'announcement_campaign_translations',
                           'announcement_messages', 'announcement_message_translations'] loop
    execute format('create policy "staff all %1$s" on public.%1$I for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()))', t);
  end loop;
end $$;

-- Políticas publicadas: lectura pública de versiones cuya fecha ya llegó.
create policy "public read effective versions" on public.page_versions
  for select to anon, authenticated using (effective_at <= now() or (select public.is_staff()));
create policy "admin publish versions" on public.page_versions
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin review versions" on public.page_versions
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "public read cookie declarations" on public.cookie_declarations
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "admin write cookie declarations" on public.cookie_declarations
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Datos de privacidad y marketing: solo admin (lectura). Escrituras públicas entran por el servidor
-- (Turnstile + rate limit) con la clave secreta.
do $$
declare t text;
begin
  foreach t in array array['tracking_integrations', 'privacy_requests', 'privacy_request_events',
                           'marketing_subscriptions'] loop
    execute format('create policy "admin all %1$s" on public.%1$I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
  foreach t in array array['cookie_consent_records', 'marketing_consent_events', 'policy_acceptances'] loop
    execute format('create policy "admin read %1$s" on public.%1$I for select to authenticated using ((select public.is_admin()))', t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['announcement_campaigns', 'page_versions', 'tracking_integrations',
                           'cookie_declarations', 'privacy_requests'] loop
    execute format('create trigger %I after insert or update or delete on public.%I
                    for each row execute function public.audit_row()', t || '_audit', t);
  end loop;
  foreach t in array array['announcement_campaigns', 'tracking_integrations', 'marketing_subscriptions', 'privacy_requests'] loop
    execute format('create trigger %I before update on public.%I
                    for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;

-- Purga mensual de consentimientos vencidos.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('purge-old-consents', '17 4 1 * *',
                          $cron$ select public.purge_old_consent_records(); $cron$);
  end if;
end $$;
