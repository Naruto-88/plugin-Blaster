import { NextRequest, NextResponse } from 'next/server'
import { Queue } from 'bullmq'

export async function POST(req: NextRequest) {
  const { siteId } = await req.json()
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  const queue = new Queue('site-checks', { connection: { url: process.env.REDIS_URL! } })
  await queue.add('checkSite', { siteId }, { removeOnComplete: true, removeOnFail: true })
  await queue.close()
  return NextResponse.json({ ok: true })
}

