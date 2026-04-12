import { StrictMode, useState, useEffect, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { MsalProvider, useMsal } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import { ThemeProvider, CssBaseline, useColorScheme } from '@mui/material'
import { msalInstance } from '@/lib/msal/msal'
import { queryClient } from '@/lib/react-query/query-client'
import { createAppTheme } from '@/lib/theme/theme'
import { useThemeStore } from '@/lib/theme/useThemeStore'
import { useMemo } from 'react'
import { useLocaleStore } from '@/i18n/useLocaleStore'
import { ToastContainer } from 'react-toastify'
import { IntlProvider } from 'react-intl'
import { flattenMessages, messages } from '@/lang'
import { AuthInitializer } from '@/features/auth/AuthInitializer'
import { LoadingScreen } from '@/components/LoadingScreen'

function MsalReady({ children }: Readonly<{ children: ReactNode }>) {
  const { inProgress } = useMsal()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      setReady(true)
    }
  }, [inProgress])

  if (!ready) return <LoadingScreen />
  return <>{children}</>
}

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

function ToastWrapper() {
  const { mode } = useColorScheme()

  return (
    <ToastContainer
      position='bottom-right'
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={mode}
    />
  )
}

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const locale = useLocaleStore(s => s.locale)
  const flatMessages = useMemo(() => flattenMessages(messages[locale]), [locale])

  return (
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <MsalReady>
          <AuthInitializer>
            <IntlProvider locale={locale} messages={flatMessages}>
              <QueryClientProvider client={queryClient}>
                <ThemedApp>
                  <ToastWrapper />
                  {children}
                </ThemedApp>
                <ReactQueryDevtools initialIsOpen={false} />
              </QueryClientProvider>
            </IntlProvider>
          </AuthInitializer>
        </MsalReady>
      </MsalProvider>
    </StrictMode>
  )
}
