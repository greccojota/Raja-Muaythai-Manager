import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Grid,
  MenuItem, Tab, Tabs, TextField, Typography,
} from '@mui/material'
import { ArrowBack as BackIcon, Edit as EditIcon } from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FormDrawer } from '@/components/feedback/FormDrawer'
import { StatusChip } from '@/components/ui/StatusChip'
import { enrollmentService } from '@/services/enrollment.service'
import { planService } from '@/services/plan.service'
import { studentService } from '@/services/student.service'
import type { EnrollmentCreate, PaymentMethod, StudentCreate } from '@/types/api.types'
import { formatCurrency, formatDate } from '@/utils/format'
import { StudentForm } from './StudentForm'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2">{value || '-'}</Typography>
    </Box>
  )
}

const PAYMENT_LABEL: Record<string, string> = {
  pix: 'Pix',
  debit: 'Debito',
  credit: 'Cartao de credito',
  cash: 'Dinheiro',
  transfer: 'Transferencia',
}

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)

  const [tab, setTab] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [enrollForm, setEnrollForm] = useState({
    plan_id: '',
    start_date: today,
    first_payment_date: today,
    payment_method: 'pix' as PaymentMethod,
    discount_value: 0,
  })

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentService.get(id!),
    enabled: !!id,
  })

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', id],
    queryFn: () => enrollmentService.getByStudent(id!),
    enabled: !!id,
  })

  const { data: ar } = useQuery({
    queryKey: ['ar', id],
    queryFn: () => enrollmentService.getARByStudent(id!),
    enabled: !!id,
  })

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planService.list(true),
  })

  const updateMutation = useMutation({
    mutationFn: async (data: StudentCreate) => { await studentService.update(id!, data) },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] })
      setEditOpen(false)
    },
  })

  const enrollMutation = useMutation({
    mutationFn: (data: EnrollmentCreate) => enrollmentService.enroll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', id] })
      queryClient.invalidateQueries({ queryKey: ['ar', id] })
      queryClient.invalidateQueries({ queryKey: ['student', id] })
      setEnrollOpen(false)
    },
  })

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
  if (!student) return <Alert severity="error">Aluno nao encontrado.</Alert>

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 2, sm: 3 } }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/students')} variant="text">Alunos</Button>
      </Box>

      <Card sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 3 }, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Avatar sx={{ width: { xs: 56, sm: 72 }, height: { xs: 56, sm: 72 }, bgcolor: 'primary.main', fontSize: { xs: 22, sm: 28 } }}>{student.name[0]}</Avatar>
            <Box sx={{ flex: 1, minWidth: { xs: 0, sm: 260 } }}>
              <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: 22, sm: 26 }, wordBreak: 'break-word' }}>{student.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                <StatusChip status={student.status} size="medium" />
                <Chip label={student.modality === 'boxing' ? 'Boxe' : student.modality === 'both' ? 'Muay Thai e Boxe' : 'Muay Thai'} size="small" variant="outlined" />
                {student.cpf && <Chip label={`CPF: ${student.cpf}`} size="small" variant="outlined" />}
              </Box>
            </Box>
            <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setEditOpen(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>Editar</Button>
          </Box>
        </CardContent>
      </Card>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab label="Dados" />
        <Tab label={`Matriculas (${enrollments?.length ?? 0})`} />
        <Tab label={`Financeiro (${ar?.length ?? 0})`} />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card><CardContent>
              <Typography variant="subtitle2" gutterBottom>Pessoal</Typography>
              <InfoRow label="Data de nascimento" value={formatDate(student.birth_date)} />
              <InfoRow label="Sexo" value={student.gender === 'M' ? 'Masculino' : student.gender === 'F' ? 'Feminino' : student.gender === 'O' ? 'Outro' : undefined} />
              <InfoRow label="RG" value={student.rg} />
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card><CardContent>
              <Typography variant="subtitle2" gutterBottom>Contato</Typography>
              <InfoRow label="Telefone" value={student.phone} />
              <InfoRow label="WhatsApp" value={student.whatsapp} />
              <InfoRow label="E-mail" value={student.email} />
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card><CardContent>
              <Typography variant="subtitle2" gutterBottom>Endereco</Typography>
              <InfoRow label="Logradouro" value={student.address_street ? `${student.address_street}, ${student.address_number ?? ''}` : undefined} />
              <InfoRow label="Bairro" value={student.address_neighborhood} />
              <InfoRow label="Cidade/UF" value={student.address_city ? `${student.address_city}/${student.address_state}` : undefined} />
              <InfoRow label="CEP" value={student.address_zip} />
            </CardContent></Card>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" onClick={() => setEnrollOpen(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>Nova matricula</Button>
          </Box>
          {enrollments?.length === 0 && <Alert severity="info">Nenhuma matricula encontrada.</Alert>}
          {enrollments?.map(enrollment => (
            <Card key={enrollment.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography fontWeight={700}>{enrollment.plan?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(enrollment.start_date)} - {enrollment.end_date ? formatDate(enrollment.end_date) : 'Indeterminado'}
                    </Typography>
                    {enrollment.next_payment_due_date && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Proximo vencimento: {formatDate(enrollment.next_payment_due_date)}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography fontWeight={700}>{formatCurrency(+enrollment.final_monthly_value)} / mes</Typography>
                    <Chip label={PAYMENT_LABEL[enrollment.payment_method] ?? enrollment.payment_method} size="small" variant="outlined" />
                    <StatusChip status={enrollment.status} type="enrollment" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {tab === 2 && (
        <Box>
          {ar?.length === 0 && <Alert severity="info">Nenhuma conta encontrada.</Alert>}
          {ar?.map(account => (
            <Card key={account.id} sx={{ mb: 1.5 }}>
              <CardContent sx={{ py: '12px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{account.description}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Venc. {formatDate(account.due_date)}
                      {account.expected_payment_method ? ` - ${PAYMENT_LABEL[account.expected_payment_method] ?? account.expected_payment_method}` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography fontWeight={700}>{formatCurrency(+account.amount)}</Typography>
                    <StatusChip status={account.status} type="ar" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <FormDrawer open={editOpen} title="Editar aluno" onClose={() => setEditOpen(false)} width={860}>
        <StudentForm initial={student} onSubmit={data => updateMutation.mutateAsync(data)} loading={updateMutation.isPending} />
      </FormDrawer>

      <Dialog open={enrollOpen} onClose={() => setEnrollOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nova matricula</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Plano" select fullWidth value={enrollForm.plan_id} onChange={e => setEnrollForm(prev => ({ ...prev, plan_id: e.target.value }))}>
            {(plans ?? []).map(plan => (
              <MenuItem key={plan.id} value={plan.id}>{plan.name} - {formatCurrency(+plan.monthly_value)} / mes</MenuItem>
            ))}
          </TextField>
          <TextField label="Data de inicio" type="date" fullWidth InputLabelProps={{ shrink: true }} value={enrollForm.start_date} onChange={e => setEnrollForm(prev => ({ ...prev, start_date: e.target.value }))} />
          <TextField label="Forma de pagamento" select fullWidth value={enrollForm.payment_method} onChange={e => setEnrollForm(prev => ({ ...prev, payment_method: e.target.value as PaymentMethod }))}>
            <MenuItem value="pix">Pix</MenuItem>
            <MenuItem value="debit">Debito</MenuItem>
            <MenuItem value="credit">Cartao de credito</MenuItem>
            <MenuItem value="cash">Dinheiro</MenuItem>
            <MenuItem value="transfer">Transferencia</MenuItem>
          </TextField>
          <TextField
            label="Data do pagamento inicial"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={enrollForm.first_payment_date}
            onChange={e => setEnrollForm(prev => ({ ...prev, first_payment_date: e.target.value }))}
            helperText="O proximo vencimento sera calculado pelo ciclo do plano e ajustado para o proximo dia util."
          />
          <TextField label="Desconto (R$)" type="number" fullWidth inputProps={{ min: 0, step: 0.01 }} value={enrollForm.discount_value} onChange={e => setEnrollForm(prev => ({ ...prev, discount_value: +e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
          <Button onClick={() => setEnrollOpen(false)} sx={{ width: { xs: '100%', sm: 'auto' } }}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!enrollForm.plan_id || enrollMutation.isPending}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            onClick={() => enrollMutation.mutate({
              student_id: id!,
              plan_id: enrollForm.plan_id,
              start_date: enrollForm.start_date,
              payment_method: enrollForm.payment_method,
              first_payment_date: enrollForm.first_payment_date,
              discount_value: enrollForm.discount_value,
            })}
          >
            {enrollMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Matricular'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
