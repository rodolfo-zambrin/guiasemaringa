-- =====================================================================
-- UniBF — Adiciona colunas do formato completo de CSV (Tabela 2)
-- data_hora, localização, tracking IDs, escolaridade, curso, mobile
-- 2026-04-17
-- =====================================================================

ALTER TABLE unibf.leads_crm
    ADD COLUMN IF NOT EXISTS data_hora_atual              timestamptz,   -- última visita (BRT)
    ADD COLUMN IF NOT EXISTS data_hora_primeiro_acesso    timestamptz,   -- primeira visita (BRT)
    ADD COLUMN IF NOT EXISTS mobile                       boolean,
    ADD COLUMN IF NOT EXISTS escolaridade                 text,
    ADD COLUMN IF NOT EXISTS cidade                       text,
    ADD COLUMN IF NOT EXISTS estado                       text,
    ADD COLUMN IF NOT EXISTS curso                        text,
    ADD COLUMN IF NOT EXISTS gclid                        text,
    ADD COLUMN IF NOT EXISTS fbc                          text,
    ADD COLUMN IF NOT EXISTS fbp                          text;

-- Índices úteis para filtros futuros
CREATE INDEX IF NOT EXISTS idx_leads_crm_estado
    ON unibf.leads_crm(estado);

CREATE INDEX IF NOT EXISTS idx_leads_crm_data_hora_atual
    ON unibf.leads_crm(data_hora_atual);
