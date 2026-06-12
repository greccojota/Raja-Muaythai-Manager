import { useState } from 'react'
import {
  Alert, Avatar, Box, Chip, CircularProgress, IconButton,
  InputAdornment, MenuItem, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { FormDrawer } from '@/components/feedback/FormDrawer'
import { PageHeader } from '@/components/ui/PageHeader'
import { instructorService } from '@/services/instructor.service'
import type { InstructorCreate, InstructorRead } from '@/types/api.types'
import { InstructorForm } from './InstructorForm'

const ACTIVE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Ativos' },
  { value: 'false', label: 'Inativos' },
]

export function InstructorsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('true')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<InstructorRead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InstructorRead | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['instructors', activeFilter],
    queryFn: () =>
      instructorService.list(activeFilter !== '' ? { active_only: activeFilter === 'true' } : {}),
  })

  const filtered = (data ?? []).filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.email?.toLowerCase().includes(search.toLowerCase()) ||
    i.specialization?.toLowerCase().includes(search.toLowerCase())
  )

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['instructors'] })

  const createMutation = useMutation({
    mutationFn: (d: InstructorCreate) => instructorService.create(d),
    onSuccess: () => { invalidate(); closeDrawer() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InstructorCreate> }) =>
      instructorService.update(id, data),
    onSuccess: () => { invalidate(); closeDrawer() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => instructorService.delete(id),
    onSuccess: () => { invalidate(); setDeleteTarget(null) },
  })

  const closeDrawer = () => { setDrawerOpen(false); setEditing(null) }

  const handleSubmit = async (data: InstructorCreate) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <Box>
      <PageHeader
        title="Professores"
        subtitle="Gerencie o cadastro e disponibilidade dos instrutores"
        actionLabel="Novo professor"
        onAction={() => { setEditing(null); setDrawerOpen(true) }}
      />

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Buscar por nome, e-mail, especializacao..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: { xs: '100%', sm: 260 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
        />
        <TextField
          size="small"
          select
          label="Status"
          value={activeFilter}
          onChange={e => setActiveFilter(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 150 } }}
        >
          {ACTIVE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Erro ao carregar professores.</Alert>}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Professor</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Contato</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Especializacao</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Acoes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhum professor encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(inst => (
                  <TableRow key={inst.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>
                          {inst.name[0]}
                        </Avatar>
                        <Box>
                          <Box sx={{ fontWeight: 600 }}>{inst.name}</Box>
                          {inst.email && (
                            <Box sx={{ fontSize: 12, color: 'text.secondary' }}>{inst.email}</Box>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {inst.phone || '-'}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {inst.specialization || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={inst.is_active ? 'Ativo' : 'Inativo'}
                        color={inst.is_active ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => { setEditing(inst); setDrawerOpen(true) }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(inst)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <FormDrawer
        open={drawerOpen}
        title={editing ? 'Editar professor' : 'Novo professor'}
        onClose={closeDrawer}
        width={600}
      >
        <InstructorForm
          initial={editing}
          onSubmit={handleSubmit}
          loading={isMutating}
        />
      </FormDrawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir professor"
        message={`Deseja excluir o professor "${deleteTarget?.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  )
}
