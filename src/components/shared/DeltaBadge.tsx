import { cn } from '@/lib/utils/cn'
import { fmtPct } from '@/lib/utils/formatters'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface DeltaBadgeProps {
  value: number
  invertColors?: boolean
  size?: 'sm' | 'md'
  showIcon?: boolean
}

export function DeltaBadge({ value, invertColors = false, size = 'sm', showIcon = true }: DeltaBadgeProps) {
  if (value == null || isNaN(value)) return null

  const isPositive = value > 0
  const isZero = Math.abs(value) < 0.01

  // For metrics where lower is better (CPM, CPA, CPL), invert the color logic
  const isGood = invertColors ? !isPositive : isPositive

  const colorClass = isZero
    ? 'text-[#94A3B8] bg-[#94A3B8]/10'
    : isGood
      ? 'text-[#10B981] bg-[#10B981]/10'
      : 'text-[#EF4444] bg-[#EF4444]/10'

  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'

  const sign = isPositive ? '+' : ''
  const formattedValue = `${sign}${fmtPct(value, 1)}`

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full font-medium',
        colorClass,
        sizeClass
      )}
    >
      {showIcon && !isZero && (
        isPositive
          ? <TrendingUp size={10} />
          : <TrendingDown size={10} />
      )}
      {showIcon && isZero && <Minus size={10} />}
      {formattedValue}
    </span>
  )
}
