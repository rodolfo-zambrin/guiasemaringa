'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      })

      if (resetError) {
        setError('Não foi possível enviar o e-mail. Verifique o endereço informado.')
        return
      }
      setSent(true)
    } catch {
      setError('Ocorreu um erro inesperado.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8 shadow-2xl">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-[#F1F5F9] transition mb-6"
          >
            <ArrowLeft size={14} />
            Voltar ao login
          </Link>

          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-[#10B981] mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-[#F1F5F9] mb-2">E-mail enviado!</h2>
              <p className="text-sm text-[#94A3B8]">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#F1F5F9] mb-1">Recuperar senha</h1>
              <p className="text-sm text-[#94A3B8] mb-6">
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="seu@email.com"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition text-sm"
                  />
                </div>

                {error && (
                  <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg px-4 py-3 text-sm text-[#EF4444]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar link de recuperação'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
