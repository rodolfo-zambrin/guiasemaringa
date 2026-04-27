-- ============================================================
-- MIGRATION 005: Enriquecer tabelas horárias + habilitar Realtime
-- Aplicar via: Supabase Studio > SQL Editor
-- ============================================================

-- ── meta_account_hourly: adicionar métricas faltantes ──
ALTER TABLE meta_account_hourly
  ADD COLUMN IF NOT EXISTS account_name       TEXT,
  ADD COLUMN IF NOT EXISTS reach              BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchases          BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_value     NUMERIC(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS messaging_starts   BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_views        BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS add_to_cart        BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initiate_checkout  BIGINT        NOT NULL DEFAULT 0;

-- ── google_account_hourly: adicionar métricas faltantes ──
ALTER TABLE google_account_hourly
  ADD COLUMN IF NOT EXISTS account_name       TEXT,
  ADD COLUMN IF NOT EXISTS conversion_value   NUMERIC(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_cpc        NUMERIC(10,4) NOT NULL DEFAULT 0;

-- ── Índices adicionais para queries comparativas ──
CREATE INDEX IF NOT EXISTS idx_meta_account_hourly_date_hour
  ON meta_account_hourly (date, hour);

CREATE INDEX IF NOT EXISTS idx_google_account_hourly_date_hour
  ON google_account_hourly (date, hour);

-- ── Habilitar Supabase Realtime ──
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'meta_account_hourly'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE meta_account_hourly;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'google_account_hourly'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE google_account_hourly;
  END IF;
END $$;
