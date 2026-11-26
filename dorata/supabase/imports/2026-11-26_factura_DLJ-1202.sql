-- =============================================================================
-- D'ORATA — Importación de la factura DLUJO Joyería S.A.S. (cotización/factura DLJ-1202, 25-nov-2026)
-- Solo piezas TERMINADAS. Insumos (balines, neoprenos, herrajes: ítems 1-13, 19-25) NO se importan.
-- Todo entra como BORRADOR, sin precio de venta (lo define la dueña). Costo = total neto de la línea / cantidad
-- (incluye IVA 19% y el 50% de descuento), en COP; la tasa a USD queda pendiente hasta que se defina.
-- Cadenas sueltas: una "base de set" por unidad, pendiente de que la dueña le asigne un dije.
-- Dijes: categoría oculta "dijes", reservados para sets (no se venden solos).
-- Idempotente por SKU: si un SKU ya existe, esa línea se omite.
-- =============================================================================
do $$
declare
  v_supplier uuid;
  r record;
  v_cat uuid;
  v_pid uuid;
  v_vid uuid;
  v_n integer;
  v_slug text;
  v_name text;
  v_sku text;
begin
  select id into v_supplier from public.suppliers where name = 'DLUJO Joyería S.A.S.';
  if v_supplier is null then
    insert into public.suppliers (name, country, notes)
    values ('DLUJO Joyería S.A.S.', 'CO', 'Cali, Valle del Cauca. Factura/cotización DLJ-1202 del 25-nov-2026.')
    returning id into v_supplier;
  end if;

  for r in select * from (values
    -- (ítem, ref, descripción original, categoría, rol, unidades, costo COP por unidad, nombre, medidas, revisar)
    (14, '7328',      'A TOPO CIRCON VERDE ESM 3MM',                 'aretes',   null,            1, 12500.00, 'Aretes topo circón verde esm. 3 mm',                 '3 mm',            false),
    (15, '7326',      'A TOPO CIRCON NEGRO 4MM',                     'aretes',   null,            1, 15000.00, 'Aretes topo circón negro 4 mm',                      '4 mm',            false),
    (16, '7263',      'A TOPO CRUZ VERDE ESM 0.7CM',                 'aretes',   null,            1, 27500.00, 'Aretes topo cruz verde esm. 0,7 cm',                 '0,7 cm',          false),
    (17, '7262',      'A TOPO CUADRADO 4MM VERDE ESM',               'aretes',   null,            1, 22500.00, 'Aretes topo cuadrado verde esm. 4 mm',               '4 mm',            false),
    (18, '7137',      'A TOPO CUADRADO TIPO ORO VERDE ESM 4MM',      'aretes',   null,            1, 22500.00, 'Aretes topo cuadrado tipo oro verde esm. 4 mm',      '4 mm',            false),
    (27, '7264',      'A TOPO CAJA PUNTOS VERDE ESM 4MM',            'aretes',   null,            1, 25000.00, 'Aretes topo caja puntos verde esm. 4 mm',            '4 mm',            false),
    (47, '7272-7273', 'SET CANDONGA MILANO CRISTAL (2 PARES)',       'aretes',   null,            1, 65000.00, 'Set candongas Milano cristal (2 pares)',             null,              true),
    (48, '7267',      'A TOPO CORONA RX VERDE ESM 0.7CM',            'aretes',   null,            1, 32499.99, 'Aretes topo corona RX verde esm. 0,7 cm',            '0,7 cm',          false),
    (49, '7138',      'A TOPO CORAZON CAJA TIPO ORO VERDE ESM 5MM',  'aretes',   null,            1, 22500.00, 'Aretes topo corazón caja tipo oro verde esm. 5 mm',  '5 mm',            false),
    (50, '7140',      'A TOPO TREBOL TIPO ORO VERDE ESM 0.7CM',      'aretes',   null,            1, 27500.00, 'Aretes topo trébol tipo oro verde esm. 0,7 cm',      '0,7 cm',          false),
    (51, '7287',      'A TOPO TREBOL CLOVER DIAMANTADO 1.2CM',       'aretes',   null,            1, 32499.99, 'Aretes topo trébol clover diamantado 1,2 cm',        '1,2 cm',          false),
    (52, '7266',      'A TOPO FLOR CRISTAL RONDEL0.6CM',             'aretes',   null,            1, 15000.00, 'Aretes topo flor cristal rondel 0,6 cm',             '0,6 cm',          false),
    (53, '7350',      'TOPO FLOR TRES PUNTOS NEGRO 0.6CM',           'aretes',   null,            1, 17500.00, 'Aretes topo flor tres puntos negro 0,6 cm',          '0,6 cm',          false),
    (26, '7280',      'P TIPO TREBOL VERDE ESM FINO 18+5CM',         'pulseras', null,            1, 49999.99, 'Pulsera trébol verde esm. fino 18 + 5 cm',           '18 + 5 cm',       true),
    (34, '6410-6443', 'SET PROTECCION SAN BENITO CADENA + DIJE',     'cadenas',  null,            1, 49999.99, 'Set Protección San Benito (cadena + dije)',          null,              true),
    (35, '6401-6452', 'SET VIRGEN GUADALUPE CON SINGAPUR 1MM 45CM',  'cadenas',  null,            1, 49999.99, 'Set Virgen de Guadalupe con cadena Singapur 1 mm',   '45 cm · 1 mm',    true),
    (28, '6403',      'C CARACOL 1.8MM 45CM',                        'cadenas',  'set_base',      1, 39999.99, 'Set cadena Caracol 1,8 mm 45 cm + dije por asignar', '45 cm · 1,8 mm',  false),
    (32, '6403',      'C CARACOL 1.8MM 45CM',                        'cadenas',  'set_base',      3, 40000.00, 'Set cadena Caracol 1,8 mm 45 cm + dije por asignar', '45 cm · 1,8 mm',  false),
    (30, '6419',      'C CUBANITA 2MM 45CM',                         'cadenas',  'set_base',      3, 40000.00, 'Set cadena Cubanita 2 mm 45 cm + dije por asignar',  '45 cm · 2 mm',    false),
    (31, '6411',      'C CART 3X1 DELGADA 1MM 45CM',                 'cadenas',  'set_base',      3, 40000.00, 'Set cadena Cart 3x1 delgada 1 mm 45 cm + dije por asignar', '45 cm · 1 mm', false),
    (33, '6401',      'C SINGAPUR 1MM 45CM',                         'cadenas',  'set_base',      3, 40000.00, 'Set cadena Singapur 1 mm 45 cm + dije por asignar',  '45 cm · 1 mm',    false),
    (29, '7286',      'D TREBOL CLOVER MINI VERDE ESM 0.9CM',        'dijes',    'set_component', 1, 22500.00, 'Dije trébol clover mini verde esm. 0,9 cm',          '0,9 cm',          false),
    (37, '7286',      'D TREBOL CLOVER MINI VERDE ESM 0.9CM',        'dijes',    'set_component', 1, 22500.00, 'Dije trébol clover mini verde esm. 0,9 cm',          '0,9 cm',          false),
    (36, '7358',      'DIJE CLOVER MINI NEGRO 0.9CM',                'dijes',    'set_component', 1, 22500.00, 'Dije clover mini negro 0,9 cm',                      '0,9 cm',          false),
    (38, '7477',      'DIJE CRUZ VERDE ESM 0.7CM',                   'dijes',    'set_component', 1, 20000.00, 'Dije cruz verde esm. 0,7 cm',                        '0,7 cm',          false),
    (39, '7437',      'DIJE SAN BENITO DIAMANTADO 1.2CM',            'dijes',    'set_component', 1, 15000.00, 'Dije San Benito diamantado 1,2 cm',                  '1,2 cm',          false),
    (40, '6814',      'DIJE TREBOL DIAMANTADO 1.4CM',                'dijes',    'set_component', 1, 25000.00, 'Dije trébol diamantado 1,4 cm',                      '1,4 cm',          false),
    (41, '7248',      'D TREBOL NACAR NEGRO 1.1CM',                  'dijes',    'set_component', 1, 27500.00, 'Dije trébol nácar negro 1,1 cm',                     '1,1 cm',          false),
    (42, '6323',      'DIJE AVION LISO 2CM',                         'dijes',    'set_component', 1, 17500.00, 'Dije avión liso 2 cm',                               '2 cm',            false),
    (43, '7257',      'D CORAZON DIAMANTADO 1CM',                    'dijes',    'set_component', 1, 27500.00, 'Dije corazón diamantado 1 cm',                       '1 cm',            false),
    (44, '7256',      'D CRUZ IMPERIAL CENTRO VERDE ESM 2.5CM',      'dijes',    'set_component', 1, 39999.99, 'Dije cruz imperial centro verde esm. 2,5 cm',        '2,5 cm',          false),
    (45, '7254',      'D RONDEL ESMERALDA PUNTOS CRISTAL 1.2CM',     'dijes',    'set_component', 1, 25000.00, 'Dije rondel esmeralda puntos cristal 1,2 cm',        '1,2 cm',          false),
    (46, '6526',      'DIJE PROTECCION 3 GRACIAS 1CM',               'dijes',    'set_component', 1, 20000.00, 'Dije Protección 3 Gracias 1 cm',                     '1 cm',            false)
  ) as t(item, ref, original, cat_slug, kit_role, units, unit_cost, name, measurements, review)
  loop
    select category_id into v_cat from public.category_translations where locale = 'es' and slug = r.cat_slug;
    if v_cat is null then raise exception 'Falta la categoría %', r.cat_slug; end if;
    -- una pieza por unidad cuando es set pendiente o dije (cada una se arma por separado); si no, una ficha con N unidades
    for v_n in 1 .. (case when r.kit_role is not null then r.units else 1 end) loop
      v_sku := 'DOR-' || upper(left(r.cat_slug, 3)) || '-' || r.ref || '-I' || r.item || (case when r.kit_role is not null and r.units > 1 then '-' || v_n else '' end);
      continue when exists (select 1 from public.product_variants where sku = v_sku);
      v_name := r.name || (case when r.kit_role is not null and r.units > 1 then ' · ' || v_n else '' end)
                       || (case when r.item = 37 then ' · 2' when r.item = 29 then ' · 1' else '' end);
      v_slug := trim(both '-' from regexp_replace(lower(translate(v_name, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')), '[^a-z0-9]+', '-', 'g'));
      v_slug := v_slug || '-' || r.item || (case when r.kit_role is not null and r.units > 1 then '-' || v_n else '' end);

      insert into public.products (status, primary_category_id, material, measurements, tags, kit_role)
      values ('draft', v_cat, null, r.measurements,
              array['factura-dlj-1202'] || (case when r.review then array['revisar'] else array[]::text[] end), r.kit_role)
      returning id into v_pid;
      insert into public.product_translations (product_id, locale, name, slug)
      values (v_pid, 'es', v_name, v_slug);
      insert into public.product_variants (product_id, sku, title, price_cents, is_default, is_active, position)
      values (v_pid, v_sku, 'Única', 0, true, true, 0)
      returning id into v_vid;
      insert into public.variant_costs (variant_id, supplier_id, original_currency, original_amount, fx_cop_per_usd, is_current, notes)
      values (v_vid, v_supplier, 'COP', r.unit_cost, null, true,
              format('Factura DLJ-1202 · ítem %s · ref %s · %s · costo por unidad con IVA 19%% y 50%% de descuento', r.item, r.ref, r.original));
      -- unidades en inventario (registro igual al de adjust_inventory: conteo inicial)
      update public.inventory_levels set on_hand = on_hand + (case when r.kit_role is not null then 1 else r.units end) where variant_id = v_vid;
      insert into public.inventory_movements (variant_id, type, quantity_delta, on_hand_after, reason)
      values (v_vid, 'initial_count', (case when r.kit_role is not null then 1 else r.units end),
              (select on_hand from public.inventory_levels where variant_id = v_vid), 'Factura DLJ-1202 (DLUJO Joyería)');
    end loop;
  end loop;

  -- En la tienda solo quedan visibles: Pulseras, Cadenas y Aretes.
  update public.categories c set is_visible = (t.slug in ('pulseras', 'cadenas', 'aretes'))
    from public.category_translations t where t.category_id = c.id and t.locale = 'es';
end $$;
