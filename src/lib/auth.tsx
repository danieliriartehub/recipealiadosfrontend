import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { backendApi, type LoginResponse, type RefreshResponse } from './backendApi'

// ─── Token en memoria ────────────────────────────────────────────────────────
// El access_token vive solo en RAM. Nunca toca localStorage ni sessionStorage.
// Al recargar la página, MerchantAuthProvider lo reconstituye vía /refresh.

let _accessToken: string | null = null

/** Retorna el access_token actual (en memoria). Úsalo en lugar de supabase.auth.getSession(). */
export const getAccessToken = (): string | null => _accessToken

function setAccessToken(t: string | null): void {
  _accessToken = t
}

// ─── Constantes de refresco ───────────────────────────────────────────────────
// El access_token de Supabase dura 3600s (1h).
// Refrescamos a los 55 minutos para tener 5 min de margen.
const REFRESH_INTERVAL_MS = 55 * 60 * 1000

// ─── silentRefresh ───────────────────────────────────────────────────────────
// Llama al backend para obtener un nuevo access_token usando la cookie HttpOnly.
// credentials: 'include' en backendApi garantiza que la cookie se adjunte.

async function silentRefresh(): Promise<string | null> {
  try {
    const data = await backendApi.post<RefreshResponse>('/api/v1/auth/refresh')
    // Sincronizar el cliente Supabase con el nuevo token (solo en memoria).
    // El refresh_token real está en la cookie HttpOnly — usamos un placeholder
    // requerido por el SDK de supabase-js.
    await supabase.auth.setSession({
      access_token:  data.access_token,
      refresh_token: 'dummy-refresh-token',
    })
    setAccessToken(data.access_token)
    console.log('[RECIPE] Token refrescado via /refresh')
    return data.access_token
  } catch (err) {
    // Cookie expirada o revocada → sin sesión activa
    console.warn('[RECIPE] silentRefresh falló:', (err as Error).message)
    return null
  }
}

// ─── Roles ───────────────────────────────────────────────────────────────────

export type UserRole = 'aliado' | 'operador' | null

/**
 * Determina el rol del usuario consultando /api/v1/aliados/whoami.
 * Usa el token en memoria — el parámetro _userId se mantiene por compatibilidad
 * con las rutas existentes pero no se usa en la consulta.
 */
export async function getUserRole(_userId: string): Promise<UserRole> {
  const token = getAccessToken()
  if (!token) return null
  try {
    const data = await backendApi.withToken(token).get<any>('/api/v1/aliados/whoami')
    return data?.role ?? null
  } catch {
    return null
  }
}

// ─── signIn (standalone) ─────────────────────────────────────────────────────

/**
 * Autentica al usuario contra el backend Railway.
 * Flujo:
 *  1. POST /api/v1/auth/login → backend valida en Supabase Auth
 *  2. access_token en body → setSession en memoria (dummy refresh_token)
 *  3. refresh_token → cookie HttpOnly (el navegador lo gestiona automáticamente)
 *  4. getUserRole() determina el rol para el redireccionamiento
 */
export async function signIn(
  email: string,
  password: string,
): Promise<{ role: UserRole; error: string | null }> {
  try {
    const data = await backendApi.post<LoginResponse>('/api/v1/auth/login', { email, password })

    // Sincronizar el cliente Supabase con el access_token.
    // El refresh_token viaja solo en cookie — usamos un placeholder requerido por el SDK.
    await supabase.auth.setSession({
      access_token:  data.session.access_token,
      refresh_token: 'dummy-refresh-token',
    })

    setAccessToken(data.session.access_token)

    const role = await getUserRole(data.session.user.id)
    if (!role) {
      await signOut()
      return { role: null, error: 'No tienes acceso a este portal.' }
    }

    return { role, error: null }
  } catch (e: any) {
    return { role: null, error: e?.message ?? 'Error de conexión con el servidor.' }
  }
}

// ─── signOut (standalone) ────────────────────────────────────────────────────

/**
 * Cierra sesión: notifica al backend (invalida el JWT y borra la cookie HttpOnly)
 * y limpia la sesión local de Supabase.
 */
export async function signOut(): Promise<void> {
  const token = _accessToken
  setAccessToken(null)
  try {
    if (token) {
      await backendApi.postAuth<void>('/api/v1/auth/logout', token)
    }
  } catch {
    // El logout del backend falla silenciosamente;
    // el cliente limpia su sesión de todas formas.
  }
  await supabase.auth.signOut()
}

// ─── MerchantAuthProvider ─────────────────────────────────────────────────────

