import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, planKeyFromPlanId } from '@/server/paypal'
import { prisma } from '@nsm/db'
import { applyPlanDefaults } from '@/server/plan'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headers = req.headers
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) return NextResponse.json({ error: 'not configured' }, { status: 400 })

  const valid = await verifyWebhookSignature({
    transmissionId: headers.get('paypal-transmission-id') || '',
    timestamp: headers.get('paypal-transmission-time') || '',
    signature: headers.get('paypal-transmission-sig') || '',
    certUrl: headers.get('paypal-cert-url') || '',
    authAlgo: headers.get('paypal-auth-algo') || '',
    webhookId,
    body,
  }).catch(() => false)
  if (!valid) return NextResponse.json({ error: 'invalid signature' }, { status: 400 })

  const event = JSON.parse(body)
  const type = event?.event_type as string
  if (type === 'BILLING.SUBSCRIPTION.ACTIVATED' || type === 'BILLING.SUBSCRIPTION.UPDATED') {
    const resource = event.resource
    const planId = resource?.plan_id as string | undefined
    const accountId = (resource?.custom_id as string | undefined) || undefined
    const plan = planId ? planKeyFromPlanId(planId) : null
    if (accountId) {
      const setPlan = plan ? { plan: plan as any, ...applyPlanDefaults(plan) } : {}
      await prisma.account.update({ where: { id: accountId }, data: { ...setPlan, paypalSubscriptionId: resource?.id || undefined } })
    }
  }

  return NextResponse.json({ received: true })
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
