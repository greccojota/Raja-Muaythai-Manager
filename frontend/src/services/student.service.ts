import { api } from './api'
import type { PaginatedResponse, StudentCreate, StudentListItem, StudentRead } from '@/types/api.types'

interface ListParams {
  search?: string
  status?: string
  page?: number
  size?: number
}

export const studentService = {
  async list(params: ListParams = {}): Promise<PaginatedResponse<StudentListItem>> {
    const { data } = await api.get<PaginatedResponse<StudentListItem>>('/students', { params })
    return data
  },

  async get(id: string): Promise<StudentRead> {
    const { data } = await api.get<StudentRead>(`/students/${id}`)
    return data
  },

  async create(payload: StudentCreate): Promise<StudentRead> {
    const { data } = await api.post<StudentRead>('/students', payload)
    return data
  },

  async update(id: string, payload: Partial<StudentCreate>): Promise<StudentRead> {
    const { data } = await api.put<StudentRead>(`/students/${id}`, payload)
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/students/${id}`)
  },

  async uploadPhoto(id: string, file: File): Promise<StudentRead> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<StudentRead>(`/students/${id}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
