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
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 space-y-3">
      <div className="h-4 w-24 bg-[#263548] rounded shimmer" />
      <div className="h-8 w-32 bg-[#263548] rounded shimmer" />
      <div className="h-4 w-16 bg-[#263548] rounded shimmer" />
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
}: MetricCardProps) {
  if (isLoading) return <SkeletonCard />

  return (
    <div
      className={cn(
        'bg-[#1E293B] border border-[#334155] rounded-xl p-5 hover:border-[#475569] transition-colors',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-sm text-[#94A3B8] font-medium leading-snug">{label}</span>
        {icon && (
          <div className="text-[#475569] flex-shrink-0 mt-0.5">{icon}</div>
        )}
      </div>

      <div className="text-2xl font-bold text-[#F1F5F9] tracking-tight mb-2">
        {formatValue(value, format)}
      </div>

      <div className="flex items-center gap-2">
        {delta !== undefined && (
          <DeltaBadge value={delta} invertColors={invertDelta} />
        )}
        {description && (
          <span className="text-xs text-[#64748B]">{description}</span>
        )}
      </div>
    </div>
  )
}
