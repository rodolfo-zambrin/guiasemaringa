'use client'
import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { MetricCard } from '@/components/shared/MetricCard'
import { DeltaBadge } from '@/components/shared/DeltaBadge'
import { PlatformBadge } from '@/components/shared/PlatformBadge'
import { HealthScoreGauge } from '@/components/client/HealthScoreGauge'
import { AreaChart } from '@/components/charts/AreaChart'
import { createClient } from '@/lib/supabase/client'
import { useDashboardStore } from '@/store/dashboardStore'
import { fmtBRL, fmtNum, fmtPct, fmtDate } from '@/lib/utils/formatters'
import { calcHealthScore } from '@/lib/utils/calculations'
import { subDays, format } from 'date-fns'
import {
  DollarSign, MousePointer, UserCheck, ShoppingCart,
  TrendingUp, AlertTriangle, ExternalLink,
} from 'lucide-react'

interface AdAccount { account_id: string; platform: 'meta' | 'google'; account_name: string }
interface ClientInfo { id: string; name: string; slug: string; industry: string | null; is_active: boolean; primary_color: string | null }

function calcDelta(a: number, b: number) {
  return b === 0 ? 0 : ((a - b) / b) * 100
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const { dateRange } = useDashboardStore()

  const [client, setClient] = useState<ClientInfo | null>(null)
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [metaDaily, setMetaDaily] = useState<Record<string, string | number>[]>([])
  const [googleDaily, setGoogleDaily] = useState<Record<string, string | number>[]>([])
  const [metaAlerts, setMetaAlerts] = useState<{ id: string; severity: string; message: string; created_at: string }[]>([])
  const [prevMetaTotals, setPrevMetaTotals] = useState({ spend: 0, leads: 0 })
  const [loading, setLoading] = useState(true)

  const prevFrom = format(subDays(new Date(dateRange.from), 30), 'yyyy-MM-dd')
  const prevTo = format(subDays(new Date(dateRange.to), 30), 'yyyy-MM-dd')

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      // Client info
      const { data: c } = await supabase.from('clients').select('*').eq('id', id).single()
      setClient(c as ClientInfo)

      // Ad accounts
      const { data: acc } = await supabase
        .from('ad_accounts')
        .select('account_id,platform,account_name')
        .eq('client_id', id)
        .eq('is_active', true)
      const adAccounts = (acc ?? []) as AdAccount[]
      setAccounts(adAccounts)

      const metaIds = adAccounts.filter(a => a.platform === 'meta').map(a => a.account_id)
      const googleIds = adAccounts.filter(a => a.platform === 'google').map(a => a.account_id)

      // Meta daily (current period)
      if (metaIds.length > 0) {
        const { data: md } = await supabase
          .from('meta_account_daily')
          .select('date,spend,impressions,clicks,leads,frequency,cpm,ctr')
          .in('account_id', metaIds)
          .gte('date', dateRange.from)
          .lte('date', dateRange.to)
          .order('date')
        setMetaDaily((md ?? []) as Record<string, number>[])

        // Previous period for delta
        const { data: prev } = await supabase
          .from('meta_account_daily')
          .select('spend,leads')
          .in('account_id', metaIds)
          .gte('date', prevFrom)
          .lte('date', prevTo)
        const prevData = (prev ?? []) as { spend: number; leads: number }[]
        setPrevMetaTotals({
          spend: prevData.reduce((s, r) => s + (r.spend ?? 0), 0),
          leads: prevData.reduce((s, r) => s + (r.leads ?? 0), 0),
        })
      }

      // Google daily
      if (googleIds.length > 0) {
        const { data: gd } = await supabase
          .from('google_account_daily')
          .select('date,spend,impressions,clicks,conversions,conversion_value')
          .in('account_id', googleIds)
          .gte('date', dateRange.from)
          .lte('date', dateRange.to)
          .order('date')
        setGoogleDaily((gd ?? []) as Record<string, number>[])
      }

      // Alerts
      if (metaIds.length > 0 || googleIds.length > 0) {
        const allIds = [...metaIds, ...googleIds]
        const { data: al } = await supabase
          .from('alerts')
          .select('id,severity,message,created_at')
          .in('account_id', allIds)
          .eq('resolved', false)
          .order('created_at', { ascending: false })
          .limit(10)
        setMetaAlerts((al ?? []) as typeof metaAlerts)
      }

      setLoading(false)
    }
    load()
  }, [id, dateRange.from, dateRange.to])

  // Aggregate totals
  const totals = useMemo(() => {
    const metaSpend = metaDaily.reduce((s, r) => s + (Number(r.spend) ?? 0), 0)
    const metaLeads = metaDaily.reduce((s, r) => s + (Number(r.leads) ?? 0), 0)
    const metaClicks = metaDaily.reduce((s, r) => s + (Number(r.clicks) ?? 0), 0)
    const metaImpressions = metaDaily.reduce((s, r) => s + (Number(r.impressions) ?? 0), 0)
    const metaFreq = metaDaily.length > 0
      ? metaDaily.reduce((s, r) => s + (Number(r.frequency) ?? 0), 0) / metaDaily.length
      : 0
    const metaCpm = metaImpressions > 0 ? (metaSpend / metaImpressions) * 1000 : 0
    const metaCtr = metaImpressions > 0 ? (metaClicks / metaImpressions) * 100 : 0

    const googleSpend = googleDaily.reduce((s, r) => s + (Number(r.spend) ?? 0), 0)
    const googleConversions = googleDaily.reduce((s, r) => s + (Number(r.conversions) ?? 0), 0)
    const googleConvValue = googleDaily.reduce((s, r) => s + (Number(r.conversion_value) ?? 0), 0)
    const googleRoas = googleSpend > 0 ? googleConvValue / googleSpend : 0

    const totalSpend = metaSpend + googleSpend
    const healthScore = calcHealthScore({
      ctr: metaCtr,
      cpm: metaCpm,
      frequency: metaFreq,
      roas: googleRoas,
    })

    return {
      metaSpend, metaLeads, metaClicks, metaImpressions, metaFreq, metaCpm, metaCtr,
      googleSpend, googleConversions, googleConvValue, googleRoas,
      totalSpend, healthScore,
    }
  }, [metaDaily, googleDaily])

  // Chart: daily spend serie
  const chartData = useMemo(() => {
    const dates = new Set([
      ...metaDaily.map(r => String(r.date)),
      ...googleDaily.map(r => String(r.date)),
    ])
    return Array.from(dates).sort().map(date => ({
      date: date.slice(5), // MM-DD
      meta: metaDaily.filter(r => r.date === date).reduce((s, r) => s + Number(r.spend ?? 0), 0),
      google: googleDaily.filter(r => r.date === date).reduce((s, r) => s + Number(r.spend ?? 0), 0),
    }))
  }, [metaDaily, googleDaily])

  if (!loading && !client) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Cliente não encontrado" showPlatformSelector={false} />
        <div className="flex-1 flex items-center justify-center text-[#64748B]">Cliente não encontrado</div>
      </div>
    )
  }

  const clientColor = client?.primary_color ?? '#3B82F6'

  return (
    <div className="flex flex-col flex-1">
      <Header
        title={loading ? 'Carregando...' : (client?.name ?? '')}
        showPlatformSelector={false}
      />
      <div className="flex-1 p-6 space-y-6 max-w-[1200px]">

        {/* Client header */}
        {client && (
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{ backgroundColor: clientColor }}
            >
              {client.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F1F5F9]">{client.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {accounts.filter(a => a.platform === 'meta').length > 0 && (
                  <PlatformBadge platform="meta" />
                )}
                {accounts.filter(a => a.platform === 'google').length > 0 && (
                  <PlatformBadge platform="google" />
                )}
                <span className="text-xs text-[#475569]">
                  {accounts.length} conta{accounts.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Health Score + KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Health Score */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 flex flex-col items-center justify-center">
            <p className="text-xs font-medium text-[#64748B] mb-3">Health Score</p>
            {loading ? (
              <div className="w-24 h-24 bg-[#263548] rounded-full shimmer" />
            ) : (
              <HealthScoreGauge score={totals.healthScore} size="md" />
            )}
          </div>

          {/* Invest. Total */}
          <MetricCard
            label="Investimento Total"
            value={totals.totalSpend}
            format="brl"
            delta={calcDelta(totals.metaSpend, prevMetaTotals.spend)}
            icon={<DollarSign size={16} />}
            isLoading={loading}
            description="vs período anterior"
          />
          {/* Leads Meta */}
          <MetricCard
            label="Leads (Meta)"
            value={totals.metaLeads}
            format="number"
            delta={calcDelta(totals.metaLeads, prevMetaTotals.leads)}
            icon={<UserCheck size={16} />}
            isLoading={loading}
            description={totals.metaLeads > 0 ? `CPL: ${fmtBRL(totals.metaSpend / totals.metaLeads)}` : ''}
          />
          {/* Conversões Google */}
          <MetricCard
            label="Conversões (Google)"
            value={totals.googleConversions}
            format="number"
            icon={<ShoppingCart size={16} />}
            isLoading={loading}
            description={totals.googleRoas > 0 ? `ROAS: ${totals.googleRoas.toFixed(2)}x` : ''}
          />
        </div>

        {/* Meta vs Google side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Meta */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#1877F2]" />
              <h3 className="text-sm font-semibold text-[#F1F5F9]">Meta Ads</h3>
              <span className="text-xs text-[#64748B] ml-auto">
                {accounts.filter(a => a.platform === 'meta').length} conta(s)
              </span>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Invest.', value: fmtBRL(totals.metaSpend) },
                { label: 'Impressões', value: fmtNum(totals.metaImpressions) },
                { label: 'Cliques', value: fmtNum(totals.metaClicks) },
                { label: 'Leads', value: fmtNum(totals.metaLeads) },
                { label: 'CPL', value: totals.metaLeads > 0 ? fmtBRL(totals.metaSpend / totals.metaLeads) : '—' },
                { label: 'CPM', value: fmtBRL(totals.metaCpm) },
                { label: 'CTR', value: fmtPct(totals.metaCtr, 2) },
                { label: 'Frequência', value: totals.metaFreq.toFixed(2) + 'x' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs text-[#64748B]">{row.label}</span>
                  <span className="text-xs font-medium text-[#F1F5F9]">
                    {loading ? <span className="w-12 h-3 bg-[#263548] rounded shimmer inline-block" /> : row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Google */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#34A853]" />
              <h3 className="text-sm font-semibold text-[#F1F5F9]">Google Ads</h3>
              <span className="text-xs text-[#64748B] ml-auto">
                {accounts.filter(a => a.platform === 'google').length} conta(s)
              </span>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Invest.', value: fmtBRL(totals.googleSpend) },
                { label: 'Conversões', value: fmtNum(totals.googleConversions, 1) },
                { label: 'Valor Conv.', value: fmtBRL(totals.googleConvValue) },
                { label: 'CPA', value: totals.googleConversions > 0 ? fmtBRL(totals.googleSpend / totals.googleConversions) : '—' },
                { label: 'ROAS', value: totals.googleRoas > 0 ? totals.googleRoas.toFixed(2) + 'x' : '—' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs text-[#64748B]">{row.label}</span>
                  <span className="text-xs font-medium text-[#F1F5F9]">
                    {loading ? <span className="w-12 h-3 bg-[#263548] rounded shimmer inline-block" /> : row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Evolução temporal */}
        {chartData.length > 1 && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#F1F5F9] mb-1">Evolução do Investimento</h3>
            <p className="text-xs text-[#64748B] mb-4">{dateRange.from} → {dateRange.to}</p>
            <AreaChart
              data={chartData}
              xKey="date"
              dataKeys={[
                { key: 'meta', color: '#1877F2', label: 'Meta Ads', format: 'brl' },
                { key: 'google', color: '#34A853', label: 'Google Ads', format: 'brl' },
              ]}
              height={220}
            />
          </div>
        )}

        {/* Alertas do cliente */}
        {metaAlerts.length > 0 && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#F59E0B]" />
                <h3 className="text-sm font-semibold text-[#F1F5F9]">Alertas Ativos</h3>
              </div>
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-medium">
                {metaAlerts.length}
              </span>
            </div>
            <div className="space-y-2">
              {metaAlerts.slice(0, 5).map(alert => (
                <div key={alert.id} className="flex items-start gap-2.5 text-sm">
                  <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${
                    alert.severity === 'critical' ? 'bg-red-400' : 'bg-yellow-400'
                  }`} />
                  <div>
                    <p className="text-[#F1F5F9] text-xs">{alert.message}</p>
                    <p className="text-[#475569] text-[10px]">{fmtDate(alert.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
