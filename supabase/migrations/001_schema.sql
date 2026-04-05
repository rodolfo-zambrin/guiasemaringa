-- =============================================================================
-- 001_schema.sql - Guia-se Platform Complete Database Schema
-- Safe to run multiple times (IF NOT EXISTS / DO $$ EXCEPTION)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS (safe re-run)
-- =============================================================================

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin', 'analyst', 'client_view');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE platform_type AS ENUM ('meta', 'google');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE alert_type AS ENUM ('cpl_high', 'ctr_low', 'roas_low', 'spend_spike', 'budget_depleted', 'no_conversions', 'hook_rate_low', 'hold_rate_low', 'impression_share_low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE sync_status AS ENUM ('pending', 'running', 'success', 'error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- AGENCIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- CLIENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  monthly_budget_brl NUMERIC(12,2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, slug)
);

-- =============================================================================
-- USER PROFILES
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'analyst',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ANALYST <-> CLIENT MANY-TO-MANY
-- =============================================================================

CREATE TABLE IF NOT EXISTS analyst_clients (
  analyst_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (analyst_id, client_id)
);

-- =============================================================================
-- AD ACCOUNTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS ad_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(platform, account_id)
);

-- =============================================================================
-- META ADS TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS meta_account_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  link_clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  video_views BIGINT DEFAULT 0,
  video_views_3s BIGINT DEFAULT 0,
  video_views_thruplay BIGINT DEFAULT 0,
  post_engagements BIGINT DEFAULT 0,
  page_likes BIGINT DEFAULT 0,
  leads NUMERIC(10,2) DEFAULT 0,
  frequency NUMERIC(8,4) DEFAULT 0,
  cpm NUMERIC(10,4) DEFAULT 0,
  cpc NUMERIC(10,4) DEFAULT 0,
  ctr NUMERIC(8,6) DEFAULT 0,
  cpp NUMERIC(10,4) DEFAULT 0,
  cost_per_conversion NUMERIC(10,4) DEFAULT 0,
  roas NUMERIC(10,4) DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, date)
);

CREATE TABLE IF NOT EXISTS meta_campaign_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT,
  objective TEXT,
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  link_clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  video_views BIGINT DEFAULT 0,
  video_views_3s BIGINT DEFAULT 0,
  leads NUMERIC(10,2) DEFAULT 0,
  frequency NUMERIC(8,4) DEFAULT 0,
  cpm NUMERIC(10,4) DEFAULT 0,
  cpc NUMERIC(10,4) DEFAULT 0,
  ctr NUMERIC(8,6) DEFAULT 0,
  cost_per_conversion NUMERIC(10,4) DEFAULT 0,
  roas NUMERIC(10,4) DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, campaign_id, date)
);

CREATE TABLE IF NOT EXISTS meta_adset_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  adset_id TEXT NOT NULL,
  adset_name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT,
  targeting_type TEXT,
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  link_clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  video_views BIGINT DEFAULT 0,
  leads NUMERIC(10,2) DEFAULT 0,
  frequency NUMERIC(8,4) DEFAULT 0,
  cpm NUMERIC(10,4) DEFAULT 0,
  cpc NUMERIC(10,4) DEFAULT 0,
  ctr NUMERIC(8,6) DEFAULT 0,
  cost_per_conversion NUMERIC(10,4) DEFAULT 0,
  roas NUMERIC(10,4) DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, adset_id, date)
);

CREATE TABLE IF NOT EXISTS meta_ad_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  adset_id TEXT NOT NULL,
  adset_name TEXT,
  ad_id TEXT NOT NULL,
  ad_name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT,
  creative_type TEXT,
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  link_clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  video_views BIGINT DEFAULT 0,
  video_views_3s BIGINT DEFAULT 0,
  video_views_thruplay BIGINT DEFAULT 0,
  hook_rate NUMERIC(8,6) DEFAULT 0,
  hold_rate NUMERIC(8,6) DEFAULT 0,
  leads NUMERIC(10,2) DEFAULT 0,
  frequency NUMERIC(8,4) DEFAULT 0,
  cpm NUMERIC(10,4) DEFAULT 0,
  cpc NUMERIC(10,4) DEFAULT 0,
  ctr NUMERIC(8,6) DEFAULT 0,
  cost_per_conversion NUMERIC(10,4) DEFAULT 0,
  roas NUMERIC(10,4) DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, ad_id, date)
);

