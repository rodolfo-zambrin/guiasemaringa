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

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'meta', label: 'Meta' },
  { value: 'google', label: 'Google' },
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

  return (
    <header className="flex items-center justify-between gap-4 px-6 h-16 border-b border-[#334155] bg-[#1E293B] flex-shrink-0">
      {/* Title */}
      <h1 className="text-base font-semibold text-[#F1F5F9] truncate">{title}</h1>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Date presets */}
        <div className="hidden md:flex items-center bg-[#0F172A] border border-[#334155] rounded-lg p-0.5 gap-0.5">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset.days, preset.label)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition',
                activePreset === preset.label
                  ? 'bg-[#3B82F6] text-white'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#263548]'
              )}
            >
              {preset.label}
            </button>
          ))}
          {/* Custom range display */}
          <span className="px-2 text-xs text-[#475569]">
            {dateRange.from} → {dateRange.to}
          </span>
        </div>

        {/* Platform selector */}
        {showPlatformSelector && (
          <div className="hidden sm:flex items-center bg-[#0F172A] border border-[#334155] rounded-lg p-0.5 gap-0.5">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPlatform(p.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition',
                  platform === p.value
                    ? p.value === 'meta'
                      ? 'bg-[#1877F2] text-white'
                      : p.value === 'google'
                        ? 'bg-[#34A853] text-white'
                        : 'bg-[#3B82F6] text-white'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#263548]'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg text-[#475569] hover:text-[#94A3B8] hover:bg-[#263548] transition"
          title="Atualizar dados"
        >
          <RefreshCw size={15} className={cn(isRefreshing && 'animate-spin')} />
        </button>

        {/* Alerts bell */}
        <Link
          href="/alertas"
          className="relative p-2 rounded-lg text-[#475569] hover:text-[#94A3B8] hover:bg-[#263548] transition"
        >
          <Bell size={15} />
          {totalAlerts > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full" />
          )}
        </Link>
      </div>
    </header>
  )
}
