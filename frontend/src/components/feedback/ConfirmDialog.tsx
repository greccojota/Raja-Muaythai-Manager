import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography,
} from '@mui/material'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  confirmColor?: 'error' | 'primary' | 'warning'
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirmar',
  confirmColor = 'error', loading = false, onConfirm, onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
        <Button onClick={onClose} disabled={loading} fullWidth={false} sx={{ width: { xs: '100%', sm: 'auto' } }}>Cancelar</Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm} disabled={loading} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
