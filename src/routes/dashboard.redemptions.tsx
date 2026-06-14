import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Search, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { validateCoupon, redeemCoupon, type CouponValidateResponse } from "@/lib/api"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const Route = createFileRoute("/dashboard/redemptions")({
  component: RedemptionsPage,
})

function RedemptionsPage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [coupon, setCoupon] = useState<CouponValidateResponse | null>(null)
  const [redeeming, setRedeeming] = useState(false)

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError(null)
    setSuccess(null)
    setCoupon(null)

    try {
      const data = await validateCoupon(code.trim())
      setCoupon(data)
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError("Error al consultar el cupón. Intenta nuevamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!coupon) return

    setRedeeming(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await redeemCoupon(coupon.redemption_id)
      setSuccess(res.message || "Canje registrado correctamente.")
      // Actualizar el estado localmente para reflejar el cambio
      setCoupon({ ...coupon, status: "redeemed" })
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError("Error al registrar el canje.")
      }
    } finally {
      setRedeeming(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200">
            <Clock className="w-4 h-4" /> Disponible
          </span>
        )
      case "redeemed":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" /> Canjeado
          </span>
        )
      case "expired":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-semibold border border-red-200">
            <XCircle className="w-4 h-4" /> Expirado
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-gray-700 text-sm font-semibold border border-gray-200">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Canjear Cupón</h1>
        <p className="text-muted-foreground mt-2">
          Ingresa el código proporcionado por el estudiante para confirmar la entrega del producto.
        </p>
      </div>

      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej. ABC123XYZ"
              className="pl-11 h-12 text-lg font-mono uppercase"
              disabled={loading || redeeming}
            />
          </div>
          <Button type="submit" className="h-12 px-6" disabled={!code.trim() || loading || redeeming}>
            {loading ? "Buscando..." : "Buscar código"}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-3 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm">{success}</p>
          </div>
        )}
      </div>

      {coupon && (
        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(coupon.status)}
                  <span className="text-sm font-mono bg-muted px-3 py-1 rounded-lg text-muted-foreground border">
                    {coupon.redemption_code}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground">{coupon.product_name}</h2>
                  <p className="text-base text-muted-foreground mt-1">por {coupon.partner_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Costo</p>
                    <p className="text-lg font-bold text-primary mt-1">{coupon.points_spent} pts</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Expira</p>
                    <p className="text-base font-semibold text-foreground mt-1">
                      {coupon.expires_at
                        ? format(new Date(coupon.expires_at), "dd MMM yyyy", { locale: es })
                        : "Sin fecha"}
                    </p>
                  </div>
                </div>
              </div>

              {coupon.status === "pending" && (
                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex flex-col items-center justify-center min-w-[280px]">
                  <p className="text-sm text-center text-primary-dark font-medium mb-4">
                    Cupón disponible para canje.
                    <br /> Confirma la entrega del producto.
                  </p>
                  <Button
                    onClick={handleRedeem}
                    disabled={redeeming}
                    className="w-full h-12 text-base font-bold shadow-md"
                    size="lg"
                  >
                    {redeeming ? "Confirmando..." : "Confirmar canje"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
