# Roadmap — AG Perform Platform

## Phases Overview

| # | Fase | Status | Goal |
|---|------|--------|------|
| 01 | Fundação | ✅ DONE | Auth + layout base + schema Supabase + seed |
| 02 | Pipeline de Dados | ✅ DONE | n8n sync diário Meta + Google (D-1 + backfill) |
| 03 | Dashboards D-1 | ✅ DONE | Portfólio + Meta + Google (campanhas → criativos) |
| 04 | Visão Horária | 🔄 IN PROGRESS | Tempo real hora a hora com comparativos e projeção |
| 05 | Alertas + Multi-tenant | ⬜ PLANNED | Engine de alertas + dashboard cliente + health score |
| 06 | Polish + Deploy | ⬜ PLANNED | Responsivo + Vercel + domínio + testes E2E |

---

## Phase Details

### Phase 01 — Fundação ✅
**Goal:** Plataforma rodando com auth, layout e banco de dados estruturado

Entregas:
- [x] Next.js 14 + TypeScript + Tailwind + shadcn/ui
- [x] Schema Supabase: agencies, clients, user_profiles, ad_accounts
- [x] Tabelas diárias: meta_account/campaign/adset/ad_daily, google_account/campaign/adgroup/ad/keyword_daily
- [x] Tabelas horárias: meta_hourly, google_hourly (meta_account_hourly / google_account_hourly no schema original)
- [x] RLS policies + funções helper (get_user_role, get_accessible_client_ids)
- [x] Índices de performance
- [x] Seed: agência + 12 clientes + ad accounts
- [x] Auth: login, forgot-password, middleware, useAuth
- [x] Layout: Sidebar, Header, dashboard layout

---

### Phase 02 — Pipeline de Dados ✅
**Goal:** n8n sincronizando dados diários automaticamente para todas as contas

Entregas:
- [x] meta_daily_sync.json — Meta Ads D-1 (cron 6h)
- [x] google_daily_sync.json — Google Ads D-1 (cron 6h)
- [x] meta_backfill.json — histórico 90 dias Meta
- [x] google_backfill_windsor.json — histórico 90 dias Google
- [ ] meta_hourly_sync.json — Meta hora a hora (cron todo hora) ← PENDENTE
- [ ] google_hourly_sync.json — Google hora a hora (cron todo hora) ← PENDENTE

---

### Phase 03 — Dashboards D-1 ✅
**Goal:** Dashboards analíticos completos para Meta Ads e Google Ads

Entregas:
- [x] /dashboard — Overview do portfólio (todos os clientes)
- [x] /meta — Overview Meta + campanhas + conjuntos + anúncios
- [x] /google — Overview Google + campanhas + grupos + keywords
- [x] Componentes: MetricCard, DeltaBadge, DataTable, AreaChart, BarChart, DonutChart, LineChart
- [x] Hooks: useMetaData, useGoogleData
- [x] Formatters + calculations (fmtBRL, calcROAS, calcCPL, calcHealthScore, etc.)
- [ ] /meta/criativos — view cards de criativos com hook rate/hold rate ← PENDENTE

---

### Phase 04 — Visão Horária 🔄 IN PROGRESS
**Goal:** Painel /tempo-real funcional com dados hora a hora, comparativos e projeção do dia

Entregas:
- [x] Tabelas horárias no Supabase (migration 004: meta_hourly + google_hourly)
- [x] /tempo-real page.tsx (estrutura criada)
- [ ] n8n: meta_hourly_sync.json workflow (Windsor campo hourly_stats_aggregated_by_advertiser_time_zone)
- [ ] n8n: google_hourly_sync.json workflow (Windsor campo hour_of_day)
- [ ] Supabase Realtime: habilitar para meta_hourly + google_hourly
- [ ] Hook useHourlyData (Meta + Google, comparativos D-1 e mesma semana)
- [ ] Componentes: HourlyChart, ComparativePanel, PaceTracker, LiveIndicator
- [ ] Lógica de projeção do dia baseada nas últimas 3 horas
- [ ] Auto-refresh via Supabase Realtime subscription

**Notas críticas:**
- Windsor campo horário Meta: `hourly_stats_aggregated_by_advertiser_time_zone` → string "HH:MM:SS - HH:MM:SS" → parsear `parseInt(str.split(':')[0])` para INT 0-23
- Comparativo: usar `lte('hour', horaAtual)` para não comparar horas futuras de ontem
- Google Ads horário: campo `hour_of_day` no Windsor

---

### Phase 05 — Alertas + Multi-tenant ⬜
**Goal:** Sistema de alertas funcional + visão do cliente com health score

Entregas:
- [ ] Engine de alertas no n8n (roda após sync diário, insere em tabela `alerts`)
- [ ] /alertas — painel completo com filtros (já tem estrutura)
- [ ] /clientes/[clientId] — dashboard consolidado do cliente
- [ ] Health Score gauge (cálculo já existe em calculations.ts)
- [ ] /admin/clientes/[id] — edição de cliente
- [ ] /configuracoes/usuarios — gestão de usuários
- [ ] /configuracoes/contas — gestão de ad accounts

**Regras de alerta a implementar:**
- CPM Meta > R$35 → warning | > R$50 → critical
- CTR Meta < 1% → warning | < 0.5% → critical
- Frequência > 3.5x → warning | > 5x → critical
- Zero leads em 7 dias → critical
- QS Google < 5 com spend > R$100 → warning
- Search IS < 30% → warning
- Hook Rate < 10% → warning
- ROAS < 2x (e-commerce) → critical
- Budget pace > 110% → warning

---

### Phase 06 — Polish + Deploy ⬜
**Goal:** Plataforma em produção em agperform.com.br

Entregas:
- [ ] Responsivo (mobile para acesso do cliente)
- [ ] Favicon + meta tags
- [ ] vercel.json configurado (região gru1)
- [ ] Deploy Vercel com variáveis de ambiente
- [ ] Domínio: agperform.com.br → CNAME Vercel
- [ ] Supabase: Site URL = https://agperform.com.br
- [ ] Logins de teste: 1 super_admin + 1 analyst + 1 client_view
- [ ] Build sem erros TypeScript
- [ ] README.md + .env.example documentados
