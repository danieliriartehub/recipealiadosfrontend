import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CheckCircle2, LogOut } from 'lucide-react'
import { signOut, getAccessToken } from '@/lib/auth'

import {
  validateQrForOperator,
  createDeliverySession,
  addDeliveryItem,
  removeDeliveryItem,
  getSessionSummary,
  confirmDelivery,
} from '@/lib/api'
import { backendApi } from '@/lib/backendApi'
import { QrScanner } from '@/components/QrScanner'

export const Route = createFileRoute('/dashboard_/operador')({
  component: OperadorDashboard,
})

type Step = 'cart' | 'scan' | 'confirm' | 'success'

interface ValidatorInfo {
  id: string
  center_id: string
  full_name: string
  centers: { name: string } | null
}

const MATERIALS_CONFIG = [
  { value: 'plastico', label: 'Plástico', emoji: '🧴',
    color: 'bg-blue-50 border-blue-200 text-blue-700',    pts: 50, co2: 1.50, trees: 0.069 },
  { value: 'papel',    label: 'Papel',    emoji: '📄',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-700', pts: 30, co2: 1.10, trees: 0.051 },
  { value: 'vidrio',   label: 'Vidrio',   emoji: '🍾',
    color: 'bg-green-50 border-green-200 text-green-700',  pts: 40, co2: 0.30, trees: 0.014 },
  { value: 'aluminio', label: 'Aluminio', emoji: '🥫',
    color: 'bg-orange-50 border-orange-200 text-orange-700', pts: 80, co2: 9.00, trees: 0.415 },
]

function OperadorDashboard() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('cart')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<any[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
  const [kgInput, setKgInput] = useState('')
  const [qrToken, setQrToken] = useState('')
  const [confirmData, setConfirmData] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validator, setValidator] = useState<ValidatorInfo | null>(null)

  // ── Inicializar sesión al montar ────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const token = getAccessToken()
      if (!token) {
        navigate({ to: '/login/operador', replace: true })
        return
      }
      let v;
      try {
        v = await backendApi.withToken(token).get<ValidatorInfo>('/api/v1/aliados/operator/me')
      } catch (e) {
        v = null
      }
      if (!v) {
        await signOut()
        navigate({ to: '/login/operador', replace: true })
        return
      }
      setValidator(v as ValidatorInfo)
      const id = await createDeliverySession(v.id, v.center_id)
      setSessionId(id)
    }
    init()
  }, [])


  // ── Logout por inactividad (5 min) ────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(async () => {
        await signOut()
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
    await signOut()
    navigate({ to: '/login/operador', replace: true })
  }

  // ── Agregar / actualizar item al carrito ──────────────────────
  const handleAddItem = async (material: string, kg: number) => {
    if (!sessionId) {
      setError('Sesión no inicializada. Recarga la página.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await addDeliveryItem(sessionId, material, kg)
      const summary = await getSessionSummary(sessionId)
      setCartItems(summary?.items ?? [])
      setSelectedMaterial(null)
      setKgInput('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Quitar item del carrito ───────────────────────────────────
  const handleRemoveItem = async (itemId: string) => {
    if (!sessionId) return
    try {
      await removeDeliveryItem(sessionId, itemId)
      const summary = await getSessionSummary(sessionId)
      setCartItems(summary?.items ?? [])
    } catch (e: any) {
      setError(e.message)
    }
  }

  // ── Validar QR escaneado ──────────────────────────────────────
  const handleScanQr = async (token: string) => {
    if (!validator || !sessionId) return
    setLoading(true)
    setError(null)
    try {
      const res = await validateQrForOperator({
        token,
        validatorId: validator.id,
        centerId:    validator.center_id,
      })
      if (!res.valid) {
        setError(res.error ?? 'QR inválido o expirado')
        return
      }
      setQrToken(token)
      setConfirmData(res)
      setStep('confirm')
    } catch {
      setError('Error al verificar el QR. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Confirmar entrega ─────────────────────────────────────────
  const handleConfirmDelivery = async () => {
    if (!sessionId || !qrToken || !validator) return
    setLoading(true)
    setError(null)
    try {
      const res = await confirmDelivery(sessionId, qrToken, validator.id)
      if (!res.success) {
        setError(res.error ?? 'Error al confirmar')
        if (res.session_preserved) setStep('scan')
        return
      }
      setResult(res)
      setStep('success')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Nueva entrega ─────────────────────────────────────────────
  const handleNewDelivery = async () => {
    if (!validator) return
    try {
      const id = await createDeliverySession(validator.id, validator.center_id)
      setSessionId(id)
      setCartItems([])
      setQrToken('')
      setConfirmData(null)
      setResult(null)
      setError(null)
      setSelectedMaterial(null)
      setKgInput('')
      setStep('cart')
    } catch (e: any) {
      setError(e.message)
    }
  }

  // Totales del carrito
  const totalKg    = cartItems.reduce((s, i) => s + (i.kg ?? 0), 0)
  const totalPts   = cartItems.reduce((s, i) => s + (i.points_to_award ?? 0), 0)
  const totalCo2   = cartItems.reduce((s, i) => s + (i.co2_saved_kg ?? 0), 0)
  const totalTrees = cartItems.reduce((s, i) => s + (i.trees_equivalent ?? 0), 0)

  // ══════════════════════════════════════════════════════════════
  // STEP 1 — CART
  // ══════════════════════════════════════════════════════════════
  if (step === 'cart') {
    return (
      <div className="flex flex-col h-screen bg-gray-50">

        {/* Header */}
        <div className="bg-white border-b px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Nueva entrega</h1>
            <p className="text-xs text-gray-500">{validator?.centers?.name ?? 'Cargando...'}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </button>
        </div>

        {/* Grid 2x2 de materiales */}
        <div className="grid grid-cols-2 gap-3 p-4 flex-shrink-0">
          {MATERIALS_CONFIG.map(m => {
            const inCart = cartItems.find(i => i.material === m.value)
            return (
              <button
                key={m.value}
                onClick={() => {
                  setSelectedMaterial(m.value)
                  setKgInput(inCart ? String(inCart.kg) : '')
                  setError(null)
                }}
                className={`rounded-2xl border-2 p-4 text-left transition-all h-28 relative ${m.color} ${
                  inCart ? 'ring-2 ring-primary ring-offset-1' : ''
                }`}
              >
                <span className="text-3xl">{m.emoji}</span>
                <p className="font-bold mt-1">{m.label}</p>
                <p className="text-xs opacity-70">{m.pts} pts/kg</p>
                {inCart && (
                  <span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {inCart.kg}kg
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Panel de peso — aparece al seleccionar material */}
        {selectedMaterial && (() => {
          const m = MATERIALS_CONFIG.find(x => x.value === selectedMaterial)!
          const kg = parseFloat(kgInput)
          const preview = kgInput && kg > 0 ? {
            pts:   Math.round(m.pts * kg),
            co2:   (m.co2 * kg).toFixed(2),
            trees: (m.trees * kg).toFixed(3),
          } : null
          return (
            <div className="mx-4 rounded-2xl bg-white border-2 border-primary/30 p-4 space-y-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-800">{m.emoji} {m.label} — Peso (kg)</p>
                <button onClick={() => { setSelectedMaterial(null); setError(null) }} className="text-gray-400 text-lg leading-none">✕</button>
              </div>

              <input
                type="number"
                inputMode="decimal"
                value={kgInput}
                onChange={e => setKgInput(e.target.value)}
                min="0.1"
                max="50"
                step="0.1"
                placeholder="0.0"
                autoFocus
                className="w-full rounded-xl border border-gray-200 px-4 py-4 text-2xl font-bold text-center outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              {preview && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <p className="text-xs text-gray-500">Puntos</p>
                    <p className="font-bold text-primary">+{preview.pts}</p>
                  </div>
                  <div className="rounded-xl bg-green-50 p-2">
                    <p className="text-xs text-gray-500">CO₂</p>
                    <p className="font-bold text-green-700">{preview.co2}kg</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-2">
                    <p className="text-xs text-gray-500">🌳</p>
                    <p className="font-bold text-emerald-700">{preview.trees}</p>
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

              <button
                onClick={() => handleAddItem(selectedMaterial, kg)}
                disabled={!kgInput || kg < 0.1 || loading}
                className="w-full rounded-xl bg-primary h-14 text-sm font-bold text-white disabled:opacity-40"
              >
                {loading ? 'Guardando...' : (
                  cartItems.find(i => i.material === selectedMaterial)
                    ? 'Actualizar' : 'Agregar al carrito'
                )}
              </button>
            </div>
          )
        })()}

        {/* Lista del carrito */}
        {cartItems.length > 0 && !selectedMaterial && (
          <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
            {cartItems.map(item => {
              const m = MATERIALS_CONFIG.find(x => x.value === item.material)!
              return (
                <div key={item.id} className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-gray-100">
                  <span className="text-2xl">{m?.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{m?.label}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.kg}kg · +{item.points_to_award}pts · 🌳{(item.trees_equivalent ?? 0).toFixed(3)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-gray-300 hover:text-red-400 text-xl leading-none"
                  >✕</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Panel inferior fijo */}
        <div className="bg-white border-t px-4 py-4 space-y-3 flex-shrink-0">
          {cartItems.length > 0 && (
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Kg total', value: totalKg.toFixed(1),   unit: 'kg'  },
                { label: 'Puntos',   value: String(totalPts),      unit: 'pts' },
                { label: 'CO₂',     value: totalCo2.toFixed(1),   unit: 'kg'  },
                { label: '🌳',       value: totalTrees.toFixed(2), unit: ''    },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl bg-gray-50 p-2">
                  <p className="text-[10px] text-gray-400">{stat.label}</p>
                  <p className="font-bold text-sm text-primary">{stat.value}{stat.unit}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-[9px] text-gray-300 text-center">
            Fuente: EPA 2020 · IPCC (21.7 kg CO₂/árbol/año)
          </p>

          <button
            onClick={() => { setStep('scan'); setError(null) }}
            disabled={cartItems.length === 0}
            className="w-full rounded-2xl bg-primary h-14 text-base font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {cartItems.length === 0
              ? 'Agrega materiales para continuar'
              : `Confirmar entrega (${cartItems.length} material${cartItems.length > 1 ? 'es' : ''})`}
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 2 — SCAN QR
  // ══════════════════════════════════════════════════════════════
  if (step === 'scan') {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between bg-white shrink-0 border-b border-gray-100">
          <div>
            <h1 className="font-bold text-lg text-gray-900">Escanear QR</h1>
            <p className="text-xs text-gray-500">{validator?.centers?.name}</p>
          </div>
          <button
            onClick={() => { setStep('cart'); setError(null) }}
            className="text-xs text-primary font-semibold"
          >
            ← Carrito ({cartItems.length})
          </button>
        </div>

        <div className="flex-1 p-4 min-h-0">
          <QrScanner
            onScan={handleScanQr}
            onError={e => setError(e)}
          />
        </div>

        {error && (
          <div className="mx-4 mb-4 rounded-2xl bg-red-50 border border-red-200 p-4 shrink-0">
            <p className="text-sm text-red-700 font-medium text-center">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 w-full text-xs text-red-500 underline text-center"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 3 — CONFIRM
  // ══════════════════════════════════════════════════════════════
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="px-5 pt-5 pb-3 bg-white border-b border-gray-100 flex-shrink-0">
          <h1 className="font-bold text-lg text-gray-900">Confirmar entrega</h1>
          <p className="text-xs text-gray-500">{validator?.centers?.name}</p>
        </div>

        <div className="flex-1 p-5 space-y-5 overflow-y-auto">
          {/* Identidad del estudiante */}
          <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-green-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold shrink-0">
              {confirmData?.full_name?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-lg truncate">{confirmData?.full_name}</p>
              <p className="text-xs text-gray-400 font-mono truncate">{confirmData?.qr_code}</p>
              <p className="text-sm text-primary font-semibold mt-1">
                {confirmData?.points?.toLocaleString()} EcoPuntos actuales
              </p>
            </div>
            <CheckCircle2 className="h-7 w-7 text-green-500 shrink-0" />
          </div>

          {/* Resumen de materiales */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-700">Materiales a registrar</p>
            {cartItems.map(item => {
              const m = MATERIALS_CONFIG.find(x => x.value === item.material)!
              return (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{m?.emoji} {m?.label} — {item.kg}kg</span>
                  <span className="font-bold text-primary">+{item.points_to_award}pts</span>
                </div>
              )
            })}
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">Total puntos</span>
              <span className="text-xl font-extrabold text-primary">+{totalPts}</span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium text-center">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setStep('scan'); setConfirmData(null); setError(null) }}
              className="h-14 rounded-xl border-2 border-gray-200 text-base font-semibold text-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelivery}
              disabled={loading}
              className="h-14 rounded-xl bg-primary text-base font-bold text-white disabled:opacity-40"
            >
              {loading ? 'Confirmando...' : 'Confirmar ✓'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 4 — SUCCESS
  // ══════════════════════════════════════════════════════════════
  const treesVal = result?.total_trees ?? totalTrees
  const phrase =
    treesVal >= 1
      ? `¡Salvaste ${treesVal.toFixed(1)} árboles hoy! 🌳`
      : treesVal >= 0.1
      ? `¡Contribuiste al equivalente de ${(treesVal * 100).toFixed(0)}% de un árbol! 🌱`
      : '¡Cada kilo cuenta para el planeta! ♻️'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 p-6 flex flex-col items-center space-y-5 overflow-y-auto">

        <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-900">¡Entrega registrada!</h2>
          <p className="text-base text-gray-700 font-semibold mt-1">{confirmData?.full_name}</p>
          <p className="text-sm text-primary font-medium mt-2">{phrase}</p>
        </div>

        {/* Resumen de impacto */}
        <div className="w-full grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Kg total', value: (result?.total_kg ?? totalKg).toFixed(1),       unit: 'kg'  },
            { label: 'Puntos',   value: String(result?.total_points ?? totalPts),        unit: 'pts' },
            { label: 'CO₂',     value: (result?.total_co2 ?? totalCo2).toFixed(1),      unit: 'kg'  },
            { label: '🌳 Árb.',  value: (result?.total_trees ?? totalTrees).toFixed(2),  unit: ''    },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white border border-gray-100 p-3">
              <p className="text-[10px] text-gray-400">{s.label}</p>
              <p className="font-extrabold text-sm text-primary">{s.value}{s.unit}</p>
            </div>
          ))}
        </div>

        {/* Detalle de materiales */}
        <div className="w-full bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
          {cartItems.map(item => {
            const m = MATERIALS_CONFIG.find(x => x.value === item.material)!
            return (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">{m?.emoji} {m?.label} · {item.kg}kg</span>
                <div className="text-right">
                  <p className="font-bold text-primary">+{item.points_to_award}pts</p>
                  <p className="text-xs text-green-600">{(item.co2_saved_kg ?? 0).toFixed(2)}kg CO₂</p>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-[9px] text-gray-300 text-center">
          Fuente: EPA 2020 · IPCC (21.7 kg CO₂/árbol/año)
        </p>

        <button
          onClick={handleNewDelivery}
          className="w-full h-14 rounded-2xl bg-primary text-base font-bold text-white"
        >
          Nueva entrega
        </button>
      </div>
    </div>
  )
}
