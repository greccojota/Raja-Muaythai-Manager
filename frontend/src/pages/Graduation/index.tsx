import { useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Divider,
  Grid, MenuItem, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { FormDrawer } from '@/components/feedback/FormDrawer'
import { PageHeader } from '@/components/ui/PageHeader'
import { api } from '@/services/api'
import { graduationService } from '@/services/graduation.service'
import type { GraduationEventRead, InstructorRead } from '@/types/api.types'
import { formatDate } from '@/utils/format'

const PRA_JIAD_PRESETS = [
  { name: 'Branco', color_hex: '#F5F5F5', description: 'Inicio da jornada e fundamentos.' },
  { name: 'Amarelo', color_hex: '#FBC02D', description: 'Base tecnica em desenvolvimento.' },
  { name: 'Verde', color_hex: '#2E7D32', description: 'Consistencia em defesa, golpes e postura.' },
  { name: 'Azul', color_hex: '#1565C0', description: 'Controle tecnico e leitura de treino.' },
  { name: 'Vermelho', color_hex: '#C62828', description: 'Nivel avancado da academia.' },
  { name: 'Preto', color_hex: '#111111', description: 'Referencia tecnica e disciplina consolidada.' },
]

export function GraduationPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState(0)
  const [beltDrawer, setBeltDrawer] = useState(false)
  const [eventDrawer, setEventDrawer] = useState(false)
  const [deleteEventTarget, setDeleteEventTarget] = useState<GraduationEventRead | null>(null)
  const [beltForm, setBeltForm] = useState({ name: '', order_index: 1, color_hex: '#9E9E9E', description: '' })
  const [eventForm, setEventForm] = useState({ name: '', event_date: '', instructor_id: '', notes: '' })

  const { data: belts = [] } = useQuery({ queryKey: ['belts'], queryFn: () => graduationService.listBelts() })
  const { data: events = [], isLoading } = useQuery({ queryKey: ['graduation-events'], queryFn: () => graduationService.listEvents() })
  const { data: instructors = [] } = useQuery({ queryKey: ['instructors'], queryFn: () => api.get('/instructors').then(r => r.data as InstructorRead[]) })

  const createBeltMutation = useMutation({
    mutationFn: async (d: object) => { await graduationService.createBelt(d) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['belts'] }); setBeltDrawer(false) },
  })
  const createEventMutation = useMutation({
    mutationFn: async (d: object) => { await graduationService.createEvent(d) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['graduation-events'] }); setEventDrawer(false) },
  })
  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => graduationService.deleteEvent(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['graduation-events'] }); setDeleteEventTarget(null) },
  })

  return (
    <Box>
      <PageHeader title="Graduacao Pra Jiad" subtitle="Niveis, eventos e historico de evolucao dos alunos" />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab label={`Eventos (${events.length})`} />
        <Tab label={`Pra Jiad (${belts.length})`} />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEventDrawer(true)}>Novo evento</Button>
          </Box>
          {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress /></Box>}
          {events.length === 0 && !isLoading && <Alert severity="info">Nenhum evento de graduacao cadastrado.</Alert>}
          <Grid container spacing={2}>
            {events.map(e => (
              <Grid item xs={12} sm={6} md={4} key={e.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrophyIcon color="secondary" />
                        <Typography fontWeight={700}>{e.name}</Typography>
                      </Box>
                      <Tooltip title="Excluir evento">
                        <Button size="small" color="error" onClick={() => setDeleteEventTarget(e)}><DeleteIcon fontSize="small" /></Button>
                      </Tooltip>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{formatDate(e.event_date)}</Typography>
                    {e.instructor && <Typography variant="caption" color="text.secondary" display="block">Professor: {e.instructor.name}</Typography>}
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="caption" color="text.secondary">{e.graduation_count ?? 0} registro(s) de graduacao</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setBeltDrawer(true)}>Novo Pra Jiad</Button>
          </Box>
          {belts.length === 0 && <Alert severity="info">Cadastre os niveis Pra Jiad usados pela academia antes de registrar graduacoes.</Alert>}
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
                      <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: b.color_hex ?? '#9E9E9E', border: '1px solid', borderColor: 'divider' }} />
                    </Box>
                    {b.description && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{b.description}</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <FormDrawer open={eventDrawer} title="Novo evento de graduacao" onClose={() => setEventDrawer(false)} width={520}>
        <Box component="form" onSubmit={e => { e.preventDefault(); createEventMutation.mutate({ ...eventForm, instructor_id: eventForm.instructor_id || undefined }) }} noValidate>
          <TextField label="Nome do evento *" fullWidth required value={eventForm.name} onChange={e => setEventForm(p => ({ ...p, name: e.target.value }))} sx={{ mb: 2 }} />
          <TextField label="Data *" type="date" fullWidth required InputLabelProps={{ shrink: true }} value={eventForm.event_date} onChange={e => setEventForm(p => ({ ...p, event_date: e.target.value }))} sx={{ mb: 2 }} />
          <TextField label="Professor responsavel" select fullWidth value={eventForm.instructor_id} onChange={e => setEventForm(p => ({ ...p, instructor_id: e.target.value }))} sx={{ mb: 2 }}>
            <MenuItem value="">Nenhum</MenuItem>
            {instructors.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
          </TextField>
          <TextField label="Observacoes" multiline rows={3} fullWidth value={eventForm.notes} onChange={e => setEventForm(p => ({ ...p, notes: e.target.value }))} sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" size="large" disabled={!eventForm.name || !eventForm.event_date || createEventMutation.isPending} sx={{ minWidth: 140 }}>
              {createEventMutation.isPending ? <CircularProgress size={22} color="inherit" /> : 'Criar evento'}
            </Button>
          </Box>
        </Box>
      </FormDrawer>

      <FormDrawer open={beltDrawer} title="Novo Pra Jiad" onClose={() => setBeltDrawer(false)} width={560}>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {PRA_JIAD_PRESETS.map((preset, index) => (
            <Grid item xs={6} sm={4} key={preset.name}>
              <Button fullWidth variant="outlined" onClick={() => setBeltForm({ ...preset, order_index: index + 1 })} sx={{ justifyContent: 'flex-start' }}>
                {preset.name}
              </Button>
            </Grid>
          ))}
        </Grid>
        <Box component="form" onSubmit={e => { e.preventDefault(); createBeltMutation.mutate(beltForm) }} noValidate>
          <TextField label="Nome do Pra Jiad *" fullWidth required value={beltForm.name} onChange={e => setBeltForm(p => ({ ...p, name: e.target.value }))} sx={{ mb: 2 }} />
          <TextField label="Ordem (nivel)" type="number" fullWidth value={beltForm.order_index} onChange={e => setBeltForm(p => ({ ...p, order_index: +e.target.value }))} sx={{ mb: 2 }} inputProps={{ min: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <input type="color" value={beltForm.color_hex} onChange={e => setBeltForm(p => ({ ...p, color_hex: e.target.value }))} style={{ width: 48, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
            <TextField label="Cor" value={beltForm.color_hex} onChange={e => setBeltForm(p => ({ ...p, color_hex: e.target.value }))} sx={{ flex: 1 }} />
          </Box>
          <TextField label="Descricao" multiline rows={2} fullWidth value={beltForm.description} onChange={e => setBeltForm(p => ({ ...p, description: e.target.value }))} sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" size="large" disabled={!beltForm.name || createBeltMutation.isPending} sx={{ minWidth: 140 }}>
              {createBeltMutation.isPending ? <CircularProgress size={22} color="inherit" /> : 'Criar nivel'}
            </Button>
          </Box>
        </Box>
      </FormDrawer>

      <ConfirmDialog
        open={!!deleteEventTarget}
        title="Excluir evento"
        message={`Excluir o evento "${deleteEventTarget?.name}"? Todas as graduacoes vinculadas serao removidas.`}
        loading={deleteEventMutation.isPending}
        onConfirm={() => deleteEventTarget && deleteEventMutation.mutate(deleteEventTarget.id)}
        onClose={() => setDeleteEventTarget(null)}
      />
    </Box>
  )
}
