'use client'

interface HealthScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

function getColor(score: number): string {
  if (score >= 70) return '#10B981'  // green
  if (score >= 40) return '#F59E0B'  // amber
  return '#EF4444'                    // red
}

function getLabel(score: number): string {
  if (score >= 80) return 'Excelente'
  if (score >= 70) return 'Bom'
  if (score >= 50) return 'Regular'
  if (score >= 40) return 'Atenção'
  return 'Crítico'
}

const SIZES = {
  sm: { radius: 28, stroke: 5, fontSize: 14, viewBox: 70 },
  md: { radius: 40, stroke: 7, fontSize: 20, viewBox: 96 },
  lg: { radius: 56, stroke: 9, fontSize: 26, viewBox: 130 },
}

export function HealthScoreGauge({ score, size = 'md', showLabel = true }: HealthScoreGaugeProps) {
  const s = SIZES[size]
  const clampedScore = Math.max(0, Math.min(100, score))
  const color = getColor(clampedScore)
  const label = getLabel(clampedScore)

  // SVG arc: only top 270° (from 135° to 405°)
  const circumference = 2 * Math.PI * s.radius
  const arcFraction = 0.75 // 270° / 360°
  const dashArray = circumference * arcFraction
  const dashOffset = dashArray * (1 - clampedScore / 100)

  const cx = s.viewBox / 2
  const cy = s.viewBox / 2

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={s.viewBox}
        height={s.viewBox}
        viewBox={`0 0 ${s.viewBox} ${s.viewBox}`}
        style={{ transform: 'rotate(135deg)' }}
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={s.radius}
          fill="none"
          stroke="#263548"
          strokeWidth={s.stroke}
          strokeDasharray={`${dashArray} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <circle
          cx={cx}
          cy={cy}
          r={s.radius}
          fill="none"
          stroke={color}
          strokeWidth={s.stroke}
          strokeDasharray={`${dashArray * (clampedScore / 100)} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      {/* Score number — centered over SVG */}
      <div
        className="flex flex-col items-center"
        style={{ marginTop: `-${s.viewBox * 0.55}px` }}
      >
        <span
          className="font-bold tabular-nums leading-none"
          style={{ fontSize: s.fontSize, color }}
        >
          {clampedScore}
        </span>
        <span className="text-[10px] text-[#64748B] leading-tight mt-0.5">/ 100</span>
      </div>
      {/* Spacer for the SVG bottom half */}
      <div style={{ height: s.viewBox * 0.2 }} />
      {showLabel && (
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
      )}
    </div>
  )
}
