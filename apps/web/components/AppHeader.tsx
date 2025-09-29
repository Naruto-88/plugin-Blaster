"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function AppHeader() {
  const pathname = usePathname()
  const { data } = useSession()

  // Hide header on auth pages like login
  if (pathname === '/login') return null

  const userEmail = data?.user?.email as string | undefined

  return (
    <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-screen-2xl px-4 py-3 flex items-center gap-3">
        <Link href="/sites" className="font-semibold text-sm md:text-base">
          WP Update Monitor
        </Link>
        <div className="ml-auto flex items-center gap-3">
          {userEmail && (
            <span className="hidden sm:inline text-xs text-zinc-600 dark:text-zinc-300">
              {userEmail}
            </span>
          )}
          <Button
            variant="outline"
            className="text-xs md:text-sm inline-flex items-center gap-2"
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}

