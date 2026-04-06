'use client'
import { Bell, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useDashboardStore } from '@/store/dashboardStore'
import { useAlertCount } from '@/hooks/useAlerts'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { format, subDays } from 'date-fns'
import Link from 'next/link'
import type { Platform } from '@/types/common.types'

interface HeaderProps {
  title: string
  showPlatformSelector?: boolean
}

const DATE_PRESETS = [
  { label: 'Ontem', days: 1 },
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
]

const PLATFORMS: { value: Platform; label: string; color: string }[] = [
  { value: 'all', label: 'Todos', color: '#3B82F6' },
  { value: 'meta', label: 'Meta', color: '#1877F2' },
  { value: 'google', label: 'Google', color: '#34A853' },
]

export function Header({ title, showPlatformSelector = true }: HeaderProps) {
  const { dateRange, setDateRange, platform, setPlatform } = useDashboardStore()
  const { data: alertCount } = useAlertCount()
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activePreset, setActivePreset] = useState('30d')

  const totalAlerts = (alertCount?.critical ?? 0) + (alertCount?.warning ?? 0)

  const handlePreset = (days: number, label: string) => {
    const to = format(new Date(), 'yyyy-MM-dd')
    const from = format(subDays(new Date(), days - 1), 'yyyy-MM-dd')
    setDateRange({ from, to })
    setActivePreset(label)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await queryClient.invalidateQueries()
    setTimeout(() => setIsRefreshing(false), 800)
  }

  const activePlatformColor = PLATFORMS.find((p) => p.value === platform)?.color ?? '#3B82F6'

  return (
    <header className="flex items-center justify-between gap-4 px-6 h-16 border-b border-[#1e2d3d] bg-[#131c2b] flex-shrink-0">
      {/* Title */}
      <h1 className="text-sm font-bold text-[#E2E8F0] truncate tracking-tight">{title}</h1>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Date presets */}
        <div className="hidden md:flex items-center bg-[#0d1520] border border-[#1e2d3d] rounded-lg p-0.5 gap-0.5">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset.days, preset.label)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer',
                activePreset === preset.label
                  ? 'bg-[#3B82F6] text-white shadow-sm'
                  : 'text-[#475569] hover:text-[#94A3B8] hover:bg-[#1E293B]/60'
              )}
            >
              {preset.label}
            </button>
          ))}
          <div className="w-px h-4 bg-[#1e2d3d] mx-0.5" />
          <span className="px-2 text-[11px] text-[#334155] font-mono tabular-nums">
            {dateRange.from} → {dateRange.to}
          </span>
        </div>

        {/* Platform selector */}
        {showPlatformSelector && (
          <div className="hidden sm:flex items-center bg-[#0d1520] border border-[#1e2d3d] rounded-lg p-0.5 gap-0.5">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPlatform(p.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer',
                  platform === p.value
                    ? 'text-white shadow-sm'
                    : 'text-[#475569] hover:text-[#94A3B8] hover:bg-[#1E293B]/60'
                )}
                style={
                  platform === p.value
                    ? { backgroundColor: p.color }
                    : undefined
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg text-[#334155] hover:text-[#64748B] hover:bg-[#1E293B]/60 transition-all duration-150 cursor-pointer"
          title="Atualizar dados"
        >
          <RefreshCw size={15} className={cn(isRefreshing && 'animate-spin')} />
        </button>

        {/* Alerts bell */}
        <Link
          href="/alertas"
          className="relative p-2 rounded-lg text-[#334155] hover:text-[#64748B] hover:bg-[#1E293B]/60 transition-all duration-150"
        >
          <Bell size={15} />
          {totalAlerts > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#EF4444] rounded-full ring-2 ring-[#131c2b]" />
          )}
        </Link>
      </div>
    </header>
  )
}
