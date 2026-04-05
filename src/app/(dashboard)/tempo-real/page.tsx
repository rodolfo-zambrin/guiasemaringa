'use client'
import { useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Header } from '@/components/layout/Header'
import { MetricCard } from '@/components/shared/MetricCard'
import { LiveIndicator } from '@/components/realtime/LiveIndicator'
import { HourlyChart } from '@/components/realtime/HourlyChart'
import { ComparativePanel } from '@/components/realtime/ComparativePanel'
import { PaceTracker } from '@/components/realtime/PaceTracker'
import { useHourlyData } from '@/hooks/useHourlyData'
import { fmtHour, fmtBRL, fmtNum } from '@/lib/utils/formatters'
import { DollarSign, MousePointer, UserCheck, ShoppingCart, Eye, TrendingUp, TrendingDown, Minus } from 'lucide-react'

function calcDelta(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export default function TempoRealPage() {
  const { data, isLoading } = useHourlyData()
  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })
  const currentHour = data.current_hour

  const totalsToday = data.totals.today
  const totalsYesterday = data.totals.yesterday

  const deltaSpend = calcDelta(totalsToday.spend, totalsYesterday.spend)
  const deltaLeads = calcDelta(totalsToday.leads, totalsYesterday.leads)
  const deltaClicks = calcDelta(totalsToday.clicks, totalsYesterday.clicks)
  const deltaImpressions = calcDelta(totalsToday.impressions, totalsYesterday.impressions)
  const deltaConversions = calcDelta(totalsToday.conversions, totalsYesterday.conversions)

  // Tabela hora a hora
  const tableRows = useMemo(() => {
    return data.today.slice(0, currentHour + 1).map((row) => ({
      hour: row.hour,
      meta_spend: row.meta_spend,
      google_spend: row.google_spend,
      total_spend: row.total_spend,
      total_clicks: row.total_clicks,
      meta_leads: row.meta_leads,
      google_conversions: row.google_conversions,
    }))
  }, [data.today, currentHour])

  const totalTableSpend = tableRows.reduce((s, r) => s + r.total_spend, 0)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Tempo Real" showPlatformSelector={false} />
      <div className="flex-1 p-6 space-y-6 max-w-[1400px]">

        {/* Barra de status */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LiveIndicator lastUpdated={data.last_updated} isLive />
          <span className="text-sm text-[#94A3B8] capitalize">{today}</span>
        </div>

        {/* KPIs com delta vs ontem */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard
            label="Investimento Hoje"
            value={totalsToday.spend}
            format="brl"
            delta={deltaSpend}
            icon={<DollarSign size={16} />}
            isLoading={isLoading}
            description="vs ontem mesmo horário"
          />
          <MetricCard
            label="Impressões"
            value={totalsToday.impressions}
            format="number"
            delta={deltaImpressions}
            icon={<Eye size={16} />}
            isLoading={isLoading}
            description="vs ontem"
          />
          <MetricCard
            label="Cliques"
            value={totalsToday.clicks}
            format="number"
            delta={deltaClicks}
            icon={<MousePointer size={16} />}
            isLoading={isLoading}
            description="vs ontem"
          />
          <MetricCard
            label="Leads (Meta)"
            value={totalsToday.leads}
            format="number"
            delta={deltaLeads}
            icon={<UserCheck size={16} />}
            isLoading={isLoading}
            description="vs ontem"
          />
          <MetricCard
            label="Conversões (Google)"
            value={totalsToday.conversions}
            format="number"
            delta={deltaConversions}
            icon={<ShoppingCart size={16} />}
            isLoading={isLoading}
            description="vs ontem"
          />
        </div>

        {/* Gráfico hora a hora */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-[#F1F5F9]">Evolução Hora a Hora</h3>
            <span className="text-xs text-[#64748B]">Agora: {fmtHour(currentHour)}</span>
          </div>
          <p className="text-xs text-[#64748B] mb-4">
            Hoje (azul) · Ontem (cinza) · Semana passada (tracejado) — até a hora atual
          </p>
          <HourlyChart
            today={data.today}
            yesterday={data.yesterday}
            last_week={data.last_week}
            currentHour={currentHour}
            height={280}
          />
        </div>

        {/* Tabela + Projeção lado a lado em telas grandes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Tabela hora a hora */}
          <div className="lg:col-span-2 bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#334155]">
              <h3 className="text-sm font-semibold text-[#F1F5F9]">Detalhamento por Hora</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Dados acumulados até {fmtHour(currentHour)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#334155]">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#64748B]">Hora</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#1877F2]">Meta</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#34A853]">Google</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#64748B]">Total</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#64748B]">%</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#64748B]">Leads</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#64748B]">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => {
                    const isCurrentHour = row.hour === currentHour
                    const pct = totalTableSpend > 0 ? (row.total_spend / totalTableSpend) * 100 : 0
                    return (
                      <tr
                        key={row.hour}
                        className={`border-b border-[#1E293B] transition ${
                          isCurrentHour
                            ? 'bg-[#1E3A5F] border-b-[#2563EB]'
                            : 'hover:bg-[#263548]'
                        }`}
                      >
                        <td className="px-4 py-2 font-mono text-xs text-[#94A3B8]">
                          {fmtHour(row.hour)}
                          {isCurrentHour && (
                            <span className="ml-1.5 text-[10px] text-[#3B82F6] font-semibold">◀ agora</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-[#1877F2]">
                          {row.meta_spend > 0 ? fmtBRL(row.meta_spend) : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-[#34A853]">
                          {row.google_spend > 0 ? fmtBRL(row.google_spend) : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-xs font-semibold text-[#F1F5F9]">
                          {row.total_spend > 0 ? fmtBRL(row.total_spend) : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-[#64748B]">
                          {pct > 0 ? `${pct.toFixed(1)}%` : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-[#94A3B8]">
                          {row.meta_leads > 0 ? fmtNum(row.meta_leads) : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-[#94A3B8]">
                          {row.google_conversions > 0 ? fmtNum(row.google_conversions, 1) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                  {tableRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-[#475569]">
                        Aguardando dados do dia...
                      </td>
                    </tr>
                  )}
                  {tableRows.length > 0 && (
                    <tr className="bg-[#263548] font-semibold">
                      <td className="px-4 py-2.5 text-xs text-[#F1F5F9]">Total</td>
                      <td className="px-4 py-2.5 text-right text-xs text-[#1877F2]">
                        {fmtBRL(tableRows.reduce((s, r) => s + r.meta_spend, 0))}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-[#34A853]">
                        {fmtBRL(tableRows.reduce((s, r) => s + r.google_spend, 0))}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-[#F1F5F9]">
                        {fmtBRL(totalTableSpend)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-[#64748B]">100%</td>
                      <td className="px-4 py-2.5 text-right text-xs text-[#F1F5F9]">
                        {fmtNum(tableRows.reduce((s, r) => s + r.meta_leads, 0))}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-[#F1F5F9]">
                        {fmtNum(tableRows.reduce((s, r) => s + r.google_conversions, 0), 1)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Projeção */}
          <div>
            <PaceTracker projection={data.projection} currentHour={currentHour} />
          </div>
        </div>

        {/* Comparativo */}
        <ComparativePanel
          today={totalsToday}
          yesterday={totalsYesterday}
          last_week={data.totals.last_week}
          currentHour={currentHour}
        />

      </div>
    </div>
  )
}
