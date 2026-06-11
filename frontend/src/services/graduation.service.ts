import { api } from './api'
import type { BeltLevelRead, GraduationEventRead, GraduationRead } from '@/types/api.types'

export const graduationService = {
  async listBelts(): Promise<BeltLevelRead[]> {
    const { data } = await api.get<BeltLevelRead[]>('/belts')
    return data
  },

  async createBelt(payload: object): Promise<BeltLevelRead> {
    const { data } = await api.post<BeltLevelRead>('/belts', payload)
    return data
  },

  async listEvents(): Promise<GraduationEventRead[]> {
    const { data } = await api.get<GraduationEventRead[]>('/graduation-events')
    return data
  },

  async createEvent(payload: object): Promise<GraduationEventRead> {
    const { data } = await api.post<GraduationEventRead>('/graduation-events', payload)
    return data
  },

  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/graduation-events/${id}`)
  },

  async getByStudent(studentId: string): Promise<GraduationRead[]> {
    const { data } = await api.get<GraduationRead[]>(`/students/${studentId}/graduations`)
    return data
  },

  async register(payload: object): Promise<GraduationRead> {
    const { data } = await api.post<GraduationRead>('/graduations', payload)
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/graduations/${id}`)
  },
}
