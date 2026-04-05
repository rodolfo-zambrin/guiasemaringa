'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { DateRange } from '@/types/common.types'
import type {
  MetaAccountDaily,
  MetaCampaignDaily,
  MetaAdSetDaily,
  MetaAdDaily,
  MetaAccountHourly,
} from '@/types/meta.types'

const supabase = createClient()

export function useMetaOverview(dateRange: DateRange, clientIds?: string[]) {
  return useQuery<MetaAccountDaily[]>({
    queryKey: ['meta-overview', dateRange, clientIds],
    queryFn: async () => {
      let query = supabase
        .from('meta_account_daily')
        .select('*')
        .gte('date', dateRange.from)
        .lte('date', dateRange.to)
        .order('date', { ascending: false })

      if (clientIds && clientIds.length > 0) {
        query = query.in('account_id', clientIds)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as MetaAccountDaily[]) ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useMetaCampaigns(dateRange: DateRange, clientIds?: string[]) {
  return useQuery<MetaCampaignDaily[]>({
    queryKey: ['meta-campaigns', dateRange, clientIds],
    queryFn: async () => {
      let query = supabase
        .from('meta_campaign_daily')
        .select('*')
        .gte('date', dateRange.from)
        .lte('date', dateRange.to)
        .order('spend', { ascending: false })

      if (clientIds && clientIds.length > 0) {
        query = query.in('account_id', clientIds)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as MetaCampaignDaily[]) ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useMetaAdSets(dateRange: DateRange, clientIds?: string[]) {
  return useQuery<MetaAdSetDaily[]>({
    queryKey: ['meta-adsets', dateRange, clientIds],
    queryFn: async () => {
      let query = supabase
        .from('meta_adset_daily')
        .select('*')
        .gte('date', dateRange.from)
        .lte('date', dateRange.to)
        .order('spend', { ascending: false })

      if (clientIds && clientIds.length > 0) {
        query = query.in('account_id', clientIds)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as MetaAdSetDaily[]) ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useMetaAds(dateRange: DateRange, clientIds?: string[]) {
  return useQuery<MetaAdDaily[]>({
    queryKey: ['meta-ads', dateRange, clientIds],
    queryFn: async () => {
      let query = supabase
        .from('meta_ad_daily')
        .select('*')
        .gte('date', dateRange.from)
        .lte('date', dateRange.to)
        .order('spend', { ascending: false })

      if (clientIds && clientIds.length > 0) {
        query = query.in('account_id', clientIds)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as MetaAdDaily[]) ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useMetaHourly(date: string, clientIds?: string[]) {
  return useQuery<MetaAccountHourly[]>({
    queryKey: ['meta-hourly', date, clientIds],
    queryFn: async () => {
      let query = supabase
        .from('meta_account_hourly')
        .select('*')
        .eq('date', date)
        .order('hour', { ascending: true })

      if (clientIds && clientIds.length > 0) {
        query = query.in('account_id', clientIds)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as MetaAccountHourly[]) ?? []
    },
    staleTime: 60 * 1000, // 1 minute for real-time
    refetchInterval: 60 * 1000,
  })
}
