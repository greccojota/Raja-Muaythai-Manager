import { createTheme, alpha } from '@mui/material/styles'

// Cores extraídas da logo Arena Thai Raja Stadium
const RAJA_RED    = '#C62828'
const RAJA_DARK   = '#101014'   // sidebar
const RAJA_BLUE   = '#1565C0'
const RAJA_GOLD   = '#D4AF37'

const theme = createTheme({
  palette: {
    primary: {
      main:          RAJA_RED,
      light:         '#EF5350',
      dark:          '#8E0000',
      contrastText:  '#ffffff',
    },
    secondary: {
      main:          RAJA_BLUE,
      light:         '#42A5F5',
      dark:          '#003C8F',
      contrastText:  '#ffffff',
    },
    background: {
      default: '#F4F5F7',
      paper:   '#ffffff',
    },
    text: {
      primary:   '#1A1A2E',
      secondary: '#6B7280',
    },
    success: { main: '#2E7D32' },
    warning: { main: '#E65100' },
    error:   { main: '#C62828' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, color: '#6B7280' },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 10 },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
    '0 4px 6px rgba(0,0,0,.05), 0 2px 4px rgba(0,0,0,.04)',
    '0 10px 15px rgba(0,0,0,.07), 0 4px 6px rgba(0,0,0,.05)',
    '0 20px 25px rgba(0,0,0,.08), 0 10px 10px rgba(0,0,0,.04)',
    ...Array(20).fill('0 25px 50px rgba(0,0,0,.12)'),
  ] as any,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 42,
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${RAJA_RED} 0%, #8E0000 100%)`,
          '&:hover': { background: `linear-gradient(135deg, #EF5350 0%, ${RAJA_RED} 100%)` },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'medium' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: RAJA_RED },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
          border: '1px solid rgba(0,0,0,.06)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 25px 50px rgba(0,0,0,.15)',
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 6, fontWeight: 600 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F8F9FA',
            fontWeight: 700,
            fontSize: 13,
            color: '#374151',
            borderBottom: '2px solid #E5E7EB',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': { borderBottom: 0 },
          '&:hover': { backgroundColor: alpha(RAJA_RED, 0.03) },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
})

export { RAJA_RED, RAJA_DARK, RAJA_BLUE, RAJA_GOLD }
export default theme
