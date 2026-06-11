import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Box, Button, CircularProgress, Grid, MenuItem, TextField } from '@mui/material'
import type { PlanCreate, PlanRead } from '@/types/api.types'

interface Props {
  initial?: PlanRead | null
  onSubmit: (data: PlanCreate) => Promise<void>
  loading?: boolean
}

export function PlanForm({ initial, onSubmit, loading }: Props) {
  const { control, handleSubmit, reset } = useForm<PlanCreate>({
    defaultValues: {
      name: '',
      plan_type: 'monthly',
      plan_modality: 'collective',
      monthly_value: 0,
      description: '',
      is_active: true,
    },
  })

  useEffect(() => {
    if (initial) {
      reset({
        name: initial.name,
        plan_type: initial.plan_type,
        plan_modality: initial.plan_modality ?? 'collective',
        monthly_value: +initial.monthly_value,
        description: initial.description ?? '',
        is_active: initial.is_active,
      })
    }
  }, [initial, reset])

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller name="name" control={control} rules={{ required: 'Nome obrigatorio', minLength: { value: 3, message: 'Informe um nome mais claro' } }}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Nome do plano *" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="plan_modality" control={control} rules={{ required: 'Modalidade obrigatoria' }}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Modalidade do treino *" select fullWidth error={!!fieldState.error} helperText={fieldState.error?.message}>
                <MenuItem value="collective">Coletivo</MenuItem>
                <MenuItem value="personal">Personal</MenuItem>
              </TextField>
            )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="plan_type" control={control} rules={{ required: 'Ciclo obrigatorio' }}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Ciclo do plano *" select fullWidth error={!!fieldState.error} helperText={fieldState.error?.message}>
                <MenuItem value="monthly">Mensal</MenuItem>
                <MenuItem value="quarterly">Trimestral</MenuItem>
                <MenuItem value="semiannual">Semestral</MenuItem>
                <MenuItem value="annual">Anual</MenuItem>
              </TextField>
            )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="monthly_value" control={control} rules={{ required: 'Valor obrigatorio', min: { value: 0.01, message: 'Informe valor maior que zero' } }}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Valor mensal (R$) *" type="number" fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="is_active" control={control}
            render={({ field }) => (
              <TextField select label="Status" fullWidth
                value={field.value ? 'true' : 'false'}
                onChange={e => field.onChange(e.target.value === 'true')}
              >
                <MenuItem value="true">Ativo</MenuItem>
                <MenuItem value="false">Inativo</MenuItem>
              </TextField>
            )} />
        </Grid>
        <Grid item xs={12}>
          <Controller name="description" control={control}
            render={({ field }) => (
              <TextField {...field} label="Descricao" multiline rows={3} fullWidth />
            )} />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ minWidth: 140 }}>
          {loading ? <CircularProgress size={22} color="inherit" /> : initial ? 'Salvar' : 'Criar plano'}
        </Button>
      </Box>
    </Box>
  )
}
