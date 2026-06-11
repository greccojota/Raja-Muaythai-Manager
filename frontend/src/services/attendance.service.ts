import { api } from './api'
import type { AttendanceRead, AttendanceSummary, PaginatedResponse } from '@/types/api.types'

export const attendanceService = {
  async checkIn(payload: {
    student_id: string
    class_group_id?: string
    check_in_type?: string
    notes?: string
  }): Promise<AttendanceRead> {
    const { data } = await api.post<AttendanceRead>('/attendance', payload)
    return data
  },

  async list(params: object = {}): Promise<PaginatedResponse<AttendanceRead>> {
    const { data } = await api.get('/attendance', { params })
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/attendance/${id}`)
  },

  async getFrequency(): Promise<AttendanceSummary[]> {
    const { data } = await api.get<AttendanceSummary[]>('/attendance/frequency')
    return data
  },
}
