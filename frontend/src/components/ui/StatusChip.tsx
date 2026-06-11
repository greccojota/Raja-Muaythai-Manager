import { Chip } from '@mui/material'

const STUDENT_STATUS: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }> = {
  active:    { label: 'Ativo',        color: 'success' },
  inactive:  { label: 'Inativo',      color: 'default' },
  suspended: { label: 'Suspenso',     color: 'error' },
  pending:   { label: 'Pendente',     color: 'warning' },
}

const ENROLLMENT_STATUS: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }> = {
  active:    { label: 'Ativa',      color: 'success' },
  cancelled: { label: 'Cancelada',  color: 'error' },
  expired:   { label: 'Expirada',   color: 'warning' },
  suspended: { label: 'Suspensa',   color: 'warning' },
}

const AR_STATUS: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }> = {
  pending:   { label: 'Pendente',   color: 'warning' },
  paid:      { label: 'Pago',       color: 'success' },
  overdue:   { label: 'Em atraso',  color: 'error' },
  cancelled: { label: 'Cancelado',  color: 'default' },
}

interface StatusChipProps {
  status: string
  type?: 'student' | 'enrollment' | 'ar'
  size?: 'small' | 'medium'
}

export function StatusChip({ status, type = 'student', size = 'small' }: StatusChipProps) {
  const map = type === 'enrollment' ? ENROLLMENT_STATUS : type === 'ar' ? AR_STATUS : STUDENT_STATUS
  const cfg = map[status] ?? { label: status, color: 'default' as const }
  return <Chip label={cfg.label} color={cfg.color} size={size} />
}
