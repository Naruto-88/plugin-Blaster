import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { cookies } from 'next/headers'

export async function POST() {
  const session = await getServerSession(authOptions)
  const role = (session as any)?.user?.role
  if (!session || role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  cookies().delete('impersonateAccountId')
  return NextResponse.json({ ok: true })
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

