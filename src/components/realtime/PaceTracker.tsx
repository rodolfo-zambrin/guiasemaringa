'use client'
import { fmtBRL, fmtNum } from '@/lib/utils/formatters'
import type { HourlyProjection } from '@/hooks/useHourlyData'
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

interface PaceTrackerProps {
  projection: HourlyProjection
  currentHour: number
}

function ProjectionRow({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#334155] last:border-0">
      <span className="text-xs text-[#94A3B8]">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold text-[#F1F5F9]">{value}</span>
        {sub && <p className="text-xs text-[#64748B]">{sub}</p>}
      </div>
    </div>
  )
}

export function PaceTracker({ projection, currentHour }: PaceTrackerProps) {
  const {
    projected_spend,
    projected_leads,
    projected_conversions,
    projected_cpl,
    hourly_rate_spend,
    hours_remaining,
  } = projection

  const isEarlyHour = currentHour < 3

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-[#3B82F6]" />
        <h3 className="text-sm font-semibold text-[#F1F5F9]">Projeção do Dia</h3>
      </div>

      {isEarlyHour ? (
        <div className="flex items-start gap-2 text-xs text-[#64748B] bg-[#263548] rounded-lg p-3">
          <AlertTriangle size={14} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <span>Projeção disponível após as 03h — dados insuficientes para calcular tendência.</span>
        </div>
      ) : (
        <>
          <div className="space-y-0">
            <ProjectionRow
              label="Investimento projetado"
              value={fmtBRL(projected_spend)}
              sub={`Taxa: ${fmtBRL(hourly_rate_spend)}/h · ${hours_remaining}h restantes`}
            />
            {projected_leads > 0 && (
              <ProjectionRow
                label="Leads projetados (Meta)"
                value={fmtNum(projected_leads, 0)}
                sub={projected_cpl > 0 ? `CPL projetado: ${fmtBRL(projected_cpl)}` : undefined}
              />
            )}
            {projected_conversions > 0 && (
              <ProjectionRow
                label="Conversões projetadas (Google)"
                value={fmtNum(projected_conversions, 1)}
              />
            )}
          </div>

          <div className="mt-3 flex items-start gap-2 text-xs text-[#64748B] bg-[#263548] rounded-lg p-2.5">
            <CheckCircle size={13} className="text-green-400 flex-shrink-0 mt-0.5" />
            <span>Baseado na média das últimas 3 horas</span>
          </div>
        </>
      )}
    </div>
  )
}
