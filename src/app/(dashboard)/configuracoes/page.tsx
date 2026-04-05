'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { User, Database, RefreshCw, CheckCircle2 } from 'lucide-react'

export default function ConfiguracoesPage() {
  const { user, profile } = useAuth()
  const supabase = createClient()
  const [fullName, setFullName] = useState(profile?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<'meta' | 'google' | null>(null)
  const [syncResults, setSyncResults] = useState<Record<string, { inserted: number; errors: string[] }>>({})

  async function runSync(platform: 'meta' | 'google', days = 30) {
    setSyncing(platform)
    try {
      const res = await fetch(`/api/sync/${platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      })
      const data = await res.json()
      setSyncResults((prev) => ({ ...prev, [platform]: data }))
      if (data.errors?.length > 0) {
        toast.warning(`${platform === 'meta' ? 'Meta' : 'Google'}: ${data.inserted} registros, ${data.errors.length} erros`)
      } else {
        toast.success(`${platform === 'meta' ? 'Meta' : 'Google'}: ${data.inserted} registros sincronizados!`)
      }
    } catch {
      toast.error(`Erro ao sincronizar ${platform}`)
    } finally {
      setSyncing(null)
    }
  }

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      toast.error('Erro ao salvar perfil')
    } else {
      toast.success('Perfil atualizado')
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Configurações" showPlatformSelector={false} />
      <div className="flex-1 p-6 max-w-2xl space-y-6">

        {/* Profile section */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-[#64748B]" />
            <h3 className="text-sm font-semibold text-[#F1F5F9]">Perfil</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Nome completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6]"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">E-mail</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#475569] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Função</label>
              <div className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-[#475569]">
                {profile?.role === 'super_admin' ? 'Super Admin' : profile?.role === 'analyst' ? 'Analista' : 'Cliente'}
              </div>
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>

        {/* Sync section */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw size={16} className="text-[#64748B]" />
            <h3 className="text-sm font-semibold text-[#F1F5F9]">Sincronização de Dados</h3>
          </div>
          <p className="text-xs text-[#64748B] mb-4">Importa dados do Windsor.ai para o banco de dados. Use para popular dados inicialmente.</p>

          <div className="grid grid-cols-2 gap-3">
            {/* Meta sync */}
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#1877F2]" />
                <span className="text-sm font-medium text-[#F1F5F9]">Meta Ads</span>
                {syncResults.meta && (
                  <CheckCircle2 size={14} className="text-green-400 ml-auto" />
                )}
              </div>
              {syncResults.meta && (
                <p className="text-xs text-[#64748B] mb-2">
                  {syncResults.meta.inserted} registros · {syncResults.meta.errors.length} erros
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => runSync('meta', 30)}
                  disabled={syncing !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2] text-xs font-medium rounded-lg transition disabled:opacity-50"
                >
                  {syncing === 'meta' ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  {syncing === 'meta' ? 'Sincronizando...' : '30 dias'}
                </button>
                <button
                  onClick={() => runSync('meta', 90)}
                  disabled={syncing !== null}
                  className="px-3 py-1.5 bg-[#263548] hover:bg-[#334155] text-[#94A3B8] text-xs rounded-lg transition disabled:opacity-50"
                >
                  90d
                </button>
              </div>
            </div>

            {/* Google sync */}
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#34A853]" />
                <span className="text-sm font-medium text-[#F1F5F9]">Google Ads</span>
                {syncResults.google && (
                  <CheckCircle2 size={14} className="text-green-400 ml-auto" />
                )}
              </div>
              {syncResults.google && (
                <p className="text-xs text-[#64748B] mb-2">
                  {syncResults.google.inserted} registros · {syncResults.google.errors.length} erros
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => runSync('google', 30)}
                  disabled={syncing !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#34A853]/10 hover:bg-[#34A853]/20 border border-[#34A853]/30 text-[#34A853] text-xs font-medium rounded-lg transition disabled:opacity-50"
                >
                  {syncing === 'google' ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  {syncing === 'google' ? 'Sincronizando...' : '30 dias'}
                </button>
                <button
                  onClick={() => runSync('google', 90)}
                  disabled={syncing !== null}
                  className="px-3 py-1.5 bg-[#263548] hover:bg-[#334155] text-[#94A3B8] text-xs rounded-lg transition disabled:opacity-50"
                >
                  90d
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database size={16} className="text-[#64748B]" />
            <h3 className="text-sm font-semibold text-[#F1F5F9]">Informações da Conta</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#64748B]">ID do usuário</span>
              <span className="text-[#94A3B8] font-mono text-xs">{user?.id?.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Plataforma</span>
              <span className="text-[#94A3B8]">Guia-se Maringá</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Versão</span>
              <span className="text-[#94A3B8]">v2.0</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
