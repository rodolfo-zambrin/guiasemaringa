-- =====================================================================
-- UniBF — Fix: adiciona lead_key como coluna regular (não GENERATED)
-- Compatível com tabelas já existentes criadas via Supabase Studio
-- 2026-04-16
-- =====================================================================

-- 1. Garante que as tabelas existam (caso ainda não existam no projeto)
CREATE TABLE IF NOT EXISTS unibf.leads_crm (
    id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    nome                 text,
    telefone             text,
    telefone_normalizado text,
    email                text,
    modalidade           text,
    url_pagina           text,
    utm_campaign         text,
    utm_source           text,
    utm_content          text,
    utm_term             text,
    utm_medium           text,
    record_count         integer     DEFAULT 1,
    importado_em         timestamptz DEFAULT now(),
    atualizado_em        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unibf.matriculas (
    id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    nome                 text,
    telefone             text,
    telefone_normalizado text,
    email                text,
    curso                text,
    modalidade           text,
    data_matricula       date,
    importado_em         timestamptz DEFAULT now()
);

-- 2. Garante todas as colunas necessárias (tabela pode ter sido criada com schema diferente)
ALTER TABLE unibf.leads_crm
    ADD COLUMN IF NOT EXISTS telefone_normalizado text,
    ADD COLUMN IF NOT EXISTS email                text,
    ADD COLUMN IF NOT EXISTS modalidade           text,
    ADD COLUMN IF NOT EXISTS url_pagina           text,
    ADD COLUMN IF NOT EXISTS utm_campaign         text,
    ADD COLUMN IF NOT EXISTS utm_source           text,
    ADD COLUMN IF NOT EXISTS utm_content          text,
    ADD COLUMN IF NOT EXISTS utm_term             text,
    ADD COLUMN IF NOT EXISTS utm_medium           text,
    ADD COLUMN IF NOT EXISTS record_count         integer DEFAULT 1,
    ADD COLUMN IF NOT EXISTS atualizado_em        timestamptz DEFAULT now(),
    ADD COLUMN IF NOT EXISTS lead_key             text;

ALTER TABLE unibf.matriculas
    ADD COLUMN IF NOT EXISTS telefone_normalizado text,
    ADD COLUMN IF NOT EXISTS email                text,
    ADD COLUMN IF NOT EXISTS curso                text,
    ADD COLUMN IF NOT EXISTS modalidade           text,
    ADD COLUMN IF NOT EXISTS data_matricula       date,
    ADD COLUMN IF NOT EXISTS matricula_key        text;

-- 3. Popula lead_key em linhas existentes que já tenham telefone ou email
UPDATE unibf.leads_crm
SET lead_key = COALESCE(telefone_normalizado, lower(trim(email)))
WHERE lead_key IS NULL
  AND (telefone_normalizado IS NOT NULL OR email IS NOT NULL);

UPDATE unibf.matriculas
SET matricula_key = COALESCE(telefone_normalizado, lower(trim(email)))
WHERE matricula_key IS NULL
  AND (telefone_normalizado IS NOT NULL OR email IS NOT NULL);

-- 4. Índices únicos (sem WHERE — Python nunca envia lead_key = NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_crm_lead_key
    ON unibf.leads_crm(lead_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_matriculas_key
    ON unibf.matriculas(matricula_key);

-- 5. Índices de apoio
CREATE INDEX IF NOT EXISTS idx_leads_crm_utm_campaign
    ON unibf.leads_crm(utm_campaign);

CREATE INDEX IF NOT EXISTS idx_leads_crm_utm_source
    ON unibf.leads_crm(utm_source);

-- 6. campanha_performance e lead_matricula_match (cria se não existir)
CREATE TABLE IF NOT EXISTS unibf.campanha_performance (
    id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    data          date   NOT NULL,
    fonte         text   NOT NULL CHECK (fonte IN ('google','meta')),
    campanha_id   text   NOT NULL,
    campanha_name text,
    impressoes    bigint         DEFAULT 0,
    cliques       bigint         DEFAULT 0,
    investimento  numeric(12,2)  DEFAULT 0,
    conversoes    numeric(10,2)  DEFAULT 0,
    resultados    numeric(10,2)  DEFAULT 0,
    cpl           numeric(10,2),
    ctr           numeric(8,4),
    cpc           numeric(10,2),
    importado_em  timestamptz    DEFAULT now(),
    UNIQUE (data, fonte, campanha_id)
);

CREATE TABLE IF NOT EXISTS unibf.lead_matricula_match (
    id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id      uuid REFERENCES unibf.leads_crm(id) ON DELETE CASCADE,
    matricula_id uuid REFERENCES unibf.matriculas(id) ON DELETE CASCADE,
    match_tipo   text CHECK (match_tipo IN ('telefone','email')),
    matched_at   timestamptz DEFAULT now(),
    UNIQUE (lead_id, matricula_id)
);

-- 7. Views analíticas
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

CREATE OR REPLACE VIEW unibf.v_match_rate AS
SELECT
    lc.utm_campaign,
    lc.utm_source,
    COUNT(DISTINCT lc.id)            AS total_leads,
    COUNT(DISTINCT lmm.matricula_id) AS total_matriculas,
    ROUND(
        COUNT(DISTINCT lmm.matricula_id)::numeric /
        NULLIF(COUNT(DISTINCT lc.id), 0) * 100, 2
    ) AS match_rate_pct
FROM unibf.leads_crm lc
LEFT JOIN unibf.lead_matricula_match lmm ON lmm.lead_id = lc.id
GROUP BY 1, 2
ORDER BY total_leads DESC;

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
    ROUND(SUM(cp.investimento) / NULLIF(COUNT(DISTINCT lc.id), 0), 2)            AS custo_por_lead_crm,
    ROUND(SUM(cp.investimento) / NULLIF(COUNT(DISTINCT lmm.matricula_id), 0), 2) AS custo_por_matricula
FROM unibf.campanha_performance cp
LEFT JOIN unibf.leads_crm lc      ON lc.utm_campaign = cp.campanha_id
LEFT JOIN unibf.lead_matricula_match lmm ON lmm.lead_id = lc.id
GROUP BY 1, 2, 3, 4
ORDER BY mes DESC, investimento DESC;
