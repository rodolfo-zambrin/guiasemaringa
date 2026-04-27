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
    <div className="glass-panel rounded-2xl p-5 space-y-3 overflow-hidden">
      <div className="h-3 w-20 bg-white/5 rounded shimmer" />
      <div className="h-7 w-28 bg-white/5 rounded shimmer" />
      <div className="h-3 w-14 bg-white/5 rounded shimmer" />
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
        'relative glass-panel rounded-2xl p-5 overflow-hidden group',
        'hover:border-white/20 hover:shadow-glass hover:-translate-y-1',
        'transition-all duration-300 cursor-default',
        className
      )}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl transition-all duration-300 opacity-80 group-hover:opacity-100 group-hover:h-[4px]"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          boxShadow: `0 2px 15px ${accentColor}40`
        }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <span className="text-[10px] font-bold text-[#475569] uppercase tracking-widest leading-snug pt-0.5">
          {label}
        </span>
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
            style={{
              backgroundColor: `${accentColor}15`,
              color: accentColor,
              boxShadow: `inset 0 0 10px ${accentColor}10`
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="text-[28px] font-extrabold text-white tracking-tight mb-2 drop-shadow-md">
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
