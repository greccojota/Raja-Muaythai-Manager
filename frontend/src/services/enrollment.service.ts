import { api } from './api'
import type {
  AccountsReceivableRead,
  DelinquentStudentRead,
  EnrollmentCreate,
  EnrollmentRead,
  PaginatedResponse,
  PaymentCreate,
} from '@/types/api.types'

export const enrollmentService = {
  async enroll(payload: EnrollmentCreate): Promise<EnrollmentRead> {
    const { data } = await api.post<EnrollmentRead>('/enrollments', payload)
    return data
  },

  async getByStudent(studentId: string): Promise<EnrollmentRead[]> {
    const { data } = await api.get<EnrollmentRead[]>(`/students/${studentId}/enrollments`)
    return data
  },

  async cancel(enrollmentId: string, reason?: string): Promise<void> {
    await api.delete(`/enrollments/${enrollmentId}`, { params: { reason } })
  },

  async getARByStudent(studentId: string): Promise<AccountsReceivableRead[]> {
    const { data } = await api.get<AccountsReceivableRead[]>(
      `/students/${studentId}/accounts-receivable`
    )
    return data
  },

  async getPendingAR(page = 1, size = 50): Promise<PaginatedResponse<AccountsReceivableRead>> {
    const { data } = await api.get('/financial/pending', { params: { page, size } })
    return data
  },

  async getDelinquents(): Promise<DelinquentStudentRead[]> {
    const { data } = await api.get<DelinquentStudentRead[]>('/financial/delinquents')
    return data
  },

  async registerPayment(payload: PaymentCreate): Promise<AccountsReceivableRead> {
    const { data } = await api.post<AccountsReceivableRead>('/financial/payments', payload)
    return data
  },

  async markOverdue(): Promise<{ updated: number }> {
    const { data } = await api.post<{ updated: number }>('/financial/mark-overdue')
    return data
  },

  async sendPaymentReminders(): Promise<{ sent: number }> {
    const { data } = await api.post<{ sent: number }>('/financial/send-payment-reminders')
    return data
  },

  async processOverdue(): Promise<{ notices_sent: number; inactivated: number }> {
    const { data } = await api.post<{ notices_sent: number; inactivated: number }>('/financial/process-overdue')
    return data
  },
}
