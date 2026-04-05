-- ============================================================
-- MIGRATION 004: Tabelas horárias — meta_hourly, google_hourly
-- Aplicar via: Supabase Studio > SQL Editor
-- ============================================================

-- ── meta_hourly: dados hora-a-hora Meta (modo tempo real) ──
CREATE TABLE IF NOT EXISTS meta_hourly (
  id                   BIGSERIAL     PRIMARY KEY,
  tenant_id            UUID          NOT NULL,
  account_id           TEXT          NOT NULL,
  campaign_id          TEXT,                     -- NULL = dado agregado de conta
  campaign_name        TEXT,
  adset_id             TEXT,
  adset_name           TEXT,
  date                 DATE          NOT NULL,
  hour                 SMALLINT      NOT NULL CHECK (hour BETWEEN 0 AND 23),

  -- Volume
  spend                NUMERIC(14,4) NOT NULL DEFAULT 0,
  impressions          BIGINT        NOT NULL DEFAULT 0,
  clicks               BIGINT        NOT NULL DEFAULT 0,
  reach                BIGINT        NOT NULL DEFAULT 0,

  -- Conversões
  leads                BIGINT        NOT NULL DEFAULT 0,
  purchases            BIGINT        NOT NULL DEFAULT 0,
  purchase_value       NUMERIC(14,4) NOT NULL DEFAULT 0,
  complete_registrations BIGINT      NOT NULL DEFAULT 0,
  add_to_cart          BIGINT        NOT NULL DEFAULT 0,
  initiate_checkout    BIGINT        NOT NULL DEFAULT 0,

  -- Engajamento
  video_views          BIGINT        NOT NULL DEFAULT 0,
  outbound_clicks      BIGINT        NOT NULL DEFAULT 0,
  post_engagements     BIGINT        NOT NULL DEFAULT 0,

  -- Timestamps
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_meta_hourly UNIQUE (tenant_id, account_id, campaign_id, adset_id, date, hour)
);

CREATE INDEX IF NOT EXISTS idx_meta_hourly_tenant_date_hour
  ON meta_hourly (tenant_id, date, hour);

CREATE INDEX IF NOT EXISTS idx_meta_hourly_campaign
  ON meta_hourly (campaign_id, date, hour);

ALTER TABLE meta_hourly ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'meta_hourly' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON meta_hourly
      USING (tenant_id = auth.uid());
  END IF;
END $$;

-- ── google_hourly: dados hora-a-hora Google Ads (modo tempo real) ──
CREATE TABLE IF NOT EXISTS google_hourly (
  id                   BIGSERIAL     PRIMARY KEY,
  tenant_id            UUID          NOT NULL,
  account_id           TEXT          NOT NULL,
  campaign_id          TEXT,                     -- NULL = dado agregado de conta
  campaign_name        TEXT,
  adgroup_id           TEXT,
  adgroup_name         TEXT,
  date                 DATE          NOT NULL,
  hour                 SMALLINT      NOT NULL CHECK (hour BETWEEN 0 AND 23),

  -- Volume
  spend                NUMERIC(14,4) NOT NULL DEFAULT 0,
  impressions          BIGINT        NOT NULL DEFAULT 0,
  clicks               BIGINT        NOT NULL DEFAULT 0,

  -- Conversões
  conversions          NUMERIC(10,2) NOT NULL DEFAULT 0,
  conversion_value     NUMERIC(14,4) NOT NULL DEFAULT 0,
  all_conversions      NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Derivados
  cpc                  NUMERIC(10,4) NOT NULL DEFAULT 0,
  ctr                  NUMERIC(8,6)  NOT NULL DEFAULT 0,

  -- Timestamps
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_google_hourly UNIQUE (tenant_id, account_id, campaign_id, adgroup_id, date, hour)
);

CREATE INDEX IF NOT EXISTS idx_google_hourly_tenant_date_hour
  ON google_hourly (tenant_id, date, hour);

CREATE INDEX IF NOT EXISTS idx_google_hourly_campaign
  ON google_hourly (campaign_id, date, hour);

ALTER TABLE google_hourly ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'google_hourly' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON google_hourly
      USING (tenant_id = auth.uid());
  END IF;
END $$;
