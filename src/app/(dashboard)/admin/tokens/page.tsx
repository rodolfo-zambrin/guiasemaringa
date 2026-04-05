'use client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { Save, Eye, EyeOff, Plus, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react'

interface AgencyToken {
  id?: string
  platform: string
  token_name: string
  access_token: string
  expires_at: string
  is_active: boolean
  notes: string
}

const AGENCY_ID = '00000000-0000-0000-0000-000000000001'

const PRESETS = [
  { platform: 'meta', token_name: 'Meta System User', notes: 'System User da MCC principal. Nunca expira.' },
  { platform: 'google', token_name: 'Google MCC', notes: 'Service Account ou OAuth do Manager Account.' },
]

export default function AdminTokensPage() {
  const supabase = createClient()
  const { profile } = useAuth()
  const [tokens, setTokens] = useState<AgencyToken[]>([])
  const [showToken, setShowToken] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('agency_api_tokens')
      .select('*')
      .eq('agency_id', AGENCY_ID)
      .order('platform')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTokens(data.map((t) => ({ ...t, expires_at: t.expires_at?.split('T')[0] ?? '' })))
        } else {
          // Pre-populate with presets if empty
          setTokens(PRESETS.map((p) => ({ ...p, access_token: '', expires_at: '', is_active: true })))
        }
      })
  }, [])

  function add() {
    setTokens((t) => [...t, { platform: 'meta', token_name: '', access_token: '', expires_at: '', is_active: true, notes: '' }])
  }

  function update(i: number, patch: Partial<AgencyToken>) {
    setTokens((t) => t.map((x, j) => j === i ? { ...x, ...patch } : x))
  }

  async function remove(i: number) {
    const token = tokens[i]
    if (token.id) {
      await supabase.from('agency_api_tokens').delete().eq('id', token.id)
      toast.success('Token removido')
    }
    setTokens((t) => t.filter((_, j) => j !== i))
  }

  async function saveAll() {
    setSaving(true)
    for (const token of tokens) {
      if (!token.access_token || !token.token_name) continue
      const payload = {
        agency_id: AGENCY_ID,
        platform: token.platform,
        token_name: token.token_name,
        access_token: token.access_token,
        expires_at: token.expires_at || null,
        is_active: token.is_active,
        notes: token.notes,
      }
      if (token.id) {
        await supabase.from('agency_api_tokens').update(payload).eq('id', token.id)
      } else {
        const { data } = await supabase.from('agency_api_tokens').insert(payload).select()
        if (data?.[0]) {
          setTokens((prev) => prev.map((t, j) => j === tokens.indexOf(token) ? { ...t, id: data[0].id } : t))
        }
      }
    }
    toast.success('Tokens da agência salvos!')
    setSaving(false)
  }

  if (profile?.role !== 'super_admin') {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Tokens da Agência" showPlatformSelector={false} />
        <div className="p-6 flex items-center gap-3 text-[#EF4444]">
          <AlertTriangle size={18} />
          <span className="text-sm">Acesso restrito a Super Admin.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Tokens da Agência" showPlatformSelector={false} />
      <div className="flex-1 p-6 max-w-3xl space-y-6">

        {/* Info card */}
        <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-4 flex gap-3">
          <ShieldCheck size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#94A3B8] space-y-1">
            <p className="font-medium text-blue-300">Tokens globais da agência</p>
            <p>Estes tokens são usados pelo N8N para extrair dados de todos os clientes da MCC. Clientes fora da MCC devem ter tokens próprios na aba de Tokens de cada cliente.</p>
          </div>
        </div>

        {/* Tokens list */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F1F5F9]">Tokens configurados</h3>
            <button
              onClick={add}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#263548] hover:bg-[#334155] text-[#94A3B8] text-xs rounded-lg transition"
            >
              <Plus size={12} /> Adicionar
            </button>
          </div>

          {tokens.map((token, i) => (
            <div key={i} className="bg-[#0F172A] border border-[#334155] rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#64748B] mb-1">Plataforma</label>
                  <select
                    value={token.platform}
                    onChange={(e) => update(i, { platform: e.target.value })}
                    className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none"
                  >
                    <option value="meta">Meta Ads</option>
                    <option value="google">Google Ads</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#64748B] mb-1">Nome do token</label>
                  <input
                    value={token.token_name}
                    onChange={(e) => update(i, { token_name: e.target.value })}
                    placeholder="ex: Meta System User MCC"
                    className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#64748B] mb-1">Access Token</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showToken[i] ? 'text' : 'password'}
                    value={token.access_token}
                    onChange={(e) => update(i, { access_token: e.target.value })}
                    placeholder="EAAxxxxxxx... ou ya29.xxxxx..."
                    className="flex-1 bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => setShowToken((s) => ({ ...s, [i]: !s[i] }))}
                    className="p-2 text-[#475569] hover:text-[#94A3B8] transition"
                  >
                    {showToken[i] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    onClick={() => remove(i)}
                    className="p-2 text-[#475569] hover:text-red-400 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#64748B] mb-1">Expira em (deixe vazio = nunca)</label>
                  <input
                    type="date"
                    value={token.expires_at}
                    onChange={(e) => update(i, { expires_at: e.target.value })}
                    className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#64748B] mb-1">Observações</label>
                  <input
                    value={token.notes}
                    onChange={(e) => update(i, { notes: e.target.value })}
                    placeholder="System User com permissão de leitura..."
                    className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => update(i, { is_active: !token.is_active })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${token.is_active ? 'bg-[#3B82F6]' : 'bg-[#334155]'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${token.is_active ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
                <label className="text-xs text-[#64748B]">Token ativo</label>
                {token.expires_at && new Date(token.expires_at) < new Date() && (
                  <span className="ml-2 flex items-center gap-1 text-xs text-[#EF4444]">
                    <AlertTriangle size={11} /> Expirado
                  </span>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
          >
            <Save size={14} />
            {saving ? 'Salvando...' : 'Salvar todos os tokens'}
          </button>
        </div>
      </div>
    </div>
  )
}
