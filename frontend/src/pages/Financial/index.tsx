import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton,
  MenuItem, Paper, Tab, Tabs, Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material'
import {
  AccountBalanceWallet as WalletIcon,
  AttachMoney as MoneyIcon,
  Block as CancelIcon,
  OpenInNew as OpenIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  TrendingDown as OverdueIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusChip } from '@/components/ui/StatusChip'
import { enrollmentService } from '@/services/enrollment.service'
import { financialService } from '@/services/financial.service'
import type { AccountsReceivableRead, PaymentCreate } from '@/types/api.types'
import { formatCurrency, formatDate } from '@/utils/format'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' },
  { value: 'debit', label: 'Debito' },
  { value: 'credit', label: 'Credito' },
  { value: 'transfer', label: 'Transferencia' },
]

const STATUS_TABS = [
  { label: 'Todos', value: '' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Em atraso', value: 'overdue' },
  { label: 'Pagos', value: 'paid' },
  { label: 'Cancelados', value: 'cancelled' },
]

function MetricCard({
  title, value, subtitle, icon, color,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, p: { xs: 2, sm: 3 } }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: 22, sm: 26 }, wordBreak: 'break-word' }}>{value}</Typography>
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

  const [mainTab, setMainTab] = useState(0)
  const [statusTabIdx, setStatusTabIdx] = useState(0)
  const [page, setPage] = useState(0)
  const [refMonth, setRefMonth] = useState('')
  const [dueDateFrom, setDueDateFrom] = useState('')
  const [dueDateTo, setDueDateTo] = useState('')

  const [payTarget, setPayTarget] = useState<AccountsReceivableRead | null>(null)
  const [payForm, setPayForm] = useState({ amount_paid: 0, payment_method: 'pix', notes: '' })

  const [cancelTarget, setCancelTarget] = useState<AccountsReceivableRead | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const status = STATUS_TABS[statusTabIdx].value

  const { data: summary } = useQuery({
    queryKey: ['ar-summary'],
    queryFn: () => financialService.getSummary(),
  })

  const { data: arList, isLoading } = useQuery({
    queryKey: ['ar-list', status, refMonth, dueDateFrom, dueDateTo, page],
    queryFn: () =>
      financialService.list({
        status: status || undefined,
        reference_month: refMonth || undefined,
        due_date_from: dueDateFrom || undefined,
        due_date_to: dueDateTo || undefined,
        page: page + 1,
        size: 50,
      }),
    enabled: mainTab === 0,
  })

  const { data: delinquents = [] } = useQuery({
    queryKey: ['delinquents'],
    queryFn: () => enrollmentService.getDelinquents(),
    enabled: mainTab === 1,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['ar-list'] })
    queryClient.invalidateQueries({ queryKey: ['ar-summary'] })
    queryClient.invalidateQueries({ queryKey: ['delinquents'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
  }

  const payMutation = useMutation({
    mutationFn: (d: PaymentCreate) => enrollmentService.registerPayment(d),
    onSuccess: () => { invalidateAll(); setPayTarget(null) },
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      financialService.cancel(id, reason),
    onSuccess: () => { invalidateAll(); setCancelTarget(null); setCancelReason('') },
  })

  const markOverdueMutation = useMutation({
    mutationFn: () => enrollmentService.markOverdue(),
    onSuccess: invalidateAll,
  })

  const openPayDialog = (a: AccountsReceivableRead) => {
    setPayTarget(a)
    setPayForm({ amount_paid: +a.amount, payment_method: a.expected_payment_method ?? 'pix', notes: '' })
  }

  const resetFilters = () => {
    setRefMonth('')
    setDueDateFrom('')
    setDueDateTo('')
    setPage(0)
  }

  return (
    <Box>
      <PageHeader title="Financeiro" subtitle="Recebimentos, inadimplencia e visao de caixa" />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="A receber (pendente)"
            value={formatCurrency(+(summary?.total_amount_pending ?? 0))}
            subtitle={`${summary?.total_pending ?? 0} cobrancas`}
            icon={<MoneyIcon />}
            color="#1565C0"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Em atraso"
            value={formatCurrency(+(summary?.total_amount_overdue ?? 0))}
            subtitle={`${summary?.total_overdue ?? 0} cobrancas`}
            icon={<OverdueIcon />}
            color="#C62828"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Recebido no mes"
            value={formatCurrency(+(summary?.total_amount_paid_this_month ?? 0))}
            subtitle={`${summary?.total_paid_this_month ?? 0} pagamentos`}
            icon={<WalletIcon />}
            color="#2E7D32"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Inadimplentes"
            value={delinquents.length > 0 ? String(delinquents.length) : '—'}
            subtitle="Clique na aba para ver detalhes"
            icon={<WarningIcon />}
            color="#E65100"
          />
        </Grid>
      </Grid>

      <Tabs
        value={mainTab}
        onChange={(_, v) => setMainTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab label="Contas a receber" />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              Inadimplentes
              {delinquents.length > 0 && (
                <Chip label={delinquents.length} size="small" color="error" sx={{ height: 18, fontSize: 11 }} />
              )}
            </Box>
          }
        />
      </Tabs>

      {mainTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              label="Mes de referencia"
              type="month"
              size="small"
              value={refMonth}
              onChange={e => { setRefMonth(e.target.value); setPage(0) }}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 170 }}
            />
            <TextField
              label="Vencimento de"
              type="date"
              size="small"
              value={dueDateFrom}
              onChange={e => { setDueDateFrom(e.target.value); setPage(0) }}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <TextField
              label="Vencimento ate"
              type="date"
              size="small"
              value={dueDateTo}
              onChange={e => { setDueDateTo(e.target.value); setPage(0) }}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            {(refMonth || dueDateFrom || dueDateTo) && (
              <Button size="small" variant="text" onClick={resetFilters}>Limpar filtros</Button>
            )}
            <Box sx={{ flex: 1 }} />
            <Button
              startIcon={markOverdueMutation.isPending ? <CircularProgress size={14} /> : <RefreshIcon />}
              size="small"
              variant="outlined"
              onClick={() => markOverdueMutation.mutate()}
              disabled={markOverdueMutation.isPending}
            >
              Atualizar vencidas
            </Button>
          </Box>

          <Tabs
            value={statusTabIdx}
            onChange={(_, v) => { setStatusTabIdx(v); setPage(0) }}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ mb: 1.5 }}
          >
            {STATUS_TABS.map((t) => (
              <Tab key={t.value} label={t.label} sx={{ minHeight: 36, py: 0.5 }} />
            ))}
          </Tabs>

          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small" sx={{ minWidth: { xs: 760, md: 0 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Aluno</TableCell>
                    <TableCell>Descricao</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Referencia</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Acoes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : (arList?.items ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Nenhuma conta encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (arList?.items ?? []).map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell sx={{ minWidth: 160 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 11 }}>
                              {a.student_name?.[0] ?? '?'}
                            </Avatar>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}
                              onClick={() => navigate(`/students/${a.student_id}`)}
                            >
                              {a.student_name ?? '-'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{a.description}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: 'text.secondary', fontSize: 13 }}>
                          {a.reference_month ?? '—'}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: a.status === 'overdue' ? 'error.main' : 'text.primary',
                            fontWeight: a.status === 'overdue' ? 700 : 400,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatDate(a.due_date)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {formatCurrency(+a.amount)}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={a.status} type="ar" />
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="Ver aluno">
                            <IconButton size="small" onClick={() => navigate(`/students/${a.student_id}`)}>
                              <OpenIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {a.status !== 'paid' && a.status !== 'cancelled' && (
                            <>
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                sx={{ ml: 0.5 }}
                                onClick={() => openPayDialog(a)}
                              >
                                Receber
                              </Button>
                              <Tooltip title="Cancelar cobranca">
                                <IconButton
                                  size="small"
                                  color="error"
                                  sx={{ ml: 0.5 }}
                                  onClick={() => { setCancelTarget(a); setCancelReason('') }}
                                >
                                  <CancelIcon fontSize="small" />
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
              count={arList?.total ?? 0}
              page={page}
              rowsPerPage={50}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPageOptions={[50]}
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </Paper>
        </Box>
      )}

      {mainTab === 1 && (
        <Box>
          {delinquents.length === 0 ? (
            <Alert severity="success">Nenhum aluno inadimplente no momento.</Alert>
          ) : (
            delinquents.map((d) => (
              <Card key={d.student_id} sx={{ mb: 1.5 }}>
                <CardContent sx={{ py: '12px !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: 'error.light', width: 38, height: 38 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography
                          fontWeight={700}
                          onClick={() => navigate(`/students/${d.student_id}`)}
                          sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}
                        >
                          {d.student_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {d.overdue_count} parcela(s) em atraso — mais antiga: {formatDate(d.oldest_due_date)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography fontWeight={800} color="error.main" variant="h6">
                        {formatCurrency(+d.total_overdue)}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        endIcon={<OpenIcon fontSize="small" />}
                        onClick={() => navigate(`/students/${d.student_id}?tab=2`)}
                      >
                        Ver financeiro
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      <Dialog open={!!payTarget} onClose={() => setPayTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Registrar recebimento</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2">{payTarget?.description}</Typography>
            <Typography variant="body2" color="text.secondary">
              Vencimento: {formatDate(payTarget?.due_date)} — Original: {formatCurrency(+(payTarget?.amount ?? 0))}
            </Typography>
          </Box>
          <TextField
            label="Valor recebido (R$)"
            type="number"
            fullWidth
            inputProps={{ min: 0, step: 0.01 }}
            value={payForm.amount_paid}
            onChange={e => setPayForm(p => ({ ...p, amount_paid: +e.target.value }))}
          />
          <TextField
            label="Forma de pagamento"
            select
            fullWidth
            value={payForm.payment_method}
            onChange={e => setPayForm(p => ({ ...p, payment_method: e.target.value }))}
          >
            {PAYMENT_METHODS.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
          </TextField>
          <TextField
            label="Observacoes"
            multiline
            rows={2}
            fullWidth
            value={payForm.notes}
            onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setPayTarget(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            disabled={payMutation.isPending || payForm.amount_paid <= 0}
            onClick={() =>
              payTarget &&
              payMutation.mutate({
                ar_id: payTarget.id,
                amount_paid: payForm.amount_paid,
                payment_method: payForm.payment_method as any,
                notes: payForm.notes || undefined,
              })
            }
          >
            {payMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Confirmar recebimento'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancelar cobranca</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Alert severity="warning">
            Esta acao nao pode ser desfeita. A cobranca sera marcada como cancelada.
          </Alert>
          <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2">{cancelTarget?.description}</Typography>
            <Typography variant="body2" color="text.secondary">
              Valor: {formatCurrency(+(cancelTarget?.amount ?? 0))} — Vencimento: {formatDate(cancelTarget?.due_date)}
            </Typography>
          </Box>
          <TextField
            label="Motivo (opcional)"
            multiline
            rows={2}
            fullWidth
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setCancelTarget(null)}>Voltar</Button>
          <Button
            variant="contained"
            color="error"
            disabled={cancelMutation.isPending}
            onClick={() =>
              cancelTarget &&
              cancelMutation.mutate({ id: cancelTarget.id, reason: cancelReason || undefined })
            }
          >
            {cancelMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Confirmar cancelamento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
