import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@nsm/db'
import { applyPlanDefaults } from '@/server/plan'

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !sig) {
    return NextResponse.json({ error: 'not configured' }, { status: 400 })
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    return NextResponse.json({ error: `invalid signature: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const accountId = (session.metadata?.accountId || session.client_reference_id) as string | undefined
    const plan = (session.metadata?.plan as 'free'|'starter'|'pro'|'enterprise' | undefined) || 'starter'
    if (accountId) {
      const data = applyPlanDefaults(plan)
      await prisma.account.update({ where: { id: accountId }, data: { plan: plan as any, ...data } })
    }
  }

  return NextResponse.json({ received: true })
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

