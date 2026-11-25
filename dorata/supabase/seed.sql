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

-- Página de garantía (borrador). El contenido vivo sale de warranty_policies.
with pg as (
  insert into public.pages (kind, is_published, sort_order) values ('warranty', false, 1) returning id
)
insert into public.page_translations (page_id, locale, slug, title, body_md)
select pg.id, 'es', 'garantia', 'Garantía D''ORATA', '' from pg;
