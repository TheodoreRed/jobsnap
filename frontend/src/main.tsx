import { createRoot } from 'react-dom/client'
import './index.css'

import App from './app/App.tsx'
import { Providers } from './app/Providers.tsx'
import { msalInstance } from '@/lib/msal/msal'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error("Root element with id 'root' not found.")

await msalInstance.initialize()
await msalInstance.handleRedirectPromise()

createRoot(rootElement).render(
  <Providers>
    <App />
  </Providers>
)
