import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from '@/features/auth/msal-config'

export const msalInstance = new PublicClientApplication(msalConfig)
