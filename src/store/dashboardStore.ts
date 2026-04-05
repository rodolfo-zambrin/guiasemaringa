import { create } from 'zustand'
import { subDays, format } from 'date-fns'
import type { Platform } from '@/types/common.types'

interface DateRange {
  from: string
  to: string
}

interface DashboardState {
  dateRange: DateRange
  selectedClients: string[]
  platform: Platform
  sidebarCollapsed: boolean

  // Actions
  setDateRange: (range: DateRange) => void
  setSelectedClients: (clients: string[]) => void
  setPlatform: (platform: Platform) => void
  toggleSidebar: () => void

  // Helpers
  getDateFrom: () => string
  getDateTo: () => string
}

const today = new Date()
const defaultFrom = format(subDays(today, 29), 'yyyy-MM-dd')
const defaultTo = format(today, 'yyyy-MM-dd')

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dateRange: {
    from: defaultFrom,
    to: defaultTo,
  },
  selectedClients: [],
  platform: 'all',
  sidebarCollapsed: false,

  setDateRange: (range) => set({ dateRange: range }),
  setSelectedClients: (clients) => set({ selectedClients: clients }),
  setPlatform: (platform) => set({ platform }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  getDateFrom: () => get().dateRange.from,
  getDateTo: () => get().dateRange.to,
}))
