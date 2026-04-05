-- ============================================================
-- MIGRATION 001: Enriquecer tabelas Meta Ads diárias
-- Aplicar via: Supabase Studio > SQL Editor
-- ============================================================

-- ── meta_ad_daily: ranking de criativo, vídeo, funil completo ──
ALTER TABLE meta_ad_daily
  ADD COLUMN IF NOT EXISTS quality_ranking             TEXT,
  ADD COLUMN IF NOT EXISTS engagement_rate_ranking     TEXT,
  ADD COLUMN IF NOT EXISTS conversion_rate_ranking     TEXT,
  ADD COLUMN IF NOT EXISTS landing_page_views          BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outbound_clicks             BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS post_engagements            BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS post_saves                  BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_views                 BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_30s_watched           BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_2s_continuous         BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_avg_time_watched      NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complete_registrations      BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS messaging_conversations     BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS add_to_cart                 BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initiate_checkout           BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS add_payment_info            BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS search_events               BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequency                   NUMERIC(8,4)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ad_name                     TEXT,
  ADD COLUMN IF NOT EXISTS ad_status                   TEXT,
  ADD COLUMN IF NOT EXISTS creative_id                 TEXT;

-- ── meta_adset_daily: funil, vídeo, orçamento e controle ──
ALTER TABLE meta_adset_daily
  ADD COLUMN IF NOT EXISTS landing_page_views          BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outbound_clicks             BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS post_engagements            BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS post_saves                  BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_views                 BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_30s_watched           BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_2s_continuous         BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_avg_time_watched      NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complete_registrations      BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS messaging_conversations     BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS add_to_cart                 BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initiate_checkout           BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequency                   NUMERIC(8,4)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adset_status                TEXT,
  ADD COLUMN IF NOT EXISTS optimization_goal           TEXT,
  ADD COLUMN IF NOT EXISTS bid_strategy                TEXT,
  ADD COLUMN IF NOT EXISTS daily_budget                NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS lifetime_budget             NUMERIC(14,4);

-- ── meta_campaign_daily: funil, vídeo, orçamento + normalizar view_content ──
ALTER TABLE meta_campaign_daily
  ADD COLUMN IF NOT EXISTS view_content                BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS landing_page_views          BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outbound_clicks             BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS post_engagements            BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_views                 BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_30s_watched           BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complete_registrations      BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS add_to_cart                 BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initiate_checkout           BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequency                   NUMERIC(8,4)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS campaign_status             TEXT,
  ADD COLUMN IF NOT EXISTS objective                   TEXT,
  ADD COLUMN IF NOT EXISTS daily_budget                NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS lifetime_budget             NUMERIC(14,4);

-- ── meta_account_daily: normalizar view_content + funil e vídeo agregado ──
ALTER TABLE meta_account_daily
  ADD COLUMN IF NOT EXISTS view_content                BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS landing_page_views          BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outbound_clicks             BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS post_engagements            BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_views                 BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_30s_watched           BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complete_registrations      BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS add_to_cart                 BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initiate_checkout           BIGINT        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequency                   NUMERIC(8,4)  NOT NULL DEFAULT 0;

-- NOTA: meta_account_daily mantém coluna "actions_view_content" existente.
-- "view_content" é a nova coluna padronizada — preencher via Windsor sync.
