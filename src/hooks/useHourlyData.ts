'use client'
import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { subDays, format } from 'date-fns'
import type { MetaAccountHourly } from '@/types/meta.types'
import type { GoogleAccountHourly } from '@/types/google.types'

const supabase = createClient()

// ── tipos internos ──────────────────────────────────────────────────────────

export interface HourlyRow {
  hour: number
  // Meta
  meta_spend: number
  meta_impressions: number
  meta_clicks: number
  meta_leads: number
  meta_purchases: number
  meta_messaging_starts: number
  // Google
  google_spend: number
  google_impressions: number
  google_clicks: number
  google_conversions: number
  // Combinados
  total_spend: number
  total_clicks: number
}

export interface HourlyComparative {
  today: HourlyRow[]
  yesterday: HourlyRow[]
  last_week: HourlyRow[]
  totals: {
    today: HourlyTotals
    yesterday: HourlyTotals
    last_week: HourlyTotals
  }
  projection: HourlyProjection
  current_hour: number
  last_updated: string | null
}

export interface HourlyTotals {
  spend: number
  impressions: number
  clicks: number
  leads: number
  conversions: number
  cpl: number
  cpm: number
}

export interface HourlyProjection {
  projected_spend: number
  projected_leads: number
  projected_conversions: number
  projected_cpl: number
  hourly_rate_spend: number
  hours_remaining: number
}

// ── funções auxiliares ───────────────────────────────────────────────────────

function toHourlyRows(
  meta: MetaAccountHourly[],
  google: GoogleAccountHourly[]
): HourlyRow[] {
  const rows: HourlyRow[] = []
  for (let h = 0; h <= 23; h++) {
    const mRows = meta.filter((r) => r.hour === h)
    const gRows = google.filter((r) => r.hour === h)

    const meta_spend = mRows.reduce((s, r) => s + (r.spend ?? 0), 0)
    const meta_impressions = mRows.reduce((s, r) => s + (r.impressions ?? 0), 0)
    const meta_clicks = mRows.reduce((s, r) => s + (r.clicks ?? 0), 0)
    const meta_leads = mRows.reduce((s, r) => s + (r.leads ?? 0), 0)
    const meta_purchases = mRows.reduce((s, r) => s + (r.purchases ?? 0), 0)
    const meta_messaging_starts = mRows.reduce((s, r) => s + (r.messaging_starts ?? 0), 0)
    const google_spend = gRows.reduce((s, r) => s + (r.spend ?? 0), 0)
    const google_impressions = gRows.reduce((s, r) => s + (r.impressions ?? 0), 0)
    const google_clicks = gRows.reduce((s, r) => s + (r.clicks ?? 0), 0)
    const google_conversions = gRows.reduce((s, r) => s + (r.conversions ?? 0), 0)

    rows.push({
      hour: h,
      meta_spend,
      meta_impressions,
      meta_clicks,
      meta_leads,
      meta_purchases,
      meta_messaging_starts,
      google_spend,
      google_impressions,
      google_clicks,
      google_conversions,
      total_spend: meta_spend + google_spend,
      total_clicks: meta_clicks + google_clicks,
    })
  }
  return rows
}

function calcTotals(rows: HourlyRow[], upToHour?: number): HourlyTotals {
  const filtered = upToHour !== undefined ? rows.filter((r) => r.hour <= upToHour) : rows
  const spend = filtered.reduce((s, r) => s + r.total_spend, 0)
  const impressions = filtered.reduce((s, r) => s + r.meta_impressions + r.google_impressions, 0)
  const clicks = filtered.reduce((s, r) => s + r.total_clicks, 0)
  const leads = filtered.reduce((s, r) => s + r.meta_leads, 0)
  const conversions = filtered.reduce((s, r) => s + r.google_conversions, 0)
  const cpl = leads > 0 ? spend / leads : 0
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0
  return { spend, impressions, clicks, leads, conversions, cpl, cpm }
}

function calcProjection(
  rows: HourlyRow[],
  currentHour: number,
  spentSoFar: number,
  leadsSoFar: number,
  conversionsSoFar: number
): HourlyProjection {
  // Taxa das últimas 3 horas (ou menos se ainda for cedo)
  const lookback = Math.min(3, currentHour + 1)
  const recentHours = rows.filter(
    (r) => r.hour >= currentHour - lookback + 1 && r.hour <= currentHour
  )
  const hourlyRateSpend =
    lookback > 0
      ? recentHours.reduce((s, r) => s + r.total_spend, 0) / lookback
      : 0
  const hourlyRateLeads =
    lookback > 0
      ? recentHours.reduce((s, r) => s + r.meta_leads, 0) / lookback
      : 0
  const hourlyRateConv =
    lookback > 0
      ? recentHours.reduce((s, r) => s + r.google_conversions, 0) / lookback
      : 0

  const hoursRemaining = 23 - currentHour
  const projected_spend = spentSoFar + hourlyRateSpend * hoursRemaining
  const projected_leads = leadsSoFar + hourlyRateLeads * hoursRemaining
  const projected_conversions = conversionsSoFar + hourlyRateConv * hoursRemaining
  const projected_cpl = projected_leads > 0 ? projected_spend / projected_leads : 0

  return {
    projected_spend,
    projected_leads,
    projected_conversions,
    projected_cpl,
    hourly_rate_spend: hourlyRateSpend,
    hours_remaining: hoursRemaining,
  }
}

