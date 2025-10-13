import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const { email, plan, notes } = await req.json().catch(()=> ({})) as { email?: string; plan?: string; notes?: string }
  if (!email || !plan) return NextResponse.json({ error: 'email and plan required' }, { status: 400 })
  const to = process.env.RECEIPTS_EMAIL
  if (!to || !process.env.SMTP_HOST) return NextResponse.json({ error: 'email not configured' }, { status: 500 })
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    } as any)
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || to,
      to,
      subject: `Manual payment request - ${plan}`,
      text: `Manual payment submitted\nEmail: ${email}\nPlan: ${plan}\nNotes: ${notes || ''}`,
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'send failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

