-- =============================================================================
-- D'ORATA — Datos iniciales. SOLO lo que la dueña definió; todo editable en el panel.
-- Nada de precios, tarifas de envío ni tasas inventadas: quedan vacíos o inactivos
-- hasta que se configuren.
-- =============================================================================

-- Garantías (texto entregado por D'ORATA, nov-2026)
with p as (
  insert into public.warranty_policies (code, duration_months, sort_order) values
    ('finished_pieces_1y', 12, 1),
    ('ball_beads_5y',      60, 2)
  returning id, code
)
insert into public.warranty_policy_translations (warranty_policy_id, locale, name, summary, coverage_md, exclusions_md)
select p.id, 'es',
  case p.code when 'finished_pieces_1y' then 'Garantía 1 año' else 'Garantía 5 años' end,
  case p.code when 'finished_pieces_1y'
    then 'Garantía de color por 1 año en piezas terminadas, incluso con piscina, mar, sudor, cremas y lociones.'
    else 'Garantía de color por 5 años en balinería de oro laminado, incluso con piscina, mar, sudor, cremas y lociones.' end,
  $md$Cubre la pérdida o el cambio de color y las condiciones propias del proceso de laminado, incluso con exposición a piscina, mar, sudor, cremas y lociones.

Según corresponda, también puede cubrir:
- Defectos de ensamble.
- Fallas del proceso de laminado.
- Porosidad.$md$,
  $md$No cubre:
- Modificaciones realizadas a la pieza.
- Golpes, roturas o caídas.
- Mal uso.
- Desgaste natural.
- Intervención de terceros.
- Daños producidos por ácidos o químicos fuertes.

Las joyas incompletas no se reciben para evaluación de garantía.$md$
from p;

-- Categorías iniciales (ejemplos de la dueña). "Nuevos" y "Ofertas" son automáticas.
with c (name, slug, sort_order, auto_rule, warranty) as (values
  ('Cadenas',           'cadenas',          1,  null, 'finished_pieces_1y'),
  ('Dijes',             'dijes',            2,  null, 'finished_pieces_1y'),
  ('Aretes',            'aretes',           3,  null, 'finished_pieces_1y'),
  ('Topitos',           'topitos',          4,  null, 'finished_pieces_1y'),
  ('Pulseras',          'pulseras',         5,  null, 'finished_pieces_1y'),
  ('Pulseras de hilo',  'pulseras-de-hilo', 6,  null, null),
  ('Balinería',         'balineria',        7,  null, 'ball_beads_5y'),
  ('Sets',              'sets',             8,  null, null),
  ('Religiosos',        'religiosos',       9,  null, null),
  ('Tréboles',          'treboles',         10, null, null),
  ('Nuevos',            'nuevos',           11, 'new',  null),
  ('Ofertas',           'ofertas',          12, 'sale', null)
), ins as (
  insert into public.categories (sort_order, auto_rule, default_warranty_policy_id)
  select c.sort_order, c.auto_rule::public.category_auto_rule,
         (select id from public.warranty_policies w where w.code = c.warranty)
    from c order by c.sort_order
  returning id, sort_order
)
insert into public.category_translations (category_id, locale, name, slug)
select ins.id, 'es', c.name, c.slug from ins join c on c.sort_order = ins.sort_order;

-- Métodos de envío: creados INACTIVOS y en $0 — se activan al configurar precio y tiempos.
with s (code, type, sort_order, name) as (values
  ('standard', 'standard', 1, 'Envío estándar'),
  ('express',  'express',  2, 'Envío express'),
  ('free',     'free',     3, 'Envío gratis')
), ins as (
  insert into public.shipping_methods (code, type, sort_order, is_active)
  select s.code, s.type::public.shipping_method_type, s.sort_order, false from s
  returning id, code
)
insert into public.shipping_method_translations (shipping_method_id, locale, name)
select ins.id, 'es', s.name from ins join s using (code);

-- Código de bienvenida preparado (INACTIVO hasta que lo actives y ajustes).
insert into public.discounts (code, description, type, percent_off, first_order_only, usage_limit_per_customer, is_active)
values ('BIENVENIDA10', 'Bienvenida: primera compra', 'percentage', 10, true, 1, false);

-- Páginas legales: BORRADORES con estructura, sin texto legal inventado.
-- Se redactan/revisan con un abogado y se PUBLICAN desde el panel (crea page_versions).
with p (kind, slug, title, sort_order, skeleton) as (values
  ('privacy',    'privacidad',              'Política de Privacidad',              1,
   E'## Quiénes somos\n[Razón social, nombre comercial, contacto de privacidad]\n\n## Qué datos recogemos y para qué\n[Pedidos, entrega, soporte, garantías, obligaciones fiscales, prevención de fraude, comunicaciones autorizadas]\n\n## Con quién los compartimos\n[Stripe (pagos), transportistas, proveedores de email y hosting]\n\n## No vendemos tu información personal\n\n## Tus derechos y cómo ejercerlos\n[Formulario de privacidad · plazos · derechos por estado]\n\n## Menores de edad\n[La tienda no está dirigida a niños; no recogemos intencionalmente datos de menores]\n\n## Cambios a esta política\n\n> [REQUIERE REVISIÓN LEGAL]'),
  ('cookies',    'cookies',                 'Política de Cookies',                 2,
   E'## Qué son las cookies\n\n## Categorías\nEsenciales · Analíticas · Marketing · Personalización\n\n## Lista de cookies\n[Se genera automáticamente desde el panel]\n\n## Cómo cambiar tus preferencias\n[Enlace "Preferencias de privacidad"]\n\n> [REQUIERE REVISIÓN LEGAL]'),
  ('terms',      'terminos-y-condiciones',  'Términos y Condiciones',              3, E'> [REQUIERE REVISIÓN LEGAL]'),
  ('site_terms', 'terminos-de-uso',         'Términos de uso del sitio',           4, E'> [REQUIERE REVISIÓN LEGAL]'),
  ('shipping',   'envios',                  'Política de Envíos',                  5, E'[Métodos, costos y tiempos se muestran desde Configuración › Envíos]\n\n> [REQUIERE REVISIÓN]'),
  ('returns',    'cambios-y-devoluciones',  'Política de Cambios y Devoluciones',  6, E'> [REQUIERE REVISIÓN LEGAL]'),
  ('refunds',    'reembolsos',              'Política de Reembolsos',              7, E'> [REQUIERE REVISIÓN LEGAL]'),
  ('warranty',   'garantia',                'Garantía D''ORATA',                   8, E'[Se compone desde Configuración › Garantías: coberturas 1 año / 5 años y exclusiones]'),
  ('contact',    'contacto',                'Información de contacto comercial',   9, E'[Razón social · correo · WhatsApp · dirección comercial cuando corresponda]')
), ins as (
  insert into public.pages (kind, is_published, sort_order)
  select p.kind::public.page_kind, false, p.sort_order from p order by p.sort_order
  returning id, kind
)
insert into public.page_translations (page_id, locale, slug, title, body_md)
select ins.id, 'es', p.slug, p.title, p.skeleton from ins join p on p.kind::public.page_kind = ins.kind;

-- Banner: campaña de lanzamiento con los datos de la dueña. Creada APAGADA (se enciende en el panel).
-- Fin: 2-dic-2026 23:59:59 en la zona horaria del negocio.
with c as (
  insert into public.announcement_campaigns
    (internal_name, is_active, priority, starts_at, ends_at, timezone, style, motion, marquee_speed, link_url, link_label)
  values ('Lanzamiento D''ORATA', false, 10,
          timestamp '2026-11-25 00:00:00' at time zone 'America/New_York',
          timestamp '2026-12-02 23:59:59' at time zone 'America/New_York',
          'America/New_York', 'black', 'marquee', 40, null, '{}'::jsonb)
  returning id
), m as (
  insert into public.announcement_messages (campaign_id, position) select c.id, 1 from c returning id
)
insert into public.announcement_message_translations (message_id, locale, text)
select m.id, 'es', '✨ LANZAMIENTO D''ORATA — 2 DE DICIEMBRE ✨' from m;

-- Inventario de almacenamiento PROPIO conocido (los de terceros se agregan al activar cada integración).
insert into public.cookie_declarations (name, provider, category, storage, purpose, duration) values
  ('dorata_consent', 'D''ORATA', 'essential', 'cookie',
   '{"es":"Guarda tus preferencias de cookies y el identificador técnico del consentimiento."}', '12 meses'),
  ('dorata_cart', 'D''ORATA', 'essential', 'local_storage',
   '{"es":"Recuerda los productos de tu carrito en este dispositivo."}', 'Hasta vaciar el carrito'),
  ('sb-auth-token', 'D''ORATA (Supabase)', 'essential', 'cookie',
   '{"es":"Mantiene tu sesión iniciada si creas una cuenta."}', 'Sesión / hasta cerrar sesión');

-- Integraciones de analítica/publicidad: creadas APAGADAS y sin ID.
insert into public.tracking_integrations (provider, display_name, consent_category) values
  ('google_analytics', 'Google Analytics 4', 'analytics'),
  ('meta_pixel',       'Meta Pixel',         'marketing'),
  ('tiktok_pixel',     'TikTok Pixel',       'marketing');
