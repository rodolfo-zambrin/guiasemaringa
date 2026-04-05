'use client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react'

interface AdAccount {
  id: string
  client_id: string
  platform: 'meta' | 'google'
  account_id: string
  account_name: string
  is_active: boolean
}

interface Client { id: string; name: string; primary_color: string | null }

export default function ContasPage() {
  const supabase = createClient()
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'meta' | 'google'>('all')

  // New account form
  const [newClientId, setNewClientId] = useState('')
  const [newPlatform, setNewPlatform] = useState<'meta' | 'google'>('meta')
  const [newAccountId, setNewAccountId] = useState('')
  const [newAccountName, setNewAccountName] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('ad_accounts').select('*').order('platform').order('account_name'),
      supabase.from('clients').select('id,name,primary_color').eq('is_active', true).order('name'),
    ]).then(([{ data: a }, { data: c }]) => {
      setAccounts((a as AdAccount[]) ?? [])
      setClients((c as Client[]) ?? [])
      setLoading(false)
    })
  }, [])

  const displayed = accounts.filter(a => {
    const matchSearch = search === '' ||
      a.account_name.toLowerCase().includes(search.toLowerCase()) ||
      a.account_id.includes(search)
    const matchPlatform = filterPlatform === 'all' || a.platform === filterPlatform
    return matchSearch && matchPlatform
  })

  const metaCount = accounts.filter(a => a.platform === 'meta').length
  const googleCount = accounts.filter(a => a.platform === 'google').length

  async function toggle(accId: string, active: boolean) {
    await supabase.from('ad_accounts').update({ is_active: active }).eq('id', accId)
    setAccounts(prev => prev.map(a => a.id === accId ? { ...a, is_active: active } : a))
  }

  async function addAccount() {
    if (!newClientId) { toast.error('Selecione o cliente'); return }
    if (!newAccountId.trim()) { toast.error('Informe o ID da conta'); return }
    if (!newAccountName.trim()) { toast.error('Informe o nome da conta'); return }
    setAdding(true)
    const { data, error } = await supabase
      .from('ad_accounts')
      .insert({ client_id: newClientId, platform: newPlatform, account_id: newAccountId.trim(), account_name: newAccountName.trim() })
      .select()
      .single()
    if (error) {
      toast.error('Erro: ' + error.message)
    } else {
      setAccounts(prev => [...prev, data as AdAccount])
      setNewAccountId('')
      setNewAccountName('')
      toast.success('Conta adicionada!')
    }
    setAdding(false)
  }

  function clientName(clientId: string) {
    return clients.find(c => c.id === clientId)?.name ?? '—'
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Configurações — Contas de Anúncio" showPlatformSelector={false} />
      <div className="flex-1 p-6 max-w-5xl space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', count: accounts.length, color: 'text-[#94A3B8]' },
            { label: 'Meta Ads', count: metaCount, color: 'text-[#1877F2]' },
            { label: 'Google Ads', count: googleCount, color: 'text-[#34A853]' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-xs text-[#64748B] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros + lista */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#334155] flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-[#0F172A] border border-[#334155] rounded-lg px-3">
              <Search size={13} className="text-[#475569]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome ou ID..."
                className="flex-1 py-2 text-xs bg-transparent text-[#F1F5F9] outline-none"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'meta', 'google'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPlatform(p)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                    filterPlatform === p ? 'bg-[#3B82F6] text-white' : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-[#263548]'
                  }`}
                >
                  {p === 'all' ? 'Todas' : p === 'meta' ? 'Meta' : 'Google'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-[#263548] rounded shimmer" />)}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left text-xs font-semibold text-[#64748B] px-4 py-3">Conta</th>
                  <th className="text-left text-xs font-semibold text-[#64748B] px-4 py-3 hidden sm:table-cell">ID</th>
                  <th className="text-left text-xs font-semibold text-[#64748B] px-4 py-3 hidden md:table-cell">Cliente</th>
                  <th className="text-center text-xs font-semibold text-[#64748B] px-4 py-3">Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {displayed.map(acc => (
                  <tr key={acc.id} className="hover:bg-[#263548] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${acc.platform === 'meta' ? 'bg-[#1877F2]' : 'bg-[#34A853]'}`} />
                        <span className="text-sm font-medium text-[#F1F5F9]">{acc.account_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748B] font-mono hidden sm:table-cell">{acc.account_id}</td>
                    <td className="px-4 py-3 text-xs text-[#94A3B8] hidden md:table-cell">{clientName(acc.client_id)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggle(acc.id, !acc.is_active)}
                        className={`transition ${acc.is_active ? 'text-green-400 hover:text-red-400' : 'text-[#475569] hover:text-green-400'}`}
                        title={acc.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {acc.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                    </td>
                    <td className="px-2 py-3 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={async () => {
                          await supabase.from('ad_accounts').delete().eq('id', acc.id)
                          setAccounts(prev => prev.filter(a => a.id !== acc.id))
                          toast.success('Conta removida')
                        }}
                        className="p-1.5 text-[#475569] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {displayed.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-[#475569]">
                      {search ? 'Nenhuma conta encontrada' : 'Nenhuma conta cadastrada'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Adicionar conta */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Plus size={15} className="text-[#64748B]" />
            <h3 className="text-sm font-semibold text-[#F1F5F9]">Adicionar Conta</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <select
              value={newClientId}
              onChange={e => setNewClientId(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] focus:border-[#3B82F6] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] outline-none col-span-2 sm:col-span-1"
            >
              <option value="">— Cliente —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={newPlatform}
              onChange={e => setNewPlatform(e.target.value as 'meta' | 'google')}
              className="bg-[#0F172A] border border-[#334155] focus:border-[#3B82F6] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] outline-none"
            >
              <option value="meta">Meta Ads</option>
              <option value="google">Google Ads</option>
            </select>
            <input
              value={newAccountId}
              onChange={e => setNewAccountId(e.target.value)}
              placeholder="ID da conta"
              className="bg-[#0F172A] border border-[#334155] focus:border-[#3B82F6] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] font-mono outline-none"
            />
            <input
              value={newAccountName}
              onChange={e => setNewAccountName(e.target.value)}
              placeholder="Nome da conta"
              className="bg-[#0F172A] border border-[#334155] focus:border-[#3B82F6] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] outline-none"
            />
          </div>
          <button
            onClick={addAccount}
            disabled={adding}
            className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
          >
            <Plus size={14} />
            {adding ? 'Adicionando...' : 'Adicionar conta'}
          </button>
        </div>

      </div>
    </div>
  )
}
