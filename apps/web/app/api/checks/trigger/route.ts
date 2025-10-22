import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { prisma } from '@nsm/db'
import { decrypt } from '@nsm/core'

async function refreshStatusForSite(site: any) {
  try {
    let headers: Record<string,string> = {}
    if (site.authType === 'bearer_token' && site.bearerTokenEnc) headers['Authorization'] = 'Bearer ' + await decrypt(site.bearerTokenEnc)
    if (site.authType === 'app_password' && site.appPasswordEnc && site.username) {
      const cred = await decrypt(site.appPasswordEnc)
      headers['Authorization'] = 'Basic ' + Buffer.from(`${site.username}:${cred}`).toString('base64')
    }
    const url = new URL('/wp-json/ns-monitor/v1/status', site.url).toString()
    // lightweight fetch without importing full core helper to avoid ESM issues here
    const res = await fetch(url, { headers, cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: any = await res.json()
    const check = await prisma.check.create({ data: { siteId: site.id, ok: true, startedAt: new Date(), finishedAt: new Date() } })
    await prisma.coreStatus.create({
      data: {
        checkId: check.id,
        currentVersion: data.core.currentVersion,
        latestVersion: data.core.latestVersion,
        updateAvailable: data.core.updateAvailable,
        security: data.core.security,
      }
    })
    await prisma.$transaction((data.plugins || []).map((p: any) => prisma.pluginStatus.create({
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
    const hasAnyUpdate = data.core.updateAvailable || (data.plugins || []).some((p: any) => p.updateAvailable)
    const hasSecurityUpdate = data.core.security || (data.plugins || []).some((p: any) => p.security)
    const hasChangelog = data.core.updateAvailable || (data.plugins || []).some((p: any) => p.hasChangelog)
    await prisma.site.update({ where: { id: site.id }, data: {
      lastCheckedAt: new Date(),
      status: 'ok',
      hasAnyUpdate,
      hasSecurityUpdate,
      hasChangelog
    }})
  } catch (e) {
    await prisma.logEntry.create({ data: { siteId: site.id, level: 'warn', message: 'Refresh failed', payload: { error: (e as any)?.message || String(e) } } })
    await prisma.site.update({ where: { id: site.id }, data: { lastCheckedAt: new Date(), status: 'unreachable' } })
  }
}

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
  if (!process.env.REDIS_URL || process.env.DISABLE_QUEUE === 'true') {
    await refreshStatusForSite(site)
    return NextResponse.json({ ok: true, queued: false })
  } else {
    const connection = new IORedis(process.env.REDIS_URL)
    const queue = new Queue('site-checks', { connection })
    await queue.add('checkSite', { siteId }, { removeOnComplete: true, removeOnFail: true })
    await queue.close()
    await connection.quit()
    return NextResponse.json({ ok: true, queued: true })
  }
}
