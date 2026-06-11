import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Avatar, Box, Chip, CircularProgress, IconButton, InputAdornment,
  MenuItem, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, TextField, Tooltip,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { FormDrawer } from '@/components/feedback/FormDrawer'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusChip } from '@/components/ui/StatusChip'
import { studentService } from '@/services/student.service'
import type { StudentCreate, StudentListItem } from '@/types/api.types'
import { StudentForm } from './StudentForm'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'suspended', label: 'Suspenso' },
  { value: 'pending', label: 'Pendente' },
]

const MODALITY_LABEL: Record<string, string> = {
  muaythai: 'Muay Thai',
  boxing: 'Boxe',
  both: 'Muay Thai e Boxe',
}

export function StudentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StudentListItem | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['students', search, status, page, rowsPerPage],
    queryFn: () => studentService.list({ search: search || undefined, status: status || undefined, page: page + 1, size: rowsPerPage }),
  })

  const createMutation = useMutation({
    mutationFn: async (d: StudentCreate) => { await studentService.create(d) },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setDrawerOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setDeleteTarget(null)
    },
  })

  return (
    <Box>
      <PageHeader title="Alunos" subtitle="Gerencie dados, modalidade e situacao dos alunos" actionLabel="Novo aluno" onAction={() => setDrawerOpen(true)} />

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Buscar por nome, CPF, e-mail..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          sx={{ flex: 1, minWidth: { xs: '100%', sm: 260 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <TextField size="small" select label="Status" value={status} onChange={e => { setStatus(e.target.value); setPage(0) }} sx={{ minWidth: { xs: '100%', sm: 150 } }}>
          {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Erro ao carregar alunos.</Alert>}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: { xs: 680, md: 0 } }}>
            <TableHead>
              <TableRow>
                <TableCell>Aluno</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>CPF</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Contato</TableCell>
                <TableCell>Modalidade</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : data?.items.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Nenhum aluno encontrado.</TableCell></TableRow>
              ) : (
                (data?.items ?? []).map(s => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>{s.name[0]}</Avatar>
                        <Box>
                          <Box style={{ fontWeight: 600 }}>{s.name}</Box>
                          <Box style={{ fontSize: 12, color: '#6B7280' }}>{s.email ?? ''}</Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{s.cpf ?? '-'}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{s.whatsapp || s.phone || '-'}</TableCell>
                    <TableCell><Chip size="small" variant="outlined" label={MODALITY_LABEL[s.modality] ?? 'Muay Thai'} /></TableCell>
                    <TableCell><StatusChip status={s.status} /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver detalhes"><IconButton size="small" onClick={() => navigate(`/students/${s.id}`)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Excluir"><IconButton size="small" color="error" onClick={() => setDeleteTarget(s)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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
          labelRowsPerPage="Por pagina:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      <FormDrawer open={drawerOpen} title="Novo aluno" onClose={() => setDrawerOpen(false)} width={860}>
        <StudentForm onSubmit={data => createMutation.mutateAsync(data)} loading={createMutation.isPending} />
      </FormDrawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir aluno"
        message={`Deseja excluir o aluno "${deleteTarget?.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  )
}
