'use client'
import { useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { DataTable } from '@/components/shared/DataTable'
import { PlatformBadge } from '@/components/shared/PlatformBadge'
import { MetricCard } from '@/components/shared/MetricCard'
import { useDashboardStore } from '@/store/dashboardStore'
import { useMetaCampaigns } from '@/hooks/useMetaData'
import { fmtBRL, fmtNum, fmtPct, fmtROAS } from '@/lib/utils/formatters'
import { META_ACCOUNT_NAMES } from '@/lib/constants/accounts'
import { DollarSign, UserCheck, ShoppingCart, MousePointer } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { MetaCampaignDaily } from '@/types/meta.types'

interface CampaignRow {
  campaign_id: string
  campaign_name: string
  account_name: string
  objective: string
  status: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpm: number
  cpc: number
  leads: number
  conversions: number
  roas: number
}

export default function MetaCampanhasPage() {
  const { dateRange } = useDashboardStore()
  const { data, isLoading } = useMetaCampaigns(dateRange)

  const rows = useMemo(() => {
    const map = new Map<string, CampaignRow>()
    for (const row of data ?? []) {
      const key = row.campaign_id
      const existing = map.get(key) ?? {
        campaign_id: key,
        campaign_name: row.campaign_name,
        account_name: META_ACCOUNT_NAMES[row.account_id] ?? row.account_name ?? row.account_id,
        objective: row.objective ?? '',
        status: row.status ?? '',
        spend: 0, impressions: 0, clicks: 0, ctr: 0, cpm: 0, cpc: 0,
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
      cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
    })).sort((a, b) => b.spend - a.spend)
  }, [data])

  const totals = useMemo(() => rows.reduce(
    (acc, r) => ({ spend: acc.spend + r.spend, leads: acc.leads + r.leads, conversions: acc.conversions + r.conversions, clicks: acc.clicks + r.clicks }),
    { spend: 0, leads: 0, conversions: 0, clicks: 0 }
  ), [rows])

  const columns: ColumnDef<CampaignRow, unknown>[] = [
    {
      accessorKey: 'campaign_name',
      header: 'Campanha',
      cell: (info) => (
        <div>
          <p className="font-medium text-[#F1F5F9] text-sm leading-snug">{info.getValue() as string}</p>
          <p className="text-xs text-[#64748B]">{(info.row.original as CampaignRow).account_name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => {
        const s = (info.getValue() as string)?.toUpperCase()
        const color = s === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'
        const label = s === 'ACTIVE' ? 'Ativa' : s === 'PAUSED' ? 'Pausada' : s ?? '—'
        return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
      },
    },
    { accessorKey: 'spend', header: 'Investimento', cell: (info) => <span className="font-semibold text-[#F1F5F9]">{fmtBRL(info.getValue() as number)}</span> },
    { accessorKey: 'impressions', header: 'Impressões', cell: (info) => <span>{fmtNum(info.getValue() as number)}</span> },
    { accessorKey: 'clicks', header: 'Cliques', cell: (info) => <span>{fmtNum(info.getValue() as number)}</span> },
    { accessorKey: 'ctr', header: 'CTR', cell: (info) => <span>{fmtPct(info.getValue() as number)}</span> },
    { accessorKey: 'cpm', header: 'CPM', cell: (info) => <span>{fmtBRL(info.getValue() as number)}</span> },
    { accessorKey: 'cpc', header: 'CPC', cell: (info) => <span>{fmtBRL(info.getValue() as number)}</span> },
    { accessorKey: 'leads', header: 'Leads', cell: (info) => <span>{fmtNum(info.getValue() as number)}</span> },
    { accessorKey: 'conversions', header: 'Compras', cell: (info) => <span>{fmtNum(info.getValue() as number)}</span> },
  ]

  return (
    <div className="flex flex-col flex-1">
      <Header title="Campanhas — Meta Ads" showPlatformSelector={false} />
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard label="Investimento Total" value={totals.spend} format="brl" icon={<DollarSign size={16} />} isLoading={isLoading} />
          <MetricCard label="Cliques" value={totals.clicks} format="number" icon={<MousePointer size={16} />} isLoading={isLoading} />
          <MetricCard label="Leads" value={totals.leads} format="number" icon={<UserCheck size={16} />} isLoading={isLoading} />
          <MetricCard label="Compras" value={totals.conversions} format="number" icon={<ShoppingCart size={16} />} isLoading={isLoading} />
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PlatformBadge platform="meta" />
            <h3 className="text-sm font-semibold text-[#F1F5F9]">
              {rows.length} campanhas · {dateRange.from} a {dateRange.to}
            </h3>
          </div>
          <DataTable data={rows} columns={columns} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
