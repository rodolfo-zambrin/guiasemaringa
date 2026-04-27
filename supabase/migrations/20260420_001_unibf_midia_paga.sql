-- ================================================================
-- UniBF — Tabelas de Mídia Paga (Google Ads + Meta Ads)
-- Fonte: Windsor.ai API  |  Granularidade: dia × campanha
-- ================================================================

-- ────────────────────────────────────────
-- Google Ads — diário por campanha
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unibf.google_ads_daily (
  id              BIGSERIAL PRIMARY KEY,
  date            DATE        NOT NULL,
  campaign_id     TEXT        NOT NULL,
  campaign_name   TEXT        NOT NULL,
  impressions     INTEGER     NOT NULL DEFAULT 0,
  clicks          INTEGER     NOT NULL DEFAULT 0,
  cost            NUMERIC(14,2) NOT NULL DEFAULT 0,   -- BRL
  conversions     NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- CPL calculado automaticamente
  cpl             NUMERIC(12,2) GENERATED ALWAYS AS (
                    CASE WHEN conversions > 0 THEN cost / conversions ELSE NULL END
                  ) STORED,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_google_ads_daily UNIQUE (date, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_google_ads_daily_date         ON unibf.google_ads_daily (date DESC);
CREATE INDEX IF NOT EXISTS idx_google_ads_daily_campaign     ON unibf.google_ads_daily (campaign_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_daily_date_camp    ON unibf.google_ads_daily (date DESC, campaign_id);

COMMENT ON TABLE unibf.google_ads_daily IS
  'Performance diária por campanha Google Ads. Conta: 842-650-4432. Label de conversões: RfboCNymtaAbEKr4hcwD.';

-- ────────────────────────────────────────
-- Meta Ads — diário por campanha
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unibf.meta_ads_daily (
  id              BIGSERIAL PRIMARY KEY,
  date            DATE        NOT NULL,
  campaign_id     TEXT        NOT NULL,
  campaign_name   TEXT        NOT NULL,
  objective       TEXT,                               -- LEAD_GENERATION, MESSAGES, REACH, etc.
  impressions     INTEGER     NOT NULL DEFAULT 0,
  clicks          INTEGER     NOT NULL DEFAULT 0,
  spend           NUMERIC(14,2) NOT NULL DEFAULT 0,   -- BRL
  leads           INTEGER     NOT NULL DEFAULT 0,     -- resultados via API (forms)
  -- CPL calculado automaticamente (exclui campanhas sem leads trackáveis)
  cpl             NUMERIC(12,2) GENERATED ALWAYS AS (
                    CASE WHEN leads > 0 THEN spend / leads ELSE NULL END
                  ) STORED,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_meta_ads_daily UNIQUE (date, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_ads_daily_date        ON unibf.meta_ads_daily (date DESC);
CREATE INDEX IF NOT EXISTS idx_meta_ads_daily_campaign    ON unibf.meta_ads_daily (campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_daily_date_camp   ON unibf.meta_ads_daily (date DESC, campaign_id);

COMMENT ON TABLE unibf.meta_ads_daily IS
  'Performance diária por campanha Meta Ads. Conta: 1735113139989857 (Seminário Digital). Nota: WhatsApp (MESSAGES) retorna leads=0 via API — conversão real está no dashboard Windsor.ai.';

-- ────────────────────────────────────────
-- Views de agregação mensal (sem armazenar)
-- ────────────────────────────────────────
CREATE OR REPLACE VIEW unibf.google_ads_monthly AS
SELECT
  DATE_TRUNC('month', date)::DATE   AS month,
  TO_CHAR(date, 'YYYY-MM')          AS month_key,
  campaign_id,
  campaign_name,
  SUM(impressions)                  AS impressions,
  SUM(clicks)                       AS clicks,
  SUM(cost)                         AS cost,
  SUM(conversions)                  AS conversions,
  CASE WHEN SUM(conversions) > 0
    THEN SUM(cost) / SUM(conversions)
    ELSE NULL
  END                               AS cpl
FROM unibf.google_ads_daily
GROUP BY 1, 2, 3, 4;

CREATE OR REPLACE VIEW unibf.meta_ads_monthly AS
SELECT
  DATE_TRUNC('month', date)::DATE   AS month,
  TO_CHAR(date, 'YYYY-MM')          AS month_key,
  campaign_id,
  campaign_name,
  objective,
  SUM(impressions)                  AS impressions,
  SUM(clicks)                       AS clicks,
  SUM(spend)                        AS spend,
  SUM(leads)                        AS leads,
  CASE WHEN SUM(leads) > 0
    THEN SUM(spend) / SUM(leads)
    ELSE NULL
  END                               AS cpl
FROM unibf.meta_ads_daily
GROUP BY 1, 2, 3, 4, 5;

-- ────────────────────────────────────────
-- View de resumo mensal consolidado
-- (usada pelo dashboard — 1 linha por mês)
-- ────────────────────────────────────────
CREATE OR REPLACE VIEW unibf.midia_paga_monthly_summary AS
SELECT
  COALESCE(g.month_key, m.month_key)  AS month_key,
  COALESCE(g.month, m.month)          AS month,
  COALESCE(g.google_invest, 0)        AS google_invest,
  COALESCE(g.google_conv, 0)          AS google_conv,
  CASE WHEN COALESCE(g.google_conv,0) > 0
    THEN g.google_invest / g.google_conv ELSE NULL
  END                                 AS google_cpl,
  COALESCE(g.google_imp, 0)           AS google_imp,
  COALESCE(g.google_clicks, 0)        AS google_clicks,
  COALESCE(m.meta_spend, 0)           AS meta_invest,
  COALESCE(m.meta_leads, 0)           AS meta_leads,
  CASE WHEN COALESCE(m.meta_leads,0) > 0
    THEN m.meta_spend / m.meta_leads ELSE NULL
  END                                 AS meta_cpl,
  COALESCE(m.meta_imp, 0)             AS meta_imp,
  COALESCE(m.meta_clicks, 0)          AS meta_clicks,
  COALESCE(g.google_invest,0) + COALESCE(m.meta_spend,0) AS total_invest
FROM (
  SELECT
    TO_CHAR(date,'YYYY-MM')  AS month_key,
    DATE_TRUNC('month',date)::DATE AS month,
    SUM(cost)                AS google_invest,
    SUM(conversions)         AS google_conv,
    SUM(impressions)         AS google_imp,
    SUM(clicks)              AS google_clicks
  FROM unibf.google_ads_daily
  GROUP BY 1, 2
) g
FULL OUTER JOIN (
  SELECT
    TO_CHAR(date,'YYYY-MM')  AS month_key,
    DATE_TRUNC('month',date)::DATE AS month,
    SUM(spend)               AS meta_spend,
    SUM(leads)               AS meta_leads,
    SUM(impressions)         AS meta_imp,
    SUM(clicks)              AS meta_clicks
  FROM unibf.meta_ads_daily
  GROUP BY 1, 2
) m ON g.month_key = m.month_key
ORDER BY 1 DESC;

-- ────────────────────────────────────────
-- RLS — só acesso autenticado com client_id correto
-- ────────────────────────────────────────
ALTER TABLE unibf.google_ads_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE unibf.meta_ads_daily   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unibf_staff_google_ads"
  ON unibf.google_ads_daily FOR ALL
  USING (is_internal_staff() OR is_client('unibf'));

CREATE POLICY "unibf_staff_meta_ads"
  ON unibf.meta_ads_daily FOR ALL
  USING (is_internal_staff() OR is_client('unibf'));
