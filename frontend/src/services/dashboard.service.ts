import { api } from './api'
import type { DashboardSummary } from '@/types/api.types'

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await api.get<DashboardSummary>('/dashboard')
    return data
  },
}
