import { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin/Sidebar'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  const role = (session as any)?.user?.role
  if (!session || role !== 'admin') {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Forbidden</h1>
          <p className="text-gray-600">You must be a super admin to access this area.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      <AdminSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
