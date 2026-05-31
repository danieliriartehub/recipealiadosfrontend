import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

// ── Roles y funciones standalone ─────────────────────────────────

export type UserRole = 'aliado' | 'operador' | null

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

export async function signIn(
  email: string,
  password: string,
): Promise<{ role: UserRole; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { role: null, error: error.message }

  const role = await getUserRole(data.user.id)
  if (!role) {
    await supabase.auth.signOut()
    return { role: null, error: 'No tienes acceso a este portal.' }
  }
  return { role, error: null }
}

export async function signOut() {
  await supabase.auth.signOut()
}

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

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message === 'Invalid login credentials')
        return { error: 'Correo o contraseña incorrectos' }
      if (error.message === 'Email not confirmed')
        return { error: 'Cuenta pendiente de activación' }
      return { error: error.message }
    }
    return { error: null }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    setMerchantUser(null)
    navigate({ to: '/login', replace: true })
  }

  const merchantPartner = merchantUser?.merchant_partners ?? null

  return (
    <MerchantAuthContext.Provider
      value={{ session, merchantUser, merchantPartner, loading, signIn, signOut }}
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
