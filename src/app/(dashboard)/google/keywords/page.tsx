'use client'
import { useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { DataTable } from '@/components/shared/DataTable'
import { PlatformBadge } from '@/components/shared/PlatformBadge'
import { MetricCard } from '@/components/shared/MetricCard'
import { useDashboardStore } from '@/store/dashboardStore'
import { useGoogleKeywords } from '@/hooks/useGoogleData'
import { fmtBRL, fmtNum, fmtPct } from '@/lib/utils/formatters'
import { GOOGLE_ACCOUNT_NAMES } from '@/lib/constants/accounts'
import { DollarSign, ShoppingCart, MousePointer } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { GoogleKeywordDaily } from '@/types/google.types'

interface KeywordRow {
  keyword_id: string
  keyword_text: string
  match_type: string
  campaign_name: string
  adgroup_name: string
  account_name: string
  status: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  quality_score: number
}

export default function GoogleKeywordsPage() {
  const { dateRange } = useDashboardStore()
  const { data, isLoading } = useGoogleKeywords(dateRange)

  const rows = useMemo(() => {
    const map = new Map<string, KeywordRow>()
    for (const row of data ?? []) {
      const key = row.keyword_id
      const existing = map.get(key) ?? {
        keyword_id: key,
        keyword_text: row.keyword_text,
        match_type: row.match_type ?? '',
        campaign_name: row.campaign_name,
        adgroup_name: row.adgroup_name,
        account_name: GOOGLE_ACCOUNT_NAMES[row.account_id] ?? row.account_name ?? row.account_id,
        status: row.status ?? '',
        spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, conversions: 0, quality_score: row.quality_score ?? 0,
      }
      existing.spend += row.spend ?? 0
      existing.impressions += row.impressions ?? 0
      existing.clicks += row.clicks ?? 0
      existing.conversions += row.conversions ?? 0
      map.set(key, existing)
    }
    return Array.from(map.values()).map((r) => ({
      ...r,
      ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
      cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
    })).sort((a, b) => b.spend - a.spend)
  }, [data])

  const totals = useMemo(() => rows.reduce(
    (acc, r) => ({ spend: acc.spend + r.spend, conversions: acc.conversions + r.conversions, clicks: acc.clicks + r.clicks }),
    { spend: 0, conversions: 0, clicks: 0 }
  ), [rows])

  const matchTypeColor: Record<string, string> = {
    EXACT: 'bg-blue-900/30 text-blue-400',
    PHRASE: 'bg-purple-900/30 text-purple-400',
    BROAD: 'bg-yellow-900/30 text-yellow-400',
  }

  const columns: ColumnDef<KeywordRow, unknown>[] = [
    {
      accessorKey: 'keyword_text',
      header: 'Palavra-chave',
      cell: (info) => {
        const row = info.row.original as KeywordRow
        return (
          <div>
            <p className="font-medium text-[#F1F5F9] text-sm">{info.getValue() as string}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${matchTypeColor[row.match_type] ?? 'bg-gray-800 text-gray-400'}`}>
                {row.match_type === 'EXACT' ? 'Exata' : row.match_type === 'PHRASE' ? 'Frase' : 'Ampla'}
              </span>
              <span className="text-xs text-[#64748B]">{row.adgroup_name}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'quality_score',
      header: 'QS',
      cell: (info) => {
        const qs = info.getValue() as number
        const color = qs >= 7 ? 'text-green-400' : qs >= 5 ? 'text-yellow-400' : qs > 0 ? 'text-red-400' : 'text-[#475569]'
        return <span className={`font-bold ${color}`}>{qs > 0 ? qs : '—'}</span>
      },
    },
    { accessorKey: 'spend', header: 'Investimento', cell: (info) => <span className="font-semibold text-[#F1F5F9]">{fmtBRL(info.getValue() as number)}</span> },
    { accessorKey: 'impressions', header: 'Impressões', cell: (info) => <span>{fmtNum(info.getValue() as number)}</span> },
    { accessorKey: 'clicks', header: 'Cliques', cell: (info) => <span>{fmtNum(info.getValue() as number)}</span> },
    { accessorKey: 'ctr', header: 'CTR', cell: (info) => <span>{fmtPct(info.getValue() as number)}</span> },
    { accessorKey: 'cpc', header: 'CPC Médio', cell: (info) => <span>{fmtBRL(info.getValue() as number)}</span> },
    { accessorKey: 'conversions', header: 'Conversões', cell: (info) => <span>{fmtNum(info.getValue() as number)}</span> },
  ]

  return (
    <div className="flex flex-col flex-1">
      <Header title="Palavras-chave — Google Ads" showPlatformSelector={false} />
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <MetricCard label="Investimento Total" value={totals.spend} format="brl" icon={<DollarSign size={16} />} isLoading={isLoading} />
          <MetricCard label="Cliques" value={totals.clicks} format="number" icon={<MousePointer size={16} />} isLoading={isLoading} />
          <MetricCard label="Conversões" value={totals.conversions} format="number" icon={<ShoppingCart size={16} />} isLoading={isLoading} />
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PlatformBadge platform="google" />
            <h3 className="text-sm font-semibold text-[#F1F5F9]">
              {rows.length} palavras-chave · {dateRange.from} a {dateRange.to}
            </h3>
          </div>
          <DataTable data={rows} columns={columns} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
