-- =============================================================================
-- 002_rls.sql - Row Level Security Policies
-- Safe to run multiple times (DROP POLICY IF EXISTS before each CREATE)
-- =============================================================================

-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyst_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_account_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_campaign_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_adset_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ad_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_account_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_account_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_campaign_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_adgroup_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ad_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_keyword_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_account_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS (plpgsql to avoid enum return type mismatch)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE v_role user_role;
BEGIN
  SELECT role INTO v_role FROM public.user_profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_client_id()
RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
  SELECT client_id INTO v_id FROM public.user_profiles WHERE id = auth.uid();
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
  SELECT agency_id INTO v_id FROM public.user_profiles WHERE id = auth.uid();
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_accessible_client_ids()
RETURNS SETOF UUID AS $$
DECLARE
  v_role user_role;
  v_client_id UUID;
  v_agency_id UUID;
BEGIN
  SELECT role, client_id, agency_id
  INTO v_role, v_client_id, v_agency_id
  FROM public.user_profiles
  WHERE id = auth.uid();

  IF v_role = 'super_admin' THEN
    RETURN QUERY SELECT id FROM public.clients WHERE agency_id = v_agency_id;
  ELSIF v_role = 'analyst' THEN
    RETURN QUERY SELECT client_id FROM public.analyst_clients WHERE analyst_id = auth.uid();
  ELSIF v_role = 'client_view' THEN
    IF v_client_id IS NOT NULL THEN RETURN NEXT v_client_id; END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_accessible_account_ids()
RETURNS SETOF TEXT AS $$
DECLARE v_id TEXT;
BEGIN
  FOR v_id IN
    SELECT aa.account_id FROM public.ad_accounts aa
    WHERE aa.client_id IN (SELECT get_accessible_client_ids()) AND aa.is_active = TRUE
  LOOP RETURN NEXT v_id; END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- AGENCIES
-- =============================================================================

DROP POLICY IF EXISTS "agencies_select_own" ON agencies;
CREATE POLICY "agencies_select_own" ON agencies
  FOR SELECT TO authenticated USING (id = get_user_agency_id());

-- =============================================================================
-- CLIENTS
-- =============================================================================

DROP POLICY IF EXISTS "clients_select_accessible" ON clients;
CREATE POLICY "clients_select_accessible" ON clients
  FOR SELECT TO authenticated USING (id IN (SELECT get_accessible_client_ids()));

DROP POLICY IF EXISTS "clients_insert_super_admin" ON clients;
CREATE POLICY "clients_insert_super_admin" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'super_admin' AND agency_id = get_user_agency_id());

DROP POLICY IF EXISTS "clients_update_super_admin" ON clients;
CREATE POLICY "clients_update_super_admin" ON clients
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'super_admin' AND agency_id = get_user_agency_id());

-- =============================================================================
-- USER PROFILES
-- =============================================================================

DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
CREATE POLICY "user_profiles_select_own" ON user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR get_user_role() IN ('super_admin', 'analyst'));

DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- =============================================================================
-- ANALYST_CLIENTS
-- =============================================================================

DROP POLICY IF EXISTS "analyst_clients_select" ON analyst_clients;
CREATE POLICY "analyst_clients_select" ON analyst_clients
  FOR SELECT TO authenticated
  USING (analyst_id = auth.uid() OR get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "analyst_clients_insert_super_admin" ON analyst_clients;
CREATE POLICY "analyst_clients_insert_super_admin" ON analyst_clients
  FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "analyst_clients_delete_super_admin" ON analyst_clients;
CREATE POLICY "analyst_clients_delete_super_admin" ON analyst_clients
  FOR DELETE TO authenticated USING (get_user_role() = 'super_admin');

-- =============================================================================
-- AD ACCOUNTS
-- =============================================================================

DROP POLICY IF EXISTS "ad_accounts_select_accessible" ON ad_accounts;
CREATE POLICY "ad_accounts_select_accessible" ON ad_accounts
  FOR SELECT TO authenticated USING (client_id IN (SELECT get_accessible_client_ids()));

DROP POLICY IF EXISTS "ad_accounts_insert_super_admin" ON ad_accounts;
CREATE POLICY "ad_accounts_insert_super_admin" ON ad_accounts
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'super_admin' AND client_id IN (SELECT get_accessible_client_ids()));

-- =============================================================================
-- META POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "meta_account_daily_select" ON meta_account_daily;
CREATE POLICY "meta_account_daily_select" ON meta_account_daily
  FOR SELECT TO authenticated USING (account_id IN (SELECT get_accessible_account_ids()));

DROP POLICY IF EXISTS "meta_campaign_daily_select" ON meta_campaign_daily;
CREATE POLICY "meta_campaign_daily_select" ON meta_campaign_daily
  FOR SELECT TO authenticated USING (account_id IN (SELECT get_accessible_account_ids()));

DROP POLICY IF EXISTS "meta_adset_daily_select" ON meta_adset_daily;
CREATE POLICY "meta_adset_daily_select" ON meta_adset_daily
  FOR SELECT TO authenticated USING (account_id IN (SELECT get_accessible_account_ids()));

DROP POLICY IF EXISTS "meta_ad_daily_select" ON meta_ad_daily;
CREATE POLICY "meta_ad_daily_select" ON meta_ad_daily
  FOR SELECT TO authenticated USING (account_id IN (SELECT get_accessible_account_ids()));

