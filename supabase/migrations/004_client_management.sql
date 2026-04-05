-- =============================================================================
-- 004_client_management.sql
-- Agency/client API tokens, monthly goals, conversion event mapping
-- Safe to run multiple times (IF NOT EXISTS throughout)
-- =============================================================================

-- =============================================================================
-- AGENCY-LEVEL API TOKENS (shared / MCC)
-- One Meta System User token + one Google MCC token covers all MCC clients
-- =============================================================================

CREATE TABLE IF NOT EXISTS agency_api_tokens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id     UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  platform      platform_type NOT NULL,
  token_name    TEXT NOT NULL,            -- e.g. 'Meta System User', 'Google MCC'
  access_token  TEXT NOT NULL,            -- long-lived / system token
  expires_at    TIMESTAMPTZ,              -- NULL = never expires (system user)
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, platform, token_name)
);

-- =============================================================================
-- CLIENT-LEVEL API TOKEN OVERRIDES (non-MCC clients)
-- Long-lived token generated from the client's own app portfolio
-- =============================================================================

CREATE TABLE IF NOT EXISTS client_api_tokens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform      platform_type NOT NULL,
  token_name    TEXT NOT NULL DEFAULT 'default',
  access_token  TEXT NOT NULL,
  expires_at    TIMESTAMPTZ,              -- track 60-day expiry for user tokens
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, platform, token_name)
);

-- =============================================================================
-- MONTHLY GOALS PER CLIENT
-- Set by the agency after planning session with the client
-- =============================================================================

CREATE TABLE IF NOT EXISTS client_goals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  year                SMALLINT NOT NULL,
  month               SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  platform            TEXT NOT NULL DEFAULT 'all', -- 'meta' | 'google' | 'all'

  -- Investment
  goal_spend          NUMERIC(12,2),

  -- Leads / top-of-funnel
  goal_leads          INTEGER,
  goal_cpl            NUMERIC(10,2),     -- cost per lead

  -- Conversions / bottom-of-funnel
  goal_conversions    INTEGER,
  goal_cpa            NUMERIC(10,2),     -- cost per acquisition

  -- Revenue / ROAS
  goal_revenue        NUMERIC(12,2),
  goal_roas           NUMERIC(8,4),

  -- Clicks / traffic
  goal_clicks         INTEGER,
  goal_ctr            NUMERIC(6,4),      -- target CTR %

  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(client_id, year, month, platform)
);

-- =============================================================================
-- CONVERSION EVENT MAPPING PER CLIENT
-- Defines which action_types from Meta/Google count as lead or conversion
-- Allows WhatsApp, phone calls, page views etc. to be properly classified
-- =============================================================================

CREATE TABLE IF NOT EXISTS client_conversion_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform      platform_type NOT NULL,
  action_type   TEXT NOT NULL,   -- e.g. 'click_to_call_whatsapp', 'offsite_conversion.fb_pixel_purchase'
  label         TEXT NOT NULL,   -- e.g. 'WhatsApp', 'Venda', 'Lead', 'Ligação'
  counts_as     TEXT NOT NULL CHECK (counts_as IN ('lead', 'conversion', 'revenue', 'ignore')),
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,  -- primary metric shown on dashboard
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(client_id, platform, action_type)
);

-- =============================================================================
-- EXTEND clients TABLE with extra fields
-- =============================================================================

-- industry, website, logo_url, updated_at already exist from 001_schema.sql
-- Only adding the new columns
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS primary_color  TEXT DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS notes          TEXT,
  ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(12,2);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agency_api_tokens_updated_at ON agency_api_tokens;
CREATE TRIGGER agency_api_tokens_updated_at
  BEFORE UPDATE ON agency_api_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS client_api_tokens_updated_at ON client_api_tokens;
CREATE TRIGGER client_api_tokens_updated_at
  BEFORE UPDATE ON client_api_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS client_goals_updated_at ON client_goals;
CREATE TRIGGER client_goals_updated_at
  BEFORE UPDATE ON client_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS clients_updated_at ON clients;
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE agency_api_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_api_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_goals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_conversion_events ENABLE ROW LEVEL SECURITY;

-- Agency tokens: super_admin of the agency only
DROP POLICY IF EXISTS "agency_tokens_super_admin" ON agency_api_tokens;
CREATE POLICY "agency_tokens_super_admin" ON agency_api_tokens
  FOR ALL TO authenticated
  USING (agency_id = get_user_agency_id() AND get_user_role() = 'super_admin')
  WITH CHECK (agency_id = get_user_agency_id() AND get_user_role() = 'super_admin');

-- Client tokens: super_admin only
DROP POLICY IF EXISTS "client_tokens_super_admin" ON client_api_tokens;
CREATE POLICY "client_tokens_super_admin" ON client_api_tokens
  FOR ALL TO authenticated
  USING (get_user_role() = 'super_admin' AND client_id IN (SELECT get_accessible_client_ids()))
  WITH CHECK (get_user_role() = 'super_admin' AND client_id IN (SELECT get_accessible_client_ids()));

-- Client goals: super_admin full access, analyst/client_view read-only for accessible clients
DROP POLICY IF EXISTS "client_goals_select" ON client_goals;
CREATE POLICY "client_goals_select" ON client_goals
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT get_accessible_client_ids()));

DROP POLICY IF EXISTS "client_goals_write_super_admin" ON client_goals;
CREATE POLICY "client_goals_write_super_admin" ON client_goals
  FOR ALL TO authenticated
  USING (get_user_role() = 'super_admin' AND client_id IN (SELECT get_accessible_client_ids()))
  WITH CHECK (get_user_role() = 'super_admin' AND client_id IN (SELECT get_accessible_client_ids()));

-- Conversion events: super_admin write, others read
DROP POLICY IF EXISTS "conversion_events_select" ON client_conversion_events;
CREATE POLICY "conversion_events_select" ON client_conversion_events
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT get_accessible_client_ids()));

DROP POLICY IF EXISTS "conversion_events_write_super_admin" ON client_conversion_events;
CREATE POLICY "conversion_events_write_super_admin" ON client_conversion_events
  FOR ALL TO authenticated
  USING (get_user_role() = 'super_admin' AND client_id IN (SELECT get_accessible_client_ids()))
  WITH CHECK (get_user_role() = 'super_admin' AND client_id IN (SELECT get_accessible_client_ids()));

-- Service role full access to all new tables (for N8N reads)
DROP POLICY IF EXISTS "agency_tokens_service" ON agency_api_tokens;
CREATE POLICY "agency_tokens_service" ON agency_api_tokens
  FOR SELECT TO service_role USING (true);

DROP POLICY IF EXISTS "client_tokens_service" ON client_api_tokens;
CREATE POLICY "client_tokens_service" ON client_api_tokens
  FOR SELECT TO service_role USING (true);

DROP POLICY IF EXISTS "conversion_events_service" ON client_conversion_events;
CREATE POLICY "conversion_events_service" ON client_conversion_events
  FOR ALL TO service_role USING (true);
