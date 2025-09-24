import { prisma } from '@nsm/db'
import { notFound } from 'next/navigation'
import SiteDetailClient from './site-client'

export default async function SiteDetailPage({ params }: { params: { id: string } }) {
  const site = await prisma.site.findUnique({ where: { id: params.id } })
  if (!site) return notFound()
  return <SiteDetailClient siteId={site.id} initialName={site.name} initialUrl={site.url} />
}

