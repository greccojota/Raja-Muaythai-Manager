import { useEffect, useState } from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  IconButton,
  Slide,
  Snackbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  CheckCircle as SuccessIcon,
  Close as CloseIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material'
import type { SlideProps } from '@mui/material/Slide'
import { subscribeToToasts, type ToastMessage } from './notify'

const ICONS = {
  success: <SuccessIcon fontSize="small" />,
  info: <InfoIcon fontSize="small" />,
  warning: <WarningIcon fontSize="small" />,
  error: <ErrorIcon fontSize="small" />,
}

function SlideUp(props: SlideProps) {
  return <Slide {...props} direction="up" />
}

export function ToastProvider() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [queue, setQueue] = useState<ToastMessage[]>([])
  const toast = queue[0]

  useEffect(() => subscribeToToasts(message => {
    setQueue(current => [...current, message])
  }), [])

  const closeCurrent = () => setQueue(current => current.slice(1))

  return (
    <Snackbar
      open={!!toast}
      autoHideDuration={4200}
      onClose={closeCurrent}
      TransitionComponent={SlideUp}
      anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'center' : 'right' }}
      sx={{
        left: { xs: 12, sm: 'auto' },
        right: { xs: 12, sm: 24 },
        bottom: { xs: 86, sm: 24 },
      }}
    >
      {toast ? (
        <Alert
          severity={toast.severity}
          icon={ICONS[toast.severity]}
          variant="filled"
          action={
            <IconButton color="inherit" size="small" onClick={closeCurrent} aria-label="Fechar alerta">
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{
            width: { xs: '100%', sm: 420 },
            maxWidth: '100%',
            borderRadius: 2,
            alignItems: 'center',
            boxShadow: '0 18px 45px rgba(0,0,0,.18)',
            '& .MuiAlert-icon': { opacity: 1, alignItems: 'center' },
          }}
        >
          <Box>
            <AlertTitle sx={{ mb: toast.message ? 0.25 : 0, fontWeight: 800, lineHeight: 1.2 }}>
              {toast.title}
            </AlertTitle>
            {toast.message && (
              <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.92, whiteSpace: 'pre-line' }}>
                {toast.message}
              </Typography>
            )}
          </Box>
        </Alert>
      ) : undefined}
    </Snackbar>
  )
}
