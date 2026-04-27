-- =============================================================================
-- 20260408_001_grafo_capital_schema.sql
-- Schema isolado para dados de leads e conversões da Grafo Capital.
-- Acesso: service_role (n8n) escreve tudo; super_admin lê; demais: bloqueado.
-- Safe to run multiple times (DROP POLICY IF EXISTS antes de cada CREATE).
-- =============================================================================

-- ── Schema ────────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS grafo_capital;

-- ── grafo_capital.leads ───────────────────────────────────────────────────────
-- Salva cada lead no momento do formulário, antes de qualquer perda de dados.
-- Contém todos os campos de tracking necessários para CAPI (Meta/Google).

CREATE TABLE IF NOT EXISTS grafo_capital.leads (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz DEFAULT now(),

  -- IDs CRM Kommo
  lead_id        bigint,
  contact_id     bigint,

  -- Identificação do formulário
  form_name      text,
  pipeline_id    bigint,
  status_id      bigint,

  -- Dados pessoais (PII — protegidos por RLS)
  nome           text,
  whatsapp       text,
  email          text,

  -- Tracking — nunca perder estes dados
  fbclid         text,
  gclid          text,
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  utm_content    text,
  utm_term       text,
  pagina         text,
  timestamp_form timestamptz,

  -- Campos Consórcio
  simulacao_tipo          text,
  simulacao_credito       numeric,
  simulacao_prazo         text,
  simulacao_parcela_cheia numeric,
  finalidade              text,
  cidade_consorcio        text,
  estado                  text,

  -- Campos Gestão de Risco
  cidade        text,
  interesse     text,
  servico       text,
  dependentes   text,
  perfil        text,
  tipo          text,
  lgpd_consent  text,
  segmento      text,
  empresa       text,
  profissao     text,
  atende_como   text,

  -- Controle de conversão offline
  convertido    boolean     DEFAULT false,
  convertido_em timestamptz,
  valor_venda   numeric
);

-- ── grafo_capital.conversoes ──────────────────────────────────────────────────
-- Log imutável de cada envio para Meta CAPI e Google Ads Offline Conversions.

CREATE TABLE IF NOT EXISTS grafo_capital.conversoes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  lead_id     uuid        REFERENCES grafo_capital.leads(id),
  plataforma  text        NOT NULL, -- 'meta' | 'google'
  evento      text        NOT NULL, -- 'Lead' | 'Purchase'
  status      text        NOT NULL, -- 'sent' | 'error'
  payload     jsonb,                -- o que foi enviado
  response    jsonb                 -- o que a API retornou
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE grafo_capital.leads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE grafo_capital.conversoes ENABLE ROW LEVEL SECURITY;

-- service_role (n8n): acesso total — INSERT, UPDATE, SELECT, DELETE
DROP POLICY IF EXISTS "leads_all_service"      ON grafo_capital.leads;
CREATE POLICY "leads_all_service" ON grafo_capital.leads
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "conversoes_all_service" ON grafo_capital.conversoes;
CREATE POLICY "conversoes_all_service" ON grafo_capital.conversoes
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- super_admin (usuários da agência): somente leitura
DROP POLICY IF EXISTS "leads_select_super_admin"      ON grafo_capital.leads;
CREATE POLICY "leads_select_super_admin" ON grafo_capital.leads
  FOR SELECT TO authenticated
  USING (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "conversoes_select_super_admin" ON grafo_capital.conversoes;
CREATE POLICY "conversoes_select_super_admin" ON grafo_capital.conversoes
  FOR SELECT TO authenticated
  USING (get_user_role() = 'super_admin');

-- Nenhuma outra role (analyst, client_view, anon) acessa este schema.

-- ── Índices ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS leads_fbclid_idx       ON grafo_capital.leads (fbclid)      WHERE fbclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_gclid_idx        ON grafo_capital.leads (gclid)       WHERE gclid  IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_whatsapp_idx     ON grafo_capital.leads (whatsapp);
CREATE INDEX IF NOT EXISTS leads_lead_id_idx      ON grafo_capital.leads (lead_id);
CREATE INDEX IF NOT EXISTS leads_convertido_idx   ON grafo_capital.leads (convertido)  WHERE convertido = false;
CREATE INDEX IF NOT EXISTS conversoes_lead_id_idx ON grafo_capital.conversoes (lead_id);

-- ── Expor schema ao PostgREST (necessário para n8n via REST) ─────────────────
-- Requer service_role key nas chamadas ao schema grafo_capital.

ALTER ROLE authenticator SET pgrst.db_schemas TO 'public, grafo_capital';
NOTIFY pgrst, 'reload config';
