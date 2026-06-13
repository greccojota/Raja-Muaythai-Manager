import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Avatar, Box, Button, Card, CardActions, CardContent,
  Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, MenuItem, Paper, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Groups as GroupsIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FormDrawer } from '@/components/feedback/FormDrawer'
import { PageHeader } from '@/components/ui/PageHeader'
import { api } from '@/services/api'
import { classesService } from '@/services/classes.service'
import { studentService } from '@/services/student.service'
import type { ClassGroupRead, InstructorRead, PlanModality, PrivateClassRead } from '@/types/api.types'
import { formatCurrency, formatDate } from '@/utils/format'

const WEEKDAYS = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo']
const CLASS_TYPE_LABEL: Record<string, string> = { collective: 'Coletiva', personal: 'Personal' }
const PC_STATUS_COLORS: Record<string, 'default' | 'info' | 'success' | 'error'> = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'error',
}

// ── Class Group Form ────────────────────────────────────────────

function ClassForm({ initial, instructors, onSubmit, loading }: {
  initial?: ClassGroupRead | null
  instructors: InstructorRead[]
  onSubmit: (d: object) => Promise<void>
  loading?: boolean
}) {
  const firstSchedule = initial?.schedules?.[0]
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    class_type: initial?.class_type ?? 'collective',
    instructor_id: initial?.instructor?.id ?? '',
    max_students: initial?.max_students ?? '',
    description: initial?.description ?? '',
    weekday: firstSchedule?.weekday ?? 0,
    start_time: firstSchedule?.start_time?.slice(0, 5) ?? '19:00',
    end_time: firstSchedule?.end_time?.slice(0, 5) ?? '20:00',
  })

  const payload = {
    name: form.name,
    class_type: form.class_type,
    instructor_id: form.instructor_id || undefined,
    max_students: form.max_students ? +form.max_students : undefined,
    description: form.description || undefined,
    schedules: [{ weekday: +form.weekday, start_time: form.start_time, end_time: form.end_time }],
  }

  return (
    <Box component="form" onSubmit={e => { e.preventDefault(); onSubmit(payload) }} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={8}>
          <TextField label="Nome da turma *" fullWidth required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Tipo *" select fullWidth value={form.class_type} onChange={e => setForm(p => ({ ...p, class_type: e.target.value as PlanModality }))}>
            <MenuItem value="collective">Coletiva</MenuItem>
            <MenuItem value="personal">Personal</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField label="Professor responsavel" select fullWidth value={form.instructor_id} onChange={e => setForm(p => ({ ...p, instructor_id: e.target.value }))}>
            <MenuItem value="">Nenhum</MenuItem>
            {instructors.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Limite de alunos" type="number" fullWidth value={form.max_students} onChange={e => setForm(p => ({ ...p, max_students: e.target.value }))} inputProps={{ min: 1 }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Dia" select fullWidth value={form.weekday} onChange={e => setForm(p => ({ ...p, weekday: +e.target.value }))}>
            {WEEKDAYS.map((day, index) => <MenuItem key={day} value={index}>{day}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField label="Inicio" type="time" fullWidth value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField label="Fim" type="time" fullWidth value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Descricao" multiline rows={3} fullWidth value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button type="submit" variant="contained" size="large" disabled={loading || !form.name} sx={{ minWidth: 140 }}>
          {loading ? <CircularProgress size={22} color="inherit" /> : initial ? 'Salvar' : 'Criar turma'}
        </Button>
      </Box>
    </Box>
  )
}

// ── Private Class Form ──────────────────────────────────────────

function PrivateClassForm({ initial, instructors, students, onSubmit, loading }: {
  initial?: PrivateClassRead | null
  instructors: InstructorRead[]
  students: Array<{ id: string; name: string }>
  onSubmit: (d: object) => Promise<void>
  loading?: boolean
}) {
  const [form, setForm] = useState({
    student_id: initial?.student_id ?? '',
    instructor_id: initial?.instructor?.id ?? '',
    scheduled_at: initial?.scheduled_at ?? '',
    start_time: initial?.start_time?.slice(0, 5) ?? '10:00',
    duration_minutes: initial?.duration_minutes ?? 60,
    value: initial?.value ?? '',
    notes: initial?.notes ?? '',
  })

  const payload = {
    student_id: form.student_id || undefined,
    instructor_id: form.instructor_id || undefined,
    scheduled_at: form.scheduled_at,
    start_time: form.start_time,
    duration_minutes: +form.duration_minutes,
    value: form.value ? +form.value : 0,
    notes: form.notes || undefined,
  }

  return (
    <Box component="form" onSubmit={e => { e.preventDefault(); onSubmit(payload) }} noValidate>
      <Grid container spacing={2}>
        {!initial && (
          <Grid item xs={12}>
            <TextField label="Aluno *" select fullWidth required value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))}>
              <MenuItem value="">Selecione...</MenuItem>
              {students.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <TextField label="Professor" select fullWidth value={form.instructor_id} onChange={e => setForm(p => ({ ...p, instructor_id: e.target.value }))}>
            <MenuItem value="">Nenhum</MenuItem>
            {instructors.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Data *" type="date" fullWidth required value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField label="Horario" type="time" fullWidth value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField label="Duracao (min)" type="number" fullWidth value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: +e.target.value }))} inputProps={{ min: 15, step: 15 }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Valor (R$)" type="number" fullWidth value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} inputProps={{ min: 0, step: 0.01 }} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Observacoes" multiline rows={2} fullWidth value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button type="submit" variant="contained" size="large" disabled={loading || !form.student_id || !form.scheduled_at} sx={{ minWidth: 140 }}>
          {loading ? <CircularProgress size={22} color="inherit" /> : initial ? 'Salvar' : 'Agendar aula'}
        </Button>
      </Box>
    </Box>
  )
}

// ── Main Page ───────────────────────────────────────────────────

export function ClassesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState(0)

  // Turmas state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<ClassGroupRead | null>(null)
  const [studentsDialog, setStudentsDialog] = useState<ClassGroupRead | null>(null)
  const [studentToEnroll, setStudentToEnroll] = useState('')
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<ClassGroupRead | null>(null)

  // Aulas particulares state
  const [pcDrawerOpen, setPcDrawerOpen] = useState(false)
  const [pcEditing, setPcEditing] = useState<PrivateClassRead | null>(null)
  const [pcCancelTarget, setPcCancelTarget] = useState<PrivateClassRead | null>(null)
  const [pcPage, setPcPage] = useState(0)
  const [pcStudentFilter, setPcStudentFilter] = useState('')

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesService.listGroups(false),
  })
  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => api.get('/instructors').then(r => r.data as InstructorRead[]),
  })
  const { data: classStudents } = useQuery({
    queryKey: ['class-students', studentsDialog?.id],
    queryFn: () => classesService.listGroupStudents(studentsDialog!.id),
    enabled: !!studentsDialog,
  })
  const { data: students } = useQuery({
    queryKey: ['students-active-for-class'],
    queryFn: () => studentService.list({ status: 'active', size: 200 }),
  })
  const { data: privateClasses, isLoading: pcLoading } = useQuery({
    queryKey: ['private-classes', pcStudentFilter, pcPage],
    queryFn: () =>
      classesService.listPrivateClasses({
        student_id: pcStudentFilter || undefined,
        page: pcPage + 1,
        size: 30,
      }),
    enabled: tab === 1,
  })

  const invalidateClasses = () => queryClient.invalidateQueries({ queryKey: ['classes'] })
  const invalidatePC = () => queryClient.invalidateQueries({ queryKey: ['private-classes'] })

  const createMutation = useMutation({
    mutationFn: async (d: object) => { await classesService.createGroup(d) },
    onSuccess: () => { invalidateClasses(); setDrawerOpen(false) },
  })
  const updateMutation = useMutation({
    mutationFn: async (d: object) => { await classesService.updateGroup(editing!.id, d) },
    onSuccess: () => { invalidateClasses(); setEditing(null) },
  })
  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) => classesService.deleteGroup(id),
    onSuccess: () => { invalidateClasses(); setDeleteGroupTarget(null) },
  })
  const enrollStudentMutation = useMutation({
    mutationFn: async () => {
      await classesService.enrollStudent({
        class_group_id: studentsDialog!.id,
        student_id: studentToEnroll,
        enrolled_at: new Date().toISOString().slice(0, 10),
      })
    },
    onSuccess: () => {
      invalidateClasses()
      queryClient.invalidateQueries({ queryKey: ['class-students', studentsDialog?.id] })
      setStudentToEnroll('')
    },
  })
  const unenrollStudentMutation = useMutation({
    mutationFn: (enrollmentId: string) => classesService.unenrollStudent(enrollmentId),
    onSuccess: () => {
      invalidateClasses()
      queryClient.invalidateQueries({ queryKey: ['class-students', studentsDialog?.id] })
    },
  })
  const createPCMutation = useMutation({
    mutationFn: async (d: object) => { await classesService.createPrivateClass(d) },
    onSuccess: () => { invalidatePC(); setPcDrawerOpen(false) },
  })
  const updatePCMutation = useMutation({
    mutationFn: async (d: object) => { await classesService.updatePrivateClass(pcEditing!.id, d) },
    onSuccess: () => { invalidatePC(); setPcEditing(null) },
  })
  const cancelPCMutation = useMutation({
    mutationFn: (id: string) => classesService.cancelPrivateClass(id),
    onSuccess: () => { invalidatePC(); setPcCancelTarget(null) },
  })

  const classIsFull =
    !!studentsDialog?.max_students &&
    (classStudents?.length ?? studentsDialog.enrolled_count ?? 0) >= studentsDialog.max_students

  const studentList = students?.items ?? []

  return (
    <Box>
      <PageHeader
        title="Aulas"
        subtitle="Turmas coletivas, aulas particulares, horarios e professores"
        actionLabel={tab === 0 ? 'Nova turma' : 'Agendar aula'}
        onAction={() => tab === 0 ? setDrawerOpen(true) : setPcDrawerOpen(true)}
      />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab label="Turmas coletivas" />
        <Tab label="Aulas particulares" />
      </Tabs>

      {/* ── Tab 0: Turmas ── */}
      {tab === 0 && (
        <Box>
          {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress /></Box>}
          <Grid container spacing={2}>
            {(classes ?? []).map(c => (
              <Grid item xs={12} sm={6} lg={4} key={c.id}>
                <Card sx={{ opacity: c.is_active ? 1 : 0.55, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                      <Typography variant="h6" fontWeight={700}>{c.name}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                        <Chip label={CLASS_TYPE_LABEL[c.class_type ?? 'collective']} size="small" color={c.class_type === 'personal' ? 'secondary' : 'primary'} variant="outlined" />
                        {!c.is_active && <Chip label="Inativa" size="small" color="default" />}
                      </Box>
                    </Box>
                    {c.instructor && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: 'secondary.main' }}>{c.instructor.name[0]}</Avatar>
                        <Typography variant="body2" color="text.secondary">{c.instructor.name}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                      {c.schedules.map(s => (
                        <Chip
                          key={s.id}
                          size="small"
                          variant="outlined"
                          icon={<ScheduleIcon sx={{ fontSize: '14px !important' }} />}
                          label={`${s.weekday_name ?? WEEKDAYS[s.weekday]} ${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`}
                        />
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <GroupsIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {c.enrolled_count ?? 0} aluno(s){c.max_students && ` / max. ${c.max_students}`}
                      </Typography>
                    </Box>
                    {c.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {c.description}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0, gap: 0.5 }}>
                    <Tooltip title="Ver alunos">
                      <Button size="small" startIcon={<GroupsIcon />} onClick={() => setStudentsDialog(c)}>Alunos</Button>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => setEditing(c)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    {c.is_active && (
                      <Tooltip title="Desativar turma">
                        <IconButton size="small" color="error" onClick={() => setDeleteGroupTarget(c)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* ── Tab 1: Aulas Particulares ── */}
      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              label="Filtrar por aluno"
              select
              size="small"
              value={pcStudentFilter}
              onChange={e => { setPcStudentFilter(e.target.value); setPcPage(0) }}
              sx={{ width: 240 }}
            >
              <MenuItem value="">Todos os alunos</MenuItem>
              {studentList.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
            {pcStudentFilter && (
              <Button size="small" variant="text" onClick={() => { setPcStudentFilter(''); setPcPage(0) }}>
                Limpar filtro
              </Button>
            )}
          </Box>

          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small" sx={{ minWidth: { xs: 640, md: 0 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Aluno</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Professor</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Horario</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Duracao</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Acoes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pcLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : (privateClasses?.items ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Nenhuma aula particular encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (privateClasses?.items ?? []).map((pc) => (
                      <TableRow key={pc.id} hover sx={{ opacity: pc.status === 'cancelled' ? 0.55 : 1 }}>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}
                            onClick={() => navigate(`/students/${pc.student_id}`)}
                          >
                            {pc.student_name ?? '-'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: 'text.secondary', fontSize: 13 }}>
                          {pc.instructor?.name ?? '—'}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(pc.scheduled_at)}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary', fontSize: 13 }}>
                          {pc.start_time.slice(0, 5)}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary', fontSize: 13 }}>
                          {pc.duration_minutes} min
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {formatCurrency(+pc.value)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pc.status === 'scheduled' ? 'Agendada' : pc.status === 'completed' ? 'Concluida' : 'Cancelada'}
                            size="small"
                            color={PC_STATUS_COLORS[pc.status] ?? 'default'}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          {pc.status !== 'cancelled' && (
                            <>
                              <Tooltip title="Editar">
                                <IconButton size="small" onClick={() => setPcEditing(pc)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancelar aula">
                                <IconButton size="small" color="error" onClick={() => setPcCancelTarget(pc)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
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
              count={privateClasses?.total ?? 0}
              page={pcPage}
              rowsPerPage={30}
              onPageChange={(_, p) => setPcPage(p)}
              rowsPerPageOptions={[30]}
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </Paper>
        </Box>
      )}

      {/* ── Students dialog ── */}
      <Dialog open={!!studentsDialog} onClose={() => setStudentsDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{studentsDialog?.name} — Alunos</DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          {classIsFull && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Esta turma atingiu o limite de {studentsDialog?.max_students} aluno(s). Remova alguem ou aumente o limite para vincular novos alunos.
            </Alert>
          )}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Aluno"
              select
              size="small"
              value={studentToEnroll}
              onChange={e => setStudentToEnroll(e.target.value)}
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 220 } }}
              disabled={classIsFull}
            >
              {studentList
                .filter(s => !(classStudents ?? []).some(e => e.student_id === s.id))
                .map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
            <Button
              variant="contained"
              disabled={!studentToEnroll || classIsFull || enrollStudentMutation.isPending}
              onClick={() => enrollStudentMutation.mutate()}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              {enrollStudentMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Vincular'}
            </Button>
          </Box>
          {(classStudents ?? []).length === 0 ? (
            <Alert severity="info">Nenhum aluno matriculado nesta turma.</Alert>
          ) : (
            (classStudents ?? []).map(s => (
              <Box
                key={s.id}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>{s.student_name?.[0]}</Avatar>
                <Typography
                  variant="body2"
                  sx={{ flex: 1, cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}
                  onClick={() => navigate(`/students/${s.student_id}`)}
                >
                  {s.student_name}
                </Typography>
                <Button
                  size="small"
                  color="error"
                  onClick={() => unenrollStudentMutation.mutate(s.id)}
                  disabled={unenrollStudentMutation.isPending}
                >
                  Remover
                </Button>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStudentsDialog(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete group confirmation ── */}
      <Dialog open={!!deleteGroupTarget} onClose={() => setDeleteGroupTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Desativar turma</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            A turma <strong>{deleteGroupTarget?.name}</strong> sera desativada. Os alunos vinculados nao serao removidos, mas a turma deixara de aparecer nas listagens ativas.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteGroupTarget(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteGroupMutation.isPending}
            onClick={() => deleteGroupTarget && deleteGroupMutation.mutate(deleteGroupTarget.id)}
          >
            {deleteGroupMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Desativar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Cancel private class confirmation ── */}
      <Dialog open={!!pcCancelTarget} onClose={() => setPcCancelTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancelar aula particular</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            A aula de <strong>{pcCancelTarget?.student_name}</strong> em {formatDate(pcCancelTarget?.scheduled_at)} sera cancelada.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setPcCancelTarget(null)}>Voltar</Button>
          <Button
            variant="contained"
            color="error"
            disabled={cancelPCMutation.isPending}
            onClick={() => pcCancelTarget && cancelPCMutation.mutate(pcCancelTarget.id)}
          >
            {cancelPCMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Confirmar cancelamento'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Class group drawers ── */}
      <FormDrawer open={drawerOpen} title="Nova turma" onClose={() => setDrawerOpen(false)} width={620}>
        <ClassForm instructors={instructors} onSubmit={d => createMutation.mutateAsync(d)} loading={createMutation.isPending} />
      </FormDrawer>
      <FormDrawer open={!!editing} title="Editar turma" onClose={() => setEditing(null)} width={620}>
        {editing && (
          <ClassForm
            initial={editing}
            instructors={instructors}
            onSubmit={d => updateMutation.mutateAsync(d)}
            loading={updateMutation.isPending}
          />
        )}
      </FormDrawer>

      {/* ── Private class drawers ── */}
      <FormDrawer open={pcDrawerOpen} title="Agendar aula particular" onClose={() => setPcDrawerOpen(false)} width={560}>
        <PrivateClassForm
          instructors={instructors}
          students={studentList}
          onSubmit={d => createPCMutation.mutateAsync(d)}
          loading={createPCMutation.isPending}
        />
      </FormDrawer>
      <FormDrawer open={!!pcEditing} title="Editar aula particular" onClose={() => setPcEditing(null)} width={560}>
        {pcEditing && (
          <PrivateClassForm
            initial={pcEditing}
            instructors={instructors}
            students={studentList}
            onSubmit={d => updatePCMutation.mutateAsync(d)}
            loading={updatePCMutation.isPending}
          />
        )}
      </FormDrawer>
    </Box>
  )
}
