-- =============================================================================
-- 20260409_002_meta_account_hourly_cpm_ctr.sql
-- Adiciona colunas cpm e ctr à meta_account_hourly.
-- Necessário para o workflow n8n "Meta Ads — Sync Horário" salvar estes
-- valores pré-computados (evitar recalcular na query).
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS).
-- =============================================================================

ALTER TABLE meta_account_hourly
  ADD COLUMN IF NOT EXISTS cpm  NUMERIC(10,6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ctr  NUMERIC(8,6)  NOT NULL DEFAULT 0;
