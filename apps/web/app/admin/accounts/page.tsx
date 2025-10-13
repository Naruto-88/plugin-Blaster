"use client"
import { trpc } from '@/lib/trpc'
import { useState } from 'react'
import clsx from 'clsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function AccountsAdminPage() {
  const { data: accounts, refetch, isLoading } = trpc.accounts.list.useQuery()
  const update = trpc.accounts.update.useMutation({ onSuccess: () => refetch() })
  const setPlan = trpc.accounts.setPlan.useMutation({ onSuccess: () => refetch() })
  const del = trpc.accounts.delete.useMutation({ onSuccess: () => refetch() })
  async function impersonate(accountId: string) {
    await fetch('/api/admin/impersonate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accountId }) })
    location.reload()
  }
  async function stopImpersonate() {
    await fetch('/api/admin/impersonate/stop', { method: 'POST' })
    location.reload()
  }

  if (isLoading) return <div className="p-6">Loading accounts…</div>
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Accounts</h1>
      <p className="text-sm text-gray-600">Manage client accounts: set plan, edit usage limits, seats, and impersonate to view the app as that client.</p>
      <div className="flex gap-2">
        <button className="border rounded px-3 py-1" onClick={stopImpersonate}>Stop Impersonating</button>
      </div>
      <div className="space-y-4">
        {accounts?.map((a) => (
          <AccountRow
            key={a.id}
            acc={a as any}
            onSave={(data)=>update.mutate({ id: a.id, ...data })}
            onApplyPlan={(plan)=> setPlan.mutate({ id: a.id, plan })}
            onImpersonate={()=> impersonate(a.id)}
            onDelete={async ()=> { await del.mutateAsync({ id: a.id }) }}
          />
        ))}
      </div>
    </div>
  )
}

function AccountRow({ acc, onSave, onApplyPlan, onImpersonate, onDelete }: { acc: any; onSave: (data: any)=>void; onApplyPlan: (plan: 'free'|'starter'|'pro'|'enterprise')=>void; onImpersonate: ()=>void; onDelete: ()=>Promise<void> }) {
  const [name, setName] = useState(acc.name)
  const [plan, setPlan] = useState(acc.plan as string)
  const [maxSites, setMaxSites] = useState(acc.maxSites as number)
  const [checksPerDay, setChecksPerDay] = useState(acc.checksPerDay as number)
  const [retentionDays, setRetentionDays] = useState(acc.retentionDays as number)
  const [seatsMax, setSeatsMax] = useState(acc.seatsMax as number)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [fading, setFading] = useState(false)
  return (
    <div className={clsx("border rounded p-4 flex flex-col gap-2 transition-all duration-300", fading && "opacity-0 scale-95")}>
      <div className="flex items-center justify-between">
        <div className="font-medium text-lg">{acc.name}</div>
        <div className="text-sm text-gray-500">Sites: {acc._count?.sites ?? 0} · Members: {acc._count?.members ?? 0}</div>
      </div>
      <div className="text-xs text-gray-500">Account ID: <code className="select-all">{acc.id}</code></div>
      <label className="flex gap-2 items-center">Name <input className="border px-2 py-1 rounded flex-1 bg-white text-gray-900" value={name} onChange={e=>setName(e.target.value)} /></label>
      <div className="grid grid-cols-5 gap-4">
        <label className="flex gap-2 items-center">Plan
          <select className="border px-2 py-1 rounded bg-white text-gray-900" value={plan} onChange={e=>setPlan(e.target.value)}>
            {['free','starter','pro','enterprise'].map(p=> <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="flex gap-2 items-center">Max Sites <input type="number" className="border px-2 py-1 rounded w-28 bg-white text-gray-900" value={maxSites} onChange={e=>setMaxSites(parseInt(e.target.value||'0'))} /></label>
        <label className="flex gap-2 items-center">Checks/Day <input type="number" className="border px-2 py-1 rounded w-28 bg-white text-gray-900" value={checksPerDay} onChange={e=>setChecksPerDay(parseInt(e.target.value||'0'))} /></label>
        <label className="flex gap-2 items-center">Retention (days) <input type="number" className="border px-2 py-1 rounded w-28 bg-white text-gray-900" value={retentionDays} onChange={e=>setRetentionDays(parseInt(e.target.value||'0'))} /></label>
        <label className="flex gap-2 items-center">Seats <input type="number" className="border px-2 py-1 rounded w-28 bg-white text-gray-900" value={seatsMax} onChange={e=>setSeatsMax(parseInt(e.target.value||'0'))} /></label>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button className="bg-black text-white px-3 py-1 rounded" onClick={()=> onSave({ name, plan, maxSites, checksPerDay, retentionDays, seatsMax })}>Save</button>
        <button className="bg-gray-800 text-white px-3 py-1 rounded" onClick={()=> onApplyPlan(plan as any)}>Apply Plan Defaults</button>
        <button className="border px-3 py-1 rounded" onClick={onImpersonate}>Impersonate</button>
        <a className="border px-3 py-1 rounded" href="/sites">Go to Sites</a>
        <button className="border border-red-600 text-red-700 px-3 py-1 rounded ml-auto" onClick={()=> setConfirmOpen(true)}>Delete Account</button>
      </div>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-zinc-700">
            Delete account <b>{acc.name}</b> and all its data? This cannot be undone.
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={()=> setConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleting} onClick={async ()=> {
              try {
                setDeleting(true)
                setFading(true)
                setTimeout(async () => { await onDelete() }, 250)
                setConfirmOpen(false)
              } finally {
                setDeleting(false)
              }
            }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


