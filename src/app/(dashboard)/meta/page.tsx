'use client'
import { useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { MetricCard } from '@/components/shared/MetricCard'
import { AreaChart } from '@/components/charts/AreaChart'
import { BarChart } from '@/components/charts/BarChart'
import { DataTable } from '@/components/shared/DataTable'
import { PlatformBadge } from '@/components/shared/PlatformBadge'
import { useDashboardStore } from '@/store/dashboardStore'
import { useMetaOverview } from '@/hooks/useMetaData'
import { fmtBRL, fmtNum, fmtPct, fmtROAS } from '@/lib/utils/formatters'
import { META_ACCOUNT_NAMES } from '@/lib/constants/accounts'
import { DollarSign, Eye, MousePointer, UserCheck, ShoppingCart, TrendingUp, Repeat2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { format, eachDayOfInterval, parseISO } from 'date-fns'

interface AccountRow {
  account_id: string
  account_name: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpm: number
  leads: number
  conversions: number
  roas: number
}

export default function MetaPage() {
  const { dateRange } = useDashboardStore()
  const { data, isLoading } = useMetaOverview(dateRange)

  const totals = useMemo(() => {
    return (data ?? []).reduce(
      (acc, row) => ({
        spend: acc.spend + (row.spend ?? 0),
        impressions: acc.impressions + (row.impressions ?? 0),
        clicks: acc.clicks + (row.clicks ?? 0),
        leads: acc.leads + (row.leads ?? 0),
        conversions: acc.conversions + (row.conversions ?? 0),
        conversionValue: acc.conversionValue + (row.conversion_value ?? 0),
      }),
      { spend: 0, impressions: 0, clicks: 0, leads: 0, conversions: 0, conversionValue: 0 }
    )
  }, [data])

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0
  const roas = totals.spend > 0 ? totals.conversionValue / totals.spend : 0

  // Daily trend
  const dailyData = useMemo(() => {
    if (!data) return []
    const days = eachDayOfInterval({ start: parseISO(dateRange.from), end: parseISO(dateRange.to) })
    return days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayRows = data.filter((r) => r.date === dayStr)
      return {
        date: format(day, 'dd/MM'),
        spend: dayRows.reduce((a, r) => a + (r.spend ?? 0), 0),
        leads: dayRows.reduce((a, r) => a + (r.leads ?? 0), 0),
      }
    })
  }, [data, dateRange])

  // Account breakdown table
  const accountRows = useMemo(() => {
    const map = new Map<string, AccountRow>()
    for (const row of data ?? []) {
      const name = META_ACCOUNT_NAMES[row.account_id] ?? row.account_name ?? row.account_id
      const key = row.account_id
      const existing = map.get(key) ?? {
        account_id: key,
        account_name: name,
        spend: 0, impressions: 0, clicks: 0, ctr: 0, cpm: 0,
        leads: 0, conversions: 0, roas: 0,
      }
      existing.spend += row.spend ?? 0
      existing.impressions += row.impressions ?? 0
      existing.clicks += row.clicks ?? 0
      existing.leads += row.leads ?? 0
      existing.conversions += row.conversions ?? 0
      map.set(key, existing)
    }
    return Array.from(map.values()).map((r) => ({
      ...r,
      ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
      cpm: r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0,
      roas: 0,
    })).sort((a, b) => b.spend - a.spend)
  }, [data])

  const columns: ColumnDef<AccountRow, unknown>[] = [
    {
      accessorKey: 'account_name',
      header: 'Conta',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <PlatformBadge platform="meta" />
          <span className="font-medium text-[#F1F5F9]">{info.getValue() as string}</span>
        </div>
      ),
    },
    {
      accessorKey: 'spend',
      header: 'Investimento',
      cell: (info) => <span className="font-semibold text-[#F1F5F9]">{fmtBRL(info.getValue() as number)}</span>,
    },
    {
      accessorKey: 'impressions',
      header: 'Impressões',
      cell: (info) => <span>{fmtNum(info.getValue() as number)}</span>,
    },
    {
      accessorKey: 'clicks',
      header: 'Cliques',
      cell: (info) => <span>{fmtNum(info.getValue() as number)}</span>,
    },
    {
      accessorKey: 'ctr',
      header: 'CTR',
      cell: (info) => <span>{fmtPct(info.getValue() as number)}</span>,
    },
    {
      accessorKey: 'cpm',
      header: 'CPM',
      cell: (info) => <span>{fmtBRL(info.getValue() as number)}</span>,
    },
    {
      accessorKey: 'leads',
      header: 'Leads',
      cell: (info) => <span>{fmtNum(info.getValue() as number)}</span>,
    },
    {
      accessorKey: 'conversions',
      header: 'Compras',
      cell: (info) => <span>{fmtNum(info.getValue() as number)}</span>,
    },
  ]

  return (
    <div className="flex flex-col flex-1">
      <Header title="Meta Ads — Visão Geral" showPlatformSelector={false} />
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <MetricCard label="Investimento" value={totals.spend} format="brl" icon={<DollarSign size={16} />} isLoading={isLoading} />
          <MetricCard label="Impressões" value={totals.impressions} format="number" icon={<Eye size={16} />} isLoading={isLoading} />
          <MetricCard label="Cliques" value={totals.clicks} format="number" icon={<MousePointer size={16} />} isLoading={isLoading} />
          <MetricCard label="CTR" value={ctr} format="percent" isLoading={isLoading} />
          <MetricCard label="Leads" value={totals.leads} format="number" icon={<UserCheck size={16} />} isLoading={isLoading} />
          <MetricCard label="Compras" value={totals.conversions} format="number" icon={<ShoppingCart size={16} />} isLoading={isLoading} />
          <MetricCard label="CPL" value={cpl} format="brl" invertDelta icon={<Repeat2 size={16} />} isLoading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#F1F5F9] mb-1">Investimento Diário</h3>
            <p className="text-xs text-[#64748B] mb-4">{dateRange.from} a {dateRange.to}</p>
            <AreaChart
              data={dailyData}
              xKey="date"
              dataKeys={[{ key: 'spend', color: '#1877F2', label: 'Investimento', format: 'brl' }]}
              height={220}
            />
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#F1F5F9] mb-1">Top Contas por Investimento</h3>
            <p className="text-xs text-[#64748B] mb-4">No período selecionado</p>
            <BarChart
              data={accountRows.slice(0, 8).map((r) => ({ name: r.account_name, spend: r.spend }))}
              xKey="name"
              valueKey="spend"
              color="#1877F2"
              format="brl"
              horizontal
              height={220}
            />
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F1F5F9] mb-4">Desempenho por Conta</h3>
          <DataTable data={accountRows} columns={columns} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
