"use client"
import { useState } from 'react'
import { trpc } from '@/lib/trpc'

export default function ChangePasswordPage() {
  const change = trpc.self.changePassword.useMutation()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<string|undefined>()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(undefined)
    if (newPassword !== confirm) {
      setMessage('Passwords do not match')
      return
    }
    try {
      await change.mutateAsync({ oldPassword, newPassword })
      setOldPassword(''); setNewPassword(''); setConfirm('')
      setMessage('Password updated')
    } catch (e: any) {
      setMessage(e?.message || 'Failed to update password')
    }
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-semibold mb-4">Change Password</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-white p-4 rounded border">
        <div>
          <label className="block text-sm mb-1">Current password</label>
          <input type="password" className="border px-2 py-1 rounded w-full bg-white text-gray-900" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">New password</label>
          <input type="password" className="border px-2 py-1 rounded w-full bg-white text-gray-900" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Confirm new password</label>
          <input type="password" className="border px-2 py-1 rounded w-full bg-white text-gray-900" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
        </div>
        <button type="submit" className="bg-black text-white px-4 py-2 rounded" disabled={change.isLoading}>Update Password</button>
        {message && <div className="text-sm mt-2">{message}</div>}
      </form>
    </div>
  )
}

