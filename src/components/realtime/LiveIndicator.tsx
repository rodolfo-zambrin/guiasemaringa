'use client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Wifi, WifiOff } from 'lucide-react'

interface LiveIndicatorProps {
  lastUpdated: string | null
  isLive?: boolean
}

export function LiveIndicator({ lastUpdated, isLive = true }: LiveIndicatorProps) {
  const formattedTime = lastUpdated
    ? format(new Date(lastUpdated), 'HH:mm', { locale: ptBR })
    : null

  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
          isLive
            ? 'bg-red-500/10 text-red-400 border-red-500/30'
            : 'bg-[#263548] text-[#64748B] border-[#334155]'
        }`}
      >
        {isLive ? (
          <Wifi size={12} className="animate-pulse" />
        ) : (
          <WifiOff size={12} />
        )}
        {isLive ? 'AO VIVO' : 'PAUSADO'}
      </span>
      {formattedTime && (
        <span className="text-xs text-[#64748B]">
          Última atualização: <span className="text-[#94A3B8] font-medium">{formattedTime}</span>
        </span>
      )}
      {!formattedTime && (
        <span className="text-xs text-[#64748B]">Aguardando dados...</span>
      )}
    </div>
  )
}
