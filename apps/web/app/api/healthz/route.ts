import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() })
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

