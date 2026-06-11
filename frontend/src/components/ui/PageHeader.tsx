import { Box, Button, Typography } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  actionIcon?: React.ReactNode
}

export function PageHeader({ title, subtitle, actionLabel, onAction, actionIcon }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 2 },
        mb: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: 22, sm: 24 } }}>{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
        )}
      </Box>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          startIcon={actionIcon ?? <AddIcon />}
          onClick={onAction}
          sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}
