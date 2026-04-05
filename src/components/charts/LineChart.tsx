'use client'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { fmtBRL, fmtNum, fmtK } from '@/lib/utils/formatters'

interface LineKey {
  key: string
  color: string
  label: string
  format?: 'brl' | 'number' | 'k'
  dashed?: boolean
}

interface LineChartProps {
  data: Record<string, unknown>[]
  lines: LineKey[]
  xKey: string
  height?: number
  formatXAxis?: (value: string) => string
  referenceLines?: { value: number; label?: string; color?: string }[]
}

function formatValue(value: number, format?: string): string {
  if (format === 'brl') return fmtBRL(value)
  if (format === 'k') return fmtK(value)
  return fmtNum(value)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label, lines }: any) => {
  if (!active || !payload || !payload.length) return null

  const lineMap = Object.fromEntries(lines.map((l: LineKey) => [l.key, l]))

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 shadow-xl text-sm">
      <p className="text-[#94A3B8] mb-2 font-medium">{label}</p>
      {payload.map((entry: { dataKey: string; value: number; color: string }) => {
        const line = lineMap[entry.dataKey]
        return (
          <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[#94A3B8]">{line?.label ?? entry.dataKey}:</span>
            <span className="text-[#F1F5F9] font-semibold">
              {formatValue(entry.value, line?.format)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function LineChart({
  data,
  lines,
  xKey,
  height = 280,
  formatXAxis,
  referenceLines,
}: LineChartProps) {
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

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#263548" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fill: '#64748B', fontSize: 11 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={false}
          tickFormatter={formatXAxis}
        />
        <YAxis
          tick={{ fill: '#64748B', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => fmtK(v)}
          width={50}
        />
        <Tooltip content={<CustomTooltip lines={lines} />} />
        {lines.length > 1 && (
          <Legend
            wrapperStyle={{ paddingTop: '12px' }}
            formatter={(value: string) => {
              const l = lines.find((ln) => ln.key === value)
              return <span style={{ color: '#94A3B8', fontSize: '12px' }}>{l?.label ?? value}</span>
            }}
          />
        )}
        {referenceLines?.map((rl, i) => (
          <ReferenceLine
            key={i}
            y={rl.value}
            stroke={rl.color ?? '#475569'}
            strokeDasharray="4 4"
            label={{ value: rl.label, fill: '#64748B', fontSize: 10 }}
          />
        ))}
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.key}
            stroke={line.color}
            strokeWidth={2}
            strokeDasharray={line.dashed ? '5 5' : undefined}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
