import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { prisma } from '@nsm/db'
import { createSubscription, planIdFromKey } from '@/server/paypal'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const membership = await prisma.membership.findFirst({ where: { userId: user.id } })
  if (!membership) return NextResponse.json({ error: 'no_account' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const plan = (body.plan || 'starter') as 'free'|'starter'|'pro'|'enterprise'
  const planId = planIdFromKey(plan)
  if (!planId) return NextResponse.json({ error: 'plan not configured' }, { status: 400 })

  try {
    const sub = await createSubscription(planId, membership.accountId)
    if (!sub.approveUrl) return NextResponse.json({ error: 'no approval url' }, { status: 500 })
    return NextResponse.json({ url: sub.approveUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'create failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

