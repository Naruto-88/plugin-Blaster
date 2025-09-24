import { requireRole } from '@/lib/auth'
import SettingsUI from './ui'

export default async function SettingsPage() {
  await requireRole('admin')
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <SettingsUI />
    </div>
  )
}
