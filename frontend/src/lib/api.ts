import { env } from '@/config/env'

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const isAbsolute = /^https?:\/\//i.test(path)

  if (!isAbsolute && !env.API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL must be configured for relative API paths')
  }

  const url = isAbsolute ? path : `${env.API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`)
  }

  return data as T
}
