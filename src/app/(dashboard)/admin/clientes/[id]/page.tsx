'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ArrowLeft, Save, Plus, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string; name: string; slug: string; industry: string; website: string
  notes: string; monthly_budget: string; primary_color: string; is_active: boolean
}

interface AdAccount {
  id: string; platform: string; account_id: string; account_name: string; is_active: boolean
}

interface ApiToken {
  id?: string; platform: string; token_name: string; access_token: string
  expires_at: string; is_active: boolean; notes: string
}

interface Goal {
  id?: string; year: number; month: number; platform: string
  goal_spend: string; goal_leads: string; goal_cpl: string
  goal_conversions: string; goal_cpa: string; goal_revenue: string; goal_roas: string
}

interface ConversionEvent {
  id?: string; platform: string; action_type: string; label: string
  counts_as: string; is_primary: boolean
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const PLATFORMS = [{ value: 'meta', label: 'Meta Ads' }, { value: 'google', label: 'Google Ads' }]

// ─── Tab components ───────────────────────────────────────────────────────────

function TabDados({ client, onChange, onSave, saving }: {
  client: Client; onChange: (f: Partial<Client>) => void
  onSave: () => void; saving: boolean
}) {
  const f = (label: string, field: keyof Client, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">{label}</label>
      <input
        type={type}
        value={String(client[field] ?? '')}
        onChange={(e) => onChange({ [field]: e.target.value })}
        placeholder={placeholder}
        className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6]"
      />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {f('Nome', 'name', 'text', 'Nome do cliente')}
        {f('Slug (URL)', 'slug', 'text', 'ex: vida-animal')}
        {f('Segmento / Indústria', 'industry', 'text', 'ex: Educação, Pet, Varejo...')}
        {f('Website', 'website', 'url', 'https://')}
        {f('Budget mensal (R$)', 'monthly_budget', 'number', '0,00')}
        <div>
          <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Cor principal</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={client.primary_color || '#3B82F6'}
              onChange={(e) => onChange({ primary_color: e.target.value })}
              className="h-9 w-14 rounded border border-[#334155] bg-[#0F172A] cursor-pointer"
            />
            <span className="text-sm text-[#64748B]">{client.primary_color}</span>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Observações</label>
        <textarea
          value={client.notes ?? ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Notas internas sobre o cliente..."
          className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6] resize-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-[#94A3B8]">Cliente ativo</label>
        <button
          onClick={() => onChange({ is_active: !client.is_active })}
          className={`relative w-10 h-5 rounded-full transition-colors ${client.is_active ? 'bg-[#3B82F6]' : 'bg-[#334155]'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${client.is_active ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
      >
        <Save size={14} />
        {saving ? 'Salvando...' : 'Salvar dados'}
      </button>
    </div>
  )
}

function TabTokens({ clientId, accounts }: { clientId: string; accounts: AdAccount[] }) {
  const supabase = createClient()
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [showToken, setShowToken] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('client_api_tokens').select('*').eq('client_id', clientId)
      .then(({ data }) => setTokens((data as ApiToken[]) ?? []))
  }, [clientId])

  function addToken() {
    setTokens((t) => [...t, { platform: 'meta', token_name: 'default', access_token: '', expires_at: '', is_active: true, notes: '' }])
  }

  function update(i: number, patch: Partial<ApiToken>) {
    setTokens((t) => t.map((x, j) => j === i ? { ...x, ...patch } : x))
  }

  async function saveAll() {
    setSaving(true)
    for (const token of tokens) {
      if (!token.access_token) continue
      const payload = {
        client_id: clientId,
        platform: token.platform,
        token_name: token.token_name,
        access_token: token.access_token,
        expires_at: token.expires_at || null,
        is_active: token.is_active,
        notes: token.notes,
      }
      if (token.id) {
        await supabase.from('client_api_tokens').update(payload).eq('id', token.id)
      } else {
        await supabase.from('client_api_tokens').insert(payload)
      }
    }
    toast.success('Tokens salvos!')
    setSaving(false)
  }

  async function remove(i: number) {
    const token = tokens[i]
    if (token.id) await supabase.from('client_api_tokens').delete().eq('id', token.id)
    setTokens((t) => t.filter((_, j) => j !== i))
  }

  return (
    <div className="space-y-6">
      {/* Ad accounts linked */}
      <div>
        <h4 className="text-sm font-semibold text-[#F1F5F9] mb-3">Contas de anúncio vinculadas</h4>
        <div className="space-y-2">
          {accounts.length === 0 ? (
            <p className="text-sm text-[#475569]">Nenhuma conta vinculada.</p>
          ) : accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${a.platform === 'meta' ? 'bg-blue-400' : 'bg-green-400'}`} />
                <div>
                  <p className="text-sm text-[#F1F5F9]">{a.account_name}</p>
                  <p className="text-xs text-[#64748B]">{a.account_id}</p>
                </div>
              </div>
              <span className="text-xs text-[#475569] uppercase">{a.platform}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Client token overrides */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-[#F1F5F9]">Tokens de API do cliente</h4>
            <p className="text-xs text-[#64748B] mt-0.5">Para clientes fora da MCC. Se vazio, usa o token global da agência.</p>
          </div>
          <button onClick={addToken} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#263548] hover:bg-[#334155] text-[#94A3B8] text-xs rounded-lg transition">
            <Plus size={12} /> Adicionar
          </button>
        </div>

        {tokens.length === 0 ? (
          <p className="text-sm text-[#475569]">Nenhum token específico. Usando token global da agência.</p>
        ) : (
          <div className="space-y-3">
            {tokens.map((token, i) => (
              <div key={i} className="bg-[#0F172A] border border-[#334155] rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#64748B] mb-1">Plataforma</label>
                    <select
                      value={token.platform}
                      onChange={(e) => update(i, { platform: e.target.value })}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded px-2 py-1.5 text-sm text-[#F1F5F9] focus:outline-none"
                    >
                      {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#64748B] mb-1">Nome do token</label>
                    <input
                      value={token.token_name}
                      onChange={(e) => update(i, { token_name: e.target.value })}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded px-2 py-1.5 text-sm text-[#F1F5F9] focus:outline-none"
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
                      placeholder="EAAxxxxxxx..."
                      className="flex-1 bg-[#1E293B] border border-[#334155] rounded px-2 py-1.5 text-sm text-[#F1F5F9] font-mono focus:outline-none"
                    />
                    <button onClick={() => setShowToken((s) => ({ ...s, [i]: !s[i] }))} className="p-1.5 text-[#64748B] hover:text-[#94A3B8]">
                      {showToken[i] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => remove(i)} className="p-1.5 text-[#475569] hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#64748B] mb-1">Expira em (opcional)</label>
                    <input
                      type="date"
                      value={token.expires_at?.split('T')[0] ?? ''}
                      onChange={(e) => update(i, { expires_at: e.target.value })}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded px-2 py-1.5 text-sm text-[#F1F5F9] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#64748B] mb-1">Observações</label>
                    <input
                      value={token.notes}
                      onChange={(e) => update(i, { notes: e.target.value })}
                      placeholder="ex: token do João"
                      className="w-full bg-[#1E293B] border border-[#334155] rounded px-2 py-1.5 text-sm text-[#F1F5F9] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tokens.length > 0 && (
          <button
            onClick={saveAll}
            disabled={saving}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
          >
            <Save size={14} />
            {saving ? 'Salvando...' : 'Salvar tokens'}
          </button>
        )}
      </div>
    </div>
  )
}

function TabMetas({ clientId }: { clientId: string }) {
  const supabase = createClient()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [platform, setPlatform] = useState('all')
  const [goals, setGoals] = useState<Goal[]>([])
  const [saving, setSaving] = useState(false)

  const emptyGoal = (month: number): Goal => ({
    year, month, platform,
    goal_spend: '', goal_leads: '', goal_cpl: '',
    goal_conversions: '', goal_cpa: '', goal_revenue: '', goal_roas: '',
  })

  useEffect(() => {
    supabase.from('client_goals')
      .select('*')
      .eq('client_id', clientId)
      .eq('year', year)
      .eq('platform', platform)
      .then(({ data }) => {
        const existing = (data ?? []) as Goal[]
        const full = Array.from({ length: 12 }, (_, i) => {
          const found = existing.find((g) => g.month === i + 1)
          return found ? {
            ...found,
            goal_spend: found.goal_spend?.toString() ?? '',
            goal_leads: found.goal_leads?.toString() ?? '',
            goal_cpl: found.goal_cpl?.toString() ?? '',
            goal_conversions: found.goal_conversions?.toString() ?? '',
            goal_cpa: found.goal_cpa?.toString() ?? '',
            goal_revenue: found.goal_revenue?.toString() ?? '',
            goal_roas: found.goal_roas?.toString() ?? '',
          } : emptyGoal(i + 1)
        })
        setGoals(full)
      })
  }, [clientId, year, platform])

  function updateGoal(month: number, field: keyof Goal, value: string) {
    setGoals((g) => g.map((row) => row.month === month ? { ...row, [field]: value } : row))
  }

  async function saveGoals() {
    setSaving(true)
    for (const g of goals) {
      const num = (v: string) => v === '' ? null : Number(v)
      const payload = {
        client_id: clientId, year: g.year, month: g.month, platform: g.platform,
        goal_spend: num(g.goal_spend), goal_leads: num(g.goal_leads), goal_cpl: num(g.goal_cpl),
        goal_conversions: num(g.goal_conversions), goal_cpa: num(g.goal_cpa),
        goal_revenue: num(g.goal_revenue), goal_roas: num(g.goal_roas),
      }
      if (g.id) {
        await supabase.from('client_goals').update(payload).eq('id', g.id)
      } else if (Object.values(payload).some((v) => v !== null && v !== undefined && v !== clientId && typeof v !== 'number' || (typeof v === 'number' && !isNaN(v)))) {
        await supabase.from('client_goals').upsert({ ...payload }, { onConflict: 'client_id,year,month,platform' })
      }
    }
    toast.success('Metas salvas!')
    setSaving(false)
  }

  const numInput = (month: number, field: keyof Goal, placeholder: string) => (
    <input
      type="number"
      value={goals.find((g) => g.month === month)?.[field] ?? ''}
      onChange={(e) => updateGoal(month, field, e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-2 py-1 text-xs text-[#F1F5F9] placeholder-[#334155] focus:outline-none focus:border-[#3B82F6] text-right"
    />
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none"
        >
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none"
        >
          <option value="all">Geral (todos os veículos)</option>
          <option value="meta">Meta Ads</option>
          <option value="google">Google Ads</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="text-left text-[#64748B] py-2 px-2 font-semibold w-16">Mês</th>
              <th className="text-right text-[#64748B] py-2 px-2 font-semibold">Invest. (R$)</th>
              <th className="text-right text-[#64748B] py-2 px-2 font-semibold">Leads</th>
              <th className="text-right text-[#64748B] py-2 px-2 font-semibold">CPL (R$)</th>
              <th className="text-right text-[#64748B] py-2 px-2 font-semibold">Conversões</th>
              <th className="text-right text-[#64748B] py-2 px-2 font-semibold">CPA (R$)</th>
              <th className="text-right text-[#64748B] py-2 px-2 font-semibold">Receita (R$)</th>
              <th className="text-right text-[#64748B] py-2 px-2 font-semibold">ROAS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {MONTHS.map((label, i) => (
              <tr key={i} className="hover:bg-[#263548]/50">
                <td className="py-1.5 px-2 text-[#94A3B8] font-medium">{label}</td>
                <td className="py-1 px-1">{numInput(i + 1, 'goal_spend', '—')}</td>
                <td className="py-1 px-1">{numInput(i + 1, 'goal_leads', '—')}</td>
                <td className="py-1 px-1">{numInput(i + 1, 'goal_cpl', '—')}</td>
                <td className="py-1 px-1">{numInput(i + 1, 'goal_conversions', '—')}</td>
                <td className="py-1 px-1">{numInput(i + 1, 'goal_cpa', '—')}</td>
                <td className="py-1 px-1">{numInput(i + 1, 'goal_revenue', '—')}</td>
                <td className="py-1 px-1">{numInput(i + 1, 'goal_roas', '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={saveGoals}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
      >
        <Save size={14} />
        {saving ? 'Salvando...' : 'Salvar metas'}
      </button>
    </div>
  )
}

function TabConversoes({ clientId }: { clientId: string }) {
  const supabase = createClient()
  const [events, setEvents] = useState<ConversionEvent[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('client_conversion_events').select('*').eq('client_id', clientId)
      .then(({ data }) => setEvents((data as ConversionEvent[]) ?? []))
  }, [clientId])

  function add() {
    setEvents((e) => [...e, { platform: 'meta', action_type: '', label: '', counts_as: 'lead', is_primary: false }])
  }

  function update(i: number, patch: Partial<ConversionEvent>) {
    setEvents((e) => e.map((x, j) => j === i ? { ...x, ...patch } : x))
  }

  async function remove(i: number) {
    const ev = events[i]
    if (ev.id) await supabase.from('client_conversion_events').delete().eq('id', ev.id)
    setEvents((e) => e.filter((_, j) => j !== i))
  }

  async function saveAll() {
    setSaving(true)
    for (const ev of events) {
      if (!ev.action_type || !ev.label) continue
      const payload = { client_id: clientId, platform: ev.platform, action_type: ev.action_type, label: ev.label, counts_as: ev.counts_as, is_primary: ev.is_primary }
      if (ev.id) {
        await supabase.from('client_conversion_events').update(payload).eq('id', ev.id)
      } else {
        const { data } = await supabase.from('client_conversion_events').insert(payload).select()
        if (data?.[0]) setEvents((e) => e.map((x, j) => j === events.indexOf(ev) ? { ...x, id: data[0].id } : x))
      }
    }
    toast.success('Eventos de conversão salvos!')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#94A3B8]">Define quais eventos do Meta/Google contam como Lead ou Conversão para este cliente.</p>
          <p className="text-xs text-[#475569] mt-1">Ex: WhatsApp = Lead, Compra = Conversão, Ligação = Lead</p>
        </div>
        <button onClick={add} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#263548] hover:bg-[#334155] text-[#94A3B8] text-xs rounded-lg transition flex-shrink-0 ml-4">
          <Plus size={12} /> Adicionar
        </button>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-[#475569]">Nenhum evento mapeado. Usando métricas padrão.</p>
      ) : (
        <div className="space-y-2">
          {events.map((ev, i) => (
            <div key={i} className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 grid grid-cols-12 gap-2 items-center">
              <div className="col-span-2">
                <select
                  value={ev.platform}
                  onChange={(e) => update(i, { platform: e.target.value as 'meta' | 'google' })}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded px-2 py-1.5 text-xs text-[#F1F5F9] focus:outline-none"
                >
                  <option value="meta">Meta</option>
                  <option value="google">Google</option>
                </select>
              </div>
              <div className="col-span-4">
                <input
                  value={ev.action_type}
                  onChange={(e) => update(i, { action_type: e.target.value })}
                  placeholder="click_to_call_whatsapp"
                  className="w-full bg-[#1E293B] border border-[#334155] rounded px-2 py-1.5 text-xs text-[#F1F5F9] font-mono focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <input
                  value={ev.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="WhatsApp"
                  className="w-full bg-[#1E293B] border border-[#334155] rounded px-2 py-1.5 text-xs text-[#F1F5F9] focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <select
                  value={ev.counts_as}
                  onChange={(e) => update(i, { counts_as: e.target.value })}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded px-2 py-1.5 text-xs text-[#F1F5F9] focus:outline-none"
                >
                  <option value="lead">Lead</option>
                  <option value="conversion">Conversão</option>
                  <option value="revenue">Receita</option>
                  <option value="ignore">Ignorar</option>
                </select>
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={ev.is_primary}
                  onChange={(e) => update(i, { is_primary: e.target.checked })}
                  title="Métrica principal"
                  className="w-4 h-4 accent-blue-500"
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <button onClick={() => remove(i)} className="p-1.5 text-[#475569] hover:text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-12 gap-2 px-3">
            <div className="col-span-2 text-[10px] text-[#475569]">Plataforma</div>
            <div className="col-span-4 text-[10px] text-[#475569]">action_type (API)</div>
            <div className="col-span-2 text-[10px] text-[#475569]">Rótulo</div>
            <div className="col-span-2 text-[10px] text-[#475569]">Conta como</div>
            <div className="col-span-1 text-[10px] text-[#475569] text-center">Principal</div>
          </div>
        </div>
      )}

      {events.length > 0 && (
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
        >
          <Save size={14} />
          {saving ? 'Salvando...' : 'Salvar eventos'}
        </button>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'dados', label: 'Dados' },
  { id: 'tokens', label: 'Tokens API' },
  { id: 'metas', label: 'Metas mensais' },
  { id: 'conversoes', label: 'Conversões' },
]

const emptyClient: Client = {
  id: '', name: '', slug: '', industry: '', website: '',
  notes: '', monthly_budget: '', primary_color: '#3B82F6', is_active: true,
}

export default function AdminClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('dados')
  const [client, setClient] = useState<Client>(emptyClient)
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isNew = id === 'novo'

  useEffect(() => {
    if (isNew) { setLoading(false); return }
    Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('ad_accounts').select('*').eq('client_id', id).order('platform'),
    ]).then(([{ data: c }, { data: a }]) => {
      if (c) setClient({ ...emptyClient, ...c, monthly_budget: c.monthly_budget?.toString() ?? '' })
      setAccounts((a as AdAccount[]) ?? [])
      setLoading(false)
    })
  }, [id])

  async function save() {
    setSaving(true)
    const payload = {
      name: client.name,
      slug: client.slug,
      industry: client.industry || null,
      website: client.website || null,
      notes: client.notes || null,
      monthly_budget: client.monthly_budget ? Number(client.monthly_budget) : null,
      primary_color: client.primary_color,
      is_active: client.is_active,
    }
    if (isNew) {
      const agencyId = '00000000-0000-0000-0000-000000000001'
      const { data, error } = await supabase.from('clients').insert({ ...payload, agency_id: agencyId }).select().single()
      if (error) { toast.error('Erro ao criar cliente: ' + error.message); setSaving(false); return }
      toast.success('Cliente criado!')
      router.push(`/admin/clientes/${data.id}`)
    } else {
      const { error } = await supabase.from('clients').update(payload).eq('id', id)
      if (error) { toast.error('Erro ao salvar: ' + error.message) } else { toast.success('Dados salvos!') }
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Carregando..." showPlatformSelector={false} />
        <div className="p-6"><div className="h-64 bg-[#1E293B] rounded-xl shimmer" /></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title={isNew ? 'Novo cliente' : client.name} showPlatformSelector={false} />
      <div className="flex-1 p-6 max-w-4xl space-y-4">

        <Link href="/admin/clientes" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#94A3B8] transition">
          <ArrowLeft size={14} /> Voltar para clientes
        </Link>

        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
          {/* Tabs header */}
          <div className="flex border-b border-[#334155]">
            {(isNew ? [TABS[0]] : TABS).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#3B82F6] border-b-2 border-[#3B82F6] bg-[#263548]/50'
                    : 'text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {activeTab === 'dados' && (
              <TabDados client={client} onChange={(p) => setClient((c) => ({ ...c, ...p }))} onSave={save} saving={saving} />
            )}
            {activeTab === 'tokens' && !isNew && (
              <TabTokens clientId={id} accounts={accounts} />
            )}
            {activeTab === 'metas' && !isNew && (
              <TabMetas clientId={id} />
            )}
            {activeTab === 'conversoes' && !isNew && (
              <TabConversoes clientId={id} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
