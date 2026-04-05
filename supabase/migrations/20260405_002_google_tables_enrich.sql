-- ============================================================
-- MIGRATION 002: Enriquecer tabelas Google Ads + criar google_ad_daily
-- Aplicar via: Supabase Studio > SQL Editor
-- ============================================================

-- ── google_account_daily: métricas de share e conversão ──
ALTER TABLE google_account_daily
  ADD COLUMN IF NOT EXISTS conversions_from_interactions_rate  NUMERIC(8,6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_per_conversion                 NUMERIC(10,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS search_impression_share             NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS search_rank_lost_impression_share   NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS search_budget_lost_impression_share NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS view_through_conversions            BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS all_conversions                     NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS all_conversion_value               NUMERIC(14,4) NOT NULL DEFAULT 0;

-- ── google_campaign_daily: share, status, tipo, orçamento ──
ALTER TABLE google_campaign_daily
  ADD COLUMN IF NOT EXISTS conversions_from_interactions_rate  NUMERIC(8,6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_per_conversion                 NUMERIC(10,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS search_impression_share             NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS search_rank_lost_impression_share   NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS search_budget_lost_impression_share NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS campaign_status                     TEXT,
  ADD COLUMN IF NOT EXISTS advertising_channel_type            TEXT,
  ADD COLUMN IF NOT EXISTS budget_amount                       NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS all_conversions                     NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS all_conversion_value               NUMERIC(14,4) NOT NULL DEFAULT 0;

-- ── google_adgroup_daily: conversão, status, CPM ──
ALTER TABLE google_adgroup_daily
  ADD COLUMN IF NOT EXISTS conversions_from_interactions_rate  NUMERIC(8,6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_per_conversion                 NUMERIC(10,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cpm                                 NUMERIC(10,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adgroup_status                      TEXT,
  ADD COLUMN IF NOT EXISTS all_conversions                     NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS all_conversion_value               NUMERIC(14,4) NOT NULL DEFAULT 0;

-- ── google_keyword_daily: quality score e match type ──
ALTER TABLE google_keyword_daily
  ADD COLUMN IF NOT EXISTS quality_score                       SMALLINT,
  ADD COLUMN IF NOT EXISTS expected_ctr                        TEXT,
  ADD COLUMN IF NOT EXISTS ad_relevance                        TEXT,
  ADD COLUMN IF NOT EXISTS landing_page_experience             TEXT,
  ADD COLUMN IF NOT EXISTS keyword_status                      TEXT,
  ADD COLUMN IF NOT EXISTS match_type                          TEXT,
  ADD COLUMN IF NOT EXISTS cost_per_conversion                 NUMERIC(10,4) NOT NULL DEFAULT 0;

-- ── google_ad_daily: nível de anúncio (nível faltante no schema atual) ──
CREATE TABLE IF NOT EXISTS google_ad_daily (
  id                    BIGSERIAL      PRIMARY KEY,
  tenant_id             UUID           NOT NULL,
  account_id            TEXT           NOT NULL,
  campaign_id           TEXT           NOT NULL,
  campaign_name         TEXT,
  adgroup_id            TEXT           NOT NULL,
  adgroup_name          TEXT,
  ad_id                 TEXT           NOT NULL,
  ad_name               TEXT,
  ad_type               TEXT,
  ad_status             TEXT,
  date                  DATE           NOT NULL,
  spend                 NUMERIC(14,4)  NOT NULL DEFAULT 0,
  impressions           BIGINT         NOT NULL DEFAULT 0,
  clicks                BIGINT         NOT NULL DEFAULT 0,
  conversions           NUMERIC(10,2)  NOT NULL DEFAULT 0,
  conversion_value      NUMERIC(14,4)  NOT NULL DEFAULT 0,
  all_conversions       NUMERIC(10,2)  NOT NULL DEFAULT 0,
  all_conversion_value  NUMERIC(14,4)  NOT NULL DEFAULT 0,
  cost_per_conversion   NUMERIC(10,4)  NOT NULL DEFAULT 0,
  cpc                   NUMERIC(10,4)  NOT NULL DEFAULT 0,
  ctr                   NUMERIC(8,6)   NOT NULL DEFAULT 0,
  cpm                   NUMERIC(10,4)  NOT NULL DEFAULT 0,
  view_through_conversions BIGINT      NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_google_ad_daily UNIQUE (tenant_id, account_id, ad_id, date)
);

CREATE INDEX IF NOT EXISTS idx_google_ad_daily_tenant_date
  ON google_ad_daily (tenant_id, date);

CREATE INDEX IF NOT EXISTS idx_google_ad_daily_campaign_date
  ON google_ad_daily (campaign_id, date);

ALTER TABLE google_ad_daily ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'google_ad_daily' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON google_ad_daily
      USING (tenant_id = auth.uid());
  END IF;
END $$;
