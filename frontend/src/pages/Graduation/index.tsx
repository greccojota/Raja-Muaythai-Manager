import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Avatar, Box, Button, Card, CardActions, CardContent, Checkbox,
  CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControlLabel, Grid, IconButton, MenuItem, Tab, Tabs,
  TextField, Tooltip, Typography,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { FormDrawer } from '@/components/feedback/FormDrawer'
import { PageHeader } from '@/components/ui/PageHeader'
import { api } from '@/services/api'
import { graduationService } from '@/services/graduation.service'
import { studentService } from '@/services/student.service'
import type { BeltLevelRead, GraduationEventRead, GraduationRead, InstructorRead } from '@/types/api.types'
import { formatCurrency, formatDate } from '@/utils/format'

const PRA_JIAD_PRESETS = [
  { name: 'Branco', color_hex: '#F5F5F5', description: 'Inicio da jornada e fundamentos.' },
  { name: 'Amarelo', color_hex: '#FBC02D', description: 'Base tecnica em desenvolvimento.' },
  { name: 'Verde', color_hex: '#2E7D32', description: 'Consistencia em defesa, golpes e postura.' },
  { name: 'Azul', color_hex: '#1565C0', description: 'Controle tecnico e leitura de treino.' },
  { name: 'Vermelho', color_hex: '#C62828', description: 'Nivel avancado da academia.' },
  { name: 'Preto', color_hex: '#111111', description: 'Referencia tecnica e disciplina consolidada.' },
]

// ── Belt Form ────────────────────────────────────────────────────

function BeltForm({ initial, onSubmit, loading }: {
  initial?: BeltLevelRead | null
  onSubmit: (d: object) => Promise<void>
  loading?: boolean
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    order_index: initial?.order_index ?? 1,
    color_hex: initial?.color_hex ?? '#9E9E9E',
    description: initial?.description ?? '',
  })

  return (
    <Box component="form" onSubmit={e => { e.preventDefault(); onSubmit(form) }} noValidate>
      <Grid container spacing={1} sx={{ mb: 2 }}>
        {PRA_JIAD_PRESETS.map((preset, index) => (
          <Grid item xs={6} sm={4} key={preset.name}>
            <Button fullWidth variant="outlined" size="small" onClick={() => setForm({ ...preset, order_index: index + 1 })}>
              {preset.name}
            </Button>
          </Grid>
        ))}
      </Grid>
      <TextField label="Nome do Pra Jiad *" fullWidth required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} sx={{ mb: 2 }} />
      <TextField label="Ordem (nivel)" type="number" fullWidth value={form.order_index} onChange={e => setForm(p => ({ ...p, order_index: +e.target.value }))} sx={{ mb: 2 }} inputProps={{ min: 1 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <input type="color" value={form.color_hex} onChange={e => setForm(p => ({ ...p, color_hex: e.target.value }))} style={{ width: 48, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
        <TextField label="Cor (hex)" value={form.color_hex} onChange={e => setForm(p => ({ ...p, color_hex: e.target.value }))} sx={{ flex: 1 }} />
      </Box>
      <TextField label="Descricao" multiline rows={2} fullWidth value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="contained" size="large" disabled={loading || !form.name} sx={{ minWidth: 140 }}>
          {loading ? <CircularProgress size={22} color="inherit" /> : initial ? 'Salvar' : 'Criar nivel'}
        </Button>
      </Box>
    </Box>
  )
}

// ── Event Form ───────────────────────────────────────────────────

function EventForm({ initial, instructors, onSubmit, loading }: {
  initial?: GraduationEventRead | null
  instructors: InstructorRead[]
  onSubmit: (d: object) => Promise<void>
  loading?: boolean
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    event_date: initial?.event_date ?? '',
    instructor_id: initial?.instructor?.id ?? '',
    notes: initial?.notes ?? '',
  })
  return (
    <Box component="form" onSubmit={e => { e.preventDefault(); onSubmit({ ...form, instructor_id: form.instructor_id || undefined }) }} noValidate>
      <TextField label="Nome do evento *" fullWidth required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} sx={{ mb: 2 }} />
      <TextField label="Data *" type="date" fullWidth required InputLabelProps={{ shrink: true }} value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} sx={{ mb: 2 }} />
      <TextField label="Professor responsavel" select fullWidth value={form.instructor_id} onChange={e => setForm(p => ({ ...p, instructor_id: e.target.value }))} sx={{ mb: 2 }}>
        <MenuItem value="">Nenhum</MenuItem>
        {instructors.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
      </TextField>
      <TextField label="Observacoes" multiline rows={2} fullWidth value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="contained" size="large" disabled={loading || !form.name || !form.event_date} sx={{ minWidth: 140 }}>
          {loading ? <CircularProgress size={22} color="inherit" /> : initial ? 'Salvar' : 'Criar evento'}
        </Button>
      </Box>
    </Box>
  )
}

