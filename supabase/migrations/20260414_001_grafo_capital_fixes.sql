-- =============================================================================
-- 20260414_001_grafo_capital_fixes.sql
-- Correções do code review:
--   1. Revogar GRANT desnecessário para anon
--   2. Index em leads.created_at (queries CAPI por janela de data)
--   3. Função atômica grafo_incrementar_lead — elimina race condition do n8n
-- =============================================================================

-- ── 1. Remover GRANT USAGE desnecessário para anon ───────────────────────────
-- anon não possui nenhuma policy RLS no schema grafo_capital.
-- O grant foi incluído por erro na migration 20260409.
REVOKE USAGE ON SCHEMA grafo_capital FROM anon;

-- ── 2. Index em leads.created_at ─────────────────────────────────────────────
-- Necessário para queries CAPI que filtram por janela de tempo:
-- WHERE convertido = false AND created_at > now() - interval '7 days'
CREATE INDEX IF NOT EXISTS leads_created_at_idx
  ON grafo_capital.leads (created_at);

-- ── 3. Função atômica para incrementar contador do consultor ─────────────────
-- Substitui o PATCH manual no n8n (n-16) que era suscetível a race condition:
-- dois formulários simultâneos liam o mesmo total_leads e escreviam o mesmo +1.
--
-- Chamada pelo n8n via:
--   POST /rest/v1/rpc/grafo_incrementar_lead
--   Headers: Content-Profile: grafo_capital
--   Body:    { "p_consultor_key": "C1" }

CREATE OR REPLACE FUNCTION grafo_capital.grafo_incrementar_lead(p_consultor_key text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = grafo_capital, public
AS $$
  UPDATE grafo_capital.lead_distribuicao_grafo
  SET
    total_leads    = total_leads + 1,
    dt_ultimo_lead = now()
  WHERE consultor_key = p_consultor_key;
$$;

-- Apenas service_role (n8n) pode chamar esta função
GRANT EXECUTE ON FUNCTION grafo_capital.grafo_incrementar_lead(text) TO service_role;
REVOKE EXECUTE ON FUNCTION grafo_capital.grafo_incrementar_lead(text) FROM PUBLIC;

-- Recarregar PostgREST para expor a nova função via /rest/v1/rpc
NOTIFY pgrst, 'reload config';
