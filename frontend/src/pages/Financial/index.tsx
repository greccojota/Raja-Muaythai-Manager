import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem,
  Paper, Tab, Tabs, Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material'
import {
  AccountBalanceWallet as WalletIcon,
  AttachMoney as MoneyIcon,
  Event as EventIcon,
  OpenInNew as OpenIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusChip } from '@/components/ui/StatusChip'
import { dashboardService } from '@/services/dashboard.service'
import { enrollmentService } from '@/services/enrollment.service'
import type { AccountsReceivableRead, PaymentCreate } from '@/types/api.types'
import { formatCurrency, formatDate } from '@/utils/format'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' },
  { value: 'debit', label: 'Debito' },
  { value: 'credit', label: 'Credito' },
  { value: 'transfer', label: 'Transferencia' },
]

function MetricCard({ title, value, subtitle, icon, color }: { title: string; value: string; subtitle: string; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, p: { xs: 2, sm: 3 } }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: 24, sm: 28 }, wordBreak: 'break-word' }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        </Box>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${color}18`, color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          {icon}
        </Box>
      </CardContent>
    </Card>
  )
}

export function FinancialPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState(0)
  const [page, setPage] = useState(0)
  const [payTarget, setPayTarget] = useState<AccountsReceivableRead | null>(null)
  const [payForm, setPayForm] = useState({ amount_paid: 0, payment_method: 'pix', notes: '' })

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  })

  const { data: pending, isLoading } = useQuery({
    queryKey: ['ar-pending', page],
    queryFn: () => enrollmentService.getPendingAR(page + 1),
  })

  const { data: delinquents = [] } = useQuery({
    queryKey: ['delinquents'],
    queryFn: () => enrollmentService.getDelinquents(),
  })

  const payMutation = useMutation({
    mutationFn: (d: PaymentCreate) => enrollmentService.registerPayment(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ar-pending'] })
      queryClient.invalidateQueries({ queryKey: ['delinquents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setPayTarget(null)
    },
  })

  const markOverdueMutation = useMutation({
    mutationFn: () => enrollmentService.markOverdue(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ar-pending'] })
      queryClient.invalidateQueries({ queryKey: ['delinquents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })

  const remindersMutation = useMutation({
    mutationFn: () => enrollmentService.sendPaymentReminders(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ar-pending'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })

  const processOverdueMutation = useMutation({
    mutationFn: () => enrollmentService.processOverdue(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ar-pending'] })
      queryClient.invalidateQueries({ queryKey: ['delinquents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })

  const openPayDialog = (a: AccountsReceivableRead) => {
    setPayTarget(a)
    setPayForm({ amount_paid: +a.amount, payment_method: a.expected_payment_method ?? 'pix', notes: '' })
  }

  return (
    <Box>
      <PageHeader title="Financeiro" subtitle="Recebimentos, inadimplencia e visao de caixa" />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard title="Bruto mensal" value={formatCurrency(+(dashboard?.kpis.gross_revenue_month ?? 0))} subtitle="Recebido no mes" icon={<MoneyIcon />} color="#2E7D32" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard title="Liquido mensal" value={formatCurrency(+(dashboard?.kpis.net_revenue_month ?? 0))} subtitle="Sem despesas cadastradas ainda" icon={<WalletIcon />} color="#1565C0" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard title="Em aberto" value={formatCurrency(+(dashboard?.kpis.pending_month ?? 0))} subtitle="Vencimentos ate hoje" icon={<RefreshIcon />} color="#D4AF37" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard title="Inadimplencia" value={formatCurrency(+(dashboard?.kpis.overdue_total ?? 0))} subtitle={`${dashboard?.kpis.delinquent_students ?? 0} alunos`} icon={<WarningIcon />} color="#C62828" />
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab label={`Pendentes / atraso (${pending?.total ?? 0})`} />
        <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>Inadimplentes {delinquents.length > 0 && <Chip label={delinquents.length} size="small" color="error" sx={{ height: 18, fontSize: 11 }} />}</Box>} />
        <Tab label="Eventos" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" size="small" onClick={() => remindersMutation.mutate()} disabled={remindersMutation.isPending}>
              {remindersMutation.isPending ? <CircularProgress size={16} /> : 'Enviar lembretes'}
            </Button>
            <Button variant="outlined" color="warning" size="small" onClick={() => processOverdueMutation.mutate()} disabled={processOverdueMutation.isPending}>
              {processOverdueMutation.isPending ? <CircularProgress size={16} /> : 'Processar atrasos'}
            </Button>
            <Button startIcon={markOverdueMutation.isPending ? <CircularProgress size={16} /> : <RefreshIcon />} onClick={() => markOverdueMutation.mutate()} disabled={markOverdueMutation.isPending} variant="outlined" size="small">
              Atualizar vencidas
            </Button>
          </Box>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small" sx={{ minWidth: { xs: 760, md: 0 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Aluno</TableCell>
                    <TableCell>Descricao</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Vencimento</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Acao</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
                  ) : (pending?.items ?? []).length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Nenhuma conta pendente.</TableCell></TableRow>
                  ) : (
                    (pending?.items ?? []).map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell sx={{ minWidth: 180 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 12 }}>{a.student_name?.[0] ?? '?'}</Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600} sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }} onClick={() => navigate(`/students/${a.student_id}`)}>
                                {a.student_name ?? '-'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {a.enrollment_end_date ? `Plano ate ${formatDate(a.enrollment_end_date)}` : 'Sem plano ativo'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{a.description}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: a.status === 'overdue' ? 'error.main' : 'text.primary', fontWeight: a.status === 'overdue' ? 700 : 400 }}>{formatDate(a.due_date)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatCurrency(+a.amount)}</TableCell>
                        <TableCell><StatusChip status={a.status} type="ar" /></TableCell>
                        <TableCell align="right">
                          <Tooltip title="Ver aluno"><Button size="small" variant="text" sx={{ minWidth: 0, px: 1 }} onClick={() => navigate(`/students/${a.student_id}`)}><OpenIcon fontSize="small" /></Button></Tooltip>
                          {a.status !== 'paid' && a.status !== 'cancelled' && <Button size="small" variant="outlined" color="success" onClick={() => openPayDialog(a)}>Receber</Button>}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={pending?.total ?? 0} page={page} rowsPerPage={50} onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[50]} labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`} />
          </Paper>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          {delinquents.length === 0 ? <Alert severity="success">Nenhum aluno inadimplente no momento.</Alert> : delinquents.map(d => (
            <Card key={d.student_id} sx={{ mb: 1.5 }}>
              <CardContent sx={{ py: '12px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'error.light', width: 38, height: 38 }}><PersonIcon fontSize="small" /></Avatar>
                    <Box>
                      <Typography fontWeight={700} onClick={() => navigate(`/students/${d.student_id}`)} sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>{d.student_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{d.overdue_count} parcela(s) em atraso - mais antiga: {formatDate(d.oldest_due_date)}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography fontWeight={800} color="error.main" variant="h6">{formatCurrency(+d.total_overdue)}</Typography>
                    <Button size="small" variant="outlined" endIcon={<OpenIcon fontSize="small" />} onClick={() => navigate(`/students/${d.student_id}?tab=2`)}>Ver financeiro</Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {tab === 2 && (
        <Grid container spacing={2}>
          {[
            ['Receita do evento', 'Inscricoes, ingressos, patrocinios e vendas avulsas.'],
            ['Custos do evento', 'Aluguel, arbitragem, equipe, equipamentos, marketing e taxas.'],
            ['Lucro liquido', 'Receitas menos despesas, separado por evento.'],
            ['ROI', 'Lucro sobre custo total para comparar eventos.'],
          ].map(([title, text]) => (
            <Grid item xs={12} sm={6} md={3} key={title}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <EventIcon color="secondary" />
                  <Typography fontWeight={700} sx={{ mt: 1 }}>{title}</Typography>
                  <Typography variant="body2" color="text.secondary">{text}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={!!payTarget} onClose={() => setPayTarget(null)} maxWidth="xs" fullWidth fullScreen={false}>
        <DialogTitle>Registrar recebimento</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2">{payTarget?.description}</Typography>
            <Typography variant="body2" color="text.secondary">Vencimento: {formatDate(payTarget?.due_date)} - Original: {formatCurrency(+(payTarget?.amount ?? 0))}</Typography>
          </Box>
          <TextField label="Valor recebido (R$)" type="number" fullWidth inputProps={{ min: 0, step: 0.01 }} value={payForm.amount_paid} onChange={e => setPayForm(p => ({ ...p, amount_paid: +e.target.value }))} />
          <TextField label="Forma de pagamento" select fullWidth value={payForm.payment_method} onChange={e => setPayForm(p => ({ ...p, payment_method: e.target.value }))}>
            {PAYMENT_METHODS.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
          </TextField>
          <TextField label="Observacoes" multiline rows={2} fullWidth value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
          <Button onClick={() => setPayTarget(null)} sx={{ width: { xs: '100%', sm: 'auto' } }}>Cancelar</Button>
          <Button variant="contained" color="success" disabled={payMutation.isPending || payForm.amount_paid <= 0} sx={{ width: { xs: '100%', sm: 'auto' } }} onClick={() => payTarget && payMutation.mutate({ ar_id: payTarget.id, amount_paid: payForm.amount_paid, payment_method: payForm.payment_method as any, notes: payForm.notes || undefined })}>
            {payMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Confirmar recebimento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
