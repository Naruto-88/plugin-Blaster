import { prisma } from '@nsm/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const siteId = searchParams.get('siteId') || undefined
  const where = siteId ? { siteId } : {}
  const logs = await prisma.logEntry.findMany({ where, orderBy: { createdAt: 'desc' } })
  const rows = [
    ['siteId','createdAt','level','message','payload'],
    ...logs.map(l => [l.siteId, l.createdAt.toISOString(), l.level, l.message, JSON.stringify(l.payload)])
  ]
  const csv = rows.map(r => r.map(v => `"${(v??'').toString().replaceAll('"','""')}"`).join(',')).join('\n')
  return new Response(csv, { headers: { 'content-type': 'text/csv' } })
}

