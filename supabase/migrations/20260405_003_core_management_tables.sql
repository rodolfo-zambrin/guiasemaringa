-- ============================================================
-- MIGRATION 003: Tabelas de gestão — clients, client_goals, sync_log
-- Aplicar via: Supabase Studio > SQL Editor
-- ============================================================

-- ── clients: tabela mestra de clientes ──
CREATE TABLE IF NOT EXISTS clients (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT         NOT NULL UNIQUE,
  name         TEXT         NOT NULL,
  status       TEXT         NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'paused', 'churned')),
  agency_id    UUID,
  notes        TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed: 14 clientes com UUIDs fixos (mesmos usados como tenant_id nas tabelas de dados)
INSERT INTO clients (id, slug, name, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ag-perform',           'AG Perform (Guia-se Maringá)',  'active'),
  ('00000000-0000-0000-0000-000000000002', 'guiase-maringa',       'Guia-se Maringá',              'active'),
  ('00000000-0000-0000-0000-000000000003', 'unibf',                'UniBF',                        'active'),
  ('00000000-0000-0000-0000-000000000004', 'eletroluz',            'Eletroluz',                    'active'),
  ('00000000-0000-0000-0000-000000000005', 'grafo-capital',        'Grafo Capital',                'active'),
  ('00000000-0000-0000-0000-000000000006', 'unicive-londrina',     'Unicive Londrina',             'active'),
  ('00000000-0000-0000-0000-000000000007', 'cazza-flor',           'Cazza Flor',                   'active'),
  ('00000000-0000-0000-0000-000000000008', 'integra-edu',          'Integra Edu',                  'active'),
  ('00000000-0000-0000-0000-000000000009', 'febracis-maringa',     'Febracis Maringá',             'active'),
  ('00000000-0000-0000-0000-000000000010', 'daccs',                'DACCS',                        'active'),
  ('00000000-0000-0000-0000-000000000011', 'docg',                 'DOCG',                         'active'),
  ('00000000-0000-0000-0000-000000000012', 'educasul',             'Educasul',                     'active'),
  ('00000000-0000-0000-0000-000000000013', 'foco-iluminacao',      'Foco Iluminação',              'active'),
  ('00000000-0000-0000-0000-000000000014', 'vida-animal',          'Vida Animal',                  'active')
ON CONFLICT (id) DO UPDATE
  SET slug = EXCLUDED.slug,
      name = EXCLUDED.name,
      updated_at = NOW();

-- ── client_goals: metas de CPL, ROAS, orçamento por cliente/período ──
CREATE TABLE IF NOT EXISTS client_goals (
  id            BIGSERIAL    PRIMARY KEY,
  tenant_id     UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform      TEXT         NOT NULL DEFAULT 'all'
                             CHECK (platform IN ('meta', 'google', 'all')),
  account_id    TEXT,                       -- NULL = meta de toda conta
  campaign_id   TEXT,                       -- NULL = meta de toda campanha
  metric        TEXT         NOT NULL,      -- 'cpl', 'roas', 'cpc', 'ctr', 'monthly_budget'
  target_value  NUMERIC(14,4) NOT NULL,
  period_start  DATE         NOT NULL,
  period_end    DATE,                       -- NULL = vigente até revogar
  notes         TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_client_goal UNIQUE (tenant_id, platform, account_id, campaign_id, metric, period_start)
);

CREATE INDEX IF NOT EXISTS idx_client_goals_tenant
  ON client_goals (tenant_id, period_start);

-- ── sync_log: registro de execuções de sync para auditoria e debug ──
CREATE TABLE IF NOT EXISTS sync_log (
  id              BIGSERIAL    PRIMARY KEY,
  tenant_id       UUID,                     -- NULL = sync multi-cliente
  workflow_id     TEXT,
  workflow_name   TEXT         NOT NULL,
  platform        TEXT         NOT NULL CHECK (platform IN ('meta', 'google', 'both')),
  granularity     TEXT,                     -- 'account', 'campaign', 'adset', 'ad', 'keyword', 'hourly'
  date_synced     DATE,                     -- data dos dados sincronizados
  rows_upserted   INTEGER      NOT NULL DEFAULT 0,
  status          TEXT         NOT NULL DEFAULT 'success'
                               CHECK (status IN ('success', 'error', 'partial')),
  error_message   TEXT,
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_tenant_created
  ON sync_log (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_log_status
  ON sync_log (status, created_at DESC);
