-- =============================================================================
-- D'ORATA — Administración del catálogo (funciones seguras) y lectura pública de políticas
-- -----------------------------------------------------------------------------
-- El panel (fase 3) usa ESTAS funciones: validan rol, mantienen las reglas (una variante por
-- defecto, slugs con redirección 301, garantía por componente) y escriben todo en una transacción.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Políticas legales: lista y texto PUBLICADO (nunca expone borradores)
-- -----------------------------------------------------------------------------
create or replace function public.public_legal_pages(p_locale public.locale_code default 'es')
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'kind', p.kind, 'slug', t.slug, 'title', t.title, 'show_in_footer', p.show_in_footer,
           'has_published_version', exists (
             select 1 from public.page_versions v where v.page_id = p.id and v.locale = p_locale and v.effective_at <= now()))
         order by p.sort_order), '[]'::jsonb)
    from public.pages p
    join public.page_translations t on t.page_id = p.id and t.locale = p_locale
   where p.region_code is null;
$$;

create or replace function public.public_legal_page(p_slug text, p_locale public.locale_code default 'es')
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
           'kind', p.kind, 'slug', t.slug, 'title', coalesce(v.title, t.title),
           'body_md', v.body_md, 'version_label', v.version_label, 'effective_at', v.effective_at,
           'legal_review_status', v.legal_review_status)
    from public.pages p
    join public.page_translations t on t.page_id = p.id and t.locale = p_locale
    left join lateral (
      select pv.* from public.page_versions pv
       where pv.page_id = p.id and pv.locale = p_locale and pv.effective_at <= now()
       order by pv.effective_at desc, pv.published_at desc limit 1
    ) v on true
   where t.slug = p_slug and p.region_code is null
   limit 1;
