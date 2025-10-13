import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { prisma } from '@nsm/db'

export async function POST() {
  // Optionally secure this endpoint to logged-in users (or keep public for Vercel Cron, then remove checks below)
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const connection = new IORedis(process.env.REDIS_URL!)
  const queue = new Queue('site-checks', { connection })
  await queue.add('kick', { all: true }, { removeOnComplete: true, removeOnFail: true })
  await queue.close()
  await connection.quit()
  return NextResponse.json({ ok: true })
}
