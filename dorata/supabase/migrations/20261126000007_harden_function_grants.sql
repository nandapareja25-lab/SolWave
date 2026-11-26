-- =============================================================================
-- D'ORATA — Endurecimiento de permisos de funciones (asesor de seguridad de Supabase)
-- -----------------------------------------------------------------------------
-- Funciones de TRIGGER: nunca deben poder llamarse vía /rest/v1/rpc (los triggers siguen funcionando).
-- Se mantienen ejecutables, a propósito:
--   * Públicas (anon): current_announcement, effective_store_mode, policy_version_at,
--     public_shipping_summary, public_tracking_config, variant_availability → solo datos públicos.
--   * has_role/is_staff/is_admin/is_owner/current_customer_id → las políticas RLS las invocan con el
--     rol de quien consulta; solo revelan el rol/ficha del propio usuario.
--   * adjust_inventory / anonymize_customer → validan el rol adentro (FORBIDDEN si no corresponde).
-- =============================================================================
revoke execute on function public.audit_row() from public, anon, authenticated;
revoke execute on function public.create_inventory_level() from public, anon, authenticated;
