import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { prisma } from '@nsm/db'

export async function POST(req: NextRequest) {
  const { siteId } = await req.json()
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  // Ensure the requesting user owns this site via membership
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const membership = await prisma.membership.findFirst({ where: { userId: user.id } })
  const site = await prisma.site.findFirst({ where: { id: siteId, accountId: membership?.accountId || '' } })
  if (!site) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const connection = new IORedis(process.env.REDIS_URL!)
  const queue = new Queue('site-checks', { connection })
  await queue.add('checkSite', { siteId }, { removeOnComplete: true, removeOnFail: true })
  await queue.close()
  await connection.quit()
  return NextResponse.json({ ok: true })
}
