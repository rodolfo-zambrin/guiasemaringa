import {
  CPM_WARNING,
  CPM_CRITICAL,
  CTR_WARNING,
  CTR_CRITICAL,
  FREQ_WARNING,
  FREQ_CRITICAL,
  ROAS_CRITICAL,
} from '@/lib/constants/benchmarks'

/** Return on Ad Spend: revenue / spend */
export function calcROAS(revenue: number, spend: number): number {
  if (!spend || spend === 0) return 0
  return revenue / spend
}

/** Cost Per Lead: spend / leads */
export function calcCPL(spend: number, leads: number): number {
  if (!leads || leads === 0) return 0
  return spend / leads
}

/** Cost Per Acquisition: spend / conversions */
export function calcCPA(spend: number, conversions: number): number {
  if (!conversions || conversions === 0) return 0
  return spend / conversions
}

/** Click-Through Rate %: (clicks / impressions) * 100 */
export function calcCTR(clicks: number, impressions: number): number {
  if (!impressions || impressions === 0) return 0
  return (clicks / impressions) * 100
}

/** Cost Per Mille (1000 impressions): (spend / impressions) * 1000 */
export function calcCPM(spend: number, impressions: number): number {
  if (!impressions || impressions === 0) return 0
  return (spend / impressions) * 1000
}

/** Frequency: impressions / reach */
export function calcFrequency(impressions: number, reach: number): number {
  if (!reach || reach === 0) return 0
  return impressions / reach
}

/** Hook Rate %: (3s video views / impressions) * 100 */
export function calcHookRate(thruplay3s: number, impressions: number): number {
  if (!impressions || impressions === 0) return 0
  return (thruplay3s / impressions) * 100
}

/** Hold Rate %: (thruplay / 3s video views) * 100 */
export function calcHoldRate(thruplay: number, thruplay3s: number): number {
  if (!thruplay3s || thruplay3s === 0) return 0
  return (thruplay / thruplay3s) * 100
}

/** Delta between two values as percentage change */
export function calcDelta(current: number, previous: number): number {
  if (!previous || previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

/**
 * Health Score 0-100 based on CTR, CPM, Frequency, ROAS
 * Higher is better
 */
export function calcHealthScore(params: {
  ctr: number
  cpm: number
  frequency: number
  roas: number
}): number {
  const { ctr, cpm, frequency, roas } = params
  let score = 100

  // CTR penalties
  if (ctr < CTR_CRITICAL) score -= 30
  else if (ctr < CTR_WARNING) score -= 15

  // CPM penalties
  if (cpm > CPM_CRITICAL) score -= 25
  else if (cpm > CPM_WARNING) score -= 12

  // Frequency penalties
  if (frequency > FREQ_CRITICAL) score -= 25
  else if (frequency > FREQ_WARNING) score -= 12

  // ROAS penalties
  if (roas > 0 && roas < ROAS_CRITICAL) score -= 20
  else if (roas === 0) score -= 10

  return Math.max(0, Math.min(100, score))
}

/**
 * Budget Pace %: (spend_so_far / expected_spend_by_now) * 100
 * expected = (daily_budget * days_elapsed) or total_budget * elapsed_fraction
 */
export function calcBudgetPace(
  spendSoFar: number,
  dailyBudget: number,
  daysElapsed: number
): number {
  const expected = dailyBudget * daysElapsed
  if (!expected || expected === 0) return 0
  return (spendSoFar / expected) * 100
}

/**
 * Get health color class based on score
 */
export function getHealthColor(score: number): string {
  if (score >= 75) return 'text-success'
  if (score >= 50) return 'text-warning'
  return 'text-danger'
}

/**
 * Get health label based on score
 */
export function getHealthLabel(score: number): string {
  if (score >= 75) return 'Saudável'
  if (score >= 50) return 'Atenção'
  return 'Crítico'
}
