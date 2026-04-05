# AG Perform — Plataforma de Mídia Paga

Dashboard SaaS multi-tenant para análise de performance de Meta Ads e Google Ads.  
Desenvolvido para Guia-se Maringá.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI | shadcn/ui, Recharts, TanStack Table, Lucide |
| Estado | Zustand + React Query |
| Auth | Supabase Auth (email/senha) |
| Database | Supabase PostgreSQL + RLS |
| Realtime | Supabase Realtime (postgres_changes) |
| Pipeline | n8n → Facebook Graph API / Google Ads API → Supabase |
| Deploy | Vercel (região gru1 — São Paulo) |

---

## Setup Local

### 1. Pré-requisitos

- Node.js 20+
- npm ou pnpm
- Conta Supabase (projeto já criado)
- n8n (self-hosted ou cloud)

### 2. Variáveis de Ambiente

```bash
cp .env.example .env.local
# Preencher com os valores reais
```

Variáveis obrigatórias:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Aplicar migrations

No Supabase Studio → SQL Editor, executar em ordem:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_seed_clients.sql
...
supabase/migrations/20260405_005_enrich_hourly_tables.sql
```

Ou via CLI:

```bash
npx supabase db push
```

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Deploy (Vercel)

### 1. Conectar repositório no Vercel

```bash
npx vercel --prod
```

Ou via dashboard Vercel → Import Git Repository.

### 2. Variáveis de Ambiente no Vercel

Em Settings → Environment Variables, adicionar todas as variáveis de `.env.example`.

### 3. Domínio

Em Settings → Domains, adicionar `agperform.com.br` e configurar DNS:

```
CNAME  @  cname.vercel-dns.com
```

---

## n8n Workflows

Importar os arquivos da pasta `n8n/` no painel do n8n:

| Arquivo | Descrição | Cron |
|---------|-----------|------|
| `meta_daily_sync.json` | Sync Meta D-1 (todas as contas) | `0 6 * * *` |
| `google_daily_sync.json` | Sync Google D-1 via API direta | `0 6 * * *` |
| `meta_hourly_sync.json` | Sync Meta horário | `0 * * * *` |
| `google_hourly_sync.json` | Sync Google horário | `15 * * * *` |
| `alerts_engine.json` | Motor de alertas diário | `30 6 * * *` |
| `meta_backfill.json` | Backfill histórico Meta | Manual |
| `google_backfill_windsor.json` | Backfill histórico Google | Manual |

### Credenciais necessárias no n8n

- **Supabase**: URL + Service Role Key (em HTTP Request → Authorization: Bearer)
- **Meta**: Long-lived Access Token (System User recomendado)
- **Google Ads**: Developer Token + OAuth2 credentials

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/          # Login, forgot-password
│   ├── (dashboard)/     # Todas as rotas autenticadas
│   │   ├── dashboard/   # Overview portfólio
│   │   ├── meta/        # Meta Ads (overview + campanhas + conjuntos + anúncios)
│   │   ├── google/      # Google Ads (overview + campanhas + grupos + keywords)
│   │   ├── tempo-real/  # Visão horária com Realtime
│   │   ├── alertas/     # Painel de alertas
│   │   ├── clientes/    # Lista + detalhe por cliente
│   │   ├── admin/       # Admin (super_admin only)
│   │   └── configuracoes/ # Usuários + Contas
│   └── api/             # Health check
├── components/
│   ├── charts/          # AreaChart, BarChart, DonutChart, LineChart
│   ├── client/          # HealthScoreGauge
│   ├── layout/          # Sidebar, Header
│   ├── realtime/        # LiveIndicator, HourlyChart, ComparativePanel, PaceTracker
│   └── shared/          # MetricCard, DeltaBadge, DataTable, EmptyState, PlatformBadge
├── hooks/               # useMetaData, useGoogleData, useAlerts, useAuth, useHourlyData
├── lib/
│   ├── supabase/        # client.ts, server.ts, middleware.ts
│   └── utils/           # formatters.ts, calculations.ts, cn.ts
├── store/               # dashboardStore (Zustand)
└── types/               # meta.types.ts, google.types.ts, database.types.ts
```

---

## Roles e Permissões

| Role | Acesso |
|------|--------|
| `super_admin` | Tudo — todos os clientes, admin, configurações |
| `analyst` | Dashboard completo — todos os clientes (sem admin) |
| `client_view` | Somente dados do cliente vinculado ao seu perfil |

---

## Clientes Ativos

14 clientes cadastrados. Ver tabela `clients` no Supabase ou `/admin/clientes` na plataforma.

---

## Problemas Conhecidos / Pending

- Aplicar migration `20260405_005_enrich_hourly_tables.sql` no Supabase Studio
- Importar workflows n8n: `meta_hourly_sync`, `google_hourly_sync`, `alerts_engine`
- Aguardar primeira hora completa após import para validar dados horários
- Configurar DNS agperform.com.br no Vercel
