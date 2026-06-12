import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Box, Button, CircularProgress, Grid, MenuItem, TextField } from '@mui/material'
import type { InstructorCreate, InstructorRead } from '@/types/api.types'

interface Props {
  initial?: InstructorRead | null
  onSubmit: (data: InstructorCreate) => Promise<void>
  loading?: boolean
}

export function InstructorForm({ initial, onSubmit, loading }: Props) {
  const { control, handleSubmit, reset } = useForm<InstructorCreate>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      specialization: '',
      bio: '',
      is_active: true,
    },
  })

  useEffect(() => {
    if (initial) {
      reset({
        name: initial.name,
        phone: initial.phone ?? '',
        email: initial.email ?? '',
        specialization: initial.specialization ?? '',
        bio: initial.bio ?? '',
        is_active: initial.is_active,
      })
    } else {
      reset({ name: '', phone: '', email: '', specialization: '', bio: '', is_active: true })
    }
  }, [initial, reset])

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Nome obrigatorio', minLength: { value: 2, message: 'Nome muito curto' } }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Nome completo *"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Telefone / WhatsApp" fullWidth inputProps={{ maxLength: 20 }} />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="email"
            control={control}
            rules={{
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'E-mail invalido' },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="E-mail"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="specialization"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Especializacao" fullWidth />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="Status"
                fullWidth
                value={field.value ? 'true' : 'false'}
                onChange={e => field.onChange(e.target.value === 'true')}
              >
                <MenuItem value="true">Ativo</MenuItem>
                <MenuItem value="false">Inativo</MenuItem>
              </TextField>
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="bio"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Biografia / Observacoes" multiline rows={3} fullWidth />
            )}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ minWidth: 160 }}>
          {loading ? <CircularProgress size={22} color="inherit" /> : initial ? 'Salvar alteracoes' : 'Cadastrar professor'}
        </Button>
      </Box>
    </Box>
  )
}
