'use client'
import { fmtBRL, fmtNum, fmtPct } from '@/lib/utils/formatters'
import type { HourlyTotals } from '@/hooks/useHourlyData'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ComparativePanelProps {
  today: HourlyTotals
  yesterday: HourlyTotals
  last_week: HourlyTotals
  currentHour: number
}

function delta(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

function DeltaCell({ value }: { value: number }) {
  const abs = Math.abs(value)
  const isPositive = value > 0
  const isNeutral = abs < 0.5

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#64748B]">
        <Minus size={10} />
        0%
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isPositive ? 'text-green-400' : 'text-red-400'
      }`}
    >
      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isPositive ? '+' : ''}{fmtPct(abs, 1)}
    </span>
  )
}

interface MetricRowProps {
  label: string
  today: string
  yesterday: string
  lastWeek: string
  deltaYesterday: number
  deltaLastWeek: number
  highlight?: boolean
}

function MetricRow({ label, today, yesterday, lastWeek, deltaYesterday, deltaLastWeek, highlight }: MetricRowProps) {
  return (
    <tr className={`border-b border-[#1E293B] ${highlight ? 'bg-[#263548]' : 'hover:bg-[#263548]'} transition`}>
      <td className="px-4 py-2.5 text-xs text-[#94A3B8] font-medium">{label}</td>
      <td className="px-4 py-2.5 text-xs text-right font-semibold text-[#F1F5F9]">{today}</td>
      <td className="px-4 py-2.5 text-xs text-right text-[#94A3B8]">{yesterday}</td>
      <td className="px-4 py-2.5 text-xs text-right">
        <DeltaCell value={deltaYesterday} />
      </td>
      <td className="px-4 py-2.5 text-xs text-right text-[#94A3B8]">{lastWeek}</td>
      <td className="px-4 py-2.5 text-xs text-right">
        <DeltaCell value={deltaLastWeek} />
      </td>
    </tr>
  )
}

export function ComparativePanel({ today, yesterday, last_week, currentHour }: ComparativePanelProps) {
  const hourLabel = String(currentHour).padStart(2, '0') + 'h'

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#334155]">
        <h3 className="text-sm font-semibold text-[#F1F5F9]">Comparativo</h3>
        <p className="text-xs text-[#64748B] mt-0.5">
          Hoje até {hourLabel} vs ontem {hourLabel} vs mesmo horário semana passada
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#64748B]">Métrica</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#3B82F6]">Hoje</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#64748B]">Ontem</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#64748B]">Δ</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#64748B]">Sem. passada</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#64748B]">Δ</th>
            </tr>
          </thead>
          <tbody>
            <MetricRow
              label="Investimento"
              today={fmtBRL(today.spend)}
              yesterday={fmtBRL(yesterday.spend)}
              lastWeek={fmtBRL(last_week.spend)}
              deltaYesterday={delta(today.spend, yesterday.spend)}
              deltaLastWeek={delta(today.spend, last_week.spend)}
              highlight
            />
            <MetricRow
              label="Impressões"
              today={fmtNum(today.impressions)}
              yesterday={fmtNum(yesterday.impressions)}
              lastWeek={fmtNum(last_week.impressions)}
              deltaYesterday={delta(today.impressions, yesterday.impressions)}
              deltaLastWeek={delta(today.impressions, last_week.impressions)}
            />
            <MetricRow
              label="Cliques"
              today={fmtNum(today.clicks)}
              yesterday={fmtNum(yesterday.clicks)}
              lastWeek={fmtNum(last_week.clicks)}
              deltaYesterday={delta(today.clicks, yesterday.clicks)}
              deltaLastWeek={delta(today.clicks, last_week.clicks)}
            />
            <MetricRow
              label="Leads (Meta)"
              today={fmtNum(today.leads)}
              yesterday={fmtNum(yesterday.leads)}
              lastWeek={fmtNum(last_week.leads)}
              deltaYesterday={delta(today.leads, yesterday.leads)}
              deltaLastWeek={delta(today.leads, last_week.leads)}
              highlight
            />
            <MetricRow
              label="Conversões (Google)"
              today={fmtNum(today.conversions, 1)}
              yesterday={fmtNum(yesterday.conversions, 1)}
              lastWeek={fmtNum(last_week.conversions, 1)}
              deltaYesterday={delta(today.conversions, yesterday.conversions)}
              deltaLastWeek={delta(today.conversions, last_week.conversions)}
            />
            <MetricRow
              label="CPL"
              today={today.cpl > 0 ? fmtBRL(today.cpl) : '—'}
              yesterday={yesterday.cpl > 0 ? fmtBRL(yesterday.cpl) : '—'}
              lastWeek={last_week.cpl > 0 ? fmtBRL(last_week.cpl) : '—'}
              deltaYesterday={today.cpl > 0 && yesterday.cpl > 0 ? delta(today.cpl, yesterday.cpl) : 0}
              deltaLastWeek={today.cpl > 0 && last_week.cpl > 0 ? delta(today.cpl, last_week.cpl) : 0}
            />
            <MetricRow
              label="CPM"
              today={today.cpm > 0 ? fmtBRL(today.cpm) : '—'}
              yesterday={yesterday.cpm > 0 ? fmtBRL(yesterday.cpm) : '—'}
              lastWeek={last_week.cpm > 0 ? fmtBRL(last_week.cpm) : '—'}
              deltaYesterday={today.cpm > 0 && yesterday.cpm > 0 ? delta(today.cpm, yesterday.cpm) : 0}
              deltaLastWeek={today.cpm > 0 && last_week.cpm > 0 ? delta(today.cpm, last_week.cpm) : 0}
            />
          </tbody>
        </table>
      </div>
    </div>
  )
}
