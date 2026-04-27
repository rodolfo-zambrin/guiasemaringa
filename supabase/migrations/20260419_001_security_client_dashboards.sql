-- =====================================================================
-- Segurança: dashboards de cliente (Unicive + UniBF)
-- 2026-04-19
--
-- Modelo:
--   • super_admin / analyst  → acesso total (interno Guia-se)
--   • client_view + client_id = unicive → acesso só a dados Unicive
--   • client_view + client_id = unibf   → acesso só a dados UniBF
--
-- IDs fixos (semeados em 003_seed.sql):
--   Unicive : 10000000-0000-0000-0000-000000000003
--   UniBF   : 10000000-0000-0000-0000-000000000001
-- =====================================================================

-- ─── Helper: verifica se o usuário é staff interno ──────────────────
CREATE OR REPLACE FUNCTION is_internal_staff()
RETURNS boolean AS $$
BEGIN
  RETURN get_user_role() IN ('super_admin', 'analyst');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─── Helper: verifica se user pertence a um client específico ────────
CREATE OR REPLACE FUNCTION is_client(p_slug text)
RETURNS boolean AS $$
BEGIN
  RETURN (
    get_user_role() = 'client_view'
    AND get_user_client_id() = (SELECT id FROM public.clients WHERE slug = p_slug LIMIT 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================================
-- 1. UNICIVE — unicive_leads
-- =====================================================================

ALTER TABLE public.unicive_leads ENABLE ROW LEVEL SECURITY;

-- SELECT: staff interno ou usuário Unicive
DROP POLICY IF EXISTS "unicive_leads_select" ON public.unicive_leads;
CREATE POLICY "unicive_leads_select" ON public.unicive_leads
  FOR SELECT TO authenticated
  USING (is_internal_staff() OR is_client('unicv'));

-- INSERT/UPDATE: somente service_role (via n8n / ingestão)
DROP POLICY IF EXISTS "unicive_leads_insert_service" ON public.unicive_leads;
CREATE POLICY "unicive_leads_insert_service" ON public.unicive_leads
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "unicive_leads_update_service" ON public.unicive_leads;
CREATE POLICY "unicive_leads_update_service" ON public.unicive_leads
  FOR UPDATE TO service_role USING (true);

-- DELETE: bloqueado para todos (dados de CRM são imutáveis)
-- (sem policy = deny por padrão com RLS ativo)

-- =====================================================================
-- 2. UNICIVE — unicive_vagas
-- =====================================================================

ALTER TABLE public.unicive_vagas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "unicive_vagas_select" ON public.unicive_vagas;
CREATE POLICY "unicive_vagas_select" ON public.unicive_vagas
  FOR SELECT TO authenticated
  USING (is_internal_staff() OR is_client('unicv'));

DROP POLICY IF EXISTS "unicive_vagas_insert_service" ON public.unicive_vagas;
CREATE POLICY "unicive_vagas_insert_service" ON public.unicive_vagas
  FOR INSERT TO service_role WITH CHECK (true);

-- =====================================================================
-- 3. UNIBF — unibf.leads_crm
-- =====================================================================

ALTER TABLE unibf.leads_crm ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "unibf_leads_crm_select" ON unibf.leads_crm;
CREATE POLICY "unibf_leads_crm_select" ON unibf.leads_crm
  FOR SELECT TO authenticated
  USING (is_internal_staff() OR is_client('unibf'));

-- INSERT/UPDATE: somente service_role (scripts de ingestão)
DROP POLICY IF EXISTS "unibf_leads_crm_insert_service" ON unibf.leads_crm;
CREATE POLICY "unibf_leads_crm_insert_service" ON unibf.leads_crm
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "unibf_leads_crm_update_service" ON unibf.leads_crm;
CREATE POLICY "unibf_leads_crm_update_service" ON unibf.leads_crm
  FOR UPDATE TO service_role USING (true);

-- =====================================================================
-- 4. UNIBF — unibf.matriculas
-- =====================================================================

ALTER TABLE unibf.matriculas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "unibf_matriculas_select" ON unibf.matriculas;
CREATE POLICY "unibf_matriculas_select" ON unibf.matriculas
  FOR SELECT TO authenticated
  USING (is_internal_staff() OR is_client('unibf'));

DROP POLICY IF EXISTS "unibf_matriculas_insert_service" ON unibf.matriculas;
CREATE POLICY "unibf_matriculas_insert_service" ON unibf.matriculas
  FOR INSERT TO service_role WITH CHECK (true);

-- =====================================================================
-- 5. UNIBF — views analíticas (recriar com SECURITY INVOKER)
--    Views herdam RLS das tabelas subjacentes se SECURITY INVOKER.
--    Garantir que views UniBF usem esse modo.
-- =====================================================================

ALTER VIEW unibf.v_resumo_mensal  SET (security_invoker = true);
ALTER VIEW unibf.v_match_rate     SET (security_invoker = true);
ALTER VIEW unibf.v_funil_campanha SET (security_invoker = true);

-- =====================================================================
-- 6. UNICIVE — views analíticas
-- =====================================================================

ALTER VIEW public.unicive_v_leads_por_consultor SET (security_invoker = true);
ALTER VIEW public.unicive_v_funil_campanha      SET (security_invoker = true);

-- =====================================================================
-- 7. GRAFO CAPITAL — isolar schema (não expor a clientes externos)
-- =====================================================================

ALTER TABLE grafo_capital.leads                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE grafo_capital.lead_distribuicao_grafo     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grafo_leads_internal_only" ON grafo_capital.leads;
CREATE POLICY "grafo_leads_internal_only" ON grafo_capital.leads
  FOR SELECT TO authenticated
  USING (is_internal_staff());

DROP POLICY IF EXISTS "grafo_distribuicao_internal_only" ON grafo_capital.lead_distribuicao_grafo;
CREATE POLICY "grafo_distribuicao_internal_only" ON grafo_capital.lead_distribuicao_grafo
  FOR SELECT TO authenticated
  USING (is_internal_staff());

DROP POLICY IF EXISTS "grafo_leads_insert_service" ON grafo_capital.leads;
CREATE POLICY "grafo_leads_insert_service" ON grafo_capital.leads
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "grafo_leads_update_service" ON grafo_capital.leads;
CREATE POLICY "grafo_leads_update_service" ON grafo_capital.leads
  FOR UPDATE TO service_role USING (true);

-- =====================================================================
-- 8. COMENTÁRIOS DE SEGURANÇA (documentação inline)
-- =====================================================================

COMMENT ON POLICY "unicive_leads_select"     ON public.unicive_leads IS
  'Staff Guia-se vê tudo; cliente Unicive vê só seus próprios leads.';

COMMENT ON POLICY "unibf_leads_crm_select"   ON unibf.leads_crm IS
  'Staff Guia-se vê tudo; cliente UniBF vê só seus próprios leads.';

COMMENT ON POLICY "grafo_leads_internal_only" ON grafo_capital.leads IS
  'Grafo Capital é cliente interno — nunca expor via dashboard de cliente.';