// ── Main Page ────────────────────────────────────────────────────

export function GraduationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState(0)

  // Events
  const [eventDrawer, setEventDrawer] = useState(false)
  const [editingEvent, setEditingEvent] = useState<GraduationEventRead | null>(null)
  const [deleteEventTarget, setDeleteEventTarget] = useState<GraduationEventRead | null>(null)

  // Belts
  const [beltDrawer, setBeltDrawer] = useState(false)
  const [editingBelt, setEditingBelt] = useState<BeltLevelRead | null>(null)

  // Participants
  const [participantsEvent, setParticipantsEvent] = useState<GraduationEventRead | null>(null)
  const [registerForm, setRegisterForm] = useState({
    student_id: '', belt_id: '', instructor_id: '',
    result: 'approved', fee_paid: false, fee_amount: '', notes: '',
  })
  const [editingGrad, setEditingGrad] = useState<GraduationRead | null>(null)
  const [editGradForm, setEditGradForm] = useState({
    belt_id: '', instructor_id: '', result: '', fee_paid: false, fee_amount: '', notes: '',
  })
  const [deleteGradTarget, setDeleteGradTarget] = useState<GraduationRead | null>(null)

  const { data: belts = [] } = useQuery({ queryKey: ['belts'], queryFn: () => graduationService.listBelts() })
  const { data: events = [], isLoading } = useQuery({ queryKey: ['graduation-events'], queryFn: () => graduationService.listEvents() })
  const { data: instructors = [] } = useQuery({ queryKey: ['instructors'], queryFn: () => api.get('/instructors').then(r => r.data as InstructorRead[]) })
  const { data: students } = useQuery({ queryKey: ['students-all'], queryFn: () => studentService.list({ size: 200 }) })
  const { data: participants = [] } = useQuery({
    queryKey: ['event-participants', participantsEvent?.id],
    queryFn: () => graduationService.getEventParticipants(participantsEvent!.id),
    enabled: !!participantsEvent,
  })

  const invalidateEvents = () => queryClient.invalidateQueries({ queryKey: ['graduation-events'] })
  const invalidateParticipants = () => queryClient.invalidateQueries({ queryKey: ['event-participants', participantsEvent?.id] })

  const createEventMutation = useMutation({
    mutationFn: async (d: object) => { await graduationService.createEvent(d) },
    onSuccess: () => { invalidateEvents(); setEventDrawer(false) },
  })
  const updateEventMutation = useMutation({
    mutationFn: async (d: object) => { await graduationService.updateEvent(editingEvent!.id, d) },
    onSuccess: () => { invalidateEvents(); setEditingEvent(null) },
  })
  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => graduationService.deleteEvent(id),
    onSuccess: () => { invalidateEvents(); setDeleteEventTarget(null) },
  })

  const createBeltMutation = useMutation({
    mutationFn: async (d: object) => { await graduationService.createBelt(d) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['belts'] }); setBeltDrawer(false) },
  })
  const updateBeltMutation = useMutation({
    mutationFn: async (d: object) => { await graduationService.updateBelt(editingBelt!.id, d) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['belts'] }); setEditingBelt(null) },
  })

  const registerGradMutation = useMutation({
    mutationFn: async () => {
      await graduationService.register({
        student_id: registerForm.student_id,
        graduation_event_id: participantsEvent!.id,
        belt_id: registerForm.belt_id,
        instructor_id: registerForm.instructor_id || undefined,
        result: registerForm.result,
        fee_paid: registerForm.fee_paid,
        fee_amount: registerForm.fee_amount ? +registerForm.fee_amount : 0,
        notes: registerForm.notes || undefined,
      })
    },
    onSuccess: () => {
      invalidateParticipants()
      invalidateEvents()
      setRegisterForm({ student_id: '', belt_id: '', instructor_id: '', result: 'approved', fee_paid: false, fee_amount: '', notes: '' })
    },
  })

  const updateGradMutation = useMutation({
    mutationFn: async (d: object) => { await graduationService.updateGraduation(editingGrad!.id, d) },
    onSuccess: () => { invalidateParticipants(); setEditingGrad(null) },
  })

  const deleteGradMutation = useMutation({
    mutationFn: (id: string) => graduationService.delete(id),
    onSuccess: () => { invalidateParticipants(); invalidateEvents(); setDeleteGradTarget(null) },
  })

  const openEditGrad = (g: GraduationRead) => {
    setEditingGrad(g)
    setEditGradForm({
      belt_id: g.belt?.id ?? '',
      instructor_id: g.instructor?.id ?? '',
      result: g.result,
      fee_paid: g.fee_paid,
      fee_amount: String(g.fee_amount),
      notes: g.notes ?? '',
    })
  }

  const studentList = students?.items ?? []
  const enrolledIds = new Set(participants.map(p => p.student_id))

  return (
    <Box>
      <PageHeader
        title="Graduacao Pra Jiad"
        subtitle="Niveis, eventos e historico de evolucao dos alunos"
        actionLabel={tab === 0 ? 'Novo evento' : 'Novo Pra Jiad'}
        onAction={() => tab === 0 ? setEventDrawer(true) : setBeltDrawer(true)}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab label={`Eventos (${events.length})`} />
        <Tab label={`Pra Jiad (${belts.length})`} />
      </Tabs>

      {tab === 0 && (
        <Box>
          {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress /></Box>}
          {events.length === 0 && !isLoading && <Alert severity="info">Nenhum evento de graduacao cadastrado.</Alert>}
          <Grid container spacing={2}>
            {events.map(e => (
              <Grid item xs={12} sm={6} md={4} key={e.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <TrophyIcon color="secondary" />
                      <Typography fontWeight={700}>{e.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">{formatDate(e.event_date)}</Typography>
                    {e.instructor && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Professor: {e.instructor.name}
                      </Typography>
                    )}
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      {e.graduation_count ?? 0} graduado(s)
                    </Typography>
                    {e.notes && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        {e.notes}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                    <Tooltip title="Ver participantes">
                      <Button size="small" startIcon={<PeopleIcon />} onClick={() => setParticipantsEvent(e)}>
                        Participantes
                      </Button>
                    </Tooltip>
                    <Tooltip title="Editar evento">
                      <IconButton size="small" onClick={() => setEditingEvent(e)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir evento">
                      <IconButton size="small" color="error" onClick={() => setDeleteEventTarget(e)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          {belts.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>Cadastre os niveis Pra Jiad usados pela academia antes de registrar graduacoes.</Alert>
          )}
          <Grid container spacing={2}>
            {belts.map(b => (
              <Grid item xs={12} sm={6} md={3} key={b.id}>
                <Card sx={{ borderLeft: `6px solid ${b.color_hex ?? '#9E9E9E'}` }}>
                  <CardContent sx={{ py: '12px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography fontWeight={800}>{b.name}</Typography>
                        <Typography variant="caption" color="text.secondary">Nivel {b.order_index}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: b.color_hex ?? '#9E9E9E', border: '1px solid', borderColor: 'divider' }} />
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => setEditingBelt(b)}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    {b.description && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        {b.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* ── Participants dialog ── */}
      <Dialog open={!!participantsEvent} onClose={() => setParticipantsEvent(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon color="secondary" />
            {participantsEvent?.name} — Participantes
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          {/* Register form */}
          <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Registrar nova graduacao</Typography>
            <Grid container spacing={1.5} alignItems="flex-end">
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Aluno *"
                  select
                  fullWidth
                  size="small"
                  value={registerForm.student_id}
                  onChange={e => setRegisterForm(p => ({ ...p, student_id: e.target.value }))}
                >
                  <MenuItem value="">Selecione...</MenuItem>
                  {studentList.filter(s => !enrolledIds.has(s.id)).map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Pra Jiad *"
                  select
                  fullWidth
                  size="small"
                  value={registerForm.belt_id}
                  onChange={e => setRegisterForm(p => ({ ...p, belt_id: e.target.value }))}
                >
                  <MenuItem value="">Selecione...</MenuItem>
                  {belts.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  label="Resultado"
                  select
                  fullWidth
                  size="small"
                  value={registerForm.result}
                  onChange={e => setRegisterForm(p => ({ ...p, result: e.target.value }))}
                >
                  <MenuItem value="approved">Aprovado</MenuItem>
                  <MenuItem value="failed">Reprovado</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Button
                  variant="contained"
                  fullWidth
                  size="small"
                  disabled={!registerForm.student_id || !registerForm.belt_id || registerGradMutation.isPending}
                  onClick={() => registerGradMutation.mutate()}
                  startIcon={registerGradMutation.isPending ? <CircularProgress size={14} /> : <AddIcon />}
                >
                  Adicionar
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* List */}
          {participants.length === 0 ? (
            <Alert severity="info">Nenhum participante registrado neste evento.</Alert>
          ) : (
            participants.map(g => (
              <Box
                key={g.id}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: g.belt?.color_hex ?? 'grey.400', fontSize: 12 }}>
                  {g.student_name?.[0]}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}
                    onClick={() => navigate(`/students/${g.student_id}`)}
                  >
                    {g.student_name ?? '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {g.belt?.name ?? '—'} · {g.result === 'approved' ? 'Aprovado' : 'Reprovado'}
                    {g.fee_paid ? ` · Taxa: ${formatCurrency(+g.fee_amount)}` : ' · Taxa nao paga'}
                  </Typography>
                </Box>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => openEditGrad(g)}><EditIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Remover">
                  <IconButton size="small" color="error" onClick={() => setDeleteGradTarget(g)}><DeleteIcon fontSize="small" /></IconButton>
                </Tooltip>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setParticipantsEvent(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit graduation dialog ── */}
      <Dialog open={!!editingGrad} onClose={() => setEditingGrad(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar graduacao — {editingGrad?.student_name}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField label="Pra Jiad" select fullWidth value={editGradForm.belt_id} onChange={e => setEditGradForm(p => ({ ...p, belt_id: e.target.value }))}>
            {belts.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
          </TextField>
          <TextField label="Resultado" select fullWidth value={editGradForm.result} onChange={e => setEditGradForm(p => ({ ...p, result: e.target.value }))}>
            <MenuItem value="approved">Aprovado</MenuItem>
            <MenuItem value="failed">Reprovado</MenuItem>
          </TextField>
          <TextField label="Valor da taxa (R$)" type="number" fullWidth value={editGradForm.fee_amount} onChange={e => setEditGradForm(p => ({ ...p, fee_amount: e.target.value }))} inputProps={{ min: 0, step: 0.01 }} />
          <FormControlLabel
            control={<Checkbox checked={editGradForm.fee_paid} onChange={e => setEditGradForm(p => ({ ...p, fee_paid: e.target.checked }))} />}
            label="Taxa paga"
          />
          <TextField label="Observacoes" multiline rows={2} fullWidth value={editGradForm.notes} onChange={e => setEditGradForm(p => ({ ...p, notes: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setEditingGrad(null)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={updateGradMutation.isPending}
            onClick={() => updateGradMutation.mutate({
              belt_id: editGradForm.belt_id || undefined,
              instructor_id: editGradForm.instructor_id || undefined,
              result: editGradForm.result,
              fee_paid: editGradForm.fee_paid,
              fee_amount: editGradForm.fee_amount ? +editGradForm.fee_amount : undefined,
              notes: editGradForm.notes || undefined,
            })}
          >
            {updateGradMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Drawers ── */}
      <FormDrawer open={eventDrawer} title="Novo evento de graduacao" onClose={() => setEventDrawer(false)} width={520}>
        <EventForm instructors={instructors} onSubmit={d => createEventMutation.mutateAsync(d)} loading={createEventMutation.isPending} />
      </FormDrawer>
      <FormDrawer open={!!editingEvent} title="Editar evento" onClose={() => setEditingEvent(null)} width={520}>
        {editingEvent && (
          <EventForm
            initial={editingEvent}
            instructors={instructors}
            onSubmit={d => updateEventMutation.mutateAsync(d)}
            loading={updateEventMutation.isPending}
          />
        )}
      </FormDrawer>
      <FormDrawer open={beltDrawer} title="Novo Pra Jiad" onClose={() => setBeltDrawer(false)} width={560}>
        <BeltForm onSubmit={d => createBeltMutation.mutateAsync(d)} loading={createBeltMutation.isPending} />
      </FormDrawer>
      <FormDrawer open={!!editingBelt} title="Editar Pra Jiad" onClose={() => setEditingBelt(null)} width={560}>
        {editingBelt && (
          <BeltForm
            initial={editingBelt}
            onSubmit={d => updateBeltMutation.mutateAsync(d)}
            loading={updateBeltMutation.isPending}
          />
        )}
      </FormDrawer>

      <ConfirmDialog
        open={!!deleteEventTarget}
        title="Excluir evento"
        message={`Excluir o evento "${deleteEventTarget?.name}"? Todas as graduacoes vinculadas serao removidas.`}
        loading={deleteEventMutation.isPending}
        onConfirm={() => deleteEventTarget && deleteEventMutation.mutate(deleteEventTarget.id)}
        onClose={() => setDeleteEventTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteGradTarget}
        title="Remover graduacao"
        message={`Remover o registro de graduacao de "${deleteGradTarget?.student_name}"?`}
        loading={deleteGradMutation.isPending}
        onConfirm={() => deleteGradTarget && deleteGradMutation.mutate(deleteGradTarget.id)}
        onClose={() => setDeleteGradTarget(null)}
      />
    </Box>
  )
}