DROP POLICY IF EXISTS "meta_account_hourly_select" ON meta_account_hourly;
CREATE POLICY "meta_account_hourly_select" ON meta_account_hourly
  FOR SELECT TO authenticated USING (account_id IN (SELECT get_accessible_account_ids()));

DROP POLICY IF EXISTS "meta_account_daily_insert_service" ON meta_account_daily;
CREATE POLICY "meta_account_daily_insert_service" ON meta_account_daily
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "meta_campaign_daily_insert_service" ON meta_campaign_daily;
CREATE POLICY "meta_campaign_daily_insert_service" ON meta_campaign_daily
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "meta_adset_daily_insert_service" ON meta_adset_daily;
CREATE POLICY "meta_adset_daily_insert_service" ON meta_adset_daily
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "meta_ad_daily_insert_service" ON meta_ad_daily;
CREATE POLICY "meta_ad_daily_insert_service" ON meta_ad_daily
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "meta_account_hourly_insert_service" ON meta_account_hourly;
CREATE POLICY "meta_account_hourly_insert_service" ON meta_account_hourly
  FOR INSERT TO service_role WITH CHECK (true);

-- =============================================================================
-- GOOGLE POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "google_account_daily_select" ON google_account_daily;
CREATE POLICY "google_account_daily_select" ON google_account_daily
  FOR SELECT TO authenticated USING (account_id IN (SELECT get_accessible_account_ids()));

DROP POLICY IF EXISTS "google_campaign_daily_select" ON google_campaign_daily;
CREATE POLICY "google_campaign_daily_select" ON google_campaign_daily
  FOR SELECT TO authenticated USING (account_id IN (SELECT get_accessible_account_ids()));

DROP POLICY IF EXISTS "google_adgroup_daily_select" ON google_adgroup_daily;
CREATE POLICY "google_adgroup_daily_select" ON google_adgroup_daily
  FOR SELECT TO authenticated USING (account_id IN (SELECT get_accessible_account_ids()));

DROP POLICY IF EXISTS "google_ad_daily_select" ON google_ad_daily;
CREATE POLICY "google_ad_daily_select" ON google_ad_daily
  FOR SELECT TO authenticated USING (account_id IN (SELECT get_accessible_account_ids()));

DROP POLICY IF EXISTS "google_keyword_daily_select" ON google_keyword_daily;
CREATE POLICY "google_keyword_daily_select" ON google_keyword_daily
  FOR SELECT TO authenticated USING (account_id IN (SELECT get_accessible_account_ids()));

DROP POLICY IF EXISTS "google_account_hourly_select" ON google_account_hourly;
CREATE POLICY "google_account_hourly_select" ON google_account_hourly
  FOR SELECT TO authenticated USING (account_id IN (SELECT get_accessible_account_ids()));

DROP POLICY IF EXISTS "google_account_daily_insert_service" ON google_account_daily;
CREATE POLICY "google_account_daily_insert_service" ON google_account_daily
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "google_campaign_daily_insert_service" ON google_campaign_daily;
CREATE POLICY "google_campaign_daily_insert_service" ON google_campaign_daily
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "google_adgroup_daily_insert_service" ON google_adgroup_daily;
CREATE POLICY "google_adgroup_daily_insert_service" ON google_adgroup_daily
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "google_ad_daily_insert_service" ON google_ad_daily;
CREATE POLICY "google_ad_daily_insert_service" ON google_ad_daily
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "google_keyword_daily_insert_service" ON google_keyword_daily;
CREATE POLICY "google_keyword_daily_insert_service" ON google_keyword_daily
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "google_account_hourly_insert_service" ON google_account_hourly;
CREATE POLICY "google_account_hourly_insert_service" ON google_account_hourly
  FOR INSERT TO service_role WITH CHECK (true);

-- =============================================================================
-- ALERTS
-- =============================================================================

DROP POLICY IF EXISTS "alerts_select_accessible" ON alerts;
CREATE POLICY "alerts_select_accessible" ON alerts
  FOR SELECT TO authenticated
  USING (client_id IS NULL OR client_id IN (SELECT get_accessible_client_ids()));

DROP POLICY IF EXISTS "alerts_update_accessible" ON alerts;
CREATE POLICY "alerts_update_accessible" ON alerts
  FOR UPDATE TO authenticated
  USING (client_id IS NULL OR client_id IN (SELECT get_accessible_client_ids()));

DROP POLICY IF EXISTS "alerts_insert_service" ON alerts;
CREATE POLICY "alerts_insert_service" ON alerts
  FOR INSERT TO service_role WITH CHECK (true);

-- Allow authenticated to insert alerts too (for app-generated alerts)
DROP POLICY IF EXISTS "alerts_insert_authenticated" ON alerts;
CREATE POLICY "alerts_insert_authenticated" ON alerts
  FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- SYNC LOGS
-- =============================================================================

DROP POLICY IF EXISTS "sync_logs_select_super_admin" ON sync_logs;
CREATE POLICY "sync_logs_select_super_admin" ON sync_logs
  FOR SELECT TO authenticated
  USING (get_user_role() = 'super_admin' OR account_id IN (SELECT get_accessible_account_ids()));

DROP POLICY IF EXISTS "sync_logs_all_service" ON sync_logs;
CREATE POLICY "sync_logs_all_service" ON sync_logs
  FOR ALL TO service_role USING (true);
