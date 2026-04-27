-- =============================================================================
-- 20260407_001_fix_rls_missing_tables.sql
-- Fix: Enable RLS on tables created in 20260405_003 that were missing coverage.
-- Primary culprit: sync_log (different from sync_logs — new table, no RLS set).
-- Also adds RLS + restrictive policies to client_goals and clients as safety net.
-- Safe to run multiple times.
-- =============================================================================

-- ── sync_log ──────────────────────────────────────────────────────────────────
-- New table created in 003, no RLS anywhere. Only service role should write;
-- super_admins can read; analysts can read rows for their accessible accounts.

ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sync_log_select_authenticated" ON sync_log;
CREATE POLICY "sync_log_select_authenticated" ON sync_log
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'super_admin'
    OR tenant_id IN (SELECT get_accessible_client_ids())
    OR tenant_id IS NULL  -- multi-tenant sync rows readable by admins only (handled above)
  );

DROP POLICY IF EXISTS "sync_log_all_service" ON sync_log;
CREATE POLICY "sync_log_all_service" ON sync_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── client_goals ─────────────────────────────────────────────────────────────
-- May already have RLS from 004_client_management.sql (different column schema).
-- This is a safety-net: enable RLS if not already, add policy if missing.

ALTER TABLE client_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_goals_select_accessible" ON client_goals;
CREATE POLICY "client_goals_select_accessible" ON client_goals
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT get_accessible_client_ids())
    OR client_id IN (SELECT get_accessible_client_ids())  -- 004 uses client_id column
  );

DROP POLICY IF EXISTS "client_goals_write_super_admin" ON client_goals;
CREATE POLICY "client_goals_write_super_admin" ON client_goals
  FOR ALL TO authenticated
  USING (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "client_goals_all_service" ON client_goals;
CREATE POLICY "client_goals_all_service" ON client_goals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── clients ───────────────────────────────────────────────────────────────────
-- Should already be covered by 002_rls.sql, but 003 may have created a second
-- instance with a different schema. ENABLE is idempotent.

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
