const baseUrl = (import.meta.env.VITE_BASE_URL as string | undefined)?.trim()

export const env = {
  ENTRA_AUTHORITY: import.meta.env.VITE_ENTRA_AUTHORITY,
  ENTRA_CLIENT_ID: import.meta.env.VITE_ENTRA_CLIENT_ID,
  ENTRA_TENANT_ID: import.meta.env.VITE_ENTRA_TENANT_ID,
  API_SCOPE: import.meta.env.VITE_API_SCOPE,
  API_BASE_URL: baseUrl && baseUrl.length > 0 ? baseUrl.replace(/\/+$/, '') : '/api',
}
