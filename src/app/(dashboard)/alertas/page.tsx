'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { PlatformBadge } from '@/components/shared/PlatformBadge'
import { useAlerts } from '@/hooks/useAlerts'
import { createClient } from '@/lib/supabase/client'
import { fmtDate } from '@/lib/utils/formatters'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Bell } from 'lucide-react'
import { toast } from 'sonner'

const SEVERITY_CONFIG = {
  critical: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Crítico' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Atenção' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Info' },
}

export default function AlertasPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')
  const [showResolved, setShowResolved] = useState(false)

  const { data, isLoading } = useAlerts({ resolved: showResolved || undefined })

  const displayed = filter === 'all'
    ? (data?.all ?? [])
    : (data?.[filter] ?? [])

  async function resolveAlert(id: string) {
    const { error } = await supabase
      .from('alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error('Erro ao resolver alerta')
    } else {
      toast.success('Alerta resolvido')
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['alert-count'] })
    }
  }

  const counts = {
    critical: data?.critical.length ?? 0,
    warning: data?.warning.length ?? 0,
    info: data?.info.length ?? 0,
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Alertas" showPlatformSelector={false} />
      <div className="flex-1 p-6 space-y-6">

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(['all', 'critical', 'warning', 'info'] as const).map((f) => {
              const isActive = filter === f
              const count = f === 'all' ? (data?.all.length ?? 0) : counts[f]
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-[#3B82F6] text-white'
                      : 'bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  {f === 'critical' && <AlertCircle size={12} />}
                  {f === 'warning' && <AlertTriangle size={12} />}
                  {f === 'info' && <Info size={12} />}
                  {f === 'all' ? 'Todos' : SEVERITY_CONFIG[f].label}
                  <span className="bg-[#263548] text-[#94A3B8] px-1.5 py-0.5 rounded-full text-[10px]">{count}</span>
                </button>
              )
            })}
          </div>
          <label className="flex items-center gap-2 text-xs text-[#94A3B8] cursor-pointer">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded border-[#334155] bg-[#1E293B]"
            />
            Mostrar resolvidos
          </label>
        </div>

        {/* Alerts list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#263548] shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-[#263548] rounded shimmer" />
                  <div className="h-3 w-2/3 bg-[#263548] rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-12 text-center">
            <Bell size={40} className="text-[#334155] mx-auto mb-3" />
            <p className="text-[#94A3B8] font-medium">Nenhum alerta encontrado</p>
            <p className="text-xs text-[#64748B] mt-1">
              {filter !== 'all' ? 'Tente alterar o filtro acima' : 'Tudo sob controle!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((alert) => {
              const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info
              const Icon = cfg.icon
              return (
                <div
                  key={alert.id}
                  className={`bg-[#1E293B] border ${alert.resolved ? 'border-[#334155] opacity-50' : cfg.border} rounded-xl p-4 flex items-start gap-3`}
                >
                  <div className={`p-2 ${cfg.bg} rounded-lg flex-shrink-0`}>
                    <Icon size={16} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold uppercase ${cfg.color}`}>{cfg.label}</span>
                      {alert.platform && <PlatformBadge platform={alert.platform as 'meta' | 'google'} />}
                      {alert.account_name && (
                        <span className="text-xs text-[#64748B]">· {alert.account_name}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#F1F5F9]">{alert.message}</p>
                    <p className="text-xs text-[#64748B] mt-1">{fmtDate(alert.created_at)}</p>
                  </div>
                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="flex-shrink-0 p-1.5 rounded-lg text-[#475569] hover:text-green-400 hover:bg-green-500/10 transition"
                      title="Marcar como resolvido"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
