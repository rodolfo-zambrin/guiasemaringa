'use client'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useState } from 'react'
import { fmtBRL, fmtNum, fmtK, fmtHour } from '@/lib/utils/formatters'
import type { HourlyRow } from '@/hooks/useHourlyData'

type Metric = 'spend' | 'impressions' | 'clicks' | 'leads'

interface HourlyChartProps {
  today: HourlyRow[]
  yesterday: HourlyRow[]
  last_week: HourlyRow[]
  currentHour: number
  height?: number
}

const METRICS: { key: Metric; label: string; format: 'brl' | 'k' }[] = [
  { key: 'spend',       label: 'Investimento', format: 'brl' },
  { key: 'impressions', label: 'Impressões',   format: 'k' },
  { key: 'clicks',      label: 'Cliques',      format: 'k' },
  { key: 'leads',       label: 'Leads',        format: 'k' },
]

function getValue(row: HourlyRow, metric: Metric): number {
  switch (metric) {
    case 'spend':       return row.total_spend
    case 'impressions': return row.meta_impressions + row.google_impressions
    case 'clicks':      return row.total_clicks
    case 'leads':       return row.meta_leads
  }
}

function fmt(value: number, format: 'brl' | 'k'): string {
  return format === 'brl' ? fmtBRL(value) : fmtNum(value)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label, metricFmt }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 shadow-xl text-sm min-w-[160px]">
      <p className="text-[#94A3B8] mb-2 font-medium">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[#64748B] text-xs">{entry.name}</span>
          </div>
          <span className="text-[#F1F5F9] font-semibold text-xs">
            {fmt(entry.value, metricFmt)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function HourlyChart({
  today,
  yesterday,
  last_week,
  currentHour,
  height = 300,
}: HourlyChartProps) {
  const [activeMetric, setActiveMetric] = useState<Metric>('spend')
  const metricDef = METRICS.find((m) => m.key === activeMetric)!

  const data = Array.from({ length: 24 }, (_, h) => ({
    hour: fmtHour(h),
    hoje: getValue(today[h] ?? { hour: h, meta_spend: 0, meta_impressions: 0, meta_clicks: 0, meta_leads: 0, meta_purchases: 0, meta_messaging_starts: 0, google_spend: 0, google_impressions: 0, google_clicks: 0, google_conversions: 0, total_spend: 0, total_clicks: 0 }, activeMetric),
    ontem: getValue(yesterday[h] ?? { hour: h, meta_spend: 0, meta_impressions: 0, meta_clicks: 0, meta_leads: 0, meta_purchases: 0, meta_messaging_starts: 0, google_spend: 0, google_impressions: 0, google_clicks: 0, google_conversions: 0, total_spend: 0, total_clicks: 0 }, activeMetric),
    semana_passada: getValue(last_week[h] ?? { hour: h, meta_spend: 0, meta_impressions: 0, meta_clicks: 0, meta_leads: 0, meta_purchases: 0, meta_messaging_starts: 0, google_spend: 0, google_impressions: 0, google_clicks: 0, google_conversions: 0, total_spend: 0, total_clicks: 0 }, activeMetric),
  }))

  return (
    <div>
      {/* Tab seletor de métrica */}
      <div className="flex gap-1 mb-4">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              activeMetric === m.key
                ? 'bg-[#3B82F6] text-white'
                : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-[#263548]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-hoje" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-ontem" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#263548" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtK(v)}
            width={48}
          />
          <Tooltip
            content={<CustomTooltip metricFmt={metricDef.format} />}
          />
          <Legend
            wrapperStyle={{ paddingTop: '12px' }}
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                hoje: 'Hoje',
                ontem: 'Ontem',
                semana_passada: 'Semana passada',
              }
              return <span style={{ color: '#94A3B8', fontSize: '11px' }}>{labels[value] ?? value}</span>
            }}
          />
          {/* Linha da hora atual */}
          <ReferenceLine
            x={fmtHour(currentHour)}
            stroke="#F59E0B"
            strokeDasharray="4 2"
            strokeWidth={1.5}
            label={{ value: 'Agora', position: 'top', fill: '#F59E0B', fontSize: 10 }}
          />
          <Area
            type="monotone"
            dataKey="semana_passada"
            name="semana_passada"
            stroke="#475569"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            fill="none"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="ontem"
            name="ontem"
            stroke="#94A3B8"
            strokeWidth={1.5}
            fill="url(#grad-ontem)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="hoje"
            name="hoje"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#grad-hoje)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
