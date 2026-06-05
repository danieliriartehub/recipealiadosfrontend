import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { signIn, signOut, getUserRole } from '@/lib/auth'
import { Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/login/operador')({
  component: OperadorLogin,
})

function OperadorLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Redirigir si ya hay sesión activa de operador
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const role = await getUserRole(session.user.id)
      if (role === 'operador') navigate({ to: '/dashboard/operador', replace: true })
    })
  }, [])

  // Countdown de bloqueo
  useEffect(() => {
    if (!blockedUntil) return
    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.round((blockedUntil.getTime() - Date.now()) / 1000)
      )
      setCountdown(diff)
      if (diff === 0) {
        setBlockedUntil(null)
        setAttempts(0)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [blockedUntil])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (blockedUntil) return
    setLoading(true)
    setError(null)

    const { role, error: authError } = await signIn(email, password)

    if (authError) {
      const next = attempts + 1
      setAttempts(next)
      if (next >= 5) setBlockedUntil(new Date(Date.now() + 5 * 60 * 1000))
      setError(
        authError === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : authError
      )
      setLoading(false)
      return
    }

    if (role !== 'operador') {
      await signOut()
      setError('No tienes acceso a este portal.')
      setLoading(false)
      return
    }

    navigate({ to: '/dashboard/operador', replace: true })
    setLoading(false)
  }

  const isBlocked = !!blockedUntil && countdown > 0
  const canSubmit = email && password.length >= 6 && !loading && !isBlocked

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 bg-gradient-to-b from-green-900 to-emerald-800">
      <div className="w-full max-w-[420px]">

        {/* Badge acceso restringido */}
        <div className="flex justify-center mb-5">
          <div className="flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-4 py-2 text-sm font-semibold text-white">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Acceso restringido · Personal USIL
          </div>
        </div>

        {/* Ícono y título */}
        <div className="text-center mb-6">
          <ShieldCheck className="h-14 w-14 text-white mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-white">Portal Operadores</h1>
          <p className="text-sm text-white/60 mt-1">Centros de acopio USIL</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-white/40 p-6 space-y-5">

          {/* Bloqueo por intentos */}
          {isBlocked && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-center">
              <p className="text-sm font-semibold text-red-700">
                Demasiados intentos fallidos
              </p>
              <p className="text-xs text-red-500 mt-1">
                Intenta en{' '}
                <span className="font-bold tabular-nums">
                  {Math.floor(countdown / 60)}:
                  {String(countdown % 60).padStart(2, '0')}
                </span>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                Correo institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value.replace(/[<>'"`;\\]/g, ''))}
                placeholder="operador@usil.edu.pe"
                autoComplete="email"
                disabled={isBlocked}
                className="w-full h-14 rounded-xl border border-gray-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value.replace(/[<>'"`;\\]/g, ''))}
                  maxLength={72}
                  autoComplete="current-password"
                  disabled={isBlocked}
                  className="w-full h-14 rounded-xl border border-gray-200 px-4 pr-12 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && !isBlocked && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-14 rounded-xl bg-primary text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Ingresar como Operador'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 pt-1">
            Acceso exclusivo · Cuentas gestionadas por administración USIL
          </p>
        </div>

        {/* Volver */}
        <button
          onClick={() => navigate({ to: '/login' })}
          className="mt-5 flex items-center gap-1.5 mx-auto text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al portal de aliados
        </button>
      </div>
    </div>
  )
}
