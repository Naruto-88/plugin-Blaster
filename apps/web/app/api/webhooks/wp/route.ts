import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@nsm/db'
import { decrypt, hmacSHA256Base64, WpSnapshot, rateLimit } from '@nsm/core'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('x-nsm-signature')
  const siteUrl = req.headers.get('x-nsm-site')
  if (!sig || !siteUrl) return NextResponse.json({ error: 'Missing signature or site' }, { status: 400 })

  // Basic per-origin rate limit using settings value (webhook.ratePerMinute)
  const setting = await prisma.setting.findUnique({ where: { key: 'webhook.ratePerMinute' } })
  const maxRate = Number(setting?.value ?? 60)
  const okRate = rateLimit(`wh:${siteUrl}`, maxRate)
  if (!okRate) return NextResponse.json({ error: 'Rate limit' }, { status: 429 })

  const site = await prisma.site.findFirst({ where: { url: siteUrl } })
  if (!site?.webhookSecretEnc) return NextResponse.json({ error: 'Site not configured' }, { status: 404 })
  const secret = await decrypt(site.webhookSecretEnc)
  const expected = hmacSHA256Base64(secret, body)
  if (sig !== expected) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

  const snapshot = JSON.parse(body) as WpSnapshot

  const check = await prisma.check.create({ data: { siteId: site.id, ok: true, startedAt: new Date(), finishedAt: new Date() } })
  await prisma.coreStatus.create({
    data: {
      checkId: check.id,
      currentVersion: snapshot.core.currentVersion,
      latestVersion: snapshot.core.latestVersion,
      updateAvailable: snapshot.core.updateAvailable,
      security: snapshot.core.security,
    }
  })
  await prisma.$transaction(snapshot.plugins.map(p => prisma.pluginStatus.create({
    data: {
      checkId: check.id,
      slug: p.slug,
      name: p.name,
      currentVersion: p.currentVersion,
      latestVersion: p.latestVersion,
      updateAvailable: p.updateAvailable,
      security: p.security,
      hasChangelog: !!p.hasChangelog,
      changelogUrl: p.changelogUrl || null,
    }
  })))

  const hasAnyUpdate = snapshot.core.updateAvailable || snapshot.plugins.some(p => p.updateAvailable)
  const hasSecurityUpdate = snapshot.core.security || snapshot.plugins.some(p => p.security)
  const hasChangelog = snapshot.core.updateAvailable || snapshot.plugins.some(p => p.hasChangelog)

  await prisma.site.update({ where: { id: site.id }, data: {
    lastCheckedAt: new Date(),
    status: 'ok',
    hasAnyUpdate,
    hasSecurityUpdate,
    hasChangelog
  }})

  return NextResponse.json({ ok: true })
}
