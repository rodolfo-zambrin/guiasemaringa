'use client'
import { useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { MetricCard } from '@/components/shared/MetricCard'
import { BarChart } from '@/components/charts/BarChart'
import { AreaChart } from '@/components/charts/AreaChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { DataTable } from '@/components/shared/DataTable'
import { PlatformBadge } from '@/components/shared/PlatformBadge'
import { useDashboardStore } from '@/store/dashboardStore'
import { useMetaOverview } from '@/hooks/useMetaData'
import { useGoogleOverview } from '@/hooks/useGoogleData'
import { fmtBRL, fmtNum, fmtPct, fmtROAS } from '@/lib/utils/formatters'
import { calcHealthScore, calcROAS, getHealthColor, getHealthLabel } from '@/lib/utils/calculations'
import { META_ACCOUNT_NAMES, GOOGLE_ACCOUNT_NAMES, toClientName } from '@/lib/constants/accounts'
import { DollarSign, Eye, MousePointer, UserCheck, ShoppingCart, TrendingUp } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns'

interface ClientRow {
  name: string
  metaSpend: number
  googleSpend: number
  total: number
  leads: number
  conversions: number
  roas: number
  score: number
}

export default function DashboardPage() {
  const { dateRange, selectedClients } = useDashboardStore()

  const { data: metaData, isLoading: metaLoading } = useMetaOverview(
    dateRange,
    selectedClients.length > 0 ? selectedClients : undefined
  )
  const { data: googleData, isLoading: googleLoading } = useGoogleOverview(
    dateRange,
    selectedClients.length > 0 ? selectedClients : undefined
  )

  const isLoading = metaLoading || googleLoading

  // Aggregate totals
  const totals = useMemo(() => {
    const metaTotals = (metaData ?? []).reduce(
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
    const googleTotals = (googleData ?? []).reduce(
      (acc, row) => ({
        spend: acc.spend + (row.spend ?? 0),
        impressions: acc.impressions + (row.impressions ?? 0),
        clicks: acc.clicks + (row.clicks ?? 0),
        conversions: acc.conversions + (row.conversions ?? 0),
        conversionValue: acc.conversionValue + (row.conversion_value ?? 0),
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0 }
    )
    const totalSpend = metaTotals.spend + googleTotals.spend
    const totalRevenue = metaTotals.conversionValue + googleTotals.conversionValue
    return {
      totalSpend,
      impressions: metaTotals.impressions + googleTotals.impressions,
      clicks: metaTotals.clicks + googleTotals.clicks,
      leads: metaTotals.leads,
      conversions: googleTotals.conversions + metaTotals.conversions,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      metaSpend: metaTotals.spend,
      googleSpend: googleTotals.spend,
    }
  }, [metaData, googleData])

  // Client breakdown table
  const clientRows = useMemo(() => {
    const map = new Map<string, ClientRow>()

    for (const row of metaData ?? []) {
      const acctName = META_ACCOUNT_NAMES[row.account_id] ?? row.account_name ?? row.account_id
      const name = toClientName(acctName)
      const existing = map.get(name) ?? {
        name,
        metaSpend: 0,
        googleSpend: 0,
        total: 0,
        leads: 0,
        conversions: 0,
        roas: 0,
        score: 0,
      }
      existing.metaSpend += row.spend ?? 0
      existing.leads += row.leads ?? 0
      existing.conversions += row.conversions ?? 0
      map.set(name, existing)
    }

    for (const row of googleData ?? []) {
      const acctName = GOOGLE_ACCOUNT_NAMES[row.account_id] ?? row.account_name ?? row.account_id
      const name = toClientName(acctName)
      const existing = map.get(name) ?? {
        name,
        metaSpend: 0,
        googleSpend: 0,
        total: 0,
        leads: 0,
        conversions: 0,
        roas: 0,
        score: 0,
      }
      existing.googleSpend += row.spend ?? 0
      existing.conversions += row.conversions ?? 0
      map.set(name, existing)
    }

    return Array.from(map.values())
      .map((r) => {
        const total = r.metaSpend + r.googleSpend
        const roas = total > 0 ? calcROAS(r.conversions * 50, total) : 0
        return {
          ...r,
          total,
          roas,
          score: calcHealthScore({ ctr: 1.5, cpm: 30, frequency: 2.5, roas }),
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [metaData, googleData])

  // Top clients chart
  const topClientsChart = useMemo(
    () => clientRows.slice(0, 10).map((r) => ({ name: r.name, spend: r.total })),
    [clientRows]
  )

  // Daily trend chart
  const dailyTrendChart = useMemo(() => {
    const days = eachDayOfInterval({
      start: parseISO(dateRange.from),
      end: parseISO(dateRange.to),
    })

    return days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const metaSpend = (metaData ?? [])
        .filter((r) => r.date === dayStr)
        .reduce((acc, r) => acc + (r.spend ?? 0), 0)
      const googleSpend = (googleData ?? [])
        .filter((r) => r.date === dayStr)
        .reduce((acc, r) => acc + (r.spend ?? 0), 0)
      return {
        date: format(day, 'dd/MM'),
        meta: metaSpend,
        google: googleSpend,
      }
    })
  }, [metaData, googleData, dateRange])

  // Platform donut
  const platformDonut = [
    { name: 'Meta Ads', value: totals.metaSpend, color: '#1877F2' },
    { name: 'Google Ads', value: totals.googleSpend, color: '#34A853' },
  ].filter((d) => d.value > 0)

  // Columns
  const columns: ColumnDef<ClientRow, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Cliente',
      cell: (info) => (
        <span className="font-medium text-[#F1F5F9]">{info.getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'metaSpend',
      header: 'Meta',
      cell: (info) => (
        <div className="flex items-center gap-1.5">
          <PlatformBadge platform="meta" />
          <span>{fmtBRL(info.getValue() as number)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'googleSpend',
      header: 'Google',
      cell: (info) => (
        <div className="flex items-center gap-1.5">
          <PlatformBadge platform="google" />
          <span>{fmtBRL(info.getValue() as number)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total Invest.',
      cell: (info) => (
        <span className="font-semibold text-[#F1F5F9]">{fmtBRL(info.getValue() as number)}</span>
      ),
    },
    {
      accessorKey: 'leads',
      header: 'Leads',
      cell: (info) => <span>{fmtNum(info.getValue() as number)}</span>,
    },
    {
      accessorKey: 'conversions',
      header: 'Conversões',
      cell: (info) => <span>{fmtNum(info.getValue() as number)}</span>,
    },
    {
      accessorKey: 'roas',
      header: 'ROAS',
      cell: (info) => <span>{fmtROAS(info.getValue() as number)}</span>,
    },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: (info) => {
        const score = info.getValue() as number
        return (
          <span className={`font-semibold ${getHealthColor(score)}`}>
            {score} — {getHealthLabel(score)}
          </span>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col flex-1 bg-[#0d1520]">
      <Header title="Visão Geral do Portfólio" />

      <div className="flex-1 p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            label="Total Investido"
            value={totals.totalSpend}
            format="brl"
            icon={<DollarSign size={15} />}
            isLoading={isLoading}
            accentColor="#F59E0B"
          />
          <MetricCard
            label="Impressões"
            value={totals.impressions}
            format="number"
            icon={<Eye size={15} />}
            isLoading={isLoading}
            accentColor="#3B82F6"
          />
          <MetricCard
            label="Cliques"
            value={totals.clicks}
            format="number"
            icon={<MousePointer size={15} />}
            isLoading={isLoading}
            accentColor="#06B6D4"
          />
          <MetricCard
            label="Leads"
            value={totals.leads}
            format="number"
            icon={<UserCheck size={15} />}
            isLoading={isLoading}
            accentColor="#22C55E"
          />
          <MetricCard
            label="Conversões"
            value={totals.conversions}
            format="number"
            icon={<ShoppingCart size={15} />}
            isLoading={isLoading}
            accentColor="#A855F7"
          />
          <MetricCard
            label="ROAS Médio"
            value={totals.roas}
            format="roas"
            icon={<TrendingUp size={15} />}
            isLoading={isLoading}
            accentColor="#10B981"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top clients */}
          <div className="lg:col-span-2 bg-[#1E293B] border border-[#1e2d3d] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e2d3d]">
              <h3 className="text-sm font-semibold text-[#E2E8F0]">Top 10 Clientes</h3>
              <p className="text-[11px] text-[#475569] mt-0.5">Ranking por investimento total no período</p>
            </div>
            <div className="p-5">
              <BarChart
                data={topClientsChart}
                xKey="name"
                valueKey="spend"
                color="#3B82F6"
                format="brl"
                horizontal
                height={300}
              />
            </div>
          </div>

          {/* Platform donut */}
          <div className="bg-[#1E293B] border border-[#1e2d3d] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e2d3d]">
              <h3 className="text-sm font-semibold text-[#E2E8F0]">Distribuição por Plataforma</h3>
              <p className="text-[11px] text-[#475569] mt-0.5">Participação no investimento total</p>
            </div>
            <div className="p-5">
              <DonutChart data={platformDonut} format="brl" height={200} />
              <div className="mt-4 space-y-2">
                {[
                  { label: 'Meta Ads', value: totals.metaSpend, color: '#1877F2' },
                  { label: 'Google Ads', value: totals.googleSpend, color: '#34A853' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-[#64748B]">{item.label}</span>
                    </div>
                    <span className="text-[#E2E8F0] font-semibold tabular-nums">{fmtBRL(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Daily trend */}
        <div className="bg-[#1E293B] border border-[#1e2d3d] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e2d3d] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#E2E8F0]">Investimento Diário</h3>
              <p className="text-[11px] text-[#475569] mt-0.5">
                Meta vs Google — {dateRange.from} a {dateRange.to}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs text-[#475569]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 rounded-full bg-[#1877F2]" />
                Meta Ads
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 rounded-full bg-[#34A853]" />
                Google Ads
              </span>
            </div>
          </div>
          <div className="p-5">
            <AreaChart
              data={dailyTrendChart}
              xKey="date"
              dataKeys={[
                { key: 'meta', color: '#1877F2', label: 'Meta Ads', format: 'brl' },
                { key: 'google', color: '#34A853', label: 'Google Ads', format: 'brl' },
              ]}
              height={260}
            />
          </div>
        </div>

        {/* Clients table */}
        <div className="bg-[#1E293B] border border-[#1e2d3d] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e2d3d]">
            <h3 className="text-sm font-semibold text-[#E2E8F0]">Resumo por Cliente</h3>
            <p className="text-[11px] text-[#475569] mt-0.5">Performance consolidada por conta no período selecionado</p>
          </div>
          <div className="p-5">
            <DataTable data={clientRows} columns={columns} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}
