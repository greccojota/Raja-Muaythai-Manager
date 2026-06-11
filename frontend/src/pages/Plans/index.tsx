import { useState } from 'react'
import {
  Box, Button, Card, CardActions, CardContent,
  Chip, CircularProgress, Grid, Typography,
} from '@mui/material'
import { Block as BlockIcon, Edit as EditIcon } from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { FormDrawer } from '@/components/feedback/FormDrawer'
import { PageHeader } from '@/components/ui/PageHeader'
import { planService } from '@/services/plan.service'
import type { PlanCreate, PlanRead } from '@/types/api.types'
import { formatCurrency } from '@/utils/format'
import { PlanForm } from './PlanForm'

const PLAN_TYPE_LABEL: Record<string, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
}

const PLAN_MODALITY_LABEL: Record<string, string> = {
  collective: 'Coletivo',
  personal: 'Personal',
}

export function PlansPage() {
  const queryClient = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<PlanRead | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<PlanRead | null>(null)

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planService.list(),
  })

  const createMutation = useMutation({
    mutationFn: async (d: PlanCreate) => { await planService.create(d) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['plans'] }); setDrawerOpen(false) },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, d }: { id: string; d: Partial<PlanCreate> }) => { await planService.update(id, d) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['plans'] }); setEditing(null) },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => planService.deactivate(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['plans'] }); setDeactivateTarget(null) },
  })

  return (
    <Box>
      <PageHeader
        title="Planos"
        subtitle="Planos coletivos e personal por ciclo contratado"
        actionLabel="Novo plano"
        onAction={() => setDrawerOpen(true)}
      />

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress /></Box>}

      <Grid container spacing={2}>
        {(plans ?? []).map(p => (
          <Grid item xs={12} sm={6} md={4} key={p.id}>
            <Card sx={{ borderRadius: 2, opacity: p.is_active ? 1 : 0.6, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="h6" fontWeight={700}>{p.name}</Typography>
                  <Chip label={p.is_active ? 'Ativo' : 'Inativo'} size="small" color={p.is_active ? 'success' : 'default'} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  <Chip label={PLAN_MODALITY_LABEL[p.plan_modality]} size="small" color={p.plan_modality === 'personal' ? 'secondary' : 'primary'} variant="outlined" />
                  <Chip label={PLAN_TYPE_LABEL[p.plan_type]} size="small" variant="outlined" />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h5" fontWeight={800} color="primary.main">
                    {formatCurrency(+p.monthly_value)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Valor mensal - vigencia de {p.billing_cycle_days} dias
                  </Typography>
                </Box>
                {p.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {p.description}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <Button size="small" startIcon={<EditIcon />} onClick={() => setEditing(p)}>
                  Editar
                </Button>
                {p.is_active && (
                  <Button size="small" color="error" startIcon={<BlockIcon />} onClick={() => setDeactivateTarget(p)}>
                    Desativar
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <FormDrawer open={drawerOpen} title="Novo plano" onClose={() => setDrawerOpen(false)} width={560}>
        <PlanForm onSubmit={d => createMutation.mutateAsync(d)} loading={createMutation.isPending} />
      </FormDrawer>

      <FormDrawer open={!!editing} title="Editar plano" onClose={() => setEditing(null)} width={560}>
        {editing && (
          <PlanForm
            initial={editing}
            onSubmit={d => updateMutation.mutateAsync({ id: editing.id, d })}
            loading={updateMutation.isPending}
          />
        )}
      </FormDrawer>

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Desativar plano"
        message={`Deseja desativar o plano "${deactivateTarget?.name}"? Ele nao aparecera para novas matriculas.`}
        confirmLabel="Desativar"
        confirmColor="warning"
        loading={deactivateMutation.isPending}
        onConfirm={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}
        onClose={() => setDeactivateTarget(null)}
      />
    </Box>
  )
}
