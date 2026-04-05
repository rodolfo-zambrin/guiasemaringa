# Phase 02 — Pipeline de Dados: DONE (parcial)

## Outcome
Sync diário D-1 funcionando via n8n → Windsor.ai → Supabase para Meta e Google.

## Delivered
- meta_daily_sync.json — cron 6h, sincroniza conta/campanha/adset/anúncio
- google_daily_sync.json — cron 6h, sincroniza conta/campanha/grupo/keyword
- google_daily_sync_windsor.json — versão Windsor do sync Google
- meta_backfill.json — histórico 90 dias Meta
- google_backfill_windsor.json — histórico 90 dias Google

## Pending (movido para Fase 04)
- meta_hourly_sync.json — sync horário Meta
- google_hourly_sync.json — sync horário Google

## Key Files
- n8n/meta_daily_sync.json
- n8n/google_daily_sync.json
- n8n/meta_backfill.json
- n8n/google_backfill_windsor.json

## Notes
- Windsor connector Meta = "facebook" (não "meta")
- n8n usa SUPABASE_SERVICE_ROLE_KEY para bypass do RLS
- Campo hourly Meta: `hourly_stats_aggregated_by_advertiser_time_zone` → parsear "HH:MM:SS - HH:MM:SS" → INT
