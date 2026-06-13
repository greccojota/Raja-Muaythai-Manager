import { api } from './api'
import type { AccountsReceivableRead, ARSummary, PaginatedResponse } from '@/types/api.types'

interface ListARParams {
  status?: string
  student_id?: string
  reference_month?: string
  due_date_from?: string
  due_date_to?: string
  page?: number
  size?: number
}

export const financialService = {
  async list(params: ListARParams = {}): Promise<PaginatedResponse<AccountsReceivableRead>> {
    const { data } = await api.get<PaginatedResponse<AccountsReceivableRead>>(
      '/financial/accounts-receivable',
      { params }
    )
    return data
  },

  async get(id: string): Promise<AccountsReceivableRead> {
    const { data } = await api.get<AccountsReceivableRead>(
      `/financial/accounts-receivable/${id}`
    )
    return data
  },

  async cancel(id: string, reason?: string): Promise<AccountsReceivableRead> {
    const { data } = await api.patch<AccountsReceivableRead>(
      `/financial/accounts-receivable/${id}/cancel`,
      { reason }
    )
    return data
  },

  async getSummary(): Promise<ARSummary> {
    const { data } = await api.get<ARSummary>('/financial/summary')
    return data
  },
}
