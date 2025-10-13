import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nsm/db'
import { scryptSync, randomBytes } from 'crypto'
import { applyPlanDefaults } from '@/server/plan'

export async function POST(req: NextRequest) {
  try {
    const { email, password, plan } = await req.json().catch(()=> ({})) as { email?: string; password?: string; plan?: 'free'|'starter'|'pro'|'enterprise' }
    if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 })
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'email already registered' }, { status: 400 })

    const salt = randomBytes(16)
    const hash = scryptSync(password, salt, 64)
    const passwordHash = `${salt.toString('hex')}.${hash.toString('hex')}`
    const user = await prisma.user.create({ data: { email, passwordHash, role: 'viewer' } })

    let account: any
    if (plan === 'free') {
      const defaults = applyPlanDefaults('free')
      account = await prisma.account.create({ data: { name: `Personal - ${email}`, plan: 'free' as any, ...defaults } })
    } else {
      const trialDays = 7
      const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
      const defaults = applyPlanDefaults('trial')
      account = await prisma.account.create({ data: { name: `Personal - ${email}`, plan: 'trial' as any, trialEndsAt, ...defaults } })
    }
    await prisma.membership.create({ data: { accountId: account.id, userId: user.id, role: 'owner' } })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Register error:', e)
    return NextResponse.json({ error: e?.message || 'internal error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
