import { useEffect, useRef, useState } from 'react'
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import { Flashlight, FlipHorizontal, X } from 'lucide-react'

interface QrScannerProps {
  onScan: (token: string) => void
  onError?: (error: string) => void
  onClose?: () => void
}

type CameraState = 'requesting' | 'active' | 'denied' | 'unavailable' | 'error'

export function QrScanner({ onScan, onError, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [cameraState, setCameraState] = useState<CameraState>('requesting')
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [scanned, setScanned] = useState(false)
  const [torchOn, setTorchOn] = useState(false)

  useEffect(() => {
    let active = true

    const initCamera = async () => {
      // Escenario 1: browser no soporta getUserMedia
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('unavailable')
        onError?.('Cámara no disponible en este dispositivo')
        return
      }

      // Timeout de seguridad: 8 segundos
      const timeout = setTimeout(() => {
        if (active) {
          setCameraState('error')
        }
      }, 8000)

      try {
        // Pedir permiso explícito primero
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode }
        })
        // Detener el stream de prueba inmediatamente
        stream.getTracks().forEach(t => t.stop())

        clearTimeout(timeout)
        if (!active) return
        setCameraState('active')

        // Iniciar lector QR real
        const reader = new BrowserQRCodeReader()
        const devices = await BrowserQRCodeReader.listVideoInputDevices()
        if (!devices.length) {
          setCameraState('unavailable')
          return
        }

        const deviceId =
          facingMode === 'environment'
            ? devices[devices.length - 1].deviceId
            : devices[0].deviceId

        controlsRef.current = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result) => {
            if (!active || scanned) return
            if (result) {
              setScanned(true)
              if (navigator.vibrate) navigator.vibrate(200)
              onScan(result.getText())
            }
          }
        )
      } catch (err: any) {
        clearTimeout(timeout)
        if (!active) return

        if (
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError'
        ) {
          setCameraState('denied')
        } else if (
          err.name === 'NotFoundError' ||
          err.name === 'DevicesNotFoundError'
        ) {
          setCameraState('unavailable')
        } else {
          setCameraState('error')
        }
        onError?.(err.message ?? 'Error de cámara')
      }
    }

    initCamera()
    return () => {
      active = false
      controlsRef.current?.stop()
    }
  }, [facingMode])

  // ── REQUESTING — esperando permiso ───────────────────────────
  if (cameraState === 'requesting') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 rounded-2xl bg-gray-900 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-sm font-medium">Solicitando acceso a cámara...</p>
        <p className="text-xs text-white/50">Acepta el permiso en tu navegador</p>
      </div>
    )
  }

  // ── DENIED — usuario rechazó el permiso ──────────────────────
  if (cameraState === 'denied') {
    return (
      <div className="rounded-2xl bg-orange-50 border-2 border-orange-200 p-6 text-center space-y-3">
        <p className="text-3xl">📵</p>
        <p className="font-semibold text-orange-800">Cámara bloqueada</p>
        <p className="text-sm text-orange-600">
          Debes permitir el acceso a la cámara en la configuración de tu
          navegador para escanear QR.
        </p>
        <p className="text-xs text-orange-500">O ingresa el código manualmente:</p>
        <ManualInput onScan={onScan} />
      </div>
    )
  }

  // ── UNAVAILABLE — no hay cámara en el dispositivo ────────────
  if (cameraState === 'unavailable') {
    return (
      <div className="rounded-2xl bg-gray-50 border-2 border-gray-200 p-6 text-center space-y-3">
        <p className="text-3xl">📷</p>
        <p className="font-semibold text-gray-700">Cámara no disponible</p>
        <p className="text-sm text-gray-500">
          Este dispositivo no tiene cámara o no es accesible. Ingresa el
          código manualmente:
        </p>
        <ManualInput onScan={onScan} />
      </div>
    )
  }

  // ── ERROR — error inesperado o timeout ───────────────────────
  if (cameraState === 'error') {
    return (
      <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-6 text-center space-y-3">
        <p className="text-3xl">⚠️</p>
        <p className="font-semibold text-red-700">Error al iniciar la cámara</p>
        <button
          onClick={() => {
            setScanned(false)
            setCameraState('requesting')
          }}
          className="rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
        >
          Reintentar
        </button>
        <p className="text-xs text-red-400">O ingresa el código:</p>
        <ManualInput onScan={onScan} />
      </div>
    )
  }

  // ── ACTIVE — cámara funcionando ──────────────────────────────
  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-2xl">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay oscuro con recorte central */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(black, black) top/100% 20% no-repeat,
            linear-gradient(black, black) bottom/100% 20% no-repeat,
            linear-gradient(black, black) left/15% 100% no-repeat,
            linear-gradient(black, black) right/15% 100% no-repeat
          `,
          opacity: 0.6,
        }}
      />

      {/* Marco guía */}
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                    h-56 w-56 rounded-2xl border-4 transition-colors duration-300 ${
                      scanned ? 'border-green-400 animate-pulse' : 'border-white'
                    }`}
      >
        {(['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'] as const).map(
          pos => (
            <div
              key={pos}
              className={`absolute ${pos} h-6 w-6 border-4 border-primary rounded-sm`}
            />
          )
        )}
      </div>

      <p className="absolute bottom-28 left-0 right-0 text-center text-sm font-medium text-white/80">
        {scanned ? '✓ QR detectado' : 'Apunta al código QR del estudiante'}
      </p>

      {/* Controles */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <button
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setFacingMode(f => (f === 'environment' ? 'user' : 'environment'))
            }
            className="h-10 w-10 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur"
          >
            <FlipHorizontal className="h-5 w-5" />
          </button>
          <button
            onClick={() => setTorchOn(v => !v)}
            className={`h-10 w-10 rounded-full flex items-center justify-center backdrop-blur ${
              torchOn ? 'bg-accent text-black' : 'bg-black/40 text-white'
            }`}
          >
            <Flashlight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ManualInput({ onScan }: { onScan: (t: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="space-y-2 mt-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value.trim())}
        placeholder="Pega el código aquí..."
        autoFocus
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-mono text-center outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <button
        onClick={() => value && onScan(value)}
        disabled={!value}
        className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-40"
      >
        Verificar código
      </button>
    </div>
  )
}