CREATE TABLE IF NOT EXISTS meta_account_hourly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  date DATE NOT NULL,
  hour SMALLINT NOT NULL CHECK (hour >= 0 AND hour <= 23),
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,4) DEFAULT 0,
  conversions NUMERIC(10,4) DEFAULT 0,
  leads NUMERIC(10,4) DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, date, hour)
);

-- =============================================================================
-- GOOGLE ADS TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS google_account_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  view_through_conversions BIGINT DEFAULT 0,
  interactions BIGINT DEFAULT 0,
  all_conversions NUMERIC(10,2) DEFAULT 0,
  ctr NUMERIC(8,6) DEFAULT 0,
  avg_cpc NUMERIC(10,4) DEFAULT 0,
  avg_cpm NUMERIC(10,4) DEFAULT 0,
  cost_per_conversion NUMERIC(10,4) DEFAULT 0,
  roas NUMERIC(10,4) DEFAULT 0,
  impression_share NUMERIC(8,6) DEFAULT 0,
  search_impression_share NUMERIC(8,6) DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, date)
);

CREATE TABLE IF NOT EXISTS google_campaign_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT,
  campaign_type TEXT,
  bidding_strategy TEXT,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  ctr NUMERIC(8,6) DEFAULT 0,
  avg_cpc NUMERIC(10,4) DEFAULT 0,
  cost_per_conversion NUMERIC(10,4) DEFAULT 0,
  roas NUMERIC(10,4) DEFAULT 0,
  impression_share NUMERIC(8,6) DEFAULT 0,
  search_impression_share NUMERIC(8,6) DEFAULT 0,
  quality_score NUMERIC(4,2) DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, campaign_id, date)
);

CREATE TABLE IF NOT EXISTS google_adgroup_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  adgroup_id TEXT NOT NULL,
  adgroup_name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT,
  adgroup_type TEXT,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  ctr NUMERIC(8,6) DEFAULT 0,
  avg_cpc NUMERIC(10,4) DEFAULT 0,
  cost_per_conversion NUMERIC(10,4) DEFAULT 0,
  roas NUMERIC(10,4) DEFAULT 0,
  quality_score NUMERIC(4,2) DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, adgroup_id, date)
);

CREATE TABLE IF NOT EXISTS google_ad_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  adgroup_id TEXT NOT NULL,
  adgroup_name TEXT,
  ad_id TEXT NOT NULL,
  ad_name TEXT,
  ad_type TEXT,
  final_url TEXT,
  date DATE NOT NULL,
  status TEXT,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  ctr NUMERIC(8,6) DEFAULT 0,
  avg_cpc NUMERIC(10,4) DEFAULT 0,
  cost_per_conversion NUMERIC(10,4) DEFAULT 0,
  roas NUMERIC(10,4) DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, ad_id, date)
);

CREATE TABLE IF NOT EXISTS google_keyword_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  adgroup_id TEXT NOT NULL,
  adgroup_name TEXT,
  keyword_id TEXT NOT NULL,
  keyword_text TEXT NOT NULL,
  match_type TEXT,
  date DATE NOT NULL,
  status TEXT,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  ctr NUMERIC(8,6) DEFAULT 0,
  avg_cpc NUMERIC(10,4) DEFAULT 0,
  avg_position NUMERIC(6,2) DEFAULT 0,
  cost_per_conversion NUMERIC(10,4) DEFAULT 0,
  quality_score NUMERIC(4,2) DEFAULT 0,
  first_page_cpc NUMERIC(10,4) DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, keyword_id, date)
);

CREATE TABLE IF NOT EXISTS google_account_hourly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  date DATE NOT NULL,
  hour SMALLINT NOT NULL CHECK (hour >= 0 AND hour <= 23),
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,4) DEFAULT 0,
  conversions NUMERIC(10,4) DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, date, hour)
);

-- =============================================================================
-- ALERTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  account_id TEXT,
  account_name TEXT,
  platform platform_type,
  alert_type alert_type,
  severity alert_severity NOT NULL DEFAULT 'warning',
  title TEXT,
  message TEXT NOT NULL,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  campaign_id TEXT,
  campaign_name TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SYNC LOGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  platform platform_type NOT NULL,
  sync_date DATE NOT NULL,
  status sync_status NOT NULL DEFAULT 'pending',
  rows_inserted INTEGER DEFAULT 0,
  rows_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TRIGGERS: updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TRIGGER: auto-create user_profile on signup
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'analyst')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
