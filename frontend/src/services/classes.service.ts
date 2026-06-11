import { api } from './api'
import type {
  ClassEnrollmentRead, ClassGroupRead, PrivateClassRead,
  PaginatedResponse,
} from '@/types/api.types'

export const classesService = {
  async listGroups(activeOnly = true): Promise<ClassGroupRead[]> {
    const { data } = await api.get<ClassGroupRead[]>('/classes', { params: { active_only: activeOnly } })
    return data
  },

  async createGroup(payload: object): Promise<ClassGroupRead> {
    const { data } = await api.post<ClassGroupRead>('/classes', payload)
    return data
  },

  async updateGroup(id: string, payload: object): Promise<ClassGroupRead> {
    const { data } = await api.put<ClassGroupRead>(`/classes/${id}`, payload)
    return data
  },

  async listGroupStudents(classId: string): Promise<ClassEnrollmentRead[]> {
    const { data } = await api.get<ClassEnrollmentRead[]>(`/classes/${classId}/students`)
    return data
  },

  async enrollStudent(payload: { class_group_id: string; student_id: string; enrolled_at: string }): Promise<ClassEnrollmentRead> {
    const { data } = await api.post<ClassEnrollmentRead>('/class-enrollments', payload)
    return data
  },

  async unenrollStudent(enrollmentId: string): Promise<void> {
    await api.delete(`/class-enrollments/${enrollmentId}`)
  },

  async listPrivateClasses(params: object = {}): Promise<PaginatedResponse<PrivateClassRead>> {
    const { data } = await api.get('/private-classes', { params })
    return data
  },

  async createPrivateClass(payload: object): Promise<PrivateClassRead> {
    const { data } = await api.post<PrivateClassRead>('/private-classes', payload)
    return data
  },

  async updatePrivateClass(id: string, payload: object): Promise<PrivateClassRead> {
    const { data } = await api.put<PrivateClassRead>(`/private-classes/${id}`, payload)
    return data
  },
}
