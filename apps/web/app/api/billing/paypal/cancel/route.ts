import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { prisma } from '@nsm/db'
import { cancelSubscription } from '@/server/paypal'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const membership = await prisma.membership.findFirst({ where: { userId: user.id } })
  if (!membership) return NextResponse.json({ error: 'no_account' }, { status: 400 })
  const account = await prisma.account.findUnique({ where: { id: membership.accountId } })
  if (!account?.paypalSubscriptionId) return NextResponse.json({ error: 'no_active_subscription' }, { status: 400 })
  try {
    await cancelSubscription(account.paypalSubscriptionId, 'User requested cancellation')
    await prisma.account.update({ where: { id: account.id }, data: { plan: 'free' as any, paypalSubscriptionId: null } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'cancel failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

