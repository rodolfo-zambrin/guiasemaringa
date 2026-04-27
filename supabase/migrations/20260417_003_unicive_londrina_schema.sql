-- =====================================================================
-- Unicive Londrina — tabelas de leads/vagas (public schema) + rebranding
-- Criado: 2026-04-17
-- Nota: tabelas em public com prefixo unicive_ para exposição via API
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 0. Rebranding: UniCV → Unicive Londrina
--    slug mantido como 'unicv' para compatibilidade com rotas existentes
-- ─────────────────────────────────────────────────────────────────────
UPDATE clients
SET name = 'Unicive Londrina'
WHERE slug = 'unicv';

UPDATE ad_accounts
SET account_name = CASE account_name
    WHEN 'UniCV Polo'     THEN 'Unicive Londrina Polo'
    WHEN 'UniCV Polo 2'   THEN 'Unicive Londrina Polo 2'
    WHEN 'UniCV Londrina' THEN 'Unicive Londrina'
    ELSE account_name
END
WHERE account_name LIKE 'UniCV%';

-- ─────────────────────────────────────────────────────────────────────
-- 1. unicive_leads — formulários de captação
--    (home_lead, pos_presencial, estetica_lead, etc.)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.unicive_leads (
    id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id              text,
    id_lead              text,                           -- gclid ou fbclid
    nome                 text,
    email                text,
    telefone             text,
    telefone_normalizado text GENERATED ALWAYS AS (
                             regexp_replace(telefone, '[^0-9]', '', 'g')
                         ) STORED,
    cidade               text,
    curso                text,
    modalidade           text,
    nivel                text,
    ensino_medio         text,
    horario_contato      text,
    preferencia_contato  text,
    utm_source           text,
    utm_medium           text,
    utm_campaign         text,
    utm_content          text,
    utm_term             text,
    page_source          text,
    lgpd_aceito          boolean     DEFAULT false,
    consultor            text,
    pipeline             text        DEFAULT 'LEAD NOVO',
    criado_em            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ul_leads_email
    ON public.unicive_leads(lower(email))
    WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ul_leads_telefone
    ON public.unicive_leads(telefone_normalizado)
    WHERE telefone_normalizado IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ul_leads_consultor
    ON public.unicive_leads(consultor);

CREATE INDEX IF NOT EXISTS idx_ul_leads_criado_em
    ON public.unicive_leads(criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_ul_leads_form_id
    ON public.unicive_leads(form_id);

CREATE INDEX IF NOT EXISTS idx_ul_leads_utm_campaign
    ON public.unicive_leads(utm_campaign);

-- ─────────────────────────────────────────────────────────────────────
-- 2. unicive_vagas — formulário "Trabalhe Conosco" (work_with_us)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.unicive_vagas (
    id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    nome         text,
    email        text,
    telefone     text,
    cidade       text,
    cargo        text,
    linkedin     text,
    resumo       text,
    resume_url   text,
    utm_source   text,
    utm_medium   text,
    utm_campaign text,
    criado_em    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ul_vagas_criado_em
    ON public.unicive_vagas(criado_em DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 3. Views analíticas
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.unicive_v_leads_por_consultor AS
SELECT
    DATE(criado_em AT TIME ZONE 'America/Sao_Paulo') AS dia,
    consultor,
    form_id,
    COUNT(*)                                          AS total_leads
FROM public.unicive_leads
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 2;

CREATE OR REPLACE VIEW public.unicive_v_funil_campanha AS
SELECT
    DATE_TRUNC('month', criado_em AT TIME ZONE 'America/Sao_Paulo')::date AS mes,
    utm_campaign,
    utm_source,
    utm_medium,
    form_id,
    COUNT(*)                                                                AS total_leads,
    COUNT(*) FILTER (WHERE consultor IS NOT NULL)                           AS leads_atribuidos
FROM public.unicive_leads
GROUP BY 1, 2, 3, 4, 5
ORDER BY 1 DESC, total_leads DESC;
