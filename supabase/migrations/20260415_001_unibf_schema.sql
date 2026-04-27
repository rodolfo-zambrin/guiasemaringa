-- =====================================================================
-- UniBF Schema — leads CRM, campanha performance, matrículas e match
-- Criado: 2026-04-15
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS unibf;

-- ─────────────────────────────────────────────────────────────────────
-- 1. leads_crm — leads exportados do Looker Studio / CRM
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unibf.leads_crm (
    id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    nome                 text,
    telefone             text,                       -- raw do CSV
    telefone_normalizado text,                       -- 55XXXXXXXXXXX (só dígitos)
    email                text,
    modalidade           text,
    url_pagina           text,
    utm_campaign         text,                       -- ID da campanha
    utm_source           text,
    utm_content          text,
    utm_term             text,
    utm_medium           text,
    record_count         integer     DEFAULT 1,      -- Record Count do Looker Studio
    -- chave de dedup: telefone_normalizado se houver, senão email
    lead_key             text GENERATED ALWAYS AS (
                             COALESCE(
                                 telefone_normalizado,
                                 lower(trim(email))
                             )
                         ) STORED,
    importado_em         timestamptz DEFAULT now(),
    atualizado_em        timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_crm_lead_key
    ON unibf.leads_crm(lead_key)
    WHERE lead_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_crm_utm_campaign
    ON unibf.leads_crm(utm_campaign);

CREATE INDEX IF NOT EXISTS idx_leads_crm_utm_source
    ON unibf.leads_crm(utm_source);

-- trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION unibf.touch_atualizado_em()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_crm_updated ON unibf.leads_crm;
CREATE TRIGGER trg_leads_crm_updated
    BEFORE UPDATE ON unibf.leads_crm
    FOR EACH ROW EXECUTE FUNCTION unibf.touch_atualizado_em();

-- ─────────────────────────────────────────────────────────────────────
-- 2. campanha_performance — dados de ads (Windsor.ai)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unibf.campanha_performance (
    id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    data                 date        NOT NULL,
    fonte                text        NOT NULL CHECK (fonte IN ('google','meta')),
    campanha_id          text        NOT NULL,
    campanha_name        text,
    impressoes           bigint      DEFAULT 0,
    cliques              bigint      DEFAULT 0,
    investimento         numeric(12,2) DEFAULT 0,
    conversoes           numeric(10,2) DEFAULT 0,
    resultados           numeric(10,2) DEFAULT 0,  -- Meta: results
    cpl                  numeric(10,2),             -- custo por lead
    ctr                  numeric(8,4),
    cpc                  numeric(10,2),
    importado_em         timestamptz DEFAULT now(),
    UNIQUE (data, fonte, campanha_id)
);

CREATE INDEX IF NOT EXISTS idx_camp_perf_data
    ON unibf.campanha_performance(data);

CREATE INDEX IF NOT EXISTS idx_camp_perf_campanha_id
    ON unibf.campanha_performance(campanha_id);

-- ─────────────────────────────────────────────────────────────────────
-- 3. matriculas — matrículas confirmadas pela UniBF
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unibf.matriculas (
    id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    nome                 text,
    telefone             text,
    telefone_normalizado text,
    email                text,
    curso                text,
    modalidade           text,
    data_matricula       date,
    matricula_key        text GENERATED ALWAYS AS (
                             COALESCE(
                                 telefone_normalizado,
                                 lower(trim(email))
                             )
                         ) STORED,
    importado_em         timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_matriculas_key
    ON unibf.matriculas(matricula_key)
    WHERE matricula_key IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────
-- 4. lead_matricula_match — resultado do match lead → matrícula
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unibf.lead_matricula_match (
    id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id        uuid REFERENCES unibf.leads_crm(id) ON DELETE CASCADE,
    matricula_id   uuid REFERENCES unibf.matriculas(id) ON DELETE CASCADE,
    match_tipo     text CHECK (match_tipo IN ('telefone','email')),
    matched_at     timestamptz DEFAULT now(),
    UNIQUE (lead_id, matricula_id)
);

CREATE INDEX IF NOT EXISTS idx_match_lead_id     ON unibf.lead_matricula_match(lead_id);
CREATE INDEX IF NOT EXISTS idx_match_matricula_id ON unibf.lead_matricula_match(matricula_id);

-- ─────────────────────────────────────────────────────────────────────
-- 5. Views analíticas
-- ─────────────────────────────────────────────────────────────────────

-- v_resumo_mensal: investimento + leads + matrículas por mês
CREATE OR REPLACE VIEW unibf.v_resumo_mensal AS
SELECT
    date_trunc('month', cp.data)::date  AS mes,
    cp.fonte,
    SUM(cp.investimento)                AS investimento,
    SUM(cp.conversoes)                  AS conversoes,
    ROUND(SUM(cp.investimento) / NULLIF(SUM(cp.conversoes), 0), 2) AS cpl,
    COUNT(DISTINCT lc.id)               AS leads_crm,
    COUNT(DISTINCT lmm.matricula_id)    AS matriculas
FROM unibf.campanha_performance cp
LEFT JOIN unibf.leads_crm lc
    ON lc.utm_campaign = cp.campanha_id
    AND date_trunc('month', cp.data) = date_trunc('month', lc.importado_em)
LEFT JOIN unibf.lead_matricula_match lmm ON lmm.lead_id = lc.id
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

-- v_match_rate: taxa de conversão lead → matrícula por campanha
CREATE OR REPLACE VIEW unibf.v_match_rate AS
SELECT
    lc.utm_campaign,
    lc.utm_source,
    COUNT(DISTINCT lc.id)            AS total_leads,
    COUNT(DISTINCT lmm.matricula_id) AS total_matriculas,
    ROUND(
        COUNT(DISTINCT lmm.matricula_id)::numeric /
        NULLIF(COUNT(DISTINCT lc.id), 0) * 100,
        2
    )                                AS match_rate_pct
FROM unibf.leads_crm lc
LEFT JOIN unibf.lead_matricula_match lmm ON lmm.lead_id = lc.id
GROUP BY 1, 2
ORDER BY total_leads DESC;

-- v_funil_campanha: funil completo (investimento → leads → matrículas) por campanha
CREATE OR REPLACE VIEW unibf.v_funil_campanha AS
SELECT
    cp.campanha_id,
    cp.campanha_name,
    cp.fonte,
    date_trunc('month', cp.data)::date AS mes,
    SUM(cp.investimento)               AS investimento,
    SUM(cp.conversoes)                 AS conv_ads,
    COUNT(DISTINCT lc.id)              AS leads_crm,
    COUNT(DISTINCT lmm.matricula_id)   AS matriculas,
    ROUND(SUM(cp.investimento) / NULLIF(COUNT(DISTINCT lc.id), 0), 2)             AS custo_por_lead_crm,
    ROUND(SUM(cp.investimento) / NULLIF(COUNT(DISTINCT lmm.matricula_id), 0), 2)  AS custo_por_matricula
FROM unibf.campanha_performance cp
LEFT JOIN unibf.leads_crm lc      ON lc.utm_campaign = cp.campanha_id
LEFT JOIN unibf.lead_matricula_match lmm ON lmm.lead_id = lc.id
GROUP BY 1, 2, 3, 4
ORDER BY mes DESC, investimento DESC;
