import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Box, Button, CircularProgress, Divider, Grid, MenuItem,
  TextField, Typography,
} from '@mui/material'
import type { StudentCreate, StudentRead } from '@/types/api.types'
import { useCep } from '@/hooks/useCep'
import {
  formatCEP,
  formatCPF,
  formatPhone,
  validateCEP,
  validateCPF,
  validateEmail,
  validatePhone,
} from '@/utils/validators'

interface Props {
  initial?: StudentRead | null
  onSubmit: (data: StudentCreate) => Promise<void>
  loading?: boolean
}

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const emptyValues: StudentCreate = {
  name: '',
  cpf: '',
  rg: '',
  birth_date: '',
  gender: undefined,
  phone: '',
  whatsapp: '',
  email: '',
  modality: 'muaythai',
  address_zip: '',
  address_street: '',
  address_number: '',
  address_complement: '',
  address_neighborhood: '',
  address_city: '',
  address_state: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relationship: '',
  legal_guardian_name: '',
  legal_guardian_phone: '',
  notes: '',
}

export function StudentForm({ initial, onSubmit, loading }: Props) {
  const { fetchAddress, loadingCep } = useCep()
  const { control, handleSubmit, reset, setValue } = useForm<StudentCreate>({
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (initial) {
      reset({
        ...emptyValues,
        ...initial,
        birth_date: initial.birth_date ?? '',
        modality: initial.modality ?? 'muaythai',
      })
    }
  }, [initial, reset])

  const handleCepBlur = async (cep?: string) => {
    if (!cep || !validateCEP(cep)) return
    const address = await fetchAddress(cep)
    if (!address) return
    setValue('address_street', address.street)
    setValue('address_neighborhood', address.neighborhood)
    setValue('address_city', address.city)
    setValue('address_state', address.state)
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>DADOS PESSOAIS</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Controller name="name" control={control} rules={{ required: 'Nome obrigatorio', minLength: { value: 3, message: 'Informe o nome completo' } }}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Nome completo *" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Controller name="modality" control={control} rules={{ required: 'Modalidade obrigatoria' }}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Modalidade *" select fullWidth error={!!fieldState.error} helperText={fieldState.error?.message}>
                <MenuItem value="muaythai">Muay Thai</MenuItem>
                <MenuItem value="boxing">Boxe</MenuItem>
                <MenuItem value="both">Muay Thai e Boxe</MenuItem>
              </TextField>
            )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="cpf" control={control} rules={{ validate: v => !v || validateCPF(v) || 'CPF invalido' }}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} onChange={e => field.onChange(formatCPF(e.target.value))}
                label="CPF" fullWidth inputProps={{ maxLength: 14 }} error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="rg" control={control} rules={{ maxLength: { value: 20, message: 'RG muito longo' } }}
            render={({ field, fieldState }) => <TextField {...field} label="RG" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="birth_date" control={control}
            render={({ field }) => (
              <TextField {...field} label="Data de nascimento" type="date" fullWidth InputLabelProps={{ shrink: true }} />
            )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="gender" control={control}
            render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} label="Sexo" select fullWidth>
                <MenuItem value="">Nao informado</MenuItem>
                <MenuItem value="M">Masculino</MenuItem>
                <MenuItem value="F">Feminino</MenuItem>
                <MenuItem value="O">Outro</MenuItem>
              </TextField>
            )} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2.5 }} />
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>CONTATO</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller name="phone" control={control} rules={{ validate: v => !v || validatePhone(v) || 'Telefone invalido' }}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} onChange={e => field.onChange(formatPhone(e.target.value))}
                label="Telefone" fullWidth inputProps={{ maxLength: 15 }} error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="whatsapp" control={control} rules={{ validate: v => !v || validatePhone(v) || 'WhatsApp invalido' }}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} onChange={e => field.onChange(formatPhone(e.target.value))}
                label="WhatsApp" fullWidth inputProps={{ maxLength: 15 }} error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
        </Grid>
        <Grid item xs={12}>
          <Controller name="email" control={control} rules={{ validate: v => !v || validateEmail(v) || 'E-mail invalido' }}
            render={({ field, fieldState }) => (
              <TextField {...field} label="E-mail" type="email" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2.5 }} />
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>ENDERECO</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Controller name="address_zip" control={control} rules={{ validate: v => !v || validateCEP(v) || 'CEP invalido' }}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} onChange={e => field.onChange(formatCEP(e.target.value))}
                onBlur={() => handleCepBlur(field.value)} label="CEP" fullWidth inputProps={{ maxLength: 9 }}
                error={!!fieldState.error} helperText={fieldState.error?.message ?? (loadingCep ? 'Buscando CEP...' : undefined)} />
            )} />
        </Grid>
        <Grid item xs={12} sm={8}>
          <Controller name="address_street" control={control}
            render={({ field }) => <TextField {...field} label="Rua" fullWidth />} />
        </Grid>
        <Grid item xs={4} sm={3}>
          <Controller name="address_number" control={control}
            render={({ field }) => <TextField {...field} label="Numero" fullWidth />} />
        </Grid>
        <Grid item xs={8} sm={5}>
          <Controller name="address_complement" control={control}
            render={({ field }) => <TextField {...field} label="Complemento" fullWidth />} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="address_neighborhood" control={control}
            render={({ field }) => <TextField {...field} label="Bairro" fullWidth />} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="address_city" control={control}
            render={({ field }) => <TextField {...field} label="Cidade" fullWidth />} />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Controller name="address_state" control={control}
            render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} label="UF" select fullWidth>
                <MenuItem value="">UF</MenuItem>
                {STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            )} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2.5 }} />
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>CONTATO DE EMERGENCIA</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller name="emergency_contact_name" control={control}
            render={({ field }) => <TextField {...field} label="Nome" fullWidth />} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Controller name="emergency_contact_phone" control={control} rules={{ validate: v => !v || validatePhone(v) || 'Telefone invalido' }}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} onChange={e => field.onChange(formatPhone(e.target.value))}
                label="Telefone" fullWidth inputProps={{ maxLength: 15 }} error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Controller name="emergency_contact_relationship" control={control}
            render={({ field }) => <TextField {...field} label="Parentesco" fullWidth />} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="legal_guardian_name" control={control}
            render={({ field }) => <TextField {...field} label="Responsavel legal" fullWidth />} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="legal_guardian_phone" control={control} rules={{ validate: v => !v || validatePhone(v) || 'Telefone invalido' }}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} onChange={e => field.onChange(formatPhone(e.target.value))}
                label="Tel. responsavel" fullWidth inputProps={{ maxLength: 15 }} error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2.5 }} />
      <Controller name="notes" control={control}
        render={({ field }) => <TextField {...field} label="Observacoes" multiline rows={3} fullWidth />} />

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ minWidth: 140 }}>
          {loading ? <CircularProgress size={22} color="inherit" /> : initial ? 'Salvar' : 'Cadastrar'}
        </Button>
      </Box>
    </Box>
  )
}
