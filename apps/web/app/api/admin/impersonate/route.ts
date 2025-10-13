import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { prisma } from '@nsm/db'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session as any)?.user?.role
  if (!session || role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { accountId } = await req.json().catch(()=> ({}))
  if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 })
  const acc = await prisma.account.findUnique({ where: { id: accountId } })
  if (!acc) return NextResponse.json({ error: 'not found' }, { status: 404 })
  cookies().set('impersonateAccountId', accountId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60*60*24 })
  return NextResponse.json({ ok: true })
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

