import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

interface FormDrawerProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: number
}

export function FormDrawer({ open, title, onClose, children, width = 720 }: FormDrawerProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          width: fullScreen ? '100%' : width,
          maxWidth: 'calc(100vw - 32px)',
          borderRadius: fullScreen ? 0 : 2,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="Fechar">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.paper' }}>
        {children}
      </DialogContent>
    </Dialog>
  )
}