// ── fetch helpers ────────────────────────────────────────────────────────────

async function fetchMetaHourly(date: string, maxHour?: number) {
  let q = supabase
    .from('meta_account_hourly')
    .select('*')
    .eq('date', date)
    .order('hour', { ascending: true })
  if (maxHour !== undefined) q = q.lte('hour', maxHour)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as MetaAccountHourly[]
}

async function fetchGoogleHourly(date: string, maxHour?: number) {
  let q = supabase
    .from('google_account_hourly')
    .select('*')
    .eq('date', date)
    .order('hour', { ascending: true })
  if (maxHour !== undefined) q = q.lte('hour', maxHour)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as GoogleAccountHourly[]
}

// ── hook principal ────────────────────────────────────────────────────────────

export function useHourlyData() {
  const queryClient = useQueryClient()
  const now = new Date()
  const currentHour = now.getHours()
  const todayStr = format(now, 'yyyy-MM-dd')
  const yesterdayStr = format(subDays(now, 1), 'yyyy-MM-dd')
  const lastWeekStr = format(subDays(now, 7), 'yyyy-MM-dd')

  // Hoje — todos os dados disponíveis
  const todayMeta = useQuery({
    queryKey: ['meta-hourly-today', todayStr],
    queryFn: () => fetchMetaHourly(todayStr),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })

  const todayGoogle = useQuery({
    queryKey: ['google-hourly-today', todayStr],
    queryFn: () => fetchGoogleHourly(todayStr),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })

  // Ontem — somente até a hora atual (comparativo justo)
  const yesterdayMeta = useQuery({
    queryKey: ['meta-hourly-yesterday', yesterdayStr, currentHour],
    queryFn: () => fetchMetaHourly(yesterdayStr, currentHour),
    staleTime: 5 * 60 * 1000,
  })

  const yesterdayGoogle = useQuery({
    queryKey: ['google-hourly-yesterday', yesterdayStr, currentHour],
    queryFn: () => fetchGoogleHourly(yesterdayStr, currentHour),
    staleTime: 5 * 60 * 1000,
  })

  // Mesma semana passada — somente até a hora atual
  const lastWeekMeta = useQuery({
    queryKey: ['meta-hourly-lastweek', lastWeekStr, currentHour],
    queryFn: () => fetchMetaHourly(lastWeekStr, currentHour),
    staleTime: 5 * 60 * 1000,
  })

  const lastWeekGoogle = useQuery({
    queryKey: ['google-hourly-lastweek', lastWeekStr, currentHour],
    queryFn: () => fetchGoogleHourly(lastWeekStr, currentHour),
    staleTime: 5 * 60 * 1000,
  })

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('hourly-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meta_account_hourly' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['meta-hourly-today'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'google_account_hourly' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['google-hourly-today'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const comparative = useMemo<HourlyComparative>(() => {
    const todayRows = toHourlyRows(todayMeta.data ?? [], todayGoogle.data ?? [])
    const yesterdayRows = toHourlyRows(yesterdayMeta.data ?? [], yesterdayGoogle.data ?? [])
    const lastWeekRows = toHourlyRows(lastWeekMeta.data ?? [], lastWeekGoogle.data ?? [])

    const todayTotals = calcTotals(todayRows, currentHour)
    const yesterdayTotals = calcTotals(yesterdayRows)
    const lastWeekTotals = calcTotals(lastWeekRows)

    const projection = calcProjection(
      todayRows,
      currentHour,
      todayTotals.spend,
      todayTotals.leads,
      todayTotals.conversions
    )

    // última atualização: synced_at mais recente
    const allToday = [...(todayMeta.data ?? []), ...(todayGoogle.data ?? [])]
    const lastUpdated =
      allToday.length > 0
        ? allToday.reduce((latest, r) => {
            if (!r.synced_at) return latest
            return !latest || r.synced_at > latest ? r.synced_at : latest
          }, null as string | null)
        : null

    return {
      today: todayRows,
      yesterday: yesterdayRows,
      last_week: lastWeekRows,
      totals: {
        today: todayTotals,
        yesterday: yesterdayTotals,
        last_week: lastWeekTotals,
      },
      projection,
      current_hour: currentHour,
      last_updated: lastUpdated,
    }
  }, [
    todayMeta.data,
    todayGoogle.data,
    yesterdayMeta.data,
    yesterdayGoogle.data,
    lastWeekMeta.data,
    lastWeekGoogle.data,
    currentHour,
  ])

  return {
    data: comparative,
    isLoading:
      todayMeta.isLoading ||
      todayGoogle.isLoading ||
      yesterdayMeta.isLoading ||
      yesterdayGoogle.isLoading,
    isError: todayMeta.isError || todayGoogle.isError,
  }
}
