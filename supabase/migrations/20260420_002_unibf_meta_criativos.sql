-- ================================================================
-- UniBF — Tabela de Criativos Meta Ads (nível de anúncio)
-- Fonte: Windsor.ai API  |  Granularidade: dia × ad_id
-- ================================================================

CREATE TABLE IF NOT EXISTS unibf.meta_ads_creatives_daily (
  id              BIGSERIAL PRIMARY KEY,
  date            DATE        NOT NULL,
  ad_id           TEXT        NOT NULL,
  ad_name         TEXT        NOT NULL,
  adset_id        TEXT,
  adset_name      TEXT,
  campaign_id     TEXT        NOT NULL,
  campaign_name   TEXT        NOT NULL,
  objective       TEXT,
  impressions     INTEGER     NOT NULL DEFAULT 0,
  clicks          INTEGER     NOT NULL DEFAULT 0,
  spend           NUMERIC(14,2) NOT NULL DEFAULT 0,
  leads           INTEGER     NOT NULL DEFAULT 0,
  ctr             NUMERIC(8,4),
  -- URLs do criativo (vindas da API Meta via Windsor)
  thumbnail_url   TEXT,       -- imagem/thumb do anúncio
  permalink_url   TEXT,       -- link do post no Instagram/Facebook
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_meta_creative_daily UNIQUE (date, ad_id)
);

-- CPL como coluna gerada
ALTER TABLE unibf.meta_ads_creatives_daily
  ADD COLUMN IF NOT EXISTS cpl NUMERIC(12,2)
  GENERATED ALWAYS AS (
    CASE WHEN leads > 0 THEN spend / leads ELSE NULL END
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_meta_creative_date      ON unibf.meta_ads_creatives_daily (date DESC);
CREATE INDEX IF NOT EXISTS idx_meta_creative_ad        ON unibf.meta_ads_creatives_daily (ad_id);
CREATE INDEX IF NOT EXISTS idx_meta_creative_campaign  ON unibf.meta_ads_creatives_daily (campaign_id);

COMMENT ON TABLE unibf.meta_ads_creatives_daily IS
  'Performance diária por anúncio (ad-level) Meta Ads. Inclui URLs de thumbnail e permalink Instagram para exibição na aba Criativos do dashboard. Conta: 1735113139989857.';

-- ────────────────────────────────────────
-- View: top criativos do mês (agregado)
-- ────────────────────────────────────────
CREATE OR REPLACE VIEW unibf.meta_ads_top_creatives AS
SELECT
  TO_CHAR(date, 'YYYY-MM')  AS month_key,
  ad_id,
  MAX(ad_name)              AS ad_name,
  MAX(campaign_name)        AS campaign_name,
  MAX(objective)            AS objective,
  MAX(thumbnail_url)        AS thumbnail_url,
  MAX(permalink_url)        AS permalink_url,
  SUM(impressions)          AS impressions,
  SUM(clicks)               AS clicks,
  SUM(spend)                AS spend,
  SUM(leads)                AS leads,
  CASE WHEN SUM(leads) > 0
    THEN SUM(spend) / SUM(leads) ELSE NULL
  END                       AS cpl,
  CASE WHEN SUM(impressions) > 0
    THEN SUM(clicks)::NUMERIC / SUM(impressions) * 100 ELSE NULL
  END                       AS ctr_pct
FROM unibf.meta_ads_creatives_daily
GROUP BY 1, 2
ORDER BY 1 DESC, SUM(spend) DESC;

-- ────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────
ALTER TABLE unibf.meta_ads_creatives_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unibf_staff_creatives"
  ON unibf.meta_ads_creatives_daily FOR ALL
  USING (is_internal_staff() OR is_client('unibf'));
