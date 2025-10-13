"use client"
import { trpc } from '@/lib/trpc'
import { useState } from 'react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function MembersSelfPage() {
  const { data: members, refetch } = trpc.members.list.useQuery()
  const { data: me } = trpc.accounts.membership.me.useQuery()
  const { data: account } = trpc.accounts.me.useQuery()
  const { data: stats } = trpc.accounts.stats.me.useQuery()
  const add = trpc.members.add.useMutation({ onSuccess: () => refetch() })
  const remove = trpc.members.remove.useMutation({ onSuccess: () => refetch() })
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'owner'|'admin'|'member'>('member')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const canManage = me?.role === 'owner' || me?.role === 'admin'
  const canAdd = canManage || !!account?.canMembersInvite
  const seatsUsed = stats?.seatsUsed ?? 0
  const seatsMax = stats?.seatsMax ?? 0
  const capReached = seatsMax > 0 && seatsUsed >= seatsMax
  const [confirmUser, setConfirmUser] = useState<null | { id: string; email: string }>(null)
  const [removing, setRemoving] = useState(false)

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Add Members</h1>
      <p className="text-sm text-zinc-600">Add teammates to your account. Admins and Owners can assign roles; others may add members if allowed by account settings.</p>
      <div className="text-sm text-zinc-700">
        Seats: <b>{seatsUsed}</b> / <b>{seatsMax || '—'}</b> {seatsMax ? (capReached ? '• No seats remaining' : `• ${Math.max(0, seatsMax - seatsUsed)} left`) : ''}
      </div>
      {capReached && (
        <div className="rounded border border-amber-200 bg-amber-50 text-amber-900 p-3 text-sm flex items-center justify-between">
          <span>Seat limit reached. Upgrade your plan to add more members.</span>
          <Link href="/settings/billing" className="px-3 py-1 rounded bg-amber-900 text-amber-50">Upgrade plan</Link>
        </div>
      )}
      {canAdd && (
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-sm">Email</label>
          <input className="border px-2 py-1 rounded bg-white text-gray-900" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        {canManage && (
          <div>
            <label className="block text-sm">Role</label>
            <select className="border px-2 py-1 rounded bg-white text-gray-900" value={role} onChange={e=>setRole(e.target.value as any)}>
              <option value="member">member</option>
              <option value="admin">admin</option>
              <option value="owner">owner</option>
            </select>
          </div>
        )}
        {canManage && (
          <div>
            <label className="block text-sm">Password</label>
            <input type="password" className="border px-2 py-1 rounded bg-white text-gray-900" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
        )}
        {canManage && (
          <div>
            <label className="block text-sm">Confirm</label>
            <input type="password" className="border px-2 py-1 rounded bg-white text-gray-900" value={confirm} onChange={e=>setConfirm(e.target.value)} />
          </div>
        )}
        <button className="bg-black text-white px-3 py-1 rounded disabled:opacity-50" disabled={capReached} onClick={async ()=> {
          try {
            if (canManage) {
              if (password.length < 6) throw new Error('Password too short (min 6)')
              if (password !== confirm) throw new Error('Passwords do not match')
            }
            await add.mutateAsync({ email, role: canManage ? role : 'member', password: canManage ? password : undefined })
            setEmail('')
            setPassword('')
            setConfirm('')
          } catch (e: any) {
            const raw = e?.message || ''
            if (raw.includes('SEAT_LIMIT_REACHED')) {
              toast.error('Seat limit reached', {
                description: 'Your plan has no more seats. Upgrade to add more people.',
                action: { label: 'Upgrade plan', onClick: () => { window.location.href = '/settings/billing' } }
              })
            } else if (raw.includes('PASSWORD_REQUIRED')) {
              toast.error('Password required', { description: 'Owners and admins must set a password for new members.' })
            } else {
              toast.error('Could not add member', { description: raw || 'Unknown error' })
            }
          }
        }}>Add</button>
      </div>
      )}
      {!canAdd && (
        <div className="text-sm text-zinc-600">Only Admins and Owners can add members.</div>
      )}
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2 border">User</th>
            <th className="text-left p-2 border">Role</th>
            <th className="text-left p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members?.map((m:any)=> (
            <tr key={m.id}>
              <td className="p-2 border">{m.user.email}</td>
              <td className="p-2 border">{m.role}</td>
              <td className="p-2 border">
                <button
                  className="text-red-600 disabled:text-zinc-400 disabled:cursor-not-allowed"
                  disabled={m.role === 'owner'}
                  onClick={()=> setConfirmUser({ id: m.user.id, email: m.user.email })}
                >Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {confirmUser && (
        <Dialog open={!!confirmUser} onOpenChange={(o)=> { if (!o) setConfirmUser(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove member</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-zinc-700">Remove <b>{confirmUser.email}</b> from this account?</div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={()=> setConfirmUser(null)}>Cancel</Button>
              <Button variant="destructive" disabled={removing} onClick={async ()=> {
                try { setRemoving(true); await remove.mutateAsync({ userId: confirmUser.id }); setConfirmUser(null) } finally { setRemoving(false) }
              }}>Remove</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
