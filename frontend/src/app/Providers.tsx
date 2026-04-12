import { StrictMode, useMemo, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { queryClient } from '@/lib/react-query/query-client'
import { createAppTheme } from '@/lib/theme/theme'
import { useThemeStore } from '@/lib/theme/useThemeStore'

function ThemedApp({ children }: Readonly<{ children: ReactNode }>) {
  const mode = useThemeStore(s => s.mode)
  const theme = useMemo(() => createAppTheme(mode), [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemedApp>{children}</ThemedApp>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>
  )
}
