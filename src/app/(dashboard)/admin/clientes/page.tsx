'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/client'
import { fmtBRL } from '@/lib/utils/formatters'
import { Plus, ChevronRight, Circle } from 'lucide-react'

interface Client {
  id: string
  name: string
  slug: string
  industry: string | null
  website: string | null
  monthly_budget: number | null
  is_active: boolean
  primary_color: string | null
}

export default function AdminClientesPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('clients')
      .select('id, name, slug, industry, website, monthly_budget, is_active, primary_color')
      .order('name')
      .then(({ data }) => {
        setClients((data as Client[]) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="flex flex-col flex-1">
      <Header title="Admin — Clientes" showPlatformSelector={false} />
      <div className="flex-1 p-6 max-w-4xl space-y-4">

        <div className="flex items-center justify-between">
          <p className="text-sm text-[#64748B]">{clients.length} clientes cadastrados</p>
          <Link
            href="/admin/clientes/novo"
            className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-medium rounded-lg transition"
          >
            <Plus size={14} />
            Novo cliente
          </Link>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-[#263548] rounded-lg shimmer" />
              ))}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left text-xs font-semibold text-[#64748B] px-4 py-3">Cliente</th>
                  <th className="text-left text-xs font-semibold text-[#64748B] px-4 py-3 hidden sm:table-cell">Segmento</th>
                  <th className="text-left text-xs font-semibold text-[#64748B] px-4 py-3 hidden md:table-cell">Budget mensal</th>
                  <th className="text-left text-xs font-semibold text-[#64748B] px-4 py-3">Status</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-[#263548] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: c.primary_color ?? '#3B82F6' }}
                        >
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#F1F5F9]">{c.name}</p>
                          <p className="text-xs text-[#475569]">{c.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#94A3B8] hidden sm:table-cell">
                      {c.industry ?? <span className="text-[#475569]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#94A3B8] hidden md:table-cell">
                      {c.monthly_budget ? fmtBRL(c.monthly_budget) : <span className="text-[#475569]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                        c.is_active
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-gray-800 text-gray-500'
                      }`}>
                        <Circle size={6} fill="currentColor" />
                        {c.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="p-1.5 rounded-lg text-[#475569] hover:text-[#94A3B8] hover:bg-[#334155] transition opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
