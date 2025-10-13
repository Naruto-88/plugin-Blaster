import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { prisma } from '@nsm/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const membership = await prisma.membership.findFirst({ where: { userId: user.id } })
  if (!membership) return NextResponse.json({ error: 'no_account' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const plan: 'free'|'starter'|'pro'|'enterprise' = body.plan || 'starter'

  const priceMap: Record<string, string | undefined> = {
    free: process.env.STRIPE_PRICE_FREE,
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  }
  const priceId = priceMap[plan]
  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  const origin = process.env.WEB_BASE_URL || req.headers.get('origin') || 'http://localhost:3000'
  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings/billing?success=1`,
    cancel_url: `${origin}/settings/billing?canceled=1`,
    client_reference_id: membership.accountId,
    metadata: { accountId: membership.accountId, plan },
  })

  return NextResponse.json({ url: checkout.url })
}

