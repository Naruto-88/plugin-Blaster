import { prisma } from '@nsm/db'

export async function GET() {
  const sites = await prisma.site.findMany({})
  const rows = [
    ['name','url','status','lastCheckedAt','hasAnyUpdate','hasSecurityUpdate','hasChangelog'],
    ...sites.map(s => [s.name, s.url, s.status, s.lastCheckedAt?.toISOString() || '', String(s.hasAnyUpdate), String(s.hasSecurityUpdate), String(s.hasChangelog)])
  ]
  const csv = rows.map(r => r.map(v => `"${(v??'').toString().replaceAll('"','""')}"`).join(',')).join('\n')
  return new Response(csv, { headers: { 'content-type': 'text/csv' } })
}

