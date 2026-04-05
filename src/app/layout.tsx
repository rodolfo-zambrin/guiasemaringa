import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'AG Perform | Dashboard de Mídia Paga',
    template: '%s | AG Perform',
  },
  description: 'Plataforma de análise de performance de mídia paga — Meta Ads e Google Ads. Guia-se Maringá.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://agperform.com.br'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AG Perform',
  },
  robots: {
    index: false, // Plataforma privada — não indexar
    follow: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-[#0F172A] text-[#F1F5F9] font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#F1F5F9',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
