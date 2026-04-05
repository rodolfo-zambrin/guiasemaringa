'use client'
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { fmtBRL, fmtNum, fmtK } from '@/lib/utils/formatters'

interface DataKey {
  key: string
  color: string
  label: string
  format?: 'brl' | 'number' | 'k'
}

interface AreaChartProps {
  data: Record<string, unknown>[]
  dataKeys: DataKey[]
  xKey: string
  height?: number
  formatXAxis?: (value: string) => string
}

function formatTooltipValue(value: number, format?: string): string {
  if (format === 'brl') return fmtBRL(value)
  if (format === 'k') return fmtK(value)
  return fmtNum(value)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label, dataKeys }: any) => {
  if (!active || !payload || !payload.length) return null

  const keyMap = Object.fromEntries(dataKeys.map((dk: DataKey) => [dk.key, dk]))

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 shadow-xl text-sm">
      <p className="text-[#94A3B8] mb-2 font-medium">{label}</p>
      {payload.map((entry: { dataKey: string; value: number; color: string }) => {
        const dk = keyMap[entry.dataKey]
        return (
          <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[#94A3B8]">{dk?.label ?? entry.dataKey}:</span>
            <span className="text-[#F1F5F9] font-semibold">
              {formatTooltipValue(entry.value, dk?.format)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function AreaChart({ data, dataKeys, xKey, height = 280, formatXAxis }: AreaChartProps) {
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
      <RechartsAreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          {dataKeys.map((dk) => (
            <linearGradient key={dk.key} id={`grad-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={dk.color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
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
        <Tooltip content={<CustomTooltip dataKeys={dataKeys} />} />
        {dataKeys.length > 1 && (
          <Legend
            wrapperStyle={{ paddingTop: '12px' }}
            formatter={(value: string) => {
              const dk = dataKeys.find((d) => d.key === value)
              return <span style={{ color: '#94A3B8', fontSize: '12px' }}>{dk?.label ?? value}</span>
            }}
          />
        )}
        {dataKeys.map((dk) => (
          <Area
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.key}
            stroke={dk.color}
            strokeWidth={2}
            fill={`url(#grad-${dk.key})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
