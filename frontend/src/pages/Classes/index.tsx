import { useState } from 'react'
import {
  Alert, Avatar, Box, Button, Card, CardActions, CardContent,
  Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, MenuItem, TextField, Tooltip, Typography,
} from '@mui/material'
import {
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
import type { ClassGroupRead, InstructorRead, PlanModality } from '@/types/api.types'

const WEEKDAYS = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo']
const CLASS_TYPE_LABEL: Record<string, string> = { collective: 'Coletiva', personal: 'Personal' }

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

export function ClassesPage() {
  const queryClient = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<ClassGroupRead | null>(null)
  const [studentsDialog, setStudentsDialog] = useState<ClassGroupRead | null>(null)
  const [studentToEnroll, setStudentToEnroll] = useState('')

  const { data: classes, isLoading } = useQuery({ queryKey: ['classes'], queryFn: () => classesService.listGroups(false) })
  const { data: instructors = [] } = useQuery({ queryKey: ['instructors'], queryFn: () => api.get('/instructors').then(r => r.data as InstructorRead[]) })
  const { data: classStudents } = useQuery({ queryKey: ['class-students', studentsDialog?.id], queryFn: () => classesService.listGroupStudents(studentsDialog!.id), enabled: !!studentsDialog })
  const { data: students } = useQuery({ queryKey: ['students-active-for-class'], queryFn: () => studentService.list({ status: 'active', size: 100 }) })

  const createMutation = useMutation({
    mutationFn: async (d: object) => { await classesService.createGroup(d) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes'] }); setDrawerOpen(false) },
  })
  const updateMutation = useMutation({
    mutationFn: async (d: object) => { await classesService.updateGroup(editing!.id, d) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes'] }); setEditing(null) },
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
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['class-students', studentsDialog?.id] })
      setStudentToEnroll('')
    },
  })
  const unenrollStudentMutation = useMutation({
    mutationFn: (enrollmentId: string) => classesService.unenrollStudent(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['class-students', studentsDialog?.id] })
    },
  })

  const classIsFull = !!studentsDialog?.max_students && (classStudents?.length ?? studentsDialog.enrolled_count ?? 0) >= studentsDialog.max_students

  return (
    <Box>
      <PageHeader title="Aulas" subtitle="Turmas coletivas, aulas personal, horarios e professores" actionLabel="Nova turma" onAction={() => setDrawerOpen(true)} />

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress /></Box>}

      <Grid container spacing={2}>
        {(classes ?? []).map(c => (
          <Grid item xs={12} sm={6} lg={4} key={c.id}>
            <Card sx={{ opacity: c.is_active ? 1 : 0.6, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                  <Typography variant="h6" fontWeight={700}>{c.name}</Typography>
                  <Chip label={CLASS_TYPE_LABEL[c.class_type ?? 'collective']} size="small" color={c.class_type === 'personal' ? 'secondary' : 'primary'} variant="outlined" />
                </Box>
                {c.instructor && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: 'secondary.main' }}>{c.instructor.name[0]}</Avatar>
                    <Typography variant="body2" color="text.secondary">{c.instructor.name}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                  {c.schedules.map(s => (
                    <Chip key={s.id} size="small" variant="outlined" icon={<ScheduleIcon sx={{ fontSize: '14px !important' }} />} label={`${s.weekday_name ?? WEEKDAYS[s.weekday]} ${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`} />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <GroupsIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">{c.enrolled_count ?? 0} aluno(s){c.max_students && ` / max. ${c.max_students}`}</Typography>
                </Box>
                {c.description && <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{c.description}</Typography>}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <Tooltip title="Ver alunos"><Button size="small" startIcon={<GroupsIcon />} onClick={() => setStudentsDialog(c)}>Alunos</Button></Tooltip>
                <Tooltip title="Editar"><IconButton size="small" onClick={() => setEditing(c)}><EditIcon fontSize="small" /></IconButton></Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={!!studentsDialog} onClose={() => setStudentsDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{studentsDialog?.name} - Alunos</DialogTitle>
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
              {(students?.items ?? [])
                .filter(student => !(classStudents ?? []).some(enrolled => enrolled.student_id === student.id))
                .map(student => <MenuItem key={student.id} value={student.id}>{student.name}</MenuItem>)}
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

          {(classStudents ?? []).length === 0 ? <Alert severity="info">Nenhum aluno matriculado nesta turma.</Alert> : (classStudents ?? []).map(s => (
            <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>{s.student_name?.[0]}</Avatar>
              <Typography variant="body2" sx={{ flex: 1 }}>{s.student_name}</Typography>
              <Button size="small" color="error" onClick={() => unenrollStudentMutation.mutate(s.id)} disabled={unenrollStudentMutation.isPending}>
                Remover
              </Button>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => setStudentsDialog(null)} sx={{ width: { xs: '100%', sm: 'auto' } }}>Fechar</Button></DialogActions>
      </Dialog>

      <FormDrawer open={drawerOpen} title="Nova turma" onClose={() => setDrawerOpen(false)} width={620}>
        <ClassForm instructors={instructors} onSubmit={d => createMutation.mutateAsync(d)} loading={createMutation.isPending} />
      </FormDrawer>
      <FormDrawer open={!!editing} title="Editar turma" onClose={() => setEditing(null)} width={620}>
        {editing && <ClassForm initial={editing} instructors={instructors} onSubmit={d => updateMutation.mutateAsync(d)} loading={updateMutation.isPending} />}
      </FormDrawer>
    </Box>
  )
}
