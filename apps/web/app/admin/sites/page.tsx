"use client"
import { trpc } from '@/lib/trpc'
import { useEffect, useState } from 'react'

export default function AdminSitesPage() {
  const { data: accounts } = trpc.accounts.list.useQuery()
  const [accountId, setAccountId] = useState<string>('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 50
  useEffect(() => { if (!accountId && accounts?.length) setAccountId('') }, [accounts])

  const { data, isLoading, refetch } = trpc.accounts.sites.list.useQuery({ accountId: accountId || undefined, q, page, pageSize })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">All Sites</h1>
      <div className="flex items-end gap-3">
        <div>
          <label className="block text-sm">Account</label>
          <select className="border rounded px-2 py-1 bg-white text-gray-900" value={accountId} onChange={e=> { setAccountId(e.target.value); setPage(1); }}>
            <option value="">All accounts</option>
            {accounts?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm">Search</label>
          <input className="border rounded px-2 py-1 bg-white text-gray-900" value={q} onChange={e=> { setQ(e.target.value); setPage(1); }} placeholder="name or url" />
        </div>
      </div>
      <div className="border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">Name</th>
              <th className="text-left p-2 border">URL</th>
              <th className="text-left p-2 border">Status</th>
              <th className="text-left p-2 border">Account</th>
              <th className="text-left p-2 border">Last Check</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((s:any)=> (
              <tr key={s.id}>
                <td className="p-2 border">{s.name}</td>
                <td className="p-2 border"><a className="text-blue-600 underline" href={s.url} target="_blank" rel="noreferrer">{s.url}</a></td>
                <td className="p-2 border">{s.status}</td>
                <td className="p-2 border">{s.account?.name}</td>
                <td className="p-2 border">{s.lastCheckedAt ? new Date(s.lastCheckedAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2">
        <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1, p-1))} className="border rounded px-3 py-1">Prev</button>
        <div>Page {page}</div>
        <button disabled={(data?.items?.length||0) < pageSize} onClick={()=> setPage(p=> p+1)} className="border rounded px-3 py-1">Next</button>
      </div>
    </div>
  )
}

