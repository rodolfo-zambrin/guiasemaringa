'use client'
import { useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { useDashboardStore } from '@/store/dashboardStore'
import { useMetaOverview } from '@/hooks/useMetaData'
import { useGoogleOverview } from '@/hooks/useGoogleData'
import { fmtBRL, fmtNum, fmtROAS } from '@/lib/utils/formatters'
import { META_ACCOUNT_NAMES, GOOGLE_ACCOUNT_NAMES, toClientName } from '@/lib/constants/accounts'
import { PlatformBadge } from '@/components/shared/PlatformBadge'
import { TrendingUp, DollarSign, Users } from 'lucide-react'

interface ClientSummary {
  name: string
  metaSpend: number
  googleSpend: number
  total: number
  leads: number
  conversions: number
  metaAccounts: number
  googleAccounts: number
}


export default function ClientesPage() {
  const { dateRange } = useDashboardStore()
  const { data: metaData, isLoading: metaLoading } = useMetaOverview(dateRange)
  const { data: googleData, isLoading: googleLoading } = useGoogleOverview(dateRange)
  const isLoading = metaLoading || googleLoading

  const clients = useMemo(() => {
    const map = new Map<string, ClientSummary>()

    for (const row of metaData ?? []) {
      const acctName = META_ACCOUNT_NAMES[row.account_id] ?? row.account_name ?? row.account_id
      const clientName = toClientName(acctName)
      const existing = map.get(clientName) ?? {
        name: clientName, metaSpend: 0, googleSpend: 0, total: 0,
        leads: 0, conversions: 0, metaAccounts: 0, googleAccounts: 0,
      }
      existing.metaSpend += row.spend ?? 0
      existing.leads += row.leads ?? 0
      existing.conversions += row.conversions ?? 0
      map.set(clientName, existing)
    }

    for (const row of googleData ?? []) {
      const acctName = GOOGLE_ACCOUNT_NAMES[row.account_id] ?? row.account_name ?? row.account_id
      const clientName = toClientName(acctName)
      const existing = map.get(clientName) ?? {
        name: clientName, metaSpend: 0, googleSpend: 0, total: 0,
        leads: 0, conversions: 0, metaAccounts: 0, googleAccounts: 0,
      }
      existing.googleSpend += row.spend ?? 0
      existing.conversions += row.conversions ?? 0
      map.set(clientName, existing)
    }

    return Array.from(map.values())
      .map((c) => ({ ...c, total: c.metaSpend + c.googleSpend }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [metaData, googleData])

  const grandTotal = useMemo(() => clients.reduce((acc, c) => acc + c.total, 0), [clients])

  return (
    <div className="flex flex-col flex-1">
      <Header title="Clientes" />
      <div className="flex-1 p-6 space-y-6">

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Users size={18} /></div>
            <div>
              <p className="text-xs text-[#64748B]">Clientes ativos</p>
              <p className="text-xl font-bold text-[#F1F5F9]">{clients.length}</p>
            </div>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><DollarSign size={18} /></div>
            <div>
              <p className="text-xs text-[#64748B]">Investimento total</p>
              <p className="text-xl font-bold text-[#F1F5F9]">{fmtBRL(grandTotal)}</p>
            </div>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><TrendingUp size={18} /></div>
            <div>
              <p className="text-xs text-[#64748B]">Ticket médio</p>
              <p className="text-xl font-bold text-[#F1F5F9]">{fmtBRL(clients.length > 0 ? grandTotal / clients.length : 0)}</p>
            </div>
          </div>
        </div>

        {/* Client cards grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-3">
                <div className="h-4 w-28 bg-[#263548] rounded shimmer" />
                <div className="h-6 w-36 bg-[#263548] rounded shimmer" />
                <div className="h-3 w-24 bg-[#263548] rounded shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {clients.map((client) => {
              const pct = grandTotal > 0 ? (client.total / grandTotal) * 100 : 0
              return (
                <div key={client.name} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 hover:border-[#475569] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-[#263548] flex items-center justify-center text-base font-bold text-[#3B82F6]">
                      {client.name.charAt(0)}
                    </div>
                    <span className="text-xs text-[#64748B]">{fmtNum(pct, 1)}% do total</span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#F1F5F9] mb-0.5">{client.name}</h3>
                  <p className="text-xl font-bold text-[#F1F5F9] mb-3">{fmtBRL(client.total)}</p>

                  <div className="space-y-1.5">
                    {client.metaSpend > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <PlatformBadge platform="meta" />
                          <span className="text-[#94A3B8]">Meta</span>
                        </div>
                        <span className="text-[#F1F5F9]">{fmtBRL(client.metaSpend)}</span>
                      </div>
                    )}
                    {client.googleSpend > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <PlatformBadge platform="google" />
                          <span className="text-[#94A3B8]">Google</span>
                        </div>
                        <span className="text-[#F1F5F9]">{fmtBRL(client.googleSpend)}</span>
                      </div>
                    )}
                  </div>

                  {/* Budget bar */}
                  <div className="mt-3">
                    <div className="w-full bg-[#263548] rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(pct * 3, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
