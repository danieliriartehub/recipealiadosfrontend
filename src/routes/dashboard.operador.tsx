import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CheckCircle2, LogOut, QrCode, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  validateQrForOperator,
  registerRecyclingDelivery,
} from '@/lib/api'

export const Route = createFileRoute('/dashboard/operador')({
  component: OperadorDashboard,
})

type Step = 'scan' | 'confirm' | 'success'

interface ValidatorInfo {
  center_id: string
  full_name: string
  centers: { name: string } | null
}

const POINTS_PER_KG: Record<string, number> = {
  plastico: 50,
  papel: 30,
  vidrio: 40,
  aluminio: 80,
}

const MATERIALS = [
  { value: 'plastico', label: 'Plástico',  emoji: '🧴', pts: 50 },
  { value: 'papel',    label: 'Papel',     emoji: '📄', pts: 30 },
  { value: 'vidrio',   label: 'Vidrio',    emoji: '🍾', pts: 40 },
  { value: 'aluminio', label: 'Aluminio',  emoji: '🥫', pts: 80 },
]

function OperadorDashboard() {
  const navigate = useNavigate()

  // ── Estado del validador ──────────────────────────────────────
  const [validatorId, setValidatorId] = useState<string | null>(null)
  const [validator, setValidator] = useState<ValidatorInfo | null>(null)

  // ── Estado del flujo ──────────────────────────────────────────
  const [step, setStep] = useState<Step>('scan')
  const [qrInput, setQrInput] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const [material, setMaterial] = useState('plastico')
  const [kg, setKg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  // ── Cargar datos del validador al montar ──────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate({ to: '/login/operador', replace: true })
        return
      }
      setValidatorId(session.user.id)
      const { data } = await supabase
        .from('validators')
        .select('center_id, full_name, centers(name)')
        .eq('id', session.user.id)
        .single()
      if (data) setValidator(data as ValidatorInfo)
    })
  }, [])

  // ── Logout ────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate({ to: '/login/operador', replace: true })
  }

  // ── PASO A: Validar QR ────────────────────────────────────────
  const handleValidateQr = async () => {
    if (!validatorId || !validator) return
    setLoading(true)
    setError(null)
    try {
      const res = await validateQrForOperator({
        token:       qrInput,
        validatorId,
        centerId:    validator.center_id,
      })
      if (!res.valid) {
        setError(res.error ?? 'QR inválido')
        return
      }
      setUserData(res)
      setStep('confirm')
    } catch {
      setError('Error al verificar el QR. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── PASO B: Registrar entrega ─────────────────────────────────
  const handleRegisterDelivery = async () => {
    if (!validatorId || !validator) return
    setLoading(true)
    setError(null)
    try {
      const res = await registerRecyclingDelivery({
        token:       qrInput,
        validatorId,
        centerId:    validator.center_id,
        material,
        kg:          parseFloat(kg),
      })
      if (!res.success) {
        setError(res.error ?? 'Error al registrar la entrega')
        return
      }
      setResult(res)
      setStep('success')
    } catch {
      setError('Error al registrar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const resetFlow = () => {
    setStep('scan')
    setQrInput('')
    setKg('')
    setMaterial('plastico')
    setResult(null)
    setError(null)
  }

  const kgFloat = parseFloat(kg)
  const previewPoints = kg && kgFloat > 0
    ? Math.round((POINTS_PER_KG[material] ?? 0) * kgFloat)
    : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Header fijo ─────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm text-gray-900 truncate max-w-[180px]">
            {validator?.centers?.name ?? 'Centro de acopio'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Salir
        </button>
      </header>

      {/* ── Contenido por paso ──────────────────────────────── */}
      <div className="flex-1 max-w-md w-full mx-auto">

        {/* ══════════ PASO A — SCAN ══════════ */}
        {step === 'scan' && (
          <div className="space-y-6 p-6">
            <div className="text-center">
              <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-3" />
              <h1 className="text-xl font-bold">Validar entrega</h1>
              <p className="text-sm text-gray-500 mt-1">
                {validator?.centers?.name ?? 'Centro de acopio'}
              </p>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
              <QrCode className="h-10 w-10 text-primary/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600">
                Escanea o ingresa el código QR del estudiante
              </p>
            </div>

            <input
              type="text"
              value={qrInput}
              onChange={e => setQrInput(e.target.value.trim())}
              placeholder="Código QR del estudiante..."
              autoFocus
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            {error && (
              <p className="text-sm text-red-600 font-medium text-center">
                {error}
              </p>
            )}

            <button
              onClick={handleValidateQr}
              disabled={!qrInput || loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-40"
            >
              {loading ? 'Verificando QR...' : 'Verificar QR'}
            </button>
          </div>
        )}

        {/* ══════════ PASO B — CONFIRM ══════════ */}
        {step === 'confirm' && (
          <div className="space-y-5 p-6">

            {/* Identidad del usuario */}
            <div className="rounded-2xl bg-green-50 border border-green-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg shrink-0">
                  {userData?.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">
                    {userData?.full_name}
                  </p>
                  <p className="text-xs text-gray-500 font-mono truncate">
                    {userData?.qr_code}
                  </p>
                  <p className="text-xs text-primary font-semibold mt-0.5">
                    {userData?.points?.toLocaleString()} EcoPuntos actuales
                  </p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-green-500 ml-auto shrink-0" />
              </div>
            </div>

            {/* Selector de material */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Tipo de material
              </label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {MATERIALS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMaterial(m.value)}
                    className={`rounded-xl border-2 p-3 text-left transition-colors ${
                      material === m.value
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <p className="text-sm font-semibold mt-1">{m.label}</p>
                    <p className="text-xs text-gray-400">{m.pts} pts/kg</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Input de peso */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Peso (kg)
              </label>
              <input
                type="number"
                value={kg}
                onChange={e => setKg(e.target.value)}
                placeholder="0.0"
                min="0.1"
                max="50"
                step="0.1"
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Preview de puntos */}
            {previewPoints !== null && (
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
                <p className="text-xs text-gray-500">Puntos a otorgar</p>
                <p className="text-2xl font-extrabold text-primary">
                  +{previewPoints}
                </p>
                <p className="text-xs text-gray-400">EcoPuntos</p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 font-medium text-center">
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setStep('scan'); setQrInput(''); setError(null) }}
                className="rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterDelivery}
                disabled={!kg || kgFloat <= 0 || loading}
                className="rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                {loading ? 'Registrando...' : 'Confirmar entrega'}
              </button>
            </div>
          </div>
        )}

        {/* ══════════ PASO C — SUCCESS ══════════ */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] p-6 text-center space-y-5">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                ¡Entrega registrada!
              </h2>
              <p className="text-sm text-gray-500 mt-1">{result?.full_name}</p>
            </div>

            <div className="w-full rounded-2xl bg-gray-50 border p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Material</span>
                <span className="font-semibold capitalize">{result?.material}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Peso</span>
                <span className="font-semibold">{result?.kg} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">CO₂ ahorrado</span>
                <span className="font-semibold">{result?.co2_saved_kg} kg</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-3">
                <span className="text-gray-500">EcoPuntos otorgados</span>
                <span className="text-xl font-extrabold text-primary">
                  +{result?.points_earned}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Nuevo saldo</span>
                <span className="font-bold text-gray-900">
                  {result?.new_balance?.toLocaleString()} pts
                </span>
              </div>
            </div>

            <button
              onClick={resetFlow}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white"
            >
              Nueva entrega
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
