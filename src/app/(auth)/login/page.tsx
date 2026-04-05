'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('E-mail ou senha inválidos. Tente novamente.')
        return
      }

      if (!data.user) {
        setError('Falha na autenticação. Tente novamente.')
        return
      }

      // Fetch user profile to determine redirect
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, client_id')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'client_view' && profile?.client_id) {
        router.push(`/clientes/${profile.client_id}`)
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B]/50 to-[#0F172A] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8 shadow-2xl">
          {/* Logo & Title */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#263548] rounded-xl flex items-center justify-center mb-4 overflow-hidden">
              <Image
                src="/logo.png"
                alt="Guia-se Maringá"
                width={48}
                height={48}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <h1 className="text-xl font-bold text-[#F1F5F9]">Guia-se Maringá</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Dashboard de Mídia</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#94A3B8] mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 pr-10 text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8] transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg px-4 py-3 text-sm text-[#EF4444]">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Forgot password link */}
          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-[#94A3B8] hover:text-[#3B82F6] transition"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#475569] mt-6">
          © {new Date().getFullYear()} Guia-se Maringá. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
