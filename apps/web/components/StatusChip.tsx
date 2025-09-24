import { Badge } from './ui/badge'

export function StatusChip({ status }: { status: 'ok'|'unreachable'|'auth_failed'|'unknown' }) {
  const map: Record<string, { label: string; className: string }> = {
    ok: { label: 'OK', className: 'bg-emerald-500 text-white' },
    unreachable: { label: 'Unreachable', className: 'bg-red-500 text-white' },
    auth_failed: { label: 'Auth Failed', className: 'bg-red-600 text-white' },
    unknown: { label: 'Unknown', className: 'bg-zinc-400 text-white' },
  }
  const m = map[status]
  return <Badge className={m.className}>{m.label}</Badge>
}

