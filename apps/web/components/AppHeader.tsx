"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut, Globe } from 'lucide-react'
import { trpc } from '@/lib/trpc'

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`text-sm font-medium transition-colors hover:text-zinc-900 dark:hover:text-white ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
    >
      {children}
    </Link>
  )
}

export default function AppHeader() {
  const pathname = usePathname()
  const { data } = useSession()

  const userEmail = data?.user?.email as string | undefined
  const { data: me } = trpc.accounts.me.useQuery(undefined, { enabled: !!userEmail })
  const { data: roleInfo } = trpc.accounts.membership.me.useQuery(undefined, { enabled: !!userEmail })
  const { data: imp } = trpc.accounts.impersonation.status.useQuery(undefined, { enabled: !!userEmail })

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="mx-auto max-w-screen-2xl px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/sites" className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2">
            <Globe className="w-5 h-5 text-zinc-900 dark:text-white" />
            <span className="gradient-text">WP Update Monitor</span>
            {imp?.active && (
              <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500 text-white px-2 py-0.5 rounded-full">Impersonating</span>
            )}
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6">
            <NavLink href="/pricing" active={pathname === '/pricing'}>Pricing</NavLink>
            {roleInfo?.role && (roleInfo.role === 'owner' || roleInfo.role === 'admin') && (
              <NavLink href="/members" active={pathname === '/members'}>Team</NavLink>
            )}
            {userEmail && (
              <NavLink href="/account/password" active={pathname === '/account/password'}>Account</NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {userEmail && (
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-xs font-semibold">{userEmail}</span>
              <TrialBadge />
            </div>
          )}
          
          <Button
            variant="ghost"
            className="rounded-full px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm font-medium"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
      {imp?.active && (
        <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-t border-amber-200/50">
          <div className="mx-auto max-max-w-screen-2xl px-6 py-2 text-xs font-medium flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Viewing as: <b className="font-bold">{imp.accountName || imp.accountId}</b>
            </span>
            <Link href="/sites" className="underline hover:no-underline">Go to Sites</Link>
            <button 
              className="ml-auto bg-amber-200 dark:bg-amber-900/50 hover:bg-amber-300 dark:hover:bg-amber-800 transition-colors rounded-full px-3 py-1 border border-amber-300/50" 
              onClick={async ()=> { await fetch('/api/admin/impersonate/stop', { method: 'POST' }); location.reload() }}
            >
              Stop Impersonation
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

function TrialBadge() {
  const { trpc } = require('@/lib/trpc')
  const { data: account } = trpc.accounts.me.useQuery(undefined, { staleTime: 60_000 })
  if (!account || !account.trialEndsAt) return null
  const end = new Date(account.trialEndsAt as any).getTime()
  const now = Date.now()
  const days = Math.max(0, Math.ceil((end - now) / (1000*60*60*24)))
  return (
    <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
      Trial: {days}d left
    </span>
  )
}
