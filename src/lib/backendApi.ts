/**
 * Cliente HTTP para el backend RECIPE desplegado en Railway (FastAPI).
 * Base URL configurada mediante VITE_API_URL en variables de entorno.
 *
 * SEGURIDAD: todas las peticiones usan `credentials: 'include'` para que
 * el navegador adjunte automáticamente la cookie HttpOnly que contiene
 * el refresh_token — sin que JavaScript tenga acceso a su valor.
 */

const API_URL = import.meta.env.VITE_API_URL ?? ''

if (!API_URL) {
  console.warn('[RECIPE] VITE_API_URL no está definida. Las llamadas al backend fallarán.')
}

// ─── Tipos de respuesta del backend ──────────────────────────────────────────

export interface BackendUser {
  id: string
  email: string
  full_name: string
  email_confirmed: boolean
}

export interface BackendSession {
  /** access_token JWT — se mantiene solo en memoria (nunca en localStorage) */
  access_token: string
  token_type: string
  expires_in: number
  user: BackendUser
  // NOTA: refresh_token ya NO está en el body — viaja solo en cookie HttpOnly
}

export interface LoginResponse {
  session: BackendSession
}

export interface RegisterResponse {
  needs_confirmation: boolean
  session: BackendSession | null
}

export interface RefreshResponse {
  access_token: string
  expires_in: number
}

export interface MeResponse {
  user: BackendUser
  profile: {
    points: number
    streak_days: number
    co2_saved_kg: number
    level_index: number
  }
}

// ─── Fetch base con manejo de errores ────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers: optHeaders, ...restOptions } = options
  const isFormData = restOptions.body instanceof FormData
  const headers: Record<string, string> = { ...(optHeaders as Record<string, string> ?? {}) }
  
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...restOptions,
    headers,
  })

  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => ({ detail: res.statusText }))

  if (!res.ok) {
    // FastAPI devuelve errores como { detail: "mensaje" } o detail: [...] para errores de validación
    let errorMessage = `Error ${res.status}`
    if (body?.detail) {
      errorMessage = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    }
    throw new Error(errorMessage)
  }

  return body as T
}

// ─── Helpers internos ────────────────────────────────────────────────────────

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

// ─── Cliente exportado ───────────────────────────────────────────────────────

export const backendApi = {
  // ── Sin autenticación ────────────────────────────────────────────────────

  /** GET público (sin token) */
  get: <T>(path: string): Promise<T> =>
    apiFetch<T>(path),

  /** POST sin token (login, register, forgot-password) */
  post: <T>(path: string, body?: unknown): Promise<T> =>
    apiFetch<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  // ── Con Bearer token ─────────────────────────────────────────────────────

  /** GET con Bearer token */
  getAuth: <T>(path: string, token: string): Promise<T> =>
    apiFetch<T>(path, {
      headers: authHeaders(token),
    }),

  /** POST con Bearer token */
  postAuth: <T>(path: string, token: string, body?: unknown): Promise<T> =>
    apiFetch<T>(path, {
      method: 'POST',
      headers: authHeaders(token),
      body: body !== undefined && !(body instanceof FormData) ? JSON.stringify(body) : (body as any),
    }),

  /** POST FormData con Bearer token */
  postFormAuth: <T>(path: string, token: string, formData: FormData): Promise<T> =>
    apiFetch<T>(path, {
      method: 'POST',
      headers: authHeaders(token),
      body: formData,
    }),

  /** PATCH con Bearer token */
  patchAuth: <T>(path: string, token: string, body?: unknown): Promise<T> =>
    apiFetch<T>(path, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  /** DELETE con Bearer token */
  deleteAuth: <T>(path: string, token: string): Promise<T> =>
    apiFetch<T>(path, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  /**
   * Devuelve un sub-cliente con el token ya ligado, para evitar pasarlo
   * manualmente en cada llamada dentro de api.ts.
   *
   * Uso:
   *   const api = backendApi.withToken(token)
   *   await api.get('/api/v1/wallet/balance')
   *   await api.post('/api/v1/recyclings/', body)
   */
  withToken(token: string) {
    return {
      get: <T>(path: string) => backendApi.getAuth<T>(path, token),
      post: <T>(path: string, body?: unknown) => backendApi.postAuth<T>(path, token, body),
      postForm: <T>(path: string, formData: FormData) => backendApi.postFormAuth<T>(path, token, formData),
      patch: <T>(path: string, body?: unknown) => backendApi.patchAuth<T>(path, token, body),
      delete: <T>(path: string) => backendApi.deleteAuth<T>(path, token),
    }
  },
}
