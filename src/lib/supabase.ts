import { createClient, type SupportedStorage } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) throw new Error('Faltan variables de entorno de Supabase')

// ─── Storage en memoria ────────────────────────────────────────────────────────
// Reemplaza el localStorage por defecto de Supabase JS.
// Los tokens (access_token, refresh_token) NUNCA tocan el disco —
// viven exclusivamente en RAM y son invisibles para cualquier script XSS.
//
// Consecuencia esperada: al cerrar la pestaña o recargar la página
// el access_token se pierde. MerchantAuthProvider lo reconstituye
// llamando a POST /api/v1/auth/refresh, que lee el refresh_token
// desde la cookie HttpOnly del navegador.

const _store = new Map<string, string>()

const inMemoryStorage: SupportedStorage = {
  getItem:    (key) => _store.get(key) ?? null,
  setItem:    (key, value) => { _store.set(key, value) },
  removeItem: (key) => { _store.delete(key) },
}

export const supabase = createClient(url, key, {
  auth: {
    storage: inMemoryStorage,
    persistSession: false,    // No escribir en localStorage ni sessionStorage
    autoRefreshToken: false,  // El refresco lo maneja MerchantAuthProvider vía /refresh
    detectSessionInUrl: true, // Necesario para magic links y recovery de contraseña
  },
})

