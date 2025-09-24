import { prisma } from '@nsm/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const idsParam = searchParams.get('ids')
  if (!idsParam) return new Response('ids required', { status: 400 })
  const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean)
  if (!ids.length) return new Response('no ids', { status: 400 })
  const sites = await prisma.site.findMany({ where: { id: { in: ids } } })
  const rows = [
    ['name','url','status','lastCheckedAt','hasAnyUpdate','hasSecurityUpdate','hasChangelog','tags'],
    ...sites.map(s => [s.name, s.url, s.status, s.lastCheckedAt?.toISOString() || '', String(s.hasAnyUpdate), String(s.hasSecurityUpdate), String(s.hasChangelog), (s.tags||[]).join('|')])
  ]
  const csv = rows.map(r => r.map(v => `"${(v??'').toString().replaceAll('"','""')}"`).join(',')).join('\n')
  return new Response(csv, { headers: { 'content-type': 'text/csv' } })
}

