"use client"
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  url: z.string().url(),
  authType: z.enum(['app_password','bearer_token']),
  username: z.string().optional(),
  credential: z.string().optional(),
  tags: z.array(z.string()).default([])
})

function TagChips({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (!v) return
    if (!value.includes(v)) onChange([...value, v])
    setInput('')
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 text-xs">
            {t}
            <button type="button" onClick={() => onChange(value.filter(x => x!==t))}>x</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter'){ e.preventDefault(); add() } }} className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2" placeholder="Add tag" />
        <button type="button" onClick={add} className="rounded-lg border px-3">Add</button>
      </div>
    </div>
  )
}

export default function SiteForm({ initial, onDone }: { initial?: Partial<z.infer<typeof schema>>; onDone?: () => void }) {
  const { register, handleSubmit, watch, setValue, getValues, formState: { isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? { name: '', url: '', authType: 'bearer_token', username: '', credential: '', tags: [] }
  })
  const tags = watch('tags')
  const authType = watch('authType')
  const utils = trpc.useUtils()
  const create = trpc.sites.create.useMutation({ onSuccess: async () => { await utils.sites.list.invalidate(); onDone?.() } })
  const update = trpc.sites.update.useMutation({ onSuccess: async () => { await utils.sites.list.invalidate(); onDone?.() } })
  const test = trpc.sites.testConnection.useMutation()

  const onSubmit = async (data: z.infer<typeof schema>) => {
    if (data.id) await update.mutateAsync(data as any)
    else await create.mutateAsync(data as any)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label className="text-sm">Name</Label>
        <Input className="mt-1 w-full" {...register('name')} />
      </div>
      <div>
        <Label className="text-sm">URL</Label>
        <Input className="mt-1 w-full" {...register('url')} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Auth Type</Label>
          <select className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2" {...register('authType')}>
            <option value="bearer_token">Bearer Token</option>
            <option value="app_password">Application Password</option>
          </select>
        </div>
        {authType==='app_password' && (
          <div>
            <Label className="text-sm">Username</Label>
            <Input className="mt-1 w-full" {...register('username')} />
          </div>
        )}
      </div>
      <div>
        <Label className="text-sm">{authType==='bearer_token' ? 'Bearer Token' : 'App Password'}</Label>
        <Input className="mt-1 w-full" {...register('credential')} />
      </div>
      <div>
        <Label className="text-sm">Tags</Label>
        <TagChips value={tags} onChange={(v) => setValue('tags', v)} />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (initial?.id ? 'Save Changes' : 'Create Site')}</Button>
        <Button variant="outline" type="button" onClick={async () => {
          const d = getValues() as any
          const p = test.mutateAsync({ url: d.url, authType: d.authType, username: d.username, credential: d.credential })
          toast.promise(p, { loading: 'Testing connection...', success: (r)=> r.ok ? `OK - ${r.plugins} plugins` : `Failed - ${r.error}`, error: 'Failed' })
        }}>Test Connection</Button>
        {test.isPending && <span className="text-sm text-zinc-500">Testing...</span>}
      </div>
    </form>
  )
}

