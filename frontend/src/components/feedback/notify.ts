export type ToastSeverity = 'success' | 'info' | 'warning' | 'error'

export interface ToastMessage {
  id: number
  severity: ToastSeverity
  title: string
  message?: string
}

type ToastListener = (toast: ToastMessage) => void

const listeners = new Set<ToastListener>()
let nextId = 1

export function subscribeToToasts(listener: ToastListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifyToast(toast: Omit<ToastMessage, 'id'>) {
  const payload = { ...toast, id: nextId++ }
  listeners.forEach(listener => listener(payload))
}

export function getErrorMessage(error: unknown) {
  const anyError = error as any
  const detail = anyError?.response?.data?.detail
  if (Array.isArray(detail)) return detail.map(item => item?.msg ?? String(item)).join('\n')
  if (typeof detail === 'string') return detail
  if (anyError?.message) return anyError.message
  return 'Nao foi possivel concluir a operacao.'
}
