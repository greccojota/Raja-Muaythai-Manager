import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Box, Chip, CircularProgress, IconButton, MenuItem,
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, TextField, Tooltip,
} from '@mui/material'
import {
  Cancel as CancelIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { enrollmentService } from '@/services/enrollment.service'
import type { EnrollmentRead } from '@/types/api.types'
import { formatCurrency, formatDate } from '@/utils/format'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Ativa' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'expired', label: 'Expirada' },
  { value: 'suspended', label: 'Suspensa' },
]

const STATUS_COLOR: Record<string, 'success' | 'error' | 'default' | 'warning'> = {
  active: 'success',
  cancelled: 'error',
  expired: 'default',
  suspended: 'warning',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativa',
  cancelled: 'Cancelada',
  expired: 'Expirada',
  suspended: 'Suspensa',
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'PIX',
  debit: 'Débito',
  credit: 'Crédito',
  transfer: 'Transferência',
}

export function EnrollmentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('active')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [cancelTarget, setCancelTarget] = useState<EnrollmentRead | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['enrollments', statusFilter, page, rowsPerPage],
    queryFn: () =>
      enrollmentService.list({
        status: statusFilter || undefined,
        page: page + 1,
        size: rowsPerPage,
      }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => enrollmentService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      setCancelTarget(null)
    },
  })

  return (
    <Box>
      <PageHeader
        title="Matrículas"
        subtitle="Gerencie e acompanhe as matrículas de todos os alunos"
      />

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          select
          label="Status"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          sx={{ minWidth: 160 }}
        >
          {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Erro ao carregar matrículas.</Alert>}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Aluno</TableCell>
                <TableCell>Plano</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Início</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Vencimento</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Valor</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Pagamento</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : (data?.items ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhuma matrícula encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                (data?.items ?? []).map(enrollment => (
                  <TableRow key={enrollment.id} hover>
                    <TableCell>
                      <Box sx={{ fontWeight: 600, fontSize: 13 }}>
                        {enrollment.student_name ?? enrollment.student_id.slice(0, 8) + '…'}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {enrollment.plan?.name ?? '-'}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontSize: 13 }}>
                      {formatDate(enrollment.start_date)}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: 13 }}>
                      {enrollment.end_date ? formatDate(enrollment.end_date) : '-'}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, fontSize: 13 }}>
                      {formatCurrency(+enrollment.final_monthly_value)}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontSize: 13 }}>
                      {PAYMENT_LABEL[enrollment.payment_method] ?? enrollment.payment_method}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={STATUS_LABEL[enrollment.status] ?? enrollment.status}
                        color={STATUS_COLOR[enrollment.status] ?? 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver aluno">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/students/${enrollment.student_id}`)}
                        >
                          <PersonIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {enrollment.status === 'active' && (
                        <Tooltip title="Cancelar matrícula">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setCancelTarget(enrollment)}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={data?.total ?? 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0) }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancelar matrícula"
        message={`Deseja cancelar a matrícula de "${cancelTarget?.student_name ?? 'este aluno'}" no plano "${cancelTarget?.plan?.name ?? '-'}"? O aluno será marcado como inativo.`}
        confirmLabel="Cancelar matrícula"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}
        onClose={() => setCancelTarget(null)}
      />
    </Box>
  )
}