interface MerchantPartner {
  id: string
  business_name: string
  tagline: string | null
  profile_description: string | null
  logo_url: string | null
  banner_url: string | null
  brand_color: string | null
  category: string | null
  contact_email: string | null
  website_url: string | null
  created_at: string
}

interface MerchantUser {
  id: string
  email: string | null
  merchant_partner_id: string
  created_at: string
  merchant_partners: MerchantPartner | null
}

interface MerchantAuthContextValue {
  session: Session | null
  merchantUser: MerchantUser | null
  merchantPartner: MerchantPartner | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ role: UserRole; error: string | null }>
  signOut: () => Promise<void>
}

const MerchantAuthContext = createContext<MerchantAuthContextValue | null>(null)

export function MerchantAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]           = useState<Session | null>(null)
  const [merchantUser, setMerchantUser] = useState<MerchantUser | null>(null)
  const [loading, setLoading]           = useState(true)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Refresco automático del access_token ─────────────────────────────────
  function startRefreshTimer() {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    refreshTimerRef.current = setInterval(async () => {
      const token = await silentRefresh()
      if (!token) {
        stopRefreshTimer()
        setSession(null)
        setMerchantUser(null)
      }
    }, REFRESH_INTERVAL_MS)
  }

  function stopRefreshTimer() {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }

  // ── fetchMerchantUser ────────────────────────────────────────────────────
  // Consulta /whoami y actualiza el estado solo si el rol es 'aliado'.
  async function fetchMerchantUser(token: string) {
    try {
      // Usa /whoami para evitar 404s cuando el usuario es operador
      const whoami = await backendApi.withToken(token).get<any>('/api/v1/aliados/whoami')
      if (whoami?.role === 'aliado') {
        setMerchantUser(whoami ?? null)
      } else {
        setMerchantUser(null)
      }
    } catch {
      setMerchantUser(null)
    }
  }

  // ── ARRANQUE: reconstituir sesión desde cookie HttpOnly ──────────────────
  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      // Paso 1: token en memoria (ya existe si el login fue en esta misma pestaña)
      let token = getAccessToken()

      // Paso 2: si no hay token (recarga de página), intentar refresco silencioso
      // usando la cookie HttpOnly. credentials: 'include' lo garantiza.
      if (!token) {
        token = await silentRefresh()
      }

      if (!mounted) return

      if (token) {
        // Paso 3: obtener el objeto Session completo (setSession ya lo cargó en RAM)
        const { data: { session: sess } } = await supabase.auth.getSession()
        if (mounted && sess) {
          setSession(sess)
          startRefreshTimer()
          await fetchMerchantUser(token)
        }
      }

      if (mounted) setLoading(false)
    }

    bootstrap()

    // Escuchar eventos de Supabase para reaccionar a cambios de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT') {
        stopRefreshTimer()
        setSession(null)
        setMerchantUser(null)
        setAccessToken(null)
        if (mounted) setLoading(false)
      }

      if (event === 'TOKEN_REFRESHED' && sess) {
        setSession(sess)
        setAccessToken(sess.access_token)
      }
    })

    // Timeout de emergencia: 8s — evita loading infinito si el backend no responde
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 8000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      stopRefreshTimer()
      clearTimeout(timeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── contextSignIn ────────────────────────────────────────────────────────
  async function contextSignIn(email: string, password: string): Promise<{ role: UserRole; error: string | null }> {
    const { role, error } = await signIn(email, password)
    if (!error) {
      // Actualizar el estado del contexto tras login exitoso
      const token = getAccessToken()
      if (token) {
        const { data: { session: sess } } = await supabase.auth.getSession()
        if (sess) setSession(sess)
        startRefreshTimer()
        await fetchMerchantUser(token)
      }
    }
    return { role, error }
  }

  // ── contextSignOut ───────────────────────────────────────────────────────
  async function contextSignOut(): Promise<void> {
    await signOut()
    setMerchantUser(null)
    setSession(null)
  }

  const merchantPartner = merchantUser?.merchant_partners ?? null

  return (
    <MerchantAuthContext.Provider
      value={{
        session,
        merchantUser,
        merchantPartner,
        loading,
        signIn: contextSignIn,
        signOut: contextSignOut,
      }}
    >
      {children}
    </MerchantAuthContext.Provider>
  )
}

export function useMerchantAuth(): MerchantAuthContextValue {
  const ctx = useContext(MerchantAuthContext)
  if (!ctx) throw new Error('useMerchantAuth debe usarse dentro de MerchantAuthProvider')
  return ctx
}
