import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ToastProvider } from '@/components/feedback/ToastProvider'
import { getErrorMessage, notifyToast } from '@/components/feedback/notify'
import { AuthProvider } from '@/contexts/AuthContext'
import { router } from '@/routes'
import theme from '@/theme'

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      const title = mutation.meta?.successMessage as string | undefined
      notifyToast({ severity: 'success', title: title ?? 'Operacao concluida' })
    },
    onError: (error, _variables, _context, mutation) => {
      const title = mutation.meta?.errorMessage as string | undefined
      notifyToast({
        severity: 'error',
        title: title ?? 'Algo deu errado',
        message: getErrorMessage(error),
      })
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <RouterProvider router={router} />
          <ToastProvider />
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
