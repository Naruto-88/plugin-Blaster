type PlanKey = 'free' | 'starter' | 'pro' | 'enterprise'

const API_BASE = () => (process.env.PAYPAL_ENV === 'live' || process.env.PAYPAL_MODE === 'live')
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

// Workaround to include Basic auth: custom fetch wrapper
async function fetchPayPal(path: string, init: RequestInit = {}) {
  const client = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!client || !secret) throw new Error('PAYPAL credentials missing')
  const url = `${API_BASE()}${path}`
  const headers = new Headers(init.headers || {})
  if (path.startsWith('/v1/oauth2/token')) {
    headers.set('Authorization', 'Basic ' + Buffer.from(`${client}:${secret}`).toString('base64'))
  }
  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const text = await res.text().catch(()=> '')
    throw new Error(`PayPal API error ${res.status} ${path}: ${text}`)
  }
  return res
}

export async function paypalAccessToken() {
  const res = await fetchPayPal('/v1/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  })
  const json = await res.json() as { access_token: string }
  return json.access_token
}

export function planIdFromKey(plan: PlanKey): string | undefined {
  const map: Record<PlanKey, string | undefined> = {
    free: process.env.PAYPAL_PLAN_FREE,
    starter: process.env.PAYPAL_PLAN_STARTER,
    pro: process.env.PAYPAL_PLAN_PRO,
    enterprise: process.env.PAYPAL_PLAN_ENTERPRISE,
  }
  return map[plan]
}

export function planKeyFromPlanId(planId: string): PlanKey | null {
  if (planId === process.env.PAYPAL_PLAN_STARTER) return 'starter'
  if (planId === process.env.PAYPAL_PLAN_PRO) return 'pro'
  if (planId === process.env.PAYPAL_PLAN_ENTERPRISE) return 'enterprise'
  if (planId === process.env.PAYPAL_PLAN_FREE) return 'free'
  return null
}

export async function createSubscription(planId: string, accountId: string) {
  const token = await paypalAccessToken()
  const brand = process.env.NEXT_PUBLIC_APP_NAME || 'WP Update Monitor'
  const origin = process.env.WEB_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${API_BASE()}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: accountId,
      application_context: {
        brand_name: brand,
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${origin}/settings/billing?paypal=success`,
        cancel_url: `${origin}/settings/billing?paypal=cancel`,
      }
    })
  })
  if (!res.ok) {
    const txt = await res.text().catch(()=> '')
    throw new Error(`PayPal create subscription failed: ${txt}`)
  }
  const json = await res.json() as any
  const approve = (json.links || []).find((l: any) => l.rel === 'approve')?.href
  return { id: json.id as string, approveUrl: approve as string | undefined }
}

export async function cancelSubscription(subId: string, reason = 'User requested cancellation') {
  const token = await paypalAccessToken()
  const res = await fetch(`${API_BASE()}/v1/billing/subscriptions/${subId}/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  })
  if (!res.ok) {
    const txt = await res.text().catch(()=> '')
    throw new Error(`PayPal cancel failed: ${txt}`)
  }
}

export async function verifyWebhookSignature(opts: {
  transmissionId: string
  timestamp: string
  signature: string
  certUrl: string
  authAlgo: string
  webhookId: string
  body: string
}) {
  const token = await paypalAccessToken()
  const res = await fetch(`${API_BASE()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transmission_id: opts.transmissionId,
      transmission_time: opts.timestamp,
      cert_url: opts.certUrl,
      auth_algo: opts.authAlgo,
      transmission_sig: opts.signature,
      webhook_id: opts.webhookId,
      webhook_event: JSON.parse(opts.body)
    })
  })
  const json = await res.json() as any
  return json.verification_status === 'SUCCESS'
}
