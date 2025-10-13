"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { trpc } from '@/lib/trpc'

export default function AppHeader() {
  const pathname = usePathname()
  const { data } = useSession()

  const userEmail = data?.user?.email as string | undefined
  const { data: me } = trpc.accounts.me.useQuery(undefined, { enabled: !!userEmail })
  const { data: roleInfo } = trpc.accounts.membership.me.useQuery(undefined, { enabled: !!userEmail })
  const { data: imp } = trpc.accounts.impersonation.status.useQuery(undefined, { enabled: !!userEmail })

  return (
    <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-screen-2xl px-4 py-3 flex items-center gap-3">
        <Link href="/sites" className="font-semibold text-sm md:text-base inline-flex items-center gap-2">
          WP Update Monitor
          {imp?.active && (
            <span className="text-[10px] uppercase tracking-wide bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">Impersonating</span>
          )}
        </Link>
        <nav className="ml-6 hidden md:flex items-center gap-4 text-sm">
          <Link href="/pricing" className={"hover:underline" + (pathname === '/pricing' ? ' underline' : '')}>Pricing</Link>
          {roleInfo?.role && (roleInfo.role === 'owner' || roleInfo.role === 'admin') && (
            <Link href="/members" className={"hover:underline" + (pathname === '/members' ? ' underline' : '')}>Add Members</Link>
          )}
          {userEmail && (
            <Link href="/account/password" className={"hover:underline" + (pathname === '/account/password' ? ' underline' : '')}>Account</Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {userEmail && (
            <span className="hidden sm:inline text-xs text-zinc-600 dark:text-zinc-300">
              {userEmail}
            </span>
          )}
          {/* Trial countdown */}
          {/* This component is client-side; fetch minimal account data via TRPC in header provider */}
          <TrialBadge />
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
      {imp?.active && (
        <div className="bg-amber-100 text-amber-900 border-t border-amber-200">
          <div className="mx-auto max-w-screen-2xl px-4 py-2 text-sm flex items-center gap-3">
            <span>Impersonating account: <b>{imp.accountName || imp.accountId}</b></span>
            <Link href="/sites" className="underline">Go to Sites</Link>
            <button className="ml-auto border rounded px-2 py-0.5" onClick={async ()=> { await fetch('/api/admin/impersonate/stop', { method: 'POST' }); location.reload() }}>Stop</button>
          </div>
        </div>
      )}
    </div>
  )
}

function TrialBadge() {
  const { trpc } = require('@/lib/trpc')
  const { data: account } = trpc.accounts.me.useQuery(undefined, { staleTime: 60_000 })
  if (!account || !account.trialEndsAt) return null
  const end = new Date(account.trialEndsAt as any).getTime()
  const now = Date.now()
  const days = Math.max(0, Math.ceil((end - now) / (1000*60*60*24)))
  return <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Trial: {days}d left</span>
}
