# Project State

## Project Reference

AG Perform — Plataforma SaaS multi-tenant de análise de mídia paga para Guia-se Maringá.  
14 clientes, 26 contas Meta + 12 contas Google, dark mode, Next.js + Supabase + n8n.

---

## Current Position

- **Phase:** 06 of 06 — Polish + Deploy
- **Status:** DONE
- **Progress:** [████████████] 100%

```
Phase 01 Fundação          ██████████ DONE
Phase 02 Pipeline Dados    ██████████ DONE
Phase 03 Dashboards D-1    ██████████ DONE
Phase 04 Visão Horária     ██████████ DONE
Phase 05 Alertas/Tenant    ██████████ DONE
Phase 06 Deploy            ██████████ DONE
```

---

## What's Built

### Infraestrutura
- Schema Supabase completo: 15+ tabelas, RLS, índices, seed 14 clientes
- Migrations 001–008 (base) + 20260405_001–005 (enriquecimento + realtime)
- Auth: login, forgot-password, middleware, roles

### Frontend
- Layout: Sidebar + Header + rotas protegidas + mobile drawer
- /dashboard — portfólio overview
- /meta — overview + campanhas + conjuntos + anúncios
- /google — overview + campanhas + grupos + keywords
- /alertas — painel de alertas
- /tempo-real — visão horária completa + Realtime subscription
- /clientes/[id] — health score + KPIs + evolução + alertas
- /admin/clientes — lista de clientes (4 abas)
- /configuracoes/usuarios — gestão de usuários + convite
- /configuracoes/contas — gestão de contas de anúncio

### Componentes
- Charts: AreaChart, BarChart, DonutChart, LineChart
- Shared: MetricCard, DeltaBadge, DataTable, EmptyState, PlatformBadge
- Realtime: LiveIndicator, HourlyChart, ComparativePanel, PaceTracker
- Client: HealthScoreGauge
- Layout: Sidebar, Header
- Hooks: useMetaData, useGoogleData, useAlerts, useAuth, useHourlyData
- Store: dashboardStore (Zustand)
- Lib: formatters, calculations, supabase client/server

### n8n Workflows
- meta_daily_sync.json ✅ (importado)
- google_daily_sync.json ✅ (importado)
- google_daily_sync_windsor.json ✅
- meta_backfill.json ✅
- google_backfill_windsor.json ✅
- meta_hourly_sync.json ✅ (pendente importar)
- google_hourly_sync.json ✅ (pendente importar)
- alerts_engine.json ✅ (pendente importar)

### Deploy
- vercel.json — região gru1, headers de segurança
- next.config.mjs — optimizePackageImports (lucide + recharts)
- src/app/api/health/route.ts — health check endpoint
- README.md — setup + deploy completo
- .env.example — atualizado com todos os envs necessários
- Mobile: dashboard layout com drawer + hamburger (md:hidden)
- Build: `npm run build` — zero erros, 27 rotas

---

## Pending by User (infra — não código)

1. Aplicar migration `20260405_005_enrich_hourly_tables.sql` no Supabase Studio
2. Importar workflows n8n: `meta_hourly_sync`, `google_hourly_sync`, `alerts_engine`
3. Deploy: `npx vercel --prod` e configurar DNS `agperform.com.br`
4. Variáveis de ambiente no Vercel (Supabase URL + anon key + service role)

---

## Session Continuity

Last session: 2026-04-05  
Stopped at: Projeto 100% completo. Build limpo. Aguardando ações de infra pelo usuário.  
Next action: Deploy + aplicar migrations pendentes
