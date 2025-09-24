import { NextResponse } from 'next/server'
import { Queue } from 'bullmq'

export async function POST() {
  const queue = new Queue('site-checks', { connection: { url: process.env.REDIS_URL! } })
  await queue.add('kick', { all: true }, { removeOnComplete: true, removeOnFail: true })
  await queue.close()
  return NextResponse.json({ ok: true })
}

