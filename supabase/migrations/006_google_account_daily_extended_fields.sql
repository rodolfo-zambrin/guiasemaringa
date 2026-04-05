-- Migration 006: Expandir google_account_daily com métricas completas de performance
-- Executar no Supabase Dashboard → SQL Editor

ALTER TABLE google_account_daily
  ADD COLUMN IF NOT EXISTS all_conversions          NUMERIC(12,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS all_conversions_value    NUMERIC(12,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cross_device_conversions NUMERIC(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_per_conversion      NUMERIC(12,6),
  ADD COLUMN IF NOT EXISTS cost_per_all_conversions NUMERIC(12,6),
  ADD COLUMN IF NOT EXISTS roas                     NUMERIC(10,6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_rate          NUMERIC(8,6)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interactions             INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interaction_rate         NUMERIC(8,6)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS search_impression_share  NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS search_abs_top_is        NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS search_top_is            NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS search_lost_is_budget    NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS search_lost_is_rank      NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS abs_top_impression_pct   NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS top_impression_pct       NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS invalid_clicks           INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invalid_click_rate       NUMERIC(6,4)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_impressions        INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_calls              INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_through_rate       NUMERIC(6,4)  DEFAULT 0;

COMMENT ON COLUMN google_account_daily.all_conversions IS 'Todas as conversões (inclui view-through, micro-conversões, cross-device)';
COMMENT ON COLUMN google_account_daily.all_conversions_value IS 'Valor de todas as conversões';
COMMENT ON COLUMN google_account_daily.cross_device_conversions IS 'Conversões entre dispositivos diferentes';
COMMENT ON COLUMN google_account_daily.cost_per_conversion IS 'Custo por conversão principal (spend/conversions)';
COMMENT ON COLUMN google_account_daily.cost_per_all_conversions IS 'Custo por qualquer conversão (spend/all_conversions)';
COMMENT ON COLUMN google_account_daily.roas IS 'ROAS = all_conversions_value / spend';
COMMENT ON COLUMN google_account_daily.conversion_rate IS 'Taxa de conversão principal (conversions/clicks)';
COMMENT ON COLUMN google_account_daily.interactions IS 'Total de interações (clicks + outros formatos)';
COMMENT ON COLUMN google_account_daily.interaction_rate IS 'Taxa de interação (interactions/impressions)';
COMMENT ON COLUMN google_account_daily.search_impression_share IS 'IS de busca: % de impressões obtidas vs potencial (0-1)';
COMMENT ON COLUMN google_account_daily.search_abs_top_is IS 'IS na posição absoluta do topo (1ª posição)';
COMMENT ON COLUMN google_account_daily.search_top_is IS 'IS no topo da página (posições 1-3)';
COMMENT ON COLUMN google_account_daily.search_lost_is_budget IS 'IS perdido por falta de orçamento — indica underinvestment';
COMMENT ON COLUMN google_account_daily.search_lost_is_rank IS 'IS perdido por qualidade/lance — indica oportunidade de otimização';
COMMENT ON COLUMN google_account_daily.abs_top_impression_pct IS '% das impressões na posição absoluta do topo';
COMMENT ON COLUMN google_account_daily.top_impression_pct IS '% das impressões no topo da página';
COMMENT ON COLUMN google_account_daily.invalid_clicks IS 'Cliques inválidos filtrados pelo Google';
COMMENT ON COLUMN google_account_daily.invalid_click_rate IS 'Taxa de cliques inválidos';
COMMENT ON COLUMN google_account_daily.phone_impressions IS 'Impressões de extensão de chamada telefônica';
COMMENT ON COLUMN google_account_daily.phone_calls IS 'Chamadas geradas via extensão telefônica';
COMMENT ON COLUMN google_account_daily.phone_through_rate IS 'Taxa de chamada (phone_calls/phone_impressions)';
