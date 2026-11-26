-- =============================================================================
-- D'ORATA — El panel exige verificación en dos pasos TAMBIÉN en la base de datos
-- -----------------------------------------------------------------------------
-- has_role() (y por tanto is_staff/is_admin/is_owner, todas las políticas RLS de
-- administración y las funciones admin_*) solo es verdadero si la sesión tiene nivel
-- aal2 (contraseña + código TOTP). Con solo la contraseña (aal1) no se administra nada,
-- aunque alguien llame a la API directamente.
-- =============================================================================
create or replace function public.has_role(p_min public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
     and exists (
       select 1 from public.user_roles r
        where r.user_id = (select auth.uid()) and r.role >= p_min
     );
$$;

-- Rol del usuario actual (para el panel: decide qué menú mostrar). No exige aal2 para
-- poder mostrar "falta tu código" en vez de "sin acceso".
create or replace function public.my_admin_role()
returns public.app_role language sql stable security definer set search_path = '' as $$
  select r.role from public.user_roles r where r.user_id = (select auth.uid());
$$;
revoke all on function public.my_admin_role() from public, anon;
grant execute on function public.my_admin_role() to authenticated;
