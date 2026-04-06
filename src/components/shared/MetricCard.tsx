import { cn } from '@/lib/utils/cn'
import { DeltaBadge } from './DeltaBadge'
import { fmtBRL, fmtNum, fmtPct, fmtROAS } from '@/lib/utils/formatters'

interface MetricCardProps {
  label: string
  value: number | null | undefined
  format: 'brl' | 'number' | 'percent' | 'roas' | 'multiplier'
  delta?: number
  invertDelta?: boolean
  icon?: React.ReactNode
  isLoading?: boolean
  description?: string
  className?: string
  accentColor?: string
}

function formatValue(value: number | null | undefined, format: string): string {
  if (value == null || isNaN(value as number)) {
    switch (format) {
      case 'brl': return 'R$ 0,00'
      case 'percent': return '0,00%'
      case 'roas':
      case 'multiplier': return '0,00x'
      default: return '0'
    }
  }
  switch (format) {
    case 'brl': return fmtBRL(value as number)
    case 'percent': return fmtPct(value as number)
    case 'roas':
    case 'multiplier': return fmtROAS(value as number)
    default: return fmtNum(value as number)
  }
}

function SkeletonCard() {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 space-y-3 overflow-hidden">
      <div className="h-3 w-20 bg-[#263548] rounded shimmer" />
      <div className="h-7 w-28 bg-[#263548] rounded shimmer" />
      <div className="h-3 w-14 bg-[#263548] rounded shimmer" />
    </div>
  )
}

export function MetricCard({
  label,
  value,
  format,
  delta,
  invertDelta = false,
  icon,
  isLoading = false,
  description,
  className,
  accentColor = '#3B82F6',
}: MetricCardProps) {
  if (isLoading) return <SkeletonCard />

  return (
    <div
      className={cn(
        'relative bg-[#1E293B] border border-[#334155] rounded-xl p-5 overflow-hidden',
        'hover:border-[#475569] hover:shadow-lg hover:shadow-black/30',
        'transition-all duration-200 cursor-default',
        className
      )}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}60)`,
        }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <span className="text-[10px] font-bold text-[#475569] uppercase tracking-widest leading-snug pt-0.5">
          {label}
        </span>
        {icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: `${accentColor}18`,
              color: accentColor,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-[#F1F5F9] tracking-tight mb-2">
        {formatValue(value, format)}
      </div>

      {/* Delta / description */}
      <div className="flex items-center gap-2 min-h-[20px]">
        {delta !== undefined && (
          <DeltaBadge value={delta} invertColors={invertDelta} />
        )}
        {description && (
          <span className="text-xs text-[#475569]">{description}</span>
        )}
      </div>
    </div>
  )
}
