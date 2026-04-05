'use client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Mail, Shield, UserX, UserCheck } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'analyst' | 'client_view'
  is_active: boolean
  client_id: string | null
  last_seen_at: string | null
}

interface Client { id: string; name: string }

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  analyst: 'Analista',
  client_view: 'Cliente',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  analyst: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  client_view: 'text-green-400 bg-green-500/10 border-green-500/30',
}

export default function UsuariosPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'analyst' | 'client_view'>('analyst')
  const [inviteClient, setInviteClient] = useState('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('user_profiles').select('id,name,email,role,is_active,client_id,last_seen_at').order('role').order('name'),
      supabase.from('clients').select('id,name').eq('is_active', true).order('name'),
    ]).then(([{ data: u }, { data: c }]) => {
      setUsers((u as UserProfile[]) ?? [])
      setClients((c as Client[]) ?? [])
      setLoading(false)
    })
  }, [])

  async function toggleUser(userId: string, active: boolean) {
    await supabase.from('user_profiles').update({ is_active: active }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: active } : u))
    toast.success(active ? 'Usuário ativado' : 'Usuário desativado')
  }

  async function changeRole(userId: string, role: string) {
    await supabase.from('user_profiles').update({ role }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as UserProfile['role'] } : u))
    toast.success('Função atualizada')
  }

  async function inviteUser() {
    if (!inviteEmail.trim()) { toast.error('Informe o e-mail'); return }
    if (inviteRole === 'client_view' && !inviteClient) { toast.error('Selecione o cliente'); return }
    setInviting(true)

    const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
      data: {
        role: inviteRole,
        client_id: inviteRole === 'client_view' ? inviteClient : null,
      },
    })

    if (error) {
      // Fallback: criar via signUp (sem confirmação em dev)
      toast.error('Erro no convite: ' + error.message)
    } else {
      toast.success(`Convite enviado para ${inviteEmail}`)
      setInviteEmail('')
      setInviteClient('')
    }
    setInviting(false)
  }

  function fmtLastSeen(date: string | null) {
    if (!date) return 'nunca'
    const d = new Date(date)
    const diff = Date.now() - d.getTime()
    if (diff < 60000) return 'agora'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`
    return d.toLocaleDateString('pt-BR')
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Configurações — Usuários" showPlatformSelector={false} />
      <div className="flex-1 p-6 max-w-4xl space-y-6">

        {/* Lista de usuários */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#334155] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F1F5F9]">Usuários</h3>
              <p className="text-xs text-[#64748B] mt-0.5">{users.length} cadastrados</p>
            </div>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-[#263548] rounded-lg shimmer" />
              ))}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left text-xs font-semibold text-[#64748B] px-4 py-3">Usuário</th>
                  <th className="text-left text-xs font-semibold text-[#64748B] px-4 py-3">Função</th>
                  <th className="text-left text-xs font-semibold text-[#64748B] px-4 py-3 hidden md:table-cell">Cliente</th>
                  <th className="text-left text-xs font-semibold text-[#64748B] px-4 py-3 hidden sm:table-cell">Último acesso</th>
                  <th className="text-left text-xs font-semibold text-[#64748B] px-4 py-3">Status</th>
                  <th className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {users.map(u => {
                  const clientName = clients.find(c => c.id === u.client_id)?.name
                  return (
                    <tr key={u.id} className="hover:bg-[#263548] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-[#F1F5F9]">{u.name || '—'}</p>
                        <p className="text-xs text-[#475569]">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={e => changeRole(u.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border bg-transparent cursor-pointer focus:outline-none ${ROLE_COLORS[u.role]}`}
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="analyst">Analista</option>
                          <option value="client_view">Cliente</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#94A3B8] hidden md:table-cell">
                        {clientName ?? <span className="text-[#475569]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#64748B] hidden sm:table-cell">
                        {fmtLastSeen(u.last_seen_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.is_active ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'
                        }`}>
                          {u.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleUser(u.id, !u.is_active)}
                          className={`p-1.5 rounded-lg transition ${
                            u.is_active
                              ? 'text-[#475569] hover:text-red-400 hover:bg-red-500/10'
                              : 'text-[#475569] hover:text-green-400 hover:bg-green-500/10'
                          }`}
                          title={u.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Convidar usuário */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Plus size={15} className="text-[#64748B]" />
            <h3 className="text-sm font-semibold text-[#F1F5F9]">Convidar Usuário</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="sm:col-span-1">
              <label className="block text-xs text-[#94A3B8] mb-1.5 font-medium">Função</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as typeof inviteRole)}
                className="w-full bg-[#0F172A] border border-[#334155] focus:border-[#3B82F6] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] outline-none"
              >
                <option value="analyst">Analista</option>
                <option value="client_view">Cliente</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-[#94A3B8] mb-1.5 font-medium">E-mail *</label>
              <div className="flex items-center gap-2 bg-[#0F172A] border border-[#334155] focus-within:border-[#3B82F6] rounded-lg px-3 transition">
                <Mail size={14} className="text-[#475569] flex-shrink-0" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="usuario@email.com"
                  className="flex-1 bg-transparent py-2 text-sm text-[#F1F5F9] outline-none"
                />
              </div>
            </div>
          </div>
          {inviteRole === 'client_view' && (
            <div className="mb-3">
              <label className="block text-xs text-[#94A3B8] mb-1.5 font-medium">Cliente *</label>
              <select
                value={inviteClient}
                onChange={e => setInviteClient(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] focus:border-[#3B82F6] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] outline-none"
              >
                <option value="">— Selecionar cliente —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <button
            onClick={inviteUser}
            disabled={inviting}
            className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
          >
            <Shield size={14} />
            {inviting ? 'Enviando...' : 'Enviar convite'}
          </button>
          <p className="text-xs text-[#475569] mt-2">
            O usuário receberá um e-mail para criar a senha de acesso.
          </p>
        </div>

      </div>
    </div>
  )
}
