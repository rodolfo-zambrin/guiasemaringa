# Como aplicar as migrations

**Supabase Studio:** https://supabase.com/dashboard/project/lsccpbfuatpwycrtksrb/sql/new

Abra o SQL Editor e cole cada arquivo **na ordem abaixo**. Todas as operações são idempotentes (`IF NOT EXISTS`, `ON CONFLICT DO UPDATE`).

## Ordem de aplicação

| # | Arquivo | O que faz |
|---|---------|-----------|
| 1 | `20260405_001_meta_tables_enrich.sql` | ADD COLUMN nas 4 tabelas Meta diárias (ranking criativo, vídeo, funil, frequency) |
| 2 | `20260405_002_google_tables_enrich.sql` | ADD COLUMN nas 4 tabelas Google + CREATE `google_ad_daily` (nível ad faltava) |
| 3 | `20260405_003_core_management_tables.sql` | CREATE `clients` + seed 14 clientes, CREATE `client_goals`, CREATE `sync_log` |
| 4 | `20260405_004_hourly_tables.sql` | CREATE `meta_hourly` + `google_hourly` (modo tempo real) |
| 5 | `20260405_005_enrich_hourly_tables.sql` | ADD COLUMN em `meta_account_hourly` + `google_account_hourly` + habilitar Realtime |

## Verificação rápida após aplicar

```sql
-- Confirmar tabelas novas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Confirmar colunas novas em meta_ad_daily
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'meta_ad_daily' AND column_name LIKE '%ranking%';

-- Confirmar seed de clientes
SELECT id, slug, name FROM clients ORDER BY id;
```
