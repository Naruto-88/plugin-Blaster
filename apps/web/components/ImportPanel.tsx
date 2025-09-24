"use client"
import { useRef, useState } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'

type ParsedSite = {
  name: string
  url: string
  authType: 'app_password' | 'bearer_token'
  username?: string
  credential?: string
  tags?: string[]
}

export default function ImportPanel({ onDone }: { onDone?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedSite[]>([])
  const bulkCreate = trpc.sites.bulkCreate.useMutation({
    onSuccess: (res) => {
      toast.success(`Imported ${res.results.filter(r=>r.created).length} site(s)`) 
      onDone?.()
    },
    onError: (e) => toast.error(e.message)
  })

  const parse = async (file: File) => {
    const text = await file.text()
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    let out: ParsedSite[] = []
    if (file.name.endsWith('.csv')) {
      const [header, ...rest] = lines
      const cols = header.split(',').map(c=>c.trim().toLowerCase())
      for (const line of rest) {
        const parts = line.split(',')
        const rec: any = {}
        cols.forEach((c, i) => rec[c] = (parts[i]||'').trim())
        if (!rec.name || !rec.url) continue
        out.push({
          name: rec.name,
          url: rec.url,
          authType: (rec.authtype === 'app_password' ? 'app_password' : 'bearer_token'),
          username: rec.username || undefined,
          credential: rec.credential || undefined,
          tags: (rec.tags ? String(rec.tags).split('|').map((t:string)=>t.trim()).filter(Boolean) : [])
        })
      }
    } else {
      // TXT: name url [authType] [username] [credential] [tags|tags]
      for (const line of lines) {
        const parts = line.split(/[\s,]+/).filter(Boolean)
        if (parts.length < 2) continue
        const [name, url, authTypeRaw, username, ...rest] = parts
        const authType = authTypeRaw === 'app_password' ? 'app_password' : 'bearer_token'
        const credential = rest.length ? rest.join(' ') : undefined
        out.push({ name, url, authType, username, credential, tags: [] })
      }
    }
    setRows(out)
  }

  const onImport = async () => {
    if (!rows.length) return toast.error('No rows parsed')
    const p = bulkCreate.mutateAsync({ sites: rows })
    toast.promise(p, { loading: 'Importing...', success: 'Import complete', error: 'Import failed' })
  }

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept=".csv,.txt" onChange={(e)=>{ const f = e.target.files?.[0]; if (f) parse(f) }} />
      <div className="text-xs text-zinc-500">CSV columns: name,url,authType,username,credential,tags (tags separated by |). See sample.</div>
      <div className="max-h-56 overflow-auto border rounded-md p-2 text-sm">
        {rows.length ? rows.slice(0,20).map((r,i)=>(
          <div key={i} className="grid grid-cols-5 gap-2">
            <div className="truncate">{r.name}</div>
            <div className="truncate col-span-2">{r.url}</div>
            <div className="truncate">{r.authType}</div>
            <div className="truncate">{r.tags?.join(', ')}</div>
          </div>
        )) : <div className="text-zinc-500">No rows parsed</div>}
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded border px-3 py-1" onClick={onImport} disabled={!rows.length || bulkCreate.isPending}>{bulkCreate.isPending ? 'Importing...' : 'Import'}</button>
        <a className="text-xs underline" href="/sample-sites.csv" download>Download sample CSV</a>
      </div>
    </div>
  )
}

