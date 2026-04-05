'use client'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { fmtBRL, fmtNum, fmtK } from '@/lib/utils/formatters'

interface BarChartProps {
  data: Record<string, unknown>[]
  xKey: string
  valueKey: string
  color?: string
  height?: number
  format?: 'brl' | 'number' | 'k'
  horizontal?: boolean
  label?: string
}

function formatValue(value: number, format?: string): string {
  if (format === 'brl') return fmtBRL(value)
  if (format === 'k') return fmtK(value)
  return fmtNum(value)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label, format }: any) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 shadow-xl text-sm">
      <p className="text-[#94A3B8] mb-1 font-medium truncate max-w-[200px]">{label}</p>
      <p className="text-[#F1F5F9] font-semibold">{formatValue(payload[0].value, format)}</p>
    </div>
  )
}

export function BarChart({
  data,
  xKey,
  valueKey,
  color = '#3B82F6',
  height = 280,
  format = 'number',
  horizontal = false,
  label,
}: BarChartProps) {
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

  // Sort by value descending
  const sorted = [...data].sort((a, b) => (b[valueKey] as number) - (a[valueKey] as number))

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#263548" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtK(v)}
          />
          <YAxis
            type="category"
            dataKey={xKey}
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={120}
            tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
          />
          <Tooltip content={<CustomTooltip format={format} />} cursor={{ fill: '#263548' }} />
          <Bar dataKey={valueKey} radius={[0, 4, 4, 0]} maxBarSize={24}>
            {sorted.map((_, i) => (
              <Cell
                key={i}
                fill={color}
                fillOpacity={1 - (i / sorted.length) * 0.4}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={sorted} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#263548" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fill: '#64748B', fontSize: 11 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={false}
          tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + '…' : v}
        />
        <YAxis
          tick={{ fill: '#64748B', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => fmtK(v)}
          width={50}
        />
        <Tooltip content={<CustomTooltip format={format} />} cursor={{ fill: '#263548' }} />
        <Bar dataKey={valueKey} name={label ?? valueKey} radius={[4, 4, 0, 0]} maxBarSize={40}>
          {sorted.map((_, i) => (
            <Cell
              key={i}
              fill={color}
              fillOpacity={1 - (i / sorted.length) * 0.3}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
