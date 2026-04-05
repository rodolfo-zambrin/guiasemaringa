-- =============================================================================
-- 005_missing_columns.sql
-- Add missing meta action columns + upsert UPDATE policies for service_role
-- Safe to run multiple times (IF NOT EXISTS throughout)
-- =============================================================================

-- =============================================================================
-- ADD MISSING COLUMNS TO META TABLES
-- add_to_cart / initiate_checkout are standard Meta funnel metrics
-- =============================================================================

ALTER TABLE meta_account_daily
  ADD COLUMN IF NOT EXISTS add_to_cart       NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initiate_checkout NUMERIC(10,2) DEFAULT 0;

ALTER TABLE meta_campaign_daily
  ADD COLUMN IF NOT EXISTS add_to_cart       NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initiate_checkout NUMERIC(10,2) DEFAULT 0;

ALTER TABLE meta_adset_daily
  ADD COLUMN IF NOT EXISTS add_to_cart       NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initiate_checkout NUMERIC(10,2) DEFAULT 0;

ALTER TABLE meta_ad_daily
  ADD COLUMN IF NOT EXISTS add_to_cart       NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initiate_checkout NUMERIC(10,2) DEFAULT 0;

-- =============================================================================
-- ADD UPDATE POLICIES FOR SERVICE_ROLE
-- Supabase upsert (Prefer: resolution=merge-duplicates) requires both
-- INSERT and UPDATE permissions when RLS is enabled.
-- service_role bypasses RLS by default but explicit policies are safer.
-- =============================================================================

DROP POLICY IF EXISTS "meta_account_daily_upsert_service" ON meta_account_daily;
CREATE POLICY "meta_account_daily_upsert_service" ON meta_account_daily
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "meta_campaign_daily_upsert_service" ON meta_campaign_daily;
CREATE POLICY "meta_campaign_daily_upsert_service" ON meta_campaign_daily
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "meta_adset_daily_upsert_service" ON meta_adset_daily;
CREATE POLICY "meta_adset_daily_upsert_service" ON meta_adset_daily
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "meta_ad_daily_upsert_service" ON meta_ad_daily;
CREATE POLICY "meta_ad_daily_upsert_service" ON meta_ad_daily
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "meta_account_hourly_upsert_service" ON meta_account_hourly;
CREATE POLICY "meta_account_hourly_upsert_service" ON meta_account_hourly
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "google_account_daily_upsert_service" ON google_account_daily;
CREATE POLICY "google_account_daily_upsert_service" ON google_account_daily
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "google_campaign_daily_upsert_service" ON google_campaign_daily;
CREATE POLICY "google_campaign_daily_upsert_service" ON google_campaign_daily
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "google_adgroup_daily_upsert_service" ON google_adgroup_daily;
CREATE POLICY "google_adgroup_daily_upsert_service" ON google_adgroup_daily
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "google_ad_daily_upsert_service" ON google_ad_daily;
CREATE POLICY "google_ad_daily_upsert_service" ON google_ad_daily
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "google_keyword_daily_upsert_service" ON google_keyword_daily;
CREATE POLICY "google_keyword_daily_upsert_service" ON google_keyword_daily
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "google_account_hourly_upsert_service" ON google_account_hourly;
CREATE POLICY "google_account_hourly_upsert_service" ON google_account_hourly
  FOR ALL TO service_role USING (true) WITH CHECK (true);
