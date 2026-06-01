import { supabase } from './supabase'

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

export async function getMerchantProducts(merchantPartnerId: string) {
  return supabase
    .from('merchant_products')
    .select('*')
    .eq('merchant_partner_id', merchantPartnerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
}

export async function addMerchantProduct(data: Omit<MerchantProduct, 'id' | 'created_at'>) {
  return supabase.from('merchant_products').insert(data).select().single()
}

export async function updateMerchantProduct(
  id: string,
  data: Partial<Omit<MerchantProduct, 'id' | 'created_at'>>,
) {
  return supabase.from('merchant_products').update(data).eq('id', id)
}

export async function removeMerchantProduct(id: string) {
  return supabase.from('merchant_products').update({ is_active: false }).eq('id', id)
}

export async function updateMerchantPartner(
  id: string,
  data: Record<string, unknown>,
) {
  return supabase.from('merchant_partners').update(data).eq('id', id)
}

// ── Operador / Validador ──────────────────────────────────────────

export async function validateQrForOperator(params: {
  token: string
  validatorId: string
  centerId: string
}) {
  const { data, error } = await supabase.rpc('validate_qr_for_operator', {
    p_token:        params.token,
    p_validator_id: params.validatorId,
    p_center_id:    params.centerId,
  })
  if (error) throw error
  return data as {
    valid: boolean
    error?: string
    user_id?: string
    full_name?: string
    qr_code?: string
    points?: number
    center_id?: string
    validated_at?: string
  }
}

// ── Sesión de entrega (SCRUM-92 / SCRUM-89 / SCRUM-90) ───────────

export async function createDeliverySession(
  operatorId: string,
  centerId: string,
) {
  const { data, error } = await supabase.rpc('create_delivery_session', {
    p_operator_id: operatorId,
    p_center_id:   centerId,
  })
  if (error) throw error
  return data as string // session_id
}

export async function addDeliveryItem(
  sessionId: string,
  material: string,
  kg: number,
) {
  const { data, error } = await supabase.rpc('add_delivery_item', {
    p_session_id: sessionId,
    p_material:   material,
    p_kg:         kg,
  })
  if (error) throw error
  return data
}

export async function removeDeliveryItem(sessionId: string, itemId: string) {
  const { data, error } = await supabase.rpc('remove_delivery_item', {
    p_session_id: sessionId,
    p_item_id:    itemId,
  })
  if (error) throw error
  return data
}

export async function getSessionSummary(sessionId: string) {
  const { data, error } = await supabase.rpc('get_session_summary', {
    p_session_id: sessionId,
  })
  if (error) throw error
  return data
}

export async function confirmDelivery(
  sessionId: string,
  qrToken: string,
  validatorId: string,
) {
  const { data, error } = await supabase.rpc('confirm_delivery', {
    p_session_id:   sessionId,
    p_qr_token:     qrToken,
    p_validator_id: validatorId,
  })
  if (error) throw error
  return data as {
    success: boolean
    error?: string
    session_preserved?: boolean
    full_name?: string
    total_kg?: number
    total_points?: number
    total_co2?: number
    total_trees?: number
  }
}

// ─────────────────────────────────────────────────────────────────

export async function registerRecyclingDelivery(params: {
  token: string
  validatorId: string
  centerId: string
  material: string
  kg: number
}) {
  const { data, error } = await supabase.rpc('register_recycling_delivery', {
    p_token:        params.token,
    p_validator_id: params.validatorId,
    p_center_id:    params.centerId,
    p_material:     params.material,
    p_kg:           params.kg,
  })
  if (error) throw error
  return data as {
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
  }
}
