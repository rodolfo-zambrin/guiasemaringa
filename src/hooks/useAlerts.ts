'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AlertItem } from '@/types/common.types'

const supabase = createClient()

interface AlertFilters {
  severity?: 'critical' | 'warning' | 'info'
  platform?: string
  resolved?: boolean
}

export function useAlerts(filters?: AlertFilters) {
  return useQuery<{
    critical: AlertItem[]
    warning: AlertItem[]
    info: AlertItem[]
    all: AlertItem[]
  }>({
    queryKey: ['alerts', filters],
    queryFn: async () => {
      let query = supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (filters?.severity) {
        query = query.eq('severity', filters.severity)
      }
      if (filters?.platform) {
        query = query.eq('platform', filters.platform)
      }
      if (filters?.resolved !== undefined) {
        query = query.eq('resolved', filters.resolved)
      }

      const { data, error } = await query
      if (error) throw error

      const items = (data as AlertItem[]) ?? []
      return {
        all: items,
        critical: items.filter((a) => a.severity === 'critical'),
        warning: items.filter((a) => a.severity === 'warning'),
        info: items.filter((a) => a.severity === 'info'),
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useAlertCount() {
  return useQuery<{ critical: number; warning: number }>({
    queryKey: ['alert-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('severity')
        .eq('resolved', false)

      if (error) throw error

      const items = data ?? []
      return {
        critical: items.filter((a) => a.severity === 'critical').length,
        warning: items.filter((a) => a.severity === 'warning').length,
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}
