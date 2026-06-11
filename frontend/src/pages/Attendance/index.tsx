import { useState } from 'react'
import {
  Alert, Avatar, Box, Button, Card, CardContent, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid,
  IconButton, MenuItem, Paper, Tab, Tabs, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TextField,
  Tooltip, Typography,
} from '@mui/material'
import { Delete as DeleteIcon, EventNote as SessionIcon } from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { attendanceService } from '@/services/attendance.service'
import { classesService } from '@/services/classes.service'
import { studentService } from '@/services/student.service'
import type { AttendanceRead, AttendanceSummary } from '@/types/api.types'
import { formatDate, formatDateTime } from '@/utils/format'

export function AttendancePage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState(0)
  const [page, setPage] = useState(0)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AttendanceRead | null>(null)
  const [form, setForm] = useState({ student_id: '', class_group_id: '', check_in_type: 'manual', notes: '' })

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance', page],
    queryFn: () => attendanceService.list({ page: page + 1, size: 50 }),
  })
  const { data: frequency } = useQuery({ queryKey: ['attendance-frequency'], queryFn: () => attendanceService.getFrequency() })
  const { data: students } = useQuery({ queryKey: ['students-all'], queryFn: () => studentService.list({ size: 200 }) })
  const { data: classes } = useQuery({ queryKey: ['classes-active'], queryFn: () => classesService.listGroups(true) })

  const createMutation = useMutation({
    mutationFn: async (d: typeof form) => {
      await attendanceService.checkIn({
        student_id: d.student_id,
        class_group_id: d.class_group_id || undefined,
        check_in_type: d.check_in_type,
        notes: d.notes || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-frequency'] })
      setSessionOpen(false)
      setForm({ student_id: '', class_group_id: '', check_in_type: 'manual', notes: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => attendanceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-frequency'] })
      setDeleteTarget(null)
    },
  })

  return (
    <Box>
      <PageHeader title="Registro de aulas" subtitle="Historico de sessoes realizadas e frequencia" actionLabel="Registrar aula" actionIcon={<SessionIcon />} onAction={() => setSessionOpen(true)} />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab label={`Historico (${attendanceData?.total ?? 0})`} />
        <Tab label="Frequencia por aluno" />
      </Tabs>

      {tab === 0 && (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small" sx={{ minWidth: { xs: 620, sm: 0 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Aluno</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Turma</TableCell>
                  <TableCell>Data/hora</TableCell>
                  <TableCell align="right">Acao</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
                ) : (attendanceData?.items ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>Nenhuma aula registrada.</TableCell></TableRow>
                ) : (
                  (attendanceData?.items ?? []).map((a: AttendanceRead) => (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}>{a.student_name?.[0]}</Avatar>
                          <Typography variant="body2" fontWeight={600}>{a.student_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary', fontSize: 13 }}>{a.class_group_name ?? '-'}</TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{formatDateTime(a.check_in_at)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Remover">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(a)}><DeleteIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={attendanceData?.total ?? 0} page={page} rowsPerPage={50} onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[50]} labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`} />
        </Paper>
      )}

      {tab === 1 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Total de presencas por aluno no mes corrente e historico geral.</Typography>
          <Grid container spacing={2}>
            {(frequency ?? []).map((f: AttendanceSummary) => (
              <Grid item xs={12} sm={6} md={4} key={f.student_id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>{f.student_name[0]}</Avatar>
                      <Typography fontWeight={700}>{f.student_name}</Typography>
                    </Box>
                    <Divider sx={{ mb: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box sx={{ textAlign: 'center' }}><Typography variant="h5" fontWeight={800} color="primary.main">{f.checkins_this_month}</Typography><Typography variant="caption" color="text.secondary">Este mes</Typography></Box>
                      <Box sx={{ textAlign: 'center' }}><Typography variant="h5" fontWeight={800}>{f.total_checkins}</Typography><Typography variant="caption" color="text.secondary">Total</Typography></Box>
                      <Box sx={{ textAlign: 'center' }}><Typography variant="caption" color="text.secondary" display="block">Ultimo</Typography><Typography variant="caption">{formatDate(f.last_checkin?.slice(0, 10))}</Typography></Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {(frequency ?? []).length === 0 && <Grid item xs={12}><Alert severity="info">Nenhuma aula registrada ainda.</Alert></Grid>}
          </Grid>
        </Box>
      )}

      <Dialog open={sessionOpen} onClose={() => setSessionOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Registrar aula</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Aluno *" select fullWidth value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))}>
            {(students?.items ?? []).map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>
          <TextField label="Turma" select fullWidth value={form.class_group_id} onChange={e => setForm(p => ({ ...p, class_group_id: e.target.value }))}>
            <MenuItem value="">Livre</MenuItem>
            {(classes ?? []).map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField label="Observacoes" fullWidth value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
          <Button onClick={() => setSessionOpen(false)} sx={{ width: { xs: '100%', sm: 'auto' } }}>Cancelar</Button>
          <Button variant="contained" disabled={!form.student_id || createMutation.isPending} sx={{ width: { xs: '100%', sm: 'auto' } }} onClick={() => createMutation.mutate(form)}>
            {createMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} title="Remover registro" message={`Remover registro de aula de "${deleteTarget?.student_name}"?`} loading={deleteMutation.isPending} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} onClose={() => setDeleteTarget(null)} />
    </Box>
  )
}
