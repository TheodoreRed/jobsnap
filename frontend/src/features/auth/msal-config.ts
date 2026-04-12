import { LogLevel, type Configuration } from '@azure/msal-browser'

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_GLOBAL_WEBAPP_CLIENT_ID,
    authority: `https://${import.meta.env.VITE_CIAM_DOMAIN}.ciamlogin.com/`,
    redirectUri: globalThis.location.origin,
    postLogoutRedirectUri: globalThis.location.origin
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning
    }
  }
}

export const apiScope = import.meta.env.VITE_API_SCOPE // e.g. "api://poc-myapp-api/access_as_user"
