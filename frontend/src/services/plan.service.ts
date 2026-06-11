import { api } from './api'
import type { PlanCreate, PlanRead } from '@/types/api.types'

export const planService = {
  async list(activeOnly = false): Promise<PlanRead[]> {
    const { data } = await api.get<PlanRead[]>('/plans', { params: { active_only: activeOnly } })
    return data
  },

  async get(id: string): Promise<PlanRead> {
    const { data } = await api.get<PlanRead>(`/plans/${id}`)
    return data
  },

  async create(payload: PlanCreate): Promise<PlanRead> {
    const { data } = await api.post<PlanRead>('/plans', payload)
    return data
  },

  async update(id: string, payload: Partial<PlanCreate>): Promise<PlanRead> {
    const { data } = await api.put<PlanRead>(`/plans/${id}`, payload)
    return data
  },

  async deactivate(id: string): Promise<void> {
    await api.delete(`/plans/${id}`)
  },
}
