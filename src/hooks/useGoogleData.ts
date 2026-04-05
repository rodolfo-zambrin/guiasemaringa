'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { DateRange } from '@/types/common.types'
import type {
  GoogleAccountDaily,
  GoogleCampaignDaily,
  GoogleAdGroupDaily,
  GoogleAdDaily,
  GoogleKeywordDaily,
  GoogleAccountHourly,
} from '@/types/google.types'

const supabase = createClient()

export function useGoogleOverview(dateRange: DateRange, clientIds?: string[]) {
  return useQuery<GoogleAccountDaily[]>({
    queryKey: ['google-overview', dateRange, clientIds],
    queryFn: async () => {
      let query = supabase
        .from('google_account_daily')
        .select('*')
        .gte('date', dateRange.from)
        .lte('date', dateRange.to)
        .order('date', { ascending: false })

      if (clientIds && clientIds.length > 0) {
        query = query.in('account_id', clientIds)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as GoogleAccountDaily[]) ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useGoogleCampaigns(dateRange: DateRange, clientIds?: string[]) {
  return useQuery<GoogleCampaignDaily[]>({
    queryKey: ['google-campaigns', dateRange, clientIds],
    queryFn: async () => {
      let query = supabase
        .from('google_campaign_daily')
        .select('*')
        .gte('date', dateRange.from)
        .lte('date', dateRange.to)
        .order('spend', { ascending: false })

      if (clientIds && clientIds.length > 0) {
        query = query.in('account_id', clientIds)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as GoogleCampaignDaily[]) ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useGoogleAdGroups(dateRange: DateRange, clientIds?: string[]) {
  return useQuery<GoogleAdGroupDaily[]>({
    queryKey: ['google-adgroups', dateRange, clientIds],
    queryFn: async () => {
      let query = supabase
        .from('google_adgroup_daily')
        .select('*')
        .gte('date', dateRange.from)
        .lte('date', dateRange.to)
        .order('spend', { ascending: false })

      if (clientIds && clientIds.length > 0) {
        query = query.in('account_id', clientIds)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as GoogleAdGroupDaily[]) ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useGoogleAds(dateRange: DateRange, clientIds?: string[]) {
  return useQuery<GoogleAdDaily[]>({
    queryKey: ['google-ads', dateRange, clientIds],
    queryFn: async () => {
      let query = supabase
        .from('google_ad_daily')
        .select('*')
        .gte('date', dateRange.from)
        .lte('date', dateRange.to)
        .order('spend', { ascending: false })

      if (clientIds && clientIds.length > 0) {
        query = query.in('account_id', clientIds)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as GoogleAdDaily[]) ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useGoogleKeywords(dateRange: DateRange, clientIds?: string[]) {
  return useQuery<GoogleKeywordDaily[]>({
    queryKey: ['google-keywords', dateRange, clientIds],
    queryFn: async () => {
      let query = supabase
        .from('google_keyword_daily')
        .select('*')
        .gte('date', dateRange.from)
        .lte('date', dateRange.to)
        .order('spend', { ascending: false })

      if (clientIds && clientIds.length > 0) {
        query = query.in('account_id', clientIds)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as GoogleKeywordDaily[]) ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useGoogleHourly(date: string, clientIds?: string[]) {
  return useQuery<GoogleAccountHourly[]>({
    queryKey: ['google-hourly', date, clientIds],
    queryFn: async () => {
      let query = supabase
        .from('google_account_hourly')
        .select('*')
        .eq('date', date)
        .order('hour', { ascending: true })

      if (clientIds && clientIds.length > 0) {
        query = query.in('account_id', clientIds)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as GoogleAccountHourly[]) ?? []
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })
}
