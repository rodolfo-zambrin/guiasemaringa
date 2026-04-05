'use client'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { fmtBRL, fmtNum, fmtPct } from '@/lib/utils/formatters'

interface DonutData {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutData[]
  height?: number
  format?: 'brl' | 'number' | 'percent'
  showLegend?: boolean
  innerRadius?: number
  outerRadius?: number
}

function formatValue(value: number, format?: string): string {
  if (format === 'brl') return fmtBRL(value)
  if (format === 'percent') return fmtPct(value)
  return fmtNum(value)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, format }: any) => {
  if (!active || !payload || !payload.length) return null
  const entry = payload[0]
  const total = payload[0].payload?.total ?? 0
  const pct = total > 0 ? (entry.value / total) * 100 : 0

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 shadow-xl text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.payload.color }} />
        <span className="text-[#94A3B8] font-medium">{entry.name}</span>
      </div>
      <p className="text-[#F1F5F9] font-semibold">{formatValue(entry.value, format)}</p>
      <p className="text-[#64748B] text-xs">{fmtPct(pct, 1)} do total</p>
    </div>
  )
}

export function DonutChart({
  data,
  height = 280,
  format = 'number',
  showLegend = true,
  innerRadius = 60,
  outerRadius = 90,
}: DonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[#475569] text-sm"
        style={{ height }}
      >
        Sem dados para exibir
      </div>
    )
  }

  const total = data.reduce((acc, d) => acc + d.value, 0)
  const dataWithTotal = data.map((d) => ({ ...d, total }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={dataWithTotal}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={3}
          dataKey="value"
        >
          {dataWithTotal.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip format={format} />} />
        {showLegend && (
          <Legend
            formatter={(value: string) => (
              <span style={{ color: '#94A3B8', fontSize: '12px' }}>{value}</span>
            )}
            iconType="circle"
            iconSize={8}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  )
}
