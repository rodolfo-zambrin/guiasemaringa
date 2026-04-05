# Phase 04 — Visão Horária: PLAN

## Goal
Painel /tempo-real funcional: dados hora a hora, comparativo D-1 e mesma semana, projeção do dia, auto-refresh via Supabase Realtime.

## Tasks

### Task 1: n8n — meta_hourly_sync workflow
Criar workflow n8n para sincronizar dados horários Meta Ads.

**Configuração:**
- Trigger: Cron `0 * * * *` (todo início de hora)
- Windsor connector: `facebook`
- Campo horário: `hourly_stats_aggregated_by_advertiser_time_zone`
- date_from = hoje, date_to = hoje
- Campos a buscar: `account_name, date, hourly_stats_aggregated_by_advertiser_time_zone, spend, impressions, clicks, ctr, cpm, actions_lead, actions_purchase, actions_onsite_conversion_messaging_conversation_started_7d, actions_landing_page_view, actions_video_view, action_values_purchase`
- Parsear hora: `parseInt("14:00:00 - 14:59:59".split(':')[0])` → 14
- Upsert: tabela `meta_hourly` ON CONFLICT(tenant_id, account_id, campaign_id, adset_id, date, hour)
- Log em sync_log

**Atenção:** meta_hourly usa `tenant_id` (não `client_id`). O n8n precisa passar o UUID do tenant correto para cada conta. Mapear account_id → tenant_id via tabela `ad_accounts` + `clients`.

### Task 2: n8n — google_hourly_sync workflow
Criar workflow n8n para sincronizar dados horários Google Ads.

**Configuração:**
- Trigger: Cron `0 * * * *`
- Windsor connector: `google_ads`
- Campo horário: verificar se Windsor usa `hour_of_day` ou formato similar
- Campos: `account_name, date, hour_of_day, spend, impressions, clicks, ctr, average_cpc, conversions, conversion_value, all_conversions`
- Upsert: tabela `google_hourly` ON CONFLICT(tenant_id, account_id, campaign_id, adgroup_id, date, hour)

### Task 3: Supabase Realtime
Habilitar Realtime para as tabelas horárias.

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE meta_hourly;
ALTER PUBLICATION supabase_realtime ADD TABLE google_hourly;
```

Executar via Supabase Studio > SQL Editor.

### Task 4: Hook useHourlyData
Criar `src/hooks/useHourlyData.ts`.

**Funcionalidades:**
- Query meta_hourly + google_hourly filtrado por tenant_id + date
- Parâmetros: `clientId`, `date` (hoje), `platform` (meta | google | ambos)
- Calcular acumulado do dia (soma até hora atual)
- Buscar comparativo ontem: `.lte('hour', horaAtual)` com date = ontem
- Buscar comparativo mesma semana: `.lte('hour', horaAtual)` com date = -7 dias
- Subscription Realtime para auto-refresh
- Retornar: `{ today, yesterday, lastWeek, projectedDay, isLive }`

**Lógica de projeção:**
```typescript
// Taxa horária das últimas 3 horas → projetar para 24h
const last3h = today.filter(h => h.hour >= horaAtual - 3)
const hourlyRate = last3h.reduce((sum, h) => sum + h.spend, 0) / 3
const projected = spentSoFar + hourlyRate * (23 - horaAtual)
```

### Task 5: Componentes da Visão Horária

**HourlyChart** (`src/components/realtime/HourlyChart.tsx`)
- Recharts AreaChart com 3 séries: hoje (azul), ontem (cinza), semana passada (tracejado)
- Tabs para trocar métrica: Spend / Impressões / Cliques / Leads
- Eixo X: 00h → hora atual
- Tooltip com valores absolutos + delta vs ontem

**ComparativePanel** (`src/components/realtime/ComparativePanel.tsx`)
- Tabela: Métrica | Hoje (até agora) | Ontem (mesmo horário) | Δ%
- Métricas: Invest., Impressões, Cliques, Leads, WA Starts, CPL, CPM
- DeltaBadge colorido por direção e magnitude

**PaceTracker** (`src/components/realtime/PaceTracker.tsx`)
- Invest. projetado vs budget
- Leads projetados
- CPL projetado
- ⚠️ alertas inline: "X cliente vai gastar Y acima do budget"

**LiveIndicator** (`src/components/realtime/LiveIndicator.tsx`)
- Dot vermelho pulsante + "AO VIVO"
- Texto: "Última atualização: HH:MM"
- Toggle: auto-refresh ON/OFF

### Task 6: Conectar /tempo-real page
Refatorar `src/app/(dashboard)/tempo-real/page.tsx` para usar os novos hooks e componentes.

Layout final:
1. Header com LiveIndicator + filtros (cliente, plataforma, auto-refresh)
2. MetricCards com totais do dia + delta vs ontem
3. HourlyChart (gráfico hora a hora)
4. Tabela hora a hora (com linha da hora atual destacada)
5. ComparativePanel
6. PaceTracker

---

## Definition of Done

- [ ] Workflows n8n hourly criados e testados (dados aparecendo em meta_hourly / google_hourly)
- [ ] Realtime habilitado nas tabelas horárias
- [ ] /tempo-real mostrando dados reais com comparativos
- [ ] Auto-refresh funcionando sem reload manual
- [ ] Projeção do dia calculada e exibida
- [ ] Sem erros TypeScript no build

---

## Notes

- **tenant_id vs client_id:** meta_hourly e google_hourly usam `tenant_id`. Precisar verificar se o RLS policy está usando `tenant_id = auth.uid()` e se isso é compatível com a lógica multi-tenant (onde auth.uid() = UUID do usuário logado, não do cliente). Considerar migrar para `client_id` se necessário.
- O /tempo-real page.tsx já tem estrutura inicial — refatorar, não reescrever do zero.
