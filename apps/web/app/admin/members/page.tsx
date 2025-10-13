"use client"
import { trpc } from '@/lib/trpc'
import { useEffect, useState } from 'react'

export default function MembersPage() {
  const { data: accounts } = trpc.accounts.list.useQuery()
  const [accountId, setAccountId] = useState<string>('')
  useEffect(() => { if (!accountId && accounts?.length) setAccountId(accounts[0].id) }, [accounts, accountId])
  const { data: members, refetch, isLoading } = trpc.accounts.members.list.useQuery({ accountId }, { enabled: !!accountId })
  const add = trpc.accounts.members.add.useMutation({ onSuccess: () => refetch() })
  const remove = trpc.accounts.members.remove.useMutation({ onSuccess: () => refetch() })
  const setRoleMut = trpc.accounts.members.setRole.useMutation({ onSuccess: () => refetch() })
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'owner'|'admin'|'member'>('member')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmUser, setConfirmUser] = useState<null | { id: string; email: string }>(null)
  const [removing, setRemoving] = useState(false)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Members</h1>
      <div className="flex items-center gap-2">
        <div>
          <label className="block text-sm">Account</label>
          <select className="border px-2 py-1 rounded bg-white text-gray-900" value={accountId} onChange={e=> setAccountId(e.target.value)}>
            {accounts?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-sm">Email</label>
          <input className="border px-2 py-1 rounded bg-white text-gray-900" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Role</label>
          <select className="border px-2 py-1 rounded bg-white text-gray-900" value={role} onChange={e=>setRole(e.target.value as any)}>
            <option value="member">member</option>
            <option value="admin">admin</option>
            <option value="owner">owner</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" className="border px-2 py-1 rounded bg-white text-gray-900" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Confirm</label>
          <input type="password" className="border px-2 py-1 rounded bg-white text-gray-900" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        </div>
        <button className="bg-black text-white px-3 py-1 rounded" onClick={async ()=> {
          setError(null)
          try {
            if (!accountId) throw new Error('Select an account first')
            if (password.length < 6) throw new Error('Password too short (min 6)')
            if (password !== confirm) throw new Error('Passwords do not match')
            await add.mutateAsync({ accountId, email, role, password })
            setEmail('')
            setPassword('')
            setConfirm('')
          } catch (e: any) {
            const raw = e?.message || ''
            const msg = raw.includes('SEAT_LIMIT_REACHED')
              ? 'Seat limit reached. Increase seats in Accounts or upgrade plan in Billing.'
              : (raw || 'Failed')
            setError(msg)
          }
        }}>Add Member</button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <table className="min-w-full border">
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
              <td className="p-2 border">
                <select
                  className="border px-2 py-1 rounded bg-white text-gray-900"
                  value={m.role}
                  onChange={e=> setRoleMut.mutate({ accountId, userId: m.user.id, role: e.target.value as any })}
                >
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                  <option value="owner">owner</option>
                </select>
              </td>
              <td className="p-2 border">
                <div className="flex gap-3">
                  <PasswordModalTrigger userId={m.user.id} />
                  <button className="text-red-600 disabled:text-zinc-400 disabled:cursor-not-allowed" disabled={m.role === 'owner'} onClick={()=> setConfirmUser({ id: m.user.id, email: m.user.email })}>Remove</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {confirmUser && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
          <div className="bg-white text-gray-900 rounded-lg shadow-lg w-full max-w-sm p-4">
            <div className="text-lg font-semibold mb-2">Remove member</div>
            <div className="text-sm text-zinc-700">Remove <b>{confirmUser.email}</b> from this account?</div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="border rounded px-3 py-1" onClick={()=> setConfirmUser(null)}>Cancel</button>
              <button className="bg-black text-white rounded px-3 py-1 disabled:opacity-50" disabled={removing} onClick={async ()=> { try { setRemoving(true); await remove.mutateAsync({ accountId, userId: confirmUser.id }); setConfirmUser(null) } finally { setRemoving(false) } }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PasswordModalTrigger({ userId }: { userId: string }) {
  const reset = trpc.accounts.users.resetPassword.useMutation()
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState<string | null>(null)
  return (
    <>
      <button className="text-blue-600" onClick={()=> { setPw(''); setPw2(''); setErr(null); setOpen(true) }}>Reset Password</button>
      {open && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
          <div className="bg-white text-gray-900 rounded-lg shadow-lg w-full max-w-sm p-4">
            <div className="text-lg font-semibold mb-2">Reset Password</div>
            {err && <div className="text-sm text-red-600 mb-2">{err}</div>}
            <div className="grid gap-2">
              <label className="text-sm">New password</label>
              <input type="password" className="border rounded px-2 py-1 bg-white text-gray-900" value={pw} onChange={e=> setPw(e.target.value)} />
              <label className="text-sm">Confirm password</label>
              <input type="password" className="border rounded px-2 py-1 bg-white text-gray-900" value={pw2} onChange={e=> setPw2(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="border rounded px-3 py-1" onClick={()=> setOpen(false)}>Cancel</button>
              <button className="bg-black text-white rounded px-3 py-1" onClick={async ()=> {
                setErr(null)
                if (pw.length < 6) { setErr('Password too short (min 6)'); return }
                if (pw !== pw2) { setErr('Passwords do not match'); return }
                await reset.mutateAsync({ userId, newPassword: pw })
                setOpen(false)
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
