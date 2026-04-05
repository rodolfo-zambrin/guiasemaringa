# AG Perform — Plataforma de Performance de Mídia Paga

## What This Is

Plataforma SaaS multi-tenant para análise de mídia paga da Guia-se Maringá. O time da agência vê todos os clientes; cada cliente vê apenas seus próprios dados. Dados D-1 (diários) + visão horária em tempo real.

**URL de produção:** agperform.com.br  
**Repositório:** C:/Users/Rodolfo/guiase-platform  
**Supabase project:** lsccpbfuatpwycrtksrb  

---

## Core Value

Dashboard multi-tenant profissional que centraliza Meta Ads + Google Ads de 14 clientes em tempo real, com análise de criativos, alertas automáticos e acesso diferenciado por role.

---

## Stack (NÃO NEGOCIÁVEL)

```
Frontend:    Next.js 14 (App Router) + TypeScript
Styling:     Tailwind CSS + shadcn/ui
Gráficos:    Recharts
Tabelas:     TanStack Table v8
Estado:      Zustand + React Query (TanStack Query)
Auth:        Supabase Auth
Database:    Supabase PostgreSQL (com RLS)
Realtime:    Supabase Realtime (tabelas horárias)
Deploy:      Vercel (gru1 – São Paulo)
Pipeline:    n8n → Windsor.ai → Supabase
Ícones:      Lucide React
Datas:       date-fns
```

---

## Requirements

### Active (em desenvolvimento)
- [ ] Visão horária: gráfico hora a hora, comparativo D-1 e semana passada, projeção do dia
- [ ] Supabase Realtime para auto-refresh da tela /tempo-real
- [ ] n8n workflows horários: meta_hourly_sync + google_hourly_sync
- [ ] Engine de alertas (roda no n8n após sync diário)
- [ ] Dashboard do cliente (/clientes/[clientId]) com Health Score
- [ ] Configurações: usuários + contas ad accounts

### Validated (já implementado)
- [x] Auth: login, middleware, user profiles, roles (super_admin, analyst, client_view)
- [x] Layout: Sidebar, Header, rotas protegidas
- [x] Schema Supabase: 15+ tabelas com RLS + índices + migrations de enriquecimento
- [x] Seed: 14 clientes, agência, ad accounts Meta (26 contas) + Google (12 contas)
- [x] Pipeline diário: meta_daily_sync.json + google_daily_sync.json (n8n)
- [x] Backfill: meta_backfill.json + google_backfill_windsor.json
- [x] Dashboard portfólio (/dashboard)
- [x] Meta: campanhas, conjuntos, anúncios, overview
- [x] Google: campanhas, grupos de anúncios, keywords, overview
- [x] Hooks: useMetaData, useGoogleData, useAlerts, useAuth
- [x] Componentes: MetricCard, DeltaBadge, DataTable, AreaChart, BarChart, DonutChart, LineChart
- [x] Formatters + calculations (fmtBRL, calcROAS, calcHealthScore, etc.)
- [x] Alertas: /alertas page + useAlerts.ts
- [x] Admin: /admin/clientes page
- [x] Tabelas horárias: meta_hourly + google_hourly (migration 004)

### Out of Scope
- TikTok Ads (plataforma = 'tiktok' reservado no schema, mas sem implementação)
- Import manual de conversões offline (fase futura)
- Relatório PDF executivo (gerado separadamente com Python/WeasyPrint)

---

## Key Decisions

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-03 | Windsor.ai connector Meta = "facebook" (não "meta") | Formato exigido pela API |
| 2026-03 | n8n usa service_role_key para bypass RLS | Escritas do pipeline não passam por auth |
| 2026-03 | Dados horários via tenant_id (não client_id) em meta_hourly/google_hourly | Migration 004 usa tenant_id = auth.uid() para RLS |
| 2026-04 | Migrations incrementais com IF NOT EXISTS | Idempotentes, aplicáveis pelo Studio sem CLI |
| 2026-04 | Hook Rate e Hold Rate calculados na escrita (n8n), não no frontend | Evita recalcular em cada query |

---

## Constraints

- RLS ativo em todas as tabelas de dados — n8n SEMPRE usa service_role_key
- Dados sensíveis de clientes (IDs de conta, tokens) nunca hardcoded no frontend
- Dark mode obrigatório (tema profissional para time)
- Região Vercel: gru1 (São Paulo) para menor latência
- Windsor.ai: campo horário Meta = `hourly_stats_aggregated_by_advertiser_time_zone` → parsear `HH:MM:SS - HH:MM:SS` → INT da hora

---

## Clientes Cadastrados

| UUID (sufixo) | Slug | Nome | Plataformas |
|---------------|------|------|-------------|
| ...000001 | unibf | UniBF | Meta (3) + Google |
| ...000002 | eletroluz | Eletroluz | Meta (3) + Google (2) |
| ...000003 | unicv-londrina | UniCV Londrina | Meta (3) |
| ...000004 | febracis-maringa | Febracis Maringá | Meta (2) + Google |
| ...000005 | vida-animal | Vida Animal | Meta + Google |
| ...000006 | daccs | Daccs Eyewear | Meta + Google |
| ...000007 | docg | Docg Pet Shop | Meta + Google |
| ...000008 | vmark | VMARK | Meta |
| ...000009 | foco | Foco Proteção | Meta (2) + Google |
| ...000010 | guiase | Guia-se Maringá | Meta (2) + Google |
| ...000011 | educasul | EducaSul | Google |
| ...000012 | grafo-capital | Grafo Capital | Meta + Google |

---

## Links

- Supabase Dashboard: https://supabase.com/dashboard/project/lsccpbfuatpwycrtksrb
- Spec completa: ~/Downloads/CLAUDE_CODE_GUIASE_PLATFORM_2.md
