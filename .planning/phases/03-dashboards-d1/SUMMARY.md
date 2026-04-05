# Phase 03 — Dashboards D-1: DONE (parcial)

## Outcome
Dashboards analíticos funcionando para Meta Ads e Google Ads com tabelas, gráficos e filtros.

## Delivered
- /dashboard — Overview do portfólio com métricas agregadas e tabela de clientes
- /meta — overview + campanhas + conjuntos + anúncios
- /google — overview + campanhas + grupos + keywords
- /alertas — painel de alertas com filtros
- /admin/clientes — lista de clientes com busca
- Componentes Charts: AreaChart, BarChart, DonutChart, LineChart
- Componentes Shared: MetricCard, DeltaBadge, DataTable, EmptyState, PlatformBadge
- Hooks: useMetaData, useGoogleData, useAlerts, useAuth
- Store: dashboardStore (Zustand)
- Lib: formatters.ts (fmtBRL, fmtNum, fmtPct), calculations.ts (calcROAS, calcCPL, calcHealthScore, calcBudgetPace)

## Pending
- /meta/criativos — view cards com hook rate, hold rate, ranking de criativos

## Key Files
- src/app/(dashboard)/dashboard/page.tsx
- src/app/(dashboard)/meta/page.tsx + campanhas/ + conjuntos/ + anuncios/
- src/app/(dashboard)/google/page.tsx + campanhas/ + grupos/ + keywords/
- src/hooks/useMetaData.ts
- src/hooks/useGoogleData.ts
- src/lib/utils/calculations.ts
- src/lib/utils/formatters.ts
