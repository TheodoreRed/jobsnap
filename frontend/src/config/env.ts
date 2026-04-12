const baseUrl = (import.meta.env.VITE_BASE_URL as string | undefined)?.trim()

export const env = {
  API_BASE_URL: baseUrl && baseUrl.length > 0 ? baseUrl.replace(/\/+$/, '') : '/api',
}
