import { Box, Card, CardContent, Chip, CircularProgress, Grid, List, ListItem, ListItemText, Typography } from '@mui/material'
import {
  AttachMoney as RevenueIcon,
  Groups as StudentsIcon,
  TrendingUp as PendingIcon,
  Warning as DebtIcon,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '@/components/ui/PageHeader'
import { dashboardService } from '@/services/dashboard.service'
import { formatCurrency, formatDate } from '@/utils/format'

interface KpiCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  color: string
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativos',
  inactive: 'Inativos',
  suspended: 'Suspensos',
  pending: 'Pendentes',
}

const MODALITY_LABEL: Record<string, string> = {
  muaythai: 'Muay Thai',
  boxing: 'Boxe',
  both: 'Ambos',
}

const COLORS = ['#C62828', '#1565C0', '#D4AF37', '#2E7D32']

function KpiCard({ title, value, subtitle, icon, color }: KpiCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
            <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: 26, sm: 34 }, wordBreak: 'break-word' }}>{value}</Typography>
            <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
          </Box>
          <Box sx={{ width: { xs: 42, sm: 48 }, height: { xs: 42, sm: 48 }, flexShrink: 0, borderRadius: 2, bgcolor: `${color}18`, display: 'grid', placeItems: 'center', color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  })

  const modalityData = (data?.students_by_modality ?? []).map(item => ({
    name: MODALITY_LABEL[item.modality] ?? item.modality,
    value: item.total,
  }))

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle="Indicadores operacionais e financeiros da academia" />

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress /></Box>}

      {data && (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} lg={3}>
              <KpiCard title="Alunos ativos" value={String(data.kpis.active_students)} subtitle={`${data.kpis.inactive_students} inativos/suspensos`} icon={<StudentsIcon />} color="#1565C0" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <KpiCard title="Receita recebida" value={formatCurrency(+data.kpis.gross_revenue_month)} subtitle="No mes corrente" icon={<RevenueIcon />} color="#2E7D32" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <KpiCard title="A receber vencido" value={formatCurrency(+data.kpis.overdue_total)} subtitle={`${data.kpis.delinquent_students} alunos inadimplentes`} icon={<DebtIcon />} color="#C62828" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <KpiCard title="Pendente no mes" value={formatCurrency(+data.kpis.pending_month)} subtitle="Vencimentos ate hoje" icon={<PendingIcon />} color="#D4AF37" />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Receita por mes</Typography>
                  <Box sx={{ height: { xs: 280, sm: 320 }, minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.revenue_by_month} margin={{ left: -18, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={value => `R$ ${value}`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="paid" name="Recebido" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pending" name="Pendente" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="overdue" name="Vencido" fill="#C62828" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Modalidades</Typography>
                  <Box sx={{ height: { xs: 240, sm: 220 } }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={modalityData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={2}>
                          {modalityData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(data.students_by_status ?? []).map(item => (
                      <Chip key={item.status} label={`${STATUS_LABEL[item.status] ?? item.status}: ${item.total}`} size="small" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700}>Planos vencendo em 30 dias</Typography>
                  {(data.enrollments_expiring ?? []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Nenhum plano vencendo no periodo.</Typography>
                  ) : (
                    <List dense>
                      {data.enrollments_expiring.map(item => (
                        <ListItem key={`${item.student_id}-${item.end_date}`} divider>
                          <ListItemText
                            primary={item.student_name}
                            secondary={`${item.plan_name} vence em ${formatDate(item.end_date)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}
