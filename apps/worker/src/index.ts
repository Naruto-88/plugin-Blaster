import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: '../../.env' })
import { Worker, Queue, JobsOptions } from 'bullmq'
import { fetchJson, WpSnapshot, decrypt } from '@nsm/core'
import { prisma } from '@nsm/db'
import cron from 'node-cron'

const connection = { url: process.env.REDIS_URL! }

const queueName = 'site-checks'

const queue = new Queue(queueName, { connection })

type JobData = { siteId: string } | { all: true }

function jobOpts(): JobsOptions {
  return { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 100, removeOnFail: 200 }
}

async function checkSite(siteId: string) {
  const site = await prisma.site.findUnique({ where: { id: siteId } })
  if (!site) throw new Error('Site not found')

  const start = new Date()
  let ok = false
  let errorText: string | undefined
  let core: WpSnapshot['core'] | null = null
  let plugins: WpSnapshot['plugins'] = []

  try {
    const headers: Record<string, string> = {}
    if (site.authType === 'bearer_token' && site.bearerTokenEnc) {
      const token = await decrypt(site.bearerTokenEnc)
      headers['Authorization'] = `Bearer ${token}`
    }
    if (site.authType === 'app_password' && site.username && site.appPasswordEnc) {
      const pw = await decrypt(site.appPasswordEnc)
      headers['Authorization'] = 'Basic ' + Buffer.from(`${site.username}:${pw}`).toString('base64')
    }
    const url = new URL('/wp-json/ns-monitor/v1/status', site.url).toString()
    const data = await fetchJson<WpSnapshot>(url, { headers, timeoutMs: 9000 })
    core = data.core
    plugins = data.plugins
    ok = true
  } catch (err: any) {
    errorText = err?.message || 'Unknown error'
  }

  const check = await prisma.check.create({ data: { siteId, startedAt: start, finishedAt: new Date(), ok, errorText } })

  if (ok && core) {
    await prisma.coreStatus.create({ data: { checkId: check.id, ...core } })
    if (plugins.length) {
      await prisma.$transaction(plugins.map(p => prisma.pluginStatus.create({ data: { checkId: check.id, ...p } })))
    }
  }

  const hasAnyUpdate = !!core?.updateAvailable || plugins.some(p => p.updateAvailable)
  const hasSecurityUpdate = !!core?.security || plugins.some(p => p.security)
  const hasChangelog = !!plugins.some(p => p.hasChangelog)

  await prisma.site.update({ where: { id: siteId }, data: {
    lastCheckedAt: new Date(),
    status: ok ? 'ok' : (errorText?.includes('401') ? 'auth_failed' : 'unreachable'),
    hasAnyUpdate,
    hasSecurityUpdate,
    hasChangelog
  }})

  // Log when updates differ from last known
  const lastCheck = await prisma.check.findFirst({ where: { siteId }, orderBy: { startedAt: 'desc' }, skip: 1, take: 1, include: { core: true, plugins: true } })
  const diff = JSON.stringify({ core, plugins }) !== JSON.stringify({ core: lastCheck?.core || null, plugins: lastCheck?.plugins || [] })
  if (diff) {
    await prisma.logEntry.create({ data: { siteId, level: 'info', message: 'Update snapshot changed', payload: { core, plugins } as any } })
  }
}

new Worker<JobData>(queueName, async job => {
  const data = job.data
  if ('all' in data) {
    const sites = await prisma.site.findMany()
    for (const s of sites) {
      await queue.add('checkSite', { siteId: s.id }, jobOpts())
    }
    return { enqueued: sites.length }
  }
  await checkSite(data.siteId)
}, { connection, concurrency: 5 })

// Default schedule every 6h
cron.schedule('0 */6 * * *', async () => {
  await queue.add('kick', { all: true }, jobOpts())
})

console.log('Worker up. Queue:', queueName)
