import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'

export async function POST(req: NextRequest) {
  const { siteId } = await req.json()
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  const connection = new IORedis(process.env.REDIS_URL!)
  const queue = new Queue('site-checks', { connection })
  await queue.add('checkSite', { siteId }, { removeOnComplete: true, removeOnFail: true })
  await queue.close()
  await connection.quit()
  return NextResponse.json({ ok: true })
}
