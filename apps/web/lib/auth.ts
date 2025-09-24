import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export async function requireRole(role: 'admin'|'viewer') {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const userRole = (session.user as any)?.role as ('admin'|'viewer'|undefined)
  if (role === 'admin' && userRole !== 'admin') redirect('/forbidden')
  return session
}