$$;
grant execute on function public.public_legal_pages(public.locale_code) to anon, authenticated;
grant execute on function public.public_legal_page(text, public.locale_code) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Categorías
-- -----------------------------------------------------------------------------
create or replace function public.admin_upsert_category(p jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_slug text := p ->> 'slug';
  v_old_slug text;
  v_warranty uuid;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if coalesce(trim(p ->> 'name'), '') = '' then raise exception 'NAME_REQUIRED'; end if;
  if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'INVALID_SLUG'; end if;
  if p ? 'default_warranty_code' and p ->> 'default_warranty_code' is not null then
    select id into v_warranty from public.warranty_policies where code = p ->> 'default_warranty_code';
    if v_warranty is null then raise exception 'UNKNOWN_WARRANTY'; end if;
  end if;

  if v_id is null then
    insert into public.categories (parent_id, image_path, is_visible, show_in_nav, sort_order, auto_rule, default_warranty_policy_id)
    values (nullif(p ->> 'parent_id', '')::uuid, p ->> 'image_path', coalesce((p ->> 'is_visible')::boolean, true),
            coalesce((p ->> 'show_in_nav')::boolean, true), coalesce((p ->> 'sort_order')::integer, 0),
            nullif(p ->> 'auto_rule', '')::public.category_auto_rule, v_warranty)
    returning id into v_id;
  else
    update public.categories set
      parent_id = nullif(p ->> 'parent_id', '')::uuid,
      image_path = p ->> 'image_path',
      is_visible = coalesce((p ->> 'is_visible')::boolean, is_visible),
      show_in_nav = coalesce((p ->> 'show_in_nav')::boolean, show_in_nav),
      sort_order = coalesce((p ->> 'sort_order')::integer, sort_order),
      auto_rule = nullif(p ->> 'auto_rule', '')::public.category_auto_rule,
      default_warranty_policy_id = case when p ? 'default_warranty_code' then v_warranty else default_warranty_policy_id end
    where id = v_id;
    if not found then raise exception 'NOT_FOUND'; end if;
    select slug into v_old_slug from public.category_translations where category_id = v_id and locale = 'es';
  end if;

  insert into public.category_translations (category_id, locale, name, slug, description, seo_title, seo_description)
  values (v_id, 'es', trim(p ->> 'name'), v_slug, p ->> 'description', p ->> 'seo_title', p ->> 'seo_description')
  on conflict (category_id, locale) do update set
    name = excluded.name, slug = excluded.slug, description = excluded.description,
    seo_title = excluded.seo_title, seo_description = excluded.seo_description;

  if v_old_slug is not null and v_old_slug <> v_slug then
    insert into public.slug_redirects (locale, from_path, to_path) values ('es', '/' || v_old_slug, '/' || v_slug)
    on conflict (locale, from_path) do update set to_path = excluded.to_path;
  end if;
  return v_id;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Productos (con variantes, garantía por componente, categorías extra y colecciones)
-- -----------------------------------------------------------------------------
create or replace function public.admin_upsert_product(p jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_t jsonb := p -> 'translation';
  v_cat uuid;
  v_cat_slug text;
  v_warranty uuid;
  v_old_path text;
  v_new_path text;
  v_status public.product_status := coalesce(p ->> 'status', 'draft')::public.product_status;
  v jsonb;
  v_keep uuid[] := array[]::uuid[];
  v_vid uuid;
  v_pos integer := 0;
  c jsonb;
  v_cpos integer := 0;
  v_cw uuid;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if v_t is null or coalesce(trim(v_t ->> 'name'), '') = '' then raise exception 'NAME_REQUIRED'; end if;
  if (v_t ->> 'slug') is null or (v_t ->> 'slug') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'INVALID_SLUG'; end if;
  if jsonb_typeof(p -> 'variants') <> 'array' or jsonb_array_length(p -> 'variants') = 0 then raise exception 'VARIANTS_REQUIRED'; end if;

  select c2.id, ct.slug into v_cat, v_cat_slug
    from public.categories c2 join public.category_translations ct on ct.category_id = c2.id and ct.locale = 'es'
   where ct.slug = p ->> 'category_slug' and c2.auto_rule is null;
  if v_cat is null then raise exception 'UNKNOWN_CATEGORY'; end if;

  if p ->> 'warranty_code' is not null then
    select id into v_warranty from public.warranty_policies where code = p ->> 'warranty_code';
    if v_warranty is null then raise exception 'UNKNOWN_WARRANTY'; end if;
  end if;

  if v_id is null then
    insert into public.products (status, primary_category_id, warranty_policy_id, material, measurements, color, tags,
                                 is_featured, is_new, new_until, is_on_sale, weight_grams, shipping_notes, published_at)
    values (v_status, v_cat, v_warranty, p ->> 'material', p ->> 'measurements', p ->> 'color',
            coalesce(array(select jsonb_array_elements_text(p -> 'tags')), array[]::text[]),
            coalesce((p ->> 'is_featured')::boolean, false), coalesce((p ->> 'is_new')::boolean, false),
            nullif(p ->> 'new_until', '')::date, coalesce((p ->> 'is_on_sale')::boolean, false),
            nullif(p ->> 'weight_grams', '')::numeric, p ->> 'shipping_notes',
            case when v_status = 'active' then now() end)
    returning id into v_id;
  else
    select '/' || ct.slug || '/' || pt.slug into v_old_path
      from public.products pr
      join public.product_translations pt on pt.product_id = pr.id and pt.locale = 'es'
      join public.category_translations ct on ct.category_id = pr.primary_category_id and ct.locale = 'es'
     where pr.id = v_id;
    update public.products set
      status = v_status, primary_category_id = v_cat, warranty_policy_id = v_warranty,
      material = p ->> 'material', measurements = p ->> 'measurements', color = p ->> 'color',
      tags = coalesce(array(select jsonb_array_elements_text(p -> 'tags')), array[]::text[]),
      is_featured = coalesce((p ->> 'is_featured')::boolean, false), is_new = coalesce((p ->> 'is_new')::boolean, false),
      new_until = nullif(p ->> 'new_until', '')::date, is_on_sale = coalesce((p ->> 'is_on_sale')::boolean, false),
      weight_grams = nullif(p ->> 'weight_grams', '')::numeric, shipping_notes = p ->> 'shipping_notes',
      published_at = coalesce(published_at, case when v_status = 'active' then now() end)
    where id = v_id;
    if not found then raise exception 'NOT_FOUND'; end if;
  end if;

  insert into public.product_translations (product_id, locale, name, slug, short_description, description_md, seo_title, seo_description)
  values (v_id, 'es', trim(v_t ->> 'name'), v_t ->> 'slug', v_t ->> 'short_description', v_t ->> 'description_md',
          v_t ->> 'seo_title', v_t ->> 'seo_description')
  on conflict (product_id, locale) do update set
    name = excluded.name, slug = excluded.slug, short_description = excluded.short_description,
    description_md = excluded.description_md, seo_title = excluded.seo_title, seo_description = excluded.seo_description;

  -- URL vieja → nueva (301) si cambió la categoría o el slug
  v_new_path := '/' || v_cat_slug || '/' || (v_t ->> 'slug');
  if v_old_path is not null and v_old_path <> v_new_path then
    insert into public.slug_redirects (locale, from_path, to_path) values ('es', v_old_path, v_new_path)
    on conflict (locale, from_path) do update set to_path = excluded.to_path;
    delete from public.slug_redirects where locale = 'es' and from_path = v_new_path; -- evita bucles
  end if;

  -- Variantes: actualizar por id o SKU; las que no vienen se desactivan (no se borran: pueden tener ventas)
  for v in select * from jsonb_array_elements(p -> 'variants') loop
    if coalesce(v ->> 'sku', '') !~ '^[A-Z0-9][A-Z0-9-]{1,39}$' then raise exception 'INVALID_SKU' using detail = coalesce(v ->> 'sku', ''); end if;
    if (v ->> 'price_cents') is null or (v ->> 'price_cents')::integer < 0 then raise exception 'INVALID_PRICE'; end if;
    select id into v_vid from public.product_variants
     where (id = nullif(v ->> 'id', '')::uuid) or (sku = v ->> 'sku' and product_id = v_id) limit 1;
    if v_vid is null then
      insert into public.product_variants (product_id, sku, title, options, price_cents, compare_at_cents, weight_grams,
                                           low_stock_threshold, is_default, is_active, position)
      values (v_id, v ->> 'sku', coalesce(v ->> 'title', 'Única'), coalesce(v -> 'options', '{}'::jsonb),
              (v ->> 'price_cents')::integer, nullif(v ->> 'compare_at_cents', '')::integer,
              nullif(v ->> 'weight_grams', '')::numeric, nullif(v ->> 'low_stock_threshold', '')::integer,
              false, coalesce((v ->> 'is_active')::boolean, true), v_pos)
      returning id into v_vid;
    else
      update public.product_variants set
        sku = v ->> 'sku', title = coalesce(v ->> 'title', 'Única'), options = coalesce(v -> 'options', '{}'::jsonb),
        price_cents = (v ->> 'price_cents')::integer, compare_at_cents = nullif(v ->> 'compare_at_cents', '')::integer,
        weight_grams = nullif(v ->> 'weight_grams', '')::numeric, low_stock_threshold = nullif(v ->> 'low_stock_threshold', '')::integer,
        is_default = false, is_active = coalesce((v ->> 'is_active')::boolean, true), position = v_pos
      where id = v_vid and product_id = v_id;
      if not found then raise exception 'VARIANT_OF_OTHER_PRODUCT' using detail = v ->> 'sku'; end if;
    end if;
    v_keep := v_keep || v_vid;
    v_pos := v_pos + 1;
  end loop;
  update public.product_variants set is_active = false, is_default = false where product_id = v_id and not (id = any (v_keep));
  -- Exactamente una variante por defecto: la marcada, o la primera
  update public.product_variants set is_default = true
   where id = coalesce(
     (select (e ->> 'id')::uuid from jsonb_array_elements(p -> 'variants') e where (e ->> 'is_default')::boolean and e ->> 'id' is not null limit 1),
     (select pv.id from public.product_variants pv join jsonb_array_elements(p -> 'variants') e on e ->> 'sku' = pv.sku
       where pv.product_id = v_id and (e ->> 'is_default')::boolean limit 1),
     v_keep[1]);

  -- Garantía por componente (se reemplaza completa)
  if p ? 'components' then
    delete from public.product_warranty_components where product_id = v_id;
    for c in select * from jsonb_array_elements(coalesce(p -> 'components', '[]'::jsonb)) loop
      v_cw := null;
      if c ->> 'warranty_code' is not null then
        select id into v_cw from public.warranty_policies where code = c ->> 'warranty_code';
        if v_cw is null then raise exception 'UNKNOWN_WARRANTY'; end if;
      end if;
      insert into public.product_warranty_components (product_id, position, label, warranty_policy_id)
      values (v_id, v_cpos, jsonb_build_object('es', c ->> 'label'), v_cw);
      v_cpos := v_cpos + 1;
    end loop;
  end if;

  -- Categorías extra y colecciones (se reemplazan si vienen)
  if p ? 'extra_category_slugs' then
    delete from public.product_categories where product_id = v_id;
    insert into public.product_categories (product_id, category_id)
    select v_id, ct.category_id from public.category_translations ct
     where ct.locale = 'es' and ct.slug in (select jsonb_array_elements_text(p -> 'extra_category_slugs')) and ct.category_id <> v_cat;
  end if;
  if p ? 'collection_slugs' then
    delete from public.product_collections where product_id = v_id;
    insert into public.product_collections (product_id, collection_id)
    select v_id, ct.collection_id from public.collection_translations ct
     where ct.locale = 'es' and ct.slug in (select jsonb_array_elements_text(p -> 'collection_slugs'));
  end if;
  return v_id;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Fotos: registrar, ordenar, borrar (los archivos viven en Storage: product-media/{product_id}/…)
-- -----------------------------------------------------------------------------
create or replace function public.admin_register_media(p jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_product uuid := (p ->> 'product_id')::uuid;
  v_id uuid;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if (p ->> 'storage_path') is null or (p ->> 'storage_path') not like v_product::text || '/%' then
    raise exception 'INVALID_PATH';   -- la ruta debe estar dentro de la carpeta del producto
  end if;
  insert into public.product_media (product_id, variant_id, kind, storage_path, variants, width, height, dominant_color, alt, position)
  values (v_product, nullif(p ->> 'variant_id', '')::uuid, coalesce(p ->> 'kind', 'image')::public.media_kind,
          p ->> 'storage_path', coalesce(p -> 'variants', '{}'::jsonb), nullif(p ->> 'width', '')::integer,
          nullif(p ->> 'height', '')::integer, p ->> 'dominant_color', jsonb_build_object('es', coalesce(p ->> 'alt', '')),
          coalesce((select max(position) + 1 from public.product_media where product_id = v_product), 0))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.admin_reorder_media(p_product_id uuid, p_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_staff() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if (select count(*) from public.product_media where product_id = p_product_id) <> cardinality(p_ids)
     or exists (select 1 from unnest(p_ids) i where not exists (select 1 from public.product_media m where m.id = i and m.product_id = p_product_id)) then
    raise exception 'MEDIA_MISMATCH';
  end if;
  update public.product_media m set position = o.ord - 1
    from unnest(p_ids) with ordinality as o(id, ord)
   where m.id = o.id;
end $$;

-- Devuelve las rutas para que el servidor borre los archivos de Storage.
create or replace function public.admin_delete_media(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  delete from public.product_media where id = p_id returning product_id, storage_path, variants into r;
  if r is null then raise exception 'NOT_FOUND'; end if;
  update public.product_media m set position = s.rn - 1
    from (select id, row_number() over (order by position) rn from public.product_media where product_id = r.product_id) s
   where m.id = s.id;
  return jsonb_build_object('storage_path', r.storage_path, 'variants', r.variants);
end $$;

revoke all on function public.admin_upsert_category(jsonb) from public, anon;
revoke all on function public.admin_upsert_product(jsonb) from public, anon;
revoke all on function public.admin_register_media(jsonb) from public, anon;
revoke all on function public.admin_reorder_media(uuid, uuid[]) from public, anon;
revoke all on function public.admin_delete_media(uuid) from public, anon;
grant execute on function public.admin_upsert_category(jsonb) to authenticated, service_role;
grant execute on function public.admin_upsert_product(jsonb) to authenticated, service_role;
grant execute on function public.admin_register_media(jsonb) to authenticated, service_role;
grant execute on function public.admin_reorder_media(uuid, uuid[]) to authenticated, service_role;
grant execute on function public.admin_delete_media(uuid) to authenticated, service_role;
