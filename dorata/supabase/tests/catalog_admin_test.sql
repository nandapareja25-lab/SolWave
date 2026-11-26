-- Administración del catálogo y lectura pública de políticas.
begin;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000b2', 'staff@test.local');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000b2', 'staff');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);

-- ---------- C1: crear producto con variantes y garantía por componente ----------
do $$
declare v_id uuid; r record;
begin
  v_id := public.admin_upsert_product(jsonb_build_object(
    'status', 'active', 'category_slug', 'pulseras-de-hilo', 'material', 'Hilo + balines en oro laminado 18K',
    'translation', jsonb_build_object('name', 'Pulsera de hilo con balines', 'slug', 'pulsera-hilo-balines'),
    'variants', jsonb_build_array(
      jsonb_build_object('sku', 'PH-NEGRO', 'title', 'Hilo negro', 'price_cents', 5999),
      jsonb_build_object('sku', 'PH-ROJO',  'title', 'Hilo rojo',  'price_cents', 5999, 'is_default', true)),
    'components', jsonb_build_array(
      jsonb_build_object('label', 'Balines de oro laminado', 'warranty_code', 'ball_beads_5y'),
      jsonb_build_object('label', 'Hilo, neopreno y armado', 'warranty_code', 'wear_components'))));
  select (select count(*) from public.product_variants where product_id = v_id) as nv,
         (select sku from public.product_variants where product_id = v_id and is_default) as def,
         (select count(*) from public.product_warranty_components where product_id = v_id) as nc,
         (select count(*) from public.inventory_levels l join public.product_variants pv on pv.id = l.variant_id where pv.product_id = v_id) as ninv,
         (select published_at is not null from public.products where id = v_id) as pub
    into r;
  assert r.nv = 2 and r.def = 'PH-ROJO' and r.nc = 2 and r.ninv = 2 and r.pub, r::text;
  perform set_config('dorata.test_product', v_id::text, true);
  raise notice 'OK C1 — producto con 2 variantes, variante por defecto, inventario y 2 componentes de garantía';
end $$;

-- ---------- C2: editar: cambia slug (301), quita una variante (se desactiva), reemplaza componentes ----------
do $$
declare v_id uuid := current_setting('dorata.test_product')::uuid;
begin
  perform public.admin_upsert_product(jsonb_build_object(
    'id', v_id, 'status', 'active', 'category_slug', 'pulseras-de-hilo',
    'translation', jsonb_build_object('name', 'Pulsera de hilo D''ORATA', 'slug', 'pulsera-hilo-dorata'),
    'variants', jsonb_build_array(jsonb_build_object('sku', 'PH-NEGRO', 'title', 'Hilo negro', 'price_cents', 6499)),
    'components', jsonb_build_array(jsonb_build_object('label', 'Balines de oro laminado', 'warranty_code', 'ball_beads_5y'))));
  assert (select to_path from public.slug_redirects where from_path = '/pulseras-de-hilo/pulsera-hilo-balines') = '/pulseras-de-hilo/pulsera-hilo-dorata', 'redirección 301';
  assert (select is_active from public.product_variants where sku = 'PH-ROJO') = false, 'variante omitida se desactiva, no se borra';
  assert (select is_default from public.product_variants where sku = 'PH-NEGRO'), 'la que queda pasa a ser la de por defecto';
  assert (select price_cents from public.product_variants where sku = 'PH-NEGRO') = 6499;
  assert (select count(*) from public.product_warranty_components where product_id = v_id) = 1;
  raise notice 'OK C2 — edición con redirección, variantes desactivadas y componentes reemplazados';
end $$;

-- ---------- C3: validaciones ----------
do $$
begin
  begin perform public.admin_upsert_product('{"category_slug":"nuevos","translation":{"name":"X","slug":"x"},"variants":[{"sku":"X-1","price_cents":100}]}');
        raise exception 'debió fallar'; exception when others then assert sqlerrm = 'UNKNOWN_CATEGORY', sqlerrm; end;
  begin perform public.admin_upsert_product('{"category_slug":"cadenas","translation":{"name":"X","slug":"X Mal"},"variants":[{"sku":"X-1","price_cents":100}]}');
        raise exception 'debió fallar'; exception when others then assert sqlerrm = 'INVALID_SLUG', sqlerrm; end;
  begin perform public.admin_upsert_product('{"category_slug":"cadenas","translation":{"name":"X","slug":"x"},"variants":[{"sku":"x minúscula","price_cents":100}]}');
        raise exception 'debió fallar'; exception when others then assert sqlerrm = 'INVALID_SKU', sqlerrm; end;
  begin perform public.admin_upsert_product('{"category_slug":"cadenas","translation":{"name":"X","slug":"x"},"variants":[]}');
        raise exception 'debió fallar'; exception when others then assert sqlerrm = 'VARIANTS_REQUIRED', sqlerrm; end;
  raise notice 'OK C3 — rechaza categorías automáticas, slugs, SKUs y productos sin variantes inválidos';
