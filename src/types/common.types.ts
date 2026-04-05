export interface DateRange {
  from: string
  to: string
}

export interface MetricCardData {
  label: string
  value: number
  format: 'brl' | 'number' | 'percent' | 'roas' | 'multiplier'
  delta?: number
  icon?: string
  invertDelta?: boolean
}

export interface SelectOption {
  value: string
  label: string
}

export type Platform = 'meta' | 'google' | 'all'

export type UserRole = 'super_admin' | 'analyst' | 'client_view'

export interface Client {
  id: string
  name: string
  slug: string
  industry: string
  is_active: boolean
  meta_account_ids?: string[]
  google_account_ids?: string[]
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  client_id?: string
  agency_id?: string
  avatar_url?: string
}

export interface AlertItem {
  id: string
  severity: 'critical' | 'warning' | 'info'
  platform: Platform
  account_id: string
  account_name: string
  metric: string
  message: string
  value: number
  threshold: number
  created_at: string
  resolved: boolean
}
