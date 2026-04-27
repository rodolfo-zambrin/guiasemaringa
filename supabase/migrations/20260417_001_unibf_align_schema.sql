-- =====================================================================
-- UniBF — Alinha schema com tabelas criadas no Studio
-- Adiciona colunas faltantes + recria views com nomes reais
-- 2026-04-17
-- =====================================================================

-- ─── 1. leads_crm — adiciona colunas faltantes ───────────────────────
ALTER TABLE unibf.leads_crm
    ADD COLUMN IF NOT EXISTS telefone_normalizado text,
    ADD COLUMN IF NOT EXISTS url_pagina           text,
    ADD COLUMN IF NOT EXISTS utm_content          text,
    ADD COLUMN IF NOT EXISTS utm_term             text,
    ADD COLUMN IF NOT EXISTS utm_medium           text,
    ADD COLUMN IF NOT EXISTS record_count         integer DEFAULT 1,
    ADD COLUMN IF NOT EXISTS atualizado_em        timestamptz DEFAULT now(),
    ADD COLUMN IF NOT EXISTS lead_key             text;

-- ─── 2. matriculas — adiciona colunas faltantes ──────────────────────
ALTER TABLE unibf.matriculas
    ADD COLUMN IF NOT EXISTS nome                 text,
    ADD COLUMN IF NOT EXISTS telefone_normalizado text,
    ADD COLUMN IF NOT EXISTS data_matricula       date,
    ADD COLUMN IF NOT EXISTS matricula_key        text;

-- ─── 3. Índices únicos de dedup ──────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_crm_lead_key
    ON unibf.leads_crm(lead_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_matriculas_key
    ON unibf.matriculas(matricula_key);

-- ─── 4. Recria views com nomes reais das colunas ─────────────────────
-- DROP necessário pois a lista de colunas das views mudou
DROP VIEW IF EXISTS unibf.v_funil_campanha;
DROP VIEW IF EXISTS unibf.v_match_rate;
DROP VIEW IF EXISTS unibf.v_resumo_mensal;

CREATE VIEW unibf.v_resumo_mensal AS
SELECT
    cp.mes_ref,
    cp.plataforma,
    SUM(cp.investimento)                                                  AS investimento_total,
    SUM(cp.impressoes)                                                    AS impressoes_total,
    SUM(cp.cliques)                                                       AS cliques_total,
    SUM(cp.conversoes)                                                    AS leads_total,
    ROUND(SUM(cp.investimento) / NULLIF(SUM(cp.conversoes), 0), 2)       AS cpl_medio
FROM unibf.campanha_performance cp
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

CREATE VIEW unibf.v_match_rate AS
SELECT
    m.mes_ref,
    COUNT(DISTINCT m.id)                                                        AS total_matriculas,
    COUNT(DISTINCT lmm.id)                                                      AS matched,
    ROUND(COUNT(DISTINCT lmm.id)::numeric
          / NULLIF(COUNT(DISTINCT m.id), 0) * 100, 2)                          AS match_pct,
    COUNT(DISTINCT CASE WHEN lmm.plataforma = 'google' THEN lmm.id END)        AS google_matches,
    COUNT(DISTINCT CASE WHEN lmm.plataforma = 'meta'   THEN lmm.id END)        AS meta_matches,
    SUM(m.valor_ticket) FILTER (WHERE lmm.id IS NOT NULL)                      AS valor_atribuido
FROM unibf.matriculas m
LEFT JOIN unibf.lead_matricula_match lmm ON lmm.matricula_id = m.id
GROUP BY 1
ORDER BY 1 DESC;

CREATE VIEW unibf.v_funil_campanha AS
SELECT
    cp.mes_ref,
    cp.plataforma,
    cp.campanha_id,
    cp.campanha_nome,
    SUM(cp.investimento)                                                              AS investimento,
    ROUND(SUM(cp.investimento) / NULLIF(SUM(cp.conversoes), 0), 2)                  AS cpl_windsor,
    COUNT(DISTINCT lc.id)                                                             AS leads_crm,
    ROUND(SUM(cp.investimento) / NULLIF(COUNT(DISTINCT lc.id), 0), 2)               AS cpl_real,
    COUNT(DISTINCT lmm.matricula_id)                                                  AS matriculas,
    SUM(ma.valor_ticket) FILTER (WHERE lmm.matricula_id IS NOT NULL)                AS receita_atribuida,
    ROUND(SUM(cp.investimento) / NULLIF(COUNT(DISTINCT lmm.matricula_id), 0), 2)    AS custo_por_matricula
FROM unibf.campanha_performance cp
LEFT JOIN unibf.leads_crm lc
    ON lc.utm_campaign = cp.campanha_id
    AND lc.mes_ref     = cp.mes_ref
LEFT JOIN unibf.lead_matricula_match lmm ON lmm.lead_id = lc.id
LEFT JOIN unibf.matriculas ma            ON ma.id = lmm.matricula_id
GROUP BY 1, 2, 3, 4
ORDER BY 1 DESC, investimento DESC;
