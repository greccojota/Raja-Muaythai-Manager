import { api } from './api'
import type { InstructorCreate, InstructorRead } from '@/types/api.types'

interface ListParams {
  active_only?: boolean
}

export const instructorService = {
  async list(params: ListParams = {}): Promise<InstructorRead[]> {
    const { data } = await api.get<InstructorRead[]>('/instructors', { params })
    return data
  },

  async get(id: string): Promise<InstructorRead> {
    const { data } = await api.get<InstructorRead>(`/instructors/${id}`)
    return data
  },

  async create(payload: InstructorCreate): Promise<InstructorRead> {
    const { data } = await api.post<InstructorRead>('/instructors', payload)
    return data
  },

  async update(id: string, payload: Partial<InstructorCreate>): Promise<InstructorRead> {
    const { data } = await api.put<InstructorRead>(`/instructors/${id}`, payload)
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/instructors/${id}`)
  },
}
