-- =============================================================================
-- 20260409_001_lead_distribuicao_grafo.sql
-- Tabela de controle de distribuição round-robin de leads por consultor.
-- Utilizada pelo workflow n8n "Grafo - Formulários Site" (zQimbBFCSsesYFAC).
-- Escala: 4 leads consórcio → 1 lead assessores (totalLeads % 5 === 4).
-- =============================================================================

-- ── Tabela principal ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS grafo_capital.lead_distribuicao_grafo (
  consultor_key    text        PRIMARY KEY,       -- ex: 'C1', 'C2', 'A1'
  nome_consultor   text        NOT NULL,
  enum_id          integer,                       -- enum_id Kommo campo CN (3840436)
  time             text        NOT NULL CHECK (time IN ('consorcio', 'assessores')),
  pipeline_id      bigint      NOT NULL,
  status_id        bigint      NOT NULL,
  total_leads      integer     NOT NULL DEFAULT 0,
  dt_ultimo_lead   timestamptz                    -- null = nunca recebeu lead
);

COMMENT ON TABLE grafo_capital.lead_distribuicao_grafo IS
  'Controle de distribuição de leads por consultor. Atualizado pelo n8n a cada lead recebido.';

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE grafo_capital.lead_distribuicao_grafo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "distribuicao_all_service" ON grafo_capital.lead_distribuicao_grafo;
CREATE POLICY "distribuicao_all_service" ON grafo_capital.lead_distribuicao_grafo
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "distribuicao_select_super_admin" ON grafo_capital.lead_distribuicao_grafo;
CREATE POLICY "distribuicao_select_super_admin" ON grafo_capital.lead_distribuicao_grafo
  FOR SELECT TO authenticated
  USING (get_user_role() = 'super_admin');

-- ── Grants para PostgREST ─────────────────────────────────────────────────────
-- Necessário para que o n8n (service_role) acesse via REST com Content-Profile/Accept-Profile.

GRANT USAGE ON SCHEMA grafo_capital TO authenticator, anon, authenticated, service_role;
GRANT ALL   ON grafo_capital.lead_distribuicao_grafo TO service_role;
GRANT SELECT ON grafo_capital.lead_distribuicao_grafo TO authenticated;

-- ── Seed: Populando consultores ───────────────────────────────────────────────
-- ATENÇÃO: Ajuste os valores abaixo antes de aplicar!
-- - consultor_key: código interno (ex: C1, C2, A1) — usado no PATCH do n8n
-- - enum_id: ID do enum do campo "CN - Consultor" (field_id 3840436) no Kommo
-- - pipeline_id consórcio: 12569939 | assessores: 13255559
-- - status_id consórcio: 97079363 | assessores: 102215579
-- Consultor C3 está na lista de EXCLUÍDOS no workflow — não precisa ser inserido,
-- mas pode ser inserido com qualquer enum_id se quiser reativar depois.

-- INSERT INTO grafo_capital.lead_distribuicao_grafo
--   (consultor_key, nome_consultor, enum_id, time, pipeline_id, status_id)
-- VALUES
--   ('C1', 'Nome Consultor 1', NULL, 'consorcio', 12569939, 97079363),
--   ('C2', 'Nome Consultor 2', NULL, 'consorcio', 12569939, 97079363),
--   ('A1', 'Nome Assessor 1',  NULL, 'assessores', 13255559, 102215579)
-- ON CONFLICT (consultor_key) DO NOTHING;
