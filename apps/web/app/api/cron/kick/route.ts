import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'

export async function POST() {
  const connection = new IORedis(process.env.REDIS_URL!)
  const queue = new Queue('site-checks', { connection })
  await queue.add('kick', { all: true }, { removeOnComplete: true, removeOnFail: true })
  await queue.close()
  await connection.quit()
  return NextResponse.json({ ok: true })
}
