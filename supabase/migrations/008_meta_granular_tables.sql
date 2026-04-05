-- Migration 008: Expandir meta_account_daily + tabelas granulares Meta
-- Executar no Supabase Dashboard → SQL Editor

-- ============================================================
-- EXPANDIR meta_account_daily com campos Windsor adicionais
-- ============================================================
ALTER TABLE meta_account_daily
  ADD COLUMN IF NOT EXISTS unique_clicks            INTEGER        DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_link_clicks       INTEGER        DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_ctr               NUMERIC(8,6)   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_per_unique_click    NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS cpp                      NUMERIC(10,6)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actions_view_content     NUMERIC(10,4)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actions_search           NUMERIC(10,4)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actions_add_payment_info NUMERIC(10,4)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_p25               NUMERIC(10,4)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_p50               NUMERIC(10,4)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_p75               NUMERIC(10,4)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_p100              NUMERIC(10,4)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_thruplay          NUMERIC(10,4)  DEFAULT 0;

-- ============================================================
-- META CAMPAIGN DAILY
-- ============================================================
CREATE TABLE IF NOT EXISTS meta_campaign_daily (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id            TEXT NOT NULL,
  campaign_id           TEXT NOT NULL,
  campaign_name         TEXT,
  campaign_status       TEXT,
  objective             TEXT,
  date                  DATE NOT NULL,
  -- Volume
  spend                 NUMERIC(12,4)  DEFAULT 0,
  impressions           INTEGER        DEFAULT 0,
  reach                 INTEGER        DEFAULT 0,
  frequency             NUMERIC(8,4)   DEFAULT 0,
  clicks                INTEGER        DEFAULT 0,
  link_clicks           INTEGER        DEFAULT 0,
  unique_clicks         INTEGER        DEFAULT 0,
  unique_link_clicks    INTEGER        DEFAULT 0,
  -- Eficiência
  ctr                   NUMERIC(8,6)   DEFAULT 0,
  cpm                   NUMERIC(10,6)  DEFAULT 0,
  cpc                   NUMERIC(10,6)  DEFAULT 0,
  cpp                   NUMERIC(10,6)  DEFAULT 0,
  unique_ctr            NUMERIC(8,6)   DEFAULT 0,
  cost_per_unique_click NUMERIC(10,6),
  -- Conversões
  leads                 NUMERIC(10,4)  DEFAULT 0,
  conversions           NUMERIC(10,4)  DEFAULT 0,
  conversion_value      NUMERIC(12,4)  DEFAULT 0,
  add_to_cart           NUMERIC(10,4)  DEFAULT 0,
  initiate_checkout     NUMERIC(10,4)  DEFAULT 0,
  view_content          NUMERIC(10,4)  DEFAULT 0,
  -- Vídeo
  video_p25             NUMERIC(10,4)  DEFAULT 0,
  video_p50             NUMERIC(10,4)  DEFAULT 0,
  video_p75             NUMERIC(10,4)  DEFAULT 0,
  video_p100            NUMERIC(10,4)  DEFAULT 0,
  video_thruplay        NUMERIC(10,4)  DEFAULT 0,
  synced_at             TIMESTAMPTZ    DEFAULT NOW(),
  UNIQUE (account_id, campaign_id, date)
);

-- ============================================================
-- META ADSET DAILY
-- ============================================================
CREATE TABLE IF NOT EXISTS meta_adset_daily (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id            TEXT NOT NULL,
  campaign_id           TEXT NOT NULL,
  campaign_name         TEXT,
  adset_id              TEXT NOT NULL,
  adset_name            TEXT,
  adset_status          TEXT,
  date                  DATE NOT NULL,
  -- Volume
  spend                 NUMERIC(12,4)  DEFAULT 0,
  impressions           INTEGER        DEFAULT 0,
  reach                 INTEGER        DEFAULT 0,
  frequency             NUMERIC(8,4)   DEFAULT 0,
  clicks                INTEGER        DEFAULT 0,
  link_clicks           INTEGER        DEFAULT 0,
  -- Eficiência
  ctr                   NUMERIC(8,6)   DEFAULT 0,
  cpm                   NUMERIC(10,6)  DEFAULT 0,
  cpc                   NUMERIC(10,6)  DEFAULT 0,
  -- Conversões
  leads                 NUMERIC(10,4)  DEFAULT 0,
  conversions           NUMERIC(10,4)  DEFAULT 0,
  conversion_value      NUMERIC(12,4)  DEFAULT 0,
  add_to_cart           NUMERIC(10,4)  DEFAULT 0,
  initiate_checkout     NUMERIC(10,4)  DEFAULT 0,
  -- Vídeo
  video_p25             NUMERIC(10,4)  DEFAULT 0,
  video_p75             NUMERIC(10,4)  DEFAULT 0,
  video_thruplay        NUMERIC(10,4)  DEFAULT 0,
  synced_at             TIMESTAMPTZ    DEFAULT NOW(),
  UNIQUE (account_id, adset_id, date)
);

-- ============================================================
-- META AD DAILY
-- ============================================================
CREATE TABLE IF NOT EXISTS meta_ad_daily (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id            TEXT NOT NULL,
  campaign_id           TEXT NOT NULL,
  campaign_name         TEXT,
  adset_id              TEXT NOT NULL,
  adset_name            TEXT,
  ad_id                 TEXT NOT NULL,
  ad_name               TEXT,
  ad_status             TEXT,
  date                  DATE NOT NULL,
  -- Volume
  spend                 NUMERIC(12,4)  DEFAULT 0,
  impressions           INTEGER        DEFAULT 0,
  reach                 INTEGER        DEFAULT 0,
  frequency             NUMERIC(8,4)   DEFAULT 0,
  clicks                INTEGER        DEFAULT 0,
  link_clicks           INTEGER        DEFAULT 0,
  -- Eficiência
  ctr                   NUMERIC(8,6)   DEFAULT 0,
  cpm                   NUMERIC(10,6)  DEFAULT 0,
  cpc                   NUMERIC(10,6)  DEFAULT 0,
  -- Conversões
  leads                 NUMERIC(10,4)  DEFAULT 0,
  conversions           NUMERIC(10,4)  DEFAULT 0,
  conversion_value      NUMERIC(12,4)  DEFAULT 0,
  add_to_cart           NUMERIC(10,4)  DEFAULT 0,
  initiate_checkout     NUMERIC(10,4)  DEFAULT 0,
  -- Vídeo (métricas de criativo)
  video_p25             NUMERIC(10,4)  DEFAULT 0,
  video_p50             NUMERIC(10,4)  DEFAULT 0,
  video_p75             NUMERIC(10,4)  DEFAULT 0,
  video_p100            NUMERIC(10,4)  DEFAULT 0,
  video_thruplay        NUMERIC(10,4)  DEFAULT 0,
  synced_at             TIMESTAMPTZ    DEFAULT NOW(),
  UNIQUE (account_id, ad_id, date)
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE meta_campaign_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_adset_daily    ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ad_daily       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meta_campaign_daily_service" ON meta_campaign_daily FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "meta_adset_daily_service"    ON meta_adset_daily    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "meta_ad_daily_service"       ON meta_ad_daily       FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_mcd_account_date  ON meta_campaign_daily (account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_mcd_campaign_date ON meta_campaign_daily (campaign_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_mad_account_date  ON meta_adset_daily    (account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_mad_campaign_date ON meta_adset_daily    (campaign_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_madd_account_date ON meta_ad_daily       (account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_madd_ad_date      ON meta_ad_daily       (ad_id, date DESC);
