"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Item = { name: string; href: string }

const NAV_ITEMS: Item[] = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Accounts', href: '/admin/accounts' },
  { name: 'Members', href: '/admin/members' },
  { name: 'Sites', href: '/sites' },
  { name: 'Settings', href: '/settings/ui' },
  { name: 'Billing', href: '/settings/billing' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-white text-gray-900 border-r border-zinc-200">
      <div className="px-4 py-4 font-semibold text-lg">Admin</div>
      <nav className="px-2 pb-4">
        {NAV_ITEMS.map((it) => {
          const active = pathname === it.href || (it.href !== '/admin' && pathname?.startsWith(it.href))
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                'block rounded px-3 py-2 text-sm mb-1 ' +
                (active ? 'bg-zinc-100 text-black font-medium' : 'hover:bg-zinc-50')
              }
            >
              {it.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

