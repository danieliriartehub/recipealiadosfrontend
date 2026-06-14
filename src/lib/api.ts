import { getAccessToken } from './auth'
import { backendApi } from './backendApi'

// ─── Helper: obtener token activo ─────────────────────────────────────────────
// Usa el access_token en memoria (nunca localStorage). Si no existe, el usuario
// no está autenticado — el MerchantAuthProvider debería haberlo redirigido.

function getToken(): string {
  const token = getAccessToken()
  if (!token) throw new Error('No autenticado')
  return token
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface MerchantProduct {
  id: string
  merchant_partner_id: string
  name: string
  description: string | null
  points: number
  stock: number | null
  image_url: string | null
  category: string | null
  is_active: boolean
  created_at: string
}

// ─── Merchant Products ──────────────────────────────────────────────────────

export async function getMerchantProducts(merchantPartnerId: string) {
  const token = await getToken()
  return backendApi.withToken(token).get<MerchantProduct[]>(`/api/v1/aliados/products/${merchantPartnerId}`)
}

export async function addMerchantProduct(data: Omit<MerchantProduct, 'id' | 'created_at'>) {
  const token = await getToken()
  return backendApi.withToken(token).post<MerchantProduct>('/api/v1/aliados/products', data)
}

export async function updateMerchantProduct(
  id: string,
  data: Partial<Omit<MerchantProduct, 'id' | 'created_at'>>,
) {
  const token = await getToken()
  return backendApi.withToken(token).patch<MerchantProduct>(`/api/v1/aliados/products/${id}`, data)
}

export async function removeMerchantProduct(id: string) {
  const token = await getToken()
  return backendApi.withToken(token).delete<void>(`/api/v1/aliados/products/${id}`)
}

export async function updateMerchantPartner(
  data: Record<string, unknown>,
) {
  const token = await getToken()
  return backendApi.withToken(token).patch<unknown>(`/api/v1/aliados/partner/me`, data)
}

export async function getMerchantMe() {
  const token = await getToken()
  return backendApi.withToken(token).get<any>('/api/v1/aliados/me')
}

// ── Operador / Validador ──────────────────────────────────────────

export async function validateQrForOperator(params: {
  token: string
  validatorId: string
  centerId: string
}) {
  const token = await getToken()
  return backendApi.withToken(token).post<{
    valid: boolean
    error?: string
    user_id?: string
    full_name?: string
    qr_code?: string
    points?: number
    center_id?: string
    validated_at?: string
  }>('/api/v1/aliados/operator/validate-qr', {
    token: params.token,
    validator_id: params.validatorId,
    center_id: params.centerId,
  })
}

// ── Sesión de entrega (SCRUM-92 / SCRUM-89 / SCRUM-90) ───────────

export async function createDeliverySession(
  operatorId: string,
  centerId: string,
) {
  const token = await getToken()
  const result = await backendApi.withToken(token).post<{ session_id: string }>('/api/v1/aliados/operator/delivery-session', {
    operator_id: operatorId,
    center_id: centerId,
  })
  return result.session_id
}

export async function addDeliveryItem(
  sessionId: string,
  material: string,
  kg: number,
) {
  const token = await getToken()
  return backendApi.withToken(token).post<unknown>('/api/v1/aliados/operator/delivery-session/item', {
    session_id: sessionId,
    material: material,
    kg: kg,
  })
}

export async function removeDeliveryItem(sessionId: string, itemId: string) {
  const token = getToken()
  return backendApi.withToken(token).post<unknown>('/api/v1/aliados/operator/delivery-session/item/remove', {
    session_id: sessionId,
    item_id: itemId,
  })
}


export async function getSessionSummary(sessionId: string) {
  const token = await getToken()
  return backendApi.withToken(token).get<unknown>(`/api/v1/aliados/operator/delivery-session/${sessionId}/summary`)
}

export async function confirmDelivery(
  sessionId: string,
  qrToken: string,
  validatorId: string,
) {
  const token = await getToken()
  return backendApi.withToken(token).post<{
    success: boolean
    error?: string
    session_preserved?: boolean
    full_name?: string
    total_kg?: number
    total_points?: number
    total_co2?: number
    total_trees?: number
  }>('/api/v1/aliados/operator/confirm-delivery', {
    session_id: sessionId,
    qr_token: qrToken,
    validator_id: validatorId,
  })
}

// ─────────────────────────────────────────────────────────────────

export async function registerRecyclingDelivery(params: {
  token: string
  validatorId: string
  centerId: string
  material: string
  kg: number
}) {
  const token = await getToken()
  return backendApi.withToken(token).post<{
    success: boolean
    error?: string
    recycling_id?: string
    full_name?: string
    material?: string
    kg?: number
    points_earned?: number
    co2_saved_kg?: number
    new_balance?: number
    registered_at?: string
  }>('/api/v1/aliados/operator/register-recycling', {
    token: params.token,
    validator_id: params.validatorId,
    center_id: params.centerId,
    material: params.material,
    kg: params.kg,
  })
}

// ── Cupones (Operador de Aliado) ──────────────────────────────────

export interface CouponValidateResponse {
  redemption_id: string
  product_id: string
  product_name: string
  partner_name: string
  points_spent: number
  redemption_code: string
  status: string
  expires_at: string | null
}

export async function validateCoupon(code: string) {
  const token = await getToken()
  return backendApi.withToken(token).get<CouponValidateResponse>(`/api/v1/coupons/validate/${code}`)
}

export async function redeemCoupon(redemptionId: string) {
  const token = await getToken()
  return backendApi.withToken(token).post<{ success: boolean; message: string }>('/api/v1/coupons/redeem', {
    redemption_id: redemptionId,
  })
}

