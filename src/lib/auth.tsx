import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

// ── URL del backend Railway ───────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string

// Tipo de la respuesta de /api/v1/auth/login
interface BackendSession {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: {
    id: string
    email: string
    full_name?: string | null
    email_confirmed: boolean
  }
}
interface BackendLoginResponse {
  session: BackendSession
}

// ── Helper privado: llama al backend /logout con el token activo ──
async function callBackendLogout(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
  } catch {
    // El logout del backend falla silenciosamente;
    // el cliente limpia su sesión de todas formas.
  }
}

// ── Roles y funciones standalone ─────────────────────────────────

export type UserRole = 'aliado' | 'operador' | null

// getUserRole sigue consultando Supabase directamente.
// Funciona porque después del login se llama setSession(),
// que establece el JWT en el cliente Supabase local.
export async function getUserRole(userId: string): Promise<UserRole> {
  const { data: validator } = await supabase
    .from('validators')
    .select('id, is_active')
    .eq('id', userId)
    .single()
  if (validator?.is_active) return 'operador'

  const { data: merchant } = await supabase
    .from('merchant_users')
    .select('id, is_active')
    .eq('id', userId)
    .single()
  if (merchant?.is_active) return 'aliado'

  return null
}

/**
 * Autentica al usuario contra el backend Railway.
 * Flujo:
 *  1. POST /api/v1/auth/login → backend valida en Supabase Auth y devuelve tokens
 *  2. supabase.auth.setSession() restaura la sesión local con esos tokens
 *  3. getUserRole() determina el rol usando el JWT ya establecido
 */
export async function signIn(
  email: string,
  password: string,
): Promise<{ role: UserRole; error: string | null }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { role: null, error: body.detail ?? 'Correo o contraseña incorrectos.' }
    }

    const { session }: BackendLoginResponse = await res.json()

    // Restaurar sesión Supabase en el cliente para habilitar queries con RLS
    await supabase.auth.setSession({
      access_token:  session.access_token,
      refresh_token: session.refresh_token,
    })

    const role = await getUserRole(session.user.id)
    if (!role) {
      await callBackendLogout()
      await supabase.auth.signOut()
      return { role: null, error: 'No tienes acceso a este portal.' }
    }

    return { role, error: null }
  } catch (e: any) {
    return { role: null, error: e?.message ?? 'Error de conexión con el servidor.' }
  }
}

/**
 * Cierra sesión: notifica al backend (invalida el JWT en Supabase)
 * y limpia la sesión local del cliente Supabase.
 */
export async function signOut(): Promise<void> {
  await callBackendLogout()
  await supabase.auth.signOut()
}

// ── MerchantAuthProvider (aliados) ────────────────────────────────

interface MerchantPartner {
  id: string
  name: string
  tagline: string | null
  description: string | null
  logo_url: string | null
  cover_url: string | null
  brand_color: string | null
  category: string | null
  email: string | null
  website: string | null
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
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const MerchantAuthContext = createContext<MerchantAuthContextValue | null>(null)

export function MerchantAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [merchantUser, setMerchantUser] = useState<MerchantUser | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function fetchMerchantUser(userId: string) {
    const { data } = await supabase
      .from('merchant_users')
      .select('*, merchant_partners(*)')
      .eq('id', userId)
      .single()
    setMerchantUser(data ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchMerchantUser(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchMerchantUser(session.user.id)
      } else {
        setMerchantUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Renombradas para evitar shadowing del módulo; delegadas al backend.
  async function contextSignIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await signIn(email, password) // llama al signIn del módulo → backend
    return { error }
  }

  async function contextSignOut(): Promise<void> {
    await callBackendLogout()
    await supabase.auth.signOut()
    setMerchantUser(null)
    navigate({ to: '/login', replace: true })
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
