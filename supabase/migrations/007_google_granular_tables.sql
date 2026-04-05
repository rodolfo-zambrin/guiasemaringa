-- Migration 007: Tabelas granulares Google Ads (campaign, adgroup, keyword)
-- Executar no Supabase Dashboard → SQL Editor

-- ============================================================
-- GOOGLE CAMPAIGN DAILY
-- ============================================================
CREATE TABLE IF NOT EXISTS google_campaign_daily (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id            TEXT NOT NULL,
  campaign_id           TEXT NOT NULL,
  campaign_name         TEXT,
  campaign_status       TEXT,
  campaign_type         TEXT,
  date                  DATE NOT NULL,
  -- Volume
  spend                 NUMERIC(12,4)  DEFAULT 0,
  impressions           INTEGER        DEFAULT 0,
  clicks                INTEGER        DEFAULT 0,
  interactions          INTEGER        DEFAULT 0,
  -- Eficiência
  ctr                   NUMERIC(8,6)   DEFAULT 0,
  avg_cpc               NUMERIC(10,6)  DEFAULT 0,
  avg_cpm               NUMERIC(10,6)  DEFAULT 0,
  interaction_rate      NUMERIC(8,6)   DEFAULT 0,
  -- Conversões
  conversions           NUMERIC(12,4)  DEFAULT 0,
  conversion_value      NUMERIC(12,4)  DEFAULT 0,
  conversion_rate       NUMERIC(8,6)   DEFAULT 0,
  cost_per_conversion   NUMERIC(12,6),
  all_conversions       NUMERIC(12,4)  DEFAULT 0,
  all_conversions_value NUMERIC(12,4)  DEFAULT 0,
  cost_per_all_conversions NUMERIC(12,6),
  roas                  NUMERIC(10,6)  DEFAULT 0,
  -- Impression Share
  search_impression_share     NUMERIC(6,4),
  search_abs_top_is           NUMERIC(6,4),
  search_top_is               NUMERIC(6,4),
  search_lost_is_budget       NUMERIC(6,4),
  search_lost_is_rank         NUMERIC(6,4),
  abs_top_impression_pct      NUMERIC(6,4),
  top_impression_pct          NUMERIC(6,4),
  -- Qualidade
  invalid_clicks        INTEGER        DEFAULT 0,
  invalid_click_rate    NUMERIC(6,4)   DEFAULT 0,
  synced_at             TIMESTAMPTZ    DEFAULT NOW(),
  UNIQUE (account_id, campaign_id, date)
);

-- ============================================================
-- GOOGLE ADGROUP DAILY
-- ============================================================
CREATE TABLE IF NOT EXISTS google_adgroup_daily (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id            TEXT NOT NULL,
  campaign_id           TEXT NOT NULL,
  campaign_name         TEXT,
  campaign_type         TEXT,
  ad_group_id           TEXT NOT NULL,
  ad_group_name         TEXT,
  ad_group_status       TEXT,
  date                  DATE NOT NULL,
  -- Volume
  spend                 NUMERIC(12,4)  DEFAULT 0,
  impressions           INTEGER        DEFAULT 0,
  clicks                INTEGER        DEFAULT 0,
  interactions          INTEGER        DEFAULT 0,
  -- Eficiência
  ctr                   NUMERIC(8,6)   DEFAULT 0,
  avg_cpc               NUMERIC(10,6)  DEFAULT 0,
  avg_cpm               NUMERIC(10,6)  DEFAULT 0,
  -- Conversões
  conversions           NUMERIC(12,4)  DEFAULT 0,
  conversion_value      NUMERIC(12,4)  DEFAULT 0,
  conversion_rate       NUMERIC(8,6)   DEFAULT 0,
  cost_per_conversion   NUMERIC(12,6),
  all_conversions       NUMERIC(12,4)  DEFAULT 0,
  all_conversions_value NUMERIC(12,4)  DEFAULT 0,
  roas                  NUMERIC(10,6)  DEFAULT 0,
  -- IS (disponível em alguns ad groups)
  search_impression_share     NUMERIC(6,4),
  search_lost_is_budget       NUMERIC(6,4),
  search_lost_is_rank         NUMERIC(6,4),
  synced_at             TIMESTAMPTZ    DEFAULT NOW(),
  UNIQUE (account_id, ad_group_id, date)
);

-- ============================================================
-- GOOGLE KEYWORD DAILY
-- ============================================================
CREATE TABLE IF NOT EXISTS google_keyword_daily (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id            TEXT NOT NULL,
  campaign_id           TEXT NOT NULL,
  campaign_name         TEXT,
  campaign_type         TEXT,
  ad_group_id           TEXT NOT NULL,
  ad_group_name         TEXT,
  keyword_text          TEXT NOT NULL,
  match_type            TEXT,   -- EXACT, PHRASE, BROAD
  date                  DATE NOT NULL,
  -- Volume
  spend                 NUMERIC(12,4)  DEFAULT 0,
  impressions           INTEGER        DEFAULT 0,
  clicks                INTEGER        DEFAULT 0,
  -- Eficiência
  ctr                   NUMERIC(8,6)   DEFAULT 0,
  avg_cpc               NUMERIC(10,6)  DEFAULT 0,
  -- Conversões
  conversions           NUMERIC(12,4)  DEFAULT 0,
  conversion_value      NUMERIC(12,4)  DEFAULT 0,
  cost_per_conversion   NUMERIC(12,6),
  all_conversions       NUMERIC(12,4)  DEFAULT 0,
  all_conversions_value NUMERIC(12,4)  DEFAULT 0,
  -- Qualidade
  quality_score         INTEGER,       -- 1-10
  -- IS de palavra-chave
  search_impression_share     NUMERIC(6,4),
  search_rank_lost_impression_share NUMERIC(6,4),
  synced_at             TIMESTAMPTZ    DEFAULT NOW(),
  UNIQUE (account_id, ad_group_id, keyword_text, match_type, date)
);

-- ============================================================
-- RLS: service_role pode fazer tudo
-- ============================================================
ALTER TABLE google_campaign_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_adgroup_daily  ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_keyword_daily  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "google_campaign_daily_service" ON google_campaign_daily FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "google_adgroup_daily_service"  ON google_adgroup_daily  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "google_keyword_daily_service"  ON google_keyword_daily  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- INDEXES para performance do dashboard
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_gcd_account_date   ON google_campaign_daily (account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_gcd_campaign_date  ON google_campaign_daily (campaign_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_gad_account_date   ON google_adgroup_daily  (account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_gad_campaign_date  ON google_adgroup_daily  (campaign_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_gkd_account_date   ON google_keyword_daily  (account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_gkd_keyword        ON google_keyword_daily  (keyword_text, match_type);
