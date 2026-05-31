import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CheckCircle2, LogOut, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { validateQrForOperator, registerRecyclingDelivery } from '@/lib/api'
import { QrScanner } from '@/components/QrScanner'

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

  const [validatorId, setValidatorId] = useState<string | null>(null)
  const [validator, setValidator] = useState<ValidatorInfo | null>(null)

  const [step, setStep] = useState<Step>('scan')
  const [qrInput, setQrInput] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const [material, setMaterial] = useState('plastico')
  const [kg, setKg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  // Cargar sesión y datos del validador
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

  // Logout por inactividad (5 min)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(async () => {
        await supabase.auth.signOut()
        navigate({ to: '/login/operador', replace: true })
      }, 5 * 60 * 1000)
    }
    window.addEventListener('touchstart', reset)
    window.addEventListener('click', reset)
    window.addEventListener('keydown', reset)
    reset()
    return () => {
      clearTimeout(timer)
      window.removeEventListener('touchstart', reset)
      window.removeEventListener('click', reset)
      window.removeEventListener('keydown', reset)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate({ to: '/login/operador', replace: true })
  }

  const handleValidateQr = async (token: string) => {
    if (!validatorId || !validator) return
    setQrInput(token)
    setLoading(true)
    setError(null)
    try {
      const res = await validateQrForOperator({
        token,
        validatorId,
        centerId: validator.center_id,
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

  const handleRegisterDelivery = async () => {
    if (!validatorId || !validator) return
    setLoading(true)
    setError(null)
    try {
      const res = await registerRecyclingDelivery({
        token: qrInput,
        validatorId,
        centerId: validator.center_id,
        material,
        kg: parseFloat(kg),
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
  const previewPoints =
    kg && kgFloat > 0
      ? Math.round((POINTS_PER_KG[material] ?? 0) * kgFloat)
      : null

  // ══ PASO A — SCANNER ══
  if (step === 'scan') {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between bg-white shrink-0 border-b border-gray-100">
          <div>
            <h1 className="font-bold text-lg text-gray-900">Escanear QR</h1>
            <p className="text-xs text-gray-500">
              {validator?.centers?.name ?? 'Centro de acopio'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>

        <div className="flex-1 p-4 min-h-0">
          <QrScanner onScan={handleValidateQr} onError={e => setError(e)} />
        </div>

        {error && (
          <div className="mx-4 mb-4 rounded-2xl bg-red-50 border border-red-200 p-4 shrink-0">
            <p className="text-sm text-red-700 font-medium text-center">{error}</p>
            <button
              onClick={() => { setError(null); setQrInput('') }}
              className="mt-2 w-full text-xs text-red-500 underline text-center"
            >
              Escanear de nuevo
            </button>
          </div>
        )}
      </div>
    )
  }

  // ══ PASOS B y C ══
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm text-gray-900 truncate max-w-[180px]">
            {validator?.centers?.name ?? 'Centro de acopio'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800"
        >
          <LogOut className="h-4 w-4" />
          Salir
        </button>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto">

        {/* ══ PASO B — CONFIRM ══ */}
        {step === 'confirm' && (
          <div className="space-y-5 p-5">
            <div className="rounded-2xl bg-green-50 border border-green-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white font-bold text-xl shrink-0">
                  {userData?.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate text-lg">{userData?.full_name}</p>
                  <p className="text-xs text-gray-500 font-mono truncate">{userData?.qr_code}</p>
                  <p className="text-sm text-primary font-semibold mt-0.5">
                    {userData?.points?.toLocaleString()} EcoPuntos
                  </p>
                </div>
                <CheckCircle2 className="h-7 w-7 text-green-500 ml-auto shrink-0" />
              </div>
            </div>

            <div>
              <label className="text-base font-semibold text-gray-700">
                Tipo de material
              </label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {MATERIALS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMaterial(m.value)}
                    className={`rounded-xl border-2 p-4 text-left transition-colors ${
                      material === m.value
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <p className="text-base font-semibold mt-1">{m.label}</p>
                    <p className="text-xs text-gray-400">{m.pts} pts/kg</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-base font-semibold text-gray-700">Peso (kg)</label>
              <input
                type="number"
                value={kg}
                onChange={e => setKg(e.target.value)}
                placeholder="0.0"
                min="0.1"
                max="50"
                step="0.1"
                className="mt-2 w-full h-14 rounded-xl border border-gray-200 px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {previewPoints !== null && (
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
                <p className="text-sm text-gray-500">Puntos a otorgar</p>
                <p className="text-3xl font-extrabold text-primary">+{previewPoints}</p>
                <p className="text-xs text-gray-400">EcoPuntos</p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 font-medium text-center">{error}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setStep('scan'); setQrInput(''); setError(null) }}
                className="h-14 rounded-xl border-2 border-gray-200 text-base font-semibold text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterDelivery}
                disabled={!kg || kgFloat <= 0 || loading}
                className="h-14 rounded-xl bg-primary text-base font-bold text-white disabled:opacity-40"
              >
                {loading ? 'Registrando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}

        {/* ══ PASO C — SUCCESS ══ */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] p-6 text-center space-y-5">
            <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">¡Entrega registrada!</h2>
              <p className="text-sm text-gray-500 mt-1">{result?.full_name}</p>
            </div>

            <div className="w-full rounded-2xl bg-white border p-5 space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Material</span>
                <span className="font-semibold capitalize">{result?.material}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Peso</span>
                <span className="font-semibold">{result?.kg} kg</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500">CO₂ ahorrado</span>
                <span className="font-semibold">{result?.co2_saved_kg} kg</span>
              </div>
              <div className="flex justify-between text-base border-t pt-3">
                <span className="text-gray-500">EcoPuntos</span>
                <span className="text-2xl font-extrabold text-primary">+{result?.points_earned}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500">Nuevo saldo</span>
                <span className="font-bold text-gray-900">
                  {result?.new_balance?.toLocaleString()} pts
                </span>
              </div>
            </div>

            <button
              onClick={resetFlow}
              className="w-full h-14 rounded-xl bg-primary text-base font-bold text-white"
            >
              Nueva entrega
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