end $$;

-- ---------- C4: fotos: registrar, reordenar, borrar ----------
do $$
declare v_id uuid := current_setting('dorata.test_product')::uuid; a uuid; b uuid; c uuid; r jsonb;
begin
  a := public.admin_register_media(jsonb_build_object('product_id', v_id, 'storage_path', v_id || '/a.webp', 'alt', 'Frente'));
  b := public.admin_register_media(jsonb_build_object('product_id', v_id, 'storage_path', v_id || '/b.webp', 'alt', 'Detalle'));
  c := public.admin_register_media(jsonb_build_object('product_id', v_id, 'storage_path', v_id || '/c.webp', 'alt', 'Puesta'));
  perform public.admin_reorder_media(v_id, array[c, a, b]);
  assert (select array_agg(id order by position) from public.product_media where product_id = v_id) = array[c, a, b], 'orden';
  r := public.admin_delete_media(a);
  assert r ->> 'storage_path' = v_id || '/a.webp';
  assert (select array_agg(position order by position) from public.product_media where product_id = v_id) = array[0, 1], 'posiciones compactadas';
  begin perform public.admin_register_media(jsonb_build_object('product_id', v_id, 'storage_path', 'otro-producto/x.webp'));
        raise exception 'debió fallar'; exception when others then assert sqlerrm = 'INVALID_PATH', sqlerrm; end;
  raise notice 'OK C4 — fotos: subir, ordenar y borrar (ruta restringida a la carpeta del producto)';
end $$;

-- ---------- C5: categorías editables con redirección ----------
do $$
declare v_id uuid;
begin
  select category_id into v_id from public.category_translations where slug = 'treboles';
  perform public.admin_upsert_category(jsonb_build_object('id', v_id, 'name', 'Tréboles de la suerte', 'slug', 'treboles-de-la-suerte', 'is_visible', false));
  assert (select to_path from public.slug_redirects where from_path = '/treboles') = '/treboles-de-la-suerte';
  assert (select is_visible from public.categories where id = v_id) = false;
  raise notice 'OK C5 — categoría renombrada, oculta y con redirección';
end $$;
reset role;

-- ---------- C7: sin el código de dos pasos (aal1) no se administra nada ----------
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
select set_config('request.jwt.claim.aal', 'aal1', true);
do $$
begin
  assert not public.is_staff(), 'con solo contraseña no es staff';
  assert public.my_admin_role() = 'staff', 'pero el panel sabe su rol para pedirle el código';
  begin perform public.admin_upsert_category('{"name":"X","slug":"x-aal1"}'); raise exception 'debió fallar';
  exception when insufficient_privilege then null; end;
  assert (select count(*) from public.variant_costs) = 0 and (select count(*) from public.orders) = 0;
  raise notice 'OK C7 — sin verificación en dos pasos no se administra ni se leen datos internos';
end $$;
select set_config('request.jwt.claim.aal', '', true);
reset role;

-- ---------- C6: el público no administra y no ve borradores legales ----------
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$
declare l jsonb;
begin
  begin perform public.admin_upsert_category('{"name":"X","slug":"x"}'); raise exception 'debió fallar';
  exception when insufficient_privilege then null; end;
  l := public.public_legal_pages();
  assert jsonb_array_length(l) = 9, 'lista de políticas visible';
  assert (public.public_legal_page('privacidad') ->> 'body_md') is null, 'sin versión publicada: no se expone el borrador';
  assert public.public_legal_page('privacidad') ->> 'title' = 'Política de Privacidad';
  raise notice 'OK C6 — anon no administra; políticas listadas sin exponer borradores';
end $$;
reset role;

rollback;
